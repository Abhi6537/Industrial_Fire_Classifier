"""
Unit Tests for Sentinel-2 L2A Optical & SWIR Satellite Imagery Service
"""

import pytest
from ingestion.sentinel_imagery import (
    SentinelImageryService,
    SENTINEL_HUB_WMS_BASE,
    MGRS_REGIONAL_TILES,
)


def test_mgrs_tile_resolution():
    """Test resolution of standard Sentinel-2 100km MGRS grid tiles for Indian hubs."""
    # Dahej PCPIR: ~21.7°N, 72.5°E
    assert SentinelImageryService.resolve_mgrs_tile(21.70, 72.55) == "42QWJ"

    # Jamnagar Refinery: ~22.35°N, 69.86°E
    assert SentinelImageryService.resolve_mgrs_tile(22.35, 69.86) == "42QVH"

    # Hazira Industrial Estuary: ~21.1°N, 72.7°E
    assert SentinelImageryService.resolve_mgrs_tile(21.15, 72.68) == "42QVK"

    # Punjab Cropland Corridor: ~30.5°N, 75.8°E
    assert SentinelImageryService.resolve_mgrs_tile(30.50, 75.80) == "43RGQ"

    # Gir Forest Reserve: ~21.15°N, 70.8°E
    assert SentinelImageryService.resolve_mgrs_tile(21.15, 70.80) == "42QUF"


def test_wms_layer_definitions():
    """Ensure WMS layer catalog includes True-Color (B04, B03, B02) and SWIR Fire (B12, B8A, B04)."""
    layers = SentinelImageryService.get_wms_layer_definitions()
    layer_ids = [l["id"] for l in layers]

    assert "sentinel2_true_color" in layer_ids
    assert "sentinel2_swir_fire" in layer_ids
    assert "nasa_gibs_viirs_thermal" in layer_ids

    swir_layer = next(l for l in layers if l["id"] == "sentinel2_swir_fire")
    assert swir_layer["service_url"] == SENTINEL_HUB_WMS_BASE
    assert "B12" in swir_layer["bands"][0]
    assert swir_layer["resolution_m"] == 20


def test_burn_indices_calculation():
    """Test NBR and SWIR thermal fire seat ratio calculation."""
    # Active high-temperature fire: High B12 (0.85), low B08A (0.05), moderate B04 (0.10)
    metrics = SentinelImageryService.calculate_burn_indices(
        b04_red=0.10,
        b08a_nir=0.05,
        b12_swir=0.85,
    )
    # NBR = (0.05 - 0.85) / (0.05 + 0.85) = -0.80 / 0.90 = -0.8889
    assert metrics["nbr"] < -0.5
    assert metrics["swir_thermal_ratio"] > 5.0
    assert metrics["is_active_combustion_seat"] is True

    # Healthy vegetation baseline: Moderate B04 (0.08), high B08A (0.50), low B12 (0.15)
    veg_metrics = SentinelImageryService.calculate_burn_indices(
        b04_red=0.08,
        b08a_nir=0.50,
        b12_swir=0.15,
    )
    # NBR = (0.50 - 0.15) / (0.50 + 0.15) = 0.35 / 0.65 = +0.5385
    assert veg_metrics["nbr"] > 0.3
    assert veg_metrics["is_active_combustion_seat"] is False


def test_incident_comparison_dahej_chemical_fire():
    """Test incident comparison for Dahej chemical explosion."""
    comp = SentinelImageryService.get_incident_comparison(
        event_id="dahej-001",
        lat=21.70,
        lon=72.55,
        label="industrial_fire",
    )
    assert comp["sentinel_mgrs_tile"] == "42QWJ"
    assert comp["spatial_resolution_m"] == 10
    assert comp["post_incident"]["smoke_occlusion_pct"] >= 80.0
    assert comp["post_incident"]["swir_fire_seat_detected"] is True
    assert "SWIR Band 12 (2.19µm) pierces smoke plume" in comp["spectral_analysis"]["domain_interpretation"]


def test_incident_comparison_normal_flare():
    """Test incident comparison for routine refinery flare."""
    comp = SentinelImageryService.get_incident_comparison(
        event_id="jamnagar-001",
        lat=22.35,
        lon=69.86,
        label="normal_flare",
    )
    assert comp["sentinel_mgrs_tile"] == "42QVH"
    assert comp["post_incident"]["smoke_occlusion_pct"] < 10.0
    assert "refinery flare stack tip" in comp["spectral_analysis"]["domain_interpretation"]
