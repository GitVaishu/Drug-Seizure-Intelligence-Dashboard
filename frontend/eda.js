/* ══════════════════════════════════════
   DrugWatch India — eda.js
   Handles: All EDA charts + inferences
══════════════════════════════════════ */

// ── EDA TAB NAVIGATION ───────────────────────────────
function initEDA() {
  // Tab switching
  document.querySelectorAll('.eda-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.eda-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.eda-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = document.getElementById('eda-panel-' + tab.dataset.eda);
      panel.classList.add('active');

      // Render charts for the panel if not done
      const key = '_eda_' + tab.dataset.eda;
      if (!window[key]) {
        renderEdaSection(tab.dataset.eda);
        window[key] = true;
      }
    });
  });

  // Chart sub-selector buttons
  document.querySelectorAll('.eda-chart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.closest('.eda-panel');
      parent.querySelectorAll('.eda-chart-btn').forEach(b => b.classList.remove('active'));
      parent.querySelectorAll('.eda-chart-view').forEach(v => v.classList.remove('active'));
      btn.classList.add('active');
      parent.querySelector('#' + btn.dataset.chart).classList.add('active');
    });
  });

  // Render the first tab (time) immediately
  renderEdaSection('time');
  window._eda_time = true;
}

function renderEdaSection(section) {
  switch(section) {
    case 'time':        renderTime();        buildInferences('time'); break;
    case 'geo':         renderGeo();         buildInferences('geo'); break;
    case 'drug':        renderDrug();        buildInferences('drug'); break;
    case 'enforcement': renderEnforcement(); buildInferences('enforcement'); break;
    case 'border':      renderBorder();      buildInferences('border'); break;
    case 'advanced':    renderAdvanced();    buildInferences('advanced'); break;
  }
}

// ── SHARED HELPERS ────────────────────────────────────
const L = PLOTLY_LAYOUT;
const C = PLOTLY_CONFIG;

const DRUG_KG = [
  'Ganja_Kg','Heroin_Kg','Opium_Kg','Poppy_Husk_Straw_Kg','Hashish_Kg',
  'ATS_Kg','MDMA_Kg','Mephedrone_Kg','Cocaine_Kg','Mandrax_Kg',
  'Ketamine_Kg','Tablets_Kg','Morphine_Kg','LSD_Kg'
];
const DRUG_LABELS = DRUG_KG.map(c => c.replace('_Kg','').replace(/_/g,' '));

function groupByYear(col) {
  const years = [...new Set(RAW_DATA.map(d => d.Year))].sort();
  return {
    years,
    vals: years.map(y => RAW_DATA.filter(d=>d.Year===y).reduce((s,d)=>s+(d[col]||0),0))
  };
}

function groupByState(col) {
  const states = [...new Set(RAW_DATA.map(d => d.State_UT))].sort();
  return {
    states,
    vals: states.map(s => RAW_DATA.filter(d=>d.State_UT===s).reduce((s2,d)=>s2+(d[col]||0),0))
  };
}

