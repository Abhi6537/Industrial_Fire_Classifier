-- ==============================================================================
-- Industrial Fire Detection & Classification System
-- Database Schema for PostGIS / PostgreSQL (Supabase compatible)
-- ==============================================================================

-- 1. Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Raw FIRMS Satellite Detections
CREATE TABLE IF NOT EXISTS detections (
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

CREATE INDEX IF NOT EXISTS idx_detections_geom ON detections USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_detections_detected_at ON detections (detected_at);

-- 3. OpenStreetMap Industrial Site Polygons
CREATE TABLE IF NOT EXISTS sites (
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

CREATE INDEX IF NOT EXISTS idx_sites_geom ON sites USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_sites_osm_id ON sites (osm_id);

-- 4. Per-Site Thermal History (Baseline Engine Store)
CREATE TABLE IF NOT EXISTS site_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  detection_id UUID REFERENCES detections(id) ON DELETE SET NULL,
  frp_value DOUBLE PRECISION,
  brightness_temp DOUBLE PRECISION,
  recorded_at TIMESTAMPTZ NOT NULL,
  day_of_week SMALLINT,
  hour_of_day SMALLINT
);

CREATE INDEX IF NOT EXISTS idx_site_history_site_id ON site_history(site_id);
CREATE INDEX IF NOT EXISTS idx_site_history_recorded_at ON site_history(recorded_at);

-- 5. Classified and Enriched Events (ML Pipeline Output)
CREATE TABLE IF NOT EXISTS classified_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  detection_id UUID REFERENCES detections(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
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

CREATE INDEX IF NOT EXISTS idx_classified_events_detection_id ON classified_events(detection_id);
CREATE INDEX IF NOT EXISTS idx_classified_events_site_id ON classified_events(site_id);
CREATE INDEX IF NOT EXISTS idx_classified_events_label ON classified_events(label);
CREATE INDEX IF NOT EXISTS idx_classified_events_classified_at ON classified_events(classified_at);

-- 6. Analyst Actions (Audit Log)
CREATE TABLE IF NOT EXISTS analyst_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES classified_events(id) ON DELETE CASCADE,
  analyst_id UUID,
  action VARCHAR(50) NOT NULL,
  note TEXT,
  acted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analyst_actions_event_id ON analyst_actions(event_id);
CREATE INDEX IF NOT EXISTS idx_analyst_actions_acted_at ON analyst_actions(acted_at);

-- 7. Alert Notification Queue
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES classified_events(id) ON DELETE CASCADE,
  severity VARCHAR(20),
  status VARCHAR(20) DEFAULT 'unread',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID
);

CREATE INDEX IF NOT EXISTS idx_alerts_event_id ON alerts(event_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);

-- 8. Alert Discussion Threads
CREATE TABLE IF NOT EXISTS alert_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
  analyst_id UUID,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_comments_alert_id ON alert_comments(alert_id);
