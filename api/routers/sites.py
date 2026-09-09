"""
Industrial Sites Router
Serves OpenStreetMap industrial polygons (refineries, power plants, chemical zones) for map overlay.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query

from api.auth import get_current_user, User
from api.database import db

router = APIRouter(prefix="/sites", tags=["Industrial Sites"])


@router.get("")
def get_industrial_sites(
    region: Optional[str] = Query(None, description="Geographic region filter (e.g., gujarat)"),
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """
    Returns industrial site polygon boundaries and metadata for GIS map rendering.
    """
    sites = db.get_sites(region=region)
    return sites


@router.get("/geojson")
def get_industrial_sites_geojson(
    region: Optional[str] = Query(None, description="Geographic region filter"),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Returns industrial sites formatted as a standard GeoJSON FeatureCollection.
    """
    sites = db.get_sites(region=region)
    features = []

    for s in sites:
        coords = s.get("coordinates", [])
        if coords:
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [coords],
                },
                "properties": {
                    "id": s.get("id"),
                    "osm_id": s.get("osm_id"),
                    "name": s.get("name"),
                    "site_type": s.get("site_type"),
                    "region": s.get("region"),
                    "state": s.get("state"),
                },
            })

    return {
        "type": "FeatureCollection",
        "features": features,
    }
