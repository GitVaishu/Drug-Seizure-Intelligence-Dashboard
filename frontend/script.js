/* ══════════════════════════════════════
   DrugWatch India — script.js
   Handles: Nav, Home, State Analysis
══════════════════════════════════════ */

const PLOTLY_LAYOUT = {
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'transparent',
  font: { family: 'DM Sans, sans-serif', color: '#e2eaf5', size: 12 },
  colorway: ['#f97316','#38bdf8','#a3e635','#f43f5e','#c084fc','#fbbf24','#34d399'],
  xaxis: { gridcolor: '#1e2d45', linecolor: '#1e2d45', zerolinecolor: '#1e2d45' },
  yaxis: { gridcolor: '#1e2d45', linecolor: '#1e2d45', zerolinecolor: '#1e2d45' },
  legend: { bgcolor: 'transparent', bordercolor: '#1e2d45' },
  margin: { t: 50, b: 50, l: 60, r: 30 }
};

const PLOTLY_CONFIG = { responsive: true, displayModeBar: false };

// Drug columns that hold Kg quantities (not units)
const DRUG_KG_COLS = [
  'Acetic_Anhydride_Kg','ATS_Kg','Anthralic_Acid_Kg','Cocaine_Kg','Codeine_Kg',
  'Ephedrine_Kg','Fentanyl_HCL_Kg','Ganja_Kg','Hashish_Kg','Hashish_Oil_Kg',
  'Heroin_Kg','Ketamine_Kg','Khat_Leaves_Kg','LSD_Kg','MDMA_Kg','Mephedrone_Kg',
  'Mescaline_Kg','Mandrax_Kg','Morphine_Kg','Opium_Kg','Poppy_Husk_Straw_Kg','Tablets_Kg'
];
const DRUG_LITRE_COLS = ['Codeine_Litre','CBCS_Litre','Morphine_Litre'];
const DRUG_UNIT_COLS  = ['LSD_Blots','Phensidyl_No','Injection_No','CBCS_Bottle','Tablets_No'];

// ── NAVIGATION ──────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('page-' + btn.dataset.page).classList.add('active');

    // Lazy init charts per page
    if (btn.dataset.page === 'home' && !window._homeRendered) { renderHome(); window._homeRendered = true; }
    if (btn.dataset.page === 'statewise' && !window._stateRendered) { initStateMap(); window._stateRendered = true; }
    if (btn.dataset.page === 'eda' && !window._edaRendered) { initEDA(); window._edaRendered = true; }
  });
});

// ── INIT ────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  populateHeroStats();
  populateFilters();
  renderHome();
  window._homeRendered = true;
  initStateMap();
  window._stateRendered = true;
});

// ── HERO STATS ──────────────────────────────────────
function populateHeroStats() {
  const totalQty = RAW_DATA.reduce((s, d) => s + d.Total_Quantity, 0);
  const totalCases = RAW_DATA.reduce((s, d) => s + d.Total_Cases, 0);
  const totalArrested = RAW_DATA.reduce((s, d) => s + d.Total_Arrested, 0);
  const states = new Set(RAW_DATA.map(d => d.State_UT)).size;

  function fmt(n) {
    if (n >= 1e6) return (n/1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n/1e3).toFixed(1) + 'K';
    return n.toFixed(0);
  }

  const stats = [
    { id: 'hs-total',    num: fmt(totalQty),      label: 'Total Seizure Qty' },
    { id: 'hs-cases',    num: fmt(totalCases),     label: 'Total Cases Filed' },
    { id: 'hs-arrested', num: fmt(totalArrested),  label: 'Total Arrested' },
    { id: 'hs-states',   num: states,              label: 'States & UTs' },
  ];

  stats.forEach(s => {
    document.getElementById(s.id).innerHTML =
      `<span class="stat-num">${s.num}</span><span class="stat-label">${s.label}</span>`;
  });
}

// ── FILTERS ─────────────────────────────────────────
function populateFilters() {
  const states = [...new Set(RAW_DATA.map(d => d.State_UT))].sort();
  const years  = [...new Set(RAW_DATA.map(d => d.Year))].sort();

  const sf = document.getElementById('stateFilter');
  const yf = document.getElementById('yearFilter');
  states.forEach(s => { const o = document.createElement('option'); o.value = o.text = s; sf.appendChild(o); });
  years.forEach(y  => { const o = document.createElement('option'); o.value = o.text = y; yf.appendChild(o); });
}

