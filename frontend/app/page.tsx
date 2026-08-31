"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Blocks,
  BookOpen,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronRight,
  Code2,
  Copy,
  Database,
  Download,
  FileCode2,
  GripVertical,
  HelpCircle,
  Info,
  Layers,
  LineChart,
  Play,
  Plus,
  RefreshCw,
  Search,
  Sliders,
  Sparkles,
  Table2,
  Trash2,
  TrendingUp,
  Workflow,
  Zap,
} from "lucide-react";

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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const categoryIcon = {
  data: Database,
  science: Blocks,
  visualization: BarChart3,
  "machine-learning": BrainCircuit,
};

const categoryLabel = {
  data: "Pandas (Data)",
  science: "NumPy (Science)",
  visualization: "Matplotlib (Charts)",
  "machine-learning": "Scikit-Learn (ML)",
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

const fallbackModules: ModuleDefinition[] = [
  {
    id: "pandas-load-csv",
    title: "Load Dataset",
    package: "Pandas",
    category: "data",
    description: "Load tabular data from a CSV file into a pandas DataFrame.",
    learner_goal: "Start your workflow by ingesting rows and columns into Python memory.",
    badge: "Foundation",
    options: [
      {
        key: "file_name",
        label: "Dataset Source",
        default: "sales_marketing.csv",
        help_text: "Choose a workshop sample dataset or enter a CSV filename.",
        type: "select",
        choices: [
          { value: "sales_marketing.csv", label: "📈 Sales & Marketing Spend (Regression / EDA)" },
          { value: "customer_churn.csv", label: "🎯 Customer Churn & Retention (Classification)" },
          { value: "housing_prices.csv", label: "🏡 Real Estate & Housing Prices (Regression / Multi-feature)" },
          { value: "sales.csv", label: "📊 Basic Sales Records" },
        ],
      },
      {
        key: "preview_rows",
        label: "Preview Rows",
        default: 5,
        help_text: "Number of initial rows to display in the data table.",
        type: "number",
      },
    ],
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
        help_text: "Choose how to resolve rows containing null or NaN values.",
        type: "select",
        choices: [
          { value: "drop_rows", label: "Drop rows with any missing values" },
          { value: "fill_mean", label: "Impute missing numeric values with column Mean" },
          { value: "fill_median", label: "Impute missing numeric values with column Median" },
        ],
      },
    ],
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
      {
        key: "column",
        label: "Filter Column",
        default: "sales",
        help_text: "Column name to evaluate for row filtering.",
        type: "text",
      },
      {
        key: "operator",
        label: "Condition",
        default: ">",
        help_text: "Comparison operator to test against threshold.",
        type: "select",
        choices: [
          { value: ">", label: "Greater than (>)" },
          { value: ">=", label: "Greater than or equal (>=)" },
          { value: "<", label: "Less than (<)" },
          { value: "<=", label: "Less than or equal (<=)" },
          { value: "==", label: "Equals (==)" },
          { value: "!=", label: "Not equals (!=)" },
        ],
      },
      {
        key: "threshold",
        label: "Threshold Value",
        default: "50000",
        help_text: "Value to compare against in the condition.",
        type: "text",
      },
    ],
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
      {
        key: "group_column",
        label: "Group By Column",
        default: "region",
        help_text: "Categorical column to group records by.",
        type: "text",
      },
      {
        key: "agg_column",
        label: "Target Numeric Column",
        default: "sales",
        help_text: "Numeric column to compute aggregation on.",
        type: "text",
      },
      {
        key: "agg_func",
        label: "Aggregation Function",
        default: "mean",
        help_text: "Statistical operation to apply to each group.",
        type: "select",
        choices: [
          { value: "mean", label: "Average / Mean" },
          { value: "sum", label: "Total Sum" },
          { value: "count", label: "Row Count" },
          { value: "median", label: "Median" },
          { value: "max", label: "Maximum" },
          { value: "min", label: "Minimum" },
        ],
      },
    ],
  },
  {
    id: "numpy-summary",
    title: "Numeric Summary & Stats",
    package: "NumPy",
    category: "science",
    description: "Compute descriptive summary statistics (mean, median, std, percentiles) via NumPy arrays.",
    learner_goal: "Learn foundational statistics and understand data dispersion.",
    badge: "Statistics",
    options: [
      {
        key: "column",
        label: "Numeric Column",
        default: "sales",
        help_text: "The numeric column to compute statistics for.",
        type: "text",
      },
    ],
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
      {
        key: "column",
        label: "Source Column",
        default: "marketing_spend",
        help_text: "Column to transform.",
        type: "text",
      },
      {
        key: "transform_type",
        label: "Transformation Type",
        default: "z_score",
        help_text: "Mathematical transformation method.",
        type: "select",
        choices: [
          { value: "z_score", label: "Z-Score Standardization (mean=0, std=1)" },
          { value: "log", label: "Logarithmic Transform (np.log1p)" },
          { value: "min_max", label: "Min-Max Scaling (0.0 to 1.0)" },
        ],
      },
    ],
  },
  {
    id: "matplotlib-scatter-plot",
    title: "Scatter Plot & Trendline",
    package: "Matplotlib",
    category: "visualization",
    description: "Plot two continuous variables with an optional linear regression fit line.",
    learner_goal: "Visually identify correlation, outliers, and linear trends between variables.",
    badge: "Visual Discovery",
    options: [
      {
        key: "x_column",
        label: "X-Axis (Feature)",
        default: "marketing_spend",
        help_text: "Independent variable on horizontal axis.",
        type: "text",
      },
      {
        key: "y_column",
        label: "Y-Axis (Target / Outcome)",
        default: "sales",
        help_text: "Dependent variable on vertical axis.",
        type: "text",
      },
      {
        key: "title",
        label: "Chart Title",
        default: "Marketing Spend vs. Sales Revenue",
        help_text: "Main heading for the plot.",
        type: "text",
      },
      {
        key: "show_trendline",
        label: "Show Regression Trendline",
        default: "yes",
        help_text: "Draw a fitted best-fit line through the scatter points.",
        type: "select",
        choices: [
          { value: "yes", label: "Yes - Show Best Fit Trendline" },
          { value: "no", label: "No - Points Only" },
        ],
      },
    ],
  },
  {
    id: "matplotlib-bar-chart",
    title: "Bar Chart",
    package: "Matplotlib",
    category: "visualization",
    description: "Compare aggregate values across categories with styled bar charts.",
    learner_goal: "Communicate categorical differences effectively to stakeholders.",
    badge: "Visual Discovery",
    options: [
      {
        key: "category_column",
        label: "Category Column (X)",
        default: "region",
        help_text: "The category labels for the bars.",
        type: "text",
      },
      {
        key: "value_column",
        label: "Metric Column (Y)",
        default: "sales",
        help_text: "The values to measure and compare.",
        type: "text",
      },
      {
        key: "title",
        label: "Chart Title",
        default: "Total Sales by Region",
        help_text: "Title shown at top of the chart.",
        type: "text",
      },
    ],
  },
  {
    id: "matplotlib-histogram",
    title: "Histogram & Distribution",
    package: "Matplotlib",
    category: "visualization",
    description: "Visualize frequency distribution and skewness of a numeric feature.",
    learner_goal: "Check data normality, skew, and spread before applying ML models.",
    badge: "Visual Discovery",
    options: [
      {
        key: "column",
        label: "Numeric Column",
        default: "sales",
        help_text: "Column to plot distribution for.",
        type: "text",
      },
      {
        key: "bins",
        label: "Number of Bins",
        default: 10,
        help_text: "Number of histogram intervals.",
        type: "number",
      },
      {
        key: "title",
        label: "Chart Title",
        default: "Distribution of Sales",
        help_text: "Chart title.",
        type: "text",
      },
    ],
  },
  {
    id: "matplotlib-line-chart",
    title: "Line Trend Chart",
    package: "Matplotlib",
    category: "visualization",
    description: "Plot sequential data or index progression with connected lines and markers.",
    learner_goal: "Observe changes, trends, or trajectory across ordered observations.",
    badge: "Visual Discovery",
    options: [
      {
        key: "x_column",
        label: "X-Axis Column",
        default: "store_footfall",
        help_text: "Order or horizontal metric.",
        type: "text",
      },
      {
        key: "y_column",
        label: "Y-Axis Column",
        default: "sales",
        help_text: "Metric to plot along vertical axis.",
        type: "text",
      },
      {
        key: "title",
        label: "Chart Title",
        default: "Sales Trend Across Footfall",
        help_text: "Chart title.",
        type: "text",
      },
    ],
  },
  {
    id: "matplotlib-correlation-heatmap",
    title: "Correlation Heatmap",
    package: "Matplotlib",
    category: "visualization",
    description: "Compute correlation coefficients between all numeric columns and display a color-coded matrix.",
    learner_goal: "Identify strong positive/negative relationships and select predictive features.",
    badge: "Feature Analysis",
    options: [
      {
        key: "title",
        label: "Heatmap Title",
        default: "Feature Correlation Matrix",
        help_text: "Title for the correlation matrix plot.",
        type: "text",
      },
    ],
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
      {
        key: "feature_column",
        label: "Feature Column (X)",
        default: "marketing_spend",
        help_text: "Input variable used to make predictions.",
        type: "text",
      },
      {
        key: "target_column",
        label: "Target Column (y)",
        default: "sales",
        help_text: "Continuous outcome variable to predict.",
        type: "text",
      },
      {
        key: "test_size",
        label: "Test Split Ratio (0.1 - 0.5)",
        default: 0.2,
        help_text: "Fraction of data reserved for testing model accuracy.",
        type: "number",
      },
    ],
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
      {
        key: "feature_columns",
        label: "Feature Columns (comma-separated)",
        default: "tenure_months, monthly_charges, support_tickets",
        help_text: "Numeric input features for classification.",
        type: "text",
      },
      {
        key: "target_column",
        label: "Target Class Column (y)",
        default: "churned",
        help_text: "Binary or multi-class label column to predict.",
        type: "text",
      },
      {
        key: "max_depth",
        label: "Tree Max Depth",
        default: 3,
        help_text: "Maximum depth of the decision tree to prevent overfitting.",
        type: "number",
      },
    ],
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
      {
        key: "feature_x",
        label: "First Feature (X)",
        default: "marketing_spend",
        help_text: "First dimension for clustering.",
        type: "text",
      },
      {
        key: "feature_y",
        label: "Second Feature (Y)",
        default: "store_footfall",
        help_text: "Second dimension for clustering.",
        type: "text",
      },
      {
        key: "n_clusters",
        label: "Number of Clusters (K)",
        default: 3,
        help_text: "How many distinct groups to segment data into.",
        type: "number",
      },
    ],
  },
];

