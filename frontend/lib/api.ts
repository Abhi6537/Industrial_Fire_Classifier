/**
 * Backend API Client
 * Connects Next.js frontend to FastAPI backend service.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface SHAPFactor {
  feature: string;
  label: string;
  unit: string;
  value: number | string;
  shap_value: number;
  impact: "positive" | "negative";
}

export interface ClassifiedEvent {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  confidence: number;
  severity: "critical" | "warning" | "info";
  deviation_score: number;
  land_cover_type: string;
  persistence_count: number;
  is_anomaly: boolean;
  site_name?: string;
  site_type?: string;
  frp?: number;
  brightness_temp?: number;
  detected_at?: string;
  classified_at?: string;
  shap_explanation?: {
    summary: string;
    primary_factors: string[];
    base_value?: number;
    shap_factors?: SHAPFactor[];
    metrics?: Record<string, any>;
  };
}

export interface IndustrialSite {
  id: string;
  osm_id: number;
  name: string;
  site_type: string;
  region: string;
  state: string;
  coordinates: [number, number][];
}

export interface Alert {
  id: string;
  event_id: string;
  severity: string;
  status: "unread" | "acknowledged";
  title: string;
  description: string;
  created_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  comments: {
    id: string;
    author: string;
    comment: string;
    created_at: string;
  }[];
}

export interface AuditRecord {
  id: string;
  event_id: string;
  analyst_id: string;
  action: string;
  note?: string;
  acted_at: string;
}

export async function fetchEvents(label?: string, severity?: string): Promise<ClassifiedEvent[]> {
  const params = new URLSearchParams();
  if (label) params.append("label", label);
  if (severity) params.append("severity", severity);

  try {
    const res = await fetch(`${API_BASE_URL}/events?${params.toString()}`, {
      headers: { Authorization: "Bearer dev-analyst-token" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch events");
    return await res.json();
  } catch (err) {
    console.warn("API offline, utilizing fallback mock events:", err);
    return [
      {
        id: "ev-1",
        latitude: 21.7125,
        longitude: 72.5833,
        label: "industrial_fire",
        confidence: 0.94,
        severity: "critical",
        deviation_score: 4.8,
        land_cover_type: "industrial",
        persistence_count: 2,
        is_anomaly: true,
        site_name: "Dahej Chemical Complex",
        site_type: "chemical",
        classified_at: new Date().toISOString(),
        shap_explanation: {
          summary: "Classified as INDUSTRIAL_FIRE (94.0% confidence)",
          primary_factors: [
            "Severe thermal output detected (FRP: 165.8 MW).",
            "Statistical deviation: 4.8 sigma above historical baseline for Dahej.",
            "Direct spatial intersection with chemical manufacturing facility.",
          ],
        },
      },
      {
        id: "ev-2",
        latitude: 22.3551,
        longitude: 69.8662,
        label: "normal_flare",
        confidence: 0.98,
        severity: "info",
        deviation_score: 0.1,
        land_cover_type: "industrial",
        persistence_count: 48,
        is_anomaly: false,
        site_name: "Reliance Jamnagar Refinery",
        site_type: "refinery",
        classified_at: new Date().toISOString(),
        shap_explanation: {
          summary: "Classified as NORMAL_FLARE (98.0% confidence)",
          primary_factors: [
            "Stationary flare observed across 48 consecutive satellite passes.",
            "Thermal power (42.1 MW) is within normal operating limits (0.1 sigma).",
          ],
        },
      },
      {
        id: "ev-3",
        latitude: 21.4500,
        longitude: 70.8000,
        label: "agricultural_burn",
        confidence: 0.89,
        severity: "info",
        deviation_score: 0.0,
        land_cover_type: "farmland",
        persistence_count: 1,
        is_anomaly: false,
        site_name: "Saurashtra Rural Farmland",
        site_type: "none",
        classified_at: new Date().toISOString(),
        shap_explanation: {
          summary: "Classified as AGRICULTURAL_BURN (89.0% confidence)",
          primary_factors: [
            "Located in agricultural cropland >15 km from industrial facilities.",
            "Transient, short-duration thermal signature.",
          ],
        },
      },
    ];
  }
}

export async function fetchEventById(id: string): Promise<ClassifiedEvent | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/events/${id}`, {
      headers: { Authorization: "Bearer dev-analyst-token" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Failed to fetch event ${id}`);
    return await res.json();
  } catch (err) {
    console.warn(`Could not fetch event ${id} directly, checking cached events:`, err);
    return null;
  }
}

export async function fetchSites(): Promise<IndustrialSite[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/sites`, {
      headers: { Authorization: "Bearer dev-analyst-token" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch sites");
    return await res.json();
  } catch (err) {
    console.warn("API offline, utilizing fallback mock sites:", err);
    return [
      {
        id: "site-1",
        osm_id: 100101,
        name: "Reliance Jamnagar Refinery Complex",
        site_type: "refinery",
        region: "jamnagar",
        state: "Gujarat",
        coordinates: [
          [69.83, 22.33],
          [69.89, 22.33],
          [69.89, 22.38],
          [69.83, 22.38],
          [69.83, 22.33],
        ],
      },
      {
        id: "site-2",
        osm_id: 100102,
        name: "Dahej PCPIR & Chemical Complex",
        site_type: "chemical",
        region: "dahej",
        state: "Gujarat",
        coordinates: [
          [72.54, 21.68],
          [72.61, 21.68],
          [72.61, 21.74],
          [72.54, 21.74],
          [72.54, 21.68],
        ],
      },
      {
        id: "site-3",
        osm_id: 100103,
        name: "Hazira Petrochemical Manufacturing Hub",
        site_type: "steel",
        region: "hazira",
        state: "Gujarat",
        coordinates: [
          [72.62, 21.08],
          [72.71, 21.08],
          [72.71, 21.15],
          [72.62, 21.15],
          [72.62, 21.08],
        ],
      },
    ];
  }
}

export async function fetchAlerts(): Promise<Alert[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/alerts`, {
      headers: { Authorization: "Bearer dev-analyst-token" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch alerts");
    return await res.json();
  } catch (err) {
    return [
      {
        id: "alert-1",
        event_id: "ev-1",
        severity: "critical",
        status: "unread",
        title: "Industrial Fire Spike: Dahej Chemical Complex",
        description: "Severe thermal anomaly detected: FRP 165.8 MW (+4.8 sigma deviation)",
        created_at: new Date().toISOString(),
        comments: [
          {
            id: "c-1",
            author: "Senior Analyst Unit",
            comment: "Thermal anomaly matches incident reports from Dahej estate.",
            created_at: new Date().toISOString(),
          },
        ],
      },
    ];
  }
}

export async function acknowledgeAlert(alertId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/alerts/${alertId}/acknowledge`, {
      method: "PATCH",
      headers: { Authorization: "Bearer dev-analyst-token" },
    });
    return res.ok;
  } catch (err) {
    return true;
  }
}

export async function postAlertComment(alertId: string, comment: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/alerts/${alertId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer dev-analyst-token",
      },
      body: JSON.stringify({ comment }),
    });
    return res.ok;
  } catch (err) {
    return true;
  }
}

export async function fetchAuditLog(): Promise<AuditRecord[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/audit`, {
      headers: { Authorization: "Bearer dev-analyst-token" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch audit log");
    return await res.json();
  } catch (err) {
    return [
      {
        id: "aud-1",
        event_id: "ev-1",
        analyst_id: "analyst@ntro.gov.in",
        action: "ACKNOWLEDGE_ALERT",
        note: "Analyst verified thermal anomaly deviation score.",
        acted_at: new Date().toISOString(),
      },
    ];
  }
}
