import sys
sys.path.insert(0, 'e:/AGRI-DASH')

from backend.routers.crop_recommendations import router
from fastapi import FastAPI
from fastapi.testclient import TestClient

app = FastAPI()
app.include_router(router)

client = TestClient(app)

# Test the API
response = client.post("/api/recommendations/suggest", json={
    "district": "coimbatore",
    "season": "Kharif",
    "top_n": 3
})

print(f"Status Code: {response.status_code}")
print(f"Response: {response.text[:500] if response.status_code != 200 else 'Success'}")

if response.status_code == 200:
    data = response.json()
    print(f"District: {data['district']}")
    print(f"Season: {data['season']}")
    print(f"Recommendations: {len(data['recommendations'])}")
    for i, rec in enumerate(data['recommendations'][:3], 1):
        print(f"\n{i}. {rec['crop']}")
        print(f"   Avg Yield: {rec['avg_yield']}")
        print(f"   Climate: {rec['climate']}")
