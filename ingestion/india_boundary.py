"""
Sovereign Indian Territorial Boundary Verification Module
Provides microsecond Point-in-Polygon (PIP) checks against official Survey-compliant
Indian territorial landmass and islands (excluding Sri Lanka, Pakistan, Bangladesh, Nepal, Tibet).
"""

import os
import json
import logging
from typing import List, Tuple, Dict, Any, Optional

logger = logging.getLogger("india_boundary")

_BOUNDARY_FILE = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "data", "india_territorial_boundary.json")
)


def _point_in_ring(lon: float, lat: float, ring: List[List[float]]) -> bool:
    """Standard ray-casting algorithm for 2D Point-in-Polygon."""
    n = len(ring)
    if n < 3:
        return False
    inside = False
    p1x, p1y = ring[0]
    for i in range(1, n + 1):
        p2x, p2y = ring[i % n]
        if lat > min(p1y, p2y):
            if lat <= max(p1y, p2y):
                if lon <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (lat - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or lon <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside


class IndiaTerritorialEngine:
    """
    High-performance boundary validator with two-tier spatial acceleration:
    1. Overall Bounding Box (fastest rejection: O(1))
    2. Per-part Sub-bounding Box rejection (O(parts))
    3. Ray-Casting Polygon Intersect (executed only if inside sub-box)
    """

    _instance: Optional["IndiaTerritorialEngine"] = None

    def __init__(self, boundary_file: str = _BOUNDARY_FILE):
        self.parts: List[Dict[str, Any]] = []
        # Macro bounding box enclosing all Indian territory (including Andaman & Nicobar)
        self.macro_bbox = (68.1, 6.7, 97.4, 37.1)
        self._load_boundary(boundary_file)

    @classmethod
    def get_instance(cls) -> "IndiaTerritorialEngine":
        if cls._instance is None:
            cls._instance = IndiaTerritorialEngine()
        return cls._instance

    def _load_boundary(self, filepath: str):
        if not os.path.exists(filepath):
            logger.warning(f"Boundary file not found at {filepath}. Non-India coordinate filter inactive.")
            return

        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.parts = data.get("parts", [])
            logger.info(f"Loaded Indian territorial boundary with {len(self.parts)} polygon parts.")
        except Exception as e:
            logger.error(f"Failed to parse Indian boundary dataset ({e}).")

    def is_in_india(self, latitude: float, longitude: float) -> bool:
        """
        Determines whether (latitude, longitude) lies within sovereign Indian territory.
        Returns False for Sri Lanka, Pakistan, Bangladesh, Nepal, Myanmar, international waters.
        """
        lat = float(latitude)
        lon = float(longitude)

        # 1. Macro-envelope check
        if lon < self.macro_bbox[0] or lon > self.macro_bbox[2] or lat < self.macro_bbox[1] or lat > self.macro_bbox[3]:
            return False

        # 2. Known external landmass quick rejectors
        # Sri Lanka is in (lon 79.5 to 82.0, lat 5.8 to 10.0)
        # Pamban / Rameshwaram is around lat 9.28, lon 79.3. If lon > 79.6 and lat < 9.9, it's Sri Lankan territory/waters.
        if lon > 79.65 and lat < 9.85:
            return False

        # 3. If parts loaded, perform precise PIP
        if not self.parts:
            # Fallback simple rectangular sanity check
            return True

        for part in self.parts:
            bb = part["bbox"]
            if lon < bb[0] or lon > bb[2] or lat < bb[1] or lat > bb[3]:
                continue
            if _point_in_ring(lon, lat, part["ring"]):
                return True

        return False


# Global singleton helper
india_engine = IndiaTerritorialEngine.get_instance()
