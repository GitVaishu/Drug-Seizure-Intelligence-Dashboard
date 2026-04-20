from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional
from data_loader import load_data
from hypothesis_testing import run_tests
from hypothesis_testing import get_all_states

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

@app.get("/states")
def fetch_states():
    return {"states": get_all_states()}


@app.get("/")
def home():
    return {"message": "Drug Seizure Analysis API Running"}


@app.get("/data")
def get_data():
    return df.to_dict(orient="records")

@app.get("/hypothesis")
def hypothesis(
    state: Optional[str] = Query(None),
    year_from: Optional[int] = Query(None),
    year_to: Optional[int] = Query(None)
):
    return JSONResponse(run_tests(state, year_from, year_to))

@app.get("/states")
def get_states():
    return sorted(df['State'].dropna().unique().tolist())