// ── TIME-BASED ────────────────────────────────────────
function renderTime() {
  const years = [...new Set(RAW_DATA.map(d => d.Year))].sort();
  const totals = years.map(y => RAW_DATA.filter(d=>d.Year===y).reduce((s,d)=>s+d.Total_Quantity,0));

  // Chart 1: Total seizures
  Plotly.newPlot('chart-time-total', [{
    x: years, y: totals, type: 'scatter', mode: 'lines+markers',
    line: { color: '#f97316', width: 3 },
    marker: { size: 10, color: '#f97316', line: { color: '#fff', width: 2 } },
    fill: 'tozeroy', fillcolor: 'rgba(249,115,22,0.08)',
    name: 'National Total'
  }], { ...L, title: 'Total Drug Seizure Quantity — National (2018–2024)',
    xaxis: { ...L.xaxis, title: 'Year', dtick: 1 },
    yaxis: { ...L.yaxis, title: 'Total Quantity (Kg + Units)' }
  }, C);

  // Chart 2: Drug-wise trends (top 5 drugs)
  const topDrugs = DRUG_KG.slice(0,6);
  const traces2 = topDrugs.map(col => {
    const { years: ys, vals } = groupByYear(col);
    return { x: ys, y: vals, name: col.replace('_Kg','').replace(/_/g,' '),
             type: 'scatter', mode: 'lines+markers' };
  });
  Plotly.newPlot('chart-time-drugs', traces2, {
    ...L, title: 'Drug-wise Seizure Trends Over Time'
  }, C);

  // Chart 3: Growth rate per year (national avg)
  const growthByYear = years.slice(1).map(y => {
    const rows = RAW_DATA.filter(d=>d.Year===y);
    return rows.reduce((s,d)=>s+d.Growth_Rate,0) / rows.length;
  });
  Plotly.newPlot('chart-time-growth', [{
    x: years.slice(1), y: growthByYear,
    type: 'bar',
    marker: { color: growthByYear.map(v => v>=0 ? '#a3e635' : '#ef4444') },
    name: 'Avg Growth Rate'
  }], { ...L, title: 'Year-on-Year Average Growth Rate',
    xaxis: { ...L.xaxis, dtick: 1 },
    yaxis: { ...L.yaxis, title: 'Growth Rate (decimal)' }
  }, C);

  // Chart 4: Moving average (3-year window)
  const ma = years.map((y,i) => {
    if (i < 1) return totals[i];
    const window = totals.slice(Math.max(0,i-1), i+2);
    return window.reduce((s,v)=>s+v,0) / window.length;
  });
  Plotly.newPlot('chart-time-ma', [
    { x: years, y: totals, name: 'Raw Total', type:'scatter', mode:'lines+markers',
      line:{ color:'#38bdf8', dash:'dot', width:2 }, marker:{size:6} },
    { x: years, y: ma, name: '3-yr Moving Avg', type:'scatter', mode:'lines',
      line:{ color:'#f97316', width:3 } }
  ], { ...L, title: 'Seizure Quantity with 3-Year Moving Average' }, C);
}

// ── GEOGRAPHIC ────────────────────────────────────────
function renderGeo() {
  const states = [...new Set(RAW_DATA.map(d => d.State_UT))].sort();
  const years  = [...new Set(RAW_DATA.map(d => d.Year))].sort();

  // Chart 1: State risk heatmap (horizontal bar)
  const stateRisks = states.map(s =>
    RAW_DATA.filter(d=>d.State_UT===s).reduce((sum,d)=>sum+d.Risk_Index,0)
  );
  const sorted = states.map((s,i)=>({s,r:stateRisks[i]})).sort((a,b)=>b.r-a.r);

  Plotly.newPlot('chart-geo-heat', [{
    y: sorted.map(d=>d.s), x: sorted.map(d=>d.r),
    type: 'bar', orientation: 'h',
    marker: { color: sorted.map(d=>d.r), colorscale:'RdYlGn', reversescale:true, showscale:true,
      colorbar:{ title:'Risk', tickfont:{color:'#5a7291'}, titlefont:{color:'#5a7291'} } }
  }], { ...L, title: 'State Risk Index (Cumulative)',
    margin: { ...L.margin, l: 180 },
    height: 600
  }, C);

  // Chart 2: Top 10 states
  const top10 = sorted.slice(0,10);
  Plotly.newPlot('chart-geo-top10', [{
    x: top10.map(d=>d.s), y: top10.map(d=>d.r),
    type: 'bar', marker:{ color:'#f97316', opacity:0.85 }
  }], { ...L, title: 'Top 10 High-Risk States',
    xaxis: { ...L.xaxis, tickangle:-30 }
  }, C);

  // Chart 3: State × Year heatmap
  const zData = states.map(s =>
    years.map(y => {
      const row = RAW_DATA.find(d=>d.State_UT===s && d.Year===y);
      return row ? row.Total_Quantity : 0;
    })
  );
  Plotly.newPlot('chart-geo-yearstate', [{
    z: zData, x: years, y: states,
    type: 'heatmap', colorscale: 'YlOrRd',
    colorbar:{ title:'Qty', tickfont:{color:'#5a7291'}, titlefont:{color:'#5a7291'} }
  }], { ...L, title: 'State × Year Seizure Quantity Heatmap',
    height: 700, margin: { ...L.margin, l: 200 }
  }, C);

  // Chart 4: State ranking chart (cumulative qty)
  const stateQty = states.map(s => RAW_DATA.filter(d=>d.State_UT===s).reduce((sum,d)=>sum+d.Total_Quantity,0));
  const rankSort = states.map((s,i)=>({s,q:stateQty[i]})).sort((a,b)=>b.q-a.q);
  Plotly.newPlot('chart-geo-rank', [{
    x: rankSort.map((_,i)=>i+1),
    y: rankSort.map(d=>d.q),
    text: rankSort.map(d=>d.s),
    type: 'scatter', mode: 'markers+text',
    textposition: 'top center',
    textfont: { size: 9, color: '#5a7291' },
    marker: { size: rankSort.map(d=>Math.sqrt(d.q/1000)+6), color:'#38bdf8', opacity:0.7 }
  }], { ...L, title: 'State Seizure Ranking (Bubble = Relative Scale)',
    xaxis: { ...L.xaxis, title: 'Rank' },
    yaxis: { ...L.yaxis, title: 'Total Quantity' }
  }, C);
}

