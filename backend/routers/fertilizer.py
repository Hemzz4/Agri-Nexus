from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
from pathlib import Path

router = APIRouter(prefix="/api/fertilizer", tags=["Fertilizer"])

# Load Models (Lazy loading to avoid circular imports during startup if models don't exist yet)
MODEL_DIR = Path(__file__).resolve().parent.parent / "ml" / "models"
MODEL_PATH = MODEL_DIR / "fertilizer_model.pkl"
SOIL_ENCODER_PATH = MODEL_DIR / "soil_encoder.pkl"
CROP_ENCODER_PATH = MODEL_DIR / "crop_encoder.pkl"
FERT_ENCODER_PATH = MODEL_DIR / "fertilizer_encoder.pkl"

class SoilData(BaseModel):
    temperature: float
    humidity: float
    moisture: float
    soil_type: str
    crop_type: str
    nitrogen: float
    potassium: float
    phosphorus: float

@router.get("/options")
def get_options():
    try:
        if SOIL_ENCODER_PATH.exists() and CROP_ENCODER_PATH.exists():
            le_soil = joblib.load(SOIL_ENCODER_PATH)
            le_crop = joblib.load(CROP_ENCODER_PATH)
            return {
                "soil_types": list(le_soil.classes_),
                "crop_types": list(le_crop.classes_)
            }
        # Fallback to dataset directly if encoders not trained yet
        data_csv = Path(__file__).resolve().parent.parent / "data" / "fertilizer.csv"
        if data_csv.exists():
            df_temp = pd.read_csv(data_csv)
            soil_col = "Soil Type" if "Soil Type" in df_temp.columns else "Soil_Type"
            crop_col = "Crop Type" if "Crop Type" in df_temp.columns else "Crop_Type"
            return {
                "soil_types": sorted(df_temp[soil_col].dropna().unique().tolist()),
                "crop_types": sorted(df_temp[crop_col].dropna().unique().tolist())
            }
        return {
            "soil_types": ["Black", "Clayey", "Loamy", "Red", "Sandy"],
            "crop_types": ["Barley", "Cotton", "Ground Nuts", "Maize", "Millets", "Oil seeds", "Paddy", "Pulses", "Sugarcane", "Tobacco", "Wheat"]
        }
    except Exception as e:
        return {
            "error": "Model files not found. Please train the model first using python backend/ml/train_fertilizer.py",
            "details": str(e),
            "soil_types": ["Black", "Clayey", "Loamy", "Red", "Sandy"],
            "crop_types": ["Barley", "Cotton", "Ground Nuts", "Maize", "Millets", "Oil seeds", "Paddy", "Pulses", "Sugarcane", "Tobacco", "Wheat"]
        }

