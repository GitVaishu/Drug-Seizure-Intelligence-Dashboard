import pandas as pd
from scipy.stats import spearmanr, kruskal, mannwhitneyu
import os

# Always finds the file relative to this script's location
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, '..', 'data', 'ncb_final_cleaned_dataset_v2.csv')

def get_all_states():
    df = pd.read_csv(CSV_PATH)
    df = df[df['Is_Total_Row'] == False]

    states = sorted(df['State_UT'].dropna().unique().tolist())
    return states

def run_tests(state=None, year_from=None, year_to=None):
    df = pd.read_csv(CSV_PATH)
    df = df[df['Is_Total_Row'] == False]

    # Apply filters
    if state:
        df = df[df['State_UT'] == state]
    if year_from:
        df = df[df['Year'] >= int(year_from)]
    if year_to:
        df = df[df['Year'] <= int(year_to)]

    results = {}

    # Test 1: Cases vs Arrests (Spearman)
    if len(df) >= 3:
        corr, p_corr = spearmanr(df['Total_Cases'], df['Total_Arrested'])
        results['cases_vs_arrests'] = {"stat": float(corr), "p_value": float(p_corr)}

    # Test 2: Yearly variation (Kruskal-Wallis) — needs 2+ years
    groups = [g['Total_Kg'].values for _, g in df.groupby('Year')]
    if len(groups) >= 2:
        stat, p_kw = kruskal(*groups)
        results['year_difference'] = {"p_value": float(p_kw)}

    # Test 3: 2018 vs 2024 (Mann-Whitney)
    g1 = df[df['Year'] == 2018]['Total_Kg'].dropna()
    g2 = df[df['Year'] == 2024]['Total_Kg'].dropna()
    if len(g1) > 0 and len(g2) > 0:
        stat, p_mw = mannwhitneyu(g1, g2, alternative='two-sided')
        results['2018_vs_2024'] = {"p_value": float(p_mw)}

    # Test 4: Border vs Non-Border (Mann-Whitney) — only for national view
    if not state and 'Is_Border_State' in df.columns:
        border = df[df['Is_Border_State'] == True]['Total_Kg'].dropna()
        non_border = df[df['Is_Border_State'] == False]['Total_Kg'].dropna()
        if len(border) > 0 and len(non_border) > 0:
            stat, p_b = mannwhitneyu(border, non_border, alternative='two-sided')
            results['border_vs_nonborder'] = {"p_value": float(p_b)}

    return results