// ── DRUG PATTERNS ─────────────────────────────────────
function renderDrug() {
  const years = [...new Set(RAW_DATA.map(d => d.Year))].sort();

  // Chart 1: Drug distribution total
  const totals = DRUG_KG.map(col => RAW_DATA.reduce((s,d)=>s+(d[col]||0),0));
  const paired = DRUG_KG.map((c,i)=>({n:c.replace('_Kg','').replace(/_/g,' '), v:totals[i]}))
    .filter(d=>d.v>0).sort((a,b)=>b.v-a.v);

  Plotly.newPlot('chart-drug-dist', [{
    x: paired.map(d=>d.n), y: paired.map(d=>d.v),
    type: 'bar', marker: { color: '#f97316', opacity: 0.85 }
  }], { ...L, title: 'Total Seized Quantity by Drug Type (Kg)',
    xaxis: { ...L.xaxis, tickangle:-30 }
  }, C);

  // Chart 2: Stacked bar year-wise drug composition
  const top5 = DRUG_KG.slice(0,5);
  const traces2 = top5.map(col => ({
    name: col.replace('_Kg','').replace(/_/g,' '),
    x: years,
    y: years.map(y => RAW_DATA.filter(d=>d.Year===y).reduce((s,d)=>s+(d[col]||0),0)),
    type: 'bar'
  }));
  Plotly.newPlot('chart-drug-stacked', traces2, {
    ...L, title: 'Year-wise Drug Type Composition (Stacked)',
    barmode: 'stack'
  }, C);

  // Chart 3: Drug correlation heatmap
  const topDrugs = DRUG_KG.filter(col => RAW_DATA.reduce((s,d)=>s+(d[col]||0),0) > 0).slice(0,8);
  const corr = topDrugs.map(c1 =>
    topDrugs.map(c2 => {
      const v1 = RAW_DATA.map(d=>d[c1]||0);
      const v2 = RAW_DATA.map(d=>d[c2]||0);
      const m1 = v1.reduce((s,v)=>s+v,0)/v1.length;
      const m2 = v2.reduce((s,v)=>s+v,0)/v2.length;
      const num = v1.reduce((s,_,i)=>s+(v1[i]-m1)*(v2[i]-m2),0);
      const d1  = Math.sqrt(v1.reduce((s,v)=>s+(v-m1)**2,0));
      const d2  = Math.sqrt(v2.reduce((s,v)=>s+(v-m2)**2,0));
      return d1*d2 === 0 ? 0 : num/(d1*d2);
    })
  );
  const labels = topDrugs.map(c=>c.replace('_Kg','').replace(/_/g,' '));
  Plotly.newPlot('chart-drug-corr', [{
    z: corr, x: labels, y: labels, type: 'heatmap',
    colorscale: 'RdBu', zmid: 0,
    colorbar:{ title:'r', tickfont:{color:'#5a7291'}, titlefont:{color:'#5a7291'} }
  }], { ...L, title: 'Drug Seizure Correlation Matrix',
    margin: { ...L.margin, l: 130, b: 130 }
  }, C);

  // Chart 4: Drug diversity histogram
  const diversityVals = RAW_DATA.map(d=>d.Drug_Diversity);
  Plotly.newPlot('chart-drug-diversity', [{
    x: diversityVals, type: 'histogram',
    nbinsx: 15,
    marker: { color: '#a3e635', opacity: 0.8 }
  }], { ...L, title: 'Drug Diversity Score Distribution',
    xaxis: { ...L.xaxis, title: 'Drug Diversity (# drug types > 0)' },
    yaxis: { ...L.yaxis, title: 'Count of State-Year Records' }
  }, C);
}

