"""
Unit & Integration Tests for Dempster-Shafer Multi-Sensor Evidential Fusion Engine
NTRO Industrial Fire Intelligence System (P3.2 Milestone)
"""

import pytest
import numpy as np
import pandas as pd
from ingestion.evidential_fusion import (
    EvidentialMassFunction,
    EvidentialFusionEngine,
    fusion_engine,
)
from ml.predict import ClassifierService
from api.models.event import ClassifiedEventResponse


@pytest.fixture(scope="module")
def classifier():
    return ClassifierService()


def test_evidential_mass_function_properties():
    """Verify basic belief assignment axioms: sum(m) == 1, Bel <= BetP <= Pl."""
    bba = EvidentialMassFunction({
        ("FIRE",): 0.60,
        ("FIRE", "FLARE"): 0.30,
        ("FIRE", "FLARE", "OTHER"): 0.10,
    })

    # Sum of mass
    assert abs(sum(bba.masses.values()) - 1.0) < 1e-6

    # Bel and Pl bounds
    bel_fire = bba.belief("FIRE")
    pl_fire = bba.plausibility("FIRE")
    pignistic = bba.pignistic_probabilities()

    assert abs(bel_fire - 0.60) < 1e-6
    assert abs(pl_fire - 1.0) < 1e-6
    assert bel_fire <= pignistic["FIRE"] <= pl_fire
    assert abs(sum(pignistic.values()) - 1.0) < 1e-4


def test_dempster_combination_consensus():
    """
    When two independent sensors both provide mass for FIRE,
    their orthogonal sum must reinforce FIRE and exhibit low conflict K.
    """
    m1 = EvidentialMassFunction({
        ("FIRE",): 0.70,
        ("FIRE", "FLARE"): 0.20,
        ("FIRE", "FLARE", "OTHER"): 0.10,
    })
    m2 = EvidentialMassFunction({
        ("FIRE",): 0.65,
        ("FIRE", "OTHER"): 0.25,
        ("FIRE", "FLARE", "OTHER"): 0.10,
    })

    m_combined, conflict_k = EvidentialMassFunction.combine(m1, m2)

    # Combined belief must exceed individual beliefs (evidential reinforcement)
    assert m_combined.belief("FIRE") > 0.70
    # Conflict between agreeing sensors must be small
    assert conflict_k < 0.15


def test_dempster_combination_conflict():
    """
    When one sensor strongly asserts FIRE and another asserts FLARE with no overlap,
    conflict K must be high.
    """
    m_fire = EvidentialMassFunction({
        ("FIRE",): 0.90,
        ("FIRE", "FLARE", "OTHER"): 0.10,
    })
    m_flare = EvidentialMassFunction({
        ("FLARE",): 0.90,
        ("FIRE", "FLARE", "OTHER"): 0.10,
    })

    _, conflict_k = EvidentialMassFunction.combine(m_fire, m_flare)
    assert conflict_k >= 0.80  # Severe inter-sensor dissonance


def test_jamnagar_refinery_flaring_consensus():
    """
    Verify Reliance Jamnagar Export Refinery inputs produce high fused flare probability,
    low conflict K, and VERIFIED_ROUTINE_FLARE verdict.
    """
    jamnagar_input = {
        "deviation_score": 0.2,
        "frp": 42.1,
        "is_known_vnf_flare": True,
        "distance_to_vnf_flare_km": 0.1,
        "esa_worldcover_code": 50,
        "on_known_site": 1,
        "swir_burn_index": 0.15,
        "cusum_statistic": 0.2,
        "cusum_regime": "STABLE_BASELINE",
        "isolation_anomaly_score": 0.35,
        "is_isolation_outlier": False,
    }

    res = fusion_engine.evaluate_event(jamnagar_input)
    assert res["fused_flare_probability"] > 0.85
    assert res["fused_hazard_probability"] < 0.05
    assert res["belief_flare"] > 0.70
    assert res["sensor_conflict_k"] < 0.25
    assert res["fusion_verdict"] == "VERIFIED_ROUTINE_FLARE"


def test_dahej_explosion_consensus():
    """
    Verify Dahej Chemical Disaster inputs produce high fused fire probability,
    high belief, and CONFIRMED_INDUSTRIAL_FIRE verdict.
    """
    dahej_input = {
        "deviation_score": 5.9,
        "frp": 192.6,
        "is_known_vnf_flare": False,
        "distance_to_vnf_flare_km": 12.0,
        "esa_worldcover_code": 50,
        "on_known_site": 1,
        "swir_burn_index": 0.85,
        "cusum_statistic": 7.7,
        "cusum_regime": "RAPID_SURGE",
        "isolation_anomaly_score": 0.87,
        "is_isolation_outlier": True,
    }

    res = fusion_engine.evaluate_event(dahej_input)
    assert res["fused_hazard_probability"] > 0.85
    assert res["belief_fire"] > 0.80
    assert res["fused_flare_probability"] < 0.05
    assert res["fusion_verdict"] == "CONFIRMED_INDUSTRIAL_FIRE"


def test_agricultural_stubble_evidence():
    """
    Verify agricultural cropland terrain (ESA Code 40) steers mass towards OTHER/vegetation.
    """
    farm_input = {
        "deviation_score": 1.2,
        "frp": 25.0,
        "is_known_vnf_flare": False,
        "distance_to_vnf_flare_km": 25.0,
        "esa_worldcover_code": 40,  # Cropland
        "on_known_site": 0,
        "swir_burn_index": 0.30,
        "cusum_statistic": 0.1,
        "cusum_regime": "STABLE_BASELINE",
        "isolation_anomaly_score": 0.20,
        "is_isolation_outlier": False,
    }

    res = fusion_engine.evaluate_event(farm_input)
    assert res["fused_other_probability"] > res["fused_hazard_probability"]
    assert res["fusion_verdict"] in ("SEASONAL_OR_VEGETATION", "AMBIGUOUS_EVIDENTIAL_STATE", "VERIFIED_ROUTINE_FLARE")


def test_classifier_service_integration(classifier):
    """
    Verify ClassifierService.predict_detections attaches fusion attributes
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
            "is_known_vnf_flare": True,
            "distance_to_vnf_flare_km": 0.1,
            "esa_worldcover_code": 50,
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
            "is_known_vnf_flare": False,
            "distance_to_vnf_flare_km": 12.0,
            "esa_worldcover_code": 50,
            "swir_burn_index": 0.85,
            "cusum_statistic": 7.7,
            "cusum_regime": "RAPID_SURGE",
        }
    ])

    results = classifier.predict_detections(test_df)
    assert "fused_hazard_probability" in results.columns
    assert "fused_flare_probability" in results.columns
    assert "belief_fire" in results.columns
    assert "plausibility_fire" in results.columns
    assert "sensor_conflict_k" in results.columns
    assert "fusion_verdict" in results.columns

    # Verify Dahej fusion verdict
    dahej_row = results.iloc[1]
    assert dahej_row["fused_hazard_probability"] > 0.80
    assert dahej_row["fusion_verdict"] == "CONFIRMED_INDUSTRIAL_FIRE"

    # Verify Pydantic serialization
    event_dict = dahej_row.to_dict()
    event_dict["id"] = "test-evidential-event-01"
    response_model = ClassifiedEventResponse(**event_dict)
    assert response_model.fused_hazard_probability > 0.80
    assert response_model.fusion_verdict == "CONFIRMED_INDUSTRIAL_FIRE"
