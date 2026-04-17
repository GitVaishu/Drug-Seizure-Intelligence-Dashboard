import pandas as pd
from feature_engineering import add_features
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "ncb_final_cleaned_dataset_v2.csv")

def load_data():
    df = pd.read_csv(DATA_PATH)

    df = add_features(df)

    df.to_csv(os.path.join(BASE_DIR, "data", "featured_data.csv"), index=False)

    return df