import React from "react";
import { Shield, Zap, Globe } from "lucide-react";

const IMPACT_CARDS = [
  {
    icon: Shield,
    title: "Protect Critical Infrastructure",
    desc: "Identify abnormal thermal activity around critical industrial facilities before escalation occurs.",
    color: "#0d9488",
  },
  {
    icon: Zap,
    title: "Enable Faster Response",
    desc: "Separate potentially hazardous industrial events from routine or natural thermal activity in minutes.",
    color: "#f59e0b",
  },
  {
    icon: Globe,
    title: "Environmental Intelligence",
    desc: "Monitor persistent thermal sources and understand their spatial behavior across long-term baselines.",
    color: "#22c55e",
  },
];

export function ImpactSection() {
  return (
    <section id="about" className="py-24 px-6 relative">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <p className="text-tw-teal text-xs font-bold uppercase tracking-widest">
            Operational Value
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-tw-text">
            From thermal anomaly to actionable intelligence.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {IMPACT_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="bg-tw-surface/70 border border-tw-border hover:border-tw-border-hi rounded-2xl p-7 transition-colors"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 border"
                  style={{
                    background: `${card.color}15`,
                    borderColor: `${card.color}35`,
                  }}
                >
                  <Icon className="w-6 h-6" style={{ color: card.color }} />
                </div>
                <h3 className="text-tw-text font-bold text-lg mb-3">
                  {card.title}
                </h3>
                <p className="text-tw-muted text-xs leading-relaxed">
                  {card.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
