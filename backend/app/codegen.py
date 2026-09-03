from app.models import GenerateRequest, GenerateResponse, ProjectBlock
from app.modules import MODULE_BY_ID


def _setting(block: ProjectBlock, key: str) -> object:
    val = block.settings.get(key)
    if val is not None and str(val).strip() != "":
        return val
    module = MODULE_BY_ID.get(block.module_id)
    if module:
        for opt in module.options:
            if opt.key == key:
                return opt.default
    return None


def generate_project_code(request: GenerateRequest) -> GenerateResponse:
    imports: set[str] = set()
    lines: list[str] = [
        f'"""',
        f'{request.project_name}',
        f'Interactive Data Analysis Workshop - Python Workflow',
        f'"""',
        "",
    ]
    notes: list[str] = []
    has_dataframe = False

    for idx, block in enumerate(request.blocks, 1):
        module = MODULE_BY_ID.get(block.module_id)
        if module is None:
            notes.append(f"Skipped unknown block: {block.module_id}")
            continue

        if block.module_id == "pandas-load-csv":
            imports.add("import pandas as pd")
            file_name = _setting(block, "file_name") or "sales_marketing.csv"
            preview_rows = _setting(block, "preview_rows") or 5
            lines.extend(
                [
                    f"# Step {idx}: Ingest tabular dataset into a pandas DataFrame",
                    f'# Workshop Tip: read_csv parses comma-separated data into rows & columns',
                    f'df = pd.read_csv("{file_name}")',
                    f'print("=== Dataset Preview ===")',
                    f'print(df.head({preview_rows}))',
                    f'print(f"Shape: {{df.shape[0]}} rows, {{df.shape[1]}} columns\\n")',
                    "",
                ]
            )
            has_dataframe = True

        elif block.module_id == "pandas-clean":
            if not has_dataframe:
                notes.append("Tip: Place 'Load Dataset' before cleaning data.")
            strategy = str(_setting(block, "strategy") or "drop_rows")
            lines.append(f"# Step {idx}: Data Cleaning ({strategy})")
            if strategy == "drop_rows":
                lines.extend(
                    [
                        "initial_rows = len(df)",
                        "df = df.dropna().reset_index(drop=True)",
                        'print(f"Cleaned dataset: {len(df)} rows remaining ({initial_rows - len(df)} dropped)\\n")',
                        "",
                    ]
                )
            elif strategy == "fill_mean":
                imports.add("import numpy as np")
                lines.extend(
                    [
                        "num_cols = df.select_dtypes(include=[np.number]).columns",
                        "df[num_cols] = df[num_cols].fillna(df[num_cols].mean())",
                        'print(f"Imputed missing numeric values with column mean\\n")',
                        "",
                    ]
                )
            elif strategy == "fill_median":
                imports.add("import numpy as np")
                lines.extend(
                    [
                        "num_cols = df.select_dtypes(include=[np.number]).columns",
                        "df[num_cols] = df[num_cols].fillna(df[num_cols].median())",
                        'print(f"Imputed missing numeric values with column median\\n")',
                        "",
                    ]
                )

        elif block.module_id == "pandas-filter":
            col = _setting(block, "column") or "sales"
            op = _setting(block, "operator") or ">"
            thresh = _setting(block, "threshold") or "50000"
            lines.extend(
                [
                    f"# Step {idx}: Filter rows based on condition",
                    f'filtered_df = df[df["{col}"] {op} {thresh}].copy()',
                    f'print(f"Filtered ({{len(filtered_df)}} rows where {col} {op} {thresh}):")',
                    f"print(filtered_df.head())\n",
                    "",
                ]
            )

        elif block.module_id == "pandas-groupby":
            group_col = _setting(block, "group_column") or "region"
            agg_col = _setting(block, "agg_column") or "sales"
            agg_func = _setting(block, "agg_func") or "mean"
            lines.extend(
                [
                    f"# Step {idx}: Group by '{group_col}' and aggregate '{agg_col}'",
                    f'agg_result = df.groupby("{group_col}")["{agg_col}"].{agg_func}().reset_index()',
                    f'print("=== Grouped Summary ===")',
                    f"print(agg_result)\n",
                    "",
                ]
            )

        elif block.module_id == "numpy-summary":
            imports.add("import numpy as np")
            col = _setting(block, "column") or "sales"
            lines.extend(
                [
                    f"# Step {idx}: Descriptive Statistics with NumPy Arrays",
                    f'values = df["{col}"].dropna().to_numpy()',
                    f'print("=== Summary Statistics for {col} ===")',
                    f'print(f"Mean:       {{np.mean(values):.2f}}")',
                    f'print(f"Median:     {{np.median(values):.2f}}")',
                    f'print(f"Std Dev:    {{np.std(values):.2f}}")',
                    f'print(f"Min / Max:  {{np.min(values):.2f}} / {{np.max(values):.2f}}")',
                    f'print(f"IQR (75-25): {{np.percentile(values, 75) - np.percentile(values, 25):.2f}}\\n")',
                    "",
                ]
            )

        elif block.module_id == "numpy-transform":
            imports.add("import numpy as np")
            col = _setting(block, "column") or "marketing_spend"
            t_type = _setting(block, "transform_type") or "z_score"
            lines.append(f"# Step {idx}: Feature Transformation ({t_type})")
            if t_type == "z_score":
                lines.extend(
                    [
                        f'arr = df["{col}"].to_numpy()',
                        f'df["{col}_zscore"] = (arr - np.mean(arr)) / np.std(arr)',
                        f'print(f"Computed z-score for {col}\\n")',
                        "",
                    ]
                )
            elif t_type == "log":
                lines.extend(
                    [
                        f'df["{col}_log"] = np.log1p(df["{col}"].clip(lower=0))',
                        f'print(f"Applied log transform to {col}\\n")',
                        "",
                    ]
                )
            elif t_type == "min_max":
                lines.extend(
                    [
                        f'arr = df["{col}"].to_numpy()',
                        f'df["{col}_minmax"] = (arr - np.min(arr)) / (np.max(arr) - np.min(arr))',
                        f'print(f"Rescaled {col} to [0, 1] range\\n")',
                        "",
                    ]
                )

        elif block.module_id == "matplotlib-scatter-plot":
            imports.add("import matplotlib.pyplot as plt")
            imports.add("import numpy as np")
            x_col = _setting(block, "x_column") or "marketing_spend"
            y_col = _setting(block, "y_column") or "sales"
            title = _setting(block, "title") or f"{x_col} vs {y_col}"
            show_trend = str(_setting(block, "show_trendline") or "yes").lower() in ["yes", "true", "1"]

            lines.extend(
                [
                    f"# Step {idx}: Matplotlib Scatter Plot & Trendline",
                    "plt.figure(figsize=(8, 5))",
                    f'plt.scatter(df["{x_col}"], df["{y_col}"], color="#0f766e", alpha=0.8, edgecolors="#115e59", s=60, label="Observations")',
                ]
            )
            if show_trend:
                lines.extend(
                    [
                        f'# Fit best-fit linear trendline',
                        f'slope, intercept = np.polyfit(df["{x_col}"], df["{y_col}"], 1)',
                        f'x_vals = np.linspace(df["{x_col}"].min(), df["{x_col}"].max(), 100)',
                        f'plt.plot(x_vals, slope * x_vals + intercept, color="#e11d48", linestyle="--", linewidth=2, label=f"Trendline (slope={{slope:.2f}})")',
                    ]
                )
            lines.extend(
                [
                    f'plt.title("{title}", fontsize=14, fontweight="bold", pad=12)',
                    f'plt.xlabel("{x_col}", fontsize=11)',
                    f'plt.ylabel("{y_col}", fontsize=11)',
                    "plt.grid(True, linestyle=':', alpha=0.6)",
                    "plt.legend()",
                    "plt.tight_layout()",
                    "plt.show()",
                    "",
                ]
            )

        elif block.module_id == "matplotlib-bar-chart":
            imports.add("import matplotlib.pyplot as plt")
            cat_col = _setting(block, "category_column") or "region"
            val_col = _setting(block, "value_column") or "sales"
            title = _setting(block, "title") or f"Total {val_col} by {cat_col}"
            lines.extend(
                [
                    f"# Step {idx}: Matplotlib Categorical Bar Chart",
                    f'chart_data = df.groupby("{cat_col}")["{val_col}"].sum().sort_values(ascending=False)',
                    "plt.figure(figsize=(8, 5))",
                    'chart_data.plot(kind="bar", color="#0f766e", edgecolor="#115e59", width=0.6)',
                    f'plt.title("{title}", fontsize=14, fontweight="bold", pad=12)',
                    f'plt.xlabel("{cat_col}", fontsize=11)',
                    f'plt.ylabel("Total {val_col}", fontsize=11)',
                    "plt.grid(axis='y', linestyle=':', alpha=0.7)",
                    "plt.xticks(rotation=0)",
                    "plt.tight_layout()",
                    "plt.show()",
                    "",
                ]
            )

        elif block.module_id == "matplotlib-histogram":
            imports.add("import matplotlib.pyplot as plt")
            col = _setting(block, "column") or "sales"
            bins = _setting(block, "bins") or 10
            title = _setting(block, "title") or f"Distribution of {col}"
            lines.extend(
                [
                    f"# Step {idx}: Matplotlib Distribution Histogram",
                    "plt.figure(figsize=(8, 5))",
                    f'plt.hist(df["{col}"].dropna(), bins={bins}, color="#2563eb", edgecolor="#1e40af", alpha=0.75, rwidth=0.9)',
                    f'plt.axvline(df["{col}"].mean(), color="#e11d48", linestyle="--", linewidth=2, label="Mean")',
                    f'plt.axvline(df["{col}"].median(), color="#10b981", linestyle=":", linewidth=2, label="Median")',
                    f'plt.title("{title}", fontsize=14, fontweight="bold", pad=12)',
                    f'plt.xlabel("{col}", fontsize=11)',
                    'plt.ylabel("Frequency Count", fontsize=11)',
                    "plt.legend()",
                    "plt.grid(axis='y', linestyle=':', alpha=0.7)",
                    "plt.tight_layout()",
                    "plt.show()",
                    "",
                ]
            )

        elif block.module_id == "matplotlib-line-chart":
            imports.add("import matplotlib.pyplot as plt")
            x_col = _setting(block, "x_column") or "store_footfall"
            y_col = _setting(block, "y_column") or "sales"
            title = _setting(block, "title") or f"{y_col} vs {x_col}"
            lines.extend(
                [
                    f"# Step {idx}: Matplotlib Line Trend Chart",
                    f'sorted_df = df.sort_values(by="{x_col}")',
                    "plt.figure(figsize=(8, 5))",
                    f'plt.plot(sorted_df["{x_col}"], sorted_df["{y_col}"], color="#0f766e", marker="o", linewidth=2)',
                    f'plt.title("{title}", fontsize=14, fontweight="bold", pad=12)',
                    f'plt.xlabel("{x_col}", fontsize=11)',
                    f'plt.ylabel("{y_col}", fontsize=11)',
                    "plt.grid(True, linestyle=':', alpha=0.6)",
                    "plt.tight_layout()",
                    "plt.show()",
                    "",
                ]
            )

        elif block.module_id == "matplotlib-correlation-heatmap":
            imports.add("import matplotlib.pyplot as plt")
            imports.add("import numpy as np")
            title = _setting(block, "title") or "Feature Correlation Matrix"
            lines.extend(
                [
                    f"# Step {idx}: Correlation Matrix Heatmap",
                    "num_df = df.select_dtypes(include=[np.number])",
                    "corr_matrix = num_df.corr()",
                    "plt.figure(figsize=(7, 6))",
                    "plt.matshow(corr_matrix, cmap='coolwarm', vmin=-1, vmax=1, fignum=1)",
                    "plt.colorbar(fraction=0.046, pad=0.04)",
                    "cols = list(corr_matrix.columns)",
                    "plt.xticks(range(len(cols)), cols, rotation=45, ha='left')",
                    "plt.yticks(range(len(cols)), cols)",
                    "for i in range(len(cols)):",
                    "    for j in range(len(cols)):",
                    "        plt.text(j, i, f'{corr_matrix.iloc[i, j]:.2f}', ha='center', va='center',",
                    "                 color='white' if abs(corr_matrix.iloc[i, j]) > 0.6 else 'black')",
                    f'plt.title("{title}", fontsize=14, fontweight="bold", pad=28)',
                    "plt.tight_layout()",
                    "plt.show()",
                    "",
                ]
            )

        elif block.module_id == "sklearn-regression":
            imports.update(
                {
                    "from sklearn.linear_model import LinearRegression",
                    "from sklearn.model_selection import train_test_split",
                    "from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error",
                    "import matplotlib.pyplot as plt",
                }
            )
            feat_raw = _setting(block, "feature_column") or "marketing_spend"
            target_col = _setting(block, "target_column") or "sales"
            test_size = float(_setting(block, "test_size") or 0.2)
            feat_list = [f.strip() for f in str(feat_raw).split(",") if f.strip()]
            feat_repr = str(feat_list)

            lines.extend(
                [
                    f"# Step {idx}: Train Scikit-Learn Linear Regression Model",
                    f"# Workshop Goal: Map features {feat_repr} to continuous target '{target_col}'",
                    f"X = df[{feat_repr}]",
                    f'y = df["{target_col}"]',
                    "",
                    f"# 1. Split into training and test evaluation sets ({int((1-test_size)*100)}% train, {int(test_size*100)}% test)",
                    f"X_train, X_test, y_train, y_test = train_test_split(X, y, test_size={test_size}, random_state=42)",
                    "",
                    "# 2. Initialize and fit the model",
                    "model = LinearRegression()",
                    "model.fit(X_train, y_train)",
                    "",
                    "# 3. Predict on unseen test data & calculate metrics",
                    "y_pred = model.predict(X_test)",
                    "r2 = r2_score(y_test, y_pred)",
                    "mae = mean_absolute_error(y_test, y_pred)",
                    "",
                    'print("=== Scikit-Learn Linear Regression Results ===")',
                    'print(f"R² Goodness-of-Fit Score: {r2:.4f}")',
                    'print(f"Mean Absolute Error (MAE): {mae:.2f}")',
                    'print(f"Intercept: {model.intercept_:.2f}")',
                    'print(f"Coefficients: {dict(zip(X.columns, model.coef_))}\\n")',
                    "",
                    "# 4. Visualize Actual vs. Predicted values",
                    "plt.figure(figsize=(7, 5))",
                    'plt.scatter(y_test, y_pred, color="#0f766e", alpha=0.85, s=60, label="Test Predictions")',
                    'plt.plot([y.min(), y.max()], [y.min(), y.max()], "r--", linewidth=2, label="Ideal 45° Fit")',
                    'plt.title("Actual vs. Predicted Values (Linear Regression)", fontsize=13, fontweight="bold")',
                    f'plt.xlabel("Actual {target_col}")',
                    f'plt.ylabel("Predicted {target_col}")',
                    "plt.legend()",
                    "plt.grid(True, linestyle=':', alpha=0.6)",
                    "plt.tight_layout()",
                    "plt.show()",
                    "",
                ]
            )

        elif block.module_id == "sklearn-classification":
            imports.update(
                {
                    "from sklearn.tree import DecisionTreeClassifier",
                    "from sklearn.model_selection import train_test_split",
                    "from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, ConfusionMatrixDisplay",
                    "import matplotlib.pyplot as plt",
                }
            )
            feat_raw = _setting(block, "feature_columns") or "tenure_months, monthly_charges, support_tickets"
            target_col = _setting(block, "target_column") or "churned"
            max_depth = int(_setting(block, "max_depth") or 3)
            feat_list = [f.strip() for f in str(feat_raw).split(",") if f.strip()]
            feat_repr = str(feat_list)

            lines.extend(
                [
                    f"# Step {idx}: Train Scikit-Learn Decision Tree Classifier",
                    f"# Workshop Goal: Predict categorical class '{target_col}' from features",
                    f"X = df[{feat_repr}]",
                    f'y = df["{target_col}"]',
                    "",
                    "X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)",
                    f"clf = DecisionTreeClassifier(max_depth={max_depth}, random_state=42)",
                    "clf.fit(X_train, y_train)",
                    "",
                    "y_pred = clf.predict(X_test)",
                    "acc = accuracy_score(y_test, y_pred)",
                    'print("=== Classification Model Evaluation ===")',
                    'print(f"Accuracy Score: {acc*100:.1f}%")',
                    'print("\\nClassification Report:")',
                    "print(classification_report(y_test, y_pred))",
                    "",
                    "# Visualize Confusion Matrix with Matplotlib",
                    "cm = confusion_matrix(y_test, y_pred, labels=clf.classes_)",
                    "disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=clf.classes_)",
                    "disp.plot(cmap='Blues')",
                    f'plt.title("Confusion Matrix for {target_col}", fontsize=13, fontweight="bold", pad=12)',
                    "plt.tight_layout()",
                    "plt.show()",
                    "",
                ]
            )

        elif block.module_id == "matplotlib-box-plot":
            imports.add("import matplotlib.pyplot as plt")
            val_col = _setting(block, "value_column") or "sales"
            grp_col = _setting(block, "group_column") or "region"
            title = _setting(block, "title") or f"Distribution & Box Plot for {val_col}"
            lines.extend(
                [
                    f"# Step {idx}: Matplotlib Box & Whisker Plot",
                    "plt.figure(figsize=(8, 5))",
                    f'if "{grp_col}" in df.columns and df["{grp_col}"].nunique() > 1:',
                    f'    groups = [group["{val_col}"].dropna().values for _, group in df.groupby("{grp_col}")]',
                    f'    labels = [str(name) for name, _ in df.groupby("{grp_col}")]',
                    f'    plt.boxplot(groups, tick_labels=labels, patch_artist=True, boxprops=dict(facecolor="#0f766e", alpha=0.7))',
                    f'    plt.xlabel("{grp_col}")',
                    "else:",
                    f'    plt.boxplot(df["{val_col}"].dropna(), patch_artist=True, boxprops=dict(facecolor="#0f766e", alpha=0.7))',
                    f'plt.title("{title}", fontsize=13, fontweight="bold", pad=12)',
                    f'plt.ylabel("{val_col}")',
                    "plt.grid(axis='y', linestyle=':', alpha=0.6)",
                    "plt.tight_layout()",
                    "plt.show()",
                    "",
                ]
            )

        elif block.module_id == "matplotlib-residuals-plot":
            imports.update(
                {
                    "from sklearn.linear_model import LinearRegression",
                    "from sklearn.model_selection import train_test_split",
                    "import matplotlib.pyplot as plt",
                    "import numpy as np",
                }
            )
            feat_col = _setting(block, "feature_column") or "marketing_spend"
            target_col = _setting(block, "target_column") or "sales"
            title = _setting(block, "title") or "Residuals Diagnostics (Error vs Predicted)"
            lines.extend(
                [
                    f"# Step {idx}: Matplotlib Regression Residuals Diagnostic",
                    f'X = df[["{feat_col}"]].dropna()',
                    f'y = df["{target_col}"].loc[X.index]',
                    "X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)",
                    "lr = LinearRegression().fit(X_train, y_train)",
                    "preds = lr.predict(X_test)",
                    "residuals = y_test - preds",
                    "plt.figure(figsize=(8, 5))",
                    'plt.scatter(preds, residuals, color="#e11d48", alpha=0.8, s=65, edgecolors="#9f1239", label="Residuals")',
                    'plt.axhline(0, color="#1e293b", linestyle="--", linewidth=1.8, label="Zero-Error Baseline")',
                    f'plt.title("{title}", fontsize=13, fontweight="bold", pad=12)',
                    f'plt.xlabel("Predicted {target_col}")',
                    'plt.ylabel("Residual Error (Actual - Predicted)")',
                    "plt.legend()",
                    "plt.grid(True, linestyle=':', alpha=0.6)",
                    "plt.tight_layout()",
                    "plt.show()",
                    "",
                ]
            )

        elif block.module_id == "matplotlib-subplots-grid":
            imports.update(
                {
                    "import matplotlib.pyplot as plt",
                    "import numpy as np",
                }
            )
            title = _setting(block, "title") or "Executive Analytics Dashboard"
            lines.extend(
                [
                    f"# Step {idx}: Matplotlib 2x2 Executive Subplots Dashboard",
                    "fig, axes = plt.subplots(2, 2, figsize=(12, 8.5), dpi=140)",
                    f'fig.suptitle("{title}", fontsize=15, fontweight="bold", y=0.98)',
                    "",
                    "# Top-Left: Distribution",
                    'if "sales" in df.columns:',
                    '    axes[0, 0].hist(df["sales"].dropna(), bins=8, color="#0f766e", alpha=0.8, edgecolor="#042f2e")',
                    '    axes[0, 0].set_title("1. Sales Distribution")',
                    "",
                    "# Top-Right: Scatter & Trend",
                    'if "marketing_spend" in df.columns and "sales" in df.columns:',
                    '    axes[0, 1].scatter(df["marketing_spend"], df["sales"], color="#0284c7", alpha=0.8)',
                    '    slope, intercept = np.polyfit(df["marketing_spend"], df["sales"], 1)',
                    '    x_span = np.linspace(df["marketing_spend"].min(), df["marketing_spend"].max(), 50)',
                    '    axes[0, 1].plot(x_span, slope * x_span + intercept, "r--", label=f"Slope: {slope:.2f}")',
                    '    axes[0, 1].legend(fontsize=8)',
                    '    axes[0, 1].set_title("2. Marketing Spend vs Sales")',
                    "",
                    "# Bottom-Left: Regional Bars",
                    'if "region" in df.columns and "sales" in df.columns:',
                    '    reg = df.groupby("region")["sales"].sum() / 1000',
                    '    axes[1, 0].bar(reg.index, reg.values, color="#6366f1", edgecolor="#312e81")',
                    '    axes[1, 0].set_title("3. Regional Sales ($K)")',
                    "",
                    "# Bottom-Right: Multi-feature Footfall",
                    'if "store_footfall" in df.columns and "sales" in df.columns:',
                    '    axes[1, 1].scatter(df["store_footfall"], df["sales"], color="#10b981", alpha=0.8)',
                    '    axes[1, 1].set_title("4. Footfall vs Sales")',
                    "",
                    "fig.tight_layout(rect=[0, 0, 1, 0.96])",
                    "plt.show()",
                    "",
                ]
            )

        elif block.module_id == "sklearn-scaler":
            imports.update(
                {
                    "from sklearn.preprocessing import StandardScaler",
                }
            )
            feat_raw = _setting(block, "feature_columns") or "marketing_spend, store_footfall"
            feat_list = [f.strip() for f in str(feat_raw).split(",") if f.strip()]
            lines.extend(
                [
                    f"# Step {idx}: StandardScaler Feature Normalization",
                    f"features_to_scale = {feat_list}",
                    "scaler = StandardScaler()",
                    "scaled_matrix = scaler.fit_transform(df[features_to_scale].fillna(0))",
                    "for i, col in enumerate(features_to_scale):",
                    '    df[f"{col}_scaled"] = scaled_matrix[:, i]',
                    'print(f"Standardized features with mean=0, std=1: {features_to_scale}\\n")',
                    "",
                ]
            )

        elif block.module_id == "sklearn-random-forest-regressor":
            imports.update(
                {
                    "from sklearn.ensemble import RandomForestRegressor",
                    "from sklearn.model_selection import train_test_split",
                    "from sklearn.metrics import r2_score, mean_absolute_error",
                    "import matplotlib.pyplot as plt",
                }
            )
            feat_raw = _setting(block, "feature_columns") or "marketing_spend, store_footfall"
            target_col = _setting(block, "target_column") or "sales"
            n_est = int(_setting(block, "n_estimators") or 50)
            max_d = int(_setting(block, "max_depth") or 4)
            feat_list = [f.strip() for f in str(feat_raw).split(",") if f.strip()]

            lines.extend(
                [
                    f"# Step {idx}: Scikit-Learn Random Forest Regressor",
                    f"features = {feat_list}",
                    f'X = df[features].fillna(0)',
                    f'y = df["{target_col}"]',
                    "X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)",
                    f"rf = RandomForestRegressor(n_estimators={n_est}, max_depth={max_d}, random_state=42)",
                    "rf.fit(X_train, y_train)",
                    "y_pred = rf.predict(X_test)",
                    "r2 = r2_score(y_test, y_pred)",
                    'print(f"Random Forest Regressor R² Score: {r2:.4f}")',
                    'print(f"Feature Importances: {dict(zip(features, rf.feature_importances_))}\\n")',
                    "",
                    "# Plot Feature Importances",
                    "plt.figure(figsize=(7, 4))",
                    "plt.barh(features, rf.feature_importances_, color='#0f766e', edgecolor='#115e59')",
                    'plt.title("Random Forest Feature Importances", fontsize=13, fontweight="bold")',
                    'plt.xlabel("Importance Ratio")',
                    "plt.tight_layout()",
                    "plt.show()",
                    "",
                ]
            )

        elif block.module_id == "sklearn-random-forest-classifier":
            imports.update(
                {
                    "from sklearn.ensemble import RandomForestClassifier",
                    "from sklearn.model_selection import train_test_split",
                    "from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, ConfusionMatrixDisplay",
                    "import matplotlib.pyplot as plt",
                }
            )
            feat_raw = _setting(block, "feature_columns") or "tenure_months, monthly_charges, support_tickets"
            target_col = _setting(block, "target_column") or "churned"
            n_est = int(_setting(block, "n_estimators") or 50)
            max_d = int(_setting(block, "max_depth") or 4)
            feat_list = [f.strip() for f in str(feat_raw).split(",") if f.strip()]

            lines.extend(
                [
                    f"# Step {idx}: Scikit-Learn Random Forest Classifier",
                    f"features = {feat_list}",
                    f"X = df[features].fillna(0)",
                    f'y = df["{target_col}"].astype(str)',
                    "X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)",
                    f"rf_clf = RandomForestClassifier(n_estimators={n_est}, max_depth={max_d}, random_state=42)",
                    "rf_clf.fit(X_train, y_train)",
                    "y_pred = rf_clf.predict(X_test)",
                    "acc = accuracy_score(y_test, y_pred)",
                    'print(f"Random Forest Accuracy: {acc*100:.1f}%")',
                    'print(classification_report(y_test, y_pred))',
                    "",
                    "# Confusion Matrix",
                    "cm = confusion_matrix(y_test, y_pred, labels=rf_clf.classes_)",
                    "disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=rf_clf.classes_)",
                    "disp.plot(cmap='Blues')",
                    f'plt.title("Random Forest Confusion Matrix ({target_col})", pad=12, fontweight="bold")',
                    "plt.tight_layout()",
                    "plt.show()",
                    "",
                ]
            )

        elif block.module_id == "sklearn-logistic-regression":
            imports.update(
                {
                    "from sklearn.linear_model import LogisticRegression",
                    "from sklearn.model_selection import train_test_split",
                    "from sklearn.metrics import accuracy_score, classification_report",
                    "import matplotlib.pyplot as plt",
                }
            )
            feat_raw = _setting(block, "feature_columns") or "tenure_months, monthly_charges, support_tickets"
            target_col = _setting(block, "target_column") or "churned"
            c_val = float(_setting(block, "c_param") or 1.0)
            feat_list = [f.strip() for f in str(feat_raw).split(",") if f.strip()]

            lines.extend(
                [
                    f"# Step {idx}: Scikit-Learn Logistic Regression Classifier",
                    f"features = {feat_list}",
                    f"X = df[features].fillna(0)",
                    f'y = df["{target_col}"].astype(str)',
                    "X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)",
                    f"lr_clf = LogisticRegression(C={c_val}, max_iter=500)",
                    "lr_clf.fit(X_train, y_train)",
                    "y_pred = lr_clf.predict(X_test)",
                    "acc = accuracy_score(y_test, y_pred)",
                    'print(f"Logistic Regression Accuracy: {acc*100:.1f}%")',
                    'print(classification_report(y_test, y_pred))',
                    "",
                ]
            )

        elif block.module_id == "sklearn-pca":
            imports.update(
                {
                    "from sklearn.decomposition import PCA",
                    "from sklearn.preprocessing import StandardScaler",
                    "import matplotlib.pyplot as plt",
                }
            )
            feat_raw = _setting(block, "feature_columns") or "square_feet, bedrooms, bathrooms, year_built, price"
            color_by = _setting(block, "color_by") or "region"
            feat_list = [f.strip() for f in str(feat_raw).split(",") if f.strip()]

            lines.extend(
                [
                    f"# Step {idx}: Scikit-Learn PCA 2D Dimensionality Reduction",
                    f"pca_features = {feat_list}",
                    "X_pca = df[pca_features].select_dtypes(include=['number']).fillna(0)",
                    "X_scaled = StandardScaler().fit_transform(X_pca)",
                    "pca = PCA(n_components=2)",
                    "coords = pca.fit_transform(X_scaled)",
                    'df["PC1"] = coords[:, 0]',
                    'df["PC2"] = coords[:, 1]',
                    'var_exp = pca.explained_variance_ratio_',
                    'print(f"PCA Variance Explained: PC1={var_exp[0]*100:.1f}%, PC2={var_exp[1]*100:.1f}% (Total: {var_exp.sum()*100:.1f}%)\\n")',
                    "",
                    "# 2D PCA Scatter Visualization",
                    "plt.figure(figsize=(7.5, 5))",
                    f'if "{color_by}" in df.columns:',
                    f'    for grp_name, group in df.groupby("{color_by}"):',
                    '        plt.scatter(group["PC1"], group["PC2"], label=str(grp_name), alpha=0.85, s=65)',
                    '    plt.legend(title="' + str(color_by) + '")',
                    "else:",
                    '    plt.scatter(df["PC1"], df["PC2"], color="#0f766e", alpha=0.8, s=65)',
                    f'plt.title(f"PCA 2D Projection (Explains {{var_exp.sum()*100:.1f}}% Variance)", fontsize=13, fontweight="bold")',
                    f'plt.xlabel(f"PC1 ({{var_exp[0]*100:.1f}}% Variance)")',
                    f'plt.ylabel(f"PC2 ({{var_exp[1]*100:.1f}}% Variance)")',
                    "plt.grid(True, linestyle=':', alpha=0.6)",
                    "plt.tight_layout()",
                    "plt.show()",
                    "",
                ]
            )

        elif block.module_id == "sklearn-clustering":
            imports.update(
                {
                    "from sklearn.cluster import KMeans",
                    "import matplotlib.pyplot as plt",
                }
            )
            feat_x = _setting(block, "feature_x") or "marketing_spend"
            feat_y = _setting(block, "feature_y") or "store_footfall"
            n_clusters = int(_setting(block, "n_clusters") or 3)

            lines.extend(
                [
                    f"# Step {idx}: Unsupervised K-Means Clustering (K={n_clusters})",
                    f'X_cluster = df[["{feat_x}", "{feat_y}"]]',
                    f"kmeans = KMeans(n_clusters={n_clusters}, random_state=42, n_init=10)",
                    'df["cluster"] = kmeans.fit_predict(X_cluster)',
                    "",
                    'print(f"K-Means complete with {n_clusters} clusters. Inertia: {kmeans.inertia_:.1f}")',
                    'print("Cluster member counts:")',
                    'print(df["cluster"].value_counts().sort_index())',
                    "",
                    "# Plot Clusters and Centroids",
                    "plt.figure(figsize=(7, 5))",
                    f'plt.scatter(df["{feat_x}"], df["{feat_y}"], c=df["cluster"], cmap="viridis", s=60, alpha=0.8)',
                    'plt.scatter(kmeans.cluster_centers_[:, 0], kmeans.cluster_centers_[:, 1], c="red", marker="X", s=200, label="Centroids")',
                    f'plt.title("K-Means Clusters ({n_clusters} Segments)", fontsize=13, fontweight="bold")',
                    f'plt.xlabel("{feat_x}")',
                    f'plt.ylabel("{feat_y}")',
                    "plt.legend()",
                    "plt.grid(True, linestyle=':', alpha=0.6)",
                    "plt.tight_layout()",
                    "plt.show()",
                    "",
                ]
            )

    import_block = "\n".join(sorted(imports))
    body = "\n".join(lines)
    code = f"{import_block}\n\n{body}" if import_block else body
    return GenerateResponse(code=code.strip() + "\n", imports=sorted(imports), notes=notes)
