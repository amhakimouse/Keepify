from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
import sqlalchemy as sa

from app.database import engine, Base, get_db, create_database, SessionLocal
from app.models import User, Customer, Prediction, Subscription
from app.schemas import (
    UserCreate, UserOut, UserUpdate, Token, TokenData,
    CustomerCreate, CustomerOut, PredictionInput, PredictionOut,
    SubscriptionCreate, SubscriptionOut, ChurnStats, LoginRequest,
)
from app.auth import verify_password, get_password_hash, create_access_token, verify_token
from app.ml import (
    predict_churn, load_model, map_customer_input,
    start_background_retrain, get_retrain_state, get_model_info,
)
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import timedelta

create_database()
Base.metadata.create_all(bind=engine)
load_model()

# Seed initial users
db = SessionLocal()
try:
    if not db.query(User).filter(User.username == "admin").first():
        db.add(User(username="admin", email="admin@keepify.com", hashed_password=get_password_hash("admin123"), role="admin"))
    if not db.query(User).filter(User.username == "client").first():
        db.add(User(username="client", email="client@keepify.com", hashed_password=get_password_hash("client123"), role="client"))
    db.commit()
finally:
    db.close()

app = FastAPI(title="Keepify - Churn Prediction API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    from app.auth import SECRET_KEY, ALGORITHM
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user


def get_current_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@app.post("/auth/register", response_model=UserOut)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    user = User(
        email=user_in.email,
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
        role="client",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/auth/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="User inactive")
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/auth/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@app.post("/customers", response_model=CustomerOut)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    existing = db.query(Customer).filter(Customer.customer_id == customer.customer_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Customer ID already exists")
    db_customer = Customer(**customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


@app.get("/customers", response_model=list[CustomerOut])
def list_customers(db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_admin)):
    return db.query(Customer).all()


@app.get("/customers/{customer_id}", response_model=CustomerOut)
def get_customer(customer_id: str, db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


def _clean_prediction(data: dict) -> dict:
    cleaned = {}
    integers = {"senior_citizen", "tenure_months"}
    floats = {"monthly_charges", "total_charges"}
    for key, value in data.items():
        if value is None or value == "":
            continue
        if key in integers:
            cleaned[key] = int(value)
        elif key in floats:
            cleaned[key] = float(value)
        else:
            cleaned[key] = value
    return cleaned


@app.post("/predict", response_model=PredictionOut)
def make_prediction(pred_in: PredictionInput, db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    mapped = map_customer_input(_clean_prediction(pred_in.model_dump()))
    try:
        result = predict_churn(mapped)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Prédiction impossible : {exc}")
    db_prediction = Prediction(
        user_id=current_user.id,
        churn_probability=result["churn_probability"],
        predicted_churn=result["predicted_churn"],
        risk_segment=result["risk_segment"],
        model_used=result["model_used"],
    )
    db.add(db_prediction)
    db.commit()
    db.refresh(db_prediction)
    return db_prediction


@app.get("/predictions", response_model=list[PredictionOut])
def list_predictions(db: Session = Depends(get_db),
                     current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        return db.query(Prediction).all()
    return db.query(Prediction).filter(Prediction.user_id == current_user.id).all()


@app.post("/subscriptions", response_model=SubscriptionOut)
def create_subscription(sub: SubscriptionCreate, db: Session = Depends(get_db),
                        current_user: User = Depends(get_current_user)):
    db_sub = Subscription(user_id=current_user.id, **sub.model_dump())
    db.add(db_sub)
    db.commit()
    db.refresh(db_sub)
    start_background_retrain("subscription")
    return db_sub


@app.get("/model")
def model_info(current_user: User = Depends(get_current_user)):
    return get_model_info()


@app.get("/retrain/status")
def retrain_status(current_user: User = Depends(get_current_user)):
    return get_retrain_state()


def _breakdown(db: Session, column):
    rows = (
        db.query(column, Customer.churn_value, sa.func.count(Customer.id))
        .group_by(column, Customer.churn_value)
        .all()
    )
    buckets = {}
    for name, churn_value, count in rows:
        key = name if name not in (None, "") else "Inconnu"
        bucket = buckets.setdefault(key, {"total": 0, "churn": 0})
        bucket["total"] += int(count)
        if churn_value == 1:
            bucket["churn"] += int(count)
    series = []
    for name, bucket in buckets.items():
        rate = bucket["churn"] / bucket["total"] if bucket["total"] else 0
        series.append({
            "name": str(name),
            "total": bucket["total"],
            "churn": bucket["churn"],
            "retained": bucket["total"] - bucket["churn"],
            "rate": round(rate * 100, 1),
        })
    series.sort(key=lambda item: item["rate"], reverse=True)
    return series


@app.get("/admin/stats", response_model=ChurnStats)
def admin_stats(db: Session = Depends(get_db),
                current_user: User = Depends(get_current_admin)):
    import pandas as pd
    from pathlib import Path

    total_customers = db.query(Customer).count()
    churn_count = db.query(Customer).filter(Customer.churn_value == 1).count()
    churn_rate = churn_count / total_customers if total_customers > 0 else 0.0

    contract_series = _breakdown(db, Customer.contract)
    payment_series = _breakdown(db, Customer.payment_method)
    internet_series = _breakdown(db, Customer.internet_service)
    gender_series = _breakdown(db, Customer.gender)
    churn_by_contract = {item["name"]: item["churn"] for item in contract_series}

    tenure_rows = db.query(Customer.tenure_months, Customer.churn_value).all()
    tenure_churn = {}
    for tenure, churn_value in tenure_rows:
        if tenure is None:
            continue
        group = "0-6" if tenure <= 6 else "7-12" if tenure <= 12 else "13-24" if tenure <= 24 else "24+"
        bucket = tenure_churn.setdefault(group, {"total": 0, "churn": 0})
        bucket["total"] += 1
        if churn_value == 1:
            bucket["churn"] += 1
    tenure_order = ["0-6", "7-12", "13-24", "24+"]
    tenure_series = []
    for group in tenure_order:
        bucket = tenure_churn.get(group, {"total": 0, "churn": 0})
        rate = bucket["churn"] / bucket["total"] * 100 if bucket["total"] else 0
        tenure_series.append({
            "name": group,
            "total": bucket["total"],
            "churn": bucket["churn"],
            "retained": bucket["total"] - bucket["churn"],
            "rate": round(rate, 1),
        })

    charge_rows = db.query(Customer.monthly_charges, Customer.churn_value).all()
    bands = [(0, 35, "0–35 $"), (35, 70, "35–70 $"), (70, 90, "70–90 $"), (90, 10_000, "90 $ +")]
    charges_series = []
    for low, high, label in bands:
        total = churn = 0
        for amount, churn_value in charge_rows:
            if amount is None or not (low <= amount < high):
                continue
            total += 1
            if churn_value == 1:
                churn += 1
        charges_series.append({
            "name": label,
            "total": total,
            "churn": churn,
            "rate": round(churn / total * 100, 1) if total else 0,
        })

    frame = pd.DataFrame(
        db.query(
            Customer.tenure_months,
            Customer.monthly_charges,
            Customer.total_charges,
            Customer.churn_value,
        ).all(),
        columns=["Ancienneté", "Mensuel", "Total", "Churn"],
    )
    if frame.empty:
        correlation = {"headers": [], "matrix": []}
    else:
        matrix = frame.corr(numeric_only=True).round(2).fillna(0)
        correlation = {
            "headers": list(matrix.columns),
            "matrix": matrix.values.tolist(),
        }

    risk_rows = db.query(Prediction.risk_segment, sa.func.count(Prediction.id)).group_by(Prediction.risk_segment).all()
    risk_distribution = {row[0] or "Inconnu": int(row[1]) for row in risk_rows}
    info = get_model_info()
    comparison = info.get("scores") or []
    if not comparison:
        report = Path(__file__).resolve().parents[2] / "REPORTS" / "model_comparison.csv"
        if report.exists():
            comparison = pd.read_csv(report).to_dict("records")
    comparison = [
        {
            key: (value.item() if hasattr(value, "item") else value)
            for key, value in row.items()
        }
        for row in comparison
    ]

    return ChurnStats(
        total_customers=total_customers,
        churn_count=churn_count,
        churn_rate=round(churn_rate, 4),
        churn_by_contract=churn_by_contract,
        tenure_churn=tenure_churn,
        risk_distribution=risk_distribution,
        contract_series=contract_series,
        tenure_series=tenure_series,
        payment_series=payment_series,
        internet_series=internet_series,
        gender_series=gender_series,
        charges_series=charges_series,
        model_comparison=comparison,
        active_model=info.get("model_name") or "inconnu",
        model_trained_at=info.get("trained_at"),
        prediction_count=db.query(Prediction).count(),
        subscription_count=db.query(Subscription).count(),
        user_count=db.query(User).count(),
        correlation=correlation,
    )


@app.get("/admin/users", response_model=list[UserOut])
def admin_users(db: Session = Depends(get_db),
                current_user: User = Depends(get_current_admin)):
    return db.query(User).all()


@app.put("/admin/users/{user_id}", response_model=UserOut)
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for field, value in user_update.model_dump(exclude_unset=True).items():
        if field == "password":
            setattr(user, "hashed_password", get_password_hash(value))
        else:
            setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@app.delete("/admin/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"detail": "User deleted"}


@app.post("/admin/retrain")
def admin_retrain(current_user: User = Depends(get_current_admin)):
    return start_background_retrain("admin")


@app.get("/subscriptions", response_model=list[SubscriptionOut])
def list_subscriptions(db: Session = Depends(get_db),
                       current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        return db.query(Subscription).all()
    return db.query(Subscription).filter(Subscription.user_id == current_user.id).all()