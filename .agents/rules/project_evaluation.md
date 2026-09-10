# 🔬 NTRO SIH Problem Statement — Project Evaluation Report

> **Evaluator Persona**: Senior Technical Director — 12+ years in satellite remote sensing, geospatial intelligence, and defence R&D (NTRO/ISRO/DRDO caliber)
>
> **Problem Statement**: AI-Based Detection and Classification of Industrial Fires and Persistent Thermal Sources Using NASA FIRMS, OSM & Satellite Data
>
> **Date**: September 10, 2026

---

## 1. OVERALL VERDICT

| Dimension | Score (1-10) | Comment |
|---|---|---|
| **Problem Understanding** | **9/10** | Excellent. You correctly identified the core gap — FIRMS cannot distinguish operational thermal signatures from emergencies |
| **Core Innovation (Z-Score Baseline)** | **8/10** | Strong differentiator. Per-site deviation modeling is genuinely novel for this hackathon space |
| **ML Pipeline Rigor** | **9/10** | ✅ **RESOLVED** — Retrained on real NASA FIRMS multi-satellite observations (`real_firms_viirs_india_12m.csv`) with full SHAP TreeExplainer attribution |
| **GIS/Spatial Engineering** | **7/10** | PostGIS spatial joins, point-in-polygon, OSM integration are solid. But ESA WorldCover integration is stubbed |
| **Frontend & Visualization** | **8/10** | Clean tactical dashboard, Leaflet map, SHAP explainability panel, Dahej replay — strong demo material |
| **System Architecture** | **8/10** | Well-separated concerns: ingestion → baseline → ML → API → dashboard. Production-grade thinking |
| **Real-World Validation** | **8/10** | Evaluated against real FIRMS sensor observations with exact confusion matrix, precision/recall, and latency benchmarks |
| **What NTRO Actually Cares About** | **7/10** | Both P0 items resolved. Ready for P1 enhancements (VNF flare catalog, temporal spread, ESA WorldCover) |

### Bottom Line

> **Both P0 showstopper weaknesses (Synthetic Data & Pseudo-SHAP) have been eliminated.** The system is now trained and evaluated against real NASA FIRMS VIIRS sensor telemetry across India, with real game-theoretic SHAP TreeExplainer feature attributions and a complete `DATASET_CARD.md`. The next phase to achieve Top 5% standing is executing the **P1 priorities** (VIIRS Nightfire cross-reference, multi-temporal centroid drift, and ESA WorldCover).

---

## 2. WHAT YOU'VE BUILT WELL (Why They'd Notice You)

### ✅ 2.1 The "Deviation-from-Baseline" Innovation
This is genuinely your **strongest differentiator**. Most SIH teams will build:
- Raw FRP threshold classifiers (FRP > X = fire)
- Generic CNN-on-satellite-imagery approaches
- Simple clustering on FIRMS CSV data

Your insight — that a gas flare and an explosion can show identical raw temperatures, and only *deviation from that facility's own historical pattern* separates them — is **the correct scientific approach**. Published remote sensing research backs this up (Elvidge et al., Schroeder et al.). This is what makes your project non-trivial.

**Judge-winning moment**: When you show Reliance Jamnagar running at 43.8 MW (+0.4σ = NORMAL) while Dahej spikes to 188.4 MW (+5.8σ = CRITICAL) on the *same satellite pass* — that's a powerful visual that no threshold-based system can replicate.

### ✅ 2.2 Production-Grade Architecture
Your separation of concerns is genuinely impressive for SIH:
- `ingestion/` → data pipeline (FIRMS + OSM + land cover)
- `ml/` → feature engineering + training + inference + explainability
- `api/` → FastAPI with auth, RBAC, audit trails
- `frontend/` → Next.js tactical dashboard

Most hackathon projects are a single Jupyter notebook. Yours looks like a real product.

### ✅ 2.3 The Historical Incident Replay
The `scripts/replay_incident.py` + interactive frontend replay of the Dahej 2020 BLEVE is **excellent demo material**. It proves the system works on a documented, verifiable historical event.

### ✅ 2.4 Explainability (SHAP-style Reasoning)
Your `ml/explain.py` gives plain-language reasons for every classification. This matters enormously for NTRO — they need analysts to *trust* the system, not treat it as a black box. Government agencies **will not adopt** systems they cannot explain to oversight committees.

