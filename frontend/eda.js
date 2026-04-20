/* ══════════════════════════════════════
   DrugWatch India — eda.js  v2
   All charts use Total_Kg as primary metric.
   Growth_Rate_Pct is pre-clipped percentage.
══════════════════════════════════════ */

// ── EDA INIT ─────────────────────────────────────────
function initEDA() {
  // Category tab switching
  document.querySelectorAll(".eda-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document
        .querySelectorAll(".eda-tab")
        .forEach((t) => t.classList.remove("active"));
      document
        .querySelectorAll(".eda-panel")
        .forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      document
        .getElementById("eda-panel-" + tab.dataset.eda)
        .classList.add("active");
      const key = "_eda_" + tab.dataset.eda;
      if (!window[key]) {
        renderSection(tab.dataset.eda);
        window[key] = true;
      }
    });
  });

  // Sub-chart button switching
  document.querySelectorAll(".eda-chart-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const panel = btn.closest(".eda-panel");
      panel
        .querySelectorAll(".eda-chart-btn")
        .forEach((b) => b.classList.remove("active"));
      panel
        .querySelectorAll(".eda-chart-view")
        .forEach((v) => v.classList.remove("active"));
      btn.classList.add("active");
      panel.querySelector("#" + btn.dataset.chart).classList.add("active");
    });
  });

  // Render first tab immediately
  renderSection("time");
  window._eda_time = true;
}

function renderSection(s) {
  const map = {
    time: "renderTime",
    geo: "renderGeo",
    drug: "renderDrug",
    enforcement: "renderEnforcement",
    border: "renderBorder",
    advanced: "renderAdvanced",
  };
  if (map[s]) {
    window[map[s]]();
    buildInferences(s);
  }
}

// ── SHARED ───────────────────────────────────────────
const L = PL;
const C = PC;

const DKG = [
  { col: "Ganja_Kg", label: "Ganja" },
  { col: "Opium_Kg", label: "Opium" },
  { col: "Hashish_Kg", label: "Hashish" },
  { col: "Heroin_Kg", label: "Heroin" },
  { col: "Poppy_Husk_Straw_Kg", label: "Poppy Husk" },
  { col: "ATS_Kg", label: "ATS" },
  { col: "MDMA_Kg", label: "MDMA" },
  { col: "Mephedrone_Kg", label: "Mephedrone" },
  { col: "Cocaine_Kg", label: "Cocaine" },
  { col: "Mandrax_Kg", label: "Mandrax" },
  { col: "Ketamine_Kg", label: "Ketamine" },
  { col: "Tablets_Kg", label: "Tablets (Kg)" },
  { col: "Morphine_Kg", label: "Morphine" },
  { col: "LSD_Kg", label: "LSD" },
];

