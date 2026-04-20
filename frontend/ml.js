var ML_DATA = [];
var FORECAST_DATA = [];

// ================= INIT =================
async function initML() {
  const res = await fetch("http://127.0.0.1:8000/clusters");
  ML_DATA = await res.json();

  renderML("High Risk");
  updateForecast();
}

// ================= CLUSTERING =================
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
      title: `${riskType} States by Drug Seizure Volume`,
    },
    PC,
  );

  const topState = filtered[0];
  if (!topState) return;

  const avg = ML_DATA.reduce((sum, d) => sum + d.Total_Kg, 0) / ML_DATA.length;

  const pctAbove = ((topState.Total_Kg - avg) / avg) * 100;

  document.getElementById("ml-insight").innerHTML = `
    <b>${topState.State_UT}</b> leads the <b>${riskType}</b> group with 
    <b>${Math.round(topState.Total_Kg).toLocaleString()} kg</b> seized,
    which is <b>${pctAbove.toFixed(1)}%</b> above the national average.
  `;
}

// ================= FORECAST MAP =================
async function updateForecastMap() {
  try {
    const geo = await fetch("/frontend/india_states.geojson").then((res) =>
      res.json(),
    );

    const NAME_MAP = {
      "Andaman and Nicobar Islands": "Andaman and Nicobar",
      "Dadra and Nagar Haveli and Daman and Diu":
        "Dadra and Nagar Haveli and Daman and Diu",
    };

    const locations = FORECAST_DATA.map(
      (d) => NAME_MAP[d.State_UT] || d.State_UT,
    );

    const values = FORECAST_DATA.map((d) => d.percent_change);

    Plotly.newPlot(
      "forecast-map",
      [
        {
          type: "choropleth",
          geojson: geo,
          featureidkey: "properties.NAME_1",
          locations: locations,
          z: values,
          colorscale: "RdYlGn_r",
          zmin: -100,
          zmax: 100,
          marker: {
            line: { color: "#0b1220", width: 0.5 },
          },
          hovertemplate:
            "<b>%{location}</b><br>%{z:.1f}% change<extra></extra>",
        },
      ],
      {
        ...PL,
        geo: {
          fitbounds: "locations",
          showcountries: false,
          showcoastlines: false,
          showframe: false,
          bgcolor: "rgba(0,0,0,0)",
        },
        title: "Forecasted Change in Drug Seizures (India)",
      },
      PC,
    );

    document.getElementById("forecast-map").on("plotly_click", function (e) {
      const state = e.points[0].location;

      const reverseMap = {
        "Andaman and Nicobar": "Andaman and Nicobar Islands",
      };

      const originalState = reverseMap[state] || state;

      renderForecastChart(originalState);
    });
  } catch (err) {
    console.error("MAP ERROR:", err);
  }
}

// ================= FORECAST CHART =================
function renderForecastChart(state) {
  const selectedYear = parseInt(document.getElementById("forecast-year").value);

  const data = FORECAST_DATA.find((d) => d.State_UT === state);
  if (!data) return;

  const actual = data.actual_series;
  const forecast = data.forecast_series;

  const filteredForecast = forecast.filter(
    (d) => new Date(d.ds).getFullYear() <= selectedYear,
  );

  const latest = actual[actual.length - 1].y;
  const future = filteredForecast[filteredForecast.length - 1].yhat;

  const pct = ((future - latest) / latest) * 100;

  const lastYear = actual[actual.length - 1].ds;

  Plotly.newPlot(
    "forecast-chart",
    [
      {
        x: actual.map((d) => d.ds),
        y: actual.map((d) => d.y),
        mode: "lines+markers",
        name: "Actual Data",
        line: { color: "#22c55e", width: 3 },
      },
      {
        x: filteredForecast.map((d) => d.ds),
        y: filteredForecast.map((d) => d.yhat),
        mode: "lines+markers",
        name: "Predicted Trend",
        line: { color: "#f97316", dash: "dash", width: 3 },
      },
    ],
    {
      ...PL,
      title: `${state}: Historical vs Predicted Drug Seizure Volume`,
      xaxis: { title: "Year" },
      yaxis: { title: "Total Drug Seizure (kg)" },

      shapes: [
        {
          type: "line",
          x0: lastYear,
          x1: lastYear,
          y0: 0,
          y1: 1,
          yref: "paper",
          line: {
            color: "#aaa",
            dash: "dot",
            width: 2,
          },
        },
      ],

      annotations: [
        {
          x: lastYear,
          y: 1.05,
          yref: "paper",
          text: "Forecast begins",
          showarrow: false,
          font: { color: "#aaa" },
        },
      ],
    },
    PC,
  );

  document.getElementById("forecast-insight").innerHTML = `
    <b>${state}</b> is projected to 
    <b>${pct > 0 ? "increase" : "decrease"}</b> in drug seizure volume by 
    <b>${Math.abs(pct).toFixed(1)}%</b> by ${selectedYear}, 
    based on trends from 2018–2024.
  `;
}

// ================= FORECAST API =================
async function updateForecast() {
  const selectedYear = parseInt(document.getElementById("forecast-year").value);

  const lastActualYear = 2024;
  const yearsAhead = Math.max(1, selectedYear - lastActualYear);
  const res = await fetch(`http://127.0.0.1:8000/forecast?years=${yearsAhead}`);

  FORECAST_DATA = await res.json();

  if (FORECAST_DATA.length > 0) {
    renderForecastChart(FORECAST_DATA[0].State_UT);
  }

  updateForecastMap();
}

// ================= LOAD =================
window.onload = function () {
  initML();
};
