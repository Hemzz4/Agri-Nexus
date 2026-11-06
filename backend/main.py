import os
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("NUMEXPR_NUM_THREADS", "1")

from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file if present
BASE_DIR = Path(__file__).resolve().parent.parent
env_file = BASE_DIR / ".env"
if env_file.exists():
    load_dotenv(env_file)
else:
    load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import prediction, auth
from backend.routers import weather, analytics, climate_prediction, crop_recommendations, ai_insights, fertilizer
from backend import models, database

app = FastAPI(title="Agri-Insight API", version="1.0.0")

# Validate JWT Secret configuration on startup
@app.on_event("startup")
async def validate_environment():
    auth.get_jwt_secret()

# Create Database Tables
models.Base.metadata.create_all(bind=database.engine)

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], # Explicitly allow frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(prediction.router, tags=["Prediction"])
app.include_router(weather.router, prefix="/weather", tags=["Weather"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
app.include_router(climate_prediction.router, tags=["Climate Prediction"])
app.include_router(crop_recommendations.router, tags=["Crop Recommendations"])
app.include_router(ai_insights.router)
app.include_router(fertilizer.router)
from backend.routers import planning, nlp_mining
app.include_router(planning.router)
app.include_router(nlp_mining.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Agri-Insight API"}

@app.get("/locations")
def get_locations():
    import csv
    import os
    locations = {}
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        csv_path = os.path.join(base_dir, "data", "block_name.csv")
        print(f"DEBUG: Reading CSV from {csv_path}")

        with open(csv_path, "r", encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                district = row['District Name']
                block = row['Block Name']
                if district not in locations:
                    locations[district] = []
                if block and block not in locations[district]:
                    locations[district].append(block)
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return {}
    return locations
