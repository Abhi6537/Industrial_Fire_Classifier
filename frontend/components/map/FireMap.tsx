"use client";

import React, { useEffect, useState, useRef } from "react";
import { ClassifiedEvent, IndustrialSite } from "@/lib/api";
import { ExplanationPanel } from "./ExplanationPanel";
import { Layers, RefreshCw, Filter, History, Play, Pause, AlertOctagon } from "lucide-react";

interface FireMapProps {
  events: ClassifiedEvent[];
  sites: IndustrialSite[];
  selectedEventId?: string;
  onSelectEvent?: (event: ClassifiedEvent) => void;
}

const DEFAULT_DEMO_SITES: IndustrialSite[] = [
  {
    id: "site-dahej-plant",
    osm_id: 100102,
    name: "Dahej Chemical Complex (Yashashvi Agro Facility)",
    site_type: "chemical",
    region: "dahej",
    state: "Gujarat",
    coordinates: [
      [72.570, 21.700],
      [72.595, 21.700],
      [72.595, 21.725],
      [72.570, 21.725],
      [72.570, 21.700],
    ],
  },
  {
    id: "site-jamnagar",
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
    id: "site-hazira",
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

const REPLAY_TIMELINE = [
  {
    stepName: "Day T-2 (June 1, 2020)",
    badge: "Routine Operations",
    badgeColor: "bg-slate-800 text-slate-300",
    events: [
      {
        id: "r1-jamnagar",
        latitude: 22.3551,
        longitude: 69.8662,
        label: "normal_flare",
        confidence: 0.99,
        severity: "info" as const,
        deviation_score: 0.1,
        land_cover_type: "industrial",
        persistence_count: 52,
        is_anomaly: false,
        site_name: "Reliance Jamnagar Refinery",
        site_type: "refinery",
        shap_explanation: {
          summary: "Classified as NORMAL_FLARE (99% confidence)",
          base_value: 0.1662,
          primary_factors: [
            "Thermal output 42.1 MW matches historical mean (41.5 MW).",
            "Deviation: +0.1 sigma within routine operational bounds.",
          ],
          shap_factors: [
            { feature: "persistence_count", label: "Multi-Temporal Persistence", unit: "passes", value: 52, shap_value: 0.384, impact: "positive" },
            { feature: "site_type_encoded", label: "Site Facility Type", unit: "", value: "refinery", shap_value: 0.245, impact: "positive" },
            { feature: "deviation_score", label: "Baseline Deviation", unit: "sigma", value: 0.1, shap_value: 0.188, impact: "positive" },
            { feature: "on_known_site", label: "Industrial Site Intersect", unit: "", value: 1, shap_value: 0.122, impact: "positive" },
            { feature: "frp", label: "Fire Radiative Power (FRP)", unit: "MW", value: 42.1, shap_value: -0.091, impact: "negative" },
          ],
          metrics: { frp_mw: 42.1, deviation_z_score: 0.1 },
        },
      },
      {
        id: "r1-dahej",
        latitude: 21.7125,
        longitude: 72.5833,
        label: "normal_flare",
        confidence: 0.88,
        severity: "info" as const,
        deviation_score: -0.1,
        land_cover_type: "industrial",
        persistence_count: 28,
        is_anomaly: false,
        site_name: "Dahej Chemical Complex",
        site_type: "chemical",
        shap_explanation: {
          summary: "Classified as NORMAL_FLARE (88% confidence)",
          base_value: 0.1662,
          primary_factors: [
            "Thermal output 14.8 MW matches normal chemical plant heat trace.",
            "Deviation: -0.1 sigma below baseline.",
          ],
          shap_factors: [
            { feature: "site_type_encoded", label: "Site Facility Type", unit: "", value: "chemical", shap_value: 0.265, impact: "positive" },
            { feature: "persistence_count", label: "Multi-Temporal Persistence", unit: "passes", value: 28, shap_value: 0.218, impact: "positive" },
            { feature: "deviation_score", label: "Baseline Deviation", unit: "sigma", value: -0.1, shap_value: 0.155, impact: "positive" },
            { feature: "frp", label: "Fire Radiative Power (FRP)", unit: "MW", value: 14.8, shap_value: -0.114, impact: "negative" },
          ],
          metrics: { frp_mw: 14.8, deviation_z_score: -0.1 },
        },
      },
    ],
  },
  {
    stepName: "Day T-1 (June 2, 2020)",
    badge: "Routine Operations",
    badgeColor: "bg-slate-800 text-slate-300",
    events: [
      {
        id: "r2-jamnagar",
        latitude: 22.3551,
        longitude: 69.8662,
        label: "normal_flare",
        confidence: 0.99,
        severity: "info" as const,
        deviation_score: -0.2,
        land_cover_type: "industrial",
        persistence_count: 53,
        is_anomaly: false,
        site_name: "Reliance Jamnagar Refinery",
        site_type: "refinery",
        shap_explanation: {
          summary: "Classified as NORMAL_FLARE (99% confidence)",
          base_value: 0.1662,
          primary_factors: [
            "Thermal output 40.5 MW matches baseline.",
            "Deviation: -0.2 sigma.",
          ],
          shap_factors: [
            { feature: "persistence_count", label: "Multi-Temporal Persistence", unit: "passes", value: 53, shap_value: 0.392, impact: "positive" },
            { feature: "site_type_encoded", label: "Site Facility Type", unit: "", value: "refinery", shap_value: 0.251, impact: "positive" },
            { feature: "deviation_score", label: "Baseline Deviation", unit: "sigma", value: -0.2, shap_value: 0.174, impact: "positive" },
            { feature: "frp", label: "Fire Radiative Power (FRP)", unit: "MW", value: 40.5, shap_value: -0.098, impact: "negative" },
          ],
          metrics: { frp_mw: 40.5, deviation_z_score: -0.2 },
        },
      },
      {
        id: "r2-dahej",
        latitude: 21.7125,
        longitude: 72.5833,
        label: "normal_flare",
        confidence: 0.89,
        severity: "info" as const,
        deviation_score: 0.3,
        land_cover_type: "industrial",
        persistence_count: 29,
        is_anomaly: false,
        site_name: "Dahej Chemical Complex",
        site_type: "chemical",
        shap_explanation: {
          summary: "Classified as NORMAL_FLARE (89% confidence)",
          base_value: 0.1662,
          primary_factors: [
            "Thermal output 16.2 MW consistent with routine operations.",
            "Deviation: +0.3 sigma.",
          ],
          shap_factors: [
            { feature: "site_type_encoded", label: "Site Facility Type", unit: "", value: "chemical", shap_value: 0.272, impact: "positive" },
            { feature: "persistence_count", label: "Multi-Temporal Persistence", unit: "passes", value: 29, shap_value: 0.224, impact: "positive" },
            { feature: "deviation_score", label: "Baseline Deviation", unit: "sigma", value: 0.3, shap_value: 0.162, impact: "positive" },
            { feature: "frp", label: "Fire Radiative Power (FRP)", unit: "MW", value: 16.2, shap_value: -0.108, impact: "negative" },
          ],
          metrics: { frp_mw: 16.2, deviation_z_score: 0.3 },
        },
      },
    ],
  },
  {
    stepName: "Day T (June 3, 2020) — EXPLOSION",
    badge: "EMERGENCY SPIKE DETECTED",
    badgeColor: "bg-danger/20 text-danger border border-danger/40 animate-pulse",
    events: [
      {
        id: "r3-jamnagar",
        latitude: 22.3551,
        longitude: 69.8662,
        label: "normal_flare",
        confidence: 0.99,
        severity: "info" as const,
        deviation_score: 0.4,
        land_cover_type: "industrial",
        persistence_count: 54,
        is_anomaly: false,
        site_name: "Reliance Jamnagar Refinery",
        site_type: "refinery",
        shap_explanation: {
          summary: "Classified as NORMAL_FLARE (STAYS NORMAL)",
          base_value: 0.1662,
          primary_factors: [
            "Thermal output 43.8 MW (Normal baseline ~41.5 MW).",
            "Routine flare stays grey and classified as normal operational heat.",
          ],
          shap_factors: [
            { feature: "persistence_count", label: "Multi-Temporal Persistence", unit: "passes", value: 54, shap_value: 0.395, impact: "positive" },
            { feature: "site_type_encoded", label: "Site Facility Type", unit: "", value: "refinery", shap_value: 0.248, impact: "positive" },
            { feature: "deviation_score", label: "Baseline Deviation", unit: "sigma", value: 0.4, shap_value: 0.181, impact: "positive" },
            { feature: "frp", label: "Fire Radiative Power (FRP)", unit: "MW", value: 43.8, shap_value: -0.088, impact: "negative" },
          ],
          metrics: { frp_mw: 43.8, deviation_z_score: 0.4 },
        },
      },
      {
        id: "r3-dahej",
        latitude: 21.7125,
        longitude: 72.5833,
        label: "industrial_fire",
        confidence: 0.96,
        severity: "critical" as const,
        deviation_score: 5.8,
        land_cover_type: "industrial",
        persistence_count: 30,
        is_anomaly: true,
        site_name: "Dahej Chemical Complex [EXPLOSION DISASTER]",
        site_type: "chemical",
        shap_explanation: {
          summary: "EMERGENCY: INDUSTRIAL_FIRE DETECTED (+5.8 sigma spike)",
          base_value: 0.1662,
          primary_factors: [
            "Thermal output surged to 188.4 MW (12.5x above baseline mean of 15.0 MW).",
            "Statistical deviation exceeds +5.8 sigma, triggering immediate critical alert.",
            "Direct spatial intersection with Dahej chemical industrial polygon.",
          ],
          shap_factors: [
            { feature: "deviation_score", label: "Baseline Deviation", unit: "sigma", value: 5.8, shap_value: 0.342, impact: "positive" },
            { feature: "frp", label: "Fire Radiative Power (FRP)", unit: "MW", value: 188.4, shap_value: 0.298, impact: "positive" },
            { feature: "on_known_site", label: "Industrial Site Intersect", unit: "", value: 1, shap_value: 0.145, impact: "positive" },
            { feature: "site_type_encoded", label: "Site Facility Type", unit: "", value: "chemical", shap_value: 0.092, impact: "positive" },
            { feature: "persistence_count", label: "Multi-Temporal Persistence", unit: "passes", value: 30, shap_value: -0.045, impact: "negative" },
          ],
          metrics: { frp_mw: 188.4, deviation_z_score: 5.8 },
        },
      },
    ],
  },
];

export const FireMap: React.FC<FireMapProps> = ({
  events,
  sites,
  selectedEventId,
  onSelectEvent,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const polygonsLayerRef = useRef<any>(null);

  const [selectedEvent, setSelectedEvent] = useState<ClassifiedEvent | null>(null);
  const [filterClass, setFilterClass] = useState<string>("all");
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);

  // Historical Incident Replay Mode State
  const [isReplayMode, setIsReplayMode] = useState<boolean>(false);
  const [replayIndex, setReplayIndex] = useState<number>(0);

  // Load Leaflet dynamically on client-side
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let L: any;
    const initMap = async () => {
      L = await import("leaflet");

      if (mapInstanceRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [22.0, 79.0],
        zoom: 5,
        zoomControl: false,
        wheelPxPerZoomLevel: 120, // Smooth, lower sensitivity wheel zoom
        zoomDelta: 0.5,           // Finer zoom steps
        zoomSnap: 0.5,            // Half-step zoom levels
      });

      const cartoKey = process.env.NEXT_PUBLIC_CARTO_KEY || "cb1_32gk_1_fb74a95ecbcdb533a5287d8d";

      // 1. CARTO Dark Matter (Authenticated - 5,000,000 free requests/month, Zero Watermark)
      const cartoDark = L.tileLayer(
        `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${cartoKey}`,
        {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a> | &copy; OpenStreetMap | NASA FIRMS',
          subdomains: "abcd",
          maxZoom: 20,
        }
      );

      // 2. High-Resolution Satellite Recon (Esri World Imagery)
      const satelliteRecon = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics",
          maxZoom: 18,
        }
      );

      // 3. CARTO Voyager Street & Topo (Authenticated)
      const cartoVoyager = L.tileLayer(
        `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${cartoKey}`,
        {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a> | &copy; OpenStreetMap',
          subdomains: "abcd",
          maxZoom: 20,
        }
      );

      // 4. Tactical Canvas (Esri World Dark Gray Base)
      const tacticalDark = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ | NASA FIRMS",
          maxZoom: 16,
        }
      );

      // Default to CARTO Voyager (Light Street & Topo)
      cartoVoyager.addTo(map);

      // Add Basemap Layer Switcher Control
      const baseMaps = {
        "CARTO Voyager (Light Street)": cartoVoyager,
        "Satellite Recon (Imagery)": satelliteRecon,
        "CARTO Dark Matter": cartoDark,
        "Tactical Canvas": tacticalDark,
      };

      L.control.layers(baseMaps, undefined, { position: "topright" }).addTo(map);

      polygonsLayerRef.current = L.layerGroup().addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      setMapLoaded(true);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Render Industrial Site Polygons
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !polygonsLayerRef.current) return;
    const L = (window as any).L || require("leaflet");

    polygonsLayerRef.current.clearLayers();

    const validSites = (sites || []).filter((s) => s.coordinates && s.coordinates.length >= 3);
    const sitesToRender = validSites.length > 0 ? validSites : DEFAULT_DEMO_SITES;

    sitesToRender.forEach((site) => {
      if (site.coordinates && site.coordinates.length >= 3) {
        const latLngs = site.coordinates.map((pt) => [pt[1], pt[0]]);
        const polygon = L.polygon(latLngs, {
          color: "#0284c7",
          weight: 2.5,
          opacity: 0.95,
          fillColor: "#38bdf8",
          fillOpacity: 0.20,
          dashArray: "6, 4",
        });

        polygon.bindTooltip(
          `<div style="font-family:sans-serif; padding:2px;">
             <strong style="color:#0284c7; font-size:11px;">${site.name}</strong><br/>
             <span style="color:#64748b; font-size:10px; font-family:monospace;">OSM INDUSTRIAL BOUNDARY (${site.site_type.toUpperCase()})</span>
           </div>`,
          { className: "bg-white text-slate-800 border border-slate-300 shadow-md px-2.5 py-1.5 rounded-lg" }
        );

        polygon.addTo(polygonsLayerRef.current);
      }
    });
  }, [mapLoaded, sites]);

  // Active event dataset: Replay events OR live sector events
  const activeEvents = isReplayMode
    ? (REPLAY_TIMELINE[replayIndex]?.events as ClassifiedEvent[])
    : events;

  // Render Hotspot Markers with crisp tactical defense symbology (NO NEON / NO GLOW)
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !markersLayerRef.current) return;
    const L = (window as any).L || require("leaflet");

    markersLayerRef.current.clearLayers();

    const filteredEvents =
      filterClass === "all" ? activeEvents : activeEvents.filter((e) => e.label === filterClass);

    filteredEvents.forEach((event) => {
      let iconHtml = "";

      if (event.label === "industrial_fire") {
        // Tactical concentric target: solid red center with crisp boundary ring (0 glow, 0 blur)
        iconHtml = `
          <div style="position:relative; width:24px; height:24px; display:flex; align-items:center; justify-content:center;">
            <div style="position:absolute; width:22px; height:22px; border-radius:50%; border:2px solid #dc2626; background:rgba(220,38,38,0.18);"></div>
            <div style="position:relative; width:12px; height:12px; border-radius:50%; background:#dc2626; border:1.5px solid #ffffff; display:flex; align-items:center; justify-content:center;">
              <div style="width:3px; height:3px; border-radius:50%; background:#ffffff;"></div>
            </div>
          </div>
        `;
      } else if (event.label === "unregistered_anomaly") {
        // High-threat unmapped: crisp tactical diamond with center pip
        iconHtml = `
          <div style="position:relative; width:20px; height:20px; display:flex; align-items:center; justify-content:center;">
            <div style="width:13px; height:13px; transform:rotate(45deg); background:#d97706; border:1.5px solid #ffffff; display:flex; align-items:center; justify-content:center;">
              <div style="width:3px; height:3px; background:#ffffff;"></div>
            </div>
          </div>
        `;
      } else if (event.label === "normal_flare") {
        // Operational refinery flare: quiet steel-slate ring (suppressed noise)
        iconHtml = `
          <div style="position:relative; width:16px; height:16px; display:flex; align-items:center; justify-content:center;">
            <div style="width:10px; height:10px; border-radius:50%; background:#334155; border:1.5px solid #64748b;"></div>
          </div>
        `;
      } else if (event.label === "wildfire") {
        // Forest wildfire: crisp deep forest green circle
        iconHtml = `
          <div style="position:relative; width:16px; height:16px; display:flex; align-items:center; justify-content:center;">
            <div style="width:10px; height:10px; border-radius:50%; background:#15803d; border:1.5px solid #86efac;"></div>
          </div>
        `;
      } else if (event.label === "agricultural_burn") {
        // Stubble burning: warm ochre circle
        iconHtml = `
          <div style="position:relative; width:16px; height:16px; display:flex; align-items:center; justify-content:center;">
            <div style="width:10px; height:10px; border-radius:50%; background:#ca8a04; border:1.5px solid #fef08a;"></div>
          </div>
        `;
      } else {
        // Mining activity: muted indigo square
        iconHtml = `
          <div style="position:relative; width:16px; height:16px; display:flex; align-items:center; justify-content:center;">
            <div style="width:10px; height:10px; border-radius:2px; background:#6366f1; border:1.5px solid #c7d2fe;"></div>
          </div>
        `;
      }

      const customIcon = L.divIcon({
        className: "tactical-marker-icon",
        html: iconHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([event.latitude, event.longitude], { icon: customIcon });

      marker.on("click", () => {
        setSelectedEvent(event);
        if (onSelectEvent) onSelectEvent(event);
      });

      marker.bindTooltip(
        `<div style="font-family:'Plus Jakarta Sans',sans-serif;">
          <div style="font-weight:700; color:#ffffff; font-size:11px; text-transform:uppercase; letter-spacing:0.5px;">${event.site_name || event.label.replace(/_/g, " ").toUpperCase()}</div>
          <div style="font-family:'JetBrains Mono',monospace; color:#94a3b8; font-size:10px; margin-top:2px;">
            FRP: <span style="color:#ffffff; font-weight:600;">${event.shap_explanation?.metrics?.frp_mw ?? 50} MW</span> | Dev: <span style="color:${event.deviation_score > 2 ? "#f87171" : "#cbd5e1"}; font-weight:600;">${event.deviation_score > 0 ? "+" : ""}${event.deviation_score}σ</span>
          </div>
        </div>`,
        { className: "bg-[#11141d] text-slate-100 border border-[#262e40] px-2.5 py-1.5 rounded" }
      );

      marker.addTo(markersLayerRef.current);
    });

    // Auto-select Dahej incident on Day T
    if (isReplayMode && replayIndex === 2) {
      const dahejEvent = activeEvents.find((e) => e.label === "industrial_fire");
      if (dahejEvent) {
        setSelectedEvent(dahejEvent);
      }
    }
  }, [mapLoaded, activeEvents, filterClass, isReplayMode, replayIndex]);

  // Sync with selected event from parent
  useEffect(() => {
    if (selectedEventId) {
      const match = activeEvents.find((e) => e.id === selectedEventId);
      if (match) {
        setSelectedEvent(match);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([match.latitude, match.longitude], 11, { duration: 1.0 });
        }
      }
    }
  }, [selectedEventId, activeEvents]);

  return (
    <div className="relative w-full h-full min-h-[600px] overflow-hidden rounded-xl border border-slate-200 bg-white flex flex-col font-sans shadow-sm">
      {/* Top Banner: Mode & Filter Switcher (Light SaaS Clean Controls) */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 z-[999] select-none">
        {/* Mode Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => {
              setIsReplayMode(false);
              setSelectedEvent(null);
            }}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition flex items-center gap-2 ${
              !isReplayMode
                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Live Sector Feed ({events.length})</span>
          </button>

          <button
            onClick={() => {
              setIsReplayMode(true);
              setReplayIndex(2); // Jump to Dahej explosion
            }}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
              isReplayMode
                ? "bg-red-50 text-red-700 shadow-xs border border-red-200 font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <History className="w-3.5 h-3.5 text-red-600" />
            <span>Incident Replay (Dahej 2020)</span>
          </button>
        </div>

        {/* Filter by Category */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-mono text-[11px] font-medium">Filter Category:</span>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="bg-white border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-sans shadow-2xs"
          >
            <option value="all">All Anomaly Classes (6)</option>
            <option value="industrial_fire">Industrial Fire (Emergency)</option>
            <option value="normal_flare">Routine Gas Flare (Normal)</option>
            <option value="unregistered_anomaly">Unregistered Anomaly</option>
            <option value="wildfire">Wildfire / Forest</option>
            <option value="agricultural_burn">Agricultural Residue</option>
            <option value="mining_activity">Mining Activity</option>
          </select>
        </div>

        {/* Historical Scrubber Steps */}
        {isReplayMode && (
          <div className="flex items-center gap-1.5 text-xs bg-slate-100 p-1 rounded-lg border border-slate-200">
            <span className="text-slate-500 font-mono text-[11px] px-1 font-semibold">Phase:</span>
            {REPLAY_TIMELINE.map((step, idx) => (
              <button
                key={idx}
                onClick={() => setReplayIndex(idx)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-mono transition ${
                  replayIndex === idx
                    ? idx === 2
                      ? "bg-red-600 text-white font-bold shadow-xs"
                      : "bg-blue-600 text-white font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                {step.stepName.split(" — ")[0]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map DOM Canvas */}
      <div className="relative flex-1 w-full h-full">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Replay Context Card (Light SaaS Banner) */}
        {isReplayMode && (
          <div className="absolute top-4 left-4 z-[999] bg-white/95 backdrop-blur-md border border-slate-200 p-4 rounded-xl max-w-md shadow-lg flex flex-col gap-1.5 select-none">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-red-600" />
              <span className="font-bold text-xs uppercase text-slate-900 font-mono">
                {REPLAY_TIMELINE[replayIndex]?.stepName}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              {replayIndex === 2 ? (
                <>
                  <strong className="text-red-600">Dahej Chemical Explosion:</strong> 188.4 MW (<strong className="text-red-600">+5.8σ spike</strong>). Notice that <strong className="text-slate-800">Reliance Jamnagar stays GREY (normal flare)</strong> at 43.8 MW (+0.4σ). Zero false alarms dispatched.
                </>
              ) : (
                "Both facilities operating within historical baseline. Gas flares classified as routine operational heat (Steel Grey)."
              )}
            </p>
          </div>
        )}

        {/* Precision Defense Legend (Bottom Left, Light SaaS Styling) */}
        <div className="absolute bottom-4 left-4 z-[999] bg-white/95 backdrop-blur-md border border-slate-200 p-3.5 rounded-xl text-[11px] text-slate-700 flex flex-col gap-1.5 shadow-lg select-none">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] font-mono">Symbology Legend</span>
          <div className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-red-600 bg-red-100 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
            </div>
            <span className="text-slate-900 font-medium">Industrial Fire (Emergency Spike)</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 transform rotate-45 bg-amber-500 border border-amber-700" />
            <span className="text-slate-900 font-medium">Unregistered Anomaly (Unmapped Land)</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-slate-400 border border-slate-600" />
            <span className="text-slate-600">Routine Gas Flare (Operational)</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-amber-600 border border-yellow-500" />
            <span className="text-slate-700">Agricultural Residue Burn</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-emerald-600 border border-emerald-700" />
            <span className="text-slate-700">Wildfire / Forest Cover</span>
          </div>
          <div className="flex items-center gap-2.5 border-t border-slate-200 pt-1.5 mt-0.5">
            <span className="w-3.5 h-2 border-2 border-blue-600 bg-blue-100 rounded-[1px]" />
            <span className="text-slate-500 font-mono text-[10px]">OSM Industrial Polygon (5,550+)</span>
          </div>
        </div>

        {/* Explainability Drawer */}
        <ExplanationPanel
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onAcknowledge={() => setSelectedEvent(null)}
        />
      </div>
    </div>
  );
};
