"""
Pydantic Schemas for Alerts, Comments, and Audit Log
"""

from typing import Optional, List
from pydantic import BaseModel, Field


class AlertCommentCreate(BaseModel):
    comment: str = Field(..., min_length=1, max_length=2000, description="Comment text")


class AlertCommentResponse(BaseModel):
    id: str
    author: str
    comment: str
    created_at: str


class AlertResponse(BaseModel):
    id: str
    event_id: str
    severity: str
    status: str
    title: str
    description: str
    created_at: str
    acknowledged_at: Optional[str] = None
    acknowledged_by: Optional[str] = None
    comments: List[AlertCommentResponse] = []


class AuditLogResponse(BaseModel):
    id: str
    event_id: str
    analyst_id: str
    action: str
    note: Optional[str] = None
    acted_at: str
