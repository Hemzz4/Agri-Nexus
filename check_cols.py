import pandas as pd
import os

DATASET_PATH = "C:\\Users\\shakt\\Downloads\\Final_Model_Ready_Dataset.csv"

def check_cols():
    if os.path.exists(DATASET_PATH):
        df = pd.read_csv(DATASET_PATH, nrows=5)
        print("Columns found:", df.columns.tolist())
    else:
        print("Dataset not found at hardcoded path.")

if __name__ == "__main__":
    check_cols()
