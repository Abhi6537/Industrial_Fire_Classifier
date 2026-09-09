"""
Pydantic Schemas for Classified Events and Inference Requests
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class ClassifiedEventResponse(BaseModel):
    id: str
    latitude: float = Field(0.0, description="Latitude in decimal degrees")
    longitude: float = Field(0.0, description="Longitude in decimal degrees")
    label: str = Field(..., description="One of: industrial_fire, normal_flare, agricultural_burn, wildfire, mining_activity, unregistered_anomaly")
    confidence: float = Field(..., description="Model confidence score between 0.0 and 1.0")
    severity: str = Field("info", description="'critical', 'warning', or 'info'")
    deviation_score: float = Field(0.0, description="Z-score deviation from site baseline")
    land_cover_type: str = Field("other", description="industrial, forest, farmland, built_up, other")
    persistence_count: int = Field(1, description="Historical observation count")
    is_anomaly: bool = Field(False, description="Flag indicating anomalous behavior")
    site_name: Optional[str] = "None"
    site_type: Optional[str] = "none"
    classified_at: Optional[str] = None
    shap_explanation: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class ClassifyRequest(BaseModel):
    """Payload for real-time ad-hoc classification endpoint."""
    latitude: float
    longitude: float
    brightness_temp: float = Field(340.0, description="Temperature in Kelvin")
    frp: float = Field(45.0, description="Fire Radiative Power in MW")
    confidence: str = Field("high", description="low, nominal, or high")
    site_name: Optional[str] = "Unmapped Location"
    site_type: Optional[str] = "none"
    land_cover_type: Optional[str] = "industrial"
    on_known_site: int = Field(0, description="1 if inside industrial polygon, else 0")
    persistence_count: int = Field(1, description="Number of prior detections")
    deviation_score: float = Field(0.0, description="Z-score deviation")
    distance_to_site_km: float = Field(0.0, description="Distance to closest facility")
