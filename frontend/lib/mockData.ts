export type ClassificationLabel =
  | "industrial_fire"
  | "gas_flare"
  | "persistent_source"
  | "agricultural_burn"
  | "natural_fire"
  | "unknown_anomaly";

export type SeverityLevel = "high" | "medium" | "low";
export type IncidentStatus = "open" | "monitoring" | "investigating" | "closed";

export interface ClassificationMeta {
  label: string;
  color: string;
  bg: string;
  description?: string;
}

export const CLASSIFICATION_META: Record<ClassificationLabel, ClassificationMeta> = {
  industrial_fire: {
    label: "Industrial Fire",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.12)",
    description: "Accidental or uncontrolled thermal event in an industrial facility.",
  },
  gas_flare: {
    label: "Gas Flare",
    color: "#38bdf8",
    bg: "rgba(56, 189, 248, 0.12)",
    description: "Routine or abnormal flaring activity.",
  },
  persistent_source: {
    label: "Persistent Source",
    color: "#a855f7",
    bg: "rgba(168, 85, 247, 0.12)",
    description: "Repeated or continuous thermal emissions.",
  },
  agricultural_burn: {
    label: "Agricultural Burn",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.12)",
    description: "Thermal activity associated with field burning.",
  },
  natural_fire: {
    label: "Natural Fire",
    color: "#22c55e",
    bg: "rgba(34, 197, 94, 0.12)",
    description: "Natural fire or wildfire activity.",
  },
  unknown_anomaly: {
    label: "Unknown Anomaly",
    color: "#94a3b8",
    bg: "rgba(148, 163, 184, 0.12)",
    description: "Thermal activity that cannot yet be confidently classified.",
  },
};

export interface ThermalDetection {
  id: string;
  facilityName: string;
  facilityId?: string;
  location: string;
  lat: number;
  lng: number;
  latitude?: number;
  longitude?: number;
  classification: ClassificationLabel;
  confidence: number;
  radiance: number;
  severity: SeverityLevel;
  status: IncidentStatus;
  timestamp: string;
}

export function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return ts;
  }
}

export const MOCK_DETECTIONS: ThermalDetection[] = [
  {
    id: "det_001",
    facilityName: "Dahej Chemical Complex",
    facilityId: "fac_001",
    location: "Dahej PCPIR, Gujarat",
    latitude: 21.7124,
    longitude: 72.5831,
    lat: 21.7124,
    lng: 72.5831,
    classification: "industrial_fire",
    confidence: 94,
    radiance: 188.4,
    severity: "high",
    status: "open",
    timestamp: "2026-09-09T18:45:00Z",
  },
  {
    id: "det_002",
    facilityName: "Reliance Jamnagar Refinery",
    facilityId: "fac_002",
    location: "Motikhavdi, Jamnagar, Gujarat",
    latitude: 22.355,
    longitude: 69.865,
    lat: 22.355,
    lng: 69.865,
    classification: "gas_flare",
    confidence: 98,
    radiance: 43.8,
    severity: "low",
    status: "monitoring",
    timestamp: "2026-09-09T17:30:00Z",
  },
  {
    id: "det_003",
    facilityName: "Hazira Petrochemical Hub",
    facilityId: "fac_003",
    location: "Hazira Port, Surat, Gujarat",
    latitude: 21.104,
    longitude: 72.645,
    lat: 21.104,
    lng: 72.645,
    classification: "persistent_source",
    confidence: 91,
    radiance: 32.6,
    severity: "medium",
    status: "monitoring",
    timestamp: "2026-09-09T16:15:00Z",
  },
  {
    id: "det_004",
    facilityName: "Punjab Farmland Stubble Corridor",
    location: "Ludhiana Rural, Punjab",
    latitude: 30.901,
    longitude: 75.857,
    lat: 30.901,
    lng: 75.857,
    classification: "agricultural_burn",
    confidence: 88,
    radiance: 14.2,
    severity: "medium",
    status: "closed",
    timestamp: "2026-09-09T15:20:00Z",
  },
  {
    id: "det_005",
    facilityName: "Satpura Forest Canopy",
    location: "Hoshangabad, Madhya Pradesh",
    latitude: 22.45,
    longitude: 78.25,
    lat: 22.45,
    lng: 78.25,
    classification: "natural_fire",
    confidence: 86,
    radiance: 28.5,
    severity: "medium",
    status: "investigating",
    timestamp: "2026-09-09T14:10:00Z",
  },
  {
    id: "det_006",
    facilityName: "Talcher Open-Cast Mining Pit",
    location: "Angul, Odisha",
    latitude: 20.95,
    longitude: 85.22,
    lat: 20.95,
    lng: 85.22,
    classification: "unknown_anomaly",
    confidence: 72,
    radiance: 19.8,
    severity: "low",
    status: "monitoring",
    timestamp: "2026-09-09T13:00:00Z",
  },
];

