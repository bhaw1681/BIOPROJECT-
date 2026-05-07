// ── Chapter Data ──
const chapters = [
  {
    unit: 6, unitTitle: "Reproduction", theme: "green", icon: "🌱",
    chapters: [
      {
        num: 1, title: "Reproduction in Organisms",
        tags: ["Asexual", "Sexual", "Life Cycle"],
        topics: ["Modes of reproduction","Asexual reproduction types","Budding, Fragmentation, Sporulation","Sexual reproduction phases","Juvenile & reproductive phase","Senescence"],
        marks: 14, importance: "High"
      },
      {
        num: 2, title: "Sexual Reproduction in Flowering Plants",
        tags: ["Pollination", "Fertilization", "Embryo"],
        topics: ["Flower structure","Microsporogenesis","Megasporogenesis","Pollination types","Double fertilization","Seed & fruit formation","Apomixis & Polyembryony"],
        marks: 14, importance: "Very High"
      },
      {
        num: 3, title: "Human Reproduction",
        tags: ["Male Reproductive","Female Reproductive","Fertilization"],
        topics: ["Male reproductive system","Female reproductive system","Gametogenesis","Menstrual cycle","Fertilisation & implantation","Pregnancy & parturition","Lactation"],
        marks: 14, importance: "Very High"
      },
      {
        num: 4, title: "Reproductive Health",
        tags: ["STDs", "Contraception", "Population"],
        topics: ["Reproductive health concept","Population explosion","Birth control methods","Medical termination of pregnancy","Sexually transmitted infections","Infertility & ART"],
        marks: 14, importance: "High"
      }
    ]
  },
  {
    unit: 7, unitTitle: "Genetics and Evolution", theme: "purple", icon: "🧬",
    chapters: [
      {
        num: 5, title: "Principles of Inheritance and Variation",
        tags: ["Mendel", "Chromosomes", "Mutation"],
        topics: ["Mendel's laws","Monohybrid cross","Dihybrid cross","Chromosomal theory","Linkage & crossing over","Mutation","Pedigree analysis","Sex determination","Genetic disorders"],
        marks: 18, importance: "Very High"
      },
      {
        num: 6, title: "Molecular Basis of Inheritance",
        tags: ["DNA", "RNA", "Gene Expression"],
        topics: ["DNA structure","DNA replication","Transcription","Genetic code","Translation","Lac operon","Human Genome Project","DNA fingerprinting"],
        marks: 18, importance: "Very High"
      },
      {
        num: 7, title: "Evolution",
        tags: ["Origin of Life", "Natural Selection", "Speciation"],
        topics: ["Origin of life theories","Theories of evolution","Darwinism & Natural selection","Hardy-Weinberg principle","Speciation","Human evolution","Adaptive radiation"],
        marks: 18, importance: "High"
      }
    ]
  },
  {
    unit: 8, unitTitle: "Biology in Human Welfare", theme: "red", icon: "🏥",
    chapters: [
      {
        num: 8, title: "Human Health and Disease",
        tags: ["Immunity", "Pathogens", "Drugs"],
        topics: ["Immunity types","Innate & acquired immunity","Lymphoid organs","AIDS","Cancer","Drug & alcohol abuse","Common diseases"],
        marks: 14, importance: "High"
      },
      {
        num: 9, title: "Strategies for Enhancement in Food Production",
        tags: ["Plant Breeding", "Animal Husbandry", "Biofortification"],
        topics: ["Animal husbandry","Plant breeding steps","Mutation breeding","Biofortification","Single cell protein","Tissue culture & somatic hybridization"],
        marks: 14, importance: "Medium"
      },
      {
        num: 10, title: "Microbes in Human Welfare",
        tags: ["Fermentation", "Biogas", "Antibiotics"],
        topics: ["Microbes in food processing","Industrial products","Antibiotics production","Biogas production","Sewage treatment","Biofertilizers","Biocontrol agents"],
        marks: 14, importance: "High"
      }
    ]
  },
  {
    unit: 9, unitTitle: "Biotechnology", theme: "yellow", icon: "🔬",
    chapters: [
      {
        num: 11, title: "Biotechnology: Principles and Processes",
        tags: ["Recombinant DNA", "PCR", "Cloning"],
        topics: ["Genetic engineering tools","Restriction enzymes","Vectors & cloning","PCR technique","Gel electrophoresis","Recombinant DNA technology","Bioreactors"],
        marks: 12, importance: "Very High"
      },
      {
        num: 12, title: "Biotechnology and its Applications",
        tags: ["GMO", "Gene Therapy", "Transgenic"],
        topics: ["Bt crops & pest resistance","Golden rice","Transgenic animals","Insulin production","Gene therapy","Molecular diagnostics","Bioethics & biosafety"],
        marks: 12, importance: "Very High"
      }
    ]
  },
  {
    unit: 10, unitTitle: "Ecology", theme: "cyan", icon: "🌿",
    chapters: [
      {
        num: 13, title: "Organisms and Populations",
        tags: ["Adaptations", "Population", "Interactions"],
        topics: ["Organism & environment","Major abiotic factors","Adaptation types","Population attributes","Population growth models","Life history variations","Species interactions"],
        marks: 14, importance: "High"
      },
      {
        num: 14, title: "Ecosystem",
        tags: ["Food Chain", "Energy Flow", "Nutrient Cycling"],
        topics: ["Ecosystem structure","Productivity","Decomposition","Energy flow","Ecological pyramids","Nutrient cycling","Ecosystem services"],
        marks: 14, importance: "Very High"
      },
      {
        num: 15, title: "Biodiversity and Conservation",
        tags: ["Hotspots", "Extinction", "Conservation"],
        topics: ["Levels of biodiversity","Patterns of biodiversity","Loss of biodiversity","Extinction causes","In-situ conservation","Ex-situ conservation","Biodiversity hotspots"],
        marks: 14, importance: "High"
      },
      {
        num: 16, title: "Environmental Issues",
        tags: ["Pollution", "Global Warming", "Ozone"],
        topics: ["Air pollution & control","Water pollution","Solid waste management","Agro-chemicals","Ozone depletion","Greenhouse effect","Deforestation & remedies"],
        marks: 14, importance: "High"
      }
    ]
  }
];

