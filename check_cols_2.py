from pathlib import Path
import pandas as pd

DATASET_PATH = Path(__file__).resolve().parent / "backend" / "data" / "Final_Model_Ready_Dataset.csv"

def check_cols():
    if DATASET_PATH.exists():
        df = pd.read_csv(DATASET_PATH, nrows=5)
        print("Columns:")
        for c in df.columns:
            print(f"'{c}'")
    else:
        print(f"Dataset not found at {DATASET_PATH}")

if __name__ == "__main__":
    check_cols()
