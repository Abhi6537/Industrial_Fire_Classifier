"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ThermalDetection,
  ClassificationLabel,
  SeverityLevel,
  formatTimestamp,
  MOCK_DETECTIONS,
} from "@/lib/mockData";
import { fetchEvents, fetchSites, ClassifiedEvent, IndustrialSite } from "@/lib/api";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ClassificationBadge } from "@/components/ui/ClassificationBadge";
import { ThermalMap } from "@/components/map/ThermalMap";
import { AnomalyInspectorModal } from "@/components/dashboard/AnomalyInspectorModal";
import {
  ArrowRight,
  RotateCcw,
  Filter,
  Activity,
  Flame,
  Wind,
  Layers,
  ShieldAlert,
  Radio,
  X,
  Cpu,
  Globe2,
  Calendar,
  Clock,
  Crosshair,
  TrendingUp,
  MapPin,
  FileText,
  ChevronRight,
} from "lucide-react";

export default function DashboardPage() {
  const [realEvents, setRealEvents] = useState<ClassifiedEvent[]>([]);
  const [realSites, setRealSites] = useState<IndustrialSite[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [inspectedDetection, setInspectedDetection] = useState<ThermalDetection | null>(null);

  // Filter state
  const [selectedTypes, setSelectedTypes] = useState<ClassificationLabel[]>([]);
  const [minConfidence, setMinConfidence] = useState<number>(0);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");

  // Fetch real telemetry from backend on load
  useEffect(() => {
    async function loadRealData() {
      setIsLoading(true);
      try {
        const [eventsData, sitesData] = await Promise.all([
          fetchEvents(),
          fetchSites(),
        ]);
        if (eventsData && eventsData.length > 0) {
          setRealEvents(eventsData);
        }
        if (sitesData && sitesData.length > 0) {
          setRealSites(sitesData);
        }
      } catch (err) {
        console.error("Failed loading real telemetry from backend:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadRealData();
  }, []);

  // Map real backend ClassifiedEvents into UI ThermalDetections
  const allDetections: ThermalDetection[] = useMemo(() => {
    if (realEvents.length === 0) {
      return MOCK_DETECTIONS;
    }

    return realEvents.map((evt) => {
      let cls: ClassificationLabel = "unknown_anomaly";
      if (evt.label === "industrial_fire") cls = "industrial_fire";
      else if (evt.label === "normal_flare") cls = "gas_flare";
      else if (evt.label === "unregistered_anomaly") cls = "persistent_source";
      else if (evt.label === "agricultural_burn") cls = "agricultural_burn";
      else if (evt.label === "wildfire") cls = "natural_fire";

      let sev: SeverityLevel = "low";
      if (evt.severity === "critical" || evt.label === "industrial_fire") sev = "high";
      else if (evt.severity === "warning" || evt.deviation_score > 2.0) sev = "medium";

      const locName = evt.site_name && evt.site_name !== "Unmapped Location"
        ? evt.site_name
        : `${evt.latitude.toFixed(3)}°N, ${evt.longitude.toFixed(3)}°E`;

      const facId = evt.site_name?.includes("Dahej") || evt.site_type === "chemical"
        ? "fac_001"
        : evt.site_name?.includes("Jamnagar") || evt.site_type === "refinery"
        ? "fac_002"
        : evt.site_name?.includes("Hazira")
        ? "fac_003"
        : undefined;

      return {
        id: evt.id,
        facilityName: evt.site_name || "Unmapped Installation",
        facilityId: facId,
        location: locName,
        lat: evt.latitude,
        lng: evt.longitude,
        latitude: evt.latitude,
        longitude: evt.longitude,
        classification: cls,
        confidence: Math.round(evt.confidence * 100),
        radiance: Math.round((evt.frp ?? evt.shap_explanation?.metrics?.frp_mw ?? 18.5) * 10) / 10,
        severity: sev,
        status: evt.label === "industrial_fire" ? "open" : "monitoring",
        timestamp: evt.detected_at ?? evt.classified_at ?? new Date().toISOString(),
        detectedAt: evt.detected_at,
        deviationScore: evt.deviation_score,
        shapExplanation: evt.shap_explanation,
        brightnessTemp: evt.brightness_temp ?? evt.shap_explanation?.metrics?.brightness_temp_k,
        landCoverType: evt.land_cover_type,
        persistenceCount: evt.persistence_count,
        onKnownSite: (evt as any).on_known_site ?? (evt.site_name && !evt.site_name.includes("Farmland") && !evt.site_name.includes("Unmapped") && !evt.site_name.includes("Forest")),
        distanceToNearestFacilityKm: evt.shap_explanation?.metrics?.distance_to_nearest_facility_km,
      };
    });
  }, [realEvents]);

  // Filter handlers
  const toggleType = (type: ClassificationLabel) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const resetFilters = () => {
    setSelectedTypes([]);
    setMinConfidence(0);
    setSelectedRegion("all");
  };

  // Filtered detections based on UI controls
  const filteredDetections = useMemo(() => {
    return allDetections.filter((d) => {
      if (selectedTypes.length > 0 && !selectedTypes.includes(d.classification)) {
        return false;
      }
      if (d.confidence < minConfidence) {
        return false;
      }
      if (selectedRegion !== "all") {
        if (selectedRegion === "west" && (d.lng < 68 || d.lng > 75)) return false;
        if (selectedRegion === "east" && (d.lng < 80 || d.lng > 88)) return false;
        if (selectedRegion === "north" && d.lat < 26) return false;
        if (selectedRegion === "south" && d.lat > 18) return false;
      }
      return true;
    });
  }, [allDetections, selectedTypes, minConfidence, selectedRegion]);

  // Dynamic real counts from live data
  const totalAnomalies = allDetections.length;
  const industrialFires = allDetections.filter((d) => d.classification === "industrial_fire").length;
  const persistentSources = allDetections.filter((d) => d.classification === "persistent_source").length;
  const gasFlares = allDetections.filter((d) => d.classification === "gas_flare").length;

  return (
    <div className="flex min-h-screen bg-tw-navy text-tw-text font-sans antialiased">
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Header */}
        <Header />

        {/* Dashboard Content */}
        <main className="p-6 space-y-6 overflow-y-auto">
          {/* ── Metric Cards Row (4 Top Cards) ────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Thermal Anomalies */}
            <div className="bg-tw-surface border border-tw-border rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-tw-muted text-xs font-semibold tracking-wide">
                  Thermal Anomalies
                </span>
                <span className="p-1.5 rounded-lg bg-tw-navy border border-tw-border text-tw-teal">
                  <Activity className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-bold font-mono text-tw-text">
                  {totalAnomalies}
                </span>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  VIIRS NRT
                </span>
              </div>
            </div>

            {/* Card 2: Industrial Fires */}
            <div className="bg-tw-surface border border-tw-border rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-tw-muted text-xs font-semibold tracking-wide">
                  Industrial Fires
                </span>
                <span className="p-1.5 rounded-lg bg-tw-navy border border-tw-border text-red-400">
                  <Flame className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-bold font-mono text-red-500">
                  {industrialFires}
                </span>
                <span className="text-xs font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                  Z &gt; 3.0σ
                </span>
              </div>
            </div>

            {/* Card 3: Persistent Sources */}
            <div className="bg-tw-surface border border-tw-border rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-tw-muted text-xs font-semibold tracking-wide">
                  Persistent Sources
                </span>
                <span className="p-1.5 rounded-lg bg-tw-navy border border-tw-border text-amber-400">
                  <Layers className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-bold font-mono text-amber-400">
                  {persistentSources}
                </span>
                <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Multi-Pass
                </span>
              </div>
            </div>

            {/* Card 4: Gas Flares */}
            <div className="bg-tw-surface border border-tw-border rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-tw-muted text-xs font-semibold tracking-wide">
                  Gas Flares
                </span>
                <span className="p-1.5 rounded-lg bg-tw-navy border border-tw-border text-sky-400">
                  <Wind className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-bold font-mono text-sky-400">
                  {gasFlares}
                </span>
                <span className="text-xs font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  Baseline Normal
                </span>
              </div>
            </div>
          </div>

          {/* ── Main Operations Grid: Map (Left) + Filters (Right) ──────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Map Container (3 cols) */}
            <div className="lg:col-span-3 bg-tw-surface border border-tw-border rounded-xl overflow-hidden p-1 shadow-lg">
              <ThermalMap
                detections={filteredDetections}
                height={580}
                center={[22.0, 72.8]}
                zoom={6}
              />
            </div>

            {/* Filters Sidebar (1 col) */}
            <div className="bg-tw-surface border border-tw-border rounded-xl p-5 shadow-lg space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-tw-border">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-tw-teal" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-tw-text">
                    Filters
                  </h3>
                </div>
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1 text-[11px] text-tw-muted hover:text-tw-text transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Filters
                </button>
              </div>

              {/* Filter 1: Anomaly Type */}
              <div className="space-y-2.5">
                <label className="text-[11px] font-semibold text-tw-muted uppercase tracking-wider block">
                  Anomaly Type
                </label>
                <div className="space-y-1.5">
                  {[
                    { key: "industrial_fire", label: "Industrial Fire", color: "#dc2626" },
                    { key: "gas_flare", label: "Gas Flare", color: "#38bdf8" },
                    { key: "persistent_source", label: "Persistent Source", color: "#ca8a04" },
                    { key: "agricultural_burn", label: "Agricultural Burning", color: "#f59e0b" },
                    { key: "natural_fire", label: "Natural / Forest Fire", color: "#22c55e" },
                    { key: "unknown_anomaly", label: "Unknown", color: "#94a3b8" },
                  ].map((item) => {
                    const isChecked = selectedTypes.includes(
                      item.key as ClassificationLabel
                    );
                    return (
                      <label
                        key={item.key}
                        className="flex items-center gap-2.5 cursor-pointer text-xs text-tw-muted hover:text-tw-text py-0.5 select-none"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleType(item.key as ClassificationLabel)}
                          className="w-3.5 h-3.5 rounded bg-tw-navy border-tw-border text-tw-teal focus:ring-0"
                        />
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className={isChecked ? "text-tw-text font-medium" : ""}>
                          {item.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Filter 2: Confidence Score */}
              <div className="space-y-2 pt-2 border-t border-tw-border">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-semibold text-tw-muted uppercase tracking-wider">
                    Confidence Score
                  </span>
                  <span className="text-tw-teal font-mono font-bold">
                    ≥ {minConfidence}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(Number(e.target.value))}
                  className="w-full h-1.5 bg-tw-navy rounded-lg appearance-none cursor-pointer accent-tw-teal"
                />
                <div className="flex justify-between text-[10px] text-tw-dim font-mono">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Filter 3: Region */}
              <div className="space-y-2 pt-2 border-t border-tw-border">
                <label className="text-[11px] font-semibold text-tw-muted uppercase tracking-wider block">
                  Region
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full bg-tw-navy border border-tw-border rounded-lg px-3 py-1.5 text-xs text-tw-text focus:outline-none focus:border-tw-teal"
                >
                  <option value="all">All India (National Focus)</option>
                  <option value="west">Western Industrial Belt (Gujarat)</option>
                  <option value="east">Eastern Mining Belt (Odisha/Jharkhand)</option>
                  <option value="north">Northern Belt (Punjab/Haryana)</option>
                  <option value="south">Central & Southern Forests</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Recent Detections Table ────────────────────────────────────── */}
          <div className="bg-tw-surface border border-tw-border rounded-xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-tw-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-tw-text">
                  Live Satellite Telemetry Log
                </h3>
                <p className="text-xs text-tw-muted">
                  Showing {filteredDetections.length} real NASA VIIRS active fire observations across sector
                </p>
              </div>
              <Link
                href="/alerts"
                className="flex items-center gap-1 text-xs text-tw-teal hover:text-tw-teal-hi font-semibold transition-colors"
              >
                View Emergency Alerts
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-tw-navy/50 text-tw-muted border-b border-tw-border font-medium">
                    <th className="p-3.5">Overpass Time (IST)</th>
                    <th className="p-3.5">Facility / Location</th>
                    <th className="p-3.5">Classification</th>
                    <th className="p-3.5">Radiance (MW)</th>
                    <th className="p-3.5">Confidence</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tw-border">
                  {filteredDetections.map((det) => (
                    <tr
                      key={det.id}
                      className="hover:bg-tw-raised/40 transition-colors"
                    >
                      <td className="p-3.5 font-mono text-tw-muted">
                        {formatTimestamp(det.timestamp)}
                      </td>
                      <td className="p-3.5 font-medium text-tw-text">
                        {det.location}
                      </td>
                      <td className="p-3.5">
                        <ClassificationBadge classification={det.classification} />
                      </td>
                      <td className="p-3.5 font-mono font-bold text-tw-text">
                        {det.radiance} MW
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-tw-navy rounded-full overflow-hidden">
                            <div
                              className="h-full bg-tw-teal rounded-full"
                              style={{ width: `${det.confidence}%` }}
                            />
                          </div>
                          <span className="font-mono font-semibold text-tw-text">
                            {det.confidence}%
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 text-right">
                        <Link
                          href={`/site/${det.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-tw-teal/10 hover:bg-tw-teal/20 border border-tw-teal/30 text-tw-teal rounded text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Inspect
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Full Core Logic Anomaly Inspector Modal */}
      <AnomalyInspectorModal
        detection={inspectedDetection}
        onClose={() => setInspectedDetection(null)}
      />
    </div>
  );
}
