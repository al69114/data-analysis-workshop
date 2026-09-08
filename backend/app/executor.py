import base64
import io
import os
import tempfile
import time
from typing import Any, Optional

os.environ.setdefault("MPLCONFIGDIR", os.path.join(tempfile.gettempdir(), "data-analysis-workshop-mpl"))

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier

import sys
import traceback

from app.models import (
    BlockExecutionResult,
    CustomCodeExecuteRequest,
    CustomCodeExecuteResponse,
    DataPreview,
    ExecuteRequest,
    ExecuteResponse,
    MetricItem,
    ProjectBlock,
)
from app.modules import MODULE_BY_ID


DATASET_DIR = os.path.join(os.path.dirname(__file__), "datasets")


def _get_setting(block: ProjectBlock, key: str, default: Any = None) -> Any:
    val = block.settings.get(key)
    if val is not None and str(val).strip() != "":
        return val
    module = MODULE_BY_ID.get(block.module_id)
    if module:
        for opt in module.options:
            if opt.key == key:
                return opt.default
    return default


def _fig_to_base64(fig: plt.Figure) -> str:
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight", dpi=140, facecolor="#ffffff")
    buf.seek(0)
    img_b64 = base64.b64encode(buf.read()).decode("utf-8")
    plt.close(fig)
    return "data:image/png;base64," + img_b64


def _make_data_preview(df: pd.DataFrame, n_rows: int = 5) -> DataPreview:
    sample_df = df.head(n_rows).copy()
    for col in sample_df.columns:
        if not pd.api.types.is_numeric_dtype(sample_df[col]):
            sample_df[col] = sample_df[col].fillna("").astype(str)
        else:
            sample_df[col] = sample_df[col].apply(lambda x: round(float(x), 3) if pd.notnull(x) else None)
    return DataPreview(
        columns=list(df.columns),
        rows=sample_df.to_dict(orient="records"),
        total_rows=len(df),
        total_columns=len(df.columns),
    )


