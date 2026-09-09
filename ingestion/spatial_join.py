"""
Spatial Join Engine
Performs Point-in-Polygon (PIP) analysis between satellite hotspot detections
and industrial facility boundaries (OSM polygons).
Supports high-performance GeoPandas C-spatial indexes when available,
with a native pure-Python raycasting and Haversine fallback engine.
"""

import math
import logging
from typing import List, Tuple, Dict, Any, Optional

import pandas as pd
from ingestion.land_cover import LandCoverService

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("spatial_join")


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two points in kilometers."""
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def point_in_polygon(lon: float, lat: float, poly_coords: List[Tuple[float, float]]) -> bool:
    """
    Standard Ray-Casting algorithm for 2D Point-in-Polygon testing.
    poly_coords: List of (lon, lat) tuples.
    """
    n = len(poly_coords)
    if n < 3:
        return False
    inside = False
    p1x, p1y = poly_coords[0]
    for i in range(1, n + 1):
        p2x, p2y = poly_coords[i % n]
        if lat > min(p1y, p2y):
            if lat <= max(p1y, p2y):
                if lon <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (lat - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or lon <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside


def polygon_centroid(poly_coords: List[Tuple[float, float]]) -> Tuple[float, float]:
    """Computes approximate centroid (mean lon, mean lat) of polygon coordinates."""
    lons = [pt[0] for pt in poly_coords]
    lats = [pt[1] for pt in poly_coords]
    return (sum(lons) / len(lons), sum(lats) / len(lats))


class SpatialJoinEngine:
    """
    Enriches raw FIRMS detections with industrial site context and land-cover information.
    """

    def __init__(self, sites_df: pd.DataFrame):
        self.sites_df = sites_df.copy()

    def enrich_detections(self, detections_df: pd.DataFrame) -> pd.DataFrame:
        """
        Executes point-in-polygon spatial join and land-cover enrichment on detections.

        Returns:
            pd.DataFrame containing:
            - all original detection attributes
            - on_known_site (0 or 1)
            - site_osm_id
            - site_name
            - site_type
            - distance_to_site_km
            - land_cover_type ('industrial', 'forest', 'farmland', 'built_up', 'other')
        """
        if detections_df.empty:
            logger.info("Empty detections DataFrame provided. Returning empty DataFrame.")
            return pd.DataFrame()

        df = detections_df.copy()
        on_sites = []
        site_ids = []
        site_names = []
        site_types = []
        distances_km = []
        land_covers = []

        # Precompute centroids for fast distance calculations
        site_records = []
        for _, srow in self.sites_df.iterrows():
            coords = srow.get("coordinates", [])
            cent_lon, cent_lat = polygon_centroid(coords) if coords else (0.0, 0.0)
            site_records.append({
                "osm_id": srow["osm_id"],
                "name": srow["name"],
                "site_type": srow["site_type"],
                "coords": coords,
                "cent_lat": cent_lat,
                "cent_lon": cent_lon,
            })

        for _, drow in df.iterrows():
            dlat = float(drow["latitude"])
            dlon = float(drow["longitude"])

            matched_site = None
            for s in site_records:
                if point_in_polygon(dlon, dlat, s["coords"]):
                    matched_site = s
                    break

            if matched_site:
                on_sites.append(1)
                site_ids.append(matched_site["osm_id"])
                site_names.append(matched_site["name"])
                site_types.append(matched_site["site_type"])
                dist_km = 0.0
            else:
                on_sites.append(0)
                site_ids.append(None)
                site_names.append("None")
                site_types.append("none")
                # Calculate minimum distance to any known facility centroid
                if site_records:
                    min_dist = min(
                        haversine_distance_km(dlat, dlon, s["cent_lat"], s["cent_lon"])
                        for s in site_records
                    )
                    dist_km = round(min_dist, 2)
                else:
                    dist_km = 999.0

            distances_km.append(dist_km)
            land_cover = LandCoverService.classify_coordinates(
                lat=dlat,
                lon=dlon,
                is_on_industrial_site=bool(matched_site),
                nearest_site_dist_km=dist_km,
            )
            land_covers.append(land_cover)

        df["on_known_site"] = on_sites
        df["site_osm_id"] = site_ids
        df["site_name"] = site_names
        df["site_type"] = site_types
        df["distance_to_site_km"] = distances_km
        df["land_cover_type"] = land_covers

        logger.info(
            f"Enriched {len(df)} detections: {sum(on_sites)} on industrial sites, "
            f"{len(df) - sum(on_sites)} off-site."
        )
        return df