// ── Build Units ──
function buildUnits(data) {
  const grid = document.getElementById('unit-grid');
  grid.innerHTML = '';
  data.forEach(unit => {
    const card = document.createElement('div');
    card.className = `unit-card theme-${unit.theme}`;
    const chHtml = unit.chapters.map(ch => `
      <a class="chapter-item" href="#" data-ch="${ch.num}" onclick="openModal(${ch.num}); return false;" id="ch-${ch.num}">
        <div class="ch-num">${ch.num}</div>
        <div class="ch-info">
          <div class="ch-title">${ch.title}</div>
          <div class="ch-tags">
            ${ch.tags.map(t => `<span class="ch-tag">${t}</span>`).join('')}
            ${ch.num === 6  ? '<span class="ch-tag sim-badge">⚗️ Simulation</span>' : ''}
            ${ch.num === 11 ? '<span class="ch-tag sim-badge" style="background:rgba(255,209,102,0.2);color:#ffd166;border-color:rgba(255,209,102,0.4);">🧫 Simulation</span>' : ''}
          </div>
        </div>
        <span class="ch-arrow">→</span>
      </a>`).join('');

    card.innerHTML = `
      <div class="unit-header">
        <div class="unit-icon">${unit.icon}</div>
        <div class="unit-meta">
          <div class="unit-num">Unit ${unit.unit}</div>
          <div class="unit-title">${unit.unitTitle}</div>
        </div>
        <span class="unit-badge">${unit.chapters.length} Chapters</span>
      </div>
      <div class="chapter-list">${chHtml}</div>`;
    grid.appendChild(card);
  });
}

// ── Flatten chapters for search ──
const allChapters = chapters.flatMap(u =>
  u.chapters.map(ch => ({ ...ch, unit: u.unit, unitTitle: u.unitTitle, theme: u.theme, icon: u.icon }))
);

// ── Search ──
document.getElementById('search-input').addEventListener('input', function () {
  const q = this.value.trim().toLowerCase();
  if (!q) { buildUnits(chapters); return; }

  const filtered = chapters.map(u => ({
    ...u,
    chapters: u.chapters.filter(ch =>
      ch.title.toLowerCase().includes(q) ||
      ch.tags.some(t => t.toLowerCase().includes(q)) ||
      ch.topics.some(t => t.toLowerCase().includes(q))
    )
  })).filter(u => u.chapters.length > 0);

  buildUnits(filtered);
});

// ── Modal ──
function openModal(chNum) {
  const ch = allChapters.find(c => c.num === chNum);
  if (!ch) return;

  document.getElementById('modal-ch-label').textContent = `Chapter ${ch.num} · Unit ${ch.unit}: ${ch.unitTitle}`;
  document.getElementById('modal-ch-title').textContent = ch.title;
  document.getElementById('modal-marks').textContent = ch.marks;
  document.getElementById('modal-importance').textContent = ch.importance;
  document.getElementById('modal-topics').innerHTML = ch.topics.map(t => `<div class="topic-pill">${t}</div>`).join('');
  document.getElementById('modal-tags').innerHTML = ch.tags.map(t => `<span class="ch-tag" style="font-size:0.8rem;padding:4px 10px;">${t}</span>`).join('');

  // Show simulation button for Chapter 6 (Translation)
  const simSection = document.getElementById('modal-sim-section');
  simSection.style.display = ch.num === 6 ? 'block' : 'none';

  // Show simulation button for Chapter 11 (Gel Electrophoresis)
  const gelSection = document.getElementById('modal-sim-section-gel');
  gelSection.style.display = ch.num === 11 ? 'block' : 'none';

  document.getElementById('modal-overlay').classList.add('open');
}

document.getElementById('modal-overlay').addEventListener('click', function (e) {
  if (e.target === this) this.classList.remove('open');
});
document.getElementById('modal-close').addEventListener('click', () => {
  document.getElementById('modal-overlay').classList.remove('open');
});

// ── Scroll Progress ──
window.addEventListener('scroll', () => {
  const total = document.body.scrollHeight - window.innerHeight;
  const pct = (window.scrollY / total) * 100;
  document.querySelector('.top-bar').style.width = pct + '%';
});

// ── Particles ──
function createParticles() {
  const container = document.getElementById('particles');
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 6 + 2;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random() * 100}%;
      animation-duration:${Math.random() * 12 + 8}s;
      animation-delay:${Math.random() * 8}s;
    `;
    container.appendChild(p);
  }
}

// ── Init ──
buildUnits(chapters);
createParticles();
