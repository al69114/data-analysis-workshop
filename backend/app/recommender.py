import io
import os
import warnings
from typing import Any

import pandas as pd

from app.executor import DATASET_DIR, _make_data_preview
from app.models import (
    AnalysisSuggestion,
    ColumnProfile,
    DatasetProfileRequest,
    DatasetProfileResponse,
    ProjectBlock,
)


def _load_dataset(request: DatasetProfileRequest) -> pd.DataFrame:
    if request.custom_csv and request.custom_csv.strip():
        return pd.read_csv(io.StringIO(request.custom_csv))

    path = os.path.join(DATASET_DIR, request.dataset_name)
    if not os.path.exists(path):
        raise FileNotFoundError(f"Dataset not found: {request.dataset_name}")
    return pd.read_csv(path)


def _infer_type(series: pd.Series) -> str:
    if pd.api.types.is_numeric_dtype(series):
        return "numeric"
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        parsed = pd.to_datetime(series, errors="coerce")
    if parsed.notna().mean() >= 0.8:
        return "datetime"
    unique_ratio = series.nunique(dropna=True) / max(len(series), 1)
    if unique_ratio <= 0.5:
        return "categorical"
    return "text"


def _profile_columns(df: pd.DataFrame) -> list[ColumnProfile]:
    return [
        ColumnProfile(
            name=str(column),
            inferred_type=_infer_type(df[column]),
            missing_values=int(df[column].isna().sum()),
            unique_values=int(df[column].nunique(dropna=True)),
        )
        for column in df.columns
    ]


def _block(module_id: str, settings: dict[str, Any]) -> ProjectBlock:
    return ProjectBlock(id=f"suggestion-{module_id}", module_id=module_id, settings=settings)


def _first(columns: list[str], candidates: list[str], fallback: str | None = None) -> str | None:
    lowered = {column.lower(): column for column in columns}
    for candidate in candidates:
        if candidate.lower() in lowered:
            return lowered[candidate.lower()]
    return fallback or (columns[0] if columns else None)


