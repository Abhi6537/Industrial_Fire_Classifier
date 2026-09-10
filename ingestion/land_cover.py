"""
Land cover classification service based on regional geospatial boundaries and proximity analysis.
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)


class LandCoverService:
    """Classifies geographic coordinates into discrete land-cover categories."""

    @staticmethod
    def classify_coordinates(
        lat: float,
        lon: float,
        is_on_industrial_site: bool = False,
        nearest_site_dist_km: float = 999.0,
    ) -> str:
        if is_on_industrial_site or nearest_site_dist_km <= 1.5:
            return "industrial"

        # Protected forest zones (Gir sanctuary, Dangs belt)
        if (20.9 <= lat <= 21.5 and 70.4 <= lon <= 71.3) or (20.6 <= lat <= 21.1 and 73.4 <= lon <= 74.0):
            return "forest"

        # Coastal wetlands / Rann basin
        if lat >= 23.5 and lon <= 71.5:
            return "other"

        # Urban clusters (Ahmedabad, Surat metro corridors)
        if (22.95 <= lat <= 23.15 and 72.45 <= lon <= 72.70) or (21.10 <= lat <= 21.25 and 72.75 <= lon <= 72.90):
            return "built_up"

        return "farmland"
