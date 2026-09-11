"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ThermalDetection,
  SeverityLevel,
  IncidentStatus,
  ClassificationLabel,
  formatTimestamp,
} from "@/lib/mockData";
import { fetchEvents, ClassifiedEvent } from "@/lib/api";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ClassificationBadge } from "@/components/ui/ClassificationBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { Download, Search, ChevronLeft, ChevronRight, ChevronDown, Calendar, X, Activity, Flame, ShieldAlert, Radio } from "lucide-react";

export default function AlertsPage() {
  const [realEvents, setRealEvents] = useState<ClassifiedEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;

  // 1. Fetch real events from backend algorithms
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const eventsData = await fetchEvents();
        if (eventsData && eventsData.length > 0) {
          setRealEvents(eventsData);
        }
      } catch (err) {
        console.error("Failed loading real events for alerts:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // 2. Map ClassifiedEvents into UI ThermalDetection format
  const allIncidents: ThermalDetection[] = useMemo(() => {
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

      const stat: IncidentStatus = evt.label === "industrial_fire" ? "open" : "monitoring";

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
        status: stat,
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

  // 3. Category count stats derived from live data
  const counts = useMemo(() => {
    return {
      all: allIncidents.length,
      industrial: allIncidents.filter((i) => i.classification === "industrial_fire").length,
      gas_flare: allIncidents.filter((i) => i.classification === "gas_flare").length,
      persistent: allIncidents.filter((i) => i.classification === "persistent_source").length,
      others: allIncidents.filter((i) => ["agricultural_burn", "natural_fire", "unknown_anomaly"].includes(i.classification)).length,
    };
  }, [allIncidents]);

  // 4. Filtering logic
  const filteredIncidents = useMemo(() => {
    return allIncidents.filter((item) => {
      // Search filter
      if (
        searchTerm &&
        !item.location.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !item.facilityName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !item.classification.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      // Severity filter
      if (selectedSeverity !== "all" && item.severity !== selectedSeverity) {
        return false;
      }
      // Status filter
      if (selectedStatus !== "all" && item.status !== selectedStatus) {
        return false;
      }
      // Category card filter
      if (selectedCategory !== "all") {
        if (selectedCategory === "industrial" && item.classification !== "industrial_fire") return false;
        if (selectedCategory === "gas_flare" && item.classification !== "gas_flare") return false;
        if (selectedCategory === "persistent" && item.classification !== "persistent_source") return false;
        if (selectedCategory === "others" && ["industrial_fire", "gas_flare", "persistent_source"].includes(item.classification)) return false;
      }
      // Date range filter
      if (selectedDateRange !== "all") {
        const itemTime = new Date(item.timestamp).getTime();
        const now = Date.now();
        const diffHours = (now - itemTime) / (1000 * 60 * 60);
        if (selectedDateRange === "24h" && diffHours > 24) return false;
        if (selectedDateRange === "7d" && diffHours > 24 * 7) return false;
        if (selectedDateRange === "30d" && diffHours > 24 * 30) return false;
        if (selectedDateRange === "custom") {
          if (startDate) {
            const startMs = new Date(`${startDate}T00:00:00`).getTime();
            if (itemTime < startMs) return false;
          }
          if (endDate) {
            const endMs = new Date(`${endDate}T23:59:59`).getTime();
            if (itemTime > endMs) return false;
          }
        }
      }
      return true;
    });
  }, [allIncidents, searchTerm, selectedSeverity, selectedStatus, selectedCategory, selectedDateRange, startDate, endDate]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredIncidents.length / itemsPerPage));
  const paginatedIncidents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredIncidents.slice(start, start + itemsPerPage);
  }, [filteredIncidents, currentPage]);

  const handleExportCSV = () => {
    const headers = ["Target ID", "Timestamp (IST)", "Location", "Type", "FRP (MW)", "Z-Deviation", "Severity", "Status"];
    const rows = filteredIncidents.map((i) => [
      i.id,
      i.timestamp,
      `"${i.location}"`,
      i.classification,
      i.radiance,
      i.deviationScore ?? 0,
      i.severity,
      i.status,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ntro_fire_alerts_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex min-h-screen bg-tw-navy text-tw-text">
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Header */}
        <Header />

        <main className="p-6 pb-24 space-y-6 overflow-y-auto">
          {/* Header Title + Export */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-tw-text tracking-tight">
                Alerts & Incident Log
              </h1>
              <p className="text-xs text-tw-muted mt-1">
                A chronological list of flagged thermal anomalies and potential incidents.
              </p>
            </div>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#181b17]/90 border border-white/15 hover:bg-[#222620] text-tw-muted hover:text-tw-text rounded-full text-xs font-semibold transition-colors self-start sm:self-auto cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>

          {/* ── Summary Cards Row (5 mini cards) ────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { id: "all", label: "All", count: counts.all },
              { id: "industrial", label: "Industrial", count: counts.industrial },
              { id: "gas_flare", label: "Gas Flare", count: counts.gas_flare },
              { id: "persistent", label: "Persistent", count: counts.persistent },
              { id: "others", label: "Others", count: counts.others },
            ].map((card) => {
              const isSelected = selectedCategory === card.id;
              return (
                <button
                  key={card.id}
                  onClick={() => {
                    setSelectedCategory(card.id);
                    setCurrentPage(1);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? "bg-[#1f231d] border-tw-teal/60 shadow-lg"
                      : "bg-[#181b17]/90 border-white/10 hover:border-white/20"
                  }`}
                >
                  <p className="text-[11px] font-medium text-tw-muted mb-0.5 tracking-wide">
                    {card.label}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-bold font-mono text-tw-text">
                      {card.count}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Filter Bar ──────────────────────────────────────────────── */}
          <div className="bg-[#181b17]/90 border border-white/10 rounded-2xl p-3.5 flex flex-col md:flex-row gap-3.5 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-tw-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search location, type or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#141714] border border-white/15 rounded-full pl-9 pr-4 py-1.5 text-xs text-tw-text placeholder-tw-muted focus:outline-none focus:border-tw-teal"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              {/* Date Range */}
              <div className="flex items-center gap-1.5 text-xs relative">
                <span className="text-tw-muted font-medium shrink-0">Date Range:</span>
                <div className="relative inline-flex items-center">
                  <select
                    value={selectedDateRange}
                    onChange={(e) => {
                      setSelectedDateRange(e.target.value);
                      setShowDatePicker(false);
                    }}
                    className="appearance-none bg-[#141714] border border-white/15 text-tw-text rounded-full pl-3.5 pr-8 py-1.5 text-xs focus:outline-none focus:border-tw-teal cursor-pointer"
                  >
                    <option value="all">All Time</option>
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    {selectedDateRange === "custom" && (
                      <option value="custom">Custom Range</option>
                    )}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-tw-muted pointer-events-none absolute right-2.5" />
                </div>

                {/* Single Clean Calendar Icon Trigger */}
                <button
                  type="button"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  title="Select Custom Date Range"
                  className={`p-1.5 rounded-full border transition-all ${
                    selectedDateRange === "custom" || showDatePicker
                      ? "bg-tw-teal/20 border-tw-teal text-tw-teal shadow-sm"
                      : "bg-[#141714] border-white/15 text-tw-muted hover:text-tw-text hover:border-white/30"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                </button>

                {/* Clean Date Range Popover */}
                {showDatePicker && (
                  <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 z-[9999] w-64 bg-[#181b17] border border-white/20 rounded-2xl p-3.5 shadow-2xl space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="font-semibold text-xs text-tw-text flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-tw-teal" />
                        Select Dates
                      </span>
                      <button
                        onClick={() => setShowDatePicker(false)}
                        className="text-tw-muted hover:text-tw-text p-1 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="text-[10px] font-medium text-tw-muted block mb-1">
                          From Date
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full bg-[#141714] border border-white/15 rounded-xl px-3 py-1.5 text-tw-text focus:outline-none focus:border-tw-teal"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-tw-muted block mb-1">
                          To Date
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full bg-[#141714] border border-white/15 rounded-xl px-3 py-1.5 text-tw-text focus:outline-none focus:border-tw-teal"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setShowDatePicker(false)}
                        className="px-3 py-1 text-xs text-tw-muted hover:text-tw-text font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDateRange("custom");
                          setShowDatePicker(false);
                        }}
                        className="px-3.5 py-1 bg-tw-teal hover:bg-tw-teal/80 text-white rounded-full text-xs font-semibold shadow transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Severity Filter */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-tw-muted font-medium shrink-0">Severity:</span>
                <div className="relative inline-flex items-center">
                  <select
                    value={selectedSeverity}
                    onChange={(e) => setSelectedSeverity(e.target.value)}
                    className="appearance-none bg-[#141714] border border-white/15 text-tw-text rounded-full pl-3.5 pr-8 py-1.5 text-xs focus:outline-none focus:border-tw-teal cursor-pointer"
                  >
                    <option value="all">All</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-tw-muted pointer-events-none absolute right-2.5" />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-tw-muted font-medium shrink-0">Status:</span>
                <div className="relative inline-flex items-center">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="appearance-none bg-[#141714] border border-white/15 text-tw-text rounded-full pl-3.5 pr-8 py-1.5 text-xs focus:outline-none focus:border-tw-teal cursor-pointer"
                  >
                    <option value="all">All</option>
                    <option value="open">Open</option>
                    <option value="monitoring">Monitoring</option>
                    <option value="investigating">Investigating</option>
                    <option value="closed">Closed</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-tw-muted pointer-events-none absolute right-2.5" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Incident Table ─────────────────────────────────────────── */}
          <div className="bg-[#181b17]/90 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#141714]/80 text-tw-muted border-b border-white/10 font-semibold tracking-wide uppercase text-[10px]">
                    <th className="p-4">Overpass (IST)</th>
                    <th className="p-4">Facility / Sector</th>
                    <th className="p-4">Classification</th>
                    <th className="p-4">Radiance (FRP)</th>
                    <th className="p-4">Z-Score Surge</th>
                    <th className="p-4">Severity</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-tw-muted">
                        <div className="flex items-center justify-center gap-2 font-mono">
                          <Radio className="w-4 h-4 text-tw-teal animate-pulse" />
                          <span>Syncing live NASA FIRMS detections & AI algorithms...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedIncidents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-tw-muted">
                        No thermal incidents found matching your current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedIncidents.map((incident) => (
                      <tr
                        key={incident.id}
                        className="hover:bg-white/[0.03] transition-colors"
                      >
                        <td className="p-4 font-mono text-tw-muted">
                          {formatTimestamp(incident.timestamp)}
                        </td>
                        <td className="p-4 font-medium text-tw-text">
                          <div className="max-w-[220px] truncate" title={incident.facilityName}>
                            {incident.facilityName}
                          </div>
                          <div className="text-[10px] text-tw-dim font-mono">
                            {incident.location}
                          </div>
                        </td>
                        <td className="p-4">
                          <ClassificationBadge classification={incident.classification} />
                        </td>
                        <td className="p-4 font-mono font-bold text-tw-text">
                          {incident.radiance} <span className="text-[10px] font-normal text-tw-muted">MW</span>
                        </td>
                        <td className="p-4 font-mono">
                          {incident.deviationScore !== undefined ? (
                            <span className={incident.deviationScore > 2.0 ? "text-red-400 font-bold" : "text-sky-400 font-semibold"}>
                              {incident.deviationScore > 0 ? `+${incident.deviationScore.toFixed(1)}` : incident.deviationScore.toFixed(1)}σ
                            </span>
                          ) : (
                            <span className="text-tw-dim">—</span>
                          )}
                        </td>
                        <td className="p-4">
                          <SeverityBadge severity={incident.severity} />
                        </td>
                        <td className="p-4">
                          <StatusBadge status={incident.status} />
                        </td>
                        <td className="p-4 text-right">
                          <Link
                            href={`/site/${incident.facilityId || "fac_001"}?anomalyId=${incident.id}`}
                            className="inline-flex items-center gap-1 px-3.5 py-1 bg-white/5 hover:bg-white/10 border border-white/15 text-tw-text rounded-full text-xs font-medium transition-colors"
                          >
                            Inspect
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="p-4 border-t border-tw-border flex items-center justify-between text-xs text-tw-muted">
              <span>
                Showing {filteredIncidents.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredIncidents.length)} of {filteredIncidents.length} live incidents
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded bg-tw-navy border border-tw-border text-tw-muted hover:text-tw-text disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                  const pageNum = idx + 1;
                  const isCurrent = currentPage === pageNum;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-2.5 py-1 rounded transition-colors ${
                        isCurrent
                          ? "bg-tw-teal text-white font-bold"
                          : "bg-tw-navy border border-tw-border hover:bg-tw-raised text-tw-muted"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {totalPages > 5 && (
                  <>
                    <span className="text-tw-dim px-1">...</span>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className={`px-2.5 py-1 rounded transition-colors ${
                        currentPage === totalPages
                          ? "bg-tw-teal text-white font-bold"
                          : "bg-tw-navy border border-tw-border hover:bg-tw-raised text-tw-muted"
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded bg-tw-navy border border-tw-border text-tw-muted hover:text-tw-text disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
