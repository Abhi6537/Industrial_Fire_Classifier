"""
Pydantic Schemas for Raw Satellite Detections
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class DetectionBase(BaseModel):
    latitude: float = Field(..., description="Latitude coordinate in WGS84")
    longitude: float = Field(..., description="Longitude coordinate in WGS84")
    brightness_temp: Optional[float] = Field(None, description="Brightness temperature in Kelvin")
    frp: Optional[float] = Field(None, description="Fire Radiative Power in MW")
    confidence: Optional[str] = Field("nominal", description="FIRMS confidence (low, nominal, high)")
    satellite: Optional[str] = Field("N", description="Satellite designation")
    instrument: Optional[str] = Field("VIIRS", description="Sensor instrument")
    detected_at: datetime = Field(..., description="Timestamp of satellite overpass")


class DetectionResponse(DetectionBase):
    id: str
    ingested_at: Optional[datetime] = None

    class Config:
        from_attributes = True
