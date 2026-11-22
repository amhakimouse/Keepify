"""
Experiment Generator and Comparative Benchmarking Suite.
Contains data perturbation generators, model trainers, and evaluation helpers.
"""

from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder, StandardScaler, FunctionTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
)

# ---------------------------------------------------------
# 1. Data Ingestion & Splitting
# ---------------------------------------------------------
def load_and_split_telco(data_path: str = None, test_size: float = 0.20, random_state: int = 42):
    """Loads Telco Customer Churn dataset, isolates target, and returns stratified train/test split."""
    if data_path is None:
        # Search common workspace locations with absolute parent resolution
        script_parent = Path(__file__).resolve().parent
        candidates = [
            script_parent.parent / "DATA" / "dataset" / "CaliforniaData" / "Telco_customer_churn.xlsx",
            Path("DATA/dataset/CaliforniaData/Telco_customer_churn.xlsx"),
            Path("../DATA/dataset/CaliforniaData/Telco_customer_churn.xlsx"),
            Path("Telco_customer_churn.xlsx"),
        ]
        for c in candidates:
            if c.exists():
                data_path = c
                break
    
    df = pd.read_excel(data_path) if str(data_path).endswith((".xlsx", ".xls")) else pd.read_csv(data_path)
    
    # Isolate Target (y)
    y = df["Churn Value"].astype(int)
    
    # Exclude direct target columns, leaky fields, and non-feature identifiers
    excluded_cols = [
        "Churn Label", "Churn Value", "Churn Score", "Churn Reason",
        "CustomerID", "CLTV", "Count", "Country", "State", "City",
        "Zip Code", "Lat Long", "Total Charges"  # Total Charges dropped due to whitespace flaws & colinearity
    ]
    X = df.drop(columns=excluded_cols, errors="ignore").copy()
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )
    return X_train, X_test, y_train, y_test


# ---------------------------------------------------------
# 2. Pipeline Builder
# ---------------------------------------------------------
def get_preprocessor(X: pd.DataFrame) -> ColumnTransformer:
    """Creates a leak-safe preprocessing pipeline for numeric and categorical columns."""
    num_cols = X.select_dtypes(include=["number"]).columns.tolist()
    cat_cols = [c for c in X.columns if c not in num_cols]
    
    num_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])
    cat_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore")),
    ])
    
    return ColumnTransformer([
        ("num", num_pipe, num_cols),
        ("cat", cat_pipe, cat_cols),
    ], remainder="drop")


def build_models(X_train: pd.DataFrame, y_train: pd.Series, random_state: int = 42):
    """Instantiates and returns standard trained baseline models."""
    prep = get_preprocessor(X_train)
    neg_pos_ratio = (y_train == 0).sum() / (y_train == 1).sum()
    
    models = {
        "Logistic Regression": Pipeline([
            ("prep", prep),
            ("clf", LogisticRegression(class_weight="balanced", max_iter=1000, random_state=random_state))
        ]),
        "Random Forest": Pipeline([
            ("prep", prep),
            ("clf", RandomForestClassifier(n_estimators=200, min_samples_leaf=3, class_weight="balanced", random_state=random_state, n_jobs=-1))
        ]),
        "XGBoost": Pipeline([
            ("prep", prep),
            ("clf", XGBClassifier(n_estimators=200, max_depth=3, learning_rate=0.05, scale_pos_weight=neg_pos_ratio, random_state=random_state, n_jobs=2, eval_metric="logloss"))
        ]),
    }
    
    for name, pipe in models.items():
        pipe.fit(X_train, y_train)
        
    return models


# ---------------------------------------------------------
# 3. Data Perturbation Generators
# ---------------------------------------------------------
def generate_outlier_dataset(X: pd.DataFrame, target_col: str = "Monthly Charges", fraction: float = 0.05,
                             min_val: float = 10000.0, max_val: float = 25000.0, random_state: int = 42) -> pd.DataFrame:
    """Injects extreme billing outliers into the designated column."""
    X_pert = X.copy()
    rng = np.random.default_rng(random_state)
    n_corrupt = int(len(X_pert) * fraction)
    idx = rng.choice(X_pert.index, size=n_corrupt, replace=False)
    X_pert.loc[idx, target_col] = rng.uniform(min_val, max_val, size=n_corrupt)
    return X_pert


