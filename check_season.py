import pandas as pd
import os

DATASET_PATH = "C:\\Users\\shakt\\Downloads\\Final_Model_Ready_Dataset.csv"

def check_season():
    if os.path.exists(DATASET_PATH):
        df = pd.read_csv(DATASET_PATH)
        if 'Season' in df.columns:
            print("Season Unique Values:", df['Season'].unique())
        else:
            print("No Season column.")
    else:
        print("Dataset not found.")

if __name__ == "__main__":
    check_season()
