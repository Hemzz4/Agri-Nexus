import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score

# Configuration
YIELD_DATASET_PATH = "C:\\Users\\shakt\\Downloads\\Final_Model_Ready_Dataset.csv"
WEATHER_DATASET_PATH = "C:\\Users\\shakt\\Downloads\\Final_TN_Climate_Master_LongFormat_CLEANED.csv"

YIELD_MODEL_PATH = "yield_model.joblib"
WEATHER_MODEL_PATH = "weather_model.joblib"

def load_data(path):
    if os.path.exists(path):
        print(f"Dataset found at: {path}")
        return pd.read_csv(path)
    
    # Fallback to local search if absolute path fails
    filename = os.path.basename(path)
    possible_paths = [
        os.path.join(os.getcwd(), filename),
        os.path.join(os.path.dirname(__file__), filename),
        os.path.join("E:/AGRI-DASH", filename)
    ]
    
    for p in possible_paths:
        if os.path.exists(p):
            print(f"Dataset found at: {p}")
            return pd.read_csv(p)

    raise FileNotFoundError(f"Dataset not found: {path}")

def train_yield_model(df):
    print("\n--- Training Yield Model ---")
    
    # 1. Clean Data
    # Drop Production as it's directly related to Yield (Yield = Production / Area)
    if 'Production' in df.columns:
        df = df.drop(columns=['Production'])
    
    df_clean = df.dropna().copy()

    # 2. Define Features and Target
    target = 'Yield'
    
    # Features for Yield Prediction
    categorical_features = ['State_Name', 'District', 'Season', 'Crop']
    numerical_features = ['Area', 'Year', 'Temperature', 'Precipitation', 'Humidity', 'Soil_Wetness', 'Wind_Speed']

    # Filter available columns
    numerical_features = [c for c in numerical_features if c in df_clean.columns]
    categorical_features = [c for c in categorical_features if c in df_clean.columns]

    X = df_clean[numerical_features + categorical_features]
    y = df_clean[target]

    print(f"Yield Training: {len(df_clean)} samples, {len(X.columns)} features.")

    # 3. Preprocessing Pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numerical_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ])

    # 4. Model Pipeline
    model_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1))
    ])

    # 5. Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # 6. Train
    print("Training yield model...")
    model_pipeline.fit(X_train, y_train)

    # 7. Evaluate
    y_pred = model_pipeline.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print(f"Yield Model Performance: RMSE={np.sqrt(mse):.4f}, R2={r2:.4f}")

    # 8. Save Model
    joblib.dump(model_pipeline, YIELD_MODEL_PATH)
    print(f"Yield model saved to {YIELD_MODEL_PATH}")

def train_weather_model(df):
    print("\n--- Training Weather Model ---")
    
    # Target variables
    targets = ['Temperature', 'Precipitation', 'Humidity', 'Soil_Wetness', 'Wind_Speed']
    
    # Ensure all targets exist
    missing_targets = [t for t in targets if t not in df.columns]
    if missing_targets:
        print(f"Skipping Weather Model: Missing columns {missing_targets}")
        return

    # Drop rows where any of the targets are missing
    df_clean = df.dropna(subset=targets).copy()

    # Features: District, Year, Month (we use these to predict weather)
    # Note: State_Name could also be useful if available, but District is more specific.
    feature_cols = ['District', 'Year', 'Month']
    
    # Ensure features exist (Month might be 'Month' or derived)
    # If 'Month' column doesn't exist, we might need to check column names. 
    # Based on user request "Month from 1 to 12", assuming column name is 'Month'
    
    missing_features = [f for f in feature_cols if f not in df_clean.columns]
    if missing_features:
        # Check case sensitivity or alternative names if needed?
        # User screenshot showed 'Month' with capital M. 'YEAR' with capital 'YEAR'.
        # Let's adjust for robustness
        pass # Will handle by checking names below

    # Map actual column names if slightly different (common in CSVs)
    col_map = {c.lower(): c for c in df_clean.columns}
    
    real_district = col_map.get('district', 'District')
    real_year = col_map.get('year', 'Year')
    real_month = col_map.get('month', 'Month')
    
    used_features = [real_district, real_year, real_month]
    
    # Verify again
    if not all(f in df_clean.columns for f in used_features):
        print(f"Critical features missing for weather model: needed {used_features}, found {df_clean.columns}")
        return

    X = df_clean[used_features]
    y = df_clean[targets]

    print(f"Weather Training: {len(df_clean)} samples.")

    # Preprocessing
    # District is categorical -> OneHot
    # Year, Month are numerical (Month is cyclic but often treated as num or cat. Treating as Num/Ordinal for trees is fine)
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore'), [real_district]),
            ('num', StandardScaler(), [real_year, real_month])
        ])

    # Simple Random Forest Regressor works for multi-output natively in sklearn
    model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1))
    ])

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training weather model...")
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    r2 = r2_score(y_test, y_pred, multioutput='uniform_average')
    print(f"Weather Model Avgerage R2 Score: {r2:.4f}")

    joblib.dump(model, WEATHER_MODEL_PATH)
    print(f"Weather model saved to {WEATHER_MODEL_PATH}")

def main():
    try:
        # Train Yield Model
        print("Loading Yield Dataset...")
        df_yield = load_data(YIELD_DATASET_PATH)
        train_yield_model(df_yield)
        
        # Train Weather Model
        print("Loading Weather Dataset...")
        df_weather = load_data(WEATHER_DATASET_PATH)
        train_weather_model(df_weather)
        
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
