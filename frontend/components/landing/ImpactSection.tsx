import React from "react";
import {
  Flame,
  Factory,
  Satellite,
  ShieldAlert,
  MapPin,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";

const IMPACT_CARDS = [
  {
    icon: Flame,
    category: "AI FLARE FILTERING",
    stat: "-87%",
    statLabel: "False Alarm Reduction",
    title: "Refinery Flare vs. Uncontrolled Fire Classification",
    desc: "Eliminates alert fatigue by using spatial ML to differentiate routine industrial gas flaring and power plant heat from genuine emergency fire outbreaks.",
    highlight: "Filters routine stack flaring & smelter baselines",
    accent: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  },
  {
    icon: Satellite,
    category: "ORBITAL TELEMETRY",
    stat: "< 120s",
    statLabel: "Detection-to-Alert Latency",
    title: "Real-Time NASA FIRMS Telemetry Stream",
    desc: "Parses 15-minute VIIRS 375m & MODIS 1km orbital overpasses instantly, extracting sub-pixel brightness temperature and Fire Radiative Power (FRP in MW).",
    highlight: "Direct sub-pixel infrared radiance processing",
    accent: "text-[#c05621] border-[#c05621]/30 bg-[#c05621]/10",
  },
  {
    icon: MapPin,
    category: "GEOSPATIAL FUSION",
    stat: "10m",
    statLabel: "Spatial Boundary Precision",
    title: "OpenStreetMap Infrastructure Overlay",
    desc: "Cross-references satellite heat coordinates against OpenStreetMap plant boundaries, chemical storage zones, pipeline corridors, and land-use maps.",
    highlight: "Facility perimeter & proximity radius matching",
    accent: "text-[#78866b] border-[#78866b]/30 bg-[#78866b]/10",
  },
  {
    icon: ShieldAlert,
    category: "EMERGENCY DISPATCH",
    stat: "100%",
    statLabel: "Automated Incident Escalation",
    title: "Instant Response & Webhook Dispatch",
    desc: "Triggers instant notifications to emergency response crews and plant safety managers with exact GPS coordinates and automated telemetry reports.",
    highlight: "SMS, Webhook & PDF report dispatch logs",
    accent: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  },
];

const THERMAL_CLASSES = [
  {
    name: "Industrial Fire",
    color: "bg-red-500",
    badge: "CRITICAL RISK",
    badgeStyle: "text-red-400 border-red-500/30 bg-red-500/10",
    desc: "Uncontrolled industrial thermal event outside normal facility baselines",
  },
  {
    name: "Refinery Stack Flare",
    color: "bg-amber-500",
    badge: "BENIGN FLARE",
    badgeStyle: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    desc: "Routine operational gas flaring at oil & gas refineries",
  },
  {
    name: "Persistent Heat Source",
    color: "bg-yellow-500",
    badge: "OPERATIONAL",
    badgeStyle: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
    desc: "Continuous high-temp industrial plant, kiln, or power station",
  },
  {
    name: "Agricultural Burning",
    color: "bg-lime-500",
    badge: "BIOMASS",
    badgeStyle: "text-lime-400 border-lime-500/30 bg-lime-500/10",
    desc: "Seasonal crop residue or biomass field management",
  },
];

export function ImpactSection() {
  return (
    <section id="impact" className="py-24 px-6 bg-[#141714] border-t border-[#2f352e]/80">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <p className="text-xs font-mono text-[#c05621] uppercase tracking-widest font-semibold">
              Operational Impact &amp; Domain Intelligence
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#e8e4d9] tracking-tight leading-tight">
              AI-Powered Detection &amp; Industrial Risk Classification
            </h2>
            <p className="text-sm text-[#98a092] leading-relaxed">
              Purpose-built geospatial machine learning trained on NASA satellite radiance telemetry, OpenStreetMap facility polygons, and historical thermal baselines.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[#60675b]">
            <Factory className="w-4 h-4 text-[#78866b]" />
            <span>Refinery &amp; Industrial Facility Defense Engine</span>
          </div>
        </div>

        {/* 4 Refined Impact Cards with Borders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {IMPACT_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="bg-[#1c1f1b] border border-[#2f352e] hover:border-[#454e43] rounded-2xl p-7 flex flex-col justify-between transition-all duration-300 shadow-xl group space-y-6"
              >
                <div className="space-y-4">
                  {/* Top Bar: Icon + Category + Stat */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#141714] border border-[#2f352e] flex items-center justify-center text-[#e8e4d9] group-hover:border-[#c05621]/50 transition-colors">
                        <Icon className="w-5 h-5 text-[#c05621]" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#60675b] block">
                          {card.category}
                        </span>
                        <span className="text-xs font-mono text-[#98a092]">
                          ThermoWatch Intelligence
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl sm:text-3xl font-bold font-mono text-[#e8e4d9] block">
                        {card.stat}
                      </span>
                      <span className="text-[10px] font-mono text-[#98a092] uppercase tracking-wider">
                        {card.statLabel}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1.5 pt-2">
                    <h3 className="text-xl font-semibold text-[#e8e4d9] tracking-tight group-hover:text-[#c05621] transition-colors flex items-center gap-2">
                      {card.title}
                      <ArrowUpRight className="w-4 h-4 text-[#60675b] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-xs text-[#98a092] leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                </div>

                {/* Bottom Highlight Pill */}
                <div className="pt-4 border-t border-[#2f352e]/60 flex items-center gap-2.5 text-xs text-[#e8e4d9]/90">
                  <CheckCircle2 className="w-4 h-4 text-[#78866b] flex-shrink-0" />
                  <span className="text-xs font-mono text-[#98a092]">
                    {card.highlight}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Specialized Domain Classification Spectrum Card */}
        <div className="bg-[#1c1f1b] border border-[#2f352e] rounded-2xl p-7 lg:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2f352e]/60 pb-5">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#c05621] font-semibold">
                Classification Taxonomy
              </span>
              <h3 className="text-xl font-semibold text-[#e8e4d9] tracking-tight mt-1">
                Automated Multi-Class Thermal Anomaly Profiling
              </h3>
            </div>
            <span className="text-xs font-mono text-[#98a092] bg-[#141714] px-3 py-1.5 rounded-lg border border-[#2f352e]">
              5 Real-Time Class Output Tiers
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {THERMAL_CLASSES.map((cls) => (
              <div
                key={cls.name}
                className="bg-[#141714] border border-[#2f352e] rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${cls.color}`} />
                    <span className="text-xs font-semibold text-[#e8e4d9]">
                      {cls.name}
                    </span>
                  </div>
                </div>
                <span className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded border ${cls.badgeStyle}`}>
                  {cls.badge}
                </span>
                <p className="text-[11px] text-[#98a092] leading-relaxed">
                  {cls.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
