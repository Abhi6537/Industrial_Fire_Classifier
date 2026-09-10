"""
Isolation Forest Unsupervised Anomaly Detection Engine
Zero-label structural outlier detection for novel, unmodeled thermal events.
NTRO Problem Statement — Satellite Earth Observation Analytics

Dual-Engine Architecture:
- Engine A: Supervised Multi-Class Classifier (XGBoost / Random Forest)
- Engine B: Unsupervised Isolation Forest (Structural Tree Path Length Isolation)
"""

import os
import sys
import logging
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import IsolationForest

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.features import FeatureExtractor, FEATURE_COLUMNS

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("isolation_forest")

DEFAULT_IFOREST_PATH = "ml/models/isolation_forest.pkl"
TRAINING_DATA_PATH = "data/training/real_firms_viirs_india_12m.csv"


class IsolationForestService:
    """
    Manages training, serialization, and sub-millisecond inference for the
    unsupervised Isolation Forest anomaly layer.
    """

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or os.getenv("IFOREST_MODEL_PATH", DEFAULT_IFOREST_PATH)
        self.model: Optional[IsolationForest] = None
        self.load_or_train()

    def load_or_train(self):
        """Loads serialized model or trains a new one if artifact is missing."""
        if os.path.exists(self.model_path):
            try:
                self.model = joblib.load(self.model_path)
                logger.info(f"Loaded Isolation Forest model from [{self.model_path}].")
                return
            except Exception as e:
                logger.warning(f"Failed to load [{self.model_path}]: {e}. Retraining...")

        self.train_isolation_forest()

    def train_isolation_forest(self) -> IsolationForest:
        """
        Trains an Isolation Forest on available FIRMS observations without labels.
        Learns the normative topological distribution of routine flaring, stubble burns,
        and standard background thermal activity across India.
        """
        logger.info("Initiating Isolation Forest unsupervised training routine...")

        if os.path.exists(TRAINING_DATA_PATH):
            raw_df = pd.read_csv(TRAINING_DATA_PATH)
            logger.info(f"Loaded {len(raw_df)} real FIRMS observations from [{TRAINING_DATA_PATH}].")
        else:
            logger.warning(f"Training data not found at [{TRAINING_DATA_PATH}]. Generating baseline training distribution...")
            from ml.dataset_generator import generate_synthetic_firms_data
            raw_df = generate_synthetic_firms_data(n_samples=2500)

        # Extract numerical features
        X = FeatureExtractor.extract_features(raw_df)

        # Train IsolationForest:
        # contamination=0.03 (approx 3% of satellite hotspots are true high-consequence disasters)
        # n_estimators=150, max_samples=256 for optimal anomaly sensitivity (Liu et al.)
        iforest = IsolationForest(
            n_estimators=150,
            max_samples=256,
            contamination=0.03,
            random_state=42,
            n_jobs=-1,
        )
        iforest.fit(X)

        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        joblib.dump(iforest, self.model_path)
        logger.info(f"Isolation Forest model trained and saved to [{self.model_path}].")
        self.model = iforest
        return iforest

    def score_detections(self, features_df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """
        Computes continuous anomaly scores and binary outlier indicators for feature rows.
        Returns:
        - anomaly_scores: float array scaled smoothly to [0.0, 1.0] where 1.0 is extreme anomaly.
        - is_outlier: boolean array (True if score >= 0.60).
        """
        if self.model is None:
            self.load_or_train()

        X = features_df[FEATURE_COLUMNS] if all(c in features_df.columns for c in FEATURE_COLUMNS) else FeatureExtractor.extract_features(features_df)

        # decision_function yields positive values for inliers, negative for outliers
        dec_scores = self.model.decision_function(X)

        # Convert to a sigmoid-like normalized anomaly score [0.0, 1.0]
        # Inliers (dec_scores > 0.1) -> anomaly_scores < 0.40
        # Outliers (dec_scores < -0.05) -> anomaly_scores > 0.65
        # Extreme outliers (dec_scores < -0.15) -> anomaly_scores > 0.85
        anomaly_scores = 1.0 / (1.0 + np.exp(dec_scores * 12.0))
        anomaly_scores = np.clip(anomaly_scores, 0.0, 1.0)
        anomaly_scores = np.round(anomaly_scores, 4)

        is_outlier = [bool(x) for x in (anomaly_scores >= 0.60)]
        return anomaly_scores, is_outlier

    @classmethod
    def evaluate_dual_engine(
        cls,
        supervised_label: str,
        supervised_confidence: float,
        isolation_score: float,
    ) -> Dict[str, Any]:
        """
        Cross-analyzes Supervised (Engine A) and Unsupervised (Engine B) predictions.
        Identifies consensus hazards, operational anomalies, and novel unknown-unknowns.
        """
        is_high_anomaly = isolation_score >= 0.65
        is_moderate_anomaly = 0.50 <= isolation_score < 0.65

        if supervised_label == "industrial_fire" and is_high_anomaly:
            status = "VERIFIED_CRITICAL_HAZARD"
            description = "Consensus Hazard: Both supervised classifier and unsupervised Isolation Forest flag severe, high-consequence anomaly."
            badge_color = "red"
            priority = "P1_CRITICAL"

        elif supervised_label == "normal_flare" and is_high_anomaly:
            status = "OPERATIONAL_DEVIATION_ALERT"
            description = "Flaring Envelope Anomaly: Flare detected at known site, but unsupervised Isolation Forest detected severe thermal/kinematic deviation from baseline flaring envelope."
            badge_color = "amber"
            priority = "P2_WARNING"

        elif supervised_label == "normal_flare" and not is_high_anomaly:
            status = "VERIFIED_ROUTINE_OPERATION"
            description = "Operational Consensus: Supervised classifier and unsupervised Isolation Forest confirm normal routine flaring within expected baseline."
            badge_color = "emerald"
            priority = "P4_INFO"

        elif supervised_label in ("unregistered_anomaly", "wildfire") and is_high_anomaly:
            status = "ANOMALOUS_THERMAL_SURGE"
            description = "Unsupervised structural outlier confirmed outside industrial perimeters."
            badge_color = "orange"
            priority = "P2_HIGH"

        elif isolation_score >= 0.80:
            status = "UNKNOWN_UNKNOWN_NOVELTY"
            description = "Extreme Structural Outlier: Hotspot feature topology has no close historical precedent in satellite record. Flagged for human aerial/imagery audit."
            badge_color = "purple"
            priority = "P1_URGENT_AUDIT"

        else:
            status = "STANDARD_EVALUATION"
            description = f"Supervised: {supervised_label.upper()} ({supervised_confidence*100:.1f}%), Unsupervised anomaly score: {isolation_score:.2f}."
            badge_color = "slate"
            priority = "P3_ROUTINE"

        return {
            "dual_engine_status": status,
            "description": description,
            "badge_color": badge_color,
            "priority": priority,
            "supervised_label": supervised_label,
            "supervised_confidence": round(supervised_confidence, 4),
            "isolation_anomaly_score": round(isolation_score, 4),
            "is_isolation_outlier": is_high_anomaly,
        }


# Singleton instance
iforest_service = IsolationForestService()
