import os
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["ENVIRONMENT"] = "development"

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

print("=" * 80)
print(" VERIFYING ALL MODEL INFERENCE ENDPOINTS INDIVIDUALLY")
print("=" * 80)

results = []

# 1. Weather Model Inference Endpoint (/predict/weather)
try:
    payload = {
        "district": "Madurai",
        "year": 2025,
        "month": 6
    }
    resp = client.post("/predict/weather", json=payload)
    assert resp.status_code == 200, f"Status {resp.status_code}: {resp.text}"
    data = resp.json()
    t = data.get("Temperature")
    r = data.get("Precipitation")
    results.append(("1. Weather Model (/predict/weather)", "PASS", f"Temp = {t:.2f} °C, Rain = {r:.2f} mm"))
except Exception as e:
    results.append(("1. Weather Model (/predict/weather)", "FAIL", str(e)))

# 2. Live Weather API with Fallback Telemetry (/weather/)
try:
    resp = client.get("/weather/?latitude=13.0827&longitude=80.2707")
    assert resp.status_code == 200, f"Status {resp.status_code}: {resp.text}"
    data = resp.json()
    source = data.get("data_source")
    sim = data.get("is_simulated")
    results.append(("2. Weather API Telemetry (/weather/)", "PASS", f"Source: {source}, is_simulated: {sim}"))
except Exception as e:
    results.append(("2. Weather API Telemetry (/weather/)", "FAIL", str(e)))

# 3. Fertilizer Recommendation Classifier (/api/fertilizer/predict)
try:
    payload = {
        "temperature": 26.5,
        "humidity": 65.0,
        "moisture": 45.0,
        "soil_type": "Clayey",
        "crop_type": "Paddy",
        "nitrogen": 40.0,
        "potassium": 20.0,
        "phosphorus": 30.0
    }
    resp = client.post("/api/fertilizer/predict", json=payload)
    assert resp.status_code == 200, f"Status {resp.status_code}: {resp.text}"
    data = resp.json()
    fert = data.get("fertilizer")
    conf = data.get("confidence")
    results.append(("3. Fertilizer Classifier (/api/fertilizer/predict)", "PASS", f"Fertilizer: {fert} (Confidence: {conf}%)"))
except Exception as e:
    results.append(("3. Fertilizer Classifier (/api/fertilizer/predict)", "FAIL", str(e)))

# 4. NLP Farmer Query Diagnosis (/api/nlp/advisory)
try:
    payload = {"text": "My tomato crops have yellow leaf spots and aphids."}
    resp = client.post("/api/nlp/advisory", json=payload)
    assert resp.status_code == 200, f"Status {resp.status_code}: {resp.text}"
    data = resp.json()
    cat = data.get("predicted_category")
    action = data.get("recommended_action")
    results.append(("4. NLP Farmer Advisory (/api/nlp/advisory)", "PASS", f"Category: {cat} | Action: {action[:35]}..."))
except Exception as e:
    results.append(("4. NLP Farmer Advisory (/api/nlp/advisory)", "FAIL", str(e)))

# 5. NLP Market Sentiment (/api/nlp/sentiment)
try:
    payload = {"text": "Government announces bumper subsidy and record profits for wheat growers."}
    resp = client.post("/api/nlp/sentiment", json=payload)
    assert resp.status_code == 200, f"Status {resp.status_code}: {resp.text}"
    data = resp.json()
    sent = data.get("predicted_sentiment")
    results.append(("5. NLP Market Sentiment (/api/nlp/sentiment)", "PASS", f"Predicted Sentiment: {sent}"))
except Exception as e:
    results.append(("5. NLP Market Sentiment (/api/nlp/sentiment)", "FAIL", str(e)))

# 6. NLP Entity Extraction (/api/nlp/ner)
try:
    payload = {"text": "Severe blight and whiteflies on tomato crops in Coimbatore.", "num_sentences": 1}
    resp = client.post("/api/nlp/ner", json=payload)
    assert resp.status_code == 200, f"Status {resp.status_code}: {resp.text}"
    data = resp.json()
    crops = data.get("crops", [])
    diseases = data.get("diseases", [])
    pests = data.get("pests", [])
    results.append(("6. NLP Entity Extractor (/api/nlp/ner)", "PASS", f"Crops: {crops}, Diseases: {diseases}, Pests: {pests}"))
except Exception as e:
    results.append(("6. NLP Entity Extractor (/api/nlp/ner)", "FAIL", str(e)))

# 7. NLP Similar Queries (/api/nlp/similar-queries)
try:
    payload = {"text": "How to treat whiteflies in tomato plants?"}
    resp = client.post("/api/nlp/similar-queries", json=payload)
    assert resp.status_code == 200, f"Status {resp.status_code}: {resp.text}"
    data = resp.json()
    count = len(data.get("similar_queries", []))
    results.append(("7. NLP Similar Queries (/api/nlp/similar-queries)", "PASS", f"Retrieved {count} similar tickets"))
except Exception as e:
    results.append(("7. NLP Similar Queries (/api/nlp/similar-queries)", "FAIL", str(e)))

# 8. NLP Extractive Summarizer (/api/nlp/summarize)
try:
    payload = {
        "text": (
            "Cauvery delta farmers received normal rainfall this monsoon season. "
            "Samba paddy planting is in active progress across Thanjavur district. "
            "Agricultural officers recommend systematic soil testing before urea application. "
            "Proper drainage channels will safeguard nursery beds from flash flooding."
        ),
        "num_sentences": 2
    }
    resp = client.post("/api/nlp/summarize", json=payload)
    assert resp.status_code == 200, f"Status {resp.status_code}: {resp.text}"
    data = resp.json()
    summary = data.get("summary", "")
    results.append(("8. NLP Extractive Summarizer (/api/nlp/summarize)", "PASS", f"Summary: {summary[:50]}..."))
except Exception as e:
    results.append(("8. NLP Extractive Summarizer (/api/nlp/summarize)", "FAIL", str(e)))

# 9. Crop Recommendations with Empirical Bayes (/api/recommendations/suggest)
try:
    payload = {
        "district": "thanjavur",
        "season": "Kharif",
        "top_n": 3
    }
    resp = client.post("/api/recommendations/suggest", json=payload)
    assert resp.status_code == 200, f"Status {resp.status_code}: {resp.text}"
    data = resp.json()
    recs = data.get("recommendations", [])
    top = recs[0] if recs else {}
    results.append((
        "9. Crop Recommendations (/api/recommendations/suggest)",
        "PASS",
        f"Top: {top.get('crop')} | Conf: {top.get('confidence_level')} | Samples: {top.get('historical_sample_size')} | Bayes Score: {top.get('empirical_bayes_score', 0.0):.2f}"
    ))
except Exception as e:
    results.append(("9. Crop Recommendations (/api/recommendations/suggest)", "FAIL", str(e)))

print("\n" + "-" * 85)
print(f"{'ENDPOINT':<45} | {'STATUS':<6} | {'OUTPUT / DETAIL'}")
print("-" * 85)
for ep, st, detail in results:
    print(f"{ep:<45} | {st:<6} | {detail}")
print("-" * 85)

failures = [r for r in results if r[1] != "PASS"]
print(f"\nTOTAL ENDPOINTS TESTED: {len(results)} | PASS: {len(results) - len(failures)} | FAILURES: {len(failures)}")
