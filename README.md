# Data Analysis & Machine Learning Interactive Workshop

An interactive, visual workbench for learning data science, statistical analysis, and machine learning using drag-and-drop Python module blocks.

Learners can assemble data pipelines with **Pandas**, **NumPy**, **Matplotlib**, and **Scikit-Learn**, tune hyperparameters in real time, execute code with live visual chart rendering and model scorecards, and export clean Python code.

---

## 🌟 Key Features

- **Interactive Block Canvas**: Drag, drop, reorder, and configure modular data analysis and ML steps.
- **Real-Time Visual Outputs**:
  - **Matplotlib Visualizations**: Scatter plots with regression fit lines, categorical bar charts, distribution histograms, line trends, and feature correlation heatmaps.
  - **Scikit-Learn Model Evaluation**: Linear regression Actual vs. Predicted plots with R² / MAE / RMSE metrics, decision tree classifiers with Confusion Matrix display, and K-Means cluster centroid maps.
  - **Data Table Previews**: Live tabular DataFrame viewer displaying columns, types, and sample records.
  - **Step Console Logs**: Detailed Python runtime output and statistical equation interpretations.
- **Built-In Workshop Use Cases (1-Click Templates)**:
  1. 📈 **Sales & Marketing ROI Predictor** (*Beginner*): Linear regression to predict sales revenue from marketing spend with trendlines and summary statistics.
  2. 🎯 **Customer Churn & Risk Classifier** (*Intermediate*): Decision Tree classification with Confusion Matrix error analysis on customer tenure and charges.
  3. 🏡 **Housing Price Valuation & Heatmap** (*Intermediate*): Multi-variable exploratory data analysis (EDA), correlation matrix heatmap, and predictive regression.
  4. 👥 **Customer Segmentation via K-Means** (*Advanced*): Unsupervised cluster discovery and centroid visualization.
- **Live Code Generation**: Exports ready-to-run, PEP8-compliant Python scripts with pedagogical learner notes and best practices.

---

## 🏗️ Architecture

- **`backend/` (FastAPI + Python Data Stack)**:
  - `app/main.py`: REST API endpoints (`/modules`, `/presets`, `/generate`, `/execute`, `/health`).
  - `app/executor.py`: Safe pipeline execution engine using real `pandas`, `numpy`, `matplotlib`, and `scikit-learn` with base64 PNG rendering.
  - `app/codegen.py`: Python code generator producing standalone scripts with comments and learner tips.
  - `app/modules.py`: Module definitions and pre-configured workshop templates.
  - `app/datasets/`: Built-in sample datasets (`sales_marketing.csv`, `customer_churn.csv`, `housing_prices.csv`).
- **`frontend/` (Next.js 16 + React 19 + TypeScript + Lucide Icons)**:
  - Responsive 3-panel workspace (Palette → Canvas Flow → Inspector Settings) and dual-tab output dashboard (Visual Results vs. Python Code).

---

## 🚀 Getting Started

### 1. Start the Backend API

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API will be live at `http://localhost:8000` (docs at `http://localhost:8000/docs`).

### 2. Start the Frontend UI

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Available Workshop Modules

| Package | Module | Learner Goal | Output |
| :--- | :--- | :--- | :--- |
| **Pandas** | **Load Dataset** | Ingest tabular data into memory | DataFrame preview table & dimensions |
| **Pandas** | **Clean Missing Values** | Handle NaNs (drop / mean / median) | Cleaned row counts & metrics |
| **Pandas** | **Filter Rows** | Isolate specific subsets by threshold | Filtered DataFrame & retention rate |
| **Pandas** | **Group By & Aggregate** | Pivot categorical metrics | Aggregated summary table |
| **NumPy** | **Numeric Summary & Stats** | Mean, Median, Std Dev, Min/Max, IQR | Statistical scorecard |
| **NumPy** | **Feature Scaling** | Z-score standardization, Log transform | Transformed feature column |
| **Matplotlib** | **Scatter Plot & Trendline** | Identify correlation & regression line | High-res Matplotlib chart + Pearson r |
| **Matplotlib** | **Bar Chart** | Categorical comparisons | Styled bar chart with value callouts |
| **Matplotlib** | **Histogram** | Distribution skew & spread | Frequency histogram with mean/median lines |
| **Matplotlib** | **Line Trend Chart** | Sequential progression | Line chart with markers |
| **Matplotlib** | **Correlation Heatmap** | Multi-feature correlation coefficients | Color-coded matrix with values |
| **Scikit-Learn**| **Linear Regression** | Continuous prediction & R² evaluation | Actual vs. Predicted plot + metrics |
| **Scikit-Learn**| **Decision Tree Classifier** | Categorical classification | Confusion Matrix plot + Accuracy/F1 |
| **Scikit-Learn**| **K-Means Clustering** | Unsupervised segmentation | 2D Cluster scatter plot with centroids |
