"""
Imagery API Router
Copernicus Sentinel-2 Optical & SWIR Satellite Imagery Endpoints
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Path, Query

from ingestion.sentinel_imagery import SentinelImageryService
from api.database import db

router = APIRouter(prefix="/imagery", tags=["Satellite Imagery"])


@router.get("/layers", response_model=List[Dict[str, Any]])
def get_satellite_layers():
    """
    Returns available raster satellite imagery overlays (Sentinel-2 True Color, Sentinel-2 SWIR Fire, NASA GIBS).
    Enables operators to toggle 10m optical and smoke-piercing SWIR imagery on the tactical GIS map.
    """
    return SentinelImageryService.get_wms_layer_definitions()


@router.get("/event/{event_id}", response_model=Dict[str, Any])
def get_event_satellite_imagery(
    event_id: str = Path(..., description="Unique event identifier"),
):
    """
    Returns high-resolution Copernicus Sentinel-2 L2A optical and SWIR satellite imagery metadata,
    pre-incident vs post-incident comparison chips, and Short-Wave Infrared smoke penetration analysis.
    """
    ev = db.get_event_by_id(event_id)
    if not ev:
        raise HTTPException(status_code=404, detail=f"Event with ID '{event_id}' not found.")

    lat = float(ev.get("latitude", 0.0))
    lon = float(ev.get("longitude", 0.0))
    label = str(ev.get("label", "industrial_fire"))

    comparison = SentinelImageryService.get_incident_comparison(
        event_id=event_id,
        lat=lat,
        lon=lon,
        label=label,
    )
    return comparison


@router.get("/tile-info", response_model=Dict[str, Any])
def get_tile_info(
    latitude: float = Query(..., ge=-90.0, le=90.0, description="Geodetic latitude"),
    longitude: float = Query(..., ge=-180.0, le=180.0, description="Geodetic longitude"),
):
    """
    Determines Sentinel-2 MGRS grid tile ID and available spectral layers for arbitrary coordinates.
    """
    mgrs_tile = SentinelImageryService.resolve_mgrs_tile(latitude, longitude)
    return {
        "latitude": latitude,
        "longitude": longitude,
        "sentinel_mgrs_tile": mgrs_tile,
        "utm_grid": f"UTM Zone {mgrs_tile[:2]}",
        "supported_sensors": ["Sentinel-2A MSI", "Sentinel-2B MSI"],
        "layers": SentinelImageryService.get_wms_layer_definitions(),
    }
