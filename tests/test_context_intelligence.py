"""
Unit Tests for India Contextual Intelligence, Agro-Burning Calendar & Urgency Engine (Section 4.5)
"""

import pytest
from datetime import datetime, timezone
from ingestion.context_intelligence import (
    ContextIntelligenceService,
    context_engine,
    haversine_distance_km,
)
from api.database import db
from api.models.event import ClassifiedEventResponse


def test_seasonal_calendar_kharif_paddy_window():
    """
    Test Punjab/Haryana Kharif paddy residue burning window (Oct 1 - Nov 30).
    A detection on October 25 in Ludhiana/Punjab must be identified as active stubble season.
    """
    service = ContextIntelligenceService()

    # October 25 (Day of year 298) in Punjab
    oct_date = "2026-10-25T14:30:00+00:00"
    res = service.evaluate_seasonality(latitude=30.9010, longitude=75.8573, detected_at=oct_date)

    assert res["is_stubble_season"] is True
    assert res["seasonal_window"] == "KHARIF_PADDY_STUBBLE_SEASON"
    assert "Kharif Paddy" in res["seasonal_context_label"]
    assert res["in_primary_agro_corridor"] is True


def test_seasonal_calendar_rabi_wheat_window():
    """
    Test Indo-Gangetic Rabi wheat crop harvest window (Apr 1 - May 15).
    """
    service = ContextIntelligenceService()

    apr_date = "2026-04-20T10:00:00+00:00"
    res = service.evaluate_seasonality(latitude=29.6857, longitude=76.9905, detected_at=apr_date)

    assert res["is_stubble_season"] is True
    assert res["seasonal_window"] == "RABI_WHEAT_STUBBLE_SEASON"


def test_seasonal_calendar_off_season():
    """
    Test off-season monsoon period (July) outside agricultural burn windows.
    """
    service = ContextIntelligenceService()

    july_date = "2026-07-15T12:00:00+00:00"
    res = service.evaluate_seasonality(latitude=30.9010, longitude=75.8573, detected_at=july_date)

    assert res["is_stubble_season"] is False
    assert res["seasonal_window"] == "OFF_SEASON"
    assert "Off-Season" in res["seasonal_context_label"]


def test_population_proximity_resolution():
    """
    Ensure geographic resolution accurately measures distance to nearest urban hub
    and estimates local population density.
    """
    service = ContextIntelligenceService()

    # Coordinates for Dahej PCPIR Complex
    res = service.evaluate_population_proximity(latitude=21.7125, longitude=72.5833)

    assert res["nearest_population_center"] in ("Dahej Coastal Industrial Township", "Bharuch Urban Agglomeration")
    assert res["distance_to_population_km"] <= 35.0
    assert res["population_density_within_5km"] >= 400


def test_operational_urgency_scoring():
    """
    Evaluate triage urgency scoring:
    1. Critical chemical disaster (high FRP, high deviation, near population) -> CRITICAL_URGENCY (>= 80)
    2. Routine controlled flare -> ROUTINE_BASELINE (<= 32)
    """
    service = ContextIntelligenceService()

    # Dahej Chemical Disaster scenario
    disaster_urgency = service.calculate_urgency_score(
        frp=165.8,
        deviation_score=4.8,
        label="industrial_fire",
        site_type="chemical",
        distance_to_population_km=4.2,
        population_density_within_5km=2850,
        spread_velocity_kmph=0.18,
        spread_cardinal="ENE",
    )

    assert disaster_urgency["operational_urgency_score"] >= 80
    assert disaster_urgency["urgency_tier"] == "CRITICAL_URGENCY"
    assert "civil evacuation advisory" in disaster_urgency["recommended_action"].lower()

    # Routine Jamnagar Flare scenario
    flare_urgency = service.calculate_urgency_score(
        frp=42.1,
        deviation_score=0.1,
        label="normal_flare",
        site_type="refinery",
        distance_to_population_km=14.5,
        population_density_within_5km=850,
        spread_velocity_kmph=0.01,
        spread_cardinal="STATIONARY",
    )

    assert flare_urgency["operational_urgency_score"] <= 32
    assert flare_urgency["urgency_tier"] == "ROUTINE_BASELINE"


def test_database_event_resolution_and_schema():
    """
    Verify database query resolvers enrich events with full contextual intelligence
    and validate compliance against Pydantic ClassifiedEventResponse.
    """
    events = db.get_events()
    assert len(events) >= 1

    for ev in events:
        assert "is_stubble_season" in ev
        assert "seasonal_context_label" in ev
        assert "population_density_within_5km" in ev
        assert "distance_to_population_km" in ev
        assert "nearest_population_center" in ev
        assert "operational_urgency_score" in ev
        assert "urgency_tier" in ev

        # Pydantic Schema Validation
        resp = ClassifiedEventResponse(**ev)
        assert resp.operational_urgency_score is not None
        assert 1 <= resp.operational_urgency_score <= 100
        assert resp.urgency_tier in ("CRITICAL_URGENCY", "ELEVATED_URGENCY", "MONITORED_ADVISORY", "ROUTINE_BASELINE")

    # Verify specific event lookup
    first_id = events[0]["id"]
    fetched = db.get_event_by_id(first_id)
    assert fetched is not None
    assert fetched["id"] == first_id
    assert "operational_urgency_score" in fetched
