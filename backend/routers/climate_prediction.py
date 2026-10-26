from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
import os
from backend.predictor import ClimatePredictor

router = APIRouter(prefix="/api/predict")

# Initialize predictor
DATA_PATH = os.path.join("backend", "data", "Final_TN_Climate_Master_LongFormat_CLEANED.csv")
predictor = ClimatePredictor(DATA_PATH)

class PredictionRequest(BaseModel):
    districts: List[str]
    parameter: str
    start_year: int = 2026
    end_year: int = 2030

@router.get("/districts")
async def get_districts():
    """Get list of available districts"""
    try:
        districts = predictor.get_available_districts()
        return {"districts": districts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/parameters")
async def get_parameters():
    """Get list of available climate parameters"""
    return {
        "parameters": [
            {"value": "Temperature", "label": "Temperature (°C)", "color": "#ef4444"},
            {"value": "Humidity", "label": "Humidity (%)", "color": "#3b82f6"},
            {"value": "Precipitation", "label": "Precipitation (mm)", "color": "#10b981"},
            {"value": "Soil_Wetness", "label": "Soil Wetness", "color": "#8b5cf6"},
            {"value": "Wind_Speed", "label": "Wind Speed (m/s)", "color": "#f59e0b"}
        ]
    }

@router.post("/climate")
async def predict_climate(request: PredictionRequest):
    """
    Generate climate predictions for multiple districts
    
    Parameters:
    - districts: List of district names
    - parameter: Climate parameter to predict
    - start_year: Start year for predictions (default: 2026)
    - end_year: End year for predictions (default: 2030)
    
    Returns:
    - predictions: List of predictions for each district
    """
    try:
        if not request.districts:
            raise HTTPException(status_code=400, detail="At least one district must be specified")
        
        if request.parameter not in predictor.parameters:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid parameter. Must be one of: {predictor.parameters}"
            )
        
        # Generate predictions
        results = predictor.predict_multiple_districts(
            districts=request.districts,
            parameter=request.parameter,
            start_year=request.start_year,
            end_year=request.end_year
        )
        
        return {"predictions": results}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/climate/{district}/{parameter}")
async def predict_single_district(
    district: str,
    parameter: str,
    start_year: int = Query(2026, ge=2026, le=2050),
    end_year: int = Query(2030, ge=2026, le=2050)
):
    """
    Generate climate prediction for a single district
    
    Parameters:
    - district: District name
    - parameter: Climate parameter to predict
    - start_year: Start year for predictions
    - end_year: End year for predictions
    """
    try:
        if parameter not in predictor.parameters:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid parameter. Must be one of: {predictor.parameters}"
            )
        
        result = predictor.predict_future(
            district=district,
            parameter=parameter,
            start_year=start_year,
            end_year=end_year
        )
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats/{district}/{parameter}")
async def get_district_stats(district: str, parameter: str):
    """Get summary statistics for a district and parameter"""
    try:
        if parameter not in predictor.parameters:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid parameter. Must be one of: {predictor.parameters}"
            )
        
        stats = predictor.get_summary_stats(district, parameter)
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
