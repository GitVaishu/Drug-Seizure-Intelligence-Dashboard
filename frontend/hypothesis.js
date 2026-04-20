/* ─── DrugWatch India · Hypothesis Testing Lab (Enhanced) ─── */

const HYPOTHESIS_META = {
  cases_vs_arrests: {
    title: "Cases vs Arrests",
    test: "Spearman Correlation",
    explain: (stat, p) =>
      p < 0.05
        ? `Arrests scale almost perfectly with cases (ρ = ${stat.toFixed(2)}). Enforcement efficiency is nationally consistent.`
        : `No strong link between case count and arrests — enforcement varies widely by region.`,
    verdict: (stat, p) => {
      if (p < 0.05 && Math.abs(stat) > 0.6) return { tag: "Strong Relationship", cls: "verdict-strong" };
      if (p < 0.05) return { tag: "Weak Evidence", cls: "verdict-weak" };
      return { tag: "No Evidence", cls: "verdict-none" };
    },
  },
  year_difference: {
    title: "Yearly Variation (Kruskal–Wallis)",
    test: "Kruskal–Wallis H-test",
    explain: (_s, p) =>
      p < 0.05
        ? "Seizure quantities differ significantly across years — drug trafficking patterns are non-stationary."
        : "No statistically significant variation across years.",
    verdict: (_s, p) => {
      if (p < 0.01) return { tag: "Strong Relationship", cls: "verdict-strong" };
      if (p < 0.05) return { tag: "Weak Evidence", cls: "verdict-weak" };
      return { tag: "No Evidence", cls: "verdict-none" };
    },
  },
  "2018_vs_2024": {
    title: "2018 vs 2024 Shift",
    test: "Mann–Whitney U",
    explain: (_s, p) =>
      p < 0.05
        ? "Drug seizure volumes in 2024 are statistically distinct from 2018 — a measurable six-year shift."
        : "No statistically distinguishable change between 2018 and 2024.",
    verdict: (_s, p) => {
      if (p < 0.01) return { tag: "Strong Relationship", cls: "verdict-strong" };
      if (p < 0.05) return { tag: "Weak Evidence", cls: "verdict-weak" };
      return { tag: "No Evidence", cls: "verdict-none" };
    },
  },
  border_vs_nonborder: {
    title: "Border vs Non-Border States",
    test: "Mann–Whitney U",
    explain: (_s, p) =>
      p < 0.05
        ? "Border states show significantly higher seizure volumes — geographic proximity to source regions is a key driver."
        : "Border classification alone doesn't predict seizure intensity.",
    verdict: (_s, p) => {
      if (p < 0.01) return { tag: "Strong Relationship", cls: "verdict-strong" };
      if (p < 0.05) return { tag: "Weak Evidence", cls: "verdict-weak" };
      return { tag: "No Evidence", cls: "verdict-none" };
    },
  },
};

/* ─── RENDER CARDS ─── */
function renderCards(data, stateLabel = null) {
  const container = document.getElementById("hypothesis-container");
  container.innerHTML = "";

  if (stateLabel) {
    const badge = document.createElement("div");
    badge.className = "state-badge";
    badge.innerHTML = `Showing results for: <strong>${stateLabel}</strong>`;
    container.appendChild(badge);
  }

  const summaryBar = buildSummaryBar(data);
  container.appendChild(summaryBar);

  const grid = document.createElement("div");
  grid.className = "hypothesis-grid";

  Object.entries(data).forEach(([key, val], i) => {
    const meta = HYPOTHESIS_META[key];
    if (!meta) return;

    const stat = val.stat ?? null;
    const p = val.p_value;
    const verdict = meta.verdict(stat, p);

    const card = document.createElement("div");
    card.className = "hyp-card";
    card.style.animationDelay = `${i * 80}ms`;

    card.innerHTML = `
      <div class="hyp-card-header">
        <span class="hyp-icon">${meta?.icon ?? '🔬'}</span>
        <div>
          <h3 class="hyp-title">${meta.title}</h3>
          <span class="hyp-test-label">${meta.test}</span>
        </div>
        <span class="verdict-tag ${verdict.cls}">${verdict.tag}</span>
      </div>

      <div class="hyp-stats">
        ${stat !== null ? `<div class="stat-pill">ρ / stat <strong>${stat.toFixed(3)}</strong></div>` : ""}
        <div class="stat-pill">p-value <strong>${p < 0.001 ? "< 0.001" : p.toFixed(4)}</strong></div>
        <div class="stat-pill sig-pill ${p < 0.05 ? "sig-yes" : "sig-no"}">
          ${p < 0.05 ? "Significant" : "Not Significant"}
        </div>
      </div>

      <div class="p-bar-wrap">
        <div class="p-bar-track">
          <div class="p-bar-fill ${p < 0.05 ? "p-sig" : "p-nosig"}" style="width:${Math.min(100, (1 - p) * 100).toFixed(1)}%"></div>
          <div class="p-threshold"></div>
        </div>
        <span class="p-bar-label">Confidence level</span>
      </div>

      <p class="explain">${meta.explain(stat, p)}</p>
    `;

    grid.appendChild(card);
  });

  container.appendChild(grid);
}

