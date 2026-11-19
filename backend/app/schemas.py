from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ==================== User Schemas ====================

class UserBase(BaseModel):
    email: EmailStr
    username: str
    role: Optional[str] = "client"


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class UserOut(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


# ==================== Customer Schemas ====================

class CustomerBase(BaseModel):
    customer_id: str
    gender: Optional[str] = None
    senior_citizen: Optional[int] = None
    partner: Optional[str] = None
    dependents: Optional[str] = None
    tenure_months: Optional[int] = None
    phone_service: Optional[str] = None
    multiple_lines: Optional[str] = None
    internet_service: Optional[str] = None
    online_security: Optional[str] = None
    online_backup: Optional[str] = None
    device_protection: Optional[str] = None
    tech_support: Optional[str] = None
    streaming_tv: Optional[str] = None
    streaming_movies: Optional[str] = None
    contract: Optional[str] = None
    paperless_billing: Optional[str] = None
    payment_method: Optional[str] = None
    monthly_charges: Optional[float] = None
    total_charges: Optional[float] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerOut(CustomerBase):
    id: int
    churn_label: Optional[str] = None
    churn_value: Optional[int] = None
    churn_score: Optional[int] = None
    cltv: Optional[int] = None
    churn_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== Prediction Schemas ====================

class PredictionInput(BaseModel):
    gender: Optional[str] = None
    senior_citizen: Optional[int] = None
    partner: Optional[str] = None
    dependents: Optional[str] = None
    tenure_months: Optional[int] = None
    phone_service: Optional[str] = None
    multiple_lines: Optional[str] = None
    internet_service: Optional[str] = None
    online_security: Optional[str] = None
    online_backup: Optional[str] = None
    device_protection: Optional[str] = None
    tech_support: Optional[str] = None
    streaming_tv: Optional[str] = None
    streaming_movies: Optional[str] = None
    contract: Optional[str] = None
    paperless_billing: Optional[str] = None
    payment_method: Optional[str] = None
    monthly_charges: Optional[float] = None
    total_charges: Optional[float] = None


class PredictionOut(BaseModel):
    id: int
    customer_id: Optional[str]
    churn_probability: float
    predicted_churn: int
    risk_segment: str
    model_used: str
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== Subscription Schemas ====================

class SubscriptionBase(BaseModel):
    plan_name: str
    status: Optional[str] = "active"


class SubscriptionCreate(SubscriptionBase):
    pass


class SubscriptionOut(SubscriptionBase):
    id: int
    user_id: int
    started_at: datetime
    ended_at: Optional[datetime]

    class Config:
        from_attributes = True


# ==================== Login Schema ====================

class LoginRequest(BaseModel):
    username: str
    password: str


# ==================== Stats Schemas ====================

class ChurnStats(BaseModel):
    total_customers: int
    churn_count: int
    churn_rate: float
    churn_by_contract: dict
    tenure_churn: dict
    risk_distribution: dict
    contract_series: list = []
    tenure_series: list = []
    payment_series: list = []
    internet_series: list = []
    gender_series: list = []
    charges_series: list = []
    model_comparison: list = []
    active_model: str = "inconnu"
    model_trained_at: Optional[str] = None
    prediction_count: int = 0
    subscription_count: int = 0
    user_count: int = 0
    correlation: dict = {}