export interface FacilityData {
  id: string;
  name: string;
  type: string;
  status: "Operational" | "Maintenance" | "Offline" | IncidentStatus;
  address: string;
  lat: number;
  lng: number;
  osmId: string;
  operator: string;
  landUse: string;
  nearby: string;
  latestDetection: {
    classification: ClassificationLabel;
    confidence: number;
    radiance: number;
    timestamp: string;
  };
  thermalHistory: { date: string; radiance: number; baseline: number }[];
  recentClassifications: {
    date: string;
    type: ClassificationLabel;
    confidence: number;
    radiance: number;
    notes: string;
  }[];
}

export const DEFAULT_FACILITY: FacilityData = {
  id: "fac_001",
  name: "Dahej Chemical Zone Complex",
  type: "Chemical Processing Facility",
  status: "open",
  address: "Dahej Industrial Corridor, Bharuch, Gujarat",
  lat: 21.7124,
  lng: 72.5831,
  osmId: "osm_node_849201948",
  operator: "Yashashvi Agro Chemical Ltd.",
  landUse: "Heavy Industrial (PCPIR Zone)",
  nearby: "Residential Settlement (2.4 km East)",
  latestDetection: {
    classification: "industrial_fire",
    confidence: 94,
    radiance: 188.4,
    timestamp: "2026-09-09 18:45 UTC",
  },
  thermalHistory: [
    { date: "Aug 10", radiance: 35, baseline: 42 },
    { date: "Aug 15", radiance: 41, baseline: 42 },
    { date: "Aug 20", radiance: 39, baseline: 42 },
    { date: "Aug 25", radiance: 44, baseline: 42 },
    { date: "Aug 30", radiance: 40, baseline: 42 },
    { date: "Sep 04", radiance: 43, baseline: 42 },
    { date: "Sep 09", radiance: 188.4, baseline: 42 },
  ],
  recentClassifications: [
    {
      date: "2026-09-09",
      type: "industrial_fire",
      confidence: 94,
      radiance: 188.4,
      notes: "+5.8σ baseline deviation spike. BLEVE incident profile.",
    },
    {
      date: "2026-09-04",
      type: "gas_flare",
      confidence: 96,
      radiance: 43.0,
      notes: "Normal operational flare stack baseline reading.",
    },
    {
      date: "2026-08-30",
      type: "gas_flare",
      confidence: 95,
      radiance: 40.2,
      notes: "Normal operational flare stack baseline reading.",
    },
  ],
};

export const MOCK_FACILITIES: Record<string, FacilityData> = {
  fac_001: DEFAULT_FACILITY,
  fac_002: {
    id: "fac_002",
    name: "Reliance Jamnagar Refinery Complex",
    type: "Petroleum Refinery & Petrochemicals",
    status: "Operational",
    address: "Motikhavdi, Jamnagar, Gujarat",
    lat: 22.355,
    lng: 69.865,
    osmId: "osm_way_392019481",
    operator: "Reliance Industries Limited",
    landUse: "Petrochemical Special Economic Zone",
    nearby: "Gulf of Kutch Marine Sanctuary (12 km)",
    latestDetection: {
      classification: "gas_flare",
      confidence: 98,
      radiance: 43.8,
      timestamp: "2026-09-09 17:30 UTC",
    },
    thermalHistory: [
      { date: "Aug 10", radiance: 42, baseline: 44 },
      { date: "Aug 15", radiance: 45, baseline: 44 },
      { date: "Aug 20", radiance: 43, baseline: 44 },
      { date: "Aug 25", radiance: 46, baseline: 44 },
      { date: "Aug 30", radiance: 44, baseline: 44 },
      { date: "Sep 04", radiance: 45, baseline: 44 },
      { date: "Sep 09", radiance: 43.8, baseline: 44 },
    ],
    recentClassifications: [
      {
        date: "2026-09-09",
        type: "gas_flare",
        confidence: 98,
        radiance: 43.8,
        notes: "Nominal operational flare. Consistent with 30-day baseline.",
      },
    ],
  },
  fac_003: {
    id: "fac_003",
    name: "Hazira Petrochemical & Port Hub",
    type: "Liquefied Gas & Steel Manufacturing",
    status: "Operational",
    address: "Hazira Industrial Belt, Surat, Gujarat",
    lat: 21.104,
    lng: 72.645,
    osmId: "osm_way_291049102",
    operator: "ArcelorMittal Nippon Steel / Shell LNG",
    landUse: "Heavy Port Industrial Zone",
    nearby: "Tapi Estuary (1.5 km)",
    latestDetection: {
      classification: "persistent_source",
      confidence: 91,
      radiance: 32.6,
      timestamp: "2026-09-09 16:15 UTC",
    },
    thermalHistory: [
      { date: "Aug 10", radiance: 30, baseline: 32 },
      { date: "Aug 15", radiance: 33, baseline: 32 },
      { date: "Aug 20", radiance: 31, baseline: 32 },
      { date: "Aug 25", radiance: 34, baseline: 32 },
      { date: "Aug 30", radiance: 32, baseline: 32 },
      { date: "Sep 04", radiance: 33, baseline: 32 },
      { date: "Sep 09", radiance: 32.6, baseline: 32 },
    ],
    recentClassifications: [
      {
        date: "2026-09-09",
        type: "persistent_source",
        confidence: 91,
        radiance: 32.6,
        notes: "Continuous blast furnace thermal emissions.",
      },
    ],
  },
};
