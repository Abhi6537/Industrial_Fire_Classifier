"""
Alerts & Operational Triage Router
Manages emergency notifications, analyst acknowledgments, and incident threads.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query

from api.models.alert import AlertResponse, AlertCommentCreate, AlertCommentResponse
from api.auth import get_current_user, User
from api.database import db

router = APIRouter(prefix="/alerts", tags=["Alerts & Triage"])


@router.get("", response_model=List[AlertResponse])
def list_alerts(
    status: Optional[str] = Query(None, description="Filter by status: 'unread', 'acknowledged', etc."),
    current_user: User = Depends(get_current_user),
):
    """
    Returns the real-time operational alert queue.
    """
    alerts = db.get_alerts(status=status)
    return alerts


@router.patch("/{alert_id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert(
    alert_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Acknowledges an active alert and records the action into the audit trail.
    """
    updated_alert = db.acknowledge_alert(alert_id=alert_id, analyst_id=current_user.id)
    if not updated_alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert '{alert_id}' not found.",
        )
    return updated_alert


@router.post("/{alert_id}/comments", response_model=AlertCommentResponse)
def add_alert_comment(
    alert_id: str,
    payload: AlertCommentCreate,
    current_user: User = Depends(get_current_user),
):
    """
    Appends a new note or intelligence update to an alert discussion thread.
    """
    comment = db.add_alert_comment(
        alert_id=alert_id,
        analyst_id=current_user.email,
        comment=payload.comment,
    )
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert '{alert_id}' not found.",
        )
    return comment
