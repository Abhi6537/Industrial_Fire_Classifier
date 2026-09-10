"""
Unit Tests for Conformal Prediction Uncertainty Engine
NTRO Industrial Fire Intelligence System (P3.1 Milestone)
"""

import pytest
import numpy as np
import pandas as pd
from ml.conformal import ConformalPredictor, conformal_service
from ml.predict import ClassifierService
from api.models.event import ClassifiedEventResponse


@pytest.fixture(scope="module")
def classifier():
    return ClassifierService()


def test_conformal_calibrator_initialization():
    """Verify calibrator loads quantiles and classes properly."""
    assert conformal_service.is_calibrated is True
    assert len(conformal_service.classes) >= 6
    assert 0.10 in conformal_service.quantiles
    assert 0.05 in conformal_service.quantiles

    # Higher confidence (lower alpha = 0.05) must have larger or equal nonconformity quantile
    assert conformal_service.quantiles[0.05] >= conformal_service.quantiles[0.10]
    assert conformal_service.n_calibration_samples > 0


def test_conformal_single_class_high_confidence():
    """
    A dominant class probability (e.g. 0.90) should yield an unambiguous singleton set
    at 90% confidence level.
    """
    classes = conformal_service.classes
    # Create probability vector strongly favoring 'normal_flare'
    flare_idx = classes.index("normal_flare")
    probs = np.zeros(len(classes))
    probs[flare_idx] = 0.92
    rem = (1.0 - 0.92) / (len(classes) - 1)
    for i in range(len(classes)):
        if i != flare_idx:
            probs[i] = rem

    res = conformal_service.predict_set(probs, alpha=0.10)
    assert res["is_conformal_single_class"] is True
    assert res["is_conformal_ambiguous"] is False
    assert res["conformal_set_size"] == 1
    assert res["conformal_prediction_set"] == ["normal_flare"]
    assert res["conformal_confidence_level"] == 0.90


def test_conformal_ambiguous_borderline_case():
    """
    When the model is split between two hypotheses (e.g. 48% industrial_fire, 46% normal_flare),
    conformal prediction must include BOTH in the uncertainty set to prevent missed disasters.
    """
    classes = conformal_service.classes
    ind_idx = classes.index("industrial_fire")
    flare_idx = classes.index("normal_flare")

    probs = np.full(len(classes), 0.01)
    probs[ind_idx] = 0.48
    probs[flare_idx] = 0.46
    probs = probs / probs.sum()

    res = conformal_service.predict_set(probs, alpha=0.10)
    assert res["is_conformal_ambiguous"] is True
    assert res["is_conformal_single_class"] is False
    assert res["conformal_set_size"] >= 2
    assert "industrial_fire" in res["conformal_prediction_set"]
    assert "normal_flare" in res["conformal_prediction_set"]


def test_empirical_coverage_finite_sample_guarantee():
    """
    Verify that empirical coverage on calibration split satisfies P(Y in C(X)) >= 1 - alpha.
    """
    for alpha in [0.05, 0.10, 0.20]:
        measured_cov = conformal_service.empirical_coverage.get(alpha)
        if measured_cov is not None:
            # Finite-sample guarantee holds: measured coverage must be close to or exceed target 1 - alpha
            target_cov = 1.0 - alpha
            assert measured_cov >= target_cov - 0.02, (
                f"Empirical coverage {measured_cov} significantly below target {target_cov} for alpha={alpha}"
            )


def test_classifier_service_integration(classifier):
    """
    Verify that ClassifierService.predict_detections() attaches conformal set telemetry
    and serializes cleanly through ClassifiedEventResponse schema.
    """
    test_df = pd.DataFrame([
        {
            "latitude": 22.355,
            "longitude": 69.866,
            "frp": 42.1,
            "brightness_temp": 345.0,
            "confidence": 95,
            "persistence_count": 4,
            "deviation_score": 0.2,
            "hour_of_day": 20,
            "day_of_week": 1,
            "is_first_detection": 0,
            "on_known_site": 1,
            "site_name": "Reliance Jamnagar Refinery",
            "site_type": "refinery",
            "land_cover_type": "industrial",
            "distance_to_nearest_facility_km": 0.05,
        },
        {
            "latitude": 21.706,
            "longitude": 72.592,
            "frp": 192.6,
            "brightness_temp": 426.5,
            "confidence": 100,
            "persistence_count": 1,
            "deviation_score": 5.9,
            "hour_of_day": 8,
            "day_of_week": 3,
            "is_first_detection": 0,
            "on_known_site": 1,
            "site_name": "Dahej Chemical Complex",
            "site_type": "chemical_plant",
            "land_cover_type": "industrial",
            "distance_to_nearest_facility_km": 0.1,
        }
    ])

    results = classifier.predict_detections(test_df)
    assert "conformal_prediction_set" in results.columns
    assert "conformal_confidence_level" in results.columns
    assert "conformal_set_size" in results.columns
    assert "is_conformal_single_class" in results.columns
    assert "is_conformal_ambiguous" in results.columns

    # Verify Dahej has industrial_fire in its conformal set
    dahej_row = results.iloc[1]
    assert "industrial_fire" in dahej_row["conformal_prediction_set"]

    # Verify Pydantic validation
    event_dict = dahej_row.to_dict()
    event_dict["id"] = "test-conformal-event-01"
    response_model = ClassifiedEventResponse(**event_dict)
    assert response_model.conformal_confidence_level == 0.90
    assert len(response_model.conformal_prediction_set) >= 1
