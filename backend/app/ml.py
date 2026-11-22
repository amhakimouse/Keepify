"""ML integration: load trained model, predict, and auto-retrain."""
import json
import os
import threading
from datetime import datetime, timezone
import joblib
import pandas as pd
from pathlib import Path
from sqlalchemy.orm import Session

ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = ROOT / "MODELS" / "best_churn_model.joblib"
FEATURES_PATH = ROOT / "MODELS" / "feature_columns.joblib"

import sys
SRC_PATH = ROOT / "SRC"
if str(SRC_PATH) not in sys.path:
    sys.path.insert(0, str(ROOT))

try:
    from SRC.preprocessing import make_features, EXCLUDED, COLUMN_NAMES, TARGET
except Exception:
    from sklearn.compose import ColumnTransformer
    from sklearn.impute import SimpleImputer
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import OneHotEncoder, StandardScaler

    TARGET = "Churn"
    COLUMN_NAMES = {
        "CustomerID": "customerID",
        "Tenure Months": "tenure",
        "Monthly Charges": "MonthlyCharges",
        "Total Charges": "TotalCharges",
        "Churn Label": "Churn",
        "Payment Method": "PaymentMethod",
        "Senior Citizen": "SeniorCitizen",
        "Phone Service": "PhoneService",
        "Multiple Lines": "MultipleLines",
        "Internet Service": "InternetService",
        "Online Security": "OnlineSecurity",
        "Online Backup": "OnlineBackup",
        "Device Protection": "DeviceProtection",
        "Tech Support": "TechSupport",
        "Streaming TV": "StreamingTV",
        "Streaming Movies": "StreamingMovies",
        "Paperless Billing": "PaperlessBilling",
    }
    EXCLUDED = [
        "Churn Value", "Churn Score", "Churn Reason", "CLTV", "Count",
        "Country", "State", "City", "Zip Code", "Lat Long",
        "Latitude", "Longitude",
    ]

    def normalize_columns(df):
        return df.rename(columns=COLUMN_NAMES).copy()

    def make_features(df):
        data = normalize_columns(df).copy()
        for col in ["TotalCharges", "MonthlyCharges", "tenure"]:
            if col in data.columns:
                data[col] = pd.to_numeric(data[col], errors="coerce")
        if "SeniorCitizen" in data.columns:
            data["SeniorCitizen"] = data["SeniorCitizen"].astype("string")
        if "tenure" in data.columns:
            data["is_new_customer"] = (data["tenure"] <= 6).astype(int)
            data["tenure_group"] = pd.cut(
                data["tenure"], bins=[-1, 6, 12, 24, float("inf")],
                labels=["0-6 months", "7-12 months", "13-24 months", "24+ months"],
            ).astype("string")
        if "Contract" in data.columns:
            data["is_month_to_month"] = (
                data["Contract"].astype("string").str.lower() == "month-to-month"
            ).astype(int)
        if {"Contract", "PaymentMethod"}.issubset(data.columns):
            data["contract_payment"] = (
                data["Contract"].astype("string").fillna("Unknown")
                + "__"
                + data["PaymentMethod"].astype("string").fillna("Unknown")
            )
        service_cols = [
            "PhoneService", "MultipleLines", "OnlineSecurity", "OnlineBackup",
            "DeviceProtection", "TechSupport", "StreamingTV", "StreamingMovies",
        ]
        present = [c for c in service_cols if c in data.columns]
        if present:
            data["number_of_services"] = data[present].apply(
                lambda col: col.astype("string").str.strip().str.lower().eq("yes")
            ).sum(axis=1)
        return data.drop(
            columns=["customerID", TARGET, *EXCLUDED], errors="ignore",
        )


_model = None
_feature_columns = None
_model_name = "inconnu"
META_PATH = ROOT / "MODELS" / "model_meta.json"

_retrain_lock = threading.Lock()
_retrain_state = {
    "status": "idle",
    "trigger": None,
    "message": None,
    "error": None,
    "result": None,
    "started_at": None,
    "finished_at": None,
}

CLASSIFIER_NAMES = {
    "XGBClassifier": "xgboost",
    "LogisticRegression": "logistic_regression",
    "RandomForestClassifier": "random_forest",
}


