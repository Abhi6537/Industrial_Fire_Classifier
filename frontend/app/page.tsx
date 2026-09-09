"use client";

import React from "react";
import Link from "next/link";
import {
  Shield,
  Compass,
  Zap,
  Layers,
  Database,
  CheckCircle2,
  ArrowRight,
  Flame,
  AlertTriangle,
  Building2,
  Cpu,
  BarChart3,
  Satellite,
  History,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* 1. HERO SECTION */}
      <section className="relative pt-16 pb-20 px-6 lg:px-12 overflow-hidden border-b border-slate-200 bg-gradient-to-b from-white via-slate-50 to-slate-100/60">
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>Smart India Hackathon 2026 · National Technical Research Organisation</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.15] max-w-4xl">
            Satellite Thermal Intelligence for{" "}
            <span className="text-blue-600">Critical Infrastructure</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
            Eliminating false alarms across India&apos;s industrial corridors by fusing NASA VIIRS thermal satellite
            hotspots, ESA WorldCover 10-meter radar, and per-site historical Z-score baselines.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>Launch Tactical Console</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/dashboard/alerts"
              className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl font-semibold text-sm shadow-sm hover:shadow transition flex items-center gap-2"
            >
              <History className="w-4 h-4 text-slate-500" />
              <span>Explore Incident Queue</span>
            </Link>
          </div>

          {/* Hero Live Telemetry Pill Bar */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl text-left">
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Active Detections</span>
                <Satellite className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">99 Hotspots</div>
              <div className="text-[11px] text-slate-500 mt-0.5">VIIRS All-India Coverage</div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Infrastructure Sites</span>
                <Building2 className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">5,550+ Polygons</div>
              <div className="text-[11px] text-slate-500 mt-0.5">PostGIS GiST Spatial Index</div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Inference Latency</span>
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">&lt; 0.2 ms</div>
              <div className="text-[11px] text-slate-500 mt-0.5">RF-150 Tree Ensemble</div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Flare Noise Filter</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">99% Suppressed</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Zero Alert Fatigue</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. VISUAL ARCHITECTURE PIPELINE */}
      <section className="py-20 px-6 lg:px-12 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs uppercase font-mono tracking-wider text-blue-600 font-bold">
              Multimodal Geospatial Fusion Engine
            </h2>
            <p className="text-3xl font-extrabold text-slate-950 mt-2 tracking-tight">
              How Raw Satellite Infrared Becomes Actionable Intelligence
            </p>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              Single-point thermal sensors trigger thousands of false alarms every day. Our 4-layer physical verification
              pipeline isolates genuine industrial emergencies with mathematical precision.
            </p>
          </div>

          {/* 4-Step Visual Flowchart */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-mono font-bold text-sm mb-4">
                  01
                </div>
                <h3 className="font-bold text-slate-900 text-base">NASA FIRMS VIIRS</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Ingests live 375m thermal anomalies across India every orbital pass. Captures Fire Radiative Power
                  (MW) and brightness temperature.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200 text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
                <Satellite className="w-3.5 h-3.5 text-blue-600" />
                <span>NRT Raw Telemetry</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-mono font-bold text-sm mb-4">
                  02
                </div>
                <h3 className="font-bold text-slate-900 text-base">ESA WorldCover 10m</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Classifies surrounding land cover using high-resolution radar. Instantly filters out forest wildfires
                  and agricultural crop burning.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200 text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>Land-Cover Disambiguation</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-mono font-bold text-sm mb-4">
                  03
                </div>
                <h3 className="font-bold text-slate-900 text-base">OSM GIS Containment</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  PostGIS GiST indexing tests spatial containment against 5,550+ verified refineries, chemical plants,
                  and industrial complexes.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200 text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-sky-600" />
                <span>Sub-millisecond Spatial Query</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-mono font-bold text-sm mb-4">
                  04
                </div>
                <h3 className="font-bold text-slate-900 text-base">Z-Score Baseline AI</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Computes thermal deviation from facility&apos;s 90-day mean. Distinguishes normal gas flaring from sudden
                  explosions (&gt;3.0σ spike).
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200 text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-red-600" />
                <span>Statistical Alert Threshold</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE VALUE PROPOSITIONS (SaaS FEATURE GRID) */}
      <section className="py-20 px-6 lg:px-12 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs uppercase font-mono tracking-wider text-blue-600 font-bold">
              Mission-Critical Capabilities
            </h2>
            <p className="text-3xl font-extrabold text-slate-950 mt-2 tracking-tight">
              Engineered for National Security & Disaster Intelligence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-4">
                <Flame className="w-5 h-5 text-slate-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Zero Alert Fatigue</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Refineries like Reliance Jamnagar and Indian Oil Mathura flare gas continuously. Our baseline engine
                classifies routine flaring as normal operational heat, preventing thousands of false alarms every month.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Rapid BLEVE & Explosion Detection</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Major chemical disasters show sudden 4x-12x thermal surges. When Fire Radiative Power spikes beyond 3.0
                standard deviations, the platform triggers an emergency alert for NDRF and State EOCs within minutes.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Building2 className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Covert & Unregistered Site Discovery</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Illegal chemical extraction units and clandestine fireworks sheds rarely exist in government GIS catalogs.
                By detecting industrial thermal output on unmapped built-up land, we flag unregistered operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. REAL-WORLD BENCHMARK PROOF (DAHEJ 2020 BLEVE CASE STUDY) */}
      <section className="py-20 px-6 lg:px-12 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-semibold mb-4">
                <span>Empirical Ground-Truth Validation</span>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight">
                June 3, 2020 Dahej Chemical Explosion Case Study
              </h2>
              <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                At Yashashvi Rasayan chemical plant in Dahej SEZ, Gujarat, a massive storage tank rupture triggered a
                catastrophic explosion killing 10 workers. Our satellite intelligence system detects the disaster
                unambiguously while keeping nearby Jamnagar routine flares green.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Dahej Chemical Plant:</strong> Thermal output surged from 15 MW to 188.4 MW (
                    <span className="text-red-600 font-semibold">+5.8σ deviation</span>), triggering an instant priority
                    alarm.
                  </span>
                </div>
                <div className="flex items-start gap-3 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Reliance Jamnagar:</strong> Operating concurrently at 43.8 MW (+0.4σ). Classified as
                    harmless routine flare; zero false alarm dispatched.
                  </span>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  href="/dashboard"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow transition inline-flex items-center gap-2"
                >
                  <span>Replay Incident Live on Tactical Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Interactive Visual Comparison Card */}
            <div className="flex-1 w-full max-w-lg bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-3">
                Model Classification Outcome
              </div>

              {/* Event 1 */}
              <div className="p-3.5 bg-white border border-red-200 rounded-xl mb-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">Dahej Chemical Complex</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-red-100 text-red-700 rounded font-bold uppercase">
                    CRITICAL EMERGENCY
                  </span>
                </div>
                <div className="mt-2 text-xs font-mono text-slate-600 grid grid-cols-2 gap-2">
                  <div>FRP: <span className="text-slate-900 font-bold">188.4 MW</span></div>
                  <div>Z-Score: <span className="text-red-600 font-bold">+5.8σ Spike</span></div>
                </div>
                <div className="text-[11px] text-slate-500 mt-2 border-t border-slate-100 pt-1.5">
                  Action: Automated Priority Dispatch to NDRF & State Emergency Operations
                </div>
              </div>

              {/* Event 2 */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">Reliance Jamnagar Refinery</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-bold uppercase">
                    ROUTINE FLARE (NORMAL)
                  </span>
                </div>
                <div className="mt-2 text-xs font-mono text-slate-600 grid grid-cols-2 gap-2">
                  <div>FRP: <span className="text-slate-900 font-bold">43.8 MW</span></div>
                  <div>Z-Score: <span className="text-slate-600 font-bold">+0.4σ Nominal</span></div>
                </div>
                <div className="text-[11px] text-slate-500 mt-2 border-t border-slate-100 pt-1.5">
                  Action: Harmless operational heat; suppressed from notification queue
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION & FOOTER */}
      <section className="py-16 px-6 lg:px-12 bg-blue-600 text-white text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-extrabold tracking-tight">
            Ready to Inspect National Thermal Intelligence?
          </h2>
          <p className="mt-3 text-sm text-blue-100 max-w-xl mx-auto leading-relaxed">
            Access the live tactical dashboard, review the 99 satellite detections across India, and inspect the
            SHAP tree explainability engine.
          </p>
          <div className="mt-8">
            <Link
              href="/dashboard"
              className="px-6 py-3.5 bg-white hover:bg-slate-100 text-blue-700 rounded-xl font-bold text-sm shadow-md transition inline-flex items-center gap-2"
            >
              <span>Launch Tactical Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 lg:px-12 bg-white border-t border-slate-200 text-xs text-slate-500 flex flex-col md:flex-row items-center justify-between gap-4 max-w-6xl mx-auto w-full">
        <div>
          © 2026 NTRO Industrial Fire Intelligence System · Smart India Hackathon 2026
        </div>
        <div className="flex items-center gap-4 text-slate-600">
          <Link href="/dashboard" className="hover:text-blue-600 transition">
            Tactical Map
          </Link>
          <Link href="/dashboard/alerts" className="hover:text-blue-600 transition">
            Alert Queue
          </Link>
          <Link href="/dashboard/audit" className="hover:text-blue-600 transition">
            Audit Ledger
          </Link>
        </div>
      </footer>
    </div>
  );
}
