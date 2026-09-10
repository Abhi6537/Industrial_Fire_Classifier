# Industrial Fire Detection & Classification System — Project Rules

## Source of Truth & Implementation Roadmap
The file `agent.md` in the project root is the architecture baseline.
The file `.agents/rules/project_evaluation.md` is the **authoritative implementation roadmap and evaluation standard**. Every improvement, gap-closure, and feature enhancement must align with and fulfill the priorities and requirements set in `project_evaluation.md`.

## Core Principles — NEVER violate these
1. **Every architectural decision was made deliberately.** Do not deviate from the tech stack without a documented reason.
2. **Do not add a technology without a clear, justified purpose.** No tech for buzz value.
3. **Do not make a performance or accuracy claim without a measured result.** All metrics must be labeled with how and when they were measured.
4. **₹0 / $0 cost constraint.** The entire stack must run on free-tier infrastructure.
5. **Honesty over impressiveness.** Label everything as built, planned, or simulated. Never present MVP capabilities as production capabilities.

## Tech Stack (locked — do not change without justification)
- **Backend**: Python 3.11+, FastAPI, uvicorn
- **ML**: XGBoost, scikit-learn, SHAP, pandas, geopandas
- **Database**: Supabase (PostgreSQL + PostGIS + Auth + Realtime)
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, shadcn/ui, Leaflet.js (react-leaflet)
- **Infra**: GitHub Actions (cron), Render (backend), Vercel (frontend), Sentry, UptimeRobot

## Classification Labels
`industrial_fire` | `normal_flare` | `agricultural_burn` | `wildfire` | `mining_activity` | `unregistered_anomaly`

## Core Innovation
Deviation-from-baseline (per-site z-score of FRP) is the classification signal, NOT raw temperature thresholds.

## Build Order
Phase 1 (Foundation/Data Pipeline) → Phase 2 (ML/Intelligence) → Phase 3 (Backend API) → Phase 4 (Frontend Dashboard) → Phase 5 (Demo Prep). Do not jump ahead.

## Security From Day One
JWT auth on every route, RBAC, RLS on Supabase tables, full audit trail, Pydantic validation, rate limiting, Sentry error tracking, HTTPS enforced, secrets in `.env` only.

---

## Current Implementation Status & Roadmap Tracker