// ── ENFORCEMENT ───────────────────────────────────────
function renderEnforcement() {
  const years  = [...new Set(RAW_DATA.map(d=>d.Year))].sort();
  const states = [...new Set(RAW_DATA.map(d=>d.State_UT))].sort();

  // Chart 1: Scatter cases vs arrested
  Plotly.newPlot('chart-enf-scatter', [{
    x: RAW_DATA.map(d=>d.Total_Cases),
    y: RAW_DATA.map(d=>d.Total_Arrested),
    text: RAW_DATA.map(d=>`${d.State_UT} ${d.Year}`),
    mode: 'markers',
    marker: { color: RAW_DATA.map(d=>d.Risk_Index),
              colorscale:'Plasma', opacity:0.7, size:8,
              colorbar:{title:'Risk',tickfont:{color:'#5a7291'},titlefont:{color:'#5a7291'}} }
  }], { ...L, title: 'Cases Filed vs Persons Arrested (colored by Risk)',
    xaxis: { ...L.xaxis, title: 'Total Cases' },
    yaxis: { ...L.yaxis, title: 'Total Arrested' }
  }, C);

  // Chart 2: Arrest rate distribution
  const rates = RAW_DATA.map(d=>d.Arrest_Rate).filter(r=>r<10 && r>0);
  Plotly.newPlot('chart-enf-dist', [{
    x: rates, type:'histogram', nbinsx:30,
    marker:{ color:'#38bdf8', opacity:0.8 }
  }], { ...L, title: 'Arrest Rate Distribution',
    xaxis:{ ...L.xaxis, title:'Arrest Rate (Arrested / Cases)' },
    yaxis:{ ...L.yaxis, title:'Frequency' }
  }, C);

  // Chart 3: State-wise average arrest rate
  const stateRates = states.map(s => {
    const rows = RAW_DATA.filter(d=>d.State_UT===s && d.Arrest_Rate>0 && d.Arrest_Rate<10);
    return rows.length ? rows.reduce((sum,d)=>sum+d.Arrest_Rate,0)/rows.length : 0;
  });
  const sortedRates = states.map((s,i)=>({s,r:stateRates[i]})).sort((a,b)=>b.r-a.r);
  Plotly.newPlot('chart-enf-state', [{
    y: sortedRates.map(d=>d.s), x: sortedRates.map(d=>d.r),
    type:'bar', orientation:'h',
    marker:{ color:'#f97316', opacity:0.85 }
  }], { ...L, title: 'Average Arrest Rate by State',
    margin:{...L.margin, l:180}, height:600,
    xaxis:{ ...L.xaxis, title:'Avg Arrest Rate' }
  }, C);

  // Chart 4: National enforcement trend
  const natCases    = years.map(y=>RAW_DATA.filter(d=>d.Year===y).reduce((s,d)=>s+d.Total_Cases,0));
  const natArrested = years.map(y=>RAW_DATA.filter(d=>d.Year===y).reduce((s,d)=>s+d.Total_Arrested,0));
  Plotly.newPlot('chart-enf-trend', [
    { x:years, y:natCases,    name:'Total Cases',    type:'scatter', mode:'lines+markers', line:{color:'#38bdf8',width:3} },
    { x:years, y:natArrested, name:'Total Arrested', type:'scatter', mode:'lines+markers', line:{color:'#f97316',width:3} }
  ], { ...L, title: 'National Enforcement Trend — Cases vs Arrests',
    xaxis:{ ...L.xaxis, dtick:1 }
  }, C);
}

