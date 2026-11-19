# Customer Churn Prediction & Retention

End-to-end machine-learning project for predicting telecom customer churn and supporting targeted retention decisions.

## Project structure

```text
Customer_Churn_ML/
├── DATA/dataset/CaliforniaData/Telco_customer_churn.xlsx
├── DATA/dataset/ScrapedData/Customer_Churn_Data_Large.xlsx
├── MODELS/
├── REPORTS/
├── SRC/
│   ├── preprocessing.py
│   ├── train.py
│   ├── evaluate.py
│   ├── predict.py
│   └── run.py
└── requirements.txt
```

## Dataset

The default training dataset is the California Telco customer dataset. It includes a churn label (`Churn Label`) and customer/service attributes.

The file in `ScrapedData` does not contain a churn target in its supplied schema, so it is not used for supervised training.

## Setup

Python 3.10+ is recommended.

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

## Train and evaluate

Run from the project root:

```bash
python -m SRC.run
```

To specify another labelled dataset:

```bash
python -m SRC.run --data "DATA/dataset/CaliforniaData/Telco_customer_churn.xlsx"
```

The pipeline:
1. Loads and validates the labelled dataset.
2. Normalizes column names and converts numeric columns.
3. Creates tenure, service-count and contract/payment features.
4. Splits the data using stratification.
5. Trains Logistic Regression, Random Forest and HistGradientBoosting; XGBoost is included when installed.
6. Compares precision, recall, F1, ROC-AUC and PR-AUC.
7. Selects the model by PR-AUC and saves it.

Generated files are saved in `MODELS/` and `REPORTS/`.

## Predict on new customers

Input data must contain the same predictor columns as the training data, but should not require a churn label.

```bash
python -m SRC.predict --input "new_customers.csv"
```

Optional arguments:

```bash
python -m SRC.predict --input "new_customers.xlsx" \
  --model "MODELS/best_churn_model.joblib" \
  --output "REPORTS/churn_predictions.xlsx" \
  --threshold 0.40
```

The output contains a churn probability, predicted churn class and Low/Medium/High risk segment.

## Important methodology notes

- `Churn Score`, `Churn Reason`, `Churn Value` and `CLTV` are excluded to avoid target leakage or post-outcome information.
- Missing numeric and categorical values are imputed inside the sklearn pipeline, so imputation is learned from training data only.
- Class imbalance is addressed with `class_weight="balanced"` for Logistic Regression and Random Forest. Metrics beyond accuracy are reported.
- PR-AUC is used for model selection because the positive churn class is the minority class.
- A 0.50 threshold is only a starting point. The business should select a threshold based on campaign capacity and the relative costs of false positives and false negatives.
- The model estimates risk, not the causal effect of a retention offer. Uplift testing or causal inference is needed to estimate which intervention actually prevents churn.

## Suggested business interpretation

Prioritize high-risk customers for investigation, then tailor retention actions to validated drivers such as contract type, tenure, support usage and billing patterns. Do not treat feature importance as proof of causality.
