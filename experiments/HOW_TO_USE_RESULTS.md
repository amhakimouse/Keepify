# How to Use the Comparative Experiment Benchmarks

This directory contains standardized benchmark datasets and utilities designed to evaluate model robustness, feature sensitivity, and business financial performance under real-world data distributions.

All benchmarking results are exported to the [`experiments/results/`](file:///c:/Users/lenovo/OneDrive/Desktop/ML%20EXP/IA%20learning/Subscription_Prediction/experiments/results/) directory as clean, comma-delimited CSV files ready for ingestion into reporting dashboards, CI/CD regression gates, and production scoring modules.

---

## 1. Directory Structure

```text
experiments/
├── Comparative_Experiments.ipynb      # Main execution notebook (clean, comparative visual suite)
├── experiment_generator.py            # Standalone generator, perturbation & evaluation library
├── HOW_TO_USE_RESULTS.md              # This reference guide
└── results/
    ├── 01_outliers_vs_normal.csv          # Preprocessing: Extreme billing outliers benchmark
    ├── 02_nans_vs_normal.csv              # Preprocessing: Missing values (NaN stress test)
    ├── 03_noise_features_vs_normal.csv    # Feature Discovery: Injected uninformative noise features
    ├── 04_feature_ablation_benchmark.csv  # Feature Discovery: Feature ablation impact ranking
    ├── 05_threshold_roi_summary.csv       # Decision Theory: T=0.50 vs. T* financial comparison
    └── 05_threshold_roi_curve.csv         # Decision Theory: Complete threshold financial sweep (T=0.01 to 0.99)
```

---

## 2. Benchmark Datasets & Column Dictionaries

### 2.1. `01_outliers_vs_normal.csv` (Extreme Outliers Benchmark)
* **Goal**: Assesses performance and calibration drift when 5% extreme outliers ($10,000–$25,000) corrupt `Monthly Charges` on incoming inference data.
* **Schema**:
  | Column Name | Data Type | Description |
  | :--- | :--- | :--- |
  | `Model` | `str` | Evaluated classifier (`Logistic Regression`, `Random Forest`, `XGBoost`). |
  | `Condition` | `str` | Evaluation condition: `Normal`, `Experiment` (with outliers), or `Delta (Δ)`. |
  | `Accuracy` | `float` | Overall test classification accuracy. |
  | `Precision` | `float` | True Positives / (True Positives + False Positives). |
  | `Recall` | `float` | True Positives / (True Positives + False Negatives). |
  | `F1-Score` | `float` | Harmonic mean of Precision and Recall. |
  | `ROC-AUC` | `float` | Area under Receiver Operating Characteristic curve. |
  | `PR-AUC` | `float` | Area under Precision-Recall curve (primary imbalanced metric). |
  | `Mean_Predicted_Risk` | `float` | Average predicted churn probability across all test instances. |

* **Decision-Making Usage**:
  - Compare `Mean_Predicted_Risk` across conditions: Linear models experience leverage-induced calibration shifts when unbounded features are present, whereas tree ensembles (Random Forest, XGBoost) remain invariant to monotonic feature distortions.
  - **Action**: When deploying linear models, enforce strict boundary clipping (e.g., 99th percentile winsorization) or `RobustScaler` in `SRC/preprocessing.py`.

---

### 2.2. `02_nans_vs_normal.csv` (Missing Value Stress Test)
* **Goal**: Measures pipeline degradation when 15% random NaNs occur across all columns during inference.
* **Schema**: Identical to `01_outliers_vs_normal.csv`.
* **Decision-Making Usage**:
  - Track `Delta (Δ)` for `PR-AUC` and `F1-Score`. If degradation is $< 0.03$, the median/mode imputation strategy is verified as production-resilient.
  - **Action**: Use this benchmark to establish data drift alerting thresholds: trigger pipeline warnings if production inference data exhibits missingness $> 10\%$.

---

### 2.3. `03_noise_features_vs_normal.csv` (Injected Noise Features)
* **Goal**: Measures how classifiers react when uninformative columns (Gaussian noise, Uniform noise, and Constant zero) are added to the training and inference pipeline.
* **Schema**: Identical to `01_outliers_vs_normal.csv`.
* **Decision-Making Usage**:
  - Inspect model stability when irrelevant signals contaminate feature stores.
  - Demonstrates that tree models and L2-regularized linear models naturally attenuate uninformative columns (coefficients drop near 0.0), proving model safety.

---

### 2.4. `04_feature_ablation_benchmark.csv` (Feature Ablation Study)
* **Goal**: Quantifies the empirical value of each feature group by measuring performance drop when individual features or blocks are ablated from the model.
* **Schema**:
  | Column Name | Data Type | Description |
  | :--- | :--- | :--- |
  | `Scenario` | `str` | Ablation description (e.g., `Baseline (All Features)`, `Drop Contract`, `Drop Demographics`). |
  | `Dropped Features` | `str` | Explicit comma-separated list of dropped columns. |
  | `Accuracy` | `float` | Test accuracy with the designated features ablated. |
  | `Precision` | `float` | Test precision with the designated features ablated. |
  | `Recall` | `float` | Test recall with the designated features ablated. |
  | `F1-Score` | `float` | Test F1-Score under the ablation condition. |
  | `Δ F1-Score` | `float` | Difference relative to baseline F1-Score (`F1_ablation - F1_baseline`). |
  | `ROC-AUC` | `float` | Test ROC-AUC with the designated features ablated. |
  | `Δ ROC-AUC` | `float` | Difference relative to baseline ROC-AUC (`ROC_ablation - ROC_baseline`). |
  | `PR-AUC` | `float` | Test PR-AUC with the designated features ablated. |
  | `Δ PR-AUC` | `float` | Difference relative to baseline PR-AUC (`PR_ablation - PR_baseline`). |

* **Decision-Making Usage**:
  - **Identify Critical Features**: Columns associated with large negative $\Delta$ values (e.g., `Contract` and `Tenure` where $\Delta \text{ PR-AUC} \le -0.04$) are high-leverage drivers that must never be dropped.
  - **Prune Redundant Features**: Feature sets where $\Delta \text{ PR-AUC} \approx 0.00$ (e.g., `gender`, `Partner`, `Dependents`) can be safely eliminated from production data collection pipelines to reduce API payload latency, storage costs, and privacy exposure.

---

### 2.5. `05_threshold_roi_summary.csv` & `05_threshold_roi_curve.csv` (Financial ROI)
* **Goal**: Translates statistical probabilities into concrete corporate financial returns based on retention economics:
  $$\text{Net Business Savings} = (\text{TP} \times \$250) - (\text{FP} \times \$50)$$
* **Schemas**:
  * **Summary (`05_threshold_roi_summary.csv`)**: Compares the arbitrary default cutoff ($T = 0.50$) directly against the financially optimal cutoff ($T^*$).
  * **Full Curve (`05_threshold_roi_curve.csv`)**: Evaluates every threshold step from $T = 0.01$ to $T = 0.99$ (99 data points).
  | Column Name | Data Type | Description |
  | :--- | :--- | :--- |
  | `Threshold` | `float` | Decision probability cutoff $T \in [0.01, 0.99]$. |
  | `Precision` | `float` | Precision at threshold $T$. |
  | `Recall` | `float` | Recall at threshold $T$. |
  | `F1-Score` | `float` | F1-Score at threshold $T$. |
  | `TP` | `int` | True Positives (churners successfully flagged for retention). |
  | `FP` | `int` | False Positives (non-churners unnecessarily given discounts/offers). |
  | `FN` | `int` | False Negatives (missed churners who leave undetected). |
  | `TN` | `int` | True Negatives (retained customers not disturbed). |
  | `Cost` | `float` | Total campaign spend: $\text{FP} \times \$50$. |
  | `Revenue` | `float` | Total revenue saved: $\text{TP} \times \$250$. |
  | `Net_Savings` | `float` | $\text{Revenue} - \text{Cost} = (\text{TP} \times \$250) - (\text{FP} \times \$50)$. |

* **Decision-Making Usage**:
  - **Production Cutoff Configuration**: Set the deployment threshold in `SRC/predict.py` to $T^*$ (typically $0.28$ to $0.32$). Lowering the threshold from $0.50$ captures significantly more churners, driving substantial net dollar gains.
  - **Budget Allocation**: For marketing campaigns with fixed capacity, look up the threshold corresponding to the maximum allowable $\text{TP} + \text{FP}$ outreach volume.

---

## 3. Python Integration Snippets

### A. Load and Query the Optimal Threshold in Production
```python
import pandas as pd
from pathlib import Path

# Load ROI curve benchmark
roi_path = Path("experiments/results/05_threshold_roi_curve.csv")
df_roi = pd.read_csv(roi_path)

# Extract optimal threshold
opt_row = df_roi.loc[df_roi["Net_Savings"].idxmax()]
optimal_threshold = opt_row["Threshold"]
expected_savings = opt_row["Net_Savings"]

print(f"Deploying with Optimal Cutoff T* = {optimal_threshold:.2f}")
print(f"Projected Net Test Cohort Savings: ${expected_savings:,.2f}")

# Apply to incoming customer probabilities
# y_pred_prod = (churn_probabilities >= optimal_threshold).astype(int)
```

### B. CI/CD Model Regression Gate
```python
import pandas as pd
from pathlib import Path

# Load ablation benchmark as baseline reference
ablation_path = Path("experiments/results/04_feature_ablation_benchmark.csv")
df_ablation = pd.read_csv(ablation_path)
baseline_pr_auc = df_ablation.loc[df_ablation["Scenario"].str.contains("Baseline"), "PR-AUC"].values[0]

# Candidate model score
candidate_pr_auc = 0.6520

# Quality Gate: Candidate must achieve at least 95% of baseline PR-AUC
min_acceptable_score = baseline_pr_auc * 0.95
assert candidate_pr_auc >= min_acceptable_score, (
    f"Candidate model rejected! PR-AUC ({candidate_pr_auc:.4f}) is below "
    f"minimum threshold ({min_acceptable_score:.4f})."
)
print("[GATE PASSED] Candidate model meets production quality standards.")
```

### C. Compare Robustness Against Data Drift
```python
import pandas as pd

# Load outlier and NaN benchmarks
df_outliers = pd.read_csv("experiments/results/01_outliers_vs_normal.csv")
df_nans = pd.read_csv("experiments/results/02_nans_vs_normal.csv")

# Filter delta rows for XGBoost
xgb_outlier_delta = df_outliers[(df_outliers["Model"] == "XGBoost") & (df_outliers["Condition"] == "Delta (Δ)")]
xgb_nan_delta = df_nans[(df_nans["Model"] == "XGBoost") & (df_nans["Condition"] == "Delta (Δ)")]

print("XGBoost Robustness Summary:")
print(f"  - Outlier Impact on PR-AUC: {xgb_outlier_delta['PR-AUC'].values[0]:+.4f}")
print(f"  - 15% NaN Impact on PR-AUC: {xgb_nan_delta['PR-AUC'].values[0]:+.4f}")
```
