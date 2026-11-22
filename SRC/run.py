"""End-to-end training and evaluation orchestration."""
import argparse
from pathlib import Path
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

from .preprocessing import load_data, extract_target, get_feature_dataframe
from .train import train_models
from .evaluate import evaluate_models

ROOT = Path(__file__).resolve().parents[1]

def main():
    parser = argparse.ArgumentParser(description="End-to-end Churn Model Training & Evaluation.")
    parser.add_argument(
        "--data",
        default=None,
        help="Path to Telco customer churn dataset (.xlsx or .csv)",
    )
    parser.add_argument("--test-size", type=float, default=0.20, help="Test split ratio")
    parser.add_argument("--random-state", type=int, default=42, help="Random state seed")
    parser.add_argument("--threshold", type=float, default=0.50, help="Decision threshold")
    args = parser.parse_args()

    print("[STEP 1] Loading raw dataset...")
    df_raw = load_data(args.data)
    y = extract_target(df_raw)
    X = get_feature_dataframe(df_raw)

    print(f"  Rows loaded: {len(df_raw):,} | Predictor columns: {X.shape[1]}")
    print(f"  Churn distribution: {y.mean():.2%} ({y.sum()} churners, {(y==0).sum()} retained)")

    print(f"\n[STEP 2] Splitting into train/test (stratified, test_size={args.test_size})...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=args.test_size, random_state=args.random_state, stratify=y
    )
    print(f"  Train cohort: {len(X_train)} rows | Test cohort: {len(X_test)} rows")

    print("\n[STEP 3] Training candidate models with specialized preprocessors...")
    models = train_models(X_train, y_train, random_state=args.random_state)

    print("\n[STEP 4] Evaluating candidate models on unseen test cohort...")
    reports_dir = ROOT / "REPORTS"
    best_name, scores = evaluate_models(
        models, X_test, y_test, report_dir=reports_dir, threshold=args.threshold
    )

    best_model = models[best_name]
    best_probs = best_model.predict_proba(X_test)[:, 1]
    best_preds = (best_probs >= args.threshold).astype(int)

    print("\n--- Model Benchmark Comparison (Ranked by PR-AUC) ---")
    print(scores.to_string(index=False))

    print(f"\n[STEP 5] Persisting production model and metadata...")
    models_dir = ROOT / "MODELS"
    models_dir.mkdir(parents=True, exist_ok=True)
    
    model_path = models_dir / "best_churn_model.joblib"
    cols_path = models_dir / "feature_columns.joblib"
    
    joblib.dump(best_model, model_path)
    joblib.dump(list(X.columns), cols_path)
    
    (reports_dir / "best_model.txt").write_text(
        f"Champion Model Selected by PR-AUC: {best_name}\n"
        f"Decision Threshold: {args.threshold}\n\n"
        + classification_report(y_test, best_preds, zero_division=0),
        encoding="utf-8",
    )

    print(f"  Champion Model: {best_name}")
    print(f"  Saved Artifact: {model_path}")
    print(f"  Reports & Visuals: {reports_dir}")
    print("\n[COMPLETE] End-to-end training and evaluation finished successfully!")

if __name__ == "__main__":
    main()
