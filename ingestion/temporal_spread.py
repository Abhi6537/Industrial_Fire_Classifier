"""
Multi-Temporal Spread & Centroid Drift Analysis Engine
Industrial Fire Detection & Classification System (NTRO)

Computes temporal-spatial kinematics across consecutive satellite passes:
- Geodesic centroid drift distance (km) via Haversine formulation
- Spread velocity (km/h) across overpass delta-time
- Directional compass bearing (degrees 0-360)
- Radiative power growth dynamics (MW/h)
- Kinematic classification: stationary, expanding, migrating, or isolated_first_pass
"""

import math
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("temporal_spread")


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates orthodromic great-circle distance between two points in kilometers."""
    R = 6371.0  # Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def calculate_bearing_degrees(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes initial compass bearing from Point 1 to Point 2.
    Returns bearing in degrees [0, 360).
    """
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_lambda = math.radians(lon2 - lon1)

    y = math.sin(delta_lambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)
    initial_bearing = math.atan2(y, x)

    # Normalize to 0-360 degrees
    compass_bearing = (math.degrees(initial_bearing) + 360) % 360
    return round(compass_bearing, 1)


def bearing_to_cardinal(bearing_deg: float) -> str:
    """Maps compass bearing in degrees to 8-point cardinal direction."""
    directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
    idx = int((bearing_deg + 22.5) // 45) % 8
    return directions[idx]


class TemporalSpreadEngine:
    """
    Tracks and analyzes multi-temporal spatial clusters of satellite thermal observations.
    """

    def __init__(self, spatial_cluster_radius_km: float = 3.5, max_temporal_window_hours: float = 48.0):
        self.spatial_cluster_radius_km = spatial_cluster_radius_km
        self.max_temporal_window_hours = max_temporal_window_hours

    def compute_kinematics(
        self,
        current_lat: float,
        current_lon: float,
        current_frp: float,
        current_time: datetime,
        prior_observations: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Calculates spread velocity, centroid drift, and trajectory classification
        relative to the most recent prior pass in the local spatial cluster.

        prior_observations: List of dicts containing:
            {'latitude': float, 'longitude': float, 'frp': float, 'detected_at': datetime}
        """
        # Filter prior passes within maximum time window and spatial radius
        valid_priors = []
        for obs in prior_observations:
            p_time = obs.get("detected_at")
            if not isinstance(p_time, datetime):
                continue
            delta_hours = (current_time - p_time).total_seconds() / 3600.0
            if 0.25 <= delta_hours <= self.max_temporal_window_hours:
                p_lat = float(obs["latitude"])
                p_lon = float(obs["longitude"])
                dist = haversine_km(current_lat, current_lon, p_lat, p_lon)
                if dist <= self.spatial_cluster_radius_km:
                    valid_priors.append({
                        "observation": obs,
                        "delta_hours": delta_hours,
                        "distance_km": dist,
                    })

        if not valid_priors:
            return {
                "centroid_drift_km": 0.0,
                "spread_velocity_kmph": 0.0,
                "spread_bearing_deg": 0.0,
                "spread_cardinal": "N/A",
                "footprint_growth_rate": 0.0,
                "spread_classification": "isolated_first_pass",
                "prior_passes_correlated": 0,
                "delta_hours_since_last_pass": None,
            }

        # Select the most recent chronologically (smallest delta_hours)
        valid_priors.sort(key=lambda x: x["delta_hours"])
        most_recent = valid_priors[0]
        prior_obs = most_recent["observation"]
        delta_hours = max(most_recent["delta_hours"], 0.25)  # avoid division by zero
        drift_km = most_recent["distance_km"]

        # Calculate velocity & bearing
        velocity_kmph = drift_km / delta_hours
        bearing_deg = calculate_bearing_degrees(
            float(prior_obs["latitude"]),
            float(prior_obs["longitude"]),
            current_lat,
            current_lon,
        ) if drift_km > 0.05 else 0.0

        cardinal = bearing_to_cardinal(bearing_deg) if drift_km > 0.05 else "STATIONARY"

        # Calculate FRP growth dynamics
        prior_frp = float(prior_obs.get("frp", current_frp))
        delta_frp = current_frp - prior_frp
        growth_rate = delta_frp / delta_hours

        # Kinematic Classification Rules
        # 1. Stationary (routine flare / chimney): sub-pixel jitter (<350m) and near-zero velocity
        if drift_km < 0.35 and velocity_kmph < 0.15:
            classification = "stationary"
        # 2. Expanding (industrial disaster / explosion): local centroid but massive thermal surge
        elif drift_km < 1.8 and (growth_rate >= 12.0 or current_frp >= 100.0):
            classification = "expanding"
        # 3. Migrating (wildfire or wind-driven agricultural sweep): significant linear drift
        elif drift_km >= 1.2 or velocity_kmph >= 0.35:
            classification = "migrating"
        else:
            classification = "stationary" if drift_km < 0.6 else "migrating"

        return {
            "centroid_drift_km": round(drift_km, 3),
            "spread_velocity_kmph": round(velocity_kmph, 3),
            "spread_bearing_deg": round(bearing_deg, 1),
            "spread_cardinal": cardinal,
            "footprint_growth_rate": round(growth_rate, 2),
            "spread_classification": classification,
            "prior_passes_correlated": len(valid_priors),
            "delta_hours_since_last_pass": round(delta_hours, 2),
        }


# Singleton TemporalSpreadEngine instance
spread_engine = TemporalSpreadEngine()

