import pandas as pd
import os

DATASET_PATH = "C:\\Users\\shakt\\Downloads\\Final_Model_Ready_Dataset.csv"

def check_cols():
    if os.path.exists(DATASET_PATH):
        df = pd.read_csv(DATASET_PATH, nrows=5)
        print("Columns:")
        for c in df.columns:
            print(f"'{c}'")
    else:
        print("Dataset not found.")

if __name__ == "__main__":
    check_cols()
