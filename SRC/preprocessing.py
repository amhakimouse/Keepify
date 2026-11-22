"""Data loading, schema handling, target extraction, and preprocessor integration."""
from pathlib import Path
import pandas as pd
import numpy as np

# Import specialized preprocessors from preprocessing package
try:
    from preprocessing.preprocessing import (
        build_linear_preprocessor,
        build_tree_preprocessor,
        clean_features,
    )
except ImportError:
    from ..preprocessing.preprocessing import (
        build_linear_preprocessor,
        build_tree_preprocessor,
        clean_features,
    )

TARGET_COLUMNS = ["Churn Value", "Churn Label", "Churn"]

LEAKAGE_COLUMNS = [
    "Churn Value", "Churn Label", "Churn", "Churn Score", "Churn Reason",
    "CLTV", "Count", "CustomerID", "customerID"
]

def load_data(path: str = None) -> pd.DataFrame:
    """Loads Telco dataset from provided or candidate paths."""
    if path is not None:
        p = Path(path)
        if p.exists():
            return _read_file(p)
        raise FileNotFoundError(f"Dataset path not found: {path}")

    candidates = [
        Path("dataset/CaliforniaData/Telco_customer_churn.xlsx"),
        Path("DATA/dataset/CaliforniaData/Telco_customer_churn.xlsx"),
        Path("../dataset/CaliforniaData/Telco_customer_churn.xlsx"),
        Path("../DATA/dataset/CaliforniaData/Telco_customer_churn.xlsx"),
    ]
    for c in candidates:
        if c.exists():
            return _read_file(c)
            
    raise FileNotFoundError("Could not find Telco_customer_churn.xlsx in default locations.")

def _read_file(p: Path) -> pd.DataFrame:
    if p.suffix.lower() in (".xlsx", ".xls"):
        return pd.read_excel(p)
    return pd.read_csv(p)

def extract_target(df: pd.DataFrame) -> pd.Series:
    """Extracts binary churn target: 1 = Churned, 0 = Retained."""
    if "Churn Value" in df.columns:
        return df["Churn Value"].astype(int)
    if "Churn Label" in df.columns:
        return df["Churn Label"].astype(str).str.strip().str.lower().map({"yes": 1, "no": 0}).astype(int)
    if "Churn" in df.columns:
        val = df["Churn"].astype(str).str.strip().str.lower()
        return val.map({"yes": 1, "no": 0, "1": 1, "0": 0, "true": 1, "false": 0}).astype(int)
    raise ValueError("Target churn column ('Churn Value', 'Churn Label', or 'Churn') not found.")

def get_feature_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Removes outcome, identifier, and post-churn leakage fields."""
    return df.drop(columns=[c for c in LEAKAGE_COLUMNS if c in df.columns], errors="ignore")
