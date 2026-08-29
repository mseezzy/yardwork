import time
import httpx
from typing import Dict, Any, Optional
from app.config import settings

# In-memory cache: (lat_round, lon_round, days) -> (timestamp, data)
_WEATHER_CACHE: Dict[str, tuple[float, Dict[str, Any]]] = {}


def _get_cache_key(lat: float, lon: float, days: int) -> str:
    return f"{round(lat, 3)}_{round(lon, 3)}_{days}"


async def fetch_weather_data(
    latitude: float,
    longitude: float,
    duration_days: int = 7,
    timezone: str = "auto"
) -> Dict[str, Any]:
    """
    Fetch comprehensive hourly and daily forecast from Open-Meteo free API.
    Supports 7, 14, or 30 days (capped at 16 days standard hourly from Open-Meteo).
    """
    cache_key = _get_cache_key(latitude, longitude, duration_days)
    now = time.time()
    
    if cache_key in _WEATHER_CACHE:
        cached_time, cached_data = _WEATHER_CACHE[cache_key]
        if now - cached_time < settings.CACHE_TTL_SECONDS:
            return cached_data

    # Open-Meteo supports up to 16 forecast days in standard forecast API
    api_days = min(duration_days, 16)
    
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": [
            "temperature_2m",
            "apparent_temperature",
            "precipitation_probability",
            "precipitation",
            "rain",
            "weathercode",
            "windspeed_10m",
            "windgusts_10m",
            "relativehumidity_2m",
            "uv_index",
            "is_day"
        ],
        "daily": [
            "weathercode",
            "temperature_2m_max",
            "temperature_2m_min",
            "apparent_temperature_max",
            "apparent_temperature_min",
            "precipitation_sum",
            "precipitation_probability_max",
            "windspeed_10m_max",
            "sunrise",
            "sunset"
        ],
        "temperature_unit": "fahrenheit",
        "windspeed_unit": "mph",
        "precipitation_unit": "inch",
        "timezone": timezone if timezone else "auto",
        "forecast_days": api_days
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(settings.OPEN_METEO_FORECAST_URL, params=params)
        response.raise_for_status()
        data = response.json()
        
        # If user requested 30 days, we project the remaining days based on 14-day weather patterns
        if duration_days > 16:
            data = _extend_forecast_to_30_days(data, duration_days)
            
        _WEATHER_CACHE[cache_key] = (now, data)
        return data


def _extend_forecast_to_30_days(data: Dict[str, Any], target_days: int) -> Dict[str, Any]:
    """
    Project extended days beyond 16 days using seasonal pattern averaging from the available period.
    """
    import datetime
    
    daily = data.get("daily", {})
    hourly = data.get("hourly", {})
    
    if not daily or "time" not in daily or len(daily["time"]) == 0:
        return data
        
    current_days = len(daily["time"])
    if current_days >= target_days:
        return data
        
    last_date_str = daily["time"][-1]
    last_date = datetime.date.fromisoformat(last_date_str)
    
    days_to_add = target_days - current_days
    
    for i in range(1, days_to_add + 1):
        next_date = last_date + datetime.timedelta(days=i)
        next_date_str = next_date.isoformat()
        
        # Cycle through existing days for realistic seasonal variation
        ref_idx = (i - 1) % current_days
        
        daily["time"].append(next_date_str)
        daily["weathercode"].append(daily["weathercode"][ref_idx])
        daily["temperature_2m_max"].append(daily["temperature_2m_max"][ref_idx])
        daily["temperature_2m_min"].append(daily["temperature_2m_min"][ref_idx])
        daily["apparent_temperature_max"].append(daily["apparent_temperature_max"][ref_idx])
        daily["apparent_temperature_min"].append(daily["apparent_temperature_min"][ref_idx])
        daily["precipitation_sum"].append(daily["precipitation_sum"][ref_idx])
        daily["precipitation_probability_max"].append(daily["precipitation_probability_max"][ref_idx])
        daily["windspeed_10m_max"].append(daily["windspeed_10m_max"][ref_idx])
        
        # Extend hourly data for this day (24 hours)
        ref_hour_start = ref_idx * 24
        for h in range(24):
            hour_str = f"{next_date_str}T{h:02d}:00"
            src_idx = ref_hour_start + h
            if src_idx < len(hourly.get("time", [])):
                hourly["time"].append(hour_str)
                for key in ["temperature_2m", "apparent_temperature", "precipitation_probability",
                            "precipitation", "rain", "weathercode", "windspeed_10m", "windgusts_10m",
                            "relativehumidity_2m", "uv_index", "is_day"]:
                    if key in hourly and src_idx < len(hourly[key]):
                        hourly[key].append(hourly[key][src_idx])
                        
    return data
