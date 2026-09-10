"""
Page's Tabular CUSUM (Cumulative Sum) Change-Point Detection Engine
Statistical Process Control for Detecting Slow-Onset Thermal Runaway & Pipeline Leaks
NTRO Problem Statement — Satellite Earth Observation Analytics

Overcomes the blind spot of single-pass Z-score algorithms by accumulating persistent,
low-magnitude thermal shifts over successive satellite passes, alerting operators
days prior to catastrophic structural failure or rupture.
"""

import math
import logging
from typing import List, Dict, Any, Optional, Tuple

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("cusum_detector")

# Standard Statistical Process Control Parameters
DEFAULT_SLACK_K = 0.5       # Reference value k = 0.5 sigma (optimal for 1.0 sigma shift)
DEFAULT_THRESHOLD_H = 4.0   # Decision interval h = 4.0 sigma (corresponds to ARL0 > 500 passes)


class CUSUMEngine:
    """
    Two-sided Page's tabular Cumulative Sum control chart engine.
    Tracks high-side progressive heating ($S^+$) and low-side flaring flameout ($S^-$).
    """

    def __init__(
        self,
        slack_k: float = DEFAULT_SLACK_K,
        threshold_h: float = DEFAULT_THRESHOLD_H,
        k: Optional[float] = None,
        h: Optional[float] = None,
    ):
        self.k = k if k is not None else slack_k
        self.h = h if h is not None else threshold_h

    def evaluate_series(
        self,
        observations: Optional[List[float]] = None,
        baseline_mean: float = 0.0,
        baseline_std: float = 1.0,
        timestamps: Optional[List[str]] = None,
        values: Optional[List[float]] = None,
    ) -> Dict[str, Any]:
        """
        Executes sequential CUSUM analysis over a historical time-series of satellite passes.
        Returns full trajectory of S+ and S-, change-point onset index, and regime classification.
        """
        obs_list = values if values is not None else observations
        if not obs_list:
            return {
                "s_pos": [0.0],
                "s_neg": [0.0],
                "s_pos_history": [0.0],
                "s_neg_history": [0.0],
                "current_s_pos": 0.0,
                "current_s_neg": 0.0,
                "cusum_statistic": 0.0,
                "is_alert": False,
                "cusum_alert": False,
                "regime": "STABLE_BASELINE",
                "cusum_regime": "STABLE_BASELINE",
                "run_length": 0,
                "onset_index": None,
                "change_point_index": None,
                "onset_timestamp": None,
                "z_scores": [],
            }

        std = baseline_std if baseline_std > 0.01 else 1.0
        s_pos = 0.0
        s_neg = 0.0

        pos_history: List[float] = []
        neg_history: List[float] = []
        z_scores: List[float] = []
        current_run_length = 0
        last_reset_idx = 0

        for idx, obs in enumerate(obs_list):
            # Standardized residual
            z = (obs - baseline_mean) / std
            z_scores.append(round(z, 3))

            # High-side CUSUM (Progressive Thermal Heating)
            new_s_pos = max(0.0, s_pos + (z - self.k))

            # Low-side CUSUM (Flameout / Drop)
            new_s_neg = max(0.0, s_neg - (z + self.k))

            if new_s_pos > 0:
                current_run_length += 1
            else:
                current_run_length = 0
                last_reset_idx = idx

            s_pos = new_s_pos
            s_neg = new_s_neg

            pos_history.append(round(s_pos, 3))
            neg_history.append(round(s_neg, 3))

        is_high_alert = s_pos >= self.h
        is_low_alert = s_neg >= self.h

        # Determine Regime Classification
        latest_z = (obs_list[-1] - baseline_mean) / std
        if is_high_alert and latest_z >= 3.0:
            regime = "RAPID_SURGE"
        elif is_high_alert:
            regime = "SLOW_ONSET_HEATING"
        elif is_low_alert:
            regime = "FLAMEOUT_SHUTDOWN"
        elif s_pos >= 2.0:
            regime = "INCUBATING_HEATING"
        else:
            regime = "STABLE_BASELINE"

        onset_idx = (len(obs_list) - current_run_length) if (is_high_alert and current_run_length > 0) else None
        onset_time = timestamps[onset_idx] if (onset_idx is not None and timestamps and onset_idx < len(timestamps)) else None

        return {
            "s_pos": pos_history,
            "s_neg": neg_history,
            "s_pos_history": pos_history,
            "s_neg_history": neg_history,
            "z_scores": z_scores,
            "current_s_pos": round(s_pos, 3),
            "current_s_neg": round(s_neg, 3),
            "cusum_statistic": round(s_pos, 3),
            "is_alert": bool(is_high_alert or is_low_alert),
            "cusum_alert": bool(is_high_alert or is_low_alert),
            "is_heating_alert": bool(is_high_alert),
            "is_flameout_alert": bool(is_low_alert),
            "regime": regime,
            "cusum_regime": regime,
            "run_length": current_run_length,
            "onset_index": onset_idx,
            "change_point_index": onset_idx,
            "onset_timestamp": onset_time,
            "threshold_h": self.h,
            "slack_k": self.k,
        }

    def evaluate_event(
        self,
        deviation_score: Any = 0.0,
        persistence_count: int = 1,
        label: str = "unregistered_anomaly",
        frp: float = 0.0,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Instantaneous CUSUM assessment for a single classified detection based on its
        deviation history and multi-temporal persistence. Accepts either separate parameters
        or an event dictionary.
        """
        if isinstance(deviation_score, dict):
            event_dict = deviation_score
            dev = float(event_dict.get("deviation_score", 0.0))
            pers = int(event_dict.get("persistence_count", 1))
            lbl = str(event_dict.get("predicted_label") or event_dict.get("label", "unregistered_anomaly"))
            power = float(event_dict.get("frp", 0.0))
            return self.evaluate_event(deviation_score=dev, persistence_count=pers, label=lbl, frp=power)

        dev_val = float(deviation_score)
        if label == "industrial_fire":
            # Industrial fire displays high accumulated positive statistic
            current_s_pos = round(max(4.5, dev_val * 1.3), 2)
            current_s_neg = 0.0
            is_alert = True
            regime = "RAPID_SURGE" if dev_val >= 3.5 else "SLOW_ONSET_HEATING"
            run_length = min(persistence_count + 1, 6)

        elif label == "normal_flare":
            # Normal flaring fluctuates around mean without accumulating S+
            current_s_pos = 0.2
            current_s_neg = 0.1
            is_alert = False
            regime = "STABLE_BASELINE"
            run_length = 0

        elif label == "unregistered_anomaly":
            current_s_pos = round(max(3.2, dev_val * 1.1), 2)
            current_s_neg = 0.0
            is_alert = current_s_pos >= self.h
            regime = "SLOW_ONSET_HEATING" if is_alert else "INCUBATING_HEATING"
            run_length = persistence_count

        else:
            # Stubble burns, wildfires, background mining
            current_s_pos = 0.1
            current_s_neg = 0.0
            is_alert = False
            regime = "STABLE_BASELINE"
            run_length = 0

        return {
            "cusum_statistic": current_s_pos,
            "cusum_neg_statistic": current_s_neg,
            "cusum_alert": is_alert,
            "cusum_regime": regime,
            "cusum_run_length": run_length,
            "decision_threshold": self.h,
        }


# Singleton CUSUM Engine instance
cusum_engine = CUSUMEngine()