// ── TIME-BASED ────────────────────────────────────────
function renderTime() {
  const years = YEARS;
  const kgYr = years.map((y) =>
    sumBy(
      RAW_DATA.filter((d) => d.Year === y),
      "Total_Kg",
    ),
  );
  const casesYr = years.map((y) =>
    sumBy(
      RAW_DATA.filter((d) => d.Year === y),
      "Total_Cases",
    ),
  );

  /* Chart 1 — Total Seizures */
  Plotly.newPlot(
    "chart-time-total",
    [
      {
        x: years,
        y: kgYr,
        type: "scatter",
        mode: "lines+markers",
        name: "Kg Seized",
        line: { color: "#f97316", width: 3 },
        marker: {
          size: 10,
          color: "#f97316",
          line: { color: "#fff", width: 2 },
        },
        fill: "tozeroy",
        fillcolor: "rgba(249,115,22,0.09)",
        hovertemplate:
          "Year: <b>%{x}</b><br>Seized: <b>%{y:,.0f} Kg</b><extra></extra>",
      },
      {
        x: years,
        y: casesYr,
        type: "scatter",
        mode: "lines+markers",
        name: "Cases Filed",
        line: { color: "#38bdf8", width: 2, dash: "dot" },
        marker: { size: 7 },
        yaxis: "y2",
        hovertemplate:
          "Year: <b>%{x}</b><br>Cases: <b>%{y:,}</b><extra></extra>",
      },
    ],
    {
      ...L,
      title: { text: "Total Drug Seizures & Cases Filed by Year" },
      xaxis: {
        ...L.xaxis,
        title: "Year (2018–2024)",
        dtick: 1,
        tickformat: "d",
      },
      yaxis: { ...L.yaxis, title: "Total Seizure Weight (Kg)" },
      yaxis2: {
        ...L.yaxis,
        title: "Number of Cases Filed",
        overlaying: "y",
        side: "right",
      },
      legend: { ...L.legend, x: 0.01, y: 0.99 },
    },
    C,
  );

  /* Chart 2 — Drug-wise trends: top 6 by total Kg */
  const top6 = [...DKG]
    .sort((a, b) => sumBy(RAW_DATA, b.col) - sumBy(RAW_DATA, a.col))
    .slice(0, 6);
  const traces2 = top6.map((d) => ({
    x: years,
    y: years.map((y) =>
      sumBy(
        RAW_DATA.filter((r) => r.Year === y),
        d.col,
      ),
    ),
    name: d.label,
    type: "scatter",
    mode: "lines+markers",
    hovertemplate: `<b>${d.label}</b><br>Year %{x}: %{y:,.1f} Kg<extra></extra>`,
  }));
  Plotly.newPlot(
    "chart-time-drugs",
    traces2,
    {
      ...L,
      title: { text: "Drug-wise Seizure Trends Over Time (Top 6 Substances)" },
      xaxis: { ...L.xaxis, title: "Year", dtick: 1, tickformat: "d" },
      yaxis: { ...L.yaxis, title: "Kg Seized per Year" },
    },
    C,
  );

  /* Chart 3 — Growth Rate (%) */
  const grYr = years.slice(1).map((y) => {
    const rows = RAW_DATA.filter(
      (d) => d.Year === y && d.Growth_Rate_Pct !== undefined,
    );
    if (!rows.length) return 0;
    // Median growth (more robust than mean due to outliers like Ladakh)
    const vals = rows.map((d) => d.Growth_Rate_Pct).sort((a, b) => a - b);
    return vals[Math.floor(vals.length / 2)];
  });
  Plotly.newPlot(
    "chart-time-growth",
    [
      {
        x: years.slice(1),
        y: grYr,
        type: "bar",
        marker: {
          color: grYr.map((v) => (v >= 0 ? "#a3e635" : "#ef4444")),
          opacity: 0.85,
        },
        hovertemplate:
          "Year: <b>%{x}</b><br>Median Growth: <b>%{y:.1f}%</b><extra></extra>",
      },
    ],
    {
      ...L,
      title: { text: "Year-on-Year Median Growth Rate (%) in Seizures" },
      xaxis: { ...L.xaxis, title: "Year", dtick: 1, tickformat: "d" },
      yaxis: {
        ...L.yaxis,
        title: "Median Growth Rate (%) across states",
        zeroline: true,
        zerolinecolor: "#5a7291",
        zerolinewidth: 1,
      },
    },
    C,
  );

  /* Chart 4 — Moving Average */
  const ma3 = kgYr.map((v, i) => {
    const window = kgYr.slice(Math.max(0, i - 1), i + 2);
    return window.reduce((s, x) => s + x, 0) / window.length;
  });
  Plotly.newPlot(
    "chart-time-ma",
    [
      {
        x: years,
        y: kgYr,
        name: "Actual Seizures",
        type: "scatter",
        mode: "lines+markers",
        line: { color: "#38bdf8", width: 2, dash: "dot" },
        marker: { size: 7, color: "#38bdf8" },
        hovertemplate: "Year %{x}: <b>%{y:,.0f} Kg</b><extra></extra>",
      },
      {
        x: years,
        y: ma3,
        name: "3-Year Moving Average",
        type: "scatter",
        mode: "lines",
        line: { color: "#f97316", width: 3 },
        hovertemplate: "Year %{x} MA: <b>%{y:,.0f} Kg</b><extra></extra>",
      },
    ],
    {
      ...L,
      title: { text: "Seizure Trend with 3-Year Moving Average" },
      xaxis: { ...L.xaxis, title: "Year", dtick: 1, tickformat: "d" },
      yaxis: { ...L.yaxis, title: "Seizure Weight (Kg)" },
      legend: { ...L.legend, x: 0.01, y: 0.99 },
    },
    C,
  );
}