def execute_pipeline(request: ExecuteRequest) -> ExecuteResponse:
    start_time = time.time()
    results: list[BlockExecutionResult] = []
    notes: list[str] = []
    df: Optional[pd.DataFrame] = None
    overall_insights: list[str] = []

    plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")
    plt.rcParams.update({
        "font.family": "sans-serif",
        "font.size": 10,
        "axes.titlesize": 13,
        "axes.titleweight": "bold",
        "axes.labelsize": 11,
        "axes.labelweight": "semibold",
        "figure.titlesize": 14,
        "figure.titleweight": "bold",
    })

    for block in request.blocks:
        module = MODULE_BY_ID.get(block.module_id)
        if not module:
            results.append(
                BlockExecutionResult(
                    block_id=block.id,
                    module_id=block.module_id,
                    title="Unknown Block",
                    package="Custom",
                    category="data",
                    success=False,
                    summary="Unknown module: " + block.module_id,
                    error="Module definition not found in catalog.",
                )
            )
            continue

        module_id = block.module_id

        # 1. LOAD CSV
        if module_id == "pandas-load-csv":
            file_name = str(_get_setting(block, "file_name", "sales_marketing.csv"))
            preview_rows = int(_get_setting(block, "preview_rows", 5))

            try:
                if request.custom_csv and request.custom_csv.strip():
                    df = pd.read_csv(io.StringIO(request.custom_csv))
                    source_label = "Custom uploaded CSV"
                else:
                    path = os.path.join(DATASET_DIR, file_name)
                    if not os.path.exists(path):
                        path = file_name
                    df = pd.read_csv(path)
                    source_label = "Dataset " + file_name

                preview = _make_data_preview(df, preview_rows)
                metrics = [
                    MetricItem(label="Total Rows", value=len(df), description="Observations loaded", status="good"),
                    MetricItem(label="Total Features", value=len(df.columns), description="Columns in dataset", status="good"),
                    MetricItem(label="Missing Cells", value=int(df.isna().sum().sum()), description="Null values present", status="neutral" if df.isna().sum().sum() == 0 else "attention"),
                ]
                cols_str = ", ".join(df.columns)
                logs = [
                    f"Loaded {len(df)} rows and {len(df.columns)} columns from {source_label}.",
                    f"Columns: {cols_str}",
                ]
                first_few = ", ".join(list(df.columns)[:4])
                overall_insights.append(f"Loaded {len(df)} records with features: {first_few}...")

                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=True,
                        summary=f"Successfully loaded {len(df)} rows x {len(df.columns)} columns.",
                        logs=logs,
                        data_preview=preview,
                        metrics=metrics,
                    )
                )
            except Exception as e:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="Failed to load dataset.",
                        error=str(e),
                    )
                )

        # 2. CLEAN MISSING VALUES
        elif module_id == "pandas-clean":
            if df is None:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="No dataset loaded.",
                        error="Please add a Load Dataset block before cleaning data.",
                    )
                )
                continue

            strategy = str(_get_setting(block, "strategy", "drop_rows"))
            initial_rows = len(df)
            missing_count = int(df.isna().sum().sum())

            if strategy == "drop_rows":
                df = df.dropna().reset_index(drop=True)
                summary_msg = f"Dropped rows with missing values. Cleaned dataset has {len(df)} rows ({initial_rows - len(df)} removed)."
            elif strategy == "fill_mean":
                num_cols = df.select_dtypes(include=[np.number]).columns
                df[num_cols] = df[num_cols].fillna(df[num_cols].mean())
                summary_msg = f"Imputed missing numeric values with column mean across {len(num_cols)} columns."
            elif strategy == "fill_median":
                num_cols = df.select_dtypes(include=[np.number]).columns
                df[num_cols] = df[num_cols].fillna(df[num_cols].median())
                summary_msg = f"Imputed missing numeric values with column median across {len(num_cols)} columns."
            else:
                df = df.dropna().reset_index(drop=True)
                summary_msg = f"Cleaned dataset. Total rows: {len(df)}."

            preview = _make_data_preview(df, 5)
            metrics = [
                MetricItem(label="Rows Before", value=initial_rows, description="Original row count"),
                MetricItem(label="Rows After", value=len(df), description="Cleaned row count", status="good"),
                MetricItem(label="Missing Values Remaining", value=int(df.isna().sum().sum()), description="Zero is ideal for modeling", status="good" if df.isna().sum().sum() == 0 else "attention"),
            ]
            results.append(
                BlockExecutionResult(
                    block_id=block.id,
                    module_id=module_id,
                    title=module.title,
                    package=module.package,
                    category=module.category,
                    success=True,
                    summary=summary_msg,
                    logs=[f"Applied strategy {strategy}. Missing cells resolved: {missing_count}."],
                    data_preview=preview,
                    metrics=metrics,
                )
            )

        # 3. FILTER ROWS
        elif module_id == "pandas-filter":
            if df is None:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="No dataset loaded.",
                        error="Please add a Load Dataset block first.",
                    )
                )
                continue

            column = str(_get_setting(block, "column", "sales")).strip()
            operator = str(_get_setting(block, "operator", ">")).strip()
            raw_threshold = _get_setting(block, "threshold", "50000")

            if column not in df.columns:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary=f"Column {column} not found.",
                        error=f"Available columns are: {', '.join(df.columns)}",
                    )
                )
                continue

            initial_len = len(df)
            try:
                if pd.api.types.is_numeric_dtype(df[column]):
                    thresh_val = float(raw_threshold)
                else:
                    thresh_val = str(raw_threshold)

                if operator == ">":
                    df = df[df[column] > thresh_val].reset_index(drop=True)
                elif operator == ">=":
                    df = df[df[column] >= thresh_val].reset_index(drop=True)
                elif operator == "<":
                    df = df[df[column] < thresh_val].reset_index(drop=True)
                elif operator == "<=":
                    df = df[df[column] <= thresh_val].reset_index(drop=True)
                elif operator == "==":
                    df = df[df[column] == thresh_val].reset_index(drop=True)
                elif operator == "!=":
                    df = df[df[column] != thresh_val].reset_index(drop=True)

                preview = _make_data_preview(df, 5)
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=True,
                        summary=f"Filtered {column} {operator} {raw_threshold}. Result: {len(df)} of {initial_len} rows retained.",
                        data_preview=preview,
                        metrics=[
                            MetricItem(label="Filtered Rows", value=len(df), description="Matching rows", status="good"),
                            MetricItem(label="Retention Rate", value=f"{round(len(df)/initial_len*100, 1)}%", description="Percentage of original data", status="neutral"),
                        ],
                    )
                )
            except Exception as e:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="Filtering failed.",
                        error=str(e),
                    )
                )

        # 4. GROUP BY & AGGREGATE
        elif module_id == "pandas-groupby":
            if df is None:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="No dataset loaded.",
                        error="Please add a Load Dataset block first.",
                    )
                )
                continue

            group_col = str(_get_setting(block, "group_column", "region")).strip()
            agg_col = str(_get_setting(block, "agg_column", "sales")).strip()
            agg_func = str(_get_setting(block, "agg_func", "mean")).strip()

            if group_col not in df.columns or agg_col not in df.columns:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary=f"Columns {group_col} or {agg_col} not found.",
                        error=f"Available columns: {', '.join(df.columns)}",
                    )
                )
                continue

            try:
                grouped_df = df.groupby(group_col, as_index=False)[agg_col].agg(agg_func)
                grouped_df = grouped_df.sort_values(by=agg_col, ascending=False).reset_index(drop=True)
                preview = _make_data_preview(grouped_df, len(grouped_df))

                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=True,
                        summary=f"Grouped by {group_col} and calculated {agg_func} of {agg_col} across {len(grouped_df)} groups.",
                        logs=[f"Created aggregation table with {len(grouped_df)} categories."],
                        data_preview=preview,
                        metrics=[
                            MetricItem(label="Total Groups", value=len(grouped_df), description="Distinct categories found"),
                            MetricItem(label="Max Group Val", value=round(float(grouped_df[agg_col].max()), 2), description="Highest category value"),
                            MetricItem(label="Min Group Val", value=round(float(grouped_df[agg_col].min()), 2), description="Lowest category value"),
                        ],
                    )
                )
            except Exception as e:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="Aggregation failed.",
                        error=str(e),
                    )
                )

        # 5. NUMPY SUMMARY & STATS
        elif module_id == "numpy-summary":
            if df is None:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="No dataset loaded.",
                        error="Please add a Load Dataset block first.",
                    )
                )
                continue

            column = str(_get_setting(block, "column", "sales")).strip()
            if column not in df.columns:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary=f"Column {column} not found.",
                        error=f"Available columns: {', '.join(df.columns)}",
                    )
                )
                continue

            try:
                values = pd.to_numeric(df[column], errors="coerce").dropna().to_numpy()
                mean_val = float(np.mean(values))
                median_val = float(np.median(values))
                std_val = float(np.std(values))
                min_val = float(np.min(values))
                max_val = float(np.max(values))
                p25 = float(np.percentile(values, 25))
                p75 = float(np.percentile(values, 75))
                iqr = p75 - p25

                metrics = [
                    MetricItem(label="Mean", value=round(mean_val, 2), description="Arithmetic average of observations", status="good"),
                    MetricItem(label="Median", value=round(median_val, 2), description="50th percentile / middle value", status="good"),
                    MetricItem(label="Std Dev", value=round(std_val, 2), description="Data dispersion around mean", status="neutral"),
                    MetricItem(label="Min / Max", value=f"{round(min_val, 1)} / {round(max_val, 1)}", description="Range of values"),
                    MetricItem(label="IQR (P75-P25)", value=round(iqr, 2), description="Interquartile Range (Middle 50%)"),
                ]
                logs = [
                    f"NumPy Array Stats computed for {column} ({len(values)} numeric points):",
                    f"Mean: {mean_val:.2f}, Median: {median_val:.2f}, Std: {std_val:.2f}",
                    f"25th %ile: {p25:.2f}, 75th %ile: {p75:.2f}, IQR: {iqr:.2f}",
                ]
                overall_insights.append(f"Stat summary for {column}: Mean = {mean_val:.2f}, Std Dev = {std_val:.2f}")

                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=True,
                        summary=f"Computed statistical summary for {column}. Mean: {mean_val:.2f}, Median: {median_val:.2f}.",
                        logs=logs,
                        metrics=metrics,
                    )
                )
            except Exception as e:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="NumPy summary calculation failed.",
                        error=str(e),
                    )
                )

        # 6. NUMPY TRANSFORM & SCALE
        elif module_id == "numpy-transform":
            if df is None:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="No dataset loaded.",
                        error="Please add a Load Dataset block first.",
                    )
                )
                continue

            column = str(_get_setting(block, "column", "marketing_spend")).strip()
            transform_type = str(_get_setting(block, "transform_type", "z_score")).strip()

            if column not in df.columns:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary=f"Column {column} not found.",
                        error=f"Available columns: {', '.join(df.columns)}",
                    )
                )
                continue

            try:
                arr = pd.to_numeric(df[column], errors="coerce").fillna(0).to_numpy()
                new_col_name = f"{column}_{transform_type}"
                if transform_type == "z_score":
                    mean, std = np.mean(arr), np.std(arr)
                    transformed = (arr - mean) / (std if std != 0 else 1.0)
                    desc = f"Standardized with mean=0 and std=1 (original mean: {mean:.1f})"
                elif transform_type == "log":
                    transformed = np.log1p(np.maximum(arr, 0))
                    desc = "Applied natural log (log(1+x)) to reduce positive skew"
                elif transform_type == "min_max":
                    min_v, max_v = np.min(arr), np.max(arr)
                    transformed = (arr - min_v) / ((max_v - min_v) if max_v != min_v else 1.0)
                    desc = f"Rescaled values to [0.0, 1.0] interval (min: {min_v:.1f}, max: {max_v:.1f})"
                else:
                    transformed = arr
                    desc = "Identity"

                df[new_col_name] = transformed
                preview = _make_data_preview(df, 5)

                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=True,
                        summary=f"Created transformed column {new_col_name}. {desc}.",
                        data_preview=preview,
                        metrics=[
                            MetricItem(label="New Feature", value=new_col_name, description="Created column", status="good"),
                            MetricItem(label="New Mean", value=round(float(np.mean(transformed)), 3)),
                            MetricItem(label="New Std Dev", value=round(float(np.std(transformed)), 3)),
                        ],
                    )
                )
            except Exception as e:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="Transformation failed.",
                        error=str(e),
                    )
                )

        # 7. MATPLOTLIB SCATTER PLOT & TRENDLINE
        elif module_id == "matplotlib-scatter-plot":
            if df is None:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="No dataset loaded.",
                        error="Please add a Load Dataset block first.",
                    )
                )
                continue

            x_col = str(_get_setting(block, "x_column", "marketing_spend")).strip()
            y_col = str(_get_setting(block, "y_column", "sales")).strip()
            title = str(_get_setting(block, "title", f"{x_col} vs {y_col}")).strip()
            show_trendline = str(_get_setting(block, "show_trendline", "yes")).lower() in ["yes", "true", "1"]

            if x_col not in df.columns or y_col not in df.columns:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary=f"Columns {x_col} or {y_col} not found.",
                        error=f"Available columns: {', '.join(df.columns)}",
                    )
                )
                continue

            try:
                x_vals = pd.to_numeric(df[x_col], errors="coerce").fillna(0).to_numpy()
                y_vals = pd.to_numeric(df[y_col], errors="coerce").fillna(0).to_numpy()

                fig, ax = plt.subplots(figsize=(7, 4.5), dpi=140)
                ax.scatter(x_vals, y_vals, color="#0f766e", alpha=0.8, edgecolors="#115e59", s=65, label="Data Observations")

                corr_coeff = float(np.corrcoef(x_vals, y_vals)[0, 1]) if len(x_vals) > 1 else 0.0

                if show_trendline and len(x_vals) > 1:
                    slope, intercept = np.polyfit(x_vals, y_vals, 1)
                    x_line = np.linspace(np.min(x_vals), np.max(x_vals), 100)
                    y_line = slope * x_line + intercept
                    ax.plot(x_line, y_line, color="#e11d48", linewidth=2.5, linestyle="--", label=f"Trendline (slope={slope:.2f})")

                ax.set_title(title, pad=12)
                ax.set_xlabel(x_col)
                ax.set_ylabel(y_col)
                ax.grid(True, linestyle=":", alpha=0.6)
                ax.legend(loc="upper left", frameon=True)
                fig.tight_layout()

                chart_b64 = _fig_to_base64(fig)
                corr_strength = "Strong Positive" if corr_coeff > 0.7 else "Moderate" if corr_coeff > 0.4 else "Weak"

                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=True,
                        summary=f"Generated scatter plot with correlation r = {corr_coeff:.3f} ({corr_strength}).",
                        chart_base64=chart_b64,
                        metrics=[
                            MetricItem(label="Pearson Correlation (r)", value=round(corr_coeff, 3), description="Linear association metric", status="good" if abs(corr_coeff) > 0.6 else "neutral"),
                            MetricItem(label="Relationship Strength", value=corr_strength, description="Strength of linear correlation"),
                            MetricItem(label="Data Points Plotted", value=len(x_vals), description="Number of scatter points"),
                        ],
                    )
                )
            except Exception as e:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="Scatter plot generation failed.",
                        error=str(e),
                    )
                )

        # 8. MATPLOTLIB BAR CHART
        elif module_id == "matplotlib-bar-chart":
            if df is None:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="No dataset loaded.",
                        error="Please add a Load Dataset block first.",
                    )
                )
                continue

            cat_col = str(_get_setting(block, "category_column", "region")).strip()
            val_col = str(_get_setting(block, "value_column", "sales")).strip()
            title = str(_get_setting(block, "title", f"Total {val_col} by {cat_col}")).strip()

            if cat_col not in df.columns or val_col not in df.columns:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary=f"Columns {cat_col} or {val_col} not found.",
                        error=f"Available columns: {', '.join(df.columns)}",
                    )
                )
                continue

            try:
                chart_data = df.groupby(cat_col)[val_col].sum().sort_values(ascending=False)

                fig, ax = plt.subplots(figsize=(7, 4.5), dpi=140)
                colors = ["#0f766e", "#0284c7", "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"]
                bar_colors = [colors[i % len(colors)] for i in range(len(chart_data))]

                bars = ax.bar(chart_data.index.astype(str), chart_data.values, color=bar_colors, width=0.6, edgecolor="#334155", linewidth=0.8)

                for bar in bars:
                    height = bar.get_height()
                    ax.annotate(
                        f"{height:,.0f}" if height >= 1000 else f"{height:.1f}",
                        xy=(bar.get_x() + bar.get_width() / 2, height),
                        xytext=(0, 4),
                        textcoords="offset points",
                        ha="center",
                        va="bottom",
                        fontsize=9,
                        fontweight="bold",
                    )

                ax.set_title(title, pad=14)
                ax.set_xlabel(cat_col)
                ax.set_ylabel(f"Total {val_col}")
                ax.grid(axis="y", linestyle=":", alpha=0.7)
                plt.xticks(rotation=15 if len(chart_data) > 4 else 0)
                fig.tight_layout()

                chart_b64 = _fig_to_base64(fig)
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=True,
                        summary=f"Plotted {len(chart_data)} categories for {cat_col}. Top category: {chart_data.index[0]} with {chart_data.values[0]:,.1f}.",
                        chart_base64=chart_b64,
                        metrics=[
                            MetricItem(label="Top Category", value=str(chart_data.index[0]), description="Highest aggregate value", status="good"),
                            MetricItem(label="Top Value", value=round(float(chart_data.values[0]), 2), description="Magnitude of leader"),
                            MetricItem(label="Total Categories", value=len(chart_data)),
                        ],
                    )
                )
            except Exception as e:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="Bar chart generation failed.",
                        error=str(e),
                    )
                )

        # 9. MATPLOTLIB HISTOGRAM
        elif module_id == "matplotlib-histogram":
            if df is None:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="No dataset loaded.",
                        error="Please add a Load Dataset block first.",
                    )
                )
                continue

            col = str(_get_setting(block, "column", "sales")).strip()
            bins = int(_get_setting(block, "bins", 10))
            title = str(_get_setting(block, "title", f"Distribution of {col}")).strip()

            if col not in df.columns:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary=f"Column {col} not found.",
                        error=f"Available columns: {', '.join(df.columns)}",
                    )
                )
                continue

            try:
                vals = pd.to_numeric(df[col], errors="coerce").dropna().to_numpy()
                fig, ax = plt.subplots(figsize=(7, 4.5), dpi=140)

                n, bins_edges, patches = ax.hist(vals, bins=bins, color="#2563eb", edgecolor="#1e40af", alpha=0.75, rwidth=0.9)
                ax.axvline(np.mean(vals), color="#e11d48", linestyle="--", linewidth=2, label=f"Mean: {np.mean(vals):.1f}")
                ax.axvline(np.median(vals), color="#10b981", linestyle=":", linewidth=2, label=f"Median: {np.median(vals):.1f}")

                ax.set_title(title, pad=12)
                ax.set_xlabel(col)
                ax.set_ylabel("Frequency Count")
                ax.grid(axis="y", linestyle=":", alpha=0.7)
                ax.legend(frameon=True)
                fig.tight_layout()

                chart_b64 = _fig_to_base64(fig)
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=True,
                        summary=f"Generated histogram for {col} across {bins} bins.",
                        chart_base64=chart_b64,
                        metrics=[
                            MetricItem(label="Observations", value=len(vals)),
                            MetricItem(label="Mean", value=round(float(np.mean(vals)), 2)),
                            MetricItem(label="Standard Deviation", value=round(float(np.std(vals)), 2)),
                        ],
                    )
                )
            except Exception as e:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="Histogram generation failed.",
                        error=str(e),
                    )
                )

        # 10. MATPLOTLIB LINE CHART
        elif module_id == "matplotlib-line-chart":
            if df is None:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="No dataset loaded.",
                        error="Please add a Load Dataset block first.",
                    )
                )
                continue

            x_col = str(_get_setting(block, "x_column", "store_footfall")).strip()
            y_col = str(_get_setting(block, "y_column", "sales")).strip()
            title = str(_get_setting(block, "title", f"{y_col} vs {x_col}")).strip()

            if x_col not in df.columns or y_col not in df.columns:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary=f"Columns {x_col} or {y_col} not found.",
                        error=f"Available columns: {', '.join(df.columns)}",
                    )
                )
                continue

            try:
                sorted_df = df.sort_values(by=x_col).reset_index(drop=True)
                fig, ax = plt.subplots(figsize=(7, 4.5), dpi=140)

                ax.plot(sorted_df[x_col], sorted_df[y_col], color="#0f766e", marker="o", markersize=6, linewidth=2.2, label=y_col)
                ax.set_title(title, pad=12)
                ax.set_xlabel(x_col)
                ax.set_ylabel(y_col)
                ax.grid(True, linestyle=":", alpha=0.7)
                ax.legend(frameon=True)
                fig.tight_layout()

                chart_b64 = _fig_to_base64(fig)
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=True,
                        summary=f"Generated line chart for {y_col} ordered along {x_col}.",
                        chart_base64=chart_b64,
                    )
                )
            except Exception as e:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="Line chart generation failed.",
                        error=str(e),
                    )
                )

        # 11. MATPLOTLIB CORRELATION HEATMAP
        elif module_id == "matplotlib-correlation-heatmap":
            if df is None:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="No dataset loaded.",
                        error="Please add a Load Dataset block first.",
                    )
                )
                continue

            title = str(_get_setting(block, "title", "Feature Correlation Matrix")).strip()
            num_df = df.select_dtypes(include=[np.number])
            if num_df.shape[1] < 2:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="Not enough numeric columns for correlation matrix.",
                        error="Requires at least 2 numeric features.",
                    )
                )
                continue

            try:
                corr_matrix = num_df.corr()
                fig, ax = plt.subplots(figsize=(6.5, 5.5), dpi=140)

                cax = ax.matshow(corr_matrix, cmap="coolwarm", vmin=-1, vmax=1)
                fig.colorbar(cax, fraction=0.046, pad=0.04)

                cols = list(corr_matrix.columns)
                ax.set_xticks(range(len(cols)))
                ax.set_yticks(range(len(cols)))
                ax.set_xticklabels(cols, rotation=45, ha="left", fontsize=9, fontweight="semibold")
                ax.set_yticklabels(cols, fontsize=9, fontweight="semibold")

                for i in range(len(cols)):
                    for j in range(len(cols)):
                        val = corr_matrix.iloc[i, j]
                        ax.text(
                            j,
                            i,
                            f"{val:.2f}",
                            ha="center",
                            va="center",
                            color="white" if abs(val) > 0.6 else "black",
                            fontweight="bold",
                            fontsize=9,
                        )

                ax.set_title(title, pad=32)
                fig.tight_layout()

                chart_b64 = _fig_to_base64(fig)
                max_corr = 1.0
                if len(cols) > 1:
                    max_corr = float(corr_matrix.values[np.triu_indices_from(corr_matrix, k=1)].max())
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=True,
                        summary=f"Computed correlation matrix for {len(cols)} numeric features.",
                        chart_base64=chart_b64,
                        metrics=[
                            MetricItem(label="Evaluated Features", value=len(cols)),
                            MetricItem(label="Max Correlation", value=f"{max_corr:.2f}", description="Maximum pairwise correlation", status="good"),
                        ],
                    )
                )
            except Exception as e:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="Correlation heatmap generation failed.",
                        error=str(e),
                    )
                )

        # 12. SCIKIT-LEARN LINEAR REGRESSION
        elif module_id == "sklearn-regression":
            if df is None:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="No dataset loaded.",
                        error="Please add a Load Dataset block first.",
                    )
                )
                continue

            feature_col_raw = str(_get_setting(block, "feature_column", "marketing_spend")).strip()
            target_col = str(_get_setting(block, "target_column", "sales")).strip()
            test_size = float(_get_setting(block, "test_size", 0.2))

            feature_cols = [c.strip() for c in feature_col_raw.split(",") if c.strip()]
            missing_cols = [f for f in feature_cols + [target_col] if f not in df.columns]
            if missing_cols:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary=f"Columns {', '.join(missing_cols)} not found.",
                        error=f"Available columns: {', '.join(df.columns)}",
                    )
                )
                continue

            try:
                X = df[feature_cols].copy().apply(pd.to_numeric, errors="coerce").fillna(0)
                y = pd.to_numeric(df[target_col], errors="coerce").fillna(0)

                X_train, X_test, y_train, y_test = train_test_split(
                    X, y, test_size=min(max(test_size, 0.1), 0.5), random_state=42
                )

                model = LinearRegression()
                model.fit(X_train, y_train)

                y_pred = model.predict(X_test)
                r2 = float(r2_score(y_test, y_pred))
                mae = float(mean_absolute_error(y_test, y_pred))
                mse = float(mean_squared_error(y_test, y_pred))
                rmse = float(np.sqrt(mse))

                fig, ax = plt.subplots(figsize=(7, 4.5), dpi=140)
                ax.scatter(y_test, y_pred, color="#0f766e", alpha=0.85, s=70, edgecolors="#115e59", label="Test Predictions")

                all_vals = np.concatenate([y_test.to_numpy(), y_pred])
                min_v, max_v = np.min(all_vals), np.max(all_vals)
                margin = (max_v - min_v) * 0.05
                ax.plot([min_v - margin, max_v + margin], [min_v - margin, max_v + margin], "r--", linewidth=2, label="Ideal Fit (100% Accuracy)")

                ax.set_title(f"Linear Regression: Actual vs. Predicted ({target_col})", pad=12)
                ax.set_xlabel(f"Actual {target_col}")
                ax.set_ylabel(f"Predicted {target_col}")
                ax.grid(True, linestyle=":", alpha=0.6)
                ax.legend(frameon=True)
                fig.tight_layout()

                chart_b64 = _fig_to_base64(fig)

                coef_str = ", ".join([f"{coef:.2f} * {col}" for coef, col in zip(model.coef_, feature_cols)])
                equation = f"{target_col} = {model.intercept_:.2f} + {coef_str}"

                metrics = [
                    MetricItem(label="R2 Score (Goodness-of-Fit)", value=round(r2, 4), description="Proportion of variance explained (1.0 is perfect)", status="good" if r2 > 0.75 else "neutral" if r2 > 0.4 else "attention"),
                    MetricItem(label="Root Mean Squared Error (RMSE)", value=round(rmse, 2), description="Average prediction deviation in original units"),
                    MetricItem(label="Mean Absolute Error (MAE)", value=round(mae, 2), description="Average absolute error"),
                    MetricItem(label="Train / Test Split", value=f"{len(X_train)} / {len(X_test)}", description=f"{int((1-test_size)*100)}% train / {int(test_size*100)}% test"),
                ]
                logs = [
                    "Trained Scikit-Learn Linear Regression model:",
                    f"Equation: {equation}",
                    f"R2 Score on unseen test data: {r2:.4f}",
                    f"MAE: {mae:.2f} | RMSE: {rmse:.2f}",
                ]
                overall_insights.append(f"Linear Regression achieved R2 = {r2:.3f} predicting {target_col}. Fit formula: {equation}")

                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=True,
                        summary=f"Linear Regression Model trained. R2 Score: {r2:.3f}. Fit Equation: {equation}",
                        logs=logs,
                        chart_base64=chart_b64,
                        metrics=metrics,
                    )
                )
            except Exception as e:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="Model training failed.",
                        error=str(e),
                    )
                )

        # 13. SCIKIT-LEARN CLASSIFICATION & DECISION TREE
        elif module_id == "sklearn-classification":
            if df is None:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="No dataset loaded.",
                        error="Please add a Load Dataset block first.",
                    )
                )
                continue

            feature_col_raw = str(_get_setting(block, "feature_columns", "tenure_months, monthly_charges, support_tickets")).strip()
            target_col = str(_get_setting(block, "target_column", "churned")).strip()
            max_depth = int(_get_setting(block, "max_depth", 3))

            feature_cols = [c.strip() for c in feature_col_raw.split(",") if c.strip()]
            missing_cols = [f for f in feature_cols + [target_col] if f not in df.columns]
            if missing_cols:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary=f"Columns {', '.join(missing_cols)} not found.",
                        error=f"Available columns: {', '.join(df.columns)}",
                    )
                )
                continue

            try:
                X = df[feature_cols].copy().apply(pd.to_numeric, errors="coerce").fillna(0)
                y_raw = df[target_col].astype(str)

                classes = sorted(y_raw.unique())
                class_to_idx = {c: i for i, c in enumerate(classes)}
                y = y_raw.map(class_to_idx)

                X_train, X_test, y_train, y_test = train_test_split(
                    X, y, test_size=0.25, random_state=42
                )

                clf = DecisionTreeClassifier(max_depth=max_depth, random_state=42)
                clf.fit(X_train, y_train)

                y_pred = clf.predict(X_test)
                accuracy = float(accuracy_score(y_test, y_pred))
                f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))

                cm = confusion_matrix(y_test, y_pred)

                fig, ax = plt.subplots(figsize=(6, 4.5), dpi=140)
                cax = ax.matshow(cm, cmap="Blues")
                fig.colorbar(cax)

                ax.set_xticks(range(len(classes)))
                ax.set_yticks(range(len(classes)))
                ax.set_xticklabels(classes, fontsize=10, fontweight="bold")
                ax.set_yticklabels(classes, fontsize=10, fontweight="bold")

                for i in range(len(classes)):
                    for j in range(len(classes)):
                        ax.text(
                            j,
                            i,
                            str(cm[i, j]),
                            ha="center",
                            va="center",
                            color="white" if cm[i, j] > cm.max() / 2 else "black",
                            fontweight="bold",
                            fontsize=12,
                        )

                ax.set_title(f"Confusion Matrix ({target_col} Classification)", pad=24)
                ax.set_xlabel("Predicted Class", labelpad=10)
                ax.set_ylabel("True / Actual Class")
                fig.tight_layout()

                chart_b64 = _fig_to_base64(fig)

                importances = sorted(
                    zip(feature_cols, clf.feature_importances_), key=lambda x: x[1], reverse=True
                )
                top_feature = importances[0][0] if importances else "N/A"

                imp_strings = [f"{f}: {imp:.2f}" for f, imp in importances]
                imp_summary = ", ".join(imp_strings)

                metrics = [
                    MetricItem(label="Accuracy Score", value=f"{round(accuracy * 100, 1)}%", description="Percentage of correct predictions", status="good" if accuracy > 0.8 else "neutral"),
                    MetricItem(label="Weighted F1-Score", value=round(f1, 3), description="Harmonic mean of precision and recall"),
                    MetricItem(label="Top Predictor Feature", value=top_feature, description=f"Importance: {round(importances[0][1]*100, 1)}%" if importances else ""),
                    MetricItem(label="Classes Evaluated", value=", ".join(classes)),
                ]
                logs = [
                    f"Trained Decision Tree Classifier (max_depth={max_depth}):",
                    f"Accuracy: {accuracy*100:.1f}%, F1: {f1:.3f}",
                    f"Feature Importances: {imp_summary}",
                ]
                overall_insights.append(f"Decision Tree achieved {accuracy*100:.1f}% accuracy on {target_col}. Most influential feature: {top_feature}")

                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=True,
                        summary=f"Classifier trained with {accuracy * 100:.1f}% accuracy on test split. Top predictor: {top_feature}.",
                        logs=logs,
                        chart_base64=chart_b64,
                        metrics=metrics,
                    )
                )
            except Exception as e:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="Classification model failed.",
                        error=str(e),
                    )
                )

        # 14. SCIKIT-LEARN K-MEANS CLUSTERING
        elif module_id == "sklearn-clustering":
            if df is None:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="No dataset loaded.",
                        error="Please add a Load Dataset block first.",
                    )
                )
                continue

            feat_x = str(_get_setting(block, "feature_x", "marketing_spend")).strip()
            feat_y = str(_get_setting(block, "feature_y", "store_footfall")).strip()
            n_clusters = int(_get_setting(block, "n_clusters", 3))

            if feat_x not in df.columns or feat_y not in df.columns:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary=f"Columns {feat_x} or {feat_y} not found.",
                        error=f"Available columns: {', '.join(df.columns)}",
                    )
                )
                continue

            try:
                X_cluster = df[[feat_x, feat_y]].copy().apply(pd.to_numeric, errors="coerce").fillna(0)
                kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
                cluster_labels = kmeans.fit_predict(X_cluster)

                df["cluster_label"] = cluster_labels

                fig, ax = plt.subplots(figsize=(7, 4.5), dpi=140)
                colors = ["#0f766e", "#e11d48", "#2563eb", "#d97706", "#7c3aed"]

                for c in range(n_clusters):
                    mask = cluster_labels == c
                    ax.scatter(
                        X_cluster.loc[mask, feat_x],
                        X_cluster.loc[mask, feat_y],
                        color=colors[c % len(colors)],
                        label=f"Cluster {c + 1} (n={mask.sum()})",
                        s=60,
                        alpha=0.8,
                    )

                centroids = kmeans.cluster_centers_
                ax.scatter(
                    centroids[:, 0],
                    centroids[:, 1],
                    marker="X",
                    s=180,
                    color="#111827",
                    edgecolors="#ffffff",
                    linewidth=1.5,
                    label="Cluster Centroids",
                    zorder=10,
                )

                ax.set_title(f"K-Means Clustering ({n_clusters} Clusters)", pad=12)
                ax.set_xlabel(feat_x)
                ax.set_ylabel(feat_y)
                ax.grid(True, linestyle=":", alpha=0.6)
                ax.legend(frameon=True)
                fig.tight_layout()

                chart_b64 = _fig_to_base64(fig)
                preview = _make_data_preview(df, 5)

                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=True,
                        summary=f"Discovered {n_clusters} clusters. Model inertia (within-cluster sum of squares): {kmeans.inertia_:,.1f}.",
                        chart_base64=chart_b64,
                        data_preview=preview,
                        metrics=[
                            MetricItem(label="Clusters Formed (K)", value=n_clusters),
                            MetricItem(label="Inertia / WCSS", value=f"{kmeans.inertia_:,.0f}", description="Within-cluster sum of squares"),
                            MetricItem(label="Observations Clustered", value=len(df)),
                        ],
                    )
                )
            except Exception as e:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="K-Means clustering failed.",
                        error=str(e),
                    )
                )

        # 15. MATPLOTLIB BOX PLOT
        elif module_id == "matplotlib-box-plot":
            if df is None:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="No dataset loaded.",
                        error="Please add a Load Dataset block first.",
                    )
                )
                continue

            val_col = str(_get_setting(block, "value_column", "sales")).strip()
            grp_col = str(_get_setting(block, "group_column", "region")).strip()
            title = str(_get_setting(block, "title", f"Distribution Box Plot ({val_col})")).strip()

            if val_col not in df.columns:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary=f"Column {val_col} not found.",
                        error=f"Available columns: {', '.join(df.columns)}",
                    )
                )
                continue

            try:
                fig, ax = plt.subplots(figsize=(7.5, 4.8), dpi=140)
                if grp_col in df.columns and df[grp_col].nunique() > 1:
                    groups = [group[val_col].dropna().values for _, group in df.groupby(grp_col)]
                    labels = [str(name) for name, _ in df.groupby(grp_col)]
                    bp = ax.boxplot(
                        groups,
                        tick_labels=labels,
                        patch_artist=True,
                        boxprops=dict(facecolor="#0f766e", color="#042f2e", alpha=0.75),
                        medianprops=dict(color="#e11d48", linewidth=2),
                        whiskerprops=dict(color="#042f2e", linewidth=1.2),
                        capprops=dict(color="#042f2e", linewidth=1.2),
                        flierprops=dict(marker="o", color="#e11d48", alpha=0.8, markersize=6),
                    )
                    ax.set_xlabel(grp_col)
                else:
                    vals = df[val_col].dropna().values
                    bp = ax.boxplot(
                        vals,
                        tick_labels=[val_col],
                        patch_artist=True,
                        boxprops=dict(facecolor="#0f766e", color="#042f2e", alpha=0.75),
                        medianprops=dict(color="#e11d48", linewidth=2),
                    )

                ax.set_title(title, pad=12)
                ax.set_ylabel(val_col)
                ax.grid(axis="y", linestyle=":", alpha=0.6)
                fig.tight_layout()

                chart_b64 = _fig_to_base64(fig)
                numeric_vals = pd.to_numeric(df[val_col], errors="coerce").dropna()
                q25, q50, q75 = numeric_vals.quantile([0.25, 0.50, 0.75])
                iqr = q75 - q25

                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=True,
                        summary=f"Rendered Box Plot for {val_col}. Median = {q50:.2f}, IQR = {iqr:.2f}.",
                        chart_base64=chart_b64,
                        metrics=[
                            MetricItem(label="Median (50%)", value=round(q50, 2), status="good"),
                            MetricItem(label="IQR (Q3 - Q1)", value=round(iqr, 2)),
                            MetricItem(label="Lower / Upper Bound", value=f"{round(q25, 1)} / {round(q75, 1)}"),
                        ],
                    )
                )
            except Exception as e:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="Box plot generation failed.",
                        error=str(e),
                    )
                )

        # 16. MATPLOTLIB RESIDUALS PLOT
        elif module_id == "matplotlib-residuals-plot":
            if df is None:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="No dataset loaded.",
                        error="Please add a Load Dataset block first.",
                    )
                )
                continue

            feat_col = str(_get_setting(block, "feature_column", "marketing_spend")).strip()
            target_col = str(_get_setting(block, "target_column", "sales")).strip()
            title = str(_get_setting(block, "title", "Residuals Diagnostics (Error vs Predicted)")).strip()

            if feat_col not in df.columns or target_col not in df.columns:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary=f"Columns {feat_col} or {target_col} not found.",
                        error=f"Available columns: {', '.join(df.columns)}",
                    )
                )
                continue

            try:
                X = df[[feat_col]].copy().apply(pd.to_numeric, errors="coerce").fillna(0)
                y = pd.to_numeric(df[target_col], errors="coerce").fillna(0)

                X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
                lr = LinearRegression().fit(X_train, y_train)
                y_pred = lr.predict(X_test)
                residuals = y_test.to_numpy() - y_pred

                fig, ax = plt.subplots(figsize=(7.5, 4.8), dpi=140)
                ax.scatter(y_pred, residuals, color="#e11d48", alpha=0.85, s=70, edgecolors="#9f1239", label="Error Residuals")
                ax.axhline(0, color="#1e293b", linestyle="--", linewidth=1.8, label="Zero-Error Line")

                ax.set_title(title, pad=12)
                ax.set_xlabel(f"Fitted / Predicted {target_col}")
                ax.set_ylabel(f"Residuals (Actual - Predicted)")
                ax.grid(True, linestyle=":", alpha=0.6)
                ax.legend(frameon=True)
                fig.tight_layout()

                chart_b64 = _fig_to_base64(fig)
                mae_res = float(np.mean(np.abs(residuals)))

                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=True,
                        summary=f"Evaluated linear residuals for {target_col}. Mean Absolute Residual = {mae_res:.2f}.",
                        chart_base64=chart_b64,
                        metrics=[
                            MetricItem(label="Mean Error (Residual)", value=round(float(np.mean(residuals)), 2), description="Should be close to 0", status="good"),
                            MetricItem(label="Mean Absolute Residual", value=round(mae_res, 2)),
                            MetricItem(label="Max Residual Deviation", value=round(float(np.max(np.abs(residuals))), 2)),
                        ],
                    )
                )
            except Exception as e:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="Residuals plot generation failed.",
                        error=str(e),
                    )
                )

        # 17. MATPLOTLIB 2x2 SUBPLOTS DASHBOARD
        elif module_id == "matplotlib-subplots-grid":
            if df is None:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="No dataset loaded.",
                        error="Please add a Load Dataset block first.",
                    )
                )
                continue

            title = str(_get_setting(block, "title", "Executive Performance Dashboard")).strip()
            try:
                fig, axes = plt.subplots(2, 2, figsize=(11.5, 8), dpi=140)
                fig.suptitle(title, fontsize=14, fontweight="bold", y=0.98)

                # Panel 1: Histogram
                if "sales" in df.columns:
                    axes[0, 0].hist(df["sales"].dropna(), bins=8, color="#0f766e", edgecolor="#042f2e", alpha=0.8, rwidth=0.88)
                    axes[0, 0].set_title("1. Sales Distribution", fontsize=10, fontweight="bold")
                    axes[0, 0].grid(axis="y", linestyle=":", alpha=0.5)

                # Panel 2: Scatter & Fit
                if "marketing_spend" in df.columns and "sales" in df.columns:
                    x, y = df["marketing_spend"], df["sales"]
                    axes[0, 1].scatter(x, y, color="#0284c7", alpha=0.8, s=45)
                    slope, intercept = np.polyfit(x, y, 1)
                    x_span = np.linspace(x.min(), x.max(), 50)
                    axes[0, 1].plot(x_span, slope * x_span + intercept, color="#e11d48", linestyle="--", label=f"Slope {slope:.2f}")
                    axes[0, 1].set_title("2. Marketing ROI", fontsize=10, fontweight="bold")
                    axes[0, 1].legend(fontsize=8)
                    axes[0, 1].grid(True, linestyle=":", alpha=0.5)

                # Panel 3: Categorical
                if "region" in df.columns and "sales" in df.columns:
                    reg = df.groupby("region")["sales"].sum() / 1000
                    axes[1, 0].bar(reg.index, reg.values, color="#6366f1", edgecolor="#312e81", width=0.55)
                    axes[1, 0].set_title("3. Regional Revenue ($K)", fontsize=10, fontweight="bold")
                    axes[1, 0].grid(axis="y", linestyle=":", alpha=0.5)

                # Panel 4: Footfall
                if "store_footfall" in df.columns and "sales" in df.columns:
                    axes[1, 1].scatter(df["store_footfall"], df["sales"], color="#10b981", alpha=0.85, s=45)
                    axes[1, 1].set_title("4. Store Footfall vs Sales", fontsize=10, fontweight="bold")
                    axes[1, 1].grid(True, linestyle=":", alpha=0.5)

                fig.tight_layout(rect=[0, 0, 1, 0.96])
                chart_b64 = _fig_to_base64(fig)

                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=True,
                        summary="Rendered unified 2x2 executive multi-panel dashboard graphic.",
                        chart_base64=chart_b64,
                        metrics=[
                            MetricItem(label="Panels Rendered", value="4 (2x2 Grid)", status="good"),
                            MetricItem(label="Master Theme", value="Accessible Seaborn Grid"),
                        ],
                    )
                )
            except Exception as e:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="Subplots dashboard failed.",
                        error=str(e),
                    )
                )

        # 18. SKLEARN STANDARD SCALER
        elif module_id == "sklearn-scaler":
            if df is None:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="No dataset loaded.",
                        error="Please add a Load Dataset block first.",
                    )
                )
                continue

            feat_raw = str(_get_setting(block, "feature_columns", "marketing_spend, store_footfall")).strip()
            feat_cols = [c.strip() for c in feat_raw.split(",") if c.strip() and c.strip() in df.columns]

            if not feat_cols:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="No valid numeric columns found to scale.",
                        error=f"Available columns: {', '.join(df.columns)}",
                    )
                )
                continue

            try:
                scaler = StandardScaler()
                scaled_mat = scaler.fit_transform(df[feat_cols].fillna(0))
                for idx_c, col_name in enumerate(feat_cols):
                    df[f"{col_name}_scaled"] = scaled_mat[:, idx_c]

                preview = _make_data_preview(df, 5)
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=True,
                        summary=f"Standardized {len(feat_cols)} features with zero mean and unit variance.",
                        data_preview=preview,
                        metrics=[
                            MetricItem(label="Scaled Features", value=len(feat_cols), status="good"),
                            MetricItem(label="Target Mean", value="0.00"),
                            MetricItem(label="Target Std Dev", value="1.00"),
                        ],
                    )
                )
            except Exception as e:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="StandardScaler failed.",
                        error=str(e),
                    )
                )

        # 19. SKLEARN RANDOM FOREST REGRESSOR
        elif module_id == "sklearn-random-forest-regressor":
            if df is None:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="No dataset loaded.",
                        error="Please add a Load Dataset block first.",
                    )
                )
                continue

            feat_raw = str(_get_setting(block, "feature_columns", "marketing_spend, store_footfall")).strip()
            target_col = str(_get_setting(block, "target_column", "sales")).strip()
            n_est = int(_get_setting(block, "n_estimators", 50))
            max_d = int(_get_setting(block, "max_depth", 4))
            feat_cols = [c.strip() for c in feat_raw.split(",") if c.strip()]

            if target_col not in df.columns or not any(f in df.columns for f in feat_cols):
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="Features or target column not found.",
                        error=f"Available columns: {', '.join(df.columns)}",
                    )
                )
                continue

            try:
                valid_feats = [f for f in feat_cols if f in df.columns]
                X = df[valid_feats].apply(pd.to_numeric, errors="coerce").fillna(0)
                y = pd.to_numeric(df[target_col], errors="coerce").fillna(0)

                X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
                rf = RandomForestRegressor(n_estimators=n_est, max_depth=max_d, random_state=42)
                rf.fit(X_train, y_train)

                y_pred = rf.predict(X_test)
                r2 = float(r2_score(y_test, y_pred))
                mae = float(mean_absolute_error(y_test, y_pred))

                # Feature importances chart
                fig, ax = plt.subplots(figsize=(7, 4.2), dpi=140)
                ax.barh(valid_feats, rf.feature_importances_, color="#0f766e", edgecolor="#042f2e", height=0.5)
                ax.set_title(f"Random Forest Feature Importances (R² = {r2:.3f})", pad=12)
                ax.set_xlabel("Relative Importance Ratio")
                ax.grid(axis="x", linestyle=":", alpha=0.6)
                fig.tight_layout()

                chart_b64 = _fig_to_base64(fig)
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=True,
                        summary=f"Trained Random Forest ({n_est} trees). Test R² = {r2:.3f}, MAE = {mae:.2f}.",
                        chart_base64=chart_b64,
                        metrics=[
                            MetricItem(label="R² Score", value=round(r2, 4), status="good" if r2 > 0.75 else "neutral"),
                            MetricItem(label="MAE", value=round(mae, 2)),
                            MetricItem(label="Forest Estimators", value=n_est),
                        ],
                    )
                )
            except Exception as e:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="Random Forest Regressor failed.",
                        error=str(e),
                    )
                )

        # 20. SKLEARN RANDOM FOREST CLASSIFIER
        elif module_id == "sklearn-random-forest-classifier":
            if df is None:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="No dataset loaded.",
                        error="Please add a Load Dataset block first.",
                    )
                )
                continue

            feat_raw = str(_get_setting(block, "feature_columns", "tenure_months, monthly_charges, support_tickets")).strip()
            target_col = str(_get_setting(block, "target_column", "churned")).strip()
            n_est = int(_get_setting(block, "n_estimators", 50))
            max_d = int(_get_setting(block, "max_depth", 4))
            feat_cols = [c.strip() for c in feat_raw.split(",") if c.strip()]

            if target_col not in df.columns:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary=f"Target column {target_col} not found.",
                        error=f"Available columns: {', '.join(df.columns)}",
                    )
                )
                continue

            try:
                valid_feats = [f for f in feat_cols if f in df.columns]
                X = df[valid_feats].apply(pd.to_numeric, errors="coerce").fillna(0)
                y_raw = df[target_col].astype(str)
                classes = sorted(y_raw.unique())
                class_to_idx = {c: i for i, c in enumerate(classes)}
                y = y_raw.map(class_to_idx)

                X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)
                rf_clf = RandomForestClassifier(n_estimators=n_est, max_depth=max_d, random_state=42)
                rf_clf.fit(X_train, y_train)

                y_pred = rf_clf.predict(X_test)
                accuracy = float(accuracy_score(y_test, y_pred))
                f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))

                # Confusion Matrix
                cm = confusion_matrix(y_test, y_pred)
                fig, ax = plt.subplots(figsize=(6, 4.5), dpi=140)
                cax = ax.matshow(cm, cmap="Blues")
                fig.colorbar(cax)

                ax.set_xticks(range(len(classes)))
                ax.set_yticks(range(len(classes)))
                ax.set_xticklabels(classes, fontweight="bold")
                ax.set_yticklabels(classes, fontweight="bold")
                for i in range(len(classes)):
                    for j in range(len(classes)):
                        ax.text(j, i, str(cm[i, j]), ha="center", va="center", color="white" if cm[i, j] > cm.max()/2 else "black", fontweight="bold")
                ax.set_title(f"Random Forest Confusion Matrix ({accuracy*100:.1f}% Acc)", pad=24)
                fig.tight_layout()
                chart_b64 = _fig_to_base64(fig)

                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=True,
                        summary=f"Trained Random Forest Classifier ({n_est} trees). Accuracy = {accuracy*100:.1f}%, F1 = {f1:.3f}.",
                        chart_base64=chart_b64,
                        metrics=[
                            MetricItem(label="Accuracy", value=f"{accuracy*100:.1f}%", status="good"),
                            MetricItem(label="Weighted F1", value=round(f1, 3)),
                            MetricItem(label="Forest Trees", value=n_est),
                        ],
                    )
                )
            except Exception as e:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="Random Forest Classifier failed.",
                        error=str(e),
                    )
                )

        # 21. SKLEARN LOGISTIC REGRESSION
        elif module_id == "sklearn-logistic-regression":
            if df is None:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="No dataset loaded.",
                        error="Please add a Load Dataset block first.",
                    )
                )
                continue

            feat_raw = str(_get_setting(block, "feature_columns", "tenure_months, monthly_charges, support_tickets")).strip()
            target_col = str(_get_setting(block, "target_column", "churned")).strip()
            c_val = float(_get_setting(block, "c_param", 1.0))
            feat_cols = [c.strip() for c in feat_raw.split(",") if c.strip()]

            if target_col not in df.columns:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary=f"Target column {target_col} not found.",
                        error=f"Available columns: {', '.join(df.columns)}",
                    )
                )
                continue

            try:
                valid_feats = [f for f in feat_cols if f in df.columns]
                X = df[valid_feats].apply(pd.to_numeric, errors="coerce").fillna(0)
                y_raw = df[target_col].astype(str)
                classes = sorted(y_raw.unique())
                class_to_idx = {c: i for i, c in enumerate(classes)}
                y = y_raw.map(class_to_idx)

                X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)
                lr_clf = LogisticRegression(C=c_val, max_iter=500)
                lr_clf.fit(X_train, y_train)

                y_pred = lr_clf.predict(X_test)
                accuracy = float(accuracy_score(y_test, y_pred))
                f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))

                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=True,
                        summary=f"Trained Logistic Regression (C={c_val}). Test Accuracy: {accuracy*100:.1f}%, F1: {f1:.3f}.",
                        metrics=[
                            MetricItem(label="Accuracy", value=f"{accuracy*100:.1f}%", status="good"),
                            MetricItem(label="Weighted F1", value=round(f1, 3)),
                            MetricItem(label="Regularization (C)", value=c_val),
                        ],
                    )
                )
            except Exception as e:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="Logistic Regression failed.",
                        error=str(e),
                    )
                )

        # 22. SKLEARN PCA
        elif module_id == "sklearn-pca":
            if df is None:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="No dataset loaded.",
                        error="Please add a Load Dataset block first.",
                    )
                )
                continue

            feat_raw = str(_get_setting(block, "feature_columns", "square_feet, bedrooms, bathrooms, year_built, price")).strip()
            color_by = str(_get_setting(block, "color_by", "region")).strip()
            feat_cols = [c.strip() for c in feat_raw.split(",") if c.strip() and c.strip() in df.columns]

            # If user dataset has different columns, fallback to all available numeric columns in df
            if len(feat_cols) < 2:
                num_cols = list(df.select_dtypes(include=[np.number]).columns)
                if len(num_cols) >= 2:
                    feat_cols = num_cols[:6]

            if len(feat_cols) < 2:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="PCA requires at least 2 numeric features.",
                        error=f"Available columns: {', '.join(df.columns)}",
                    )
                )
                continue


            try:
                X_pca = df[feat_cols].select_dtypes(include=[np.number]).fillna(0)
                X_scaled = StandardScaler().fit_transform(X_pca)
                pca = PCA(n_components=2)
                coords = pca.fit_transform(X_scaled)
                var_exp = pca.explained_variance_ratio_

                df["PC1"] = coords[:, 0]
                df["PC2"] = coords[:, 1]

                fig, ax = plt.subplots(figsize=(7.5, 4.8), dpi=140)
                if color_by in df.columns and df[color_by].nunique() > 1:
                    for grp_name, group in df.groupby(color_by):
                        ax.scatter(group["PC1"], group["PC2"], label=str(grp_name), alpha=0.85, s=65)
                    ax.legend(title=color_by)
                else:
                    ax.scatter(df["PC1"], df["PC2"], color="#0f766e", alpha=0.8, s=65)

                ax.set_title(f"PCA 2D Projection ({var_exp.sum()*100:.1f}% Variance Explained)", pad=12)
                ax.set_xlabel(f"Principal Component 1 ({var_exp[0]*100:.1f}% var)")
                ax.set_ylabel(f"Principal Component 2 ({var_exp[1]*100:.1f}% var)")
                ax.grid(True, linestyle=":", alpha=0.6)
                fig.tight_layout()

                chart_b64 = _fig_to_base64(fig)
                preview = _make_data_preview(df, 5)

                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=True,
                        summary=f"Projected {len(feat_cols)} dimensions to 2D. Preserved variance: {var_exp.sum()*100:.1f}%.",
                        chart_base64=chart_b64,
                        data_preview=preview,
                        metrics=[
                            MetricItem(label="Total Variance Explained", value=f"{var_exp.sum()*100:.1f}%", status="good"),
                            MetricItem(label="PC1 Variance", value=f"{var_exp[0]*100:.1f}%"),
                            MetricItem(label="PC2 Variance", value=f"{var_exp[1]*100:.1f}%"),
                        ],
                    )
                )
            except Exception as e:
                results.append(
                    BlockExecutionResult(
                        block_id=block.id,
                        module_id=module_id,
                        title=module.title,
                        package=module.package,
                        category=module.category,
                        success=False,
                        summary="PCA reduction failed.",
                        error=str(e),
                    )
                )

    exec_time = (time.time() - start_time) * 1000.0
    summary_insight = " | ".join(overall_insights) if overall_insights else "Pipeline executed successfully."

    return ExecuteResponse(
        success=all(r.success for r in results) if results else True,
        results=results,
        execution_time_ms=round(exec_time, 2),
        summary_insight=summary_insight,
        notes=notes,
    )