@router.post("/predict")
def recommend_fertilizer(data: SoilData):
    required_artifacts = [MODEL_PATH, SOIL_ENCODER_PATH, CROP_ENCODER_PATH, FERT_ENCODER_PATH]
    missing = [str(p.name) for p in required_artifacts if not p.exists()]
    if missing:
        raise HTTPException(
            status_code=503,
            detail=f"Fertilizer model artifacts missing ({', '.join(missing)}). Please train the model using: python backend/ml/train_fertilizer.py"
        )

    try:
        # Load artifacts
        model = joblib.load(MODEL_PATH)
        le_soil = joblib.load(SOIL_ENCODER_PATH)
        le_crop = joblib.load(CROP_ENCODER_PATH)
        le_fert = joblib.load(FERT_ENCODER_PATH)

        # Encode categorical inputs
        try:
            soil_encoded = le_soil.transform([data.soil_type])[0]
            crop_encoded = le_crop.transform([data.crop_type])[0]
        except ValueError as e:
             raise HTTPException(status_code=400, detail=f"Invalid Soil or Crop Type. {str(e)}")

        # Prepare feature array
        # Order: Temperature, Humidity, Moisture, Soil_Type, Crop_Type, Nitrogen, Potassium, Phosphorus
        features = np.array([[
            data.temperature,
            data.humidity,
            data.moisture,
            soil_encoded,
            crop_encoded,
            data.nitrogen,
            data.potassium,
            data.phosphorus
        ]])

        # Predict
        prediction_index = model.predict(features)[0]
        fertilizer_name = le_fert.inverse_transform([prediction_index])[0]
        
        # Confidence logic (Random Forest supports predict_proba)
        probs = model.predict_proba(features)[0]
        confidence = round(max(probs) * 100, 2)

        # Get Detailed Insights
        details = get_fertilizer_details(fertilizer_name)
        
        # Soil Compatibility
        ideal_soil = CROP_SOIL_PREFERENCE.get(data.crop_type, "Loamy") # Default to Loamy if unknown
        is_soil_ideal = (data.soil_type.lower() in ideal_soil.lower()) or (ideal_soil.lower() in data.soil_type.lower())

        return {
            "fertilizer": fertilizer_name,
            "confidence": confidence,
            "description": details["description"],
            "benefits": details["benefits"],
            "application_strategy": details["application_strategy"],
            "timing": details["timing"],
            "soil_analysis": {
                "current_soil": data.soil_type,
                "ideal_soil_for_crop": ideal_soil,
                "is_compatible": is_soil_ideal
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Rich Knowledge Base ---

FERTILIZER_INFO = {
    "Urea": {
        "description": "High Nitrogen (46%) fertilizer essential for vegetative growth.",
        "benefits": ["Boosts leaf growth", "Enhances photosynthesis", "Rapid greening"],
        "application_strategy": "Apply in split doses: 1/3 at sowing, 1/3 at tillering, 1/3 at panicle initiation.",
        "timing": "Split application (Basal + Top Dressing)"
    },
    "DAP": {
        "description": "Di-Ammonium Phosphate (18% N, 46% P). Excellent for root establishment.",
        "benefits": ["Promotes strong roots", "Improves flowering", "Enhances drought resistance"],
        "application_strategy": "Apply full dose basally (at sowing time) to the root zone. Do not top dress.",
        "timing": "Basal Application only"
    },
    "14-35-14": {
        "description": "High Phosphorus complex fertilizer with balanced N and K.",
        "benefits": ["Balanced early growth", "Strong root system", "Good for vegetables"],
        "application_strategy": "Best applied during land preparation or at sowing.",
        "timing": "Basal Application"
    },
    "28-28": {
        "description": "Complex fertilizer providing equal high Nitrogen and Phosphorus.",
        "benefits": ["Vigorous initial growth", "Uniform crop stand"],
        "application_strategy": "Apply during initial growth stages.",
        "timing": "Early Vegetative Stage"
    },
    "17-17-17": {
        "description": "Balanced NPK complex for general crop maintenance.",
        "benefits": ["Overall plant health", "Prevents nutrient deficiencies"],
        "application_strategy": "Can be used as basal or top dressing depending on crop stage.",
        "timing": "All Stages"
    },
    "20-20": {
        "description": "Ammonium Phosphate Sulphate (20% N, 20% P). Contains Sulphur.",
        "benefits": ["Good for oilseeds (Sulphur)", "Acidifies alkaline soils"],
        "application_strategy": "Apply at sowing.",
        "timing": "Basal"
    },
    "10-26-26": {
        "description": "High Potassium and Phosphorus complex.",
        "benefits": ["Improves grain filling", "Fruit quality", "Disease resistance"],
        "application_strategy": "Apply before flowering or fruit setting stage.",
        "timing": "Late Vegetative / Reproductive"
    }
}

# Ideal Soil mapping (General Agronomy)
# Ideal Soil mapping (Specific Agronomy)
CROP_SOIL_PREFERENCE = {
    "Rice": "Clayey",
    "Maize": "Loamy / Sandy Loam",
    "Chickpea": "Loamy",
    "Kidneybeans": "Sandy Loam",
    "Pigeonpeas": "Loamy",
    "Mothbeans": "Sandy",
    "Mungbean": "Loamy",
    "Blackgram": "Loamy",
    "Lentil": "Loamy",
    "Pomegranate": "Sandy Loam",
    "Banana": "Alluvial / Loamy",
    "Mango": "Red / Loamy",
    "Grapes": "Sandy Loam",
    "Watermelon": "Sandy",
    "Muskmelon": "Sandy",
    "Apple": "Loamy",
    "Orange": "Loamy",
    "Papaya": "Loamy",
    "Coconut": "Laterite / Sandy",
    "Cotton": "Black",
    "Jute": "Alluvial",
    "Coffee": "Forest Loam"
}

def get_fertilizer_details(fertilizer_name):
    return FERTILIZER_INFO.get(fertilizer_name, {
        "description": "Standard chemical fertilizer.",
        "benefits": ["Supplies essential nutrients"],
        "application_strategy": "Follow user manual.",
        "timing": "As needed"
    })
