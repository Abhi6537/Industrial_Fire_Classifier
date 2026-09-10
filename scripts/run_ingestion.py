"""
End-to-End Ingestion Pipeline Runner
Orchestrates:
1. Satellite hotspot detection pull (NASA FIRMS / VIIRS)
2. Industrial facility polygon fetch (OSM Overpass)
3. Spatial join & Land Cover classification
4. Baseline deviation calculation
5. Persistence to database / storage
"""

import os
import sys
import logging
from datetime import datetime, timezone

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ingestion.firms_client import FIRMSClient
from ingestion.osm_client import OSMClient
from ingestion.spatial_join import SpatialJoinEngine
from ingestion.baseline import BaselineEngine
from ingestion.loader import DatabaseLoader

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("ingestion_pipeline")


def run_pipeline(day_range: int = 1):
    logger.info("=" * 70)
    logger.info("INDUSTRIAL FIRE DETECTION INGESTION PIPELINE")
    logger.info(f"Timestamp (UTC): {datetime.now(timezone.utc).isoformat()}")
    logger.info("=" * 70)

    # Ingest satellite detections
    firms = FIRMSClient()
    detections_df = firms.fetch_area_detections(day_range=day_range)
    logger.info(f"Retrieved {len(detections_df)} detection records.")

    # Fetch facility geometries
    osm = OSMClient()
    sites_gdf = osm.fetch_industrial_sites()
    logger.info(f"Loaded {len(sites_gdf)} industrial facility polygons.")

    # Spatial join & land cover attribution
    spatial_engine = SpatialJoinEngine(sites_gdf)
    enriched_gdf = spatial_engine.enrich_detections(detections_df)

    # Baseline deviation scoring
    baseline_engine = BaselineEngine()
    baseline_df = baseline_engine.enrich_with_baseline(enriched_gdf)

    # Model inference
    from ml.predict import ClassifierService
    classifier = ClassifierService()
    final_df = classifier.predict_detections(baseline_df)

    # Database persistence
    loader = DatabaseLoader()
    sites_loaded = loader.load_sites(sites_gdf)
    detections_loaded = loader.load_detections(final_df)
    classified_loaded = loader.load_classified_events(final_df)

    logger.info("=" * 70)
    logger.info("Ingestion & classification completed.")
    logger.info(f"Sites Synced: {sites_loaded} | Detections: {detections_loaded} | Classified: {classified_loaded}")
    logger.info("=" * 70)

    return final_df


if __name__ == "__main__":
    df = run_pipeline(day_range=1)
    if not df.empty:
        print("\nPipeline Output Preview (Classified Hotspots):")
        cols_to_show = ["latitude", "longitude", "frp", "site_name", "label", "confidence", "severity"]
        print(df[[c for c in cols_to_show if c in df.columns]].head(5).to_string())
