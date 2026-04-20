import pandas as pd

BORDER_STATES = {
    "Jammu & Kashmir", "Ladakh", "Punjab", "Rajasthan",
    "Gujarat", "Uttarakhand", "Uttar Pradesh", "Bihar",
    "West Bengal", "Sikkim", "Arunachal Pradesh",
    "Nagaland", "Manipur", "Mizoram", "Tripura",
    "Assam", "Meghalaya"
}

COASTAL_STATES = {
    "Gujarat", "Maharashtra", "Goa", "Karnataka", "Kerala",
    "Tamil Nadu", "Andhra Pradesh", "Odisha", "West Bengal"
}


def add_features(df: pd.DataFrame):

    #  Geography
    df["Border_State"] = df["State_UT"].apply(lambda x: 1 if x in BORDER_STATES else 0)
    df["Coastal_State"] = df["State_UT"].apply(lambda x: 1 if x in COASTAL_STATES else 0)

    #  Arrest Rate
    df["Arrest_Rate"] = df["Total_Arrested"] / df["Total_Cases"]
    df["Arrest_Rate"] = df["Arrest_Rate"].fillna(0)

    #  Drug Diversity (include all types)
    drug_cols = [
        col for col in df.columns 
        if any(x in col for x in ["_Kg", "_Litre", "_No", "Blots"])
    ]
    df["Drug_Diversity"] = (df[drug_cols] > 0).sum(axis=1)

    #  Create TOTAL quantity (IMPORTANT)
    df["Total_Quantity"] = (
        df["Total_Kg"].fillna(0) +
        df["Total_Litre"].fillna(0) +
        df["Total_Units"].fillna(0)
    )

    #  Growth Rate (per state)
    df = df.sort_values(["State_UT", "Year"])
    df["Growth_Rate"] = df.groupby("State_UT")["Total_Quantity"].pct_change().fillna(0)

    #  Normalization
    def normalize(col):
        return (col - col.min()) / (col.max() - col.min() + 1e-9)

    # Risk Index
    df["Risk_Index"] = (
        0.4 * normalize(df["Total_Quantity"]) +
        0.3 * normalize(df["Total_Cases"]) +
        0.3 * normalize(df["Drug_Diversity"])
    )

    return df