from app.models import (
    CodeToVisualMapping,
    GuidedMission,
    GuidedStep,
    ModuleDefinition,
    ModuleOption,
    ModuleOptionChoice,
    PresetUseCase,
    ProjectBlock,
    WorkshopStep,
)


MODULES: list[ModuleDefinition] = [
    # ------------------- PANDAS / DATA -------------------
    ModuleDefinition(
        id="pandas-load-csv",
        title="Load Dataset",
        package="Pandas",
        category="data",
        description="Load tabular data from a CSV file into a pandas DataFrame.",
        learner_goal="Start your workflow by ingesting rows and columns into Python memory.",
        badge="Foundation",
        options=[
            ModuleOption(
                key="file_name",
                label="Dataset Source",
                default="sales_marketing.csv",
                help_text="Choose a workshop sample dataset or enter a CSV filename.",
                type="select",
                choices=[
                    ModuleOptionChoice(value="sales_marketing.csv", label="📈 Sales & Marketing Spend (Regression / EDA)"),
                    ModuleOptionChoice(value="customer_churn.csv", label="🎯 Customer Churn & Retention (Classification)"),
                    ModuleOptionChoice(value="housing_prices.csv", label="🏡 Real Estate & Housing Prices (Regression / Multi-feature)"),
                    ModuleOptionChoice(value="sales.csv", label="📊 Basic Sales Records"),
                ],
            ),
            ModuleOption(
                key="preview_rows",
                label="Preview Rows",
                default=5,
                help_text="Number of initial rows to display in the data table.",
                type="number",
            ),
        ],
    ),
    ModuleDefinition(
        id="pandas-clean",
        title="Clean Missing Values",
        package="Pandas",
        category="data",
        description="Handle missing or incomplete rows to prevent model errors.",
        learner_goal="Clean data before statistical analysis and model fitting.",
        badge="Data Prep",
        options=[
            ModuleOption(
                key="strategy",
                label="Handling Strategy",
                default="drop_rows",
                help_text="Choose how to resolve rows containing null or NaN values.",
                type="select",
                choices=[
                    ModuleOptionChoice(value="drop_rows", label="Drop rows with any missing values"),
                    ModuleOptionChoice(value="fill_mean", label="Impute missing numeric values with column Mean"),
                    ModuleOptionChoice(value="fill_median", label="Impute missing numeric values with column Median"),
                ],
            )
        ],
    ),
    ModuleDefinition(
        id="pandas-filter",
        title="Filter & Slice Rows",
        package="Pandas",
        category="data",
        description="Filter DataFrame records matching specific threshold conditions.",
        learner_goal="Isolate subsets of data (e.g. high-value transactions or active users).",
        badge="Data Prep",
        options=[
            ModuleOption(
                key="column",
                label="Filter Column",
                default="sales",
                help_text="Column name to evaluate for row filtering.",
                type="text",
            ),
            ModuleOption(
                key="operator",
                label="Condition",
                default=">",
                help_text="Comparison operator to test against threshold.",
                type="select",
                choices=[
                    ModuleOptionChoice(value=">", label="Greater than (>)"),
                    ModuleOptionChoice(value=">=", label="Greater than or equal (>=)"),
                    ModuleOptionChoice(value="<", label="Less than (<)"),
                    ModuleOptionChoice(value="<=", label="Less than or equal (<=)"),
                    ModuleOptionChoice(value="==", label="Equals (==)"),
                    ModuleOptionChoice(value="!=", label="Not equals (!=)"),
                ],
            ),
            ModuleOption(
                key="threshold",
                label="Threshold Value",
                default="50000",
                help_text="Value to compare against in the condition.",
                type="text",
            ),
        ],
    ),
    ModuleDefinition(
        id="pandas-groupby",
        title="Group By & Aggregate",
        package="Pandas",
        category="data",
        description="Group rows by a categorical column and compute aggregate metrics.",
        learner_goal="Understand categorical summaries and pivot data for plotting.",
        badge="Aggregation",
        options=[
            ModuleOption(
                key="group_column",
                label="Group By Column",
                default="region",
                help_text="Categorical column to group records by.",
                type="text",
            ),
            ModuleOption(
                key="agg_column",
                label="Target Numeric Column",
                default="sales",
                help_text="Numeric column to compute aggregation on.",
                type="text",
            ),
            ModuleOption(
                key="agg_func",
                label="Aggregation Function",
                default="mean",
                help_text="Statistical operation to apply to each group.",
                type="select",
                choices=[
                    ModuleOptionChoice(value="mean", label="Average / Mean"),
                    ModuleOptionChoice(value="sum", label="Total Sum"),
                    ModuleOptionChoice(value="count", label="Row Count"),
                    ModuleOptionChoice(value="median", label="Median"),
                    ModuleOptionChoice(value="max", label="Maximum"),
                    ModuleOptionChoice(value="min", label="Minimum"),
                ],
            ),
        ],
    ),

    # ------------------- NUMPY / SCIENCE -------------------
    ModuleDefinition(
        id="numpy-summary",
        title="Numeric Summary & Stats",
        package="NumPy",
        category="science",
        description="Compute descriptive summary statistics (mean, median, std, percentiles) via NumPy arrays.",
        learner_goal="Learn foundational statistics and understand data dispersion.",
        badge="Statistics",
        options=[
            ModuleOption(
                key="column",
                label="Numeric Column",
                default="sales",
                help_text="The numeric column to compute statistics for.",
                type="text",
            ),
        ],
    ),
    ModuleDefinition(
        id="numpy-transform",
        title="Feature Transform & Scale",
        package="NumPy",
        category="science",
        description="Transform numeric arrays using log transform, z-score normalization, or min-max scaling.",
        learner_goal="Prepare features for machine learning models that expect standardized inputs.",
        badge="Transformation",
        options=[
            ModuleOption(
                key="column",
                label="Source Column",
                default="marketing_spend",
                help_text="Column to transform.",
                type="text",
            ),
            ModuleOption(
                key="transform_type",
                label="Transformation Type",
                default="z_score",
                help_text="Mathematical transformation method.",
                type="select",
                choices=[
                    ModuleOptionChoice(value="z_score", label="Z-Score Standardization (mean=0, std=1)"),
                    ModuleOptionChoice(value="log", label="Logarithmic Transform (np.log1p)"),
                    ModuleOptionChoice(value="min_max", label="Min-Max Scaling (0.0 to 1.0)"),
                ],
            ),
        ],
    ),

    # ------------------- MATPLOTLIB / VISUALIZATION -------------------
    ModuleDefinition(
        id="matplotlib-scatter-plot",
        title="Scatter Plot & Trendline",
        package="Matplotlib",
        category="visualization",
        description="Plot two continuous variables with an optional linear regression fit line.",
        learner_goal="Visually identify correlation, outliers, and linear trends between variables.",
        badge="Visual Discovery",
        options=[
            ModuleOption(
                key="x_column",
                label="X-Axis (Feature)",
                default="marketing_spend",
                help_text="Independent variable on horizontal axis.",
                type="text",
            ),
            ModuleOption(
                key="y_column",
                label="Y-Axis (Target / Outcome)",
                default="sales",
                help_text="Dependent variable on vertical axis.",
                type="text",
            ),
            ModuleOption(
                key="title",
                label="Chart Title",
                default="Marketing Spend vs. Sales Revenue",
                help_text="Main heading for the plot.",
                type="text",
            ),
            ModuleOption(
                key="show_trendline",
                label="Show Regression Trendline",
                default="yes",
                help_text="Draw a fitted best-fit line through the scatter points.",
                type="select",
                choices=[
                    ModuleOptionChoice(value="yes", label="Yes - Show Best Fit Trendline"),
                    ModuleOptionChoice(value="no", label="No - Points Only"),
                ],
            ),
        ],
    ),
    ModuleDefinition(
        id="matplotlib-bar-chart",
        title="Bar Chart",
        package="Matplotlib",
        category="visualization",
        description="Compare aggregate values across categories with styled bar charts.",
        learner_goal="Communicate categorical differences effectively to stakeholders.",
        badge="Visual Discovery",
        options=[
            ModuleOption(
                key="category_column",
                label="Category Column (X)",
                default="region",
                help_text="The category labels for the bars.",
                type="text",
            ),
            ModuleOption(
                key="value_column",
                label="Metric Column (Y)",
                default="sales",
                help_text="The values to measure and compare.",
                type="text",
            ),
            ModuleOption(
                key="title",
                label="Chart Title",
                default="Total Sales by Region",
                help_text="Title shown at top of the chart.",
                type="text",
            ),
        ],
    ),
    ModuleDefinition(
        id="matplotlib-histogram",
        title="Histogram & Distribution",
        package="Matplotlib",
        category="visualization",
        description="Visualize frequency distribution and skewness of a numeric feature.",
        learner_goal="Check data normality, skew, and spread before applying ML models.",
        badge="Visual Discovery",
        options=[
            ModuleOption(
                key="column",
                label="Numeric Column",
                default="sales",
                help_text="Column to plot distribution for.",
                type="text",
            ),
            ModuleOption(
                key="bins",
                label="Number of Bins",
                default=10,
                help_text="Number of histogram intervals.",
                type="number",
            ),
            ModuleOption(
                key="title",
                label="Chart Title",
                default="Distribution of Sales",
                help_text="Chart title.",
                type="text",
            ),
        ],
    ),
    ModuleDefinition(
        id="matplotlib-line-chart",
        title="Line Trend Chart",
        package="Matplotlib",
        category="visualization",
        description="Plot sequential data or index progression with connected lines and markers.",
        learner_goal="Observe changes, trends, or trajectory across ordered observations.",
        badge="Visual Discovery",
        options=[
            ModuleOption(
                key="x_column",
                label="X-Axis Column",
                default="store_footfall",
                help_text="Order or horizontal metric.",
                type="text",
            ),
            ModuleOption(
                key="y_column",
                label="Y-Axis Column",
                default="sales",
                help_text="Metric to plot along vertical axis.",
                type="text",
            ),
            ModuleOption(
                key="title",
                label="Chart Title",
                default="Sales Trend Across Footfall",
                help_text="Chart title.",
                type="text",
            ),
        ],
    ),
    ModuleDefinition(
        id="matplotlib-correlation-heatmap",
        title="Correlation Heatmap",
        package="Matplotlib",
        category="visualization",
        description="Compute correlation coefficients between all numeric columns and display a color-coded matrix.",
        learner_goal="Identify strong positive/negative relationships and select predictive features.",
        badge="Feature Analysis",
        options=[
            ModuleOption(
                key="title",
                label="Heatmap Title",
                default="Feature Correlation Matrix",
                help_text="Title for the correlation matrix plot.",
                type="text",
            ),
        ],
    ),
    ModuleDefinition(
        id="matplotlib-box-plot",
        title="Box & Whisker Distribution Plot",
        package="Matplotlib",
        category="visualization",
        description="Visualize median, interquartile range (IQR), whiskers, and potential outliers for numeric features.",
        learner_goal="Detect outliers and examine multi-group distributional spreads.",
        badge="Distribution",
        options=[
            ModuleOption(
                key="value_column",
                label="Numeric Column (Y)",
                default="sales",
                help_text="Continuous feature to evaluate.",
                type="text",
            ),
            ModuleOption(
                key="group_column",
                label="Grouping Category (Optional)",
                default="region",
                help_text="Optional category column to split boxes across.",
                type="text",
            ),
            ModuleOption(
                key="title",
                label="Chart Title",
                default="Sales Distribution & Outlier Box Plot",
                help_text="Chart title.",
                type="text",
            ),
        ],
    ),
    ModuleDefinition(
        id="matplotlib-residuals-plot",
        title="Regression Residuals Diagnostics",
        package="Matplotlib",
        category="visualization",
        description="Plot regression prediction residuals (errors) against fitted values to diagnose heteroscedasticity.",
        learner_goal="Validate linear regression assumptions: unbiased errors centered at zero without funnel patterns.",
        badge="ML Diagnostics",
        options=[
            ModuleOption(
                key="feature_column",
                label="Feature Column (X)",
                default="marketing_spend",
                help_text="Independent predictor variable.",
                type="text",
            ),
            ModuleOption(
                key="target_column",
                label="Target Column (y)",
                default="sales",
                help_text="Actual target variable.",
                type="text",
            ),
            ModuleOption(
                key="title",
                label="Chart Title",
                default="Residuals Diagnostics (Error vs Predicted)",
                help_text="Chart title.",
                type="text",
            ),
        ],
    ),
    ModuleDefinition(
        id="matplotlib-subplots-grid",
        title="2x2 Subplots Executive Dashboard",
        package="Matplotlib",
        category="visualization",
        description="Assemble a 4-panel executive analytics dashboard (Histogram, Scatter, Regional Bars, and Footfall).",
        learner_goal="Combine multiple visual perspectives into a unified stakeholder dashboard using plt.subplots(2, 2).",
        badge="Dashboard Grid",
        options=[
            ModuleOption(
                key="title",
                label="Dashboard Master Title",
                default="Executive Performance & Marketing ROI Dashboard",
                help_text="Super-title spanning the entire dashboard.",
                type="text",
            ),
        ],
    ),

    # ------------------- SCIKIT-LEARN / MACHINE LEARNING -------------------
    ModuleDefinition(
        id="sklearn-scaler",
        title="StandardScaler Preprocessor",
        package="Scikit-learn",
        category="machine-learning",
        description="Standardize features by removing the mean and scaling to unit variance (z-score normalization).",
        learner_goal="Normalize numeric features so gradient-based and distance-based algorithms train optimally.",
        badge="ML Preprocessing",
        options=[
            ModuleOption(
                key="feature_columns",
                label="Features to Scale (comma-separated)",
                default="marketing_spend, store_footfall",
                help_text="Numeric feature columns to scale.",
                type="text",
            ),
        ],
    ),
    ModuleDefinition(
        id="sklearn-regression",
        title="Linear Regression Model",
        package="Scikit-learn",
        category="machine-learning",
        description="Train a supervised Linear Regression model, perform train/test split, and evaluate R² and MSE.",
        learner_goal="Learn predictive modeling, feature-to-target mapping, and evaluation metrics.",
        badge="Predictive ML",
        options=[
            ModuleOption(
                key="feature_column",
                label="Feature Column (X)",
                default="marketing_spend",
                help_text="Input variable used to make predictions.",
                type="text",
            ),
            ModuleOption(
                key="target_column",
                label="Target Column (y)",
                default="sales",
                help_text="Continuous outcome variable to predict.",
                type="text",
            ),
            ModuleOption(
                key="test_size",
                label="Test Split Ratio (0.1 - 0.5)",
                default=0.2,
                help_text="Fraction of data reserved for testing model accuracy.",
                type="number",
            ),
        ],
    ),
    ModuleDefinition(
        id="sklearn-random-forest-regressor",
        title="Random Forest Regressor",
        package="Scikit-learn",
        category="machine-learning",
        description="Train an ensemble of decision trees for robust non-linear regression with feature importance ranking.",
        learner_goal="Harness ensemble learning to capture non-linear interactions without overfitting.",
        badge="Ensemble ML",
        options=[
            ModuleOption(
                key="feature_columns",
                label="Feature Columns (comma-separated)",
                default="marketing_spend, store_footfall",
                help_text="Numeric features for multi-variable regression.",
                type="text",
            ),
            ModuleOption(
                key="target_column",
                label="Target Column (y)",
                default="sales",
                help_text="Continuous variable to predict.",
                type="text",
            ),
            ModuleOption(
                key="n_estimators",
                label="Number of Trees (n_estimators)",
                default=50,
                help_text="Number of trees in the forest ensemble.",
                type="number",
            ),
            ModuleOption(
                key="max_depth",
                label="Max Tree Depth",
                default=4,
                help_text="Maximum tree depth for pruning.",
                type="number",
            ),
        ],
    ),
    ModuleDefinition(
        id="sklearn-classification",
        title="Decision Tree Classifier",
        package="Scikit-learn",
        category="machine-learning",
        description="Train a Decision Tree Classifier to predict categorical outcomes and visualize the Confusion Matrix.",
        learner_goal="Understand classification, decision rules, accuracy, precision, and confusion matrices.",
        badge="Classification ML",
        options=[
            ModuleOption(
                key="feature_columns",
                label="Feature Columns (comma-separated)",
                default="tenure_months, monthly_charges, support_tickets",
                help_text="Numeric input features for classification.",
                type="text",
            ),
            ModuleOption(
                key="target_column",
                label="Target Class Column (y)",
                default="churned",
                help_text="Binary or multi-class label column to predict.",
                type="text",
            ),
            ModuleOption(
                key="max_depth",
                label="Tree Max Depth",
                default=3,
                help_text="Maximum depth of the decision tree to prevent overfitting.",
                type="number",
            ),
        ],
    ),
    ModuleDefinition(
        id="sklearn-random-forest-classifier",
        title="Random Forest Classifier",
        package="Scikit-learn",
        category="machine-learning",
        description="Train an ensemble of randomized decision trees for robust classification and feature importance.",
        learner_goal="Improve classification accuracy and stability via bagging ensemble aggregation.",
        badge="Ensemble ML",
        options=[
            ModuleOption(
                key="feature_columns",
                label="Feature Columns (comma-separated)",
                default="tenure_months, monthly_charges, support_tickets",
                help_text="Features to feed into the forest.",
                type="text",
            ),
            ModuleOption(
                key="target_column",
                label="Target Class Column (y)",
                default="churned",
                help_text="Target category label to classify.",
                type="text",
            ),
            ModuleOption(
                key="n_estimators",
                label="Number of Trees (n_estimators)",
                default=50,
                help_text="Number of trees in ensemble.",
                type="number",
            ),
            ModuleOption(
                key="max_depth",
                label="Max Tree Depth",
                default=4,
                help_text="Maximum depth of each decision tree.",
                type="number",
            ),
        ],
    ),
    ModuleDefinition(
        id="sklearn-logistic-regression",
        title="Logistic Regression Classifier",
        package="Scikit-learn",
        category="machine-learning",
        description="Fit a linear classification model predicting event probabilities with sigmoid transformation.",
        learner_goal="Master probabilistic binary classification and interpret odds ratios.",
        badge="Classification ML",
        options=[
            ModuleOption(
                key="feature_columns",
                label="Feature Columns (comma-separated)",
                default="tenure_months, monthly_charges, support_tickets",
                help_text="Input numeric features.",
                type="text",
            ),
            ModuleOption(
                key="target_column",
                label="Target Class Column (y)",
                default="churned",
                help_text="Binary category label (e.g. Yes/No).",
                type="text",
            ),
            ModuleOption(
                key="c_param",
                label="Inverse Regularization (C)",
                default=1.0,
                help_text="Regularization strength (smaller values mean stronger regularization).",
                type="number",
            ),
        ],
    ),
    ModuleDefinition(
        id="sklearn-clustering",
        title="K-Means Clustering",
        package="Scikit-learn",
        category="machine-learning",
        description="Group unlabeled data into K distinct clusters using Euclidean distance and centroid discovery.",
        learner_goal="Explore unsupervised learning, customer segmentation, and cluster centroids.",
        badge="Unsupervised ML",
        options=[
            ModuleOption(
                key="feature_x",
                label="First Feature (X)",
                default="marketing_spend",
                help_text="First dimension for clustering.",
                type="text",
            ),
            ModuleOption(
                key="feature_y",
                label="Second Feature (Y)",
                default="store_footfall",
                help_text="Second dimension for clustering.",
                type="text",
            ),
            ModuleOption(
                key="n_clusters",
                label="Number of Clusters (K)",
                default=3,
                help_text="How many distinct groups to segment data into.",
                type="number",
            ),
        ],
    ),
    ModuleDefinition(
        id="sklearn-pca",
        title="PCA Dimensionality Reduction",
        package="Scikit-learn",
        category="machine-learning",
        description="Decompose multi-dimensional data into 2 Principal Components while maximizing preserved variance.",
        learner_goal="Compress high-dimensional datasets into 2D visualizations via orthogonal projection.",
        badge="Dimensionality ML",
        options=[
            ModuleOption(
                key="feature_columns",
                label="Feature Columns (comma-separated)",
                default="marketing_spend, store_footfall, satisfaction_score, sales",
                help_text="Numeric feature columns to project into 2D.",
                type="text",
            ),
            ModuleOption(
                key="color_by",
                label="Color Points By (Category/Column)",
                default="region",
                help_text="Optional column for point color grouping.",
                type="text",
            ),
        ],
    ),
]


