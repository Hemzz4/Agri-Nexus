from pathlib import Path
import pandas as pd

path = Path(__file__).resolve().parent / "backend" / "data" / "Final_Model_Ready_Dataset.csv"
print(f"Checking path: {path}")

if not path.exists():
    print("ERROR: File does not exist at path.")
else:
    print("File exists. Attempting to read...")
    try:
        df = pd.read_csv(path)
        print(f"SUCCESS: Read {len(df)} rows.")
        print(f"Columns: {list(df.columns)}")
    except Exception as e:
        print(f"ERROR reading CSV: {e}")
