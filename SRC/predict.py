"""Load a saved model and score new customer records."""
import argparse
from pathlib import Path
import joblib
import pandas as pd
from .preprocessing import make_features

def predict_file(input_path, model_path, output_path, threshold=0.5):
    model = joblib.load(model_path)
    path = Path(input_path)
    if path.suffix.lower() in (".xlsx", ".xls"):
        raw = pd.read_excel(path)
    else:
        raw = pd.read_csv(path)

    features = make_features(raw)
    probabilities = model.predict_proba(features)[:, 1]
    result = pd.DataFrame({
        "churn_probability": probabilities,
        "predicted_churn": (probabilities >= threshold).astype(int),
        "risk_segment": pd.cut(
            probabilities,
            bins=[-0.001, 0.30, 0.60, 1.001],
            labels=["Low", "Medium", "High"],
        ).astype(str),
    })
    if "CustomerID" in raw.columns:
        result.insert(0, "CustomerID", raw["CustomerID"].values)
    elif "customerID" in raw.columns:
        result.insert(0, "CustomerID", raw["customerID"].values)

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if output_path.suffix.lower() == ".xlsx":
        result.to_excel(output_path, index=False)
    else:
        result.to_csv(output_path, index=False)
    return result

def main():
    parser = argparse.ArgumentParser(description="Predict customer churn.")
    parser.add_argument("--input", required=True, help="CSV or Excel customer file")
    parser.add_argument("--model", default="MODELS/best_churn_model.joblib")
    parser.add_argument("--output", default="REPORTS/churn_predictions.csv")
    parser.add_argument("--threshold", type=float, default=0.5)
    args = parser.parse_args()
    result = predict_file(args.input, args.model, args.output, args.threshold)
    print(result.head(10).to_string(index=False))
    print(f"\nSaved predictions to: {args.output}")

if __name__ == "__main__":
    main()
