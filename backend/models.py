from sqlalchemy import Boolean, Column, Integer, String, Float, ForeignKey, Date, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    address = Column(String, nullable=True)
    district = Column(String, nullable=True)
    block_name = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    area = Column(String, nullable=True)
    soil_type = Column(String, nullable=True)
    uses_fertilizers = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

    plans = relationship("CropPlan", back_populates="owner")

class CropPlan(Base):
    __tablename__ = "crop_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    crop_name = Column(String, index=True)
    sowing_date = Column(Date)
    duration_days = Column(Integer)
    harvest_date = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="plans")
