"""Model construction, pipeline assembly, and training."""
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from xgboost import XGBClassifier

from .preprocessing import build_linear_preprocessor, build_tree_preprocessor

def build_candidate_pipelines(y_train, random_state: int = 42):
    """Instantiates models using specialized linear and tree preprocessors."""
    neg_pos_ratio = (y_train == 0).sum() / (y_train == 1).sum()
    
    pipelines = {
        "Logistic Regression": Pipeline([
            ("preprocessor", build_linear_preprocessor()),
            ("classifier", LogisticRegression(
                max_iter=2000,
                class_weight="balanced",
                random_state=random_state,
            )),
        ]),
        "Random Forest": Pipeline([
            ("preprocessor", build_tree_preprocessor()),
            ("classifier", RandomForestClassifier(
                n_estimators=350,
                min_samples_leaf=3,
                class_weight="balanced",
                random_state=random_state,
                n_jobs=-1,
            )),
        ]),
        "XGBoost": Pipeline([
            ("preprocessor", build_tree_preprocessor()),
            ("classifier", XGBClassifier(
                n_estimators=350,
                max_depth=3,
                learning_rate=0.04,
                scale_pos_weight=neg_pos_ratio,
                subsample=0.85,
                colsample_bytree=0.85,
                objective="binary:logistic",
                eval_metric="logloss",
                random_state=random_state,
                n_jobs=2,
            )),
        ]),
    }
    return pipelines

def train_models(X_train, y_train, random_state: int = 42):
    """Trains all candidate models on training features."""
    models = build_candidate_pipelines(y_train, random_state=random_state)
    for name, pipe in models.items():
        print(f"  [TRAINING] {name}...")
        pipe.fit(X_train, y_train)
    return models