// ── HOME CHARTS ─────────────────────────────────────
function renderHome() {
  // 1) Total seizures trend
  const years  = [...new Set(RAW_DATA.map(d => d.Year))].sort();
  const totals = years.map(y => RAW_DATA.filter(d => d.Year === y).reduce((s,d) => s + d.Total_Quantity, 0));

  Plotly.newPlot('home-trend', [{
    x: years, y: totals, type: 'scatter', mode: 'lines+markers',
    line: { color: '#f97316', width: 3 },
    marker: { size: 8, color: '#f97316' },
    fill: 'tozeroy', fillcolor: 'rgba(249,115,22,0.1)',
    name: 'Total Seizure Qty'
  }], { ...PLOTLY_LAYOUT, title: 'National Seizure Trend (2018–2024)' }, PLOTLY_CONFIG);

  // 2) Top 10 states
  const stateTotals = {};
  RAW_DATA.forEach(d => { stateTotals[d.State_UT] = (stateTotals[d.State_UT]||0) + d.Total_Quantity; });
  const top10 = Object.entries(stateTotals).sort((a,b)=>b[1]-a[1]).slice(0,10);

  Plotly.newPlot('home-topstates', [{
    x: top10.map(s=>s[0]), y: top10.map(s=>s[1]),
    type: 'bar', marker: { color: '#38bdf8', opacity: 0.85 }
  }], { ...PLOTLY_LAYOUT, title: 'Top 10 States by Seizure Quantity',
    xaxis: { ...PLOTLY_LAYOUT.xaxis, tickangle: -30 } }, PLOTLY_CONFIG);

  // 3) Border vs Non-Border pie
  let border = 0, nonBorder = 0;
  RAW_DATA.forEach(d => { if(d.Border_State) border += d.Total_Quantity; else nonBorder += d.Total_Quantity; });
  Plotly.newPlot('home-border', [{
    values: [border, nonBorder], labels: ['Border States', 'Non-Border States'],
    type: 'pie', hole: 0.5,
    marker: { colors: ['#f97316','#38bdf8'] },
    textinfo: 'label+percent',
    textfont: { color: '#e2eaf5' }
  }], { ...PLOTLY_LAYOUT, title: 'Border vs Non-Border Seizure Share' }, PLOTLY_CONFIG);

  // 4) Drug type totals
  const drugTotals = DRUG_KG_COLS.map(col => ({
    name: col.replace('_Kg','').replace(/_/g,' '),
    val: RAW_DATA.reduce((s,d)=>s+d[col],0)
  })).filter(d=>d.val>0).sort((a,b)=>b.val-a.val).slice(0,10);

  Plotly.newPlot('home-drugs', [{
    y: drugTotals.map(d=>d.name), x: drugTotals.map(d=>d.val),
    type: 'bar', orientation: 'h',
    marker: { color: '#a3e635', opacity: 0.85 }
  }], { ...PLOTLY_LAYOUT, title: 'Top Drug Types by Seized Quantity (Kg)',
    margin: { ...PLOTLY_LAYOUT.margin, l: 160 }
  }, PLOTLY_CONFIG);
}

// ── STATE MAP ────────────────────────────────────────
function initStateMap() {
  // Aggregate risk by state across all years
  const stateRisk = {};
  const stateQty  = {};
  RAW_DATA.forEach(d => {
    stateRisk[d.State_UT] = (stateRisk[d.State_UT]||0) + d.Risk_Index;
    stateQty[d.State_UT]  = (stateQty[d.State_UT]||0)  + d.Total_Quantity;
  });

  const states = Object.keys(stateRisk);
  const risks  = states.map(s => stateRisk[s]);

  // Plotly choropleth using geojson-lite location names - use a bar chart as India map proxy
  // Since Plotly requires specific geojson for India states, we use a visual bar map
  const sorted = states.map((s,i) => ({ state: s, risk: risks[i], qty: stateQty[s] }))
    .sort((a,b) => b.risk - a.risk);

  Plotly.newPlot('india-map', [{
    type: 'bar',
    x: sorted.map(d => d.state),
    y: sorted.map(d => d.risk),
    marker: {
      color: sorted.map(d => d.risk),
      colorscale: [[0,'#0ea5e9'],[0.5,'#f97316'],[1,'#ef4444']],
      showscale: true,
      colorbar: { title: 'Risk Index', tickfont: { color:'#5a7291' }, titlefont: { color:'#5a7291' } }
    },
    text: sorted.map(d => d.state),
    hovertemplate: '<b>%{x}</b><br>Risk Index: %{y:.3f}<extra></extra>',
    name: ''
  }], {
    ...PLOTLY_LAYOUT,
    title: 'State Risk Index (Click bar to select state)',
    xaxis: { ...PLOTLY_LAYOUT.xaxis, tickangle: -45, tickfont: { size: 10 } },
    margin: { ...PLOTLY_LAYOUT.margin, b: 120 }
  }, PLOTLY_CONFIG);

  // Click on bar → select state in dropdown
  document.getElementById('india-map').on('plotly_click', data => {
    const stateName = data.points[0].x;
    const sf = document.getElementById('stateFilter');
    sf.value = stateName;
    applyStateFilters();
    // Scroll to controls
    document.querySelector('.state-controls').scrollIntoView({ behavior: 'smooth' });
  });
}

