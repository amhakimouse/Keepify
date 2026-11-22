"""Model evaluation, comparative metrics, and diagnostic visual plots."""
from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    classification_report,
    ConfusionMatrixDisplay,
    RocCurveDisplay,
    PrecisionRecallDisplay,
)

def evaluate_models(models, X_test, y_test, report_dir: Path, threshold: float = 0.50):
    """Computes comprehensive evaluation metrics and saves artifacts."""
    report_dir = Path(report_dir)
    report_dir.mkdir(parents=True, exist_ok=True)
    
    rows = []
    predictions = {}
    
    for name, model in models.items():
        probs = model.predict_proba(X_test)[:, 1]
        preds = (probs >= threshold).astype(int)
        predictions[name] = (probs, preds)
        
        acc = accuracy_score(y_test, preds)
        prec = precision_score(y_test, preds, zero_division=0)
        rec = recall_score(y_test, preds, zero_division=0)
        f1 = f1_score(y_test, preds, zero_division=0)
        roc_auc = roc_auc_score(y_test, probs)
        pr_auc = average_precision_score(y_test, probs)
        
        rows.append({
            "model": name,
            "accuracy": acc,
            "precision": prec,
            "recall": rec,
            "f1": f1,
            "roc_auc": roc_auc,
            "pr_auc": pr_auc,
        })
        
        # Save individual classification report
        clean_name = name.lower().replace(" ", "_")
        report_text = classification_report(y_test, preds, zero_division=0)
        (report_dir / f"{clean_name}_classification_report.txt").write_text(report_text, encoding="utf-8")
        
    scores = pd.DataFrame(rows).sort_values("pr_auc", ascending=False).reset_index(drop=True)
    scores.to_csv(report_dir / "model_comparison.csv", index=False)
    
    best_name = str(scores.iloc[0]["model"])
    best_prob, best_pred = predictions[best_name]
    
    # Confusion matrix
    ConfusionMatrixDisplay.from_predictions(y_test, best_pred)
    plt.title(f"Confusion Matrix — {best_name} (Threshold = {threshold:.2f})")
    plt.tight_layout()
    plt.savefig(report_dir / "confusion_matrix.png", dpi=160)
    plt.close()
    
    # ROC Curve
    RocCurveDisplay.from_predictions(y_test, best_prob)
    plt.title(f"ROC Curve — {best_name}")
    plt.tight_layout()
    plt.savefig(report_dir / "roc_curve.png", dpi=160)
    plt.close()
    
    # PR Curve
    PrecisionRecallDisplay.from_predictions(y_test, best_prob)
    plt.title(f"Precision-Recall Curve — {best_name}")
    plt.tight_layout()
    plt.savefig(report_dir / "precision_recall_curve.png", dpi=160)
    plt.close()
    
    # Save predictions dataframe
    df_preds = X_test.copy()
    df_preds["actual_churn"] = y_test.values
    df_preds["predicted_probability"] = best_prob
    df_preds["predicted_churn"] = best_pred
    df_preds.to_csv(report_dir / "churn_predictions.csv", index=False)
    
    return best_name, scores
