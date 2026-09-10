"""
India-Specific Contextual Intelligence & Operational Urgency Engine
Incorporates Seasonal Agro-Burning Calendars, Population Density Proximity, and Multi-Factor Urgency Scoring
NTRO Problem Statement — Satellite Earth Observation Analytics (Section 4.5)
"""

import math
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("context_intelligence")

# Major Indian Population Centers & Critical Healthcare/Civil Infrastructure
# Coordinates, approx population within 15km, and regional category
INDIAN_POPULATION_HUBS: List[Dict[str, Any]] = [
    {
        "name": "Bharuch Urban Agglomeration",
        "state": "Gujarat",
        "latitude": 21.7051,
        "longitude": 72.9959,
        "population_density_5km": 2850,
        "has_major_civil_hospital": True,
        "corridor": "Dahej-Bharuch PCPIR",
    },
    {
        "name": "Dahej Coastal Industrial Township",
        "state": "Gujarat",
        "latitude": 21.7125,
        "longitude": 72.5833,
        "population_density_5km": 620,
        "has_major_civil_hospital": False,
        "corridor": "Dahej Chemical Special Economic Zone",
    },
    {
        "name": "Surat Metropolitan City",
        "state": "Gujarat",
        "latitude": 21.1702,
        "longitude": 72.8311,
        "population_density_5km": 9400,
        "has_major_civil_hospital": True,
        "corridor": "Hazira-Surat Industrial Belt",
    },
    {
        "name": "Hazira Port & Industrial Colony",
        "state": "Gujarat",
        "latitude": 21.1067,
        "longitude": 72.6453,
        "population_density_5km": 850,
        "has_major_civil_hospital": False,
        "corridor": "Hazira Heavy Industry Complex",
    },
    {
        "name": "Jamnagar City Center",
        "state": "Gujarat",
        "latitude": 22.4707,
        "longitude": 70.0577,
        "population_density_5km": 3100,
        "has_major_civil_hospital": True,
        "corridor": "Reliance-Nayara Petrochemical Axis",
    },
    {
        "name": "Vadodara Industrial Corridor",
        "state": "Gujarat",
        "latitude": 22.3072,
        "longitude": 73.1812,
        "population_density_5km": 4200,
        "has_major_civil_hospital": True,
        "corridor": "Koyali Refinery - GIDC",
    },
    {
        "name": "Panipat Industrial City",
        "state": "Haryana",
        "latitude": 29.3909,
        "longitude": 76.9635,
        "population_density_5km": 3600,
        "has_major_civil_hospital": True,
        "corridor": "Panipat Refinery & Textile Hub",
    },
    {
        "name": "Ludhiana Agricultural Corridor",
        "state": "Punjab",
        "latitude": 30.9010,
        "longitude": 75.8573,
        "population_density_5km": 4100,
        "has_major_civil_hospital": True,
        "corridor": "Punjab Northwest Agro Belt",
    },
    {
        "name": "Karnal Agro-Industrial Axis",
        "state": "Haryana",
        "latitude": 29.6857,
        "longitude": 76.9905,
        "population_density_5km": 2100,
        "has_major_civil_hospital": True,
        "corridor": "Haryana Central Paddy Belt",
    },
    {
        "name": "Jharia Mining Settlement",
        "state": "Jharkhand",
        "latitude": 23.7431,
        "longitude": 86.4178,
        "population_density_5km": 2400,
        "has_major_civil_hospital": True,
        "corridor": "Dhanbad-Jharia Coal Basin",
    },
]


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates spherical geodesic distance between two points in kilometers."""
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lam = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lam / 2.0) ** 2
    return r * 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))


class ContextIntelligenceService:
    """
    Evaluates India-specific spatial context, seasonal agricultural burning calendars,
    population proximity, and composite operational urgency scores.
    """

    def __init__(self):
        self.population_hubs = INDIAN_POPULATION_HUBS

    def evaluate_seasonality(
        self,
        latitude: float,
        longitude: float,
        detected_at: Optional[Any] = None,
    ) -> Dict[str, Any]:
        """
        Determines if a thermal detection falls within India's seasonal crop residue burning windows.
        Kharif (Paddy Stubble): Oct 1 to Nov 30 (Day of year ~274 to 334).
        Rabi (Wheat Stubble): Apr 1 to May 15 (Day of year ~91 to 135).
        """
        dt = None
        if detected_at:
            try:
                if isinstance(detected_at, str):
                    clean_str = detected_at.replace("Z", "+00:00")
                    dt = datetime.fromisoformat(clean_str)
                elif isinstance(detected_at, datetime):
                    dt = detected_at
            except Exception:
                dt = None

        if dt is None:
            dt = datetime.now(timezone.utc)

        day_of_year = dt.timetuple().tm_yday

        # Geographic bounding for India's major northwest/Indo-Gangetic agricultural burn corridor
        is_in_northwest_agro_corridor = (25.0 <= latitude <= 32.5) and (73.0 <= longitude <= 84.5)

        is_kharif_season = 274 <= day_of_year <= 334  # October 1 - November 30
        is_rabi_season = 91 <= day_of_year <= 135     # April 1 - May 15

        if is_in_northwest_agro_corridor and is_kharif_season:
            is_stubble = True
            season_name = "KHARIF_PADDY_STUBBLE_SEASON"
            label = "Active Kharif Paddy Stubble Burn Window (Punjab/Haryana/UP)"
        elif is_in_northwest_agro_corridor and is_rabi_season:
            is_stubble = True
            season_name = "RABI_WHEAT_STUBBLE_SEASON"
            label = "Active Rabi Wheat Harvest Burn Window (Indo-Gangetic Plain)"
        elif is_kharif_season or is_rabi_season:
            is_stubble = True
            season_name = "REGIONAL_POST_HARVEST_SEASON"
            label = "Regional Post-Harvest Crop Cycle Window"
        else:
            is_stubble = False
            season_name = "OFF_SEASON"
            label = "Off-Season Agricultural Baseline"

        return {
            "is_stubble_season": is_stubble,
            "seasonal_window": season_name,
            "seasonal_context_label": label,
            "day_of_year": day_of_year,
            "in_primary_agro_corridor": is_in_northwest_agro_corridor,
        }

    def evaluate_population_proximity(
        self,
        latitude: float,
        longitude: float,
    ) -> Dict[str, Any]:
        """
        Locates the closest urban population center, computes geodesic distance,
        and estimates population density within a 5km radius.
        """
        closest_hub = None
        min_dist = float("inf")

        for hub in self.population_hubs:
            dist = haversine_distance_km(latitude, longitude, hub["latitude"], hub["longitude"])
            if dist < min_dist:
                min_dist = dist
                closest_hub = hub

        if closest_hub is None:
            return {
                "nearest_population_center": "Unmapped Rural Settlement",
                "distance_to_population_km": 25.0,
                "population_density_within_5km": 150,
                "has_civil_hospital": False,
                "corridor": "Rural Interior",
            }

        # Estimate density decay with distance
        decay_factor = max(0.1, 1.0 - (min_dist / 30.0))
        estimated_density = int(closest_hub["population_density_5km"] * decay_factor)

        return {
            "nearest_population_center": closest_hub["name"],
            "distance_to_population_km": round(min_dist, 2),
            "population_density_within_5km": max(estimated_density, 50),
            "has_civil_hospital": closest_hub["has_major_civil_hospital"] and (min_dist <= 15.0),
            "corridor": closest_hub["corridor"],
        }

    def calculate_urgency_score(
        self,
        frp: float,
        deviation_score: float,
        label: str,
        site_type: str,
        distance_to_population_km: float,
        population_density_within_5km: int,
        spread_velocity_kmph: float = 0.0,
        spread_cardinal: str = "STATIONARY",
    ) -> Dict[str, Any]:
        """
        Computes the Operational Urgency Score (U in [1, 100]) for national command triage:
        Combines:
        1. Thermal severity (FRP and Z-score deviation) [Weight: 35%]
        2. Population vulnerability & hospital proximity [Weight: 30%]
        3. Kinematic spread momentum [Weight: 20%]
        4. Chemical/toxic toxicity hazard [Weight: 15%]
        """
        # Component 1: Thermal Severity (0 to 100)
        # FRP of 150+ MW or deviation > 4.5 reaches 90-100
        frp_component = min(100.0, (frp / 160.0) * 80.0)
        dev_component = min(100.0, max(0.0, deviation_score) * 18.0)
        s_severity = 0.6 * frp_component + 0.4 * dev_component

        # Component 2: Population Proximity (0 to 100)
        # Distance < 3km => 90-100, > 25km => 10
        if distance_to_population_km <= 2.0:
            p_dist = 100.0
        elif distance_to_population_km <= 5.0:
            p_dist = 85.0
        elif distance_to_population_km <= 12.0:
            p_dist = 55.0
        elif distance_to_population_km <= 20.0:
            p_dist = 30.0
        else:
            p_dist = 10.0

        p_density = min(100.0, (population_density_within_5km / 3000.0) * 100.0)
        s_population = 0.7 * p_dist + 0.3 * p_density

        # Component 3: Kinematic Momentum (0 to 100)
        if spread_cardinal != "STATIONARY":
            # Spreading front breaching industrial perimeter (>0.15 km/h is an active propagation hazard)
            vel_score = min(100.0, max(50.0, (spread_velocity_kmph / 0.25) * 100.0))
            s_kinematic = vel_score
        else:
            s_kinematic = 5.0

        # Component 4: Toxicity & Facility Risk (0 to 100)
        if label == "industrial_fire" or "chemical" in site_type.lower():
            s_toxic = 95.0
        elif "refinery" in site_type.lower() or "petrochemical" in site_type.lower():
            s_toxic = 80.0
        elif "steel" in site_type.lower():
            s_toxic = 60.0
        elif label == "normal_flare":
            s_toxic = 25.0
        elif label == "agricultural_burn":
            s_toxic = 20.0
        else:
            s_toxic = 15.0

        # Weighted Composite
        if label == "normal_flare":
            # Routine operational flaring capped at routine baseline
            urgency = min(24, int(0.25 * s_severity + 0.40 * s_population + 0.35 * s_toxic))
        else:
            urgency = int(
                0.35 * s_severity +
                0.30 * s_population +
                0.20 * s_kinematic +
                0.15 * s_toxic
            )

        urgency = max(1, min(100, urgency))

        # Determine Tier
        if urgency >= 80:
            tier = "CRITICAL_URGENCY"
            action = "Trigger immediate District Collector & NDMA Tier-1 civil evacuation advisory."
        elif urgency >= 55:
            tier = "ELEVATED_URGENCY"
            action = "Dispatch local fire tender units and alert plant emergency response command."
        elif urgency >= 30:
            tier = "MONITORED_ADVISORY"
            action = "Maintain automated orbital pass surveillance and satellite thermal tracking."
        else:
            tier = "ROUTINE_BASELINE"
            action = "Logged in operational telemetry ledger. No civil escalation required."

        return {
            "operational_urgency_score": urgency,
            "urgency_tier": tier,
            "recommended_action": action,
            "components": {
                "thermal_severity": round(s_severity, 1),
                "population_vulnerability": round(s_population, 1),
                "kinematic_momentum": round(s_kinematic, 1),
                "toxic_hazard": round(s_toxic, 1),
            },
        }

    def evaluate_event(
        self,
        event: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Comprehensive contextual intelligence evaluation for a classified event dictionary.
        """
        lat = float(event.get("latitude", 0.0))
        lon = float(event.get("longitude", 0.0))
        detected_at = event.get("detected_at") or event.get("classified_at")
        frp = float(event.get("frp", 0.0))
        dev = float(event.get("deviation_score", 0.0))
        label = str(event.get("label") or event.get("predicted_label", "unregistered_anomaly"))
        site_type = str(event.get("site_type", "none"))
        vel = float(event.get("spread_velocity_kmph", 0.0))
        cardinal = str(event.get("spread_cardinal", "STATIONARY"))

        # 1. Seasonality
        season_res = self.evaluate_seasonality(lat, lon, detected_at)

        # 2. Population Proximity
        pop_res = self.evaluate_population_proximity(lat, lon)

        # 3. Urgency Index
        urgency_res = self.calculate_urgency_score(
            frp=frp,
            deviation_score=dev,
            label=label,
            site_type=site_type,
            distance_to_population_km=pop_res["distance_to_population_km"],
            population_density_within_5km=pop_res["population_density_within_5km"],
            spread_velocity_kmph=vel,
            spread_cardinal=cardinal,
        )

        return {
            "is_stubble_season": season_res["is_stubble_season"],
            "seasonal_window": season_res["seasonal_window"],
            "seasonal_context_label": season_res["seasonal_context_label"],
            "nearest_population_center": pop_res["nearest_population_center"],
            "distance_to_population_km": pop_res["distance_to_population_km"],
            "population_density_within_5km": pop_res["population_density_within_5km"],
            "has_civil_hospital_nearby": pop_res["has_civil_hospital"],
            "operational_urgency_score": urgency_res["operational_urgency_score"],
            "urgency_tier": urgency_res["urgency_tier"],
            "urgency_action": urgency_res["recommended_action"],
        }


# Singleton instance
context_engine = ContextIntelligenceService()
