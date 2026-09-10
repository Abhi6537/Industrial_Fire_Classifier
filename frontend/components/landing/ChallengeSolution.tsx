import React from "react";
import {
  Satellite,
  Activity,
  Layers,
  Brain,
  Globe,
  ArrowRight,
  AlertCircle,
  Sparkles,
} from "lucide-react";

const PIPELINE_NODES = [
  {
    icon: Satellite,
    label: "NASA FIRMS",
    sub: "VIIRS thermal anomaly feeds",
    color: "#0ea5e9",
  },
  {
    icon: Activity,
    label: "Thermal Detection",
    sub: "Radiance & hotspot identification",
    color: "#f59e0b",
  },
  {
    icon: Layers,
    label: "Context Fusion",
    sub: "OSM polygons & land-cover",
    color: "#a855f7",
  },
  {
    icon: Brain,
    label: "AI Classification",
    sub: "Multi-modal ML model inference",
    color: "#0d9488",
  },
  {
    icon: Globe,
    label: "GIS Intelligence",
    sub: "Actionable operational alerts",
    color: "#22c55e",
  },
];

export function ChallengeSolution() {
  return (
    <section id="solution" className="py-24 px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-20">
        {/* Two column layout: Challenge vs Solution */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Challenge Left Column */}
          <div className="bg-tw-surface/40 border border-tw-border/80 rounded-2xl p-8 lg:p-10 space-y-6 relative overflow-hidden">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <AlertCircle className="w-3.5 h-3.5" />
              THE CHALLENGE
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-tw-text leading-tight">
              Satellite sensors can see the heat.
              <br />
              <span className="text-tw-muted font-normal text-2xl sm:text-3xl block mt-2">
                But heat alone doesn&apos;t tell you what&apos;s happening.
              </span>
            </h2>

            <p className="text-tw-muted text-sm leading-relaxed">
              Current thermal anomaly systems can detect heat from space, but a
              thermal detection alone does not reliably explain whether the
              source is an industrial fire, gas flare, agricultural burning,
              natural fire, or persistent industrial activity.
            </p>

            <div className="p-4 rounded-xl bg-tw-navy/80 border border-tw-border text-xs text-tw-muted space-y-2">
              <p className="font-semibold text-tw-text flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Operational Bottleneck
              </p>
              <p>
                Without geospatial context and facility baselines, response teams end
                up sorting through hundreds of unclassified alerts every day.
              </p>
            </div>
          </div>

          {/* Solution Right Column */}
          <div className="bg-tw-surface/40 border border-tw-border/80 rounded-2xl p-8 lg:p-10 space-y-6 relative overflow-hidden">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tw-teal/10 border border-tw-teal/30 text-tw-teal text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              OUR SOLUTION
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-tw-text leading-tight">
              AI + Geospatial Intelligence
            </h2>

            <p className="text-tw-muted text-sm leading-relaxed">
              ThermoWatch combines thermal anomaly detections with industrial
              infrastructure, land-cover context, satellite imagery and historical
              thermal behavior to classify and contextualize thermal activity in
              real time.
            </p>

            <div className="p-4 rounded-xl bg-tw-teal/10 border border-tw-teal/25 text-xs text-tw-text/90 space-y-2">
              <p className="font-semibold text-tw-teal flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-tw-teal animate-pulse" />
                Actionable Context
              </p>
              <p className="text-tw-muted">
                Each thermal signature is enriched with OpenStreetMap industrial facility
                polygons, per-site thermal baselines, and satellite confidence scoring.
              </p>
            </div>
          </div>
        </div>

        {/* Visual Data Pipeline Section */}
        <div className="space-y-8 bg-tw-surface/30 border border-tw-border/60 rounded-2xl p-8">
          <div className="text-center space-y-2">
            <p className="text-tw-teal text-xs font-bold uppercase tracking-widest">
              Data Pipeline & Architecture
            </p>
            <h3 className="text-2xl font-bold text-tw-text">
              From Raw Satellite Telemetry to Geospatial Intelligence
            </h3>
          </div>

          {/* Connected horizontal pipeline grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {PIPELINE_NODES.map((node, i) => {
              const Icon = node.icon;
              const isLast = i === PIPELINE_NODES.length - 1;
              return (
                <div key={node.label} className="relative flex flex-col items-center">
                  <div
                    className="w-full bg-tw-navy/90 border rounded-xl p-5 flex flex-col items-center text-center space-y-3 transition-all hover:border-tw-teal/40"
                    style={{ borderColor: `${node.color}30` }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center border"
                      style={{
                        background: `${node.color}15`,
                        borderColor: `${node.color}40`,
                      }}
                    >
                      <Icon className="w-6 h-6" style={{ color: node.color }} />
                    </div>
                    <div>
                      <h4 className="text-tw-text font-bold text-sm">
                        {node.label}
                      </h4>
                      <p className="text-tw-muted text-[11px] mt-1">
                        {node.sub}
                      </p>
                    </div>
                  </div>

                  {!isLast && (
                    <div className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-tw-surface border border-tw-border items-center justify-center text-tw-muted">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
