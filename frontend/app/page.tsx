"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BarChart3,
  Blocks,
  BookOpen,
  Box,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronRight,
  Code2,
  Columns,
  Copy,
  Database,
  Download,
  Eye,
  FileCode2,
  Flame,
  Grid,
  GripVertical,
  HelpCircle,
  Info,
  Layers,
  LayoutDashboard,
  LineChart,
  Lightbulb,
  Maximize2,
  Minimize2,
  PieChart,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Sliders,
  Sparkles,
  Split,
  Table2,
  Terminal,
  Trash2,
  TrendingUp,
  Workflow,
  Zap,
} from "lucide-react";

// ==========================================
// TYPES & DATA CONTRACTS
// ==========================================

type WorkshopMode = "matplotlib-mastery" | "visual-workbench";
type W1ViewMode = "code" | "blocks" | "split";
type W1GuideTab = "curriculum" | "missions";

type ModuleCategory = "data" | "science" | "visualization" | "machine-learning";

type ModuleOptionChoice = {
  value: string;
  label: string;
};

type ModuleOption = {
  key: string;
  label: string;
  default: string | number;
  help_text: string;
  type?: "text" | "number" | "select" | "boolean";
  choices?: ModuleOptionChoice[];
};

type ModuleDefinition = {
  id: string;
  title: string;
  package: string;
  category: ModuleCategory;
  description: string;
  learner_goal: string;
  badge?: string;
  options: ModuleOption[];
  code_template?: string;
};

type ProjectBlock = {
  id: string;
  module_id: string;
  settings: Record<string, string | number>;
};

type MetricItem = {
  label: string;
  value: string | number;
  description?: string;
  status?: "good" | "neutral" | "attention";
};

type DataPreview = {
  columns: string[];
  rows: Record<string, any>[];
  total_rows: number;
  total_columns: number;
};

type BlockExecutionResult = {
  block_id: string;
  module_id: string;
  title: string;
  package: string;
  category: ModuleCategory;
  success: boolean;
  summary: string;
  logs?: string[];
  chart_base64?: string;
  data_preview?: DataPreview;
  metrics?: MetricItem[];
  error?: string;
};

type ExecuteResponse = {
  success: boolean;
  results: BlockExecutionResult[];
  execution_time_ms: number;
  summary_insight: string;
  notes?: string[];
  error?: string;
};

type GenerateResponse = {
  code: string;
  imports: string[];
  notes: string[];
};

type PresetUseCase = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  icon: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  blocks: ProjectBlock[];
  key_takeaway: string;
};

type CodeToVisualMapping = {
  code_snippet: string;
  visual_element: string;
  explanation: string;
};

type WorkshopStep = {
  id: string;
  stage: number;
  title: string;
  subtitle: string;
  objective: string;
  dataset_name: string;
  concept_summary: string;
  starter_code: string;
  solution_code: string;
  code_mappings: CodeToVisualMapping[];
  key_takeaways: string[];
  pro_tips: string[];
};

type GuidedStep = {
  step_number: number;
  module_id: string;
  target_action: string;
  title: string;
  description: string;
  why_it_matters: string;
  expected_output: string;
  default_settings: Record<string, string | number>;
  code_snippet: string;
};

type GuidedMission = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  dataset_name: string;
  overview: string;
  steps: GuidedStep[];
};