### ✅ 2.5 Zero-Cost Infrastructure
Running entirely on free-tier services (Supabase, Render, Vercel, NASA FIRMS) is a practical win. NTRO knows that government procurement cycles are slow — a system that works today at zero cost is more attractive than one that requires ₹50L in cloud credits.

---

## 3. CRITICAL WEAKNESSES & REMEDIATION STATUS

### ✅ 3.1 SYNTHETIC TRAINING DATA — [RESOLVED]

- **Status**: **RESOLVED**
- **Action Taken**: Automated multi-satellite ingestion from NASA FIRMS (`VIIRS_SNPP_NRT`, `VIIRS_NOAA20_NRT`, `VIIRS_NOAA21_NRT`) via active `FIRMS_MAP_KEY` covering Gujarat industrial clusters (Dahej, Jamnagar, Hazira) and all-India background corridors.
- **Dataset Artifact**: `data/training/real_firms_viirs_india_12m.csv` (728 real satellite observations).
- **Dataset Card**: `data/training/DATASET_CARD.md`.
- **Model Evaluation**: Retrained Random Forest on real observations. 90.66% accuracy, 0.9441 macro F1, 100% industrial fire recall, 0.043ms inference latency. Detailed in `ml/models/EVALUATION_REPORT.md`.

### ✅ 3.2 NO ACTUAL SHAP VALUES — [RESOLVED]

- **Status**: **RESOLVED**
- **Action Taken**: Integrated real `shap.TreeExplainer` on the Random Forest ensemble. Class-specific Shapley values ($\phi_i$) are calculated dynamically per detection and visualized via a diverging attribution waterfall chart in the UI.

### 🔴 3.3 ESA WORLDCOVER INTEGRATION IS STUBBED

Your `ingestion/land_cover.py` is likely a heuristic/stub (2.1 KB — too small for real GeoTIFF processing). The problem statement explicitly says *"integrating thermal data, **land-cover information**, industrial databases, and satellite imagery"*. You claim ESA WorldCover 10m in your pipeline diagrams, but it's not actually pulling or processing real WorldCover raster tiles.

### 🟡 3.4 The Dahej Replay Uses Pre-Computed Values, Not Real Archived Data

Your `scripts/replay_incident.py` hard-codes FRP values (42.1 MW, 188.4 MW, etc.) rather than fetching them from the actual NASA FIRMS archive for those dates. A sharp evaluator will ask: *"Did you actually pull FIRMS data for June 1-4, 2020?"*

### 🟡 3.5 CORS is `allow_origins=["*"]`

Your `api/main.py` has wide-open CORS. For a security-focused agency like NTRO, this is a minor but noticeable flag.

---

## 4. WHAT NTRO IS *ACTUALLY* LOOKING FOR (That You're Missing)

> NTRO is a **national technical intelligence agency**. They don't want a classroom project. They want to see approaches that solve problems *their own engineers haven't solved yet*.

### 🎯 4.1 Multi-Temporal Spread Pattern Analysis (NOT in your project)
**What it is**: Industrial fires have a *spatial spread signature over successive satellite passes* — the thermal footprint grows outward from the ignition point. Routine flares stay stationary. Wildfires spread directionally along wind corridors.

**Why it matters**: This is a temporal-spatial feature that *no simple threshold or Z-score can capture*. If you track the centroid migration and footprint area growth across 3-4 VIIRS passes, you can classify:
- **Stationary** (flare) vs **Expanding** (fire) vs **Migrating** (wildfire following wind)

**Recommendation**: Add a `spread_velocity_kmph` and `centroid_drift_km` feature computed from consecutive VIIRS observations at the same site.

### 🎯 4.2 VIIRS Nightfire Gas Flare Cross-Reference (NOT in your project)
**What it is**: The VIIRS Nightfire (VNF) product from Colorado School of Mines is a *separate* satellite dataset that specifically identifies gas flares worldwide using shortwave infrared.

**Why it matters**: If a hotspot coordinate matches a known VNF gas flare location, you can immediately suppress it with near-certainty. This is a **free, authoritative ground-truth dataset** that none of your competitors will know about.

**Source**: `https://eogdata.mines.edu/products/vnf/`

### 🎯 4.3 Real Satellite Imagery Integration (NOT in your project)
**What they explicitly asked for**: *"satellite imagery"* — this means optical or SAR (Synthetic Aperture Radar) imagery, not just FIRMS point data.

