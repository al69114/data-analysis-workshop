# Data Analysis & Machine Learning Interactive Workshop

An interactive, visual workbench for learning data science, statistical analysis, and machine learning using drag-and-drop Python module blocks.

Learners can assemble data pipelines with **Pandas**, **NumPy**, **Matplotlib**, and **Scikit-Learn**, tune hyperparameters in real time, execute code with live visual chart rendering and model scorecards, and export clean Python code.

The default first-run dataset is now `ronaldo_all_seasons.csv`, a compact season-level sports analytics CSV for beginner EDA. Learners can also upload any CSV in the UI; the Python backend profiles the columns, previews rows, and recommends efficient chart and analysis workflows from the detected schema.

The Ronaldo studio's first step follows **Load → Inspect → Clean → Visualize**. It checks missing values and data types, normalizes labels, removes exact duplicates, sets incomplete records aside for review, validates counts, and recalculates derived metrics before plotting. The **Messy Data Practice** variation introduces errors into an in-memory copy and charts the cleaning results. The supplied CSV stays unchanged, and each lesson independently reloads it. Missing sports statistics are treated as unknown rather than filled with zero or an average.

---

## 🌟 Two Interactive Workshop Studios

### 🎓 Workshop 1: Matplotlib & Scikit-Learn Code Mastery (Interactive Studio)
A unified coding and drag-and-drop learning environment where users can drag modules directly into the Python editor, switch view modes, run code, view visual/statistical outputs, and tune parameters to improve results:

1. **Drag-and-Drop directly onto the Coding Space & Canvas**:
   - Drag any Scikit-Learn or Matplotlib module card directly into the Python editor to inject commented, runnable Python snippets.
   - An animated glowing drop zone guides where code is inserted.
2. **Flexible View Mode Switcher**:
   - ⚡ **Split Studio**: Drag modules from the left palette while viewing and editing Python code on the right with live sync.
   - 💻 **Code Editor**: Full-width interactive Python editor with syntax highlighting and keyboard execution (`Cmd/Ctrl + Enter`).
   - 🧩 **Visual Blocks**: Flow canvas with reorderable module steps.
3. **Step-by-Step Guided Missions & 6-Stage Curriculum**:
   - **6-Stage Core Curriculum**: Ingestion, univariate histograms, ranked categorical bars, bivariate scatter polyfits, correlation heatmaps, and 2x2 multi-panel dashboards.
   - **5 Scikit-Learn & Matplotlib Guided Missions**: Step-by-step interactive missions with pulsing beacons highlighting the exact module to drag next:
     - 🎯 *Regression & Residuals Diagnostics* (LinearRegression + residuals baseline)
     - 🎯 *Classification & Confusion Matrix Studio* (Decision Trees + Random Forests + Confusion Matrices)
     - 🎯 *K-Means & Cluster Centroid Discovery* (Spatial customer segmentation + red centroid markers)
     - 🎯 *PCA Dimensionality Reduction* (High-dimensional compression into 2D projections)
     - 🎯 *Statistical EDA & 2x2 Subplots Dashboard* (Unified executive analytics grid)
4. **Multi-Tab Execution Output Dashboard**:
   - 📊 **Visual Output**: 140 DPI high-resolution Matplotlib graphics with Code-to-Visual breakdown mappings.
   - 💻 **Terminal / Console (`stdout` / `stderr`)**: Runtime logs, printed formulas, and statistical evaluation tables.
   - 📋 **DataFrame Table**: Live snapshot of rows, columns, and data types.
5. **💡 "How to Manipulate & Make It Better" Interactive Studio**:
   - Real-time parameter sliders: Bins interval (3–25), Alpha transparency (0.2–1.0), Colormaps (`viridis`, `coolwarm`, `RdBu_r`, `plasma`), and Tree Max Depth.
   - 1-Click Code Manipulations: Test balanced skew intervals, 1-Std Dev confidence bands, 1st-degree polynomial fit overlays, and accessible sapphire blue/purple color themes.
   - Educational rationale cards explaining *why* each manipulation improves comprehension and model stability.

### 🧪 Workshop 2: Visual Pipeline Workbench & ML Studio
A modular drag-and-drop workbench for assembling multi-step pipelines with 1-click templates (*Sales ROI Regression*, *Customer Churn Classification*, *Housing Price Valuation*, *Random Forest Regression*, *Customer Clustering*, *PCA Dimensionality Reduction*).

---

## 🏗️ Architecture

- **`backend/` (FastAPI + Python Data Stack)**:
  - `app/main.py`: REST API endpoints (`/modules`, `/presets`, `/guided-missions`, `/generate`, `/execute`, `/execute-code`, `/workshops/matplotlib`, `/health`).
  - `app/executor.py`: Safe pipeline and custom code execution engine supporting `pandas`, `numpy`, `matplotlib`, and `scikit-learn` (`LinearRegression`, `RandomForestRegressor`, `DecisionTreeClassifier`, `RandomForestClassifier`, `LogisticRegression`, `StandardScaler`, `PCA`, `KMeans`).
  - `app/codegen.py`: Python code generation engine producing standalone scripts with comments and learner tips.
  - `app/modules.py`: Definitions for all 22 modules, 5 Guided Missions, and 6 preset use cases.
  - `app/recommender.py`: Dataset profiling and chart/workflow suggestion engine for built-in and uploaded CSVs.
  - `app/datasets/`: Built-in sample datasets (`ronaldo_all_seasons.csv`, `sales_marketing.csv`, `customer_churn.csv`, `housing_prices.csv`).
- **`frontend/` (Next.js 16 + React 19 + TypeScript + Lucide Icons)**:
  - Responsive 3-panel workspace, split-screen code editor, direct drag-and-drop drop zones, interactive stepper beacon, and parameter manipulation studio.

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

## 📦 Available Workshop Modules (22 Modules)

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
| **Matplotlib** | **Box & Whisker Plot** | Median, IQR & outlier detection | Box plot with whisker bounds |
| **Matplotlib** | **Residuals Diagnostics** | Model error distribution vs. fitted line | Residuals plot + Zero-error baseline |
| **Matplotlib** | **2x2 Subplots Dashboard** | Unified multi-panel executive grid | 4-panel dashboard with master suptitle |
| **Scikit-Learn**| **StandardScaler** | Z-Score unit variance normalization | Standardized numeric feature matrix |
| **Scikit-Learn**| **Linear Regression** | Continuous prediction & R² evaluation | Actual vs. Predicted plot + metrics |
| **Scikit-Learn**| **Random Forest Regressor** | Ensemble non-linear regression | Feature importances chart + R²/MAE |
| **Scikit-Learn**| **Decision Tree Classifier** | Categorical classification rules | Confusion Matrix plot + Accuracy/F1 |
| **Scikit-Learn**| **Random Forest Classifier** | Bagging ensemble classification | Forest Accuracy + Feature ranking |
| **Scikit-Learn**| **Logistic Regression** | Binary probabilistic classification | Sigmoid classification metrics |
| **Scikit-Learn**| **K-Means Clustering** | Unsupervised spatial segmentation | 2D Cluster scatter plot with centroids |
| **Scikit-Learn**| **PCA Reduction** | 2D orthogonal dimensionality compression | 2D projection + % variance explained |
