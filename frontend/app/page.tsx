"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  Code2,
  Copy,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileCode2,
  Flame,
  Grid,
  GripVertical,
  HelpCircle,
  Info,
  Layers,
  Lightbulb,
  Maximize2,
  Minimize2,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Sliders,
  Sparkles,
  Table2,
  Terminal,
  TrendingUp,
  Wand2,
  Zap,
} from "lucide-react";

// ==========================================
// TYPES & DATA STRUCTURES
// ==========================================

type DataPreview = {
  columns: string[];
  rows: Record<string, any>[];
  total_rows: number;
  total_columns: number;
};

type ColumnProfile = {
  name: string;
  inferred_type: "numeric" | "categorical" | "datetime" | "text";
  missing_values: number;
  unique_values: number;
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

type CodeBlock = {
  id: string;
  blockNumber: string;
  title: string;
  description: string;
  codeSnippet: string;
  badge: string;
  parametersNote?: string;
};

type ParameterInfo = {
  param: string;
  currentValue: string;
  options: string;
  description: string;
  codeSnippet: string;
};

type AnalysisVariant = {
  id: string;
  title: string;
  tag: string;
  description: string;
  code: string;
};

type StepDefinition = {
  stepNumber: number;
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  objective: string;
  library: "pandas" | "matplotlib" | "scikit-learn";
  starterCode: string;
  blocks: CodeBlock[];
  parameters: ParameterInfo[];
  variants: AnalysisVariant[];
  proTips: string[];
};

// Defaults to the deployed backend so the app works out of the box in
// production even if the env var below isn't set on Vercel. Set
// NEXT_PUBLIC_BACKEND_URL (must be NEXT_PUBLIC_-prefixed to reach the
// browser) only if you need to point at a different backend, e.g.
// http://localhost:8000 for local development against a local server.
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://ronaldo-workshop-backend.vercel.app";

// Human-readable title-case label for each swappable metric, used by the
// "Quick Tweak: Metric" buttons to keep chart titles/axis labels in sync
// with whichever column is actually being plotted.
const METRIC_LABELS: Record<string, string> = {
  goals: "Goals",
  assists: "Assists",
  goals_per_game: "Goals Per Game",
};

// Shared by the first lesson and its deliberately messy practice variation.
const RONALDO_CLEANING_CODE = `# Inspect first: missing cells, column types, and duplicate rows
raw_df = df.copy()
print("--- Before Cleaning ---")
print(df.dtypes)
print("Missing cells by column:")
print(df.isna().sum())
print("Exact duplicate rows:", int(df.duplicated().sum()))

# Normalize labels and convert invalid numeric text to missing values
for column in ["season", "club"]:
    df[column] = df[column].astype("string").str.strip().replace("", pd.NA)
count_columns = ["appearances", "goals", "assists"]
for column in count_columns:
    df[column] = pd.to_numeric(df[column], errors="coerce")

# Remove exact duplicates so a season is not counted twice
duplicate_count = int(df.duplicated().sum())
df = df.drop_duplicates().copy()

# Keep incomplete records for review; do not invent goals by filling with zero
required_columns = ["season", "club"] + count_columns
missing_required = df[required_columns].isna().any(axis=1)
review_df = df.loc[missing_required].copy()
df = df.loc[~missing_required].copy()
print("Duplicate rows removed:", duplicate_count)
print("Incomplete rows set aside for review:", len(review_df))
if not review_df.empty:
    print(review_df[required_columns].to_string(index=False))

# Stop and investigate invalid counts or conflicting season records
if df.empty:
    raise ValueError("No complete seasons remain. Review the source data.")
if (df[count_columns] < 0).any().any() or (df[count_columns] % 1 != 0).any().any():
    raise ValueError("Counts must be non-negative whole numbers. Review the source.")
if (df["appearances"] == 0).any():
    raise ValueError("Zero appearances: review these rows before calculating goals per game.")
if df["season"].duplicated().any():
    raise ValueError("Conflicting rows for one season. Check the source before merging them.")

# Recalculate derived metrics from the validated counts and order seasons
df[count_columns] = df[count_columns].astype(int)
df["goal_contributions"] = df["goals"] + df["assists"]
df["goals_per_game"] = (df["goals"] / df["appearances"]).round(2)
df = df.sort_values("season").reset_index(drop=True)
print("Rows before / after:", len(raw_df), "/", len(df))
print("Charts below use only the retained seasons; review exclusions before reporting totals.")
`;

// ==========================================
// 5 PROGRESSIVE STEPS WITH STEP-BY-STEP BLOCKS
// ==========================================

const STEPS_DATA: StepDefinition[] = [
  {
    stepNumber: 1,
    id: "step-1-inspect",
    title: "1. Load, Inspect & Clean Ronaldo Data",
    subtitle: "Inspect types, handle missing values and duplicates, then visualize",
    badge: "Pandas & Data Cleaning",
    library: "pandas",
    objective: "Inspect and clean season records before plotting: normalize labels, handle missing values, remove exact duplicates, and validate counts.",
    starterCode: `# Step 1: Load, Inspect and Clean Ronaldo Career Data
import pandas as pd
import matplotlib.pyplot as plt

# 1. Load the Ronaldo career dataset
df = pd.read_csv("ronaldo_all_seasons.csv")

${RONALDO_CLEANING_CODE}

print("=== Cristiano Ronaldo: 23 Seasons Career Dataset ===")
print("Total Seasons Tracked:", len(df))
print("Total Career Goals:   ", int(df["goals"].sum()))
print("Total Career Assists: ", int(df["assists"].sum()))
print("Career Goals / Game:  ", round(df["goals"].sum() / df["appearances"].sum(), 2))

print("")
print("--- First 5 Seasons (Early Sporting & Man United Era) ---")
print(df[["season", "club", "appearances", "goals", "assists", "goals_per_game"]].head(5).to_string(index=False))

# 2. Exploratory Inspection Charts
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10.5, 4.2))

# Subplot 1: Distribution of seasonal goal tallies
ax1.hist(df["goals"], bins=7, color="#0f766e", edgecolor="#134e4a", alpha=0.85)
ax1.set_title("Distribution of Seasonal Goals", fontsize=11, fontweight="bold")
ax1.set_xlabel("Goals Scored in a Season")
ax1.set_ylabel("Number of Seasons")
ax1.grid(axis="y", linestyle=":", alpha=0.6)

# Subplot 2: Total Goals grouped by Club
club_totals = df.groupby("club")["goals"].sum().sort_values(ascending=True)
bars = ax2.barh(club_totals.index, club_totals.values, color="#2563eb", edgecolor="#1d4ed8", height=0.55)
ax2.set_title("Total Goals by Club", fontsize=11, fontweight="bold")
ax2.set_xlabel("Total Goals")
ax2.grid(axis="x", linestyle=":", alpha=0.5)

for b in bars:
    w = b.get_width()
    ax2.text(w + 6, b.get_y() + b.get_height()/2, f"{int(w)}", va="center", fontsize=9, fontweight="bold")

fig.suptitle("Cristiano Ronaldo: Initial Data Inspection & Spread", fontsize=12, fontweight="bold")
fig.tight_layout()
plt.show()
`,
    blocks: [
      {
        id: "b1-load",
        blockNumber: "Block 1.1",
        title: "Load Dataset with Pandas",
        description: "Imports pandas and reads the 23-season Ronaldo dataset from disk into a DataFrame.",
        badge: "Ingestion",
        codeSnippet: `import pandas as pd\n\n# Load dataset\ndf = pd.read_csv("ronaldo_all_seasons.csv")\nprint(f"Loaded {len(df)} seasons of data.")`,
        parametersNote: 'Change "ronaldo_all_seasons.csv" to your custom CSV file path.',
      },
      {
        id: "b1-clean",
        blockNumber: "Block 1.2",
        title: "Inspect, Clean & Validate Records",
        description: "Run after loading the CSV and before summaries or charts. Check missing values, normalize text, remove exact duplicates, and set incomplete records aside for review.",
        badge: "Data Cleaning",
        codeSnippet: `import pandas as pd\n\n${RONALDO_CLEANING_CODE}`,
        parametersNote: "The supplied CSV is already clean. Try the Messy Data Practice variation to see changes in the console. Keep raw_df and review_df so exclusions can be investigated.",
      },
      {
        id: "b1-summary",
        blockNumber: "Block 1.3",
        title: "Inspect Key Career Metrics",
        description: "Computes total career goals, assists, matches, and prints the first 5 seasons.",
        badge: "Summary",
        codeSnippet: `print("Total Goals:", int(df["goals"].sum()))\nprint("Total Assists:", int(df["assists"].sum()))\nprint(df[["season", "club", "goals", "assists"]].head(5))`,
        parametersNote: 'Change .head(5) to .head(10) or .tail(5) to inspect different eras.',
      },
      {
        id: "b1-visual",
        blockNumber: "Block 1.4",
        title: "Exploratory Distribution Plot",
        description: "Creates a 2-panel figure showing the goal frequency histogram and club volume breakdown.",
        badge: "Visual Check",
        codeSnippet: `import matplotlib.pyplot as plt\n\nfig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4))\nax1.hist(df["goals"], bins=7, color="#0f766e", edgecolor="#134e4a")\nax1.set_title("Goals Distribution")\nax2.barh(df.groupby("club")["goals"].sum().index, df.groupby("club")["goals"].sum().values, color="#2563eb")\nax2.set_title("Goals by Club")\nplt.tight_layout()\nplt.show()`,
        parametersNote: "Tweak bins=7 (5 to 12) or change color hexes.",
      },
    ],
    parameters: [
      {
        param: "required_columns",
        currentValue: "season, club, appearances, goals, assists",
        options: "Choose the fields needed for your analysis",
        description: "Records missing these fields are set aside for review. Missing goals are unknown, not zero; recover them from the source before reporting complete totals.",
        codeSnippet: `print(review_df[required_columns])`,
      },
      {
        param: "head(N)",
        currentValue: "5",
        options: "5, 10, 23",
        description: "Controls how many initial rows are previewed from the top of the dataset.",
        codeSnippet: `print(df.head(10))`,
      },
      {
        param: "bins=N",
        currentValue: "7",
        options: "5, 7, 10, 15",
        description: "Number of histogram bins to group seasonal goal tallies into.",
        codeSnippet: `ax1.hist(df['goals'], bins=10, color='#0f766e')`,
      },
      {
        param: "club filter",
        currentValue: "All clubs",
        options: "'Real Madrid', 'Manchester United', 'Juventus', 'Al Nassr'",
        description: "Filter rows for one specific club to isolate stats for a particular career chapter.",
        codeSnippet: `madrid_df = df[df['club'] == 'Real Madrid']\nprint(madrid_df[['season', 'goals', 'assists']])`,
      },
    ],
    variants: [
      {
        id: "v1-cleaning-practice",
        title: "Messy Data Practice",
        tag: "Cleaning Exercise",
        description: "Practice on an in-memory copy with a duplicate season, whitespace, a missing goal count, and invalid assist text. See which rows are retained or need review.",
        code: `import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("ronaldo_all_seasons.csv")

# Teaching exercise only: intentionally introduce errors into an in-memory copy.
# The source CSV on disk is unchanged. Reset Starter reloads the original data.
df = pd.concat([df, df.iloc[[0]]], ignore_index=True)
df.loc[1, "club"] = "  Manchester United  "
df.loc[2, "goals"] = float("nan")
df["assists"] = df["assists"].astype("object")
df.loc[3, "assists"] = "unknown"
print("PRACTICE DATA: errors were deliberately introduced for this exercise.")

${RONALDO_CLEANING_CODE}

print("--- Retained Seasons (Practice Data) ---")
print(df[["season", "club", "goals", "assists"]].to_string(index=False))

fig, ax = plt.subplots(figsize=(9, 4))
labels = ["Retained", "Exact duplicates removed", "Incomplete: review"]
counts = [len(df), duplicate_count, len(review_df)]
bars = ax.barh(labels, counts, color=["#0f766e", "#2563eb", "#d97706"])
ax.bar_label(bars, padding=4)
ax.set_xlim(0, max(counts) + 3)
ax.set_title("Practice Data: What Happened to Each Record?")
ax.set_xlabel("Number of rows")
ax.grid(axis="x", linestyle=":", alpha=0.4)
fig.tight_layout()
plt.show()
`,
      },
      {
        id: "v1-top-scoring",
        title: "Top 5 Scoring Seasons",
        tag: "Sorted View",
        description: "Rank the top 5 scoring seasons in a horizontal bar chart, with goal labels and a summary table.",
        code: `import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("ronaldo_all_seasons.csv")

print("=== Ronaldo's Top 5 Goalscoring Seasons ===")
top5 = df.sort_values(by="goals", ascending=False)[["season", "club", "appearances", "goals", "goals_per_game"]].head(5)
print(top5.to_string(index=False))

peak = top5.iloc[0]
print("")
print(f"All-time Peak: {peak['season']} at {peak['club']} with {peak['goals']} goals in {peak['appearances']} matches!")

# Keep the highest-scoring season at the top; bars start at zero.
fig, ax = plt.subplots(figsize=(9, 4.5))
labels = top5["season"] + " · " + top5["club"]
colors = ["#d97706"] + ["#0f766e"] * (len(top5) - 1)
bars = ax.barh(labels, top5["goals"], color=colors, height=0.6)
ax.invert_yaxis()
ax.bar_label(bars, padding=5, fmt="%.0f")
ax.set_xlim(0, top5["goals"].max() * 1.15)
ax.set_title("Ronaldo's Top 5 Scoring Seasons", fontweight="bold", pad=12)
ax.set_xlabel("Goals scored in a season")
ax.set_ylabel("Season and club")
ax.grid(axis="x", linestyle=":", alpha=0.4)
ax.set_axisbelow(True)
fig.tight_layout()
plt.show()
`,
      },
      {
        id: "v1-madrid-filter",
        title: "Real Madrid Era Breakdown",
        tag: "Filtered View",
        description: "Filter the 9 Real Madrid seasons, plot goals and assists over time, and print the era totals.",
        code: `import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("ronaldo_all_seasons.csv")
madrid = df[df["club"] == "Real Madrid"].sort_values("season")

print("=== Cristiano Ronaldo — Real Madrid Era (2009-2018) ===")
print(madrid[["season", "appearances", "goals", "assists", "goals_per_game"]].to_string(index=False))
print("")
print("--- Real Madrid Totals ---")
print("Matches Played:     ", int(madrid["appearances"].sum()))
print("Total Goals Scored: ", int(madrid["goals"].sum()))
print("Average Goals/Game: ", round(madrid["goals"].sum() / madrid["appearances"].sum(), 2))

# Plot only the filtered era in chronological order.
fig, ax = plt.subplots(figsize=(9, 4.5))
ax.plot(madrid["season"], madrid["goals"], marker="o", color="#0f766e", linewidth=2.5, label="Goals")
ax.plot(madrid["season"], madrid["assists"], marker="s", color="#2563eb", linestyle="--", linewidth=2, label="Assists")
ax.set_title("Ronaldo at Real Madrid: Goals and Assists by Season", fontweight="bold", pad=12)
ax.set_xlabel("Season")
ax.set_ylabel("Goals / assists (count)")
ax.set_ylim(bottom=0)
ax.tick_params(axis="x", rotation=45)
ax.grid(axis="y", linestyle=":", alpha=0.4)
ax.legend()
fig.tight_layout()
plt.show()
`,
      },
    ],
    proTips: [
      "Use df.dtypes, df.isna().sum(), and df.duplicated().sum() together: summary statistics alone do not check every data quality issue.",
      "Zero goals and missing goals mean different things. Review missing counts instead of automatically filling them with a mean or zero.",
      "The practice variation changes only an in-memory copy. Each lesson reloads the original CSV; cleaning here does not modify the source file.",
      "The dataset spans 23 seasons from 2002/03 (Sporting CP) to 2024/25 (Al Nassr).",
    ],
  },
  {
    stepNumber: 2,
    id: "step-2-first-chart",
    title: "2. Your First Matplotlib Chart",
    subtitle: "Create a clean line plot tracking goals across seasons with labels & grid",
    badge: "Matplotlib 101",
    library: "matplotlib",
    objective: "Transform tabular season statistics into a professional, publication-quality Matplotlib line visual.",
    starterCode: `# Step 2: Create Your First Matplotlib Line Chart
import pandas as pd
import matplotlib.pyplot as plt

# 1. Load data
df = pd.read_csv("ronaldo_all_seasons.csv")

# 2. Initialize figure & axes canvas
fig, ax = plt.subplots(figsize=(10, 5))

# 3. Plot trajectory: Season vs Goals
ax.plot(
    df["season"],
    df["goals"],
    marker="o",
    color="#0f766e",
    linewidth=2.6,
    markersize=6,
    label="Goals Scored"
)

# 4. Add clear titles & axis labels
ax.set_title("Cristiano Ronaldo: Career Goals by Season (2002 - 2025)", fontsize=13, fontweight="bold", pad=12)
ax.set_xlabel("Season", fontsize=10, fontweight="semibold")
ax.set_ylabel("Goals", fontsize=10, fontweight="semibold")

# 5. Styling: rotate season labels so they don't overlap
plt.xticks(rotation=60, ha="right", fontsize=9)
ax.grid(True, linestyle="--", alpha=0.5)
ax.legend(loc="upper left", frameon=True)

fig.tight_layout()
plt.show()
`,
    blocks: [
      {
        id: "b2-figure",
        blockNumber: "Block 2.1",
        title: "Setup Canvas with subplots()",
        description: "Creates the figure window and drawing axes with customizable aspect ratio.",
        badge: "Canvas",
        codeSnippet: `import matplotlib.pyplot as plt\nfig, ax = plt.subplots(figsize=(10, 5))`,
        parametersNote: "figsize=(width, height) in inches. Use (12, 5) for wider timeline plots.",
      },
      {
        id: "b2-plot",
        blockNumber: "Block 2.2",
        title: "Plot Line Series with Markers",
        description: "Draws the season-by-season goal trajectory with circular data points.",
        badge: "Plotting",
        codeSnippet: `ax.plot(df["season"], df["goals"], marker="o", color="#0f766e", linewidth=2.5, label="Goals")`,
        parametersNote: 'Swap df["goals"] for df["assists"] or change marker to "s" (square).',
      },
      {
        id: "b2-styling",
        blockNumber: "Block 2.3",
        title: "Label Axes, Rotate Ticks & Show",
        description: "Adds titles, grid lines, rotates season dates 60 degrees, and renders the visual.",
        badge: "Styling",
        codeSnippet: `import matplotlib.pyplot as plt\n\nax.set_title("Ronaldo Career Goals by Season")\nax.set_xlabel("Season")\nax.set_ylabel("Goals")\nplt.xticks(rotation=60, ha="right")\nax.grid(True, linestyle="--", alpha=0.5)\nax.legend()\nplt.tight_layout()\nplt.show()`,
        parametersNote: "plt.xticks(rotation=60) prevents crowded labels on the X axis.",
      },
    ],
    parameters: [
      {
        param: "figsize=(w, h)",
        currentValue: "(10, 5)",
        options: "(8, 4), (10, 5), (12, 6)",
        description: "Dimensions of the canvas in inches. Increase width for wide timelines.",
        codeSnippet: `fig, ax = plt.subplots(figsize=(12, 5))`,
      },
      {
        param: "y_metric",
        currentValue: "df['goals']",
        options: "df['assists'], df['goal_contributions'], df['goals_per_game']",
        description: "Swap which metric you want to track across his career timeline.",
        codeSnippet: `ax.plot(df['season'], df['assists'], marker='s', color='#2563eb', label='Assists')`,
      },
      {
        param: "color",
        currentValue: "#0f766e",
        options: "'#e11d48' (Crimson), '#2563eb' (Blue), '#d97706' (Amber), '#7c3aed' (Purple)",
        description: "Line and marker color. Customize to fit club or brand colors.",
        codeSnippet: `color="#e11d48"`,
      },
    ],
    variants: [
      {
        id: "v2-bar-chart",
        title: "Switch to Bar Chart",
        tag: "Bar Variant",
        description: "Visualize seasons as discrete vertical bars with his 61-goal record season in gold.",
        code: `import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("ronaldo_all_seasons.csv")

fig, ax = plt.subplots(figsize=(11, 5))

bars = ax.bar(
    df["season"],
    df["goals"],
    color="#0f766e",
    edgecolor="#134e4a",
    width=0.7,
    alpha=0.9,
    label="Goals"
)

# Highlight his record season (61 goals in 2014/15) in gold
peak_idx = df["goals"].idxmax()
bars[peak_idx].set_color("#f59e0b")
bars[peak_idx].set_edgecolor("#b45309")

ax.set_title("Cristiano Ronaldo: Goals Per Season (Gold = 61-Goal Record)", fontsize=13, fontweight="bold")
ax.set_xlabel("Season")
ax.set_ylabel("Goals")
plt.xticks(rotation=60, ha="right")
ax.grid(axis="y", linestyle=":", alpha=0.6)
ax.legend()

fig.tight_layout()
plt.show()
`,
      },
      {
        id: "v2-assists-plot",
        title: "Track Assists Over Time",
        tag: "Metric Swap",
        description: "Swap the Y-axis from goals to assists to evaluate his playmaking evolution.",
        code: `import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("ronaldo_all_seasons.csv")

fig, ax = plt.subplots(figsize=(10, 5))

ax.plot(
    df["season"],
    df["assists"],
    marker="s",
    color="#2563eb",
    linewidth=2.4,
    label="Assists"
)

ax.set_title("Cristiano Ronaldo: Career Assists by Season", fontsize=13, fontweight="bold")
ax.set_xlabel("Season")
ax.set_ylabel("Assists Provided")
plt.xticks(rotation=60, ha="right")
ax.grid(True, linestyle="--", alpha=0.5)
ax.legend(loc="upper right")

fig.tight_layout()
plt.show()
`,
      },
    ],
    proTips: [
      "Always include fig.tight_layout() to prevent axes or labels from being cropped.",
      "Use marker='o' to make discrete points clear when plotting time series.",
    ],
  },
  {
    stepNumber: 3,
    id: "step-3-scikit-learn",
    title: "3. Predictive Modeling with Scikit-Learn",
    subtitle: "Train a Linear Regression model, evaluate R², & predict hypothetical seasons",
    badge: "Machine Learning",
    library: "scikit-learn",
    objective: "Train a Scikit-Learn regression model to learn the relationship between playing time and goals, evaluate model fit, and make predictions.",
    starterCode: `# Step 3: Scikit-Learn Linear Regression & Predictive Diagnostics
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_squared_error

# 1. Load data
df = pd.read_csv("ronaldo_all_seasons.csv")

# 2. Define Features (X) and Target (y)
X = df[["appearances"]].values
y = df["goals"].values

# 3. Train Scikit-Learn Linear Regression Model
model = LinearRegression(fit_intercept=True)
model.fit(X, y)

# 4. Generate Predictions & Evaluate Model
y_pred = model.predict(X)
r2 = r2_score(y, y_pred)
rmse = np.sqrt(mean_squared_error(y, y_pred))
slope = model.coef_[0]
intercept = model.intercept_

print("=== Scikit-Learn Linear Regression Results ===")
print("R² Score (Variance Explained):", round(r2, 3))
print("Root Mean Squared Error (RMSE):", round(rmse, 2), "goals")
print(f"Fitted Equation: Goals = ({round(slope, 2)} × Appearances) + ({round(intercept, 2)})")

# Show the actual numbers plugged in to get R² and RMSE (same residuals, two summaries)
ss_res = np.sum((y - y_pred) ** 2)
ss_tot = np.sum((y - y.mean()) ** 2)
mse = ss_res / len(y)

print("")
print("--- How R² and RMSE were calculated ---")
print(f"SS_res (model's squared error):    {ss_res:,.2f}")
print(f"SS_tot (baseline's squared error): {ss_tot:,.2f}")
print(f"R²   = 1 - (SS_res / SS_tot) = 1 - ({ss_res:,.2f} / {ss_tot:,.2f}) = {r2:.3f}")
print(f"MSE  = SS_res / n = {ss_res:,.2f} / {len(y)} = {mse:.2f}")
print(f"RMSE = sqrt(MSE)  = sqrt({mse:.2f}) = {rmse:.2f}")

# 5. Predict for a hypothetical 50-game season
hypothetical_apps = 50
predicted_goals = model.predict([[hypothetical_apps]])[0]
print("")
print(f"Prediction for a {hypothetical_apps}-match season: {round(predicted_goals, 1)} goals")

# 6. Plot Data Points + Regression Trendline
fig, ax = plt.subplots(figsize=(9, 5.5))

# Scatter actual seasons
ax.scatter(df["appearances"], df["goals"], color="#0f766e", s=80, alpha=0.85, label="Actual Seasons", zorder=3)

# Plot smooth regression line
sort_idx = np.argsort(df["appearances"].values)
ax.plot(
    df["appearances"].values[sort_idx],
    y_pred[sort_idx],
    color="#e11d48",
    linewidth=2.6,
    label=f"Regression Fit (R² = {r2:.2f})"
)

# Highlight his single best-ever season, found dynamically (not hardcoded)
peak_idx = df["goals"].idxmax()
peak = df.loc[peak_idx]
ax.annotate(
    f"Career High: {int(peak['goals'])} Goals\\n({peak['season']} · {peak['club']})",
    xy=(peak["appearances"], peak["goals"]),
    xytext=(-95, -10),
    textcoords="offset points",
    ha="center",
    fontsize=9,
    fontweight="bold",
    color="#991b1b",
    linespacing=1.4,
    arrowprops=dict(arrowstyle="->", color="#991b1b", lw=1.4),
)

# Extra headroom so the callout never crowds the title above it
ax.set_ylim(0, df["goals"].max() * 1.15)

ax.set_title("Scikit-Learn: Predicting Ronaldo's Goals from Appearances", fontsize=13, fontweight="bold", pad=12)
ax.set_xlabel("Appearances in Season", fontsize=10, fontweight="semibold")
ax.set_ylabel("Goals Scored", fontsize=10, fontweight="semibold")
ax.legend(loc="upper left", frameon=True)
ax.grid(True, linestyle=":", alpha=0.55)

fig.tight_layout()
plt.show()
`,
    blocks: [
      {
        id: "b5-load",
        blockNumber: "Block 3.1",
        title: "Load the Season Dataset",
        description: "Reads the 23-season Ronaldo CSV into a DataFrame — the raw table everything else in this step is built from.",
        badge: "Ingestion",
        codeSnippet: `import pandas as pd\n\ndf = pd.read_csv("ronaldo_all_seasons.csv")`,
        parametersNote: "Change the filename to point the same pipeline at a different CSV.",
      },
      {
        id: "b5-data",
        blockNumber: "Block 3.2",
        title: "Define Feature Matrix (X) & Target (y)",
        description: "Splits the DataFrame into what the model reads (X) and what it's trying to learn (y).",
        badge: "Features",
        codeSnippet: `X = df[["appearances"]].values\ny = df["goals"].values`,
        parametersNote: "Double brackets [[\"appearances\"]] keep X 2D (rows × features) — scikit-learn requires that shape even with one feature.",
      },
      {
        id: "b5-train",
        blockNumber: "Block 3.3",
        title: "Train the Regression Model",
        description: "Fits the least-squares line through all 23 (appearances, goals) points — the actual training step.",
        badge: "Training",
        codeSnippet: `from sklearn.linear_model import LinearRegression\n\nmodel = LinearRegression(fit_intercept=True)\nmodel.fit(X, y)`,
        parametersNote: "fit_intercept=True lets the line also solve for a constant term instead of being forced through the origin.",
      },
      {
        id: "b5-evaluate",
        blockNumber: "Block 3.4",
        title: "Evaluate Fit: R² & RMSE",
        description: "Re-runs the model on its own training data to score how well the line fits: R² = 0.327 (about a third of season-to-season variance explained), RMSE = 13.76 goals (typical prediction error).",
        badge: "Evaluation",
        codeSnippet: `import numpy as np\nfrom sklearn.metrics import r2_score, mean_squared_error\n\ny_pred = model.predict(X)\nr2 = r2_score(y, y_pred)\nrmse = np.sqrt(mean_squared_error(y, y_pred))\n\n# Show the actual numbers plugged in\nss_res = np.sum((y - y_pred) ** 2)\nss_tot = np.sum((y - y.mean()) ** 2)\nprint(f"R² = 1 - ({ss_res:.2f} / {ss_tot:.2f}) = {r2:.3f}")\nprint(f"RMSE = sqrt({ss_res:.2f} / {len(y)}) = {rmse:.2f}")`,
        parametersNote: "R² is unitless (0–1); RMSE is in goals, which reads more intuitively out loud.",
      },
      {
        id: "b5-predict",
        blockNumber: "Block 3.5",
        title: "Predict a Hypothetical Season",
        description: "The actual payoff: asks the trained model what a 50-appearance season should produce. Real output: 40.5 predicted goals.",
        badge: "Inference",
        codeSnippet: `hypothetical_apps = 50\npredicted_goals = model.predict([[hypothetical_apps]])[0]`,
        parametersNote: "Change 50 to 35, 45, or 55 to test other hypothetical seasons.",
      },
      {
        id: "b5-plot",
        blockNumber: "Block 3.6",
        title: "Plot Fit + Career-High Callout",
        description: "Draws the real points and the fitted line together, then adds an arrow pointing at his actual record season — found dynamically via idxmax(), never hardcoded.",
        badge: "Visualization",
        codeSnippet: `import numpy as np\n\nax.scatter(df["appearances"], df["goals"], s=80, alpha=0.85, label="Actual Seasons")\nsort_idx = np.argsort(df["appearances"].values)\nax.plot(df["appearances"].values[sort_idx], y_pred[sort_idx], linewidth=2.6, label=f"Regression Fit (R² = {r2:.2f})")\n\npeak_idx = df["goals"].idxmax()\npeak = df.loc[peak_idx]\nax.annotate(f"Career High: {int(peak['goals'])} Goals", xy=(peak["appearances"], peak["goals"]), arrowprops=dict(arrowstyle="->"))`,
        parametersNote: "Points far above the line are seasons the model underestimates — direct visual evidence of the 0.327 R².",
      },
    ],
    parameters: [
      {
        param: "hypothetical_apps",
        currentValue: "50",
        options: "35, 45, 50, 55",
        description: "Input match count to forecast goals for an unseen season.",
        codeSnippet: `model.predict([[45]])[0]`,
      },
      {
        param: "fit_intercept",
        currentValue: "True",
        options: "True, False",
        description: "Whether to calculate the intercept or force the line through origin (0, 0).",
        codeSnippet: `model = LinearRegression(fit_intercept=False)`,
      },
      {
        param: "How R² & RMSE Are Derived",
        currentValue: "R² = 0.327, RMSE = 13.76 goals",
        options: "Same 23 residuals, two different summaries",
        description: "Both come from the model's residuals (actual goals − predicted goals) across all 23 seasons. R² compares the model's total squared error against a naive baseline that always guesses the average; RMSE averages those squared errors and square-roots back into real goal units.",
        codeSnippet: `slope     = Σ(x-x̄)(y-ȳ) / Σ(x-x̄)²   → 1.44
intercept = ȳ - slope·x̄               → -31.65

SS_res = Σ(actual - predicted)²        → 4353.22
SS_tot = Σ(actual - mean)²             → 6465.74
R²     = 1 - (SS_res / SS_tot)         → 0.327

MSE  = SS_res / n                      → 189.27
RMSE = √MSE                            → 13.76 goals`,
      },
    ],
    variants: [
      {
        id: "v5-multi-feature",
        title: "Multiple Regression (Appearances + Assists)",
        tag: "Advanced ML",
        description: "Use both appearances and assists simultaneously to explain goal output.",
        code: `import pandas as pd
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score

df = pd.read_csv("ronaldo_all_seasons.csv")

# 2 Features: Appearances and Assists
X = df[["appearances", "assists"]].values
y = df["goals"].values

model = LinearRegression()
model.fit(X, y)
y_pred = model.predict(X)
r2 = r2_score(y, y_pred)

print("=== Multiple Linear Regression ===")
print("R² Score:               ", round(r2, 3))
print("Appearances Coefficient:", round(model.coef_[0], 2))
print("Assists Coefficient:    ", round(model.coef_[1], 2))
print("Intercept:              ", round(model.intercept_, 2))

# Predict for 50 matches and 15 assists
sample_pred = model.predict([[50, 15]])[0]
print("")
print("Prediction for (50 matches, 15 assists):", round(sample_pred, 1), "goals")

# With 2 features there's no single X-axis to draw a fit line against, so the
# standard diagnostic is Actual vs. Predicted: a perfect model would place
# every point exactly on the dashed diagonal.
fig, ax = plt.subplots(figsize=(7.5, 5.5))

ax.scatter(y, y_pred, color="#0f766e", s=75, alpha=0.85, edgecolors="#115e59", label="Each Season", zorder=3)

lims = [min(y.min(), y_pred.min()) - 3, max(y.max(), y_pred.max()) + 3]
ax.plot(lims, lims, color="#e11d48", linestyle="--", linewidth=2, label="Perfect Prediction")
ax.set_xlim(lims)
ax.set_ylim(lims)

ax.set_title(f"Multiple Regression: Actual vs. Predicted Goals (R² = {r2:.2f})", fontsize=13, fontweight="bold", pad=12)
ax.set_xlabel("Actual Goals", fontsize=10, fontweight="semibold")
ax.set_ylabel("Predicted Goals", fontsize=10, fontweight="semibold")
ax.legend(loc="upper left", frameon=True)
ax.grid(True, linestyle=":", alpha=0.55)

fig.tight_layout()
plt.show()
`,
      },
    ],
    proTips: [
      "In Scikit-Learn, features X must always be 2-dimensional (rows, columns).",
      "Notice the slope coefficient: it shows roughly how many goals Ronaldo scores per additional appearance.",
    ],
  },
];

// Fallback Ronaldo preview rows so the UI immediately displays data
const FALLBACK_RONALDO_ROWS = [
  { season: "2002/03", club: "Sporting CP", appearances: 31, goals: 5, assists: 6, goal_contributions: 11, goals_per_game: 0.16 },
  { season: "2003/04", club: "Manchester United", appearances: 40, goals: 6, assists: 7, goal_contributions: 13, goals_per_game: 0.15 },
  { season: "2004/05", club: "Manchester United", appearances: 50, goals: 9, assists: 8, goal_contributions: 17, goals_per_game: 0.18 },
  { season: "2005/06", club: "Manchester United", appearances: 47, goals: 12, assists: 8, goal_contributions: 20, goals_per_game: 0.26 },
  { season: "2006/07", club: "Manchester United", appearances: 53, goals: 23, assists: 22, goal_contributions: 45, goals_per_game: 0.43 },
  { season: "2007/08", club: "Manchester United", appearances: 49, goals: 42, assists: 8, goal_contributions: 50, goals_per_game: 0.86 },
  { season: "2008/09", club: "Manchester United", appearances: 53, goals: 26, assists: 12, goal_contributions: 38, goals_per_game: 0.49 },
  { season: "2009/10", club: "Real Madrid", appearances: 35, goals: 33, assists: 12, goal_contributions: 45, goals_per_game: 0.94 },
  { season: "2010/11", club: "Real Madrid", appearances: 54, goals: 53, assists: 16, goal_contributions: 69, goals_per_game: 0.98 },
  { season: "2011/12", club: "Real Madrid", appearances: 55, goals: 60, assists: 15, goal_contributions: 75, goals_per_game: 1.09 },
  { season: "2012/13", club: "Real Madrid", appearances: 55, goals: 55, assists: 13, goal_contributions: 68, goals_per_game: 1.00 },
  { season: "2013/14", club: "Real Madrid", appearances: 47, goals: 51, assists: 14, goal_contributions: 65, goals_per_game: 1.09 },
  { season: "2014/15", club: "Real Madrid", appearances: 54, goals: 61, assists: 22, goal_contributions: 83, goals_per_game: 1.13 },
  { season: "2015/16", club: "Real Madrid", appearances: 48, goals: 51, assists: 15, goal_contributions: 66, goals_per_game: 1.06 },
  { season: "2016/17", club: "Real Madrid", appearances: 46, goals: 42, assists: 12, goal_contributions: 54, goals_per_game: 0.91 },
  { season: "2017/18", club: "Real Madrid", appearances: 44, goals: 44, assists: 8, goal_contributions: 52, goals_per_game: 1.00 },
  { season: "2018/19", club: "Juventus", appearances: 43, goals: 28, assists: 10, goal_contributions: 38, goals_per_game: 0.65 },
  { season: "2019/20", club: "Juventus", appearances: 46, goals: 37, assists: 7, goal_contributions: 44, goals_per_game: 0.80 },
  { season: "2020/21", club: "Juventus", appearances: 44, goals: 36, assists: 4, goal_contributions: 40, goals_per_game: 0.82 },
  { season: "2021/22", club: "Manchester United", appearances: 39, goals: 24, assists: 3, goal_contributions: 27, goals_per_game: 0.62 },
  { season: "2022/23", club: "Man Utd / Al Nassr", appearances: 35, goals: 17, assists: 4, goal_contributions: 21, goals_per_game: 0.49 },
  { season: "2023/24", club: "Al Nassr", appearances: 45, goals: 44, assists: 13, goal_contributions: 57, goals_per_game: 0.98 },
  { season: "2024/25", club: "Al Nassr", appearances: 41, goals: 35, assists: 4, goal_contributions: 39, goals_per_game: 0.85 },
];

export default function Home() {
  // Step navigation state
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const currentStep = STEPS_DATA[activeStepIndex];

  // Code editor state
  const [userCode, setUserCode] = useState<string>(() => STEPS_DATA[0].starterCode);
  const [executingCode, setExecutingCode] = useState<boolean>(false);
  const [codeResult, setCodeResult] = useState<CustomCodeExecuteResponse | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [activeOutputTab, setActiveOutputTab] = useState<"visual" | "terminal" | "data" | "parameters">("visual");
  const [leftNavTab, setLeftNavTab] = useState<"blocks" | "dataset" | "parameters">("blocks");

  // Dataset inspector state
  const [selectedDataset] = useState<string>("ronaldo_all_seasons.csv");

  // Interactive quick parameter tweakers
  const [customColor, setCustomColor] = useState<string>("#0f766e");
  const [customMetric, setCustomMetric] = useState<string>("goals");

  // Handler: Execute code on backend with automatic proxy + direct fallback
  async function runPythonCode(overrideCode?: string) {
    const codeToRun = overrideCode !== undefined ? overrideCode : userCode;
    setExecutingCode(true);

    let lastError: any = null;
    let data: CustomCodeExecuteResponse | null = null;

    try {
      const res = await fetch(`${BACKEND_URL}/execute-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataset_name: selectedDataset,
          code: codeToRun,
        }),
      });

      if (res.ok) {
        data = await res.json();
      } else {
        lastError = new Error(`HTTP ${res.status} from ${BACKEND_URL}`);
      }
    } catch (err: any) {
      lastError = err;
    }

    if (data) {
      setCodeResult(data);
      // Default to visual view so the user immediately sees the visual + console drawer
      setActiveOutputTab("visual");
    } else {
      setCodeResult({
        success: false,
        stdout: "",
        stderr: lastError?.message || `Could not connect to Python execution backend at ${BACKEND_URL}. Please ensure the backend is running and reachable.`,
        charts_base64: [],
        execution_time_ms: 0,
      });
    }

    setExecutingCode(false);
  }

  // Auto-run first step on load
  useEffect(() => {
    runPythonCode(STEPS_DATA[0].starterCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handler: Select step
  function selectStep(stepIdx: number) {
    setActiveStepIndex(stepIdx);
    const step = STEPS_DATA[stepIdx];
    setUserCode(step.starterCode);
    setCustomMetric("goals");
    runPythonCode(step.starterCode);
  }

  // Handler: Insert code block snippet into editor
  function insertBlockSnippet(snippet: string) {
    const updated = userCode.trim() + "\n\n" + snippet;
    setUserCode(updated);
    runPythonCode(updated);
  }

  // Handler: Replace entire editor with block snippet
  function replaceWithBlockSnippet(snippet: string) {
    setUserCode(snippet);
    runPythonCode(snippet);
  }

  // Handler: Load variant
  function loadVariant(variant: AnalysisVariant) {
    setUserCode(variant.code);
    runPythonCode(variant.code);
  }

  // Handler: Reset current step to starter code
  function resetCurrentStep() {
    setUserCode(currentStep.starterCode);
    setCustomMetric("goals");
    runPythonCode(currentStep.starterCode);
  }

  // Handler: Copy code
  function copyToClipboard() {
    navigator.clipboard.writeText(userCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  // Handler: Download Python file
  function downloadScript() {
    const blob = new Blob([userCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentStep.id.replace(/-/g, "_")}.py`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Handler: Apply interactive tweaks into code
  function applyColorTweak(newColor: string) {
    setCustomColor(newColor);
    const hexRegex = /color="#[a-fA-F0-9]{6}"|color='#[a-fA-F0-9]{6}'/g;
    if (hexRegex.test(userCode)) {
      const updated = userCode.replace(hexRegex, `color="${newColor}"`);
      setUserCode(updated);
      runPythonCode(updated);
    }
  }

  function applyMetricSwap(metric: string) {
    if (metric === customMetric) return;
    const prevMetric = customMetric;

    // Swap only the column actually driving the chart (df["<prevMetric>"] or
    // df.groupby(...)["<prevMetric>"]) so unrelated fixed metric references
    // (e.g. a separate "Total Career Assists" line) are left untouched.
    // The quote character is captured and reused (not hardcoded to ") so a
    // single-quoted reference nested inside a double-quoted f-string (e.g.
    // peak['goals']) doesn't get rewritten into a quote clash that breaks
    // Python's f-string grammar.
    const dataRegex = new RegExp(`\\[(["'])${prevMetric}\\1\\]`, "g");

    // Swap the matching human-readable label word in titles/axis labels too.
    const prevLabel = METRIC_LABELS[prevMetric];
    const nextLabel = METRIC_LABELS[metric];
    const labelRegex = new RegExp(`\\b${prevLabel}\\b`, "g");

    const swapSegment = (text: string) =>
      text.replace(dataRegex, (_match, quote: string) => `[${quote}${metric}${quote}]`).replace(labelRegex, nextLabel);

    // The shared data-cleaning block always derives goals_per_game and
    // goal_contributions from the raw "goals" column - it must never be
    // rewritten by the metric toggle, or those formulas become
    // self-referential (goals_per_game / appearances instead of
    // goals / appearances) and silently collapse to near-zero values.
    let updated: string;
    const cleaningIdx = userCode.indexOf(RONALDO_CLEANING_CODE);
    if (cleaningIdx === -1) {
      updated = swapSegment(userCode);
    } else {
      const before = userCode.slice(0, cleaningIdx);
      const cleaning = userCode.slice(cleaningIdx, cleaningIdx + RONALDO_CLEANING_CODE.length);
      const after = userCode.slice(cleaningIdx + RONALDO_CLEANING_CODE.length);
      updated = swapSegment(before) + cleaning + swapSegment(after);
    }

    if (updated !== userCode) {
      setUserCode(updated);
      runPythonCode(updated);
    }
    setCustomMetric(metric);
  }

  // Keyboard shortcut: Cmd/Ctrl + Enter to run code
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        runPythonCode();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [userCode, selectedDataset]);

  return (
    <main className="app-shell">
      {/* ========================================================================= */}
      {/* TOP HEADER: CRISP, PROFESSIONAL TALK BRANDING                            */}
      {/* ========================================================================= */}
      <header className="top-bar">
        <div className="title-area">
          <div className="header-badge-row">
            <span className="eyebrow">Interactive Data Science Studio</span>
          </div>
          <h1>Cristiano Ronaldo: Matplotlib &amp; Scikit-Learn Studio</h1>
          <p className="subtitle">
            A focused 3-step journey: from cleaning and charting real career data to training a Scikit-Learn regression model and predicting future seasons.
          </p>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3-STEP PROGRESS NAVIGATION BAR                                            */}
      {/* ========================================================================= */}
      <nav className="step-progress-nav" aria-label="3-Step Journey">
        <div className="step-nav-header">
          <div className="step-nav-title">
            <Sparkles size={16} className="sparkle-icon" />
            <strong>3-Step Analysis Path:</strong>
            <span className="step-nav-subtitle">Click any step to load code &amp; modular blocks</span>
          </div>
          <span className="active-step-indicator">
            Step {activeStepIndex + 1} of {STEPS_DATA.length}
          </span>
        </div>

        <div className="step-pills-row">
          {STEPS_DATA.map((step, idx) => {
            const isActive = activeStepIndex === idx;
            const isDone = activeStepIndex > idx;
            return (
              <button
                key={step.id}
                type="button"
                className={`step-pill ${isActive ? "active" : ""} ${isDone ? "completed" : ""}`}
                onClick={() => selectStep(idx)}
              >
                <div className="step-number-circle">
                  {isDone ? <Check size={12} /> : idx + 1}
                </div>
                <div className="step-pill-body">
                  <span className="step-pill-title">{step.title.replace(/^\d+\.\s*/, "")}</span>
                  <span className="step-pill-badge">{step.badge}</span>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* 3-COLUMN STUDIO LAYOUT                                                    */}
      {/* Col 1: Step-by-Step Blocks & Dataset | Col 2: Code Editor | Col 3: Visual */}
      {/* ========================================================================= */}
      <div className="studio-layout">

        {/* ──────────────────────────────────────────────────────── */}
        {/* COLUMN 1 (SIDEBAR): MODULAR BLOCKS + DATASET INSPECTOR   */}
        {/* ──────────────────────────────────────────────────────── */}
        <aside className="studio-sidebar">

          {/* Sidebar Nav Switcher: Code Blocks vs Raw Dataset vs Parameters */}
          <div className="sidebar-tab-switcher">
            <button
              type="button"
              className={`sidebar-subtab ${leftNavTab === "blocks" ? "active" : ""}`}
              onClick={() => setLeftNavTab("blocks")}
            >
              <Layers size={14} />
              <span>Step-by-Step Blocks</span>
            </button>
            <button
              type="button"
              className={`sidebar-subtab ${leftNavTab === "dataset" ? "active" : ""}`}
              onClick={() => setLeftNavTab("dataset")}
            >
              <Table2 size={14} />
              <span>Dataset (23 Seasons)</span>
            </button>
            <button
              type="button"
              className={`sidebar-subtab ${leftNavTab === "parameters" ? "active" : ""}`}
              onClick={() => setLeftNavTab("parameters")}
            >
              <Sliders size={14} />
              <span>Parameters</span>
            </button>
          </div>

          {/* TAB A: STEP-BY-STEP CODE BLOCKS BUILDER */}
          {leftNavTab === "blocks" && (
            <div className="sidebar-card blocks-card">
              <div className="sidebar-card-header">
                <Code2 size={15} />
                <strong>Step {currentStep.stepNumber} Code Blocks</strong>
                <span className="recipe-tag">{currentStep.blocks.length} Blocks</span>
              </div>
              <p className="sidebar-card-desc">
                Follow this step-by-step code construction. Click <strong>Insert</strong> to drop a block into your editor:
              </p>

              <div className="code-blocks-list">
                {currentStep.blocks.map((block) => (
                  <div key={block.id} className="code-block-card">
                    <div className="code-block-top">
                      <span className="code-block-badge">{block.blockNumber}</span>
                      <span className="code-block-title">{block.title}</span>
                      <button
                        type="button"
                        className="insert-block-btn"
                        onClick={() => insertBlockSnippet(block.codeSnippet)}
                        title="Append this block to your code"
                      >
                        <Plus size={12} />
                        <span>Insert</span>
                      </button>
                    </div>

                    <p className="code-block-desc">{block.description}</p>

                    <pre className="code-block-preview">
                      <code>{block.codeSnippet}</code>
                    </pre>

                    {block.parametersNote && (
                      <div className="block-param-note">
                        <Info size={11} />
                        <span>{block.parametersNote}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 1-Click Suited-Need Variants */}
              <div className="variants-section">
                <div className="variants-header">
                  <Wand2 size={13} />
                  <strong>Ready-to-Run Analysis Variations:</strong>
                </div>

                <div className="variants-grid">
                  {currentStep.variants.map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      className="variant-btn"
                      onClick={() => loadVariant(variant)}
                    >
                      <div className="variant-btn-top">
                        <span className="variant-title">{variant.title}</span>
                        <span className="variant-tag">{variant.tag}</span>
                      </div>
                      <p className="variant-desc">{variant.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB B: DATASET INSPECTOR */}
          {leftNavTab === "dataset" && (
            <div className="sidebar-card dataset-card">
              <div className="sidebar-card-header">
                <Database size={15} />
                <strong>Ronaldo Career Dataset</strong>
                <span className="data-count-tag">23 Seasons</span>
              </div>

              <p className="sidebar-card-desc">
                Here is the exact dataset your code is messing around with (all 23 seasons from 2002/03 to 2024/25):
              </p>

              <div className="dataset-scroll-wrap">
                <table className="dataset-inline-table">
                  <thead>
                    <tr>
                      <th>Season</th>
                      <th>Club</th>
                      <th>Apps</th>
                      <th>Goals</th>
                      <th>Assists</th>
                      <th>Contr.</th>
                      <th>G/G</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FALLBACK_RONALDO_ROWS.map((row, rIdx) => (
                      <tr key={rIdx}>
                        <td className="font-mono font-bold">{row.season}</td>
                        <td>{row.club}</td>
                        <td>{row.appearances}</td>
                        <td className="cell-highlight">{row.goals}</td>
                        <td>{row.assists}</td>
                        <td>{row.goal_contributions}</td>
                        <td>{row.goals_per_game.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="column-chips-wrap">
                <span className="col-chip"><strong>season</strong> (str)</span>
                <span className="col-chip"><strong>club</strong> (str)</span>
                <span className="col-chip highlight"><strong>goals</strong> (int)</span>
                <span className="col-chip"><strong>assists</strong> (int)</span>
                <span className="col-chip"><strong>goals_per_game</strong> (float)</span>
              </div>
            </div>
          )}

          {/* TAB C: PARAMETERS GUIDE */}
          {leftNavTab === "parameters" && (
            <div className="sidebar-card parameters-card">
              <div className="sidebar-card-header">
                <Sliders size={15} />
                <strong>What Can You Change?</strong>
                <span className="recipe-tag">{currentStep.badge}</span>
              </div>

              <p className="sidebar-card-desc">
                Change these parameters in your code to suit your exact analysis needs:
              </p>

              <div className="parameters-list">
                {currentStep.parameters.map((p, pIdx) => (
                  <div key={pIdx} className="parameter-item">
                    <div className="param-header">
                      <code className="param-name">{p.param}</code>
                      <span className="param-current">current: {p.currentValue}</span>
                    </div>
                    <p className="param-desc">{p.description}</p>
                    <div className="param-options">
                      <span className="param-opt-label">Try options:</span>
                      <span className="param-opt-val">{p.options}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="step-protips-box">
                <div className="protip-header">
                  <Lightbulb size={13} />
                  <strong>Pro Tip:</strong>
                </div>
                <ul className="protip-list">
                  {currentStep.proTips.map((tip, tIdx) => (
                    <li key={tIdx}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

        </aside>

        {/* ──────────────────────────────────────────────────────── */}
        {/* COLUMN 2 (CENTER): PYTHON CODE EDITOR                   */}
        {/* ──────────────────────────────────────────────────────── */}
        <section className="studio-editor-panel">
          <div className="w1-editor-box">

            {/* Editor Top Bar with High Contrast */}
            <div className="editor-top-bar">
              <div className="step-info-badge">
                <span className="step-badge-num">Step {currentStep.stepNumber}</span>
                <span className="step-badge-title">{currentStep.title}</span>
              </div>

              <div className="editor-actions">
                <button
                  type="button"
                  className="editor-btn reset-btn"
                  onClick={resetCurrentStep}
                  title="Reset code to original step starter"
                >
                  <RotateCcw size={13} />
                  <span>Reset Starter</span>
                </button>

                <button
                  type="button"
                  className="editor-btn"
                  onClick={copyToClipboard}
                  title="Copy Python code"
                >
                  {copiedCode ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedCode ? "Copied!" : "Copy"}</span>
                </button>

                <button
                  type="button"
                  className="editor-btn"
                  onClick={downloadScript}
                  title="Download Python script"
                >
                  <Download size={13} />
                  <span>Download .py</span>
                </button>
              </div>
            </div>

            {/* Step Objective Banner */}
            <div className="step-objective-banner">
              <Info size={14} className="banner-icon" />
              <span><strong>Objective:</strong> {currentStep.objective}</span>
            </div>

            {/* Code Textarea Container */}
            <div className="editor-textarea-container">
              <textarea
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                className="w1-code-textarea"
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                placeholder="# Write or edit Python code here..."
              />
            </div>

            {/* Editor Bottom Bar: Interactive Quick Tweaker */}
            <div className="editor-bottom-bar">
              <div className="tweaker-quick-row">
                <span className="tweaker-label">
                  <Sliders size={13} />
                  <span>Quick Tweak:</span>
                </span>

                {/* Color Palette Chips */}
                <div className="color-chips-row">
                  {[
                    { label: "Teal", hex: "#0f766e" },
                    { label: "Crimson", hex: "#e11d48" },
                    { label: "Blue", hex: "#2563eb" },
                    { label: "Amber", hex: "#d97706" },
                    { label: "Purple", hex: "#7c3aed" },
                  ].map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      className={`color-chip-btn ${customColor === c.hex ? "selected" : ""}`}
                      style={{ backgroundColor: c.hex }}
                      onClick={() => applyColorTweak(c.hex)}
                      title={`Change color to ${c.label} (${c.hex})`}
                    />
                  ))}
                </div>

                {/* Metric Quick Switch */}
                <div className="metric-switch-row">
                  <span className="metric-switch-label">Metric:</span>
                  {[
                    { id: "goals", label: "Goals" },
                    { id: "assists", label: "Assists" },
                    { id: "goals_per_game", label: "G/G" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`metric-pill-btn ${customMetric === m.id ? "active" : ""}`}
                      onClick={() => applyMetricSwap(m.id)}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Next Step Nav Button */}
                {activeStepIndex < STEPS_DATA.length - 1 && (
                  <button
                    type="button"
                    className="next-step-btn"
                    onClick={() => selectStep(activeStepIndex + 1)}
                  >
                    <span>Next Step</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>

              {/* Prominent Run Code Button */}
              <button
                type="button"
                className="run-w1-code-btn"
                onClick={() => runPythonCode()}
                disabled={executingCode}
              >
                {executingCode ? (
                  <>
                    <RefreshCw size={14} className="spin-icon" />
                    <span>Executing Python...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    <span>Run Code (⌘ + ↵)</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </section>

        {/* ──────────────────────────────────────────────────────── */}
        {/* COLUMN 3 (RIGHT): OUTPUT TABS (CHART + LIVE CONSOLE)     */}
        {/* ──────────────────────────────────────────────────────── */}
        <section className="studio-output-panel">
          <div className="w1-output-box">

            {/* Output Tab Switcher */}
            <div className="w1-output-tabs-header">
              <button
                type="button"
                className={`out-tab ${activeOutputTab === "visual" ? "active" : ""}`}
                onClick={() => setActiveOutputTab("visual")}
              >
                <BarChart3 size={14} />
                <span>Visual Chart &amp; Console</span>
                {codeResult?.chart_base64 && <span className="tab-dot" />}
              </button>

              <button
                type="button"
                className={`out-tab ${activeOutputTab === "terminal" ? "active" : ""}`}
                onClick={() => setActiveOutputTab("terminal")}
              >
                <Terminal size={14} />
                <span>Full Terminal</span>
                {codeResult?.stdout && <span className="tab-count">stdout</span>}
              </button>

              <button
                type="button"
                className={`out-tab ${activeOutputTab === "data" ? "active" : ""}`}
                onClick={() => setActiveOutputTab("data")}
              >
                <Table2 size={14} />
                <span>Data Table</span>
              </button>

              <button
                type="button"
                className={`out-tab ${activeOutputTab === "parameters" ? "active" : ""}`}
                onClick={() => setActiveOutputTab("parameters")}
              >
                <Sliders size={14} />
                <span>Parameters</span>
              </button>

              {codeResult && (
                <span className="exec-time-pill">
                  {codeResult.execution_time_ms} ms
                </span>
              )}
            </div>

            {/* Tab Body */}
            <div className="w1-output-tab-body">

              {/* TAB 1: VISUAL MATPLOTLIB CHART + LIVE CONSOLE DRAWER */}
              {activeOutputTab === "visual" && (
                <div className="visual-tab-content">
                  {/* Error Box if any */}
                  {codeResult && !codeResult.success && (
                    <div className="error-alert-box">
                      <AlertCircle size={16} />
                      <div>
                        <div className="error-alert-title">Python Execution Error</div>
                        <div className="error-alert-msg">{codeResult.stderr || codeResult.error || "An error occurred during execution."}</div>
                      </div>
                    </div>
                  )}

                  {/* Rendered Chart */}
                  {codeResult?.chart_base64 ? (
                    <div className="chart-and-console-flow">
                      <div className="rendered-chart-wrapper">
                        <div className="chart-actions-floating">
                          <a
                            href={codeResult.chart_base64}
                            download={`${currentStep.id}_chart.png`}
                            className="chart-action-btn"
                            title="Download high-resolution chart PNG"
                          >
                            <Download size={13} />
                            <span>Save PNG</span>
                          </a>
                        </div>
                        <img
                          src={codeResult.chart_base64}
                          alt="Matplotlib Data Analysis Output"
                          className="rendered-chart-img"
                        />
                      </div>

                      {/* Live Console Drawer showing print() statements under the chart */}
                      {codeResult.stdout && (
                        <div className="console-drawer">
                          <div className="drawer-header">
                            <span>stdout / console printouts:</span>
                            <span>Exit Code: 0</span>
                          </div>
                          <pre className="drawer-code">{codeResult.stdout}</pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="empty-visual-state">
                      {codeResult?.stdout ? (
                        <div className="console-drawer" style={{ width: "100%", textAlign: "left" }}>
                          <div className="drawer-header">
                            <span>stdout output (Executed in {codeResult.execution_time_ms}ms):</span>
                            <span>Exit Code: 0</span>
                          </div>
                          <pre className="drawer-code" style={{ maxHeight: "320px" }}>{codeResult.stdout}</pre>
                        </div>
                      ) : (
                        <>
                          <BarChart3 size={38} className="empty-icon" />
                          <h4>{executingCode ? "Executing Python Code..." : "Ready to Run"}</h4>
                          <p>
                            {executingCode
                              ? "Running script on Python backend and rendering figure..."
                              : "Click 'Run Code' (or press ⌘ + Enter) to execute the Python script and view the output visual and terminal logs."}
                          </p>
                          <button
                            type="button"
                            className="action-link-btn"
                            onClick={() => runPythonCode()}
                            disabled={executingCode}
                          >
                            <Play size={14} />
                            <span>Run Code Now</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: FULL TERMINAL STDOUT / STDERR */}
              {activeOutputTab === "terminal" && (
                <div className="terminal-tab-content">
                  <div className="terminal-emulator">
                    <div className="terminal-bar">
                      <div className="terminal-dots">
                        <span className="dot red" />
                        <span className="dot yellow" />
                        <span className="dot green" />
                      </div>
                      <span className="terminal-title">python3 ronaldo_analysis.py</span>
                      {codeResult && (
                        <span className="terminal-status">
                          {codeResult.success ? "Exit Code: 0" : "Exit Code: 1"}
                        </span>
                      )}
                    </div>
                    <pre className="terminal-code">
                      {codeResult?.stdout ? (
                        <span className="stdout-text">{codeResult.stdout}</span>
                      ) : null}
                      {codeResult?.stderr ? (
                        <span className="stderr-text">{codeResult.stderr}</span>
                      ) : null}
                      {!codeResult?.stdout && !codeResult?.stderr && (
                        <span className="terminal-placeholder">
                          {executingCode
                            ? "Running Python code on backend..."
                            : "$ python main.py\n(Click 'Run Code' to execute and view stdout/print statements here)"}
                        </span>
                      )}
                    </pre>
                  </div>
                </div>
              )}

              {/* TAB 3: FULL DATA TABLE */}
              {activeOutputTab === "data" && (
                <div className="data-tab-content">
                  <div className="data-table-header-info">
                    <strong>Cristiano Ronaldo: 23 Career Seasons (2002–2025)</strong>
                    <span className="badge-dim">23 rows &times; 7 columns</span>
                  </div>
                  <div className="data-table-full-wrap">
                    <table className="dataset-inline-table full-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Season</th>
                          <th>Club</th>
                          <th>Appearances</th>
                          <th>Goals</th>
                          <th>Assists</th>
                          <th>Contr.</th>
                          <th>Goals / Game</th>
                        </tr>
                      </thead>
                      <tbody>
                        {FALLBACK_RONALDO_ROWS.map((row, idx) => (
                          <tr key={idx}>
                            <td className="text-muted">{idx + 1}</td>
                            <td className="font-bold font-mono">{row.season}</td>
                            <td>{row.club}</td>
                            <td>{row.appearances}</td>
                            <td className="cell-highlight font-bold">{row.goals}</td>
                            <td>{row.assists}</td>
                            <td>{row.goal_contributions}</td>
                            <td>{row.goals_per_game.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: DEEP PARAMETERS GUIDE */}
              {activeOutputTab === "parameters" && (
                <div className="parameters-tab-content">
                  <div className="param-tab-banner">
                    <Sliders size={16} />
                    <strong>How to Modify Parameters for Your Specific Analysis Question</strong>
                  </div>

                  <div className="param-tab-cards">
                    {currentStep.parameters.map((p, pIdx) => (
                      <div key={pIdx} className="param-detail-card">
                        <div className="param-card-top">
                          <span className="param-title-chip">{p.param}</span>
                          <span className="param-type-badge">Option Range: {p.options}</span>
                        </div>
                        <p className="param-detail-text">{p.description}</p>
                        <div className="param-snippet-box">
                          <span className="snippet-label">Example Code Change:</span>
                          <code>{p.codeSnippet}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        </section>

      </div>
    </main>
  );
}
