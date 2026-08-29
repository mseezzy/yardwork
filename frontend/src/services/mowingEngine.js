/**
 * Client-Side Mowing Intelligence Engine
 * Matches the Python FastAPI scoring, inclement weather disqualification, and spacing algorithms.
 */

export const WMO_CODES = {
  0: { description: "Clear sky", icon: "sunny", is_inclement: false },
  1: { description: "Mainly clear", icon: "mostly-sunny", is_inclement: false },
  2: { description: "Partly cloudy", icon: "partly-cloudy", is_inclement: false },
  3: { description: "Overcast", icon: "cloudy", is_inclement: false },
  45: { description: "Foggy", icon: "fog", is_inclement: false },
  48: { description: "Depositing rime fog", icon: "fog", is_inclement: false },
  51: { description: "Light drizzle", icon: "drizzle", is_inclement: true },
  53: { description: "Moderate drizzle", icon: "drizzle", is_inclement: true },
  55: { description: "Dense drizzle", icon: "drizzle", is_inclement: true },
  56: { description: "Freezing drizzle", icon: "snow", is_inclement: true },
  57: { description: "Dense freezing drizzle", icon: "snow", is_inclement: true },
  61: { description: "Slight rain", icon: "rain", is_inclement: true },
  63: { description: "Moderate rain", icon: "rain", is_inclement: true },
  65: { description: "Heavy rain", icon: "heavy-rain", is_inclement: true },
  66: { description: "Light freezing rain", icon: "rain", is_inclement: true },
  67: { description: "Heavy freezing rain", icon: "heavy-rain", is_inclement: true },
  71: { description: "Slight snowfall", icon: "snow", is_inclement: true },
  73: { description: "Moderate snowfall", icon: "snow", is_inclement: true },
  75: { description: "Heavy snowfall", icon: "snow", is_inclement: true },
  77: { description: "Snow grains", icon: "snow", is_inclement: true },
  80: { description: "Slight rain showers", icon: "showers", is_inclement: true },
  81: { description: "Moderate rain showers", icon: "showers", is_inclement: true },
  82: { description: "Violent rain showers", icon: "heavy-rain", is_inclement: true },
  85: { description: "Slight snow showers", icon: "snow", is_inclement: true },
  86: { description: "Heavy snow showers", icon: "snow", is_inclement: true },
  95: { description: "Thunderstorm", icon: "thunderstorm", is_inclement: true },
  96: { description: "Thunderstorm with hail", icon: "thunderstorm", is_inclement: true },
  99: { description: "Thunderstorm with heavy hail", icon: "thunderstorm", is_inclement: true },
};

export function getWeatherMeta(code) {
  return WMO_CODES[code] || {
    description: `Weather (${code})`,
    icon: code >= 50 ? "rain" : "cloudy",
    is_inclement: code >= 50
  };
}

export function fToC(f) {
  return Math.round(((f - 32) * 5) / 9 * 10) / 10;
}

export function cToF(c) {
  return Math.round(((c * 9) / 5 + 32) * 10) / 10;
}