// ── GEOGRAPHIC ────────────────────────────────────────
function renderGeo() {
  /* Chart 1 — State risk heatmap */
  const stData = STATES.map((s) => {
    const rows = RAW_DATA.filter((d) => d.State_UT === s);
    return {
      s,
      risk: rows.reduce((sum, d) => sum + d.Risk_Index, 0),
      kg: sumBy(rows, "Total_Kg"),
    };
  }).sort((a, b) => b.risk - a.risk);

  Plotly.newPlot(
    "chart-geo-heat",
    [
      {
        y: stData.map((d) => d.s),
        x: stData.map((d) => d.risk),
        type: "bar",
        orientation: "h",
        customdata: stData.map((d) => d.kg),
        marker: {
          color: stData.map((d) => d.risk),
          colorscale: "YlOrRd",
          showscale: true,
          colorbar: {
            title: { text: "Risk", font: { color: "#5a7291" } },
            tickfont: { color: "#5a7291" },
          },
        },
        hovertemplate:
          "<b>%{y}</b><br>Risk Index: %{x:.3f}<br>Total Kg: %{customdata:,.0f}<extra></extra>",
      },
    ],
    {
      ...L,
      title: {
        text: "Cumulative State Risk Index (Weighted: Kg 40% + Cases 30% + Diversity 30%)",
      },
      xaxis: {
        ...L.xaxis,
        title: "Cumulative Risk Index (sum across 2018–2024)",
      },
      yaxis: { ...L.yaxis, title: "State / UT" },
      margin: { ...L.margin, l: 200 },
      height: 620,
    },
    C,
  );

  /* Chart 2 — Top 10 States bar */
  const top10 = stData.slice(0, 10);
  Plotly.newPlot(
    "chart-geo-top10",
    [
      {
        x: top10.map((d) => d.s),
        y: top10.map((d) => d.kg),
        type: "bar",
        marker: {
          color: top10.map((_, i) => `hsl(${15 + i * 10},80%,52%)`),
          opacity: 0.88,
        },
        hovertemplate:
          "<b>%{x}</b><br>Total Seized: %{y:,.0f} Kg<extra></extra>",
      },
    ],
    {
      ...L,
      title: { text: "Top 10 States — Total Kg Seized (2018–2024)" },
      xaxis: { ...L.xaxis, title: "State / UT", tickangle: -25 },
      yaxis: { ...L.yaxis, title: "Total Kg Seized (cumulative all years)" },
    },
    C,
  );

  /* Chart 3 — State × Year heatmap */
  const zData = STATES.map((s) =>
    YEARS.map((y) => {
      const r = RAW_DATA.find((d) => d.State_UT === s && d.Year === y);
      return r ? r.Total_Kg : 0;
    }),
  );
  Plotly.newPlot(
    "chart-geo-yearstate",
    [
      {
        z: zData,
        x: YEARS,
        y: STATES,
        type: "heatmap",
        colorscale: "YlOrRd",
        hovertemplate:
          "State: <b>%{y}</b><br>Year: <b>%{x}</b><br>Seized: <b>%{z:,.0f} Kg</b><extra></extra>",
        colorbar: {
          title: { text: "Kg", font: { color: "#5a7291" } },
          tickfont: { color: "#5a7291" },
        },
      },
    ],
    {
      ...L,
      title: {
        text: "State × Year Seizure Heatmap (Kg) — Colour = Volume Intensity",
      },
      xaxis: { ...L.xaxis, title: "Year", dtick: 1, tickformat: "d" },
      yaxis: { ...L.yaxis, title: "State / UT", tickfont: { size: 10 } },
      height: 680,
      margin: { ...L.margin, l: 200 },
    },
    C,
  );

  /* Chart 4 — State ranking scatter */
  const ranked = [...stData].sort((a, b) => b.kg - a.kg);
  Plotly.newPlot(
    "chart-geo-rank",
    [
      {
        x: ranked.map((_, i) => i + 1),
        y: ranked.map((d) => d.kg),
        text: ranked.map((d) => d.s),
        mode: "markers+text",
        textposition: "top center",
        textfont: { size: 9, color: "#5a7291" },
        marker: {
          size: ranked.map((d) => Math.max(8, Math.sqrt(d.kg / 500))),
          color: "#38bdf8",
          opacity: 0.7,
          line: { color: "#fff", width: 1 },
        },
        hovertemplate:
          "Rank %{x} — <b>%{text}</b><br>%{y:,.0f} Kg seized<extra></extra>",
      },
    ],
    {
      ...L,
      title: { text: "State Seizure Ranking — Bubble Size ∝ Volume" },
      xaxis: { ...L.xaxis, title: "Rank (1 = most seized)" },
      yaxis: { ...L.yaxis, title: "Total Kg Seized (all years)" },
    },
    C,
  );
}

