"""
Seed script to import 7,043 customers from dataset/CaliforniaData/Telco_customer_churn.xlsx into PostgreSQL.
Usage:
    cd backend
    python seed_db.py
"""

import os
import sys
from pathlib import Path
import pandas as pd
from sqlalchemy import text

# Ensure backend package is in python path
current_dir = Path(__file__).resolve().parent
repo_root = current_dir.parent
sys.path.insert(0, str(current_dir))
sys.path.insert(0, str(repo_root))

from app.database import SessionLocal, engine, Base
from app.models import Customer

def seed():
    excel_path = repo_root / "dataset" / "CaliforniaData" / "Telco_customer_churn.xlsx"
    if not excel_path.exists():
        print(f"❌ Error: Dataset file not found at {excel_path}")
        return

    print(f"📂 Loading dataset from {excel_path}...")
    df = pd.read_excel(excel_path)
    print(f"📊 Dataset loaded: {df.shape[0]} rows, {df.shape[1]} columns.")

    # Clean data
    df['Total Charges'] = pd.to_numeric(df['Total Charges'], errors='coerce').fillna(0.0)
    df['Churn Value'] = pd.to_numeric(df['Churn Value'], errors='coerce').fillna(0).astype(int)
    df['Churn Score'] = pd.to_numeric(df['Churn Score'], errors='coerce').fillna(0).astype(int)
    df['CLTV'] = pd.to_numeric(df['CLTV'], errors='coerce').fillna(0).astype(int)
    df['Senior Citizen'] = df['Senior Citizen'].apply(lambda x: 1 if str(x).strip().lower() in ['yes', '1'] else 0)

    db = SessionLocal()
    try:
        existing = db.query(Customer).count()
        print(f"🔍 Existing customers in database: {existing}")
        if existing > 0:
            print("⚠️ Purging existing customers...")
            db.execute(text("DELETE FROM customers"))
            db.commit()

        print("🚀 Importing 7,043 customers...")
        batch = []
        for i, row in df.iterrows():
            c = Customer(
                customer_id=str(row['CustomerID']).strip(),
                gender=str(row.get('Gender', '')),
                senior_citizen=int(row.get('Senior Citizen', 0)),
                partner=str(row.get('Partner', '')),
                dependents=str(row.get('Dependents', '')),
                tenure_months=int(row.get('Tenure Months', 0)),
                phone_service=str(row.get('Phone Service', '')),
                multiple_lines=str(row.get('Multiple Lines', '')),
                internet_service=str(row.get('Internet Service', '')),
                online_security=str(row.get('Online Security', '')),
                online_backup=str(row.get('Online Backup', '')),
                device_protection=str(row.get('Device Protection', '')),
                tech_support=str(row.get('Tech Support', '')),
                streaming_tv=str(row.get('Streaming TV', '')),
                streaming_movies=str(row.get('Streaming Movies', '')),
                contract=str(row.get('Contract', '')),
                paperless_billing=str(row.get('Paperless Billing', '')),
                payment_method=str(row.get('Payment Method', '')),
                monthly_charges=float(row.get('Monthly Charges', 0.0)),
                total_charges=float(row.get('Total Charges', 0.0)),
                churn_label=str(row.get('Churn Label', '')),
                churn_value=int(row.get('Churn Value', 0)),
                churn_score=int(row.get('Churn Score', 0)),
                cltv=int(row.get('CLTV', 0)),
                churn_reason=str(row.get('Churn Reason', '')) if pd.notna(row.get('Churn Reason')) else '',
            )
            batch.append(c)
            if len(batch) >= 500:
                db.bulk_save_objects(batch)
                db.commit()
                batch = []
                print(f"   Processed {i + 1}/{len(df)} customers...")

        if batch:
            db.bulk_save_objects(batch)
            db.commit()

        total = db.query(Customer).count()
        print(f"✅ Success! Total customers in DB: {total}")
    except Exception as e:
        db.rollback()
        print(f"❌ Error during import: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