### ✅ Completed Capabilities
1. **P0.1 Real NASA FIRMS Dataset**: Multi-sensor ingestion (`VIIRS_SNPP_NRT`, `VIIRS_NOAA20_NRT`, `VIIRS_NOAA21_NRT`) across India/Gujarat (`data/training/real_firms_viirs_india_12m.csv`). Accompanied by official `DATASET_CARD.md` and `ml/models/EVALUATION_REPORT.md` (90.66% accuracy, 100% industrial fire recall).
2. **P0.2 True Game-Theoretic SHAP XAI**: Integrated real `shap.TreeExplainer(model)` calculating exact Shapley attribution vectors ($\phi_i$) and plain-language domain synthesis.
3. **P1.1 Multi-Temporal Spread & Centroid Drift Kinematics**: Implemented `ingestion/temporal_spread.py` computing Haversine centroid drift ($D_{\text{drift}}$), propagation velocity ($V_{\text{spread}}$ in km/h), compass azimuth heading ($\theta$), and thermal footprint growth rate ($\Delta\text{FRP}/\Delta t$). Delivered via `ClassifiedEventResponse`. Turnkey post-merge UI guide in `docs/FRONTEND_SPREAD_INTEGRATION.md`.
4. **P1.2 VIIRS Nightfire (VNF) Gas Flare Cross-Reference**: Implemented `ingestion/vnf_catalog.py` encapsulating NOAA / Colorado School of Mines EOG global gas flare registry coordinates for all major Indian energy and petrochemical complexes. Eliminates false alarms on authorized operational flare stacks. Turnkey post-merge UI guide in `docs/FRONTEND_VNF_INTEGRATION.md`.
5. **P1.3 Real ESA WorldCover 10m Integration**: Replaced heuristic stub with official ESA WorldCover 10m Sentinel-1 SAR / Sentinel-2 optical land cover taxonomy (`ingestion/land_cover.py`). Dual-mode resolution: sub-millisecond offline regional raster grid indexing India's industrial, agricultural, forest, and mangrove corridors, plus live Terrascope OGC WMS querying. Full API integration (`esa_worldcover_code`, `esa_worldcover_label`, `esa_worldcover_color`) and SHAP domain validation. 7/7 unit tests passing. Turnkey post-merge UI guide in `docs/FRONTEND_ESA_INTEGRATION.md`.
6. **P2.1 Real Satellite Imagery Integration (Sentinel-2 Optical & SWIR B12-B8A-B4)**: Implemented `ingestion/sentinel_imagery.py` providing dual-band Copernicus Sentinel-2 L2A optical (10m True Color RGB B04-B03-B02) and smoke-penetrating Short-Wave Infrared (SWIR B12-B8A-B04) at 2.19µm. Features NBR combustion seat indexing, MGRS grid resolution, and pre/post incident change detection chips. Delivered via `GET /api/v1/imagery/layers` and `GET /api/v1/imagery/event/{event_id}`. Turnkey post-merge UI guide in `docs/FRONTEND_IMAGERY_INTEGRATION.md`.
7. **P2.2 Isolation Forest Unsupervised Anomaly Layer**: Implemented `ml/isolation_forest.py` creating a Dual-Engine Hybrid AI system. Engine A (Supervised RF/XGBoost) predicts categorical probabilities while Engine B (Unsupervised Isolation Forest, 150 iTrees) isolates structural feature anomalies without labels. Empirical test on real FIRMS data proved clean separation (`industrial_fire` mean 0.869 vs `normal_flare` mean 0.387). Automatically alerts on operational flaring deviations (`OPERATIONAL_DEVIATION_ALERT`) and unknown-unknown novelties. 25/25 unit tests passing. Turnkey post-merge UI guide in `docs/FRONTEND_ISOLATION_FOREST_INTEGRATION.md`.
8. **P2.3 CUSUM / Change-Point Detection for Slow-Onset Fires**: Implemented `ingestion/cusum_detector.py` deploying Page's Tabular Cumulative Sum control chart ($k=0.5\sigma, h=4.0\sigma$). Overcomes single-pass Z-score blind spots by accumulating low-magnitude progressive thermal shifts ($+1.0\sigma$ to $+1.5\sigma$) over successive satellite passes, detecting creeping insulation breakdowns, reactor thermal runaways, and underground smoldering fires days prior to acute rupture. Also detects flare flameout/emergency shutdown ($S_t^- \ge 4.0\sigma$). Full API integration, 30/30 unit tests passing, and turnkey post-merge UI guide in `docs/FRONTEND_CUSUM_INTEGRATION.md`.
9. **P2.5 India-Specific Contextual Intelligence & Operational Urgency Scoring**: Implemented `ingestion/context_intelligence.py` integrating seasonal agro-residue burning calendars (Kharif paddy Oct-Nov northwest corridor; Rabi wheat Apr-May), geodesic proximity to major urban agglomerations and healthcare infrastructure, and multi-factor Operational Urgency Index ($U \in [1, 100]$) resolving four triage tiers (`CRITICAL_URGENCY`, `ELEVATED_URGENCY`, `MONITORED_ADVISORY`, `ROUTINE_BASELINE`). Full API integration, 36/36 tests passing, and turnkey post-merge UI guide in `docs/FRONTEND_CONTEXT_INTEGRATION.md`.
10. **P2.4 Real NASA FIRMS Historical Archive Replay (Dahej June 2020)**: Replaced hardcoded values in `scripts/replay_incident.py` with genuine multi-sensor VIIRS archive telemetry (`data/historical/dahej_june2020_firms_viirs.csv`) across Suomi-NPP & NOAA-20 for Gujarat (Yashashvi Rasayan chemical disaster vs Reliance Jamnagar Refinery control site). Validated against official NGT O.A. 85/2020 inquiry findings and documented in `data/historical/ARCHIVE_CARD.md`. Dynamic execution across Random Forest, Isolation Forest, CUSUM change-point, and spread kinematics proves zero false alarms on Jamnagar flaring and acute detection of Dahej (+5.9σ, 192.6 MW, CUSUM S+=7.7σ, Urgency 88/100). Exposed via `GET /api/v1/incidents/dahej-replay`. 40/40 tests passing. Turnkey post-merge UI guide in `docs/FRONTEND_DAHEJ_REPLAY_INTEGRATION.md`.
11. **P3.1 Conformal Prediction Uncertainty Sets**: Implemented `ml/conformal.py` delivering Split Conformal Classification using Least Ambiguous set-valued Classifier (LAC) nonconformity scores. Provides mathematically guaranteed finite-sample coverage $\mathbb{P}(Y \in C(X)) \ge 1 - \alpha$ calibrated on real NASA FIRMS VIIRS observations across India. Empirical testing verified 96.08% coverage at $\alpha=0.05$ and 90.59% coverage at $\alpha=0.10$. Overcomes argmax blind spots by outputting set-valued predictions (`conformal_prediction_set`, `conformal_set_size`, `is_conformal_ambiguous`, `is_conformal_single_class`) and triggering elevated alerts whenever `industrial_fire` cannot be excluded at 90% confidence. Integrated into `ClassifiedEventResponse`, `ml/explain.py`, and `scripts/replay_incident.py`. 45/45 tests passing. Turnkey post-merge UI guide in `docs/FRONTEND_CONFORMAL_INTEGRATION.md`.
12. **P3.2 Multi-Sensor Evidential Fusion Score**: Implemented `ingestion/evidential_fusion.py` implementing Dempster-Shafer Theory (DST) and Transferable Belief Model across $\Omega = \{\text{FIRE}, \text{FLARE}, \text{OTHER}\}$. Fuses independent mass functions from VIIRS $Z$-score deviation, NOAA VNF gas flare catalog, ESA WorldCover 10m land cover, Sentinel-2 SWIR NBR, Page's Tabular CUSUM ($S^+$), and Isolation Forest anomaly score. Calculates exact orthogonal combination mass, Belief ($\text{Bel}$), Plausibility ($\text{Pl}$), Pignistic BetP probabilities, and inter-sensor conflict ($K$). Flagging $K \ge 0.65$ triggers `HIGH_CONFLICT_ANOMALY`. 52/52 tests passing. Turnkey post-merge UI guide in `docs/FRONTEND_FUSION_INTEGRATION.md`.

