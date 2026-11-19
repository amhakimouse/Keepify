"""Model definitions and training."""
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from .preprocessing import make_preprocessor

def candidate_models(random_state=42):
    models = {
        "logistic_regression": LogisticRegression(
            max_iter=2000, class_weight="balanced", random_state=random_state
        ),
        "random_forest": RandomForestClassifier(
            n_estimators=350, min_samples_leaf=3, class_weight="balanced",
            random_state=random_state, n_jobs=-1
        ),
    }
    
    try:
        from xgboost import XGBClassifier
        models["xgboost"] = XGBClassifier(
            n_estimators=350, max_depth=3, learning_rate=0.04,
            subsample=0.85, colsample_bytree=0.85,
            objective="binary:logistic", eval_metric="logloss",
            random_state=random_state, n_jobs=2
        )
    except ImportError:
        pass
    return models

def train_models(X_train, y_train, random_state=42):
    fitted = {}
    for name, classifier in candidate_models(random_state).items():
        pipeline = Pipeline([
            ("preprocessing", make_preprocessor(X_train)),
            ("classifier", classifier),
        ])
        pipeline.fit(X_train, y_train)
        fitted[name] = pipeline
    return fitted
