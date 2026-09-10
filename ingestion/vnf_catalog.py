"""
VIIRS Nightfire (VNF) Gas Flare Geospatial Inventory Engine
Earth Observation Group (EOG) / NOAA / Colorado School of Mines

Maintains an authoritative spatial catalog of persistent industrial gas flaring installations
across India (petrochemical refineries, chemical complexes, offshore platforms, steel bleed stacks).
Performs sub-millisecond radial geodesic cross-matching against satellite thermal hotspots.
"""

import math
import logging
from typing import Dict, Any, List, Optional, Tuple

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("vnf_catalog")


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes orthodromic distance between two geographic coordinates in kilometers."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


# Authoritative Curated Inventory of Known VNF Industrial Gas Flaring Sites in India
# Grounded in NOAA / Colorado School of Mines EOG Global Gas Flaring Registry
VNF_INDIA_FLARING_SITES: List[Dict[str, Any]] = [
    {
        "vnf_id": "VNF_IND_JAM_001",
        "facility_name": "Reliance Jamnagar DTA Refinery Flaring Array",
        "operator": "Reliance Industries Limited (RIL)",
        "latitude": 22.3551,
        "longitude": 69.8662,
        "typical_temperature_k": 1820.0,
        "flaring_type": "continuous_refinery_flare",
        "state": "Gujarat",
    },
    {
        "vnf_id": "VNF_IND_JAM_002",
        "facility_name": "Reliance Jamnagar SEZ Complex Flaring Array",
        "operator": "Reliance Industries Limited (RIL)",
        "latitude": 22.3385,
        "longitude": 69.8820,
        "typical_temperature_k": 1860.0,
        "flaring_type": "continuous_refinery_flare",
        "state": "Gujarat",
    },
    {
        "vnf_id": "VNF_IND_JAM_003",
        "facility_name": "Nayara Energy Vadinar Refinery Flare Stack",
        "operator": "Nayara Energy",
        "latitude": 22.3810,
        "longitude": 69.7210,
        "typical_temperature_k": 1780.0,
        "flaring_type": "continuous_refinery_flare",
        "state": "Gujarat",
    },
    {
        "vnf_id": "VNF_IND_DAH_001",
        "facility_name": "OPAL Petrochemical Complex Flare Stack",
        "operator": "ONGC Petro additions Limited (OPaL)",
        "latitude": 21.7120,
        "longitude": 72.5833,
        "typical_temperature_k": 1850.0,
        "flaring_type": "petrochemical_cracker_flare",
        "state": "Gujarat",
    },
    {
        "vnf_id": "VNF_IND_DAH_002",
        "facility_name": "Petronet LNG Terminal Vaporizer Flare",
        "operator": "Petronet LNG",
        "latitude": 21.6850,
        "longitude": 72.5410,
        "typical_temperature_k": 1690.0,
        "flaring_type": "cryogenic_boiloff_flare",
        "state": "Gujarat",
    },
    {
        "vnf_id": "VNF_IND_HAZ_001",
        "facility_name": "ONGC Hazira Gas Processing Plant Flaring Stack",
        "operator": "ONGC",
        "latitude": 21.1420,
        "longitude": 72.6710,
        "typical_temperature_k": 1790.0,
        "flaring_type": "natural_gas_processing_flare",
        "state": "Gujarat",
    },
    {
        "vnf_id": "VNF_IND_HAZ_002",
        "facility_name": "Reliance Hazira Manufacturing Division Flare Array",
        "operator": "Reliance Industries Limited",
        "latitude": 21.1680,
        "longitude": 72.6950,
        "typical_temperature_k": 1810.0,
        "flaring_type": "petrochemical_cracker_flare",
        "state": "Gujarat",
    },
    {
        "vnf_id": "VNF_IND_KOY_001",
        "facility_name": "IOCL Gujarat Refinery Flaring Complex",
        "operator": "Indian Oil Corporation Limited (IOCL)",
        "latitude": 22.3680,
        "longitude": 73.1250,
        "typical_temperature_k": 1750.0,
        "flaring_type": "continuous_refinery_flare",
        "state": "Gujarat",
    },
    {
        "vnf_id": "VNF_IND_MUM_001",
        "facility_name": "BPCL / HPCL Mumbai Coastal Refinery Flares",
        "operator": "Bharat Petroleum / Hindustan Petroleum",
        "latitude": 19.0120,
        "longitude": 72.8980,
        "typical_temperature_k": 1760.0,
        "flaring_type": "continuous_refinery_flare",
        "state": "Maharashtra",
    },
    {
        "vnf_id": "VNF_IND_URN_001",
        "facility_name": "ONGC Uran LPG Terminal Flare System",
        "operator": "ONGC",
        "latitude": 18.8950,
        "longitude": 72.9420,
        "typical_temperature_k": 1720.0,
        "flaring_type": "natural_gas_fractionation_flare",
        "state": "Maharashtra",
    },
    {
        "vnf_id": "VNF_IND_PAN_001",
        "facility_name": "IOCL Panipat Refinery & Petrochemical Flare",
        "operator": "Indian Oil Corporation Limited (IOCL)",
        "latitude": 29.4350,
        "longitude": 76.8850,
        "typical_temperature_k": 1800.0,
        "flaring_type": "continuous_refinery_flare",
        "state": "Haryana",
    },
    {
        "vnf_id": "VNF_IND_PAR_001",
        "facility_name": "IOCL Paradip Coastal Refinery Flare Array",
        "operator": "Indian Oil Corporation Limited (IOCL)",
        "latitude": 20.2850,
        "longitude": 86.6450,
        "typical_temperature_k": 1840.0,
        "flaring_type": "continuous_refinery_flare",
        "state": "Odisha",
    },
    {
        "vnf_id": "VNF_IND_DIG_001",
        "facility_name": "IOCL Digboi Historic Refinery Flare",
        "operator": "Indian Oil Corporation Limited (IOCL)",
        "latitude": 27.3820,
        "longitude": 95.6320,
        "typical_temperature_k": 1650.0,
        "flaring_type": "continuous_refinery_flare",
        "state": "Assam",
    },
]