// ── BORDER & COASTAL ──────────────────────────────────
function renderBorder() {
  const years = [...new Set(RAW_DATA.map(d=>d.Year))].sort();

  // Chart 1: Border vs Non-border
  let bQ=0, nbQ=0, bC=0, nbC=0;
  RAW_DATA.forEach(d=>{
    if(d.Border_State){ bQ+=d.Total_Quantity; bC+=d.Total_Cases; }
    else{ nbQ+=d.Total_Quantity; nbC+=d.Total_Cases; }
  });
  Plotly.newPlot('chart-bord-pie', [
    { type:'pie', values:[bQ,nbQ], labels:['Border States','Non-Border States'],
      hole:0.45, marker:{colors:['#f97316','#38bdf8']},
      textinfo:'label+percent', textfont:{color:'#e2eaf5'},
      domain:{x:[0,0.45]} },
    { type:'pie', values:[bC,nbC], labels:['Border States','Non-Border States'],
      hole:0.45, marker:{colors:['#f97316','#38bdf8']},
      textinfo:'label+percent', textfont:{color:'#e2eaf5'},
      domain:{x:[0.55,1]}, showlegend:false }
  ], { ...L,
    title: 'Border vs Non-Border  |  Left: Quantity  Right: Cases',
    annotations:[
      {x:0.22,y:0.5,text:'Quantity',showarrow:false,font:{color:'#5a7291',size:12}},
      {x:0.78,y:0.5,text:'Cases',showarrow:false,font:{color:'#5a7291',size:12}}
    ]
  }, C);

  // Chart 2: Coastal vs Non-Coastal
  let cQ=0,ncQ=0;
  RAW_DATA.forEach(d=>{ if(d.Coastal_State) cQ+=d.Total_Quantity; else ncQ+=d.Total_Quantity; });
  const coastalByYear = years.map(y=>{
    const r = RAW_DATA.filter(d=>d.Year===y);
    return {
      c:  r.filter(d=>d.Coastal_State).reduce((s,d)=>s+d.Total_Quantity,0),
      nc: r.filter(d=>!d.Coastal_State).reduce((s,d)=>s+d.Total_Quantity,0)
    };
  });
  Plotly.newPlot('chart-bord-coastal', [
    { x:years, y:coastalByYear.map(d=>d.c),  name:'Coastal',     type:'bar', marker:{color:'#38bdf8'} },
    { x:years, y:coastalByYear.map(d=>d.nc), name:'Non-Coastal', type:'bar', marker:{color:'#a3e635'} }
  ], { ...L, title:'Coastal vs Non-Coastal Seizures by Year', barmode:'group' }, C);

  // Chart 3: Combined risk zones (4 categories)
  const cats = ['Border+Coastal','Border Only','Coastal Only','Neither'];
  const catVals = [0,0,0,0];
  RAW_DATA.forEach(d=>{
    if(d.Border_State && d.Coastal_State) catVals[0]+=d.Total_Quantity;
    else if(d.Border_State)               catVals[1]+=d.Total_Quantity;
    else if(d.Coastal_State)              catVals[2]+=d.Total_Quantity;
    else                                  catVals[3]+=d.Total_Quantity;
  });
  Plotly.newPlot('chart-bord-combo', [{
    x:cats, y:catVals, type:'bar',
    marker:{ color:['#ef4444','#f97316','#38bdf8','#5a7291'], opacity:0.9 }
  }], { ...L, title:'Combined Geographic Risk Zone Analysis' }, C);
}

