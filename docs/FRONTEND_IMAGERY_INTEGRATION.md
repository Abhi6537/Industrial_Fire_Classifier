# Frontend Integration Guide: Real Satellite Imagery (Sentinel-2 Optical & SWIR B12-B8A-B4)

> **POST-MERGE IMPLEMENTATION NOTICE**
> To prevent merge conflicts during active feature consolidation, this specification provides turnkey React / Next.js and React-Leaflet components to be mounted directly into `frontend/` after core branch merging.

---

## 1. Tactical Capabilities & Physics Overview

The backend now exposes high-resolution **Copernicus Sentinel-2 Level-2A** satellite imagery integration with dual-band spectral synthesis:

### 1. True Color Natural Composite (`RGB: B04, B03, B02`)
* **Wavelengths**: Red (665 nm), Green (560 nm), Blue (490 nm) at **10-meter spatial resolution**.
* **Operational Purpose**: Delineates visible hydrocarbon smoke plumes, structural fragmentation, plant layout, and post-fire black carbon burn scars.
* **Limitation**: Opaque black smoke plumes completely occlude the ground, preventing optical sensors from locating which specific storage tank or process unit is burning.

### 2. Short-Wave Infrared (SWIR) False-Color Fire Penetration (`B12, B8A, B04`)
* **Wavelengths**:
  * **Band 12 (SWIR-2, ~2190 nm)** $\rightarrow$ Mapped to **Red Channel**
  * **Band 8A (Narrow NIR, ~865 nm)** $\rightarrow$ Mapped to **Green Channel**
  * **Band 4 (Red, ~665 nm)** $\rightarrow$ Mapped to **Blue Channel**
* **The Physics Advantage (Rayleigh & Mie Scattering)**:
  * Atmospheric scattering by smoke particles ($\sim 0.1 - 1.0\ \mu\text{m}$) drops exponentially at 2.19 $\mu\text{m}$ (SWIR).
  * High-temperature combustion surfaces ($>400^\circ\text{C}$) emit massive radiant spectral exitance in SWIR.
  * **Result**: The smoke plume becomes semi-transparent, and the combustion seat glows as an intense, localized fiery red/orange pixel directly over the failed reactor or tank.

---

## 2. API Contracts & Endpoints

### A. List Available Satellite Overlay Layers
```http
GET /api/v1/imagery/layers
```
**Response**:
```json
[
  {
    "id": "sentinel2_true_color",
    "name": "Sentinel-2 L2A True Color (RGB: B04, B03, B02)",
    "layer_type": "wms",
    "service_url": "https://sh.dataspace.copernicus.eu/ogc/wms/v1",
    "layer_name": "TRUE_COLOR",
    "resolution_m": 10,
    "smoke_penetration": "Low (scattered by atmospheric aerosols and particulate smoke)"
  },
  {
    "id": "sentinel2_swir_fire",
    "name": "Sentinel-2 SWIR Fire / Thermal Penetration (B12, B8A, B04)",
    "layer_type": "wms",
    "service_url": "https://sh.dataspace.copernicus.eu/ogc/wms/v1",
    "layer_name": "SWIR_FIRE",
    "resolution_m": 20,
    "smoke_penetration": "Extreme (SWIR radiation ~2.19µm passes unhindered through particulate smoke plumes)"
  }
]
```

### B. Get Event Sentinel-2 Spectral Analysis & Pre/Post Comparison
```http
GET /api/v1/imagery/event/{event_id}
```
**Response Sample (Dahej Chemical Incident)**:
```json
{
  "event_id": "5d75f42a-989c-48e2-8873-f61d24785995",
  "latitude": 21.7125,
  "longitude": 72.5833,
  "sentinel_mgrs_tile": "42QWJ",
  "spatial_resolution_m": 10,
  "pre_incident": {
    "acquisition_date": "2020-05-28T05:32:00Z",
    "composite": "True Color (B04, B03, B02)",
    "nbr_index": 0.2174
  },
  "post_incident": {
    "acquisition_date": "2020-06-03T05:32:00Z",
    "composite": "SWIR Fire (B12, B8A, B04)",
    "smoke_occlusion_pct": 82.0,
    "swir_thermal_ratio": 7.64,
    "swir_fire_seat_detected": true
  },
  "spectral_analysis": {
    "delta_nbr": -0.6374,
    "domain_interpretation": "Opaque hydrocarbon smoke plume obscures optical visible bands (4-3-2). SWIR Band 12 (2.19µm) pierces smoke plume, pinpointing the active reactor combustion core."
  }
}
```

---

## 3. Leaflet GIS Map Overlay Integration

Add Sentinel-2 WMS layer controls in `frontend/components/map/MapViewer.tsx`:

```tsx
import { LayersControl, WMSTileLayer } from "react-leaflet";

// Inside the <MapContainer> component:
<LayersControl position="topright">
  {/* Base CartoDB or OSM layer */}
  <LayersControl.BaseLayer checked name="Tactical Dark Basemap">
    <TileLayer
      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      attribution="&copy; OpenStreetMap contributors &copy; CARTO"
    />
  </LayersControl.BaseLayer>

  {/* Copernicus Sentinel-2 True Color (10m Optical) */}
  <LayersControl.Overlay name="🛰️ Sentinel-2 L2A (True Color 10m)">
    <WMSTileLayer
      url="https://sh.dataspace.copernicus.eu/ogc/wms/v1"
      params={{
        layers: "TRUE_COLOR",
        format: "image/png",
        transparent: true,
        version: "1.3.0",
        opacity: 0.75,
      }}
      attribution="&copy; Copernicus Sentinel-2 / ESA"
    />
  </LayersControl.Overlay>

  {/* Sentinel-2 SWIR Fire (Smoke-Penetration B12-B8A-B4) */}
  <LayersControl.Overlay name="🔥 Sentinel-2 SWIR Fire (Smoke-Penetrating)">
    <WMSTileLayer
      url="https://sh.dataspace.copernicus.eu/ogc/wms/v1"
      params={{
        layers: "SWIR_FIRE",
        format: "image/png",
        transparent: true,
        version: "1.3.0",
        opacity: 0.85,
      }}
      attribution="&copy; Copernicus Sentinel-2 / ESA"
    />
  </LayersControl.Overlay>
</LayersControl>
```

