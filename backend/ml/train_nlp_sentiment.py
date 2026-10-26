import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report
import joblib
import os

def train_sentiment_model():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(base_dir, "data", "agri_news.csv")
    
    if not os.path.exists(data_path):
        print(f"Error: Dataset not found at {data_path}")
        return

    print("Loading agri news dataset...")
    df = pd.read_csv(data_path)
    
    X = df['headline']
    y = df['sentiment']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Building NLP Pipeline (TF-IDF + Calibrated Classifier)...")
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), min_df=2, stop_words='english')),
        ('clf', LogisticRegression(max_iter=1000, C=2.0, class_weight='balanced', random_state=42))
    ])
    
    print("Training the model...")
    pipeline.fit(X_train, y_train)
    
    print("Evaluating the model...")
    y_pred = pipeline.predict(X_test)
    print(classification_report(y_test, y_pred, zero_division=0))
    
    # Save the model
    model_path = os.path.join(base_dir, "ml", "nlp_sentiment_model.joblib")
    joblib.dump(pipeline, model_path)
    print(f"Model saved successfully to {model_path}")

if __name__ == "__main__":
    train_sentiment_model()