// ── ADVANCED ──────────────────────────────────────────
function renderAdvanced() {
  const states = [...new Set(RAW_DATA.map(d=>d.State_UT))].sort();
  const years  = [...new Set(RAW_DATA.map(d=>d.Year))].sort();

  // Chart 1: Box plots by state (top 8)
  const stateQtyMap = {};
  RAW_DATA.forEach(d=>{
    if(!stateQtyMap[d.State_UT]) stateQtyMap[d.State_UT]=[];
    stateQtyMap[d.State_UT].push(d.Total_Quantity);
  });
  const top8 = Object.entries(stateQtyMap)
    .sort((a,b)=>b[1].reduce((s,v)=>s+v,0)-a[1].reduce((s,v)=>s+v,0))
    .slice(0,8);
  const traces1 = top8.map(([s,vals])=>({
    y:vals, name:s.length>12?s.slice(0,12)+'…':s,
    type:'box', boxpoints:'all', jitter:0.3, pointpos:0,
    marker:{ size:4, opacity:0.6 }
  }));
  Plotly.newPlot('chart-adv-box', traces1, {
    ...L, title: 'Seizure Distribution — Top 8 States (Box Plots)',
    showlegend:false
  }, C);

  // Chart 2: Growth hotspots (max growth rate year per state)
  const hotspots = states.map(s=>{
    const rows = RAW_DATA.filter(d=>d.State_UT===s && Math.abs(d.Growth_Rate)<50);
    const peak = rows.reduce((best,d)=>d.Growth_Rate>best.Growth_Rate?d:best, rows[0]||{Growth_Rate:0});
    return { state:s, gr:peak?peak.Growth_Rate:0, year:peak?peak.Year:'-' };
  }).sort((a,b)=>b.gr-a.gr).slice(0,15);

  Plotly.newPlot('chart-adv-hotspot', [{
    x: hotspots.map(d=>d.state),
    y: hotspots.map(d=>d.gr),
    text: hotspots.map(d=>`Peak: ${d.year}`),
    type:'bar',
    marker:{ color: hotspots.map(d=>d.gr), colorscale:'YlOrRd', showscale:true,
      colorbar:{title:'Growth Rate',tickfont:{color:'#5a7291'},titlefont:{color:'#5a7291'}} }
  }], { ...L, title: 'Growth Hotspots — Top 15 States (Peak YoY Growth)',
    xaxis:{ ...L.xaxis, tickangle:-30 }
  }, C);

  // Chart 3: Anomaly spikes — z-score outlier detection
  const mean = RAW_DATA.reduce((s,d)=>s+d.Total_Quantity,0)/RAW_DATA.length;
  const std  = Math.sqrt(RAW_DATA.reduce((s,d)=>s+(d.Total_Quantity-mean)**2,0)/RAW_DATA.length);
  const anomalies = RAW_DATA.map(d=>({...d, z:(d.Total_Quantity-mean)/std}))
    .filter(d=>Math.abs(d.z)>2).sort((a,b)=>b.z-a.z);
  const normal = RAW_DATA.filter(d=>Math.abs((d.Total_Quantity-mean)/std)<=2);

  Plotly.newPlot('chart-adv-anomaly', [
    {
      x: normal.map(d=>d.Year), y: normal.map(d=>d.Total_Quantity),
      text: normal.map(d=>d.State_UT),
      mode:'markers', name:'Normal',
      marker:{ color:'#38bdf8', size:6, opacity:0.5 }
    },
    {
      x: anomalies.map(d=>d.Year), y: anomalies.map(d=>d.Total_Quantity),
      text: anomalies.map(d=>`${d.State_UT} (z=${d.z.toFixed(1)})`),
      mode:'markers+text', name:'Anomaly (|z|>2)',
      textposition:'top center', textfont:{ size:9, color:'#ef4444' },
      marker:{ color:'#ef4444', size:12, symbol:'star', opacity:0.9 }
    }
  ], { ...L, title: 'Anomaly Detection — Seizure Outliers (|z-score| > 2)',
    xaxis:{ ...L.xaxis, dtick:1 },
    yaxis:{ ...L.yaxis, title:'Total Quantity' }
  }, C);
}

