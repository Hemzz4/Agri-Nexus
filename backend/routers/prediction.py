from fastapi import APIRouter, HTTPException, Body
import joblib
import pandas as pd
import os
import numpy as np

router = APIRouter()

WEATHER_MODEL_PATH = "weather_model.joblib"
# Adjust path relative to where the app runs (usually root) or generic location
# The training script saves to the current working directory, which we assume is root.
# Better to use absolute path or relative to this file to be safe.
# For now assuming running from root e:\AGRI-DASH
MODEL_PATH = os.path.join(os.getcwd(), "backend", "ml", "weather_model.joblib") 
# Wait, existing train code saved to "weather_model.joblib" in CWD.
# If I ran python backend/ml/train_model.py from root, it saved in root?
# Let's check train_model.py again. 
# It saved to YIELD_MODEL_PATH = "yield_model.joblib" (no path). 
# So it saves in whatever CWD the script was run in.
# I ran it from e:\AGRI-DASH, so it's in e:\AGRI-DASH\weather_model.joblib

model = None

def load_model():
    global model
    if model is None:
        try:
            # Check root
            if os.path.exists("weather_model.joblib"):
                model = joblib.load("weather_model.joblib")
            # Check backend/ml
            elif os.path.exists("backend/ml/weather_model.joblib"):
                model = joblib.load("backend/ml/weather_model.joblib")
            else:
                print("Weather model not found.")
        except Exception as e:
            print(f"Error loading model: {e}")

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
            raise HTTPException(status_code=503, detail="Weather model is not available.")
    
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
