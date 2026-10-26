from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import google.generativeai as genai
import typing_extensions as typing
import pandas as pd
import numpy as np
import asyncio
import json
import os

router = APIRouter(prefix="/ai", tags=["AI Insights"])

# --- CONFIGURATION ---
# TODO: PASTE YOUR GEMINI API KEY HERE or set it in environment variables
# Example: os.environ["GEMINI_API_KEY"] = "AIzaSy..."
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyDzOsYbpMwL00gWOd5C0etbXk4pNl7wZFw")

def configure_genai():
    try:
        genai.configure(api_key=GEMINI_API_KEY)
    except Exception as e:
        print(f"Error configuring Gemini: {e}")

# Initialize
configure_genai()
model = genai.GenerativeModel('gemini-flash-latest')

class InsightRequest(BaseModel):
    district: str
    parameter: str
    value: float
    context: str = "" 
    year: typing.Optional[str] = None

# Load Data (Global Cache)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_PATH = os.path.join(BASE_DIR, "data", "Final_Model_Ready_Dataset.csv")
try:
    df = pd.read_csv(DATASET_PATH)
    print(f"Loaded dataset with {len(df)} records for context.")
except Exception as e:
    print(f"Error loading context dataset: {e}")
    df = pd.DataFrame()

# 1. Define the Strict Structure (The "Buckets")
class FarmerInsight(typing.TypedDict):
    what_to_do: list[str]
    what_not_to_do: list[str]
    potential_threats: list[str]
    safety_measures: list[str]
    mitigation_plan: list[str]
    encouraging_note: str

@router.post("/generate")
async def generate_insight(request: InsightRequest):
    # 1. Build Context (Relatable Data Lookup)
    district_context = "No history available."
    full_profile_str = ""

    if not df.empty and request.district != "All":
        try:
            d_data = df[df['District'] == request.district]
            
            # A. General Trends
            avg_yield = d_data['Yield'].mean() if not d_data.empty else 0
            district_context = f"Avg Yield: {avg_yield:.1f}, Recent Trend: {'Stable' if not d_data.empty else 'Unknown'}"

            # B. Specific Year Context (The "Relatable Data")
            if request.year:
                try:
                    row = d_data[d_data['Crop_Year'] == int(request.year)]
                    if not row.empty:
                        r = row.iloc[0]
                        full_profile_str = (
                            f"FULL SNAPSHOT for {request.year}:\n"
                            f"- Rain: {r.get('Precipitation', 'N/A')} mm (Normal: {d_data['Precipitation'].mean():.1f})\n"
                            f"- Temp: {r.get('Temperature', 'N/A')} C\n"
                            f"- Soil: {r.get('Soil_Type', 'N/A')}\n"
                            f"- Area: {r.get('Area', 'N/A')} acres\n"
                            f"- Yield: {r.get('Yield', 'N/A')}"
                        )
                except ValueError: pass
        except: pass

    if GEMINI_API_KEY == "YOUR_GEMINI_API_KEY_HERE":
        # Simulating streaming fallback
        async def fake_stream():
            yield "⚠️ API Key Missing. Please configure backend."
        return StreamingResponse(fake_stream(), media_type="text/plain")
    
    # 2. Construct Prompt (Markdown for Streaming Compatibility)
    prompt = (
        f"Act as a field agronomist. User Query: {request.district} ({request.year}).\n"
        f"Data: {request.parameter} = {request.value}.\n"
        f"**RELATABLE DATA**:\n{full_profile_str}\n"
        f"**District Avg**: {district_context}\n\n"
        "Provide a **FAST, POINTWISE** response in Markdown.\n"
        "Structure:\n"
        "**⚠️ IMMEDIATE ALERT**\n"
        "- [Critical observation based on Rain/Temp/Yield logic]\n\n"
        "**✅ FIELD ACTIONS**\n"
        "- [Step 1]\n"
        "- [Step 2]\n\n"
        "**🔮 FORECAST**\n"
        "- [Short prediction]\n\n"
        "Keep it brief. No fluff."
    )

    # 3. Stream Generator
    async def stream_generator():
        try:
            # Use standard generate_content_async with stream=True
            response = await model.generate_content_async(prompt, stream=True)
            async for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            yield f"\n\n[Error: {str(e)}]"

    return StreamingResponse(stream_generator(), media_type="text/plain")
