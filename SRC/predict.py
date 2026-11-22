"""Production inference scoring entry point."""
from pathlib import Path
import argparse
import joblib
import pandas as pd
from .preprocessing import load_data, get_feature_dataframe

ROOT = Path(__file__).resolve().parents[1]

def predict_churn(data_path: str, model_path: str = None, threshold: float = 0.50) -> pd.DataFrame:
    """Scores an incoming dataset using the trained production model."""
    if model_path is None:
        model_path = ROOT / "MODELS" / "best_churn_model.joblib"
    else:
        model_path = Path(model_path)
        
    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found: {model_path}. Please train a model first using SRC.run.")
        
    model = joblib.load(model_path)
    raw = load_data(data_path)
    X = get_feature_dataframe(raw)
    
    probs = model.predict_proba(X)[:, 1]
    preds = (probs >= threshold).astype(int)
    
    result = raw.copy()
    result["churn_probability"] = probs
    result["churn_prediction"] = preds
    return result

def main():
    parser = argparse.ArgumentParser(description="Predict churn probabilities on new customer data.")
    parser.add_argument("--data", required=True, help="Path to raw customer data (.csv, .xlsx)")
    parser.add_argument("--output", default="predictions.csv", help="Output file path for predictions")
    parser.add_argument("--threshold", type=float, default=0.50, help="Classification probability cutoff")
    args = parser.parse_args()
    
    df_preds = predict_churn(args.data, threshold=args.threshold)
    df_preds.to_csv(args.output, index=False)
    print(f"[SUCCESS] Predictions saved to: {args.output}")

if __name__ == "__main__":
    main()
