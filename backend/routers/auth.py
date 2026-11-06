import os
import secrets
import warnings
from typing import Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
import bcrypt  # Use bcrypt directly

from .. import models, schemas, database

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

# Configuration
INSECURE_SECRETS = {
    "supersecretkey_change_this_In_production",
    "your-secret-key-here",
    "secret",
    "changeme",
    "placeholder_jwt_secret",
    "123456",
}

def get_jwt_secret() -> str:
    """
    Retrieves and validates the JWT secret key from environment configuration.
    Raises RuntimeError if starting in production with a missing or insecure key.
    """
    key = os.getenv("JWT_SECRET_KEY") or os.getenv("SECRET_KEY")
    env = os.getenv("ENVIRONMENT", "development").lower()

    if env == "production":
        if not key:
            raise RuntimeError(
                "CRITICAL SECURITY ERROR: JWT_SECRET_KEY environment variable is not set. "
                "The server will not start in production mode without a secure JWT secret."
            )
        if key in INSECURE_SECRETS or len(key) < 32:
            raise RuntimeError(
                "CRITICAL SECURITY ERROR: JWT_SECRET_KEY is using a weak or default placeholder "
                "value (< 32 characters or known default). Please configure a strong, random "
                "secret key (at least 32 characters) in production."
            )
        return key

    # Development / Testing fallback
    if not key or key in INSECURE_SECRETS:
        warnings.warn(
            "Security Notice: JWT_SECRET_KEY is not set or uses a placeholder in development. "
            "Configure JWT_SECRET_KEY in your .env file for production security.",
            UserWarning
        )
        return key or "agrinexus_dev_jwt_secret_key_32chars_min_length!!"
    return key

SECRET_KEY = get_jwt_secret()
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440 # 24 Hours

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# --- Helpers ---
def verify_password(plain_password, hashed_password):
    # Ensure bytes for bcrypt
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password)

def get_password_hash(password):
    # Return string for storage
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    secret = get_jwt_secret()
    encoded_jwt = jwt.encode(to_encode, secret, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    secret = get_jwt_secret()
    try:
        payload = jwt.decode(token, secret, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user

# --- Routes ---

@router.post("/signup", response_model=schemas.Token)
def signup(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    try:
        print(f"DEBUG: Received Signup Request: {user}")
        db_user = db.query(models.User).filter(models.User.email == user.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        hashed_password = get_password_hash(user.password)
        new_user = models.User(
            email=user.email,
            hashed_password=hashed_password,
            full_name=user.full_name
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Auto-login after signup
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": new_user.email}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        import traceback
        with open("error_log.txt", "w") as f:
            f.write(str(e))
            f.write("\n")
            f.write(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserOut)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=schemas.UserOut)
def update_user_me(user_update: schemas.UserUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    # Update fields
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.email is not None:
        # Check if email is taken by another user
        existing_user = db.query(models.User).filter(models.User.email == user_update.email).first()
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = user_update.email
    
    if user_update.password:
        current_user.hashed_password = get_password_hash(user_update.password)
    
    # New fields
    if user_update.address is not None: current_user.address = user_update.address
    if user_update.district is not None: current_user.district = user_update.district
    if user_update.block_name is not None: current_user.block_name = user_update.block_name
    if user_update.pincode is not None: current_user.pincode = user_update.pincode
    if user_update.area is not None: current_user.area = user_update.area
    if user_update.soil_type is not None: current_user.soil_type = user_update.soil_type
    if user_update.uses_fertilizers is not None: current_user.uses_fertilizers = user_update.uses_fertilizers

    db.commit()
    db.refresh(current_user)
    return current_user