def generate_nan_dataset(X: pd.DataFrame, fraction: float = 0.15, random_state: int = 42) -> pd.DataFrame:
    """Injects random missing values (NaNs) across columns."""
    X_pert = X.copy()
    rng = np.random.default_rng(random_state)
    for col in X_pert.columns:
        mask = rng.random(size=len(X_pert)) < fraction
        X_pert.loc[mask, col] = np.nan
    return X_pert


def generate_noise_features_dataset(X: pd.DataFrame, random_state: int = 42) -> pd.DataFrame:
    """Injects useless noise columns (Gaussian, Uniform, and Constant)."""
    X_pert = X.copy()
    rng = np.random.default_rng(random_state)
    n = len(X_pert)
    X_pert["noise_gaussian"] = rng.normal(0, 1, n)
    X_pert["noise_uniform"] = rng.uniform(0, 100, n)
    X_pert["noise_constant"] = 42.0
    return X_pert


# ---------------------------------------------------------
# 4. Evaluation and Comparison Functions
# ---------------------------------------------------------
def compute_metrics(y_true, y_prob, threshold: float = 0.50) -> dict:
    """Calculates full classification metrics dictionary."""
    y_pred = (y_prob >= threshold).astype(int)
    return {
        "Accuracy": accuracy_score(y_true, y_pred),
        "Precision": precision_score(y_true, y_pred, zero_division=0),
        "Recall": recall_score(y_true, y_pred, zero_division=0),
        "F1-Score": f1_score(y_true, y_pred, zero_division=0),
        "ROC-AUC": roc_auc_score(y_true, y_prob) if len(np.unique(y_prob)) > 1 else 0.50,
        "PR-AUC": average_precision_score(y_true, y_prob) if len(np.unique(y_prob)) > 1 else y_true.mean(),
    }


def compare_normal_vs_experiment(models: dict, X_test_normal: pd.DataFrame, X_test_exp: pd.DataFrame, y_test: pd.Series) -> pd.DataFrame:
    """Evaluates models on normal vs experimental test sets and returns side-by-side comparison table."""
    rows = []
    for name, pipe in models.items():
        prob_norm = pipe.predict_proba(X_test_normal)[:, 1]
        prob_exp = pipe.predict_proba(X_test_exp)[:, 1]
        
        m_norm = compute_metrics(y_test, prob_norm)
        m_exp = compute_metrics(y_test, prob_exp)
        
        rows.append({
            "Model": name,
            "Condition": "Normal",
            **m_norm,
            "Mean_Predicted_Risk": prob_norm.mean()
        })
        rows.append({
            "Model": name,
            "Condition": "Experiment",
            **m_exp,
            "Mean_Predicted_Risk": prob_exp.mean()
        })
        rows.append({
            "Model": name,
            "Condition": "Delta (Δ)",
            "Accuracy": m_exp["Accuracy"] - m_norm["Accuracy"],
            "Precision": m_exp["Precision"] - m_norm["Precision"],
            "Recall": m_exp["Recall"] - m_norm["Recall"],
            "F1-Score": m_exp["F1-Score"] - m_norm["F1-Score"],
            "ROC-AUC": m_exp["ROC-AUC"] - m_norm["ROC-AUC"],
            "PR-AUC": m_exp["PR-AUC"] - m_norm["PR-AUC"],
            "Mean_Predicted_Risk": prob_exp.mean() - prob_norm.mean(),
        })
        
    return pd.DataFrame(rows)


def run_feature_ablation_benchmark(X_train: pd.DataFrame, X_test: pd.DataFrame, y_train: pd.Series, y_test: pd.Series,
                                   scenarios: dict = None, random_state: int = 42) -> pd.DataFrame:
    """Executes feature ablation study with Random Forest and outputs comparative performance table."""
    if scenarios is None:
        scenarios = {
            "Full Feature Set (Baseline)": [],
            "Drop Contract (#1 Categorical)": ["Contract"],
            "Drop Tenure (#1 Lifecycle Anchor)": ["Tenure Months"],
            "Drop Gender & PhoneService (Trivial)": ["Gender", "Phone Service"],
        }
        
    results = []
    for name, drop_cols in scenarios.items():
        X_tr = X_train.drop(columns=drop_cols, errors="ignore")
        X_te = X_test.drop(columns=drop_cols, errors="ignore")
        
        prep = get_preprocessor(X_tr)
        clf = RandomForestClassifier(n_estimators=200, min_samples_leaf=3, class_weight="balanced", random_state=random_state, n_jobs=-1)
        pipe = Pipeline([("prep", prep), ("clf", clf)])
        pipe.fit(X_tr, y_train)
        
        y_prob = pipe.predict_proba(X_te)[:, 1]
        metrics = compute_metrics(y_test, y_prob)
        
        results.append({
            "Scenario": name,
            "Dropped Features": str(drop_cols) if drop_cols else "None",
            **metrics
        })
        
    df_res = pd.DataFrame(results)
    base_pr = df_res.loc[0, "PR-AUC"]
    base_f1 = df_res.loc[0, "F1-Score"]
    df_res["Δ PR-AUC"] = df_res["PR-AUC"] - base_pr
    df_res["Δ F1-Score"] = df_res["F1-Score"] - base_f1
    return df_res