// ── DRUG PATTERNS ─────────────────────────────────────
function renderDrug() {
  /* Chart 1 — Total distribution */
  const totals = DKG.map((d) => ({
    label: d.label,
    val: sumBy(RAW_DATA, d.col),
  }))
    .filter((d) => d.val > 0)
    .sort((a, b) => b.val - a.val);

  Plotly.newPlot(
    "chart-drug-dist",
    [
      {
        x: totals.map((d) => d.label),
        y: totals.map((d) => d.val),
        type: "bar",
        marker: {
          color: totals.map((_, i) => `hsl(${30 + i * 15},75%,52%)`),
          opacity: 0.88,
        },
        hovertemplate:
          "<b>%{x}</b><br>Total Seized: %{y:,.0f} Kg<extra></extra>",
      },
    ],
    {
      ...L,
      title: { text: "Total Kg Seized by Drug Type (2018–2024, All States)" },
      xaxis: { ...L.xaxis, title: "Drug / Substance", tickangle: -30 },
      yaxis: {
        ...L.yaxis,
        title: "Total Kg Seized (log scale)",
        type: "log",
        tickformat: ".2s",
      },
    },
    C,
  );

  /* Chart 2 — Stacked bar year-wise */
  const top5 = [...DKG]
    .sort((a, b) => sumBy(RAW_DATA, b.col) - sumBy(RAW_DATA, a.col))
    .slice(0, 5);
  const traces2 = top5.map((d) => ({
    name: d.label,
    x: YEARS,
    y: YEARS.map((y) =>
      sumBy(
        RAW_DATA.filter((r) => r.Year === y),
        d.col,
      ),
    ),
    type: "bar",
    hovertemplate: `<b>${d.label}</b><br>%{x}: %{y:,.0f} Kg<extra></extra>`,
  }));
  Plotly.newPlot(
    "chart-drug-stacked",
    traces2,
    {
      ...L,
      title: {
        text: "Year-wise Drug Seizure Composition (Top 5 Substances, Stacked)",
      },
      barmode: "stack",
      xaxis: { ...L.xaxis, title: "Year", dtick: 1, tickformat: "d" },
      yaxis: { ...L.yaxis, title: "Total Kg Seized (all states combined)" },
    },
    C,
  );

  /* Chart 3 — Drug correlation heatmap */
  const activeDrugs = DKG.filter((d) => sumBy(RAW_DATA, d.col) > 100).slice(
    0,
    9,
  );
  const pearson = (a, b) => {
    const ma = a.reduce((s, v) => s + v, 0) / a.length,
      mb = b.reduce((s, v) => s + v, 0) / b.length;
    const num = a.reduce((s, _, i) => s + (a[i] - ma) * (b[i] - mb), 0);
    const da = Math.sqrt(a.reduce((s, v) => s + (v - ma) ** 2, 0));
    const db = Math.sqrt(b.reduce((s, v) => s + (v - mb) ** 2, 0));
    return da * db === 0 ? 0 : +(num / (da * db)).toFixed(3);
  };
  const vecs = activeDrugs.map((d) => RAW_DATA.map((r) => r[d.col] || 0));
  const corr = vecs.map((a) => vecs.map((b) => pearson(a, b)));
  const labs = activeDrugs.map((d) => d.label);
  Plotly.newPlot(
    "chart-drug-corr",
    [
      {
        z: corr,
        x: labs,
        y: labs,
        type: "heatmap",
        colorscale: "RdBu",
        zmid: 0,
        zmin: -1,
        zmax: 1,
        text: corr.map((row) => row.map((v) => v.toFixed(2))),
        texttemplate: "%{text}",
        textfont: { size: 10 },
        hovertemplate: "%{y} × %{x}<br>Pearson r = %{z:.3f}<extra></extra>",
        colorbar: {
          title: { text: "r", font: { color: "#5a7291" } },
          tickfont: { color: "#5a7291" },
        },
      },
    ],
    {
      ...L,
      title: {
        text: "Drug Seizure Correlation Matrix (Pearson r) — 1 = perfectly correlated",
      },
      xaxis: { ...L.xaxis, title: "Drug / Substance", tickangle: -35 },
      yaxis: { ...L.yaxis, title: "Drug / Substance" },
      margin: { ...L.margin, l: 140, b: 130 },
    },
    C,
  );

  /* Chart 4 — Drug diversity histogram */
  Plotly.newPlot(
    "chart-drug-diversity",
    [
      {
        x: RAW_DATA.map((d) => d.Drug_Diversity),
        type: "histogram",
        nbinsx: 14,
        marker: {
          color: "#a3e635",
          opacity: 0.82,
          line: { color: "#0f1623", width: 1 },
        },
        hovertemplate:
          "Diversity Score %{x}<br>Count: %{y} state-year records<extra></extra>",
      },
    ],
    {
      ...L,
      title: {
        text: "Drug Diversity Score Distribution — How Many Drug Types per State-Year?",
      },
      xaxis: {
        ...L.xaxis,
        title: "Drug Diversity Score (# of drug types with seizures > 0)",
        dtick: 1,
      },
      yaxis: { ...L.yaxis, title: "Number of State-Year Records" },
    },
    C,
  );
}

// ── ENFORCEMENT ───────────────────────────────────────
function renderEnforcement() {
  /* Chart 1 — Scatter cases vs arrested */
  Plotly.newPlot(
    "chart-enf-scatter",
    [
      {
        x: RAW_DATA.map((d) => d.Total_Cases),
        y: RAW_DATA.map((d) => d.Total_Arrested),
        text: RAW_DATA.map((d) => `${d.State_UT} ${d.Year}`),
        mode: "markers",
        marker: {
          color: RAW_DATA.map((d) => d.Risk_Index),
          colorscale: "Plasma",
          opacity: 0.72,
          size: 9,
          colorbar: {
            title: { text: "Risk", font: { color: "#5a7291" } },
            tickfont: { color: "#5a7291" },
          },
        },
        hovertemplate:
          "<b>%{text}</b><br>Cases: %{x:,}<br>Arrested: %{y:,}<extra></extra>",
      },
    ],
    {
      ...L,
      title: {
        text: "Cases Filed vs Persons Arrested — Each Point = One State-Year",
      },
      xaxis: { ...L.xaxis, title: "Total Cases Filed (count)" },
      yaxis: { ...L.yaxis, title: "Total Persons Arrested (count)" },
    },
    C,
  );

  /* Chart 2 — Arrest rate distribution */
  const rates = RAW_DATA.map((d) => d.Arrest_Rate).filter(
    (r) => r > 0 && r < 5,
  );
  Plotly.newPlot(
    "chart-enf-dist",
    [
      {
        x: rates,
        type: "histogram",
        nbinsx: 25,
        marker: {
          color: "#38bdf8",
          opacity: 0.82,
          line: { color: "#0f1623", width: 1 },
        },
        hovertemplate:
          "Arrest Rate: %{x:.2f}x<br>Count: %{y} records<extra></extra>",
      },
    ],
    {
      ...L,
      title: {
        text: "Distribution of Arrest Rate Across All State-Year Records",
      },
      xaxis: {
        ...L.xaxis,
        title: "Arrest Rate (Persons Arrested ÷ Cases Filed)",
      },
      yaxis: { ...L.yaxis, title: "Number of State-Year Records" },
    },
    C,
  );

  /* Chart 3 — State-wise avg arrest rate */
  const stRates = STATES.map((s) => {
    const rows = RAW_DATA.filter(
      (d) => d.State_UT === s && d.Arrest_Rate > 0 && d.Arrest_Rate < 5,
    );
    return {
      s,
      r: rows.length
        ? rows.reduce((sum, d) => sum + d.Arrest_Rate, 0) / rows.length
        : 0,
    };
  }).sort((a, b) => b.r - a.r);

  Plotly.newPlot(
    "chart-enf-state",
    [
      {
        y: stRates.map((d) => d.s),
        x: stRates.map((d) => d.r),
        type: "bar",
        orientation: "h",
        marker: {
          color: stRates.map((d) =>
            d.r >= 2 ? "#ef4444" : d.r >= 1.5 ? "#f97316" : "#38bdf8",
          ),
          opacity: 0.88,
        },
        hovertemplate:
          "<b>%{y}</b><br>Avg Arrest Rate: %{x:.2f}x<extra></extra>",
      },
    ],
    {
      ...L,
      title: {
        text: "Average Arrest Rate by State (2018–2024) — Red > 2x, Orange 1.5–2x, Blue < 1.5x",
      },
      xaxis: { ...L.xaxis, title: "Average Arrest Rate (Arrested ÷ Cases)" },
      yaxis: { ...L.yaxis, title: "State / UT" },
      margin: { ...L.margin, l: 200 },
      height: 620,
    },
    C,
  );

  /* Chart 4 — Enforcement trend */
  const natCases = YEARS.map((y) =>
    sumBy(
      RAW_DATA.filter((d) => d.Year === y),
      "Total_Cases",
    ),
  );
  const natArr = YEARS.map((y) =>
    sumBy(
      RAW_DATA.filter((d) => d.Year === y),
      "Total_Arrested",
    ),
  );
  Plotly.newPlot(
    "chart-enf-trend",
    [
      {
        x: YEARS,
        y: natCases,
        name: "Cases Filed",
        type: "scatter",
        mode: "lines+markers",
        line: { color: "#38bdf8", width: 3 },
        marker: { size: 9 },
        hovertemplate: "Year %{x}<br>Cases: %{y:,}<extra></extra>",
      },
      {
        x: YEARS,
        y: natArr,
        name: "Persons Arrested",
        type: "scatter",
        mode: "lines+markers",
        line: { color: "#f97316", width: 3 },
        marker: { size: 9 },
        hovertemplate: "Year %{x}<br>Arrested: %{y:,}<extra></extra>",
      },
    ],
    {
      ...L,
      title: {
        text: "National Enforcement Trend — Cases Filed vs Persons Arrested by Year",
      },
      xaxis: { ...L.xaxis, title: "Year", dtick: 1, tickformat: "d" },
      yaxis: { ...L.yaxis, title: "Count (Cases / Persons Arrested)" },
      legend: { ...L.legend, x: 0.01, y: 0.99 },
    },
    C,
  );
}

