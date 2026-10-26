from fastapi import APIRouter, HTTPException
import pandas as pd
import os

router = APIRouter()

# HARDCODED ABSOLUTE PATH (Verified)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

@router.get("/yield-data")
def get_yield_data():
    filename = "Final_Model_Ready_Dataset.csv"
    path = os.path.join(DATA_DIR, filename)
    
    print(f"API Request: Loading {path}") # Debug log
    
    if not os.path.exists(path):
        print(f"ERROR: File not found at {path}")
        raise HTTPException(status_code=404, detail=f"Dataset not found at {path}")
        
    try:
        df = pd.read_csv(path)
        # Sample for performance if needed
        if len(df) > 2000:
             df = df.sample(2000, random_state=42)
        # Replace NaN with None (JSON null)
        df = df.where(pd.notnull(df), None)
        return df.to_dict(orient="records")
    except Exception as e:
        print(f"ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/weather-data")
def get_weather_data():
    filename = "Final_TN_Climate_Master_LongFormat_CLEANED.csv"
    path = os.path.join(DATA_DIR, filename)

    print(f"API Request: Loading {path}") 

    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"Dataset not found at {path}")
        
    try:
        df = pd.read_csv(path)
        if len(df) > 2000:
             df = df.sample(2000, random_state=42)
        df = df.where(pd.notnull(df), None)
        return df.to_dict(orient="records")
    except Exception as e:
        print(f"ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))
