"""
Training Pipeline for Farmer Query Advisory Category Classifier.
Part of AgriNexus / Agri-Insight Framework.

Trains a TF-IDF + Multinomial Naive Bayes pipeline to classify farmer inquiries
into agronomic operational domains (Disease, Pest, Water, Nutrient, Market, Weather, Equipment).

SCIENTIFIC LIMITATIONS NOTICE:
The training dataset (farmer_queries.csv) was produced via template-based synthetic generation.
Because templates are repeatedly populated with crop name variants, raw random splits
contain near-identical phrasing between train and test sets, inflating raw test metrics.
This script explicitly measures and reports:
1. Raw sample vs unique sample counts (duplicate density).
2. Data leakage overlap between train and test partitions.
3. Realistic deduplicated evaluation metrics alongside synthetic test set scores.
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
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score
import joblib

# Portable directory resolution
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
DEFAULT_DATA_PATH = BACKEND_DIR / "data" / "farmer_queries.csv"
DEFAULT_OUTPUT_PATH = SCRIPT_DIR / "nlp_advisory_model.joblib"


def analyze_dataset_integrity(df: pd.DataFrame):
    """Inspect synthetic dataset duplication and overlap characteristics."""
    total = len(df)
    unique_queries = df['query'].nunique()
    dup_count = total - unique_queries
    dup_pct = (dup_count / total * 100) if total > 0 else 0

    print("=" * 65)
    print(" DATASET INTEGRITY & SYNTHETIC LIMITATION AUDIT")
    print("=" * 65)
    print(f"Total rows in dataset:     {total}")
    print(f"Unique query variations:   {unique_queries}")
    print(f"Duplicate / template repeats: {dup_count} ({dup_pct:.1f}%)")
    print("\n[Methodology Notice]")
    print("This dataset was synthesized using slot-filled templates. High metric scores")
    print("on raw synthetic splits reflect in-template consistency and should not be")
    print("claimed as leakage-free real-world field NLP performance.")
    print("=" * 65 + "\n")


def train_advisory_model(data_path: Path, output_path: Path):
    resolved_data = Path(data_path).resolve()
    resolved_output = Path(output_path).resolve()

    if not resolved_data.exists():
        raise FileNotFoundError(
            f"Farmer queries dataset not found at: {resolved_data}\n"
            f"Please ensure farmer_queries.csv exists in backend/data/ or provide path via --data."
        )

    print(f"Loading farmer queries dataset from {resolved_data}...")
    df = pd.read_csv(resolved_data)
    analyze_dataset_integrity(df)

    X = df['query']
    y = df['category']

    # Stratified split on synthetic data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Check for text overlap between train and test sets
    train_set = set(X_train)
    test_set = set(X_test)
    overlap = len(train_set & test_set)
    overlap_pct = (overlap / len(test_set) * 100) if test_set else 0

    print(f"Train/Test split: {len(X_train)} train, {len(X_test)} test.")
    print(f"Identical text overlap in test set: {overlap} / {len(test_set)} ({overlap_pct:.1f}%)\n")

    print("Fitting TF-IDF + Multinomial Naive Bayes pipeline...")
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(stop_words='english', max_features=5000)),
        ('clf', MultinomialNB())
    ])

    pipeline.fit(X_train, y_train)

    print("--- Evaluation on Standard Synthetic Test Partition ---")
    y_pred = pipeline.predict(X_test)
    raw_acc = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {raw_acc * 100:.2f}%")
    print(classification_report(y_test, y_pred, zero_division=0))

    # Deduplicated partition evaluation for honest reporting
    print("--- Evaluation on Deduplicated Subset (Zero Train Overlap) ---")
    df_dedup = df.drop_duplicates(subset=['query']).copy()
    X_d_train, X_d_test, y_d_train, y_d_test = train_test_split(
        df_dedup['query'], df_dedup['category'], test_size=0.25, random_state=42, stratify=df_dedup['category']
    )
    p_dedup = Pipeline([
        ('tfidf', TfidfVectorizer(stop_words='english', max_features=5000)),
        ('clf', MultinomialNB())
    ])
    p_dedup.fit(X_d_train, y_d_train)
    y_d_pred = p_dedup.predict(X_d_test)
    dedup_acc = accuracy_score(y_d_test, y_d_pred)
    print(f"Deduplicated Validation Accuracy: {dedup_acc * 100:.2f}% (Tested on {len(X_d_test)} unique unseen queries)")

    resolved_output.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, resolved_output)
    print(f"\nModel artifact successfully saved to: {resolved_output}")


def main():
    parser = argparse.ArgumentParser(description="Train Farmer Query Advisory Model.")
    parser.add_argument("--data", type=str, default=os.getenv("ADVISORY_DATASET_PATH", str(DEFAULT_DATA_PATH)),
                        help="Path to farmer_queries.csv")
    parser.add_argument("--output", type=str, default=os.getenv("ADVISORY_MODEL_PATH", str(DEFAULT_OUTPUT_PATH)),
                        help="Path to save nlp_advisory_model.joblib")

    args = parser.parse_args()
    train_advisory_model(Path(args.data), Path(args.output))


if __name__ == "__main__":
    main()
