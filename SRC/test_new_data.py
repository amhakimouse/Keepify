import pandas as pd

df = pd.read_excel(
    "C:\\Users\\hp\\Downloads\\Customer_Churn_ML_Completed\\Customer_Churn_ML_Completed\\DATA\\dataset\\CaliforniaData\\Telco_customer_churn.xlsx"
)

# Remove target and post-outcome information
df = df.drop(
    columns=[
        "Churn Label",
        "Churn Value",
        "Churn Score",
        "Churn Reason",
        "CLTV"
    ],
    errors="ignore"
)

# Keep 10 customers for testing
df.head(10).to_csv("new_customers.csv", index=False)

print("Test dataset created!")