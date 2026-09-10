"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ThermalDetection,
  CLASSIFICATION_META,
  formatTimestamp,
} from "@/lib/mockData";

interface ThermalMapProps {
  detections: ThermalDetection[];
  height?: string | number;
  center?: [number, number];
  zoom?: number;
  className?: string;
}

const DEFAULT_DEMO_SITES = [
  {
    name: "Dahej Petroleum & Chemical Complex (PCPIR)",
    type: "chemical",
    bounds: [
      [21.700, 72.570],
      [21.725, 72.570],
      [21.725, 72.595],
      [21.700, 72.595],
    ],
  },
  {
    name: "Reliance Jamnagar Refinery Complex",
    type: "refinery",
    bounds: [
      [22.340, 69.850],
      [22.370, 69.850],
      [22.370, 69.880],
      [22.340, 69.880],
    ],
  },
  {
    name: "Hazira Port & Petrochemical Manufacturing Hub",
    type: "steel",
    bounds: [
      [21.090, 72.630],
      [21.115, 72.630],
      [21.115, 72.660],
      [21.090, 72.660],
    ],
  },
];

// ─── Popup HTML builder ────────────────────────────────────────────────────

function buildPopupHTML(d: ThermalDetection): string {
  const meta = CLASSIFICATION_META[d.classification] || CLASSIFICATION_META.unknown_anomaly;
  const severityColor =
    d.severity === "high"
      ? "#dc2626"
      : d.severity === "medium"
      ? "#d97706"
      : "#16a34a";

  const devScoreStr =
    d.deviationScore !== undefined
      ? `<div style="display: flex; justify-content: space-between; font-size: 11px;">
          <span style="color: #64748b;">Z-Deviation</span>
          <span style="color: ${d.deviationScore > 2.0 ? "#ef4444" : "#38bdf8"}; font-weight: 700; font-family: monospace;">
            ${d.deviationScore > 0 ? `+${d.deviationScore.toFixed(1)}` : d.deviationScore.toFixed(1)}σ
          </span>
        </div>`
      : "";

  const shapDriverStr =
    d.shapExplanation?.primary_factors?.[0]
      ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 10px; color: #94a3b8; line-height: 1.3;">
          <strong style="color: #cbd5e1;">SHAP Decision Driver:</strong> ${d.shapExplanation.primary_factors[0]}
        </div>`
      : "";

  return `
    <div style="
      font-family: var(--font-inter, system-ui, sans-serif);
      padding: 14px 16px;
      min-width: 250px;
    ">
      <div style="
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #64748b;
        margin-bottom: 6px;
      ">Live VIIRS Satellite Anomaly</div>

      <div style="font-size: 13px; font-weight: 600; color: #e2e8f0; margin-bottom: 10px; line-height: 1.3;">
        ${d.facilityName}
      </div>

      <div style="display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px;">
          <span style="color: #64748b;">Location</span>
          <span style="color: #e2e8f0;">${d.location}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px;">
          <span style="color: #64748b;">Classification</span>
          <span style="
            color: ${meta.color};
            background: ${meta.bg};
            padding: 1px 7px;
            border-radius: 4px;
            font-weight: 600;
            font-size: 10px;
          ">${meta.label}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px;">
          <span style="color: #64748b;">Confidence</span>
          <span style="color: #e2e8f0; font-weight: 600;">${d.confidence}%</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px;">
          <span style="color: #64748b;">Radiance (FRP)</span>
          <span style="color: #e2e8f0; font-weight: bold; font-family: monospace;">${d.radiance} MW</span>
        </div>
        ${devScoreStr}
        <div style="display: flex; justify-content: space-between; font-size: 11px;">
          <span style="color: #64748b;">Severity</span>
          <span style="color: ${severityColor}; font-weight: 600; text-transform: uppercase; font-size: 10px;">${d.severity}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px;">
          <span style="color: #64748b;">Overpass</span>
          <span style="color: #94a3b8; font-size: 10px; font-family: monospace;">${formatTimestamp(d.timestamp)}</span>
        </div>
        ${shapDriverStr}
      </div>

      <a href="/site/${d.id}" style="
        display: block;
        text-align: center;
        background: rgba(13, 148, 136, 0.15);
        border: 1px solid rgba(13, 148, 136, 0.4);
        color: #14b8a6;
        padding: 7px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        text-decoration: none;
        transition: background 0.15s;
      ">Inspect Facility Intelligence →</a>
    </div>
  `;
}

// ─── Marker icon HTML builder ──────────────────────────────────────────────

function buildMarkerHTML(d: ThermalDetection): string {
  const meta = CLASSIFICATION_META[d.classification] || CLASSIFICATION_META.unknown_anomaly;
  const isHigh = d.severity === "high";
  const size = isHigh ? 14 : 10;
  const ringSize = isHigh ? 28 : 20;

  return `
    <div style="position: relative; width: ${ringSize}px; height: ${ringSize}px; display: flex; align-items: center; justify-content: center;">
      ${
        isHigh
          ? `<div style="
              position: absolute;
              width: ${ringSize}px; height: ${ringSize}px;
              border-radius: 50%;
              background: ${meta.color}30;
              border: 1px solid ${meta.color}60;
              animation: pulseRing 2.5s ease-out infinite;
            "></div>`
          : ""
      }
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${meta.color};
        box-shadow: 0 0 ${isHigh ? 10 : 5}px ${meta.color}80;
        border: 2px solid #0f172a;
        position: relative;
        z-index: 1;
      "></div>
    </div>
  `;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function ThermalMap({
  detections,
  height = 560,
  center = [21.5, 73.0],
  zoom = 6,
  className = "",
}: ThermalMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current || mapRef.current) return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center,
        zoom,
        zoomControl: false,
        attributionControl: true,
      });

      // 1. Tactical Dark Canvas (Esri World Dark Gray Base)
      const tacticalDark = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        {
          attribution:
            '&copy; <a href="https://www.esri.com/">Esri</a> &copy; OpenStreetMap | NASA FIRMS VIIRS',
          maxZoom: 16,
        }
      );

      // 2. High-Resolution Satellite Recon (Esri World Imagery)
      const satelliteRecon = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution:
            "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics",
          maxZoom: 18,
        }
      );

      const cartoKey =
        process.env.NEXT_PUBLIC_CARTO_KEY ||
        process.env.NEXT_PUBLIC_CARTO_API_KEY ||
        "";
      const cartoQuery = cartoKey ? `?key=${cartoKey}` : "";

      // 3. CARTO Dark Matter (High-contrast dark mode)
      const cartoDark = L.tileLayer(
        `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png${cartoQuery}`,
        {
          attribution:
            '&copy; <a href="https://carto.com/">CARTO</a> | &copy; OpenStreetMap | NASA FIRMS',
          subdomains: "abcd",
          maxZoom: 20,
        }
      );

      // 4. CARTO Voyager (Street & Infrastructure Topo)
      const cartoVoyager = L.tileLayer(
        `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${cartoQuery}`,
        {
          attribution:
            '&copy; <a href="https://carto.com/">CARTO</a> | &copy; OpenStreetMap',
          subdomains: "abcd",
          maxZoom: 20,
        }
      );

      // Default to Tactical Dark
      tacticalDark.addTo(map);

      // Add Basemap Layer Switcher Control (Top Right)
      const baseMaps = {
        "Tactical Dark": tacticalDark,
        "Satellite Recon (Imagery)": satelliteRecon,
        "CARTO Dark Matter": cartoDark,
        "CARTO Voyager (Street)": cartoVoyager,
      };

      L.control.layers(baseMaps, undefined, { position: "topright" }).addTo(map);

      // Render OSM Industrial Polygons (Dahej, Jamnagar, Hazira)
      DEFAULT_DEMO_SITES.forEach((site) => {
        const poly = L.polygon(site.bounds as any, {
          color: "#38bdf8",
          weight: 1.5,
          dashArray: "5, 5",
          fillColor: "#0284c7",
          fillOpacity: 0.15,
        });
        poly.bindTooltip(
          `<strong>${site.name}</strong><br><span style="font-size:10px;color:#cbd5e1;">OSM Industrial Zone (${site.type})</span>`,
          { sticky: true }
        );
        poly.addTo(map);
      });

      // Custom zoom control (bottom right)
      L.control.zoom({ position: "bottomright" }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;

      if (isMounted) setMapReady(true);
    });

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersLayerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render markers when detections change
  useEffect(() => {
    if (!mapReady || !mapRef.current || !markersLayerRef.current) return;

    import("leaflet").then((L) => {
      if (!markersLayerRef.current) return;
      markersLayerRef.current.clearLayers();

      detections.forEach((detection) => {
        const icon = L.divIcon({
          className: "thermal-marker-icon",
          html: buildMarkerHTML(detection),
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -16],
        });

        const marker = L.marker([detection.lat, detection.lng], { icon });

        marker.bindPopup(buildPopupHTML(detection), {
          maxWidth: 280,
          className: "thermal-popup",
        });

        marker.addTo(markersLayerRef.current);
      });
    });
  }, [mapReady, detections]);

  return (
    <div
      className={`relative overflow-hidden w-full h-full ${className}`}
      style={{ height }}
    >
      {/* Map container */}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
