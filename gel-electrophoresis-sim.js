// ═══════════════════════════════════════════════
//  GEL ELECTROPHORESIS SIMULATION ENGINE
//  Chapter 11 — Biotechnology: Principles & Processes
// ═══════════════════════════════════════════════

// ── DNA Ladder (Lane 1) ──
const LADDER_BANDS = [10000, 8000, 6000, 4000, 3000, 2000, 1500, 1000, 750, 500, 250];

// ── Sample Definitions ──
const SAMPLES = [
  { id: 0, name: "Plasmid Digest",    frags: [4500, 2300, 1200],       color: "#00c896", desc: "EcoRI digest of pUC19" },
  { id: 1, name: "PCR Product",       frags: [850],                    color: "#a78bfa", desc: "Amplified gene fragment" },
  { id: 2, name: "Genomic Digest",    frags: [3200, 1600, 800, 300],   color: "#ff6b6b", desc: "HindIII genomic digest" },
  { id: 3, name: "Bt Gene Fragment",  frags: [1800, 600],              color: "#22d3ee", desc: "Cry gene from Bt toxin" },
  { id: 4, name: "Lambda DNA",        frags: [6500, 4200, 2000, 900],  color: "#f59e0b", desc: "Lambda phage HindIII" },
];

// ── Canvas & State ──
const canvas = document.getElementById("gelCanvas");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;
const tooltip = document.getElementById("tooltip");

// Gel layout
const GEL_TOP    = 60;       // y where wells start
const GEL_BOTTOM = H - 30;  // y = positive electrode
const GEL_LEFT   = 30;
const GEL_RIGHT  = W - 30;
const GEL_H      = GEL_BOTTOM - GEL_TOP;
const WELL_W     = 18;
const WELL_H     = 16;

let numLanes   = 6;          // 1 ladder + 5 samples max
let laneWidth  = (GEL_RIGHT - GEL_LEFT) / numLanes;

// Simulation state
let simState = {
  phase:    "idle",   // idle | running | staining | done
  progress: 0,        // 0 → 1
  stained:  false,
  time:     0,
  anim:     null,
  lastTs:   0,
};

// Selected sample lanes (by sample id)
let selectedSamples = [0, 1, 2]; // default selection

// ── Compute band position from fragment size ──
// Logarithmic relationship: distance ∝ -log(bp)
function bpToY(bp, progress) {
  const minBP = Math.log10(100);
  const maxBP = Math.log10(12000);
  const logBP = Math.log10(bp);
  // Normalized 0–1, small=1 (travels far), large=0 (stays near well)
  const norm = 1 - (logBP - minBP) / (maxBP - minBP);
  // Apply progress and leave 15% margin at bottom
  const maxTravel = GEL_H * 0.88;
  return GEL_TOP + WELL_H + norm * maxTravel * progress;
}

// ── Lane X center ──
function laneX(index) {
  return GEL_LEFT + laneWidth * index + laneWidth / 2;
}

// ── Draw gel background ──
function drawGelBG() {
  // Gel body
  const grad = ctx.createLinearGradient(GEL_LEFT, GEL_TOP, GEL_RIGHT, GEL_BOTTOM);
  if (simState.stained) {
    grad.addColorStop(0, "#07100a");
    grad.addColorStop(1, "#050d08");
  } else {
    grad.addColorStop(0, "#0d1520");
    grad.addColorStop(1, "#0a1018");
  }
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(GEL_LEFT, GEL_TOP, GEL_RIGHT - GEL_LEFT, GEL_H, 10);
  ctx.fill();

  // Gel border
  ctx.strokeStyle = simState.stained ? "rgba(0,200,150,0.2)" : "rgba(255,209,102,0.15)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Grid lines (subtle)
  ctx.strokeStyle = "rgba(255,255,255,0.025)";
  ctx.lineWidth = 1;
  for (let y = GEL_TOP + 40; y < GEL_BOTTOM; y += 40) {
    ctx.beginPath(); ctx.moveTo(GEL_LEFT + 10, y); ctx.lineTo(GEL_RIGHT - 10, y); ctx.stroke();
  }

  // Lane dividers
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  for (let i = 1; i < numLanes; i++) {
    const x = GEL_LEFT + laneWidth * i;
    ctx.beginPath(); ctx.moveTo(x, GEL_TOP + 8); ctx.lineTo(x, GEL_BOTTOM - 8); ctx.stroke();
  }
}

