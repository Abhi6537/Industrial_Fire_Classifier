"""
Classified Events Router
Provides endpoints to fetch and filter classified satellite fire events.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query

from api.models.event import ClassifiedEventResponse
from api.auth import get_current_user, User
from api.database import db

router = APIRouter(prefix="/events", tags=["Classified Events"])


@router.get("", response_model=List[ClassifiedEventResponse])
def list_classified_events(
    label: Optional[str] = Query(None, description="Filter by class: industrial_fire, normal_flare, etc."),
    severity: Optional[str] = Query(None, description="Filter by severity: critical, warning, info"),
    is_anomaly: Optional[bool] = Query(None, description="Filter solely anomalous events"),
    limit: int = Query(200, ge=1, le=1000, description="Max events to return"),
    current_user: User = Depends(get_current_user),
):
    """
    Returns classified satellite thermal anomaly events.
    Supports multi-attribute geospatial and threat level filtering.
    """
    events = db.get_events(
        label=label,
        severity=severity,
        is_anomaly=is_anomaly,
        limit=limit,
    )
    return events


@router.get("/{event_id}", response_model=ClassifiedEventResponse)
def get_classified_event_by_id(
    event_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Returns full telemetry and explainability payload for a single classified anomaly event.
    """
    event = db.get_event_by_id(event_id=event_id)
    if not event:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Anomaly event '{event_id}' not found.")
    return event
