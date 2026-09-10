"""
Unit Tests for Multi-Temporal Spread & Centroid Drift Kinematics Engine
"""

from datetime import datetime, timedelta, timezone
import pytest

from ingestion.temporal_spread import (
    TemporalSpreadEngine,
    haversine_km,
    calculate_bearing_degrees,
    bearing_to_cardinal,
)


def test_haversine_accuracy():
    # Mumbai (19.0760, 72.8777) to Surat (21.1702, 72.8311) approx 233 km
    dist = haversine_km(19.0760, 72.8777, 21.1702, 72.8311)
    assert 225.0 < dist < 240.0


def test_calculate_bearing():
    # Due North: lat increases, lon constant
    bearing = calculate_bearing_degrees(20.0, 70.0, 21.0, 70.0)
    assert bearing == 0.0 or bearing == 360.0 or abs(bearing) < 1.0

    # Due East: lat constant, lon increases
    bearing_east = calculate_bearing_degrees(20.0, 70.0, 20.0, 71.0)
    assert 89.0 < bearing_east < 91.0
    assert bearing_to_cardinal(bearing_east) == "E"


def test_stationary_refinery_flare():
    engine = TemporalSpreadEngine(spatial_cluster_radius_km=3.5, max_temporal_window_hours=48.0)
    base_time = datetime(2026, 9, 10, 14, 0, 0, tzinfo=timezone.utc)

    # Prior pass 12 hours ago at Jamnagar
    priors = [{
        "latitude": 22.3550,
        "longitude": 69.8660,
        "frp": 42.0,
        "detected_at": base_time - timedelta(hours=12),
    }]

    # Current pass: minor sensor jitter (0.0001 deg ~ 11 meters)
    res = engine.compute_kinematics(
        current_lat=22.3551,
        current_lon=69.8661,
        current_frp=43.5,
        current_time=base_time,
        prior_observations=priors,
    )

    assert res["spread_classification"] == "stationary"
    assert res["centroid_drift_km"] < 0.1
    assert res["spread_velocity_kmph"] < 0.05


def test_expanding_industrial_fire():
    engine = TemporalSpreadEngine(spatial_cluster_radius_km=3.5, max_temporal_window_hours=48.0)
    base_time = datetime(2026, 9, 10, 14, 0, 0, tzinfo=timezone.utc)

    # Prior pass 2.5 hours ago: routine 30 MW
    priors = [{
        "latitude": 21.7120,
        "longitude": 72.5830,
        "frp": 30.0,
        "detected_at": base_time - timedelta(hours=2.5),
    }]

    # Current pass: sudden thermal surge to 175 MW (exploding fire)
    res = engine.compute_kinematics(
        current_lat=21.7145,
        current_lon=72.5855,
        current_frp=175.0,
        current_time=base_time,
        prior_observations=priors,
    )

    assert res["spread_classification"] == "expanding"
    assert res["footprint_growth_rate"] > 20.0
    assert res["centroid_drift_km"] > 0.2


def test_migrating_wildfire_sweep():
    engine = TemporalSpreadEngine(spatial_cluster_radius_km=5.0, max_temporal_window_hours=48.0)
    base_time = datetime(2026, 9, 10, 14, 0, 0, tzinfo=timezone.utc)

    # Prior pass 4.0 hours ago
    priors = [{
        "latitude": 21.1500,
        "longitude": 70.8500,
        "frp": 35.0,
        "detected_at": base_time - timedelta(hours=4.0),
    }]

    # Current pass: moved 2.5 km downwind
    res = engine.compute_kinematics(
        current_lat=21.1700,
        current_lon=70.8650,
        current_frp=42.0,
        current_time=base_time,
        prior_observations=priors,
    )

    assert res["spread_classification"] == "migrating"
    assert res["centroid_drift_km"] > 1.5
    assert res["spread_velocity_kmph"] > 0.4
