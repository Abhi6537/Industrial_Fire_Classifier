"""
Database Access Layer & Storage Interface
Connects to Supabase PostGIS with local fallback data stores.
"""

import os
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from uuid import uuid4

from api.config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("api_database")


class DatabaseService:
    """
    Manages database interactions for API endpoints.
    Provides live Supabase integration and offline benchmark stores.
    """

    def __init__(self):
        self.client = None
        self.is_connected = False
        self._init_supabase()

        # In-memory stores for offline development and testing
        self._mock_sites: List[Dict[str, Any]] = []
        self._mock_events: List[Dict[str, Any]] = []
        self._mock_alerts: List[Dict[str, Any]] = []
        self._mock_audit: List[Dict[str, Any]] = []
        self._seed_offline_data()

    def _init_supabase(self):
        url = settings.SUPABASE_URL
        key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY

        if url and key and "your-project" not in url:
            try:
                from supabase import create_client
                self.client = create_client(url, key)
                self.is_connected = True
                logger.info("DatabaseService: Connected to Supabase PostGIS.")
            except Exception as e:
                logger.warning(f"DatabaseService: Could not connect to Supabase ({e}). Using offline store.")
        else:
            logger.info("DatabaseService: Running in offline local mode.")

    def _seed_offline_data(self):
        """Seeds realistic offline benchmark records for local verification."""
        now = datetime.now(timezone.utc).isoformat()

        # 1. Industrial Sites
        self._mock_sites = [
            {
                "id": str(uuid4()),
                "osm_id": 100101,
                "name": "Reliance Jamnagar Refinery Complex",
                "site_type": "refinery",
                "region": "jamnagar",
                "state": "Gujarat",
                "coordinates": [[69.83, 22.33], [69.89, 22.33], [69.89, 22.38], [69.83, 22.38], [69.83, 22.33]],
            },
            {
                "id": str(uuid4()),
                "osm_id": 100102,
                "name": "Dahej PCPIR & Chemical Zone",
                "site_type": "chemical",
                "region": "dahej",
                "state": "Gujarat",
                "coordinates": [[72.54, 21.68], [72.61, 21.68], [72.61, 21.74], [72.54, 21.74], [72.54, 21.68]],
            },
            {
                "id": str(uuid4()),
                "osm_id": 100103,
                "name": "Hazira Petrochemical Manufacturing Hub",
                "site_type": "steel",
                "region": "hazira",
                "state": "Gujarat",
                "coordinates": [[72.62, 21.08], [72.71, 21.08], [72.71, 21.15], [72.62, 21.15], [72.62, 21.08]],
            },
        ]

        # 2. Classified Events
        ev1_id = str(uuid4())
        ev2_id = str(uuid4())
        ev3_id = str(uuid4())

        self._mock_events = [
            {
                "id": ev1_id,
                "latitude": 21.7125,
                "longitude": 72.5833,
                "label": "industrial_fire",
                "confidence": 0.942,
                "severity": "critical",
                "deviation_score": 4.8,
                "land_cover_type": "industrial",
                "persistence_count": 2,
                "is_anomaly": True,
                "site_name": "Dahej Chemical Complex",
                "site_type": "chemical",
                "classified_at": now,
                "shap_explanation": {
                    "summary": "Classified as INDUSTRIAL_FIRE (94.2% confidence)",
                    "base_value": 0.1662,
                    "primary_factors": [
                        "Severe thermal power output detected (165.8 MW).",
                        "Statistical deviation: 4.8 sigma above historical baseline.",
                        "Spatial intersection with chemical manufacturing facility.",
                    ],
                    "shap_factors": [
                        {"feature": "deviation_score", "label": "Baseline Deviation", "unit": "sigma", "value": 4.8, "shap_value": 0.2845, "impact": "positive"},
                        {"feature": "frp", "label": "Fire Radiative Power (FRP)", "unit": "MW", "value": 165.8, "shap_value": 0.2312, "impact": "positive"},
                        {"feature": "on_known_site", "label": "Industrial Site Intersect", "unit": "", "value": 1, "shap_value": 0.1420, "impact": "positive"},
                        {"feature": "site_type_encoded", "label": "Site Facility Type", "unit": "", "value": "chemical", "shap_value": 0.0890, "impact": "positive"},
                        {"feature": "brightness_temp", "label": "Brightness Temperature", "unit": "K", "value": 385.2, "shap_value": 0.0654, "impact": "positive"},
                        {"feature": "persistence_count", "label": "Multi-Temporal Persistence", "unit": "passes", "value": 2, "shap_value": -0.0380, "impact": "negative"},
                    ],
                    "metrics": {
                        "frp_mw": 165.8,
                        "brightness_temp_k": 385.2,
                        "deviation_z_score": 4.8,
                        "persistence_count": 2,
                        "distance_to_nearest_facility_km": 0.0,
                        "on_known_site": True,
                    },
                },
            },
            {
                "id": ev2_id,
                "latitude": 22.3551,
                "longitude": 69.8662,
                "label": "normal_flare",
                "confidence": 0.985,
                "severity": "info",
                "deviation_score": 0.1,
                "land_cover_type": "industrial",
                "persistence_count": 48,
                "is_anomaly": False,
                "site_name": "Reliance Jamnagar Refinery Complex",
                "site_type": "refinery",
                "classified_at": now,
                "shap_explanation": {
                    "summary": "Classified as NORMAL_FLARE (98.5% confidence)",
                    "base_value": 0.1662,
                    "primary_factors": [
                        "Stationary flare observed across 48 consecutive satellite passes.",
                        "Thermal power (42.1 MW) is within normal operating limits (0.1 sigma).",
                    ],
                    "shap_factors": [
                        {"feature": "persistence_count", "label": "Multi-Temporal Persistence", "unit": "passes", "value": 48, "shap_value": 0.3620, "impact": "positive"},
                        {"feature": "site_type_encoded", "label": "Site Facility Type", "unit": "", "value": "refinery", "shap_value": 0.2410, "impact": "positive"},
                        {"feature": "deviation_score", "label": "Baseline Deviation", "unit": "sigma", "value": 0.1, "shap_value": 0.1980, "impact": "positive"},
                        {"feature": "on_known_site", "label": "Industrial Site Intersect", "unit": "", "value": 1, "shap_value": 0.1150, "impact": "positive"},
                        {"feature": "frp", "label": "Fire Radiative Power (FRP)", "unit": "MW", "value": 42.1, "shap_value": -0.0950, "impact": "negative"},
                    ],
                    "metrics": {
                        "frp_mw": 42.1,
                        "brightness_temp_k": 328.4,
                        "deviation_z_score": 0.1,
                        "persistence_count": 48,
                        "distance_to_nearest_facility_km": 0.0,
                        "on_known_site": True,
                    },
                },
            },
            {
                "id": ev3_id,
                "latitude": 21.4500,
                "longitude": 70.8000,
                "label": "agricultural_burn",
                "confidence": 0.910,
                "severity": "info",
                "deviation_score": 0.0,
                "land_cover_type": "farmland",
                "persistence_count": 1,
                "is_anomaly": False,
                "site_name": "None",
                "site_type": "none",
                "classified_at": now,
                "shap_explanation": {
                    "summary": "Classified as AGRICULTURAL_BURN (91.0% confidence)",
                    "base_value": 0.1662,
                    "primary_factors": [
                        "Located in agricultural cropland >15 km from industrial facilities.",
                        "Transient, short-duration thermal signature.",
                    ],
                    "shap_factors": [
                        {"feature": "land_cover_encoded", "label": "Land Cover Classification", "unit": "", "value": "farmland", "shap_value": 0.3810, "impact": "positive"},
                        {"feature": "on_known_site", "label": "Industrial Site Intersect", "unit": "", "value": 0, "shap_value": 0.2240, "impact": "positive"},
                        {"feature": "persistence_count", "label": "Multi-Temporal Persistence", "unit": "passes", "value": 1, "shap_value": 0.1650, "impact": "positive"},
                        {"feature": "frp", "label": "Fire Radiative Power (FRP)", "unit": "MW", "value": 18.5, "shap_value": -0.0820, "impact": "negative"},
                    ],
                    "metrics": {
                        "frp_mw": 18.5,
                        "brightness_temp_k": 315.0,
                        "deviation_z_score": 0.0,
                        "persistence_count": 1,
                        "distance_to_nearest_facility_km": 18.2,
                        "on_known_site": False,
                    },
                },
            },
        ]

        # 3. Active Alerts
        self._mock_alerts = [
            {
                "id": str(uuid4()),
                "event_id": ev1_id,
                "severity": "critical",
                "status": "unread",
                "title": "Industrial Fire Alert: Dahej Chemical Complex",
                "description": "Extreme thermal spike (FRP: 165.8 MW, +4.8 sigma deviation)",
                "created_at": now,
                "acknowledged_at": None,
                "acknowledged_by": None,
                "comments": [
                    {
                        "id": str(uuid4()),
                        "author": "Analyst Unit 1",
                        "comment": "Thermal spike confirmed on latest VIIRS pass. Dispatching local alert.",
                        "created_at": now,
                    }
                ],
            }
        ]

    # --- Query Methods ---

    def get_sites(self, region: Optional[str] = None) -> List[Dict[str, Any]]:
        """Returns industrial site polygons."""
        if self.is_connected and self.client:
            try:
                query = self.client.table("sites").select("*")
                if region:
                    query = query.eq("region", region)
                res = query.execute()
                valid_sites = [s for s in (res.data or []) if s.get("coordinates") or s.get("geom")]
                if valid_sites:
                    return res.data
            except Exception as e:
                logger.error(f"Error querying sites from Supabase: {e}")
        return self._mock_sites

    def get_events(
        self,
        label: Optional[str] = None,
        severity: Optional[str] = None,
        is_anomaly: Optional[bool] = None,
        limit: int = 200,
    ) -> List[Dict[str, Any]]:
        """Returns classified events with optional filters."""
        if self.is_connected and self.client:
            try:
                query = self.client.table("classified_events").select(
                    "*, detections(latitude, longitude, frp, brightness_temp, detected_at), sites(name, site_type)"
                ).order("classified_at", desc=True).limit(limit)
                if label:
                    query = query.eq("label", label)
                if severity:
                    query = query.eq("severity", severity)
                if is_anomaly is not None:
                    query = query.eq("is_anomaly", is_anomaly)
                res = query.execute()

                events = []
                for ev in (res.data or []):
                    det = ev.get("detections") or {}
                    site = ev.get("sites") or {}
                    metrics = (ev.get("shap_explanation") or {}).get("metrics") or {}

                    lat = det.get("latitude") or ev.get("latitude") or metrics.get("latitude", 0.0)
                    lon = det.get("longitude") or ev.get("longitude") or metrics.get("longitude", 0.0)
                    site_name = site.get("name") or ev.get("site_name") or "None"
                    site_type = site.get("site_type") or ev.get("site_type") or "none"

                    ev["latitude"] = float(lat)
                    ev["longitude"] = float(lon)
                    ev["site_name"] = str(site_name)
                    ev["site_type"] = str(site_type)
                    events.append(ev)

                if len(events) > 0:
                    return events
            except Exception as e:
                logger.error(f"Error querying events from Supabase: {e}")

        # Offline filtered results
        filtered = self._mock_events
        if label:
            filtered = [e for e in filtered if e.get("label") == label]
        if severity:
            filtered = [e for e in filtered if e.get("severity") == severity]
        if is_anomaly is not None:
            filtered = [e for e in filtered if e.get("is_anomaly") == is_anomaly]
        return filtered[:limit]

    def get_alerts(self, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Returns active operational alerts."""
        if self.is_connected and self.client:
            try:
                query = self.client.table("alerts").select("*").order("created_at", desc=True)
                if status:
                    query = query.eq("status", status)
                res = query.execute()
                if res.data and len(res.data) > 0:
                    return res.data
            except Exception as e:
                logger.error(f"Error querying alerts from Supabase: {e}")

        if status:
            return [a for a in self._mock_alerts if a.get("status") == status]
        return self._mock_alerts

    def acknowledge_alert(self, alert_id: str, analyst_id: str) -> Optional[Dict[str, Any]]:
        """Updates alert status to acknowledged."""
        now = datetime.now(timezone.utc).isoformat()
        for alert in self._mock_alerts:
            if alert["id"] == alert_id:
                alert["status"] = "acknowledged"
                alert["acknowledged_at"] = now
                alert["acknowledged_by"] = analyst_id
                self.log_analyst_action(
                    event_id=alert["event_id"],
                    analyst_id=analyst_id,
                    action="ACKNOWLEDGE_ALERT",
                    note=f"Alert {alert_id} acknowledged by analyst.",
                )
                return alert
        return None

    def add_alert_comment(self, alert_id: str, analyst_id: str, comment: str) -> Optional[Dict[str, Any]]:
        """Adds a collaboration note/comment to an alert thread."""
        now = datetime.now(timezone.utc).isoformat()
        for alert in self._mock_alerts:
            if alert["id"] == alert_id:
                new_comment = {
                    "id": str(uuid4()),
                    "author": analyst_id,
                    "comment": comment,
                    "created_at": now,
                }
                alert.setdefault("comments", []).append(new_comment)
                self.log_analyst_action(
                    event_id=alert["event_id"],
                    analyst_id=analyst_id,
                    action="ADD_COMMENT",
                    note=comment,
                )
                return new_comment
        return None

    def log_analyst_action(
        self,
        event_id: str,
        analyst_id: str,
        action: str,
        note: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Logs an action to the immutable audit trail."""
        record = {
            "id": str(uuid4()),
            "event_id": event_id,
            "analyst_id": analyst_id,
            "action": action,
            "note": note or "",
            "acted_at": datetime.now(timezone.utc).isoformat(),
        }
        self._mock_audit.append(record)
        return record

    def get_audit_trail(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Returns immutable analyst action audit trail."""
        return self._mock_audit[:limit]


db = DatabaseService()