export function evaluateHourlySlot(slotData, preferences) {
  const {
    time,
    hour,
    temp_f,
    apparent_temp_f,
    precip_prob = 0,
    precip_in = 0,
    weather_code = 0,
    wind_mph = 5,
    wind_gust_mph = 8,
    humidity = 50,
    uv_index = 3,
    is_day = true,
    recent_rain_in = 0
  } = slotData;

  const weather = getWeatherMeta(weather_code);
  const isInclement = weather.is_inclement;

  // Determine Grass Dryness
  let grass_dryness = "DRY";
  if (precip_in > 0.02 || isInclement) {
    grass_dryness = "WET";
  } else if (recent_rain_in > 0.05) {
    grass_dryness = "WET";
  } else if (recent_rain_in > 0.01) {
    grass_dryness = "DAMP";
  } else if (hour < 9) {
    grass_dryness = "DAMP";
  }

  // Disqualification check
  let disqualification_reason = null;

  if (isInclement) {
    disqualification_reason = `Inclement weather (${weather.description})`;
  } else if (precip_prob > preferences.max_rain_prob) {
    disqualification_reason = `High rain probability (${precip_prob}% > ${preferences.max_rain_prob}%)`;
  } else if (precip_in > 0.01) {
    disqualification_reason = `Precipitation predicted (${precip_in.toFixed(2)} in)`;
  } else if (grass_dryness === "WET") {
    disqualification_reason = "Lawn wet from recent rainfall";
  } else if (wind_mph > preferences.max_wind_mph) {
    disqualification_reason = `High wind (${wind_mph.toFixed(1)} mph > ${preferences.max_wind_mph} mph)`;
  } else if (hour < 8 || hour > 20) {
    disqualification_reason = "Outside neighborhood daytime mowing hours (8 AM - 8 PM)";
  } else if (!is_day && (hour < 7 || hour > 20)) {
    disqualification_reason = "Darkness / Outside daylight";
  } else if (apparent_temp_f > 95) {
    disqualification_reason = `Excessive heat (Feels like ${Math.round(apparent_temp_f)}°F)`;
  } else if (apparent_temp_f < 45) {
    disqualification_reason = `Too cold (Feels like ${Math.round(apparent_temp_f)}°F)`;
  }

  if (disqualification_reason) {
    return {
      time,
      hour,
      temperature_f: Math.round(temp_f * 10) / 10,
      apparent_temperature_f: Math.round(apparent_temp_f * 10) / 10,
      temperature_c: fToC(temp_f),
      apparent_temperature_c: fToC(apparent_temp_f),
      precipitation_probability: precip_prob,
      precipitation_inches: Math.round(precip_in * 1000) / 1000,
      precipitation_mm: Math.round(precip_in * 25.4 * 10) / 10,
      weather_code,
      weather_description: weather.description,
      weather_icon: weather.icon,
      wind_speed_mph: Math.round(wind_mph * 10) / 10,
      wind_gust_mph: Math.round(wind_gust_mph * 10) / 10,
      relative_humidity: humidity,
      uv_index: Math.round(uv_index * 10) / 10,
      is_day: Boolean(is_day),
      grass_dryness,
      mowing_score: 0,
      is_recommended: false,
      disqualification_reason
    };
  }

  // Scoring
  let score = 0;

  // 1. Temperature Score (Max 45)
  const tMin = preferences.temp_min_f;
  const tMax = preferences.temp_max_f;
  if (apparent_temp_f >= tMin && apparent_temp_f <= tMax) {
    score += 45;
  } else if (apparent_temp_f >= tMin - 4 && apparent_temp_f <= tMax + 4) {
    score += 32;
  } else if (apparent_temp_f >= tMin - 8 && apparent_temp_f <= tMax + 8) {
    score += 18;
  } else {
    score += 5;
  }

  // 2. Wind Score (Max 25)
  if (wind_mph <= 8) score += 25;
  else if (wind_mph <= 13) score += 20;
  else if (wind_mph <= 18) score += 12;
  else score += 2;

  // 3. Time of day (Max 20)
  if (hour >= 9 && hour <= 11) score += 20;
  else if (hour >= 16 && hour <= 19) score += 20;
  else if (hour >= 12 && hour <= 15) score += uv_index > 7 ? 10 : 15;
  else if (hour === 8) score += grass_dryness !== "DAMP" ? 10 : 5;
  else score += 8;

  // 4. Preferred Time Bonus (Max 10)
  if (preferences.preferred_time === "morning" && hour >= 8 && hour <= 11) score += 10;
  else if (preferences.preferred_time === "afternoon" && hour >= 12 && hour <= 16) score += 10;
  else if (preferences.preferred_time === "evening" && hour >= 17 && hour <= 20) score += 10;
  else if (preferences.preferred_time === "any") score += 10;

  if (grass_dryness === "DAMP") {
    score = Math.max(10, score - 15);
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  return {
    time,
    hour,
    temperature_f: Math.round(temp_f * 10) / 10,
    apparent_temperature_f: Math.round(apparent_temp_f * 10) / 10,
    temperature_c: fToC(temp_f),
    apparent_temperature_c: fToC(apparent_temp_f),
    precipitation_probability: precip_prob,
    precipitation_inches: Math.round(precip_in * 1000) / 1000,
    precipitation_mm: Math.round(precip_in * 25.4 * 10) / 10,
    weather_code,
    weather_description: weather.description,
    weather_icon: weather.icon,
    wind_speed_mph: Math.round(wind_mph * 10) / 10,
    wind_gust_mph: Math.round(wind_gust_mph * 10) / 10,
    relative_humidity: humidity,
    uv_index: Math.round(uv_index * 10) / 10,
    is_day: Boolean(is_day),
    grass_dryness,
    mowing_score: finalScore,
    is_recommended: finalScore >= 60,
    disqualification_reason: null
  };
}

export function findBestWindow(hourlySlots) {
  const daylight = hourlySlots.filter(s => s.hour >= 8 && s.hour <= 19 && s.mowing_score > 0);
  if (daylight.length === 0) return null;
  if (daylight.length === 1) {
    const s = daylight[0];
    return {
      start_time: `${String(s.hour).padStart(2, '0')}:00`,
      end_time: `${String(s.hour + 1).padStart(2, '0')}:00`,
      time_label: getWindowLabel(s.hour),
      avg_score: s.mowing_score,
      avg_feels_like_f: s.apparent_temperature_f,
      avg_feels_like_c: s.apparent_temperature_c,
      avg_rain_prob: s.precipitation_probability,
      avg_wind_mph: s.wind_speed_mph,
      reason: `Best available: Feels like ${Math.round(s.apparent_temperature_f)}°F, ${s.weather_description}`
    };
  }

  let bestAvg = -1;
  let bestIdx = 0;

  for (let i = 0; i < daylight.length - 1; i++) {
    const s1 = daylight[i];
    const s2 = daylight[i + 1];
    if (s2.hour !== s1.hour + 1) continue;

    const avg = (s1.mowing_score + s2.mowing_score) / 2;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestIdx = i;
    }
  }

  if (bestAvg < 20) return null;

  const s1 = daylight[bestIdx];
  const s2 = daylight[bestIdx + 1];
  const avgFeelsF = Math.round((s1.apparent_temperature_f + s2.apparent_temperature_f) / 2 * 10) / 10;
  const avgRain = Math.round((s1.precipitation_probability + s2.precipitation_probability) / 2);
  const avgWind = Math.round((s1.wind_speed_mph + s2.wind_speed_mph) / 2 * 10) / 10;

  return {
    start_time: `${String(s1.hour).padStart(2, '0')}:00`,
    end_time: `${String(s2.hour + 1).padStart(2, '0')}:00`,
    time_label: getWindowLabel(s1.hour),
    avg_score: Math.round(bestAvg),
    avg_feels_like_f: avgFeelsF,
    avg_feels_like_c: fToC(avgFeelsF),
    avg_rain_prob: avgRain,
    avg_wind_mph: avgWind,
    reason: `Prime 2-hr window: Feels like ${Math.round(avgFeelsF)}°F, ${avgRain}% rain chance, wind ${avgWind} mph`
  };
}

