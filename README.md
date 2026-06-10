DrugWatch India – NCB Seizure Intelligence Dashboard 🇮🇳

An interactive data analytics and machine learning dashboard built using NCB (Narcotics Control Bureau) seizure data (2018–2024) to identify drug trafficking patterns, analyze state-wise risk, perform statistical hypothesis testing, and generate machine learning-driven insights.

📌 Project Overview
DrugWatch India transforms raw NCB seizure reports into actionable intelligence through:

📊 Interactive visual analytics
🗺️ State-wise risk analysis
🧪 Statistical hypothesis testing
🤖 Machine Learning-based risk classification
📈 Trend forecasting
The project helps identify high-risk regions, emerging drug trafficking trends, and enforcement effectiveness across India.

🚀 Features
1️⃣ Overview Dashboard
- National drug seizure trends (2018–2024)
- Top states by seizure volume
- Border vs Non-border state analysis
- Most seized drug categories
- Key national statistics

2️⃣ State Analysis
- Interactive India Risk Heatmap
- State-wise Risk Index visualization
- Color-coded risk levels across India
- Cases, arrests, and seizure trends
- Drug diversity analysis
- Border and coastal state indicators
- Year-on-year performance comparison

3️⃣ Exploratory Data Analysis (EDA)
- Correlation analysis
- Distribution plots
- Risk pattern identification
- Drug category exploration
- Trend visualizations

4️⃣ Hypothesis Testing Lab
- Statistical validation of drug trafficking patterns using:
  1. Spearman Correlation Test
  2. Mann-Whitney U Test
  3. Kruskal-Wallis Test

Example Questions:
i)  Do border states experience significantly higher seizures?
ii) Is there a relationship between arrests and cases?
iii) Do coastal states show different trafficking patterns?

5️⃣ Machine Learning Insights
🔹 Risk-Based State Clustering
States are grouped into:
🟢 Low Risk
🟡 Medium Risk
🔴 High Risk
Unlike traditional approaches that rely only on seizure quantity, clustering is performed using:
- Total Cases
- Arrest Rate
- Drug Diversity
- Growth Rate
This provides a more realistic measure of drug activity and trafficking risk.

🔹 Time Series Forecasting
Forecast future trends using: Facebook Prophet
Predict:
Future seizure trends
Future case volumes
Emerging hotspots

🔹 Anomaly Detection

Identify unusual spikes indicating potential trafficking events using:
Isolation Forest
Applications:
Sudden increase in seizures
Emerging trafficking routes
High-risk periods

🏗️ Project Structure
Drug-Seizure-Intelligence-Dashboard
│
├── backend
│   ├── app.py
│   ├── hypothesis_testing.py
│   ├── feature_engineering.py
│   ├── data_loader.py
│   │
│   └── ml_models
│       ├── clustering.py
│       ├── forecasting.py
│       ├── anomaly.py
│       └── evaluation.py
│
├── frontend
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   ├── eda.js
│   ├── hypothesis.js
│   └── ml.js
│
├── data
│   ├── ncb_final_cleaned_dataset_v2.csv
│   └── featured_data.csv
│
│
└── requirements.txt

📊 Dataset
Source: National Crime Bureau (NCB) Annual Reports (2018–2024)

The dataset contains:
- State-wise seizure records
- Drug categories
- Arrest statistics
- Case counts
- Border and coastal state indicators
- Drug diversity metrics
- Growth and risk indices

🛠️ Tech Stack
1. Frontend
   - HTML5
   - CSS3
   - JavaScript
   - Plotly.js
2. Backend
   - Python
   - FastAPI
3. Data Science & ML
   - Pandas
   - NumPy
   - Scikit-learn
   - Prophet
   - Statsmodels
   - SciPy

📈 Machine Learning Workflow
Raw NCB Data
      │
      ▼
Data Cleaning
      │
      ▼
Feature Engineering
      │
      ▼
Risk Indicators
      │
      ▼
Clustering
Forecasting
Regression
Anomaly Detection
      │
      ▼
Interactive Dashboard

🗺️ Interactive Risk Heatmap
The dashboard includes a geographic heatmap of India that visualizes drug trafficking risk across states and union territories.
Features:
- Color-coded state risk levels
- Interactive state selection
- Risk Index visualization
- Quick identification of trafficking hotspots
- Drill-down into state-level statistics
Benefits
- Geographic intelligence for policymakers
- Easy identification of high-risk regions
- Visual understanding of trafficking patterns
- Supports strategic resource allocation

📷 Dashboard Modules
Overview
National seizure trends
Drug distribution analysis
State Analysis
Risk assessment
State performance tracking
EDA
Statistical exploration
Correlation insights
Hypothesis Lab
Statistical significance testing
ML Insights
Risk clustering
Forecasting
Predictive analytics

🎯 Key Insights Generated
Identification of high-risk states
Drug trafficking trend analysis
Border-state vulnerability assessment
Arrest effectiveness evaluation
Future seizure forecasting
Detection of anomalous trafficking events

🔮 Future Enhancements
Real-time crime data integration
Deep learning forecasting models
Geo-spatial trafficking route analysis
Automated risk alert system
AI-powered intelligence recommendations

👩‍💻 Team
Developed as a Data Science & Analytics Project focused on applying statistical analysis and machine learning techniques to narcotics enforcement data.

📜 License
This project is intended for academic and research purposes only.
NCB data belongs to the respective government authorities and is used solely for educational analysis.

⭐ If you found this project interesting, consider giving the repository a star!