type CustomCodeExecuteResponse = {
  success: boolean;
  stdout: string;
  stderr: string;
  chart_base64?: string;
  charts_base64: string[];
  execution_time_ms: number;
  data_preview?: DataPreview;
  error?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const categoryIcon: Record<ModuleCategory, any> = {
  data: Database,
  science: Blocks,
  visualization: BarChart3,
  "machine-learning": BrainCircuit,
};

const categoryTheme = {
  data: {
    bg: "rgba(15, 118, 110, 0.08)",
    border: "rgba(15, 118, 110, 0.25)",
    text: "#0f766e",
  },
  science: {
    bg: "rgba(2, 132, 199, 0.08)",
    border: "rgba(2, 132, 199, 0.25)",
    text: "#0284c7",
  },
  visualization: {
    bg: "rgba(124, 58, 237, 0.08)",
    border: "rgba(124, 58, 237, 0.25)",
    text: "#7c3aed",
  },
  "machine-learning": {
    bg: "rgba(225, 29, 72, 0.08)",
    border: "rgba(225, 29, 72, 0.25)",
    text: "#e11d48",
  },
};

// ==========================================
// CLIENT FALLBACK MODULES (22 MODULES)
// ==========================================

const fallbackModules: ModuleDefinition[] = [
  // --- PANDAS / DATA ---
  {
    id: "pandas-load-csv",
    title: "Load Dataset",
    package: "Pandas",
    category: "data",
    description: "Load tabular data from CSV into a pandas DataFrame.",
    learner_goal: "Start your workflow by ingesting rows and columns into Python memory.",
    badge: "Foundation",
    options: [
      {
        key: "file_name",
        label: "Dataset Source",
        default: "sales_marketing.csv",
        help_text: "Choose a workshop sample dataset or CSV file.",
        type: "select",
        choices: [
          { value: "sales_marketing.csv", label: "📈 Sales & Marketing Spend (Regression / EDA)" },
          { value: "customer_churn.csv", label: "🎯 Customer Churn & Retention (Classification)" },
          { value: "housing_prices.csv", label: "🏡 Real Estate & Housing Prices (Regression / Multi-feature)" },
        ],
      },
      { key: "preview_rows", label: "Preview Rows", default: 5, help_text: "Rows to preview.", type: "number" },
    ],
    code_template: `import pandas as pd\n\n# Ingest CSV dataset into a pandas DataFrame\ndf = pd.read_csv("{file_name}")\nprint(f"Loaded {len(df)} rows x {len(df.columns)} columns.")\nprint(df.head({preview_rows}))\n`,
  },
  {
    id: "pandas-clean",
    title: "Clean Missing Values",
    package: "Pandas",
    category: "data",
    description: "Handle missing or incomplete rows to prevent model errors.",
    learner_goal: "Clean data before statistical analysis and model fitting.",
    badge: "Data Prep",
    options: [
      {
        key: "strategy",
        label: "Handling Strategy",
        default: "drop_rows",
        help_text: "Choose how to resolve rows containing null/NaN values.",
        type: "select",
        choices: [
          { value: "drop_rows", label: "Drop rows with any missing values" },
          { value: "fill_mean", label: "Impute missing numeric values with column Mean" },
          { value: "fill_median", label: "Impute missing numeric values with column Median" },
        ],
      },
    ],
    code_template: `# Clean missing values\ninitial_len = len(df)\ndf = df.dropna().reset_index(drop=True)\nprint(f"Cleaned DataFrame: {len(df)} rows remaining ({initial_len - len(df)} dropped).\\n")\n`,
  },
  {
    id: "pandas-filter",
    title: "Filter & Slice Rows",
    package: "Pandas",
    category: "data",
    description: "Filter DataFrame records matching specific threshold conditions.",
    learner_goal: "Isolate subsets of data (e.g. high-value transactions or active users).",
    badge: "Data Prep",
    options: [
      { key: "column", label: "Filter Column", default: "sales", help_text: "Column to evaluate.", type: "text" },
      {
        key: "operator",
        label: "Condition",
        default: ">",
        help_text: "Comparison operator.",
        type: "select",
        choices: [
          { value: ">", label: "Greater than (>)" },
          { value: ">=", label: "Greater than or equal (>=)" },
          { value: "<", label: "Less than (<)" },
          { value: "<=", label: "Less than or equal (<=)" },
          { value: "==", label: "Equals (==)" },
        ],
      },
      { key: "threshold", label: "Threshold Value", default: "50000", help_text: "Value to compare against.", type: "text" },
    ],
    code_template: `filtered_df = df[df["{column}"] {operator} {threshold}].copy()\nprint(f"Filtered {len(filtered_df)} rows matching condition {column} {operator} {threshold}:")\nprint(filtered_df.head())\n`,
  },
  {
    id: "pandas-groupby",
    title: "Group By & Aggregate",
    package: "Pandas",
    category: "data",
    description: "Group rows by a categorical column and compute aggregate metrics.",
    learner_goal: "Understand categorical summaries and pivot data for plotting.",
    badge: "Aggregation",
    options: [
      { key: "group_column", label: "Group By Column", default: "region", help_text: "Category column.", type: "text" },
      { key: "agg_column", label: "Target Numeric Column", default: "sales", help_text: "Numeric column to aggregate.", type: "text" },
      {
        key: "agg_func",
        label: "Aggregation Function",
        default: "mean",
        help_text: "Statistical function.",
        type: "select",
        choices: [
          { value: "mean", label: "Average / Mean" },
          { value: "sum", label: "Total Sum" },
          { value: "count", label: "Row Count" },
          { value: "median", label: "Median" },
          { value: "max", label: "Maximum" },
        ],
      },
    ],
    code_template: `agg_df = df.groupby("{group_column}")["{agg_column}"].{agg_func}().reset_index()\nprint("=== Grouped Summary ===")\nprint(agg_df)\n`,
  },

  // --- NUMPY / SCIENCE ---
  {
    id: "numpy-summary",
    title: "Numeric Summary & Stats",
    package: "NumPy",
    category: "science",
    description: "Compute descriptive summary statistics (mean, median, std, percentiles) via NumPy arrays.",
    learner_goal: "Learn foundational statistics and understand data dispersion.",
    badge: "Statistics",
    options: [
      { key: "column", label: "Numeric Column", default: "sales", help_text: "Target column.", type: "text" },
    ],
    code_template: `import numpy as np\narr = df["{column}"].dropna().to_numpy()\nprint(f"Mean: {np.mean(arr):.2f}, Median: {np.median(arr):.2f}, Std Dev: {np.std(arr):.2f}")\nprint(f"IQR (75-25%): {np.percentile(arr, 75) - np.percentile(arr, 25):.2f}")\n`,
  },
  {
    id: "numpy-transform",
    title: "Feature Transform & Scale",
    package: "NumPy",
    category: "science",
    description: "Transform numeric arrays using log transform, z-score normalization, or min-max scaling.",
    learner_goal: "Prepare features for machine learning models that expect standardized inputs.",
    badge: "Transformation",
    options: [
      { key: "column", label: "Source Column", default: "marketing_spend", help_text: "Column to transform.", type: "text" },
      {
        key: "transform_type",
        label: "Transformation Type",
        default: "z_score",
        help_text: "Mathematical method.",
        type: "select",
        choices: [
          { value: "z_score", label: "Z-Score Standardization (mean=0, std=1)" },
          { value: "log", label: "Logarithmic Transform (np.log1p)" },
          { value: "min_max", label: "Min-Max Scaling (0.0 to 1.0)" },
        ],
      },
    ],
    code_template: `import numpy as np\nvals = df["{column}"].to_numpy()\ndf["{column}_zscore"] = (vals - np.mean(vals)) / np.std(vals)\nprint(f"Transformed {column} to z-score standardization.")\n`,
  },

  // --- MATPLOTLIB / VISUALIZATION ---
  {
    id: "matplotlib-scatter-plot",
    title: "Scatter Plot & Trendline",
    package: "Matplotlib",
    category: "visualization",
    description: "Plot two continuous variables with an optional linear regression fit line.",
    learner_goal: "Visually identify correlation, outliers, and linear trends between variables.",
    badge: "Visual Discovery",
    options: [
      { key: "x_column", label: "X-Axis (Feature)", default: "marketing_spend", help_text: "Independent variable.", type: "text" },
      { key: "y_column", label: "Y-Axis (Target)", default: "sales", help_text: "Dependent variable.", type: "text" },
      { key: "title", label: "Chart Title", default: "Marketing Spend vs. Sales Revenue", help_text: "Plot title.", type: "text" },
      {
        key: "show_trendline",
        label: "Show Best-Fit Line",
        default: "yes",
        help_text: "Overlay linear fit.",
        type: "select",
        choices: [
          { value: "yes", label: "Yes - Show Trendline" },
          { value: "no", label: "No - Points Only" },
        ],
      },
    ],
    code_template: `import matplotlib.pyplot as plt\nimport numpy as np\n\nfig, ax = plt.subplots(figsize=(8, 4.8), dpi=140)\nx, y = df["{x_column}"], df["{y_column}"]\nax.scatter(x, y, color="#0f766e", alpha=0.8, s=65, edgecolors="#042f2e", label="Observations")\n\nslope, intercept = np.polyfit(x, y, 1)\nx_line = np.linspace(x.min(), x.max(), 100)\nax.plot(x_line, slope * x_line + intercept, color="#e11d48", linestyle="--", linewidth=2.2, label=f"Trendline (slope={slope:.2f})")\n\nax.set_title("{title}", fontsize=13, fontweight="bold", pad=12)\nax.set_xlabel("{x_column}", fontsize=11)\nax.set_ylabel("{y_column}", fontsize=11)\nax.grid(True, linestyle=":", alpha=0.6)\nax.legend(frameon=True)\nfig.tight_layout()\nplt.show()\n`,
  },
  {
    id: "matplotlib-bar-chart",
    title: "Bar Chart with Data Callouts",
    package: "Matplotlib",
    category: "visualization",
    description: "Compare aggregate values across categories with styled bar charts and direct numerical labels.",
    learner_goal: "Communicate categorical differences effectively to stakeholders.",
    badge: "Categorical",
    options: [
      { key: "category_column", label: "Category Column (X)", default: "region", help_text: "Categories.", type: "text" },
      { key: "value_column", label: "Metric Column (Y)", default: "sales", help_text: "Numeric values.", type: "text" },
      { key: "title", label: "Chart Title", default: "Total Sales Revenue by Region", help_text: "Title.", type: "text" },
    ],
    code_template: `import matplotlib.pyplot as plt\n\nregional = df.groupby("{category_column}")["{value_column}"].sum().sort_values(ascending=False)\nfig, ax = plt.subplots(figsize=(8, 4.8), dpi=140)\ncolors = ["#0f766e", "#0284c7", "#6366f1", "#8b5cf6", "#f59e0b"]\nbars = ax.bar(regional.index, regional.values / 1000, color=colors[:len(regional)], width=0.55, edgecolor="#1e293b")\n\nfor bar in bars:\n    height = bar.get_height()\n    ax.annotate(f"\${height:,.0f}K", xy=(bar.get_x() + bar.get_width()/2, height), xytext=(0, 4), textcoords="offset points", ha="center", fontsize=9.5, fontweight="bold")\n\nax.set_title("{title} (\$ in Thousands)", fontsize=13, fontweight="bold", pad=12)\nax.set_xlabel("{category_column}", fontsize=11)\nax.set_ylabel("Revenue (\$K)", fontsize=11)\nax.grid(axis="y", linestyle=":", alpha=0.6)\nfig.tight_layout()\nplt.show()\n`,
  },
  {
    id: "matplotlib-histogram",
    title: "Histogram & Distribution Skew",
    package: "Matplotlib",
    category: "visualization",
    description: "Visualize frequency distribution and skewness with Mean vs. Median reference lines.",
    learner_goal: "Check data normality, skew, and spread before applying ML models.",
    badge: "Distribution",
    options: [
      { key: "column", label: "Numeric Column", default: "sales", help_text: "Column.", type: "text" },
      { key: "bins", label: "Number of Bins", default: 10, help_text: "Interval count.", type: "number" },
      { key: "title", label: "Chart Title", default: "Distribution of Store Sales Revenue", help_text: "Title.", type: "text" },
    ],
    code_template: `import matplotlib.pyplot as plt\nimport numpy as np\n\nfig, ax = plt.subplots(figsize=(8, 4.8), dpi=140)\nsales = df["{column}"].dropna()\nmean_val, median_val = sales.mean(), sales.median()\n\ncounts, bins, patches = ax.hist(sales, bins={bins}, color="#0f766e", edgecolor="#042f2e", alpha=0.75, rwidth=0.88)\nax.axvline(mean_val, color="#e11d48", linestyle="--", linewidth=2, label=f"Mean: \${mean_val:,.0f}")\nax.axvline(median_val, color="#2563eb", linestyle="-.", linewidth=2, label=f"Median: \${median_val:,.0f}")\n\nax.set_title("{title}", fontsize=13, fontweight="bold", pad=12)\nax.set_xlabel("{column}", fontsize=11)\nax.set_ylabel("Frequency Count", fontsize=11)\nax.grid(axis="y", linestyle=":", alpha=0.6)\nax.legend(frameon=True)\nfig.tight_layout()\nplt.show()\n`,
  },
  {
    id: "matplotlib-line-chart",
    title: "Line Trend Chart",
    package: "Matplotlib",
    category: "visualization",
    description: "Plot sequential data or index progression with connected lines and markers.",
    learner_goal: "Observe changes, trends, or trajectory across ordered observations.",
    badge: "Time-Series",
    options: [
      { key: "x_column", label: "X-Axis Column", default: "store_footfall", help_text: "X axis.", type: "text" },
      { key: "y_column", label: "Y-Axis Column", default: "sales", help_text: "Y axis.", type: "text" },
      { key: "title", label: "Chart Title", default: "Sales Trend Across Footfall", help_text: "Title.", type: "text" },
    ],
    code_template: `import matplotlib.pyplot as plt\nsorted_df = df.sort_values(by="{x_column}")\nfig, ax = plt.subplots(figsize=(8, 4.8), dpi=140)\nax.plot(sorted_df["{x_column}"], sorted_df["{y_column}"], color="#0f766e", marker="o", linewidth=2.2, label="{y_column}")\nax.set_title("{title}", fontsize=13, fontweight="bold", pad=12)\nax.set_xlabel("{x_column}")\nax.set_ylabel("{y_column}")\nax.grid(True, linestyle=":", alpha=0.6)\nfig.tight_layout()\nplt.show()\n`,
  },
  {
    id: "matplotlib-correlation-heatmap",
    title: "Correlation Heatmap Matrix",
    package: "Matplotlib",
    category: "visualization",
    description: "Compute correlation coefficients between numeric columns and display a color-coded matrix.",
    learner_goal: "Identify strong positive/negative relationships and select predictive features.",
    badge: "Feature Analysis",
    options: [
      { key: "title", label: "Heatmap Title", default: "Multi-Variable Feature Correlation Matrix", help_text: "Title.", type: "text" },
    ],
    code_template: `import matplotlib.pyplot as plt\nimport numpy as np\n\nnum_df = df.select_dtypes(include=[np.number])\ncorr = num_df.corr()\nfig, ax = plt.subplots(figsize=(7.5, 6.2), dpi=140)\ncax = ax.matshow(corr, cmap="coolwarm", vmin=-1, vmax=1)\nfig.colorbar(cax, fraction=0.046, pad=0.04, label="Pearson r")\n\ncols = list(corr.columns)\nax.set_xticks(range(len(cols)))\nax.set_yticks(range(len(cols)))\nax.set_xticklabels(cols, rotation=35, ha="left", fontsize=9, fontweight="semibold")\nax.set_yticklabels(cols, fontsize=9, fontweight="semibold")\n\nfor i in range(len(cols)):\n    for j in range(len(cols)):\n        val = corr.iloc[i, j]\n        ax.text(j, i, f"{val:.2f}", ha="center", va="center", color="white" if abs(val) > 0.55 else "black", fontweight="bold")\n\nax.set_title("{title}", fontsize=13, fontweight="bold", pad=28)\nfig.tight_layout()\nplt.show()\n`,
  },
  {
    id: "matplotlib-box-plot",
    title: "Box & Whisker Distribution Plot",
    package: "Matplotlib",
    category: "visualization",
    description: "Visualize median, interquartile range (IQR), whiskers, and potential outliers for numeric features.",
    learner_goal: "Detect outliers and examine multi-group distributional spreads.",
    badge: "Distribution",
    options: [
      { key: "value_column", label: "Numeric Column (Y)", default: "sales", help_text: "Continuous feature.", type: "text" },
      { key: "group_column", label: "Grouping Category", default: "region", help_text: "Category to split boxes.", type: "text" },
      { key: "title", label: "Chart Title", default: "Sales Distribution & Outlier Box Plot", help_text: "Title.", type: "text" },
    ],
    code_template: `import matplotlib.pyplot as plt\n\nfig, ax = plt.subplots(figsize=(8, 4.8), dpi=140)\nif "{group_column}" in df.columns:\n    groups = [grp["{value_column}"].dropna().values for _, grp in df.groupby("{group_column}")]\n    labels = [str(n) for n, _ in df.groupby("{group_column}")]\n    ax.boxplot(groups, tick_labels=labels, patch_artist=True, boxprops=dict(facecolor="#0f766e", alpha=0.75))\n    ax.set_xlabel("{group_column}")\nelse:\n    ax.boxplot(df["{value_column}"].dropna(), patch_artist=True, boxprops=dict(facecolor="#0f766e", alpha=0.75))\n\nax.set_title("{title}", fontsize=13, fontweight="bold", pad=12)\nax.set_ylabel("{value_column}")\nax.grid(axis="y", linestyle=":", alpha=0.6)\nfig.tight_layout()\nplt.show()\n`,
  },
  {
    id: "matplotlib-residuals-plot",
    title: "Regression Residuals Diagnostics",
    package: "Matplotlib",
    category: "visualization",
    description: "Plot regression prediction residuals (errors) against fitted values to diagnose model bias.",
    learner_goal: "Validate linear regression assumptions: unbiased errors centered at zero without funnel patterns.",
    badge: "ML Diagnostics",
    options: [
      { key: "feature_column", label: "Feature Column (X)", default: "marketing_spend", help_text: "Predictor.", type: "text" },
      { key: "target_column", label: "Target Column (y)", default: "sales", help_text: "Outcome.", type: "text" },
      { key: "title", label: "Chart Title", default: "Residuals Diagnostics (Error vs Predicted)", help_text: "Title.", type: "text" },
    ],
    code_template: `from sklearn.linear_model import LinearRegression\nfrom sklearn.model_selection import train_test_split\nimport matplotlib.pyplot as plt\n\nX = df[["{feature_column}"]].dropna()\ny = df["{target_column}"].loc[X.index]\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)\n\nmodel = LinearRegression().fit(X_train, y_train)\ny_pred = model.predict(X_test)\nresiduals = y_test - y_pred\n\nfig, ax = plt.subplots(figsize=(8, 4.8), dpi=140)\nax.scatter(y_pred, residuals, color="#e11d48", alpha=0.85, s=65, edgecolors="#9f1239", label="Residuals")\nax.axhline(0, color="#1e293b", linestyle="--", linewidth=1.8, label="Zero-Error Baseline")\n\nax.set_title("{title}", fontsize=13, fontweight="bold", pad=12)\nax.set_xlabel(f"Predicted {target_column}")\nax.set_ylabel("Residual Error (Actual - Predicted)")\nax.legend()\nax.grid(True, linestyle=":", alpha=0.6)\nfig.tight_layout()\nplt.show()\n`,
  },
  {
    id: "matplotlib-subplots-grid",
    title: "2x2 Subplots Executive Dashboard",
    package: "Matplotlib",
    category: "visualization",
    description: "Assemble a 4-panel executive analytics dashboard in a unified 2x2 grid.",
    learner_goal: "Combine multiple visual perspectives into a unified stakeholder dashboard using plt.subplots(2, 2).",
    badge: "Dashboard Grid",
    options: [
      { key: "title", label: "Dashboard Master Title", default: "Executive Data Analysis & Performance Dashboard", help_text: "Super-title.", type: "text" },
    ],
    code_template: `import matplotlib.pyplot as plt\nimport numpy as np\n\nfig, axes = plt.subplots(2, 2, figsize=(12, 8.5), dpi=140)\nfig.suptitle("{title}", fontsize=15, fontweight="bold", y=0.98)\n\n# 1. Distribution\naxes[0, 0].hist(df["sales"], bins=8, color="#0f766e", alpha=0.8, edgecolor="#042f2e")\naxes[0, 0].set_title("1. Sales Distribution", fontweight="bold")\naxes[0, 0].grid(axis="y", linestyle=":", alpha=0.5)\n\n# 2. Scatter & Fit\nx, y = df["marketing_spend"], df["sales"]\naxes[0, 1].scatter(x, y, color="#0284c7", alpha=0.8)\nslope, intercept = np.polyfit(x, y, 1)\nx_span = np.linspace(x.min(), x.max(), 50)\naxes[0, 1].plot(x_span, slope * x_span + intercept, color="#e11d48", linestyle="--", label=f"Slope {slope:.2f}")\naxes[0, 1].set_title("2. Marketing Spend vs ROI", fontweight="bold")\naxes[0, 1].legend(fontsize=8.5)\naxes[0, 1].grid(True, linestyle=":", alpha=0.5)\n\n# 3. Regional Bars\nreg = df.groupby("region")["sales"].sum() / 1000\naxes[1, 0].bar(reg.index, reg.values, color="#6366f1", edgecolor="#312e81")\naxes[1, 0].set_title("3. Regional Sales (\$K)", fontweight="bold")\naxes[1, 0].grid(axis="y", linestyle=":", alpha=0.5)\n\n# 4. Footfall Scatter\naxes[1, 1].scatter(df["store_footfall"], df["sales"], color="#10b981", alpha=0.85)\naxes[1, 1].set_title("4. Footfall Impact", fontweight="bold")\naxes[1, 1].grid(True, linestyle=":", alpha=0.5)\n\nfig.tight_layout(rect=[0, 0, 1, 0.96])\nplt.show()\n`,
  },

  // --- SCIKIT-LEARN / MACHINE LEARNING ---
  {
    id: "sklearn-scaler",
    title: "StandardScaler Preprocessor",
    package: "Scikit-learn",
    category: "machine-learning",
    description: "Standardize features by removing the mean and scaling to unit variance (z-score normalization).",
    learner_goal: "Normalize numeric features so gradient-based and distance-based algorithms train optimally.",
    badge: "ML Preprocessing",
    options: [
      { key: "feature_columns", label: "Features to Scale", default: "marketing_spend, store_footfall", help_text: "Comma-separated features.", type: "text" },
    ],
    code_template: `from sklearn.preprocessing import StandardScaler\n\nfeatures = [f.strip() for f in "{feature_columns}".split(",") if f.strip() in df.columns]\nscaler = StandardScaler()\ndf_scaled = scaler.fit_transform(df[features].fillna(0))\nfor i, col in enumerate(features):\n    df[f"{col}_scaled"] = df_scaled[:, i]\nprint(f"Standardized features with mean=0, std=1: {features}")\n`,
  },
  {
    id: "sklearn-regression",
    title: "Linear Regression Model",
    package: "Scikit-learn",
    category: "machine-learning",
    description: "Train a supervised Linear Regression model, perform train/test split, and evaluate R² and MSE.",
    learner_goal: "Learn predictive modeling, feature-to-target mapping, and evaluation metrics.",
    badge: "Predictive ML",
    options: [
      { key: "feature_column", label: "Feature Column (X)", default: "marketing_spend", help_text: "Predictor.", type: "text" },
      { key: "target_column", label: "Target Column (y)", default: "sales", help_text: "Target to predict.", type: "text" },
      { key: "test_size", label: "Test Split Ratio", default: 0.2, help_text: "Fraction reserved for test.", type: "number" },
    ],
    code_template: `from sklearn.linear_model import LinearRegression\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.metrics import r2_score, mean_absolute_error\nimport matplotlib.pyplot as plt\n\nX = df[["{feature_column}"]].fillna(0)\ny = df["{target_column}"]\n\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size={test_size}, random_state=42)\nmodel = LinearRegression().fit(X_train, y_train)\ny_pred = model.predict(X_test)\n\nr2 = r2_score(y_test, y_pred)\nmae = mean_absolute_error(y_test, y_pred)\nprint(f"Linear Regression R² Score: {r2:.4f}")\nprint(f"Mean Absolute Error (MAE): \${mae:,.2f}")\nprint(f"Formula: {target_column} = {model.intercept_:.2f} + {model.coef_[0]:.2f} * {feature_column}\\n")\n\n# Actual vs. Predicted Plot\nfig, ax = plt.subplots(figsize=(7, 4.8), dpi=140)\nax.scatter(y_test, y_pred, color="#0f766e", alpha=0.85, s=65, label="Predictions")\nax.plot([y.min(), y.max()], [y.min(), y.max()], "r--", label="Ideal 45° Fit")\nax.set_title(f"Actual vs. Predicted {target_column} (R² = {r2:.3f})", fontweight="bold", pad=12)\nax.set_xlabel(f"Actual {target_column}")\nax.set_ylabel(f"Predicted {target_column}")\nax.legend()\nax.grid(True, linestyle=":", alpha=0.6)\nfig.tight_layout()\nplt.show()\n`,
  },
  {
    id: "sklearn-random-forest-regressor",
    title: "Random Forest Regressor",
    package: "Scikit-learn",
    category: "machine-learning",
    description: "Train an ensemble of decision trees for robust non-linear regression with feature importance ranking.",
    learner_goal: "Harness ensemble learning to capture non-linear interactions without overfitting.",
    badge: "Ensemble ML",
    options: [
      { key: "feature_columns", label: "Features", default: "marketing_spend, store_footfall", help_text: "Numeric features.", type: "text" },
      { key: "target_column", label: "Target Column (y)", default: "sales", help_text: "Target.", type: "text" },
      { key: "n_estimators", label: "Number of Trees", default: 50, help_text: "Tree count.", type: "number" },
      { key: "max_depth", label: "Max Tree Depth", default: 4, help_text: "Pruning depth.", type: "number" },
    ],
    code_template: `from sklearn.ensemble import RandomForestRegressor\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.metrics import r2_score, mean_absolute_error\nimport matplotlib.pyplot as plt\n\nfeats = [f.strip() for f in "{feature_columns}".split(",") if f.strip() in df.columns]\nX, y = df[feats].fillna(0), df["{target_column}"]\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)\n\nrf = RandomForestRegressor(n_estimators={n_estimators}, max_depth={max_depth}, random_state=42).fit(X_train, y_train)\ny_pred = rf.predict(X_test)\n\nprint(f"Random Forest Regressor R² Score: {r2_score(y_test, y_pred):.4f}")\nprint(f"Feature Importances: {dict(zip(feats, rf.feature_importances_))}")\n\nfig, ax = plt.subplots(figsize=(7, 4), dpi=140)\nax.barh(feats, rf.feature_importances_, color="#0f766e", edgecolor="#042f2e")\nax.set_title("Random Forest Feature Importances", fontweight="bold", pad=12)\nax.set_xlabel("Importance Ratio")\nax.grid(axis="x", linestyle=":", alpha=0.6)\nfig.tight_layout()\nplt.show()\n`,
  },
  {
    id: "sklearn-classification",
    title: "Decision Tree Classifier",
    package: "Scikit-learn",
    category: "machine-learning",
    description: "Train a Decision Tree Classifier to predict categorical outcomes and visualize the Confusion Matrix.",
    learner_goal: "Understand classification, decision rules, accuracy, precision, and confusion matrices.",
    badge: "Classification ML",
    options: [
      { key: "feature_columns", label: "Feature Columns", default: "tenure_months, monthly_charges, support_tickets", help_text: "Input features.", type: "text" },
      { key: "target_column", label: "Target Class (y)", default: "churned", help_text: "Target label.", type: "text" },
      { key: "max_depth", label: "Max Depth", default: 3, help_text: "Tree depth.", type: "number" },
    ],
    code_template: `from sklearn.tree import DecisionTreeClassifier\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.metrics import accuracy_score, classification_report, confusion_matrix\nimport matplotlib.pyplot as plt\n\nfeats = [f.strip() for f in "{feature_columns}".split(",") if f.strip() in df.columns]\nX = df[feats].fillna(0)\ny = df["{target_column}"].astype(str)\n\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)\nclf = DecisionTreeClassifier(max_depth={max_depth}, random_state=42).fit(X_train, y_train)\ny_pred = clf.predict(X_test)\n\nacc = accuracy_score(y_test, y_pred)\nprint(f"Decision Tree Accuracy: {acc*100:.1f}%")\nprint(classification_report(y_test, y_pred))\n\n# Confusion Matrix\ncm = confusion_matrix(y_test, y_pred, labels=clf.classes_)\nfig, ax = plt.subplots(figsize=(6, 4.5), dpi=140)\ncax = ax.matshow(cm, cmap="Blues")\nfig.colorbar(cax)\nax.set_xticks(range(len(clf.classes_)))\nax.set_yticks(range(len(clf.classes_)))\nax.set_xticklabels(clf.classes_, fontweight="bold")\nax.set_yticklabels(clf.classes_, fontweight="bold")\nfor i in range(len(clf.classes_)):\n    for j in range(len(clf.classes_)):\n        ax.text(j, i, str(cm[i, j]), ha="center", va="center", color="white" if cm[i, j] > cm.max()/2 else "black", fontweight="bold")\nax.set_title(f"Confusion Matrix ({target_column})", fontweight="bold", pad=24)\nfig.tight_layout()\nplt.show()\n`,
  },
  {
    id: "sklearn-random-forest-classifier",
    title: "Random Forest Classifier",
    package: "Scikit-learn",
    category: "machine-learning",
    description: "Train an ensemble of randomized decision trees for robust classification and feature importance.",
    learner_goal: "Improve classification accuracy and stability via bagging ensemble aggregation.",
    badge: "Ensemble ML",
    options: [
      { key: "feature_columns", label: "Feature Columns", default: "tenure_months, monthly_charges, support_tickets", help_text: "Features.", type: "text" },
      { key: "target_column", label: "Target Class (y)", default: "churned", help_text: "Class label.", type: "text" },
      { key: "n_estimators", label: "Number of Trees", default: 50, help_text: "Tree count.", type: "number" },
      { key: "max_depth", label: "Max Depth", default: 4, help_text: "Depth.", type: "number" },
    ],
    code_template: `from sklearn.ensemble import RandomForestClassifier\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.metrics import accuracy_score, classification_report\n\nfeats = [f.strip() for f in "{feature_columns}".split(",") if f.strip() in df.columns]\nX, y = df[feats].fillna(0), df["{target_column}"].astype(str)\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)\n\nrf_clf = RandomForestClassifier(n_estimators={n_estimators}, max_depth={max_depth}, random_state=42).fit(X_train, y_train)\ny_pred = rf_clf.predict(X_test)\nprint(f"Random Forest Accuracy: {accuracy_score(y_test, y_pred)*100:.1f}%")\nprint(classification_report(y_test, y_pred))\n`,
  },
  {
    id: "sklearn-logistic-regression",
    title: "Logistic Regression Classifier",
    package: "Scikit-learn",
    category: "machine-learning",
    description: "Fit a linear classification model predicting event probabilities with sigmoid transformation.",
    learner_goal: "Master probabilistic binary classification and interpret odds ratios.",
    badge: "Classification ML",
    options: [
      { key: "feature_columns", label: "Features", default: "tenure_months, monthly_charges, support_tickets", help_text: "Features.", type: "text" },
      { key: "target_column", label: "Target Class (y)", default: "churned", help_text: "Binary class.", type: "text" },
      { key: "c_param", label: "Inverse Regularization (C)", default: 1.0, help_text: "Regularization parameter.", type: "number" },
    ],
    code_template: `from sklearn.linear_model import LogisticRegression\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.metrics import accuracy_score, classification_report\n\nfeats = [f.strip() for f in "{feature_columns}".split(",") if f.strip() in df.columns]\nX, y = df[feats].fillna(0), df["{target_column}"].astype(str)\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)\n\nlr = LogisticRegression(C={c_param}, max_iter=500).fit(X_train, y_train)\ny_pred = lr.predict(X_test)\nprint(f"Logistic Regression Accuracy: {accuracy_score(y_test, y_pred)*100:.1f}%")\nprint(classification_report(y_test, y_pred))\n`,
  },
  {
    id: "sklearn-clustering",
    title: "K-Means Clustering",
    package: "Scikit-learn",
    category: "machine-learning",
    description: "Group unlabeled data into K distinct clusters using Euclidean distance and centroid discovery.",
    learner_goal: "Explore unsupervised learning, customer segmentation, and cluster centroids.",
    badge: "Unsupervised ML",
    options: [
      { key: "feature_x", label: "First Feature (X)", default: "marketing_spend", help_text: "X dimension.", type: "text" },
      { key: "feature_y", label: "Second Feature (Y)", default: "store_footfall", help_text: "Y dimension.", type: "text" },
      { key: "n_clusters", label: "Number of Clusters (K)", default: 3, help_text: "Cluster count.", type: "number" },
    ],
    code_template: `from sklearn.cluster import KMeans\nimport matplotlib.pyplot as plt\n\nX_cluster = df[["{feature_x}", "{feature_y}"]].fillna(0)\nkmeans = KMeans(n_clusters={n_clusters}, random_state=42, n_init=10).fit(X_cluster)\ndf["cluster"] = kmeans.labels_\n\nfig, ax = plt.subplots(figsize=(7.5, 4.8), dpi=140)\nax.scatter(df["{feature_x}"], df["{feature_y}"], c=df["cluster"], cmap="viridis", s=65, alpha=0.8)\nax.scatter(kmeans.cluster_centers_[:, 0], kmeans.cluster_centers_[:, 1], c="red", marker="X", s=200, label="Centroids")\nax.set_title(f"K-Means Clustering ({n_clusters} Clusters)", fontweight="bold", pad=12)\nax.set_xlabel("{feature_x}")\nax.set_ylabel("{feature_y}")\nax.legend()\nax.grid(True, linestyle=":", alpha=0.6)\nfig.tight_layout()\nplt.show()\n`,
  },
  {
    id: "sklearn-pca",
    title: "PCA Dimensionality Reduction",
    package: "Scikit-learn",
    category: "machine-learning",
    description: "Decompose multi-dimensional data into 2 Principal Components while maximizing preserved variance.",
    learner_goal: "Compress high-dimensional datasets into 2D visualizations via orthogonal projection.",
    badge: "Dimensionality ML",
    options: [
      { key: "feature_columns", label: "Feature Columns", default: "square_feet, bedrooms, bathrooms, year_built, price", help_text: "Features to project.", type: "text" },
      { key: "color_by", label: "Color Points By", default: "region", help_text: "Category color.", type: "text" },
    ],
    code_template: `from sklearn.decomposition import PCA\nfrom sklearn.preprocessing import StandardScaler\nimport matplotlib.pyplot as plt\n\nfeats = [f.strip() for f in "{feature_columns}".split(",") if f.strip() in df.columns]\nX_scaled = StandardScaler().fit_transform(df[feats].select_dtypes(include="number").fillna(0))\n\npca = PCA(n_components=2)\ncoords = pca.fit_transform(X_scaled)\ndf["PC1"], df["PC2"] = coords[:, 0], coords[:, 1]\nvar_exp = pca.explained_variance_ratio_\nprint(f"PCA Variance Explained: {var_exp.sum()*100:.1f}%")\n\nfig, ax = plt.subplots(figsize=(7.5, 4.8), dpi=140)\nax.scatter(df["PC1"], df["PC2"], color="#0f766e", alpha=0.85, s=65)\nax.set_title(f"PCA 2D Projection ({var_exp.sum()*100:.1f}% Variance Explained)", fontweight="bold", pad=12)\nax.set_xlabel(f"PC1 ({var_exp[0]*100:.1f}% var)")\nax.set_ylabel(f"PC2 ({var_exp[1]*100:.1f}% var)")\nax.grid(True, linestyle=":", alpha=0.6)\nfig.tight_layout()\nplt.show()\n`,
  },
];

// ==========================================
// WORKSHOP 1 CLIENT FALLBACK CURRICULUM (6 STAGES)
// ==========================================

const fallbackWorkshopSteps: WorkshopStep[] = [
  {
    id: "step-1-ingest-inspect",
    stage: 1,
    title: "1. Data Ingestion, Schema Profiling & Health Inspection",
    subtitle: "Lay the foundation of an efficient data analysis pipeline",
    objective:
      "Load raw tabular data, verify row/column dimensions, inspect data types, check for missing values, and compute 5-number descriptive statistics before any plotting.",
    dataset_name: "sales_marketing.csv",
    concept_summary:
      "Efficient data analysis always starts with understanding data types and summary distributions. Plotting without inspecting data boundaries (min, max, IQR) leads to distorted axes, unhandled NaN exceptions, and misleading conclusions.",
    starter_code: `import pandas as pd
import numpy as np

# Step 1: Ingest CSV dataset into a Pandas DataFrame
df = pd.read_csv("sales_marketing.csv")

print("=== 1. Dataset Dimensions & Schema ===")
print(f"Total Observations (Rows): {len(df)}")
print(f"Total Features (Columns):  {len(df.columns)}")
print("\\nColumn Data Types:")
print(df.dtypes)

print("\\n=== 2. Missing Values Health Check ===")
print(df.isnull().sum())

print("\\n=== 3. 5-Number Descriptive Statistics ===")
print(df.describe().round(2))
`,
    solution_code: `import pandas as pd
import numpy as np

# Production-grade data inspection pipeline
df = pd.read_csv("sales_marketing.csv")

print("=== 1. Dataset Dimensions & Schema ===")
print(f"Total Observations (Rows): {len(df)}")
print(f"Total Features (Columns):  {len(df.columns)}")
print(f"Memory Usage: {df.memory_usage().sum() / 1024:.2f} KB")
print("\\nColumn Data Types:")
print(df.dtypes)

print("\\n=== 2. Missing Values Health Check ===")
missing_report = pd.DataFrame({
    'Missing_Count': df.isnull().sum(),
    'Missing_Pct': (df.isnull().sum() / len(df) * 100).round(2)
})
print(missing_report)

print("\\n=== 3. Descriptive Statistics (Numeric & Categorical) ===")
print(df.describe(include='all').round(2))
`,
    code_mappings: [
      {
        code_snippet: "df = pd.read_csv('sales_marketing.csv')",
        visual_element: "In-Memory 2D Tabular DataFrame",
        explanation:
          "Loads CSV records into memory with automatic column header detection and dtype inference.",
      },
      {
        code_snippet: "df.dtypes",
        visual_element: "Column Type Profiling",
        explanation:
          "Identifies continuous numbers (float64, int64) vs categorical groups (object).",
      },
      {
        code_snippet: "df.isnull().sum()",
        visual_element: "Data Quality Audit",
        explanation:
          "Audits null/NaN values that must be handled before feeding into visual axes or models.",
      },
      {
        code_snippet: "df.describe().round(2)",
        visual_element: "Descriptive Statistics Scorecard",
        explanation:
          "Calculates Mean, Median (50%), Std Dev, Min/Max, and IQR (75%-25%) to define plotting limits.",
      },
    ],
    key_takeaways: [
      "Never create visualizations before inspecting minimum, maximum, and median data bounds.",
      "Verify that numeric columns are correctly parsed as int/float and categorical columns as object.",
      "Always check for missing null values that could break Matplotlib rendering loops.",
    ],
    pro_tips: [
      "Use df.info(memory_usage='deep') in production to monitor DataFrame RAM consumption.",
      "Use df['col'].value_counts() on categorical fields to inspect category balance.",
    ],
  },
  {
    id: "step-2-univariate-distribution",
    stage: 2,
    title: "2. Univariate Distribution, Skewness & Central Tendency",
    subtitle: "Master Matplotlib Histograms with Mean vs. Median reference lines",
    objective:
      "Plot the frequency distribution of continuous features, configure bin intervals, and draw explicit Mean and Median lines to visually identify positive/negative skewness and outliers.",
    dataset_name: "sales_marketing.csv",
    concept_summary:
      "A frequency histogram reveals whether your data follows a normal bell curve, has multiple modal peaks, or is skewed by extreme outliers. Comparing the arithmetic Mean against the middle Median exposes distribution skewness immediately.",
    starter_code: `import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

df = pd.read_csv("sales_marketing.csv")

# 1. Initialize Figure and 2D Axes
fig, ax = plt.subplots(figsize=(8, 4.8), dpi=140)

# 2. Extract feature and calculate central tendency
sales = df["sales"]
mean_val = sales.mean()
median_val = sales.median()

# 3. Render frequency histogram with clean bar spacing
counts, bins, patches = ax.hist(
    sales,
    bins=8,
    color="#0f766e",
    edgecolor="#042f2e",
    alpha=0.75,
    rwidth=0.88,
)

# 4. Draw reference lines for Mean (dashed red) and Median (dash-dot blue)
ax.axvline(mean_val, color="#e11d48", linestyle="--", linewidth=2, label=f"Mean: \${mean_val:,.0f}")
ax.axvline(median_val, color="#2563eb", linestyle="-.", linewidth=2, label=f"Median: \${median_val:,.0f}")

# 5. Polish typography, axis labels & gridlines
ax.set_title("Distribution of Store Sales Revenue & Central Tendency", fontsize=13, fontweight="bold", pad=12)
ax.set_xlabel("Sales Revenue ($)", fontsize=11, fontweight="semibold")
ax.set_ylabel("Frequency (Store Count)", fontsize=11, fontweight="semibold")
ax.grid(axis="y", linestyle=":", alpha=0.6)
ax.legend(frameon=True, facecolor="white", edgecolor="#cbd5e1")

fig.tight_layout()
plt.show()

print(f"Mean Sales:   \${mean_val:,.2f}")
print(f"Median Sales: \${median_val:,.2f}")
skew_diff = (mean_val - median_val) / median_val * 100
print(f"Skewness Assessment: Mean is {abs(skew_diff):.1f}% {'higher' if skew_diff > 0 else 'lower'} than Median.")
`,
    solution_code: `import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

df = pd.read_csv("sales_marketing.csv")

fig, ax = plt.subplots(figsize=(8, 5), dpi=140)
sales = df["sales"]
mean_val = sales.mean()
median_val = sales.median()
std_val = sales.std()

# Histogram with styled gradient-like edges
counts, bins, patches = ax.hist(
    sales, bins=10, color="#0f766e", edgecolor="#115e59", alpha=0.8, rwidth=0.88
)

# Mean and Median vertical lines
ax.axvline(mean_val, color="#e11d48", linestyle="--", linewidth=2.2, label=f"Mean: \${mean_val:,.0f}")
ax.axvline(median_val, color="#2563eb", linestyle="-.", linewidth=2.2, label=f"Median: \${median_val:,.0f}")

# 1-Std Dev Shaded Confidence Band
ax.axvspan(mean_val - std_val, mean_val + std_val, color="#0f766e", alpha=0.08, label=f"±1 Std Dev (\${std_val:,.0f})")

ax.set_title("Distribution of Store Sales Revenue (With 1-Std Dev Range)", fontsize=13, fontweight="bold", pad=14)
ax.set_xlabel("Sales Revenue ($)", fontsize=11, fontweight="semibold")
ax.set_ylabel("Frequency Count", fontsize=11, fontweight="semibold")
ax.grid(axis="y", linestyle=":", alpha=0.6)
ax.legend(loc="upper right", frameon=True, facecolor="#f8fafc", edgecolor="#cbd5e1")
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)

fig.tight_layout()
plt.show()
`,
    code_mappings: [
      {
        code_snippet: "fig, ax = plt.subplots(figsize=(8, 4.8), dpi=140)",
        visual_element: "Matplotlib Figure & Axes Canvas",
        explanation: "Initializes the 8x4.8 inch canvas with crisp 140 DPI rendering.",
      },
      {
        code_snippet: "ax.hist(sales, bins=8, rwidth=0.88)",
        visual_element: "Histogram Frequency Bars",
        explanation: "Discretizes continuous numeric sales values into 8 interval bins with modern gap spacing.",
      },
      {
        code_snippet: "ax.axvline(mean_val, color='#e11d48', linestyle='--')",
        visual_element: "Red Dashed Mean Reference Line",
        explanation: "Draws a vertical line at the arithmetic mean across the entire height of the y-axis.",
      },
      {
        code_snippet: "ax.axvline(median_val, color='#2563eb', linestyle='-.')",
        visual_element: "Blue Dash-Dot Median Line",
        explanation: "Draws a vertical line at the 50th percentile to diagnose skewness relative to the mean.",
      },
    ],
    key_takeaways: [
      "If Mean > Median, the distribution is right-skewed (pulled by high-value outliers).",
      "Setting rwidth=0.85-0.90 creates cleaner, modern histogram bars compared to default touching bars.",
      "Always include units (e.g. $, counts) in your axis labels for clear communication.",
    ],
    pro_tips: [
      "Use ax.spines['top'].set_visible(False) to maximize the data-ink ratio.",
    ],
  },
  {
    id: "step-3-categorical-comparisons",
    stage: 3,
    title: "3. Categorical Comparisons & Ranked Bar Charts with Direct Data Callouts",
    subtitle: "Deliver crystal-clear group comparisons without axis eye fatigue",
    objective:
      "Group data by category (e.g. region), compute aggregated sums and means, sort the values hierarchically, and render a styled bar chart with direct numerical callouts above each bar.",
    dataset_name: "sales_marketing.csv",
    concept_summary:
      "Unsorted bar charts force stakeholders to jump back and forth between bars and the y-axis. Ranking bars descending and adding direct value labels ($K) eliminates cognitive overhead and highlights the top performer immediately.",
    starter_code: `import matplotlib.pyplot as plt
import pandas as pd

df = pd.read_csv("sales_marketing.csv")

# 1. Group by Region and compute Total & Average Sales, sorted descending
regional = df.groupby("region")["sales"].agg(["sum", "mean"]).sort_values(by="sum", ascending=False)

fig, ax = plt.subplots(figsize=(8, 4.8), dpi=140)

# 2. Modern accessible color palette
colors = ["#0f766e", "#0284c7", "#6366f1", "#8b5cf6", "#f59e0b"]
bars = ax.bar(
    regional.index,
    regional["sum"] / 1000,
    color=colors[:len(regional)],
    width=0.55,
    edgecolor="#1e293b",
    linewidth=0.8,
)

# 3. Add direct data labels on top of bars (avoids eye fatigue from reading axes)
for bar in bars:
    height = bar.get_height()
    ax.annotate(
        f"\${height:,.1f}K",
        xy=(bar.get_x() + bar.get_width() / 2, height),
        xytext=(0, 5),
        textcoords="offset points",
        ha="center",
        va="bottom",
        fontsize=9.5,
        fontweight="bold",
        color="#0f172a",
    )

# 4. Clean chart styling
ax.set_title("Total Sales Revenue by Region ($ in Thousands)", fontsize=13, fontweight="bold", pad=14)
ax.set_xlabel("Store Region", fontsize=11, fontweight="semibold")
ax.set_ylabel("Revenue ($K)", fontsize=11, fontweight="semibold")
ax.set_ylim(0, (regional["sum"].max() / 1000) * 1.18)
ax.grid(axis="y", linestyle=":", alpha=0.7)
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)

fig.tight_layout()
plt.show()

print("Top Performing Region:", regional.index[0], f"(\${regional['sum'].iloc[0]:,.0f})")
`,
    solution_code: `import matplotlib.pyplot as plt
import pandas as pd

df = pd.read_csv("sales_marketing.csv")
regional = df.groupby("region")["sales"].agg(["sum", "mean", "count"]).sort_values(by="sum", ascending=False)

fig, ax = plt.subplots(figsize=(8.5, 5), dpi=140)
colors = ["#0f766e", "#0284c7", "#6366f1", "#8b5cf6", "#f59e0b"]
bars = ax.bar(regional.index, regional["sum"] / 1000, color=colors[:len(regional)], width=0.52, edgecolor="#0f172a", linewidth=0.8)

for bar, (reg_name, row) in zip(bars, regional.iterrows()):
    height = bar.get_height()
    avg_k = row["mean"] / 1000
    ax.annotate(
        f"\${height:,.0f}K\\n(avg \${avg_k:.1f}K)",
        xy=(bar.get_x() + bar.get_width() / 2, height),
        xytext=(0, 5),
        textcoords="offset points",
        ha="center",
        va="bottom",
        fontsize=9,
        fontweight="bold",
        color="#1e293b",
        linespacing=1.2,
    )

ax.set_title("Total & Average Regional Sales Revenue", fontsize=13, fontweight="bold", pad=14)
ax.set_xlabel("Region", fontsize=11, fontweight="semibold")
ax.set_ylabel("Total Revenue ($ in Thousands)", fontsize=11, fontweight="semibold")
ax.set_ylim(0, (regional["sum"].max() / 1000) * 1.25)
ax.grid(axis="y", linestyle=":", alpha=0.6)
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)

fig.tight_layout()
plt.show()
`,
    code_mappings: [
      {
        code_snippet: "df.groupby('region')['sales'].agg(...).sort_values(by='sum', ascending=False)",
        visual_element: "Ranked Categorical Aggregation",
        explanation: "Pivots raw records into grouped sums and sorts descending so the largest bar appears first.",
      },
      {
        code_snippet: "ax.bar(regional.index, regional['sum'] / 1000, width=0.55)",
        visual_element: "Vertical Categorical Bars",
        explanation: "Creates proportional bars scaled in thousands of dollars ($K) to simplify numerical reading.",
      },
      {
        code_snippet: "ax.annotate(f'${height:,.1f}K', xy=..., textcoords='offset points')",
        visual_element: "Direct Numeric Top Callouts",
        explanation: "Places formatted dollar values directly on top of each bar, removing the need to trace axes.",
      },
    ],
    key_takeaways: [
      "Always sort categorical bars unless there is a natural order (like months or days).",
      "Direct data labeling above bars drastically improves audience comprehension speed.",
      "Scale large numbers (divide by 1,000 for '$K') to prevent cluttered axis tick labels.",
    ],
    pro_tips: [
      "For categories with long names (>10 chars), use horizontal bar charts ax.barh() so labels read left-to-right.",
    ],
  },
  {
    id: "step-4-bivariate-scatter-trend",
    stage: 4,
    title: "4. Bivariate Correlation & Regression Best-Fit Line (Scatter + Polyfit)",
    subtitle: "Uncover continuous feature relationships and model linear slopes",
    objective:
      "Plot two continuous features using Matplotlib scatter points with alpha transparency, compute Pearson correlation r, and overlay a NumPy least-squares regression trendline with formula callout.",
    dataset_name: "sales_marketing.csv",
    concept_summary:
      "Scatter plots are the primary tool for testing relationships between two numeric variables (e.g., Marketing Spend vs. Sales Revenue). Overlaying a least-squares trendline (y = mx + b) quantified with Pearson r reveals direction, slope, and predictive potential.",
    starter_code: `import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

df = pd.read_csv("sales_marketing.csv")
x = df["marketing_spend"]
y = df["sales"]

fig, ax = plt.subplots(figsize=(8, 5), dpi=140)

# 1. Scatter points with alpha to reveal density
ax.scatter(
    x,
    y,
    color="#0f766e",
    alpha=0.75,
    s=70,
    edgecolors="#042f2e",
    linewidth=0.8,
    label="Store Observations",
)

# 2. Calculate Pearson correlation coefficient & best-fit line
r = np.corrcoef(x, y)[0, 1]
slope, intercept = np.polyfit(x, y, deg=1)
x_line = np.linspace(x.min(), x.max(), 100)
y_line = slope * x_line + intercept

# 3. Draw best-fit regression trendline
ax.plot(
    x_line,
    y_line,
    color="#e11d48",
    linestyle="--",
    linewidth=2.5,
    label=f"Trendline (Slope = {slope:.2f}x)",
)

# 4. Statistical annotation box
ax.text(
    0.05,
    0.92,
    f"Pearson r = {r:.3f}\\nLinear Fit: y = {slope:.2f}x + \${intercept:,.0f}",
    transform=ax.transAxes,
    fontsize=9.5,
    fontweight="semibold",
    verticalalignment="top",
    bbox=dict(boxstyle="round,pad=0.5", facecolor="#f8fafc", edgecolor="#cbd5e1"),
)

ax.set_title("Marketing Spend vs. Sales Revenue (Bivariate Correlation)", fontsize=13, fontweight="bold", pad=12)
ax.set_xlabel("Marketing Spend ($)", fontsize=11, fontweight="semibold")
ax.set_ylabel("Sales Revenue ($)", fontsize=11, fontweight="semibold")
ax.grid(True, linestyle=":", alpha=0.6)
ax.legend(loc="lower right", frameon=True, facecolor="white", edgecolor="#cbd5e1")

fig.tight_layout()
plt.show()

print(f"Pearson Correlation (r): {r:.4f}")
print(f"Interpretation: For every $1 invested in marketing, sales increase by approximately \${slope:.2f}.")
`,
    solution_code: `import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

df = pd.read_csv("sales_marketing.csv")
x = df["marketing_spend"]
y = df["sales"]

fig, ax = plt.subplots(figsize=(8.5, 5.2), dpi=140)

scatter = ax.scatter(
    x, y, c=df["satisfaction_score"], cmap="tealrose" if "tealrose" in plt.colormaps() else "viridis",
    s=80, edgecolors="#1e293b", alpha=0.85, linewidth=0.8
)
cbar = fig.colorbar(scatter, ax=ax, pad=0.03)
cbar.set_label("Customer Satisfaction Score (1-5)", fontsize=9.5, fontweight="semibold")

slope, intercept = np.polyfit(x, y, 1)
r = np.corrcoef(x, y)[0, 1]
x_line = np.linspace(x.min(), x.max(), 100)
ax.plot(x_line, slope * x_line + intercept, color="#e11d48", linestyle="--", linewidth=2.5, label=f"Fit: y = {slope:.2f}x + {intercept:,.0f}")

ax.set_title("Marketing Spend vs. Sales Revenue (Colored by Satisfaction)", fontsize=13, fontweight="bold", pad=12)
ax.set_xlabel("Marketing Spend ($)", fontsize=11, fontweight="semibold")
ax.set_ylabel("Sales Revenue ($)", fontsize=11, fontweight="semibold")
ax.grid(True, linestyle=":", alpha=0.6)
ax.legend(loc="lower right", frameon=True)

fig.tight_layout()
plt.show()
`,
    code_mappings: [
      {
        code_snippet: "ax.scatter(x, y, alpha=0.75, s=70)",
        visual_element: "Scatter Observation Points",
        explanation: "Renders 2D data coordinates; alpha transparency reveals overlapping density.",
      },
      {
        code_snippet: "slope, intercept = np.polyfit(x, y, deg=1)",
        visual_element: "Least Squares Parameter Fitting",
        explanation: "Finds the slope m and intercept b minimizing squared residual errors.",
      },
      {
        code_snippet: "ax.plot(x_line, y_line, '--', color='#e11d48')",
        visual_element: "Red Dashed Trendline",
        explanation: "Plots the continuous regression trajectory across observations.",
      },
    ],
    key_takeaways: [
      "Use alpha transparency (alpha=0.6-0.8) on scatter plots to prevent overplotting.",
      "Pearson r > 0.7 signifies strong positive correlation.",
      "The slope represents the marginal rate of return ($/unit increase in x).",
    ],
    pro_tips: [
      "Use np.corrcoef(x, y)[0, 1] for instantaneous Pearson r calculation without external packages.",
    ],
  },
  {
    id: "step-5-correlation-matrix-heatmap",
    stage: 5,
    title: "5. Multi-Variable Correlation Matrix Heatmap & Colormap Contrast",
    subtitle: "Survey multi-collinearity and feature interactions across your entire dataset",
    objective:
      "Calculate pairwise correlation coefficients across all numeric variables in a DataFrame and render a color-coded heatmap with dynamic black/white text overlays and a colorbar.",
    dataset_name: "sales_marketing.csv",
    concept_summary:
      "When analyzing datasets with dozens of features, one-by-one scatter plots are too slow. A correlation matrix heatmap gives an instant bird's-eye view of relationships across all numeric columns simultaneously.",
    starter_code: `import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

df = pd.read_csv("sales_marketing.csv")

# 1. Select numeric features & compute correlation matrix
num_df = df.select_dtypes(include=[np.number])
corr = num_df.corr()

fig, ax = plt.subplots(figsize=(7, 6), dpi=140)

# 2. Display matrix with diverging colormap
cax = ax.matshow(corr, cmap="coolwarm", vmin=-1, vmax=1)
fig.colorbar(cax, fraction=0.046, pad=0.04, label="Pearson Correlation (r)")

# 3. Label ticks along top and left
cols = list(corr.columns)
ax.set_xticks(range(len(cols)))
ax.set_yticks(range(len(cols)))
ax.set_xticklabels(cols, rotation=35, ha="left", fontsize=9, fontweight="semibold")
ax.set_yticklabels(cols, fontsize=9, fontweight="semibold")

# 4. Text overlays with dynamic contrast coloring
for i in range(len(cols)):
    for j in range(len(cols)):
        val = corr.iloc[i, j]
        text_color = "white" if abs(val) > 0.55 else "black"
        ax.text(
            j,
            i,
            f"{val:.2f}",
            ha="center",
            va="center",
            color=text_color,
            fontweight="bold",
            fontsize=9.5,
        )

ax.set_title("Multi-Variable Feature Correlation Matrix", fontsize=13, fontweight="bold", pad=28)
fig.tight_layout()
plt.show()

print("=== Strongest Predictors for Sales ===")
top_corr = corr["sales"].drop("sales").sort_values(ascending=False)
for feature, score in top_corr.items():
    print(f"• {feature:22s} : r = {score:+.3f}")
`,
    solution_code: `import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

df = pd.read_csv("sales_marketing.csv")
num_df = df.select_dtypes(include=[np.number])
corr = num_df.corr()

fig, ax = plt.subplots(figsize=(7.5, 6.2), dpi=140)
cax = ax.matshow(corr, cmap="RdBu_r", vmin=-1, vmax=1)
cbar = fig.colorbar(cax, fraction=0.046, pad=0.04)
cbar.set_label("Pearson Correlation Coefficient", fontsize=10, fontweight="semibold")

cols = [c.replace('_', ' ').title() for c in corr.columns]
ax.set_xticks(range(len(cols)))
ax.set_yticks(range(len(cols)))
ax.set_xticklabels(cols, rotation=30, ha="left", fontsize=9, fontweight="semibold")
ax.set_yticklabels(cols, fontsize=9, fontweight="semibold")

for i in range(len(cols)):
    for j in range(len(cols)):
        val = corr.iloc[i, j]
        color = "white" if abs(val) > 0.5 else "#0f172a"
        ax.text(j, i, f"{val:.2f}", ha="center", va="center", color=color, fontweight="bold", fontsize=9.5)

ax.set_title("Feature Correlation Matrix (EDA Deep Dive)", fontsize=13, fontweight="bold", pad=30)
fig.tight_layout()
plt.show()
`,
    code_mappings: [
      {
        code_snippet: "num_df = df.select_dtypes(include=[np.number])",
        visual_element: "Numeric Feature Isolation",
        explanation: "Filters the DataFrame to continuous variables suitable for linear correlation computation.",
      },
      {
        code_snippet: "ax.matshow(corr, cmap='coolwarm', vmin=-1, vmax=1)",
        visual_element: "Color-Coded Heatmap Grid",
        explanation: "Maps normalized correlation values between -1.0 (cool blue) and +1.0 (warm red).",
      },
      {
        code_snippet: "color = 'white' if abs(val) > 0.55 else 'black'",
        visual_element: "Dynamic High-Contrast Numerical Text",
        explanation: "Switches text color dynamically to guarantee readability regardless of cell color intensity.",
      },
    ],
    key_takeaways: [
      "Always set vmin=-1 and vmax=1 on correlation heatmaps to maintain consistent scale interpretation.",
      "Use diverging colormaps where neutral 0.0 is light and extremes are bold.",
      "Highly correlated features (r > 0.85) may cause multi-collinearity issues in linear models.",
    ],
    pro_tips: [
      "Use np.triu(np.ones_like(corr, dtype=bool)) to mask the redundant upper half of the symmetric matrix.",
    ],
  },
  {
    id: "step-6-multi-panel-dashboard",
    stage: 6,
    title: "6. Production-Ready Multi-Panel Analytics Dashboard (2x2 Subplots Grid)",
    subtitle: "Unify your analysis into an executive presentation dashboard",
    objective:
      "Assemble an end-to-end 2x2 multi-panel figure (plt.subplots(2, 2)) uniting distribution histograms, regional bar charts, bivariate scatter trends, and multi-variable dimension encoding into a cohesive dashboard.",
    dataset_name: "sales_marketing.csv",
    concept_summary:
      "In data analysis presentations, fragmented charts confuse stakeholders. Multi-panel dashboards coordinate multiple perspectives in a single visual hierarchy, sharing a master title and cohesive brand styling.",
    starter_code: `import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

df = pd.read_csv("sales_marketing.csv")

# 1. Create 2x2 Subplots Figure Canvas
fig, axes = plt.subplots(2, 2, figsize=(12, 8.5), dpi=140)
fig.suptitle("Executive Data Analysis Dashboard: Sales & Marketing ROI", fontsize=15, fontweight="bold", y=0.98)

# Panel 1 (Top-Left): Sales Distribution Histogram
ax1 = axes[0, 0]
ax1.hist(df["sales"], bins=8, color="#0f766e", edgecolor="#042f2e", alpha=0.75, rwidth=0.88)
ax1.axvline(df["sales"].mean(), color="#e11d48", linestyle="--", linewidth=1.8, label=f"Mean: \${df['sales'].mean():,.0f}")
ax1.set_title("1. Sales Revenue Distribution", fontsize=11, fontweight="bold")
ax1.set_xlabel("Sales ($)")
ax1.set_ylabel("Store Count")
ax1.legend(fontsize=8.5)
ax1.grid(axis="y", linestyle=":", alpha=0.6)

# Panel 2 (Top-Right): Marketing Spend vs Sales Scatter & Trendline
ax2 = axes[0, 1]
x, y = df["marketing_spend"], df["sales"]
ax2.scatter(x, y, color="#0284c7", alpha=0.75, s=50, edgecolors="#0369a1")
slope, intercept = np.polyfit(x, y, 1)
x_vals = np.linspace(x.min(), x.max(), 50)
ax2.plot(x_vals, slope * x_vals + intercept, color="#e11d48", linestyle="--", linewidth=2, label=f"Slope = {slope:.2f}")
ax2.set_title("2. Marketing Spend vs. Sales ROI", fontsize=11, fontweight="bold")
ax2.set_xlabel("Marketing Spend ($)")
ax2.set_ylabel("Sales ($)")
ax2.legend(fontsize=8.5)
ax2.grid(True, linestyle=":", alpha=0.6)

# Panel 3 (Bottom-Left): Regional Total Sales Bar Chart
ax3 = axes[1, 0]
reg = df.groupby("region")["sales"].sum().sort_values(ascending=False) / 1000
bars = ax3.bar(reg.index, reg.values, color="#6366f1", width=0.55, edgecolor="#312e81")
for bar in bars:
    ax3.annotate(f"\${bar.get_height():,.0f}K", xy=(bar.get_x() + bar.get_width()/2, bar.get_height()),
                 xytext=(0, 4), textcoords="offset points", ha="center", fontsize=8.5, fontweight="bold")
ax3.set_title("3. Revenue by Region ($ in Thousands)", fontsize=11, fontweight="bold")
ax3.set_xlabel("Region")
ax3.set_ylabel("Revenue ($K)")
ax3.grid(axis="y", linestyle=":", alpha=0.6)

# Panel 4 (Bottom-Right): Satisfaction vs Store Footfall Multi-Dimension Scatter
ax4 = axes[1, 1]
scatter = ax4.scatter(df["store_footfall"], df["sales"], c=df["satisfaction_score"], cmap="viridis", s=60, edgecolors="#1e293b", alpha=0.85)
ax4.set_title("4. Footfall & Satisfaction Impact", fontsize=11, fontweight="bold")
ax4.set_xlabel("Store Footfall (Daily Visitors)")
ax4.set_ylabel("Sales ($)")
ax4.grid(True, linestyle=":", alpha=0.6)

# Tight layout with headroom for master suptitle
fig.tight_layout(rect=[0, 0, 1, 0.96])
plt.show()

print("Executive multi-panel dashboard assembled across 4 cohesive visual perspectives.")
`,
    solution_code: `import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

df = pd.read_csv("sales_marketing.csv")

fig, axes = plt.subplots(2, 2, figsize=(12.5, 9), dpi=140)
fig.suptitle("Executive Data Analysis Dashboard: Retail Performance & ROI", fontsize=16, fontweight="bold", y=0.98)

# Panel 1: Distribution
ax1 = axes[0, 0]
ax1.hist(df["sales"], bins=8, color="#0f766e", edgecolor="#042f2e", alpha=0.8, rwidth=0.88)
ax1.axvline(df["sales"].mean(), color="#e11d48", linestyle="--", linewidth=2, label=f"Mean: \${df['sales'].mean():,.0f}")
ax1.set_title("1. Sales Revenue Distribution", fontsize=11, fontweight="bold")
ax1.set_xlabel("Sales ($)")
ax1.set_ylabel("Store Count")
ax1.legend(fontsize=8.5, frameon=True)
ax1.grid(axis="y", linestyle=":", alpha=0.6)

# Panel 2: Scatter & Fit
ax2 = axes[0, 1]
x, y = df["marketing_spend"], df["sales"]
ax2.scatter(x, y, color="#0284c7", alpha=0.8, s=60, edgecolors="#0369a1")
m, b = np.polyfit(x, y, 1)
x_span = np.linspace(x.min(), x.max(), 50)
ax2.plot(x_span, m * x_span + b, color="#e11d48", linestyle="--", linewidth=2, label=f"Slope: {m:.2f}x")
ax2.set_title("2. Marketing Spend vs. Sales ROI", fontsize=11, fontweight="bold")
ax2.set_xlabel("Marketing Spend ($)")
ax2.set_ylabel("Sales ($)")
ax2.legend(fontsize=8.5, frameon=True)
ax2.grid(True, linestyle=":", alpha=0.6)

# Panel 3: Categorical
ax3 = axes[1, 0]
reg = df.groupby("region")["sales"].sum().sort_values(ascending=False) / 1000
bars = ax3.bar(reg.index, reg.values, color="#6366f1", width=0.52, edgecolor="#312e81")
for bar in bars:
    ax3.annotate(f"\${bar.get_height():,.0f}K", xy=(bar.get_x() + bar.get_width()/2, bar.get_height()),
                 xytext=(0, 4), textcoords="offset points", ha="center", fontsize=8.5, fontweight="bold")
ax3.set_title("3. Revenue by Region ($K)", fontsize=11, fontweight="bold")
ax3.set_xlabel("Region")
ax3.set_ylabel("Revenue ($K)")
ax3.grid(axis="y", linestyle=":", alpha=0.6)

# Panel 4: Multi-dimensional Scatter
ax4 = axes[1, 1]
sc = ax4.scatter(df["store_footfall"], df["sales"], c=df["satisfaction_score"], cmap="viridis", s=70, edgecolors="#1e293b", alpha=0.85)
cb = fig.colorbar(sc, ax=ax4, pad=0.03)
cb.set_label("Satisfaction (1-5)", fontsize=8.5)
ax4.set_title("4. Store Footfall & Satisfaction", fontsize=11, fontweight="bold")
ax4.set_xlabel("Daily Footfall")
ax4.set_ylabel("Sales ($)")
ax4.grid(True, linestyle=":", alpha=0.6)

fig.tight_layout(rect=[0, 0, 1, 0.96])
plt.show()
`,
    code_mappings: [
      {
        code_snippet: "fig, axes = plt.subplots(2, 2, figsize=(12, 8.5), dpi=140)",
        visual_element: "2x2 Subplots Grid Canvas",
        explanation: "Allocates a 2-row by 2-column matrix of independent plotting axes.",
      },
      {
        code_snippet: "fig.suptitle('...', fontsize=15, fontweight='bold', y=0.98)",
        visual_element: "Master Figure Suptitle",
        explanation: "Sets an elevated overarching headline spanning across all 4 subplots simultaneously.",
      },
      {
        code_snippet: "c=df['satisfaction_score'], cmap='viridis'",
        visual_element: "3rd Dimension Colormap Encoding",
        explanation: "Encodes customer satisfaction score as point color onto a 2D scatter chart.",
      },
    ],
    key_takeaways: [
      "Use plt.subplots(rows, cols) to construct clean, multi-faceted executive dashboards.",
      "Use fig.suptitle(..., y=0.98) paired with tight_layout(rect=[0, 0, 1, 0.96]) to avoid collisions.",
      "Ensure consistent axis font styling and color themes across all subplots.",
    ],
    pro_tips: [
      "Pass sharex=True or sharey=True to plt.subplots() when plotting identical metrics across groups.",
    ],
  },
];

// ==========================================
// GUIDED MISSIONS (SCIKIT-LEARN & MATPLOTLIB)
// ==========================================

const fallbackGuidedMissions: GuidedMission[] = [
  {
    id: "mission-sklearn-regression-diagnostics",
    title: "Scikit-Learn Regression & Matplotlib Residuals Diagnostic",
    subtitle: "Step-by-step pipeline from data scaling to model training and residual error diagnosis",
    category: "Regression & Diagnostics",
    difficulty: "Beginner",
    dataset_name: "sales_marketing.csv",
    overview:
      "Build a complete predictive pipeline using Scikit-Learn Linear Regression and Matplotlib diagnostic plots. Understand R² goodness-of-fit, slope interpretation, and residual error distribution.",
    steps: [
      {
        step_number: 1,
        module_id: "pandas-load-csv",
        target_action: "Drag 'Load Dataset' into the workspace or code editor",
        title: "1. Load Tabular Dataset",
        description: "Ingest retail sales and marketing spend CSV data into a Pandas DataFrame.",
        why_it_matters: "Every data science pipeline begins with loading raw tabular data into memory.",
        expected_output: "DataFrame preview with rows, columns, and initial health check.",
        default_settings: { file_name: "sales_marketing.csv", preview_rows: 5 },
        code_snippet: `import pandas as pd\ndf = pd.read_csv("sales_marketing.csv")\nprint(df.head())\n`,
      },
      {
        step_number: 2,
        module_id: "matplotlib-scatter-plot",
        target_action: "Drag 'Scatter Plot & Trendline' into the workspace or code editor",
        title: "2. Explore Bivariate Correlation",
        description: "Plot marketing spend against sales revenue with an overlaid best-fit regression line.",
        why_it_matters: "Visualizing the relationship before modeling confirms whether a linear assumption is sound.",
        expected_output: "High-resolution Matplotlib scatter chart with Pearson correlation r and fitted line.",
        default_settings: { x_column: "marketing_spend", y_column: "sales", title: "Marketing Spend vs. Sales Revenue", show_trendline: "yes" },
        code_snippet: `import matplotlib.pyplot as plt\nimport numpy as np\n\nplt.scatter(df["marketing_spend"], df["sales"], color="#0f766e", alpha=0.8)\nslope, intercept = np.polyfit(df["marketing_spend"], df["sales"], 1)\nplt.plot(df["marketing_spend"], slope*df["marketing_spend"] + intercept, "r--", label="Trendline")\nplt.xlabel("Marketing Spend ($)")\nplt.ylabel("Sales ($)")\nplt.legend()\nplt.show()\n`,
      },
      {
        step_number: 3,
        module_id: "sklearn-scaler",
        target_action: "Drag 'StandardScaler Preprocessor' into the workspace or code editor",
        title: "3. Standardize Features (Z-Score)",
        description: "Scale numeric features to zero mean and unit variance using Scikit-Learn StandardScaler.",
        why_it_matters: "Feature scaling prevents high-magnitude features from dominating optimization weights.",
        expected_output: "Standardized feature columns with computed means and unit variance.",
        default_settings: { feature_columns: "marketing_spend, store_footfall" },
        code_snippet: `from sklearn.preprocessing import StandardScaler\nscaler = StandardScaler()\ndf_scaled = scaler.fit_transform(df[["marketing_spend", "store_footfall"]].fillna(0))\nprint("Standardized features matrix shape:", df_scaled.shape)\n`,
      },
      {
        step_number: 4,
        module_id: "sklearn-regression",
        target_action: "Drag 'Linear Regression Model' into the workspace or code editor",
        title: "4. Train Scikit-Learn Linear Regression",
        description: "Split dataset into 80% train and 20% test sets, fit Linear Regression, and compute R² and MAE.",
        why_it_matters: "Supervised regression discovers the optimal equation y = mx + b predicting continuous revenue.",
        expected_output: "Scorecard with R² score (>0.85), MAE, RMSE, and Actual vs. Predicted scatter plot.",
        default_settings: { feature_column: "marketing_spend", target_column: "sales", test_size: 0.2 },
        code_snippet: `from sklearn.linear_model import LinearRegression\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.metrics import r2_score\n\nX_train, X_test, y_train, y_test = train_test_split(df[["marketing_spend"]], df["sales"], test_size=0.2, random_state=42)\nmodel = LinearRegression().fit(X_train, y_train)\ny_pred = model.predict(X_test)\nprint(f"R² Score: {r2_score(y_test, y_pred):.4f}")\n`,
      },
      {
        step_number: 5,
        module_id: "matplotlib-residuals-plot",
        target_action: "Drag 'Regression Residuals Diagnostics' into the workspace or code editor",
        title: "5. Diagnose Residual Error Distribution",
        description: "Plot prediction residuals (y_actual - y_predicted) to verify zero-mean error distribution.",
        why_it_matters: "If residuals exhibit a curve or fan pattern, the model violates linear assumptions.",
        expected_output: "Residuals diagnostic chart with a horizontal zero-error baseline.",
        default_settings: { feature_column: "marketing_spend", target_column: "sales", title: "Residuals Diagnostics (Error vs Predicted)" },
        code_snippet: `residuals = y_test - y_pred\nplt.scatter(y_pred, residuals, color="#e11d48", alpha=0.8)\nplt.axhline(0, color="black", linestyle="--")\nplt.xlabel("Predicted Sales")\nplt.ylabel("Residuals (Actual - Predicted)")\nplt.show()\n`,
      },
    ],
  },
  {
    id: "mission-sklearn-classification-churn",
    title: "Scikit-Learn Classification & Confusion Matrix Studio",
    subtitle: "End-to-end customer churn classification and decision tree / confusion matrix analysis",
    category: "Classification & Retention",
    difficulty: "Intermediate",
    dataset_name: "customer_churn.csv",
    overview:
      "Build a production classification pipeline to predict customer churn risk using Scikit-Learn Decision Trees, Random Forests, and Matplotlib Confusion Matrix displays.",
    steps: [
      {
        step_number: 1,
        module_id: "pandas-load-csv",
        target_action: "Drag 'Load Dataset' into the workspace",
        title: "1. Load Churn Dataset",
        description: "Ingest customer subscription, tenure, and monthly charges records.",
        why_it_matters: "Provides customer behavioral features and binary 'churned' target column.",
        expected_output: "Customer DataFrame preview showing churn distributions.",
        default_settings: { file_name: "customer_churn.csv", preview_rows: 5 },
        code_snippet: `import pandas as pd\ndf = pd.read_csv("customer_churn.csv")\nprint(df.head())\n`,
      },
      {
        step_number: 2,
        module_id: "pandas-clean",
        target_action: "Drag 'Clean Missing Values' into the workspace",
        title: "2. Clean Missing Records",
        description: "Drop rows with null values to avoid model crashes during scikit-learn fitting.",
        why_it_matters: "Scikit-learn tree estimators require clean numeric matrices without NaN entries.",
        expected_output: "Audit of cleaned row counts and confirmed zero missing cells.",
        default_settings: { strategy: "drop_rows" },
        code_snippet: `df = df.dropna().reset_index(drop=True)\nprint(f"Cleaned records: {len(df)}")\n`,
      },
      {
        step_number: 3,
        module_id: "matplotlib-bar-chart",
        target_action: "Drag 'Bar Chart' into the workspace",
        title: "3. Benchmark Monthly Charges by Contract",
        description: "Plot categorical bar charts showing average charges across contract types.",
        why_it_matters: "Identifies which pricing plans have higher risk exposure.",
        expected_output: "Ranked bar chart with direct numerical labels.",
        default_settings: { category_column: "contract_type", value_column: "monthly_charges", title: "Average Monthly Charges by Contract Type" },
        code_snippet: `regional = df.groupby("contract_type")["monthly_charges"].mean()\nregional.plot(kind="bar", color="#0f766e")\nplt.show()\n`,
      },
      {
        step_number: 4,
        module_id: "sklearn-classification",
        target_action: "Drag 'Decision Tree Classifier' into the workspace",
        title: "4. Train Decision Tree & Confusion Matrix",
        description: "Fit a decision tree on tenure, monthly charges, and support tickets with max_depth=3.",
        why_it_matters: "Decision trees provide interpretable rules and split boundaries for classifying binary targets.",
        expected_output: "Accuracy score, classification report, and color-coded Confusion Matrix plot.",
        default_settings: { feature_columns: "tenure_months, monthly_charges, support_tickets", target_column: "churned", max_depth: 3 },
        code_snippet: `from sklearn.tree import DecisionTreeClassifier\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.metrics import accuracy_score\n\nX_train, X_test, y_train, y_test = train_test_split(df[["tenure_months", "monthly_charges", "support_tickets"]], df["churned"], test_size=0.25, random_state=42)\nclf = DecisionTreeClassifier(max_depth=3).fit(X_train, y_train)\nprint(f"Accuracy: {accuracy_score(y_test, clf.predict(X_test))*100:.1f}%")\n`,
      },
      {
        step_number: 5,
        module_id: "sklearn-random-forest-classifier",
        target_action: "Drag 'Random Forest Classifier' into the workspace",
        title: "5. Ensemble Random Forest & Feature Importances",
        description: "Train an ensemble of 50 decision trees to evaluate overall feature importance rankings.",
        why_it_matters: "Ensemble bagging reduces variance and identifies the most influential customer churn drivers.",
        expected_output: "Ensemble Accuracy, weighted F1 score, and Feature Importance bar chart.",
        default_settings: { feature_columns: "tenure_months, monthly_charges, support_tickets", target_column: "churned", n_estimators: 50, max_depth: 4 },
        code_snippet: `from sklearn.ensemble import RandomForestClassifier\nrf = RandomForestClassifier(n_estimators=50, random_state=42).fit(X_train, y_train)\nprint("Feature importances:", dict(zip(["tenure_months", "monthly_charges", "support_tickets"], rf.feature_importances_)))\n`,
      },
    ],
  },
  {
    id: "mission-sklearn-clustering-kmeans",
    title: "Scikit-Learn K-Means & Matplotlib Cluster Centroids",
    subtitle: "Unsupervised customer clustering and 2D centroid mapping",
    category: "Unsupervised Learning",
    difficulty: "Intermediate",
    dataset_name: "sales_marketing.csv",
    overview:
      "Learn how unsupervised machine learning partitions customer data into K distinct segments based on geometric Euclidean distance and centroid discovery.",
    steps: [
      {
        step_number: 1,
        module_id: "pandas-load-csv",
        target_action: "Drag 'Load Dataset' into the workspace",
        title: "1. Load Multi-Feature Dataset",
        description: "Ingest marketing spend, footfall, and satisfaction data.",
        why_it_matters: "Provides numeric continuous dimensions suitable for spatial clustering.",
        expected_output: "DataFrame sample with numeric features.",
        default_settings: { file_name: "sales_marketing.csv", preview_rows: 5 },
        code_snippet: `import pandas as pd\ndf = pd.read_csv("sales_marketing.csv")\n`,
      },
      {
        step_number: 2,
        module_id: "matplotlib-correlation-heatmap",
        target_action: "Drag 'Correlation Heatmap' into the workspace",
        title: "2. Compute Feature Correlation Matrix",
        description: "Calculate pairwise correlation coefficients across all numeric features.",
        why_it_matters: "Identifies distinct, uncorrelated feature axes to use for 2D customer segmentation.",
        expected_output: "Color-coded heatmap matrix with numerical cell values.",
        default_settings: { title: "Feature Correlation Matrix" },
        code_snippet: `corr = df.select_dtypes(include="number").corr()\nplt.matshow(corr, cmap="coolwarm")\nplt.colorbar()\nplt.show()\n`,
      },
      {
        step_number: 3,
        module_id: "sklearn-clustering",
        target_action: "Drag 'K-Means Clustering' into the workspace",
        title: "3. Fit K-Means & Discover Centroids",
        description: "Partition observations into K=3 clusters based on marketing spend and footfall.",
        why_it_matters: "Discovers natural customer tiers (e.g. high-spend vs budget) without human labeling.",
        expected_output: "2D scatter plot with distinct cluster colors and bold 'X' centroid markers.",
        default_settings: { feature_x: "marketing_spend", feature_y: "store_footfall", n_clusters: 3 },
        code_snippet: `from sklearn.cluster import KMeans\nkmeans = KMeans(n_clusters=3, random_state=42).fit(df[["marketing_spend", "store_footfall"]])\ndf["cluster"] = kmeans.labels_\nplt.scatter(df["marketing_spend"], df["store_footfall"], c=df["cluster"])\nplt.scatter(kmeans.cluster_centers_[:, 0], kmeans.cluster_centers_[:, 1], color="red", marker="X", s=200)\nplt.show()\n`,
      },
      {
        step_number: 4,
        module_id: "matplotlib-bar-chart",
        target_action: "Drag 'Bar Chart' into the workspace",
        title: "4. Profile Cluster Marketing Budgets",
        description: "Compare average marketing budget across the discovered customer segments.",
        why_it_matters: "Translates abstract mathematical clusters into actionable business decisions.",
        expected_output: "Categorical comparison bar chart with segment labels.",
        default_settings: { category_column: "region", value_column: "marketing_spend", title: "Marketing Spend by Region" },
        code_snippet: `df.groupby("region")["marketing_spend"].mean().plot(kind="bar")\nplt.show()\n`,
      },
    ],
  },
  {
    id: "mission-sklearn-pca-reduction",
    title: "Scikit-Learn PCA & Dimensionality Projection",
    subtitle: "Compress multi-variable datasets into 2 Principal Components with Matplotlib",
    category: "Dimensionality Reduction",
    difficulty: "Advanced",
    dataset_name: "housing_prices.csv",
    overview:
      "Compress high-dimensional real estate features into 2 orthogonal Principal Components while maximizing preserved dataset variance.",
    steps: [
      {
        step_number: 1,
        module_id: "pandas-load-csv",
        target_action: "Drag 'Load Dataset' into the workspace",
        title: "1. Load Housing Features",
        description: "Ingest multi-variable real estate dataset containing physical dimensions and prices.",
        why_it_matters: "Provides high-dimensional continuous features for compression.",
        expected_output: "Preview of 5+ numeric features per property.",
        default_settings: { file_name: "housing_prices.csv", preview_rows: 5 },
        code_snippet: `import pandas as pd\ndf = pd.read_csv("housing_prices.csv")\n`,
      },
      {
        step_number: 2,
        module_id: "sklearn-scaler",
        target_action: "Drag 'StandardScaler Preprocessor' into the workspace",
        title: "2. Z-Score Standardization",
        description: "Normalize feature scales so large variables do not artificially dominate variance.",
        why_it_matters: "PCA requires zero-mean unit-variance scaling for mathematically sound computation.",
        expected_output: "Standardized numeric array ready for PCA projection.",
        default_settings: { feature_columns: "square_feet, bedrooms, bathrooms, year_built, price" },
        code_snippet: `from sklearn.preprocessing import StandardScaler\nX_scaled = StandardScaler().fit_transform(df.select_dtypes(include="number"))\n`,
      },
      {
        step_number: 3,
        module_id: "sklearn-pca",
        target_action: "Drag 'PCA Dimensionality Reduction' into the workspace",
        title: "3. Compute Principal Components & 2D Projection",
        description: "Project high-dimensional records onto PC1 and PC2 axes with explained variance score.",
        why_it_matters: "Allows intuitive 2D visualization of complex multi-dimensional datasets.",
        expected_output: "2D PCA Scatter plot showing property clusters and explained variance percentage.",
        default_settings: { feature_columns: "square_feet, bedrooms, bathrooms, year_built, price", color_by: "neighborhood" },
        code_snippet: `from sklearn.decomposition import PCA\npca = PCA(n_components=2)\ncoords = pca.fit_transform(X_scaled)\nprint(f"Explained Variance: {pca.explained_variance_ratio_.sum()*100:.1f}%")\nplt.scatter(coords[:, 0], coords[:, 1])\nplt.show()\n`,
      },
    ],
  },
  {
    id: "mission-matplotlib-eda-dashboard",
    title: "Matplotlib Statistical EDA & 2x2 Subplots Dashboard",
    subtitle: "Complete statistical exploratory process culminating in a unified multi-panel dashboard",
    category: "Exploratory Data Analysis",
    difficulty: "Beginner",
    dataset_name: "sales_marketing.csv",
    overview:
      "Follow best practices in data storytelling: inspect data distributions, compare categories, model bivariate correlation, and construct an executive 2x2 dashboard using plt.subplots(2, 2).",
    steps: [
      {
        step_number: 1,
        module_id: "pandas-load-csv",
        target_action: "Drag 'Load Dataset' into the workspace",
        title: "1. Load & Inspect Dataset",
        description: "Ingest dataset and inspect initial shape and schema.",
        why_it_matters: "Establishes baseline data bounds.",
        expected_output: "DataFrame dimensions and column types.",
        default_settings: { file_name: "sales_marketing.csv", preview_rows: 5 },
        code_snippet: `import pandas as pd\ndf = pd.read_csv("sales_marketing.csv")\n`,
      },
      {
        step_number: 2,
        module_id: "matplotlib-histogram",
        target_action: "Drag 'Histogram & Distribution' into the workspace",
        title: "2. Univariate Distribution & Skewness",
        description: "Plot sales distribution with Mean and Median reference lines.",
        why_it_matters: "Reveals whether features are normal or skewed by extreme outliers.",
        expected_output: "Frequency histogram with styled mean (red) and median (blue) lines.",
        default_settings: { column: "sales", bins: 8, title: "Distribution of Sales Revenue" },
        code_snippet: `plt.hist(df["sales"], bins=8, color="#0f766e", alpha=0.75)\nplt.axvline(df["sales"].mean(), color="red", linestyle="--")\nplt.show()\n`,
      },
      {
        step_number: 3,
        module_id: "matplotlib-bar-chart",
        target_action: "Drag 'Bar Chart' into the workspace",
        title: "3. Ranked Categorical Bar Chart",
        description: "Plot aggregated regional sales with direct value annotations.",
        why_it_matters: "Direct data labels eliminate cognitive eye fatigue from tracing axes.",
        expected_output: "Sorted bar chart with $K callouts directly above each bar.",
        default_settings: { category_column: "region", value_column: "sales", title: "Total Sales Revenue by Region" },
        code_snippet: `df.groupby("region")["sales"].sum().plot(kind="bar", color="#0f766e")\nplt.show()\n`,
      },
      {
        step_number: 4,
        module_id: "matplotlib-subplots-grid",
        target_action: "Drag '2x2 Subplots Executive Dashboard' into the workspace",
        title: "4. Multi-Panel Executive Dashboard",
        description: "Unify distribution, regression, categorical bars, and footfall scatter into a single 2x2 grid.",
        why_it_matters: "Cohesive multi-panel figures provide stakeholders a single source of truth.",
        expected_output: "140 DPI 2x2 master dashboard with suptitle.",
        default_settings: { title: "Executive Performance & Marketing ROI Dashboard" },
        code_snippet: `fig, axes = plt.subplots(2, 2, figsize=(12, 8.5))\nfig.suptitle("Executive Dashboard", fontsize=16, fontweight="bold")\nplt.tight_layout()\nplt.show()\n`,
      },
    ],
  },
];

// Fallback Presets
const fallbackPresets: PresetUseCase[] = [
  {
    id: "sales-roi-regression",
    title: "Sales & Marketing ROI Predictor",
    subtitle: "Predict revenue from advertising spend with Linear Regression & Matplotlib",
    description:
      "Explore how marketing spend and footfall drive revenue. Clean data, compute summary statistics, plot scatter correlation with trendline, train Linear Regression, and diagnose residuals.",
    category: "Regression & ROI Analysis",
    icon: "TrendingUp",
    difficulty: "Beginner",
    key_takeaway: "Understand feature vs target relationships, R² goodness-of-fit, and interpreting regression slopes.",
    blocks: [
      { id: "b1", module_id: "pandas-load-csv", settings: { file_name: "sales_marketing.csv", preview_rows: 5 } },
      { id: "b2", module_id: "pandas-clean", settings: { strategy: "drop_rows" } },
      { id: "b3", module_id: "matplotlib-scatter-plot", settings: { x_column: "marketing_spend", y_column: "sales", title: "Marketing Spend vs. Sales Revenue", show_trendline: "yes" } },
      { id: "b4", module_id: "sklearn-regression", settings: { feature_column: "marketing_spend", target_column: "sales", test_size: 0.2 } },
      { id: "b5", module_id: "matplotlib-residuals-plot", settings: { feature_column: "marketing_spend", target_column: "sales" } },
    ],
  },
  {
    id: "customer-churn-classification",
    title: "Customer Churn & Risk Classifier",
    subtitle: "Classify customer retention using Scikit-Learn Decision Trees & Confusion Matrix",
    description:
      "Analyze subscription data to detect churn risk factors. Group charges, train Decision Trees on tenure and support tickets, and evaluate the Confusion Matrix.",
    category: "Classification & Retention",
    icon: "BrainCircuit",
    difficulty: "Intermediate",
    key_takeaway: "Master classification metrics (Accuracy, F1) and error analysis using Confusion Matrices.",
    blocks: [
      { id: "b1", module_id: "pandas-load-csv", settings: { file_name: "customer_churn.csv", preview_rows: 5 } },
      { id: "b2", module_id: "pandas-clean", settings: { strategy: "drop_rows" } },
      { id: "b3", module_id: "matplotlib-bar-chart", settings: { category_column: "contract_type", value_column: "monthly_charges", title: "Average Monthly Charges by Contract" } },
      { id: "b4", module_id: "sklearn-classification", settings: { feature_columns: "tenure_months, monthly_charges, support_tickets", target_column: "churned", max_depth: 3 } },
      { id: "b5", module_id: "sklearn-random-forest-classifier", settings: { feature_columns: "tenure_months, monthly_charges, support_tickets", target_column: "churned", n_estimators: 50, max_depth: 4 } },
    ],
  },
  {
    id: "customer-segmentation-clustering",
    title: "Customer Segmentation via K-Means",
    subtitle: "Unsupervised customer clustering and centroid visualization",
    description:
      "Group retail customers into distinct behavioural clusters based on marketing spend and store footfall. Visualize discovered cluster centroids using 2D scatter plots.",
    category: "Unsupervised Clustering",
    icon: "Users",
    difficulty: "Advanced",
    key_takeaway: "Learn how unsupervised clustering discovers hidden customer segments without labeled target answers.",
    blocks: [
      { id: "b1", module_id: "pandas-load-csv", settings: { file_name: "sales_marketing.csv", preview_rows: 5 } },
      { id: "b2", module_id: "matplotlib-correlation-heatmap", settings: { title: "Feature Correlation Matrix" } },
      { id: "b3", module_id: "sklearn-clustering", settings: { feature_x: "marketing_spend", feature_y: "store_footfall", n_clusters: 3 } },
      { id: "b4", module_id: "matplotlib-bar-chart", settings: { category_column: "region", value_column: "marketing_spend", title: "Marketing Budget by Region" } },
    ],
  },
];

function defaultSettings(module: ModuleDefinition): Record<string, string | number> {
  return Object.fromEntries(module.options.map((option) => [option.key, option.default]));
}

function createBlock(module: ModuleDefinition): ProjectBlock {
  return {
    id: `block-${crypto.randomUUID().slice(0, 8)}`,
    module_id: module.id,
    settings: defaultSettings(module),
  };
}

export default function Home() {
  // ==========================================
  // TOP WORKSHOP SELECTOR STATE
  // ==========================================
  const [activeWorkshop, setActiveWorkshop] = useState<WorkshopMode>("matplotlib-mastery");

  // ==========================================
  // WORKSHOP 1: CODE MASTERY & DRAG-AND-DROP STATE
  // ==========================================
  const [w1ViewMode, setW1ViewMode] = useState<W1ViewMode>("split");
  const [w1GuideTab, setW1GuideTab] = useState<W1GuideTab>("curriculum");

  const [workshopSteps, setWorkshopSteps] = useState<WorkshopStep[]>(fallbackWorkshopSteps);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  const [guidedMissions, setGuidedMissions] = useState<GuidedMission[]>(fallbackGuidedMissions);
  const [activeMissionId, setActiveMissionId] = useState<string>("mission-sklearn-regression-diagnostics");
  const [missionStepIndex, setMissionStepIndex] = useState<number>(0);

  const [userCode, setUserCode] = useState<string>(() => fallbackWorkshopSteps[0].starter_code);
  const [isCustomCodeEdited, setIsCustomCodeEdited] = useState<boolean>(false);
  const [executingCustomCode, setExecutingCustomCode] = useState<boolean>(false);
  const [customCodeResult, setCustomCodeResult] = useState<CustomCodeExecuteResponse | null>(null);
  const [activeCodeOutputTab, setActiveCodeOutputTab] = useState<"visual" | "terminal" | "data" | "improver">("visual");
  const [activeMapping, setActiveMapping] = useState<CodeToVisualMapping | null>(null);
  const [copiedW1Code, setCopiedW1Code] = useState<boolean>(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(() => new Set([0]));
  const [completedMissionSteps, setCompletedMissionSteps] = useState<Set<string>>(() => new Set());
  const [selectedW1Dataset, setSelectedW1Dataset] = useState<string>("sales_marketing.csv");

  // Workshop 1 Module Dragging & Drop Target State
  const [draggedModuleId, setDraggedModuleId] = useState<string | null>(null);
  const [isDragOverEditor, setIsDragOverEditor] = useState<boolean>(false);
  const [isDragOverCanvas, setIsDragOverCanvas] = useState<boolean>(false);
  const [w1Blocks, setW1Blocks] = useState<ProjectBlock[]>([
    { id: "w1-b1", module_id: "pandas-load-csv", settings: { file_name: "sales_marketing.csv", preview_rows: 5 } },
    { id: "w1-b2", module_id: "matplotlib-histogram", settings: { column: "sales", bins: 8, title: "Sales Distribution" } },
  ]);
  const [selectedW1BlockId, setSelectedW1BlockId] = useState<string | null>("w1-b1");

  // Workshop 1 Interactive Improver State (Parameters that user can manipulate live)
  const [improverBins, setImproverBins] = useState<number>(8);
  const [improverAlpha, setImproverAlpha] = useState<number>(0.75);
  const [improverColormap, setImproverColormap] = useState<string>("coolwarm");
  const [improverShowTrendline, setImproverShowTrendline] = useState<boolean>(true);
  const [improverTreeDepth, setImproverTreeDepth] = useState<number>(3);
  const [improverClustersK, setImproverClustersK] = useState<number>(3);

  // ==========================================
  // WORKSHOP 2: VISUAL PIPELINE WORKBENCH STATE
  // ==========================================
  const [modules, setModules] = useState<ModuleDefinition[]>(fallbackModules);
  const [presets, setPresets] = useState<PresetUseCase[]>(fallbackPresets);
  const [activePresetId, setActivePresetId] = useState<string>("sales-roi-regression");
  const [blocks, setBlocks] = useState<ProjectBlock[]>(() => fallbackPresets[0].blocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(() => fallbackPresets[0].blocks[0]?.id || null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeW2Tab, setActiveW2Tab] = useState<"results" | "code">("results");
  const [isExecutingW2, setIsExecutingW2] = useState<boolean>(false);
  const [copiedW2Code, setCopiedW2Code] = useState<boolean>(false);
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const [generatedW2, setGeneratedW2] = useState<GenerateResponse>({
    code: "",
    imports: [],
    notes: [],
  });
  const [executionW2, setExecutionW2] = useState<ExecuteResponse | null>(null);

  // Safe data access
  const safeSteps = useMemo(
    () => (Array.isArray(workshopSteps) && workshopSteps.length > 0 ? workshopSteps : fallbackWorkshopSteps),
    [workshopSteps]
  );
  const currentStep = safeSteps[currentStepIndex] || safeSteps[0];

  const safeMissions = useMemo(
    () => (Array.isArray(guidedMissions) && guidedMissions.length > 0 ? guidedMissions : fallbackGuidedMissions),
    [guidedMissions]
  );
  const currentMission = safeMissions.find((m) => m.id === activeMissionId) || safeMissions[0];
  const currentMissionStep = currentMission.steps[missionStepIndex] || currentMission.steps[0];

  const safePresets = useMemo(
    () => (Array.isArray(presets) && presets.length > 0 ? presets : fallbackPresets),
    [presets]
  );
  const safeModules = useMemo(
    () => (Array.isArray(modules) && modules.length > 0 ? modules : fallbackModules),
    [modules]
  );
  const safeBlocks = useMemo(() => (Array.isArray(blocks) ? blocks : []), [blocks]);

  const moduleById = useMemo(() => new Map(safeModules.map((m) => [m.id, m])), [safeModules]);
  const selectedBlock = safeBlocks.find((b) => b.id === selectedBlockId);
  const selectedModule = selectedBlock ? moduleById.get(selectedBlock.module_id) : undefined;
  const activePreset = safePresets.find((p) => p.id === activePresetId);

  // ==========================================
  // FETCH INITIAL BACKEND DATA
  // ==========================================
  useEffect(() => {
    // Check health
    fetch(`${API_BASE}/health`)
      .then((res) => (res.ok ? res.json() : null))
      .then(() => setBackendConnected(true))
      .catch(() => setBackendConnected(false));

    // Fetch Workshop 1 curriculum steps
    fetch(`${API_BASE}/workshops/matplotlib`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setWorkshopSteps(data);
          setBackendConnected(true);
        }
      })
      .catch(() => {});

    // Fetch Guided Missions
    fetch(`${API_BASE}/guided-missions`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setGuidedMissions(data);
        }
      })
      .catch(() => {});

    // Fetch Workshop 2 catalog & presets
    fetch(`${API_BASE}/modules`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setModules(data);
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/presets`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPresets(data);
        }
      })
      .catch(() => {});
  }, []);

  // ==========================================
  // WORKSHOP 1 EXECUTION HANDLER
  // ==========================================
  async function runCustomUserCode(codeToRun?: string) {
    const code = codeToRun !== undefined ? codeToRun : userCode;
    if (!code || code.trim() === "") return;

    setExecutingCustomCode(true);
    try {
      const res = await fetch(`${API_BASE}/execute-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code,
          dataset_name: selectedW1Dataset,
        }),
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data: CustomCodeExecuteResponse = await res.json();
      setCustomCodeResult(data);
      setBackendConnected(true);

      // Automatically switch to Visual tab if a chart was generated
      if (data.chart_base64 && activeCodeOutputTab !== "improver") {
        setActiveCodeOutputTab("visual");
      } else if (!data.chart_base64 && activeCodeOutputTab === "visual") {
        setActiveCodeOutputTab("terminal");
      }

      // Mark step as completed
      setCompletedSteps((prev) => new Set([...prev, currentStepIndex]));
      if (currentMissionStep) {
        setCompletedMissionSteps((prev) => new Set([...prev, `${currentMission.id}-${missionStepIndex}`]));
      }
    } catch (err: any) {
      setBackendConnected(false);
      setCustomCodeResult({
        success: false,
        stdout: "",
        stderr: String(err?.message || "Execution failed. Check backend connection on port 8000."),
        charts_base64: [],
        execution_time_ms: 0,
        error: "Make sure the Python backend is running: 'cd backend && uvicorn app.main:app --port 8000'",
      });
      setActiveCodeOutputTab("terminal");
    } finally {
      setExecutingCustomCode(false);
    }
  }

  // Auto-run first step of Workshop 1 on load
  useEffect(() => {
    if (activeWorkshop === "matplotlib-mastery") {
      runCustomUserCode(currentStep.starter_code);
    }
  }, [activeWorkshop]);

  function switchW1Step(stepIdx: number) {
    if (stepIdx < 0 || stepIdx >= safeSteps.length) return;
    setCurrentStepIndex(stepIdx);
    const step = safeSteps[stepIdx];
    setUserCode(step.starter_code);
    setIsCustomCodeEdited(false);
    setActiveMapping(null);
    setSelectedW1Dataset(step.dataset_name || "sales_marketing.csv");
    runCustomUserCode(step.starter_code);
  }

  function switchGuidedMission(missionId: string) {
    const mission = safeMissions.find((m) => m.id === missionId);
    if (!mission) return;
    setActiveMissionId(missionId);
    setMissionStepIndex(0);
    setSelectedW1Dataset(mission.dataset_name || "sales_marketing.csv");
    const step1 = mission.steps[0];
    if (step1) {
      setUserCode(step1.code_snippet);
      runCustomUserCode(step1.code_snippet);
    }
  }

  function switchMissionStep(stepIdx: number) {
    if (stepIdx < 0 || stepIdx >= currentMission.steps.length) return;
    setMissionStepIndex(stepIdx);
    const step = currentMission.steps[stepIdx];
    if (step) {
      setUserCode(step.code_snippet);
      runCustomUserCode(step.code_snippet);
    }
  }

  // ==========================================
  // DRAG AND DROP DIRECTLY INTO CODE SPACE & CANVAS
  // ==========================================
  function handleDropOnEditor(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOverEditor(false);
    const moduleId = e.dataTransfer.getData("module-id") || draggedModuleId;
    if (!moduleId) return;

    const module = moduleById.get(moduleId);
    if (!module) return;

    // Generate code snippet for this module
    const snippet = module.code_template
      ? module.code_template.replace(/\{(\w+)\}/g, (_, k) => String(module.options.find((o) => o.key === k)?.default || ""))
      : `# --- ${module.title} (${module.package}) ---\n# Learner Goal: ${module.learner_goal}\n`;

    const separator = userCode.trim().length > 0 ? "\n\n" : "";
    const updatedCode = `${userCode.trim()}${separator}# ==========================================\n# Drag-and-Drop Injected: ${module.title} [${module.package}]\n# ==========================================\n${snippet}`;
    setUserCode(updatedCode);
    setIsCustomCodeEdited(true);

    // Add to W1 Blocks if in blocks mode
    const newBlock = createBlock(module);
    setW1Blocks((prev) => [...prev, newBlock]);
    setSelectedW1BlockId(newBlock.id);

    // Re-run code
    runCustomUserCode(updatedCode);
  }

  function handleDropOnCanvas(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOverCanvas(false);
    const moduleId = e.dataTransfer.getData("module-id") || draggedModuleId;
    if (!moduleId) return;

    const module = moduleById.get(moduleId);
    if (!module) return;

    const newBlock = createBlock(module);
    setW1Blocks((prev) => [...prev, newBlock]);
    setSelectedW1BlockId(newBlock.id);

    // Sync generated code
    const snippet = module.code_template
      ? module.code_template.replace(/\{(\w+)\}/g, (_, k) => String(newBlock.settings[k] ?? module.options.find((o) => o.key === k)?.default ?? ""))
      : `# Added ${module.title}\n`;
    const separator = userCode.trim().length > 0 ? "\n\n" : "";
    const updatedCode = `${userCode.trim()}${separator}# Block: ${module.title}\n${snippet}`;
    setUserCode(updatedCode);
    runCustomUserCode(updatedCode);
  }

  function insertModuleDirectly(moduleId: string) {
    const module = moduleById.get(moduleId);
    if (!module) return;

    const snippet = module.code_template
      ? module.code_template.replace(/\{(\w+)\}/g, (_, k) => String(module.options.find((o) => o.key === k)?.default || ""))
      : `# Injected ${module.title}\n`;

    const separator = userCode.trim().length > 0 ? "\n\n" : "";
    const updatedCode = `${userCode.trim()}${separator}# ==========================================\n# Injected: ${module.title} [${module.package}]\n# ==========================================\n${snippet}`;
    setUserCode(updatedCode);
    setIsCustomCodeEdited(true);

    const newBlock = createBlock(module);
    setW1Blocks((prev) => [...prev, newBlock]);
    setSelectedW1BlockId(newBlock.id);

    runCustomUserCode(updatedCode);
  }

  // ==========================================
  // "HOW TO MANIPULATE & IMPROVE" LIVE CONTROLS
  // ==========================================
  function applyImproverModification(param: string, val: any) {
    let modifiedCode = userCode;

    if (param === "bins") {
      setImproverBins(val);
      if (/bins\s*=\s*\d+/.test(modifiedCode)) {
        modifiedCode = modifiedCode.replace(/bins\s*=\s*\d+/g, `bins=${val}`);
      } else {
        modifiedCode = modifiedCode.replace(/ax\.hist\(([^)]+)\)/, `ax.hist($1, bins=${val})`);
      }
    } else if (param === "alpha") {
      setImproverAlpha(val);
      if (/alpha\s*=\s*[\d.]+/.test(modifiedCode)) {
        modifiedCode = modifiedCode.replace(/alpha\s*=\s*[\d.]+/g, `alpha=${val}`);
      }
    } else if (param === "colormap") {
      setImproverColormap(val);
      if (/cmap\s*=\s*["'][^"']+["']/.test(modifiedCode)) {
        modifiedCode = modifiedCode.replace(/cmap\s*=\s*["'][^"']+["']/g, `cmap="${val}"`);
      }
    } else if (param === "tree_depth") {
      setImproverTreeDepth(val);
      if (/max_depth\s*=\s*\d+/.test(modifiedCode)) {
        modifiedCode = modifiedCode.replace(/max_depth\s*=\s*\d+/g, `max_depth=${val}`);
      }
    } else if (param === "clusters_k") {
      setImproverClustersK(val);
      if (/n_clusters\s*=\s*\d+/.test(modifiedCode)) {
        modifiedCode = modifiedCode.replace(/n_clusters\s*=\s*\d+/g, `n_clusters=${val}`);
      }
    }

    setUserCode(modifiedCode);
    setIsCustomCodeEdited(true);
    runCustomUserCode(modifiedCode);
  }

  function applyQuickExperiment(expType: string) {
    let newCode = userCode;

    if (expType === "bins-15") {
      newCode = userCode.replace(/bins\s*=\s*\d+/g, "bins=15");
      setImproverBins(15);
    } else if (expType === "bins-5") {
      newCode = userCode.replace(/bins\s*=\s*\d+/g, "bins=5");
      setImproverBins(5);
    } else if (expType === "color-purple") {
      newCode = userCode.replace(/#0f766e/g, "#7c3aed").replace(/#042f2e/g, "#4c1d95");
    } else if (expType === "color-blue") {
      newCode = userCode.replace(/#0f766e/g, "#0284c7").replace(/#042f2e/g, "#0369a1");
    } else if (expType === "add-confidence-band") {
      if (!newCode.includes("axvspan")) {
        newCode = newCode.replace(
          /fig\.tight_layout\(\)/,
          `std_val = df["sales"].std()\nax.axvspan(mean_val - std_val, mean_val + std_val, color="#0f766e", alpha=0.1, label="±1 Std Dev")\nfig.tight_layout()`
        );
      }
    } else if (expType === "add-polyfit") {
      if (!newCode.includes("np.polyfit")) {
        newCode = newCode.replace(
          /fig\.tight_layout\(\)/,
          `slope, intercept = np.polyfit(x, y, 1)\nx_line = np.linspace(x.min(), x.max(), 100)\nax.plot(x_line, slope * x_line + intercept, color="#e11d48", linestyle="--", linewidth=2.2, label=f"Trendline (slope={slope:.2f})")\nax.legend()\nfig.tight_layout()`
        );
      }
    }

    setUserCode(newCode);
    setIsCustomCodeEdited(true);
    runCustomUserCode(newCode);
  }

  function loadStepSolution() {
    setUserCode(currentStep.solution_code);
    setIsCustomCodeEdited(true);
    runCustomUserCode(currentStep.solution_code);
  }

  function resetStepStarter() {
    setUserCode(currentStep.starter_code);
    setIsCustomCodeEdited(false);
    runCustomUserCode(currentStep.starter_code);
  }

  function copyW1Code() {
    navigator.clipboard.writeText(userCode);
    setCopiedW1Code(true);
    setTimeout(() => setCopiedW1Code(false), 2000);
  }

  function downloadW1Script() {
    const element = document.createElement("a");
    const file = new Blob([userCode], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `stage_${currentStep.stage}_analysis.py`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      runCustomUserCode();
    }
  }

  // ==========================================
  // WORKSHOP 2 PIPELINE HANDLERS
  // ==========================================
  useEffect(() => {
    fetch(`${API_BASE}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_name: activePreset?.title || "My Data Analysis Workflow",
        blocks: safeBlocks,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: GenerateResponse | null) => {
        if (data) setGeneratedW2(data);
      })
      .catch(() => {});
  }, [safeBlocks, activePreset]);

  async function runW2Pipeline() {
    if (safeBlocks.length === 0) return;
    setIsExecutingW2(true);
    try {
      const res = await fetch(`${API_BASE}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_name: activePreset?.title || "My First Data Science Project",
          blocks: safeBlocks,
        }),
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data: ExecuteResponse = await res.json();
      setExecutionW2(data);
      setActiveW2Tab("results");
    } catch (err: any) {
      setExecutionW2({
        success: false,
        results: [],
        execution_time_ms: 0,
        summary_insight: "Execution failed. Check backend status.",
        error: String(err?.message || "Execution error"),
      });
    } finally {
      setIsExecutingW2(false);
    }
  }

  function loadW2Preset(presetId: string) {
    const preset = safePresets.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePresetId(presetId);
    setBlocks(preset.blocks);
    setSelectedBlockId(preset.blocks[0]?.id || null);
    setExecutionW2(null);
  }

  function addW2Module(moduleId: string) {
    const module = moduleById.get(moduleId);
    if (!module) return;
    const newBlock = createBlock(module);
    setBlocks((current) => [...current, newBlock]);
    setSelectedBlockId(newBlock.id);
    setActivePresetId("custom");
  }

  function moveW2Block(targetBlockId: string) {
    if (!draggedBlockId || draggedBlockId === targetBlockId) return;
    setBlocks((current) => {
      const fromIndex = current.findIndex((b) => b.id === draggedBlockId);
      const toIndex = current.findIndex((b) => b.id === targetBlockId);
      if (fromIndex === -1 || toIndex === -1) return current;

      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setActivePresetId("custom");
  }

  function shiftW2Block(blockId: string, direction: "up" | "down") {
    setBlocks((current) => {
      const idx = current.findIndex((b) => b.id === blockId);
      if (idx === -1) return current;
      if (direction === "up" && idx === 0) return current;
      if (direction === "down" && idx === current.length - 1) return current;

      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      const next = [...current];
      const [moved] = next.splice(idx, 1);
      next.splice(targetIdx, 0, moved);
      return next;
    });
    setActivePresetId("custom");
  }

  function updateW2Setting(key: string, value: string | number) {
    setBlocks((current) =>
      current.map((block) =>
        block.id === selectedBlockId
          ? {
              ...block,
              settings: {
                ...block.settings,
                [key]:
                  typeof value === "number"
                    ? value
                    : Number.isFinite(Number(value)) && value.trim() !== ""
                    ? Number(value)
                    : value,
              },
            }
          : block
      )
    );
    setActivePresetId("custom");
  }

  function removeW2Block(blockId: string) {
    setBlocks((current) => current.filter((b) => b.id !== blockId));
    if (selectedBlockId === blockId) setSelectedBlockId(null);
    setActivePresetId("custom");
  }

  function clearW2All() {
    setBlocks([]);
    setSelectedBlockId(null);
    setExecutionW2(null);
    setActivePresetId("custom");
  }

  function copyW2Code() {
    navigator.clipboard.writeText(generatedW2.code);
    setCopiedW2Code(true);
    setTimeout(() => setCopiedW2Code(false), 2000);
  }

  function downloadW2Script() {
    const element = document.createElement("a");
    const file = new Blob([generatedW2.code], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${(activePreset?.title || "workshop_project").toLowerCase().replace(/\s+/g, "_")}.py`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  const filteredModules = useMemo(() => {
    return safeModules.filter((m) => {
      const matchCategory = activeCategory === "all" || m.category === activeCategory;
      const matchQuery =
        searchQuery.trim() === "" ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.package.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchQuery;
    });
  }, [safeModules, activeCategory, searchQuery]);

  return (
    <main className="app-shell">
      {/* ---------------- TOP GLOBAL HEADER & DUAL WORKSHOP SWITCHER ---------------- */}
      <header className="top-bar">
        <div className="title-area">
          <div className="header-badge-row">
            <span className="eyebrow">Interactive Data Science Studio</span>
            <span className={backendConnected ? "status-tag connected" : "status-tag offline"}>
              <span className="status-dot" />
              {backendConnected ? "Python Backend Live" : "Backend Offline (Port 8000)"}
            </span>
          </div>
          <h1>Data Analysis & Machine Learning Workshop</h1>
          <p className="subtitle">
            Drag-and-drop Python modules, live Matplotlib rendering, and step-by-step code manipulation studio.
          </p>
        </div>

        {/* Dual Workshop Navigation Switcher */}
        <div className="workshop-mode-switcher" role="tablist" aria-label="Workshops">
          <button
            type="button"
            className={activeWorkshop === "matplotlib-mastery" ? "mode-btn active" : "mode-btn"}
            onClick={() => setActiveWorkshop("matplotlib-mastery")}
          >
            <div className="mode-btn-icon">
              <BarChart3 size={18} />
            </div>
            <div className="mode-btn-text">
              <span className="mode-btn-title">Workshop 1: Matplotlib & ML Code Mastery</span>
              <span className="mode-btn-sub">Drag-and-drop code modules, live visual output & parameter tuning</span>
            </div>
            {activeWorkshop === "matplotlib-mastery" && <span className="active-glow" />}
          </button>

          <button
            type="button"
            className={activeWorkshop === "visual-workbench" ? "mode-btn active" : "mode-btn"}
            onClick={() => setActiveWorkshop("visual-workbench")}
          >
            <div className="mode-btn-icon">
              <Workflow size={18} />
            </div>
            <div className="mode-btn-text">
              <span className="mode-btn-title">Workshop 2: Visual Pipeline Studio</span>
              <span className="mode-btn-sub">Multi-step modular ML pipelines & code export</span>
            </div>
            {activeWorkshop === "visual-workbench" && <span className="active-glow" />}
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* WORKSHOP 1: MATPLOTLIB & SCIKIT-LEARN CODE MASTERY STUDIO              */}
      {/* ========================================================================= */}
      {activeWorkshop === "matplotlib-mastery" && (
        <div className="workshop-1-container">
          {/* WORKSHOP 1 NAV BAR */}
          <section className="w1-stage-nav-bar" aria-label="Curriculum & Mission Modes">
            <div className="w1-nav-top">
              <div className="w1-guide-tabs">
                <button
                  type="button"
                  className={w1GuideTab === "curriculum" ? "w1-tab-btn active" : "w1-tab-btn"}
                  onClick={() => setW1GuideTab("curriculum")}
                >
                  <BookOpen size={15} />
                  <span>6-Stage Matplotlib Curriculum</span>
                </button>
                <button
                  type="button"
                  className={w1GuideTab === "missions" ? "w1-tab-btn active" : "w1-tab-btn"}
                  onClick={() => setW1GuideTab("missions")}
                >
                  <Sparkles size={15} />
                  <span>Scikit-Learn & Matplotlib Guided Missions</span>
                  <span className="new-badge">5 Missions</span>
                </button>
              </div>

              {/* View Switcher: Code vs. Blocks vs. Split */}
              <div className="w1-view-switcher" role="radiogroup" aria-label="Editor View">
                <button
                  type="button"
                  className={w1ViewMode === "split" ? "view-btn active" : "view-btn"}
                  onClick={() => setW1ViewMode("split")}
                  title="Side-by-side modules & coding space"
                >
                  <Split size={14} />
                  <span>Split Studio</span>
                </button>
                <button
                  type="button"
                  className={w1ViewMode === "code" ? "view-btn active" : "view-btn"}
                  onClick={() => setW1ViewMode("code")}
                  title="Full-width Python Code Editor"
                >
                  <Code2 size={14} />
                  <span>Code Editor</span>
                </button>
                <button
                  type="button"
                  className={w1ViewMode === "blocks" ? "view-btn active" : "view-btn"}
                  onClick={() => setW1ViewMode("blocks")}
                  title="Visual Draggable Blocks View"
                >
                  <Blocks size={14} />
                  <span>Visual Blocks</span>
                </button>
              </div>

              <div className="w1-dataset-selector">
                <Database size={15} className="dataset-icon" />
                <label htmlFor="w1-dataset" className="dataset-label">Dataset:</label>
                <select
                  id="w1-dataset"
                  value={selectedW1Dataset}
                  onChange={(e) => {
                    setSelectedW1Dataset(e.target.value);
                    setTimeout(() => runCustomUserCode(), 50);
                  }}
                  className="dataset-dropdown"
                >
                  <option value="sales_marketing.csv">📈 Sales & Marketing Spend (30 rows)</option>
                  <option value="customer_churn.csv">🎯 Customer Churn & Retention (20 rows)</option>
                  <option value="housing_prices.csv">🏡 Housing Valuation & Real Estate (15 rows)</option>
                </select>
              </div>
            </div>

            {/* CURRICULUM STAGES OR GUIDED MISSIONS SELECTOR */}
            {w1GuideTab === "curriculum" ? (
              <>
                <div className="stage-pills-row">
                  {safeSteps.map((step, idx) => {
                    const isActive = idx === currentStepIndex;
                    const isCompleted = completedSteps.has(idx);
                    return (
                      <button
                        key={step.id}
                        type="button"
                        className={`stage-pill ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
                        onClick={() => switchW1Step(idx)}
                      >
                        <span className="stage-pill-num">
                          {isCompleted ? <Check size={12} /> : idx + 1}
                        </span>
                        <span className="stage-pill-title">
                          {step.title.split(".")[1]?.trim() || step.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="stage-progress-bar-container">
                  <div
                    className="stage-progress-bar-fill"
                    style={{ width: `${((currentStepIndex + 1) / safeSteps.length) * 100}%` }}
                  />
                </div>
              </>
            ) : (
              <div className="missions-selector-row">
                {safeMissions.map((mission) => {
                  const isActive = mission.id === activeMissionId;
                  return (
                    <button
                      key={mission.id}
                      type="button"
                      className={`mission-pill ${isActive ? "active" : ""}`}
                      onClick={() => switchGuidedMission(mission.id)}
                    >
                      <BrainCircuit size={14} className="mission-icon" />
                      <div className="mission-pill-content">
                        <strong>{mission.title}</strong>
                        <small>{mission.steps.length} guided steps • {mission.difficulty}</small>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* GUIDED MISSION STEPPER BANNER (IF IN MISSION MODE) */}
          {w1GuideTab === "missions" && currentMission && (
            <div className="mission-step-banner">
              {/* Row 1: Mission title + dataset + step dots */}
              <div className="mission-banner-header">
                <div className="mission-banner-info">
                  <div className="mission-banner-meta">
                    <span className="step-count-tag">
                      STEP {missionStepIndex + 1} / {currentMission.steps.length}
                    </span>
                    <span className="mission-dataset-chip">
                      <Database size={11} />
                      {currentMission.dataset_name}
                    </span>
                    <span className={`mission-diff-chip diff-${currentMission.difficulty.toLowerCase()}`}>
                      {currentMission.difficulty}
                    </span>
                  </div>
                  <h3>{currentMissionStep.title}</h3>
                  <p>{currentMissionStep.description}</p>
                </div>

                <div className="mission-step-pills">
                  {currentMission.steps.map((step, sIdx) => {
                    const isStepActive = sIdx === missionStepIndex;
                    const isDone = completedMissionSteps.has(`${currentMission.id}-${sIdx}`);
                    return (
                      <button
                        key={sIdx}
                        type="button"
                        className={`mini-step-pill ${isStepActive ? "active" : ""} ${isDone ? "done" : ""}`}
                        onClick={() => switchMissionStep(sIdx)}
                        title={currentMission.steps[sIdx].title}
                      >
                        {isDone ? <Check size={11} /> : sIdx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 2: Action callout */}
              <div className="mission-action-callout">
                <div className="callout-badge">
                  <Flame size={13} />
                  <span>Next Action:</span>
                </div>
                <strong className="callout-text">{currentMissionStep.target_action}</strong>
                <button
                  type="button"
                  className="quick-insert-btn"
                  onClick={() => insertModuleDirectly(currentMissionStep.module_id)}
                >
                  <Plus size={13} />
                  <span>Auto Insert</span>
                </button>
              </div>
            </div>
          )}

          {/* MAIN 3-COLUMN OR 2-COLUMN WORKSPACE */}
          <div className={`w1-workspace-layout ${w1ViewMode}`}>
            {/* 1. LEFT COLUMN: DRAGGABLE MODULE CATALOG FOR SCIKIT-LEARN & MATPLOTLIB */}
            {(w1ViewMode === "split" || w1ViewMode === "blocks") && (
              <aside className="w1-module-palette" aria-label="Draggable Module Catalog">
                <div className="palette-header">
                  <div>
                    <h3>Module Toolbox</h3>
                    <small>Drag onto Code Editor or Canvas</small>
                  </div>
                  <span className="toolbox-count">{filteredModules.length}</span>
                </div>

                {/* Category Filter Chips */}
                <div className="category-filter-row">
                  <button
                    type="button"
                    className={activeCategory === "all" ? "filter-chip active" : "filter-chip"}
                    onClick={() => setActiveCategory("all")}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={activeCategory === "visualization" ? "filter-chip active viz" : "filter-chip viz"}
                    onClick={() => setActiveCategory("visualization")}
                  >
                    Matplotlib
                  </button>
                  <button
                    type="button"
                    className={activeCategory === "machine-learning" ? "filter-chip active ml" : "filter-chip ml"}
                    onClick={() => setActiveCategory("machine-learning")}
                  >
                    Scikit-Learn
                  </button>
                  <button
                    type="button"
                    className={activeCategory === "data" ? "filter-chip active data" : "filter-chip data"}
                    onClick={() => setActiveCategory("data")}
                  >
                    Pandas
                  </button>
                  <button
                    type="button"
                    className={activeCategory === "science" ? "filter-chip active science" : "filter-chip science"}
                    onClick={() => setActiveCategory("science")}
                  >
                    NumPy
                  </button>
                </div>

                {/* Draggable Module Cards */}
                <div className="draggable-module-list">
                  {filteredModules.map((mod) => {
                    const Icon = categoryIcon[mod.category] || Blocks;
                    const theme = categoryTheme[mod.category] || categoryTheme.data;
                    const isTargetNext =
                      w1GuideTab === "missions" && currentMissionStep?.module_id === mod.id;

                    return (
                      <div
                        key={mod.id}
                        className={`draggable-module-card ${isTargetNext ? "target-beacon" : ""}`}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("module-id", mod.id);
                          setDraggedModuleId(mod.id);
                        }}
                        onDragEnd={() => setDraggedModuleId(null)}
                      >
                        {isTargetNext && (
                          <div className="next-beacon-badge">
                            <Sparkles size={11} />
                            <span>👉 Drag this next!</span>
                          </div>
                        )}

                        <div className="card-top-row">
                          <span
                            className="module-icon"
                            style={{ background: theme.bg, color: theme.text, borderColor: theme.border }}
                          >
                            <Icon size={16} />
                          </span>
                          <div className="module-title-wrap">
                            <span className="package-label" style={{ color: theme.text }}>
                              {mod.package}
                            </span>
                            <strong className="module-name">{mod.title}</strong>
                          </div>
                        </div>

                        <p className="module-desc">{mod.description}</p>

                        <div className="card-actions-row">
                          <span className="drag-hint">
                            <GripVertical size={13} />
                            Drag to Code
                          </span>
                          <button
                            type="button"
                            className="quick-add-btn"
                            title="Insert directly into Python editor"
                            onClick={() => insertModuleDirectly(mod.id)}
                          >
                            <Plus size={13} />
                            <span>Insert</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </aside>
            )}

            {/* 2. MIDDLE COLUMN: LIVE PYTHON CODING SPACE / VISUAL BLOCKS CANVAS */}
            <section className="w1-editor-panel">
              {/* IF IN BLOCKS MODE: SHOW VISUAL BLOCKS CANVAS */}
              {w1ViewMode === "blocks" ? (
                <div
                  className={`w1-blocks-canvas ${isDragOverCanvas ? "drag-over" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOverCanvas(true);
                  }}
                  onDragLeave={() => setIsDragOverCanvas(false)}
                  onDrop={handleDropOnCanvas}
                >
                  <div className="blocks-canvas-header">
                    <div className="canvas-title-group">
                      <Blocks size={16} />
                      <strong>Visual Workflow Canvas</strong>
                      <small>Ordered module blocks with live parameters</small>
                    </div>
                    <button
                      type="button"
                      className="run-w1-code-btn mini"
                      disabled={executingCustomCode}
                      onClick={() => runCustomUserCode()}
                    >
                      <Play size={13} fill="currentColor" />
                      <span>Run Pipeline</span>
                    </button>
                  </div>

                  {w1Blocks.length === 0 ? (
                    <div className="empty-canvas-dropzone">
                      <Workflow size={36} />
                      <h4>Drag Modules Here</h4>
                      <p>Drag any Scikit-Learn or Matplotlib module from the catalog to build your pipeline.</p>
                    </div>
                  ) : (
                    <div className="w1-flow-stack">
                      {w1Blocks.map((blk, bIdx) => {
                        const m = moduleById.get(blk.module_id);
                        if (!m) return null;
                        const theme = categoryTheme[m.category] || categoryTheme.data;
                        const Icon = categoryIcon[m.category] || Blocks;
                        const isSelected = selectedW1BlockId === blk.id;

                        return (
                          <div key={blk.id} className="w1-block-card-container">
                            {bIdx > 0 && <div className="flow-arrow">↓</div>}
                            <div
                              className={`w1-block-card ${isSelected ? "selected" : ""}`}
                              onClick={() => setSelectedW1BlockId(blk.id)}
                            >
                              <div className="block-step-num">{bIdx + 1}</div>
                              <span
                                className="module-icon small"
                                style={{ background: theme.bg, color: theme.text }}
                              >
                                <Icon size={15} />
                              </span>
                              <div className="block-card-info">
                                <strong>{m.title}</strong>
                                <span className="block-package">{m.package}</span>
                              </div>
                              <button
                                type="button"
                                className="del-block-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setW1Blocks((prev) => prev.filter((b) => b.id !== blk.id));
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* LIVE PYTHON CODING SPACE WITH DRAG-AND-DROP DROP ZONE */
                <div className="w1-code-space-box">
                  <div className="editor-top-bar">
                    <div className="editor-file-info">
                      <FileCode2 size={16} className="file-icon" />
                      <span className="file-name">
                        {w1GuideTab === "curriculum"
                          ? `stage_${currentStep.stage}_analysis.py`
                          : `${currentMission.id}.py`}
                      </span>
                      {isCustomCodeEdited && <span className="edited-badge">Custom Edited</span>}
                    </div>

                    <div className="editor-actions">
                      <button
                        type="button"
                        className="editor-btn"
                        onClick={loadStepSolution}
                        title="Load verified solution code"
                      >
                        <Lightbulb size={13} />
                        Solution
                      </button>
                      <button
                        type="button"
                        className="editor-btn"
                        onClick={resetStepStarter}
                        title="Reset code editor"
                      >
                        <RotateCcw size={13} />
                        Reset
                      </button>
                      <button
                        type="button"
                        className="editor-btn"
                        onClick={copyW1Code}
                        title="Copy Python code"
                      >
                        {copiedW1Code ? <Check size={13} /> : <Copy size={13} />}
                        {copiedW1Code ? "Copied!" : "Copy"}
                      </button>
                      <button
                        type="button"
                        className="editor-btn"
                        onClick={downloadW1Script}
                        title="Download .py script"
                      >
                        <Download size={13} />
                        .py
                      </button>
                    </div>
                  </div>

                  {/* CODING SPACE TEXTAREA WITH DRAG-OVER DROP OVERLAY */}
                  <div
                    className={`editor-textarea-container ${isDragOverEditor ? "drag-target-active" : ""}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOverEditor(true);
                    }}
                    onDragLeave={() => setIsDragOverEditor(false)}
                    onDrop={handleDropOnEditor}
                  >
                    {isDragOverEditor && (
                      <div className="editor-drop-overlay">
                        <Sparkles size={28} className="drop-sparkle" />
                        <strong>🎯 Drop Module to Insert Python Code Snippet</strong>
                        <p>Code will be injected with comments and dataset bindings automatically.</p>
                      </div>
                    )}

                    <textarea
                      className="w1-code-textarea"
                      value={userCode}
                      onChange={(e) => {
                        setUserCode(e.target.value);
                        setIsCustomCodeEdited(true);
                      }}
                      onKeyDown={handleKeyDown}
                      spellCheck={false}
                      aria-label="Python code editor"
                    />
                  </div>

                  <div className="editor-bottom-bar">
                    <div className="editor-hint">
                      <Sparkles size={13} className="sparkle-hint-icon" />
                      <span>Drag any Scikit-Learn or Matplotlib module here, edit code, then run!</span>
                    </div>

                    <button
                      type="button"
                      className="run-w1-code-btn"
                      disabled={executingCustomCode}
                      onClick={() => runCustomUserCode()}
                    >
                      {executingCustomCode ? (
                        <>
                          <RefreshCw size={15} className="spin-icon" />
                          Executing Python...
                        </>
                      ) : (
                        <>
                          <Play size={15} fill="currentColor" />
                          Run & Replicate Visual (Cmd + ↵)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* 3. MULTI-TAB OUTPUT DASHBOARD & "HOW TO MANIPULATE" STUDIO */}
              <div className="w1-output-box">
                <div className="w1-output-tabs-header">
                  <div className="output-tab-pills">
                    <button
                      type="button"
                      className={`out-tab ${activeCodeOutputTab === "visual" ? "active" : ""}`}
                      onClick={() => setActiveCodeOutputTab("visual")}
                    >
                      <BarChart3 size={15} />
                      <span>Data Analysis Visual</span>
                      {customCodeResult?.chart_base64 && <span className="tab-dot" />}
                    </button>

                    <button
                      type="button"
                      className={`out-tab ${activeCodeOutputTab === "improver" ? "active" : ""}`}
                      onClick={() => setActiveCodeOutputTab("improver")}
                    >
                      <Sliders size={15} />
                      <span>💡 How to Manipulate & Improve</span>
                      <span className="tab-pill-badge accent">Interactive</span>
                    </button>

                    <button
                      type="button"
                      className={`out-tab ${activeCodeOutputTab === "terminal" ? "active" : ""}`}
                      onClick={() => setActiveCodeOutputTab("terminal")}
                    >
                      <Terminal size={15} />
                      <span>Console & Stats Output</span>
                      {customCodeResult?.stdout && <span className="tab-pill-badge">stdout</span>}
                    </button>

                    <button
                      type="button"
                      className={`out-tab ${activeCodeOutputTab === "data" ? "active" : ""}`}
                      onClick={() => setActiveCodeOutputTab("data")}
                    >
                      <Table2 size={15} />
                      <span>DataFrame Table</span>
                    </button>
                  </div>

                  {customCodeResult && (
                    <div className="exec-meta">
                      <Activity size={13} />
                      <span>{customCodeResult.execution_time_ms}ms runtime</span>
                      <span className={`exec-status-chip ${customCodeResult.success ? "good" : "bad"}`}>
                        {customCodeResult.success ? "Success" : "Error"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="w1-output-tab-body">
                  {/* TAB 1: VISUAL OUTPUT */}
                  {activeCodeOutputTab === "visual" && (
                    <div className="visual-tab-content">
                      {customCodeResult?.chart_base64 ? (
                        <div className="rendered-visual-wrapper">
                          <div className="visual-callout-header">
                            <div className="visual-title-row">
                              <Sparkles size={14} className="sparkle-icon" />
                              <strong>Matplotlib Generated Visual Representation</strong>
                            </div>
                            <span className="dpi-tag">140 DPI High-Res</span>
                          </div>

                          <div className="chart-img-container">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={customCodeResult.chart_base64}
                              alt="Generated Data Analysis Visual"
                              className="w1-chart-image"
                            />
                          </div>

                          {activeMapping && (
                            <div className="live-mapping-toast">
                              <span className="toast-label">Highlighted Visual Component:</span>
                              <strong>{activeMapping.visual_element}</strong>
                              <code>{activeMapping.code_snippet}</code>
                              <p>{activeMapping.explanation}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="empty-visual-state">
                          <BarChart3 size={48} className="empty-v-icon" />
                          <h4>No Chart in Current Output</h4>
                          <p>
                            {customCodeResult?.stdout
                              ? "Your code printed output to Console. Click 'Console & Stats Output' above to view."
                              : "Click 'Run & Replicate Visual' to execute the script and render the Matplotlib graphic."}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: "HOW TO MANIPULATE & IMPROVE" INTERACTIVE STUDIO */}
                  {activeCodeOutputTab === "improver" && (
                    <div className="improver-tab-content">
                      <div className="improver-banner">
                        <div className="improver-title-group">
                          <Sparkles size={18} className="sparkle-icon" />
                          <div>
                            <h4>How to Manipulate Code & Parameters to Make Results Better</h4>
                            <p>Test different statistical intervals, visual styles, and hyperparameters in real time.</p>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Parameter Sliders */}
                      <div className="improver-controls-grid">
                        <div className="control-card">
                          <div className="control-label-row">
                            <strong>Histogram Bins Interval</strong>
                            <span className="val-badge">{improverBins} bins</span>
                          </div>
                          <input
                            type="range"
                            min="3"
                            max="25"
                            value={improverBins}
                            onChange={(e) => applyImproverModification("bins", Number(e.target.value))}
                            className="improver-slider"
                          />
                          <small className="control-hint">
                            Fewer bins smooth noise; more bins reveal micro-clusters and multimodality.
                          </small>
                        </div>

                        <div className="control-card">
                          <div className="control-label-row">
                            <strong>Alpha Transparency</strong>
                            <span className="val-badge">{Math.round(improverAlpha * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.2"
                            max="1.0"
                            step="0.05"
                            value={improverAlpha}
                            onChange={(e) => applyImproverModification("alpha", Number(e.target.value))}
                            className="improver-slider"
                          />
                          <small className="control-hint">
                            Prevents point occlusion and reveals dense coordinate clusters.
                          </small>
                        </div>

                        <div className="control-card">
                          <div className="control-label-row">
                            <strong>Colormap Palette</strong>
                          </div>
                          <select
                            value={improverColormap}
                            onChange={(e) => applyImproverModification("colormap", e.target.value)}
                            className="improver-select"
                          >
                            <option value="coolwarm">Coolwarm (Diverging Blue-Red)</option>
                            <option value="viridis">Viridis (Perceptually Uniform)</option>
                            <option value="RdBu_r">RdBu_r (Red-Blue Diverging)</option>
                            <option value="plasma">Plasma (High Contrast)</option>
                            <option value="Blues">Blues (Sequential)</option>
                          </select>
                          <small className="control-hint">
                            Diverging colormaps highlight extremes from zero; sequential colormaps show density.
                          </small>
                        </div>

                        <div className="control-card">
                          <div className="control-label-row">
                            <strong>Decision Tree Max Depth</strong>
                            <span className="val-badge">Depth {improverTreeDepth}</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="8"
                            value={improverTreeDepth}
                            onChange={(e) => applyImproverModification("tree_depth", Number(e.target.value))}
                            className="improver-slider"
                          />
                          <small className="control-hint">
                            Controls decision complexity; lower depth prevents overfitting.
                          </small>
                        </div>
                      </div>

                      {/* 1-Click Visual Experiment Presets */}
                      <div className="quick-experiments-box">
                        <strong>⚡ 1-Click Code Manipulations & Experiments:</strong>
                        <div className="exp-pills-row">
                          <button
                            type="button"
                            className="exp-chip"
                            onClick={() => applyQuickExperiment("bins-15")}
                          >
                            <Sliders size={13} />
                            Set 15 Bins (Balanced Skew)
                          </button>
                          <button
                            type="button"
                            className="exp-chip"
                            onClick={() => applyQuickExperiment("bins-5")}
                          >
                            <Sliders size={13} />
                            Set 5 Bins (Coarse Overview)
                          </button>
                          <button
                            type="button"
                            className="exp-chip"
                            onClick={() => applyQuickExperiment("add-confidence-band")}
                          >
                            <Sparkles size={13} />
                            Add 1-Std Dev Confidence Band
                          </button>
                          <button
                            type="button"
                            className="exp-chip"
                            onClick={() => applyQuickExperiment("add-polyfit")}
                          >
                            <TrendingUp size={13} />
                            Overlay 1st-Degree Fit Trendline
                          </button>
                          <button
                            type="button"
                            className="exp-chip"
                            onClick={() => applyQuickExperiment("color-blue")}
                          >
                            <PaletteIcon size={13} />
                            Sapphire Blue Theme
                          </button>
                          <button
                            type="button"
                            className="exp-chip"
                            onClick={() => applyQuickExperiment("color-purple")}
                          >
                            <PaletteIcon size={13} />
                            Purple Theme
                          </button>
                        </div>
                      </div>

                      {/* Educational Rationale */}
                      <div className="improver-rationale-box">
                        <strong>📌 How to Make Data Analysis Visuals More Effective:</strong>
                        <ul>
                          <li>
                            <strong>Reduce Cognitive Load:</strong> Add direct numerical annotations ($K) above bars so stakeholders don&apos;t have to trace the y-axis.
                          </li>
                          <li>
                            <strong>Always Compare Mean vs. Median:</strong> A wide gap signals heavy-tailed skewness or extreme outliers.
                          </li>
                          <li>
                            <strong>Check Residuals Before Shipping ML Models:</strong> Ensure errors are evenly distributed around 0 without funnel patterns.
                          </li>
                          <li>
                            <strong>Maximize Data-Ink Ratio:</strong> Remove unnecessary top and right axis spines (ax.spines[&apos;top&apos;].set_visible(False)).
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: TERMINAL / CONSOLE OUTPUT */}
                  {activeCodeOutputTab === "terminal" && (
                    <div className="terminal-tab-content">
                      <div className="terminal-emulator">
                        <div className="terminal-header-bar">
                          <div className="term-dots">
                            <span className="dot red" />
                            <span className="dot yellow" />
                            <span className="dot green" />
                          </div>
                          <span className="term-title">Python 3.10 Runtime Console</span>
                        </div>
                        <pre className="terminal-body">
                          {customCodeResult?.stdout && (
                            <div className="term-stdout">{customCodeResult.stdout}</div>
                          )}
                          {customCodeResult?.stderr && (
                            <div className="term-stderr">{customCodeResult.stderr}</div>
                          )}
                          {!customCodeResult?.stdout && !customCodeResult?.stderr && (
                            <div className="term-placeholder">
                              # Run your code or drag modules to see terminal output and statistical tables here...
                            </div>
                          )}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: DATA PREVIEW TABLE */}
                  {activeCodeOutputTab === "data" && (
                    <div className="data-preview-tab-content">
                      {customCodeResult?.data_preview ? (
                        <div className="data-table-box">
                          <div className="table-header-bar">
                            <Table2 size={15} />
                            <strong>
                              DataFrame Snapshot ({customCodeResult.data_preview.total_rows} rows ×{" "}
                              {customCodeResult.data_preview.total_columns} columns)
                            </strong>
                          </div>
                          <div className="table-scroll-wrap">
                            <table className="preview-table">
                              <thead>
                                <tr>
                                  {customCodeResult.data_preview.columns.map((c) => (
                                    <th key={c}>{c}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {customCodeResult.data_preview.rows.map((row, rIdx) => (
                                  <tr key={rIdx}>
                                    {customCodeResult.data_preview!.columns.map((c) => (
                                      <td key={c}>{String(row[c] ?? "")}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="empty-visual-state">
                          <Database size={40} className="empty-v-icon" />
                          <p>Run your analysis script to inspect the underlying DataFrame records.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WORKSHOP 2: VISUAL PIPELINE WORKBENCH & MODULAR ML STUDIO                 */}
      {/* ========================================================================= */}
      {activeWorkshop === "visual-workbench" && (
        <div className="workshop-2-container">
          {/* PRESET SELECTOR BAR */}
          <section className="preset-selector-bar" aria-label="Workshop Example Templates">
            <div className="preset-header">
              <div className="preset-title-group">
                <Sparkles size={16} className="sparkle-icon" />
                <strong>Modular ML Workbench Templates:</strong>
              </div>
              <span className="preset-hint">Load a pre-configured multi-step pipeline</span>
            </div>

            <div className="preset-pills">
              {safePresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={activePresetId === preset.id ? "preset-pill active" : "preset-pill"}
                  onClick={() => loadW2Preset(preset.id)}
                >
                  <span className="preset-icon-badge">
                    {preset.id.includes("sales") && <TrendingUp size={14} />}
                    {preset.id.includes("churn") && <BrainCircuit size={14} />}
                    {preset.id.includes("rf") && <Flame size={14} />}
                    {preset.id.includes("segment") && <Layers size={14} />}
                  </span>
                  <span className="preset-pill-title">{preset.title}</span>
                  <span className="preset-diff-badge">{preset.difficulty}</span>
                </button>
              ))}
              <button
                type="button"
                className="preset-pill clear-pill"
                onClick={clearW2All}
                title="Clear canvas to build custom workflow"
              >
                <Trash2 size={13} />
                <span>Blank Canvas</span>
              </button>
            </div>

            {activePreset && (
              <div className="preset-detail-banner">
                <div className="preset-detail-text">
                  <strong>{activePreset.subtitle}</strong>
                  <p>{activePreset.description}</p>
                </div>
                <div className="preset-takeaway">
                  <BookOpen size={15} />
                  <span>
                    <strong>Learner Takeaway:</strong> {activePreset.key_takeaway}
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* 3-PANEL WORKBENCH */}
          <section className="workspace">
            {/* 1. PALETTE PANEL */}
            <aside className="palette" aria-label="Module palette">
              <div className="panel-header">
                <div>
                  <h2>Module Catalog</h2>
                  <small>Drag or click to add to flow</small>
                </div>
                <span className="count-badge">{filteredModules.length}</span>
              </div>

              <div className="palette-search">
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search blocks (e.g. regression, plot, random forest)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="category-filter-row">
                <button
                  type="button"
                  className={activeCategory === "all" ? "filter-chip active" : "filter-chip"}
                  onClick={() => setActiveCategory("all")}
                >
                  All
                </button>
                <button
                  type="button"
                  className={activeCategory === "data" ? "filter-chip active data" : "filter-chip data"}
                  onClick={() => setActiveCategory("data")}
                >
                  Pandas
                </button>
                <button
                  type="button"
                  className={activeCategory === "science" ? "filter-chip active science" : "filter-chip science"}
                  onClick={() => setActiveCategory("science")}
                >
                  NumPy
                </button>
                <button
                  type="button"
                  className={activeCategory === "visualization" ? "filter-chip active viz" : "filter-chip viz"}
                  onClick={() => setActiveCategory("visualization")}
                >
                  Matplotlib
                </button>
                <button
                  type="button"
                  className={activeCategory === "machine-learning" ? "filter-chip active ml" : "filter-chip ml"}
                  onClick={() => setActiveCategory("machine-learning")}
                >
                  Scikit-Learn
                </button>
              </div>

              <div className="module-list">
                {filteredModules.map((module) => {
                  const Icon = categoryIcon[module.category] || Blocks;
                  const theme = categoryTheme[module.category] || categoryTheme.data;
                  return (
                    <button
                      key={module.id}
                      className="module-card"
                      draggable
                      onClick={() => addW2Module(module.id)}
                      onDragStart={(event) => {
                        event.dataTransfer.setData("module-id", module.id);
                      }}
                      type="button"
                    >
                      <span
                        className="module-icon"
                        style={{ background: theme.bg, color: theme.text, borderColor: theme.border }}
                      >
                        <Icon size={18} />
                      </span>
                      <div className="module-content">
                        <div className="module-topline">
                          <strong style={{ color: theme.text }}>{module.package}</strong>
                          {module.badge && <span className="module-badge">{module.badge}</span>}
                        </div>
                        <span className="module-title">{module.title}</span>
                        <small>{module.description}</small>
                      </div>
                      <div className="add-affordance">
                        <Plus size={15} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* 2. CANVAS PANEL */}
            <section
              className="canvas"
              aria-label="Project canvas"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const moduleId = event.dataTransfer.getData("module-id");
                if (moduleId) addW2Module(moduleId);
              }}
            >
              <div className="panel-header">
                <div>
                  <h2>Project Pipeline</h2>
                  <small>Ordered execution flow</small>
                </div>
                <div className="canvas-header-actions">
                  <span className="count-badge">{blocks.length} steps</span>
                  <button
                    className="run-mini-btn"
                    type="button"
                    disabled={isExecutingW2 || safeBlocks.length === 0}
                    onClick={runW2Pipeline}
                  >
                    {isExecutingW2 ? <RefreshCw size={13} className="spin-icon" /> : <Play size={13} fill="currentColor" />}
                    <span>Run Pipeline</span>
                  </button>
                </div>
              </div>

              {blocks.length === 0 ? (
                <div className="empty-canvas">
                  <Workflow size={42} className="empty-icon" />
                  <h3>Your Pipeline is Empty</h3>
                  <p>Drag blocks from the catalog or click an example use case above to get started.</p>
                  <button
                    className="starter-btn"
                    type="button"
                    onClick={() => loadW2Preset("sales-roi-regression")}
                  >
                    <Sparkles size={16} />
                    Load Sales ROI Example
                  </button>
                </div>
              ) : (
                <div className="flow-list">
                  {blocks.map((block, index) => {
                    const module = moduleById.get(block.module_id);
                    if (!module) return null;
                    const Icon = categoryIcon[module.category] || Blocks;
                    const theme = categoryTheme[module.category] || categoryTheme.data;
                    const isSelected = block.id === selectedBlockId;

                    return (
                      <div key={block.id} className="flow-block-container">
                        {index > 0 && (
                          <div className="connector-line">
                            <div className="connector-arrow">↓</div>
                          </div>
                        )}
                        <article
                          className={isSelected ? "flow-block selected" : "flow-block"}
                          draggable
                          onClick={() => setSelectedBlockId(block.id)}
                          onDragStart={() => setDraggedBlockId(block.id)}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => moveW2Block(block.id)}
                        >
                          <div className="drag-handle-wrapper" title="Drag to reorder">
                            <GripVertical className="drag-handle" size={16} />
                          </div>

                          <span className="step-number">{index + 1}</span>

                          <span
                            className="module-icon small"
                            style={{ background: theme.bg, color: theme.text }}
                          >
                            <Icon size={16} />
                          </span>

                          <div className="flow-copy">
                            <div className="flow-title-row">
                              <strong>{module.title}</strong>
                              <span className="package-tag" style={{ color: theme.text }}>
                                {module.package}
                              </span>
                            </div>
                            <div className="settings-preview">
                              {Object.entries(block.settings)
                                .slice(0, 2)
                                .map(([k, v]) => (
                                  <span key={k} className="setting-tag">
                                    {k}: <em>{String(v)}</em>
                                  </span>
                                ))}
                            </div>
                          </div>

                          <div className="flow-block-actions" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="shift-btn"
                              type="button"
                              disabled={index === 0}
                              onClick={() => shiftW2Block(block.id, "up")}
                              title="Move step up"
                            >
                              <ArrowUp size={13} />
                            </button>
                            <button
                              className="shift-btn"
                              type="button"
                              disabled={index === blocks.length - 1}
                              onClick={() => shiftW2Block(block.id, "down")}
                              title="Move step down"
                            >
                              <ArrowDown size={13} />
                            </button>
                            <button
                              className="icon-button delete"
                              type="button"
                              aria-label={`Remove ${module.title}`}
                              onClick={() => removeW2Block(block.id)}
                              title="Remove block"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </article>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 3. INSPECTOR PANEL */}
            <aside className="inspector" aria-label="Block settings">
              <div className="panel-header">
                <div>
                  <h2>Block Settings</h2>
                  <small>Configure parameters & inputs</small>
                </div>
                <Sliders size={16} className="header-icon" />
              </div>

              {selectedBlock && selectedModule ? (
                <div className="settings-form">
                  <div className="module-info-box">
                    <span className="eyebrow">{selectedModule.package}</span>
                    <h3>{selectedModule.title}</h3>
                    <p className="goal-text">
                      <strong>Learner Goal:</strong> {selectedModule.learner_goal}
                    </p>
                  </div>

                  <div className="fields-wrapper">
                    {selectedModule.options.map((option) => (
                      <label key={option.key} className="field">
                        <span className="field-label">
                          {option.label}
                          {option.type === "number" && <small className="type-tag">number</small>}
                        </span>

                        {option.type === "select" && option.choices ? (
                          <select
                            className="field-select"
                            value={selectedBlock.settings[option.key] ?? option.default}
                            onChange={(e) => updateW2Setting(option.key, e.target.value)}
                          >
                            {option.choices.map((choice) => (
                              <option key={choice.value} value={choice.value}>
                                {choice.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            className="field-input"
                            type={option.type === "number" ? "number" : "text"}
                            step={option.type === "number" ? "any" : undefined}
                            value={selectedBlock.settings[option.key] ?? ""}
                            onChange={(event) => updateW2Setting(option.key, event.target.value)}
                          />
                        )}

                        <small className="help-text">{option.help_text}</small>
                      </label>
                    ))}
                  </div>

                  <div className="inspector-tip">
                    <Info size={14} />
                    <span>Changes automatically update the pipeline and generated Python code.</span>
                  </div>
                </div>
              ) : (
                <div className="empty-settings">
                  <Sliders size={32} className="empty-icon" />
                  <p>Select any step in the pipeline to adjust its inputs, dataset columns, and parameters.</p>
                </div>
              )}
            </aside>
          </section>

          {/* DUAL OUTPUT DASHBOARD */}
          <section className="output-dashboard">
            <div className="output-tabs-header">
              <div className="tab-buttons">
                <button
                  type="button"
                  className={activeW2Tab === "results" ? "tab-btn active" : "tab-btn"}
                  onClick={() => setActiveW2Tab("results")}
                >
                  <BarChart3 size={16} />
                  <span>Interactive Results & Charts</span>
                  {executionW2?.results && (
                    <span className="tab-badge">{executionW2.results.length} outputs</span>
                  )}
                </button>
                <button
                  type="button"
                  className={activeW2Tab === "code" ? "tab-btn active" : "tab-btn"}
                  onClick={() => setActiveW2Tab("code")}
                >
                  <Code2 size={16} />
                  <span>Generated Python Code</span>
                  <span className="tab-badge">{generatedW2.imports.length} imports</span>
                </button>
              </div>

              <div className="tab-actions">
                {activeW2Tab === "code" && (
                  <>
                    <button className="secondary-action-btn" type="button" onClick={copyW2Code}>
                      {copiedW2Code ? <Check size={15} /> : <Copy size={15} />}
                      <span>{copiedW2Code ? "Copied!" : "Copy Code"}</span>
                    </button>
                    <button className="secondary-action-btn" type="button" onClick={downloadW2Script}>
                      <Download size={15} />
                      <span>Download .py</span>
                    </button>
                  </>
                )}
                {activeW2Tab === "results" && (
                  <button
                    className="secondary-action-btn"
                    type="button"
                    onClick={runW2Pipeline}
                    disabled={isExecutingW2}
                  >
                    <RefreshCw size={14} className={isExecutingW2 ? "spin-icon" : ""} />
                    <span>Re-run Analysis</span>
                  </button>
                )}
              </div>
            </div>

            {/* RESULTS TAB */}
            {activeW2Tab === "results" && (
              <div className="results-tab-content">
                {executionW2 ? (
                  <>
                    <div className={executionW2.success ? "results-banner success" : "results-banner error"}>
                      <div className="banner-icon">
                        {executionW2.success ? (
                          <CheckCircle2 size={22} className="success-icon" />
                        ) : (
                          <AlertCircle size={22} className="error-icon" />
                        )}
                      </div>
                      <div className="banner-copy">
                        <div className="banner-title-row">
                          <strong>
                            {executionW2.success ? "Pipeline Executed Successfully" : "Execution Notice"}
                          </strong>
                          <span className="exec-time">
                            <Activity size={14} />
                            {executionW2.execution_time_ms}ms runtime
                          </span>
                        </div>
                        <p>{executionW2.summary_insight || executionW2.error}</p>
                      </div>
                    </div>

                    <div className="results-grid">
                      {executionW2.results.map((result, idx) => {
                        const theme = categoryTheme[result.category] || categoryTheme.data;
                        const Icon = categoryIcon[result.category] || Blocks;

                        return (
                          <div key={result.block_id || idx} className="result-card">
                            <div className="result-card-header">
                              <div className="result-card-title">
                                <span className="step-badge">{idx + 1}</span>
                                <span
                                  className="module-icon small"
                                  style={{ background: theme.bg, color: theme.text }}
                                >
                                  <Icon size={14} />
                                </span>
                                <div>
                                  <h4>{result.title}</h4>
                                  <small style={{ color: theme.text }}>{result.package}</small>
                                </div>
                              </div>
                              <span className={result.success ? "status-chip success" : "status-chip error"}>
                                {result.success ? "Success" : "Failed"}
                              </span>
                            </div>

                            <p className="result-summary">{result.summary}</p>

                            {result.error && (
                              <div className="error-callout">
                                <AlertCircle size={15} />
                                <span>{result.error}</span>
                              </div>
                            )}

                            {result.chart_base64 && (
                              <div className="chart-preview-container">
                                <div className="chart-label">Matplotlib Visual Output</div>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={result.chart_base64}
                                  alt={result.title}
                                  className="rendered-chart"
                                />
                              </div>
                            )}

                            {result.metrics && result.metrics.length > 0 && (
                              <div className="metrics-grid">
                                {result.metrics.map((m, mIdx) => (
                                  <div key={mIdx} className="metric-box">
                                    <span className="metric-label">{m.label}</span>
                                    <strong className="metric-val">{String(m.value)}</strong>
                                    {m.description && (
                                      <small className="metric-desc">{m.description}</small>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {result.data_preview && (
                              <div className="table-preview-container">
                                <div className="table-header-row">
                                  <span className="table-title">
                                    <Table2 size={14} />
                                    DataFrame Sample ({result.data_preview.total_rows} total rows ×{" "}
                                    {result.data_preview.total_columns} columns)
                                  </span>
                                </div>
                                <div className="table-scroll">
                                  <table className="preview-table">
                                    <thead>
                                      <tr>
                                        {result.data_preview.columns.map((col) => (
                                          <th key={col}>{col}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {result.data_preview.rows.map((row, rIdx) => (
                                        <tr key={rIdx}>
                                          {result.data_preview!.columns.map((col) => (
                                            <td key={col}>{String(row[col] ?? "")}</td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {result.logs && result.logs.length > 0 && (
                              <div className="logs-drawer">
                                <button
                                  type="button"
                                  className="logs-toggle"
                                  onClick={() =>
                                    setExpandedLogId(
                                      expandedLogId === result.block_id ? null : result.block_id
                                    )
                                  }
                                >
                                  <FileCode2 size={13} />
                                  <span>Console Logs ({result.logs.length} lines)</span>
                                  <ChevronRight
                                    size={14}
                                    className={expandedLogId === result.block_id ? "rotate-90" : ""}
                                  />
                                </button>
                                {expandedLogId === result.block_id && (
                                  <pre className="logs-content">
                                    <code>{result.logs.join("\n")}</code>
                                  </pre>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="empty-results">
                    <LineChart size={40} className="empty-icon" />
                    <h3>Ready to analyze your data</h3>
                    <p>Click <strong>Run Interactive Analysis</strong> above to execute the pipeline.</p>
                  </div>
                )}
              </div>
            )}

            {/* CODE TAB */}
            {activeW2Tab === "code" && (
              <div className="code-tab-content">
                {generatedW2.notes.length > 0 && (
                  <div className="workshop-notes-banner">
                    <div className="notes-header">
                      <BookOpen size={16} />
                      <strong>Workshop Pedagogical Notes & Best Practices:</strong>
                    </div>
                    <ul>
                      {generatedW2.notes.map((note, i) => (
                        <li key={i}>{note}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="code-viewer">
                  <div className="code-viewer-header">
                    <div className="file-info">
                      <FileCode2 size={16} />
                      <span>main.py (Ready to run in Python, VS Code, or Jupyter)</span>
                    </div>
                    <div className="import-tags">
                      {generatedW2.imports.map((imp) => (
                        <span key={imp} className="import-chip">
                          {imp}
                        </span>
                      ))}
                    </div>
                  </div>
                  <pre className="code-body">
                    <code>{generatedW2.code || "# Add modules to generate code.\n"}</code>
                  </pre>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function PaletteIcon({ size = 14 }: { size?: number }) {
  return <PieChart size={size} />;
}
