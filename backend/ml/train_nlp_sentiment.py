"""
Training Pipeline for Agricultural News Sentiment Model.
Part of AgriNexus / Agri-Insight Framework.

Trains a TF-IDF + Calibrated Logistic Regression classifier to categorize
agricultural headlines into Positive, Negative, or Neutral sentiment.

SCIENTIFIC LIMITATIONS NOTICE:
The input dataset (agri_news.csv) is synthetic, built from ~40 structural news templates
populated across diverse crop names. While useful for bootstrapping sentiment heuristics,
raw random splits suffer from template and phrase overlap.
This script measures and reports:
1. Exact headline duplication rate.
2. Cross-partition overlap between train and test splits.
3. Standard synthetic validation performance alongside deduplicated performance.
"""

import os
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

import argparse
from pathlib import Path
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score, f1_score
import joblib

# Portable directory resolution
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
DEFAULT_DATA_PATH = BACKEND_DIR / "data" / "agri_news.csv"
DEFAULT_OUTPUT_PATH = SCRIPT_DIR / "nlp_sentiment_model.joblib"


def analyze_sentiment_dataset(df: pd.DataFrame):
    """Analyze duplication and template repetition in agri_news dataset."""
    total = len(df)
    unique_headlines = df['headline'].nunique()
    dups = total - unique_headlines
    dup_pct = (dups / total * 100) if total > 0 else 0

    print("=" * 65)
    print(" AGRI NEWS DATASET INTEGRITY & SYNTHETIC LIMITATION AUDIT")
    print("=" * 65)
    print(f"Total rows in dataset:       {total}")
    print(f"Unique headlines:            {unique_headlines}")
    print(f"Duplicate / template repeats: {dups} ({dup_pct:.1f}%)")
    print("\n[Methodology Notice]")
    print("This dataset was synthesized using combinatorial templates.")
    print("High accuracy on raw random splits reflects template memorization.")
    print("Performance should be cited as synthetic validation, not generalized real news performance.")
    print("=" * 65 + "\n")


def train_sentiment_model(data_path: Path, output_path: Path):
    resolved_data = Path(data_path).resolve()
    resolved_output = Path(output_path).resolve()

    if not resolved_data.exists():
        raise FileNotFoundError(
            f"Agri news dataset not found at: {resolved_data}\n"
            f"Please ensure agri_news.csv exists in backend/data/ or provide path via --data."
        )

    print(f"Loading agri news dataset from {resolved_data}...")
    df = pd.read_csv(resolved_data)
    analyze_sentiment_dataset(df)

    X = df['headline']
    y = df['sentiment']

    # Stratified 80:20 split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    train_set = set(X_train)
    test_set = set(X_test)
    overlap = len(train_set & test_set)
    overlap_pct = (overlap / len(test_set) * 100) if test_set else 0

    print(f"Train/Test split: {len(X_train)} train, {len(X_test)} test.")
    print(f"Identical headline overlap in test set: {overlap} / {len(test_set)} ({overlap_pct:.1f}%)\n")

    print("Fitting TF-IDF + Logistic Regression pipeline...")
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), min_df=2, stop_words='english')),
        ('clf', LogisticRegression(max_iter=1000, C=2.0, class_weight='balanced', random_state=42))
    ])

    pipeline.fit(X_train, y_train)

    print("--- Evaluation on Standard Synthetic Test Partition ---")
    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    macro_f1 = f1_score(y_test, y_pred, average='macro')
    print(f"Accuracy: {acc * 100:.2f}%, Macro F1: {macro_f1:.4f}")
    print(classification_report(y_test, y_pred, zero_division=0))

    # Deduplicated partition evaluation for honest scientific reporting
    print("--- Evaluation on Deduplicated Subset ---")
    df_dedup = df.drop_duplicates(subset=['headline']).copy()
    X_d_train, X_d_test, y_d_train, y_d_test = train_test_split(
        df_dedup['headline'], df_dedup['sentiment'], test_size=0.25, random_state=42, stratify=df_dedup['sentiment']
    )
    p_dedup = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), min_df=2, stop_words='english')),
        ('clf', LogisticRegression(max_iter=1000, C=2.0, class_weight='balanced', random_state=42))
    ])
    p_dedup.fit(X_d_train, y_d_train)
    y_d_pred = p_dedup.predict(X_d_test)
    dedup_acc = accuracy_score(y_d_test, y_d_pred)
    dedup_f1 = f1_score(y_d_test, y_d_pred, average='macro')
    print(f"Deduplicated Accuracy: {dedup_acc * 100:.2f}%, Macro F1: {dedup_f1:.4f} (Tested on {len(X_d_test)} unique headlines)")

    resolved_output.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, resolved_output)
    print(f"\nModel artifact successfully saved to: {resolved_output}")


def main():
    parser = argparse.ArgumentParser(description="Train Agricultural News Sentiment Classifier.")
    parser.add_argument("--data", type=str, default=os.getenv("SENTIMENT_DATASET_PATH", str(DEFAULT_DATA_PATH)),
                        help="Path to agri_news.csv")
    parser.add_argument("--output", type=str, default=os.getenv("SENTIMENT_MODEL_PATH", str(DEFAULT_OUTPUT_PATH)),
                        help="Path to save nlp_sentiment_model.joblib")

    args = parser.parse_args()
    train_sentiment_model(Path(args.data), Path(args.output))


if __name__ == "__main__":
    main()
