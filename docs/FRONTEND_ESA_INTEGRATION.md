# Frontend Integration Guide: Real ESA WorldCover 10m Satellite Land Cover

> **POST-MERGE IMPLEMENTATION NOTICE**
> To avoid merge conflicts during ongoing branch integration, this specification outlines the exact UI components, Leaflet map layer configuration, and data contracts to be implemented in `frontend/` once core branches are consolidated.

---

## 1. Overview & Capability

The backend now resolves all active thermal anomalies against the **ESA WorldCover 10m 2021 Global Product**, produced by the European Space Agency using Sentinel-1 (C-band SAR) and Sentinel-2 (Multispectral Optical) satellite constellations.

### Why This is a Core SIH MVP / USP Feature:
1. **Sub-facility Ground Truth (10m Resolution)**: Standard MODIS or land use datasets have 500m-1km pixel spacing. ESA WorldCover provides 10-meter resolution—enough to clearly distinguish between an industrial facility rooftop/cracking unit (`Class 50: Built-up`), surrounding agricultural fields (`Class 40: Cropland`), and adjacent mangrove belts (`Class 95: Mangroves`).
2. **Zero Heuristics**: Replaces coarse regional assumptions with validated orbital land cover classifications.
3. **Interactive WMS Overlay**: Operators can toggle the official ESA 10m colored raster layer directly on the Leaflet map behind thermal points.

---

## 2. API Data Contract Additions

The `GET /events` and `GET /events/{id}` endpoints now provide the following top-level fields for every classified event:

```typescript
export interface ClassifiedEvent {
  // Existing fields...
  id: string;
  latitude: number;
  longitude: number;
  label: "industrial_fire" | "normal_flare" | "agricultural_burn" | "wildfire" | "mining_activity" | "unregistered_anomaly";
  land_cover_type: "industrial" | "farmland" | "forest" | "other";

  // --- NEW: ESA WorldCover 10m Ground Truth ---
  esa_worldcover_code: number;    // e.g. 10, 40, 50, 60, 95
  esa_worldcover_label: string;   // e.g. "Built-up", "Cropland", "Tree cover", "Mangroves"
  esa_worldcover_color: string;   // e.g. "#fa0000", "#f096ff", "#006400", "#00cf75"
}
```

---

## 3. Official ESA WorldCover Taxonomy & Swatches

| Class Code | Official ESA Label | Hex Swatch | Canonical System Category |
|:---:|:---|:---:|:---|
| **10** | **Tree cover** | `#006400` | Forest / Dense Canopy |
| **20** | **Shrubland** | `#ffbb22` | Wildfire Brush |
| **30** | **Grassland** | `#ffff4c` | Rural / Rangeland |
| **40** | **Cropland** | `#f096ff` | Farmland / Crop Residue |
| **50** | **Built-up** | `#fa0000` | Industrial / Urban Infrastructure |
| **60** | **Bare / sparse vegetation** | `#b4b4b4` | Mining / Quarry / Barren |
| **70** | **Snow and ice** | `#f0f0f0` | High Altitude / Alpine |
| **80** | **Permanent water bodies** | `#0064c8` | Aquatic / Waterway |
| **90** | **Herbaceous wetland** | `#0096a0` | Wetland / Marsh |
| **95** | **Mangroves** | `#00cf75` | Coastal Mangrove Buffer |
| **100** | **Moss and lichen** | `#fae6a0` | Tundra / Peat |

---

## 4. Leaflet Interactive WMS Layer (Terrascope Open Endpoint)

Terrascope provides an open, keyless OGC WMS endpoint for ESA WorldCover 2021. You can overlay this directly into Leaflet:

