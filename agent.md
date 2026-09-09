# AGENT.md — Industrial Fire Detection & Classification System
# Smart India Hackathon 2026 | NTRO Problem Statement

---

## WHO YOU ARE

You are a Senior Full-Stack Engineer and ML Engineer working on a real, production-grade geospatial intelligence system commissioned by the National Technical Research Organisation (NTRO), India. This is not a hackathon toy — you are building a system that a national security and disaster management agency will actually evaluate for real-world adoption.

You write clean, modular, well-documented code. You never cut corners on architecture. You always separate concerns properly. You always explain what you are building and why before writing code. You flag risks and limitations honestly rather than hiding them.

You follow this development philosophy:
- Build the simplest thing that is genuinely correct, not the most impressive-looking thing
- Every component must earn its place — no tech added for buzz value
- Label everything honestly: what is built, what is planned, what is simulated
- Free-tier infrastructure only — the entire stack must run at ₹0 / $0 cost
- Production-grade architecture even at MVP scale — security, logging, error handling from day one

---

## WHAT THIS SYSTEM DOES — READ THIS FIRST, EVERY TIME

### The problem in one paragraph
Satellites detect heat from space and mark "hot dots" on a map. India has hundreds of refineries, steel plants, LNG terminals, power plants, and mining facilities that generate heat 24/7 as part of normal operations (gas flares, furnaces, etc.). When a real emergency happens — an explosion, accidental fire, gas leak — it looks almost identical on a satellite to a routine operation. NASA's FIRMS system (the world's primary satellite fire monitoring tool) shows you every hot dot but cannot tell you which ones are genuine emergencies. No India-specific, automatically-updating classification system exists today.

### What we are building
A geospatial AI platform that:
1. Ingests satellite thermal anomaly detections from NASA FIRMS/VIIRS (real, public, free data)
2. Spatially cross-references each detection against OpenStreetMap industrial site polygons
3. Builds and maintains a per-site historical thermal baseline for every known industrial facility
4. Scores each new detection as a deviation from that site's own normal pattern
5. Classifies the detection into one of: industrial_fire | normal_flare | agricultural_burn | wildfire | mining_activity | unregistered_anomaly
6. Surfaces classified, explainable results on a live GIS dashboard with real-time alerts
7. Logs every analyst action for full audit trail

### The core insight (this is the innovation — understand it deeply)
Raw temperature and Fire Radiative Power (FRP) values OVERLAP heavily between fire types. A gas flare and a real refinery explosion can show near-identical temperature readings. What actually separates them is BEHAVIORAL PATTERN OVER TIME:
- A gas flare appears at the same coordinates every single night, at roughly the same intensity → this is its baseline
- A real emergency shows up as a sudden DEVIATION from that baseline — either a new location never seen before, or a known location suddenly showing 3-5x its normal heat output
- This deviation-from-baseline approach is proven in published research to outperform raw temperature thresholds for this classification task
This is why our system is different from just relabeling FIRMS data.

---

## FULL TECHNICAL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA SOURCES (External)                  │
│  NASA FIRMS/VIIRS API │ OpenStreetMap Overpass │ ESA WorldCover │
└──────────────┬──────────────────┬───────────────────────────┘
               │                  │
               ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│              INGESTION & ETL LAYER                          │
│  Python scripts — scheduled via GitHub Actions (cron)       │
│  • Pull new FIRMS detections (CSV/JSON)                     │
│  • Fetch OSM industrial polygons for target region          │
│  • Fetch land-cover classification tiles                    │
│  • Clean, validate, deduplicate                             │
│  • Load into PostGIS with spatial indexing                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              SPATIAL DATABASE — PostGIS (Supabase)          │
│  Tables:                                                    │
│  • detections — raw FIRMS records                           │
│  • sites — OSM industrial site polygons                     │
│  • site_history — per-site thermal history                  │
│  • classified_events — output with labels + confidence      │
│  • analyst_actions — audit log                              │
│  • alerts — notification queue                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
               ┌───────────┴────────────┐
               ▼                        ▼
