import sqlalchemy as sa
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="client")  # "admin" or "client"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    predictions = relationship("Prediction", back_populates="user", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="user", cascade="all, delete-orphan")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String(100), unique=True, index=True, nullable=False)
    gender = Column(String(20))
    senior_citizen = Column(Integer)
    partner = Column(String(10))
    dependents = Column(String(10))
    tenure_months = Column(Integer)
    phone_service = Column(String(10))
    multiple_lines = Column(String(20))
    internet_service = Column(String(20))
    online_security = Column(String(20))
    online_backup = Column(String(20))
    device_protection = Column(String(20))
    tech_support = Column(String(20))
    streaming_tv = Column(String(20))
    streaming_movies = Column(String(20))
    contract = Column(String(50))
    paperless_billing = Column(String(10))
    payment_method = Column(String(50))
    monthly_charges = Column(Float)
    total_charges = Column(Float)
    churn_label = Column(String(10))
    churn_value = Column(Integer)
    churn_score = Column(Integer)
    cltv = Column(Integer)
    churn_reason = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    predictions = relationship("Prediction", back_populates="customer")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    customer_id = Column(String(100), ForeignKey("customers.customer_id"), nullable=True)
    churn_probability = Column(Float, nullable=False)
    predicted_churn = Column(Integer, nullable=False)  # 0 or 1
    risk_segment = Column(String(20))  # Low, Medium, High
    model_used = Column(String(50), default="best_model")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="predictions")
    customer = relationship("Customer", back_populates="predictions")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_name = Column(String(100), nullable=False)
    status = Column(String(50), default="active")  # active, cancelled, expired
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="subscriptions")