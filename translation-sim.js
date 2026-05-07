// ── Codon Table ──
const CODON_TABLE = [
  { codon: "AUG", anti: "UAC", aa: "Methionine", short: "Met", color: "#00c896", start: true },
  { codon: "UUU", anti: "AAA", aa: "Phenylalanine", short: "Phe", color: "#6c63ff" },
  { codon: "GAA", anti: "CUU", aa: "Glutamic acid", short: "Glu", color: "#ff6b6b" },
  { codon: "CCU", anti: "GGA", aa: "Proline", short: "Pro", color: "#ffd166" },
  { codon: "UGG", anti: "ACC", aa: "Tryptophan", short: "Trp", color: "#22d3ee" },
  { codon: "AAA", anti: "UUU", aa: "Lysine", short: "Lys", color: "#a78bfa" },
  { codon: "UAA", anti: "---", aa: "STOP", short: "●", color: "#ff4444", stop: true }
];

const MRNA = CODON_TABLE.map(c => c.codon);

// ── State ──
let state = {
  phase: "idle",          // idle | initiation | elongation | termination | done
  step: 0,
  ribosomeX: 0,
  ribosomeTargetX: 0,
  chain: [],
  tRNA: null,             // { codon, aa, color, y, targetY, opacity }
  peptideBond: false,
  animating: false,
  autoPlay: false,
  animFrame: null
};

let anim = { riboX: 0, tRNAY: 0, tRNAOpacity: 0 };

// ── Canvas ──
const canvas = document.getElementById("simCanvas");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;

// Layout constants
const MRNA_Y = H - 90;
const CODON_W = 72;
const MRNA_START_X = 60;
const RIBO_Y = MRNA_Y - 82;
const TRNA_FULL_Y = RIBO_Y - 130;
const TRNA_START_Y = 20;
const CHAIN_Y = 40;

// ── Populate codon reference table ──
function buildCodonTable() {
  const grid = document.getElementById("ct-grid");
  grid.innerHTML = CODON_TABLE.map((c, i) => `
    <div class="ct-row ${c.stop ? '' : ''}' id="ctr-${i}">
      <span class="ct-codon">${c.codon}</span>
      <span class="ct-aa">${c.short}</span>
    </div>`).join("");
}

// ── Drawing helpers ──
function roundRect(x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
}

