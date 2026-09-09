"""
Baseline Engine
Maintains per-site historical thermal profiles (mean FRP, std dev of FRP, mean brightness temp).
Computes the statistical deviation score (Z-score) for incoming detections.
"""

import logging
from typing import Dict, Any, Optional
import numpy as np
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("baseline_engine")


class BaselineEngine:
    """
    Computes and maintains site-specific historical thermal baselines.
    Distinguishes stationary normal operational flaring from sudden thermal spikes.
    """

    def __init__(self, history_df: Optional[pd.DataFrame] = None):
        """
        history_df contains historical observations with columns:
        ['site_osm_id', 'frp', 'brightness_temp', 'recorded_at']
        """
        self.history_df = history_df if history_df is not None else pd.DataFrame()
        self.site_profiles: Dict[int, Dict[str, float]] = {}
        if not self.history_df.empty:
            self.recompute_all_baselines()

    def recompute_all_baselines(self):
        """Calculates running mean and standard deviation of FRP per industrial site."""
        if self.history_df.empty or "site_osm_id" not in self.history_df.columns:
            return

        grouped = self.history_df.groupby("site_osm_id")
        for site_id, group in grouped:
            frp_series = group["frp"].dropna()
            temp_series = group["brightness_temp"].dropna()

            mean_frp = float(frp_series.mean()) if len(frp_series) > 0 else 0.0
            std_frp = float(frp_series.std(ddof=1)) if len(frp_series) > 1 else 0.0
            mean_temp = float(temp_series.mean()) if len(temp_series) > 0 else 300.0

            self.site_profiles[int(site_id)] = {
                "count": len(group),
                "mean_frp": mean_frp,
                "std_frp": std_frp,
                "mean_temp": mean_temp,
            }
        logger.info(f"Recomputed thermal baselines for {len(self.site_profiles)} industrial sites.")

    def compute_deviation_score(self, site_osm_id: Optional[int], frp: float, brightness_temp: float) -> Dict[str, Any]:
        """
        Computes Z-score deviation: (observed_frp - mean_frp) / std_frp.
        
        Returns:
            Dict containing:
            - deviation_score (float): Z-score or ratio deviation
            - persistence_count (int): How many times this site/location was detected
            - is_first_detection (int): 1 if site has no history, 0 otherwise
            - baseline_mean_frp (float): Historical mean
        """
        if site_osm_id is None or pd.isna(site_osm_id) or int(site_osm_id) not in self.site_profiles:
            # Unregistered location or first detection on a site
            return {
                "deviation_score": 0.0,
                "persistence_count": 1,
                "is_first_detection": 1,
                "baseline_mean_frp": 0.0,
            }

        profile = self.site_profiles[int(site_osm_id)]
        mean_frp = profile["mean_frp"]
        std_frp = profile["std_frp"]
        count = profile["count"]

        # Minimum standard deviation floor to prevent division by near-zero for ultra-stable flares
        std_floor = max(std_frp, 2.5)
        z_score = (frp - mean_frp) / std_floor

        return {
            "deviation_score": round(float(z_score), 3),
            "persistence_count": int(count + 1),
            "is_first_detection": 0,
            "baseline_mean_frp": round(mean_frp, 2),
        }

    def enrich_with_baseline(self, enriched_detections_gdf: pd.DataFrame) -> pd.DataFrame:
        """
        Enriches a GeoDataFrame of detections with baseline metrics.
        """
        if enriched_detections_gdf.empty:
            return enriched_detections_gdf

        df = enriched_detections_gdf.copy()
        deviations = []
        persistences = []
        is_firsts = []
        baseline_means = []

        for _, row in df.iterrows():
            site_id = row.get("site_osm_id")
            frp = float(row.get("frp", 0.0))
            bt = float(row.get("brightness_temp", 300.0))

            res = self.compute_deviation_score(site_id, frp, bt)
            deviations.append(res["deviation_score"])
            persistences.append(res["persistence_count"])
            is_firsts.append(res["is_first_detection"])
            baseline_means.append(res["baseline_mean_frp"])

        df["deviation_score"] = deviations
        df["persistence_count"] = persistences
        df["is_first_detection"] = is_firsts
        df["baseline_mean_frp"] = baseline_means

        return df
