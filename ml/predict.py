"""
Model Inference & Classification Service
Loads trained model artifacts, runs real-time inference on incoming detections,
computes severity scores, and attaches explainability payloads.
"""

import os
import sys
import logging
from typing import Dict, Any, List, Optional
import joblib
import pandas as pd
import numpy as np

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.features import FeatureExtractor, LABEL_CLASSES
from ml.explain import ExplainabilityEngine

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("predict")

DEFAULT_MODEL_PATH = "ml/models/model.pkl"
DEFAULT_ENCODER_PATH = "ml/models/encoder.pkl"


class ClassifierService:
    """
    Singleton service managing model loading and low-latency inference.
    """

    def __init__(
        self,
        model_path: Optional[str] = None,
        encoder_path: Optional[str] = None,
    ):
        self.model_path = model_path or os.getenv("MODEL_PATH", DEFAULT_MODEL_PATH)
        self.encoder_path = encoder_path or os.getenv("ENCODER_PATH", DEFAULT_ENCODER_PATH)
        self.model = None
        self.encoder = None
        self.load_artifacts()

    def load_artifacts(self):
        """Loads serialized model and label encoder from disk."""
        if os.path.exists(self.model_path) and os.path.exists(self.encoder_path):
            try:
                self.model = joblib.load(self.model_path)
                self.encoder = joblib.load(self.encoder_path)
                logger.info(f"Loaded classifier model from [{self.model_path}].")
            except Exception as e:
                logger.error(f"Failed to load model artifacts: {e}")
        else:
            logger.warning(
                f"Model artifacts not found at [{self.model_path}]. "
                "Running training routine to generate artifacts..."
            )
            from ml.train_model import train_classifier
            self.model, self.encoder, _ = train_classifier()

    def predict_detections(self, enriched_df: pd.DataFrame) -> pd.DataFrame:
        """
        Runs multi-class inference on an enriched detections DataFrame.
        Attaches:
        - label: string class name
        - confidence: float (0.0 to 1.0)
        - severity: 'critical' | 'warning' | 'info'
        - is_anomaly: bool
        - shap_explanation: dict
        """
        if enriched_df.empty:
            return enriched_df

        df = enriched_df.copy()
        X = FeatureExtractor.extract_features(df)

        probs = self.model.predict_proba(X)
        pred_indices = np.argmax(probs, axis=1)
        confidences = np.max(probs, axis=1)

        predicted_labels = self.encoder.inverse_transform(pred_indices)

        severities: List[str] = []
        is_anomalies: List[bool] = []
        explanations = ExplainabilityEngine.batch_generate_explanations(
            model=self.model,
            X=X,
            df=df,
            predicted_labels=predicted_labels,
            pred_indices=pred_indices,
            confidences=confidences,
            class_names=self.encoder.classes_.tolist(),
        )

        for idx, (_, row) in enumerate(df.iterrows()):
            label = predicted_labels[idx]

            # Determine severity
            if label == "industrial_fire":
                severity = "critical"
                is_anomaly = True
            elif label in ("unregistered_anomaly", "wildfire"):
                severity = "warning"
                is_anomaly = True
            else:
                severity = "info"
                is_anomaly = False

            severities.append(severity)
            is_anomalies.append(is_anomaly)

        df["label"] = predicted_labels
        df["confidence"] = [round(float(c), 4) for c in confidences]
        df["severity"] = severities
        df["is_anomaly"] = is_anomalies
        df["shap_explanation"] = explanations

        logger.info(f"Classified {len(df)} detections. Distribution:\n{df['label'].value_counts().to_dict()}")
        return df


if __name__ == "__main__":
    service = ClassifierService()
    # Test with sample input
    sample_df = pd.DataFrame([{
        "latitude": 21.7125,
        "longitude": 72.5833,
        "brightness_temp": 385.2,
        "frp": 165.8,
        "confidence": "high",
        "on_known_site": 1,
        "site_name": "Dahej Chemical Complex",
        "site_type": "chemical",
        "land_cover_type": "industrial",
        "persistence_count": 2,
        "deviation_score": 4.5,
        "distance_to_site_km": 0.0,
        "detected_at": "2026-09-08 22:00:00+00:00",
    }])

    res = service.predict_detections(sample_df)
    print("\nInference Output:")
    print(res[["label", "confidence", "severity", "is_anomaly"]].to_string())
    print("\nExplainability Summary:")
    print(res.loc[0, "shap_explanation"])