MODULE_BY_ID = {module.id: module for module in MODULES}


PRESET_USE_CASES: list[PresetUseCase] = [
    PresetUseCase(
        id="sales-roi-regression",
        title="Sales & Marketing ROI Predictor",
        subtitle="Predict revenue from advertising spend with Linear Regression & Matplotlib",
        description="Explore how marketing spend and footfall drive revenue. Clean the data, compute summary statistics, plot the scatter correlation with a trendline, train a Scikit-Learn Linear Regression model, and visualize regional totals.",
        category="Regression & ROI Analysis",
        icon="TrendingUp",
        difficulty="Beginner",
        key_takeaway="Understand feature vs target relationships, R² goodness-of-fit, and interpreting regression slopes.",
        blocks=[
            ProjectBlock(
                id="block-sales-1",
                module_id="pandas-load-csv",
                settings={"file_name": "sales_marketing.csv", "preview_rows": 5},
            ),
            ProjectBlock(
                id="block-sales-2",
                module_id="pandas-clean",
                settings={"strategy": "drop_rows"},
            ),
            ProjectBlock(
                id="block-sales-3",
                module_id="numpy-summary",
                settings={"column": "sales"},
            ),
            ProjectBlock(
                id="block-sales-4",
                module_id="matplotlib-scatter-plot",
                settings={
                    "x_column": "marketing_spend",
                    "y_column": "sales",
                    "title": "Marketing Spend vs. Sales Revenue (With Trendline)",
                    "show_trendline": "yes",
                },
            ),
            ProjectBlock(
                id="block-sales-5",
                module_id="sklearn-regression",
                settings={
                    "feature_column": "marketing_spend",
                    "target_column": "sales",
                    "test_size": 0.2,
                },
            ),
            ProjectBlock(
                id="block-sales-6",
                module_id="matplotlib-bar-chart",
                settings={
                    "category_column": "region",
                    "value_column": "sales",
                    "title": "Total Revenue by Region",
                },
            ),
        ],
    ),
    PresetUseCase(
        id="customer-churn-classification",
        title="Customer Churn & Risk Classifier",
        subtitle="Classify customer retention using Scikit-Learn Decision Trees & Confusion Matrix",
        description="Analyze subscription data to detect churn risk factors. Group monthly charges by contract type, train a Decision Tree Classifier on tenure and support tickets, and evaluate the Confusion Matrix.",
        category="Classification & Retention",
        icon="BrainCircuit",
        difficulty="Intermediate",
        key_takeaway="Master classification metrics (Accuracy, Precision, Recall) and error analysis using Confusion Matrices.",
        blocks=[
            ProjectBlock(
                id="block-churn-1",
                module_id="pandas-load-csv",
                settings={"file_name": "customer_churn.csv", "preview_rows": 5},
            ),
            ProjectBlock(
                id="block-churn-2",
                module_id="pandas-groupby",
                settings={
                    "group_column": "contract_type",
                    "agg_column": "monthly_charges",
                    "agg_func": "mean",
                },
            ),
            ProjectBlock(
                id="block-churn-3",
                module_id="matplotlib-bar-chart",
                settings={
                    "category_column": "contract_type",
                    "value_column": "monthly_charges",
                    "title": "Average Monthly Charges by Contract Type",
                },
            ),
            ProjectBlock(
                id="block-churn-4",
                module_id="matplotlib-histogram",
                settings={
                    "column": "tenure_months",
                    "bins": 8,
                    "title": "Distribution of Customer Tenure (Months)",
                },
            ),
            ProjectBlock(
                id="block-churn-5",
                module_id="sklearn-classification",
                settings={
                    "feature_columns": "tenure_months, monthly_charges, support_tickets",
                    "target_column": "churned",
                    "max_depth": 3,
                },
            ),
        ],
    ),
    PresetUseCase(
        id="housing-price-eda",
        title="Housing Price Valuation & Heatmap",
        subtitle="Exploratory data analysis & multi-variable correlation for real estate",
        description="Inspect housing features, compute statistical dispersion, generate a comprehensive correlation heatmap across square footage and ratings, and train a regression model to estimate market prices.",
        category="EDA & Valuation",
        icon="Building",
        difficulty="Intermediate",
        key_takeaway="Use correlation heatmaps to select the strongest predictors before feeding features to a regression model.",
        blocks=[
            ProjectBlock(
                id="block-house-1",
                module_id="pandas-load-csv",
                settings={"file_name": "housing_prices.csv", "preview_rows": 5},
            ),
            ProjectBlock(
                id="block-house-2",
                module_id="numpy-summary",
                settings={"column": "price"},
            ),
            ProjectBlock(
                id="block-house-3",
                module_id="matplotlib-correlation-heatmap",
                settings={"title": "Housing Features Correlation Matrix"},
            ),
            ProjectBlock(
                id="block-house-4",
                module_id="matplotlib-scatter-plot",
                settings={
                    "x_column": "square_feet",
                    "y_column": "price",
                    "title": "Living Area (Sq Ft) vs. Sale Price",
                    "show_trendline": "yes",
                },
            ),
            ProjectBlock(
                id="block-house-5",
                module_id="sklearn-regression",
                settings={
                    "feature_column": "square_feet",
                    "target_column": "price",
                    "test_size": 0.2,
                },
            ),
        ],
    ),
    PresetUseCase(
        id="customer-segmentation-clustering",
        title="Customer Segmentation via K-Means",
        subtitle="Unsupervised customer clustering and centroid visualization",
        description="Group retail customers into distinct behavioural clusters based on marketing spend and store footfall. Visualize discovered cluster centroids using 2D scatter plots.",
        category="Unsupervised Clustering",
        icon="Users",
        difficulty="Advanced",
        key_takeaway="Learn how unsupervised clustering discovers hidden customer segments without labeled target answers.",
        blocks=[
            ProjectBlock(
                id="block-cluster-1",
                module_id="pandas-load-csv",
                settings={"file_name": "sales_marketing.csv", "preview_rows": 5},
            ),
            ProjectBlock(
                id="block-cluster-2",
                module_id="numpy-summary",
                settings={"column": "store_footfall"},
            ),
            ProjectBlock(
                id="block-cluster-3",
                module_id="sklearn-clustering",
                settings={
                    "feature_x": "marketing_spend",
                    "feature_y": "store_footfall",
                    "n_clusters": 3,
                },
            ),
            ProjectBlock(
                id="block-cluster-4",
                module_id="matplotlib-bar-chart",
                settings={
                    "category_column": "region",
                    "value_column": "marketing_spend",
                    "title": "Marketing Budget by Region",
                },
            ),
        ],
    ),
]