function getWindowLabel(hour) {
  if (hour < 11) return "Mid-Morning (Prime)";
  if (hour < 14) return "Midday";
  if (hour < 17) return "Early Afternoon";
  return "Late Afternoon / Evening";
}

export function optimizeSpacing(days, targetCount) {
  const n = days.length;
  if (n === 0 || targetCount <= 0) return [];
  const count = Math.min(targetCount, n);

  if (count === 1) {
    let bestIdx = 0;
    let bestScore = -999;
    days.forEach((d, i) => {
      let score = d.overall_day_score;
      if (d.status === "UNFAVORABLE") score -= 100;
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    });
    return [bestIdx];
  }

  const idealGap = n / count;
  const allIndices = Array.from({ length: n }, (_, i) => i);

  // Helper combinations
  function getCombinations(arr, k) {
    if (k === 0) return [[]];
    if (arr.length === 0) return [];
    const head = arr[0];
    const tail = arr.slice(1);
    const withHead = getCombinations(tail, k - 1).map(c => [head, ...c]);
    const withoutHead = getCombinations(tail, k);
    return [...withHead, ...withoutHead];
  }

  const combos = getCombinations(allIndices, count);
  let bestCombo = null;
  let bestFitness = -1e9;

  combos.forEach(combo => {
    let fitness = 0;
    combo.forEach(idx => {
      const d = days[idx];
      let pts = d.overall_day_score;
      if (d.status === "UNFAVORABLE") pts -= 120;
      else if (d.status === "MARGINAL") pts -= 15;
      fitness += pts;
    });

    for (let k = 0; k < combo.length - 1; k++) {
      const gap = combo[k + 1] - combo[k];
      const gapDiff = Math.abs(gap - idealGap);
      fitness -= Math.pow(gapDiff, 1.8) * 12;
      if (gap < 2 && n >= 7) fitness -= 80;
    }

    if (fitness > bestFitness) {
      bestFitness = fitness;
      bestCombo = combo;
    }
  });

  return bestCombo || [0];
}