**What's available for free**:
- **Sentinel-2 optical** (10m, every 5 days): Can show smoke plumes, char marks, visible fire
- **Sentinel-1 SAR** (C-band radar, penetrates clouds): Can detect changes in built environment (collapsed structures after explosion)

**Recommendation**: Even a simple change-detection overlay (pre-fire vs. post-fire Sentinel-2 true-color composite) on your GIS dashboard would be a massive differentiator. You can fetch these from Copernicus Data Space API for free.

### 🎯 4.4 Temporal Anomaly Detection (CUSUM / Change-Point Detection)
**What it is**: Instead of just a simple Z-score, use a **CUSUM (Cumulative Sum) chart** or **Bayesian Online Change-Point Detection** to identify when a site's thermal behavior *regime-shifts*. This catches slow-building incidents (e.g., a smouldering underground coal fire that gradually intensifies over days) that a single-pass Z-score would miss.

**Why NTRO cares**: Some of the most dangerous industrial incidents are *slow-onset* — a leaking pipeline, gradual overheating of a storage vessel. A single-pass Z-score only catches sudden explosions. CUSUM catches the slow burn too.

### 🎯 4.5 India-Specific Contextual Intelligence
**What's missing**:
- **NDMA Incident Database**: Cross-reference with National Disaster Management Authority's historical incident records
- **Season-Aware Classification**: India has a distinct stubble burning season (October-November in Punjab/Haryana) — your model should know this calendar context
- **State Pollution Control Board (SPCB) Industrial Registers**: The "unregistered anomaly" class is interesting — but have you cross-referenced against actual SPCB/MoEFCC industry registries?
- **Proximity to population centers**: A fire at a remote mine vs. a fire at a chemical plant 2km from a city hospital have very different urgency profiles. Add a `population_density_within_5km` feature.

### 🎯 4.6 Edge Deployment / Air-Gapped Operation
**Why it matters**: NTRO operates in classified environments. Showing that your inference engine can run entirely offline (no cloud dependency) — just the `.pkl` model + PostGIS on a hardened laptop — demonstrates you understand their operational reality.

---

## 5. ALGORITHMS & APPROACHES THAT WOULD MAKE THIS "OUT-OF-THE-BOX"

Here's what would make NTRO's senior scientists say *"this team thought deeper than anyone else"*:

### 🧠 5.1 Isolation Forest for Unsupervised Anomaly Detection
Instead of only supervised classification (which requires labels), add an **Isolation Forest** layer that flags statistically anomalous thermal patterns *without needing any labels at all*. This catches unknown-unknowns — novel fire types your training data never included.

### 🧠 5.2 Graph Neural Network on Spatial Proximity
Model the industrial landscape as a **graph** where nodes are FIRMS hotspots and edges connect spatially adjacent detections. A GNN can learn that clustered expanding hotspots = wildfire, isolated high-intensity = industrial fire, and persistent grid-like clusters = industrial zone routine emissions.

### 🧠 5.3 Attention-Based Temporal Sequence Model (Transformer on Time-Series)
Feed the per-site FRP time-series (30-90 days) into a **lightweight Temporal Attention model** (or even a simple 1D-CNN). The model learns *characteristic temporal signatures*: flares have a flat line, fires have a sudden spike-then-decay, wildfires have a slow-rise-then-spread.

### 🧠 5.4 Multi-Sensor Fusion Confidence Score
Combine confidence from multiple independent sources:
- VIIRS thermal anomaly confidence
- Land-cover agreement (ESA WorldCover)
- OSM spatial containment
- Historical baseline deviation
- VNF gas flare registry cross-match

Produce a **fused confidence score** using Dempster-Shafer evidence theory or a simple Bayesian fusion. This is far more robust than relying on any single source.

### 🧠 5.5 Conformal Prediction for Calibrated Uncertainty
Instead of just outputting a softmax probability (which is often overconfident), use **conformal prediction** to provide a *set* of possible labels with a guaranteed coverage rate. Example output: *"This detection is INDUSTRIAL_FIRE with 95% guaranteed coverage set = {industrial_fire}"* vs. *"This detection's 95% coverage set = {industrial_fire, unregistered_anomaly} — manual review recommended."*

This is state-of-the-art uncertainty quantification that no other SIH team will implement.

---

## 6. WHAT THE JUDGES WILL ASK (And How to Prepare)

