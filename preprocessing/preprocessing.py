import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import (
    FunctionTransformer,
    OneHotEncoder,
    OrdinalEncoder,
    StandardScaler,
    SplineTransformer,
)

INTERNET_OPTION_COLS = [
    "Online Security", "Online Backup", "Device Protection",
    "Tech Support", "Streaming TV", "Streaming Movies",
]

BINARY_NATIVE_COLS = [
    "Senior Citizen", "Partner", "Dependents", "Paperless Billing",
]

def clean_features(X: pd.DataFrame) -> pd.DataFrame:
    X_c = X.copy()
    cols_present = [c for c in INTERNET_OPTION_COLS if c in X_c.columns]
    X_c[cols_present] = X_c[cols_present].replace("No internet service", "No")
    cols_to_drop = ["City", "Zip Code", "Gender", "Phone Service"]
    return X_c.drop(columns=[c for c in cols_to_drop if c in X_c.columns])

class Contract_Tenure_Interaction(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None):
        self.is_fitted_ = True
        return self

    def __sklearn_is_fitted__(self):
        return getattr(self, "is_fitted_", False)

    def transform(self, X):
        contract_ord = X[:, [0]]
        tenure_scaled = X[:, [1]]
        return np.hstack([contract_ord, tenure_scaled, contract_ord * tenure_scaled])

def build_linear_preprocessor() -> Pipeline:
    """Retourne le pipeline de preprocessing pour modèles linéaires (unfitted)."""
    contract_tenure_pipe = Pipeline(steps=[
        ("encode_scale", ColumnTransformer(transformers=[
            ("contract_ord", OrdinalEncoder(categories=[["Month-to-month", "One year", "Two year"]]), ["Contract"]),
            ("tenure_std", StandardScaler(), ["Tenure Months"]),
        ])),
        ("interaction", Contract_Tenure_Interaction()),
    ])

    monthly_spline_pipe = Pipeline(steps=[
        ("spline", SplineTransformer(n_knots=4, degree=3, include_bias=False)),
        ("scaler", StandardScaler()),
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("contract_x_tenure", contract_tenure_pipe, ["Contract", "Tenure Months"]),
            ("monthly_spline", monthly_spline_pipe, ["Monthly Charges"]),
            ("mult_lines", OrdinalEncoder(categories=[["No phone service", "No", "Yes"]]), ["Multiple Lines"]),
            ("binary", OrdinalEncoder(categories=[["No", "Yes"]] * (len(BINARY_NATIVE_COLS) + len(INTERNET_OPTION_COLS))),
             BINARY_NATIVE_COLS + INTERNET_OPTION_COLS),
            ("internet_ohe", OneHotEncoder(categories=[["No", "DSL", "Fiber optic"]], drop=["No"], sparse_output=False),
             ["Internet Service"]),
            ("payment_ohe", OneHotEncoder(drop="first", sparse_output=False), ["Payment Method"]),
        ],
        remainder="drop"
    )

    return Pipeline(steps=[
        ("cleaning", FunctionTransformer(clean_features)),
        ("preprocessing", preprocessor),
    ])

def build_tree_preprocessor() -> Pipeline:
    """Retourne le pipeline de preprocessing pour modèles d'arbres (unfitted)."""
    preprocessor = ColumnTransformer(
        transformers=[
            ("num_gps", "passthrough", ["Tenure Months", "Monthly Charges", "Latitude", "Longitude"]),
            ("contract_ord", OrdinalEncoder(categories=[["Month-to-month", "One year", "Two year"]]), ["Contract"]),
            ("mult_lines", OrdinalEncoder(categories=[["No phone service", "No", "Yes"]]), ["Multiple Lines"]),
            ("binary", OrdinalEncoder(categories=[["No", "Yes"]] * (len(BINARY_NATIVE_COLS) + len(INTERNET_OPTION_COLS))),
             BINARY_NATIVE_COLS + INTERNET_OPTION_COLS),
            ("internet_ohe", OneHotEncoder(categories=[["No", "DSL", "Fiber optic"]], drop=["No"], sparse_output=False),
             ["Internet Service"]),
            ("payment_ohe", OneHotEncoder(drop="first", sparse_output=False), ["Payment Method"]),
        ],
        remainder="drop"
    )

    return Pipeline(steps=[
        ("cleaning", FunctionTransformer(clean_features)),
        ("preprocessing", preprocessor),
    ])