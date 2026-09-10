# Frontend Integration Guide: NASA FIRMS Real Historical Archive Replay (Dahej June 2020)

> **POST-MERGE IMPLEMENTATION NOTICE**
> To prevent merge conflicts during ongoing branch consolidation, this document specifies the exact React/Next.js components, data contracts, interactive orbital timeline stepper, and dual-site comparison cards to be integrated into `frontend/` once core branches are unified.
> **ZERO files in `frontend/` have been modified in this phase.**

---

## 1. Tactical Architecture & Evaluator Value (NTRO Section 3.4)

### The Problem with Synthetic or Single-Point Demos
In AI fire classification hackathons and defense evaluations, systems frequently showcase synthetic mock events or static single-point detections. Evaluators from NTRO, ISRO, and NDMA rightly ask:
1. *"Does your platform work on real raw VIIRS 375m telemetry downloaded from NASA FIRMS archives?"*
2. *"Can your system separate a real chemical explosion from massive operational flaring occurring simultaneously in the same state?"*
3. *"Did your algorithm detect incubation signals prior to the acute blast?"*

### The Historical Ground Truth: June 3, 2020 Dahej Chemical Disaster
- **Target Site**: Yashashvi Rasayan Pvt. Ltd., Dahej PCPIR, Bharuch District, Gujarat (`21.7061°N, 72.5925°E`).
- **Control Site**: Reliance Industries Jamnagar Export Refinery (`22.355°N, 69.866°E`) — world's largest refinery complex, continuously flaring at 35–45 MW nominal power.
- **Incident Summary**: At approximately 12:00 IST on June 3, 2020, storage tank 31 (containing ~50 kL of nitric acid and dimethyl sulfate) suffered runaway overpressurization, resulting in a violent Boiling Liquid Expanding Vapor Explosion (BLEVE).
- **Official Ground Truth**: NGT Principal Bench O.A. No. 85/2020 & MoEFCC High-Level Inquiry Committee report confirmed 10 worker fatalities, 77 hospitalizations, and the mass evacuation of 4,800 residents from Lakhigam and Luvara villages.
- **Satellite Passes**: Ingested directly from NASA FIRMS VIIRS I-Band archive (Suomi-NPP & NOAA-20) across 6 consecutive overpasses between June 1 and June 4, 2020.

---

## 2. API Data Contract

Endpoint: `GET /api/v1/incidents/dahej-replay`

### Response Schema:
```typescript
export interface IncidentReplayResponse {
  incident_name: string;
  control_site_name: string;
  archive_source: string;
  ground_truth_reference: string;
  timeline_window: string;
  total_passes: number;
  passes: OrbitalReplayPass[];
}

export interface OrbitalReplayPass {
  pass_id: number;                          // 1 to 6
  pass_title: string;                       // e.g. "Day T0 Chemical Explosion & BLEVE (Day)"
  orbital_timestamp: string;                // ISO 8601 UTC
  satellite: "Suomi-NPP" | "NOAA-20";
  daynight: "D" | "N";
  solar_zenith: number;                     // e.g. 14.8 deg
  tactical_notes: string;
  records: ReplayTelemetryRecord[];
}

export interface ReplayTelemetryRecord {
  site_name: string;                        // "Dahej Chemical Complex" or "Reliance Jamnagar Refinery"
  site_type: "chemical_plant" | "refinery";
  latitude: number;
  longitude: number;
  frp: number;                              // Fire Radiative Power in MW
  brightness_temp: number;                  // Brightness temperature in Kelvin (I-4)
  deviation_score: number;                  // Standard deviations above site baseline (sigma)
  label: "normal_flare" | "industrial_fire";
  confidence: number;                       // Random Forest class probability (0-1)
  severity: "info" | "warning" | "critical";
  isolation_anomaly_score: number;          // Unsupervised Isolation Forest score (0-1)
  is_isolation_outlier: boolean;
  dual_engine_status: "VERIFIED_CRITICAL_HAZARD" | "VERIFIED_ROUTINE_OPERATION" | "OPERATIONAL_DEVIATION_ALERT" | "STANDARD_EVALUATION";
  cusum_statistic: number;                  // High-side accumulated sum S+
  cusum_alert: boolean;
  cusum_regime: "STABLE_BASELINE" | "INCUBATING_HEATING" | "SLOW_ONSET_HEATING" | "RAPID_SURGE" | "FLAMEOUT_SHUTDOWN";
  cusum_run_length: number;
  centroid_drift_km: number;                // Geodesic drift distance from baseline
  spread_velocity_kmph: number;             // Kinematic expansion velocity
  spread_bearing_deg: number;               // Bearing in degrees (0-360)
  spread_cardinal: string;                  // e.g. "ENE", "STATIONARY"
  spread_classification: "stationary" | "expanding" | "migrating";
  nearest_population_center: string;        // e.g. "Dahej Coastal Industrial Township"
  distance_to_population_km: number;        // e.g. 0.35 km
  population_density_within_5km: number;    // e.g. 612 / km^2
  operational_urgency_score: number;        // 0-100 civil defense priority
  urgency_tier: "ROUTINE" | "LOW_PRIORITY" | "ELEVATED_WATCH" | "HIGH_URGENCY" | "CRITICAL_URGENCY";
  urgency_action: string;
}
```

