import pandas as pd
import os

path = "e:/AGRI-DASH/backend/data/Final_Model_Ready_Dataset.csv"
print(f"Checking path: {path}")

if not os.path.exists(path):
    print("ERROR: File does not exist at absolute path.")
else:
    print("File exists. Attempting to read...")
    try:
        df = pd.read_csv(path)
        print(f"SUCCESS: Read {len(df)} rows.")
        print(f"Columns: {list(df.columns)}")
    except Exception as e:
        print(f"ERROR reading CSV: {e}")