def execute_custom_python_code(request: CustomCodeExecuteRequest) -> CustomCodeExecuteResponse:
    start_time = time.time()
    
    # 1. Close any lingering figures
    plt.close("all")
    
    # 2. Dataset resolution
    dataset_name = request.dataset_name or "sales_marketing.csv"
    try:
        if request.custom_csv and request.custom_csv.strip():
            default_df = pd.read_csv(io.StringIO(request.custom_csv))
        else:
            p = os.path.join(DATASET_DIR, dataset_name)
            if os.path.exists(p):
                default_df = pd.read_csv(p)
            else:
                default_df = pd.read_csv(os.path.join(DATASET_DIR, "sales_marketing.csv"))
    except Exception:
        default_df = pd.DataFrame()

    original_read_csv = pd.read_csv

    def patched_read_csv(filepath_or_buffer, *args, **kwargs):
        if request.custom_csv and request.custom_csv.strip() and isinstance(filepath_or_buffer, str):
            return original_read_csv(io.StringIO(request.custom_csv), *args, **kwargs)
        if isinstance(filepath_or_buffer, str) and not os.path.isabs(filepath_or_buffer):
            selected_candidate = os.path.join(DATASET_DIR, dataset_name)
            if os.path.exists(selected_candidate):
                return original_read_csv(selected_candidate, *args, **kwargs)
            candidate = os.path.join(DATASET_DIR, filepath_or_buffer)
            if os.path.exists(candidate):
                return original_read_csv(candidate, *args, **kwargs)
        return original_read_csv(filepath_or_buffer, *args, **kwargs)

    # 3. Capture stdout & stderr
    stdout_buf = io.StringIO()
    stderr_buf = io.StringIO()
    old_stdout = sys.stdout
    old_stderr = sys.stderr

    exec_globals = {
        "__name__": "__main__",
        "__doc__": None,
        "pd": pd,
        "np": np,
        "plt": plt,
        "matplotlib": matplotlib,
        "df": default_df.copy(),
        "LinearRegression": LinearRegression,
        "DecisionTreeClassifier": DecisionTreeClassifier,
        "RandomForestRegressor": RandomForestRegressor,
        "RandomForestClassifier": RandomForestClassifier,
        "LogisticRegression": LogisticRegression,
        "StandardScaler": StandardScaler,
        "PCA": PCA,
        "KMeans": KMeans,
        "train_test_split": train_test_split,
        "r2_score": r2_score,
        "mean_squared_error": mean_squared_error,
        "mean_absolute_error": mean_absolute_error,
        "accuracy_score": accuracy_score,
        "f1_score": f1_score,
        "confusion_matrix": confusion_matrix,
    }

    error_msg: Optional[str] = None
    success = True

    try:
        pd.read_csv = patched_read_csv
        sys.stdout = stdout_buf
        sys.stderr = stderr_buf
        exec(request.code, exec_globals)
    except Exception as e:
        success = False
        error_msg = f"{type(e).__name__}: {str(e)}"
        tb_lines = traceback.format_exc().splitlines()
        clean_tb = "\n".join([line for line in tb_lines if "executor.py" not in line])
        stderr_buf.write(f"\n{clean_tb}\n")
    finally:
        sys.stdout = old_stdout
        sys.stderr = old_stderr
        pd.read_csv = original_read_csv

    # 4. Extract generated charts
    charts_b64: list[str] = []
    fig_nums = plt.get_fignums()
    for num in fig_nums:
        fig = plt.figure(num)
        b64 = _fig_to_base64(fig)
        charts_b64.append(b64)
    plt.close("all")

    primary_chart = charts_b64[-1] if charts_b64 else None

    # 5. Extract preview if DataFrame exists
    preview = None
    final_df = exec_globals.get("df")
    if isinstance(final_df, pd.DataFrame) and len(final_df) > 0:
        preview = _make_data_preview(final_df, min(5, len(final_df)))

    exec_time = round((time.time() - start_time) * 1000.0, 2)

    return CustomCodeExecuteResponse(
        success=success,
        stdout=stdout_buf.getvalue().strip(),
        stderr=stderr_buf.getvalue().strip(),
        chart_base64=primary_chart,
        charts_base64=charts_b64,
        execution_time_ms=exec_time,
        data_preview=preview,
        error=error_msg,
    )
