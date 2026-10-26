import pandas as pd
import numpy as np
from prophet import Prophet
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

class ClimatePredictor:
    """
    Climate prediction using Facebook Prophet for time-series forecasting
    """
    
    def __init__(self, csv_path):
        """Load and prepare climate dataset"""
        self.df = pd.read_csv(csv_path)
        self.parameters = ['Temperature', 'Humidity', 'Precipitation', 'Soil_Wetness', 'Wind_Speed']
        
    def prepare_data(self, district, parameter):
        """
        Prepare time-series data for Prophet
        Prophet requires columns: ds (date), y (value)
        """
        # Filter for specific district
        district_data = self.df[self.df['district'] == district].copy()
        
        # Create date column from YEAR and Month (note: capitalization)
        district_data['ds'] = pd.to_datetime(
            district_data['YEAR'].astype(str) + '-' + 
            district_data['Month'].astype(str).str.zfill(2) + '-01'
        )
        
        # Rename parameter column to 'y'
        district_data['y'] = district_data[parameter]
        
        # Sort by date and drop NaN values
        prophet_df = district_data[['ds', 'y']].sort_values('ds').dropna().reset_index(drop=True)
        
        return prophet_df
    
    def predict_future(self, district, parameter, start_year=2026, end_year=2030):
        """
        Generate monthly predictions using Prophet
        
        Args:
            district: Tamil Nadu district name
            parameter: Climate parameter to predict
            start_year: Start year for predictions
            end_year: End year for predictions
            
        Returns:
            dict with historical_data, predictions, and metadata
        """
        try:
            # Prepare historical data
            prophet_df = self.prepare_data(district, parameter)
            
            if len(prophet_df) < 24:  # Need at least 2 years of data
                return {"error": "Insufficient historical data"}
            
            # Initialize and fit Prophet model
            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=False,
                daily_seasonality=False,
                seasonality_mode='multiplicative',
                interval_width=0.95  # 95% confidence interval
            )
            
            model.fit(prophet_df)
            
            # Create future dates
            last_date = prophet_df['ds'].max()
            end_date = datetime(end_year, 12, 31)
            
            # Calculate months to predict
            months_ahead = ((end_year - last_date.year) * 12 + 
                           (12 - last_date.month))
            
            # Generate future dataframe
            future = model.make_future_dataframe(periods=months_ahead, freq='M')
            
            # Make predictions
            forecast = model.predict(future)
            
            # Filter predictions for requested years
            predictions = forecast[
                (forecast['ds'].dt.year >= start_year) & 
                (forecast['ds'].dt.year <= end_year)
            ].copy()
            
            # Format results
            result = {
                "district": district,
                "parameter": parameter,
                "historical": [
                    {
                        "date": row['ds'].strftime('%Y-%m'),
                        "value": round(row['y'], 2)
                    }
                    for _, row in prophet_df.tail(36).iterrows()  # Last 3 years historical
                ],
                "predictions": [
                    {
                        "date": row['ds'].strftime('%Y-%m'),
                        "predicted": round(row['yhat'], 2),
                        "lower_bound": round(row['yhat_lower'], 2),
                        "upper_bound": round(row['yhat_upper'], 2)
                    }
                    for _, row in predictions.iterrows()
                ],
                "model_info": {
                    "type": "Prophet",
                    "confidence_interval": "95%",
                    "historical_data_points": len(prophet_df),
                    "prediction_start": start_year,
                    "prediction_end": end_year
                }
            }
            
            return result
            
        except Exception as e:
            return {"error": str(e)}
    
    def predict_multiple_districts(self, districts, parameter, start_year=2026, end_year=2030):
        """
        Generate predictions for multiple districts
        
        Returns:
            List of prediction results for each district
        """
        results = []
        for district in districts:
            prediction = self.predict_future(district, parameter, start_year, end_year)
            results.append(prediction)
        
        return results
    
    def get_available_districts(self):
        """Return list of available districts"""
        return sorted(self.df['district'].unique().tolist())
    
    def get_summary_stats(self, district, parameter):
        """Get summary statistics for a district and parameter"""
        district_data = self.df[self.df['district'] == district]
        param_data = district_data[parameter]
        
        return {
            "mean": round(param_data.mean(), 2),
            "std": round(param_data.std(), 2),
            "min": round(param_data.min(), 2),
            "max": round(param_data.max(), 2),
            "recent_trend": "increasing" if param_data.tail(12).mean() > param_data.head(12).mean() else "decreasing"
        }
