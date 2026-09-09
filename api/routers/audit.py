"""
Analyst Actions Audit Log Router
Provides read access to the immutable audit log for compliance and supervisor reviews.
"""

from typing import List
from fastapi import APIRouter, Depends, Query

from api.models.alert import AuditLogResponse
from api.auth import get_current_user, require_role, User
from api.database import db

router = APIRouter(prefix="/audit", tags=["Audit Trail"])


@router.get("", response_model=List[AuditLogResponse])
def get_audit_log(
    limit: int = Query(100, ge=1, le=1000, description="Max audit entries to retrieve"),
    current_user: User = Depends(require_role(["auditor", "supervisor", "analyst"])),
):
    """
    Returns the immutable audit log recording all operator interactions,
    acknowledgments, escalations, and incident notes.
    """
    audit_records = db.get_audit_trail(limit=limit)
    return audit_records
