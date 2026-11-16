"""Data loading, schema normalization and leakage-safe preprocessing."""
from pathlib import Path
import pandas as pd
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

# Columns that reveal the outcome or are identifiers/geographic descriptors.
EXCLUDED = [
    "Churn Value", "Churn Score", "Churn Reason", "CLTV", "Count",
    "Country", "State", "City", "Zip Code", "Lat Long",
    "Latitude", "Longitude",
]

def normalize_columns(df):
    """Normalize known source column names without changing unknown columns."""
    return df.rename(columns=COLUMN_NAMES).copy()

def load_data(path):
    """Load CSV/XLSX and validate target/customer identifiers."""
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"Dataset not found: {path}")
    if path.suffix.lower() in (".xlsx", ".xls"):
        df = pd.read_excel(path)
    elif path.suffix.lower() == ".csv":
        df = pd.read_csv(path)
    else:
        raise ValueError("Supported dataset formats are .csv, .xlsx and .xls")

    df = normalize_columns(df)
    if TARGET not in df.columns:
        raise ValueError(
            f"Missing target column '{TARGET}'. This dataset is not labelled "
            "for supervised churn prediction."
        )
    if "customerID" in df.columns and df["customerID"].duplicated().any():
        duplicates = int(df["customerID"].duplicated().sum())
        raise ValueError(f"Found {duplicates} duplicated customer IDs.")
    return df.drop_duplicates().reset_index(drop=True)

def extract_target(df):
    """Convert common churn labels to binary values: churn=1, retained=0."""
    normalized = normalize_columns(df)
    raw = normalized[TARGET].astype("string").str.strip().str.lower()
    mapping = {"yes": 1, "no": 0, "1": 1, "0": 0, "true": 1, "false": 0}
    y = raw.map(mapping)
    if y.isna().any():
        bad = raw[y.isna()].dropna().unique().tolist()[:10]
        raise ValueError(f"Unexpected/missing churn labels: {bad}")
    return y.astype(int)

def make_features(df):
    """Create model features; never include target, IDs or post-churn fields."""
    data = normalize_columns(df).copy()
    for col in ["TotalCharges", "MonthlyCharges", "tenure"]:
        if col in data.columns:
            data[col] = pd.to_numeric(data[col], errors="coerce")

    if "SeniorCitizen" in data.columns:
        data["SeniorCitizen"] = data["SeniorCitizen"].astype("string")

    if "tenure" in data.columns:
        data["is_new_customer"] = (data["tenure"] <= 6).astype(int)
        data["tenure_group"] = pd.cut(
            data["tenure"],
            bins=[-1, 6, 12, 24, float("inf")],
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

    # Exclude target and columns only known after the churn event.
    return data.drop(
        columns=["customerID", TARGET, *EXCLUDED],
        errors="ignore",
    )

def make_preprocessor(X):
    categorical = X.select_dtypes(
        include=["object", "category", "string", "bool"]
    ).columns.tolist()
    numerical = [c for c in X.columns if c not in categorical]

    numeric_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])
    categorical_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore")),
    ])
    return ColumnTransformer([
        ("num", numeric_pipe, numerical),
        ("cat", categorical_pipe, categorical),
    ], remainder="drop")
