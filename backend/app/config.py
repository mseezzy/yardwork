from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "YardWork Lawn Mowing Planner API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # CORS Origins (Allow local dev and Vercel/Netlify hosting)
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://*.vercel.app",
        "https://*.netlify.app",
        "*"
    ]
    
    # External Free APIs
    OPEN_METEO_GEOCODING_URL: str = "https://geocoding-api.open-meteo.com/v1/search"
    OPEN_METEO_FORECAST_URL: str = "https://api.open-meteo.com/v1/forecast"
    
    # Cache settings
    CACHE_TTL_SECONDS: int = 1800  # 30 minutes

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