def calculate_threshold_roi(y_true: pd.Series, y_prob: np.ndarray, tp_value: float = 250.0, fp_cost: float = 50.0) -> pd.DataFrame:
    """Sweeps probability thresholds and calculates business net profit/savings."""
    thresholds = np.linspace(0.05, 0.95, 100)
    data = []
    
    for t in thresholds:
        pred = (y_prob >= t).astype(int)
        tp = ((pred == 1) & (y_true == 1)).sum()
        fp = ((pred == 1) & (y_true == 0)).sum()
        fn = ((pred == 0) & (y_true == 1)).sum()
        tn = ((pred == 0) & (y_true == 0)).sum()
        
        net_savings = (tp * tp_value) - (fp * fp_cost)
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * prec * rec / (prec + rec) if (prec + rec) > 0 else 0
        
        data.append({
            "Threshold": t,
            "TP": tp,
            "FP": fp,
            "FN": fn,
            "TN": tn,
            "Precision": prec,
            "Recall": rec,
            "F1-Score": f1,
            "Net_Savings": net_savings,
        })
        
    return pd.DataFrame(data)


# ---------------------------------------------------------
# 5. Comparative Visualizations
# ---------------------------------------------------------
def plot_outlier_probability_drift(models: dict, X_test_normal: pd.DataFrame, X_test_outliers: pd.DataFrame):
    """Visualizes prediction probability drift: Normal vs. Outlier Injected."""
    fig, axes = plt.subplots(1, 2, figsize=(13, 5))
    
    # 1. Logistic Regression
    lr_norm = models["Logistic Regression"].predict_proba(X_test_normal)[:, 1]
    lr_out = models["Logistic Regression"].predict_proba(X_test_outliers)[:, 1]
    axes[0].scatter(lr_norm, lr_out, alpha=0.5, color="#2ca02c", edgecolors="none")
    axes[0].plot([0, 1], [0, 1], "r--", linewidth=1.5, label="Invariant Baseline (y=x)")
    axes[0].set_title("Logistic Regression (Linear): Heavy Leverage Drift", fontweight="bold")
    axes[0].set_xlabel("Normal Prediction Probability")
    axes[0].set_ylabel("Outlier Prediction Probability")
    axes[0].grid(True, linestyle="--", alpha=0.5)
    axes[0].legend()
    
    # 2. Random Forest
    rf_norm = models["Random Forest"].predict_proba(X_test_normal)[:, 1]
    rf_out = models["Random Forest"].predict_proba(X_test_outliers)[:, 1]
    axes[1].scatter(rf_norm, rf_out, alpha=0.5, color="#1f77b4", edgecolors="none")
    axes[1].plot([0, 1], [0, 1], "r--", linewidth=1.5, label="Invariant Baseline (y=x)")
    axes[1].set_title("Random Forest (Tree): Partition Scale Invariance", fontweight="bold")
    axes[1].set_xlabel("Normal Prediction Probability")
    axes[1].set_ylabel("Outlier Prediction Probability")
    axes[1].grid(True, linestyle="--", alpha=0.5)
    axes[1].legend()
    
    plt.tight_layout()
    plt.show()


