"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { ThermalMap } from "@/components/map/ThermalMap";
import { MOCK_DETECTIONS } from "@/lib/mockData";

export function LiveMapPreview() {
  return (
    <section className="py-24 px-6 bg-tw-surface/30 border-y border-tw-border relative">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tw-teal/10 border border-tw-teal/25 text-tw-teal text-xs font-bold uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5" />
              INTELLIGENCE MAP PREVIEW
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-tw-text leading-tight">
              Real-time insights.
              <br />
              <span className="text-tw-teal">Real-world impact.</span>
            </h2>
            <p className="text-tw-muted text-sm max-w-xl leading-relaxed">
              Visualize thermal anomalies, industrial infrastructure and classifications on a unified geospatial map. Click any anomaly marker to inspect classification details.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-tw-teal hover:bg-tw-teal-hi text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-tw-teal/20 flex-shrink-0"
          >
            Open Live Map
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Large Leaflet map preview container */}
        <div className="shadow-2xl rounded-2xl overflow-hidden border border-tw-border">
          <ThermalMap
            detections={MOCK_DETECTIONS}
            height={520}
            center={[21.0, 79.0]}
            zoom={5}
          />
        </div>
      </div>
    </section>
  );
}
