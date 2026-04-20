/* ══════════════════════════════════════
   DrugWatch India — script.js  v2
   Primary metric: Total_Kg (not Total_Quantity which mixes incomparable units)
══════════════════════════════════════ */
let CLUSTER_MAP = {};
// ── PLOTLY SHARED CONFIG ──────────────────────────────
const PL = {
  paper_bgcolor: "rgba(0,0,0,0)",
  plot_bgcolor: "rgba(0,0,0,0)",
  font: { family: "DM Sans, sans-serif", color: "#e2eaf5", size: 12 },
  colorway: [
    "#f97316",
    "#38bdf8",
    "#a3e635",
    "#f43f5e",
    "#c084fc",
    "#fbbf24",
    "#34d399",
  ],
  xaxis: {
    gridcolor: "#1e2d45",
    linecolor: "#1e2d45",
    zerolinecolor: "#1e2d45",
  },
  yaxis: {
    gridcolor: "#1e2d45",
    linecolor: "#1e2d45",
    zerolinecolor: "#1e2d45",
  },
  legend: {
    bgcolor: "rgba(15,22,35,0.9)",
    bordercolor: "#1e2d45",
    borderwidth: 1,
  },
  hoverlabel: {
    bgcolor: "#0f1623",
    bordercolor: "#f97316",
    font: { color: "#e2eaf5" },
  },
  margin: { t: 55, b: 65, l: 70, r: 30 },
};
const PC = {
  responsive: true,
  displayModeBar: true,
  displaylogo: false,
  modeBarButtonsToRemove: ["pan2d", "lasso2d", "select2d", "autoScale2d"],
};

// Drug columns (Kg only — comparable physical weight units)
const DRUG_KG_COLS = [
  { col: "Ganja_Kg", label: "Ganja" },
  { col: "Opium_Kg", label: "Opium" },
  { col: "Hashish_Kg", label: "Hashish" },
  { col: "Heroin_Kg", label: "Heroin" },
  { col: "Poppy_Husk_Straw_Kg", label: "Poppy Husk/Straw" },
  { col: "ATS_Kg", label: "ATS" },
  { col: "MDMA_Kg", label: "MDMA" },
  { col: "Mephedrone_Kg", label: "Mephedrone" },
  { col: "Cocaine_Kg", label: "Cocaine" },
  { col: "Mandrax_Kg", label: "Mandrax" },
  { col: "Ketamine_Kg", label: "Ketamine" },
  { col: "Tablets_Kg", label: "Tablets (Kg)" },
  { col: "Morphine_Kg", label: "Morphine" },
  { col: "LSD_Kg", label: "LSD" },
  { col: "Acetic_Anhydride_Kg", label: "Acetic Anhydride" },
  { col: "Codeine_Kg", label: "Codeine" },
];

const ALL_DRUG_COLS = [
  ...DRUG_KG_COLS,
  { col: "Codeine_Litre", label: "Codeine (L)", unit: "L" },
  { col: "CBCS_Litre", label: "CBCS (L)", unit: "L" },
  { col: "Morphine_Litre", label: "Morphine (L)", unit: "L" },
  { col: "LSD_Blots", label: "LSD Blots", unit: "blots" },
  { col: "Phensidyl_No", label: "Phensidyl", unit: "bottles" },
  { col: "Injection_No", label: "Injections", unit: "units" },
  { col: "CBCS_Bottle", label: "CBCS Bottles", unit: "bottles" },
  { col: "Tablets_No", label: "Tablets (count)", unit: "units" },
];

// ── NAVIGATION ───────────────────────────────────────
document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".nav-btn")
      .forEach((b) => b.classList.remove("active"));
    document
      .querySelectorAll(".page")
      .forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("page-" + btn.dataset.page).classList.add("active");
    if (btn.dataset.page === "statewise" && !window._stateInit) {
      initStateMap();
      window._stateInit = true;
    }
    if (btn.dataset.page === "eda" && !window._edaInit) {
      initEDA();
      window._edaInit = true;
    }
    if (this.dataset.page === "ml") {
      setTimeout(() => {
        initML();
        updateForecast();
      }, 100);
    }
  });
});