┌──────────────────────┐   ┌───────────────────────────────┐
│  BASELINE ENGINE     │   │  ML CLASSIFIER                │
│  Pure Python/pandas  │   │  scikit-learn / XGBoost       │
│  • Per-site mean,    │   │  • Trained once offline       │
│    std dev of FRP    │   │  • Loaded as .pkl at runtime  │
│    and temperature   │   │  • Input: enriched feature    │
│  • Z-score deviation │   │    vector per detection       │
│    from normal       │   │  • Output: label + confidence │
│  • Updates on every  │   │  • SHAP values for explainabi-│
│    new ingestion run │   │    lity                       │
└──────────┬───────────┘   └──────────────┬────────────────┘
           │                              │
           └──────────────┬───────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                 BACKEND API — FastAPI (Python)               │
│  • Supabase Auth (JWT validation middleware)                 │
│  • Role-based access: analyst / supervisor / auditor        │
│  • Endpoints: detections, sites, events, alerts, audit-log  │
│  • Runs inference on incoming detections via loaded model   │
│  • Writes results + SHAP explanation back to DB             │
│  • Deployed: Render free web service                        │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API + Supabase Realtime WS
               ┌───────────┴─────────────────────┐
               ▼                                 ▼
┌──────────────────────────┐   ┌─────────────────────────────┐
│  MAP DASHBOARD           │   │  ALERT & COMMUNICATION      │
│  Next.js + Tailwind CSS  │   │  CENTER                     │
│  + shadcn/ui + Leaflet.js│   │  Supabase Realtime          │
│  • Color-coded map       │   │  • In-app notification feed │
│    markers per category  │   │  • Per-alert analyst        │
│  • Click → explainability│   │    discussion threads       │
│    panel (SHAP reasons)  │   │  • Acknowledge / escalate   │
│  • Time-lapse slider     │   │  • Full audit log           │
│  • Filter by region,     │   │  Deployed: Vercel free tier │
│    date, category        │   │                             │
│  • Role-aware views      │   │                             │
└──────────────────────────┘   └─────────────────────────────┘
```

---

## COMPLETE TECH STACK

### Backend & ML
| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.11+ | Primary language for all backend + ML |
| FastAPI | latest | REST API framework |
| uvicorn | latest | ASGI server |
| pandas | latest | Data manipulation |
| geopandas | latest | Spatial data operations |
| scikit-learn | latest | Random Forest classifier |
| xgboost | latest | Gradient boosted classifier (primary) |
| shap | latest | Explainability — why each detection was classified as it was |
| requests | latest | HTTP client for FIRMS/OSM API calls |
| python-jose | latest | JWT auth validation |
| supabase-py | latest | Supabase Python client |

### Database
| Tool | Purpose |
|------|---------|
| Supabase (free tier) | Managed PostgreSQL + PostGIS + Auth + Realtime |
| PostGIS extension | Spatial queries — point-in-polygon, distance, area |

### Frontend
| Tool | Purpose |
|------|---------|
| Next.js 14 (App Router) | React framework, routing, SSR |
| Tailwind CSS | Utility-first styling |
| shadcn/ui | Pre-built accessible UI components |
| Leaflet.js (react-leaflet) | Interactive GIS map rendering |
| Supabase JS client | Auth, data fetching, realtime subscriptions |
| SWR or React Query | Client-side data fetching and caching |

### Infrastructure (all free tier)
| Tool | Purpose |
|------|---------|
| GitHub + GitHub Actions | Version control + scheduled ingestion jobs (cron) |
| Render free web service | FastAPI backend hosting |
| Vercel free tier | Next.js frontend hosting |
| Supabase free tier | Database + Auth + Realtime |
| UptimeRobot free | Uptime monitoring, alerts if services go down |
| Sentry free tier | Error tracking and logging |

### Data Sources (all free, no API key cost)
| Source | What it provides |
|--------|-----------------|
| NASA FIRMS API | Hotspot detections — lat/lon, brightness temp, FRP, confidence, timestamp |
| OpenStreetMap Overpass API | Industrial site polygons — refineries, power plants, steel plants, mines |
| ESA WorldCover / ISRO Bhuvan | Land-cover classification — forest, farmland, industrial, built-up |

---

## DATABASE SCHEMA — build this exactly

```sql
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Raw FIRMS detections
CREATE TABLE detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  geom GEOMETRY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED,
  brightness_temp DOUBLE PRECISION,
  frp DOUBLE PRECISION,
  confidence VARCHAR(10),
  satellite VARCHAR(20),
  instrument VARCHAR(20),
  detected_at TIMESTAMPTZ NOT NULL,
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (latitude, longitude, detected_at)
);
CREATE INDEX idx_detections_geom ON detections USING GIST(geom);
CREATE INDEX idx_detections_detected_at ON detections (detected_at);

