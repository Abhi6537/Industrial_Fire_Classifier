"use client";

import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ThermalChart } from "@/components/site/ThermalChart";
import { BarChart3, TrendingUp, Cpu, Activity } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="flex min-h-screen bg-tw-navy text-tw-text font-sans antialiased">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="p-6 pb-24 space-y-6 overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-tw-text tracking-tight flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-tw-teal" />
                Satellite Radiance & Baseline Analytics
              </h1>
              <p className="text-xs text-tw-muted mt-1">
                Statistical Z-Score deviation models, FRP baseline profiles, and historical satellite overpass telemetry.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-tw-surface border border-tw-border rounded-xl p-5 shadow-lg">
              <div className="flex justify-between items-start">
                <span className="text-tw-muted text-xs font-semibold">Mean Baseline FRP</span>
                <Activity className="w-4 h-4 text-tw-teal" />
              </div>
              <p className="text-2xl font-mono font-bold text-tw-text mt-3">41.8 MW</p>
              <p className="text-[11px] text-tw-muted mt-1">Refinery & Industrial Multi-pass Average</p>
            </div>

            <div className="bg-tw-surface border border-tw-border rounded-xl p-5 shadow-lg">
              <div className="flex justify-between items-start">
                <span className="text-tw-muted text-xs font-semibold">Max Deviation Z-Score</span>
                <TrendingUp className="w-4 h-4 text-red-400" />
              </div>
              <p className="text-2xl font-mono font-bold text-red-400 mt-3">+5.8σ</p>
              <p className="text-[11px] text-tw-muted mt-1">Dahej Emergency Surge Threshold</p>
            </div>

            <div className="bg-tw-surface border border-tw-border rounded-xl p-5 shadow-lg">
              <div className="flex justify-between items-start">
                <span className="text-tw-muted text-xs font-semibold">Classification Precision</span>
                <Cpu className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-mono font-bold text-emerald-400 mt-3">100.0%</p>
              <p className="text-[11px] text-tw-muted mt-1">Zero False Alarms on Routine Flares</p>
            </div>
          </div>

          <div className="bg-tw-surface border border-tw-border rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-tw-text">
              Historical Radiance vs Baseline Model Curve
            </h3>
            <div className="h-80">
              <ThermalChart />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
