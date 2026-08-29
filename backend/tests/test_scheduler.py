import pytest
from app.models.schemas import MowingPreferences, LocationSuggestion
from app.services.scheduler_service import (
    evaluate_hourly_slot,
    find_best_day_window,
    optimize_mowing_spacing,
    build_mowing_plan
)


def test_evaluate_hourly_slot_ideal_conditions():
    prefs = MowingPreferences(
        duration_days=7,
        mow_count=1,
        temp_min_f=65.0,
        temp_max_f=80.0
    )
    # 10 AM, 72°F, 0% rain, clear sky, 5 mph wind
    slot = evaluate_hourly_slot(
        time_str="2026-08-29T10:00",
        hour=10,
        temp_f=72.0,
        apparent_temp_f=72.0,
        precip_prob=0,
        precip_in=0.0,
        weather_code=0,
        wind_mph=5.0,
        wind_gust_mph=7.0,
        humidity=45,
        uv_index=4.0,
        is_day=True,
        recent_rain_in=0.0,
        preferences=prefs
    )
    assert slot.is_recommended is True
    assert slot.mowing_score >= 80
    assert slot.disqualification_reason is None
    assert slot.grass_dryness == "DRY"


def test_evaluate_hourly_slot_inclement_weather_disqualified():
    prefs = MowingPreferences(
        duration_days=7,
        mow_count=1,
        temp_min_f=60.0,
        temp_max_f=80.0
    )
    # Rain / Thunderstorm (WMO code 95)
    slot = evaluate_hourly_slot(
        time_str="2026-08-29T14:00",
        hour=14,
        temp_f=72.0,
        apparent_temp_f=72.0,
        precip_prob=80,
        precip_in=0.25,
        weather_code=95,
        wind_mph=15.0,
        wind_gust_mph=25.0,
        humidity=85,
        uv_index=2.0,
        is_day=True,
        recent_rain_in=0.1,
        preferences=prefs
    )
    assert slot.is_recommended is False
    assert slot.mowing_score == 0
    assert "Inclement weather" in slot.disqualification_reason or "rain" in slot.disqualification_reason.lower()


def test_evaluate_hourly_slot_out_of_temp_range():
    prefs = MowingPreferences(
        duration_days=7,
        mow_count=1,
        temp_min_f=65.0,
        temp_max_f=78.0
    )
    # 98°F extreme heat
    slot = evaluate_hourly_slot(
        time_str="2026-08-29T15:00",
        hour=15,
        temp_f=98.0,
        apparent_temp_f=102.0,
        precip_prob=0,
        precip_in=0.0,
        weather_code=0,
        wind_mph=6.0,
        wind_gust_mph=8.0,
        humidity=40,
        uv_index=9.0,
        is_day=True,
        recent_rain_in=0.0,
        preferences=prefs
    )
    assert slot.is_recommended is False
    assert slot.mowing_score == 0
    assert "Extreme heat" in slot.disqualification_reason


def test_optimize_mowing_spacing():
    # Mock 14 days
    mock_location = LocationSuggestion(name="Test City", latitude=30.0, longitude=-97.0, display_name="Test City, TX")
    prefs = MowingPreferences(duration_days=14, mow_count=2)
    
    # Generate mock weather data
    times = []
    for day in range(1, 15):
        for h in range(24):
            times.append(f"2026-08-{day:02d}T{h:02d}:00")
            
    mock_raw = {
        "hourly": {
            "time": times,
            "temperature_2m": [72.0] * len(times),
            "apparent_temperature": [72.0] * len(times),
            "precipitation_probability": [0] * len(times),
            "precipitation": [0.0] * len(times),
            "weathercode": [0] * len(times),
            "windspeed_10m": [5.0] * len(times),
            "windgusts_10m": [7.0] * len(times),
            "relativehumidity_2m": [50] * len(times),
            "uv_index": [4.0] * len(times),
            "is_day": [1] * len(times)
        }
    }
    
    plan = build_mowing_plan(mock_location, prefs, mock_raw)
    assert len(plan.calendar) == 14
    
    scheduled_days = [d for d in plan.calendar if d.is_scheduled_mow]
    assert len(scheduled_days) == 2
    # Verify spacing is well distributed (not adjacent days)
    idx1 = plan.calendar.index(scheduled_days[0])
    idx2 = plan.calendar.index(scheduled_days[1])
    gap = idx2 - idx1
    assert gap >= 4
