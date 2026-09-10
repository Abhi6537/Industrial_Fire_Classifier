"use client";

import React, { useState } from "react";
import { ThermalDetection } from "@/lib/mockData";
import { ClassificationBadge } from "@/components/ui/ClassificationBadge";
import {
  X,
  Radio,
  Cpu,
  Flame,
  Activity,
  MapPin,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Compass,
  Copy,
  Check,
  TrendingUp,
  Globe,
  ExternalLink,
  Satellite,
  ChevronRight,
} from "lucide-react";

interface AnomalyInspectorModalProps {
  detection: ThermalDetection | null;
  onClose: () => void;
}

export const AnomalyInspectorModal: React.FC<AnomalyInspectorModalProps> = ({
  detection,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!detection) return null;

  const lat = detection.lat ?? detection.latitude ?? 0;
  const lng = detection.lng ?? detection.longitude ?? 0;
  const frp = detection.radiance;
  const tempK = detection.brightnessTemp ?? detection.shapExplanation?.metrics?.brightness_temp_k ?? 330.0;
  const zScore = detection.deviationScore ?? detection.shapExplanation?.metrics?.deviation_z_score ?? 0.0;
  const persistence = detection.persistenceCount ?? detection.shapExplanation?.metrics?.persistence_count ?? 1;
  const landCover = detection.landCoverType ?? "farmland";
  const onKnownSite = detection.onKnownSite ?? (detection.shapExplanation?.metrics?.on_known_site ?? false);
  const distanceToPlant = detection.distanceToNearestFacilityKm ?? detection.shapExplanation?.metrics?.distance_to_nearest_facility_km ?? 15.4;

  // Format UTC and IST timestamps
  const rawDate = new Date(detection.timestamp);
  const utcString = isNaN(rawDate.getTime())
    ? detection.timestamp
    : rawDate.toISOString().replace("T", " ").replace(".000Z", " UTC");
  
  const istString = isNaN(rawDate.getTime())
    ? detection.timestamp
    : rawDate.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "medium",
      }) + " (IST)";

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(detection, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shap = detection.shapExplanation;
  const shapFactors = shap?.shap_factors || [];
  const primaryFactors = shap?.primary_factors || [];
  const baseValue = shap?.base_value;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-tw-surface border border-tw-border rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden text-tw-text font-sans antialiased">
        
        {/* ── Top Header ──────────────────────────────────────────────── */}
        <div className="p-5 border-b border-tw-border bg-tw-navy/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-tw-teal/10 border border-tw-teal/30 text-tw-teal">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-tw-text">
                  Thermal Anomaly Intelligence Dossier
                </h2>
                <ClassificationBadge classification={detection.classification} />
              </div>
              <p className="text-xs text-tw-muted font-mono mt-0.5">
                Target ID: {detection.id} &bull; Sensor: NASA VIIRS 375m (Band I-4)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-tw-surface border border-tw-border text-tw-muted hover:text-tw-text hover:bg-tw-raised transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable Body ─────────────────────────────────────────── */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* Key Metrics Quick Readout (4 Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {/* 1. Fire Radiative Power */}
            <div className="bg-tw-navy border border-tw-border rounded-xl p-3.5 flex flex-col justify-center">
              <span className="text-[10px] font-mono uppercase font-semibold text-tw-muted tracking-wider">
                Radiance (FRP)
              </span>
              <span className="text-xl font-bold font-mono text-tw-text mt-1">
                {frp} <span className="text-xs font-normal text-tw-muted">MW</span>
              </span>
              <span className="text-[10px] text-tw-dim mt-0.5">Raw VIIRS Flux</span>
            </div>

            {/* 2. Sensor Temperature */}
            <div className="bg-tw-navy border border-tw-border rounded-xl p-3.5 flex flex-col justify-center">
              <span className="text-[10px] font-mono uppercase font-semibold text-tw-muted tracking-wider">
                Brightness Temp
              </span>
              <span className="text-xl font-bold font-mono text-amber-400 mt-1">
                {tempK.toFixed(1)} <span className="text-xs font-normal text-tw-muted">K</span>
              </span>
              <span className="text-[10px] text-tw-dim mt-0.5">{(tempK - 273.15).toFixed(1)}°C Sensor</span>
            </div>

            {/* 3. ML Model Confidence */}
            <div className="bg-tw-navy border border-tw-border rounded-xl p-3.5 flex flex-col justify-center">
              <span className="text-[10px] font-mono uppercase font-semibold text-tw-muted tracking-wider">
                ML Confidence
              </span>
              <span className="text-xl font-bold font-mono text-tw-teal mt-1">
                {detection.confidence}%
              </span>
              <span className="text-[10px] text-tw-dim mt-0.5">Random Forest RF-11</span>
            </div>

            {/* 4. Baseline Z-Score */}
            <div className="bg-tw-navy border border-tw-border rounded-xl p-3.5 flex flex-col justify-center">
              <span className="text-[10px] font-mono uppercase font-semibold text-tw-muted tracking-wider">
                Baseline Deviation
              </span>
              <span
                className={`text-xl font-bold font-mono mt-1 ${
                  zScore > 2.0 ? "text-red-400" : "text-emerald-400"
                }`}
              >
                {zScore > 0 ? `+${zScore.toFixed(1)}` : zScore.toFixed(1)}σ
              </span>
              <span className="text-[10px] text-tw-dim mt-0.5">Historical Z-Score</span>
            </div>
          </div>

          {/* Section 1: Raw Satellite Telemetry */}
          <div className="bg-tw-navy/50 border border-tw-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-tw-border">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-tw-text">
                <Satellite className="w-4 h-4 text-tw-teal" />
                <span>Raw Satellite Overpass Telemetry (NASA FIRMS)</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Direct Orbit Observation
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-tw-navy border border-tw-border/60 rounded-lg p-3 space-y-1.5 font-mono">
                <div className="text-[10px] uppercase text-tw-muted font-semibold">Physical Overpass Time</div>
                <div className="text-tw-text font-bold text-sm">{istString}</div>
                <div className="text-tw-dim text-[11px]">UTC: {utcString}</div>
              </div>

              <div className="bg-tw-navy border border-tw-border/60 rounded-lg p-3 space-y-1.5 font-mono">
                <div className="text-[10px] uppercase text-tw-muted font-semibold">Satellite Orbit & Geometry</div>
                <div className="text-tw-text font-bold">
                  {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
                </div>
                <div className="text-tw-dim text-[11px]">
                  Multi-Pass Persistence: {persistence} pass{persistence > 1 ? "es" : ""} &bull; Nadir Ground Sampling: 375m
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Spatial Fusion Logic (OSM Polygons + ESA WorldCover) */}
          <div className="bg-tw-navy/50 border border-tw-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-tw-border">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-tw-text">
                <Compass className="w-4 h-4 text-indigo-400" />
                <span>GIS Spatial Fusion: OSM Industrial Boundaries + ESA WorldCover</span>
              </div>
              <span className="text-[11px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                10m PostGIS Geofence
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* OSM Boundary Intersect */}
              <div className="bg-tw-navy border border-tw-border/60 rounded-lg p-3 space-y-1">
                <span className="text-[10px] font-mono uppercase text-tw-muted font-semibold block">
                  OpenStreetMap (OSM) Boundary
                </span>
                {onKnownSite ? (
                  <div className="flex items-center gap-2 text-red-400 font-semibold mt-1">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>INSIDE Industrial Boundary ({detection.facilityName})</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold mt-1">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>OUTSIDE Industrial Boundary</span>
                  </div>
                )}
                <p className="text-[11px] text-tw-muted font-mono mt-1">
                  Nearest Industrial Complex: <strong className="text-tw-text">{distancePlantLabel(distanceToPlant)}</strong>
                </p>
              </div>

              {/* ESA WorldCover Land Cover */}
              <div className="bg-tw-navy border border-tw-border/60 rounded-lg p-3 space-y-1">
                <span className="text-[10px] font-mono uppercase text-tw-muted font-semibold block">
                  ESA WorldCover 10m Resolution Land Use
                </span>
                <div className="capitalize text-tw-text font-bold text-sm mt-1">
                  {landCover.replace(/_/g, " ")}
                </div>
                <p className="text-[11px] text-tw-muted font-mono mt-1">
                  Location: <strong className="text-tw-text">{detection.location}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Explainable AI / SHAP TreeExplainer Attribution */}
          <div className="bg-tw-navy/50 border border-tw-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-tw-border">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-tw-text">
                <Cpu className="w-4 h-4 text-tw-teal" />
                <span>Explainable AI: SHAP TreeExplainer Attribution (&phi;<sub>i</sub>)</span>
              </div>
              {baseValue !== undefined && (
                <span className="text-[10px] font-mono text-tw-muted">
                  Base Rate E[f(x)]: <strong className="text-tw-text">{(baseValue * 100).toFixed(1)}%</strong>
                </span>
              )}
            </div>

            {/* Waterfall / Diverging Bar Chart */}
            {shapFactors.length > 0 ? (
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-[10px] font-mono text-tw-dim border-b border-tw-border/60 pb-1">
                  <span>FEATURE & OBSERVED VALUE</span>
                  <span>SHAP IMPACT (&phi;<sub>i</sub>)</span>
                </div>
                {shapFactors.map((factor, idx) => {
                  const isPositive = factor.shap_value >= 0;
                  const maxAbs = Math.max(
                    ...shapFactors.map((f) => Math.abs(f.shap_value)),
                    0.3
                  );
                  const barWidth = Math.min(
                    Math.round((Math.abs(factor.shap_value) / maxAbs) * 100),
                    100
                  );

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-tw-text truncate max-w-[280px]">
                          {factor.label || factor.feature}
                          <span className="text-tw-muted font-mono text-[11px] ml-1.5">
                            ({factor.value}
                            {factor.unit ? ` ${factor.unit}` : ""})
                          </span>
                        </span>
                        <span
                          className={`font-mono text-xs font-bold ${
                            isPositive ? "text-amber-400" : "text-sky-400"
                          }`}
                        >
                          {isPositive ? `+${factor.shap_value.toFixed(3)}` : factor.shap_value.toFixed(3)}
                        </span>
                      </div>
                      {/* Bar indicator */}
                      <div className="w-full bg-tw-navy h-1.5 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isPositive
                              ? "bg-gradient-to-r from-amber-500 to-red-500"
                              : "bg-gradient-to-r from-sky-400 to-indigo-500"
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-tw-muted font-mono py-2">
                SHAP inference breakdown vector: Land Cover prior ({landCover}) + Baseline Z ({zScore.toFixed(1)}&sigma;) + Radiance ({frp} MW).
              </div>
            )}

            {/* Operational Synthesis Bullets */}
            {primaryFactors.length > 0 && (
              <div className="pt-3 border-t border-tw-border/60 space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-tw-muted font-semibold block">
                  Model Decision Synthesis
                </span>
                {primaryFactors.map((factor, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-tw-text leading-relaxed">
                    <ChevronRight className="w-3.5 h-3.5 text-tw-teal shrink-0 mt-0.5" />
                    <span>{factor}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ── Footer / Actions ────────────────────────────────────────── */}
        <div className="p-4 border-t border-tw-border bg-tw-navy/50 flex items-center justify-between">
          <button
            onClick={handleCopyJson}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-tw-surface hover:bg-tw-raised border border-tw-border text-tw-text text-xs rounded-lg transition-colors font-mono"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied Payload</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-tw-muted" />
                <span>Export Telemetry JSON</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-tw-teal hover:bg-tw-teal-hi text-tw-navy font-bold text-xs rounded-lg transition-colors shadow-sm"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};

function distancePlantLabel(distKm: number): string {
  if (distKm <= 0.05) return "0.0 km (Direct Facility On-Site)";
  return `${distKm.toFixed(1)} km away`;
}
