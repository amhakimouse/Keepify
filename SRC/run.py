"""End-to-end training entry point."""
import argparse
from pathlib import Path
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from .preprocessing import load_data, extract_target, make_features
from .train import train_models
from .evaluate import evaluate_models

ROOT = Path(__file__).resolve().parents[1]

def main():
    parser = argparse.ArgumentParser(description="Train Telco customer churn models.")
    parser.add_argument(
        "--data",
        default=str(ROOT / "DATA/dataset/CaliforniaData/Telco_customer_churn.xlsx"),
        help="Path to labelled CSV/XLSX dataset",
    )
    parser.add_argument("--test-size", type=float, default=0.20)
    parser.add_argument("--random-state", type=int, default=42)
    parser.add_argument("--threshold", type=float, default=0.50)
    args = parser.parse_args()

    raw = load_data(args.data)
    y = extract_target(raw)
    X = make_features(raw)

    if X.empty:
        raise ValueError("No usable predictor columns remain after preprocessing.")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=args.test_size, random_state=args.random_state,
        stratify=y,
    )

    print(f"Rows: {len(raw):,} | Features before encoding: {X.shape[1]}")
    print(f"Churn rate: {y.mean():.1%}")
    print("Training candidate models...")
    models = train_models(X_train, y_train, args.random_state)

    reports = ROOT / "REPORTS"
    best_name, scores = evaluate_models(
        models, X_test, y_test, reports, threshold=args.threshold
    )
    best_model = models[best_name]
    best_pred = (best_model.predict_proba(X_test)[:, 1] >= args.threshold).astype(int)

    model_dir = ROOT / "MODELS"
    model_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(best_model, model_dir / "best_churn_model.joblib")
    joblib.dump(list(X.columns), model_dir / "feature_columns.joblib")

    scores.to_csv(reports / "model_comparison.csv", index=False)
    (reports / "best_model.txt").write_text(
        f"Best model selected by PR-AUC: {best_name}\n"
        f"Decision threshold: {args.threshold}\n\n"
        + classification_report(y_test, best_pred, zero_division=0),
        encoding="utf-8",
    )

    print("\nModel comparison:")
    print(scores.to_string(index=False))
    print(f"\nBest model: {best_name}")
    print(f"Saved model: {model_dir / 'best_churn_model.joblib'}")
    print(f"Reports: {reports}")

if __name__ == "__main__":
    main()
