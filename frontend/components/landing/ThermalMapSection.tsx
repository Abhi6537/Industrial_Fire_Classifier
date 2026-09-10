"use client";

import { ThermalMap } from "@/components/map/ThermalMap";
import { MOCK_DETECTIONS } from "@/lib/mockData";

// Thin client wrapper so app/page.tsx stays a server component.
// The ThermalMap itself needs "use client" for Leaflet.
export function ThermalMapSection() {
  return (
    <ThermalMap
      detections={MOCK_DETECTIONS}
      height={520}
      center={[20.5, 78.9]}
      zoom={5}
    />
  );
}
