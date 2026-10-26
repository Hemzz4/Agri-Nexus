from fastapi.testclient import TestClient
import sys
import os

# Add the parent directory to sys.path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app

client = TestClient(app)

def test_advisory():
    print("Testing /api/nlp/advisory...")
    response = client.post(
        "/api/nlp/advisory",
        json={"text": "I see white spots on my grape leaves."}
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}\n")

def test_sentiment():
    print("Testing /api/nlp/sentiment...")
    response = client.post(
        "/api/nlp/sentiment",
        json={"text": "The government has approved a new budget to help farmers buy equipment."}
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}\n")

def test_extract_pest_crop():
    print("Testing /api/nlp/extract-pest-crop...")
    response = client.post(
        "/api/nlp/extract-pest-crop",
        json={"text": "Severe whiteflies and leaf curl virus observed on tomato and chilli crops with yellowing leaves and curling."}
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}\n")

if __name__ == "__main__":
    test_advisory()
    test_sentiment()
    test_extract_pest_crop()
