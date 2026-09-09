"""
Feature Engineering Pipeline
Transforms enriched satellite detections into numerical feature vectors for classification.
"""

import logging
from typing import Tuple, List, Dict, Optional, Any

import pandas as pd
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("features")

# Standardized feature column order for training and real-time inference
FEATURE_COLUMNS: List[str] = [
    "brightness_temp",
    "frp",
    "confidence_numeric",
    "on_known_site",
    "site_type_encoded",
    "land_cover_encoded",
    "persistence_count",
    "deviation_score",
    "hour_of_day",
    "day_of_week",
    "is_first_detection",
]

TARGET_COLUMN: str = "label"

LABEL_CLASSES: List[str] = [
    "industrial_fire",
    "normal_flare",
    "agricultural_burn",
    "wildfire",
    "mining_activity",
    "unregistered_anomaly",
]

# Deterministic Categorical Encodings
CONFIDENCE_MAP: Dict[str, int] = {
    "low": 0,
    "nominal": 1,
    "high": 2,
}

SITE_TYPE_MAP: Dict[str, int] = {
    "refinery": 0,
    "power_plant": 1,
    "steel": 2,
    "mine": 3,
    "chemical": 4,
    "industrial_general": 5,
    "none": -1,
}

LAND_COVER_MAP: Dict[str, int] = {
    "industrial": 0,
    "forest": 1,
    "farmland": 2,
    "built_up": 3,
    "other": 4,
}


class FeatureExtractor:
    """
    Transforms raw and spatially enriched detection records into model-ready feature matrices.
    """

    @classmethod
    def extract_features(cls, df: pd.DataFrame) -> pd.DataFrame:
        """
        Extracts and normalizes the 11 feature columns from an enriched detections DataFrame.
        """
        if df.empty:
            return pd.DataFrame(columns=FEATURE_COLUMNS)

        data = df.copy()

        # 1. Temporal feature extraction
        if "detected_at" in data.columns:
            data["detected_at"] = pd.to_datetime(data["detected_at"], utc=True)
            data["hour_of_day"] = data["detected_at"].dt.hour
            data["day_of_week"] = data["detected_at"].dt.dayofweek
        else:
            data["hour_of_day"] = data.get("hour_of_day", 12)
            data["day_of_week"] = data.get("day_of_week", 0)

        # 2. Categorical encodings
        if "confidence" not in data.columns:
            data["confidence"] = "nominal"
        data["confidence_numeric"] = (
            data["confidence"]
            .astype(str)
            .str.lower()
            .map(CONFIDENCE_MAP)
            .fillna(1)
            .astype(int)
        )

        if "site_type" not in data.columns:
            data["site_type"] = "none"
        data["site_type_encoded"] = (
            data["site_type"]
            .astype(str)
            .str.lower()
            .map(SITE_TYPE_MAP)
            .fillna(-1)
            .astype(int)
        )

        if "land_cover_type" not in data.columns:
            data["land_cover_type"] = "other"
        data["land_cover_encoded"] = (
            data["land_cover_type"]
            .astype(str)
            .str.lower()
            .map(LAND_COVER_MAP)
            .fillna(4)
            .astype(int)
        )

        # 3. Numeric defaults and bounds
        data["brightness_temp"] = pd.to_numeric(data["brightness_temp"], errors="coerce").fillna(310.0)
        data["frp"] = pd.to_numeric(data["frp"], errors="coerce").fillna(5.0)
        data["on_known_site"] = pd.to_numeric(data["on_known_site"], errors="coerce").fillna(0).astype(int)
        if "persistence_count" not in data.columns:
            data["persistence_count"] = 1
        data["persistence_count"] = pd.to_numeric(data["persistence_count"], errors="coerce").fillna(1).astype(int)

        if "deviation_score" not in data.columns:
            data["deviation_score"] = 0.0
        data["deviation_score"] = pd.to_numeric(data["deviation_score"], errors="coerce").fillna(0.0)

        if "is_first_detection" not in data.columns:
            data["is_first_detection"] = 0
        data["is_first_detection"] = pd.to_numeric(data["is_first_detection"], errors="coerce").fillna(0).astype(int)

        # Return strictly the ordered feature columns
        X = data[FEATURE_COLUMNS].copy()
        return X

    @classmethod
    def prepare_training_data(cls, labeled_df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Extracts feature matrix X and encoded target vector y from labeled dataset.
        """
        X = cls.extract_features(labeled_df)
        y = labeled_df[TARGET_COLUMN].copy()
        return X, y
