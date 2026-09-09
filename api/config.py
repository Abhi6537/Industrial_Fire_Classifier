"""
API Configuration & Environment Settings
Centralizes environment variables, security credentials, and geospatial bounds.
"""

import os
from typing import List
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Application settings and configuration parameters."""

    PROJECT_NAME: str = "NTRO Industrial Fire Detection & Classification System"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    API_V1_STR: str = "/api/v1"

    # Security & Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "ntro-geospatial-production-key-change-in-prod-32chars")
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", os.getenv("SECRET_KEY", "default-jwt-secret-min-32-chars"))

    # CORS Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",  # Next.js local dev
        "http://localhost:8000",  # FastAPI swagger/docs
        "https://*.vercel.app",
        "https://*.onrender.com",
    ]

    # Target Geographic Region (All-India Coverage)
    TARGET_REGION: str = os.getenv("TARGET_REGION", "all_india")
    TARGET_BBOX: str = os.getenv("TARGET_BBOX", "68.0,6.5,97.5,37.5")

    # Machine Learning Artifacts
    MODEL_PATH: str = os.getenv("MODEL_PATH", "ml/models/model.pkl")
    ENCODER_PATH: str = os.getenv("ENCODER_PATH", "ml/models/encoder.pkl")

    # Observability
    SENTRY_DSN: str = os.getenv("SENTRY_DSN", "")


settings = Settings()
