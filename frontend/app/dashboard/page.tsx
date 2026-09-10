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
  const [timeRange, setTimeRange] = useState<"all" | "24h" | "7d">("all");
  const [showFilters, setShowFilters] = useState<boolean>(false);

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
    setTimeRange("all");
  };

  // Filtered detections based on UI controls (frontend 24h / 7d time range filter)
  const filteredDetections = useMemo(() => {
    const maxDataTimestamp = allDetections.length > 0
      ? Math.max(...allDetections.map((d) => new Date(d.timestamp).getTime()))
      : new Date().getTime();

    return allDetections.filter((d) => {
      if (selectedTypes.length > 0 && !selectedTypes.includes(d.classification)) {
        return false;
      }
      if (d.confidence < minConfidence) {
        return false;
      }
      if (timeRange !== "all") {
        const detTime = new Date(d.timestamp).getTime();
        const diffHoursReal = (new Date().getTime() - detTime) / (1000 * 60 * 60);
        const diffHoursData = (maxDataTimestamp - detTime) / (1000 * 60 * 60);
        const effectiveHours = Math.min(diffHoursReal, diffHoursData);

        if (timeRange === "24h" && effectiveHours > 24) {
          return false;
        }
        if (timeRange === "7d" && effectiveHours > 24 * 7) {
          return false;
        }
      }
      return true;
    });
  }, [allDetections, selectedTypes, minConfidence, timeRange]);

  const activeFilterCount =
    selectedTypes.length + (minConfidence > 0 ? 1 : 0) + (timeRange !== "all" ? 1 : 0);

  // Dynamic real counts from live data
  const totalAnomalies = allDetections.length;
  const industrialFires = allDetections.filter((d) => d.classification === "industrial_fire").length;
  const persistentSources = allDetections.filter((d) => d.classification === "persistent_source").length;
  const gasFlares = allDetections.filter((d) => d.classification === "gas_flare").length;

  return (
    <div className="flex h-screen overflow-hidden bg-tw-navy text-tw-text font-sans antialiased">
      {/* Persistent Bottom Navigation Dock */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* Top Bar Header */}
        <Header />

        {/* Dashboard Content - Full Screen Map Viewport */}
        <main className="flex-1 relative w-full h-full overflow-hidden">
          {/* ── Main Operations Area: Full-Screen Map with Floating Metrics & Overlay Filter Toggle ──────────── */}
          <div className="relative w-full h-full overflow-hidden">
            {/* Floating At-A-Glance Cards (Top-Left vertical stack overlay) */}
            <div className="absolute top-4 left-4 z-[9000] flex flex-col gap-2.5">
              {/* Card 1: Thermal Anomalies */}
              <div className="bg-[#181b17]/85 backdrop-blur-md rounded-2xl px-4 py-3 shadow-xl flex flex-col gap-1 min-w-[150px]">
                <span className="text-[11px] font-medium text-tw-muted tracking-wide">
                  Thermal Anomalies
                </span>
                <span className="text-2xl font-bold font-mono text-tw-text">
                  {totalAnomalies}
                </span>
              </div>

              {/* Card 2: Industrial Fires */}
              <div className="bg-[#181b17]/85 backdrop-blur-md rounded-2xl px-4 py-3 shadow-xl flex flex-col gap-1 min-w-[150px]">
                <span className="text-[11px] font-medium text-tw-muted tracking-wide">
                  Industrial Fires
                </span>
                <span className="text-2xl font-bold font-mono text-red-500">
                  {industrialFires}
                </span>
              </div>

              {/* Card 3: Persistent Sources */}
              <div className="bg-[#181b17]/85 backdrop-blur-md rounded-2xl px-4 py-3 shadow-xl flex flex-col gap-1 min-w-[150px]">
                <span className="text-[11px] font-medium text-tw-muted tracking-wide">
                  Persistent Sources
                </span>
                <span className="text-2xl font-bold font-mono text-amber-400">
                  {persistentSources}
                </span>
              </div>

              {/* Card 4: Gas Flares */}
              <div className="bg-[#181b17]/85 backdrop-blur-md rounded-2xl px-4 py-3 shadow-xl flex flex-col gap-1 min-w-[150px]">
                <span className="text-[11px] font-medium text-tw-muted tracking-wide">
                  Gas Flares
                </span>
                <span className="text-2xl font-bold font-mono text-sky-400">
                  {gasFlares}
                </span>
              </div>
            </div>
            {/* Floating Filter Toggle Button (Positioned below Leaflet Map View switcher) */}
            <div className="absolute top-[60px] right-[10px] z-[9000] flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 flex items-center gap-2 shadow-xl backdrop-blur-xl border ${
                  showFilters || activeFilterCount > 0
                    ? "bg-tw-orange text-white border-tw-orange-hi shadow-tw-orange/30"
                    : "bg-[#1c1f1b]/95 text-tw-text border-white/20 hover:border-white/40 hover:bg-[#262a24]"
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-white text-tw-navy font-bold text-[10px] flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Full Screen Map */}
            <ThermalMap
              detections={filteredDetections}
              height="100%"
              center={[22.0, 72.8]}
              zoom={6}
              className="border-none rounded-none"
            />

            {/* Collapsible Overlay Filter Drawer */}
            {showFilters && (
              <div className="absolute top-[112px] right-[10px] z-[9000] w-80 bg-[#1c1f1b]/95 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-2xl p-5 space-y-5 animate-fade-up">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-tw-border">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-tw-teal" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-tw-text">
                      Filter Telemetry
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={resetFilters}
                      className="flex items-center gap-1 text-[11px] text-tw-muted hover:text-tw-text transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="p-1 text-tw-muted hover:text-white rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Time Horizon Filter (24h / 7d / All) */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-tw-muted uppercase tracking-wider block">
                    Time Horizon
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-tw-navy border border-tw-border">
                    {[
                      { key: "all", label: "All Time" },
                      { key: "24h", label: "Last 24h" },
                      { key: "7d", label: "Last 7d" },
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setTimeRange(item.key as any)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all ${
                          timeRange === item.key
                            ? "bg-tw-orange text-white shadow-md font-bold"
                            : "text-tw-muted hover:text-tw-text hover:bg-tw-raised/50"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Anomaly Type Checkboxes */}
                <div className="space-y-2.5 pt-2 border-t border-tw-border">
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
                      const isChecked = selectedTypes.includes(item.key as ClassificationLabel);
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

                {/* Confidence Score Slider */}
                <div className="space-y-2 pt-2 border-t border-tw-border">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-semibold text-tw-muted uppercase tracking-wider">
                      Confidence Score
                    </span>
                    <span className="text-tw-teal font-mono font-bold">≥ {minConfidence}%</span>
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
              </div>
            )}
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
