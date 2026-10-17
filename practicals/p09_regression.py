import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.preprocessing import PolynomialFeatures
from sklearn.metrics import r2_score, mean_squared_error

import os
base_folder = os.path.dirname(os.path.abspath(__file__))
raw_folder = os.path.join(base_folder, "..", "data", "raw")
out_folder = os.path.join(base_folder, "..", "data", "processed")

df = pd.read_csv(os.path.join(raw_folder, "data_center_hybrid.csv"))

# we are predicting Daily_Electricity_Usage_MWh using Estimated_Capacity_MW
# these two columns are strongly related, so this is a good pair for regression

x = df[["Estimated_Capacity_MW"]]
y = df["Daily_Electricity_Usage_MWh"]

x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=42)


# ---------------- 1) linear regression ----------------
linear_model = LinearRegression()
linear_model.fit(x_train, y_train)
linear_pred = linear_model.predict(x_test)

linear_r2 = r2_score(y_test, linear_pred)
linear_mse = mean_squared_error(y_test, linear_pred)

print("1) linear regression")
print("slope (coefficient):", linear_model.coef_[0])
print("intercept:", linear_model.intercept_)
print("r2 score:", linear_r2)
print("mse:", linear_mse)
print()


# ---------------- 2) polynomial regression (degree 2) ----------------
poly_features = PolynomialFeatures(degree=2)
x_train_poly = poly_features.fit_transform(x_train)
x_test_poly = poly_features.transform(x_test)

poly_model = LinearRegression()
poly_model.fit(x_train_poly, y_train)
poly_pred = poly_model.predict(x_test_poly)

poly_r2 = r2_score(y_test, poly_pred)
poly_mse = mean_squared_error(y_test, poly_pred)

print("2) polynomial regression (degree = 2)")
print("coefficients:", poly_model.coef_)
print("intercept:", poly_model.intercept_)
print("r2 score:", poly_r2)
print("mse:", poly_mse)
print()


# ---------------- 3) ridge regression ----------------
ridge_model = Ridge(alpha=1.0)
ridge_model.fit(x_train, y_train)
ridge_pred = ridge_model.predict(x_test)

ridge_r2 = r2_score(y_test, ridge_pred)
ridge_mse = mean_squared_error(y_test, ridge_pred)

print("3) ridge regression (alpha = 1.0)")
print("slope (coefficient):", ridge_model.coef_[0])
print("intercept:", ridge_model.intercept_)
print("r2 score:", ridge_r2)
print("mse:", ridge_mse)
print()


# ---------------- comparison table ----------------
comparison = pd.DataFrame({
    "model": ["Linear Regression", "Polynomial Regression (deg 2)", "Ridge Regression"],
    "r2_score": [linear_r2, poly_r2, ridge_r2],
    "mse": [linear_mse, poly_mse, ridge_mse],
})
print("comparison table")
print(comparison)
print()


# ---------------- visualization ----------------
x_line = np.linspace(x["Estimated_Capacity_MW"].min(), x["Estimated_Capacity_MW"].max(), 200).reshape(-1, 1)
x_line_poly = poly_features.transform(x_line)

linear_line = linear_model.predict(x_line)
poly_line = poly_model.predict(x_line_poly)
ridge_line = ridge_model.predict(x_line)

plt.figure(figsize=(9, 6))
plt.scatter(x_test, y_test, s=10, alpha=0.25, color="gray", label="actual data (test set)")
plt.plot(x_line, linear_line, color="blue", linewidth=2, label="linear regression")
plt.plot(x_line, poly_line, color="green", linewidth=2, label="polynomial regression (deg 2)")
plt.plot(x_line, ridge_line, color="red", linewidth=2, linestyle="--", label="ridge regression")

plt.xlabel("Estimated Capacity (MW)")
plt.ylabel("Daily Electricity Usage (MWh)")
plt.title("Linear vs Polynomial vs Ridge Regression")
plt.legend()
plt.tight_layout()
plt.savefig(os.path.join(out_folder, "regression_comparison.png"), dpi=150)
plt.show()

comparison.to_csv(os.path.join(out_folder, "regression_comparison_results.csv"), index=False)
print("saved chart as regression_comparison.png")
print("saved results table as regression_comparison_results.csv")
