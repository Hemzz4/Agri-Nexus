import pandas as pd
import os

DATASET_PATH = "C:\\Users\\shakt\\Downloads\\Final_TN_Climate_Master_LongFormat_CLEANED.csv"

def check_cols():
    if os.path.exists(DATASET_PATH):
        df = pd.read_csv(DATASET_PATH, nrows=5)
        print("Columns:")
        for c in df.columns:
            print(f"'{c}'")
    else:
        print("Dataset not found at path.")

if __name__ == "__main__":
    check_cols()
