"""
Authentication & Role-Based Access Control (RBAC) Module
Validates JWT tokens and enforces permissions (analyst, supervisor, auditor).
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from api.config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("api_auth")

security = HTTPBearer(auto_error=False)


class User(BaseModel):
    id: str
    email: str
    role: str = "analyst"  # 'analyst', 'supervisor', 'auditor'


def decode_jwt_token(token: str) -> Dict[str, Any]:
    """
    Decodes and validates a JWT token.
    Supports Supabase JWT signatures and local development simulation tokens.
    """
    # 1. Dev / Benchmark Tokens for testing
    if token == "dev-analyst-token" or settings.ENVIRONMENT == "development" and token.startswith("dev-"):
        role = token.split("-")[1] if len(token.split("-")) > 1 else "analyst"
        return {
            "sub": "00000000-0000-0000-0000-000000000001",
            "email": f"{role}@ntro.gov.in",
            "role": role if role in ("analyst", "supervisor", "auditor") else "analyst",
        }

    # 2. Production Supabase JWT Validation
    secret = settings.SUPABASE_JWT_SECRET or settings.SECRET_KEY
    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired.",
        )
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid JWT token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token credentials.",
        )


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> User:
    """
    FastAPI dependency to extract and authenticate the current user.
    """
    if not credentials:
        # In local development without auth headers, provide default analyst user
        if settings.ENVIRONMENT == "development":
            return User(
                id="00000000-0000-0000-0000-000000000001",
                email="analyst.local@ntro.gov.in",
                role="analyst",
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing.",
        )

    payload = decode_jwt_token(credentials.credentials)
    user_id = payload.get("sub", str(payload.get("id", "anonymous")))
    email = payload.get("email", "operator@ntro.gov.in")
    # In Supabase, role may be in user_metadata or app_metadata
    user_meta = payload.get("user_metadata", {})
    app_meta = payload.get("app_metadata", {})
    role = user_meta.get("role") or app_meta.get("role") or payload.get("role", "analyst")

    return User(id=user_id, email=email, role=role)


def require_role(allowed_roles: List[str]):
    """
    Role-based authorization guard factory.
    Example: Depends(require_role(["supervisor", "auditor"]))
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Requires one of {allowed_roles} roles. User has '{current_user.role}'.",
            )
        return current_user

    return role_checker
