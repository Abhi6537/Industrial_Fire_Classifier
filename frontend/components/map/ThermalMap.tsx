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

// ─── Popup HTML builder ────────────────────────────────────────────────────

function buildPopupHTML(d: ThermalDetection): string {
  const meta = CLASSIFICATION_META[d.classification];
  const severityColor =
    d.severity === "high"
      ? "#dc2626"
      : d.severity === "medium"
      ? "#d97706"
      : "#16a34a";

  return `
    <div style="
      font-family: var(--font-inter, system-ui, sans-serif);
      padding: 14px 16px;
      min-width: 230px;
    ">
      <div style="
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #64748b;
        margin-bottom: 6px;
      ">Thermal Anomaly</div>

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
          <span style="color: #64748b;">Radiance</span>
          <span style="color: #e2e8f0;">${d.radiance} MW</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px;">
          <span style="color: #64748b;">Severity</span>
          <span style="color: ${severityColor}; font-weight: 600; text-transform: uppercase; font-size: 10px;">${d.severity}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px;">
          <span style="color: #64748b;">Detected</span>
          <span style="color: #94a3b8; font-size: 10px;">${formatTimestamp(d.timestamp)}</span>
        </div>
      </div>

      <a href="/site/${d.facilityId ?? "demo"}" style="
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
      ">View Details →</a>
    </div>
  `;
}

// ─── Marker icon HTML builder ──────────────────────────────────────────────

function buildMarkerHTML(d: ThermalDetection): string {
  const meta = CLASSIFICATION_META[d.classification];
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
        border-radius: ${d.classification === "unknown_anomaly" ? "3px" : "50%"};
        background: ${meta.color};
        border: 1.5px solid rgba(255,255,255,0.25);
        box-shadow: 0 0 6px ${meta.color}60;
        position: relative;
        z-index: 1;
      "></div>
    </div>
  `;
}

// ─── Component ────────────────────────────────────────────────────────────

export function ThermalMap({
  detections,
  height = 480,
  center = [20.5, 78.9],
  zoom = 5,
  className = "",
}: ThermalMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialise map once on mount
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

      // Esri World Dark Gray Base (Free, no API key required)
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        {
          attribution:
            '&copy; <a href="https://www.esri.com/">Esri</a> &copy; OpenStreetMap | NASA FIRMS',
          maxZoom: 16,
        }
      ).addTo(map);

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
          maxWidth: 260,
          className: "thermowatch-popup",
        });

        marker.addTo(markersLayerRef.current);
      });
    });
  }, [mapReady, detections]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-tw-border ${className}`}
      style={{ height }}
    >
      {/* Map container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 z-[999] bg-tw-surface/90 backdrop-blur-sm border border-tw-border rounded-lg p-3 text-xs flex flex-col gap-2">
        <p className="text-tw-muted font-semibold uppercase tracking-wider text-[10px]">
          Classification
        </p>
        {(
          [
            "industrial_fire",
            "gas_flare",
            "persistent_source",
            "agricultural_burn",
            "natural_fire",
            "unknown_anomaly",
          ] as const
        ).map((cls) => {
          const meta = CLASSIFICATION_META[cls];
          return (
            <div key={cls} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: meta.color }}
              />
              <span className="text-tw-text/80">{meta.label}</span>
            </div>
          );
        })}
      </div>

      {/* Detection count badge */}
      <div className="absolute top-3 right-3 z-[999] bg-tw-surface/90 backdrop-blur-sm border border-tw-border rounded-full px-3 py-1 text-[11px] font-medium text-tw-muted">
        {detections.length} detections
      </div>
    </div>
  );
}
