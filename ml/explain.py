"""
Explainability Engine
Generates game-theoretic SHAP (SHapley Additive exPlanations) attributions
via shap.TreeExplainer alongside human-readable domain synthesis.
"""

import logging
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
import shap

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("explain")

FEATURE_METADATA: Dict[str, Dict[str, str]] = {
    "brightness_temp": {
        "label": "Brightness Temperature",
        "unit": "K",
        "description": "Mid-infrared 4µm sensor brightness temperature",
    },
    "frp": {
        "label": "Fire Radiative Power (FRP)",
        "unit": "MW",
        "description": "Instantaneous pixel radiative thermal output",
    },
    "confidence_numeric": {
        "label": "Detection Confidence",
        "unit": "",
        "description": "VIIRS / MODIS pixel detection quality score",
    },
    "on_known_site": {
        "label": "Industrial Site Intersect",
        "unit": "",
        "description": "Binary spatial overlap with mapped industrial polygon",
    },
    "site_type_encoded": {
        "label": "Site Facility Type",
        "unit": "",
        "description": "Categorical infrastructure classification code",
    },
    "land_cover_encoded": {
        "label": "Land Cover Classification",
        "unit": "",
        "description": "ESA WorldCover land use category code",
    },
    "persistence_count": {
        "label": "Multi-Temporal Persistence",
        "unit": "passes",
        "description": "Consecutive night passes observing active heat source",
    },
    "deviation_score": {
        "label": "Baseline Deviation",
        "unit": "sigma",
        "description": "Standard deviations above facility historical baseline",
    },
    "hour_of_day": {
        "label": "Diurnal Acquisition Hour",
        "unit": "h",
        "description": "UTC hour of satellite overpass observation",
    },
    "day_of_week": {
        "label": "Weekly Cycle Day",
        "unit": "",
        "description": "Day-of-week index representing operational schedules",
    },
    "is_first_detection": {
        "label": "First Detection Flag",
        "unit": "",
        "description": "Indicator if source has no prior historical profile",
    },
}


class ExplainabilityEngine:
    """
    Computes game-theoretic SHAP attributions using shap.TreeExplainer
    and generates structured explanations for thermal anomaly classifications.
    """

    _explainer: Optional[shap.TreeExplainer] = None
    _cached_model = None

    @classmethod
    def get_explainer(cls, model) -> shap.TreeExplainer:
        """Retrieves or initializes a cached TreeExplainer for the given model."""
        if cls._explainer is None or cls._cached_model is not model:
            cls._cached_model = model
            cls._explainer = shap.TreeExplainer(model)
            logger.info("Initialized shap.TreeExplainer on classifier model.")
        return cls._explainer

    @classmethod
    def extract_shap_factors(
        cls,
        shap_values_vector: np.ndarray,
        base_value: float,
        feature_names: List[str],
        feature_values: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        """
        Transforms raw Shapley values for a specific class into an analyst-facing list
        sorted by absolute attribution magnitude.
        """
        factors = []
        for i, feat in enumerate(feature_names):
            val = float(shap_values_vector[i])
            meta = FEATURE_METADATA.get(feat, {"label": feat.replace("_", " ").title(), "unit": ""})
            raw_val = feature_values.get(feat, 0)

            if isinstance(raw_val, (float, np.floating)):
                display_val = round(float(raw_val), 2)
            elif isinstance(raw_val, (int, np.integer)):
                display_val = int(raw_val)
            else:
                display_val = raw_val

            factors.append({
                "feature": feat,
                "label": meta["label"],
                "unit": meta["unit"],
                "value": display_val,
                "shap_value": round(val, 4),
                "impact": "positive" if val > 0 else "negative",
                "abs_impact": abs(val),
            })

        factors.sort(key=lambda x: x["abs_impact"], reverse=True)

        for f in factors:
            f.pop("abs_impact", None)

        return factors

    @classmethod
    def batch_generate_explanations(
        cls,
        model,
        X: pd.DataFrame,
        df: pd.DataFrame,
        predicted_labels: List[str],
        pred_indices: np.ndarray,
        confidences: np.ndarray,
        class_names: List[str],
    ) -> List[Dict[str, Any]]:
        """
        Computes SHAP attributions in a single batch pass for high throughput.
        """
        explainer = cls.get_explainer(model)
        feature_names = X.columns.tolist()

        try:
            shap_result = explainer(X)
            has_multiclass_shap = len(shap_result.values.shape) == 3
        except Exception as e:
            logger.error(f"SHAP explanation computation failed: {e}")
            shap_result = None
            has_multiclass_shap = False

        explanations: List[Dict[str, Any]] = []

        for idx in range(len(df)):
            row = df.iloc[idx].to_dict()
            label = str(predicted_labels[idx])
            conf = float(confidences[idx])
            class_idx = int(pred_indices[idx])

            shap_factors: List[Dict[str, Any]] = []
            base_value: float = 0.0

            if shap_result is not None:
                try:
                    if has_multiclass_shap:
                        row_shap = shap_result.values[idx, :, class_idx]
                        base_value = float(shap_result.base_values[idx, class_idx])
                    else:
                        row_shap = shap_result.values[idx, :]
                        base_value = float(shap_result.base_values[idx])

                    row_feat_vals = X.iloc[idx].to_dict()
                    shap_factors = cls.extract_shap_factors(
                        shap_values_vector=row_shap,
                        base_value=base_value,
                        feature_names=feature_names,
                        feature_values=row_feat_vals,
                    )
                except Exception as ex:
                    logger.warning(f"Failed extracting SHAP factors for row {idx}: {ex}")

            exp = cls.generate_explanation(
                row=row,
                predicted_label=label,
                confidence=conf,
                shap_factors=shap_factors,
                base_value=base_value,
            )
            explanations.append(exp)

        return explanations

    @staticmethod
    def generate_explanation(
        row: Dict[str, Any],
        predicted_label: str,
        confidence: float,
        shap_factors: Optional[List[Dict[str, Any]]] = None,
        base_value: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Produces human-readable domain synthesis combined with structured SHAP factors.
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
            reasons.append("Thermal anomaly situated inside protected or dense forest cover.")
            reasons.append(f"Located {dist_km:.1f} km away from any mapped industrial installations.")
            reasons.append(f"Thermal intensity ({frp:.1f} MW) indicates active vegetation combustion.")

        elif predicted_label == "mining_activity":
            reasons.append("Anomaly falls within tagged open-cast quarry/mining perimeter.")
            reasons.append(f"Stable, low-to-moderate thermal signature ({frp:.1f} MW, persistence: {persistence}).")

        elif predicted_label == "unregistered_anomaly":
            reasons.append(f"High-intensity anomaly ({frp:.1f} MW) located on {land_cover} land.")
            reasons.append("Coordinates do not correspond to any known, registered OpenStreetMap industrial site.")
            reasons.append("Flagged for human aerial/ground intelligence verification.")

        payload: Dict[str, Any] = {
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

        if shap_factors is not None:
            payload["shap_factors"] = shap_factors
        if base_value is not None:
            payload["base_value"] = round(base_value, 4)

        return payload
