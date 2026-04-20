import pandas as pd
from sklearn.cluster import KMeans

def cluster_states(df):
    # Group by correct column name
    features = df.groupby('State_UT').agg({
        'Total_Kg': 'sum',
        'Total_Cases': 'sum'
    }).reset_index()

    # Apply KMeans
    kmeans = KMeans(n_clusters=3, random_state=42)
    features['cluster'] = kmeans.fit_predict(features[['Total_Kg', 'Total_Cases']])

    # Smart risk labeling
    centers = kmeans.cluster_centers_

    sorted_clusters = sorted(range(len(centers)), key=lambda x: centers[x][0])

    risk_map = {
        sorted_clusters[0]: "Low Risk",
        sorted_clusters[1]: "Medium Risk",
        sorted_clusters[2]: "High Risk"
    }

    features['risk_level'] = features['cluster'].map(risk_map)

    return features