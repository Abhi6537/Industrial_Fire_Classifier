"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { MOCK_DETECTIONS } from "@/lib/mockData";

export function HeroMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current || mapRef.current) return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [22.0, 79.5],
        zoom: 5,
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: false,
      });

      // Esri World Dark Gray Base (Free, no API key required)
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 16,
        }
      ).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);

      // Add detection markers with glowing animation
      MOCK_DETECTIONS.forEach((d) => {
        const color =
          d.classification === "industrial_fire"
            ? "#dc2626"
            : d.classification === "gas_flare"
            ? "#d97706"
            : d.classification === "persistent_source"
            ? "#ca8a04"
            : "#16a34a";

        const iconHtml = `
          <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
            <div style="
              position: absolute;
              width: 28px; height: 28px;
              border-radius: 50%;
              background: ${color}25;
              border: 1px solid ${color}50;
              animation: pulseRing 2.5s ease-out infinite;
            "></div>
            <div style="
              width: 12px;
              height: 12px;
              border-radius: 50%;
              background: ${color};
              border: 1.5px solid rgba(255,255,255,0.8);
              box-shadow: 0 0 10px ${color};
              position: relative;
              z-index: 2;
            "></div>
          </div>
        `;

        const customIcon = L.divIcon({
          className: "hero-marker-icon",
          html: iconHtml,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        L.marker([d.lat, d.lng], { icon: customIcon }).addTo(markersLayer);
      });

      mapRef.current = map;
      if (isMounted) setMapReady(true);
    });

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[460px] lg:h-[540px] rounded-2xl border border-tw-border overflow-hidden bg-tw-navy/80 shadow-2xl group">
      {/* Background Leaflet Map */}
      <div ref={containerRef} className="w-full h-full z-0" />

      {/* Grid overlay lines */}
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(13,148,136,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(13,148,136,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Satellite telemetry badge top left */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-tw-surface/90 backdrop-blur-md border border-tw-border px-3 py-1.5 rounded-lg text-xs">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-tw-text font-mono text-[11px]">NASA FIRMS VIIRS · LIVE</span>
      </div>

      {/* Floating Detection Intelligence Card */}
      <div className="absolute bottom-6 right-6 z-20 max-w-xs w-full animate-fade-up">
        <div className="bg-tw-surface/95 backdrop-blur-xl border border-tw-border-hi rounded-xl p-4 shadow-2xl space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-tw-border pb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-tw-teal">
              <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
              <span>Thermal Anomaly</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide text-red-400 bg-red-950/60 border border-red-800/40">
              HIGH SEVERITY
            </span>
          </div>

          {/* Coordinates & Location */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-tw-muted text-[10px] uppercase font-semibold">Latitude</p>
              <p className="text-tw-text font-mono font-semibold">22.57° N</p>
            </div>
            <div>
              <p className="text-tw-muted text-[10px] uppercase font-semibold">Longitude</p>
              <p className="text-tw-text font-mono font-semibold">88.36° E</p>
            </div>
          </div>

          {/* Facility name */}
          <div className="bg-tw-raised/60 p-2 rounded-lg border border-tw-border/80">
            <p className="text-tw-muted text-[10px]">Detected Facility</p>
            <p className="text-tw-text text-xs font-semibold truncate">
              Reliance Industries — Jamnagar
            </p>
          </div>

          {/* Classification & Confidence */}
          <div className="flex items-center justify-between text-xs">
            <div>
              <p className="text-tw-muted text-[10px]">Classification</p>
              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold text-red-400 bg-red-950/80 border border-red-800/50">
                Industrial Fire
              </span>
            </div>
            <div className="text-right">
              <p className="text-tw-muted text-[10px]">Confidence</p>
              <p className="text-tw-text font-bold font-mono text-tw-teal">92%</p>
            </div>
          </div>

          {/* Details Link */}
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-1.5 w-full py-2 bg-tw-teal/15 hover:bg-tw-teal/25 border border-tw-teal/40 text-tw-teal text-xs font-bold rounded-lg transition-all"
          >
            View Details
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