MATPLOTLIB_WORKSHOP_STEPS: list[WorkshopStep] = [
    WorkshopStep(
        id="step-1-ingest-inspect",
        stage=1,
        title="1. Data Ingestion, Schema Profiling & Health Inspection",
        subtitle="Lay the foundation of an efficient data analysis pipeline",
        objective="Load raw tabular data, verify row/column dimensions, inspect data types, check for missing values, and compute 5-number descriptive statistics before any plotting.",
        dataset_name="sales_marketing.csv",
        concept_summary="Efficient data analysis always starts with understanding data types and summary distributions. Plotting without inspecting data boundaries (min, max, IQR) leads to distorted axes, unhandled NaN exceptions, and misleading conclusions.",
        starter_code="""import pandas as pd
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
""",
        solution_code="""import pandas as pd
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
""",
        code_mappings=[
            CodeToVisualMapping(
                code_snippet="df = pd.read_csv('sales_marketing.csv')",
                visual_element="In-Memory 2D Tabular DataFrame",
                explanation="Loads CSV records into memory with automatic column header detection and dtype inference.",
            ),
            CodeToVisualMapping(
                code_snippet="df.dtypes",
                visual_element="Column Type Profiling",
                explanation="Identifies which columns are continuous numbers (float64, int64) vs categorical groups (object).",
            ),
            CodeToVisualMapping(
                code_snippet="df.isnull().sum()",
                visual_element="Data Quality Audit",
                explanation="Audits null/NaN values that must be dropped or imputed before feeding into visual axes or models.",
            ),
            CodeToVisualMapping(
                code_snippet="df.describe().round(2)",
                visual_element="Descriptive Statistics Scorecard",
                explanation="Calculates Mean, Median (50%), Std Dev, Min/Max, and IQR (75%-25%) to define plotting limits.",
            ),
        ],
        key_takeaways=[
            "Never create visualizations before inspecting minimum, maximum, and median data bounds.",
            "Verify that numeric columns are correctly parsed as int/float and categorical columns as object/category.",
            "Always check for missing null values that could break Matplotlib rendering loops.",
        ],
        pro_tips=[
            "Use `df.info(memory_usage='deep')` in production to monitor DataFrame RAM consumption.",
            "Use `df['col'].value_counts()` on categorical fields to inspect category balance.",
        ],
    ),
    WorkshopStep(
        id="step-2-univariate-distribution",
        stage=2,
        title="2. Univariate Distribution, Skewness & Central Tendency",
        subtitle="Master Matplotlib Histograms with Mean vs. Median reference lines",
        objective="Plot the frequency distribution of continuous features, configure bin intervals, and draw explicit Mean and Median lines to visually identify positive/negative skewness and outliers.",
        dataset_name="sales_marketing.csv",
        concept_summary="A frequency histogram reveals whether your data follows a normal bell curve, has multiple modal peaks, or is skewed by extreme outliers. Comparing the arithmetic Mean against the middle Median exposes distribution skewness immediately.",
        starter_code="""import matplotlib.pyplot as plt
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
ax.axvline(mean_val, color="#e11d48", linestyle="--", linewidth=2, label=f"Mean: ${mean_val:,.0f}")
ax.axvline(median_val, color="#2563eb", linestyle="-.", linewidth=2, label=f"Median: ${median_val:,.0f}")

# 5. Polish typography, axis labels & gridlines
ax.set_title("Distribution of Store Sales Revenue & Central Tendency", fontsize=13, fontweight="bold", pad=12)
ax.set_xlabel("Sales Revenue ($)", fontsize=11, fontweight="semibold")
ax.set_ylabel("Frequency (Store Count)", fontsize=11, fontweight="semibold")
ax.grid(axis="y", linestyle=":", alpha=0.6)
ax.legend(frameon=True, facecolor="white", edgecolor="#cbd5e1")

fig.tight_layout()
plt.show()

print(f"Mean Sales:   ${mean_val:,.2f}")
print(f"Median Sales: ${median_val:,.2f}")
skew_diff = (mean_val - median_val) / median_val * 100
print(f"Skewness Assessment: Mean is {abs(skew_diff):.1f}% {'higher' if skew_diff > 0 else 'lower'} than Median.")
""",
        solution_code="""import matplotlib.pyplot as plt
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
ax.axvline(mean_val, color="#e11d48", linestyle="--", linewidth=2.2, label=f"Mean: ${mean_val:,.0f}")
ax.axvline(median_val, color="#2563eb", linestyle="-.", linewidth=2.2, label=f"Median: ${median_val:,.0f}")

# 1-Std Dev Shaded Confidence Band
ax.axvspan(mean_val - std_val, mean_val + std_val, color="#0f766e", alpha=0.08, label=f"±1 Std Dev (${std_val:,.0f})")

ax.set_title("Distribution of Store Sales Revenue (With 1-Std Dev Range)", fontsize=13, fontweight="bold", pad=14)
ax.set_xlabel("Sales Revenue ($)", fontsize=11, fontweight="semibold")
ax.set_ylabel("Frequency Count", fontsize=11, fontweight="semibold")
ax.grid(axis="y", linestyle=":", alpha=0.6)
ax.legend(loc="upper right", frameon=True, facecolor="#f8fafc", edgecolor="#cbd5e1")
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)

fig.tight_layout()
plt.show()
""",
        code_mappings=[
            CodeToVisualMapping(
                code_snippet="fig, ax = plt.subplots(figsize=(8, 4.8), dpi=140)",
                visual_element="Matplotlib Figure & Axes Canvas",
                explanation="Initializes the 8x4.8 inch canvas with crisp high-resolution 140 DPI rendering.",
            ),
            CodeToVisualMapping(
                code_snippet="ax.hist(sales, bins=8, rwidth=0.88)",
                visual_element="Histogram Frequency Bars",
                explanation="Discretizes continuous numeric sales values into 8 interval bins with modern gap spacing.",
            ),
            CodeToVisualMapping(
                code_snippet="ax.axvline(mean_val, color='#e11d48', linestyle='--')",
                visual_element="Red Dashed Mean Reference Line",
                explanation="Draws a vertical line at the arithmetic mean across the entire height of the y-axis.",
            ),
            CodeToVisualMapping(
                code_snippet="ax.axvline(median_val, color='#2563eb', linestyle='-.')",
                visual_element="Blue Dash-Dot Median Line",
                explanation="Draws a vertical line at the 50th percentile to diagnose skewness relative to the mean.",
            ),
            CodeToVisualMapping(
                code_snippet="ax.grid(axis='y', linestyle=':', alpha=0.6)",
                visual_element="Horizontal Dotted Gridlines",
                explanation="Subtle y-axis guide lines for quick value reading without visual clutter on the x-axis.",
            ),
        ],
        key_takeaways=[
            "If Mean > Median, the distribution is right-skewed (pulled by high-value outliers).",
            "Setting `rwidth=0.85-0.90` creates cleaner, modern histogram bars compared to default touching bars.",
            "Always include units (e.g. $, counts, kg) in your axis labels for clear communication.",
        ],
        pro_tips=[
            "Use `ax.spines['top'].set_visible(False)` and `ax.spines['right'].set_visible(False)` to follow Edward Tufte's clean data-ink ratio.",
        ],
    ),
    WorkshopStep(
        id="step-3-categorical-comparisons",
        stage=3,
        title="3. Categorical Comparisons & Ranked Bar Charts with Direct Data Callouts",
        subtitle="Deliver crystal-clear group comparisons without axis eye fatigue",
        objective="Group data by category (e.g. region), compute aggregated sums and means, sort the values hierarchically, and render a styled bar chart with direct numerical callouts above each bar.",
        dataset_name="sales_marketing.csv",
        concept_summary="Unsorted bar charts force stakeholders to jump back and forth between bars and the y-axis. Ranking bars descending and adding direct value labels ($K) eliminates cognitive overhead and highlights the top performer immediately.",
        starter_code="""import matplotlib.pyplot as plt
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
        f"${height:,.1f}K",
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

print("Top Performing Region:", regional.index[0], f"(${regional['sum'].iloc[0]:,.0f})")
""",
        solution_code="""import matplotlib.pyplot as plt
import pandas as pd

df = pd.read_csv("sales_marketing.csv")

# Dual metric aggregation: Sum and Average
regional = df.groupby("region")["sales"].agg(["sum", "mean", "count"]).sort_values(by="sum", ascending=False)

fig, ax = plt.subplots(figsize=(8.5, 5), dpi=140)
colors = ["#0f766e", "#0284c7", "#6366f1", "#8b5cf6", "#f59e0b"]
bars = ax.bar(regional.index, regional["sum"] / 1000, color=colors[:len(regional)], width=0.52, edgecolor="#0f172a", linewidth=0.8)

# Annotate with both Total ($K) and Average ($K/store)
for bar, (reg_name, row) in zip(bars, regional.iterrows()):
    height = bar.get_height()
    avg_k = row["mean"] / 1000
    ax.annotate(
        f"${height:,.0f}K\\n(avg ${avg_k:.1f}K)",
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
""",
        code_mappings=[
            CodeToVisualMapping(
                code_snippet="df.groupby('region')['sales'].agg(...).sort_values(by='sum', ascending=False)",
                visual_element="Ranked Categorical Aggregation",
                explanation="Pivots raw records into grouped sums and sorts descending so the largest bar appears first.",
            ),
            CodeToVisualMapping(
                code_snippet="ax.bar(regional.index, regional['sum'] / 1000, width=0.55)",
                visual_element="Vertical Categorical Bars",
                explanation="Creates proportional bars scaled in thousands of dollars ($K) to simplify numerical reading.",
            ),
            CodeToVisualMapping(
                code_snippet="ax.annotate(f'${height:,.1f}K', xy=..., textcoords='offset points')",
                visual_element="Direct Numeric Top Callouts",
                explanation="Places formatted dollar values directly on top of each bar, removing the need to trace the y-axis.",
            ),
            CodeToVisualMapping(
                code_snippet="ax.set_ylim(0, max_val * 1.18)",
                visual_element="Top Padding Headroom",
                explanation="Expands upper y-limit by 18% so text annotations do not clip against the upper chart border.",
            ),
        ],
        key_takeaways=[
            "Always sort categorical bars unless there is an inherent natural order (like months or days).",
            "Direct data labeling above bars drastically improves audience comprehension speed.",
            "Scale large numbers (e.g. divide by 1,000 for '$K' or 1,000,000 for '$M') to prevent cluttered axis tick labels.",
        ],
        pro_tips=[
            "For categories with long names (>10 chars), use horizontal bar charts `ax.barh()` so labels read left-to-right naturally.",
        ],
    ),
    WorkshopStep(
        id="step-4-bivariate-scatter-trend",
        stage=4,
        title="4. Bivariate Correlation & Regression Best-Fit Line (Scatter + Polyfit)",
        subtitle="Uncover continuous feature relationships and model linear slopes",
        objective="Plot two continuous features using Matplotlib scatter points with alpha transparency, compute the Pearson correlation coefficient r, and overlay a NumPy least-squares regression trendline with formula callout.",
        dataset_name="sales_marketing.csv",
        concept_summary="Scatter plots are the primary tool for testing relationships between two numeric variables (e.g., Marketing Spend vs. Sales Revenue). Overlaying a least-squares trendline ($y = mx + b$) quantified with Pearson $r$ reveals direction, slope, and predictive potential.",
        starter_code="""import matplotlib.pyplot as plt
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
    f"Pearson r = {r:.3f}\\nLinear Fit: y = {slope:.2f}x + ${intercept:,.0f}",
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
print(f"Interpretation: For every $1 invested in marketing, sales increase by approximately ${slope:.2f}.")
""",
        solution_code="""import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

df = pd.read_csv("sales_marketing.csv")
x = df["marketing_spend"]
y = df["sales"]

fig, ax = plt.subplots(figsize=(8.5, 5.2), dpi=140)

# Colored by satisfaction score
scatter = ax.scatter(
    x, y, c=df["satisfaction_score"], cmap="tealrose" if "tealrose" in plt.colormaps() else "viridis",
    s=80, edgecolors="#1e293b", alpha=0.85, linewidth=0.8
)
cbar = fig.colorbar(scatter, ax=ax, pad=0.03)
cbar.set_label("Customer Satisfaction Score (1-5)", fontsize=9.5, fontweight="semibold")

# Best fit line
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
""",
        code_mappings=[
            CodeToVisualMapping(
                code_snippet="ax.scatter(x, y, alpha=0.75, s=70)",
                visual_element="Scatter Observation Points",
                explanation="Renders 2D data coordinates; alpha transparency reveals overlapping cluster density.",
            ),
            CodeToVisualMapping(
                code_snippet="slope, intercept = np.polyfit(x, y, deg=1)",
                visual_element="Least Squares Parameter Fitting",
                explanation="Finds the mathematical slope m and intercept b that minimize squared error residuals.",
            ),
            CodeToVisualMapping(
                code_snippet="ax.plot(x_line, y_line, '--', color='#e11d48')",
                visual_element="Red Dashed Trendline",
                explanation="Plots the continuous regression trajectory across the full horizontal span of observations.",
            ),
            CodeToVisualMapping(
                code_snippet="ax.text(..., transform=ax.transAxes, bbox=...)",
                visual_element="Floating Formula Annotation Callout",
                explanation="Anchors a formatted statistical scorecard inside axes coordinate space (0.0 to 1.0).",
            ),
        ],
        key_takeaways=[
            "Use alpha transparency (`alpha=0.6-0.8`) on scatter plots to prevent overplotting when points overlap.",
            "Pearson $r > 0.7$ signifies strong positive correlation; $r < -0.7$ indicates strong negative correlation.",
            "The slope represents the marginal rate of return ($/unit increase in x).",
        ],
        pro_tips=[
            "Use `np.corrcoef(x, y)[0, 1]` for instantaneous Pearson $r$ calculation without external statistical packages.",
        ],
    ),
    WorkshopStep(
        id="step-5-correlation-matrix-heatmap",
        stage=5,
        title="5. Multi-Variable Correlation Matrix Heatmap & Colormap Contrast",
        subtitle="Survey multi-collinearity and feature interactions across your entire dataset",
        objective="Calculate pairwise correlation coefficients across all numeric variables in a DataFrame and render a color-coded heatmap with dynamic black/white text overlays and a colorbar.",
        dataset_name="sales_marketing.csv",
        concept_summary="When analyzing real datasets with dozens of features, one-by-one scatter plots are too slow. A correlation matrix heatmap gives an instant bird's-eye view of positive, negative, and redundant relationships across all numeric columns simultaneously.",
        starter_code="""import matplotlib.pyplot as plt
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
""",
        solution_code="""import matplotlib.pyplot as plt
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

# Draw cell values with high-contrast text
for i in range(len(cols)):
    for j in range(len(cols)):
        val = corr.iloc[i, j]
        color = "white" if abs(val) > 0.5 else "#0f172a"
        ax.text(j, i, f"{val:.2f}", ha="center", va="center", color=color, fontweight="bold", fontsize=9.5)

ax.set_title("Feature Correlation Matrix (EDA Deep Dive)", fontsize=13, fontweight="bold", pad=30)
fig.tight_layout()
plt.show()
""",
        code_mappings=[
            CodeToVisualMapping(
                code_snippet="num_df = df.select_dtypes(include=[np.number])",
                visual_element="Numeric Feature Isolation",
                explanation="Filters the DataFrame to continuous variables suitable for linear correlation computation.",
            ),
            CodeToVisualMapping(
                code_snippet="ax.matshow(corr, cmap='coolwarm', vmin=-1, vmax=1)",
                visual_element="Color-Coded Heatmap Grid",
                explanation="Maps normalized correlation values between -1.0 (cool blue) and +1.0 (warm red).",
            ),
            CodeToVisualMapping(
                code_snippet="fig.colorbar(cax, fraction=0.046, pad=0.04)",
                visual_element="Correlation Legend Colorbar",
                explanation="Adds an exact metric legend scale on the right side of the figure.",
            ),
            CodeToVisualMapping(
                code_snippet="color = 'white' if abs(val) > 0.55 else 'black'",
                visual_element="Dynamic High-Contrast Numerical Text",
                explanation="Switches text color dynamically to guarantee readability regardless of cell color intensity.",
            ),
        ],
        key_takeaways=[
            "Always set `vmin=-1` and `vmax=1` on correlation heatmaps to maintain consistent scale interpretation.",
            "Use diverging colormaps (e.g. `coolwarm`, `RdBu_r`) where neutral 0.0 is light/gray and extremes are bold.",
            "Highly correlated features (r > 0.85) may cause multi-collinearity issues in linear models.",
        ],
        pro_tips=[
            "Use `np.triu(np.ones_like(corr, dtype=bool))` if you wish to mask the redundant upper half of the symmetric matrix.",
        ],
    ),
    WorkshopStep(
        id="step-6-multi-panel-dashboard",
        stage=6,
        title="6. Production-Ready Multi-Panel Analytics Dashboard (2x2 Subplots Grid)",
        subtitle="Unify your analysis into an executive presentation dashboard",
        objective="Assemble an end-to-end 2x2 multi-panel figure (`plt.subplots(2, 2)`) uniting distribution histograms, regional bar charts, bivariate scatter trends, and multi-variable dimension encoding into a cohesive dashboard.",
        dataset_name="sales_marketing.csv",
        concept_summary="In data analysis presentations, fragmented charts confuse stakeholders. Multi-panel dashboards coordinate multiple perspectives in a single visual hierarchy, sharing a master title and cohesive brand styling.",
        starter_code="""import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

df = pd.read_csv("sales_marketing.csv")

# 1. Create 2x2 Subplots Figure Canvas
fig, axes = plt.subplots(2, 2, figsize=(12, 8.5), dpi=140)
fig.suptitle("Executive Data Analysis Dashboard: Sales & Marketing ROI", fontsize=15, fontweight="bold", y=0.98)

# Panel 1 (Top-Left): Sales Distribution Histogram
ax1 = axes[0, 0]
ax1.hist(df["sales"], bins=8, color="#0f766e", edgecolor="#042f2e", alpha=0.75, rwidth=0.88)
ax1.axvline(df["sales"].mean(), color="#e11d48", linestyle="--", linewidth=1.8, label=f"Mean: ${df['sales'].mean():,.0f}")
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
    ax3.annotate(f"${bar.get_height():,.0f}K", xy=(bar.get_x() + bar.get_width()/2, bar.get_height()),
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
""",
        solution_code="""import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

df = pd.read_csv("sales_marketing.csv")

fig, axes = plt.subplots(2, 2, figsize=(12.5, 9), dpi=140)
fig.suptitle("Executive Data Analysis Dashboard: Retail Performance & ROI", fontsize=16, fontweight="bold", y=0.98)

# Panel 1: Distribution
ax1 = axes[0, 0]
ax1.hist(df["sales"], bins=8, color="#0f766e", edgecolor="#042f2e", alpha=0.8, rwidth=0.88)
ax1.axvline(df["sales"].mean(), color="#e11d48", linestyle="--", linewidth=2, label=f"Mean: ${df['sales'].mean():,.0f}")
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
    ax3.annotate(f"${bar.get_height():,.0f}K", xy=(bar.get_x() + bar.get_width()/2, bar.get_height()),
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
""",
        code_mappings=[
            CodeToVisualMapping(
                code_snippet="fig, axes = plt.subplots(2, 2, figsize=(12, 8.5), dpi=140)",
                visual_element="2x2 Subplots Grid Canvas",
                explanation="Allocates a 2-row by 2-column matrix of independent plotting axes accessible via axes[r, c].",
            ),
            CodeToVisualMapping(
                code_snippet="fig.suptitle('...', fontsize=15, fontweight='bold', y=0.98)",
                visual_element="Master Figure Suptitle",
                explanation="Sets an elevated overarching headline spanning across all 4 subplots simultaneously.",
            ),
            CodeToVisualMapping(
                code_snippet="c=df['satisfaction_score'], cmap='viridis'",
                visual_element="3rd Dimension Colormap Encoding",
                explanation="Encodes customer satisfaction score as point color onto a 2D footfall vs. sales scatter chart.",
            ),
            CodeToVisualMapping(
                code_snippet="fig.tight_layout(rect=[0, 0, 1, 0.96])",
                visual_element="Coordinate-Bounded Layout Optimizer",
                explanation="Leaves the top 4% of canvas clear for the master headline while auto-spacing all 4 subplots.",
            ),
        ],
        key_takeaways=[
            "Use `plt.subplots(rows, cols)` to construct clean, multi-faceted executive dashboards in a single Python script.",
            "Use `fig.suptitle(..., y=0.98)` paired with `fig.tight_layout(rect=[0, 0, 1, 0.96])` to avoid headline collisions.",
            "Ensure consistent axis font styling and color themes across all subplots for visual cohesion.",
        ],
        pro_tips=[
            "Pass `sharex=True` or `sharey=True` to `plt.subplots()` when plotting identical metrics across different sub-groups.",
        ],
    ),
]


