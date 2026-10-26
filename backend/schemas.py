from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date

class UserBase(BaseModel):
    email: str # TODO: Revert to EmailStr later
    full_name: Optional[str] = None
    address: Optional[str] = None
    district: Optional[str] = None
    block_name: Optional[str] = None
    pincode: Optional[str] = None
    area: Optional[str] = None
    soil_type: Optional[str] = None
    uses_fertilizers: Optional[bool] = False

class UserCreate(UserBase):
    password: str

class UserUpdate(UserBase):
    password: Optional[str] = None # Optional for update
    email: Optional[str] = None
    full_name: Optional[str] = None
    address: Optional[str] = None
    district: Optional[str] = None
    block_name: Optional[str] = None
    pincode: Optional[str] = None
    area: Optional[str] = None
    soil_type: Optional[str] = None
    uses_fertilizers: Optional[bool] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class CropPlanBase(BaseModel):
    crop_name: str
    sowing_date: date
    duration_days: int

class CropPlanCreate(CropPlanBase):
    pass

class CropPlanOut(CropPlanBase):
    id: int
    user_id: int
    harvest_date: date
    
    class Config:
        orm_mode = True # V1
        from_attributes = True # V2 (if using V2, but let's stick to consistent style or both)

class CropPlanCreateResponse(CropPlanOut):
    warnings: List[str] = []

class CommunityPlanDetail(BaseModel):
    farmer_name: str
    crop_name: str
    sowing_date: date
    duration_days: int

class CommunityStats(BaseModel):
    district: str
    block: str
    total_farmers: int
    crop_counts: dict[str, int]
    plans: List[CommunityPlanDetail] = []