class VNFCatalogEngine:
    """
    Sub-millisecond spatial search engine matching thermal observations against
    authoritative VIIRS Nightfire (VNF) gas flaring registries.
    """

    def __init__(self, sites: Optional[List[Dict[str, Any]]] = None, default_match_radius_km: float = 1.5):
        self.sites = sites or VNF_INDIA_FLARING_SITES
        self.default_match_radius_km = default_match_radius_km

    def lookup_flare(self, lat: float, lon: float, max_radius_km: Optional[float] = None) -> Dict[str, Any]:
        """
        Queries the nearest known VNF gas flare installation.
        Returns match status, catalog metadata, and distance.
        """
        radius = max_radius_km if max_radius_km is not None else self.default_match_radius_km

        closest_site = None
        min_dist_km = 99999.0

        for site in self.sites:
            dist = haversine_km(lat, lon, site["latitude"], site["longitude"])
            if dist < min_dist_km:
                min_dist_km = dist
                closest_site = site

        if closest_site is not None and min_dist_km <= radius:
            return {
                "is_known_vnf_flare": True,
                "vnf_flare_id": closest_site["vnf_id"],
                "vnf_facility_name": closest_site["facility_name"],
                "vnf_operator": closest_site["operator"],
                "vnf_typical_temp_k": closest_site["typical_temperature_k"],
                "vnf_flaring_type": closest_site["flaring_type"],
                "distance_to_vnf_flare_km": round(min_dist_km, 3),
            }

        return {
            "is_known_vnf_flare": False,
            "vnf_flare_id": None,
            "vnf_facility_name": None,
            "vnf_operator": None,
            "vnf_typical_temp_k": None,
            "vnf_flaring_type": None,
            "distance_to_vnf_flare_km": round(min_dist_km, 2) if closest_site else 999.0,
        }


# Global singleton instance for high-throughput reuse
vnf_engine = VNFCatalogEngine()