const fallbackPresets: PresetUseCase[] = [
  {
    id: "sales-roi-regression",
    title: "Sales & Marketing ROI Predictor",
    subtitle: "Predict revenue from advertising spend with Linear Regression & Matplotlib",
    description: "Explore how marketing spend and footfall drive revenue. Clean the data, compute summary statistics, plot the scatter correlation with a trendline, train a Scikit-Learn Linear Regression model, and visualize regional totals.",
    category: "Regression & ROI Analysis",
    icon: "TrendingUp",
    difficulty: "Beginner",
    key_takeaway: "Understand feature vs target relationships, R² goodness-of-fit, and interpreting regression slopes.",
    blocks: [
      {
        id: "block-sales-1",
        module_id: "pandas-load-csv",
        settings: { file_name: "sales_marketing.csv", preview_rows: 5 },
      },
      {
        id: "block-sales-2",
        module_id: "pandas-clean",
        settings: { strategy: "drop_rows" },
      },
      {
        id: "block-sales-3",
        module_id: "numpy-summary",
        settings: { column: "sales" },
      },
      {
        id: "block-sales-4",
        module_id: "matplotlib-scatter-plot",
        settings: {
          x_column: "marketing_spend",
          y_column: "sales",
          title: "Marketing Spend vs. Sales Revenue (With Trendline)",
          show_trendline: "yes",
        },
      },
      {
        id: "block-sales-5",
        module_id: "sklearn-regression",
        settings: {
          feature_column: "marketing_spend",
          target_column: "sales",
          test_size: 0.2,
        },
      },
      {
        id: "block-sales-6",
        module_id: "matplotlib-bar-chart",
        settings: {
          category_column: "region",
          value_column: "sales",
          title: "Total Revenue by Region",
        },
      },
    ],
  },
  {
    id: "customer-churn-classification",
    title: "Customer Churn & Risk Classifier",
    subtitle: "Classify customer retention using Scikit-Learn Decision Trees & Confusion Matrix",
    description: "Analyze subscription data to detect churn risk factors. Group monthly charges by contract type, train a Decision Tree Classifier on tenure and support tickets, and evaluate the Confusion Matrix.",
    category: "Classification & Retention",
    icon: "BrainCircuit",
    difficulty: "Intermediate",
    key_takeaway: "Master classification metrics (Accuracy, Precision, Recall) and error analysis using Confusion Matrices.",
    blocks: [
      {
        id: "block-churn-1",
        module_id: "pandas-load-csv",
        settings: { file_name: "customer_churn.csv", preview_rows: 5 },
      },
      {
        id: "block-churn-2",
        module_id: "pandas-groupby",
        settings: {
          group_column: "contract_type",
          agg_column: "monthly_charges",
          agg_func: "mean",
        },
      },
      {
        id: "block-churn-3",
        module_id: "matplotlib-bar-chart",
        settings: {
          category_column: "contract_type",
          value_column: "monthly_charges",
          title: "Average Monthly Charges by Contract Type",
        },
      },
      {
        id: "block-churn-4",
        module_id: "matplotlib-histogram",
        settings: {
          column: "tenure_months",
          bins: 8,
          title: "Distribution of Customer Tenure (Months)",
        },
      },
      {
        id: "block-churn-5",
        module_id: "sklearn-classification",
        settings: {
          feature_columns: "tenure_months, monthly_charges, support_tickets",
          target_column: "churned",
          max_depth: 3,
        },
      },
    ],
  },
  {
    id: "housing-price-eda",
    title: "Housing Price Valuation & Heatmap",
    subtitle: "Exploratory data analysis & multi-variable correlation for real estate",
    description: "Inspect housing features, compute statistical dispersion, generate a comprehensive correlation heatmap across square footage and ratings, and train a regression model to estimate market prices.",
    category: "EDA & Valuation",
    icon: "Building",
    difficulty: "Intermediate",
    key_takeaway: "Use correlation heatmaps to select the strongest predictors before feeding features to a regression model.",
    blocks: [
      {
        id: "block-house-1",
        module_id: "pandas-load-csv",
        settings: { file_name: "housing_prices.csv", preview_rows: 5 },
      },
      {
        id: "block-house-2",
        module_id: "numpy-summary",
        settings: { column: "price" },
      },
      {
        id: "block-house-3",
        module_id: "matplotlib-correlation-heatmap",
        settings: { title: "Housing Features Correlation Matrix" },
      },
      {
        id: "block-house-4",
        module_id: "matplotlib-scatter-plot",
        settings: {
          x_column: "square_feet",
          y_column: "price",
          title: "Living Area (Sq Ft) vs. Sale Price",
          show_trendline: "yes",
        },
      },
      {
        id: "block-house-5",
        module_id: "sklearn-regression",
        settings: {
          feature_column: "square_feet",
          target_column: "price",
          test_size: 0.2,
        },
      },
    ],
  },
  {
    id: "customer-segmentation-clustering",
    title: "Customer Segmentation via K-Means",
    subtitle: "Unsupervised customer clustering and centroid visualization",
    description: "Group retail customers into distinct behavioural clusters based on marketing spend and store footfall. Visualize discovered cluster centroids using 2D scatter plots.",
    category: "Unsupervised Clustering",
    icon: "Users",
    difficulty: "Advanced",
    key_takeaway: "Learn how unsupervised clustering discovers hidden customer segments without labeled target answers.",
    blocks: [
      {
        id: "block-cluster-1",
        module_id: "pandas-load-csv",
        settings: { file_name: "sales_marketing.csv", preview_rows: 5 },
      },
      {
        id: "block-cluster-2",
        module_id: "numpy-summary",
        settings: { column: "store_footfall" },
      },
      {
        id: "block-cluster-3",
        module_id: "sklearn-clustering",
        settings: {
          feature_x: "marketing_spend",
          feature_y: "store_footfall",
          n_clusters: 3,
        },
      },
      {
        id: "block-cluster-4",
        module_id: "matplotlib-bar-chart",
        settings: {
          category_column: "region",
          value_column: "marketing_spend",
          title: "Marketing Budget by Region",
        },
      },
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
  const [modules, setModules] = useState<ModuleDefinition[]>(fallbackModules);
  const [presets, setPresets] = useState<PresetUseCase[]>(fallbackPresets);
  const [activePresetId, setActivePresetId] = useState<string>("sales-roi-regression");
  const [blocks, setBlocks] = useState<ProjectBlock[]>(() => fallbackPresets[0].blocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(() => fallbackPresets[0].blocks[0]?.id || null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"results" | "code">("results");
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const [generated, setGenerated] = useState<GenerateResponse>({
    code: "",
    imports: [],
    notes: [],
  });

  const [execution, setExecution] = useState<ExecuteResponse | null>(null);

  const safePresets = useMemo(
    () => (Array.isArray(presets) && presets.length > 0 ? presets : fallbackPresets),
    [presets]
  );
  const safeModules = useMemo(
    () => (Array.isArray(modules) && modules.length > 0 ? modules : fallbackModules),
    [modules]
  );
  const safeBlocks = useMemo(
    () => (Array.isArray(blocks) ? blocks : []),
    [blocks]
  );

  const moduleById = useMemo(
    () => new Map(safeModules.map((m) => [m.id, m])),
    [safeModules]
  );

  const selectedBlock = safeBlocks.find((b) => b.id === selectedBlockId);
  const selectedModule = selectedBlock ? moduleById.get(selectedBlock.module_id) : undefined;
  const activePreset = safePresets.find((p) => p.id === activePresetId);

  // Fetch modules & presets from API with array validation
  useEffect(() => {
    fetch(`${API_BASE}/modules`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setModules(data);
          setBackendConnected(true);
        }
      })
      .catch(() => {
        setBackendConnected(false);
      });

    fetch(`${API_BASE}/presets`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPresets(data);
        }
      })
      .catch(() => {});
  }, []);

  // Update generated code when blocks change
  useEffect(() => {
    if (safeBlocks.length === 0) {
      setGenerated({ code: "", imports: [], notes: [] });
      return;
    }

    const controller = new AbortController();
    fetch(`${API_BASE}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_name: activePreset?.title || "My Data Analysis Workshop Project",
        blocks: safeBlocks,
      }),
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data === "object" && "code" in data) {
          setGenerated(data);
        }
      })
      .catch(() => {
        // Simple client-side fallback generation
        setGenerated({
          code: `# ${activePreset?.title || "Data Analysis Workshop"}\nimport pandas as pd\nimport numpy as np\nimport matplotlib.pyplot as plt\n\n# Pipeline configured with ${safeBlocks.length} blocks.\n`,
          imports: ["pandas", "numpy", "matplotlib"],
          notes: ["Backend API offline. Click 'Run Analysis' to test."],
        });
      });

    return () => controller.abort();
  }, [safeBlocks, activePreset]);

  // Execute pipeline
  async function runPipeline() {
    if (safeBlocks.length === 0) return;
    setIsExecuting(true);
    try {
      const res = await fetch(`${API_BASE}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_name: activePreset?.title || "Data Science Project",
          blocks: safeBlocks,
        }),
      });
      if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
      const data = await res.json();
      if (data && typeof data === "object" && "results" in data) {
        setExecution(data as ExecuteResponse);
        setBackendConnected(true);
        setActiveTab("results");
      } else {
        throw new Error("Invalid execution response format");
      }
    } catch (err: any) {
      setBackendConnected(false);
      setExecution({
        success: false,
        results: [],
        execution_time_ms: 0,
        summary_insight: "Backend service unreachable.",
        error: "Make sure the Python backend is running on port 8000: 'uvicorn app.main:app --port 8000'",
      });
    } finally {
      setIsExecuting(false);
    }
  }

  // Run on first load with default preset
  useEffect(() => {
    runPipeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadPreset(presetId: string) {
    const preset = safePresets.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePresetId(preset.id);
    setBlocks(preset.blocks);
    setSelectedBlockId(preset.blocks[0]?.id || null);
    // Auto-run when preset loads
    setTimeout(() => {
      fetch(`${API_BASE}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_name: preset.title,
          blocks: preset.blocks,
        }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && typeof data === "object" && "results" in data) {
            setExecution(data as ExecuteResponse);
          }
        })
        .catch(() => {});
    }, 100);
  }

  function addModule(moduleId: string) {
    const module = moduleById.get(moduleId);
    if (!module) return;
    const nextBlock = createBlock(module);
    setBlocks((current) => [...current, nextBlock]);
    setSelectedBlockId(nextBlock.id);
    setActivePresetId("custom");
  }

  function moveBlock(targetBlockId: string) {
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

  function shiftBlock(blockId: string, direction: "up" | "down") {
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

  function updateSetting(key: string, value: string | number) {
    setBlocks((current) =>
      current.map((block) =>
        block.id === selectedBlockId
          ? {
              ...block,
              settings: {
                ...block.settings,
                [key]: typeof value === "number" ? value : Number.isFinite(Number(value)) && value.trim() !== "" ? Number(value) : value,
              },
            }
          : block,
      ),
    );
    setActivePresetId("custom");
  }

  function removeBlock(blockId: string) {
    setBlocks((current) => current.filter((b) => b.id !== blockId));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
    setActivePresetId("custom");
  }

  function clearAll() {
    setBlocks([]);
    setSelectedBlockId(null);
    setExecution(null);
    setActivePresetId("custom");
  }

  function copyCodeToClipboard() {
    navigator.clipboard.writeText(generated.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  function downloadPythonScript() {
    const element = document.createElement("a");
    const file = new Blob([generated.code], { type: "text/plain" });
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
      {/* ---------------- TOP BAR & WORKSHOP HEADER ---------------- */}
      <header className="top-bar">
        <div className="title-area">
          <div className="header-badge-row">
            <span className="eyebrow">Interactive Workshop</span>
            <span className={backendConnected ? "status-tag connected" : "status-tag offline"}>
              <span className="status-dot" />
              {backendConnected ? "Python Backend Live" : "Backend Offline (Port 8000)"}
            </span>
          </div>
          <h1>Visual Data Analysis & Machine Learning</h1>
          <p className="subtitle">
            Drag & drop blocks to build pipelines with Pandas, NumPy, Matplotlib & Scikit-Learn.
          </p>
        </div>

        <div className="top-actions">
          <button
            className="run-button"
            type="button"
            disabled={isExecuting || safeBlocks.length === 0}
            onClick={runPipeline}
          >
            {isExecuting ? (
              <>
                <RefreshCw size={18} className="spin-icon" />
                Executing Pipeline...
              </>
            ) : (
              <>
                <Play size={18} fill="currentColor" />
                Run Interactive Analysis
              </>
            )}
          </button>
        </div>
      </header>

      {/* ---------------- PRESET USE CASES SELECTOR ---------------- */}
      <section className="preset-selector-bar" aria-label="Workshop Example Templates">
        <div className="preset-header">
          <div className="preset-title-group">
            <Sparkles size={16} className="sparkle-icon" />
            <strong>Interactive Use Cases:</strong>
          </div>
          <span className="preset-hint">Click an example to load a full end-to-end workshop project</span>
        </div>

        <div className="preset-pills">
          {safePresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={activePresetId === preset.id ? "preset-pill active" : "preset-pill"}
              onClick={() => loadPreset(preset.id)}
            >
              <span className="preset-icon-badge">
                {preset.id.includes("sales") && <TrendingUp size={14} />}
                {preset.id.includes("churn") && <BrainCircuit size={14} />}
                {preset.id.includes("housing") && <BarChart3 size={14} />}
                {preset.id.includes("segment") && <Layers size={14} />}
              </span>
              <span className="preset-pill-title">{preset.title}</span>
              <span className="preset-diff-badge">{preset.difficulty}</span>
            </button>
          ))}
          <button
            type="button"
            className="preset-pill clear-pill"
            onClick={clearAll}
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

      {/* ---------------- 3-PANEL WORKSPACE ---------------- */}
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
              placeholder="Search blocks (e.g. regression, plot)..."
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
              const Icon = categoryIcon[module.category];
              const theme = categoryTheme[module.category];
              return (
                <button
                  key={module.id}
                  className="module-card"
                  draggable
                  onClick={() => addModule(module.id)}
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
            if (moduleId) addModule(moduleId);
          }}
        >
          <div className="panel-header">
            <div>
              <h2>Project Pipeline</h2>
              <small>Ordered execution flow</small>
            </div>
            <span className="count-badge">{blocks.length} steps</span>
          </div>

          {blocks.length === 0 ? (
            <div className="empty-canvas">
              <Workflow size={42} className="empty-icon" />
              <h3>Your Pipeline is Empty</h3>
              <p>Drag blocks from the catalog or click an example use case above to get started.</p>
              <button
                className="starter-btn"
                type="button"
                onClick={() => loadPreset("sales-roi-regression")}
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
                const Icon = categoryIcon[module.category];
                const theme = categoryTheme[module.category];
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
                      onDrop={() => moveBlock(block.id)}
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
                          onClick={() => shiftBlock(block.id, "up")}
                          title="Move step up"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          className="shift-btn"
                          type="button"
                          disabled={index === blocks.length - 1}
                          onClick={() => shiftBlock(block.id, "down")}
                          title="Move step down"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          className="icon-button delete"
                          type="button"
                          aria-label={`Remove ${module.title}`}
                          onClick={() => removeBlock(block.id)}
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

        {/* 3. INSPECTOR / SETTINGS PANEL */}
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
                        onChange={(e) => updateSetting(option.key, e.target.value)}
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
                        onChange={(event) => updateSetting(option.key, event.target.value)}
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

      {/* ---------------- DUAL OUTPUT: VISUAL RESULTS & PYTHON CODE ---------------- */}
      <section className="output-dashboard">
        <div className="output-tabs-header">
          <div className="tab-buttons">
            <button
              type="button"
              className={activeTab === "results" ? "tab-btn active" : "tab-btn"}
              onClick={() => setActiveTab("results")}
            >
              <BarChart3 size={16} />
              <span>Interactive Results & Charts</span>
              {execution?.results && (
                <span className="tab-badge">{execution.results.length} outputs</span>
              )}
            </button>
            <button
              type="button"
              className={activeTab === "code" ? "tab-btn active" : "tab-btn"}
              onClick={() => setActiveTab("code")}
            >
              <Code2 size={16} />
              <span>Generated Python Code</span>
              <span className="tab-badge">{generated.imports.length} imports</span>
            </button>
          </div>

          <div className="tab-actions">
            {activeTab === "code" && (
              <>
                <button className="secondary-action-btn" type="button" onClick={copyCodeToClipboard}>
                  {copiedCode ? <Check size={15} /> : <Copy size={15} />}
                  <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
                </button>
                <button className="secondary-action-btn" type="button" onClick={downloadPythonScript}>
                  <Download size={15} />
                  <span>Download .py</span>
                </button>
              </>
            )}
            {activeTab === "results" && (
              <button
                className="secondary-action-btn"
                type="button"
                onClick={runPipeline}
                disabled={isExecuting}
              >
                <RefreshCw size={14} className={isExecuting ? "spin-icon" : ""} />
                <span>Re-run Analysis</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: VISUAL RESULTS & METRICS */}
        {activeTab === "results" && (
          <div className="results-tab-content">
            {execution ? (
              <>
                {/* Summary Banner */}
                <div className={execution.success ? "results-banner success" : "results-banner error"}>
                  <div className="banner-icon">
                    {execution.success ? (
                      <CheckCircle2 size={22} className="success-icon" />
                    ) : (
                      <AlertCircle size={22} className="error-icon" />
                    )}
                  </div>
                  <div className="banner-copy">
                    <div className="banner-title-row">
                      <strong>
                        {execution.success ? "Pipeline Executed Successfully" : "Execution Notice"}
                      </strong>
                      <span className="exec-time">
                        <Activity size={14} />
                        {execution.execution_time_ms}ms runtime
                      </span>
                    </div>
                    <p>{execution.summary_insight || execution.error}</p>
                  </div>
                </div>

                {/* Step Cards Grid */}
                <div className="results-grid">
                  {execution.results.map((result, idx) => {
                    const theme = categoryTheme[result.category];
                    const Icon = categoryIcon[result.category];

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
                          <span
                            className={result.success ? "status-chip success" : "status-chip error"}
                          >
                            {result.success ? "Success" : "Failed"}
                          </span>
                        </div>

                        <p className="result-summary">{result.summary}</p>

                        {/* Error box */}
                        {result.error && (
                          <div className="error-callout">
                            <AlertCircle size={15} />
                            <span>{result.error}</span>
                          </div>
                        )}

                        {/* Chart Image Output (Matplotlib / Sklearn) */}
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

                        {/* KPI Metrics Badges */}
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

                        {/* Data Preview Table */}
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

                        {/* Step Execution Logs */}
                        {result.logs && result.logs.length > 0 && (
                          <div className="logs-drawer">
                            <button
                              type="button"
                              className="logs-toggle"
                              onClick={() =>
                                setExpandedLogId(
                                  expandedLogId === result.block_id ? null : result.block_id,
                                )
                              }
                            >
                              <FileCode2 size={13} />
                              <span>Console Logs ({result.logs.length} lines)</span>
                              <ChevronRight
                                size={14}
                                className={
                                  expandedLogId === result.block_id ? "rotate-90" : ""
                                }
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

        {/* TAB 2: GENERATED PYTHON CODE */}
        {activeTab === "code" && (
          <div className="code-tab-content">
            {generated.notes.length > 0 && (
              <div className="workshop-notes-banner">
                <div className="notes-header">
                  <BookOpen size={16} />
                  <strong>Workshop Pedagogical Notes & Best Practices:</strong>
                </div>
                <ul>
                  {generated.notes.map((note, i) => (
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
                  {generated.imports.map((imp) => (
                    <span key={imp} className="import-chip">
                      {imp}
                    </span>
                  ))}
                </div>
              </div>
              <pre className="code-body">
                <code>{generated.code || "# Add modules to generate code.\n"}</code>
              </pre>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
