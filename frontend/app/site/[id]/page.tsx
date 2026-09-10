"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  MOCK_FACILITIES,
  DEFAULT_FACILITY,
  CLASSIFICATION_META,
} from "@/lib/mockData";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ClassificationBadge } from "@/components/ui/ClassificationBadge";
import { ThermalMap } from "@/components/map/ThermalMap";
import { ThermalChart } from "@/components/site/ThermalChart";
import { ArrowLeft, ExternalLink, Activity, AlertTriangle } from "lucide-react";

export default function SiteDetailPage() {
  const params = useParams();
  const facilityId = (params?.id as string) || "fac_001";
  const facility = MOCK_FACILITIES[facilityId] || DEFAULT_FACILITY;

  const [activeTab, setActiveTab] = useState<
    "overview" | "thermal" | "satellite" | "osm" | "history"
  >("overview");

  return (
    <div className="flex min-h-screen bg-tw-navy text-tw-text">
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Header */}
        <Header />

        <main className="p-6 space-y-6 overflow-y-auto">
          {/* Header & Back link */}
          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-tw-muted hover:text-tw-text transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Dashboard
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-tw-surface border border-tw-border rounded-xl p-5 shadow-lg">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl font-bold text-tw-text tracking-tight">
                    {facility.name}
                  </h1>
                  <StatusBadge status={facility.status} />
                </div>
                <p className="text-xs text-tw-muted font-mono">
                  {facility.address} · {facility.lat.toFixed(3)}° N, {facility.lng.toFixed(3)}° E
                </p>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 bg-tw-navy p-1 rounded-lg border border-tw-border">
                {(
                  [
                    ["Overview", "overview"],
                    ["Thermal Activity", "thermal"],
                    ["Satellite Imagery", "satellite"],
                    ["OSM Data", "osm"],
                    ["History", "history"],
                  ] as const
                ).map(([label, key]) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as any)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      activeTab === key
                        ? "bg-tw-teal text-white shadow"
                        : "text-tw-muted hover:text-tw-text"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Top Section Grid: Map + Facility Info + Latest Detection */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Zoomed Map (1 col) */}
            <div className="bg-tw-surface border border-tw-border rounded-xl overflow-hidden p-1 shadow-lg h-72">
              <ThermalMap
                detections={[
                  {
                    id: "det_site",
                    lat: facility.lat,
                    lng: facility.lng,
                    classification: facility.latestDetection.classification,
                    confidence: facility.latestDetection.confidence,
                    radiance: facility.latestDetection.radiance,
                    severity: "high",
                    status: "open",
                    location: facility.address,
                    facilityName: facility.name,
                    facilityId: facility.id,
                    timestamp: "2024-10-07T14:32:00Z",
                  },
                ]}
                height={280}
                center={[facility.lat, facility.lng]}
                zoom={12}
              />
            </div>

            {/* Facility Information Card (1 col) */}
            <div className="bg-tw-surface border border-tw-border rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-tw-muted mb-4 pb-2 border-b border-tw-border">
                  Facility Information
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-tw-muted">Name</span>
                    <span className="text-tw-text font-medium text-right">{facility.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-tw-muted">Type</span>
                    <span className="text-tw-text font-medium">{facility.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-tw-muted">OSM ID</span>
                    <span className="text-tw-text font-mono">{facility.osmId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-tw-muted">Operator</span>
                    <span className="text-tw-text font-medium">{facility.operator}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-tw-muted">Land Use</span>
                    <span className="text-tw-text font-medium">{facility.landUse}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-tw-muted">Nearby Risk</span>
                    <span className="text-tw-text font-medium">{facility.nearby}</span>
                  </div>
                </div>
              </div>

              <a
                href={`https://www.openstreetmap.org/search?query=${facility.lat},${facility.lng}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex items-center justify-center gap-1.5 w-full py-2 bg-tw-navy hover:bg-tw-raised border border-tw-border text-tw-teal text-xs font-semibold rounded-lg transition-colors"
              >
                View on OpenStreetMap
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Latest Detection Card (1 col) */}
            <div className="bg-tw-surface border border-tw-border rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-tw-border mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-tw-muted">
                    Latest Detection
                  </h3>
                  <span className="flex items-center gap-1 text-[10px] text-red-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    ALERT
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-tw-muted text-[10px] mb-0.5">Detected Timestamp</p>
                    <p className="text-tw-text text-sm font-semibold font-mono">
                      {facility.latestDetection.timestamp}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-tw-muted text-xs">Confidence Score</span>
                    <span className="text-tw-teal font-bold font-mono text-sm">
                      {facility.latestDetection.confidence}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-tw-muted text-xs font-medium">Likely Classification</span>
                    <ClassificationBadge
                      classification={facility.latestDetection.classification}
                    />
                  </div>

                  <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-lg flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-xs leading-relaxed">
                      Thermal radiance peak reached <strong>{facility.latestDetection.radiance} MW</strong> (+271% above site baseline).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Thermal Activity (Last 30 Days) Chart Section */}
          <div className="bg-tw-surface border border-tw-border rounded-xl p-6 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-tw-border">
              <div>
                <h3 className="text-sm font-bold text-tw-text flex items-center gap-2">
                  <Activity className="w-4 h-4 text-tw-teal" />
                  Thermal Activity — Last 30 Days
                </h3>
                <p className="text-xs text-tw-muted">
                  Historical thermal radiance vs calculated facility baseline
                </p>
              </div>

              {/* Legend & Spike Callout */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-red-500" />
                  <span className="text-tw-muted">Thermal Radiance (MW)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-sky-500 border-dashed" />
                  <span className="text-tw-muted">Baseline</span>
                </div>
                <div className="px-2.5 py-1 bg-red-500/10 border border-red-500/30 text-red-400 font-bold rounded font-mono">
                  Peak: 156 MW (+271%)
                </div>
              </div>
            </div>

            {/* SVG Chart */}
            <ThermalChart data={facility.thermalHistory} />
          </div>

          {/* Recent Classifications Table */}
          <div className="bg-tw-surface border border-tw-border rounded-xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-tw-border">
              <h3 className="text-sm font-bold text-tw-text">
                Recent Classifications
              </h3>
              <p className="text-xs text-tw-muted">
                Historical AI classification log for this facility
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-tw-navy/50 text-tw-muted border-b border-tw-border font-medium">
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Confidence</th>
                    <th className="p-3.5">Radiance (MW)</th>
                    <th className="p-3.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tw-border">
                  {facility.recentClassifications.map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-tw-raised/40 transition-colors"
                    >
                      <td className="p-3.5 font-mono text-tw-muted">
                        {row.date}
                      </td>
                      <td className="p-3.5">
                        <ClassificationBadge classification={row.type} />
                      </td>
                      <td className="p-3.5 font-mono font-semibold text-tw-text">
                        {row.confidence}%
                      </td>
                      <td className="p-3.5 font-mono text-tw-text">
                        {row.radiance} MW
                      </td>
                      <td className="p-3.5 text-tw-muted">{row.notes}</td>
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