/* ─── SUMMARY BAR ─── */
function buildSummaryBar(data) {
  const total = Object.keys(data).length;
  const significant = Object.values(data).filter((v) => v.p_value < 0.05).length;
  const bar = document.createElement("div");
  bar.className = "summary-bar";
  bar.innerHTML = `
    <div class="sb-item"><span class="sb-num">${total}</span><span class="sb-lbl">Tests Run</span></div>
    <div class="sb-item"><span class="sb-num accent">${significant}</span><span class="sb-lbl">Significant</span></div>
    <div class="sb-item"><span class="sb-num">${total - significant}</span><span class="sb-lbl">Not Significant</span></div>
    <div class="sb-item sb-alpha">α = 0.05</div>
  `;
  return bar;
}

function buildControls() {
  const section = document.querySelector("#page-hypothesis .section");
  if (document.getElementById("hyp-controls")) return;

  const controls = document.createElement("div");
  controls.id = "hyp-controls";
  controls.className = "hyp-controls";
  controls.innerHTML = `
    <div class="hyp-ctrl-group">
      <label>Filter by State (optional)</label>
      <select id="hyp-state-select">
        <option value="">All States (National)</option>
      </select>
    </div>
    <div class="hyp-ctrl-group">
      <label>Year Range</label>
      <select id="hyp-year-select">
        <option value="">All Years</option>
        <option value="2018,2020">2018–2020</option>
        <option value="2021,2024">2021–2024</option>
      </select>
    </div>
    <button class="apply-btn" onclick="runLiveTest()">⚡ Run Live Test</button>
  `;

  const header = section.querySelector(".section-header");
  header.insertAdjacentElement("afterend", controls);

  // ✅ FUNCTION
  async function populateStates() {
    try {
      const res = await fetch("http://127.0.0.1:8000/states");
      const data = await res.json();

      const sel = document.getElementById("hyp-state-select");

      data.states.forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s;
        opt.textContent = s;
        sel.appendChild(opt);
      });

    } catch (err) {
      console.error("Failed to load states:", err);
    }
  }

  // ✅ CALL IT HERE
  populateStates();
}
/* ─── INTERACTIVE CONTROLS ─── */
// function buildControls() {
//   const section = document.querySelector("#page-hypothesis .section");
//   if (document.getElementById("hyp-controls")) return;

//   const controls = document.createElement("div");
//   controls.id = "hyp-controls";
//   controls.className = "hyp-controls";
//   controls.innerHTML = `
//     <div class="hyp-ctrl-group">
//       <label>Filter by State (optional)</label>
//       <select id="hyp-state-select">
//         <option value="">All States (National)</option>
//       </select>
//     </div>
//     <div class="hyp-ctrl-group">
//       <label>Year Range</label>
//       <select id="hyp-year-select">
//         <option value="">All Years</option>
//         <option value="2018,2020">2018–2020</option>
//         <option value="2021,2024">2021–2024</option>
//       </select>
//     </div>
//     <button class="apply-btn" onclick="runLiveTest()">⚡ Run Live Test</button>
//   `;

//   const header = section.querySelector(".section-header");
//   header.insertAdjacentElement("afterend", controls);

//   console.log("RAW_DATA check:", typeof window.RAW_DATA, window.RAW_DATA?.length);

//   // Populate state dropdown from NCB data if available
//   if (typeof window.RAW_DATA !== "undefined") {
//     const states = [...new Set(window.RAW_DATA.map((d) => d.State_UT))].sort();
//     const sel = document.getElementById("hyp-state-select");
//     states.forEach((s) => {
//       const opt = document.createElement("option");
//       opt.value = s;
//       opt.textContent = s;
//       sel.appendChild(opt);
//     });
//   }
// }