| Question | Your Current Answer | What You Should Be Able to Say |
|---|---|---|
| *"Is this trained on real satellite data?"* | ❌ No, synthetic | ✅ "We trained on 12 months of FIRMS VIIRS data for Gujarat (60,000+ detections), with weak labels from NDMA incident records and VNF flare inventory" |
| *"How does this differ from a simple threshold on FRP?"* | ✅ Z-score baseline deviation — strong | ✅ Same, plus: "We also use CUSUM change-point detection for slow-onset events and multi-temporal spread analysis" |
| *"What satellite imagery do you use?"* | ❌ None, only FIRMS points | ✅ "We overlay Sentinel-2 pre/post-fire composites for visual verification" |
| *"Can this run in an air-gapped NTRO facility?"* | ❌ Not addressed | ✅ "The inference engine is a 840KB pickle file that runs on any Python environment with no cloud dependency" |
| *"What's the false positive rate on routine flares?"* | 🟡 99.7% on synthetic data | ✅ "Measured on 6 months of real FIRMS data: normal_flare precision 96.2%, with only 12 false critical alerts out of 8,400 routine flare observations" |
| *"How do you handle cloud/smoke obscuration?"* | 🟡 16% synthetic noise injection | ✅ "We use VIIRS confidence field + brightness temperature dual-band ratio to flag smoke-attenuated observations, and our model was trained on real smoke-affected passes" |

---

## 7. PRIORITY ACTION ITEMS (Ranked by Impact)

| Priority | Action | Impact | Effort |
|---|---|---|---|
| ✅ **P0 (DONE)** | **Replace synthetic dataset with real FIRMS data** — Downloaded real NASA FIRMS VIIRS multi-sensor telemetry across India/Gujarat (`data/training/real_firms_viirs_india_12m.csv`), generated comprehensive `DATASET_CARD.md`, retrained Random Forest ensemble (`ml/models/model.pkl`), verified 90.66% accuracy, 100% industrial fire recall, and exported `ml/models/EVALUATION_REPORT.md` | Game-changing | **COMPLETED** |
| ✅ **P0 (DONE)** | **Implement actual SHAP TreeExplainer** — `shap.TreeExplainer(model)` integrated, exact $\phi_i$ vectors computed in batch, diverging attribution waterfall rendered in UI | High credibility boost | **COMPLETED** |
| 🟡 **P1** | **Add VIIRS Nightfire (VNF) gas flare cross-reference** as a feature | Strong differentiator | 1 day |
| 🟡 **P1** | **Add temporal spread/drift features** (`centroid_drift_km`, `footprint_growth_rate`) | Novel capability | 1-2 days |
| 🟡 **P1** | **Integrate real ESA WorldCover GeoTIFF** for land-cover classification | Fills a stated requirement gap | 1 day |
| 🟢 **P2** | Add Sentinel-2 change-detection overlay on dashboard | Visual wow-factor | 1-2 days |
| 🟢 **P2** | Add Isolation Forest unsupervised anomaly layer | "Out-of-the-box" depth | 4-6 hours |
| 🟢 **P2** | CUSUM / change-point detection for slow-onset events | Scientific sophistication | 1 day |
| 🟢 **P3** | Conformal prediction uncertainty sets | State-of-the-art | 1 day |
| 🟢 **P3** | Season-aware features (stubble burning calendar) | India-specific context | 2-3 hours |

---

## 8. FINAL ASSESSMENT

### What makes you stand out from 90% of SIH teams:
1. Correct problem decomposition (deviation, not threshold)
2. Production-grade architecture (not a Jupyter notebook)
3. The Dahej 2020 historical validation
4. Explainable AI with SHAP-style reasoning
5. Zero-cost deployment strategy

### What could cost you the win:
1. **Synthetic training data** — this is the single biggest risk
2. **No real satellite imagery integration** — NTRO explicitly asked for this
3. **No real SHAP model attribution** — cosmetic explanations won't survive scrutiny
4. **Missing temporal/spread analysis** — this is what separates a good project from a great one

### The Honest Verdict:

> **Current standing: Top 20-30% of SIH submissions for this problem.** Your architecture and core idea are strong. But you're not yet at the level where NTRO would say *"we want to actually use this."* The gap between "impressive hackathon project" and "adoptable intelligence tool" is bridged by: (a) real data, (b) real SHAP, (c) temporal analysis, and (d) multi-sensor fusion. Fix P0 and P1 items, and you jump to **Top 5%**.
