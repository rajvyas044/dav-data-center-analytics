# %% Cell 0: Setup and load data
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from IPython.display import display

sns.set_style("whitegrid")
plt.rcParams["figure.figsize"] = (9, 5)

import os
base_folder = os.path.dirname(os.path.abspath(__file__))
raw_folder = os.path.join(base_folder, "..", "data", "raw")
out_folder = os.path.join(base_folder, "..", "data", "processed")

CSV_PATH = os.path.join(raw_folder, "data_center_hybrid.csv")

df = pd.read_csv(CSV_PATH)
print("Shape:", df.shape)
display(df.head())
display(df.dtypes)


# %% Cell 1: Data types, class attribute, balance ratio, uncertainty

print(f"Records: {len(df)} | Attributes: {df.shape[1]}")
print(f"Unique facilities: {df['Facility_ID'].nunique()}")
print(f"Years covered: {sorted(df['Year'].unique().tolist())}")

# Split columns by dtype
categorical_cols = df.select_dtypes(include="object").columns.tolist()
numeric_cols = df.select_dtypes(include=np.number).columns.tolist()
print("\nCategorical columns:", categorical_cols)
print("Numeric columns:", numeric_cols)

# Class-wise balance ratio for each categorical column with few unique values
for col in categorical_cols:
    n_unique = df[col].nunique()
    if n_unique <= 10:
        counts = df[col].value_counts()
        ratio = counts.max() / counts.min()
        print(f"\n{col} ({n_unique} classes)")
        display(counts)
        print(f"Imbalance ratio: {ratio:.1f} : 1")

# Uncertainty check
print("\nNull counts:")
display(df.isnull().sum())

for col in categorical_cols:
    placeholder_count = df[col].isin(["Unknown", "N/A", ""]).sum()
    if placeholder_count > 0:
        print(f"{col}: {placeholder_count} placeholder values ({placeholder_count/len(df):.1%})")

def iqr_outlier_pct(series):
    q1, q3 = series.quantile(0.25), series.quantile(0.75)
    iqr = q3 - q1
    lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    return ((series < lower) | (series > upper)).mean()

print("\nOutlier percentage (IQR rule):")
for col in numeric_cols:
    print(f"{col}: {iqr_outlier_pct(df[col]):.1%}")

print(f"\nDuplicate rows: {df.duplicated().sum()}")


# %% Cell 2: Summary statistics

display(df[numeric_cols].describe())


# %% Cell 3: Categorical field distributions

for col in categorical_cols:
    if df[col].nunique() <= 15:
        plt.figure(figsize=(7, 4))
        df[col].value_counts().plot(kind="bar", color="steelblue")
        plt.title(f"Distribution of {col}")
        plt.ylabel("Count")
        plt.xticks(rotation=30, ha="right")
        plt.tight_layout()
        plt.show()


# %% Cell 4: Numeric field distributions

for col in numeric_cols:
    plt.figure(figsize=(7, 4))
    sns.histplot(df[col], bins=40, kde=True, color="darkorange")
    plt.title(f"Distribution of {col}")
    plt.tight_layout()
    plt.show()


# %% Cell 5: Boxplots to check outliers

for col in numeric_cols:
    plt.figure(figsize=(6, 2.5))
    sns.boxplot(x=df[col], color="lightgreen")
    plt.title(f"Boxplot of {col}")
    plt.tight_layout()
    plt.show()


# %% Cell 6: Correlation between numeric fields

plt.figure(figsize=(8, 6))
sns.heatmap(df[numeric_cols].corr(), annot=True, fmt=".2f", cmap="viridis")
plt.title("Correlation Matrix")
plt.tight_layout()
plt.show()


# %% Cell 7: Trend over time

if "Year" in df.columns:
    yearly_avg = df.groupby("Year")[numeric_cols].mean(numeric_only=True)
    display(yearly_avg)

    for col in numeric_cols:
        if col != "Year":
            plt.figure(figsize=(7, 4))
            yearly_avg[col].plot(marker="o", color="purple")
            plt.title(f"Average {col} by Year")
            plt.xlabel("Year")
            plt.ylabel(col)
            plt.tight_layout()
            plt.show()


# %% Cell 8: Insights and knowledge generated

print("Summary statistics by category:")
for col in categorical_cols:
    if df[col].nunique() <= 10:
        display(df.groupby(col)[numeric_cols].mean(numeric_only=True))

print("\nTop correlated numeric pairs:")
corr_matrix = df[numeric_cols].corr().abs()
corr_pairs = corr_matrix.unstack().sort_values(ascending=False)
corr_pairs = corr_pairs[corr_pairs < 1].drop_duplicates()
display(corr_pairs.head(10))


# %% Cell 9: Data cleaning

print("Step 1: Initial audit")
display(df.isnull().sum())
print("Duplicates:", df.duplicated().sum())

df_clean = df.copy()

# Step 2: Replace placeholder strings with real NaN
for col in categorical_cols:
    df_clean[col] = df_clean[col].replace(["Unknown", "N/A", ""], np.nan)

print("\nStep 2: Null counts after replacing placeholders")
display(df_clean.isnull().sum())

# Step 3: Flag corrupted text fields containing digits where names are expected
for col in ["City", "Country"]:
    if col in df_clean.columns:
        bad_mask = df_clean[col].astype(str).str.contains(r"\d", regex=True, na=False)
        print(f"Corrupted {col} entries: {bad_mask.sum()}")
        df_clean.loc[bad_mask, col] = np.nan

# Step 4: Panel consistency check
if "Facility_ID" in df_clean.columns and "Facility_Type" in df_clean.columns:
    inconsistent = df_clean.groupby("Facility_ID")["Facility_Type"].nunique()
    print(f"\nFacilities with inconsistent Facility_Type: {(inconsistent > 1).sum()}")

# Step 5: Flag outliers instead of removing them
for col in numeric_cols:
    q1, q3 = df_clean[col].quantile([0.25, 0.75])
    iqr = q3 - q1
    lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    df_clean[f"{col}_is_outlier"] = ~df_clean[col].between(lower, upper)

print("\nStep 5: Outlier flag columns added")

# Step 6: Final validation
print("\nStep 6: Final validation")
display(df_clean.isnull().sum())

df_clean.to_csv(os.path.join(out_folder, "data_center_hybrid_cleaned.csv"), index=False)
print("Saved cleaned dataset to data_center_hybrid_cleaned.csv")