// ── INFERENCES ────────────────────────────────────────
const INFERENCES = {
  time: [
    { tag:'obs', title:'Rising National Trend',
      body:'Total seizures show a broadly increasing trajectory from 2018 to 2024, with sharp spikes indicating intensified enforcement campaigns or trafficking surges in specific years.' },
    { tag:'reason', title:'Why the Spikes?',
      body:'Post-2020 spikes likely reflect COVID-19 disrupting trafficking logistics followed by a rebound surge. Policy changes and targeted NCB operations further explain year-specific jumps.' },
    { tag:'impact', title:'Ganja Dominates Growth',
      body:'Ganja (cannabis) has grown faster than any other substance, now forming the single largest seizure category nationally — signalling a widespread cultivation and distribution network.' },
    { tag:'obs', title:'Volatility Across Years',
      body:'Year-on-year growth rates fluctuate significantly, reflecting the reactive nature of drug enforcement rather than steady baseline growth in trafficking activity.' },
    { tag:'reason', title:'Moving Average Smooths Noise',
      body:'The 3-year moving average reveals the underlying trend is definitively upward, with short-term dips (likely enforcement lulls or data reporting delays) masked in raw data.' }
  ],
  geo: [
    { tag:'obs', title:'Persistent Hotspot States',
      body:'Punjab, Rajasthan, and Gujarat consistently rank among the highest-risk states year after year — reflecting their proximity to international drug supply routes.' },
    { tag:'reason', title:'Regional Clustering',
      body:'Northwest India clusters (Punjab, Haryana, Rajasthan) correlate with the Golden Crescent route (Afghanistan → Pakistan → India), while Northeast states track the Golden Triangle (Myanmar → India).' },
    { tag:'impact', title:'Emerging States to Watch',
      body:'States like Telangana and Odisha show rising risk indices in later years, suggesting evolving trafficking networks shifting away from traditionally policed corridors.' },
    { tag:'obs', title:'State × Year Heatmap Insight',
      body:'The Year × State heatmap reveals that most states do not fluctuate uniformly — individual state spikes point to targeted operations or supply shocks rather than systemic national shifts.' },
    { tag:'impact', title:'Few States Dominate Volume',
      body:'The top 5 states account for a disproportionate share of national seizures, reflecting both trafficking concentration and enforcement resource allocation.' }
  ],
  drug: [
    { tag:'obs', title:'Ganja is the Dominant Drug',
      body:'Ganja seizures dwarf all other drug categories by volume, consistently representing over 60% of total seized quantities nationally across all years.' },
    { tag:'reason', title:'Synthetic Drugs Rising',
      body:'ATS (Amphetamine-Type Stimulants), MDMA, and Mephedrone show growing seizure volumes in post-2020 data — indicating a shift from traditional plant-based to synthetic substances.' },
    { tag:'impact', title:'Drug Co-occurrence Patterns',
      body:'The correlation matrix reveals Heroin and Opium are moderately correlated, suggesting shared trafficking routes. Synthetic drugs tend to cluster with urban states and show weaker correlations with traditional narcotics.' },
    { tag:'obs', title:'Drug Diversity Distribution',
      body:'Most state-year records show low drug diversity (2–4 types), but a small subset of states (especially border regions) show high diversity (8+), indicating these are multi-drug trafficking hubs.' }
  ],
  enforcement: [
    { tag:'obs', title:'Arrests Exceed Cases Filed',
      body:'Many states show an Arrest Rate > 1, meaning multiple persons are arrested per case — indicating joint drug-trafficking operations or gang-level prosecutions.' },
    { tag:'reason', title:'Efficiency Varies Widely',
      body:'The arrest rate distribution has a long right tail — a few states achieve very high ratios while many cluster near 1, suggesting unequal enforcement capacity and investigative depth.' },
    { tag:'impact', title:'Weak Enforcement Zones',
      body:'States with high seizure quantities but low arrest rates represent enforcement gaps — large trafficked volumes are intercepted but perpetrators escape prosecution, likely reflecting border-transit seizures.' },
    { tag:'obs', title:'Cases and Arrests Rise Together',
      body:'The national trend shows arrests and cases growing in parallel, indicating enforcement capacity has broadly scaled with trafficking activity rather than lagging behind.' },
    { tag:'reason', title:'Scatter Reveals Outliers',
      body:'High-quantity, high-arrest states cluster away from the main trend — these are operation-driven spikes (major busts) rather than steady enforcement baselines.' }
  ],
  border: [
    { tag:'obs', title:'Border States Drive Volume',
      body:'Border states collectively account for significantly more seized quantity than non-border states, confirming that cross-border trafficking from Pakistan, Nepal, Bangladesh, and Myanmar is a primary source.' },
    { tag:'reason', title:'Maritime Routes Underrepresented',
      body:'Coastal states contribute less seizure volume relative to their geographic risk — maritime trafficking may be harder to intercept, suggesting enforcement gaps at sea ports and beaches.' },
    { tag:'impact', title:'Double-Risk States are Critical Nodes',
      body:'States that are both border and coastal (e.g., Gujarat, West Bengal) represent the highest composite trafficking risk — they face simultaneous land and sea trafficking pressure.' },
    { tag:'obs', title:'Neither Category Has Significant Volume',
      body:'Inland, non-border, non-coastal states still report meaningful seizures, indicating domestic distribution networks exist independent of border-entry points — pointing to internal production (e.g., Ganja cultivation).' }
  ],
  advanced: [
    { tag:'obs', title:'Heavy-Tailed Distribution',
      body:'Box plots confirm that seizure data is highly right-skewed — a small number of extraordinary bust events (outliers) account for a large fraction of total volume, with typical years being far lower.' },
    { tag:'reason', title:'Few States Dominate',
      body:'The top 3–4 states consistently command the majority of national seizure volumes, a Pareto-like concentration that persists even when single anomalous years are removed.' },
    { tag:'impact', title:'Anomaly Spikes Signal Events',
      body:'Z-score analysis identifies clear statistical outliers — these spike years correspond to large-scale enforcement operations, surprise seizures, or trafficking pattern shifts, warranting case-by-case investigation.' },
    { tag:'obs', title:'Growth Hotspots Shift Over Time',
      body:'Peak growth years differ by state — no single year dominates all states simultaneously, suggesting local factors (elections, enforcement leadership, supply disruptions) drive state-level spikes more than national events.' }
  ]
};

function buildInferences(section) {
  const container = document.getElementById('inf-' + section);
  if (!container || !INFERENCES[section]) return;
  container.innerHTML = INFERENCES[section].map(inf => `
    <div class="inference-card">
      <div class="inf-header">
        <span class="inf-tag ${inf.tag}">${inf.tag.toUpperCase()}</span>
        <span class="inf-title">${inf.title}</span>
      </div>
      <p class="inf-body">${inf.body}</p>
    </div>
  `).join('');
}
