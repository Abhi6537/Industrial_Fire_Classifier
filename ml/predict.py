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
from ml.isolation_forest import iforest_service, IsolationForestService
from ml.conformal import conformal_service
from ingestion.evidential_fusion import fusion_engine
from ml.spatial_gnn import spatial_gnn_service
from ml.temporal_attention import temporal_attention_service

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
        - isolation_anomaly_score, is_isolation_outlier, dual_engine_status
        - conformal_prediction_set, conformal_confidence_level, conformal_set_size,
          is_conformal_single_class, is_conformal_ambiguous
        - fused_hazard_probability, fused_flare_probability, belief_fire,
          plausibility_fire, sensor_conflict_k, fusion_verdict
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

        # Unsupervised Isolation Forest Anomaly Scoring (Engine B)
        isolation_scores, is_outliers = iforest_service.score_detections(X)

        # Conformal Prediction Uncertainty Sets (P3.1 Milestone)
        conformal_res = conformal_service.batch_predict_sets(probs, alpha=0.10)
        df["conformal_prediction_set"] = conformal_res["conformal_prediction_set"]
        df["conformal_confidence_level"] = conformal_res["conformal_confidence_level"]
        df["conformal_set_size"] = conformal_res["conformal_set_size"]
        df["is_conformal_single_class"] = conformal_res["is_conformal_single_class"]
        df["is_conformal_ambiguous"] = conformal_res["is_conformal_ambiguous"]

        dual_statuses: List[str] = []
        for idx in range(len(df)):
            eval_res = IsolationForestService.evaluate_dual_engine(
                supervised_label=str(predicted_labels[idx]),
                supervised_confidence=float(confidences[idx]),
                isolation_score=float(isolation_scores[idx]),
            )
            status_val = eval_res["dual_engine_status"]

            # Mission-Critical Triage: If conformal set is ambiguous and contains industrial_fire, flag it
            conf_set = conformal_res["conformal_prediction_set"][idx]
            is_ambig = conformal_res["is_conformal_ambiguous"][idx]
            if is_ambig and "industrial_fire" in conf_set and predicted_labels[idx] != "industrial_fire":
                if status_val == "VERIFIED_ROUTINE_OPERATION":
                    status_val = "CONFORMAL_AMBIGUOUS_HAZARD"

            dual_statuses.append(status_val)

        df["isolation_anomaly_score"] = isolation_scores
        df["is_isolation_outlier"] = is_outliers
        df["dual_engine_status"] = dual_statuses

        # Multi-Sensor Evidential Fusion (P3.2 Milestone)
        fused_hazard_probs: List[float] = []
        fused_flare_probs: List[float] = []
        beliefs_fire: List[float] = []
        plausibilities_fire: List[float] = []
        sensor_conflicts_k: List[float] = []
        fusion_verdicts: List[str] = []

        for idx, (_, row) in enumerate(df.iterrows()):
            fusion_input = row.to_dict()
            fusion_res = fusion_engine.evaluate_event(fusion_input)
            fused_hazard_probs.append(fusion_res["fused_hazard_probability"])
            fused_flare_probs.append(fusion_res["fused_flare_probability"])
            beliefs_fire.append(fusion_res["belief_fire"])
            plausibilities_fire.append(fusion_res["plausibility_fire"])
            sensor_conflicts_k.append(fusion_res["sensor_conflict_k"])
            fusion_verdicts.append(fusion_res["fusion_verdict"])

        df["fused_hazard_probability"] = fused_hazard_probs
        df["fused_flare_probability"] = fused_flare_probs
        df["belief_fire"] = beliefs_fire
        df["plausibility_fire"] = plausibilities_fire
        df["sensor_conflict_k"] = sensor_conflicts_k
        df["fusion_verdict"] = fusion_verdicts

        # Spatial Graph Neural Network (P5.2 Milestone)
        hotspot_records = df.to_dict(orient="records")
        gnn_cluster_ids: List[str] = []
        gnn_cluster_sizes: List[int] = []
        gnn_morphologies: List[str] = []
        gnn_densities: List[float] = []
        gnn_clusterings: List[float] = []
        gnn_elongations: List[float] = []
        gnn_ind_probs: List[float] = []
        gnn_wf_probs: List[float] = []

        for idx in range(len(df)):
            gnn_res = spatial_gnn_service.analyze_hotspot_graph(hotspot_records, target_index=idx)
            gnn_cluster_ids.append(gnn_res["gnn_cluster_id"])
            gnn_cluster_sizes.append(gnn_res["gnn_cluster_size"])
            gnn_morphologies.append(gnn_res["gnn_cluster_morphology"])
            gnn_densities.append(gnn_res["gnn_graph_density"])
            gnn_clusterings.append(gnn_res["gnn_clustering_coefficient"])
            gnn_elongations.append(gnn_res["gnn_spatial_elongation"])
            gnn_ind_probs.append(gnn_res["gnn_industrial_topology_prob"])
            gnn_wf_probs.append(gnn_res["gnn_wildfire_topology_prob"])

        df["gnn_cluster_id"] = gnn_cluster_ids
        df["gnn_cluster_size"] = gnn_cluster_sizes
        df["gnn_cluster_morphology"] = gnn_morphologies
        df["gnn_graph_density"] = gnn_densities
        df["gnn_clustering_coefficient"] = gnn_clusterings
        df["gnn_spatial_elongation"] = gnn_elongations
        df["gnn_industrial_topology_prob"] = gnn_ind_probs
        df["gnn_wildfire_topology_prob"] = gnn_wf_probs

        # Attention-Based Temporal Sequence Model (P5.3 Milestone)
        temp_labels: List[str] = []
        temp_peaks: List[int] = []
        temp_stabilities: List[float] = []
        temp_confs: List[float] = []

        for idx, (_, row) in enumerate(df.iterrows()):
            t_res = temporal_attention_service.evaluate_event(row.to_dict())
            temp_labels.append(t_res["temporal_signature_label"])
            temp_peaks.append(t_res["temporal_attention_peak_pass"])
            temp_stabilities.append(t_res["temporal_stability_index"])
            temp_confs.append(t_res["temporal_profile_confidence"])

        df["temporal_signature_label"] = temp_labels
        df["temporal_attention_peak_pass"] = temp_peaks
        df["temporal_stability_index"] = temp_stabilities
        df["temporal_profile_confidence"] = temp_confs

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
            conf_set = conformal_res["conformal_prediction_set"][idx]
            is_ambig = conformal_res["is_conformal_ambiguous"][idx]

            # Determine severity
            if label == "industrial_fire":
                severity = "critical"
                is_anomaly = True
            elif label in ("unregistered_anomaly", "wildfire"):
                severity = "warning"
                is_anomaly = True
            elif is_outliers[idx]:
                # If Isolation Forest identifies an extreme structural outlier on known site
                severity = "warning"
                is_anomaly = True
            elif is_ambig and "industrial_fire" in conf_set:
                # Conformal set cannot statistically exclude industrial fire at 90% confidence
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