// ── BORDER & COASTAL ─────────────────────────────────
function renderBorder() {
  /* Chart 1 — Border vs Non-border dual pie */
  const bKg = sumBy(
    RAW_DATA.filter((d) => d.Border_State),
    "Total_Kg",
  );
  const nKg = sumBy(
    RAW_DATA.filter((d) => !d.Border_State),
    "Total_Kg",
  );
  const bC = sumBy(
    RAW_DATA.filter((d) => d.Border_State),
    "Total_Cases",
  );
  const nC = sumBy(
    RAW_DATA.filter((d) => !d.Border_State),
    "Total_Cases",
  );
  Plotly.newPlot(
    "chart-bord-pie",
    [
      {
        type: "pie",
        values: [bKg, nKg],
        labels: ["Border", "Non-Border"],
        hole: 0.45,
        marker: { colors: ["#f97316", "#38bdf8"] },
        domain: { x: [0, 0.45] },
        textinfo: "label+percent",
        hovertemplate:
          "<b>%{label}</b><br>%{value:,.0f} Kg (%{percent})<extra></extra>",
      },
      {
        type: "pie",
        values: [bC, nC],
        labels: ["Border", "Non-Border"],
        hole: 0.45,
        marker: { colors: ["#f97316", "#38bdf8"] },
        domain: { x: [0.55, 1] },
        showlegend: false,
        textinfo: "label+percent",
        hovertemplate:
          "<b>%{label}</b><br>%{value:,} cases (%{percent})<extra></extra>",
      },
    ],
    {
      ...L,
      title: {
        text: "Border vs Non-Border States — Left: Seizure Weight (Kg) | Right: Cases Filed",
      },
      annotations: [
        {
          x: 0.22,
          y: 0.5,
          text: "Kg Seized",
          showarrow: false,
          font: { color: "#5a7291", size: 12 },
        },
        {
          x: 0.78,
          y: 0.5,
          text: "Cases Filed",
          showarrow: false,
          font: { color: "#5a7291", size: 12 },
        },
      ],
      margin: { t: 60, b: 20, l: 20, r: 20 },
    },
    C,
  );

  /* Chart 2 — Coastal comparison by year */
  const coastalYr = YEARS.map((y) => ({
    c: sumBy(
      RAW_DATA.filter((d) => d.Year === y && d.Coastal_State),
      "Total_Kg",
    ),
    n: sumBy(
      RAW_DATA.filter((d) => d.Year === y && !d.Coastal_State),
      "Total_Kg",
    ),
  }));
  Plotly.newPlot(
    "chart-bord-coastal",
    [
      {
        x: YEARS,
        y: coastalYr.map((d) => d.c),
        name: "Coastal States",
        type: "bar",
        marker: { color: "#38bdf8", opacity: 0.85 },
        hovertemplate: "Year %{x}<br>Coastal: %{y:,.0f} Kg<extra></extra>",
      },
      {
        x: YEARS,
        y: coastalYr.map((d) => d.n),
        name: "Non-Coastal States",
        type: "bar",
        marker: { color: "#a3e635", opacity: 0.85 },
        hovertemplate: "Year %{x}<br>Non-Coastal: %{y:,.0f} Kg<extra></extra>",
      },
    ],
    {
      ...L,
      title: {
        text: "Coastal vs Non-Coastal States — Annual Seizure Comparison (Kg)",
      },
      barmode: "group",
      xaxis: { ...L.xaxis, title: "Year", dtick: 1, tickformat: "d" },
      yaxis: { ...L.yaxis, title: "Total Kg Seized" },
    },
    C,
  );

  /* Chart 3 — Combined 4-category comparison */
  const cats = ["Border+Coastal", "Border Only", "Coastal Only", "Neither"];
  const catKg = [0, 0, 0, 0],
    catCases = [0, 0, 0, 0];
  RAW_DATA.forEach((d) => {
    const i =
      d.Border_State && d.Coastal_State
        ? 0
        : d.Border_State
          ? 1
          : d.Coastal_State
            ? 2
            : 3;
    catKg[i] += d.Total_Kg;
    catCases[i] += d.Total_Cases;
  });
  Plotly.newPlot(
    "chart-bord-combo",
    [
      {
        x: cats,
        y: catKg,
        name: "Kg Seized",
        type: "bar",
        marker: {
          color: ["#ef4444", "#f97316", "#38bdf8", "#5a7291"],
          opacity: 0.88,
        },
        hovertemplate: "<b>%{x}</b><br>%{y:,.0f} Kg seized<extra></extra>",
      },
      {
        x: cats,
        y: catCases,
        name: "Cases Filed",
        type: "bar",
        marker: {
          color: ["#ef4444", "#f97316", "#38bdf8", "#5a7291"],
          opacity: 0.5,
        },
        yaxis: "y2",
        hovertemplate: "<b>%{x}</b><br>%{y:,} cases<extra></extra>",
      },
    ],
    {
      ...L,
      title: {
        text: "Combined Geographic Risk Zone Analysis — Seizures (Kg) and Cases by Zone Type",
      },
      barmode: "group",
      xaxis: { ...L.xaxis, title: "Geographic Zone Classification" },
      yaxis: { ...L.yaxis, title: "Total Kg Seized" },
      yaxis2: {
        ...L.yaxis,
        title: "Cases Filed",
        overlaying: "y",
        side: "right",
      },
      legend: { ...L.legend, x: 0.01, y: 0.99 },
    },
    C,
  );
}

