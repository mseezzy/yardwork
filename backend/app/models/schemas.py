from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime


class LocationSuggestion(BaseModel):
    id: Optional[int] = None
    name: str
    latitude: float
    longitude: float
    elevation: Optional[float] = None
    feature_code: Optional[str] = None
    country_code: Optional[str] = None
    country: Optional[str] = None
    admin1: Optional[str] = None  # State / Province
    admin2: Optional[str] = None  # County / Region
    display_name: str
    timezone: Optional[str] = "America/New_York"


class LocationSearchResponse(BaseModel):
    query: str
    results: List[LocationSuggestion]


class MowingPreferences(BaseModel):
    duration_days: Literal[7, 14, 30] = Field(default=7, description="Forecast duration in days (1 week, 2 weeks, 1 month)")
    mow_count: int = Field(default=1, ge=1, le=10, description="Desired mowing frequency during the period")
    temp_min_f: float = Field(default=60.0, description="Ideal minimum feels-like temperature in °F")
    temp_max_f: float = Field(default=82.0, description="Ideal maximum feels-like temperature in °F")
    temp_unit: Literal["F", "C"] = Field(default="F", description="Display temperature unit")
    max_wind_mph: float = Field(default=18.0, description="Maximum acceptable wind speed in mph")
    max_rain_prob: int = Field(default=25, ge=0, le=100, description="Maximum acceptable rain probability %")
    preferred_time: Literal["any", "morning", "afternoon", "evening"] = Field(default="any", description="Preferred time of day")


class MowingPlanRequest(BaseModel):
    latitude: float
    longitude: float
    location_name: Optional[str] = "Custom Location"
    timezone: Optional[str] = "America/New_York"
    preferences: MowingPreferences = Field(default_factory=MowingPreferences)


class HourlySlot(BaseModel):
    time: str
    hour: int
    temperature_f: float
    apparent_temperature_f: float
    temperature_c: float
    apparent_temperature_c: float
    precipitation_probability: int
    precipitation_inches: float
    precipitation_mm: float
    weather_code: int
    weather_description: str
    weather_icon: str
    wind_speed_mph: float
    wind_gust_mph: float
    relative_humidity: int
    uv_index: float
    is_day: bool
    grass_dryness: Literal["DRY", "DAMP", "WET"]
    mowing_score: int  # 0 to 100
    is_recommended: bool
    disqualification_reason: Optional[str] = None


class TimeWindowRecommendation(BaseModel):
    start_time: str
    end_time: str
    time_label: str
    avg_score: int
    avg_feels_like_f: float
    avg_feels_like_c: float
    avg_rain_prob: int
    avg_wind_mph: float
    reason: str


class DayAnalysis(BaseModel):
    date: str  # YYYY-MM-DD
    day_of_week: str  # e.g., "Saturday"
    formatted_date: str  # e.g., "Aug 29"
    status: Literal["OPTIMAL", "MARGINAL", "UNFAVORABLE"]
    status_label: str  # "Good Day", "Fair Day", "Bad Day"
    status_color: Literal["green", "yellow", "red"]
    status_message: str
    is_scheduled_mow: bool
    schedule_order: Optional[int] = None
    overall_day_score: int
    peak_window: Optional[TimeWindowRecommendation] = None
    temp_high_f: float
    temp_low_f: float
    temp_high_c: float
    temp_low_c: float
    feels_like_high_f: float
    feels_like_low_f: float
    feels_like_high_c: float
    feels_like_low_c: float
    max_rain_prob: int
    total_rain_inches: float
    total_rain_mm: float
    max_wind_mph: float
    dominant_weather_code: int
    dominant_weather_description: str
    dominant_weather_icon: str
    hourly_slots: List[HourlySlot]


class ScheduleSummary(BaseModel):
    total_days: int
    requested_mows: int
    scheduled_mows_count: int
    good_days_count: int
    fair_days_count: int
    bad_days_count: int
    next_recommended_date: Optional[str] = None
    next_recommended_window: Optional[str] = None
    overall_outlook: str


class MowingPlanResponse(BaseModel):
    location: LocationSuggestion
    preferences: MowingPreferences
    generated_at: str
    summary: ScheduleSummary
    calendar: List[DayAnalysis]
