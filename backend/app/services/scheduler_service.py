import datetime
from typing import List, Dict, Any, Optional, Tuple
from app.models.schemas import (
    MowingPreferences,
    HourlySlot,
    TimeWindowRecommendation,
    DayAnalysis,
    ScheduleSummary,
    MowingPlanResponse,
    LocationSuggestion
)
from app.utils.weather_codes import get_weather_info, is_inclement_weather


def f_to_c(f: float) -> float:
    return round((f - 32.0) * 5.0 / 9.0, 1)


def c_to_f(c: float) -> float:
    return round((c * 9.0 / 5.0) + 32.0, 1)


def evaluate_hourly_slot(
    time_str: str,
    hour: int,
    temp_f: float,
    apparent_temp_f: float,
    precip_prob: int,
    precip_in: float,
    weather_code: int,
    wind_mph: float,
    wind_gust_mph: float,
    humidity: int,
    uv_index: float,
    is_day: bool,
    recent_rain_in: float,
    preferences: MowingPreferences
) -> HourlySlot:
    """
    Score an individual hour from 0 to 100 for lawn mowing suitability.
    """
    weather_info = get_weather_info(weather_code)
    weather_desc = weather_info["description"]
    weather_icon = weather_info["icon"]
    is_inclement = weather_info["is_inclement"]

    # Conversions
    temp_c = f_to_c(temp_f)
    apparent_temp_c = f_to_c(apparent_temp_f)
    precip_mm = round(precip_in * 25.4, 2)

    # Determine Grass Dryness
    grass_dryness = "DRY"
    if precip_in > 0.02 or is_inclement:
        grass_dryness = "WET"
    elif recent_rain_in > 0.05:
        grass_dryness = "WET"
    elif recent_rain_in > 0.01:
        grass_dryness = "DAMP"
    elif hour < 9:  # Morning dew
        grass_dryness = "DAMP"

    # Check Disqualifications
    disqualification_reason: Optional[str] = None

    if is_inclement:
        disqualification_reason = f"Inclement weather ({weather_desc})"
    elif precip_prob > preferences.max_rain_prob:
        disqualification_reason = f"High rain chance ({precip_prob}% > {preferences.max_rain_prob}%)"
    elif precip_in > 0.01:
        disqualification_reason = f"Precipitation predicted ({precip_in:.2f} in)"
    elif grass_dryness == "WET":
        disqualification_reason = "Lawn is wet from recent precipitation"
    elif wind_mph > preferences.max_wind_mph:
        disqualification_reason = f"High wind ({wind_mph:.1f} mph > {preferences.max_wind_mph:.1f} mph)"
    elif hour < 8 or hour > 20:
        disqualification_reason = "Outside daytime neighborhood mowing hours (8 AM - 8 PM)"
    elif not is_day and (hour < 7 or hour > 20):
        disqualification_reason = "Darkness / Outside daylight"
    elif apparent_temp_f > 95.0:
        disqualification_reason = f"Extreme heat (Feels like {apparent_temp_f:.0f}°F)"
    elif apparent_temp_f < 45.0:
        disqualification_reason = f"Too cold (Feels like {apparent_temp_f:.0f}°F)"

    if disqualification_reason:
        return HourlySlot(
            time=time_str,
            hour=hour,
            temperature_f=round(temp_f, 1),
            apparent_temperature_f=round(apparent_temp_f, 1),
            temperature_c=temp_c,
            apparent_temperature_c=apparent_temp_c,
            precipitation_probability=precip_prob,
            precipitation_inches=round(precip_in, 3),
            precipitation_mm=precip_mm,
            weather_code=weather_code,
            weather_description=weather_desc,
            weather_icon=weather_icon,
            wind_speed_mph=round(wind_mph, 1),
            wind_gust_mph=round(wind_gust_mph, 1),
            relative_humidity=humidity,
            uv_index=round(uv_index, 1),
            is_day=bool(is_day),
            grass_dryness=grass_dryness,
            mowing_score=0,
            is_recommended=False,
            disqualification_reason=disqualification_reason
        )

    # Calculate Quality Score (0 to 100)
    score = 0

    # 1. Temperature Score (Max 45 pts)
    t_min = preferences.temp_min_f
    t_max = preferences.temp_max_f
    if t_min <= apparent_temp_f <= t_max:
        score += 45
    elif (t_min - 4.0) <= apparent_temp_f <= (t_max + 4.0):
        score += 32
    elif (t_min - 8.0) <= apparent_temp_f <= (t_max + 8.0):
        score += 18
    else:
        score += 5

    # 2. Wind Score (Max 25 pts)
    if wind_mph <= 8.0:
        score += 25
    elif wind_mph <= 13.0:
        score += 20
    elif wind_mph <= 18.0:
        score += 12
    else:
        score += 2

    # 3. Time of Day & Grass Dryness (Max 20 pts)
    if 9 <= hour <= 11:
        # Prime morning: dew evaporated, sun not scorching
        score += 20
    elif 16 <= hour <= 19:
        # Prime late afternoon: heat decreasing, grass upright
        score += 20
    elif 12 <= hour <= 15:
        # Midday sun: acceptable but hotter
        if uv_index > 7.0:
            score += 10
        else:
            score += 15
    elif hour == 8:
        # Early morning: may have light dampness
        score += 10 if grass_dryness != "DAMP" else 5
    else:
        score += 8

    # 4. User Time Preference Bonus (Max 10 pts)
    if preferences.preferred_time == "morning" and (8 <= hour <= 11):
        score += 10
    elif preferences.preferred_time == "afternoon" and (12 <= hour <= 16):
        score += 10
    elif preferences.preferred_time == "evening" and (17 <= hour <= 20):
        score += 10
    elif preferences.preferred_time == "any":
        score += 10

    # Damp grass slight penalty
    if grass_dryness == "DAMP":
        score = max(10, score - 15)

    final_score = max(0, min(100, score))
    is_recommended = final_score >= 60

    return HourlySlot(
        time=time_str,
        hour=hour,
        temperature_f=round(temp_f, 1),
        apparent_temperature_f=round(apparent_temp_f, 1),
        temperature_c=temp_c,
        apparent_temperature_c=apparent_temp_c,
        precipitation_probability=precip_prob,
        precipitation_inches=round(precip_in, 3),
        precipitation_mm=precip_mm,
        weather_code=weather_code,
        weather_description=weather_desc,
        weather_icon=weather_icon,
        wind_speed_mph=round(wind_mph, 1),
        wind_gust_mph=round(wind_gust_mph, 1),
        relative_humidity=humidity,
        uv_index=round(uv_index, 1),
        is_day=bool(is_day),
        grass_dryness=grass_dryness,
        mowing_score=final_score,
        is_recommended=is_recommended,
        disqualification_reason=None
    )