// ── BOOT ─────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  populateHeroStats();
  populateFilters();
  renderHome();
  initStateMap();
  window._stateInit = true;
});

// ── HELPERS ──────────────────────────────────────────
const YEARS = [...new Set(RAW_DATA.map((d) => d.Year))].sort((a, b) => a - b);
const STATES = [...new Set(RAW_DATA.map((d) => d.State_UT))].sort();

function sumBy(data, col) {
  return data.reduce((s, d) => s + (d[col] || 0), 0);
}
function groupYear(col) {
  return YEARS.map((y) =>
    sumBy(
      RAW_DATA.filter((d) => d.Year === y),
      col,
    ),
  );
}
function groupState(col) {
  return STATES.map((s) =>
    sumBy(
      RAW_DATA.filter((d) => d.State_UT === s),
      col,
    ),
  );
}

function fmtNum(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toFixed(0);
}

// ── HERO STATS ───────────────────────────────────────
function populateHeroStats() {
  const totalKg = sumBy(RAW_DATA, "Total_Kg");
  const totalCases = sumBy(RAW_DATA, "Total_Cases");
  const totalArrested = sumBy(RAW_DATA, "Total_Arrested");
  [
    { id: "hs-total", num: fmtNum(totalKg), label: "Total Kg Seized" },
    { id: "hs-cases", num: fmtNum(totalCases), label: "Cases Filed" },
    {
      id: "hs-arrested",
      num: fmtNum(totalArrested),
      label: "Persons Arrested",
    },
    { id: "hs-states", num: STATES.length, label: "States & UTs Covered" },
  ].forEach((s) => {
    document.getElementById(s.id).innerHTML =
      `<span class="stat-num">${s.num}</span><span class="stat-label">${s.label}</span>`;
  });
}

// ── FILTERS ──────────────────────────────────────────
function populateFilters() {
  const sf = document.getElementById("stateFilter");
  const yf = document.getElementById("yearFilter");
  STATES.forEach((s) => {
    const o = document.createElement("option");
    o.value = o.text = s;
    sf.appendChild(o);
  });
  YEARS.forEach((y) => {
    const o = document.createElement("option");
    o.value = o.text = y;
    yf.appendChild(o);
  });
}