GUIDED_MISSIONS: list[GuidedMission] = [
    GuidedMission(
        id="mission-sklearn-regression-diagnostics",
        title="Scikit-Learn Regression & Matplotlib Residuals Diagnostic",
        subtitle="Step-by-step pipeline from data scaling to model training and residual error diagnosis",
        category="Regression & Diagnostics",
        difficulty="Beginner",
        dataset_name="sales_marketing.csv",
        overview="Build a complete predictive pipeline using Scikit-Learn Linear Regression and Matplotlib diagnostic plots. Understand R² goodness-of-fit, slope interpretation, and residual error distribution.",
        steps=[
            GuidedStep(
                step_number=1,
                module_id="pandas-load-csv",
                target_action="Drag 'Load Dataset' into the workspace or code editor",
                title="1. Load Tabular Dataset",
                description="Ingest the retail sales and marketing spend CSV dataset into a Pandas DataFrame.",
                why_it_matters="Every data science pipeline begins with loading raw tabular data into memory to profile columns and types.",
                expected_output="DataFrame table with rows, columns, and initial statistical health check.",
                default_settings={"file_name": "sales_marketing.csv", "preview_rows": 5},
                code_snippet="""import pandas as pd

df = pd.read_csv("sales_marketing.csv")
print("=== Loaded Sales & Marketing Dataset ===")
print(f"Dimensions: {len(df)} rows x {len(df.columns)} columns")
print(df.head())
""",
            ),
            GuidedStep(
                step_number=2,
                module_id="matplotlib-scatter-plot",
                target_action="Drag 'Scatter Plot & Trendline' into the workspace or code editor",
                title="2. Explore Bivariate Correlation",
                description="Plot marketing spend against sales revenue with an overlaid best-fit regression line.",
                why_it_matters="Visualizing the relationship before fitting formal machine learning models confirms whether a linear assumption is sound.",
                expected_output="High-resolution Matplotlib scatter chart with Pearson correlation coefficient r and fitted line.",
                default_settings={"x_column": "marketing_spend", "y_column": "sales", "title": "Marketing Spend vs. Sales Revenue", "show_trendline": "yes"},
                code_snippet="""import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

df = pd.read_csv("sales_marketing.csv")
x = df["marketing_spend"]
y = df["sales"]

fig, ax = plt.subplots(figsize=(8, 4.8), dpi=140)
ax.scatter(x, y, color="#0f766e", alpha=0.8, s=65, label="Observations")

slope, intercept = np.polyfit(x, y, 1)
x_line = np.linspace(x.min(), x.max(), 100)
ax.plot(x_line, slope * x_line + intercept, color="#e11d48", linestyle="--", linewidth=2.2, label=f"Trendline (slope={slope:.2f})")

ax.set_title("Marketing Spend vs. Sales Revenue (Bivariate)", fontweight="bold", pad=12)
ax.set_xlabel("Marketing Spend ($)")
ax.set_ylabel("Sales ($)")
ax.grid(True, linestyle=":", alpha=0.6)
ax.legend()
fig.tight_layout()
plt.show()
""",
            ),
            GuidedStep(
                step_number=3,
                module_id="sklearn-scaler",
                target_action="Drag 'StandardScaler Preprocessor' into the workspace or code editor",
                title="3. Standardize Features (Z-Score)",
                description="Scale numeric features to zero mean and unit variance using Scikit-Learn StandardScaler.",
                why_it_matters="Feature scaling prevents high-magnitude features from dominating weights during model optimization.",
                expected_output="Standardized feature matrix with computed means and standard deviations.",
                default_settings={"feature_columns": "marketing_spend, store_footfall"},
                code_snippet="""import pandas as pd
from sklearn.preprocessing import StandardScaler

df = pd.read_csv("sales_marketing.csv")
features = ["marketing_spend", "store_footfall"]
scaler = StandardScaler()
df_scaled = scaler.fit_transform(df[features].fillna(0))

print(f"Standardized features {features}:")
print(f"Shape: {df_scaled.shape}, Mean ≈ {df_scaled.mean():.2f}, Std ≈ {df_scaled.std():.2f}")
""",
            ),
            GuidedStep(
                step_number=4,
                module_id="sklearn-regression",
                target_action="Drag 'Linear Regression Model' into the workspace or code editor",
                title="4. Train Scikit-Learn Linear Regression",
                description="Split dataset into 80% train and 20% test sets, fit Linear Regression, and compute R² and MAE.",
                why_it_matters="Supervised regression discovers the optimal equation y = mx + b predicting continuous revenue outcomes.",
                expected_output="Scorecard with R² score (>0.85), MAE, RMSE, and Actual vs. Predicted scatter plot.",
                default_settings={"feature_column": "marketing_spend", "target_column": "sales", "test_size": 0.2},
                code_snippet="""import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error

df = pd.read_csv("sales_marketing.csv")
X = df[["marketing_spend"]].fillna(0)
y = df["sales"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
model = LinearRegression().fit(X_train, y_train)
y_pred = model.predict(X_test)

print(f"Test R² Score: {r2_score(y_test, y_pred):.4f}")
print(f"Mean Absolute Error: ${mean_absolute_error(y_test, y_pred):,.2f}")
print(f"Formula: sales = {model.intercept_:.2f} + {model.coef_[0]:.2f} * marketing_spend")
""",
            ),
            GuidedStep(
                step_number=5,
                module_id="matplotlib-residuals-plot",
                target_action="Drag 'Regression Residuals Diagnostics' into the workspace or code editor",
                title="5. Diagnose Residual Error Distribution",
                description="Plot prediction residuals (y_actual - y_predicted) to verify homoscedasticity and zero-mean errors.",
                why_it_matters="If residuals exhibit a curve or fan pattern, the model violates linear regression assumptions and requires non-linear features.",
                expected_output="Residuals diagnostic chart with a horizontal zero-error baseline and outlier bounds.",
                default_settings={"feature_column": "marketing_spend", "target_column": "sales", "title": "Residuals Diagnostics (Error vs Predicted)"},
                code_snippet="""import matplotlib.pyplot as plt
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split

df = pd.read_csv("sales_marketing.csv")
X = df[["marketing_spend"]].fillna(0)
y = df["sales"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
model = LinearRegression().fit(X_train, y_train)
y_pred = model.predict(X_test)
residuals = y_test.to_numpy() - y_pred

fig, ax = plt.subplots(figsize=(8, 4.8), dpi=140)
ax.scatter(y_pred, residuals, color="#e11d48", alpha=0.85, s=65, label="Residuals")
ax.axhline(0, color="#1e293b", linestyle="--", linewidth=1.8, label="Zero-Error Baseline")

ax.set_title("Residuals Diagnostics (Error vs Predicted)", fontweight="bold", pad=12)
ax.set_xlabel("Predicted Sales ($)")
ax.set_ylabel("Residual Error (Actual - Predicted)")
ax.legend()
ax.grid(True, linestyle=":", alpha=0.6)
fig.tight_layout()
plt.show()
""",
            ),
        ],
    ),
    GuidedMission(
        id="mission-sklearn-classification-churn",
        title="Scikit-Learn Classification & Confusion Matrix Studio",
        subtitle="End-to-end customer churn classification and decision tree / confusion matrix analysis",
        category="Classification & Retention",
        difficulty="Intermediate",
        dataset_name="customer_churn.csv",
        overview="Build a production classification pipeline to predict customer churn risk using Scikit-Learn Decision Trees, Random Forests, and Matplotlib Confusion Matrix displays.",
        steps=[
            GuidedStep(
                step_number=1,
                module_id="pandas-load-csv",
                target_action="Drag 'Load Dataset' into the workspace",
                title="1. Load Churn Dataset",
                description="Ingest customer subscription, tenure, and monthly charges records.",
                why_it_matters="Provides customer behavioral features and the binary 'churned' target column.",
                expected_output="Customer DataFrame preview showing churn distributions.",
                default_settings={"file_name": "customer_churn.csv", "preview_rows": 5},
                code_snippet="""import pandas as pd
df = pd.read_csv("customer_churn.csv")
print("=== Loaded Customer Churn Dataset ===")
print(df.head())
""",
            ),
            GuidedStep(
                step_number=2,
                module_id="pandas-clean",
                target_action="Drag 'Clean Missing Values' into the workspace",
                title="2. Clean Missing Records",
                description="Drop rows with null values to avoid model crashes during scikit-learn fitting.",
                why_it_matters="Scikit-learn tree estimators require clean numeric matrices without NaN entries.",
                expected_output="Audit of cleaned row counts and confirmed zero missing cells.",
                default_settings={"strategy": "drop_rows"},
                code_snippet="""import pandas as pd
df = pd.read_csv("customer_churn.csv")
clean_df = df.dropna().reset_index(drop=True)
print(f"Cleaned records: {len(clean_df)} valid observations.")
""",
            ),
            GuidedStep(
                step_number=3,
                module_id="matplotlib-bar-chart",
                target_action="Drag 'Bar Chart' into the workspace",
                title="3. Benchmark Monthly Charges by Contract",
                description="Plot categorical bar charts showing average charges across contract types.",
                why_it_matters="Identifies which pricing plans have higher risk exposure.",
                expected_output="Ranked bar chart with direct numerical labels.",
                default_settings={"category_column": "contract_type", "value_column": "monthly_charges", "title": "Average Monthly Charges by Contract Type"},
                code_snippet="""import matplotlib.pyplot as plt
import pandas as pd

df = pd.read_csv("customer_churn.csv")
agg = df.groupby("contract_type")["monthly_charges"].mean()

fig, ax = plt.subplots(figsize=(7.5, 4.8), dpi=140)
bars = ax.bar(agg.index, agg.values, color="#0f766e", width=0.5)
for b in bars:
    ax.annotate(f"${b.get_height():.1f}", xy=(b.get_x() + b.get_width()/2, b.get_height()), xytext=(0, 4), textcoords="offset points", ha="center", fontweight="bold")

ax.set_title("Average Monthly Charges by Contract Type", fontweight="bold", pad=12)
ax.set_ylabel("Monthly Charges ($)")
ax.grid(axis="y", linestyle=":", alpha=0.6)
fig.tight_layout()
plt.show()
""",
            ),
            GuidedStep(
                step_number=4,
                module_id="sklearn-classification",
                target_action="Drag 'Decision Tree Classifier' into the workspace",
                title="4. Train Decision Tree & Confusion Matrix",
                description="Fit a decision tree on tenure, monthly charges, and support tickets with max_depth=3.",
                why_it_matters="Decision trees provide interpretable rules and split boundaries for classifying binary targets.",
                expected_output="Accuracy score, classification report, and color-coded Confusion Matrix plot.",
                default_settings={"feature_columns": "tenure_months, monthly_charges, support_tickets", "target_column": "churned", "max_depth": 3},
                code_snippet="""import matplotlib.pyplot as plt
import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, confusion_matrix

df = pd.read_csv("customer_churn.csv").dropna()
X = df[["tenure_months", "monthly_charges", "support_tickets"]]
y = df["churned"].astype(str)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)
clf = DecisionTreeClassifier(max_depth=3, random_state=42).fit(X_train, y_train)
y_pred = clf.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"Decision Tree Accuracy: {acc*100:.1f}%")

cm = confusion_matrix(y_test, y_pred, labels=clf.classes_)
fig, ax = plt.subplots(figsize=(6, 4.5), dpi=140)
cax = ax.matshow(cm, cmap="Blues")
fig.colorbar(cax)
ax.set_xticks(range(len(clf.classes_)))
ax.set_yticks(range(len(clf.classes_)))
ax.set_xticklabels(clf.classes_, fontweight="bold")
ax.set_yticklabels(clf.classes_, fontweight="bold")
for i in range(len(clf.classes_)):
    for j in range(len(clf.classes_)):
        ax.text(j, i, str(cm[i, j]), ha="center", va="center", color="white" if cm[i, j] > cm.max()/2 else "black", fontweight="bold")
ax.set_title(f"Decision Tree Confusion Matrix ({acc*100:.1f}% Acc)", pad=20, fontweight="bold")
fig.tight_layout()
plt.show()
""",
            ),
            GuidedStep(
                step_number=5,
                module_id="sklearn-random-forest-classifier",
                target_action="Drag 'Random Forest Classifier' into the workspace",
                title="5. Ensemble Random Forest & Feature Importances",
                description="Train an ensemble of 50 decision trees to evaluate overall feature importance rankings.",
                why_it_matters="Ensemble bagging reduces variance and identifies the most influential customer churn drivers.",
                expected_output="Ensemble Accuracy, weighted F1 score, and Feature Importance bar chart.",
                default_settings={"feature_columns": "tenure_months, monthly_charges, support_tickets", "target_column": "churned", "n_estimators": 50, "max_depth": 4},
                code_snippet="""import matplotlib.pyplot as plt
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

df = pd.read_csv("customer_churn.csv").dropna()
features = ["tenure_months", "monthly_charges", "support_tickets"]
X = df[features]
y = df["churned"].astype(str)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)
rf = RandomForestClassifier(n_estimators=50, max_depth=4, random_state=42).fit(X_train, y_train)

print(f"Random Forest Accuracy: {accuracy_score(y_test, rf.predict(X_test))*100:.1f}%")

fig, ax = plt.subplots(figsize=(7, 4), dpi=140)
ax.barh(features, rf.feature_importances_, color="#0f766e", edgecolor="#042f2e")
ax.set_title("Random Forest Feature Importances", fontweight="bold", pad=12)
ax.set_xlabel("Importance Ratio")
ax.grid(axis="x", linestyle=":", alpha=0.6)
fig.tight_layout()
plt.show()
""",
            ),
        ],
    ),
    GuidedMission(
        id="mission-sklearn-clustering-kmeans",
        title="Scikit-Learn K-Means & Matplotlib Cluster Centroids",
        subtitle="Unsupervised customer clustering and 2D centroid mapping",
        category="Unsupervised Learning",
        difficulty="Intermediate",
        dataset_name="sales_marketing.csv",
        overview="Learn how unsupervised machine learning partitions customer data into K distinct segments based on geometric Euclidean distance and centroid discovery.",
        steps=[
            GuidedStep(
                step_number=1,
                module_id="pandas-load-csv",
                target_action="Drag 'Load Dataset' into the workspace",
                title="1. Load Multi-Feature Dataset",
                description="Ingest marketing spend, footfall, and satisfaction data.",
                why_it_matters="Provides numeric continuous dimensions suitable for spatial clustering.",
                expected_output="DataFrame sample with numeric features.",
                default_settings={"file_name": "sales_marketing.csv", "preview_rows": 5},
                code_snippet="""import pandas as pd
df = pd.read_csv("sales_marketing.csv")
print(df.head())
""",
            ),
            GuidedStep(
                step_number=2,
                module_id="matplotlib-correlation-heatmap",
                target_action="Drag 'Correlation Heatmap' into the workspace",
                title="2. Compute Feature Correlation Matrix",
                description="Calculate pairwise correlation coefficients across all numeric features.",
                why_it_matters="Identifies distinct, uncorrelated feature axes to use for 2D/3D customer segmentation.",
                expected_output="Color-coded heatmap matrix with numerical cell values.",
                default_settings={"title": "Feature Correlation Matrix"},
                code_snippet="""import matplotlib.pyplot as plt
import pandas as pd

df = pd.read_csv("sales_marketing.csv")
corr = df.select_dtypes(include="number").corr()

fig, ax = plt.subplots(figsize=(7, 5.5), dpi=140)
cax = ax.matshow(corr, cmap="coolwarm")
fig.colorbar(cax)
ax.set_xticks(range(len(corr.columns)))
ax.set_yticks(range(len(corr.columns)))
ax.set_xticklabels(corr.columns, rotation=30, ha="left", fontsize=9)
ax.set_yticklabels(corr.columns, fontsize=9)
ax.set_title("Feature Correlation Matrix", fontweight="bold", pad=28)
fig.tight_layout()
plt.show()
""",
            ),
            GuidedStep(
                step_number=3,
                module_id="sklearn-clustering",
                target_action="Drag 'K-Means Clustering' into the workspace",
                title="3. Fit K-Means & Discover Centroids",
                description="Partition observations into K=3 clusters based on marketing spend and footfall.",
                why_it_matters="Discovers natural customer tiers (e.g. high-spend vs budget) without human labeling.",
                expected_output="2D scatter plot with distinct cluster colors and bold 'X' centroid markers.",
                default_settings={"feature_x": "marketing_spend", "feature_y": "store_footfall", "n_clusters": 3},
                code_snippet="""import matplotlib.pyplot as plt
import pandas as pd
from sklearn.cluster import KMeans

df = pd.read_csv("sales_marketing.csv")
X = df[["marketing_spend", "store_footfall"]].fillna(0)

kmeans = KMeans(n_clusters=3, random_state=42, n_init=10).fit(X)
df["cluster"] = kmeans.labels_

fig, ax = plt.subplots(figsize=(7.5, 4.8), dpi=140)
ax.scatter(df["marketing_spend"], df["store_footfall"], c=df["cluster"], cmap="viridis", s=65, alpha=0.8)
ax.scatter(kmeans.cluster_centers_[:, 0], kmeans.cluster_centers_[:, 1], color="red", marker="X", s=200, label="Centroids")
ax.set_title("K-Means Discovered Clusters (K=3)", fontweight="bold", pad=12)
ax.set_xlabel("Marketing Spend ($)")
ax.set_ylabel("Store Footfall")
ax.legend()
ax.grid(True, linestyle=":", alpha=0.6)
fig.tight_layout()
plt.show()
""",
            ),
            GuidedStep(
                step_number=4,
                module_id="matplotlib-bar-chart",
                target_action="Drag 'Bar Chart' into the workspace",
                title="4. Profile Cluster Marketing Budgets",
                description="Compare average marketing budget across the discovered customer segments.",
                why_it_matters="Translates abstract mathematical clusters into actionable business decisions.",
                expected_output="Categorical comparison bar chart with segment labels.",
                default_settings={"category_column": "region", "value_column": "marketing_spend", "title": "Marketing Spend by Region"},
                code_snippet="""import matplotlib.pyplot as plt
import pandas as pd

df = pd.read_csv("sales_marketing.csv")
fig, ax = plt.subplots(figsize=(7.5, 4.8), dpi=140)
df.groupby("region")["marketing_spend"].mean().plot(kind="bar", color="#0f766e", ax=ax)
ax.set_title("Marketing Spend by Region", fontweight="bold", pad=12)
ax.set_ylabel("Average Marketing Spend ($)")
ax.grid(axis="y", linestyle=":", alpha=0.6)
fig.tight_layout()
plt.show()
""",
            ),
        ],
    ),
    GuidedMission(
        id="mission-sklearn-pca-reduction",
        title="Scikit-Learn PCA & Dimensionality Projection",
        subtitle="Compress multi-variable datasets into 2 Principal Components with Matplotlib",
        category="Dimensionality Reduction",
        difficulty="Advanced",
        dataset_name="housing_prices.csv",
        overview="Compress high-dimensional real estate features (square feet, bedrooms, bathrooms, year built) into 2 orthogonal Principal Components while maximizing preserved dataset variance.",
        steps=[
            GuidedStep(
                step_number=1,
                module_id="pandas-load-csv",
                target_action="Drag 'Load Dataset' into the workspace",
                title="1. Load Housing Features",
                description="Ingest multi-variable real estate dataset containing physical dimensions and prices.",
                why_it_matters="Provides high-dimensional continuous features for compression.",
                expected_output="Preview of 5+ numeric features per property.",
                default_settings={"file_name": "housing_prices.csv", "preview_rows": 5},
                code_snippet="""import pandas as pd
df = pd.read_csv("housing_prices.csv")
print("=== Loaded Housing Valuation Dataset ===")
print(df.head())
""",
            ),
            GuidedStep(
                step_number=2,
                module_id="sklearn-scaler",
                target_action="Drag 'StandardScaler Preprocessor' into the workspace",
                title="2. Z-Score Standardization",
                description="Normalize feature scales so variables with larger absolute values (e.g. price) do not artificially dominate variance.",
                why_it_matters="PCA requires zero-mean unit-variance scaling for mathematically sound eigenvector computation.",
                expected_output="Standardized numeric array ready for PCA projection.",
                default_settings={"feature_columns": "square_feet, bedrooms, bathrooms, year_built, price"},
                code_snippet="""import pandas as pd
from sklearn.preprocessing import StandardScaler

df = pd.read_csv("housing_prices.csv")
num_df = df.select_dtypes(include="number").fillna(0)
scaler = StandardScaler()
X_scaled = scaler.fit_transform(num_df)
print(f"Standardized {num_df.shape[1]} numeric housing features. Shape: {X_scaled.shape}")
""",
            ),
            GuidedStep(
                step_number=3,
                module_id="sklearn-pca",
                target_action="Drag 'PCA Dimensionality Reduction' into the workspace",
                title="3. Compute Principal Components & 2D Projection",
                description="Project high-dimensional records onto PC1 and PC2 axes with explained variance score.",
                why_it_matters="Allows intuitive 2D visualization of complex multi-dimensional datasets.",
                expected_output="2D PCA Scatter plot showing property clusters and explained variance percentage.",
                default_settings={"feature_columns": "square_feet, bedrooms, bathrooms, year_built, price", "color_by": "neighborhood"},
                code_snippet="""import matplotlib.pyplot as plt
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

df = pd.read_csv("housing_prices.csv")
num_df = df.select_dtypes(include="number").fillna(0)
X_scaled = StandardScaler().fit_transform(num_df)

pca = PCA(n_components=2)
coords = pca.fit_transform(X_scaled)
var_exp = pca.explained_variance_ratio_
print(f"Preserved Total Variance: {var_exp.sum()*100:.1f}% (PC1: {var_exp[0]*100:.1f}%, PC2: {var_exp[1]*100:.1f}%)")

fig, ax = plt.subplots(figsize=(7.5, 4.8), dpi=140)
ax.scatter(coords[:, 0], coords[:, 1], color="#0f766e", alpha=0.85, s=70)
ax.set_title(f"PCA 2D Projection ({var_exp.sum()*100:.1f}% Variance Explained)", fontweight="bold", pad=12)
ax.set_xlabel(f"Principal Component 1 ({var_exp[0]*100:.1f}% var)")
ax.set_ylabel(f"Principal Component 2 ({var_exp[1]*100:.1f}% var)")
ax.grid(True, linestyle=":", alpha=0.6)
fig.tight_layout()
plt.show()
""",
            ),
            GuidedStep(
                step_number=4,
                module_id="matplotlib-box-plot",
                target_action="Drag 'Box & Whisker Distribution Plot' into the workspace",
                title="4. Inspect Valuation Dispersion & Outliers",
                description="Render box plots of property prices across neighborhood categories.",
                why_it_matters="Identifies luxury outliers and interquartile valuation spreads.",
                expected_output="Box plot showing median lines, IQR boxes, and outlier points.",
                default_settings={"value_column": "price", "group_column": "neighborhood", "title": "Property Valuation Spread & Outliers by Neighborhood"},
                code_snippet="""import matplotlib.pyplot as plt
import pandas as pd

df = pd.read_csv("housing_prices.csv")
fig, ax = plt.subplots(figsize=(7.5, 4.8), dpi=140)

if "neighborhood" in df.columns:
    groups = [grp["price"].dropna().values for _, grp in df.groupby("neighborhood")]
    labels = [str(n) for n, _ in df.groupby("neighborhood")]
    ax.boxplot(groups, tick_labels=labels, patch_artist=True, boxprops=dict(facecolor="#0f766e", alpha=0.75))
else:
    ax.boxplot(df["price"].dropna(), patch_artist=True, boxprops=dict(facecolor="#0f766e", alpha=0.75))

ax.set_title("Property Price Dispersion & Outliers", fontweight="bold", pad=12)
ax.set_ylabel("Sale Price ($)")
ax.grid(axis="y", linestyle=":", alpha=0.6)
fig.tight_layout()
plt.show()
""",
            ),
        ],
    ),
    GuidedMission(
        id="mission-matplotlib-eda-dashboard",
        title="Matplotlib Statistical EDA & 2x2 Subplots Dashboard",
        subtitle="Complete statistical exploratory process culminating in a unified multi-panel dashboard",
        category="Exploratory Data Analysis",
        difficulty="Beginner",
        dataset_name="sales_marketing.csv",
        overview="Follow best practices in data storytelling: inspect data distributions, compare categories, model bivariate correlation, and construct an executive 2x2 dashboard using plt.subplots(2, 2).",
        steps=[
            GuidedStep(
                step_number=1,
                module_id="pandas-load-csv",
                target_action="Drag 'Load Dataset' into the workspace",
                title="1. Load & Inspect Dataset",
                description="Ingest the dataset and inspect initial shape and schema.",
                why_it_matters="Establishes baseline data bounds.",
                expected_output="DataFrame dimensions and column types.",
                default_settings={"file_name": "sales_marketing.csv", "preview_rows": 5},
                code_snippet="""import pandas as pd
df = pd.read_csv("sales_marketing.csv")
print("=== Ingested Sales & Marketing Dataset ===")
print(df.head())
""",
            ),
            GuidedStep(
                step_number=2,
                module_id="matplotlib-histogram",
                target_action="Drag 'Histogram & Distribution' into the workspace",
                title="2. Univariate Distribution & Skewness",
                description="Plot sales distribution with Mean and Median reference lines.",
                why_it_matters="Reveals whether features are normal or skewed by extreme outliers.",
                expected_output="Frequency histogram with styled mean (red) and median (blue) lines.",
                default_settings={"column": "sales", "bins": 8, "title": "Distribution of Sales Revenue"},
                code_snippet="""import matplotlib.pyplot as plt
import pandas as pd

df = pd.read_csv("sales_marketing.csv")
fig, ax = plt.subplots(figsize=(7.5, 4.8), dpi=140)
ax.hist(df["sales"], bins=8, color="#0f766e", alpha=0.75, edgecolor="#042f2e")
ax.axvline(df["sales"].mean(), color="red", linestyle="--", label=f"Mean: ${df['sales'].mean():,.0f}")
ax.axvline(df["sales"].median(), color="blue", linestyle=":", label=f"Median: ${df['sales'].median():,.0f}")
ax.set_title("Distribution of Sales Revenue", fontweight="bold", pad=12)
ax.set_xlabel("Sales ($)")
ax.set_ylabel("Frequency Count")
ax.legend()
ax.grid(axis="y", linestyle=":", alpha=0.6)
fig.tight_layout()
plt.show()
""",
            ),
            GuidedStep(
                step_number=3,
                module_id="matplotlib-bar-chart",
                target_action="Drag 'Bar Chart' into the workspace",
                title="3. Ranked Categorical Bar Chart",
                description="Plot aggregated regional sales with direct value annotations.",
                why_it_matters="Direct data labels eliminate cognitive eye fatigue from tracing axes.",
                expected_output="Sorted bar chart with $K callouts directly above each bar.",
                default_settings={"category_column": "region", "value_column": "sales", "title": "Total Sales Revenue by Region"},
                code_snippet="""import matplotlib.pyplot as plt
import pandas as pd

df = pd.read_csv("sales_marketing.csv")
reg = df.groupby("region")["sales"].sum().sort_values(ascending=False) / 1000

fig, ax = plt.subplots(figsize=(7.5, 4.8), dpi=140)
bars = ax.bar(reg.index, reg.values, color="#0f766e", width=0.55)
for b in bars:
    ax.annotate(f"${b.get_height():,.0f}K", xy=(b.get_x() + b.get_width()/2, b.get_height()), xytext=(0, 4), textcoords="offset points", ha="center", fontweight="bold")

ax.set_title("Total Sales Revenue by Region ($ in Thousands)", fontweight="bold", pad=12)
ax.set_ylabel("Revenue ($K)")
ax.grid(axis="y", linestyle=":", alpha=0.6)
fig.tight_layout()
plt.show()
""",
            ),
            GuidedStep(
                step_number=4,
                module_id="matplotlib-scatter-plot",
                target_action="Drag 'Scatter Plot & Trendline' into the workspace",
                title="4. Bivariate Correlation & Trendline",
                description="Plot marketing spend vs sales with Pearson r and linear fit.",
                why_it_matters="Quantifies rate of return per advertising dollar.",
                expected_output="Scatter plot with dashed trendline and Pearson r annotation.",
                default_settings={"x_column": "marketing_spend", "y_column": "sales", "title": "Marketing Spend vs Sales", "show_trendline": "yes"},
                code_snippet="""import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

df = pd.read_csv("sales_marketing.csv")
x, y = df["marketing_spend"], df["sales"]

fig, ax = plt.subplots(figsize=(7.5, 4.8), dpi=140)
ax.scatter(x, y, color="#0284c7", alpha=0.8, s=65)
slope, intercept = np.polyfit(x, y, 1)
x_line = np.linspace(x.min(), x.max(), 50)
ax.plot(x_line, slope * x_line + intercept, "r--", linewidth=2, label=f"Slope: {slope:.2f}")

ax.set_title("Marketing Spend vs Sales ROI", fontweight="bold", pad=12)
ax.set_xlabel("Marketing Spend ($)")
ax.set_ylabel("Sales ($)")
ax.legend()
ax.grid(True, linestyle=":", alpha=0.6)
fig.tight_layout()
plt.show()
""",
            ),
            GuidedStep(
                step_number=5,
                module_id="matplotlib-subplots-grid",
                target_action="Drag '2x2 Subplots Executive Dashboard' into the workspace",
                title="5. Multi-Panel Executive Dashboard",
                description="Unify distribution, regression, categorical bars, and footfall scatter into a single 2x2 grid.",
                why_it_matters="Cohesive multi-panel figures provide stakeholders a single source of truth.",
                expected_output="140 DPI 2x2 master dashboard with suptitle.",
                default_settings={"title": "Executive Performance & Marketing ROI Dashboard"},
                code_snippet="""import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

df = pd.read_csv("sales_marketing.csv")

fig, axes = plt.subplots(2, 2, figsize=(12, 8.5), dpi=140)
fig.suptitle("Executive Dashboard", fontsize=16, fontweight="bold", y=0.98)

axes[0, 0].hist(df["sales"], bins=8, color="#0f766e", alpha=0.8)
axes[0, 0].set_title("1. Sales Distribution")

axes[0, 1].scatter(df["marketing_spend"], df["sales"], color="#0284c7")
axes[0, 1].set_title("2. Marketing ROI")

reg = df.groupby("region")["sales"].sum() / 1000
axes[1, 0].bar(reg.index, reg.values, color="#6366f1")
axes[1, 0].set_title("3. Regional Revenue ($K)")

axes[1, 1].scatter(df["store_footfall"], df["sales"], color="#10b981")
axes[1, 1].set_title("4. Footfall Impact")

plt.tight_layout(rect=[0, 0, 1, 0.96])
plt.show()
""",
            ),
        ],
    ),
]



