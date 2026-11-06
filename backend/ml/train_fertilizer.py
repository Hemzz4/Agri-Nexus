"""
Training Pipeline for Fertilizer Recommendation Model (Random Forest Classifier).
Part of AgriNexus / Agri-Insight Framework.

Trains a Random Forest classifier mapping soil chemical and environmental attributes
(Temperature, Humidity, Moisture, Soil Type, Crop Type, N, K, P) to optimal fertilizer compounds.

Artifacts saved:
- fertilizer_model.pkl
- soil_encoder.pkl
- crop_encoder.pkl
- fertilizer_encoder.pkl
"""

import os
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

import argparse
from pathlib import Path
import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report

# Portable directory resolution
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
DEFAULT_DATA_PATH = BACKEND_DIR / "data" / "fertilizer.csv"
DEFAULT_MODEL_DIR = SCRIPT_DIR / "models"


def train_fertilizer_model(data_path: Path, model_dir: Path):
    resolved_data = Path(data_path).resolve()
    resolved_model_dir = Path(model_dir).resolve()
    resolved_model_dir.mkdir(parents=True, exist_ok=True)

    model_path = resolved_model_dir / "fertilizer_model.pkl"
    soil_enc_path = resolved_model_dir / "soil_encoder.pkl"
    crop_enc_path = resolved_model_dir / "crop_encoder.pkl"
    fert_enc_path = resolved_model_dir / "fertilizer_encoder.pkl"

    print(f"Loading fertilizer dataset from {resolved_data}...")
    if not resolved_data.exists():
        raise FileNotFoundError(
            f"Fertilizer dataset not found at: {resolved_data}\n"
            f"Please ensure fertilizer.csv exists in backend/data/ or provide the path via --data."
        )

    df = pd.read_csv(resolved_data)

    # Standardize column naming
    rename_dict = {
        'Temparature': 'Temperature',
        'Phosphorous': 'Phosphorus',
        'Soil Type': 'Soil_Type',
        'Crop Type': 'Crop_Type',
        'Fertilizer Name': 'Fertilizer'
    }
    df.rename(columns={k: v for k, v in rename_dict.items() if k in df.columns}, inplace=True)

    # Categorical encoders
    le_soil = LabelEncoder()
    df['Soil_Type'] = le_soil.fit_transform(df['Soil_Type'])

    le_crop = LabelEncoder()
    df['Crop_Type'] = le_crop.fit_transform(df['Crop_Type'])

    le_fert = LabelEncoder()
    df['Fertilizer'] = le_fert.fit_transform(df['Fertilizer'])

    features = ['Temperature', 'Humidity', 'Moisture', 'Soil_Type', 'Crop_Type', 'Nitrogen', 'Potassium', 'Phosphorus']
    X = df[features]
    y = df['Fertilizer']

    print(f"Training Random Forest on {len(df)} samples across {len(features)} features...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Fertilizer Model Validation Accuracy: {acc * 100:.2f}%")
    print("\nClassification Report:\n", classification_report(y_test, y_pred, zero_division=0))

    # Save artifacts
    print(f"Saving artifacts to {resolved_model_dir}...")
    joblib.dump(model, model_path)
    joblib.dump(le_soil, soil_enc_path)
    joblib.dump(le_crop, crop_enc_path)
    joblib.dump(le_fert, fert_enc_path)
    print("Fertilizer model and categorical encoders saved successfully.")


def main():
    parser = argparse.ArgumentParser(description="Train Fertilizer Recommendation Classifier.")
    parser.add_argument("--data", type=str, default=os.getenv("FERTILIZER_DATASET_PATH", str(DEFAULT_DATA_PATH)),
                        help="Path to fertilizer dataset CSV")
    parser.add_argument("--output-dir", type=str, default=os.getenv("FERTILIZER_MODEL_DIR", str(DEFAULT_MODEL_DIR)),
                        help="Directory to save fertilizer_model.pkl and label encoders")

    args = parser.parse_args()
    train_fertilizer_model(Path(args.data), Path(args.output_dir))


if __name__ == "__main__":
    main()
