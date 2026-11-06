from fastapi import APIRouter, HTTPException
from typing import List, Dict
import pandas as pd
import numpy as np
from pathlib import Path

router = APIRouter(prefix="/api/recommendations", tags=["crop_recommendations"])

# Load dataset
DATA_PATH = Path(__file__).parent.parent / "data" / "Final_Model_Ready_Dataset.csv"
df = pd.read_csv(DATA_PATH)

# Normalize district names
df['District'] = df['District'].str.lower().str.strip()

@router.get("/districts")
async def get_districts():
    """Get list of available districts"""
    districts = sorted(df['District'].unique().tolist())
    return {"districts": districts}

@router.get("/seasons")
async def get_seasons():
    """Get list of available seasons"""
    seasons = sorted(df['Season'].unique().tolist())
    return {"seasons": seasons}

@router.get("/district/{district}/seasons")
async def get_district_seasons(district: str):
    """Get available seasons for a specific district"""
    district = district.lower().strip()
    district_data = df[df['District'] == district]
    
    if district_data.empty:
        return {"seasons": []}
    
    seasons = sorted(district_data['Season'].unique().tolist())
    return {"seasons": seasons}

@router.get("/crops")
async def get_all_crops():
    """Get list of all crops"""
    crops = sorted(df['Crop'].unique().tolist())
    return {"crops": crops}

