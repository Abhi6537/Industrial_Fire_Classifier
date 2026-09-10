import pytest
import numpy as np
from ingestion.cusum_detector import CUSUMEngine, cusum_engine
from api.database import db
from api.models.event import ClassifiedEventResponse


def test_cusum_gradual_accumulation():
    """
    Test gradual thermal drift (+1.0 to +1.5 sigma):
    Single-pass Z-score stays under 3.0 (which would evade single-pass thresholds),
    but tabular CUSUM steadily accumulates past decision interval h=4.0.
    """
    engine = CUSUMEngine(k=0.5, h=4.0)

    # Baseline: mean 10.0 MW, std 2.0 MW
    # Gradual slow-onset progression: 12.0, 12.5, 13.0, 13.5, 14.0 MW
    # Corresponding z-scores: +1.0, +1.25, +1.5, +1.75, +2.0
    series = [12.0, 12.5, 13.0, 13.5, 14.0]
    result = engine.evaluate_series(
        values=series,
        baseline_mean=10.0,
        baseline_std=2.0,
    )

    # Verify single pass max z-score is only 2.0
    assert max(result["z_scores"]) <= 2.0

    # Verify CUSUM statistic steadily accumulated
    # z - 0.5: [0.5, 0.75, 1.0, 1.25, 1.5] -> S+: 0.5, 1.25, 2.25, 3.5, 5.0
    assert result["s_pos"][-1] == 5.0
    assert result["cusum_statistic"] == 5.0
    assert result["cusum_alert"] is True
    assert result["cusum_regime"] == "SLOW_ONSET_HEATING"
    assert result["run_length"] == 5
    assert result["change_point_index"] == 0


def test_cusum_baseline_stationary_noise():
    """
    Test stationary baseline with standard ambient noise:
    S+ and S- remain 0.0 because fluctuations are absorbed by slack k=0.5.
    """
    engine = CUSUMEngine(k=0.5, h=4.0)

    # Fluctuations around 10.0 MW within 0.5 sigma (9.5 to 10.5 MW)
    series = [10.2, 9.8, 10.4, 9.7, 10.1, 10.0]
    result = engine.evaluate_series(
        values=series,
        baseline_mean=10.0,
        baseline_std=2.0,
    )

    assert result["cusum_alert"] is False
    assert result["s_pos"][-1] == 0.0
    assert result["s_neg"][-1] == 0.0
    assert result["cusum_regime"] == "STABLE_BASELINE"
    assert result["run_length"] == 0
    assert result["change_point_index"] is None


def test_cusum_flameout_detection():
    """
    Test persistent drop in thermal energy:
    Detects flare pilot flameout or unexpected emergency facility shutdown (S- >= 4.0).
    """
    engine = CUSUMEngine(k=0.5, h=4.0)

    # Normal flare running at 20.0 MW (std=2.0). Drop to 14.0, 13.0, 12.0, 11.0 MW
    # z-scores: -3.0, -3.5, -4.0, -4.5
    series = [14.0, 13.0, 12.0, 11.0]
    result = engine.evaluate_series(
        values=series,
        baseline_mean=20.0,
        baseline_std=2.0,
    )

    assert result["s_neg"][-1] >= 4.0
    assert result["cusum_regime"] == "FLAMEOUT_SHUTDOWN"
    assert result["cusum_alert"] is True


def test_cusum_rapid_surge():
    """
    Test rapid catastrophic surge:
    Large single-pass jump with z-score >= 3.0 immediately classified as RAPID_SURGE.
    """
    engine = CUSUMEngine(k=0.5, h=4.0)

    # Baseline 10.0 MW, jumps to 50.0 MW (z-score = 20.0)
    series = [10.0, 10.5, 50.0]
    result = engine.evaluate_series(
        values=series,
        baseline_mean=10.0,
        baseline_std=2.0,
    )

    assert result["cusum_alert"] is True
    assert result["cusum_regime"] == "RAPID_SURGE"
    assert result["s_pos"][-1] > 4.0


def test_cusum_event_evaluation_and_database_integration():
    """
    Verify evaluate_event resolves proper fields and database mock events
    contain fully enriched CUSUM metrics conforming to ClassifiedEventResponse.
    """
    event = {
        "id": "test_event_1",
        "frp": 165.8,
        "deviation_score": 4.8,
        "predicted_label": "industrial_fire",
    }
    evaluated = cusum_engine.evaluate_event(event)

    assert "cusum_statistic" in evaluated
    assert "cusum_alert" in evaluated
    assert "cusum_regime" in evaluated
    assert "cusum_run_length" in evaluated
    assert evaluated["cusum_alert"] is True
    assert evaluated["cusum_regime"] in ("RAPID_SURGE", "SLOW_ONSET_HEATING")

    # Verify API database get_events() and get_event_by_id()
    events = db.get_events()
    assert len(events) >= 1

    for ev in events:
        assert "cusum_statistic" in ev
        assert "cusum_alert" in ev
        assert "cusum_regime" in ev
        assert "cusum_run_length" in ev
        # Schema validation
        resp = ClassifiedEventResponse(**ev)
        assert resp.cusum_statistic is not None
        assert isinstance(resp.cusum_alert, bool)

    # Fetch specific event by its ID
    target_id = events[0]["id"]
    fetched = db.get_event_by_id(target_id)
    assert fetched is not None
    assert fetched["id"] == target_id
    assert "cusum_statistic" in fetched
    assert "cusum_alert" in fetched