/* ─── LIVE TEST (calls backend with optional state/year filter) ─── */
async function runLiveTest() {
  const stateEl = document.getElementById("hyp-state-select");
  const yearEl = document.getElementById("hyp-year-select");
  const state = stateEl?.value || "";
  const yearRange = yearEl?.value || "";

  const btn = document.querySelector("#hyp-controls .apply-btn");
  if (btn) { btn.textContent = "⏳ Running..."; btn.disabled = true; }

  try {
    const params = new URLSearchParams();
    if (state) params.append("state", state);
    if (yearRange) { const [y1, y2] = yearRange.split(","); params.append("year_from", y1); params.append("year_to", y2); }

    const url = `http://127.0.0.1:8000/hypothesis${params.toString() ? "?" + params : ""}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Server error");
    const data = await res.json();

    renderCards(data, state || null);
  } catch (err) {
    document.getElementById("hypothesis-container").innerHTML =
      `<p class="placeholder-text" style="color:#ff6b6b">⚠️ Could not reach backend: ${err.message}</p>`;
  } finally {
    if (btn) { btn.textContent = "⚡ Run Live Test"; btn.disabled = false; }
  }
}

/* ─── ORIGINAL loadHypothesis (kept for Run Tests button) ─── */
async function loadHypothesis() {
  buildControls();
  await runLiveTest();
}

/* ─── CSS (injected once) ─── */
(function injectStyles() {
  if (document.getElementById("hyp-enhanced-css")) return;
  const style = document.createElement("style");
  style.id = "hyp-enhanced-css";
  style.textContent = `
    .hyp-controls {
      display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap;
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px; padding: 20px 24px; margin-bottom: 28px;
    }
    .hyp-ctrl-group { display: flex; flex-direction: column; gap: 6px; }
    .hyp-ctrl-group label { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; opacity: .5; }
    .hyp-ctrl-group select {
      background: #1a1a2e; color: #e0e0e0; border: 1px solid rgba(255,165,0,.3);
      border-radius: 8px; padding: 8px 14px; font-size: 13px; min-width: 200px;
    }
    .state-badge {
      background: rgba(255,165,0,.1); border: 1px solid rgba(255,165,0,.3);
      color: #ffa500; border-radius: 8px; padding: 8px 16px; font-size: 13px;
      margin-bottom: 16px; display: inline-block;
    }
    .summary-bar {
      display: flex; gap: 0; background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;
      overflow: hidden; margin-bottom: 28px;
    }
    .sb-item { flex: 1; text-align: center; padding: 16px 12px; border-right: 1px solid rgba(255,255,255,0.06); }
    .sb-item:last-child { border-right: none; }
    .sb-num { display: block; font-size: 28px; font-weight: 700; font-family: 'Bebas Neue', sans-serif; }
    .sb-num.accent { color: #ffa500; }
    .sb-lbl { font-size: 11px; opacity: .5; text-transform: uppercase; letter-spacing: .08em; }
    .sb-alpha { display: flex; align-items: center; justify-content: center; font-size: 13px; font-family: 'JetBrains Mono', monospace; color: #ffa500; opacity: .7; }

    .hypothesis-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
    .hyp-card {
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px; padding: 24px; animation: fadeUp .4s ease both;
      transition: border-color .2s, transform .2s;
    }
    .hyp-card:hover { border-color: rgba(255,165,0,.4); transform: translateY(-2px); }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }

    .hyp-card-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 18px; }
    .hyp-icon { font-size: 28px; flex-shrink: 0; margin-top: 2px; }
    .hyp-title { font-size: 15px; font-weight: 600; margin: 0 0 3px; }
    .hyp-test-label { font-size: 11px; font-family: 'JetBrains Mono', monospace; opacity: .45; }

    .verdict-tag {
      margin-left: auto; font-size: 11px; font-weight: 600; padding: 5px 10px;
      border-radius: 20px; white-space: nowrap; flex-shrink: 0;
    }
    .verdict-strong { background: rgba(255,100,50,.15); color: #ff6432; border: 1px solid rgba(255,100,50,.3); }
    .verdict-weak   { background: rgba(255,165,0,.12); color: #ffa500; border: 1px solid rgba(255,165,0,.3); }
    .verdict-none   { background: rgba(120,120,120,.12); color: #888; border: 1px solid rgba(120,120,120,.25); }

    .hyp-stats { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
    .stat-pill {
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px; padding: 5px 12px; font-size: 12px; font-family: 'JetBrains Mono', monospace;
      display: flex; gap: 6px; align-items: center;
    }
    .stat-pill strong { color: #ffa500; }
    .sig-yes { background: rgba(50,200,100,.12); border-color: rgba(50,200,100,.3); color: #32c864; }
    .sig-no  { background: rgba(200,50,50,.1);  border-color: rgba(200,50,50,.25); color: #c83232; }

    .p-bar-wrap { margin-bottom: 16px; }
    .p-bar-track {
      position: relative; height: 6px; background: rgba(255,255,255,0.08);
      border-radius: 3px; overflow: visible; margin-bottom: 4px;
    }
    .p-bar-fill { height: 100%; border-radius: 3px; transition: width .6s ease; }
    .p-sig   { background: linear-gradient(90deg, #32c864, #ffa500); }
    .p-nosig { background: rgba(150,150,150,.4); }
    .p-threshold {
      position: absolute; top: -4px; left: 95%; width: 2px; height: 14px;
      background: rgba(255,165,0,.7); border-radius: 1px;
    }
    .p-bar-label { font-size: 10px; opacity: .4; text-transform: uppercase; letter-spacing: .06em; }

    .explain {
      font-size: 13px; line-height: 1.6; opacity: .7; margin: 0;
      border-left: 2px solid rgba(255,165,0,.3); padding-left: 12px;
    }
  `;
  document.head.appendChild(style);
})();