// ── HOME CHARTS ──────────────────────────────────────
function renderHome() {
  /* ① NATIONAL TREND */
  const kgByYear = groupYear("Total_Kg");
  Plotly.newPlot(
    "home-trend",
    [
      {
        x: YEARS,
        y: kgByYear,
        type: "scatter",
        mode: "lines+markers",
        line: { color: "#f97316", width: 3 },
        marker: {
          size: 9,
          color: "#f97316",
          line: { color: "#fff", width: 2 },
        },
        fill: "tozeroy",
        fillcolor: "rgba(249,115,22,0.1)",
        hovertemplate:
          "<b>Year %{x}</b><br>Seized: %{y:,.0f} Kg<extra></extra>",
      },
    ],
    {
      ...PL,
      title: {
        text: "National Drug Seizure Trend (2018–2024)",
        font: { size: 15 },
      },
      xaxis: { ...PL.xaxis, title: "Year", dtick: 1, tickformat: "d" },
      yaxis: { ...PL.yaxis, title: "Total Weight Seized (Kg)" },
    },
    PC,
  );

  /* ② TOP 10 STATES */
  const stateKg = STATES.map((s) => ({
    s,
    v: sumBy(
      RAW_DATA.filter((d) => d.State_UT === s),
      "Total_Kg",
    ),
  }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 10);

  Plotly.newPlot(
    "home-topstates",
    [
      {
        x: stateKg.map((d) => d.s),
        y: stateKg.map((d) => d.v),
        type: "bar",
        marker: {
          color: stateKg.map((_, i) => `hsl(${195 + i * 14},75%,52%)`),
          opacity: 0.9,
        },
        hovertemplate: "<b>%{x}</b><br>%{y:,.0f} Kg seized<extra></extra>",
      },
    ],
    {
      ...PL,
      title: {
        text: "Top 10 States — Total Seizure Weight (All Years)",
        font: { size: 15 },
      },
      xaxis: { ...PL.xaxis, title: "State / UT", tickangle: -30 },
      yaxis: { ...PL.yaxis, title: "Total Kg Seized (2018–2024)" },
    },
    PC,
  );

  /* ③ BORDER PIE */
  const bKg = sumBy(
    RAW_DATA.filter((d) => d.Border_State),
    "Total_Kg",
  );
  const nbKg = sumBy(
    RAW_DATA.filter((d) => !d.Border_State),
    "Total_Kg",
  );
  Plotly.newPlot(
    "home-border",
    [
      {
        values: [bKg, nbKg],
        labels: ["Border States", "Non-Border States"],
        type: "pie",
        hole: 0.48,
        marker: { colors: ["#f97316", "#38bdf8"] },
        textinfo: "label+percent",
        hovertemplate:
          "<b>%{label}</b><br>%{value:,.0f} Kg (%{percent})<extra></extra>",
      },
    ],
    {
      ...PL,
      title: {
        text: "Border vs Non-Border — Share of Seizures (Kg)",
        font: { size: 15 },
      },
      margin: { t: 55, b: 20, l: 20, r: 20 },
    },
    PC,
  );

  /* ④ TOP DRUGS HORIZONTAL BAR */
  const drugTotals = DRUG_KG_COLS.map((d) => ({
    label: d.label,
    val: sumBy(RAW_DATA, d.col),
  }))
    .filter((d) => d.val > 0)
    .sort((a, b) => b.val - a.val)
    .slice(0, 10);

  Plotly.newPlot(
    "home-drugs",
    [
      {
        y: drugTotals.map((d) => d.label),
        x: drugTotals.map((d) => d.val),
        type: "bar",
        orientation: "h",
        marker: {
          color: drugTotals.map((_, i) => `hsl(${80 + i * 8},70%,55%)`),
          opacity: 0.88,
        },
        hovertemplate: "<b>%{y}</b><br>%{x:,.0f} Kg total<extra></extra>",
      },
    ],
    {
      ...PL,
      title: {
        text: "Top Drug Types by Total Seized Quantity (Kg, 2018–2024)",
        font: { size: 15 },
      },
      xaxis: { ...PL.xaxis, title: "Total Kg Seized (all states, all years)" },
      yaxis: { ...PL.yaxis, title: "Drug / Substance" },
      margin: { ...PL.margin, l: 160 },
    },
    PC,
  );
}

// ── STATE MAP ────────────────────────────────────────
function initStateMap() {
  const sorted = STATES.map((s) => {
    const rows = RAW_DATA.filter((d) => d.State_UT === s);
    return {
      s,
      risk: rows.reduce((sum, d) => sum + d.Risk_Index, 0).toFixed(4),
      kg: sumBy(rows, "Total_Kg"),
      risk_level: CLUSTER_MAP[s] || "Unknown", // ✅ ADD THIS LINE ONLY
    };
  }).sort((a, b) => b.risk - a.risk);

  Plotly.newPlot(
    "india-map",
    [
      {
        type: "bar",
        x: sorted.map((d) => d.s),
        y: sorted.map((d) => parseFloat(d.risk)),
        customdata: sorted.map((d) => d.kg),
        marker: {
          color: sorted.map((d) => parseFloat(d.risk)),
          colorscale: "YlOrRd",
          showscale: true,
          colorbar: {
            title: {
              text: "Risk Index",
              side: "right",
              font: { color: "#5a7291" },
            },
            tickfont: { color: "#5a7291" },
          },
        },
        customdata: sorted.map((d) => d.risk_level),
        customdata2: sorted.map((d) => d.kg),

        hovertemplate:
          "<b>%{x}</b><br>" +
          "Risk Index: %{y:.3f}<br>" +
          "ML Risk: %{customdata}<br>" +
          "Total Kg: %{customdata2:,.0f}<extra></extra>",
      },
    ],
    {
      ...PL,
      title: {
        text: "State Risk Index — Click a bar to load state detail below",
        font: { size: 15 },
      },
      xaxis: {
        ...PL.xaxis,
        title: "State / UT",
        tickangle: -40,
        tickfont: { size: 10 },
      },
      yaxis: { ...PL.yaxis, title: "Cumulative Risk Index (sum 2018–2024)" },
      margin: { t: 55, b: 140, l: 70, r: 90 },
    },
    PC,
  );

  document.getElementById("india-map").on("plotly_click", (data) => {
    const name = data.points[0].x;
    document.getElementById("stateFilter").value = name;
    applyStateFilters();
    document
      .querySelector(".state-controls")
      .scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

// ── STATE DETAIL ─────────────────────────────────────
function applyStateFilters() {
  const state = document.getElementById("stateFilter").value;
  const year = parseInt(document.getElementById("yearFilter").value);
  const row = RAW_DATA.find((d) => d.State_UT === state && d.Year === year);

  document.getElementById("table-state-label").textContent =
    `${state} · ${year}`;

  if (!row) {
    [
      "risk",
      "arrest",
      "growth",
      "diversity",
      "kpi-cases",
      "kpi-arrested",
      "kpi-qty",
      "kpi-border",
      "kpi-coastal",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = "—";
    });
    document.getElementById("drug-table-container").innerHTML =
      '<p class="placeholder-text">No data found for this combination.</p>';
    return;
  }

  const gr = (
    row.Growth_Rate_Pct !== undefined
      ? row.Growth_Rate_Pct
      : row.Growth_Rate * 100
  ).toFixed(1);
  document.getElementById("risk").textContent = row.Risk_Index.toFixed(4);
  document.getElementById("arrest").textContent =
    row.Arrest_Rate.toFixed(2) + "x";
  document.getElementById("growth").textContent = gr + "%";
  document.getElementById("diversity").textContent =
    row.Drug_Diversity + " types";
  document.getElementById("kpi-cases").textContent =
    row.Total_Cases.toLocaleString();
  document.getElementById("kpi-arrested").textContent =
    row.Total_Arrested.toLocaleString();
  document.getElementById("kpi-qty").textContent =
    row.Total_Kg.toLocaleString(undefined, { maximumFractionDigits: 1 }) +
    " Kg";
  document.getElementById("kpi-border").textContent = row.Border_State
    ? " Yes"
    : " No";
  document.getElementById("kpi-coastal").textContent = row.Coastal_State
    ? " Yes"
    : " No";

  // Drug table
  const found = ALL_DRUG_COLS.map((d) => ({
    label: d.label,
    unit: d.unit || "Kg",
    val: row[d.col] || 0,
  }))
    .filter((d) => d.val > 0)
    .sort((a, b) => b.val - a.val);

  document.getElementById("drug-table-container").innerHTML = found.length
    ? `<table class="drug-table">
         <thead><tr><th>#</th><th>Drug / Substance</th><th>Unit</th><th>Quantity Seized</th></tr></thead>
         <tbody>${found
           .map(
             (r, i) => `
           <tr><td>${i + 1}</td><td>${r.label}</td><td>${r.unit}</td>
               <td>${r.val.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td></tr>`,
           )
           .join("")}
         </tbody></table>`
    : '<p class="placeholder-text">No drug quantities recorded for this state/year.</p>';

  // Trend chart
  const rows = RAW_DATA.filter((d) => d.State_UT === state).sort(
    (a, b) => a.Year - b.Year,
  );
  Plotly.newPlot(
    "state-trend",
    [
      {
        x: rows.map((d) => d.Year),
        y: rows.map((d) => d.Total_Kg),
        name: "Total Kg",
        type: "scatter",
        mode: "lines+markers",
        line: { color: "#f97316", width: 3 },
        marker: { size: 9 },
        hovertemplate: "<b>%{x}</b><br>Kg Seized: %{y:,.1f}<extra></extra>",
      },
      {
        x: rows.map((d) => d.Year),
        y: rows.map((d) => d.Total_Cases),
        name: "Cases Filed",
        type: "scatter",
        mode: "lines+markers",
        line: { color: "#38bdf8", width: 2, dash: "dot" },
        marker: { size: 7 },
        yaxis: "y2",
        hovertemplate: "<b>%{x}</b><br>Cases: %{y:,}<extra></extra>",
      },
      {
        x: rows.map((d) => d.Year),
        y: rows.map((d) => d.Total_Arrested),
        name: "Arrested",
        type: "scatter",
        mode: "lines+markers",
        line: { color: "#a3e635", width: 2, dash: "dash" },
        marker: { size: 7 },
        yaxis: "y2",
        hovertemplate: "<b>%{x}</b><br>Arrested: %{y:,}<extra></extra>",
      },
    ],
    {
      ...PL,
      title: {
        text: `${state} — Year-on-Year Performance`,
        font: { size: 15 },
      },
      xaxis: { ...PL.xaxis, title: "Year", dtick: 1, tickformat: "d" },
      yaxis: { ...PL.yaxis, title: "Seizure Weight (Kg)" },
      yaxis2: {
        ...PL.yaxis,
        title: "Cases / Arrests (persons)",
        overlaying: "y",
        side: "right",
      },
      legend: { ...PL.legend, x: 0.01, y: 0.99 },
    },
    PC,
  );
  async function initML() {
    // 🔹 Fetch clustering data
    const res = await fetch("http://127.0.0.1:8000/clusters");
    ML_DATA = await res.json();

    // Group by risk level

    renderML("High Risk"); // 🔥 Add insight text

    document.getElementById("ml-clusters").insertAdjacentHTML(
      "beforeend",
      `<p style="margin-top:10px;">
     ⚠️ <b>${topState.State_UT}</b> has the highest risk with 
     ${Math.round(topState.Total_Kg)} kg seized.
   </p>`,
    );
  }
  function renderML(riskType = "High Risk") {
    document.querySelectorAll(".ml-btn").forEach((btn) => {
      btn.classList.remove("active");

      const btnType = btn.innerText.trim().toLowerCase();

      if (
        (riskType === "High Risk" && btnType === "high") ||
        (riskType === "Medium Risk" && btnType === "medium") ||
        (riskType === "Low Risk" && btnType === "low")
      ) {
        btn.classList.add("active");
      }
    });
    const filtered = ML_DATA.filter((d) => d.risk_level === riskType)
      .sort((a, b) => b.Total_Kg - a.Total_Kg)
      .slice(0, 5);

    Plotly.newPlot(
      "ml-clusters",
      [
        {
          x: filtered.map((d) => d.State_UT),
          y: filtered.map((d) => d.Total_Kg),
          type: "bar",

          hovertemplate:
            "<b>%{x}</b><br>" +
            "Total Seized: %{y:,.0f} kg<br>" +
            `Category: ${riskType}<br>` +
            "<extra></extra>",

          marker: {
            color:
              riskType === "High Risk"
                ? "#3394ef"
                : riskType === "Medium Risk"
                  ? "#facc15"
                  : "#22c55e",
          },
        },
      ],
      {
        ...PL,
        title: {
          text: `Top ${filtered.length} ${riskType} States`,
        },
        xaxis: { title: "State" },
        yaxis: { title: "Total Kg Seized" },
      },
      PC,
    );
    // 🔥 ADD THIS AT THE END
    const topState = filtered[0];

    if (!topState) {
      document.getElementById("ml-insight").innerHTML = "No data available.";
      return;
    }

    const avg =
      ML_DATA.reduce((sum, d) => sum + d.Total_Kg, 0) / ML_DATA.length;

    const pctAbove = ((topState.Total_Kg - avg) / avg) * 100;

    document.getElementById("ml-insight").innerHTML = `
  <b>${topState.State_UT}</b> leads the <b>${riskType}</b> group with 
  <b>${Math.round(topState.Total_Kg).toLocaleString()} kg</b> seized,
  which is <b>${pctAbove.toFixed(1)}%</b> above the national average.
`;
  }
}
