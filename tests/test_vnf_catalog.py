"""
Unit Tests for VIIRS Nightfire (VNF) Gas Flare Geospatial Inventory Engine
"""

import pytest
from ingestion.vnf_catalog import VNFCatalogEngine, haversine_km, VNF_INDIA_FLARING_SITES


def test_vnf_catalog_initialization():
    engine = VNFCatalogEngine()
    assert len(engine.sites) >= 10
    # Check that major Indian petrochemical hubs are registered
    site_names = [s["facility_name"] for s in engine.sites]
    assert any("Jamnagar" in name for name in site_names)
    assert any("OPAL" in name or "Dahej" in name for name in site_names)
    assert any("Hazira" in name for name in site_names)
    assert any("Panipat" in name for name in site_names)


def test_exact_match_jamnagar_flare():
    engine = VNFCatalogEngine()
    # Reliance Jamnagar DTA coordinates (22.3551, 69.8662) with small sensor jitter
    match = engine.lookup_flare(lat=22.3552, lon=69.8663)
    assert match["is_known_vnf_flare"] is True
    assert match["vnf_flare_id"] == "VNF_IND_JAM_001"
    assert "Reliance Jamnagar" in match["vnf_facility_name"]
    assert match["distance_to_vnf_flare_km"] < 0.1


def test_match_dahej_opal_flare():
    engine = VNFCatalogEngine()
    # OPAL Dahej coordinates (21.7120, 72.5833) with ~300m offset
    match = engine.lookup_flare(lat=21.7140, lon=72.5850)
    assert match["is_known_vnf_flare"] is True
    assert match["vnf_flare_id"] == "VNF_IND_DAH_001"
    assert "OPAL" in match["vnf_facility_name"]
    assert match["distance_to_vnf_flare_km"] < 0.5


def test_negative_match_rural_farmland():
    engine = VNFCatalogEngine()
    # Deep agricultural area in Saurashtra (21.4500, 70.8000)
    match = engine.lookup_flare(lat=21.4500, lon=70.8000)
    assert match["is_known_vnf_flare"] is False
    assert match["vnf_flare_id"] is None
    assert match["distance_to_vnf_flare_km"] > 20.0


def test_custom_match_radius():
    engine = VNFCatalogEngine()
    # Point ~1.2 km from Hazira flare
    lat, lon = 21.1420 + 0.01, 72.6710
    # With default 1.5 km radius -> Match
    assert engine.lookup_flare(lat, lon, max_radius_km=1.5)["is_known_vnf_flare"] is True
    # With strict 0.5 km radius -> No match
    assert engine.lookup_flare(lat, lon, max_radius_km=0.5)["is_known_vnf_flare"] is False
