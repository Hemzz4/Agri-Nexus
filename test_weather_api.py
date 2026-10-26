import requests
import json

def test_weather():
    url = "http://localhost:8000/weather/"
    params = {"latitude": 11.0168, "longitude": 76.9558}
    print(f"Calling {url} with {params}")
    try:
        response = requests.get(url, params=params)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("Response snippet:", response.text[:200])
        else:
            print("Error details:", response.text)
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    test_weather()