// ── Draw electrodes ──
function drawElectrodes() {
  // Negative (−) top
  ctx.fillStyle = "#1a2535";
  ctx.beginPath(); ctx.roundRect(GEL_LEFT, GEL_TOP - 26, GEL_RIGHT - GEL_LEFT, 22, 6); ctx.fill();
  ctx.strokeStyle = "rgba(100,150,255,0.4)"; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.font = "bold 12px Inter, sans-serif";
  ctx.fillStyle = "#6b99ff"; ctx.textAlign = "center";
  ctx.fillText("− Cathode (Negative)", W / 2, GEL_TOP - 10);

  // Positive (+) bottom
  ctx.fillStyle = "#1a2520";
  ctx.beginPath(); ctx.roundRect(GEL_LEFT, GEL_BOTTOM + 6, GEL_RIGHT - GEL_LEFT, 22, 6); ctx.fill();
  ctx.strokeStyle = "rgba(255,100,100,0.4)"; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = "#ff7070"; ctx.textAlign = "center";
  ctx.fillText("+ Anode (Positive)", W / 2, GEL_BOTTOM + 21);
}

// ── Draw wells ──
function drawWells() {
  const laneData = getLaneData();
  laneData.forEach((lane, i) => {
    const x = laneX(i) - WELL_W / 2;
    const y = GEL_TOP + 2;

    // Well body
    ctx.fillStyle = "#05080f";
    ctx.beginPath(); ctx.roundRect(x, y, WELL_W, WELL_H, 3); ctx.fill();
    ctx.strokeStyle = lane.color + "80"; ctx.lineWidth = 1.5; ctx.stroke();

    // Lane label
    ctx.font = "600 10px Inter, sans-serif";
    ctx.fillStyle = lane.color;
    ctx.textAlign = "center";
    ctx.fillText(i === 0 ? "L" : `S${i}`, laneX(i), y + WELL_H + 10);
  });
}

// ── Draw a single DNA band ──
function drawBand(x, y, color, bp, stained, laneW) {
  const bw = laneW * 0.72;
  const bh = stained ? 5 : 4;

  if (stained) {
    // Glowing EtBr effect
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    const g = ctx.createLinearGradient(x - bw/2, y, x + bw/2, y);
    g.addColorStop(0,   color + "00");
    g.addColorStop(0.2, color + "cc");
    g.addColorStop(0.5, color + "ff");
    g.addColorStop(0.8, color + "cc");
    g.addColorStop(1,   color + "00");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect(x - bw/2, y - bh/2, bw, bh, 2); ctx.fill();
    ctx.shadowBlur = 0;
  } else {
    // Unstained — faint blue band (loading dye visible)
    ctx.fillStyle = color + "55";
    ctx.beginPath(); ctx.roundRect(x - bw/2, y - bh/2, bw, bh, 2); ctx.fill();
    ctx.strokeStyle = color + "99"; ctx.lineWidth = 1; ctx.stroke();
  }
}

// ── Get lane data array ──
function getLaneData() {
  const lanes = [];
  // Lane 0: Ladder
  lanes.push({ name: "DNA Ladder", color: "#ffd166", frags: LADDER_BANDS, isLadder: true });
  // Selected samples
  selectedSamples.forEach((sid, i) => {
    const s = SAMPLES[sid];
    lanes.push({ name: s.name, color: s.color, frags: s.frags, isLadder: false });
  });
  return lanes;
}

// ── Draw ladder size labels ──
function drawLadderLabels() {
  if (!simState.stained) return;
  LADDER_BANDS.forEach(bp => {
    const y = bpToY(bp, simState.progress);
    if (y < GEL_TOP + WELL_H + 2 || y > GEL_BOTTOM - 4) return;
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(255,209,102,0.6)";
    ctx.textAlign = "left";
    const label = bp >= 1000 ? (bp/1000).toFixed(bp%1000===0?0:1)+"kb" : bp+"bp";
    ctx.fillText(label, laneX(0) + WELL_W/2 + 4, y + 3);
  });
}

