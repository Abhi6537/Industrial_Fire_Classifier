"""
Unit Tests for Sovereign Indian Territorial Boundary Verification
Validates that foreign detections (Sri Lanka, Pakistan, Bangladesh, Nepal, ocean)
are strictly filtered out while Indian mainland facilities and territories are preserved.
"""

import pytest
from ingestion.india_boundary import india_engine


def test_indian_mainland_cities():
    """Verifies that major Indian strategic and industrial centers are recognized inside India."""
    strategic_indian_coords = [
        ("Delhi NCT", 28.6139, 77.2090),
        ("Mumbai Metropolitan Region", 19.0760, 72.8777),
        ("Jamnagar Refinery Hub", 22.4707, 70.0577),
        ("Dahej PCPIR Complex", 21.7125, 72.5833),
        ("Hazira Petrochemical Belt", 21.1100, 72.6500),
        ("Chennai Industrial Corridor", 13.0827, 80.2707),
        ("Kolkata / Haldia Port", 22.5726, 88.3639),
        ("Kanyakumari Southern Tip", 8.0883, 77.5385),
        ("Guwahati / Assam Oil Belt", 26.1445, 91.7362),
    ]
    for name, lat, lon in strategic_indian_coords:
        assert india_engine.is_in_india(lat, lon) is True, f"Failed for Indian territory: {name} ({lat}, {lon})"


def test_foreign_territories_rejection():
    """Verifies that detections across Sri Lanka, Pakistan, Bangladesh, and Nepal are strictly rejected."""
    foreign_coords = [
        ("Colombo, Sri Lanka", 6.9271, 79.8612),
        ("Kandy, Sri Lanka", 7.2906, 80.6337),
        ("Jaffna, Sri Lanka", 9.6615, 80.0255),
        ("Galle, Sri Lanka", 6.0535, 80.2210),
        ("Karachi, Pakistan", 24.8607, 67.0011),
        ("Lahore, Pakistan", 31.5204, 74.3587),
        ("Dhaka, Bangladesh", 23.8103, 90.4125),
        ("Chittagong, Bangladesh", 22.3569, 91.7832),
        ("Kathmandu, Nepal", 27.7172, 85.3240),
        ("Central Indian Ocean", 2.0000, 78.0000),
        ("Arabian Sea Offshore", 15.0000, 65.0000),
    ]
    for name, lat, lon in foreign_coords:
        assert india_engine.is_in_india(lat, lon) is False, f"Failed to reject foreign coordinate: {name} ({lat}, {lon})"
