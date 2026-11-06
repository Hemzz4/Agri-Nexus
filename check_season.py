from pathlib import Path
import pandas as pd

DATASET_PATH = Path(__file__).resolve().parent / "backend" / "data" / "Final_Model_Ready_Dataset.csv"

def check_season():
    if DATASET_PATH.exists():
        df = pd.read_csv(DATASET_PATH)
        if 'Season' in df.columns:
            print("Season Unique Values:", df['Season'].unique())
        else:
            print("No Season column.")
    else:
        print(f"Dataset not found at {DATASET_PATH}")

if __name__ == "__main__":
    check_season()
