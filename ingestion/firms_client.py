"""
NASA FIRMS (Fire Information for Resource Management System) Client
Retrieves near-real-time (NRT) satellite thermal anomaly detections.
Reference: NASA FIRMS API (VIIRS / MODIS)
"""

import io
import os
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

import requests
import pandas as pd
from dotenv import load_dotenv

from ingestion.india_boundary import india_engine

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("firms_client")

# NASA FIRMS API Constants
DEFAULT_FIRMS_BASE_URL = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"
DEFAULT_SOURCE = "ALL_VIIRS"  # Multi-constellation: Suomi-NPP + NOAA-20 + NOAA-21
ALL_VIIRS_SOURCES = ["VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT", "VIIRS_NOAA21_NRT"]


class FIRMSClient:
    """
    Client for querying the NASA FIRMS Area API.
    Produces standardized pandas DataFrames matching the 'detections' database table.
    Supports multi-constellation concurrent satellite observation aggregation.
    """

    def __init__(self, map_key: Optional[str] = None, base_url: str = DEFAULT_FIRMS_BASE_URL):
        self.map_key = map_key or os.getenv("FIRMS_MAP_KEY")
        self.base_url = base_url.rstrip("/")

    def is_configured(self) -> bool:
        """Check if an actual NASA FIRMS MAP Key is provided and not a placeholder."""
        if not self.map_key or self.map_key.strip() in ("", "your-firms-mapkey"):
            return False
        return True

    def fetch_area_detections(
        self,
        bbox: Optional[str] = None,
        source: str = DEFAULT_SOURCE,
        day_range: int = 1,
    ) -> pd.DataFrame:
        """
        Pulls thermal anomaly detections within the bounding box for the specified past day_range.
        Queries all operational VIIRS constellation satellites (Suomi-NPP, NOAA-20, NOAA-21)
        to ensure zero orbital blind-spots and full temporal coverage.
        
        Args:
            bbox: Bounding box formatted as 'west,south,east,north' (e.g. '68.0,6.5,97.5,37.5')
            source: Satellite instrument source ('ALL_VIIRS', or specific like 'VIIRS_SNPP_NRT')
            day_range: Number of days to look back (1-10)

        Returns:
            pd.DataFrame: Cleaned detections conforming to the detections schema
        """
        target_bbox = bbox or os.getenv("TARGET_BBOX", "68.0,6.5,97.5,37.5")

        if not self.is_configured():
            logger.warning(
                "FIRMS_MAP_KEY is missing or unconfigured. "
                "Register for a free key at https://firms.modaps.eosdis.nasa.gov/api/map_key/ "
                "Returning mock sample data for offline testing."
            )
            return self.get_offline_sample(target_bbox)

        active_sources = ALL_VIIRS_SOURCES if source in ("ALL_VIIRS", "ALL", None) else [source]
        all_records_df_list = []

        for src in active_sources:
            url = f"{self.base_url}/{self.map_key}/{src}/{target_bbox}/{day_range}"
            logger.info(f"Querying NASA FIRMS API for region [{target_bbox}], source [{src}], days [{day_range}]...")

            try:
                response = requests.get(url, timeout=30)
                if response.status_code != 200:
                    logger.warning(f"FIRMS source {src} returned HTTP {response.status_code}")
                    continue

                csv_text = response.text.strip()
                if not csv_text or "latitude" not in csv_text.lower():
                    if "invalid map key" in csv_text.lower() or "bad request" in csv_text.lower():
                        logger.error(f"FIRMS API Error Response: {csv_text}")
                    continue

                raw_df = pd.read_csv(io.StringIO(csv_text))
                norm_df = self.normalize_firms_data(raw_df, src)
                if not norm_df.empty:
                    all_records_df_list.append(norm_df)
            except Exception as e:
                logger.error(f"Failed to fetch data from FIRMS API for {src}: {e}")
                continue

        if not all_records_df_list:
            logger.info("No active thermal anomalies detected in the specified area.")
            return pd.DataFrame()

        merged_df = pd.concat(all_records_df_list, ignore_index=True)
        merged_df.drop_duplicates(subset=["latitude", "longitude", "detected_at"], inplace=True)
        logger.info(f"Aggregated {len(merged_df)} deduplicated sovereign Indian hotspots across {len(active_sources)} satellite instruments.")
        return merged_df

    def normalize_firms_data(self, df: pd.DataFrame, source: str) -> pd.DataFrame:
        """
        Normalizes raw VIIRS/MODIS CSV fields into the database schema format.
        """
        if df.empty:
            return pd.DataFrame()

        df.columns = [col.lower().strip() for col in df.columns]
        normalized_records: List[Dict[str, Any]] = []

        for _, row in df.iterrows():
            try:
                lat = float(row.get("latitude", 0.0))
                lon = float(row.get("longitude", 0.0))

                # Strict Sovereign Territorial Filter: Exclude foreign detections (Sri Lanka, Pakistan, Bangladesh, Nepal, ocean)
                if not india_engine.is_in_india(lat, lon):
                    continue

                # Handle brightness temperature column variations across instruments
                # VIIRS uses bright_ti4 (375m I-band) and bright_ti5 (thermal)
                # MODIS uses brightness and bright_t31
                b_temp = row.get("bright_ti4", row.get("brightness", None))
                brightness_temp = float(b_temp) if pd.notnull(b_temp) else None

                # Fire Radiative Power (MW)
                frp_val = row.get("frp", None)
                frp = float(frp_val) if pd.notnull(frp_val) else 0.0

                # Confidence normalization: VIIRS provides 'l', 'n', 'h'; MODIS provides 0-100%
                conf_raw = str(row.get("confidence", "nominal")).lower().strip()
                if conf_raw == "l":
                    confidence = "low"
                elif conf_raw == "n":
                    confidence = "nominal"
                elif conf_raw == "h":
                    confidence = "high"
                else:
                    try:
                        conf_num = float(conf_raw)
                        confidence = "high" if conf_num >= 80 else ("nominal" if conf_num >= 40 else "low")
                    except ValueError:
                        confidence = "nominal"

                # Parse timestamp: acq_date (YYYY-MM-DD), acq_time (HHMM in UTC)
                acq_date = str(row.get("acq_date", "")).strip()
                acq_time = str(int(float(row.get("acq_time", 0)))).zfill(4)
                dt_str = f"{acq_date} {acq_time}"
                detected_at = datetime.strptime(dt_str, "%Y-%m-%d %H%M").replace(tzinfo=timezone.utc)

                instrument = "VIIRS" if "VIIRS" in source.upper() else "MODIS"
                satellite = str(row.get("satellite", "N")).strip()

                normalized_records.append({
                    "latitude": lat,
                    "longitude": lon,
                    "brightness_temp": brightness_temp,
                    "frp": frp,
                    "confidence": confidence,
                    "satellite": satellite,
                    "instrument": instrument,
                    "detected_at": detected_at,
                })
            except Exception as row_err:
                logger.debug(f"Skipping malformed detection row: {row_err}")
                continue

        result_df = pd.DataFrame(normalized_records)
        if not result_df.empty:
            result_df.drop_duplicates(subset=["latitude", "longitude", "detected_at"], inplace=True)
        return result_df

    def get_offline_sample(self, bbox: str) -> pd.DataFrame:
        """
        Provides synthetic/historical sample data for local development when no API key is set.
        Generates realistic data points within the Gujarat Industrial Belt (Jamnagar, Dahej, Hazira).
        """
        logger.info("Generating realistic offline hotspot sample for local development...")
        now = datetime.now(timezone.utc)
        sample_data = [
            # Reliance Jamnagar Refinery complex (routine gas flare)
            {
                "latitude": 22.3551,
                "longitude": 69.8662,
                "brightness_temp": 348.5,
                "frp": 42.1,
                "confidence": "high",
                "satellite": "N",
                "instrument": "VIIRS",
                "detected_at": now,
            },
            # Dahej Chemical Industrial Estate (sudden thermal spike)
            {
                "latitude": 21.7125,
                "longitude": 72.5833,
                "brightness_temp": 385.2,
                "frp": 165.8,
                "confidence": "high",
                "satellite": "N",
                "instrument": "VIIRS",
                "detected_at": now,
            },
            # Agricultural burn in Saurashtra farmland
            {
                "latitude": 21.4500,
                "longitude": 70.8000,
                "brightness_temp": 322.0,
                "frp": 12.4,
                "confidence": "nominal",
                "satellite": "N",
                "instrument": "VIIRS",
                "detected_at": now,
            },
        ]
        return pd.DataFrame(sample_data)


if __name__ == "__main__":
    client = FIRMSClient()
    df = client.fetch_area_detections(day_range=1)
    print(f"Retrieved {len(df)} detections:")
    print(df.head())
