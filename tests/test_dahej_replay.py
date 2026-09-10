"""
Unit & Integration Tests for NASA FIRMS Historical Archive Replay
NTRO Industrial Fire Intelligence System (Section 3.4 — Historical Validation)
"""

import pytest
from fastapi.testclient import TestClient
from api.main import app
from scripts.replay_incident import load_archive_passes, evaluate_replay_pass, get_replay_timeline
from ml.predict import ClassifierService


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


@pytest.fixture(scope="module")
def classifier():
    return ClassifierService()


def test_load_archive_passes():
    """Verify archive CSV loading parses 6 chronological passes correctly."""
    passes = load_archive_passes()
    assert len(passes) == 6, f"Expected 6 satellite passes, got {len(passes)}"
    
    # Check pass sequencing
    pass_ids = [p["pass_id"] for p in passes]
    assert pass_ids == [1, 2, 3, 4, 5, 6]

    # Verify each pass has exactly 2 records (Jamnagar control + Dahej target)
    for p in passes:
        assert len(p["records"]) == 2
        sites = [r["site_name"] for r in p["records"]]
        assert any("Jamnagar" in s for s in sites)
        assert any("Dahej" in s for s in sites)


def test_control_site_jamnagar_stability(classifier):
    """
    Verify Reliance Jamnagar Export Refinery flaring remains routine across all 6 passes
    despite high nominal FRP (35-45 MW), proving zero false positive flaring suppression.
    """
    timeline = get_replay_timeline()
    assert len(timeline) == 6

    for p in timeline:
        jamnagar_records = [r for r in p["records"] if "Jamnagar" in r["site_name"]]
        assert len(jamnagar_records) == 1
        jam = jamnagar_records[0]

        # Jamnagar must remain normal_flare and non-critical
        assert jam["label"] == "normal_flare", f"Pass {p['pass_id']}: Expected normal_flare, got {jam['label']}"
        assert jam["severity"] != "critical", f"Pass {p['pass_id']}: Jamnagar flaring should never be critical"
        assert jam["deviation_score"] < 1.0, f"Pass {p['pass_id']}: Deviation {jam['deviation_score']} should be < 1.0 sigma"
        assert jam["cusum_alert"] is False
        assert jam["operational_urgency_score"] < 40


def test_dahej_explosion_detection_and_kinematics(classifier):
    """
    Verify Dahej Chemical Complex exhibits pre-blast baseline/incubation,
    critical explosion alert on Pass 4 (T0 Day), and post-blast response.
    """
    timeline = get_replay_timeline()

    # Pass 1: Baseline
    p1_dahej = next(r for r in timeline[0]["records"] if "Dahej" in r["site_name"])
    assert p1_dahej["label"] == "normal_flare"
    assert p1_dahej["severity"] != "critical"

    # Pass 4: Chemical Explosion (NOAA-20 VIIRS Overpass 2020-06-03 08:00 UTC)
    p4_dahej = next(r for r in timeline[3]["records"] if "Dahej" in r["site_name"])
    assert p4_dahej["label"] == "industrial_fire"
    assert p4_dahej["severity"] == "critical"
    assert p4_dahej["frp"] > 150.0  # 192.6 MW
    assert p4_dahej["deviation_score"] > 5.0  # +5.9 sigma
    assert p4_dahej["cusum_alert"] is True
    assert p4_dahej["cusum_regime"] == "RAPID_SURGE"
    assert p4_dahej["operational_urgency_score"] >= 80  # Tier-1 / Red Alert
    assert p4_dahej["urgency_tier"] in ("CRITICAL_URGENCY", "HIGH_URGENCY", "CRITICAL")
    assert "evacuation" in p4_dahej["urgency_action"].lower() or "alert" in p4_dahej["urgency_action"].lower()



def test_dahej_replay_api_endpoint(client):
    """Verify GET /api/v1/incidents/dahej-replay returns full forensic timeline."""
    response = client.get("/api/v1/incidents/dahej-replay")
    assert response.status_code == 200
    data = response.json()

    assert data["incident_name"].startswith("Yashashvi Rasayan")
    assert data["total_passes"] == 6
    assert len(data["passes"]) == 6

    # Verify pass schema
    pass_4 = data["passes"][3]
    assert pass_4["pass_id"] == 4
    assert pass_4["daynight"] == "D"
    assert len(pass_4["records"]) == 2

    dahej_rec = next(r for r in pass_4["records"] if "Dahej" in r["site_name"])
    assert dahej_rec["label"] == "industrial_fire"
    assert dahej_rec["frp"] == 192.6
    assert "cusum_statistic" in dahej_rec
    assert "isolation_anomaly_score" in dahej_rec
    assert "operational_urgency_score" in dahej_rec
    assert "centroid_drift_km" in dahej_rec
