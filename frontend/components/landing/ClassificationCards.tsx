import React from "react";
import {
  Flame,
  Wind,
  Activity,
  FlaskConical,
  TreePine,
  HelpCircle,
} from "lucide-react";
import { CLASSIFICATION_META, ClassificationLabel } from "@/lib/mockData";

const CLASSIFICATION_ITEMS: {
  key: ClassificationLabel;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  description: string;
}[] = [
  {
    key: "industrial_fire",
    icon: Flame,
    description:
      "Accidental or uncontrolled thermal event in an industrial facility.",
  },
  {
    key: "gas_flare",
    icon: Wind,
    description: "Routine or abnormal flaring activity.",
  },
  {
    key: "persistent_source",
    icon: Activity,
    description: "Repeated or continuous thermal emissions.",
  },
  {
    key: "agricultural_burn",
    icon: FlaskConical,
    description: "Thermal activity associated with field burning.",
  },
  {
    key: "natural_fire",
    icon: TreePine,
    description: "Natural fire or wildfire activity.",
  },
  {
    key: "unknown_anomaly",
    icon: HelpCircle,
    description:
      "Thermal activity that cannot yet be confidently classified.",
  },
];

export function ClassificationCards() {
  return (
    <section className="py-24 px-6 bg-tw-surface/30 border-y border-tw-border">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <p className="text-tw-teal text-xs font-bold uppercase tracking-widest">
            AI Classification System
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-tw-text">
            Understand the source behind the heat.
          </h2>
          <p className="text-tw-muted text-sm leading-relaxed">
            The platform classifies every thermal detection into distinct operational
            categories using satellite telemetry, geospatial context and ML model inference.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CLASSIFICATION_ITEMS.map((item) => {
            const meta = CLASSIFICATION_META[item.key];
            const Icon = item.icon;

            return (
              <div
                key={item.key}
                className="bg-tw-surface/80 border border-tw-border hover:border-tw-border-hi rounded-xl p-6 transition-all duration-200 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3.5 mb-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border"
                      style={{
                        background: meta.bg,
                        borderColor: `${meta.color}40`,
                      }}
                    >
                      <Icon className="w-5 h-5" style={{ color: meta.color }} />
                    </div>
                    <h3 className="text-tw-text text-base font-semibold group-hover:text-tw-text/100">
                      {meta.label}
                    </h3>
                  </div>

                  <p className="text-tw-muted text-xs leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-tw-border/60 flex items-center justify-between text-[11px]">
                  <span className="text-tw-muted font-mono uppercase tracking-wider">
                    Category Tag
                  </span>
                  <span
                    className="font-bold px-2 py-0.5 rounded"
                    style={{
                      color: meta.color,
                      background: meta.bg,
                      border: `1px solid ${meta.color}35`,
                    }}
                  >
                    {item.key}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
