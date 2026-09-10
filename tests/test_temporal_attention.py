"""
Unit & Integration Tests for Attention-Based Temporal Sequence Model (1D-CNN + Self-Attention)
NTRO Industrial Fire Intelligence System — Section 5.3 Out-of-the-Box AI
"""

import pytest
import numpy as np
import pandas as pd
from ml.temporal_attention import TemporalAttentionService, temporal_attention_service
from ml.predict import ClassifierService


@pytest.fixture(scope="module")
def temporal_svc():
    return TemporalAttentionService(seed=99)


@pytest.fixture(scope="module")
def classifier():
    return ClassifierService()


def test_1d_conv_and_attention_shapes(temporal_svc):
    """
    Verify 1D temporal convolution maintains sequence length,
    scaled dot-product attention produces a valid stochastic attention matrix,
    and pooled attention weights normalize to 1.0.
    """
    T = 14
    # Feature matrix: (T, 3) -> [norm_frp, norm_z, norm_delta]
    synth_input = np.ones((T, 3), dtype=np.float64) * 0.5

    C = temporal_svc.conv1d_forward(synth_input)
    assert C.shape == (T, temporal_svc.HIDDEN_DIM)
    assert np.all(C >= 0.0)  # ReLU activation

    context, A, alpha_weights = temporal_svc.scaled_dot_product_attention(C)
    assert context.shape == (T, temporal_svc.HIDDEN_DIM)
    assert A.shape == (T, T)
    assert alpha_weights.shape == (T,)

    # Attention rows must sum to 1.0 (valid probability distribution)
    np.testing.assert_allclose(np.sum(A, axis=-1), np.ones(T), rtol=1e-5)
    # Pooled attention weights must sum to 1.0
    assert abs(float(np.sum(alpha_weights)) - 1.0) < 1e-5


def test_stationary_flat_flaring_profile(temporal_svc):
    """
    Verify that a steady operational flaring sequence (e.g. Reliance Jamnagar at 38-42 MW)
    is accurately classified as STATIONARY_FLAT_FLARING with high stability.
    """
    flaring_history = [40.0, 41.5, 39.0, 40.5, 42.0, 39.5, 41.0, 40.0, 38.5, 42.0, 41.0, 39.5, 40.5, 40.0]
    res = temporal_svc.evaluate_sequence(flaring_history)

    assert res["temporal_signature_label"] == "STATIONARY_FLAT_FLARING"
    assert res["temporal_stability_index"] >= 0.85
    assert res["temporal_profile_confidence"] >= 0.85
    assert res["temporal_window_size"] == 14
    assert len(res["temporal_attention_weights"]) == 14


def test_acute_spike_decay_profile(temporal_svc):
    """
    Verify that a catastrophic explosion and rapid decay sequence (e.g. Dahej Chemical BLEVE)
    is classified as ACUTE_SPIKE_DECAY, and self-attention focuses on the peak blast pass.
    """
    blast_history = [5.0, 6.0, 5.5, 4.8, 6.2, 5.0, 5.5, 192.6, 45.0, 18.0, 8.0, 6.5, 5.0, 5.2]
    res = temporal_svc.evaluate_sequence(blast_history)

    assert res["temporal_signature_label"] == "ACUTE_SPIKE_DECAY"
    assert res["temporal_stability_index"] < 0.50
    assert res["temporal_profile_confidence"] >= 0.80
    assert res["temporal_window_size"] == 14


def test_progressive_exponential_runaway_profile(temporal_svc):
    """
    Verify that an accelerating heating sequence (e.g. runaway reactor, smoldering coal)
    is classified as PROGRESSIVE_EXPONENTIAL_RISE.
    """
    runaway_history = [12.0, 14.0, 15.0, 18.0, 24.0, 35.0, 55.0, 92.0, 160.0]
    res = temporal_svc.evaluate_sequence(runaway_history)

    assert res["temporal_signature_label"] == "PROGRESSIVE_EXPONENTIAL_RISE"
    assert res["temporal_profile_confidence"] >= 0.80
    assert res["temporal_window_size"] == 9


def test_episodic_burst_profile(temporal_svc):
    """
    Verify that zero-heavy, intermittent burning sequences (e.g. seasonal stubble clearing)
    are classified as EPISODIC_BURST.
    """
    stubble_history = [0.0, 0.0, 0.0, 48.0, 55.0, 0.0, 0.0, 0.0, 0.0, 65.0, 0.0, 0.0, 0.0, 0.0]
    res = temporal_svc.evaluate_sequence(stubble_history)

    assert res["temporal_signature_label"] == "EPISODIC_BURST"
    assert res["temporal_profile_confidence"] >= 0.70


def test_classifier_service_temporal_integration(classifier):
    """
    End-to-end integration: Verify ClassifierService populates temporal attention
    metrics in output DataFrame and explainability dictionary.
    """
    sample_df = pd.DataFrame([
        {
            "latitude": 22.3550,
            "longitude": 69.8660,
            "brightness_temp": 345.0,
            "frp": 40.0,
            "confidence": "high",
            "on_known_site": 1,
            "site_name": "Reliance Jamnagar Refinery",
            "site_type": "refinery",
            "land_cover_type": "industrial",
            "persistence_count": 140,
            "deviation_score": 0.2,
            "distance_to_site_km": 0.0,
            "detected_at": "2020-06-03 08:30:00+00:00",
        },
        {
            "latitude": 21.7061,
            "longitude": 72.5925,
            "brightness_temp": 395.0,
            "frp": 192.6,
            "confidence": "high",
            "on_known_site": 1,
            "site_name": "Dahej PCPIR Complex",
            "site_type": "chemical",
            "land_cover_type": "industrial",
            "persistence_count": 4,
            "deviation_score": 5.9,
            "distance_to_site_km": 0.0,
            "detected_at": "2020-06-03 08:30:00+00:00",
        },
    ])

    res = classifier.predict_detections(sample_df)

    # Verify temporal attention columns exist
    expected_cols = [
        "temporal_signature_label",
        "temporal_attention_peak_pass",
        "temporal_stability_index",
        "temporal_profile_confidence",
    ]
    for col in expected_cols:
        assert col in res.columns, f"Missing temporal column {col} in output DataFrame"

    # Check Jamnagar flaring signature
    jamnagar = res.iloc[0]
    assert jamnagar["temporal_signature_label"] == "STATIONARY_FLAT_FLARING"
    assert jamnagar["temporal_stability_index"] >= 0.85

    # Check Dahej acute explosion signature
    dahej = res.iloc[1]
    assert dahej["temporal_signature_label"] == "ACUTE_SPIKE_DECAY"

    # Check Explainability synthesis
    expl = dahej["shap_explanation"]
    assert "Temporal Attention" in " ".join(expl["primary_factors"])
    assert "temporal_signature_label" in expl["metrics"]
    assert expl["metrics"]["temporal_signature_label"] == "ACUTE_SPIKE_DECAY"
