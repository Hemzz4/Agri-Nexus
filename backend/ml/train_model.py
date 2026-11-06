"""
Training Pipeline for Predictive Models (Crop Yield & Multi-Output Micro-Climate)
Part of AgriNexus / Agri-Insight Framework.

This script trains:
1. Crop Yield Regressor (Random Forest on historical agricultural records)
2. Micro-Climate Multi-Output Regressor (Predicts Temperature, Precipitation,
   Humidity, Soil Wetness, and Wind Speed based on District, Year, and Month)

Artifacts are saved portably to 'backend/ml/' by default.
"""

import os
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

import sys
import argparse
from pathlib import Path
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

# Portable directory resolution
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent
DEFAULT_DATA_DIR = BACKEND_DIR / "data"
DEFAULT_OUTPUT_DIR = SCRIPT_DIR

DEFAULT_YIELD_DATA = DEFAULT_DATA_DIR / "Final_Model_Ready_Dataset.csv"
DEFAULT_WEATHER_DATA = DEFAULT_DATA_DIR / "Final_TN_Climate_Master_LongFormat_CLEANED.csv"


def load_dataset(path: Path, name: str) -> pd.DataFrame:
    """Validate and load dataset from a portable path."""
    resolved_path = Path(path).resolve()
    if not resolved_path.exists():
        # Fallback check in current working directory and data subfolder
        cwd_candidate = Path.cwd() / resolved_path.name
        data_candidate = DEFAULT_DATA_DIR / resolved_path.name
        if cwd_candidate.exists():
            resolved_path = cwd_candidate
        elif data_candidate.exists():
            resolved_path = data_candidate
        else:
            raise FileNotFoundError(
                f"Required {name} dataset not found at: {resolved_path}\n"
                f"Please ensure the CSV exists or specify the path via CLI argument or environment variable."
            )
    print(f"[{name}] Successfully loaded dataset from: {resolved_path}")
    return pd.read_csv(resolved_path)


def train_yield_model(df: pd.DataFrame, output_path: Path):
    """Train Random Forest Regressor for agricultural crop yield prediction."""
    print("\n" + "=" * 60)
    print(" TRAINING CROP YIELD PREDICTION MODEL")
    print("=" * 60)

    # 1. Clean Data
    # Drop Production as Yield = Production / Area
    if 'Production' in df.columns:
        df = df.drop(columns=['Production'])

    df_clean = df.dropna().copy()

    # 2. Features and Target
    target = 'Yield'
    categorical_features = ['State_Name', 'District', 'Season', 'Crop']
    numerical_features = ['Area', 'Year', 'Crop_Year', 'Temperature', 'Precipitation', 'Humidity', 'Soil_Wetness', 'Wind_Speed']

    numerical_features = [c for c in numerical_features if c in df_clean.columns]
    categorical_features = [c for c in categorical_features if c in df_clean.columns]

    X = df_clean[numerical_features + categorical_features]
    y = df_clean[target]

    print(f"Dataset size: {len(df_clean)} records across {len(X.columns)} features.")

    # 3. Preprocessor Pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numerical_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ]
    )

    # 4. Model Pipeline
    model_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1))
    ])

    # 5. Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # 6. Fit & Evaluate
    print("Fitting Random Forest Regressor...")
    model_pipeline.fit(X_train, y_train)

    y_pred = model_pipeline.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print(f"Yield Model Evaluation:")
    print(f"  - RMSE: {rmse:.4f}")
    print(f"  - MAE:  {mae:.4f}")
    print(f"  - R²:   {r2:.4f}")

    # 7. Save Artifact (with compression for git portability)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model_pipeline, output_path, compress=3)
    print(f"Yield model successfully saved to: {output_path}")


def train_weather_model(df: pd.DataFrame, output_path: Path):
    """Train multi-output Random Forest Regressor for micro-climate prediction."""
    print("\n" + "=" * 60)
    print(" TRAINING MICRO-CLIMATE MULTI-OUTPUT MODEL")
    print("=" * 60)

    # Standardize column naming
    col_map = {c.lower(): c for c in df.columns}
    real_district = col_map.get('district')
    real_year = col_map.get('year')
    real_month = col_map.get('month')

    if not all([real_district, real_year, real_month]):
        raise ValueError(f"Weather dataset must contain District, Year, and Month columns. Found: {list(df.columns)}")

    targets = ['Temperature', 'Precipitation', 'Humidity', 'Soil_Wetness', 'Wind_Speed']
    available_targets = [t for t in targets if t in df.columns]

    if not available_targets:
        raise ValueError(f"None of the target weather columns {targets} were found in the dataset.")

    df_clean = df.dropna(subset=[real_district, real_year, real_month] + available_targets).copy()

    X = df_clean[[real_district, real_year, real_month]]
    y = df_clean[available_targets]

    print(f"Weather Training Samples: {len(df_clean)} records predicting {available_targets}.")

    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore'), [real_district]),
            ('num', StandardScaler(), [real_year, real_month])
        ]
    )

    model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1))
    ])

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Fitting Multi-Output Weather Regressor...")
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    r2_avg = r2_score(y_test, y_pred, multioutput='uniform_average')
    print(f"Weather Model Average R² Score: {r2_avg:.4f}")

    for idx, col in enumerate(available_targets):
        col_rmse = np.sqrt(mean_squared_error(y_test.iloc[:, idx], y_pred[:, idx]))
        col_r2 = r2_score(y_test.iloc[:, idx], y_pred[:, idx])
        print(f"  * {col:<15}: RMSE={col_rmse:.4f}, R²={col_r2:.4f}")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, output_path, compress=3)
    print(f"Weather model successfully saved to: {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Train AgriNexus Yield and Weather Models portably.")
    parser.add_argument("--yield-data", type=str, default=os.getenv("YIELD_DATASET_PATH", str(DEFAULT_YIELD_DATA)),
                        help="Path to crop yield dataset CSV")
    parser.add_argument("--weather-data", type=str, default=os.getenv("WEATHER_DATASET_PATH", str(DEFAULT_WEATHER_DATA)),
                        help="Path to historical climate dataset CSV")
    parser.add_argument("--output-dir", type=str, default=os.getenv("ML_OUTPUT_DIR", str(DEFAULT_OUTPUT_DIR)),
                        help="Directory to save generated .joblib model artifacts")

    args = parser.parse_args()

    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    yield_model_out = output_dir / "yield_model.joblib"
    weather_model_out = output_dir / "weather_model.joblib"

    try:
        df_yield = load_dataset(Path(args.yield_data), "Yield")
        train_yield_model(df_yield, yield_model_out)
    except Exception as e:
        print(f"Error training yield model: {e}")

    try:
        df_weather = load_dataset(Path(args.weather_data), "Weather")
        train_weather_model(df_weather, weather_model_out)
    except Exception as e:
        print(f"Error training weather model: {e}")


if __name__ == "__main__":
    main()