def plot_metric_comparison(df_comp: pd.DataFrame, metric: str = "PR-AUC", title: str = None):
    """Plots side-by-side bar chart of Normal vs Experiment condition across models."""
    df_plot = df_comp[df_comp["Condition"].isin(["Normal", "Experiment"])].copy()
    
    pivot = df_plot.pivot(index="Model", columns="Condition", values=metric)
    
    ax = pivot.plot(kind="bar", figsize=(9, 5), color=["#1f77b4", "#ff7f0e"], width=0.6)
    plt.title(title or f"Comparative Performance: {metric} (Normal vs. Experiment)", fontweight="bold", pad=12)
    plt.ylabel(metric)
    plt.ylim(0, 1.0)
    plt.grid(axis="y", linestyle="--", alpha=0.5)
    plt.legend(frameon=True)
    plt.xticks(rotation=0)
    
    # Annotate values
    for p in ax.patches:
        height = p.get_height()
        if height > 0:
            ax.annotate(f"{height:.3f}", (p.get_x() + p.get_width() / 2., height / 2.),
                        ha="center", va="center", color="white", fontweight="bold", fontsize=10)
            
    plt.tight_layout()
    plt.show()


def plot_ablation_bars(df_ablation: pd.DataFrame):
    """Plots horizontal bar chart of delta PR-AUC across feature ablation scenarios."""
    df_plot = df_ablation.sort_values("Δ PR-AUC", ascending=True).copy()
    
    plt.figure(figsize=(10, 4.5))
    bars = plt.barh(df_plot["Scenario"], df_plot["Δ PR-AUC"], color=["#d62728" if v < -0.01 else "#2ca02c" if v >= 0 else "#ff7f0e" for v in df_plot["Δ PR-AUC"]])
    plt.axvline(0, color="black", linestyle="--", linewidth=1)
    plt.title("Feature Ablation: PR-AUC Drop vs. Full Model", fontweight="bold", pad=12)
    plt.xlabel("Δ PR-AUC (Performance Impact)")
    plt.grid(axis="x", linestyle="--", alpha=0.5)
    
    for bar in bars:
        width = bar.get_width()
        offset = 0.002 if width >= 0 else -0.012
        plt.text(width + offset, bar.get_y() + bar.get_height() / 2., f"{width:+.4f}",
                 va="center", fontweight="bold", fontsize=10)
        
    plt.tight_layout()
    plt.show()


def plot_roi_curve(df_roi: pd.DataFrame, t_optimal: float, t_default: float = 0.50):
    """Plots net retention savings as a function of decision threshold."""
    plt.figure(figsize=(10, 4.8))
    plt.plot(df_roi["Threshold"], df_roi["Net_Savings"], color="#1f77b4", linewidth=2.5, label="Net Business Savings ($)")
    
    opt_row = df_roi.loc[(df_roi["Threshold"] - t_optimal).abs().idxmin()]
    def_row = df_roi.loc[(df_roi["Threshold"] - t_default).abs().idxmin()]
    
    plt.axvline(x=t_default, color="gray", linestyle="--", linewidth=1.8,
                label=f"Default Threshold (T = 0.50) -> ${def_row['Net_Savings']:,.0f}")
    plt.axvline(x=t_optimal, color="#2ca02c", linestyle="-", linewidth=2.2,
                label=f"Optimal Threshold (T* = {t_optimal:.2f}) -> ${opt_row['Net_Savings']:,.0f}")
    plt.scatter([t_optimal], [opt_row["Net_Savings"]], color="#2ca02c", s=120, zorder=5)
    
    plt.title("Business Retention ROI: Net Savings vs. Decision Threshold", fontweight="bold", pad=12)
    plt.xlabel("Decision Probability Threshold (T)")
    plt.ylabel("Net Profit / Savings ($)")
    plt.grid(True, linestyle="--", alpha=0.5)
    plt.legend(loc="lower center", frameon=True)
    plt.tight_layout()
    plt.show()


# ---------------------------------------------------------
# 6. CSV Export Helper
# ---------------------------------------------------------
def export_results_to_csv(df: pd.DataFrame, filename: str, output_dir: str = None) -> Path:
    """Exports comparative dataframe to CSV format in the results directory."""
    if output_dir is None:
        base_dir = Path(__file__).resolve().parent
        out_path = base_dir / "results"
    else:
        out_path = Path(output_dir)
        if not out_path.is_absolute():
            base_dir = Path(__file__).resolve().parent
            out_path = base_dir / out_path

    out_path.mkdir(parents=True, exist_ok=True)
    file_path = out_path / filename
    df.to_csv(file_path, index=False)
    print(f"[EXPORTED] {file_path}")
    return file_path