def suggest_analyses(df: pd.DataFrame) -> list[AnalysisSuggestion]:
    columns = [str(c) for c in df.columns]
    numeric_cols = [str(c) for c in df.select_dtypes(include="number").columns]
    categorical_cols = [c for c in columns if c not in numeric_cols]

    season_col = _first(columns, ["season", "year", "date"], categorical_cols[0] if categorical_cols else None)
    goals_col = _first(columns, ["goals", "g", "sales", "revenue"], numeric_cols[0] if numeric_cols else None)
    assists_col = _first(columns, ["assists", "a"], numeric_cols[1] if len(numeric_cols) > 1 else goals_col)
    apps_col = _first(columns, ["appearances", "apps", "matches", "m"], numeric_cols[0] if numeric_cols else None)
    club_col = _first(columns, ["club", "team", "region", "category"], categorical_cols[0] if categorical_cols else None)

    suggestions: list[AnalysisSuggestion] = []

    if season_col and goals_col:
        suggestions.append(
            AnalysisSuggestion(
                id="trend-over-time",
                title=f"Track {goals_col} across {season_col}",
                chart_type="Line chart",
                difficulty="Beginner",
                why="Ordered seasons are best read as a trend, so learners can see peaks, dips, and long-run trajectory.",
                recommended_blocks=[
                    _block("pandas-load-csv", {"file_name": "ronaldo_all_seasons.csv", "preview_rows": 5}),
                    _block("matplotlib-line-chart", {"x_column": season_col, "y_column": goals_col, "title": f"{goals_col} by {season_col}"}),
                ],
                steps=[
                    "Load the CSV and inspect column names.",
                    f"Use {season_col} as the x-axis and {goals_col} as the y-axis.",
                    "Rotate labels if seasons overlap.",
                    "Annotate the highest season to make the insight obvious.",
                ],
            )
        )

    if club_col and goals_col:
        suggestions.append(
            AnalysisSuggestion(
                id="category-comparison",
                title=f"Compare total {goals_col} by {club_col}",
                chart_type="Bar chart",
                difficulty="Beginner",
                why="Bar charts are efficient when the question is which category contributed the most.",
                recommended_blocks=[
                    _block("pandas-groupby", {"group_column": club_col, "agg_column": goals_col, "agg_func": "sum"}),
                    _block("matplotlib-bar-chart", {"category_column": club_col, "value_column": goals_col, "title": f"Total {goals_col} by {club_col}"}),
                ],
                steps=[
                    f"Group the data by {club_col}.",
                    f"Aggregate {goals_col} with sum.",
                    "Sort bars descending before plotting.",
                    "Use direct labels when there are only a few categories.",
                ],
            )
        )

    if apps_col and goals_col and apps_col != goals_col:
        suggestions.append(
            AnalysisSuggestion(
                id="relationship-analysis",
                title=f"Explore relationship between {apps_col} and {goals_col}",
                chart_type="Scatter plot",
                difficulty="Intermediate",
                why="Scatter plots help learners reason about correlation, outliers, and whether a regression model is sensible.",
                recommended_blocks=[
                    _block("matplotlib-scatter-plot", {"x_column": apps_col, "y_column": goals_col, "title": f"{apps_col} vs {goals_col}", "show_trendline": "yes"}),
                    _block("sklearn-regression", {"feature_column": apps_col, "target_column": goals_col, "test_size": 0.2}),
                ],
                steps=[
                    f"Plot {apps_col} against {goals_col}.",
                    "Add a trendline only after checking that the relationship is roughly linear.",
                    "Train a simple regression model.",
                    "Use residuals to explain what the model misses.",
                ],
            )
        )

    if goals_col:
        suggestions.append(
            AnalysisSuggestion(
                id="distribution-check",
                title=f"Check distribution of {goals_col}",
                chart_type="Histogram",
                difficulty="Beginner",
                why="Distribution checks reveal typical seasons, unusual outliers, and whether the metric is skewed.",
                recommended_blocks=[
                    _block("numpy-summary", {"column": goals_col}),
                    _block("matplotlib-histogram", {"column": goals_col, "bins": 8, "title": f"Distribution of {goals_col}"}),
                ],
                steps=[
                    f"Compute mean, median, standard deviation, and IQR for {goals_col}.",
                    "Plot a histogram with a modest bin count first.",
                    "Compare mean and median to discuss skew.",
                    "Adjust bins to show how chart choices affect interpretation.",
                ],
            )
        )

    if assists_col and goals_col and assists_col != goals_col:
        suggestions.append(
            AnalysisSuggestion(
                id="contribution-mix",
                title=f"Compare {goals_col} and {assists_col}",
                chart_type="Multi-metric view",
                difficulty="Intermediate",
                why="Comparing output metrics side by side encourages learners to ask richer questions than a single total.",
                recommended_blocks=[
                    _block("numpy-summary", {"column": goals_col}),
                    _block("numpy-summary", {"column": assists_col}),
                ],
                steps=[
                    f"Summarize {goals_col} and {assists_col} separately.",
                    "Create a derived contribution metric such as goals plus assists.",
                    "Plot the combined metric over time.",
                    "Discuss when a derived feature is useful and when it hides detail.",
                ],
            )
        )

    return suggestions[:5]


def profile_dataset(request: DatasetProfileRequest) -> DatasetProfileResponse:
    df = _load_dataset(request)
    return DatasetProfileResponse(
        dataset_name=request.dataset_name,
        preview=_make_data_preview(df, 6),
        columns=_profile_columns(df),
        suggestions=suggest_analyses(df),
        notes=[
            "Suggestions are generated from column names and inferred data types.",
            "Start with a preview and one simple chart before introducing model blocks.",
        ],
    )