// ── STATE FILTERS ────────────────────────────────────
function applyStateFilters() {
  const state = document.getElementById('stateFilter').value;
  const year  = parseInt(document.getElementById('yearFilter').value);
  const row   = RAW_DATA.find(d => d.State_UT === state && d.Year === year);

  document.getElementById('table-state-label').textContent = `${state} · ${year}`;

  if (!row) {
    ['risk','arrest','growth','diversity','kpi-cases','kpi-arrested','kpi-qty','kpi-border','kpi-coastal']
      .forEach(id => document.getElementById(id).textContent = '—');
    document.getElementById('drug-table-container').innerHTML =
      '<p class="placeholder-text">No data for selected combination.</p>';
    return;
  }

  // KPIs
  document.getElementById('risk').textContent     = row.Risk_Index.toFixed(4);
  document.getElementById('arrest').textContent   = row.Arrest_Rate.toFixed(2);
  document.getElementById('growth').textContent   = (row.Growth_Rate * 100).toFixed(1) + '%';
  document.getElementById('diversity').textContent= row.Drug_Diversity;
  document.getElementById('kpi-cases').textContent    = row.Total_Cases.toLocaleString();
  document.getElementById('kpi-arrested').textContent = row.Total_Arrested.toLocaleString();
  document.getElementById('kpi-qty').textContent      = row.Total_Quantity.toLocaleString();
  document.getElementById('kpi-border').textContent   = row.Border_State ? '✅ Yes' : '❌ No';
  document.getElementById('kpi-coastal').textContent  = row.Coastal_State ? '✅ Yes' : '❌ No';

  // Drug table
  const allDrugCols = [...DRUG_KG_COLS, ...DRUG_LITRE_COLS, ...DRUG_UNIT_COLS];
  const rows = allDrugCols
    .map(col => ({ drug: col.replace(/_/g,' '), value: row[col], col }))
    .filter(r => r.value > 0)
    .sort((a,b) => b.value - a.value);

  if (rows.length === 0) {
    document.getElementById('drug-table-container').innerHTML =
      '<p class="placeholder-text">No drug quantities recorded for this state/year.</p>';
  } else {
    const unit = col => DRUG_LITRE_COLS.includes(col) ? 'L' : DRUG_UNIT_COLS.includes(col) ? 'units' : 'kg';
    const html = `
      <table class="drug-table">
        <thead><tr><th>#</th><th>Drug / Substance</th><th>Unit</th><th>Quantity Seized</th></tr></thead>
        <tbody>
          ${rows.map((r,i) => `
            <tr>
              <td>${i+1}</td>
              <td>${r.drug}</td>
              <td>${unit(r.col)}</td>
              <td>${r.value.toLocaleString(undefined, {maximumFractionDigits:2})}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;
    document.getElementById('drug-table-container').innerHTML = html;
  }

  // State trend chart (all years for selected state)
  const stateRows = RAW_DATA.filter(d => d.State_UT === state).sort((a,b) => a.Year - b.Year);
  Plotly.newPlot('state-trend', [
    {
      x: stateRows.map(d=>d.Year),
      y: stateRows.map(d=>d.Total_Quantity),
      name: 'Total Quantity',
      type: 'scatter', mode: 'lines+markers',
      line: { color: '#f97316', width: 3 },
      marker: { size: 8 }
    },
    {
      x: stateRows.map(d=>d.Year),
      y: stateRows.map(d=>d.Total_Cases),
      name: 'Total Cases',
      type: 'scatter', mode: 'lines+markers',
      line: { color: '#38bdf8', width: 2, dash: 'dot' },
      marker: { size: 6 },
      yaxis: 'y2'
    }
  ], {
    ...PLOTLY_LAYOUT,
    title: `${state} — Year-over-Year Trend`,
    yaxis:  { ...PLOTLY_LAYOUT.yaxis, title: 'Seizure Quantity' },
    yaxis2: { ...PLOTLY_LAYOUT.yaxis, title: 'Cases', overlaying: 'y', side: 'right' },
    legend: { ...PLOTLY_LAYOUT.legend, x: 0.01, y: 0.99 }
  }, PLOTLY_CONFIG);
}
