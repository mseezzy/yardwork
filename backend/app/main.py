import os
from fastapi import FastAPI, Query, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List

from app.config import settings
from app.models.schemas import (
    LocationSearchResponse,
    LocationSuggestion,
    MowingPlanRequest,
    MowingPlanResponse,
    MowingPreferences
)
from app.services.geocoding_service import search_locations
from app.services.weather_service import fetch_weather_data
from app.services.scheduler_service import build_mowing_plan

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Smart Lawn Mowing Weather Planner Backend API"
)

# CORS configuration to allow local web development and Vercel/Netlify hosting
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "status": "online",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs_url": "/docs"
    }


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/api/locations", response_model=LocationSearchResponse)
async def get_locations(
    q: str = Query(..., min_length=2, description="Search address, city, or postal code")
):
    """
    Search for address/city/zipcode to get coordinates via Open-Meteo Geocoding.
    """
    results = await search_locations(q)
    return LocationSearchResponse(query=q, results=results)


@app.post("/api/mow-plan", response_model=MowingPlanResponse)
async def generate_mow_plan(request: MowingPlanRequest):
    """
    Generate color-coded lawn mowing calendar and hourly breakdown for the requested duration.
    """
    try:
        weather_raw = await fetch_weather_data(
            latitude=request.latitude,
            longitude=request.longitude,
            duration_days=request.preferences.duration_days,
            timezone=request.timezone or "auto"
        )
        
        location_obj = LocationSuggestion(
            name=request.location_name or "Custom Location",
            latitude=request.latitude,
            longitude=request.longitude,
            display_name=request.location_name or f"{request.latitude:.3f}, {request.longitude:.3f}",
            timezone=request.timezone or "America/New_York"
        )

        plan = build_mowing_plan(
            location=location_obj,
            preferences=request.preferences,
            raw_weather_data=weather_raw
        )
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate mowing plan: {str(e)}")


@app.get("/api/mow-plan", response_model=MowingPlanResponse)
async def get_mow_plan_query(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    name: Optional[str] = Query("Selected Location", description="Display location name"),
    tz: Optional[str] = Query("auto", description="Timezone"),
    duration_days: int = Query(7, ge=7, le=30, description="Duration in days: 7, 14, or 30"),
    mow_count: int = Query(1, ge=1, le=10, description="Desired number of mows"),
    temp_min_f: float = Query(60.0, description="Ideal minimum feels-like temp in °F"),
    temp_max_f: float = Query(82.0, description="Ideal maximum feels-like temp in °F"),
    temp_unit: str = Query("F", regex="^(F|C)$"),
    max_wind_mph: float = Query(18.0, description="Max acceptable wind in mph"),
    max_rain_prob: int = Query(25, ge=0, le=100, description="Max rain probability %"),
    preferred_time: str = Query("any", regex="^(any|morning|afternoon|evening)$")
):
    """
    GET endpoint for retrieving mowing plan via query parameters.
    """
    valid_duration = 7 if duration_days <= 7 else (14 if duration_days <= 14 else 30)
    preferences = MowingPreferences(
        duration_days=valid_duration,
        mow_count=mow_count,
        temp_min_f=temp_min_f,
        temp_max_f=temp_max_f,
        temp_unit=temp_unit,
        max_wind_mph=max_wind_mph,
        max_rain_prob=max_rain_prob,
        preferred_time=preferred_time
    )

    req = MowingPlanRequest(
        latitude=lat,
        longitude=lon,
        location_name=name,
        timezone=tz,
        preferences=preferences
    )
    return await generate_mow_plan(req)


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