@router.post("/suggest")
async def get_crop_recommendations(request: Dict):
    """
    Get top crop recommendations for a district and season
    
    Request body:
    - district: str
    - season: str
    - top_n: int (optional, default 5)
    """
    district = request.get('district', '').lower().strip()
    season = request.get('season', '')
    top_n = request.get('top_n', 5)
    
    if not district or not season:
        raise HTTPException(status_code=400, detail="District and season are required")
    
    # Filter data
    filtered_df = df[(df['District'] == district) & (df['Season'] == season)].copy()
    
    
    if filtered_df.empty:
        # Instead of error, provide helpful alternatives
        
        # Find available seasons for this district
        district_data = df[df['District'] == district]
        available_seasons = sorted(district_data['Season'].unique().tolist()) if not district_data.empty else []
        
        # Find districts with data for this season
        season_data = df[df['Season'] == season]
        available_districts = sorted(season_data['District'].unique().tolist()) if not season_data.empty else []
        
        # Get top 3 crops across all data for this season (if any)
        general_recommendations = []
        if not season_data.empty:
            crop_yields = season_data.groupby('Crop')['Yield'].mean().sort_values(ascending=False).head(3)
            for crop, yield_val in crop_yields.items():
                general_recommendations.append({
                    'crop': crop,
                    'avg_yield': round(float(yield_val), 2),
                    'note': 'Average across all districts'
                })
        
        return {
            'district': district,
            'season': season,
            'no_data': True,
            'message': f'No specific data available for {district.title()} in {season} season',
            'alternatives': {
                'available_seasons': available_seasons,
                'available_districts': available_districts[:10],  # Show top 10
                'general_recommendations': general_recommendations
            },
            'suggestions': [
                f'Try selecting one of these seasons for {district.title()}: {", ".join(available_seasons)}' if available_seasons else f'{district.title()} has no data in our dataset',
                f'Or try one of these districts for {season}: {", ".join(available_districts[:5])}' if available_districts else f'No districts have {season} data'
            ]
        }
    
    # Calculate crop statistics with statistical safeguards for small sample sizes
    crop_stats = []
    crops = filtered_df['Crop'].unique()
    
    district_avg = filtered_df['Yield'].mean() if not filtered_df.empty else 0.0
    max_crop_yield = filtered_df.groupby('Crop')['Yield'].mean().max() if not filtered_df.empty else 1.0
    if max_crop_yield <= 0 or pd.isna(max_crop_yield):
        max_crop_yield = 1.0

    MIN_RELIABLE_OBSERVATIONS = 3
    SMOOTHING_K = 3.0  # Empirical Bayes shrinkage prior

    for crop in crops:
        crop_data = filtered_df[filtered_df['Crop'] == crop]
        count = len(crop_data)
        
        # Calculate metrics
        mean_yield = crop_data['Yield'].mean()
        if count >= 2:
            std_yield = crop_data['Yield'].std()
            if pd.isna(std_yield):
                std_yield = 0.0
        else:
            std_yield = 0.0
        
        # Calculate success rate (yields above district-season average)
        success_count = len(crop_data[crop_data['Yield'] > district_avg])
        raw_success_rate = (success_count / count * 100.0) if count > 0 else 0.0
        
        # Calculate trend (recent years performance, requires at least 3 years)
        if count >= 3:
            crop_data_sorted = crop_data.sort_values('Year')
            recent_avg = crop_data_sorted.tail(3)['Yield'].mean()
            older_avg = crop_data_sorted.head(max(3, count-3))['Yield'].mean()
            trend = ((recent_avg - older_avg) / older_avg * 100.0) if older_avg > 0 else 0.0
        else:
            trend = 0.0
        
        # Calculate reliability score (inverse of coefficient of variation)
        if count >= 2 and mean_yield > 0:
            cv = (std_yield / mean_yield)
            reliability = max(0.0, min(100.0, (1.0 - cv) * 100.0))
        else:
            reliability = 25.0 if count == 1 else 0.0
        
        # Statistical confidence indicators and Empirical Bayes shrinkage
        credibility_weight = count / (count + SMOOTHING_K)

        if count >= 6:
            confidence_level = "High"
            statistically_reliable = True
            obs_note = f"Robust historical foundation ({count} recorded harvest seasons)."
        elif count >= MIN_RELIABLE_OBSERVATIONS:
            confidence_level = "Moderate"
            statistically_reliable = True
            obs_note = f"Moderate sample size ({count} recorded harvest seasons)."
        else:
            confidence_level = "Low (Insufficient Historical Data)"
            statistically_reliable = False
            obs_note = (
                f"Caution: Only {count} observation(s) recorded for {district.title()} in {season}. "
                "Insufficient sample size for high statistical reliability. Evaluated with empirical shrinkage penalty."
            )

        # Normalized relative yield index (0 - 100)
        relative_yield_index = (mean_yield / max_crop_yield * 100.0) if max_crop_yield > 0 else 0.0

        # Shrunk success rate towards uninformative 50% prior
        shrunk_success = (credibility_weight * raw_success_rate) + ((1.0 - credibility_weight) * 50.0)

        # Composite score incorporating yield, consistency, and trend
        composite_score = (
            (relative_yield_index * 0.45) +
            (shrunk_success * 0.25) +
            (reliability * 0.20) +
            (max(0.0, min(20.0, trend)) * 0.10)
        )

        # Sample-size awareness penalty: penalize unverified low-sample crops
        sample_penalty = credibility_weight if count < MIN_RELIABLE_OBSERVATIONS else (0.85 + 0.15 * min(1.0, count / 10.0))
        final_ranking_score = composite_score * sample_penalty

        # Get average climate conditions for this crop
        avg_temp = crop_data['Temperature'].mean() if 'Temperature' in df.columns else None
        avg_humidity = crop_data['Humidity'].mean() if 'Humidity' in df.columns else None
        avg_precipitation = crop_data['Precipitation'].mean() if 'Precipitation' in df.columns else None
        avg_wind = crop_data['Wind_Speed'].mean() if 'Wind_Speed' in df.columns else None
        avg_soil_wetness = crop_data['Soil_Wetness'].mean() if 'Soil_Wetness' in df.columns else None
        
        crop_stats.append({
            'crop': crop,
            'avg_yield': round(float(mean_yield), 2) if not pd.isna(mean_yield) else 0.0,
            'std_yield': round(float(std_yield), 2) if not pd.isna(std_yield) else 0.0,
            'reliability_score': round(float(reliability), 1) if not pd.isna(reliability) else 0.0,
            'success_rate': round(float(raw_success_rate), 1) if not pd.isna(raw_success_rate) else 0.0,
            'trend': round(float(trend), 1) if not pd.isna(trend) else 0.0,
            'sample_count': int(count),
            'confidence_level': confidence_level,
            'statistically_reliable': statistically_reliable,
            'observation_note': obs_note,
            'score': round(float(final_ranking_score), 2) if not pd.isna(final_ranking_score) else 0.0,
            'climate': {
                'temperature': round(float(avg_temp), 1) if avg_temp and not pd.isna(avg_temp) else None,
                'humidity': round(float(avg_humidity), 1) if avg_humidity and not pd.isna(avg_humidity) else None,
                'precipitation': round(float(avg_precipitation), 1) if avg_precipitation and not pd.isna(avg_precipitation) else None,
                'wind_speed': round(float(avg_wind), 1) if avg_wind and not pd.isna(avg_wind) else None,
                'soil_wetness': round(float(avg_soil_wetness), 2) if avg_soil_wetness and not pd.isna(avg_soil_wetness) else None
            }
        })
    
    # Sort by sample-size-aware score and get top N
    crop_stats.sort(key=lambda x: x['score'], reverse=True)
    top_recommendations = crop_stats[:top_n]
    
    return {
        'district': district,
        'season': season,
        'recommendations': top_recommendations,
        'total_crops_analyzed': len(crop_stats)
    }

@router.get("/district/{district}/season/{season}/climate")
async def get_season_climate(district: str, season: str):
    """Get average climate conditions for a district in a specific season"""
    district = district.lower().strip()
    
    filtered_df = df[(df['District'] == district) & (df['Season'] == season)]
    
    if filtered_df.empty:
        raise HTTPException(status_code=404, detail="No data found")
    
    
    climate_data = {
        'temperature': round(filtered_df['Temperature'].mean(), 1) if 'Temperature' in df.columns else None,
        'humidity': round(filtered_df['Humidity'].mean(), 1) if 'Humidity' in df.columns else None,
        'precipitation': round(filtered_df['Precipitation'].mean(), 1) if 'Precipitation' in df.columns else None,
        'wind_speed': round(filtered_df['Wind_Speed'].mean(), 1) if 'Wind_Speed' in df.columns else None,
        'soil_wetness': round(filtered_df['Soil_Wetness'].mean(), 2) if 'Soil_Wetness' in df.columns else None,
        'temp_range': {
            'min': round(filtered_df['Temperature'].min(), 1) if 'Temperature' in df.columns else None,
            'max': round(filtered_df['Temperature'].max(), 1) if 'Temperature' in df.columns else None
        }
    }
    
    return climate_data
