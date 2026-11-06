from fastapi import APIRouter, HTTPException, Body
from pathlib import Path
import joblib
import pandas as pd
import numpy as np
import os

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent
PRIMARY_MODEL_PATH = BASE_DIR / "ml" / "weather_model.joblib"
FALLBACK_MODEL_PATH = BASE_DIR.parent / "weather_model.joblib"

model = None

def load_model():
    """Load the trained multi-output weather model if available."""
    global model
    if model is None:
        try:
            if PRIMARY_MODEL_PATH.exists():
                model = joblib.load(PRIMARY_MODEL_PATH)
                print(f"Weather model loaded from {PRIMARY_MODEL_PATH}")
            elif FALLBACK_MODEL_PATH.exists():
                model = joblib.load(FALLBACK_MODEL_PATH)
                print(f"Weather model loaded from {FALLBACK_MODEL_PATH}")
            else:
                print(f"Notice: Weather model artifact not found at {PRIMARY_MODEL_PATH}. Run 'python backend/ml/train_model.py' to generate it.")
        except Exception as e:
            print(f"Error loading weather model: {e}")
    return model

@router.on_event("startup")
async def startup_event():
    load_model()

@router.post("/predict/weather")
async def predict_weather(
    district: str = Body(..., embed=True),
    year: int = Body(..., embed=True),
    month: int = Body(..., embed=True)
):
    """
    Predict weather attributes for a given district, year, and month.
    """
    if model is None:
        load_model()
        if model is None:
            raise HTTPException(
                status_code=503,
                detail="Weather prediction model artifact not found. Please train the model using: python backend/ml/train_model.py"
            )
    
    try:
        # Prepare input
        input_data = pd.DataFrame([{
            'district': district,
            'YEAR': year,
            'Month': month
        }])
        
        # Predict
        prediction = model.predict(input_data)
        
        # Prepare output
        # prediction is likely a numpy array of shape (1, 5)
        # Columns: Temperature, Precipitation, Humidity, Soil_Wetness, Wind_Speed
        
        # Define targets explicitly to map back
        targets = ['Temperature', 'Precipitation', 'Humidity', 'Soil_Wetness', 'Wind_Speed']
        
        result = {}
        for i, target in enumerate(targets):
            result[target] = float(prediction[0][i])
            
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
