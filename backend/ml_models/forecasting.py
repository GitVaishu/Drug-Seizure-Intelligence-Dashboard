import pandas as pd
from prophet import Prophet
from ml_models.evaluation import evaluate_forecast

def forecast_states(df, target="Total_Kg", years=2):
    results = []

    states = df["State_UT"].unique()

    for state in states:
        state_df = df[df["State_UT"] == state]

        yearly = state_df.groupby("Year")[target].sum().reset_index()

        prophet_df = yearly.rename(columns={
            "Year": "ds",
            target: "y"
        })

        prophet_df["ds"] = pd.to_datetime(prophet_df["ds"], format="%Y")

        # 🔴 Skip if not enough data
        if len(prophet_df) < 2:
            continue

        # 🔹 Train model
        model = Prophet()
        model.fit(prophet_df)

        # 🔹 Predict
        future = model.make_future_dataframe(periods=years, freq='YE')
        forecast = model.predict(future)

        # 🔹 Evaluation (ONLY on actual data range)
        merged = pd.merge(
            prophet_df,
            forecast[["ds", "yhat"]],
            on="ds",
            how="inner"
        )

        metrics = evaluate_forecast(
            merged["y"],
            merged["yhat"]
        )
        
        print(f"\n📊 {state} Model Evaluation:")
        print(f"RMSE: {metrics['RMSE']}")
        print(f"MAE: {metrics['MAE']}")
        print(f"R2: {metrics['R2']}")

        # 🔹 Prepare series
        actual_series = prophet_df.to_dict("records")
        forecast_series = forecast[["ds", "yhat"]].to_dict("records")

        # 🔹 % change
        latest_actual = actual_series[-1]["y"]
        future_pred = forecast_series[-1]["yhat"]

        percent_change = ((future_pred - latest_actual) / latest_actual) * 100

        # 🔹 Append result
        results.append({
            "State_UT": state,
            "percent_change": round(percent_change, 2),
            "actual_series": actual_series,
            "forecast_series": forecast_series,
            "metrics": metrics   # ✅ NEW
        })

    return results