// ── Draw loading dye front ──
function drawDyeFront() {
  if (simState.progress < 0.05) return;
  const y = GEL_TOP + WELL_H + GEL_H * 0.91 * simState.progress;
  if (y > GEL_BOTTOM - 4) return;
  ctx.strokeStyle = "rgba(0,100,255,0.25)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(GEL_LEFT+12, y); ctx.lineTo(GEL_RIGHT-12, y); ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = "9px Inter, sans-serif";
  ctx.fillStyle = "rgba(100,150,255,0.45)";
  ctx.textAlign = "right";
  ctx.fillText("loading dye", GEL_RIGHT - 14, y - 3);
}

// ── Main draw ──
function draw() {
  ctx.clearRect(0, 0, W, H);
  drawGelBG();
  drawElectrodes();

  const lanes = getLaneData();
  numLanes = lanes.length;
  laneWidth = (GEL_RIGHT - GEL_LEFT) / numLanes;

  // Draw bands for each lane
  lanes.forEach((lane, li) => {
    lane.frags.forEach(bp => {
      const y = bpToY(bp, simState.progress);
      if (y < GEL_TOP + WELL_H || y > GEL_BOTTOM) return;
      drawBand(laneX(li), y, lane.color, bp, simState.stained, laneWidth);
    });
  });

  drawDyeFront();
  drawLadderLabels();
  drawWells();
}

// ── Animation loop ──
function animLoop(ts) {
  if (!simState.lastTs) simState.lastTs = ts;
  const dt = Math.min((ts - simState.lastTs) / 1000, 0.1);
  simState.lastTs = ts;

  const speed = parseFloat(document.getElementById("speed-slider").value);
  const voltage = parseInt(document.getElementById("voltage-slider").value);
  // Progress rate influenced by speed + voltage
  const rate = 0.012 * speed * (voltage / 80);

  simState.progress = Math.min(1, simState.progress + rate * dt);
  simState.time = simState.progress * 45; // ~45 min equivalent

  document.getElementById("time-display").textContent = `t = ${simState.time.toFixed(0)} min`;
  document.getElementById("progress-fill").style.width = (simState.progress * 100) + "%";

  draw();

  if (simState.progress >= 1) {
    finishRun();
    return;
  }
  simState.anim = requestAnimationFrame(animLoop);
}

// ── Finish run ──
function finishRun() {
  simState.phase = "done";
  simState.progress = 1;
  draw();
  setPhaseTag("done", "✓ Run Complete");
  document.getElementById("btn-run").textContent = "▶ Run Gel";
  document.getElementById("btn-run").disabled = false;
  document.getElementById("btn-stain").disabled = false;
}

// ── Phase tag helper ──
function setPhaseTag(cls, label) {
  const tag = document.getElementById("phase-tag");
  tag.className = `phase-tag phase-${cls}`;
  tag.textContent = label;
}

// ── Build sample lane selector ──
function buildLaneList() {
  const list = document.getElementById("lane-list");
  list.innerHTML = SAMPLES.map(s => `
    <div class="lane-option ${selectedSamples.includes(s.id) ? 'active' : ''}" data-id="${s.id}" onclick="toggleSample(${s.id})">
      <div class="lane-dot" style="background:${s.color};"></div>
      <div style="flex:1;">
        <div class="lane-name">${s.name}</div>
        <div class="lane-frags">${s.frags.join(", ")} bp</div>
      </div>
      <div class="lane-check">${selectedSamples.includes(s.id) ? "✓" : ""}</div>
    </div>`).join("");
}

function toggleSample(id) {
  if (simState.phase === "running") return;
  if (selectedSamples.includes(id)) {
    if (selectedSamples.length <= 1) return; // keep at least 1
    selectedSamples = selectedSamples.filter(x => x !== id);
  } else {
    if (selectedSamples.length >= 5) return; // max 5 lanes + ladder = 6
    selectedSamples.push(id);
  }
  buildLaneList();
  draw();
}