function text(str, x, y, size, color, align = "center", font = "Inter") {
  ctx.font = `${size}px '${font}', sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(str, x, y);
}

function monoText(str, x, y, size, color, align = "center") {
  ctx.font = `bold ${size}px 'JetBrains Mono', monospace`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(str, x, y);
}

// ── Draw mRNA ──
function drawMRNA() {
  // Backbone
  const totalW = MRNA.length * CODON_W + 20;
  roundRect(MRNA_START_X - 20, MRNA_Y - 16, totalW + 40, 50, 10, "#1a2235", "#2a3a55");

  // Labels
  text("5'", MRNA_START_X - 28, MRNA_Y + 14, 13, "#ffd166", "right");
  text("3'", MRNA_START_X + totalW + 14, MRNA_Y + 14, 13, "#ffd166", "left");

  MRNA.forEach((codon, i) => {
    const x = MRNA_START_X + i * CODON_W;
    const currentIdx = state.step;
    const isDone = i < currentIdx;
    const isCurrent = i === currentIdx && state.phase !== "idle";
    const isNext = i === currentIdx + 1 && state.phase === "elongation";

    let bgColor = "#1e2d45";
    let borderColor = "#2a3a55";
    let textColor = "#8899bb";

    if (isDone) { bgColor = "#0d1a2a"; borderColor = "#1e3050"; textColor = "#4a6080"; }
    if (isCurrent) { bgColor = "rgba(108,99,255,0.18)"; borderColor = "#6c63ff"; textColor = "#e8f0fe"; }
    if (isNext) { bgColor = "rgba(0,200,150,0.07)"; borderColor = "rgba(0,200,150,0.3)"; textColor = "#8899bb"; }

    roundRect(x + 2, MRNA_Y - 14, CODON_W - 4, 46, 8, bgColor, borderColor);

    // Codon number
    text(`${i + 1}`, x + CODON_W / 2, MRNA_Y - 2, 10, textColor);
    // Codon letters
    monoText(codon, x + CODON_W / 2, MRNA_Y + 20, 14, isCurrent ? "#ffd166" : textColor);
  });
}

// ── Draw Ribosome ──
function drawRibosome(rx) {
  if (state.phase === "idle" || state.phase === "done") return;

  const rw = 160, rh = 78;
  const bx = rx - rw / 2, by = RIBO_Y - 8;

  // Shadow glow
  ctx.shadowColor = "rgba(108,99,255,0.4)";
  ctx.shadowBlur = 20;

  // Large subunit (top)
  roundRect(bx + 10, by - 38, rw - 20, 44, 14, "#1c2a50", "#5b54d6");
  text("60S (Large Subunit)", rx, by - 18, 11, "#a0a8d0", "center");

  // Small subunit (bottom)
  roundRect(bx, by, rw, 40, 12, "#162040", "#6c63ff");
  text("40S (Small Subunit)", rx, by + 22, 11, "#8899cc", "center");

  ctx.shadowBlur = 0;

  // P site & A site labels
  const ps = rx - 36;
  const as_ = rx + 36;
  text("P", ps, by + 38, 10, "#00c896");
  text("A", as_, by + 38, 10, "#ffd166");
  // site lines
  ctx.strokeStyle = "rgba(0,200,150,0.25)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(ps, by + 6); ctx.lineTo(ps, by + 28); ctx.stroke();
  ctx.strokeStyle = "rgba(255,209,102,0.25)";
  ctx.beginPath(); ctx.moveTo(as_, by + 6); ctx.lineTo(as_, by + 28); ctx.stroke();
}

// ── Draw tRNA ──
function drawTRNA() {
  if (!state.tRNA) return;
  const t = state.tRNA;
  const rx = anim.riboX;
  const tx = rx + 36; // A-site x
  const ty = anim.tRNAY;
  const op = Math.min(1, anim.tRNAOpacity);
  if (op <= 0) return;

  ctx.globalAlpha = op;

  // tRNA body (clover-leaf shape simplified as rounded rect)
  ctx.shadowColor = t.color + "66";
  ctx.shadowBlur = 14;

  // Stem
  ctx.strokeStyle = t.color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(tx, ty + 60);
  ctx.lineTo(tx, ty + 90);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Body
  roundRect(tx - 28, ty, 56, 62, 14, "#1a2235", t.color);

  // Anticodon
  monoText(t.anti, tx, ty + 22, 12, "#e8f0fe");
  text("anticodon", tx, ty + 34, 9, "#8899bb");

  // Amino acid ball
  ctx.shadowColor = t.color + "88"; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.arc(tx, ty - 20, 18, 0, Math.PI * 2);
  ctx.fillStyle = t.color + "cc"; ctx.fill();
  ctx.strokeStyle = t.color; ctx.lineWidth = 2; ctx.stroke();
  ctx.shadowBlur = 0;

  text(t.short, tx, ty - 15, 11, "#fff");

  // Loop arcs (decorative)
  ctx.strokeStyle = t.color + "55"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(tx - 16, ty + 28, 12, -Math.PI / 2, Math.PI / 2, true); ctx.stroke();
  ctx.beginPath(); ctx.arc(tx + 16, ty + 28, 12, -Math.PI / 2, Math.PI / 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(tx, ty + 56, 12, 0, Math.PI); ctx.stroke();

  ctx.globalAlpha = 1;
}

// ── Draw polypeptide chain ──
function drawChain() {
  if (state.chain.length === 0) return;
  const spacing = 48;
  const startX = 80;

  // label
  text("Polypeptide Chain:", startX - 20, CHAIN_Y - 4, 10, "#8899bb", "left");

  state.chain.forEach((aa, i) => {
    const x = startX + i * spacing;
    const y = CHAIN_Y + 22;

    // Bond line
    if (i > 0) {
      ctx.strokeStyle = "#2a3a55"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x - spacing + 16, y); ctx.lineTo(x - 16, y); ctx.stroke();
      // peptide bond label
      if (i === 1 || i === state.chain.length - 1 || i % 2 === 0) {
        text("~", x - spacing / 2, y - 2, 12, "#4a6080");
      }
    }

    // AA circle
    ctx.shadowColor = aa.color + "55"; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fillStyle = aa.color + "22"; ctx.fill();
    ctx.strokeStyle = aa.color; ctx.lineWidth = 2; ctx.stroke();
    ctx.shadowBlur = 0;

    text(aa.short, x, y + 4, 10, aa.color);
  });
}

// ── Draw background grid ──
function drawBG() {
  ctx.fillStyle = "#0a0f1e";
  ctx.fillRect(0, 0, W, H);

  // subtle grid
  ctx.strokeStyle = "rgba(255,255,255,0.025)"; ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
}

// ── Draw phase labels ──
function drawPhaseLabel() {
  const labels = {
    idle: "Waiting…", initiation: "Initiation — Ribosome assembles at AUG",
    elongation: "Elongation — Peptide bonds forming", termination: "Termination — STOP codon reached",
    done: "✓ Translation Complete!"
  };
  const label = labels[state.phase] || "";
  document.getElementById("phase-label").textContent = "Phase: " + label;
}

// ── Main draw ──
function draw() {
  drawBG();
  drawChain();
  drawMRNA();
  drawTRNA();
  drawRibosome(anim.riboX);
  drawPhaseLabel();
}

// ── Target ribosome X for codon i ──
function riboXForCodon(i) {
  return MRNA_START_X + i * CODON_W + CODON_W / 2;
}

// ── Animation loop ──
let lastTs = 0;
function animLoop(ts) {
  const dt = Math.min((ts - lastTs) / 1000, 0.1);
  lastTs = ts;
  const spd = parseFloat(document.getElementById("speed").value);
  const lerpSpd = spd * 3;

  // Lerp ribosome X
  anim.riboX += (state.ribosomeTargetX - anim.riboX) * lerpSpd * dt;

  // Lerp tRNA Y and opacity
  if (state.tRNA) {
    anim.tRNAY += (state.tRNA.targetY - anim.tRNAY) * lerpSpd * dt;
    anim.tRNAOpacity += (1 - anim.tRNAOpacity) * lerpSpd * dt;
  }

  draw();

  // Check if ribosome settled
  const settled = Math.abs(anim.riboX - state.ribosomeTargetX) < 1;
  const tRNASettled = !state.tRNA || Math.abs(anim.tRNAY - state.tRNA.targetY) < 2;

  if (settled && tRNASettled && state.autoPlay) {
    clearTimeout(state._autoTimer);
    state._autoTimer = setTimeout(() => advanceStep(), 1000 / spd);
  }

  state.animFrame = requestAnimationFrame(animLoop);
}

// ── Step messages ──
const stepMsgs = [
  { title: "Initiation: Start Codon Recognized", desc: "The small ribosomal subunit (40S) scans the mRNA and recognizes the AUG start codon. Initiator tRNA (Met-tRNA) binds to the P-site, carrying Methionine." },
  { title: "Elongation: First tRNA enters A-site", desc: "A new aminoacyl-tRNA enters the A-site, its anticodon complementary to the next codon on mRNA. Hydrogen bonds form between codon and anticodon." },
  { title: "Peptide Bond Formation", desc: "Peptidyl transferase (part of the large subunit) catalyzes formation of a peptide bond between amino acids in the P-site and A-site." },
  { title: "Translocation", desc: "The ribosome moves one codon (3 nucleotides) toward the 3' end of mRNA. The polypeptide shifts from A-site to P-site. A new A-site is exposed." },
];

// ── Update UI panel ──
function updatePanel(msg) {
  const i = state.step;
  const codonData = CODON_TABLE[i] || {};

  document.getElementById("step-title").textContent = msg.title;
  document.getElementById("step-desc").textContent = msg.desc;

  // Codon badges
  const display = document.getElementById("codon-display");
  if (codonData.codon && state.phase !== "idle") {
    display.innerHTML = `
      <span class="codon-badge cb-mrna" title="mRNA Codon">${codonData.codon}</span>
      ${codonData.anti !== "---" ? `<span class="codon-badge cb-anti" title="tRNA Anticodon">${codonData.anti}</span>` : ""}
      <span class="codon-badge cb-aa" title="Amino Acid">${codonData.aa}</span>`;
  } else {
    display.innerHTML = "";
  }

  // Chain pills
  const pillsEl = document.getElementById("chain-pills");
  if (state.chain.length === 0) {
    pillsEl.innerHTML = `<span style="font-size:0.78rem;color:var(--muted);">No amino acids yet…</span>`;
  } else {
    pillsEl.innerHTML = state.chain.map(aa =>
      `<span class="aa-pill" style="background:${aa.color}22;color:${aa.color};border:1px solid ${aa.color}44;">${aa.short}</span>`
    ).join("");
  }

  // Highlight codon table
  document.querySelectorAll(".ct-row").forEach((el, idx) => {
    el.classList.remove("active", "done");
    if (idx === i) el.classList.add("active");
    if (idx < i) el.classList.add("done");
  });

  // Status dots
  const dots = { init: "dot-init", elon: "dot-elon", term: "dot-term", rel: "dot-rel" };
  Object.values(dots).forEach(id => {
    const el = document.getElementById(id);
    el.className = "status-dot idle";
  });
  if (state.phase === "initiation") document.getElementById("dot-init").className = "status-dot active";
  if (state.phase === "elongation") document.getElementById("dot-elon").className = "status-dot active";
  if (state.phase === "termination") document.getElementById("dot-term").className = "status-dot active";
  if (state.phase === "done") {
    document.getElementById("dot-init").className = "status-dot done";
    document.getElementById("dot-elon").className = "status-dot done";
    document.getElementById("dot-term").className = "status-dot done";
    document.getElementById("dot-rel").className = "status-dot done";
  }
}

// ── Advance one step ──
function advanceStep() {
  const i = state.step;
  const codonData = CODON_TABLE[i];
  if (!codonData) return;

  if (state.phase === "idle") {
    // Begin initiation
    state.phase = "initiation";
    state.step = 0;
    state.ribosomeTargetX = riboXForCodon(0);
    state.tRNA = { ...CODON_TABLE[0], targetY: TRNA_FULL_Y, y: TRNA_START_Y };
    anim.tRNAY = TRNA_START_Y - 60;
    anim.tRNAOpacity = 0;
    updatePanel({ title: stepMsgs[0].title, desc: stepMsgs[0].desc });
    return;
  }

  if (codonData.stop) {
    // Termination
    state.phase = "termination";
    state.tRNA = null;
    updatePanel({
      title: "Termination: STOP Codon UAA",
      desc: "The ribosome encounters the STOP codon (UAA). No tRNA recognizes it. A release factor protein enters the A-site, causing the polypeptide to be released. The ribosome dissociates."
    });
    setTimeout(() => {
      state.phase = "done";
      state.tRNA = null;
      document.getElementById("btn-play").textContent = "▶ Start";
      state.autoPlay = false;
      updatePanel({ title: "✓ Translation Complete!", desc: `A polypeptide of ${state.chain.length} amino acids has been synthesized: ${state.chain.map(a => a.short).join(" — ")}. This protein will now fold into its functional 3D shape.` });
    }, 2200);
    return;
  }

  // Add amino acid to chain
  if (state.phase !== "initiation" || state.step === 0) {
    state.chain.push(codonData);
  }

  // Next codon
  state.step++;
  const nextData = CODON_TABLE[state.step];
  state.phase = nextData?.stop ? "termination" : "elongation";
  state.ribosomeTargetX = riboXForCodon(state.step);

  // Show tRNA for next codon
  if (nextData && !nextData.stop) {
    state.tRNA = { ...nextData, targetY: TRNA_FULL_Y };
    anim.tRNAY = TRNA_START_Y - 40;
    anim.tRNAOpacity = 0;
  } else {
    state.tRNA = null;
  }

  const msg = nextData?.stop
    ? { title: "Termination: STOP Codon Reached", desc: "The ribosome has reached UAA — a STOP codon. Translation will terminate." }
    : {
      title: stepMsgs[Math.min(1, state.step) + (state.step > 1 ? 1 : 0)]?.title || "Elongation continues…",
      desc: `Codon ${state.step + 1}: ${nextData?.codon} → Anticodon: ${nextData?.anti} → Amino acid: ${nextData?.aa}. Peptide bond forms and ribosome translocates.`
    };

  updatePanel(msg);
}

// ── Reset ──
function resetSim() {
  clearTimeout(state._autoTimer);
  state = { phase: "idle", step: 0, ribosomeX: 0, ribosomeTargetX: 0, chain: [], tRNA: null, animating: false, autoPlay: false, animFrame: null, _autoTimer: null };
  anim = { riboX: riboXForCodon(0) - 200, tRNAY: 0, tRNAOpacity: 0 };
  document.getElementById("btn-play").textContent = "▶ Start";
  updatePanel({ title: "Ready to Start", desc: "Press Start or Step to begin the translation simulation. The ribosome will read the mRNA from 5' to 3'." });
  document.getElementById("codon-display").innerHTML = "";
  ["dot-init", "dot-elon", "dot-term", "dot-rel"].forEach(id => {
    document.getElementById(id).className = "status-dot idle";
  });
  document.querySelectorAll(".ct-row").forEach(el => el.classList.remove("active", "done"));
  draw();
}

// ── Controls ──
document.getElementById("btn-play").addEventListener("click", function () {
  if (state.phase === "done") { resetSim(); return; }
  state.autoPlay = !state.autoPlay;
  this.textContent = state.autoPlay ? "⏸ Pause" : "▶ Resume";
  if (state.autoPlay) advanceStep();
});

document.getElementById("btn-step").addEventListener("click", () => {
  if (state.phase === "done") return;
  state.autoPlay = false;
  document.getElementById("btn-play").textContent = "▶ Resume";
  advanceStep();
});

document.getElementById("btn-reset").addEventListener("click", resetSim);

// ── Init ──
buildCodonTable();
anim.riboX = riboXForCodon(0) - 180;
resetSim();
requestAnimationFrame(ts => { lastTs = ts; animLoop(ts); });
