"""
NASA FIRMS Satellite Thermal Observation Downloader
Directly pulls real near-real-time (NRT) satellite hotspot detections 
from NASA EOSDIS FIRMS API (VIIRS Suomi-NPP, NOAA-20, NOAA-21, and MODIS)
for sovereign Indian territory.

Usage:
    python scripts/pull_satellite_data.py
    python scripts/pull_satellite_data.py --days 3 --output data/satellite_pull.csv
    python scripts/pull_satellite_data.py --source VIIRS_SNPP_NRT --days 2
"""

import os
import sys
import argparse
import logging
from datetime import datetime, timezone

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ingestion.firms_client import FIRMSClient, ALL_VIIRS_SOURCES

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("satellite_pull")


def main():
    parser = argparse.ArgumentParser(
        description="Pull real satellite thermal anomaly data from NASA FIRMS API."
    )
    parser.add_argument(
        "--days",
        type=int,
        default=2,
        help="Number of days to pull (1 to 10). Default: 2 (ensures complete orbital passes).",
    )
    parser.add_argument(
        "--source",
        type=str,
        default="ALL_VIIRS",
        choices=["ALL_VIIRS", "VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT", "VIIRS_NOAA21_NRT", "MODIS_NRT"],
        help="Satellite constellation/sensor to query. Default: ALL_VIIRS (multi-satellite).",
    )
    parser.add_argument(
        "--bbox",
        type=str,
        default=None,
        help="Geographic bounding box as 'west,south,east,north'. Default: India territory (68.0,6.5,97.5,37.5).",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="data/live_satellite_feed.csv",
        help="Output CSV filepath to save ingested real satellite data. Default: data/live_satellite_feed.csv",
    )
    parser.add_argument(
        "--preview",
        type=int,
        default=10,
        help="Number of detection rows to display in terminal preview. Default: 10.",
    )

    args = parser.parse_args()

    print("=" * 80)
    print("  NASA FIRMS SATELLITE DATA RETRIEVAL ENGINE")
    print(f"  Execution Time (UTC): {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Target Source       : {args.source}")
    print(f"  Temporal Window     : Past {args.days} day(s)")
    print("=" * 80)

    client = FIRMSClient()

    if not client.is_configured():
        print("\n[WARNING] FIRMS_MAP_KEY not found or invalid in .env.")
        print("          Get a free MAP Key from: https://firms.modaps.eosdis.nasa.gov/api/map_key/")
        print("          Falling back to synthetic/historical offline demonstration set.")

    # Execute NASA API Pull
    df = client.fetch_area_detections(
        bbox=args.bbox,
        source=args.source,
        day_range=args.days
    )

    if df.empty:
        print("\n[INFO] Zero active thermal anomalies returned for this query window.")
        print("       (Tip: Try increasing --days to 3 or 5 if orbital passes are still processing).")
        return

    print("\n" + "=" * 80)
    print(f"  DOWNLOAD SUMMARY — {len(df)} REAL HOTSPOTS INGESTED")
    print("=" * 80)
    print(f"  Total Observations  : {len(df)} sovereign territory detections")
    print(f"  Instruments Found   : {', '.join(df['instrument'].unique())}")
    print(f"  Satellites Tracked  : {', '.join(df['satellite'].unique())}")
    print(f"  Max FRP Recorded    : {df['frp'].max():.2f} MW")
    print(f"  Mean FRP Recorded   : {df['frp'].mean():.2f} MW")
    print(f"  Peak Brightness (K) : {df['brightness_temp'].max():.1f} K")
    print(f"  High Confidence Hotspots : {len(df[df['confidence'] == 'high'])}")

    # Save to disk
    os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)
    df.to_csv(args.output, index=False)
    print(f"\n[SAVED] Raw satellite observation records exported to: [{args.output}]")

    # Display preview table
    print("\n" + "=" * 80)
    print(f"  REAL SATELLITE DETECTION PREVIEW (First {min(args.preview, len(df))} records):")
    print("=" * 80)
    display_cols = ["latitude", "longitude", "brightness_temp", "frp", "confidence", "satellite", "instrument", "detected_at"]
    display_cols = [c for c in display_cols if c in df.columns]
    print(df[display_cols].head(args.preview).to_string(index=False))
    print("=" * 80 + "\n")


if __name__ == "__main__":
    main()