PRESET_USE_CASES.extend([
    PresetUseCase(
        id="rf-regression-diagnostics",
        title="Random Forest Regression & Error Residuals",
        subtitle="Ensemble predictive modeling with feature importances & residual diagnostics",
        description="Standardize continuous features, train a Scikit-Learn Random Forest Regressor, evaluate non-linear feature importances, and plot error residuals.",
        category="Ensemble Regression",
        icon="Trees",
        difficulty="Intermediate",
        key_takeaway="Random Forests capture complex non-linear feature interactions that simple linear models miss.",
        blocks=[
            ProjectBlock(id="rf-reg-1", module_id="pandas-load-csv", settings={"file_name": "sales_marketing.csv", "preview_rows": 5}),
            ProjectBlock(id="rf-reg-2", module_id="sklearn-scaler", settings={"feature_columns": "marketing_spend, store_footfall"}),
            ProjectBlock(id="rf-reg-3", module_id="sklearn-random-forest-regressor", settings={"feature_columns": "marketing_spend, store_footfall", "target_column": "sales", "n_estimators": 50, "max_depth": 4}),
            ProjectBlock(id="rf-reg-4", module_id="matplotlib-residuals-plot", settings={"feature_column": "marketing_spend", "target_column": "sales"}),
        ],
    ),
    PresetUseCase(
        id="pca-dimension-reduction",
        title="PCA 2D Dimensionality Reduction",
        subtitle="Compress multi-variable housing features into 2 Principal Components",
        description="Normalize continuous real estate features with StandardScaler, perform Scikit-Learn PCA 2D dimensionality reduction, and visualize property valuation spreads with Matplotlib box plots.",
        category="Dimensionality Reduction",
        icon="Layers",
        difficulty="Advanced",
        key_takeaway="PCA projects high-dimensional correlation matrices onto orthogonal axes explaining maximum variance.",
        blocks=[
            ProjectBlock(id="pca-1", module_id="pandas-load-csv", settings={"file_name": "housing_prices.csv", "preview_rows": 5}),
            ProjectBlock(id="pca-2", module_id="sklearn-scaler", settings={"feature_columns": "square_feet, bedrooms, bathrooms, year_built, price"}),
            ProjectBlock(id="pca-3", module_id="sklearn-pca", settings={"feature_columns": "square_feet, bedrooms, bathrooms, year_built, price", "color_by": "neighborhood"}),
            ProjectBlock(id="pca-4", module_id="matplotlib-box-plot", settings={"value_column": "price", "group_column": "neighborhood", "title": "Valuation Spread & Outliers by Neighborhood"}),
        ],
    ),
])


