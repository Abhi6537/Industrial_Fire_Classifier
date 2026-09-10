import React from "react";
import { Shield, Building2, Users, ChevronRight } from "lucide-react";

const AUDIENCE_CARDS = [
  {
    icon: Shield,
    title: "Government Agencies",
    sub: "Disaster management, environmental monitoring and situational awareness.",
    points: [
      "Real-time situational awareness across India",
      "Emergency detection and rapid incident response",
      "Critical infrastructure protection",
      "Historical incident records and audit trails",
    ],
    color: "#0d9488",
  },
  {
    icon: Building2,
    title: "Industrial Operators",
    sub: "Monitor critical infrastructure such as refineries, power plants, steel facilities and LNG terminals.",
    points: [
      "Monitor thermal activity around owned facilities",
      "Detect abnormal heat signatures early",
      "Track historical thermal baseline per site",
      "Support incident investigation and reporting",
    ],
    color: "#f59e0b",
  },
  {
    icon: Users,
    title: "Researchers & Analysts",
    sub: "Analyze thermal patterns, historical activity and geospatial context.",
    points: [
      "Access historical thermal detection datasets",
      "Inspect AI classification with confidence scores",
      "Analyse spatial and temporal thermal patterns",
      "Validate against satellite imagery and OSM data",
    ],
    color: "#a855f7",
  },
];

export function AudienceCards() {
  return (
    <section id="impact" className="py-24 px-6 relative">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <p className="text-tw-teal text-xs font-bold uppercase tracking-widest">
            Stakeholders & Use Cases
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-tw-text">
            Built for a safer, cleaner, more resilient India.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {AUDIENCE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="bg-tw-surface/70 border border-tw-border hover:border-tw-border-hi rounded-2xl p-7 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 border"
                    style={{
                      background: `${card.color}15`,
                      borderColor: `${card.color}35`,
                    }}
                  >
                    <Icon className="w-6 h-6" style={{ color: card.color }} />
                  </div>

                  <h3 className="text-tw-text font-bold text-lg mb-2">
                    {card.title}
                  </h3>

                  <p className="text-tw-muted text-xs leading-relaxed mb-6">
                    {card.sub}
                  </p>

                  <ul className="space-y-3 border-t border-tw-border/60 pt-5">
                    {card.points.map((pt) => (
                      <li
                        key={pt}
                        className="flex items-start gap-2.5 text-xs text-tw-muted"
                      >
                        <ChevronRight
                          className="w-4 h-4 mt-0.5 flex-shrink-0"
                          style={{ color: card.color }}
                        />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
