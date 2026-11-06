import pandas as pd
import numpy as np
from pathlib import Path

# Load dataset
DATA_PATH = Path(__file__).resolve().parent / 'backend' / 'data' / 'Final_Model_Ready_Dataset.csv'
df = pd.read_csv(DATA_PATH)
df['District'] = df['District'].str.lower().str.strip()

district = 'coimbatore'
season = 'Kharif'

# Filter data
filtered_df = df[(df['District'] == district) & (df['Season'] == season)].copy()
print(f"Filtered rows: {len(filtered_df)}")

if not filtered_df.empty:
    crops = filtered_df['Crop'].unique()
    print(f"Crops found: {len(crops)}")
    
    # Test with first crop
    crop = crops[0]
    print(f"\nTesting crop: {crop}")
    
    crop_data = filtered_df[filtered_df['Crop'] == crop]
    
    # Calculate metrics
    mean_yield = crop_data['Yield'].mean()
    std_yield = crop_data['Yield'].std()
    count = len(crop_data)
    
    print(f"Mean yield: {mean_yield}")
    print(f"Std yield: {std_yield}")
    print(f"Count: {count}")
    
    # Try to get climate data
    print("\nTrying climate data...")
    print(f"Columns in df: {list(df.columns)}")
    print(f"'Temperature' in df.columns: {'Temperature' in df.columns}")
    
    try:
        avg_temp = crop_data['Temperature'].mean() if 'Temperature' in df.columns else None
        print(f"Temperature mean: {avg_temp}")
    except Exception as e:
        print(f"Error getting temperature: {e}")
