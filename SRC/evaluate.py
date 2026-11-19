"""Model evaluation, metrics, confusion matrix and feature importance."""
from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
from sklearn.metrics import (
    average_precision_score, classification_report, ConfusionMatrixDisplay,
    f1_score, precision_score, recall_score, roc_auc_score,
    RocCurveDisplay, PrecisionRecallDisplay,
)

def evaluate_models(models, X_test, y_test, report_dir, threshold=0.5):
    report_dir = Path(report_dir)
    report_dir.mkdir(parents=True, exist_ok=True)
    rows, predictions = [], {}

    for name, model in models.items():
        probabilities = model.predict_proba(X_test)[:, 1]
        predicted = (probabilities >= threshold).astype(int)
        predictions[name] = (probabilities, predicted)
        rows.append({
            "model": name,
            "precision": precision_score(y_test, predicted, zero_division=0),
            "recall": recall_score(y_test, predicted, zero_division=0),
            "f1": f1_score(y_test, predicted, zero_division=0),
            "roc_auc": roc_auc_score(y_test, probabilities),
            "pr_auc": average_precision_score(y_test, probabilities),
        })
        (report_dir / f"{name}_classification_report.txt").write_text(
            classification_report(y_test, predicted, zero_division=0),
            encoding="utf-8",
        )

    scores = pd.DataFrame(rows).sort_values("pr_auc", ascending=False)
    scores.to_csv(report_dir / "model_comparison.csv", index=False)
    best_name = str(scores.iloc[0]["model"])
    best_prob, best_pred = predictions[best_name]

    ConfusionMatrixDisplay.from_predictions(y_test, best_pred)
    plt.title(f"Confusion matrix — {best_name} (threshold={threshold:.2f})")
    plt.tight_layout()
    plt.savefig(report_dir / "confusion_matrix.png", dpi=160)
    plt.close()

    RocCurveDisplay.from_predictions(y_test, best_prob)
    plt.title(f"ROC curve — {best_name}")
    plt.tight_layout()
    plt.savefig(report_dir / "roc_curve.png", dpi=160)
    plt.close()

    PrecisionRecallDisplay.from_predictions(y_test, best_prob)
    plt.title(f"Precision-recall curve — {best_name}")
    plt.tight_layout()
    plt.savefig(report_dir / "precision_recall_curve.png", dpi=160)
    plt.close()

    return best_name, scores