### In `frontend/components/map/MapViewer.tsx`:
```tsx
import { LayersControl, WMSTileLayer } from "react-leaflet";

// Inside the <MapContainer> component:
<LayersControl position="topright">
  <LayersControl.BaseLayer checked name="CartoDB Dark">
    <TileLayer
      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      attribution="&copy; OpenStreetMap contributors &copy; CARTO"
    />
  </LayersControl.BaseLayer>

  <LayersControl.Overlay name="ESA WorldCover 10m (Sentinel-1/2)">
    <WMSTileLayer
      url="https://services.terrascope.be/wms/v2"
      params={{
        layers: "WORLDCOVER_2021_MAP",
        format: "image/png",
        transparent: true,
        version: "1.3.0",
        opacity: 0.65,
      }}
      attribution="&copy; ESA WorldCover project / Copernicus Sentinel data (2021)"
    />
  </LayersControl.Overlay>
</LayersControl>
```

---

## 5. UI Components

### A. `<ESAWorldCoverBadge />` Component
Save as `frontend/components/events/ESAWorldCoverBadge.tsx`:

```tsx
import React from "react";
import { Layers } from "lucide-react";

interface ESAWorldCoverBadgeProps {
  code: number;
  label: string;
  color?: string;
  size?: "sm" | "md";
}

export const ESAWorldCoverBadge: React.FC<ESAWorldCoverBadgeProps> = ({
  code,
  label,
  color = "#fa0000",
  size = "md",
}) => {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-md font-mono font-medium border transition-colors ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
      }`}
      style={{
        backgroundColor: `${color}15`,
        borderColor: `${color}40`,
        color: "#f8fafc",
      }}
      title={`ESA WorldCover 10m Class ${code}: ${label}`}
    >
      <span
        className="w-2.5 h-2.5 rounded-full shadow-sm"
        style={{ backgroundColor: color }}
      />
      <Layers className="w-3.5 h-3.5 opacity-80" />
      <span className="font-semibold text-slate-300">ESA 10m:</span>
      <span className="text-white font-bold">{label}</span>
      <span className="text-slate-400 text-[10px] ml-0.5">({code})</span>
    </div>
  );
};
```

### B. Event Inspector Ground Validation Card
Add this block inside the event details sidebar/drawer (`frontend/components/events/EventInspector.tsx`):

```tsx
<div className="mt-4 p-3 rounded-lg bg-slate-900/80 border border-slate-800">
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-2">
      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: event.esa_worldcover_color || "#fa0000" }}
      />
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        ESA Sentinel 10m Ground Validation
      </span>
    </div>
    <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800/50 px-1.5 py-0.5 rounded font-mono">
      Sentinel-1 SAR / S2 Optical
    </span>
  </div>

  <div className="grid grid-cols-2 gap-2 text-xs">
    <div>
      <span className="text-slate-500 block">Class Code:</span>
      <span className="font-mono font-bold text-slate-200">
        {event.esa_worldcover_code} - {event.esa_worldcover_label}
      </span>
    </div>
    <div>
      <span className="text-slate-500 block">Spatial Resolution:</span>
      <span className="font-mono text-emerald-400 font-bold">10 Meters</span>
    </div>
  </div>

  <div className="mt-2 text-[11px] text-slate-400 italic">
    {event.esa_worldcover_code === 50
      ? "Confirmed built-up industrial impervious surface with high thermal persistence."
      : event.esa_worldcover_code === 40
      ? "Confirmed arable agricultural cropland terrain. Highly indicative of seasonal crop residue clearing."
      : event.esa_worldcover_code === 10
      ? "Dense canopy woodland cover. High wildfire propagation risk."
      : "High-accuracy terrain ground classification."}
  </div>
</div>
```

---

## 6. Verification Checklist Post-Merge

1. [ ] Check that `GET http://localhost:8000/events` includes `esa_worldcover_code`, `esa_worldcover_label`, and `esa_worldcover_color`.
2. [ ] Toggle the WMS layer in Leaflet to see the 10m ESA raster overlay on India.
3. [ ] Verify that Jamnagar refinery thermal events render with `#fa0000` (Class 50: Built-up).
4. [ ] Verify that Punjab agricultural burns render with `#f096ff` (Class 40: Cropland).
5. [ ] Verify that Gir forest events render with `#006400` (Class 10: Tree cover).
