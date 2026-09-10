"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  MOCK_DETECTIONS,
  ThermalDetection,
  ClassificationLabel,
  formatTimestamp,
} from "@/lib/mockData";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ClassificationBadge } from "@/components/ui/ClassificationBadge";
import { ThermalMap } from "@/components/map/ThermalMap";
import { ArrowRight, RotateCcw, Filter, Activity, Flame, Wind, Layers } from "lucide-react";

export default function DashboardPage() {
  // Filter state
  const [selectedTypes, setSelectedTypes] = useState<ClassificationLabel[]>([]);
  const [minConfidence, setMinConfidence] = useState<number>(0);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");

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

  // Filtered detections
  const filteredDetections = useMemo(() => {
    return MOCK_DETECTIONS.filter((d) => {
      if (selectedTypes.length > 0 && !selectedTypes.includes(d.classification)) {
        return false;
      }
      if (d.confidence < minConfidence) {
        return false;
      }
      return true;
    });
  }, [selectedTypes, minConfidence]);

  return (
    <div className="flex min-h-screen bg-tw-navy text-tw-text">
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Header */}
        <Header />

        {/* Dashboard Content */}
        <main className="p-6 space-y-6 overflow-y-auto">
          {/* ── KPI Row ────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1 */}
            <div className="bg-tw-surface border border-tw-border rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-tw-muted mb-2">
                <span className="text-xs font-semibold">Thermal Anomalies</span>
                <Activity className="w-4 h-4 text-tw-teal" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-tw-text">128</span>
                <span className="text-xs font-bold text-tw-teal bg-tw-teal/10 px-2 py-0.5 rounded border border-tw-teal/20">
                  +12%
                </span>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-tw-surface border border-tw-border rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-tw-muted mb-2">
                <span className="text-xs font-semibold">Industrial Fires</span>
                <Flame className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-tw-text">27</span>
                <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                  -3
                </span>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-tw-surface border border-tw-border rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-tw-muted mb-2">
                <span className="text-xs font-semibold">Persistent Sources</span>
                <Layers className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-tw-text">41</span>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  +6
                </span>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-tw-surface border border-tw-border rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-tw-muted mb-2">
                <span className="text-xs font-semibold">Gas Flares</span>
                <Wind className="w-4 h-4 text-orange-500" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-tw-text">18</span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  +2
                </span>
              </div>
            </div>
          </div>

          {/* ── Main Map & Filter Panel Layout ────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* Main Map (3 cols on desktop) */}
            <div className="lg:col-span-3 bg-tw-surface border border-tw-border rounded-xl overflow-hidden p-1 shadow-lg">
              <ThermalMap
                detections={filteredDetections}
                height={520}
                center={[20.5, 78.9]}
                zoom={5}
              />
            </div>

            {/* Filter Panel (1 col on desktop) */}
            <div className="bg-tw-surface border border-tw-border rounded-xl p-5 space-y-5">
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
                    { key: "gas_flare", label: "Gas Flare", color: "#d97706" },
                    { key: "persistent_source", label: "Persistent Source", color: "#ca8a04" },
                    { key: "agricultural_burn", label: "Agricultural Burning", color: "#65a30d" },
                    { key: "natural_fire", label: "Natural / Forest Fire", color: "#16a34a" },
                    { key: "unknown_anomaly", label: "Unknown", color: "#4b5563" },
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
                  <option value="all">All India</option>
                  <option value="west">Western Industrial Belt</option>
                  <option value="east">Eastern Mining Belt</option>
                  <option value="north">Northern Region</option>
                  <option value="south">Southern Coastal</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Recent Detections Table ────────────────────────────────────── */}
          <div className="bg-tw-surface border border-tw-border rounded-xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-tw-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-tw-text">
                  Recent Detections
                </h3>
                <p className="text-xs text-tw-muted">
                  Showing {filteredDetections.length} matching thermal anomalies
                </p>
              </div>
              <Link
                href="/alerts"
                className="flex items-center gap-1 text-xs text-tw-teal hover:text-tw-teal-hi font-semibold transition-colors"
              >
                View All
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-tw-navy/50 text-tw-muted border-b border-tw-border font-medium">
                    <th className="p-3.5">Time (IST)</th>
                    <th className="p-3.5">Location</th>
                    <th className="p-3.5">Type</th>
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
                          href={`/site/${det.facilityId || "fac_001"}`}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-tw-teal/10 hover:bg-tw-teal/20 border border-tw-teal/30 text-tw-teal rounded text-xs font-semibold transition-colors"
                        >
                          View
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
    </div>
  );
}
