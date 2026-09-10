import React from "react";
import { Satellite, Brain, Globe, ShieldCheck } from "lucide-react";

const CAPABILITIES = [
  {
    icon: Satellite,
    title: "Real-time Monitoring",
    description: "NASA FIRMS VIIRS satellite thermal feeds",
  },
  {
    icon: Brain,
    title: "AI Classification",
    description: "Multi-modal ML inference engine",
  },
  {
    icon: Globe,
    title: "Geospatial Intelligence",
    description: "OSM & land-cover context fusion",
  },
  {
    icon: ShieldCheck,
    title: "Safer Communities",
    description: "Rapid disaster response awareness",
  },
];

export function CapabilityStrip() {
  return (
    <section className="border-y border-tw-border bg-tw-surface/60 backdrop-blur-sm relative z-20">
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {CAPABILITIES.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className={`flex items-start gap-4 ${
                index !== CAPABILITIES.length - 1
                  ? "lg:border-r border-tw-border/60 lg:pr-6"
                  : ""
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-tw-teal/10 border border-tw-teal/25 flex items-center justify-center flex-shrink-0 text-tw-teal shadow-inner">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-tw-text text-sm font-semibold tracking-tight leading-snug">
                  {item.title}
                </h3>
                <p className="text-tw-muted text-xs mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
