"use client";

import React, { useEffect, useState } from "react";
import { FireMap } from "@/components/map/FireMap";
import { AlertFeed } from "@/components/alerts/AlertFeed";
import {
  fetchEvents,
  fetchSites,
  fetchAlerts,
  ClassifiedEvent,
  IndustrialSite,
  Alert,
} from "@/lib/api";
import { Flame, ShieldAlert, AlertTriangle, Building2, Radio } from "lucide-react";

export default function DashboardPage() {
  const [events, setEvents] = useState<ClassifiedEvent[]>([]);
  const [sites, setSites] = useState<IndustrialSite[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [eventsData, sitesData, alertsData] = await Promise.all([
        fetchEvents(),
        fetchSites(),
        fetchAlerts(),
      ]);
      setEvents(eventsData);
      setSites(sitesData);
      setAlerts(alertsData);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleSelectAlert = (alert: Alert) => {
    setSelectedAlert(alert);
    setSelectedEventId(alert.event_id);
  };

  const criticalFires = events.filter((e) => e.label === "industrial_fire").length;
  const normalFlares = events.filter((e) => e.label === "normal_flare").length;
  const unregistered = events.filter((e) => e.label === "unregistered_anomaly").length;

  return (
    <div className="flex-1 flex flex-col p-5 gap-4 overflow-hidden max-w-[1920px] mx-auto w-full bg-slate-50">
      {/* Tactical Telemetry Metrics Header (Light SaaS Modern Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 select-none">
        {/* Metric 1: Sector Hotspots */}
        <div className="bg-white border border-slate-200 border-l-4 border-l-blue-600 p-3.5 rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-mono tracking-wider font-semibold">Sector Hotspots</div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5 tracking-tight">{events.length}</div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">VIIRS NRT All-India</div>
          </div>
          <div className="p-2.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg">
            <Radio className="w-4 h-4" />
          </div>
        </div>

        {/* Metric 2: Operational Flares */}
        <div className="bg-white border border-slate-200 border-l-4 border-l-slate-400 p-3.5 rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-mono tracking-wider font-semibold">Routine Flares</div>
            <div className="text-2xl font-extrabold text-slate-700 font-mono mt-0.5 tracking-tight">{normalFlares}</div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">Suppressed Noise</div>
          </div>
          <div className="p-2.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-lg">
            <Flame className="w-4 h-4" />
          </div>
        </div>

        {/* Metric 3: Critical Emergencies */}
        <div className="bg-white border border-slate-200 border-l-4 border-l-red-600 p-3.5 rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-mono tracking-wider font-semibold">Critical Fires</div>
            <div className="text-2xl font-extrabold text-red-600 font-mono mt-0.5 tracking-tight">{criticalFires}</div>
            <div className="text-[11px] text-red-600 font-mono mt-0.5 font-medium">Z-Score &gt; 3.0σ Spikes</div>
          </div>
          <div className="p-2.5 bg-red-50 border border-red-100 text-red-600 rounded-lg">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>

        {/* Metric 4: Unregistered Anomalies */}
        <div className="bg-white border border-slate-200 border-l-4 border-l-amber-500 p-3.5 rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-mono tracking-wider font-semibold">Unregistered Anomaly</div>
            <div className="text-2xl font-extrabold text-amber-600 font-mono mt-0.5 tracking-tight">{unregistered}</div>
            <div className="text-[11px] text-amber-700 font-mono mt-0.5 font-medium">Unmapped Built-Up</div>
          </div>
          <div className="p-2.5 bg-amber-50 border border-amber-100 text-amber-600 rounded-lg">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        {/* Metric 5: Mapped Sites */}
        <div className="bg-white border border-slate-200 border-l-4 border-l-sky-500 p-3.5 rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-mono tracking-wider font-semibold">OSM Site Polygons</div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5 tracking-tight">5,550+</div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">Active GiST Spatial Index</div>
          </div>
          <div className="p-2.5 bg-sky-50 border border-sky-100 text-sky-600 rounded-lg">
            <Building2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Operations Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[620px] overflow-hidden">
        {/* Left: Interactive GIS Map */}
        <div className="lg:col-span-8 xl:col-span-9 h-full">
          <FireMap
            events={events}
            sites={sites}
            selectedEventId={selectedEventId}
            onSelectEvent={(evt) => setSelectedEventId(evt.id)}
          />
        </div>

        {/* Right: Operational Alert Queue */}
        <div className="lg:col-span-4 xl:col-span-3 h-full overflow-hidden">
          <AlertFeed
            alerts={alerts}
            selectedAlertId={selectedAlert?.id}
            onSelectAlert={handleSelectAlert}
            onRefresh={async () => {
              const updated = await fetchAlerts();
              setAlerts(updated);
            }}
          />
        </div>
      </div>
    </div>
  );
}
