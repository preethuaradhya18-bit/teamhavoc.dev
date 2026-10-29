from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from enum import Enum

from pydantic import BaseModel, Field as PydanticField
from sqlmodel import SQLModel, Field as SQLField

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

def otp_expire_time() -> datetime:
    return datetime.now(timezone.utc) + timedelta(minutes=10)

# ---------- Enums ----------
class VerificationTier(str, Enum):
    UNVERIFIED = "Unverified"
    VERIFIED = "Verified"

class TransportMode(str, Enum):
    SOLO_CAR_PETROL = "Solo Petrol Car"
    SOLO_CAR_DIESEL = "Solo Diesel Car"
    SOLO_CAR_EV = "Electric Vehicle"
    HYBRID = "Hybrid Vehicle"
    CARPOOL = "Carpool (3+ pax)"
    BUS = "Public Bus"
    METRO_RAIL = "Metro / Electric Train"
    BIKE_WALK = "Bicycle / Walking"

class FuelType(str, Enum):
    PETROL = "Petrol"
    DIESEL = "Diesel"
    LPG = "LPG"

# ---------- SQLModel Database Entities ----------
class User(SQLModel, table=True):
    id: Optional[int] = SQLField(default=None, primary_key=True)
    email: Optional[str] = SQLField(default=None, index=True, nullable=True)
    phone: Optional[str] = SQLField(default=None, index=True, nullable=True)
    hashed_password: str = SQLField(nullable=False)
    avatar_path: Optional[str] = SQLField(default=None)
    created_at: datetime = SQLField(default_factory=utc_now)
    is_active: bool = SQLField(default=True)

class OTPCode(SQLModel, table=True):
    id: Optional[int] = SQLField(default=None, primary_key=True)
    identifier: str = SQLField(index=True)  # email or phone
    code: str
    expires_at: datetime = SQLField(default_factory=otp_expire_time)
    attempts: int = SQLField(default=0)
    verified: bool = SQLField(default=False)

class Profile(SQLModel, table=True):
    id: Optional[int] = SQLField(default=None, primary_key=True)
    user_id: int = SQLField(foreign_key="user.id", unique=True, index=True)
    display_name: str = SQLField(default="Solarpunk Pioneer")
    bio: Optional[str] = SQLField(default="Actively reducing carbon footprint on campus & beyond.")
    privacy_public: bool = SQLField(default=False)
    data_sharing: bool = SQLField(default=True)
    created_at: datetime = SQLField(default_factory=utc_now)

class CoinTransaction(SQLModel, table=True):
    id: Optional[int] = SQLField(default=None, primary_key=True)
    user_id: int = SQLField(foreign_key="user.id", index=True)
    amount: int  # Positive integer
    type: str = SQLField(default="EARN")  # "EARN" or "REDEEM"
    description: str
    created_at: datetime = SQLField(default_factory=utc_now)

class VerificationLog(SQLModel, table=True):
    id: Optional[int] = SQLField(default=None, primary_key=True)
    user_id: int = SQLField(foreign_key="user.id", index=True)
    category: str  # Electricity, Transport, Fuel, Waste, Eco-Certificate
    document_type: str  # Utility Bill, Fuel Receipt, Transit Ticket, Certificate
    document_path: str
    file_hash: str = SQLField(index=True)  # SHA-256 anti-duplicate
    reported_value: str
    unit: str
    coins_awarded: int = SQLField(default=0)
    status: str = SQLField(default="VERIFIED")  # "VERIFIED" or "REJECTED"
    notes: Optional[str] = SQLField(default=None)
    created_at: datetime = SQLField(default_factory=utc_now)

class Goal(SQLModel, table=True):
    id: Optional[int] = SQLField(default=None, primary_key=True)
    user_id: int = SQLField(foreign_key="user.id", index=True)
    interval: str = SQLField(default="monthly")  # "weekly", "monthly", "yearly"
    category: str = SQLField(default="Overall")
    target_kg: float
    achieved_kg: float = SQLField(default=0.0)
    created_at: datetime = SQLField(default_factory=utc_now)
    updated_at: datetime = SQLField(default_factory=utc_now)

class Challenge(SQLModel, table=True):
    id: Optional[int] = SQLField(default=None, primary_key=True)
    title: str
    description: str
    tier: str = SQLField(default="daily")  # "daily", "weekly", "monthly"
    reward_coins: int = SQLField(default=20)
    target_metric: str = SQLField(default="1 action")
    icon_name: str = SQLField(default="Zap")

class UserChallenge(SQLModel, table=True):
    id: Optional[int] = SQLField(default=None, primary_key=True)
    user_id: int = SQLField(foreign_key="user.id", index=True)
    challenge_id: int = SQLField(foreign_key="challenge.id", index=True)
    progress: int = SQLField(default=0)
    target: int = SQLField(default=1)
    completed: bool = SQLField(default=False)
    claimed: bool = SQLField(default=False)
    completed_at: Optional[datetime] = SQLField(default=None)

class ActivityLog(SQLModel, table=True):
    id: Optional[int] = SQLField(default=None, primary_key=True)
    user_id: int = SQLField(foreign_key="user.id", index=True)
    electricity_kwh: float = SQLField(default=120.0)
    commute_km_weekly: float = SQLField(default=80.0)
    primary_transport_mode: str = SQLField(default="Solo Petrol Car")
    fuel_liters_monthly: float = SQLField(default=20.0)
    fuel_type: str = SQLField(default="Petrol")
    waste_kg_weekly: float = SQLField(default=12.0)
    segregation_recycled_pct: float = SQLField(default=35.0)
    segregation_composted_pct: float = SQLField(default=25.0)
    total_annual_kg_co2e: float = SQLField(default=0.0)
    created_at: datetime = SQLField(default_factory=utc_now)

# ---------- Pydantic Request / Response Schemas ----------
class ActivityInput(BaseModel):
    electricity_kwh: float = PydanticField(default=120.0, description="Monthly electricity consumption in kWh")
    commute_km_weekly: float = PydanticField(default=85.0, description="Weekly commute kilometers")
    primary_transport_mode: TransportMode = TransportMode.SOLO_CAR_PETROL
    secondary_transport_mode: Optional[TransportMode] = TransportMode.BUS
    secondary_transport_pct: float = PydanticField(default=20.0, description="Percentage of commute using secondary mode")
    fuel_liters_monthly: float = PydanticField(default=20.0, description="Direct fuel consumed in Liters")
    fuel_type: FuelType = FuelType.PETROL
    waste_kg_weekly: float = PydanticField(default=12.0, description="Weekly waste generated in kg")
    segregation_recycled_pct: float = PydanticField(default=35.0, description="Dry waste recycled %")
    segregation_composted_pct: float = PydanticField(default=25.0, description="Organic waste composted %")

class SimulationRequest(BaseModel):
    baseline_activity: ActivityInput
    ev_transit_shift_pct: float = PydanticField(default=40.0, ge=0, le=100)
    green_grid_solar_pct: float = PydanticField(default=35.0, ge=0, le=100)
    waste_recycling_compost_pct: float = PydanticField(default=50.0, ge=0, le=100)

class GoalCreate(BaseModel):
    interval: str = "monthly"
    category: str = "Overall"
    target_kg: float
    achieved_kg: float = 0.0

class GoalUpdate(BaseModel):
    target_kg: Optional[float] = None
    achieved_kg: Optional[float] = None
    interval: Optional[str] = None
    category: Optional[str] = None

class ProfileUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    privacy_public: Optional[bool] = None
    data_sharing: Optional[bool] = None

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

class AIChatRequest(BaseModel):
    message: str
