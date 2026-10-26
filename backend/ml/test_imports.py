
try:
    import pandas
    import sklearn
    import joblib
    import matplotlib
    import seaborn
    print("Imports successful")
except ImportError as e:
    print(f"Import failed: {e}")