-- OSM industrial site polygons
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  osm_id BIGINT UNIQUE,
  name VARCHAR(255),
  site_type VARCHAR(100),
  geom GEOMETRY(Polygon, 4326),
  centroid GEOMETRY(Point, 4326) GENERATED ALWAYS AS (ST_Centroid(geom)) STORED,
  region VARCHAR(100),
  state VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sites_geom ON sites USING GIST(geom);

-- Per-site thermal history (baseline store)
CREATE TABLE site_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id),
  detection_id UUID REFERENCES detections(id),
  frp_value DOUBLE PRECISION,
  brightness_temp DOUBLE PRECISION,
  recorded_at TIMESTAMPTZ NOT NULL,
  day_of_week SMALLINT,
  hour_of_day SMALLINT
);
CREATE INDEX idx_site_history_site_id ON site_history(site_id);

-- Classified and enriched events (output of the pipeline)
CREATE TABLE classified_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  detection_id UUID REFERENCES detections(id),
  site_id UUID REFERENCES sites(id),
  label VARCHAR(50) NOT NULL,
  confidence DOUBLE PRECISION,
  severity VARCHAR(20),
  deviation_score DOUBLE PRECISION,
  land_cover_type VARCHAR(50),
  persistence_count INTEGER,
  shap_explanation JSONB,
  classified_at TIMESTAMPTZ DEFAULT NOW(),
  is_anomaly BOOLEAN DEFAULT FALSE
);

-- Analyst actions — audit log
CREATE TABLE analyst_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES classified_events(id),
  analyst_id UUID,
  action VARCHAR(50) NOT NULL,
  note TEXT,
  acted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alert notification queue
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES classified_events(id),
  severity VARCHAR(20),
  status VARCHAR(20) DEFAULT 'unread',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID
);

-- Alert discussion threads
CREATE TABLE alert_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES alerts(id),
  analyst_id UUID,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## ML PIPELINE — build this exactly

### Features going into the classifier (these are the columns)
```python
FEATURE_COLUMNS = [
    'brightness_temp',          # Raw sensor reading in Kelvin
    'frp',                      # Fire Radiative Power in MW
    'confidence_numeric',       # FIRMS confidence: low=0, nominal=1, high=2
    'on_known_site',            # 1 if detection falls inside an OSM polygon, else 0
    'site_type_encoded',        # Encoded: refinery=0, power_plant=1, steel=2, mine=3, none=-1
    'land_cover_encoded',       # Encoded: industrial=0, forest=1, farmland=2, built_up=3, other=4
    'persistence_count',        # Number of times this location has been seen historically
    'deviation_score',          # Z-score: (today_frp - site_mean_frp) / site_std_frp
    'hour_of_day',              # 0-23
    'day_of_week',              # 0-6
    'is_first_detection',       # 1 if never seen at this location before
]

TARGET_COLUMN = 'label'

LABEL_CLASSES = [
    'industrial_fire',
    'normal_flare',
    'agricultural_burn',
    'wildfire',
    'mining_activity',
    'unregistered_anomaly',
]
```