def _plain(value):
    if isinstance(value, dict):
        return {key: _plain(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_plain(item) for item in value]
    if hasattr(value, "item"):
        try:
            return value.item()
        except Exception:
            return value
    return value


def _classifier_name(model):
    classifier = model
    if hasattr(model, "named_steps") and "classifier" in model.named_steps:
        classifier = model.named_steps["classifier"]
    return CLASSIFIER_NAMES.get(type(classifier).__name__, type(classifier).__name__)


def _read_saved_name():
    if META_PATH.exists():
        try:
            meta = json.loads(META_PATH.read_text(encoding="utf-8"))
            if meta.get("model_name"):
                return meta["model_name"], meta
        except Exception:
            pass
    report = ROOT / "REPORTS" / "best_model.txt"
    if report.exists():
        for line in report.read_text(encoding="utf-8").splitlines():
            if "PR-AUC:" in line:
                return line.split(":")[-1].strip(), {}
    return None, {}


def load_model():
    global _model, _feature_columns, _model_name
    if MODEL_PATH.exists() and FEATURES_PATH.exists():
        _model = joblib.load(MODEL_PATH)
        _feature_columns = joblib.load(FEATURES_PATH)
        saved_name, _meta = _read_saved_name()
        _model_name = saved_name or _classifier_name(_model)
        return True
    return False


def is_model_loaded():
    return _model is not None


def get_model_info():
    _name, meta = _read_saved_name()
    return {
        "loaded": _model is not None,
        "model_name": _model_name if _model is not None else (_name or "inconnu"),
        "trained_at": meta.get("trained_at"),
        "trigger": meta.get("trigger"),
        "samples": meta.get("samples"),
        "scores": meta.get("scores") or [],
    }


def get_retrain_state():
    with _retrain_lock:
        state = dict(_retrain_state)
    if state["status"] == "idle":
        info = get_model_info()
        state["model_name"] = info["model_name"]
        state["trained_at"] = info["trained_at"]
        if info["scores"]:
            state["result"] = {"best_model": info["model_name"], "scores": info["scores"]}
    else:
        state["model_name"] = _model_name
    return state


FIELD_MAP = {
    "gender": "Gender",
    "senior_citizen": "SeniorCitizen",
    "partner": "Partner",
    "dependents": "Dependents",
    "tenure_months": "tenure",
    "phone_service": "PhoneService",
    "multiple_lines": "MultipleLines",
    "internet_service": "InternetService",
    "online_security": "OnlineSecurity",
    "online_backup": "OnlineBackup",
    "device_protection": "DeviceProtection",
    "tech_support": "TechSupport",
    "streaming_tv": "StreamingTV",
    "streaming_movies": "StreamingMovies",
    "contract": "Contract",
    "paperless_billing": "PaperlessBilling",
    "payment_method": "PaymentMethod",
    "monthly_charges": "MonthlyCharges",
    "total_charges": "TotalCharges",
}

RAW_FEATURE_MAP = {
    "gender": "Gender",
    "Gender": "Gender",
    "senior_citizen": "Senior Citizen",
    "Senior Citizen": "Senior Citizen",
    "SeniorCitizen": "Senior Citizen",
    "partner": "Partner",
    "Partner": "Partner",
    "dependents": "Dependents",
    "Dependents": "Dependents",
    "tenure_months": "Tenure Months",
    "tenure": "Tenure Months",
    "Tenure Months": "Tenure Months",
    "phone_service": "Phone Service",
    "Phone Service": "Phone Service",
    "PhoneService": "Phone Service",
    "multiple_lines": "Multiple Lines",
    "Multiple Lines": "Multiple Lines",
    "MultipleLines": "Multiple Lines",
    "internet_service": "Internet Service",
    "Internet Service": "Internet Service",
    "InternetService": "Internet Service",
    "online_security": "Online Security",
    "Online Security": "Online Security",
    "OnlineSecurity": "Online Security",
    "online_backup": "Online Backup",
    "Online Backup": "Online Backup",
    "OnlineBackup": "Online Backup",
    "device_protection": "Device Protection",
    "Device Protection": "Device Protection",
    "DeviceProtection": "Device Protection",
    "tech_support": "Tech Support",
    "Tech Support": "Tech Support",
    "TechSupport": "Tech Support",
    "streaming_tv": "Streaming TV",
    "Streaming TV": "Streaming TV",
    "StreamingTV": "Streaming TV",
    "streaming_movies": "Streaming Movies",
    "Streaming Movies": "Streaming Movies",
    "StreamingMovies": "Streaming Movies",
    "contract": "Contract",
    "Contract": "Contract",
    "paperless_billing": "Paperless Billing",
    "Paperless Billing": "Paperless Billing",
    "PaperlessBilling": "Paperless Billing",
    "payment_method": "Payment Method",
    "Payment Method": "Payment Method",
    "PaymentMethod": "Payment Method",
    "monthly_charges": "Monthly Charges",
    "Monthly Charges": "Monthly Charges",
    "MonthlyCharges": "Monthly Charges",
    "total_charges": "Total Charges",
    "Total Charges": "Total Charges",
    "TotalCharges": "Total Charges",
    "latitude": "Latitude",
    "Latitude": "Latitude",
    "longitude": "Longitude",
    "Longitude": "Longitude",
}


def map_customer_input(data: dict) -> dict:
    mapped = {}
    for k, v in data.items():
        if k in FIELD_MAP:
            mapped[FIELD_MAP[k]] = v
        else:
            mapped[k] = v
    return mapped


def predict_churn(input_dict: dict):
    if _model is None or _feature_columns is None:
        loaded = load_model()
        if not loaded:
            raise RuntimeError("Model not trained yet. Please train first.")

    # Check if loaded model uses the raw column schema (e.g. from MODELS_to_use)
    if "Tenure Months" in _feature_columns:
        row = {}
        for k, v in input_dict.items():
            mapped_k = RAW_FEATURE_MAP.get(k, k)
            row[mapped_k] = v
        for col in _feature_columns:
            if col not in row:
                row[col] = None
        df_row = pd.DataFrame([row])[list(_feature_columns)]
        probabilities = _model.predict_proba(df_row)[:, 1]
    else:
        df = pd.DataFrame([input_dict])
        features = make_features(df)
        for col in _feature_columns:
            if col not in features.columns:
                features[col] = pd.NA
        features = features.loc[:, list(_feature_columns)]
        probabilities = _model.predict_proba(features)[:, 1]

    prob = float(probabilities[0])
    # Deployment optimal threshold T* = 0.29 (from experiments/results/05_threshold_roi_summary.csv)
    predicted = int(prob >= 0.29)

    if prob < 0.30:
        risk = "Low"
    elif prob < 0.60:
        risk = "Medium"
    else:
        risk = "High"

    return {
        "churn_probability": round(prob, 4),
        "predicted_churn": predicted,
        "risk_segment": risk,
        "model_used": _model_name,
    }


def auto_retrain(db: Session, data_path: str = None, trigger: str = "manual"):
    """Auto-retrain the model when new data/subscription is added."""
    from sklearn.model_selection import train_test_split

    if data_path is None:
        data_path = str(ROOT / "dataset" / "CaliforniaData" / "Telco_customer_churn.xlsx")

    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found: {data_path}")

    try:
        from SRC.preprocessing import load_data, extract_target
    except Exception:
        def load_data(path):
            p = Path(path)
            if p.suffix.lower() in (".xlsx", ".xls"):
                df = pd.read_excel(p)
            else:
                df = pd.read_csv(p)
            return df.rename(columns=COLUMN_NAMES).copy()

        def extract_target(df):
            normalized = df.rename(columns=COLUMN_NAMES).copy()
            raw = normalized[TARGET].astype("string").str.strip().str.lower()
            mapping = {"yes": 1, "no": 0, "1": 1, "0": 0, "true": 1, "false": 0}
            y = raw.map(mapping)
            return y.astype(int)

    raw = load_data(data_path)
    y = extract_target(raw)
    X = make_features(raw)

    if X.empty:
        raise ValueError("No usable predictor columns after preprocessing.")

    # Incorporate new customer data from DB if available
    from app.models import Customer
    db_customers = db.query(Customer).all()
    if db_customers:
        db_rows = []
        for c in db_customers:
            db_rows.append({
                "customerID": c.customer_id,
                "Gender": c.gender,
                "Senior Citizen": c.senior_citizen,
                "Partner": c.partner,
                "Dependents": c.dependents,
                "Tenure Months": c.tenure_months,
                "Phone Service": c.phone_service,
                "Multiple Lines": c.multiple_lines,
                "Internet Service": c.internet_service,
                "Online Security": c.online_security,
                "Online Backup": c.online_backup,
                "Device Protection": c.device_protection,
                "Tech Support": c.tech_support,
                "Streaming TV": c.streaming_tv,
                "Streaming Movies": c.streaming_movies,
                "Contract": c.contract,
                "Paperless Billing": c.paperless_billing,
                "Payment Method": c.payment_method,
                "Monthly Charges": c.monthly_charges,
                "Total Charges": c.total_charges,
                "Churn Label": c.churn_label,
            })
        db_df = pd.DataFrame(db_rows)
        if not db_df.empty and "Churn Label" in db_df.columns:
            db_df = db_df.dropna(subset=["Churn Label"])
            # The reference file is already loaded. Keep only customers that
            # are not already in it, otherwise the same person lands in both
            # train and test and the score is no longer honest.
            if "customerID" in raw.columns and "customerID" in db_df.columns:
                known = set(raw["customerID"].astype(str))
                db_df = db_df[~db_df["customerID"].astype(str).isin(known)]
            if not db_df.empty:
                y_db = extract_target(db_df)
                X_db = make_features(db_df)
                X = pd.concat([X, X_db], ignore_index=True)
                y = pd.concat([y, y_db], ignore_index=True)

    from SRC.train import train_models
    from SRC.evaluate import evaluate_models
    import joblib as _joblib

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    models = train_models(X_train, y_train, 42)
    reports_dir = ROOT / "REPORTS"
    best_name, scores = evaluate_models(models, X_test, y_test, reports_dir, threshold=0.5)
    best_model = models[best_name]

    model_dir = ROOT / "MODELS"
    model_dir.mkdir(parents=True, exist_ok=True)
    _joblib.dump(best_model, model_dir / "best_churn_model.joblib")
    _joblib.dump(list(X.columns), model_dir / "feature_columns.joblib")
    score_rows = _plain(scores.to_dict("records"))
    meta = {
        "model_name": best_name,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "trigger": trigger,
        "samples": int(len(X)),
        "scores": score_rows,
    }
    (model_dir / "model_meta.json").write_text(
        json.dumps(meta, indent=2), encoding="utf-8"
    )

    load_model()

    return {
        "best_model": best_name,
        "scores": score_rows,
        "samples": int(len(X)),
        "trigger": trigger,
        "message": "Model auto-retrained successfully",
    }


def start_background_retrain(trigger: str = "manual"):
    """Train without blocking the request that asked for it."""
    from app.database import SessionLocal

    with _retrain_lock:
        if _retrain_state["status"] == "running":
            return dict(_retrain_state)
        _retrain_state.update({
            "status": "running",
            "trigger": trigger,
            "message": "Entraînement en cours",
            "error": None,
            "result": None,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "finished_at": None,
        })
        snapshot = dict(_retrain_state)

    def _run():
        db = SessionLocal()
        try:
            result = auto_retrain(db, trigger=trigger)
            with _retrain_lock:
                _retrain_state.update({
                    "status": "success",
                    "message": "Le modèle en production a été mis à jour",
                    "error": None,
                    "result": {
                        "best_model": result["best_model"],
                        "scores": result["scores"],
                        "samples": result["samples"],
                    },
                    "finished_at": datetime.now(timezone.utc).isoformat(),
                })
        except Exception as exc:
            with _retrain_lock:
                _retrain_state.update({
                    "status": "error",
                    "message": "L'entraînement a échoué",
                    "error": str(exc),
                    "finished_at": datetime.now(timezone.utc).isoformat(),
                })
        finally:
            db.close()

    threading.Thread(target=_run, daemon=True, name="keepify-retrain").start()
    snapshot["model_name"] = _model_name
    return snapshot