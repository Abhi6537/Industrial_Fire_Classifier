"""
Synthetic and weak-labeled benchmark dataset generator for 6-class fire classification.
Simulates satellite thermal anomaly patterns across industrial, agricultural, and natural environments.
"""

import os
import random
import logging
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any

import pandas as pd
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("dataset_generator")


def generate_benchmark_dataset(samples_per_class: int = 250, seed: int = 42) -> pd.DataFrame:
    """
    Generates a structured, realistic dataset adhering to satellite sensor physics and weak labeling heuristics.
    """
    random.seed(seed)
    np.random.seed(seed)

    records: List[Dict[str, Any]] = []
    base_time = datetime(2025, 4, 15, 12, 0, 0, tzinfo=timezone.utc)

    # 1. CLASS: normal_flare
    # Refinery/chemical gas flare: stationary, seen nightly (high persistence), stable FRP, low deviation
    for _ in range(samples_per_class):
        records.append({
            "latitude": round(np.random.normal(22.355, 0.01), 4),
            "longitude": round(np.random.normal(69.866, 0.01), 4),
            "brightness_temp": round(np.random.normal(345.0, 8.0), 1),
            "frp": round(np.random.normal(45.0, 7.0), 1),
            "confidence": random.choice(["nominal", "high", "high"]),
            "satellite": random.choice(["N", "1"]),
            "instrument": "VIIRS",
            "detected_at": base_time - timedelta(days=random.randint(1, 60), hours=random.randint(0, 23)),
            "on_known_site": 1,
            "site_type": random.choice(["refinery", "chemical", "refinery"]),
            "land_cover_type": "industrial",
            "distance_to_site_km": 0.0,
            "persistence_count": random.randint(22, 120),  # Rule: 20+ consecutive passes
            "deviation_score": round(np.random.normal(0.1, 0.4), 2),  # Near zero deviation
            "is_first_detection": 0,
            "label": "normal_flare",
        })

    # 2. CLASS: industrial_fire
    # Real refinery/chemical disaster: huge sudden FRP spike, large positive Z-score deviation, on known site or immediate zone
    for _ in range(samples_per_class):
        mean_site_frp = random.uniform(30.0, 50.0)
        # Spike is 3x-6x baseline
        fire_frp = round(mean_site_frp * random.uniform(3.0, 6.5), 1)
        spike_z = round((fire_frp - mean_site_frp) / 8.0, 2)

        records.append({
            "latitude": round(np.random.normal(21.712, 0.02), 4),
            "longitude": round(np.random.normal(72.583, 0.02), 4),
            "brightness_temp": round(np.random.normal(380.0, 15.0), 1),  # Extreme thermal reading
            "frp": fire_frp,
            "confidence": "high",
            "satellite": random.choice(["N", "1"]),
            "instrument": "VIIRS",
            "detected_at": base_time - timedelta(days=random.randint(1, 30), hours=random.randint(0, 23)),
            "on_known_site": 1,
            "site_type": random.choice(["refinery", "chemical", "steel"]),
            "land_cover_type": "industrial",
            "distance_to_site_km": 0.0,
            "persistence_count": random.randint(1, 5),  # Sudden appearance of spike
            "deviation_score": max(spike_z, 3.2),  # Rule: sudden deviation > 3.0
            "is_first_detection": 0,
            "label": "industrial_fire",
        })

    # 3. CLASS: agricultural_burn
    # Crop residue / stubble burn: on farmland, low-to-moderate FRP, short-lived (<3 passes), daytime peak
    for _ in range(samples_per_class):
        records.append({
            "latitude": round(np.random.normal(21.650, 0.5), 4),
            "longitude": round(np.random.normal(71.200, 0.6), 4),
            "brightness_temp": round(np.random.normal(322.0, 7.0), 1),
            "frp": round(np.random.normal(16.0, 6.0), 1),
            "confidence": random.choice(["low", "nominal", "nominal"]),
            "satellite": random.choice(["N", "1"]),
            "instrument": "VIIRS",
            "detected_at": base_time - timedelta(days=random.randint(1, 90), hours=random.randint(10, 16)),
            "on_known_site": 0,
            "site_type": "none",
            "land_cover_type": "farmland",
            "distance_to_site_km": round(random.uniform(8.0, 45.0), 1),
            "persistence_count": random.randint(1, 2),  # Short lived (<3 passes)
            "deviation_score": 0.0,
            "is_first_detection": 1,
            "label": "agricultural_burn",
        })

    # 4. CLASS: wildfire
    # Forest fire: dense forest land-cover, >5km from industry, spreading behavior, elevated FRP
    for _ in range(samples_per_class):
        records.append({
            "latitude": round(np.random.normal(21.150, 0.15), 4),
            "longitude": round(np.random.normal(70.850, 0.18), 4),
            "brightness_temp": round(np.random.normal(338.0, 10.0), 1),
            "frp": round(np.random.normal(38.0, 14.0), 1),
            "confidence": random.choice(["nominal", "high"]),
            "satellite": random.choice(["N", "1"]),
            "instrument": "VIIRS",
            "detected_at": base_time - timedelta(days=random.randint(1, 60), hours=random.randint(0, 23)),
            "on_known_site": 0,
            "site_type": "none",
            "land_cover_type": "forest",
            "distance_to_site_km": round(random.uniform(12.0, 70.0), 1),  # Rule: >5km from industrial site
            "persistence_count": random.randint(2, 6),
            "deviation_score": 0.0,
            "is_first_detection": 0,
            "label": "wildfire",
        })

    # 5. CLASS: mining_activity
    # Mining / quarrying operations: inside mining polygon, low-to-moderate persistent FRP
    for _ in range(samples_per_class):
        records.append({
            "latitude": round(np.random.normal(22.820, 0.05), 4),
            "longitude": round(np.random.normal(69.520, 0.05), 4),
            "brightness_temp": round(np.random.normal(326.0, 6.0), 1),
            "frp": round(np.random.normal(18.0, 4.5), 1),
            "confidence": random.choice(["nominal", "nominal", "high"]),
            "satellite": random.choice(["N", "1"]),
            "instrument": "VIIRS",
            "detected_at": base_time - timedelta(days=random.randint(1, 90), hours=random.randint(0, 23)),
            "on_known_site": 1,
            "site_type": "mine",
            "land_cover_type": "industrial",
            "distance_to_site_km": 0.0,
            "persistence_count": random.randint(10, 40),
            "deviation_score": round(np.random.normal(0.2, 0.3), 2),
            "is_first_detection": 0,
            "label": "mining_activity",
        })

    # 6. CLASS: unregistered_anomaly
    # Unmapped industrial or commercial facility fire: built_up / industrial land cover, NOT in any mapped OSM polygon
    for _ in range(samples_per_class):
        records.append({
            "latitude": round(np.random.normal(23.030, 0.08), 4),
            "longitude": round(np.random.normal(72.580, 0.08), 4),
            "brightness_temp": round(np.random.normal(355.0, 12.0), 1),
            "frp": round(np.random.normal(65.0, 18.0), 1),
            "confidence": random.choice(["nominal", "high"]),
            "satellite": random.choice(["N", "1"]),
            "instrument": "VIIRS",
            "detected_at": base_time - timedelta(days=random.randint(1, 45), hours=random.randint(0, 23)),
            "on_known_site": 0,  # Rule: NOT in any OSM polygon
            "site_type": "none",
            "land_cover_type": random.choice(["built_up", "industrial"]),
            "distance_to_site_km": round(random.uniform(1.2, 6.0), 1),
            "persistence_count": random.randint(1, 3),
            "deviation_score": 0.0,
            "is_first_detection": 1,
            "label": "unregistered_anomaly",
        })

    df = pd.DataFrame(records)

    # Sensor noise and atmospheric attenuation modeling
    noise_indices = df.sample(frac=0.16, random_state=seed).index
    for idx in noise_indices:
        noise_type = random.choice([
            "smoke_attenuation", 
            "flare_maintenance_surge", 
            "fence_line_stubble", 
            "swath_edge_degradation"
        ])
        row_label = df.at[idx, "label"]

        if noise_type == "smoke_attenuation" and row_label == "industrial_fire":
            # Dense aerosol plume absorbs infrared; apparent FRP & brightness dampened
            df.at[idx, "brightness_temp"] = round(df.at[idx, "brightness_temp"] * 0.88, 1)
            df.at[idx, "frp"] = round(df.at[idx, "frp"] * 0.55, 1)
            df.at[idx, "deviation_score"] = round(df.at[idx, "deviation_score"] * 0.65, 2)

        elif noise_type == "flare_maintenance_surge" and row_label == "normal_flare":
            # Flare venting / purging causes a brief thermal surge
            df.at[idx, "deviation_score"] = round(random.uniform(2.2, 3.4), 2)
            df.at[idx, "frp"] = round(df.at[idx, "frp"] * 2.2, 1)

        elif noise_type == "fence_line_stubble" and row_label == "agricultural_burn":
            # Stubble burning right outside industrial zone perimeter wall
            df.at[idx, "distance_to_site_km"] = round(random.uniform(0.15, 0.75), 2)
            df.at[idx, "land_cover_type"] = random.choice(["farmland", "industrial", "built_up"])
            df.at[idx, "confidence"] = "nominal"

        elif noise_type == "swath_edge_degradation" and row_label == "unregistered_anomaly":
            # Distant industrial shed with low thermal contrast
            df.at[idx, "frp"] = round(random.uniform(18.0, 32.0), 1)
            df.at[idx, "brightness_temp"] = round(random.uniform(325.0, 338.0), 1)

    # Shuffle dataset
    df = df.sample(frac=1.0, random_state=seed).reset_index(drop=True)
    logger.info(f"Generated {len(df)} labeled observations across 6 classes with authentic satellite remote sensing noise.")
    return df


if __name__ == "__main__":
    df = generate_benchmark_dataset(samples_per_class=200)
    print("Dataset generated successfully:")
    print(df["label"].value_counts())
