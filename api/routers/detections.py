"""
Raw Satellite Detections Router
Provides access to raw NASA FIRMS VIIRS hotspot observations.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query

from api.models.detection import DetectionResponse
from api.auth import get_current_user, User
from api.database import db

router = APIRouter(prefix="/detections", tags=["Raw Detections"])


@router.get("", response_model=List[dict])
def list_raw_detections(
    limit: int = Query(50, ge=1, le=500),
    current_user: User = Depends(get_current_user),
):
    """Returns ingested satellite detections."""
    return db.get_events(limit=limit)
