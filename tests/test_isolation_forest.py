"""
Unit Tests for Isolation Forest Unsupervised Anomaly Detection Engine
"""

import pytest
import pandas as pd
import numpy as np
from ml.isolation_forest import IsolationForestService, iforest_service
from ml.predict import ClassifierService


def test_iforest_initialization_and_scoring():
    """Ensure Isolation Forest model is loaded and returns bounded anomaly scores."""
    service = IsolationForestService()
    assert service.model is not None

    sample_df = pd.DataFrame([
        {
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
            "deviation_score": 4.8,
            "distance_to_site_km": 0.0,
            "detected_at": "2026-09-08 22:00:00+00:00",
        },
        {
            "latitude": 21.1067,
            "longitude": 72.6453,
            "brightness_temp": 328.0,
            "frp": 5.0,
            "confidence": "nominal",
            "on_known_site": 1,
            "site_name": "Hazira Petrochemical Manufacturing Hub",
            "site_type": "steel",
            "land_cover_type": "industrial",
            "persistence_count": 20,
            "deviation_score": -2.0,
            "distance_to_site_km": 0.0,
            "detected_at": "2026-09-08 22:00:00+00:00",
        },
    ])

    scores, outliers = service.score_detections(sample_df)

    assert len(scores) == 2
    assert all(0.0 <= s <= 1.0 for s in scores)
    # The high-intensity disaster should score significantly higher than routine flaring
    assert scores[0] > scores[1]
    assert scores[0] >= 0.65
    assert bool(outliers[0]) is True


def test_dual_engine_consensus_evaluation():
    """Test dual-engine synthesis logic across hazard scenarios."""
    # Scenario 1: Consensus Hazard
    res1 = IsolationForestService.evaluate_dual_engine(
        supervised_label="industrial_fire",
        supervised_confidence=0.942,
        isolation_score=0.88,
    )
    assert res1["dual_engine_status"] == "VERIFIED_CRITICAL_HAZARD"
    assert res1["priority"] == "P1_CRITICAL"

    # Scenario 2: Routine flaring consensus
    res2 = IsolationForestService.evaluate_dual_engine(
        supervised_label="normal_flare",
        supervised_confidence=0.985,
        isolation_score=0.35,
    )
    assert res2["dual_engine_status"] == "VERIFIED_ROUTINE_OPERATION"
    assert res2["priority"] == "P4_INFO"

    # Scenario 3: Operational deviation alert (flaring exceeding safe envelope)
    res3 = IsolationForestService.evaluate_dual_engine(
        supervised_label="normal_flare",
        supervised_confidence=0.72,
        isolation_score=0.74,
    )
    assert res3["dual_engine_status"] == "OPERATIONAL_DEVIATION_ALERT"
    assert res3["priority"] == "P2_WARNING"

    # Scenario 4: Unknown-unknown novelty alert
    res4 = IsolationForestService.evaluate_dual_engine(
        supervised_label="unregistered_anomaly",
        supervised_confidence=0.60,
        isolation_score=0.86,
    )
    assert res4["dual_engine_status"] in ("UNKNOWN_UNKNOWN_NOVELTY", "ANOMALOUS_THERMAL_SURGE")


def test_classifier_service_integration():
    """Verify ClassifierService attaches Isolation Forest attributes to prediction DataFrame."""
    classifier = ClassifierService()
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
        "deviation_score": 4.8,
        "distance_to_site_km": 0.0,
        "detected_at": "2026-09-08 22:00:00+00:00",
    }])

    result_df = classifier.predict_detections(sample_df)

    assert "isolation_anomaly_score" in result_df.columns
    assert "is_isolation_outlier" in result_df.columns
    assert "dual_engine_status" in result_df.columns

    score = result_df.loc[0, "isolation_anomaly_score"]
    assert 0.0 <= score <= 1.0
    assert bool(result_df.loc[0, "is_isolation_outlier"]) is True
