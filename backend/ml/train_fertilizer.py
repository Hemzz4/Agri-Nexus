import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
import joblib
from pathlib import Path
import os

# Define paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "fertilizer.csv"
MODEL_DIR = BASE_DIR / "ml" / "models"
MODEL_PATH = MODEL_DIR / "fertilizer_model.pkl"
SOIL_ENCODER_PATH = MODEL_DIR / "soil_encoder.pkl"
CROP_ENCODER_PATH = MODEL_DIR / "crop_encoder.pkl"
FERT_ENCODER_PATH = MODEL_DIR / "fertilizer_encoder.pkl"

# Create models directory if not exists
os.makedirs(MODEL_DIR, exist_ok=True)

def train_fertilizer_model():
    print(f"Loading data from {DATA_PATH}...")
    try:
        df = pd.read_csv(DATA_PATH)
    except FileNotFoundError:
        print(f"Error: Data file not found at {DATA_PATH}")
        return

    # Column mapping (Handle spelling mistakes in CSV if any)
    # Actual columns: Temparature,Humidity,Moisture,Soil Type,Crop Type,Nitrogen,Potassium,Phosphorous,Fertilizer Name
    # We will rename them to standard format
    df.rename(columns={
        'Temparature': 'Temperature',
        'Phosphorous': 'Phosphorus',
        'Soil Type': 'Soil_Type', 
        'Crop Type': 'Crop_Type',
        'Fertilizer Name': 'Fertilizer'
    }, inplace=True)

    print("Columns:", df.columns.tolist())

    # Encode Categorical Variables
    le_soil = LabelEncoder()
    df['Soil_Type'] = le_soil.fit_transform(df['Soil_Type'])
    
    le_crop = LabelEncoder()
    df['Crop_Type'] = le_crop.fit_transform(df['Crop_Type'])
    
    le_fert = LabelEncoder()
    df['Fertilizer'] = le_fert.fit_transform(df['Fertilizer'])

    # Features and Target
    # Input order: Temperature, Humidity, Moisture, Soil_Type, Crop_Type, Nitrogen, Potassium, Phosphorus
    X = df[['Temperature', 'Humidity', 'Moisture', 'Soil_Type', 'Crop_Type', 'Nitrogen', 'Potassium', 'Phosphorus']]
    y = df['Fertilizer']

    # Split Data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Train Random Forest
    print("Training Random Forest Classifier...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Model Accuracy: {acc * 100:.2f}%")
    print("\nClassification Report:\n", classification_report(y_test, y_pred))

    # Save Artifacts
    print("Saving model and encoders...")
    joblib.dump(model, MODEL_PATH)
    joblib.dump(le_soil, SOIL_ENCODER_PATH)
    joblib.dump(le_crop, CROP_ENCODER_PATH)
    joblib.dump(le_fert, FERT_ENCODER_PATH)
    
    print(f"Model saved to {MODEL_PATH}")

if __name__ == "__main__":
    train_fertilizer_model()
