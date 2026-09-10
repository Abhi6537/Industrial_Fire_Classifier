"""
API Configuration & Environment Settings
Centralizes environment variables, security credentials, and geospatial bounds.
"""

import os
from typing import List, Optional
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

    # CORS Origins & Security Settings
    _raw_cors_origins: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000",
    )
    CORS_ORIGIN_REGEX: Optional[str] = os.getenv("CORS_ORIGIN_REGEX", None)
    ALLOWED_HOSTS: List[str] = [
        h.strip() for h in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1,testserver").split(",") if h.strip()
    ]

    def get_cors_origins(self) -> List[str]:
        """
        Parses and validates CORS origins against NTRO zero-trust defense specifications.
        Supports comma-separated strings or JSON arrays from environment variables.
        Strictly rejects wildcard '*' when credentials are used or in production.
        """
        raw = self._raw_cors_origins
        origins = []
        if isinstance(raw, str):
            if raw.strip().startswith("[") and raw.strip().endswith("]"):
                import json
                try:
                    origins = json.loads(raw)
                except Exception:
                    origins = [item.strip() for item in raw.split(",") if item.strip()]
            else:
                origins = [item.strip() for item in raw.split(",") if item.strip()]
        elif isinstance(raw, (list, tuple)):
            origins = list(raw)

        # Normalize and strip trailing slashes
        clean_origins = []
        for origin in origins:
            origin_str = str(origin).strip().rstrip("/")
            if not origin_str:
                continue
            # Defense rule: Reject wildcard '*'
            if origin_str == "*":
                import logging
                logging.getLogger("api_config").warning(
                    "[SECURITY ALERT] Wildcard '*' CORS origin detected and stripped. "
                    "Defense zero-trust guidelines mandate explicit whitelisted domains."
                )
                continue
            if origin_str not in clean_origins:
                clean_origins.append(origin_str)

        # Fallback to local tactical console if list is empty
        if not clean_origins:
            clean_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

        return clean_origins

    @property
    def CORS_ORIGINS(self) -> List[str]:
        return self.get_cors_origins()

    # Target Geographic Region (All-India Coverage)
    TARGET_REGION: str = os.getenv("TARGET_REGION", "all_india")
    TARGET_BBOX: str = os.getenv("TARGET_BBOX", "68.0,6.5,97.5,37.5")

    # Machine Learning Artifacts
    MODEL_PATH: str = os.getenv("MODEL_PATH", "ml/models/model.pkl")
    ENCODER_PATH: str = os.getenv("ENCODER_PATH", "ml/models/encoder.pkl")

    # Observability
    SENTRY_DSN: str = os.getenv("SENTRY_DSN", "")


settings = Settings()