def find_best_day_window(hourly_slots: List[HourlySlot]) -> Optional[TimeWindowRecommendation]:
    """
    Find the highest scoring 2-hour continuous daylight window for a day.
    """
    daylight_slots = [s for s in hourly_slots if 8 <= s.hour <= 19 and s.mowing_score > 0]
    if len(daylight_slots) < 2:
        # Fallback to single slot if only 1 daylight slot available
        if len(daylight_slots) == 1:
            s = daylight_slots[0]
            return TimeWindowRecommendation(
                start_time=f"{s.hour:02d}:00",
                end_time=f"{s.hour + 1:02d}:00",
                time_label=_get_window_label(s.hour),
                avg_score=s.mowing_score,
                avg_feels_like_f=s.apparent_temperature_f,
                avg_feels_like_c=s.apparent_temperature_c,
                avg_rain_prob=s.precipitation_probability,
                avg_wind_mph=s.wind_speed_mph,
                reason=f"Best available slot: Feels like {s.apparent_temperature_f:.0f}°F, {s.weather_description}"
            )
        return None

    best_avg = -1.0
    best_start_idx = 0

    for i in range(len(daylight_slots) - 1):
        s1 = daylight_slots[i]
        s2 = daylight_slots[i + 1]
        
        # Must be consecutive hours
        if s2.hour != s1.hour + 1:
            continue
            
        avg_score = (s1.mowing_score + s2.mowing_score) / 2.0
        if avg_score > best_avg:
            best_avg = avg_score
            best_start_idx = i

    if best_avg < 20:
        return None

    s1 = daylight_slots[best_start_idx]
    s2 = daylight_slots[best_start_idx + 1]
    
    avg_feels_f = round((s1.apparent_temperature_f + s2.apparent_temperature_f) / 2.0, 1)
    avg_feels_c = f_to_c(avg_feels_f)
    avg_rain = round((s1.precipitation_probability + s2.precipitation_probability) / 2)
    avg_wind = round((s1.wind_speed_mph + s2.wind_speed_mph) / 2.0, 1)
    
    label = _get_window_label(s1.hour)

    reason = f"Ideal 2-hr window: Feels like {avg_feels_f:.0f}°F, {avg_rain}% rain chance, wind {avg_wind:.0f} mph"

    return TimeWindowRecommendation(
        start_time=f"{s1.hour:02d}:00",
        end_time=f"{s2.hour + 1:02d}:00",
        time_label=label,
        avg_score=int(round(best_avg)),
        avg_feels_like_f=avg_feels_f,
        avg_feels_like_c=avg_feels_c,
        avg_rain_prob=avg_rain,
        avg_wind_mph=avg_wind,
        reason=reason
    )