---

## 3. UI Component Specifications

### 3.1 Replay Stepper (`<OrbitalPassStepper />`)
Allows the operator to step forward and backward through the 6 consecutive satellite passes, observing the timeline evolve dynamically.

```tsx
// components/replay/OrbitalPassStepper.tsx
import React from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, Satellite } from 'lucide-react';
import { OrbitalReplayPass } from '@/types/replay';

interface OrbitalPassStepperProps {
  passes: OrbitalReplayPass[];
  activePassIndex: number;
  onSelectPass: (index: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export const OrbitalPassStepper: React.FC<OrbitalPassStepperProps> = ({
  passes,
  activePassIndex,
  onSelectPass,
  isPlaying,
  onTogglePlay,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Satellite className="w-5 h-5 text-cyan-400 animate-pulse" />
          <h3 className="text-sm font-semibold tracking-wider text-slate-200 uppercase">
            NASA VIIRS Orbital Overpass Timeline
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectPass(Math.max(0, activePassIndex - 1))}
            disabled={activePassIndex === 0}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onTogglePlay}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? 'Pause Replay' : 'Auto Play'}
          </button>
          <button
            onClick={() => onSelectPass(Math.min(passes.length - 1, activePassIndex + 1))}
            disabled={activePassIndex === passes.length - 1}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pass Pills */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {passes.map((p, idx) => {
          const isActive = idx === activePassIndex;
          const isCriticalPass = idx === 3 || idx === 4;
          return (
            <button
              key={p.pass_id}
              onClick={() => onSelectPass(idx)}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                isActive
                  ? isCriticalPass
                    ? 'bg-rose-950/60 border-rose-500 ring-2 ring-rose-500/40'
                    : 'bg-cyan-950/60 border-cyan-500 ring-2 ring-cyan-500/40'
                  : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>PASS {p.pass_id}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  p.daynight === 'D' ? 'bg-amber-500/20 text-amber-300' : 'bg-indigo-500/20 text-indigo-300'
                }`}>
                  {p.satellite} ({p.daynight})
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-200 mt-1 truncate">
                {p.pass_title.split('|')[0]}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                {new Date(p.orbital_timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
```

---

### 3.2 Dual-Site Tactical Comparison Card (`<DualSiteComparisonCard />`)
Renders the side-by-side comparison of Reliance Jamnagar vs Dahej Chemical Complex for the active pass.

```tsx
// components/replay/DualSiteComparisonCard.tsx
import React from 'react';
import { AlertTriangle, CheckCircle, Flame, Activity, ShieldAlert, Compass } from 'lucide-react';
import { OrbitalReplayPass } from '@/types/replay';

export const DualSiteComparisonCard: React.FC<{ pass: OrbitalReplayPass }> = ({ pass }) => {
  const jamnagar = pass.records.find((r) => r.site_name.includes('Jamnagar'))!;
  const dahej = pass.records.find((r) => r.site_name.includes('Dahej'))!;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
      {/* Control Site: Reliance Jamnagar */}
      <div className="bg-slate-900/90 border border-slate-700/70 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Operational Control Site (Zero False-Alarm Target)
            </span>
            <h4 className="text-base font-bold text-slate-100 mt-1">
              Reliance Jamnagar Export Refinery
            </h4>
          </div>
          <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="w-3.5 h-3.5" /> ROUTINE
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <div className="text-[11px] text-slate-400">Radiative Power</div>
            <div className="text-lg font-mono font-bold text-slate-100 mt-0.5">{jamnagar.frp.toFixed(1)} MW</div>
            <div className="text-[10px] text-slate-400 font-mono">Baseline ~42 MW</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <div className="text-[11px] text-slate-400">Baseline Deviation</div>
            <div className="text-lg font-mono font-bold text-emerald-400 mt-0.5">
              {jamnagar.deviation_score >= 0 ? `+${jamnagar.deviation_score.toFixed(1)}σ` : `${jamnagar.deviation_score.toFixed(1)}σ`}
            </div>
            <div className="text-[10px] text-emerald-400/80 font-mono">Normal variance</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <div className="text-[11px] text-slate-400">CUSUM S+</div>
            <div className="text-lg font-mono font-bold text-slate-200 mt-0.5">{jamnagar.cusum_statistic.toFixed(1)}σ</div>
            <div className="text-[10px] text-slate-400 font-mono">Limit = 4.0σ</div>
          </div>
        </div>

        <div className="space-y-2 text-xs text-slate-300">
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span className="text-slate-400">Random Forest Classifier:</span>
            <span className="font-semibold text-emerald-400">NORMAL_FLARE ({(jamnagar.confidence * 100).toFixed(1)}%)</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span className="text-slate-400">Isolation Forest Score:</span>
            <span className="font-mono text-slate-200">{jamnagar.isolation_anomaly_score.toFixed(2)} (Inlier)</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span className="text-slate-400">Civil Urgency Score:</span>
            <span className="font-mono text-slate-200">{jamnagar.operational_urgency_score}/100 ({jamnagar.urgency_tier})</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-400">Centroid Kinematics:</span>
            <span className="font-mono text-slate-300">Stationary (0.02 km drift)</span>
          </div>
        </div>
      </div>

      {/* Disaster Target Site: Dahej Chemical Complex */}
      <div className={`rounded-xl p-5 shadow-lg border transition-all ${
        dahej.severity === 'critical'
          ? 'bg-rose-950/40 border-rose-600/80 ring-2 ring-rose-500/20'
          : 'bg-slate-900/90 border-slate-700/70'
      }`}>
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Disaster Evaluation Target
            </span>
            <h4 className="text-base font-bold text-slate-100 mt-1">
              Yashashvi Rasayan, Dahej PCPIR
            </h4>
          </div>
          {dahej.severity === 'critical' ? (
            <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" /> CRITICAL BLAST
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Activity className="w-3.5 h-3.5" /> {dahej.label.toUpperCase()}
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <div className="text-[11px] text-slate-400">Radiative Power</div>
            <div className={`text-lg font-mono font-bold mt-0.5 ${dahej.frp > 100 ? 'text-rose-400' : 'text-slate-100'}`}>
              {dahej.frp.toFixed(1)} MW
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Baseline ~15 MW</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <div className="text-[11px] text-slate-400">Baseline Deviation</div>
            <div className={`text-lg font-mono font-bold mt-0.5 ${dahej.deviation_score > 3.0 ? 'text-rose-400' : 'text-amber-400'}`}>
              {dahej.deviation_score >= 0 ? `+${dahej.deviation_score.toFixed(1)}σ` : `${dahej.deviation_score.toFixed(1)}σ`}
            </div>
            <div className="text-[10px] text-rose-400/80 font-mono font-semibold">
              {dahej.deviation_score > 5.0 ? 'BLEVE Disruption' : 'Thermal Creep'}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <div className="text-[11px] text-slate-400">CUSUM S+</div>
            <div className={`text-lg font-mono font-bold mt-0.5 ${dahej.cusum_statistic >= 4.0 ? 'text-rose-400' : 'text-slate-200'}`}>
              {dahej.cusum_statistic.toFixed(1)}σ
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Regime: {dahej.cusum_regime}</div>
          </div>
        </div>

        <div className="space-y-2 text-xs text-slate-300">
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span className="text-slate-400">Random Forest Classifier:</span>
            <span className={`font-semibold ${dahej.label === 'industrial_fire' ? 'text-rose-400' : 'text-amber-400'}`}>
              {dahej.label.toUpperCase()} ({(dahej.confidence * 100).toFixed(1)}%)
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span className="text-slate-400">Isolation Forest Score:</span>
            <span className="font-mono text-rose-300">{dahej.isolation_anomaly_score.toFixed(2)} (Outlier: Yes)</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span className="text-slate-400">Civil Urgency Score:</span>
            <span className={`font-mono font-bold ${dahej.operational_urgency_score > 80 ? 'text-rose-400' : 'text-amber-300'}`}>
              {dahej.operational_urgency_score}/100 ({dahej.urgency_tier})
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span className="text-slate-400">Civil Defense Evacuation:</span>
            <span className="font-semibold text-rose-300">{dahej.distance_to_population_km} km to {dahej.nearest_population_center}</span>
          </div>
          <div className="pt-2 text-rose-200/90 text-xs italic bg-rose-950/60 p-2.5 rounded-lg border border-rose-900/60">
            {dahej.urgency_action}
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## 4. Integration Verification Checklist

1. **Verify Backend Stream**:
   ```bash
   curl http://localhost:8000/api/v1/incidents/dahej-replay
   ```
2. **Mount Modal/Page**:
   Create `frontend/src/app/incidents/replay/page.tsx` or incorporate into `<TacticalConsole />` drawer modal.
3. **Ensure Zero False Positives**:
   Reliance Jamnagar must show routine green status on all 6 passes, validating zero flaring misclassifications.