### Training script structure
```python
# train_model.py — run this ONCE locally before deployment
# 1. Load historical FIRMS data + confirmed labels
# 2. Enrich each row with OSM site data and baseline stats
# 3. Build feature matrix X and label vector y
# 4. Handle class imbalance with class_weight='balanced'
# 5. Train XGBoost classifier
# 6. Evaluate on held-out test set — print precision, recall, F1 per class
# 7. Compute SHAP values for the test set to validate explainability
# 8. Save model as model.pkl and label encoder as encoder.pkl
# Always label metrics as "Measured on test set — [date]" in comments
```

### Labeling strategy (honest weak labeling — say this to judges)
```
industrial_fire  → Cross-referenced against NISSMAT India fire incident registry
                   + manually verified news sources for major industrial fires in India
normal_flare     → Detections at locations confirmed in VIIRS Nightfire gas flare
                   inventory, AND seen on 20+ consecutive nights (persistence rule)
wildfire         → Detections in dense forest land-cover, >5km from any known
                   industrial OSM polygon, spreading pattern across passes
agricultural_burn → Farmland land-cover, short-lived (<3 passes), seasonal pattern
mining_activity  → Within mining site OSM polygon, stable low-FRP persistent signal
unregistered_anomaly → On industrial/built-up land cover but NOT in any OSM polygon
```

---

## REPOSITORY STRUCTURE — set this up exactly

```
industrial-fire-detection/
├── AGENT.md                    ← this file
├── README.md
├── .env.example                ← env vars template, never commit real .env
├── .gitignore
│
├── ingestion/                  ← data pipeline scripts
│   ├── __init__.py
│   ├── firms_client.py         ← pulls FIRMS/VIIRS data
│   ├── osm_client.py           ← pulls industrial polygons from OSM
│   ├── land_cover.py           ← assigns land-cover type to each detection
│   ├── spatial_join.py         ← PostGIS point-in-polygon join logic
│   ├── baseline.py             ← computes per-site mean/std/deviation
│   └── loader.py               ← writes enriched rows to Supabase
│
├── ml/
│   ├── train_model.py          ← offline training script (run locally)
│   ├── predict.py              ← inference on new detections
│   ├── features.py             ← feature engineering
│   ├── evaluate.py             ← precision/recall/F1 reporting
│   ├── explain.py              ← SHAP explanation computation
│   ├── models/                 ← saved .pkl files (gitignored for large files)
│   └── notebooks/              ← exploration notebooks (not production code)
│
├── api/                        ← FastAPI backend
│   ├── main.py                 ← app entry point
│   ├── config.py               ← settings from env vars
│   ├── database.py             ← Supabase connection
│   ├── auth.py                 ← JWT validation middleware
│   ├── models/                 ← Pydantic schemas
│   │   ├── detection.py
│   │   ├── event.py
│   │   └── alert.py
│   └── routers/
│       ├── detections.py
│       ├── events.py
│       ├── sites.py
│       ├── alerts.py
│       └── audit.py
│
├── frontend/                   ← Next.js app
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── layout.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx        ← main map view
│   │   │   ├── alerts/
│   │   │   │   └── page.tsx    ← alert console
│   │   │   └── audit/
│   │   │       └── page.tsx    ← audit log view
│   │   └── layout.tsx
│   ├── components/
│   │   ├── map/
│   │   │   ├── FireMap.tsx
│   │   │   ├── HotspotMarker.tsx
│   │   │   └── ExplanationPanel.tsx
│   │   ├── alerts/
│   │   │   ├── AlertFeed.tsx
│   │   │   └── AlertThread.tsx
│   │   └── ui/                 ← shadcn/ui components
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── api.ts
│   └── package.json
│
├── .github/
│   └── workflows/
│       ├── ingest.yml          ← scheduled FIRMS pull (cron)
│       └── deploy.yml          ← CI/CD
│
└── scripts/
    ├── setup_db.sql            ← database schema
    └── seed_sites.py           ← load OSM polygons for target region
```

---

## ENVIRONMENT VARIABLES — set these up first