export function processWeatherDataToPlan(location, preferences, rawData) {
  const hourly = rawData.hourly || {};
  const times = hourly.time || [];
  const temps = hourly.temperature_2m || [];
  const apparentTemps = hourly.apparent_temperature || [];
  const precipProbs = hourly.precipitation_probability || [];
  const precips = hourly.precipitation || [];
  const weatherCodes = hourly.weathercode || [];
  const winds = hourly.windspeed_10m || [];
  const gusts = hourly.windgusts_10m || [];
  const humidities = hourly.relativehumidity_2m || [];
  const uvs = hourly.uv_index || [];
  const isDays = hourly.is_day || [];

  const allSlots = [];
  for (let i = 0; i < times.length; i++) {
    const tStr = times[i];
    const dt = new Date(tStr);
    const hour = dt.getHours();

    let recentRain = 0;
    const lookback = Math.max(0, i - 4);
    for (let j = lookback; j < i; j++) {
      recentRain += (precips[j] || 0);
    }

    const slot = evaluateHourlySlot({
      time: tStr,
      hour,
      temp_f: temps[i] ?? 70,
      apparent_temp_f: apparentTemps[i] ?? 70,
      precip_prob: precipProbs[i] ?? 0,
      precip_in: precips[i] ?? 0,
      weather_code: weatherCodes[i] ?? 0,
      wind_mph: winds[i] ?? 5,
      wind_gust_mph: gusts[i] ?? 8,
      humidity: humidities[i] ?? 50,
      uv_index: uvs[i] ?? 3,
      is_day: Boolean(isDays[i]),
      recent_rain_in: recentRain
    }, preferences);

    allSlots.push(slot);
  }

  // Group by date
  const slotsByDate = {};
  allSlots.forEach(s => {
    const dKey = s.time.split("T")[0];
    if (!slotsByDate[dKey]) slotsByDate[dKey] = [];
    slotsByDate[dKey].push(s);
  });

  const sortedDates = Object.keys(slotsByDate).sort().slice(0, preferences.duration_days);
  const calendarDays = [];

  sortedDates.forEach(dateStr => {
    const daySlots = slotsByDate[dateStr];
    const dt = new Date(dateStr + "T12:00:00");
    const dayOfWeek = dt.toLocaleDateString("en-US", { weekday: "long" });
    const formattedDate = dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const dayTemps = daySlots.map(s => s.temperature_f);
    const dayFeels = daySlots.map(s => s.apparent_temperature_f);
    const dayPrecips = daySlots.map(s => s.precipitation_inches);
    const dayRainProbs = daySlots.map(s => s.precipitation_probability);
    const dayWinds = daySlots.map(s => s.wind_speed_mph);
    const dayCodes = daySlots.map(s => s.weather_code);

    const tempHighF = Math.max(...dayTemps);
    const tempLowF = Math.min(...dayTemps);
    const feelsHighF = Math.max(...dayFeels);
    const feelsLowF = Math.min(...dayFeels);
    const maxRain = Math.max(...dayRainProbs);
    const totalRain = dayPrecips.reduce((a, b) => a + b, 0);
    const maxWind = Math.max(...dayWinds);

    const daylightCodes = daySlots.filter(s => s.hour >= 8 && s.hour <= 19).map(s => s.weather_code);
    const dominantCode = daylightCodes.length > 0 ? mode(daylightCodes) : (dayCodes[12] ?? 0);
    const dominantInfo = getWeatherMeta(dominantCode);

    const peakWindow = findBestWindow(daySlots);
    const daylightScores = daySlots.filter(s => s.hour >= 8 && s.hour <= 19).map(s => s.mowing_score);
    const avgScore = daylightScores.length > 0 ? daylightScores.reduce((a, b) => a + b, 0) / daylightScores.length : 0;
    const overallDayScore = peakWindow ? peakWindow.avg_score : Math.round(avgScore);

    let status = "OPTIMAL";
    let status_label = "Great Day to Mow";
    let status_color = "green";
    let status_message = peakWindow ? `Prime conditions! ${peakWindow.time_label} (${peakWindow.start_time} - ${peakWindow.end_time})` : "Favorable mowing weather.";

    if (overallDayScore >= 70 && !dominantInfo.is_inclement) {
      status = "OPTIMAL";
      status_label = "Great Day to Mow";
      status_color = "green";
    } else if (overallDayScore >= 45 && !dominantInfo.is_inclement) {
      status = "MARGINAL";
      status_label = "Fair / Acceptable";
      status_color = "yellow";
      status_message = `Acceptable window around ${peakWindow ? peakWindow.start_time : 'afternoon'}. Mild temperature or light breeze.`;
    } else {
      status = "UNFAVORABLE";
      status_label = "Do Not Mow";
      status_color = "red";
      if (dominantInfo.is_inclement || maxRain > 40) {
        status_message = `Rain or inclement weather predicted (${dominantInfo.description}).`;
      } else if (feelsHighF > 92) {
        status_message = `Excessive heat warning (Feels like ${Math.round(feelsHighF)}°F).`;
      } else if (feelsLowF < 48) {
        status_message = `Too cold for clean lawn cutting (Feels like ${Math.round(feelsLowF)}°F).`;
      } else {
        status_message = "Suboptimal mowing conditions.";
      }
    }

    calendarDays.push({
      date: dateStr,
      day_of_week: dayOfWeek,
      formatted_date: formattedDate,
      status,
      status_label,
      status_color,
      status_message,
      is_scheduled_mow: false,
      schedule_order: null,
      overall_day_score: overallDayScore,
      peak_window: peakWindow,
      temp_high_f: tempHighF,
      temp_low_f: tempLowF,
      temp_high_c: fToC(tempHighF),
      temp_low_c: fToC(tempLowF),
      feels_like_high_f: feelsHighF,
      feels_like_low_f: feelsLowF,
      feels_like_high_c: fToC(feelsHighF),
      feels_like_low_c: fToC(feelsLowF),
      max_rain_prob: maxRain,
      total_rain_inches: Math.round(totalRain * 100) / 100,
      total_rain_mm: Math.round(totalRain * 25.4 * 10) / 10,
      max_wind_mph: maxWind,
      dominant_weather_code: dominantCode,
      dominant_weather_description: dominantInfo.description,
      dominant_weather_icon: dominantInfo.icon,
      hourly_slots: daySlots
    });
  });

  const scheduledIndices = optimizeSpacing(calendarDays, preferences.mow_count);
  scheduledIndices.forEach((idx, order) => {
    if (idx < calendarDays.length) {
      calendarDays[idx].is_scheduled_mow = true;
      calendarDays[idx].schedule_order = order + 1;
    }
  });

  const goodDays = calendarDays.filter(d => d.status === "OPTIMAL").length;
  const fairDays = calendarDays.filter(d => d.status === "MARGINAL").length;
  const badDays = calendarDays.filter(d => d.status === "UNFAVORABLE").length;

  const firstSched = calendarDays.find(d => d.is_scheduled_mow);

  return {
    location,
    preferences,
    generated_at: new Date().toISOString(),
    summary: {
      total_days: calendarDays.length,
      requested_mows: preferences.mow_count,
      scheduled_mows_count: scheduledIndices.length,
      good_days_count: goodDays,
      fair_days_count: fairDays,
      bad_days_count: badDays,
      next_recommended_date: firstSched ? `${firstSched.day_of_week}, ${firstSched.formatted_date}` : null,
      next_recommended_window: firstSched?.peak_window ? `${firstSched.peak_window.start_time} - ${firstSched.peak_window.end_time} (${firstSched.peak_window.time_label})` : "Any daylight hour",
      overall_outlook: `${goodDays} great mowing days available over the next ${calendarDays.length} days.`
    },
    calendar: calendarDays
  };
}

function mode(arr) {
  const counts = {};
  let maxCount = 0;
  let maxVal = arr[0];
  arr.forEach(val => {
    counts[val] = (counts[val] || 0) + 1;
    if (counts[val] > maxCount) {
      maxCount = counts[val];
      maxVal = val;
    }
  });
  return maxVal;
}
