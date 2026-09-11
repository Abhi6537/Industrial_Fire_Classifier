"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { fetchSites, fetchEvents, IndustrialSite, ClassifiedEvent } from "@/lib/api";
import { MOCK_FACILITIES } from "@/lib/mockData";
import {
  Building2,
  Search,
  MapPin,
  Flame,
  Activity,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Layers,
  Radio,
  SlidersHorizontal,
} from "lucide-react";

export default function SitesDirectoryPage() {
  const [sites, setSites] = useState<IndustrialSite[]>([]);
  const [events, setEvents] = useState<ClassifiedEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedState, setSelectedState] = useState<string>("all");

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [sitesData, eventsData] = await Promise.all([
          fetchSites(),
          fetchEvents(),
        ]);
        if (sitesData && sitesData.length > 0) setSites(sitesData);
        if (eventsData && eventsData.length > 0) setEvents(eventsData);
      } catch (err) {
        console.error("Failed loading sites directory data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Built-in industrial facilities list combining OSM registered complexes & mock profiles
  const facilitiesList = useMemo(() => {
    const list = [
      {
        id: "fac_001",
        name: "Dahej Petroleum & Chemical Complex (PCPIR)",
        type: "Chemical & Petrochemical",
        state: "Gujarat",
        region: "Bharuch District",
        operator: "Yashashvi Agro / GIDC Dahej",
        lat: 21.7124,
        lng: 72.5831,
        activeStatus: "Incident Monitored",
        statusColor: "text-red-400 bg-red-500/10 border-red-500/30",
        baselineFRP: 15.0,
        polygonAreaKm2: 45.2,
      },
      {
        id: "fac_002",
        name: "Reliance Jamnagar Refinery Complex",
        type: "Petroleum Refinery",
        state: "Gujarat",
        region: "Jamnagar District",
        operator: "Reliance Industries Limited",
        lat: 22.3550,
        lng: 69.8650,
        activeStatus: "Operational Flare",
        statusColor: "text-sky-400 bg-sky-500/10 border-sky-500/30",
        baselineFRP: 41.5,
        polygonAreaKm2: 72.0,
      },
      {
        id: "fac_003",
        name: "Hazira Petrochemical & Steel Manufacturing Hub",
        type: "Steel & LNG Terminal",
        state: "Gujarat",
        region: "Surat Belt",
        operator: "ArcelorMittal / Shell LNG",
        lat: 21.1040,
        lng: 72.6450,
        activeStatus: "Persistent Routine",
        statusColor: "text-purple-400 bg-purple-500/10 border-purple-500/30",
        baselineFRP: 28.0,
        polygonAreaKm2: 38.6,
      },
      {
        id: "fac_004",
        name: "IOCL Panipat Refinery & Petrochemical Complex",
        type: "Petroleum Refinery",
        state: "Haryana",
        region: "Panipat Industrial Area",
        operator: "Indian Oil Corporation Ltd",
        lat: 29.3909,
        lng: 76.9635,
        activeStatus: "Active Monitoring",
        statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        baselineFRP: 35.0,
        polygonAreaKm2: 24.5,
      },
      {
        id: "fac_005",
        name: "Visakhapatnam Steel Plant (RINL)",
        type: "Integrated Steel Complex",
        state: "Andhra Pradesh",
        region: "Visakhapatnam Corridor",
        operator: "Rashtriya Ispat Nigam Ltd",
        lat: 17.6322,
        lng: 83.1654,
        activeStatus: "Active Monitoring",
        statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        baselineFRP: 52.0,
        polygonAreaKm2: 64.0,
      },
      {
        id: "fac_006",
        name: "Paradip Refinery & Chemical Zone",
        type: "Petroleum & Fertilizer",
        state: "Odisha",
        region: "Jagatsinghpur Coast",
        operator: "Indian Oil / IFFCO",
        lat: 20.2844,
        lng: 86.6660,
        activeStatus: "Active Monitoring",
        statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        baselineFRP: 32.0,
        polygonAreaKm2: 33.0,
      },
    ];

    // Augment with real detection signals if an event is inside or close to site
    return list.map((fac) => {
      const relatedEvt = events.find(
        (e) =>
          e.site_name?.toLowerCase().includes(fac.name.split(" ")[0].toLowerCase()) ||
          (Math.abs(e.latitude - fac.lat) < 0.1 && Math.abs(e.longitude - fac.lng) < 0.1)
      );

      return {
        ...fac,
        liveDetection: relatedEvt || null,
        activeAlertCount: relatedEvt && relatedEvt.label === "industrial_fire" ? 1 : 0,
      };
    });
  }, [events]);

  // Filtering
  const filteredFacilities = useMemo(() => {
    return facilitiesList.filter((f) => {
      if (
        searchTerm &&
        !f.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !f.region.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !f.operator.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      if (selectedType !== "all" && !f.type.toLowerCase().includes(selectedType.toLowerCase())) {
        return false;
      }
      if (selectedState !== "all" && f.state.toLowerCase() !== selectedState.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [facilitiesList, searchTerm, selectedType, selectedState]);

  return (
    <div className="flex min-h-screen bg-tw-navy text-tw-text font-sans antialiased">
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="p-6 pb-28 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Header Title + Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-tw-teal/10 border border-tw-teal/30 text-tw-teal">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-tw-text tracking-tight">
                    Industrial Facilities & Installations Directory
                  </h1>
                  <p className="text-xs text-tw-muted mt-0.5">
                    Catalog of registered sovereign industrial complexes, chemical PCPIR corridors, and refineries monitored by satellite AI.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3.5 py-1.5 rounded-full bg-[#181b17]/90 border border-white/15 text-xs text-tw-muted">
                Monitored Sites: <span className="font-bold font-mono text-white">{facilitiesList.length}</span>
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-[#181b17]/90 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row gap-3.5 items-center justify-between shadow-lg">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-tw-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search plant name, operator, region..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#141714] border border-white/15 rounded-full pl-9 pr-4 py-2 text-xs text-tw-text placeholder-tw-muted focus:outline-none focus:border-tw-teal"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-[#141714] border border-white/15 text-tw-text rounded-full px-4 py-2 text-xs focus:outline-none focus:border-tw-teal cursor-pointer"
              >
                <option value="all">All Facility Types</option>
                <option value="chemical">Chemical & PCPIR</option>
                <option value="refinery">Petroleum Refineries</option>
                <option value="steel">Steel & Heavy Manufacturing</option>
              </select>

              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="bg-[#141714] border border-white/15 text-tw-text rounded-full px-4 py-2 text-xs focus:outline-none focus:border-tw-teal cursor-pointer"
              >
                <option value="all">All States</option>
                <option value="gujarat">Gujarat</option>
                <option value="haryana">Haryana</option>
                <option value="andhra pradesh">Andhra Pradesh</option>
                <option value="odisha">Odisha</option>
              </select>
            </div>
          </div>

          {/* Facilities Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredFacilities.map((fac) => {
              const live = fac.liveDetection;
              return (
                <div
                  key={fac.id}
                  className="bg-[#181b17]/90 border border-white/10 hover:border-white/25 rounded-2xl p-5 shadow-xl transition-all duration-200 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Top row: Status Badge & Area */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase border ${fac.statusColor}`}
                      >
                        {fac.activeStatus}
                      </span>
                      <span className="text-[11px] font-mono text-tw-dim">
                        {fac.polygonAreaKm2} km² footprint
                      </span>
                    </div>

                    {/* Plant Name & Type */}
                    <div>
                      <h3 className="text-base font-bold text-tw-text group-hover:text-tw-teal transition-colors line-clamp-1">
                        {fac.name}
                      </h3>
                      <p className="text-xs text-tw-muted font-medium mt-0.5">{fac.type}</p>
                    </div>

                    {/* Proximity & Location */}
                    <div className="flex items-center gap-1.5 text-xs text-tw-muted">
                      <MapPin className="w-3.5 h-3.5 text-tw-dim shrink-0" />
                      <span className="truncate">
                        {fac.region}, {fac.state}
                      </span>
                    </div>

                    {/* Telemetry Snapshot Metrics */}
                    <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-white/10 text-xs">
                      <div className="bg-[#141714] p-2.5 rounded-xl border border-white/5">
                        <span className="text-[10px] text-tw-muted uppercase font-medium block">
                          Baseline FRP
                        </span>
                        <span className="text-sm font-bold font-mono text-white mt-0.5 block">
                          {fac.baselineFRP} MW
                        </span>
                      </div>

                      <div className="bg-[#141714] p-2.5 rounded-xl border border-white/5">
                        <span className="text-[10px] text-tw-muted uppercase font-medium block">
                          Operator
                        </span>
                        <span className="text-[11px] font-semibold text-tw-text truncate mt-0.5 block" title={fac.operator}>
                          {fac.operator.split("/")[0]}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action: Link to Facility Dossier */}
                  <div className="pt-5 mt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[11px] text-tw-dim font-mono">
                      {fac.lat.toFixed(2)}°N, {fac.lng.toFixed(2)}°E
                    </span>
                    <Link
                      href={`/site/${fac.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/5 hover:bg-tw-teal hover:text-white border border-white/15 text-xs font-semibold text-tw-text transition-all duration-150"
                    >
                      <span>Open Dossier</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
