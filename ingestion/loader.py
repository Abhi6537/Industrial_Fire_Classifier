"""
Database Loader Service
Persists enriched detections, industrial polygons, and site history to Supabase PostGIS.
Handles graceful offline fallback and status telemetry when database credentials are not configured.
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional

import pandas as pd
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("db_loader")


class DatabaseLoader:
    """
    Handles batch ingestion of satellite records and spatial sites into Supabase.
    """

    def __init__(
        self,
        supabase_url: Optional[str] = None,
        supabase_key: Optional[str] = None,
    ):
        self.supabase_url = supabase_url or os.getenv("SUPABASE_URL")
        self.supabase_key = supabase_key or os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
        self.client = None

        if self.is_configured():
            try:
                from supabase import create_client
                self.client = create_client(self.supabase_url, self.supabase_key)
                logger.info("Supabase client initialized successfully.")
            except Exception as e:
                logger.warning(f"Failed to initialize Supabase client: {e}. Falling back to offline mode.")
        else:
            logger.info("Supabase credentials unconfigured or set to placeholder. Operating in offline logging mode.")

    def is_configured(self) -> bool:
        """Verifies whether real Supabase configuration parameters exist."""
        if not self.supabase_url or "your-project" in self.supabase_url:
            return False
        if not self.supabase_key or "your-" in self.supabase_key:
            return False
        return True

    def load_sites(self, sites_gdf: pd.DataFrame) -> int:
        """
        Inserts industrial facility polygons into the 'sites' table.
        """
        if sites_gdf.empty:
            return 0

        records = []
        for _, row in sites_gdf.iterrows():
            coords = row.get("coordinates", [])
            if coords and len(coords) >= 3:
                coord_str = ", ".join(f"{pt[0]} {pt[1]}" for pt in coords)
                geom_wkt = f"POLYGON(({coord_str}))"
            elif hasattr(row, "geometry") and hasattr(row.geometry, "wkt"):
                geom_wkt = row.geometry.wkt
            else:
                geom_wkt = None
            records.append({
                "osm_id": int(row["osm_id"]),
                "name": str(row["name"]),
                "site_type": str(row["site_type"]),
                "region": str(row.get("region", "gujarat")),
                "state": str(row.get("state", "Gujarat")),
                # PostGIS geometry column can accept WKT in ST_GeomFromText
            })

        if not self.is_configured() or not self.client:
            logger.info(f"[Offline Mode] Stored {len(records)} industrial sites in memory/log.")
            return len(records)

        try:
            res = self.client.table("sites").upsert(records, on_conflict="osm_id").execute()
            logger.info(f"Upserted {len(records)} sites to Supabase.")
            return len(records)
        except Exception as e:
            logger.error(f"Error loading sites to Supabase: {e}")
            return 0

    def load_detections(self, detections_df: pd.DataFrame) -> int:
        """
        Inserts raw and enriched FIRMS hotspot detections into the 'detections' table.
        """
        if detections_df.empty:
            return 0

        records = []
        for _, row in detections_df.iterrows():
            rec = {
                "latitude": float(row["latitude"]),
                "longitude": float(row["longitude"]),
                "brightness_temp": float(row["brightness_temp"]) if pd.notnull(row.get("brightness_temp")) else None,
                "frp": float(row["frp"]) if pd.notnull(row.get("frp")) else 0.0,
                "confidence": str(row.get("confidence", "nominal")),
                "satellite": str(row.get("satellite", "N")),
                "instrument": str(row.get("instrument", "VIIRS")),
                "detected_at": row["detected_at"].isoformat() if hasattr(row["detected_at"], "isoformat") else str(row["detected_at"]),
            }
            records.append(rec)

        if not self.is_configured() or not self.client:
            logger.info(f"[Offline Mode] Stored {len(records)} detections in memory/log.")
            return len(records)

        try:
            # Supabase upsert on (latitude, longitude, detected_at)
            res = self.client.table("detections").upsert(
                records,
                on_conflict="latitude,longitude,detected_at"
            ).execute()
            if res.data and len(res.data) == len(detections_df):
                detections_df["detection_id"] = [d.get("id") for d in res.data]
            logger.info(f"Loaded {len(records)} detections into Supabase.")
            return len(records)
        except Exception as e:
            logger.error(f"Error loading detections into Supabase: {e}")
            return 0

    def load_classified_events(self, classified_df: pd.DataFrame) -> int:
        """
        Inserts model-classified events into the 'classified_events' table.
        """
        if classified_df.empty:
            return 0

        records = []
        for _, row in classified_df.iterrows():
            explanation = row.get("shap_explanation", {})
            if isinstance(explanation, dict):
                metrics = explanation.setdefault("metrics", {})
                metrics["latitude"] = float(row.get("latitude", 0.0))
                metrics["longitude"] = float(row.get("longitude", 0.0))

            rec = {
                "detection_id": row.get("detection_id"),
                "label": str(row["label"]),
                "confidence": float(row.get("confidence", 0.0)),
                "severity": str(row.get("severity", "info")),
                "deviation_score": float(row.get("deviation_score", 0.0)),
                "land_cover_type": str(row.get("land_cover_type", "other")),
                "persistence_count": int(row.get("persistence_count", 1)),
                "is_anomaly": bool(row.get("is_anomaly", False)),
                "shap_explanation": explanation,
            }
            records.append(rec)

        if not self.is_configured() or not self.client:
            logger.info(f"[Offline Mode] Stored {len(records)} classified events in memory/log.")
            return len(records)

        try:
            res = self.client.table("classified_events").insert(records).execute()
            logger.info(f"Loaded {len(records)} classified events into Supabase.")
            return len(records)
        except Exception as e:
            logger.error(f"Error loading classified events to Supabase: {e}")
            return 0


if __name__ == "__main__":
    loader = DatabaseLoader()
    print("Database loader configured status:", loader.is_configured())
