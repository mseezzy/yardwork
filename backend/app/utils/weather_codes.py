"""
WMO Weather Code Definitions and Lawn Mowing Severity
WMO Weather interpretation codes (WW)
"""

from typing import Dict, Any

WMO_WEATHER_MAP: Dict[int, Dict[str, Any]] = {
    0: {
        "description": "Clear sky",
        "icon": "sunny",
        "is_inclement": False,
        "severity": "none"
    },
    1: {
        "description": "Mainly clear",
        "icon": "mostly-sunny",
        "is_inclement": False,
        "severity": "none"
    },
    2: {
        "description": "Partly cloudy",
        "icon": "partly-cloudy",
        "is_inclement": False,
        "severity": "none"
    },
    3: {
        "description": "Overcast",
        "icon": "cloudy",
        "is_inclement": False,
        "severity": "none"
    },
    45: {
        "description": "Fog",
        "icon": "fog",
        "is_inclement": False,
        "severity": "damp"
    },
    48: {
        "description": "Depositing rime fog",
        "icon": "fog",
        "is_inclement": False,
        "severity": "damp"
    },
    51: {
        "description": "Light drizzle",
        "icon": "drizzle",
        "is_inclement": True,
        "severity": "inclement"
    },
    53: {
        "description": "Moderate drizzle",
        "icon": "drizzle",
        "is_inclement": True,
        "severity": "inclement"
    },
    55: {
        "description": "Dense drizzle",
        "icon": "drizzle",
        "is_inclement": True,
        "severity": "inclement"
    },
    56: {
        "description": "Light freezing drizzle",
        "icon": "snow",
        "is_inclement": True,
        "severity": "inclement"
    },
    57: {
        "description": "Dense freezing drizzle",
        "icon": "snow",
        "is_inclement": True,
        "severity": "inclement"
    },
    61: {
        "description": "Slight rain",
        "icon": "rain",
        "is_inclement": True,
        "severity": "inclement"
    },
    63: {
        "description": "Moderate rain",
        "icon": "rain",
        "is_inclement": True,
        "severity": "inclement"
    },
    65: {
        "description": "Heavy rain",
        "icon": "heavy-rain",
        "is_inclement": True,
        "severity": "inclement"
    },
    66: {
        "description": "Light freezing rain",
        "icon": "rain",
        "is_inclement": True,
        "severity": "inclement"
    },
    67: {
        "description": "Heavy freezing rain",
        "icon": "heavy-rain",
        "is_inclement": True,
        "severity": "inclement"
    },
    71: {
        "description": "Slight snow fall",
        "icon": "snow",
        "is_inclement": True,
        "severity": "inclement"
    },
    73: {
        "description": "Moderate snow fall",
        "icon": "snow",
        "is_inclement": True,
        "severity": "inclement"
    },
    75: {
        "description": "Heavy snow fall",
        "icon": "snow",
        "is_inclement": True,
        "severity": "inclement"
    },
    77: {
        "description": "Snow grains",
        "icon": "snow",
        "is_inclement": True,
        "severity": "inclement"
    },
    80: {
        "description": "Slight rain showers",
        "icon": "showers",
        "is_inclement": True,
        "severity": "inclement"
    },
    81: {
        "description": "Moderate rain showers",
        "icon": "showers",
        "is_inclement": True,
        "severity": "inclement"
    },
    82: {
        "description": "Violent rain showers",
        "icon": "heavy-rain",
        "is_inclement": True,
        "severity": "inclement"
    },
    85: {
        "description": "Slight snow showers",
        "icon": "snow",
        "is_inclement": True,
        "severity": "inclement"
    },
    86: {
        "description": "Heavy snow showers",
        "icon": "snow",
        "is_inclement": True,
        "severity": "inclement"
    },
    95: {
        "description": "Thunderstorm",
        "icon": "thunderstorm",
        "is_inclement": True,
        "severity": "severe"
    },
    96: {
        "description": "Thunderstorm with slight hail",
        "icon": "thunderstorm",
        "is_inclement": True,
        "severity": "severe"
    },
    99: {
        "description": "Thunderstorm with heavy hail",
        "icon": "thunderstorm",
        "is_inclement": True,
        "severity": "severe"
    },
}


def get_weather_info(code: int) -> Dict[str, Any]:
    """Retrieve metadata for a given WMO weather code."""
    return WMO_WEATHER_MAP.get(code, {
        "description": f"Weather code {code}",
        "icon": "cloudy",
        "is_inclement": code >= 50,
        "severity": "inclement" if code >= 50 else "none"
    })


def is_inclement_weather(code: int) -> bool:
    """Return True if weather code indicates inclement condition (rain, snow, storm)."""
    return get_weather_info(code)["is_inclement"]
