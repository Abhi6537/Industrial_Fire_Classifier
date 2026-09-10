"""
Pydantic Schemas for Classified Events and Inference Requests
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class ClassifiedEventResponse(BaseModel):
    id: str
    latitude: float = Field(0.0, description="Latitude in decimal degrees")
    longitude: float = Field(0.0, description="Longitude in decimal degrees")
    label: str = Field(..., description="One of: industrial_fire, normal_flare, agricultural_burn, wildfire, mining_activity, unregistered_anomaly")
    confidence: float = Field(..., description="Model confidence score between 0.0 and 1.0")
    severity: str = Field("info", description="'critical', 'warning', or 'info'")
    deviation_score: float = Field(0.0, description="Z-score deviation from site baseline")
    land_cover_type: str = Field("other", description="industrial, forest, farmland, built_up, other")
    persistence_count: int = Field(1, description="Historical observation count")
    is_anomaly: bool = Field(False, description="Flag indicating anomalous behavior")
    site_name: Optional[str] = "None"
    site_type: Optional[str] = "none"
    classified_at: Optional[str] = None
    detected_at: Optional[str] = None
    frp: Optional[float] = None
    brightness_temp: Optional[float] = None
    distance_to_nearest_facility_km: Optional[float] = None
    centroid_drift_km: Optional[float] = Field(0.0, description="Drift distance from previous pass centroid in km")
    spread_velocity_kmph: Optional[float] = Field(0.0, description="Spread velocity in km/h")
    spread_bearing_deg: Optional[float] = Field(0.0, description="Compass bearing direction in degrees [0, 360)")
    spread_cardinal: Optional[str] = Field("STATIONARY", description="8-point compass cardinal direction (N, NE, E, etc.)")
    spread_classification: Optional[str] = Field("stationary", description="Kinematic class: stationary, expanding, migrating, isolated_first_pass")
    footprint_growth_rate: Optional[float] = Field(0.0, description="Radiative thermal output change rate in MW/h")
    is_known_vnf_flare: Optional[bool] = Field(False, description="True if hotspot matches a NOAA VIIRS Nightfire registered gas flare")
    vnf_flare_id: Optional[str] = Field(None, description="NOAA EOG VNF Registry ID")
    vnf_facility_name: Optional[str] = Field(None, description="Registered VNF facility name")
    distance_to_vnf_flare_km: Optional[float] = Field(None, description="Radial distance to closest VNF flare in km")
    esa_worldcover_code: Optional[int] = Field(50, description="Official ESA WorldCover 10m code (10=Forest, 40=Cropland, 50=Built-up, etc.)")
    esa_worldcover_label: Optional[str] = Field("Built-up", description="Official ESA WorldCover 10m class name")
    esa_worldcover_color: Optional[str] = Field("#fa0000", description="Official ESA WorldCover map hex color")
    has_sentinel_imagery: Optional[bool] = Field(True, description="True if Sentinel-2 optical/SWIR imagery is available")
    sentinel_mgrs_tile: Optional[str] = Field("42QWJ", description="Sentinel-2 MGRS grid tile ID")
    swir_burn_index: Optional[float] = Field(None, description="Normalized Burn Ratio / SWIR fire index")
    isolation_anomaly_score: Optional[float] = Field(None, description="Unsupervised Isolation Forest anomaly score [0.0, 1.0]")
    is_isolation_outlier: Optional[bool] = Field(False, description="True if Isolation Forest flags event as structural outlier")
    dual_engine_status: Optional[str] = Field("STANDARD_EVALUATION", description="Dual-engine consensus classification status")
    cusum_statistic: Optional[float] = Field(None, description="Current Page's high-side CUSUM statistic S+")
    cusum_alert: Optional[bool] = Field(False, description="True if CUSUM statistic S+ exceeds decision threshold h=4.0")
    cusum_regime: Optional[str] = Field("STABLE_BASELINE", description="CUSUM regime: STABLE_BASELINE, SLOW_ONSET_HEATING, RAPID_SURGE, FLAMEOUT")
    cusum_run_length: Optional[int] = Field(0, description="Consecutive passes with positive CUSUM accumulation")
    is_stubble_season: Optional[bool] = Field(False, description="True if detection occurs during seasonal agro-burning window")
    seasonal_context_label: Optional[str] = Field("Off-Season Agricultural Baseline", description="Seasonal agricultural window context")
    population_density_within_5km: Optional[int] = Field(500, description="Estimated population density within 5km radius (persons/km²)")
    distance_to_population_km: Optional[float] = Field(10.0, description="Distance to nearest major population hub/city center in km")
    nearest_population_center: Optional[str] = Field("Bharuch Urban Agglomeration", description="Closest urban settlement or industrial township")
    operational_urgency_score: Optional[int] = Field(50, description="Multi-factor civil defense urgency score [1, 100]")
    urgency_tier: Optional[str] = Field("MONITORED_ADVISORY", description="Civil response tier: CRITICAL_URGENCY, ELEVATED_URGENCY, MONITORED_ADVISORY, ROUTINE_BASELINE")
    conformal_prediction_set: Optional[List[str]] = Field(default_factory=lambda: ["normal_flare"], description="Mathematically guaranteed prediction set at 1-alpha confidence")
    conformal_confidence_level: Optional[float] = Field(0.90, description="Target finite-sample conformal coverage guarantee (e.g. 0.90 = 90%)")
    conformal_set_size: Optional[int] = Field(1, description="Number of candidate classes in conformal prediction set")
    is_conformal_ambiguous: Optional[bool] = Field(False, description="True if set_size > 1 indicating model uncertainty between candidate classes")
    is_conformal_single_class: Optional[bool] = Field(True, description="True if set_size == 1 indicating statistically unambiguous classification")
    fused_hazard_probability: Optional[float] = Field(None, description="Dempster-Shafer multi-sensor fused fire probability [0, 1]")
    fused_flare_probability: Optional[float] = Field(None, description="Dempster-Shafer multi-sensor fused flare probability [0, 1]")
    belief_fire: Optional[float] = Field(None, description="Dempster-Shafer belief lower bound Bel(FIRE)")
    plausibility_fire: Optional[float] = Field(None, description="Dempster-Shafer plausibility upper bound Pl(FIRE)")
    sensor_conflict_k: Optional[float] = Field(0.0, description="Inter-sensor conflict coefficient K [0, 1]")
    fusion_verdict: Optional[str] = Field("STANDARD_EVALUATION", description="Evidential decision verdict: CONFIRMED_INDUSTRIAL_FIRE, VERIFIED_ROUTINE_FLARE, etc.")
    gnn_cluster_id: Optional[str] = Field("GNN-NONE", description="Spatial hotspot graph cluster ID")
    gnn_cluster_size: Optional[int] = Field(1, description="Number of connected thermal nodes in spatial cluster")
    gnn_cluster_morphology: Optional[str] = Field("ISOLATED_POINT_SOURCE", description="Topology classification: ISOLATED_POINT_SOURCE, LINEAR_PROPAGATION_FRONT, COMPACT_HIGH_INTENSITY_CORE, DIFFUSE_AGRICULTURAL_SWEEP")
    gnn_graph_density: Optional[float] = Field(0.0, description="Spatial cluster graph density [0, 1]")
    gnn_clustering_coefficient: Optional[float] = Field(0.0, description="Spatial cluster transitivity / clustering coefficient")
    gnn_spatial_elongation: Optional[float] = Field(1.0, description="Aspect ratio of principal spatial variance axes (lambda1/lambda2)")
    gnn_industrial_topology_prob: Optional[float] = Field(0.94, description="Likelihood of localized industrial origin from graph topology")
    gnn_wildfire_topology_prob: Optional[float] = Field(0.06, description="Likelihood of macro-wildfire/stubble front from graph topology")
    temporal_signature_label: Optional[str] = Field("STATIONARY_FLAT_FLARING", description="1D-CNN temporal sequence signature: STATIONARY_FLAT_FLARING, ACUTE_SPIKE_DECAY, PROGRESSIVE_EXPONENTIAL_RISE, EPISODIC_BURST")
    temporal_attention_peak_pass: Optional[int] = Field(0, description="0-indexed satellite pass where self-attention placed maximum shock weight")
    temporal_stability_index: Optional[float] = Field(1.0, description="Trajectory stability score in [0, 1] where 1.0 is a steady baseline")
    temporal_profile_confidence: Optional[float] = Field(0.90, description="Confidence of temporal trajectory classification")
    shap_explanation: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class ClassifyRequest(BaseModel):
    """Payload for real-time ad-hoc classification endpoint."""
    latitude: float
    longitude: float
    brightness_temp: float = Field(340.0, description="Temperature in Kelvin")
    frp: float = Field(45.0, description="Fire Radiative Power in MW")
    confidence: str = Field("high", description="low, nominal, or high")
    site_name: Optional[str] = "Unmapped Location"
    site_type: Optional[str] = "none"
    land_cover_type: Optional[str] = "industrial"
    on_known_site: int = Field(0, description="1 if inside industrial polygon, else 0")
    persistence_count: int = Field(1, description="Number of prior detections")
    deviation_score: float = Field(0.0, description="Z-score deviation")
    distance_to_site_km: float = Field(0.0, description="Distance to closest facility")
    centroid_drift_km: Optional[float] = Field(0.0, description="Prior pass centroid drift distance")
    spread_velocity_kmph: Optional[float] = Field(0.0, description="Spread velocity in km/h")
    spread_classification: Optional[str] = Field("stationary", description="stationary, expanding, or migrating")
    is_known_vnf_flare: Optional[bool] = Field(False, description="True if matches NOAA VNF gas flare registry")
    esa_worldcover_code: Optional[int] = Field(50, description="ESA WorldCover 10m code")
