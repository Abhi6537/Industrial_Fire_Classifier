"""
Land Cover Classifier Service
Maps geographic coordinates to land cover classes:
- industrial: Within or adjacent to industrial zone
- forest: Dense vegetation or protected reserve
- farmland: Agricultural cropland (susceptible to stubble/crop residue burning)
- built_up: Urban settlements and commercial centers
- other: Water bodies, wetlands, barren rock/sand
"""

import logging
from typing import Optional

logger = logging.getLogger("land_cover")


class LandCoverService:
    """
    Assigns land-cover class to geographic coordinates.
    In MVP mode, leverages OSM context and regional geography heuristics.
    In production, cross-references ESA WorldCover 10m GeoTIFF tiles or ISRO Bhuvan land-use rasters.
    """

    @staticmethod
    def classify_coordinates(
        lat: float,
        lon: float,
        is_on_industrial_site: bool = False,
        nearest_site_dist_km: float = 999.0,
    ) -> str:
        """
        Determines the land-cover class for a given geographic point (lat, lon).
        """
        if is_on_industrial_site:
            return "industrial"

        # Buffer zone within 1.5 km of an industrial estate
        if nearest_site_dist_km <= 1.5:
            return "industrial"

        # Forest areas in Gujarat (e.g., Gir National Park & sanctuary: lat ~20.9-21.5, lon ~70.4-71.3)
        if 20.9 <= lat <= 21.5 and 70.4 <= lon <= 71.3:
            return "forest"
        # Dangs forest belt (South Gujarat): lat ~20.6-21.1, lon ~73.4-74.0
        if 20.6 <= lat <= 21.1 and 73.4 <= lon <= 74.0:
            return "forest"

        # Coastal wetlands / Rann of Kutch
        if lat >= 23.5 and lon <= 71.5:
            return "other"

        # Major urban areas (Ahmedabad, Surat, Vadodara, Rajkot)
        # Ahmedabad: 23.02, 72.57
        if 22.95 <= lat <= 23.15 and 72.45 <= lon <= 72.70:
            return "built_up"
        # Surat: 21.17, 72.83
        if 21.10 <= lat <= 21.25 and 72.75 <= lon <= 72.90:
            return "built_up"

        # Dominant rural/agrarian expanse in Saurashtra and Central Gujarat
        return "farmland"
