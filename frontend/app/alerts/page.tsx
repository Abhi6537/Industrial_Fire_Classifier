"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  MOCK_DETECTIONS,
  ThermalDetection,
  SeverityLevel,
  IncidentStatus,
  ClassificationLabel,
  formatTimestamp,
} from "@/lib/mockData";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ClassificationBadge } from "@/components/ui/ClassificationBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { Download, Search, ChevronLeft, ChevronRight } from "lucide-react";

export default function AlertsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Filtering logic
  const filteredIncidents = useMemo(() => {
    return MOCK_DETECTIONS.filter((item) => {
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
      return true;
    });
  }, [searchTerm, selectedSeverity, selectedStatus, selectedCategory]);

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

            <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#181b17]/90 border border-white/15 hover:bg-[#222620] text-tw-muted hover:text-tw-text rounded-full text-xs font-semibold transition-colors self-start sm:self-auto">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>

          {/* ── Summary Cards Row (5 mini cards) ────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { id: "all", label: "All", count: 128, color: "#64b5f6" },
              { id: "industrial", label: "Industrial", count: 27, color: "#e57373" },
              { id: "gas_flare", label: "Gas Flare", count: 18, color: "#64b5f6" },
              { id: "persistent", label: "Persistent", count: 41, color: "#b39ddb" },
              { id: "others", label: "Others", count: 42, color: "#90a4ae" },
            ].map((card) => {
              const isSelected = selectedCategory === card.id;
              return (
                <button
                  key={card.id}
                  onClick={() => setSelectedCategory(card.id)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? "bg-[#1f231d] border-tw-teal/60 shadow-lg"
                      : "bg-[#181b17]/90 border-white/10 hover:border-white/20"
                  }`}
                >
                  <p className="text-[11px] font-medium text-tw-muted mb-1 tracking-wide">
                    {card.label}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold font-mono text-tw-text">
                      {card.count}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Filter Bar ──────────────────────────────────────────────── */}
          <div className="bg-[#181b17]/90 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
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
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-tw-muted font-medium">Date Range:</span>
                <select className="bg-[#141714] border border-white/15 text-tw-text rounded-full px-3 py-1.5 text-xs focus:outline-none focus:border-tw-teal">
                  <option value="oct">Oct 1, 2024 - Oct 7, 2024</option>
                  <option value="sep">Sep 2024</option>
                  <option value="all">All Time</option>
                </select>
              </div>

              {/* Severity Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-tw-muted font-medium">Severity:</span>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="bg-[#141714] border border-white/15 text-tw-text rounded-full px-3 py-1.5 text-xs focus:outline-none focus:border-tw-teal"
                >
                  <option value="all">All</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-tw-muted font-medium">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-[#141714] border border-white/15 text-tw-text rounded-full px-3 py-1.5 text-xs focus:outline-none focus:border-tw-teal"
                >
                  <option value="all">All</option>
                  <option value="open">Open</option>
                  <option value="monitoring">Monitoring</option>
                  <option value="investigating">Investigating</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Incident Table ─────────────────────────────────────────── */}
          <div className="bg-[#181b17]/90 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#141714]/80 text-tw-muted border-b border-white/10 font-semibold tracking-wide uppercase text-[10px]">
                    <th className="p-4">Date & Time (IST)</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Severity</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredIncidents.map((incident) => (
                    <tr
                      key={incident.id}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="p-4 font-mono text-tw-muted">
                        {formatTimestamp(incident.timestamp)}
                      </td>
                      <td className="p-4 font-medium text-tw-text">
                        {incident.location}
                      </td>
                      <td className="p-4">
                        <ClassificationBadge classification={incident.classification} />
                      </td>
                      <td className="p-4">
                        <SeverityBadge severity={incident.severity} />
                      </td>
                      <td className="p-4">
                        <StatusBadge status={incident.status} />
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          href={`/site/${incident.facilityId || "fac_001"}`}
                          className="inline-flex items-center gap-1 px-3.5 py-1 bg-white/5 hover:bg-white/10 border border-white/15 text-tw-text rounded-full text-xs font-medium transition-colors"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="p-4 border-t border-tw-border flex items-center justify-between text-xs text-tw-muted">
              <span>Showing {filteredIncidents.length} of 128 incidents</span>
              <div className="flex items-center gap-1.5">
                <button className="p-1.5 rounded bg-tw-navy border border-tw-border text-tw-muted hover:text-tw-text disabled:opacity-50">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button className="px-2.5 py-1 rounded bg-tw-teal text-white font-bold">1</button>
                <button className="px-2.5 py-1 rounded bg-tw-navy border border-tw-border hover:bg-tw-raised">2</button>
                <button className="px-2.5 py-1 rounded bg-tw-navy border border-tw-border hover:bg-tw-raised">3</button>
                <button className="px-2.5 py-1 rounded bg-tw-navy border border-tw-border hover:bg-tw-raised">4</button>
                <button className="px-2.5 py-1 rounded bg-tw-navy border border-tw-border hover:bg-tw-raised">5</button>
                <span>...</span>
                <button className="px-2.5 py-1 rounded bg-tw-navy border border-tw-border hover:bg-tw-raised">13</button>
                <button className="p-1.5 rounded bg-tw-navy border border-tw-border text-tw-muted hover:text-tw-text">
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