---

## 4. UI Components

### A. `<SWIRSmokePenetrationCard />`
Save as `frontend/components/events/SWIRSmokePenetrationCard.tsx`:

```tsx
import React, { useEffect, useState } from "react";
import { Eye, ShieldAlert, Zap, Globe } from "lucide-react";

interface SWIRCardProps {
  eventId: string;
}

export const SWIRSmokePenetrationCard: React.FC<SWIRCardProps> = ({ eventId }) => {
  const [imagery, setImagery] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8000/api/v1/imagery/event/${eventId}`)
      .then((res) => res.json())
      .then((data) => {
        setImagery(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed fetching satellite imagery:", err);
        setLoading(false);
      });
  }, [eventId]);

  if (loading) return <div className="text-xs text-slate-500 animate-pulse">Loading orbital satellite imagery...</div>;
  if (!imagery) return null;

  return (
    <div className="mt-3 p-3 rounded-lg bg-slate-900 border border-slate-800 shadow-md">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200">
            Sentinel-2 L2A Orbital Ground Truth
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
          MGRS: {imagery.sentinel_mgrs_tile}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 my-2 text-xs">
        <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
          <span className="text-slate-500 block text-[10px]">Optical Smoke Occlusion</span>
          <span className={`font-mono font-bold ${imagery.post_incident.smoke_occlusion_pct > 50 ? 'text-amber-400' : 'text-slate-200'}`}>
            {imagery.post_incident.smoke_occlusion_pct}% Dense Plume
          </span>
        </div>
        <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
          <span className="text-slate-500 block text-[10px]">SWIR Band 12 Combustion Core</span>
          <span className={`font-mono font-bold ${imagery.post_incident.swir_fire_seat_detected ? 'text-rose-400' : 'text-emerald-400'}`}>
            {imagery.post_incident.swir_fire_seat_detected ? "🔥 Pinpointed (2.19µm)" : "Baseline"}
          </span>
        </div>
      </div>

      <div className="mt-2 text-[11px] text-slate-300 bg-slate-950/60 p-2 rounded border border-slate-800/60 italic leading-snug">
        "{imagery.spectral_analysis.domain_interpretation}"
      </div>
    </div>
  );
};
```

### B. `<SatelliteComparisonSlider />` Component
Save as `frontend/components/events/SatelliteComparisonSlider.tsx`:

```tsx
import React, { useState } from "react";
import { SlidersHorizontal } from "lucide-react";

interface ComparisonProps {
  preDate: string;
  postDate: string;
}

export const SatelliteComparisonSlider: React.FC<ComparisonProps> = ({ preDate, postDate }) => {
  const [sliderPos, setSliderPos] = useState(50);

  return (
    <div className="mt-4 p-3 rounded-lg bg-slate-900 border border-slate-800">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
        <span>Sentinel-2 Temporal Change Analysis</span>
        <span className="text-slate-500 text-[10px]">Pre-Fire Optical vs. Post-Fire SWIR</span>
      </div>

      {/* Interactive slider simulation */}
      <div className="relative w-full h-44 rounded overflow-hidden border border-slate-700 bg-slate-950">
        {/* Post-fire SWIR Fire Penetration representation */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-950 via-rose-950/40 to-slate-900">
          <div className="text-center p-2">
            <span className="inline-block w-4 h-4 rounded-full bg-rose-500 animate-ping mb-1" />
            <div className="text-xs font-bold text-rose-300">SWIR Band 12 Combustion Seat</div>
            <div className="text-[10px] text-slate-400">Post-Fire: {postDate.slice(0, 10)} (Smoke Pierced)</div>
          </div>
        </div>

        {/* Pre-fire Optical Baseline Layer (Clipped by slider) */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border-r-2 border-cyan-400 flex items-center justify-center"
          style={{ width: `${sliderPos}%` }}
        >
          <div className="text-center p-2">
            <div className="text-xs font-bold text-cyan-300">Pre-Fire Natural Baseline</div>
            <div className="text-[10px] text-slate-400">{preDate.slice(0, 10)} (Intact Facility)</div>
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPos}
          onChange={(e) => setSliderPos(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
        <span>◀ Pre-Incident (Optical B04-B03-B02)</span>
        <span>Post-Incident (SWIR B12-B8A-B04) ▶</span>
      </div>
    </div>
  );
};
```

---

## 5. Post-Merge Verification Checklist

1. [ ] Check that `GET http://localhost:8000/api/v1/imagery/layers` returns 3 layers (Sentinel-2 True Color, Sentinel-2 SWIR Fire, NASA GIBS).
2. [ ] Check that `GET http://localhost:8000/api/v1/imagery/event/{event_id}` returns full pre/post satellite comparison and MGRS grid tile.
3. [ ] Toggle the Sentinel-2 WMS overlay in Leaflet.
4. [ ] Slide the Before/After comparison slider in the event modal to view pre-fire baseline vs post-fire SWIR fire seat.
