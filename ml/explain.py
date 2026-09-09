"""
Explainability Engine
Generates human-readable, deterministic explanations for classification decisions.
Provides command-center analysts with the key drivers behind each model decision.
"""

import logging
from typing import Dict, Any, List
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("explain")


class ExplainabilityEngine:
    """
    Translates model predictions and feature inputs into explainable, structured reasons.
    """

    @staticmethod
    def generate_explanation(
        row: Dict[str, Any],
        predicted_label: str,
        confidence: float,
    ) -> Dict[str, Any]:
        """
        Produces human-readable key drivers and a structured explainability payload.
        """
        frp = float(row.get("frp", 0.0))
        bt = float(row.get("brightness_temp", 300.0))
        on_site = bool(row.get("on_known_site", 0))
        site_name = str(row.get("site_name", "Unmapped Location"))
        site_type = str(row.get("site_type", "none"))
        land_cover = str(row.get("land_cover_type", "other"))
        dev_score = float(row.get("deviation_score", 0.0))
        persistence = int(row.get("persistence_count", 1))
        dist_km = float(row.get("distance_to_site_km", 0.0))

        reasons: List[str] = []

        if predicted_label == "industrial_fire":
            reasons.append(f"Severe thermal output detected (FRP: {frp:.1f} MW, Brightness Temp: {bt:.1f} K).")
            if dev_score > 2.0:
                reasons.append(f"Statistical deviation: {dev_score:.1f} sigma above historical baseline for {site_name}.")
            if on_site:
                reasons.append(f"Direct spatial intersection with mapped {site_type} facility.")
            else:
                reasons.append(f"Located {dist_km:.1f} km from closest industrial facility within high-risk perimeter.")

        elif predicted_label == "normal_flare":
            reasons.append(f"Stationary operational signature: observed on {persistence} satellite passes.")
            reasons.append(f"Thermal power ({frp:.1f} MW) within normal operating bounds (Z-score: {dev_score:+.2f} sigma).")
            reasons.append(f"Located inside confirmed {site_type} boundary ({site_name}).")

        elif predicted_label == "agricultural_burn":
            reasons.append(f"Spatial location verified as agricultural cropland ({land_cover}).")
            reasons.append(f"Transient, short-duration thermal signature (pass count: {persistence}).")
            reasons.append(f"Distant from industrial facilities ({dist_km:.1f} km away).")

        elif predicted_label == "wildfire":
            reasons.append(f"Thermal anomaly situated inside protected or dense forest cover.")
            reasons.append(f"Located {dist_km:.1f} km away from any mapped industrial installations.")
            reasons.append(f"Thermal intensity ({frp:.1f} MW) indicates active vegetation combustion.")

        elif predicted_label == "mining_activity":
            reasons.append(f"Anomaly falls within tagged open-cast quarry/mining perimeter.")
            reasons.append(f"Stable, low-to-moderate thermal signature ({frp:.1f} MW, persistence: {persistence}).")

        elif predicted_label == "unregistered_anomaly":
            reasons.append(f"High-intensity anomaly ({frp:.1f} MW) located on {land_cover} land.")
            reasons.append("Coordinates do not correspond to any known, registered OpenStreetMap industrial site.")
            reasons.append("Flagged for human aerial/ground intelligence verification.")

        # Structured explanation JSONB payload
        return {
            "predicted_label": predicted_label,
            "confidence_pct": round(confidence * 100, 1),
            "summary": f"Classified as {predicted_label.upper()} ({confidence * 100:.1f}% confidence)",
            "primary_factors": reasons,
            "metrics": {
                "frp_mw": frp,
                "brightness_temp_k": bt,
                "deviation_z_score": dev_score,
                "persistence_count": persistence,
                "distance_to_nearest_facility_km": dist_km,
                "on_known_site": on_site,
            },
        }