// ── ADVANCED ─────────────────────────────────────────
function renderAdvanced() {
  /* Chart 1 — Box plots: top 8 states */
  const stByKg = STATES.map((s) => ({
    s,
    vals: RAW_DATA.filter((d) => d.State_UT === s).map((d) => d.Total_Kg),
  }))
    .sort(
      (a, b) =>
        b.vals.reduce((s, v) => s + v, 0) - a.vals.reduce((s, v) => s + v, 0),
    )
    .slice(0, 8);

  Plotly.newPlot(
    "chart-adv-box",
    stByKg.map((d) => ({
      y: d.vals,
      name: d.s.length > 14 ? d.s.slice(0, 14) + "…" : d.s,
      type: "box",
      boxpoints: "all",
      jitter: 0.35,
      pointpos: 0,
      marker: { size: 5, opacity: 0.6 },
    })),
    {
      ...L,
      title: {
        text: "Seizure Weight Distribution — Top 8 States (Each dot = 1 year)",
      },
      xaxis: { ...L.xaxis, title: "State / UT" },
      yaxis: { ...L.yaxis, title: "Total Kg Seized per Year" },
      showlegend: false,
    },
    C,
  );

  /* Chart 2 — Growth hotspots */
  const hotspots = STATES.map((s) => {
    const rows = RAW_DATA.filter(
      (d) =>
        d.State_UT === s &&
        d.Growth_Rate_Pct !== undefined &&
        Math.abs(d.Growth_Rate_Pct) < 500,
    );
    if (!rows.length) return { s, gr: 0, yr: "-" };
    const peak = rows.reduce(
      (best, d) => (d.Growth_Rate_Pct > best.Growth_Rate_Pct ? d : best),
      rows[0],
    );
    return { s, gr: peak.Growth_Rate_Pct, yr: peak.Year };
  })
    .sort((a, b) => b.gr - a.gr)
    .slice(0, 15);

  Plotly.newPlot(
    "chart-adv-hotspot",
    [
      {
        x: hotspots.map((d) => d.s),
        y: hotspots.map((d) => d.gr),
        text: hotspots.map((d) => `Peak: ${d.yr}`),
        type: "bar",
        marker: {
          color: hotspots.map((d) => d.gr),
          colorscale: "YlOrRd",
          showscale: true,
          colorbar: {
            title: { text: "Growth%", font: { color: "#5a7291" } },
            tickfont: { color: "#5a7291" },
          },
        },
        hovertemplate:
          "<b>%{x}</b><br>Peak Growth: %{y:.1f}%<br>%{text}<extra></extra>",
      },
    ],
    {
      ...L,
      title: {
        text: "Growth Hotspots — Top 15 States by Peak Year-on-Year Growth Rate (%)",
      },
      xaxis: { ...L.xaxis, title: "State / UT", tickangle: -30 },
      yaxis: { ...L.yaxis, title: "Peak YoY Growth Rate (%)" },
    },
    C,
  );

  /* Chart 3 — Anomaly detection (z-score) */
  const kgAll = RAW_DATA.map((d) => d.Total_Kg);
  const mean = kgAll.reduce((s, v) => s + v, 0) / kgAll.length;
  const std = Math.sqrt(
    kgAll.reduce((s, v) => s + (v - mean) ** 2, 0) / kgAll.length,
  );
  const withZ = RAW_DATA.map((d) => ({ ...d, z: (d.Total_Kg - mean) / std }));
  const normal = withZ.filter((d) => Math.abs(d.z) <= 2);
  const anomalies = withZ.filter((d) => Math.abs(d.z) > 2);

  Plotly.newPlot(
    "chart-adv-anomaly",
    [
      {
        x: normal.map((d) => d.Year),
        y: normal.map((d) => d.Total_Kg),
        text: normal.map((d) => d.State_UT),
        mode: "markers",
        name: "Normal (|z| ≤ 2)",
        marker: { color: "#38bdf8", size: 7, opacity: 0.5 },
        hovertemplate:
          "<b>%{text}</b><br>Year %{x}: %{y:,.0f} Kg<extra></extra>",
      },
      {
        x: anomalies.map((d) => d.Year),
        y: anomalies.map((d) => d.Total_Kg),
        text: anomalies.map((d) => `${d.State_UT} (z=${d.z.toFixed(1)})`),
        mode: "markers+text",
        name: "Anomaly (|z| > 2)",
        textposition: "top center",
        textfont: { size: 9, color: "#ef4444" },
        marker: { color: "#ef4444", size: 14, symbol: "star", opacity: 0.92 },
        hovertemplate:
          "<b>%{text}</b><br>Year %{x}: %{y:,.0f} Kg<extra></extra>",
      },
    ],
    {
      ...L,
      title: {
        text: "Anomaly Detection — Statistical Outliers in Seizure Volume (Z-Score Method)",
      },
      xaxis: { ...L.xaxis, title: "Year", dtick: 1, tickformat: "d" },
      yaxis: {
        ...L.yaxis,
        title: "Total Kg Seized (anomalous records marked in red ★)",
      },
      legend: { ...L.legend, x: 0.01, y: 0.99 },
    },
    C,
  );
}

