"""
Industrial Sites Seeding Script
Queries OpenStreetMap Overpass API for industrial polygons in the target region
and persists them into the PostGIS 'sites' table.
Usage: python scripts/seed_sites.py
"""

import os
import sys
import logging

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ingestion.osm_client import OSMClient
from ingestion.loader import DatabaseLoader

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("seed_sites")


def seed_industrial_sites():
    logger.info("Initializing OSM industrial site seeder...")
    client = OSMClient()
    sites_df = client.fetch_industrial_sites()
    logger.info(f"Retrieved {len(sites_df)} industrial facility polygons from OSM.")

    loader = DatabaseLoader()
    count = loader.load_sites(sites_df)
    logger.info(f"Successfully seeded {count} industrial sites into storage/database.")
    return count


if __name__ == "__main__":
    seed_industrial_sites()
