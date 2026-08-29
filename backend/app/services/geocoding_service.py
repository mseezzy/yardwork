import httpx
from typing import List
from app.config import settings
from app.models.schemas import LocationSuggestion


async def search_locations(query: str, count: int = 6) -> List[LocationSuggestion]:
    """
    Search for address/city/zipcode using Open-Meteo Free Geocoding API.
    """
    if not query or len(query.strip()) < 2:
        return []

    clean_query = query.strip()
    params = {
        "name": clean_query,
        "count": count,
        "language": "en",
        "format": "json"
    }

    async with httpx.AsyncClient(timeout=8.0) as client:
        try:
            response = await client.get(settings.OPEN_METEO_GEOCODING_URL, params=params)
            response.raise_for_status()
            data = response.json()
            
            results: List[LocationSuggestion] = []
            if "results" in data and isinstance(data["results"], list):
                for item in data["results"]:
                    parts = [item.get("name", "")]
                    if item.get("admin2"):
                        parts.append(item["admin2"])
                    if item.get("admin1"):
                        parts.append(item["admin1"])
                    if item.get("country"):
                        parts.append(item["country"])
                    
                    display_name = ", ".join([p for p in parts if p])
                    
                    results.append(LocationSuggestion(
                        id=item.get("id"),
                        name=item.get("name", clean_query),
                        latitude=item.get("latitude"),
                        longitude=item.get("longitude"),
                        elevation=item.get("elevation"),
                        feature_code=item.get("feature_code"),
                        country_code=item.get("country_code"),
                        country=item.get("country"),
                        admin1=item.get("admin1"),
                        admin2=item.get("admin2"),
                        display_name=display_name,
                        timezone=item.get("timezone", "America/New_York")
                    ))
            return results
        except Exception as e:
            # Fallback for offline or network issues: return query as custom coordinates if lat/lon in query
            return []