// ── INFERENCES ────────────────────────────────────────
const INFERENCES = {
  time: [
    {
      tag: "obs",
      title: "Rising National Trend Post-2019",
      body: "Total Kg seizures hit a local peak in 2018, dipped in 2019, then climbed steadily through 2021 — the highest single-year total — before stabilizing. This confirms escalating enforcement activity.",
    },
    {
      tag: "reason",
      title: "COVID-19 Disruption Then Rebound",
      body: "The 2019–2020 period coincides with COVID-19 lockdowns disrupting trafficking logistics. The sharp post-2020 rebound suggests suppressed trafficking resumed aggressively once restrictions eased.",
    },
    {
      tag: "impact",
      title: "Ganja Dominates All Drug Trends",
      body: "Ganja accounts for the single largest seizure volume every year by a wide margin. Its growth trajectory outpaces all synthetic drugs, signalling widespread domestic cultivation networks.",
    },
    {
      tag: "obs",
      title: "Median Growth Rate Shows Real Volatility",
      body: "Year-on-year median growth rates swing between strongly negative and strongly positive years, reflecting that national seizure trends are driven by a few high-volume state events rather than uniform nationwide patterns.",
    },
    {
      tag: "reason",
      title: "Moving Average Confirms Upward Baseline",
      body: "The 3-year MA smooths out single-year spikes and confirms the baseline seizure volume is definitively trending upward — indicating either increased trafficking or improved enforcement, likely both.",
    },
  ],
  geo: [
    {
      tag: "obs",
      title: "Rajasthan & Odisha Lead by Kg",
      body: "Rajasthan and Odisha collectively dominate seizure volumes, driven by mass Poppy Husk and Ganja seizures. These states top cumulative Kg rankings despite not being typically perceived as drug hotspots.",
    },
    {
      tag: "reason",
      title: "Northwest + Northeast Corridor Logic",
      body: "Punjab, Jammu & Kashmir, and Northeast states (Manipur, Mizoram) reflect the Golden Crescent and Golden Triangle smuggling corridors, both of which funnel heroin and synthetic drugs into India.",
    },
    {
      tag: "impact",
      title: "Persistent vs Emerging Hotspots",
      body: "The State × Year heatmap reveals Punjab, Rajasthan, and Odisha are persistent high-volume states year after year, while Andhra Pradesh and Maharashtra show rising intensity in recent years.",
    },
    {
      tag: "obs",
      title: "Geographic Concentration is Extreme",
      body: "The bubble ranking chart shows a heavy Pareto effect — the top 5 states account for the majority of national seizure volume, while 20+ states contribute marginal quantities.",
    },
    {
      tag: "reason",
      title: "Risk Index vs Volume Tell Different Stories",
      body: "A state with high Risk Index is not always the highest by raw Kg — the index weights case counts and drug diversity, which highlights states with multi-drug trafficking activity even at lower absolute volumes.",
    },
  ],
  drug: [
    {
      tag: "obs",
      title: "Ganja is Dominant by an Order of Magnitude",
      body: "Ganja seizures exceed all other drug categories combined. The log-scale bar chart makes this visible — on a linear scale, all other drugs appear negligible next to Ganja.",
    },
    {
      tag: "reason",
      title: "Synthetic Drugs Growing in Share",
      body: "The stacked composition chart shows ATS, MDMA, and Mephedrone growing their year-wise share post-2020. Synthetic drugs are easier to manufacture domestically and harder to intercept at borders.",
    },
    {
      tag: "impact",
      title: "Correlation Matrix Reveals Trafficking Co-routes",
      body: "Heroin and Opium show moderate positive correlation — they share trafficking routes through the Golden Crescent. Synthetic drugs (MDMA, Mephedrone) cluster separately, indicating independent supply chains.",
    },
    {
      tag: "obs",
      title: "Most State-Years Show Low Drug Diversity",
      body: "The diversity histogram peaks at 2–4 drug types per state-year. High-diversity records (8+ types) are rare and concentrated in border states — these are multi-drug trafficking hubs with diverse product mix.",
    },
  ],
  enforcement: [
    {
      tag: "obs",
      title: "Arrests Typically Exceed Cases (Rate > 1)",
      body: "The average arrest rate is ~1.48x, meaning nearly 1.5 persons are arrested per case filed. This reflects gang/network prosecutions where multiple accused are charged per case.",
    },
    {
      tag: "reason",
      title: "High Variance in Enforcement Efficiency",
      body: "The arrest rate distribution has significant spread. Some states achieve 2–3x rates (intensive investigations), while others cluster near 1x (single-perpetrator surface-level enforcement).",
    },
    {
      tag: "impact",
      title: "Cases and Arrests Rise in Parallel Nationally",
      body: "The enforcement trend chart shows cases and arrests growing together, suggesting enforcement capacity has broadly scaled with trafficking. No major divergence points to systemic enforcement degradation.",
    },
    {
      tag: "obs",
      title: "Scatter Reveals Operation-Driven Outliers",
      body: "Points far from the trend line in the Cases vs Arrested scatter represent extraordinary enforcement events — large-scale busts where many persons are arrested from a single coordinated case.",
    },
  ],
  border: [
    {
      tag: "obs",
      title: "Border States Drive Over 50% of Seizure Volume",
      body: "Border states account for more than half of total Kg seized nationally, confirming that cross-border smuggling is the dominant supply mechanism rather than domestic production.",
    },
    {
      tag: "reason",
      title: "Coastal States Underperform Relative to Risk",
      body: "Coastal states show lower-than-expected seizure volumes given India's long coastline. Maritime trafficking may be harder to intercept, pointing to enforcement gaps at sea ports and informal landing sites.",
    },
    {
      tag: "impact",
      title: "Dual-Risk States (Border+Coastal) are Critical Nodes",
      body: "States that are simultaneously border and coastal (e.g., Gujarat, West Bengal) face compound trafficking pressure — both land and sea routes converge here, making them the highest-priority enforcement zones.",
    },
    {
      tag: "obs",
      title: "Inland States Have Significant Seizures Too",
      body: 'The "Neither" category still reports substantial Kg — driven by domestic Ganja cultivation in states like Odisha and Jharkhand. Internal production chains exist independent of border-entry trafficking.',
    },
  ],
  advanced: [
    {
      tag: "obs",
      title: "Heavy-Tailed Distribution — Few Events Dominate",
      body: "Box plots for top states show extreme right-skew with high-outlier years. A single extraordinary bust year can contribute more to a state's total than all its other years combined.",
    },
    {
      tag: "reason",
      title: "Pareto Effect in State Seizure Volumes",
      body: "The anomaly chart visually confirms that a handful of state-year records account for disproportionate national volume. These are not random — they correspond to large-scale coordinated enforcement operations.",
    },
    {
      tag: "impact",
      title: "Z-Score Anomalies Identify Events Worth Investigating",
      body: "Statistical outliers (|z| > 2) pinpoint specific state-years that deviate sharply from expected patterns. Each represents either a major trafficking surge, a landmark enforcement operation, or a data anomaly requiring verification.",
    },
    {
      tag: "obs",
      title: "Growth Hotspots Are Geographically Diverse",
      body: "Peak growth years differ across states with no single year dominating all states simultaneously — confirming that local factors (enforcement leadership, supply disruptions, policy changes) drive state-level spikes more than national events.",
    },
  ],
};

function buildInferences(section) {
  const container = document.getElementById("inf-" + section);
  if (!container || !INFERENCES[section]) return;
  container.innerHTML = INFERENCES[section]
    .map(
      (inf) => `
    <div class="inference-card">
      <div class="inf-header">
        <span class="inf-tag ${inf.tag}">${inf.tag.toUpperCase()}</span>
        <span class="inf-title">${inf.title}</span>
      </div>
      <p class="inf-body">${inf.body}</p>
    </div>`,
    )
    .join("");
}
