from fastapi import APIRouter, HTTPException, Query
import httpx

router = APIRouter()

@router.get("/")
async def get_weather(
    latitude: float = Query(..., description="Latitude of the location"),
    longitude: float = Query(..., description="Longitude of the location")
):
    """
    Fetch comprehensive current weather and forecast from Open-Meteo API.
    Includes 10+ attributes relevant to agriculture.
    """
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,soil_temperature_0cm,soil_moisture_0_to_1cm,uv_index,visibility,dew_point_2m",
        "hourly": "temperature_2m,relative_humidity_2m,precipitation_probability,rain,weather_code,surface_pressure,cloud_cover,visibility,evapotranspiration,wind_speed_10m,soil_temperature_0cm,soil_moisture_0_to_1cm,uv_index",
        "daily": "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,rain_sum,showers_sum,snowfall_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,shortwave_radiation_sum,et0_fao_evapotranspiration",
        "timezone": "auto",
        "forecast_days": 14
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            data["data_source"] = "live_open_meteo"
            data["is_simulated"] = False
            data["warning"] = None
            return data
        except httpx.HTTPError as exc:
            print(f"Open-Meteo API Error: {exc}. Providing explicitly marked simulated fallback.")
            data = generate_mock_weather(latitude, longitude)
            data["data_source"] = "simulated_fallback"
            data["is_simulated"] = True
            data["warning"] = (
                f"Live Open-Meteo API unreachable ({type(exc).__name__}: {str(exc)}). "
                "Displaying simulated fallback data for testing/demonstration purposes."
            )
            return data

def generate_mock_weather(lat, lon):
    import random
    return {
        "data_source": "simulated_fallback",
        "is_simulated": True,
        "warning": "Simulated meteorological values generated locally for offline preview.",
        "current": {
            "temperature_2m": round(25 + random.random() * 10, 1),
            "relative_humidity_2m": int(40 + random.random() * 40),
            "apparent_temperature": 28.5,
            "is_day": 1,
            "precipitation": 0.0,
            "rain": 0.0,
            "showers": 0.0,
            "snowfall": 0.0,
            "weather_code": 1,
            "cloud_cover": 20,
            "pressure_msl": 1012.0,
            "surface_pressure": 1000.0,
            "wind_speed_10m": round(5 + random.random() * 15, 1),
            "wind_direction_10m": 180,
            "wind_gusts_10m": 25.0,
            "soil_temperature_0cm": 26.0,
            "soil_moisture_0_to_1cm": round(0.2 + random.random() * 0.4, 2),
            "uv_index": 5.0
        },
        "hourly": {
             "time": ["2024-05-01T00:00"] * 24,
             "temperature_2m": [25.0] * 24,
             "relative_humidity_2m": [60] * 24,
             "rain": [0.0] * 24,
             "weather_code": [1] * 24,
             "wind_speed_10m": [10.0] * 24,
             "soil_moisture_0_to_1cm": [0.3] * 24
        },
        "daily": {
            "time": ["2024-05-01"],
            "weather_code": [1],
            "temperature_2m_max": [32.0],
            "temperature_2m_min": [22.0],
            "sunrise": ["06:00"],
            "sunset": ["18:30"],
            "uv_index_max": [8.0],
            "precipitation_sum": [0.0],
            "rain_sum": [0.0],
            "showers_sum": [0.0],
            "snowfall_sum": [0.0],
            "precipitation_hours": [0],
            "precipitation_probability_max": [10],
            "wind_speed_10m_max": [15.0],
            "wind_gusts_10m_max": [30.0],
            "wind_direction_10m_dominant": [180],
            "shortwave_radiation_sum": [20.0],
            "et0_fao_evapotranspiration": [4.0]
        }
    }

@router.get("/history")
async def get_historical_weather(
    latitude: float = Query(..., description="Latitude"),
    longitude: float = Query(..., description="Longitude"),
    start_date: str = Query(..., description="Start Date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End Date (YYYY-MM-DD)")
):
    """
    Fetch historical weather data from Open-Meteo Archive API.
    """
    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "start_date": start_date,
        "end_date": end_date,
        "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,snowfall_sum,wind_speed_10m_max,shortwave_radiation_sum,et0_fao_evapotranspiration",
        "timezone": "auto"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=503, detail=f"Archive API Error: {exc}")