```bash
# .env (never commit this)

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NASA FIRMS
FIRMS_MAP_KEY=your-firms-mapkey  # Free — register at firms.modaps.eosdis.nasa.gov

# Target region (start with one region for MVP)
TARGET_REGION=gujarat  # or jharkhand, or a lat/lon bounding box
TARGET_BBOX=68.0,20.0,78.0,26.0  # west,south,east,north

# ML model path
MODEL_PATH=ml/models/model.pkl
ENCODER_PATH=ml/models/encoder.pkl

# API
SECRET_KEY=your-jwt-secret
API_URL=http://localhost:8000

# Sentry
SENTRY_DSN=your-sentry-dsn
```

---

## STEP-BY-STEP BUILD ORDER — follow this exactly, do not jump ahead

### Phase 1 — Foundation (do this first, nothing else works without it)
```
Step 1.1  Set up GitHub repository with the folder structure above
Step 1.2  Create Supabase project, enable PostGIS, run setup_db.sql
Step 1.3  Set up .env file with Supabase credentials and FIRMS key
Step 1.4  Write firms_client.py — pull FIRMS CSV for the target region
Step 1.5  Write osm_client.py — fetch industrial polygons via Overpass API
Step 1.6  Write spatial_join.py — PostGIS point-in-polygon join
Step 1.7  Write loader.py — insert enriched detections into Supabase
Step 1.8  Test the full ingestion pipeline manually end to end
Step 1.9  Set up GitHub Actions cron job for automatic ingestion
MILESTONE: real satellite data is landing in your database automatically
```

### Phase 2 — Intelligence layer
```
Step 2.1  Write baseline.py — compute per-site mean, std dev, z-score deviation
Step 2.2  Write features.py — build the full feature vector from enriched data
Step 2.3  Build the training dataset (historical FIRMS + weak labels)
Step 2.4  Write train_model.py — train XGBoost, evaluate, save model.pkl
Step 2.5  Write predict.py — load saved model, run inference on new detections
Step 2.6  Write explain.py — SHAP values → human-readable top reasons
Step 2.7  Write classified_events insert logic — save label, confidence, SHAP
MILESTONE: every incoming detection gets a label and explanation stored in DB
```

### Phase 3 — Backend API
```
Step 3.1  Set up FastAPI app skeleton (main.py, config.py, database.py)
Step 3.2  Set up Supabase Auth JWT middleware (auth.py)
Step 3.3  Build /events router — GET classified events with filters
Step 3.4  Build /sites router — GET OSM site polygons
Step 3.5  Build /alerts router — GET, PATCH (acknowledge), POST (comment)
Step 3.6  Build /audit router — GET analyst action log
Step 3.7  Wire model inference into the API — POST /classify endpoint
Step 3.8  Add Sentry error tracking
Step 3.9  Deploy to Render free web service
MILESTONE: API is live, returning real data, authentication working
```

### Phase 4 — Frontend dashboard
```
Step 4.1  Set up Next.js 14 project with Tailwind CSS + shadcn/ui
Step 4.2  Set up Supabase JS client and auth (login page + session handling)
Step 4.3  Build FireMap.tsx — Leaflet map with color-coded markers
          Colors: red=industrial_fire, orange=unregistered_anomaly,
                  grey=normal_flare, green=wildfire, yellow=agricultural_burn
Step 4.4  Build HotspotMarker.tsx — click → side panel with explanation
Step 4.5  Build ExplanationPanel.tsx — shows SHAP reasons in plain English
Step 4.6  Build AlertFeed.tsx — Supabase Realtime subscription on alerts table
Step 4.7  Build AlertThread.tsx — per-alert analyst discussion thread
Step 4.8  Build audit log page — table of analyst actions
Step 4.9  Deploy to Vercel free tier
MILESTONE: dashboard is live, real-time alerts working, full user workflow complete
```

### Phase 5 — Demo preparation (do not skip)
```
Step 5.1  Pick one real, documented historical industrial fire incident in India
Step 5.2  Replay it day-by-day using archived FIRMS data
Step 5.3  Prove the system flags it as anomalous BEFORE it became "obvious"
Step 5.4  Side-by-side: the same region's routine flares staying grey/normal
Step 5.5  Record a screen capture of this replay — this is your demo proof point
MILESTONE: you have a concrete, real, honest proof that the system works
```

