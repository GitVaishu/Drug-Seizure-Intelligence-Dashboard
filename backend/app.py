from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from data_loader import load_data
from ml_models.clustering import cluster_states
import pandas as pd

app = FastAPI()

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

df = load_data()


@app.get("/")
def home():
    return {"message": "Drug Seizure Analysis API Running"}


@app.get("/data")
def get_data():
    return df.to_dict(orient="records")

@app.get("/clusters")
def get_clusters():
    result = cluster_states(df)
    return result.to_dict(orient="records")

@app.get("/check-columns")
def check_columns():
    return list(df.columns)