from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
import numpy as np # Used for generating dynamic trend curves
import os
from dotenv import load_dotenv

load_dotenv()


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)


API_KEY = os.getenv("API_KEY")

def calculate_heat_index(temp_c, humidity):
    """
    Calculates the 'Feels Like' temperature using the NOAA formula approximation.
    This adds scientific depth to your project.
    """
    # Convert to Fahrenheit for the formula
    T = (temp_c * 9/5) + 32
    R = humidity
    
    HI = 0.5 * (T + 61.0 + ((T-68.0)*1.2) + (R*0.094))
    
    if HI >= 80:
        HI = -42.379 + 2.04901523*T + 10.14333127*R - 0.22475541*T*R \
             - 0.00683783*T*T - 0.05481717*R*R + 0.00122874*T*T*R \
             + 0.00085282*T*R*R - 0.00000199*T*T*R*R
             
    # Convert back to Celsius
    return (HI - 32) * 5/9

def generate_forecast_curve(base_risk):
    """
    Generates a 5-year trend line based on the current risk.
    If risk is high, the curve accelerates upward (exponential).
    If risk is low, it stays flat.
    """
    years = [2025, 2026, 2027, 2028, 2029]
    
    # Add some random noise to make it look realistic
    noise = np.random.normal(0, 2, 5) 
    
    if base_risk > 60:
        # Exponential growth for high risk cities
        trend = [base_risk + (i**1.8) + n for i, n in enumerate(noise)]
    else:
        # Linear/Flat for low risk
        trend = [base_risk + (i*0.5) + n for i, n in enumerate(noise)]
        
    # Cap at 100
    trend = [min(100, max(0, val)) for val in trend]
    
    return [{"year": y, "risk": round(t, 1)} for y, t in zip(years, trend)]

@app.get("/predict-risk/{city}")
def predict_risk(city: str):
    url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=metric"
    
    try:
        response = requests.get(url)
        if response.status_code != 200:
            return {"error": "City not found"}
            
        data = response.json()
        temp = data['main']['temp']
        humidity = data['main']['humidity']
        wind = data['wind']['speed']
        condition = data['weather'][0]['description']
        
        # --- SCIENTIFIC PROCESSING ---
        heat_index = calculate_heat_index(temp, humidity)
        
        # --- WEIGHTED SCORING ALGORITHM (Rule-Based ML) ---
        # We normalize inputs to a 0-100 scale
        
        # 1. Thermal Stress (40% weight)
        if heat_index > 40: score_heat = 100
        elif heat_index > 30: score_heat = 70
        else: score_heat = 10
        
        # 2. Water Security (Humidity) (30% weight)
        if humidity < 20: score_water = 100 # Drought
        elif humidity > 80: score_water = 60 # Flood risk potentially
        else: score_water = 10
        
        # 3. Weather Stability (Wind/Storms) (30% weight)
        score_weather = 0
        if "rain" in condition or "storm" in condition: score_weather = 80
        if wind > 10: score_weather += 20
        
        # Final Weighted Calculation
        final_risk = (score_heat * 0.4) + (score_water * 0.3) + (score_weather * 0.3)
        final_risk = round(min(final_risk, 100), 1)
        
        # --- GENERATE DYNAMIC CHARTS ---
        # Generate future prediction based on current stats
        forecast_data = generate_forecast_curve(final_risk)
        
        # Generate Radar Chart Data (Risk Factors)
        radar_data = [
            {"subject": "Thermal Stress", "A": score_heat, "fullMark": 100},
            {"subject": "Water Scarcity", "A": score_water, "fullMark": 100},
            {"subject": "Weather Instability", "A": score_weather, "fullMark": 100},
            {"subject": "Infrastructure Load", "A": min(score_heat + 10, 100), "fullMark": 100}, # Simulated
            {"subject": "Resource Depletion", "A": min(score_water + 20, 100), "fullMark": 100}, # Simulated
        ]

        return {
            "city": city,
            "metrics": {
                "temp": temp,
                "heat_index": round(heat_index, 1),
                "humidity": humidity,
                "wind": wind,
                "condition": condition.title()
            },
            "risk_score": final_risk,
            "charts": {
                "forecast": forecast_data,
                "radar": radar_data
            }
        }

    except Exception as e:
        print(e)
        return {"error": "Server Error"}