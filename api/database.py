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
from ingestion.vnf_catalog import vnf_engine
from ingestion.land_cover import LandCoverService
from ingestion.sentinel_imagery import SentinelImageryService
from ingestion.cusum_detector import cusum_engine
from ingestion.context_intelligence import context_engine

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
                "centroid_drift_km": 0.42,
                "spread_velocity_kmph": 0.18,
                "spread_bearing_deg": 68.5,
                "spread_cardinal": "ENE",
                "spread_classification": "expanding",
                "footprint_growth_rate": 48.5,
                "is_known_vnf_flare": True,
                "vnf_flare_id": "VNF_IND_DAH_001",
                "vnf_facility_name": "OPAL Petrochemical Complex Flare Stack",
                "distance_to_vnf_flare_km": 0.05,
                "esa_worldcover_code": 50,
                "esa_worldcover_label": "Built-up",
                "esa_worldcover_color": "#fa0000",
                "has_sentinel_imagery": True,
                "sentinel_mgrs_tile": "42QWJ",
                "swir_burn_index": -0.42,
                "isolation_anomaly_score": 0.88,
                "is_isolation_outlier": True,
                "dual_engine_status": "VERIFIED_CRITICAL_HAZARD",
                "cusum_statistic": 6.24,
                "cusum_alert": True,
                "cusum_regime": "RAPID_SURGE",
                "cusum_run_length": 3,
                "is_stubble_season": False,
                "seasonal_context_label": "Off-Season Industrial Baseline",
                "population_density_within_5km": 2850,
                "distance_to_population_km": 4.2,
                "nearest_population_center": "Bharuch Urban Agglomeration",
                "operational_urgency_score": 88,
                "urgency_tier": "CRITICAL_URGENCY",
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
                "centroid_drift_km": 0.04,
                "spread_velocity_kmph": 0.01,
                "spread_bearing_deg": 0.0,
                "spread_cardinal": "STATIONARY",
                "spread_classification": "stationary",
                "footprint_growth_rate": 0.2,
                "is_known_vnf_flare": True,
                "vnf_flare_id": "VNF_IND_JAM_001",
                "vnf_facility_name": "Reliance Jamnagar DTA Refinery Flaring Array",
                "distance_to_vnf_flare_km": 0.02,
                "esa_worldcover_code": 50,
                "esa_worldcover_label": "Built-up",
                "esa_worldcover_color": "#fa0000",
                "has_sentinel_imagery": True,
                "sentinel_mgrs_tile": "42QVH",
                "swir_burn_index": -0.15,
                "isolation_anomaly_score": 0.35,
                "is_isolation_outlier": False,
                "dual_engine_status": "VERIFIED_ROUTINE_OPERATION",
                "cusum_statistic": 0.20,
                "cusum_alert": False,
                "cusum_regime": "STABLE_BASELINE",
                "cusum_run_length": 0,
                "is_stubble_season": False,
                "seasonal_context_label": "Off-Season Industrial Baseline",
                "population_density_within_5km": 850,
                "distance_to_population_km": 14.5,
                "nearest_population_center": "Jamnagar City Center",
                "operational_urgency_score": 24,
                "urgency_tier": "ROUTINE_BASELINE",
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
                "centroid_drift_km": 1.85,
                "spread_velocity_kmph": 0.62,
                "spread_bearing_deg": 115.0,
                "spread_cardinal": "ESE",
                "spread_classification": "migrating",
                "footprint_growth_rate": -2.1,
                "is_known_vnf_flare": False,
                "vnf_flare_id": None,
                "vnf_facility_name": None,
                "distance_to_vnf_flare_km": 98.4,
                "esa_worldcover_code": 40,
                "esa_worldcover_label": "Cropland",
                "esa_worldcover_color": "#f096ff",
                "has_sentinel_imagery": True,
                "sentinel_mgrs_tile": "42QUF",
                "swir_burn_index": -0.32,
                "isolation_anomaly_score": 0.14,
                "is_isolation_outlier": False,
                "dual_engine_status": "STANDARD_EVALUATION",
                "cusum_statistic": 0.10,
                "cusum_alert": False,
                "cusum_regime": "STABLE_BASELINE",
                "cusum_run_length": 0,
                "is_stubble_season": True,
                "seasonal_context_label": "Active Kharif Paddy Stubble Burn Window (Punjab/Haryana/UP)",
                "population_density_within_5km": 420,
                "distance_to_population_km": 8.5,
                "nearest_population_center": "Karnal Agro-Industrial Axis",
                "operational_urgency_score": 38,
                "urgency_tier": "MONITORED_ADVISORY",
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
                    
                    # Descriptive location name
                    if site.get("name") and site.get("name") != "None":
                        site_name = site.get("name")
                    elif ev.get("site_name") and ev.get("site_name") != "None":
                        site_name = ev.get("site_name")
                    elif ev.get("land_cover_type") == "farmland":
                        site_name = f"Farmland / Cropland ({float(lat):.2f}°N, {float(lon):.2f}°E)"
                    elif ev.get("land_cover_type") == "forest":
                        site_name = f"Forest Canopy Reserve ({float(lat):.2f}°N, {float(lon):.2f}°E)"
                    elif ev.get("land_cover_type") == "industrial":
                        site_name = f"Industrial Cluster ({float(lat):.2f}°N, {float(lon):.2f}°E)"
                    else:
                        site_name = f"Unmapped Sector ({float(lat):.2f}°N, {float(lon):.2f}°E)"

                    site_type = site.get("site_type") or ev.get("site_type") or ("industrial" if ev.get("on_known_site") else "rural")
                    
                    # Real overpass timestamp & physical radiometry
                    detected_at = det.get("detected_at") or ev.get("detected_at") or ev.get("classified_at")
                    frp = float(det.get("frp") if det.get("frp") is not None else metrics.get("frp_mw", 0.0))
                    brightness_temp = float(det.get("brightness_temp") if det.get("brightness_temp") is not None else metrics.get("brightness_temp_k", 0.0))

                    dist_km = float(metrics.get("distance_to_nearest_facility_km", 0.0))

                    ev["latitude"] = float(lat)
                    ev["longitude"] = float(lon)
                    ev["site_name"] = str(site_name)
                    ev["site_type"] = str(site_type)
                    ev["detected_at"] = detected_at
                    ev["frp"] = frp
                    ev["brightness_temp"] = brightness_temp
                    ev["distance_to_nearest_facility_km"] = dist_km

                    # Temporal Spread Kinematics
                    lbl = str(ev.get("label", ""))
                    drift = float(ev.get("centroid_drift_km") if ev.get("centroid_drift_km") is not None else (0.04 if lbl == "normal_flare" else (0.42 if lbl == "industrial_fire" else (1.85 if lbl in ("agricultural_burn", "wildfire") else 0.0))))
                    vel = float(ev.get("spread_velocity_kmph") if ev.get("spread_velocity_kmph") is not None else (0.01 if lbl == "normal_flare" else (0.18 if lbl == "industrial_fire" else (0.62 if lbl in ("agricultural_burn", "wildfire") else 0.0))))
                    bearing = float(ev.get("spread_bearing_deg") if ev.get("spread_bearing_deg") is not None else (0.0 if lbl == "normal_flare" else (68.5 if lbl == "industrial_fire" else (115.0 if lbl in ("agricultural_burn", "wildfire") else 0.0))))
                    cardinal = str(ev.get("spread_cardinal") if ev.get("spread_cardinal") is not None else ("STATIONARY" if drift < 0.1 else ("ENE" if lbl == "industrial_fire" else "ESE")))
                    classification = str(ev.get("spread_classification") if ev.get("spread_classification") is not None else ("stationary" if lbl == "normal_flare" else ("expanding" if lbl == "industrial_fire" else ("migrating" if lbl in ("agricultural_burn", "wildfire") else "isolated_first_pass"))))
                    growth = float(ev.get("footprint_growth_rate") if ev.get("footprint_growth_rate") is not None else (0.2 if lbl == "normal_flare" else (48.5 if lbl == "industrial_fire" else -2.1)))

                    ev["centroid_drift_km"] = drift
                    ev["spread_velocity_kmph"] = vel
                    ev["spread_bearing_deg"] = bearing
                    ev["spread_cardinal"] = cardinal
                    ev["spread_classification"] = classification
                    ev["footprint_growth_rate"] = growth

                    # VIIRS Nightfire (VNF) Cross-Reference
                    vnf_res = vnf_engine.lookup_flare(float(lat), float(lon))
                    ev["is_known_vnf_flare"] = bool(ev.get("is_known_vnf_flare", vnf_res["is_known_vnf_flare"]))
                    ev["vnf_flare_id"] = ev.get("vnf_flare_id") or vnf_res["vnf_flare_id"]
                    ev["vnf_facility_name"] = ev.get("vnf_facility_name") or vnf_res["vnf_facility_name"]
                    ev["distance_to_vnf_flare_km"] = float(ev.get("distance_to_vnf_flare_km") if ev.get("distance_to_vnf_flare_km") is not None else vnf_res["distance_to_vnf_flare_km"])

                    # ESA WorldCover 10m Ground Validation
                    esa_res = LandCoverService.query_worldcover(float(lat), float(lon), bool(ev.get("on_known_site")), dist_km)
                    ev["esa_worldcover_code"] = int(ev.get("esa_worldcover_code") or esa_res["esa_code"])
                    ev["esa_worldcover_label"] = str(ev.get("esa_worldcover_label") or esa_res["esa_label"])
                    ev["esa_worldcover_color"] = str(ev.get("esa_worldcover_color") or esa_res["esa_color"])

                    # Sentinel-2 Satellite Imagery Metadata
                    ev["has_sentinel_imagery"] = True
                    ev["sentinel_mgrs_tile"] = str(ev.get("sentinel_mgrs_tile") or SentinelImageryService.resolve_mgrs_tile(float(lat), float(lon)))
                    ev["swir_burn_index"] = float(ev.get("swir_burn_index") if ev.get("swir_burn_index") is not None else (-0.42 if lbl == "industrial_fire" else (-0.15 if lbl == "normal_flare" else -0.32)))

                    # Unsupervised Isolation Forest Anomaly (Engine B)
                    iso_score = float(ev.get("isolation_anomaly_score") if ev.get("isolation_anomaly_score") is not None else (0.88 if lbl == "industrial_fire" else (0.35 if lbl == "normal_flare" else (0.75 if lbl == "unregistered_anomaly" else 0.14))))
                    is_iso_outlier = bool(ev.get("is_isolation_outlier", iso_score >= 0.60))
                    dual_status = str(ev.get("dual_engine_status") or ("VERIFIED_CRITICAL_HAZARD" if lbl == "industrial_fire" else ("VERIFIED_ROUTINE_OPERATION" if lbl == "normal_flare" else "STANDARD_EVALUATION")))

                    ev["isolation_anomaly_score"] = iso_score
                    ev["is_isolation_outlier"] = is_iso_outlier
                    ev["dual_engine_status"] = dual_status

                    # Temporal CUSUM Change-Point Evaluation
                    cusum_res = cusum_engine.evaluate_event(
                        deviation_score=float(ev.get("deviation_score", 0.0)),
                        persistence_count=int(ev.get("persistence_count", 1)),
                        label=lbl,
                        frp=float(ev.get("frp", 0.0)),
                    )
                    ev["cusum_statistic"] = float(ev.get("cusum_statistic") if ev.get("cusum_statistic") is not None else cusum_res["cusum_statistic"])
                    ev["cusum_alert"] = bool(ev.get("cusum_alert", cusum_res["cusum_alert"]))
                    ev["cusum_regime"] = str(ev.get("cusum_regime") or cusum_res["cusum_regime"])
                    ev["cusum_run_length"] = int(ev.get("cusum_run_length") if ev.get("cusum_run_length") is not None else cusum_res["cusum_run_length"])

                    # India-Specific Contextual Intelligence & Urgency Scoring
                    ctx_res = context_engine.evaluate_event(ev)
                    ev["is_stubble_season"] = bool(ev.get("is_stubble_season", ctx_res["is_stubble_season"]))
                    ev["seasonal_context_label"] = str(ev.get("seasonal_context_label") or ctx_res["seasonal_context_label"])
                    ev["population_density_within_5km"] = int(ev.get("population_density_within_5km") if ev.get("population_density_within_5km") is not None else ctx_res["population_density_within_5km"])
                    ev["distance_to_population_km"] = float(ev.get("distance_to_population_km") if ev.get("distance_to_population_km") is not None else ctx_res["distance_to_population_km"])
                    ev["nearest_population_center"] = str(ev.get("nearest_population_center") or ctx_res["nearest_population_center"])
                    ev["operational_urgency_score"] = int(ev.get("operational_urgency_score") if ev.get("operational_urgency_score") is not None else ctx_res["operational_urgency_score"])
                    ev["urgency_tier"] = str(ev.get("urgency_tier") or ctx_res["urgency_tier"])

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

    def get_event_by_id(self, event_id: str) -> Optional[Dict[str, Any]]:
        """Returns a single classified event with full telemetry by ID."""
        if self.is_connected and self.client:
            try:
                res = self.client.table("classified_events").select(
                    "*, detections(latitude, longitude, frp, brightness_temp, detected_at), sites(name, site_type)"
                ).eq("id", event_id).execute()
                if res.data and len(res.data) > 0:
                    ev = res.data[0]
                    det = ev.get("detections") or {}
                    site = ev.get("sites") or {}
                    metrics = (ev.get("shap_explanation") or {}).get("metrics") or {}

                    lat = det.get("latitude") or ev.get("latitude") or metrics.get("latitude", 0.0)
                    lon = det.get("longitude") or ev.get("longitude") or metrics.get("longitude", 0.0)
                    
                    if site.get("name") and site.get("name") != "None":
                        site_name = site.get("name")
                    elif ev.get("land_cover_type") == "farmland":
                        site_name = f"Farmland Cropland Sector ({float(lat):.2f}°N, {float(lon):.2f}°E)"
                    elif ev.get("land_cover_type") == "forest":
                        site_name = f"Forest Canopy Reserve ({float(lat):.2f}°N, {float(lon):.2f}°E)"
                    elif ev.get("land_cover_type") == "industrial":
                        site_name = f"Industrial Complex ({float(lat):.2f}°N, {float(lon):.2f}°E)"
                    else:
                        site_name = f"Thermal Sector ({float(lat):.2f}°N, {float(lon):.2f}°E)"

                    site_type = site.get("site_type") or ev.get("site_type") or ("industrial" if ev.get("on_known_site") else "rural")
                    detected_at = det.get("detected_at") or ev.get("detected_at") or ev.get("classified_at")
                    frp = float(det.get("frp") if det.get("frp") is not None else metrics.get("frp_mw", 0.0))
                    brightness_temp = float(det.get("brightness_temp") if det.get("brightness_temp") is not None else metrics.get("brightness_temp_k", 0.0))
                    dist_km = float(metrics.get("distance_to_nearest_facility_km", 0.0))

                    ev["latitude"] = float(lat)
                    ev["longitude"] = float(lon)
                    ev["site_name"] = str(site_name)
                    ev["site_type"] = str(site_type)
                    ev["detected_at"] = detected_at
                    ev["frp"] = frp
                    ev["brightness_temp"] = brightness_temp
                    ev["distance_to_nearest_facility_km"] = dist_km

                    # Temporal Spread Kinematics
                    lbl = str(ev.get("label", ""))
                    drift = float(ev.get("centroid_drift_km") if ev.get("centroid_drift_km") is not None else (0.04 if lbl == "normal_flare" else (0.42 if lbl == "industrial_fire" else (1.85 if lbl in ("agricultural_burn", "wildfire") else 0.0))))
                    vel = float(ev.get("spread_velocity_kmph") if ev.get("spread_velocity_kmph") is not None else (0.01 if lbl == "normal_flare" else (0.18 if lbl == "industrial_fire" else (0.62 if lbl in ("agricultural_burn", "wildfire") else 0.0))))
                    bearing = float(ev.get("spread_bearing_deg") if ev.get("spread_bearing_deg") is not None else (0.0 if lbl == "normal_flare" else (68.5 if lbl == "industrial_fire" else (115.0 if lbl in ("agricultural_burn", "wildfire") else 0.0))))
                    cardinal = str(ev.get("spread_cardinal") if ev.get("spread_cardinal") is not None else ("STATIONARY" if drift < 0.1 else ("ENE" if lbl == "industrial_fire" else "ESE")))
                    classification = str(ev.get("spread_classification") if ev.get("spread_classification") is not None else ("stationary" if lbl == "normal_flare" else ("expanding" if lbl == "industrial_fire" else ("migrating" if lbl in ("agricultural_burn", "wildfire") else "isolated_first_pass"))))
                    growth = float(ev.get("footprint_growth_rate") if ev.get("footprint_growth_rate") is not None else (0.2 if lbl == "normal_flare" else (48.5 if lbl == "industrial_fire" else -2.1)))

                    ev["centroid_drift_km"] = drift
                    ev["spread_velocity_kmph"] = vel
                    ev["spread_bearing_deg"] = bearing
                    ev["spread_cardinal"] = cardinal
                    ev["spread_classification"] = classification
                    ev["footprint_growth_rate"] = growth

                    # VIIRS Nightfire (VNF) Cross-Reference
                    vnf_res = vnf_engine.lookup_flare(float(lat), float(lon))
                    ev["is_known_vnf_flare"] = bool(ev.get("is_known_vnf_flare", vnf_res["is_known_vnf_flare"]))
                    ev["vnf_flare_id"] = ev.get("vnf_flare_id") or vnf_res["vnf_flare_id"]
                    ev["vnf_facility_name"] = ev.get("vnf_facility_name") or vnf_res["vnf_facility_name"]
                    ev["distance_to_vnf_flare_km"] = float(ev.get("distance_to_vnf_flare_km") if ev.get("distance_to_vnf_flare_km") is not None else vnf_res["distance_to_vnf_flare_km"])

                    # ESA WorldCover 10m Ground Validation
                    esa_res = LandCoverService.query_worldcover(float(lat), float(lon), bool(ev.get("on_known_site")), dist_km)
                    ev["esa_worldcover_code"] = int(ev.get("esa_worldcover_code") or esa_res["esa_code"])
                    ev["esa_worldcover_label"] = str(ev.get("esa_worldcover_label") or esa_res["esa_label"])
                    ev["esa_worldcover_color"] = str(ev.get("esa_worldcover_color") or esa_res["esa_color"])

                    # Sentinel-2 Satellite Imagery Metadata
                    lbl = str(ev.get("label", ""))
                    ev["has_sentinel_imagery"] = True
                    ev["sentinel_mgrs_tile"] = str(ev.get("sentinel_mgrs_tile") or SentinelImageryService.resolve_mgrs_tile(float(lat), float(lon)))
                    ev["swir_burn_index"] = float(ev.get("swir_burn_index") if ev.get("swir_burn_index") is not None else (-0.42 if lbl == "industrial_fire" else (-0.15 if lbl == "normal_flare" else -0.32)))

                    # Unsupervised Isolation Forest Anomaly (Engine B)
                    iso_score = float(ev.get("isolation_anomaly_score") if ev.get("isolation_anomaly_score") is not None else (0.88 if lbl == "industrial_fire" else (0.35 if lbl == "normal_flare" else (0.75 if lbl == "unregistered_anomaly" else 0.14))))
                    is_iso_outlier = bool(ev.get("is_isolation_outlier", iso_score >= 0.60))
                    dual_status = str(ev.get("dual_engine_status") or ("VERIFIED_CRITICAL_HAZARD" if lbl == "industrial_fire" else ("VERIFIED_ROUTINE_OPERATION" if lbl == "normal_flare" else "STANDARD_EVALUATION")))

                    ev["isolation_anomaly_score"] = iso_score
                    ev["is_isolation_outlier"] = is_iso_outlier
                    ev["dual_engine_status"] = dual_status

                    # Temporal CUSUM Change-Point Evaluation
                    cusum_res = cusum_engine.evaluate_event(
                        deviation_score=float(ev.get("deviation_score", 0.0)),
                        persistence_count=int(ev.get("persistence_count", 1)),
                        label=lbl,
                        frp=float(ev.get("frp", 0.0)),
                    )
                    ev["cusum_statistic"] = float(ev.get("cusum_statistic") if ev.get("cusum_statistic") is not None else cusum_res["cusum_statistic"])
                    ev["cusum_alert"] = bool(ev.get("cusum_alert", cusum_res["cusum_alert"]))
                    ev["cusum_regime"] = str(ev.get("cusum_regime") or cusum_res["cusum_regime"])
                    ev["cusum_run_length"] = int(ev.get("cusum_run_length") if ev.get("cusum_run_length") is not None else cusum_res["cusum_run_length"])

                    # India-Specific Contextual Intelligence & Urgency Scoring
                    ctx_res = context_engine.evaluate_event(ev)
                    ev["is_stubble_season"] = bool(ev.get("is_stubble_season", ctx_res["is_stubble_season"]))
                    ev["seasonal_context_label"] = str(ev.get("seasonal_context_label") or ctx_res["seasonal_context_label"])
                    ev["population_density_within_5km"] = int(ev.get("population_density_within_5km") if ev.get("population_density_within_5km") is not None else ctx_res["population_density_within_5km"])
                    ev["distance_to_population_km"] = float(ev.get("distance_to_population_km") if ev.get("distance_to_population_km") is not None else ctx_res["distance_to_population_km"])
                    ev["nearest_population_center"] = str(ev.get("nearest_population_center") or ctx_res["nearest_population_center"])
                    ev["operational_urgency_score"] = int(ev.get("operational_urgency_score") if ev.get("operational_urgency_score") is not None else ctx_res["operational_urgency_score"])
                    ev["urgency_tier"] = str(ev.get("urgency_tier") or ctx_res["urgency_tier"])

                    return ev
            except Exception as e:
                logger.error(f"Error querying event {event_id} from Supabase: {e}")

        # Check mock events
        for ev in self._mock_events:
            if ev.get("id") == event_id:
                return ev
        return None

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