---

## WHAT TO SAY — and NOT SAY — to judges

### Always say
- "We train offline on historical data with weak labels — here is exactly how we built those labels and why this is a legitimate technique"
- "Deviation from per-site baseline is the classification signal, not raw temperature — here is why that matters"
- "This runs entirely on free-tier infrastructure — here is the specific cost at each layer"
- "We validated on a real historical incident — here is the specific event and the result"
- "Uncertain cases are flagged for human review, not silently dropped — safety-first failure mode"

### Never say
- "Our AI detects fires in real time" — FIRMS data has a ~3 hour satellite latency, be honest
- "We have 95% accuracy" — unless you actually measured this on a real labeled test set
- "The model learns continuously" — it retrains on a schedule with verified human labels, not autonomously
- "This is like FIRMS but better" — it extends FIRMS for a specific gap, it does not replace it

---

## EVALUATION METRICS — measure these honestly

```python
# For the classifier — compute on a held-out test set, never on training data
# Label everything as "Measured on test set — [date]" in the codebase

from sklearn.metrics import classification_report, confusion_matrix

metrics_to_report = {
    "per_class_precision": "How often is each label correct when predicted",
    "per_class_recall":    "How often does it catch each real fire type",
    "per_class_f1":        "Balance of the above",
    "overall_accuracy":    "Overall correctness across all classes",
    "confusion_matrix":    "Where does it make which mistakes"
}

# Target values (label as TARGET — not yet achieved)
# industrial_fire recall: >0.80 (missing a real fire is the dangerous error)
# normal_flare precision: >0.90 (false alarms erode analyst trust)
# Overall F1: >0.75 across classes
```

---

## SECURITY REQUIREMENTS — implement from day one, not as an afterthought

```
Authentication:   Supabase Auth with JWT validation on every API route
Authorization:    Row-level security on Supabase tables by analyst role
Audit trail:      Every analyst action (view, acknowledge, escalate, comment) logged
Input validation: Pydantic models validate every API request body
Rate limiting:    FastAPI middleware, prevent abuse of classify endpoint
Error handling:   Sentry captures all exceptions, never expose stack traces to frontend
HTTPS only:       Render and Vercel enforce this by default — confirm it is on
Secrets:          All credentials in .env, never hardcoded, never committed to git
```

---

## HONEST SCOPE BOUNDARIES — the line between MVP and production

| Capability | MVP (what you actually build) | Production (what you describe as planned) |
|---|---|---|
| Coverage | One Indian industrial region | All major Indian industrial belts nationwide |
| Auth | Supabase email login | SSO integration with agency identity system |
| Model updates | Manual retrain when new labels accumulate | Scheduled monthly retraining pipeline |
| Alert routing | In-app realtime feed | Tiered routing by severity to different responders |
| Satellite data | FIRMS with ~3hr latency | Integration with higher-cadence future sources |
| Site coverage | OSM polygons for target region | Comprehensive verified industrial database |
| Hardware | Free cloud services | On-prem / NIC-approved government cloud |

Never present MVP capabilities as production capabilities. A judge who catches this will not forgive it.

---

## WHEN STUCK — ask these questions in order

1. Does this component already exist in the repo structure above? If yes, build it there.
2. Does adding this require a new dependency? If yes, check if it's free and justify why it's needed.
3. Does this touch the database? If yes, update setup_db.sql too.
4. Is this in the ML pipeline? If yes, update the feature column list if anything changes.
5. Is this user-facing? If yes, make sure the auth middleware covers it.
6. Am I about to hardcode a secret? Stop. Use .env.

---

*This document is the single source of truth for this project.
Every architectural decision here was made deliberately.
Do not deviate from the tech stack without a documented reason.
Do not add a technology without a clear, justified purpose.
Do not make a performance or accuracy claim without a measured result.*