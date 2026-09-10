"""
Tests for ESA WorldCover 10m Sentinel-1/2 Land Cover Integration Service
"""

import pytest
from unittest.mock import patch
from ingestion.land_cover import LandCoverService, ESA_CLASSES, ESA_TO_CANONICAL


def test_esa_taxonomy_constants():
    """Ensure standard ESA WorldCover v100/v200 codes are defined with names and colors."""
    assert 10 in ESA_CLASSES  # Tree cover
    assert 40 in ESA_CLASSES  # Cropland
    assert 50 in ESA_CLASSES  # Built-up
    assert 60 in ESA_CLASSES  # Bare / sparse vegetation
    assert 95 in ESA_CLASSES  # Mangroves

    assert ESA_CLASSES[50]["name"] == "Built-up"
    assert ESA_CLASSES[50]["color_hex"] == "#fa0000"
    assert ESA_CLASSES[40]["name"] == "Cropland"
    assert ESA_CLASSES[40]["color_hex"] == "#f096ff"
    assert ESA_CLASSES[10]["name"] == "Tree cover"
    assert ESA_CLASSES[10]["color_hex"] == "#006400"

    assert ESA_TO_CANONICAL[50] == "industrial"
    assert ESA_TO_CANONICAL[40] == "farmland"
    assert ESA_TO_CANONICAL[10] == "forest"


def test_industrial_corridor_resolution():
    """Test Jamnagar refinery coordinates resolve to Built-up (50)."""
    # Jamnagar refinery: 22.35°N, 69.85°E
    res = LandCoverService.query_worldcover(22.35, 69.85, is_on_industrial_site=True, nearest_site_dist_km=0.1)
    assert res["esa_code"] == 50
    assert res["esa_label"] == "Built-up"
    assert res["esa_color"] == "#fa0000"
    assert res["normalized_class"] == "industrial"
    assert res["resolution"] == "10m"


def test_agricultural_corridor_resolution():
    """Test Punjab crop residue burning corridor resolves to Cropland (40)."""
    # Ludhiana / Sangrur rural belt: 30.5°N, 75.8°E
    res = LandCoverService.query_worldcover(30.5, 75.8, is_on_industrial_site=False, nearest_site_dist_km=14.2)
    assert res["esa_code"] == 40
    assert res["esa_label"] == "Cropland"
    assert res["esa_color"] == "#f096ff"
    assert res["normalized_class"] == "farmland"


def test_forest_canopy_resolution():
    """Test Gir Forest National Park coordinates resolve to Tree cover (10)."""
    # Gir Forest: 21.15°N, 70.80°E
    res = LandCoverService.query_worldcover(21.15, 70.80, is_on_industrial_site=False, nearest_site_dist_km=25.0)
    assert res["esa_code"] == 10
    assert res["esa_label"] == "Tree cover"
    assert res["esa_color"] == "#006400"
    assert res["normalized_class"] == "forest"


def test_mangrove_corridor_resolution():
    """Test coastal mangrove belts resolve to Mangroves (95)."""
    # Gulf of Khambhat coastal belt: 21.6°N, 72.5°E
    res = LandCoverService.query_worldcover(21.6, 72.5, is_on_industrial_site=False, nearest_site_dist_km=18.0)
    assert res["esa_code"] == 95
    assert res["esa_label"] == "Mangroves"
    assert res["normalized_class"] == "other"


def test_known_site_override():
    """If is_on_industrial_site is True or distance is near zero, built-up should be assigned."""
    res = LandCoverService.query_worldcover(28.0, 77.0, is_on_industrial_site=True, nearest_site_dist_km=0.2)
    assert res["esa_code"] == 50
    assert res["esa_label"] == "Built-up"
    assert res["normalized_class"] == "industrial"


def test_legacy_classify_coordinates_wrapper():
    """Test backward compatibility wrapper classify_coordinates."""
    assert LandCoverService.classify_coordinates(22.35, 69.85, True, 0.1) == "industrial"
    assert LandCoverService.classify_coordinates(30.5, 75.8, False, 15.0) == "farmland"
    assert LandCoverService.classify_coordinates(21.15, 70.80, False, 20.0) == "forest"