def _get_window_label(start_hour: int) -> str:
    if start_hour < 11:
        return "Mid-Morning (Recommended)"
    elif start_hour < 14:
        return "Midday"
    elif start_hour < 17:
        return "Early Afternoon"
    else:
        return "Late Afternoon / Evening"


def optimize_mowing_spacing(
    days: List[DayAnalysis],
    target_mow_count: int
) -> List[int]:
    """
    Select target_mow_count optimal days that maximize weather quality while evenly spaced.
    Returns list of indices of selected days in the `days` list.
    """
    n_days = len(days)
    if n_days == 0 or target_mow_count <= 0:
        return []

    count = min(target_mow_count, n_days)
    if count == 1:
        # Pick the single highest scoring day
        best_idx = 0
        best_score = -999
        for i, d in enumerate(days):
            score = d.overall_day_score
            if d.status == "UNFAVORABLE":
                score -= 100
            if score > best_score:
                best_score = score
                best_idx = i
        return [best_idx]

    # Target ideal gap between cuts
    ideal_gap = n_days / count

    # Dynamic Programming / Combinatorial search for best spaced N days
    import itertools
    all_indices = list(range(n_days))
    
    # Candidate days (prioritize optimal and marginal)
    best_combo: Optional[Tuple[int, ...]] = None
    best_combo_fitness = -1e9

    # Generate valid combinations of length `count`
    for combo in itertools.combinations(all_indices, count):
        fitness = 0.0
        
        # Day quality score component
        for idx in combo:
            d = days[idx]
            day_pts = d.overall_day_score
            if d.status == "UNFAVORABLE":
                day_pts -= 120  # Severe penalty for bad days
            elif d.status == "MARGINAL":
                day_pts -= 15
            fitness += day_pts

        # Spacing penalty component
        for k in range(len(combo) - 1):
            gap = combo[k + 1] - combo[k]
            gap_diff = abs(gap - ideal_gap)
            fitness -= (gap_diff ** 1.8) * 12.0  # Spacing variance penalty
            
            # Avoid back-to-back days unless total days is small
            if gap < 2 and n_days >= 7:
                fitness -= 80.0

        if fitness > best_combo_fitness:
            best_combo_fitness = fitness
            best_combo = combo

    return list(best_combo) if best_combo else [0]