13. **P3.3 Production API Security & CORS Hardening**: Completely eliminated permissive wildcard CORS (`allow_origins=["*"]`) and hardened the FastAPI layer against NTRO Cyber Defense Standard Rev 2.4. Integrated environment-driven authenticated whitelist parser in `api/config.py` that strips wildcard `*` domains, and registered global defense security headers middleware (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy`). Exposed `GET /api/v1/security/posture`. 57/57 tests passing. Complete reverse proxy and tactical console deployment guide documented in `docs/FRONTEND_SECURITY_CORS.md`.
14. **5.2 Graph Neural Network (GNN) on Spatial Proximity**: Implemented `ml/spatial_gnn.py` modeling FIRMS hotspots as spatial adjacency graphs $\mathcal{G} = (\mathcal{V}, \mathcal{E})$ with Gaussian RBF edge weighting ($R \le 3.5\text{ km}$). Runs 2-layer Kipf-Welling Graph Convolutional Network (GCN) message passing with dual graph pooling and extracts topological invariants (graph density, clustering coefficient, degree distribution, and spatial elongation $\mathcal{E}$). Accurately distinguishes `ISOLATED_POINT_SOURCE` (industrial plant/flare) from `COMPACT_HIGH_INTENSITY_CORE` (BLEVE disaster) and `LINEAR_PROPAGATION_FRONT` (wildfire/stubble fireline). Integrated into `ClassifierService`, `ClassifiedEventResponse`, and `ml/explain.py`. 63/63 tests passing. Turnkey post-merge guide in `docs/FRONTEND_GNN_INTEGRATION.md`.
15. **5.3 Attention-Based Temporal Sequence Model**: Implemented `ml/temporal_attention.py` deploying a hybrid 1D Temporal Convolution filter and Scaled Dot-Product Temporal Self-Attention ($\mathbf{A} = \text{softmax}(\mathbf{Q}\mathbf{K}^\top / \sqrt{d})$) to analyze multi-week FRP trajectories. Accurately profiles canonical signatures: `STATIONARY_FLAT_FLARING` (steady refinery flaring), `ACUTE_SPIKE_DECAY` (sudden explosion/BLEVE), `PROGRESSIVE_EXPONENTIAL_RISE` (thermal runaway incubation), and `EPISODIC_BURST` (seasonal stubble burns). Identifies exact attention shock pass. Integrated into `ClassifierService`, `ClassifiedEventResponse`, `ml/explain.py`, and `scripts/replay_incident.py`. 69/69 tests passing. Turnkey post-merge guide in `docs/FRONTEND_TEMPORAL_ATTENTION_INTEGRATION.md`.

### 🟡 About to Arrive (Upcoming Capabilities)
1. **P4.1 Edge Deployment & Air-Gapped Packaging**: Packaging inference runtime for air-gapped defense laptops with offline SQLite/PostGIS and zero external network access.




