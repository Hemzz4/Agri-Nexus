
import os
from pathlib import Path
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import confusion_matrix, classification_report, accuracy_score

BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_PATH = BASE_DIR / "data" / "Final_Model_Ready_Dataset.csv"
OUTPUT_IMAGE_PATH = Path(__file__).resolve().parent / "confusion_matrix_yield.png"

def train_and_evaluate():
    print(f"Loading dataset from {DATASET_PATH}...")
    if not os.path.exists(DATASET_PATH):
        print(f"Error: Dataset not found at {DATASET_PATH}")
        return

    df = pd.read_csv(DATASET_PATH)

    # 1. Clean Data (same as train_model.py)
    if 'Production' in df.columns:
        df = df.drop(columns=['Production'])
    
    df_clean = df.dropna().copy()

    # 2. Define Features and Target
    target = 'Yield'
    categorical_features = ['State_Name', 'District', 'Season', 'Crop']
    numerical_features = ['Area', 'Year', 'Temperature', 'Precipitation', 'Humidity', 'Soil_Wetness', 'Wind_Speed']

    # Filter available columns
    numerical_features = [c for c in numerical_features if c in df_clean.columns]
    categorical_features = [c for c in categorical_features if c in df_clean.columns]

    X = df_clean[numerical_features + categorical_features]
    y = df_clean[target]

    print(f"Data ready: {len(df_clean)} samples.")

    # 3. Preprocessing Pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numerical_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ])

    # 4. Model Pipeline
    # Using fewer trees for speed in this evaluation script, but enough for decent results
    model_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=50, random_state=42, n_jobs=-1))
    ])

    # 5. Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # 6. Train
    print("Training model...")
    model_pipeline.fit(X_train, y_train)

    # 7. Predict
    print("Generating predictions...")
    y_pred = model_pipeline.predict(X_test)

    # 8. Binning for Confusion Matrix
    # We will use quantiles to define Low, Medium, High
    # Calculate quantiles on the Training set to avoid leakage, or on entire dataset? 
    # Usually bin definitions come from domain knowledge or distribution.
    # Let's use 33rd and 66th percentiles of y_train.
    
    q1 = np.percentile(y_train, 33.33)
    q2 = np.percentile(y_train, 66.67)

    print(f"Yield Thresholds: Low < {q1:.2f} <= Medium < {q2:.2f} <= High")

    def bin_yield(val):
        if val < q1:
            return 'Low'
        elif val < q2:
            return 'Medium'
        else:
            return 'High'

    y_test_binned = [bin_yield(v) for v in y_test]
    y_pred_binned = [bin_yield(v) for v in y_pred]
    
    labels = ['Low', 'Medium', 'High']

    # 9. Compute Confusion Matrix
    cm = confusion_matrix(y_test_binned, y_pred_binned, labels=labels)
    
    # 10. Plot
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=labels, yticklabels=labels)
    plt.xlabel('Predicted Yield')
    plt.ylabel('Actual Yield')
    plt.title('Confusion Matrix: Actual vs Predicted Yield Categories')
    print(f"Saving confusion matrix to {OUTPUT_IMAGE_PATH}...")
    plt.tight_layout()
    plt.savefig(OUTPUT_IMAGE_PATH, dpi=300)
    plt.close()
    print("Done!")

    # Print classification report
    print("\nClassification Report:")
    print(classification_report(y_test_binned, y_pred_binned, target_names=labels))
    print(accuracy_score(y_test_binned, y_pred_binned))

if __name__ == "__main__":
    train_and_evaluate()