def build_mowing_plan(
    location: LocationSuggestion,
    preferences: MowingPreferences,
    raw_weather_data: Dict[str, Any]
) -> MowingPlanResponse:
    """
    Process raw weather API response into complete, color-coded calendar and hourly recommendations.
    """
    hourly_raw = raw_weather_data.get("hourly", {})
    daily_raw = raw_weather_data.get("daily", {})

    times = hourly_raw.get("time", [])
    temps = hourly_raw.get("temperature_2m", [])
    apparent_temps = hourly_raw.get("apparent_temperature", [])
    precip_probs = hourly_raw.get("precipitation_probability", [])
    precips = hourly_raw.get("precipitation", [])
    weather_codes = hourly_raw.get("weathercode", [])
    winds = hourly_raw.get("windspeed_10m", [])
    gusts = hourly_raw.get("windgusts_10m", [])
    humidities = hourly_raw.get("relativehumidity_2m", [])
    uvs = hourly_raw.get("uv_index", [])
    is_days = hourly_raw.get("is_day", [])

    total_hours = len(times)
    
    # Process all hours with rolling precipitation tracker for wet grass detection
    all_hourly_slots: List[HourlySlot] = []
    
    for h_idx in range(total_hours):
        t_str = times[h_idx]
        
        # Parse hour
        dt = datetime.datetime.fromisoformat(t_str)
        hour_val = dt.hour
        
        # Calculate recent rainfall in last 4 hours
        recent_rain = 0.0
        lookback_start = max(0, h_idx - 4)
        for prev_i in range(lookback_start, h_idx):
            if prev_i < len(precips):
                recent_rain += (precips[prev_i] or 0.0)

        slot = evaluate_hourly_slot(
            time_str=t_str,
            hour=hour_val,
            temp_f=temps[h_idx] if h_idx < len(temps) else 70.0,
            apparent_temp_f=apparent_temps[h_idx] if h_idx < len(apparent_temps) else 70.0,
            precip_prob=precip_probs[h_idx] if h_idx < len(precip_probs) and precip_probs[h_idx] is not None else 0,
            precip_in=precips[h_idx] if h_idx < len(precips) and precips[h_idx] is not None else 0.0,
            weather_code=weather_codes[h_idx] if h_idx < len(weather_codes) and weather_codes[h_idx] is not None else 0,
            wind_mph=winds[h_idx] if h_idx < len(winds) and winds[h_idx] is not None else 5.0,
            wind_gust_mph=gusts[h_idx] if h_idx < len(gusts) and gusts[h_idx] is not None else 8.0,
            humidity=humidities[h_idx] if h_idx < len(humidities) and humidities[h_idx] is not None else 50,
            uv_index=uvs[h_idx] if h_idx < len(uvs) and uvs[h_idx] is not None else 3.0,
            is_day=bool(is_days[h_idx]) if h_idx < len(is_days) and is_days[h_idx] is not None else True,
            recent_rain_in=recent_rain,
            preferences=preferences
        )
        all_hourly_slots.append(slot)

    # Group hourly slots by date (YYYY-MM-DD)
    slots_by_date: Dict[str, List[HourlySlot]] = {}
    for slot in all_hourly_slots:
        date_key = slot.time.split("T")[0]
        if date_key not in slots_by_date:
            slots_by_date[date_key] = []
        slots_by_date[date_key].append(slot)

    # Build DayAnalysis for each day in preferences.duration_days
    calendar_days: List[DayAnalysis] = []
    sorted_dates = sorted(slots_by_date.keys())[:preferences.duration_days]

    for date_str in sorted_dates:
        day_slots = slots_by_date[date_str]
        dt = datetime.date.fromisoformat(date_str)
        day_of_week = dt.strftime("%A")
        formatted_date = dt.strftime("%b %d")

        # Daily aggregate metrics
        day_temps_f = [s.temperature_f for s in day_slots]
        day_feels_f = [s.apparent_temperature_f for s in day_slots]
        day_precips = [s.precipitation_inches for s in day_slots]
        day_rain_probs = [s.precipitation_probability for s in day_slots]
        day_winds = [s.wind_speed_mph for s in day_slots]
        day_codes = [s.weather_code for s in day_slots]

        temp_high_f = max(day_temps_f) if day_temps_f else 75.0
        temp_low_f = min(day_temps_f) if day_temps_f else 55.0
        feels_high_f = max(day_feels_f) if day_feels_f else 75.0
        feels_low_f = min(day_feels_f) if day_feels_f else 55.0
        max_rain = max(day_rain_probs) if day_rain_probs else 0
        total_rain = sum(day_precips)
        max_wind = max(day_winds) if day_winds else 5.0

        # Dominant weather code (mode or severe code during day)
        daylight_codes = [s.weather_code for s in day_slots if 8 <= s.hour <= 19]
        dominant_code = max(set(daylight_codes), key=daylight_codes.count) if daylight_codes else (day_codes[12] if len(day_codes) > 12 else 0)
        dominant_info = get_weather_info(dominant_code)

        # Best window for the day
        peak_window = find_best_day_window(day_slots)

        # Overall day score based on peak window and general day conditions
        daylight_scores = [s.mowing_score for s in day_slots if 8 <= s.hour <= 19]
        avg_daylight_score = sum(daylight_scores) / len(daylight_scores) if daylight_scores else 0

        overall_day_score = peak_window.avg_score if peak_window else int(avg_daylight_score)

        # Determine Day Status & Color
        # 🟢 OPTIMAL / Green: Peak window >= 70, no widespread rain
        # 🟡 MARGINAL / Yellow: Peak window 45 - 69
        # 🔴 UNFAVORABLE / Red: Peak window < 45, or persistent rain/storms
        if overall_day_score >= 70 and not dominant_info["is_inclement"]:
            status = "OPTIMAL"
            status_label = "Great Day to Mow"
            status_color = "green"
            status_message = f"Prime conditions! {peak_window.time_label} ({peak_window.start_time} - {peak_window.end_time})" if peak_window else "Favorable mowing weather."
        elif overall_day_score >= 45 and not dominant_info["is_inclement"]:
            status = "MARGINAL"
            status_label = "Fair / Acceptable"
            status_color = "yellow"
            status_message = f"Acceptable window around {peak_window.start_time if peak_window else 'afternoon'}. Mild temperature or slight breeze."
        else:
            status = "UNFAVORABLE"
            status_label = "Do Not Mow"
            status_color = "red"
            if dominant_info["is_inclement"] or max_rain > 40:
                status_message = f"Rain or inclement weather predicted ({dominant_info['description']})."
            elif feels_high_f > 92.0:
                status_message = f"Excessive heat warning (Feels like {feels_high_f:.0f}°F)."
            elif feels_low_f < 48.0:
                status_message = f"Too cold for clean cut (Feels like {feels_low_f:.0f}°F)."
            else:
                status_message = "Suboptimal mowing conditions."

        calendar_days.append(DayAnalysis(
            date=date_str,
            day_of_week=day_of_week,
            formatted_date=formatted_date,
            status=status,
            status_label=status_label,
            status_color=status_color,
            status_message=status_message,
            is_scheduled_mow=False,
            schedule_order=None,
            overall_day_score=overall_day_score,
            peak_window=peak_window,
            temp_high_f=round(temp_high_f, 1),
            temp_low_f=round(temp_low_f, 1),
            temp_high_c=f_to_c(temp_high_f),
            temp_low_c=f_to_c(temp_low_f),
            feels_like_high_f=round(feels_high_f, 1),
            feels_like_low_f=round(feels_low_f, 1),
            feels_like_high_c=f_to_c(feels_high_f),
            feels_like_low_c=f_to_c(feels_low_f),
            max_rain_prob=max_rain,
            total_rain_inches=round(total_rain, 2),
            total_rain_mm=round(total_rain * 25.4, 1),
            max_wind_mph=round(max_wind, 1),
            dominant_weather_code=dominant_code,
            dominant_weather_description=dominant_info["description"],
            dominant_weather_icon=dominant_info["icon"],
            hourly_slots=day_slots
        ))

    # Apply Spacing Algorithm for requested mow frequency
    scheduled_indices = optimize_mowing_spacing(calendar_days, preferences.mow_count)
    for rank, idx in enumerate(scheduled_indices, start=1):
        if idx < len(calendar_days):
            calendar_days[idx].is_scheduled_mow = True
            calendar_days[idx].schedule_order = rank

    # Summary Statistics
    good_days = sum(1 for d in calendar_days if d.status == "OPTIMAL")
    fair_days = sum(1 for d in calendar_days if d.status == "MARGINAL")
    bad_days = sum(1 for d in calendar_days if d.status == "UNFAVORABLE")
    
    first_scheduled = next((d for d in calendar_days if d.is_scheduled_mow), None)
    next_rec_date = f"{first_scheduled.day_of_week}, {first_scheduled.formatted_date}" if first_scheduled else None
    next_rec_window = f"{first_scheduled.peak_window.start_time} - {first_scheduled.peak_window.end_time} ({first_scheduled.peak_window.time_label})" if (first_scheduled and first_scheduled.peak_window) else "Anytime daylight"

    outlook_msg = f"{good_days} excellent mowing days found across {len(calendar_days)} days."
    if good_days == 0 and fair_days > 0:
        outlook_msg = f"{fair_days} fair days available; watch for shifting forecasts."
    elif good_days == 0 and fair_days == 0:
        outlook_msg = "Persistent inclement weather or extreme conditions predicted."

    summary = ScheduleSummary(
        total_days=len(calendar_days),
        requested_mows=preferences.mow_count,
        scheduled_mows_count=len(scheduled_indices),
        good_days_count=good_days,
        fair_days_count=fair_days,
        bad_days_count=bad_days,
        next_recommended_date=next_rec_date,
        next_recommended_window=next_rec_window,
        overall_outlook=outlook_msg
    )

    return MowingPlanResponse(
        location=location,
        preferences=preferences,
        generated_at=datetime.datetime.now().isoformat(),
        summary=summary,
        calendar=calendar_days
    )
