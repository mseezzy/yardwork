import { processWeatherDataToPlan } from './mowingEngine';

const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Search locations via Backend or direct Open-Meteo Geocoding
 */
export async function searchLocationsApi(query) {
  if (!query || query.trim().length < 2) return [];

  // Try backend first if available
  try {
    const res = await fetch(`${API_BASE}/api/locations?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return data.results;
      }
    }
  } catch (err) {
    // Fallback to direct Open-Meteo Geocoding
  }

  // Direct Open-Meteo Geocoding
  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.results) return [];

    return data.results.map(item => {
      const parts = [item.name];
      if (item.admin2) parts.push(item.admin2);
      if (item.admin1) parts.push(item.admin1);
      if (item.country) parts.push(item.country);

      return {
        id: item.id,
        name: item.name,
        latitude: item.latitude,
        longitude: item.longitude,
        elevation: item.elevation,
        country: item.country,
        admin1: item.admin1,
        admin2: item.admin2,
        display_name: parts.join(', '),
        timezone: item.timezone || 'America/New_York'
      };
    });
  } catch (err) {
    console.error('Geocoding search failed', err);
    return [];
  }
}

/**
 * Generate Mowing Plan via Backend or direct Open-Meteo Weather API + Client Engine
 */
export async function fetchMowingPlanApi(location, preferences) {
  // Try Backend POST first
  try {
    const res = await fetch(`${API_BASE}/api/mow-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: location.latitude,
        longitude: location.longitude,
        location_name: location.display_name || location.name,
        timezone: location.timezone || 'auto',
        preferences
      })
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Proceed to direct Open-Meteo fetch + engine
  }

  // Direct Open-Meteo API Fetch
  const apiDays = Math.min(preferences.duration_days, 16);
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,rain,weathercode,windspeed_10m,windgusts_10m,relativehumidity_2m,uv_index,is_day&daily=weathercode,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,precipitation_probability_max,windspeed_10m_max,sunrise,sunset&temperature_unit=fahrenheit&windspeed_unit=mph&precipitation_unit=inch&timezone=${encodeURIComponent(location.timezone || 'auto')}&forecast_days=${apiDays}`;

  const resp = await fetch(weatherUrl);
  if (!resp.ok) {
    throw new Error(`Weather forecast request failed (${resp.status})`);
  }

  let rawData = await resp.json();

  // Extend to 30 days if requested
  if (preferences.duration_days > 16) {
    rawData = extendRawWeatherData(rawData, preferences.duration_days);
  }

  return processWeatherDataToPlan(location, preferences, rawData);
}

function extendRawWeatherData(data, targetDays) {
  const daily = data.daily || {};
  const hourly = data.hourly || {};
  if (!daily.time || daily.time.length === 0) return data;

  const currentDays = daily.time.length;
  if (currentDays >= targetDays) return data;

  const lastDate = new Date(daily.time[daily.time.length - 1] + 'T00:00:00');
  const daysToAdd = targetDays - currentDays;

  for (let i = 1; i <= daysToAdd; i++) {
    const nextDate = new Date(lastDate);
    nextDate.setDate(lastDate.getDate() + i);
    const nextDateStr = nextDate.toISOString().split('T')[0];
    const refIdx = (i - 1) % currentDays;

    daily.time.push(nextDateStr);
    ['weathercode', 'temperature_2m_max', 'temperature_2m_min', 'apparent_temperature_max', 'apparent_temperature_min', 'precipitation_sum', 'precipitation_probability_max', 'windspeed_10m_max'].forEach(k => {
      if (daily[k]) daily[k].push(daily[k][refIdx]);
    });

    const refHourStart = refIdx * 24;
    for (let h = 0; h < 24; h++) {
      const hourStr = `${nextDateStr}T${String(h).padStart(2, '0')}:00`;
      const srcIdx = refHourStart + h;
      if (srcIdx < hourly.time.length) {
        hourly.time.push(hourStr);
        ['temperature_2m', 'apparent_temperature', 'precipitation_probability', 'precipitation', 'rain', 'weathercode', 'windspeed_10m', 'windgusts_10m', 'relativehumidity_2m', 'uv_index', 'is_day'].forEach(k => {
          if (hourly[k] && srcIdx < hourly[k].length) {
            hourly[k].push(hourly[k][srcIdx]);
          }
        });
      }
    }
  }

  return data;
}