// ── Build ladder table ──
function buildLadderTable() {
  const tbody = document.getElementById("ladder-tbody");
  tbody.innerHTML = LADDER_BANDS.map((bp, i) => `
    <tr id="ltr-${i}">
      <td><span class="ladder-dot" style="background:#ffd166;"></span>Band ${i+1}</td>
      <td>${bp >= 1000 ? (bp/1000).toFixed(bp%1000===0?0:1)+" kb" : bp+" bp"}</td>
      <td id="ltr-pos-${i}">—</td>
    </tr>`).join("");
}

function updateLadderTable() {
  LADDER_BANDS.forEach((bp, i) => {
    const y = bpToY(bp, simState.progress);
    const pct = ((y - GEL_TOP) / GEL_H * 100).toFixed(0);
    const posEl = document.getElementById(`ltr-pos-${i}`);
    if (posEl) posEl.textContent = simState.progress > 0.01 ? pct + "%" : "—";
  });
}

// ── Tooltip on canvas hover ──
canvas.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  const scaleY = H / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;

  if (simState.progress < 0.05 || my < GEL_TOP || my > GEL_BOTTOM) {
    tooltip.style.display = "none"; return;
  }

  // Estimate size from Y position (inverse of bpToY)
  const norm = (my - GEL_TOP - WELL_H) / (GEL_H * 0.88 * simState.progress);
  if (norm < 0 || norm > 1.05) { tooltip.style.display = "none"; return; }
  const minBP = Math.log10(100), maxBP = Math.log10(12000);
  const logBP = maxBP - norm * (maxBP - minBP);
  const estimatedBP = Math.round(Math.pow(10, logBP) / 50) * 50;

  // Find lane
  const laneIdx = Math.floor((mx - GEL_LEFT) / laneWidth);
  const lanes = getLaneData();
  const laneName = (laneIdx >= 0 && laneIdx < lanes.length) ? lanes[laneIdx].name : "";

  document.getElementById("tooltip-bp").textContent =
    estimatedBP >= 1000 ? `~${(estimatedBP/1000).toFixed(1)} kb` : `~${estimatedBP} bp`;
  document.getElementById("tooltip-lane").textContent = laneName;

  tooltip.style.display = "block";
  tooltip.style.left = (e.clientX - rect.left + 12) + "px";
  tooltip.style.top  = (e.clientY - rect.top - 10) + "px";
});
canvas.addEventListener("mouseleave", () => { tooltip.style.display = "none"; });

// ── Controls ──
document.getElementById("btn-run").addEventListener("click", () => {
  if (simState.phase === "running") return;
  if (simState.phase === "done") { resetSim(); return; }
  simState.phase = "running";
  simState.lastTs = 0;
  setPhaseTag("running", "● Running");
  document.getElementById("btn-run").disabled = true;
  document.getElementById("btn-stain").disabled = true;
  simState.anim = requestAnimationFrame(animLoop);
});

document.getElementById("btn-stain").addEventListener("click", () => {
  if (simState.progress < 0.1) return;
  simState.stained = !simState.stained;
  setPhaseTag(simState.stained ? "stained" : "done", simState.stained ? "🔦 UV Stained" : "✓ Run Complete");
  document.getElementById("btn-stain").textContent = simState.stained ? "💡 Unstain" : "🔦 UV Stain";
  draw();
  if (simState.stained) updateLadderTable();
});

document.getElementById("btn-reset").addEventListener("click", resetSim);

document.getElementById("voltage-slider").addEventListener("input", function() {
  document.getElementById("voltage-display").textContent = this.value + " V";
});

function resetSim() {
  cancelAnimationFrame(simState.anim);
  simState = { phase:"idle", progress:0, stained:false, time:0, anim:null, lastTs:0 };
  document.getElementById("btn-run").textContent  = "▶ Run Gel";
  document.getElementById("btn-run").disabled     = false;
  document.getElementById("btn-stain").textContent = "🔦 UV Stain";
  document.getElementById("btn-stain").disabled   = true;
  document.getElementById("progress-fill").style.width = "0%";
  document.getElementById("time-display").textContent  = "t = 0 min";
  setPhaseTag("idle", "● Idle");
  buildLadderTable();
  draw();
}

// ── Init ──
buildLaneList();
buildLadderTable();
draw();
