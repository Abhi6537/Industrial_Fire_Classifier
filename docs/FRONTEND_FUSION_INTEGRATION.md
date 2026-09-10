# Frontend Integration Guide: Dempster-Shafer Multi-Sensor Evidential Fusion (P3.2 Milestone)

> **POST-MERGE IMPLEMENTATION NOTICE**
> To prevent merge conflicts during ongoing backend consolidation, this document specifies the exact React/Next.js components, data contracts, and evidential fusion cards to be integrated into `frontend/` once branches are merged.
> **ZERO files in `frontend/` were modified in this phase.**

---

## 1. Tactical Architecture & Evaluator Value (NTRO Section 3.2)

### Why Simple Weighted Averages Fail in Defense Intelligence
Standard multi-modal architectures combine predictions using heuristic linear combinations (e.g. $0.4 \cdot \text{ML} + 0.3 \cdot \text{GIS} + 0.3 \cdot \text{Rules}$).
This causes dangerous failures when sensor inputs contradict one another:
- Suppose VIIRS detects a severe 180 MW hotspot at an offshore location, but the VNF flare catalog reports zero registered flaring infrastructure, and the ESA land cover raster identifies open water/wetlands.
- A weighted average produces a mediocre, washed-out score (~50%) that fails to trigger emergency alarms.
- In reality, an intense fire over open water or wetland signifies an **unmodeled pipeline rupture, maritime tanker collision, or offshore oil rig blowout**.

### The Dempster-Shafer Evidential Fusion Solution
Our backend implements **Dempster-Shafer Theory (DST) and Transferable Belief Models (TBM)** over the frame of discernment $\Omega = \{\text{FIRE}, \text{FLARE}, \text{OTHER}\}$:
1. **Explicit Epistemic Uncertainty ($\Theta = \Omega$)**: Models sensor ignorance when data is missing or degraded (e.g. cloud obscuration).
2. **Belief Lower Bound ($\text{Bel}(A)$)**: The minimum degree of belief strictly committed to a hypothesis based on hard physical evidence.
3. **Plausibility Upper Bound ($\text{Pl}(A)$)**: The maximum potential belief that cannot be refuted by available evidence.
4. **Inter-Sensor Conflict Metric ($K \in [0, 1]$)**: Direct mathematical measure of sensor dissonance:
   $$K = \sum_{B \cap C = \emptyset} m_1(B) m_2(C)$$
   When $K \ge 0.65$, the system triggers `HIGH_CONFLICT_ANOMALY`, alerting intelligence analysts to an unprecedented event.

---

## 2. API Data Contract Additions

Every classified event returned by `GET /api/v1/events` and `GET /api/v1/events/{id}` contains:

```typescript
export interface ClassifiedEvent {
  // Existing fields...
  id: string;
  label: "industrial_fire" | "normal_flare" | "agricultural_burn" | "wildfire" | "mining_activity" | "unregistered_anomaly";
  confidence: number;
  frp: number;
  deviation_score: number;

  // --- NEW: Multi-Sensor Evidential Fusion (P3.2) ---
  fused_hazard_probability: number;       // Fused Pignistic BetP(FIRE) [0.0 to 1.0]
  fused_flare_probability: number;        // Fused Pignistic BetP(FLARE) [0.0 to 1.0]
  belief_fire: number;                    // Lower bound of certainty Bel(FIRE) [0.0 to 1.0]
  plausibility_fire: number;              // Upper bound of certainty Pl(FIRE) [0.0 to 1.0]
  sensor_conflict_k: number;              // Inter-sensor conflict coefficient K [0.0 to 1.0]
  fusion_verdict:                         // Evidential decision verdict
    | "CONFIRMED_INDUSTRIAL_FIRE"
    | "VERIFIED_ROUTINE_FLARE"
    | "SEASONAL_OR_VEGETATION"
    | "HIGH_CONFLICT_ANOMALY"
    | "AMBIGUOUS_EVIDENTIAL_STATE"
    | "STANDARD_EVALUATION";
}
```

---

## 3. UI Component Specifications

### 3.1 Evidential Fusion Card (`<EvidentialFusionCard />`)
Displays the fused decision, belief-plausibility interval bar, and sensor conflict indicator inside the event details drawer:

```tsx
// components/fusion/EvidentialFusionCard.tsx
import React from 'react';
import { ShieldCheck, AlertOctagon, Flame, Layers, AlertTriangle } from 'lucide-react';

interface EvidentialFusionCardProps {
  fusedHazardProb: number;
  fusedFlareProb: number;
  beliefFire: number;
  plausibilityFire: number;
  conflictK: number;
  fusionVerdict: string;
}

export const EvidentialFusionCard: React.FC<EvidentialFusionCardProps> = ({
  fusedHazardProb,
  fusedFlareProb,
  beliefFire,
  plausibilityFire,
  conflictK,
  fusionVerdict,
}) => {
  const isHighConflict = conflictK >= 0.65;
  const isConfirmedFire = fusionVerdict === 'CONFIRMED_INDUSTRIAL_FIRE';
  const isRoutineFlare = fusionVerdict === 'VERIFIED_ROUTINE_FLARE';

  return (
    <div className={`border rounded-xl p-4 shadow-lg my-3 ${
      isHighConflict
        ? 'bg-amber-950/40 border-amber-500/80 ring-2 ring-amber-500/20'
        : isConfirmedFire
        ? 'bg-rose-950/40 border-rose-500/80 ring-2 ring-rose-500/20'
        : 'bg-slate-900 border-slate-800'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Dempster-Shafer Multi-Sensor Evidential Fusion
          </h4>
        </div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
          isHighConflict
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
            : isConfirmedFire
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            : isRoutineFlare
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            : 'bg-slate-800 text-slate-300 border-slate-700'
        }`}>
          {fusionVerdict.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Probabilities & Belief-Plausibility Interval */}
      <div className="grid grid-cols-3 gap-2.5 mb-3">
        <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
          <div className="text-[10px] text-slate-400">Fused Fire Prob</div>
          <div className={`text-base font-mono font-bold mt-0.5 ${isConfirmedFire ? 'text-rose-400' : 'text-slate-100'}`}>
            {(fusedHazardProb * 100).toFixed(1)}%
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
          <div className="text-[10px] text-slate-400">Fused Flare Prob</div>
          <div className={`text-base font-mono font-bold mt-0.5 ${isRoutineFlare ? 'text-emerald-400' : 'text-slate-100'}`}>
            {(fusedFlareProb * 100).toFixed(1)}%
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
          <div className="text-[10px] text-slate-400">Sensor Conflict (K)</div>
          <div className={`text-base font-mono font-bold mt-0.5 ${isHighConflict ? 'text-amber-400 font-black' : 'text-slate-300'}`}>
            {conflictK.toFixed(3)}
          </div>
        </div>
      </div>

      {/* Uncertainty Interval Visualizer */}
      <div className="space-y-1.5 text-xs text-slate-300">
        <div className="flex justify-between text-[11px]">
          <span className="text-slate-400">Certainty Interval [Bel, Pl]:</span>
          <span className="font-mono text-cyan-300">
            [{(beliefFire * 100).toFixed(1)}%, {(plausibilityFire * 100).toFixed(1)}%]
          </span>
        </div>

        {/* Dual-thumb Interval Bar */}
        <div className="w-full bg-slate-800 h-2.5 rounded-full relative overflow-hidden">
          <div
            className="absolute top-0 bottom-0 bg-rose-500/40 rounded-full"
            style={{
              left: `${beliefFire * 100}%`,
              width: `${Math.max(2, (plausibilityFire - beliefFire) * 100)}%`,
            }}
          />
          <div
            className="absolute top-0 bottom-0 bg-rose-500 rounded-full"
            style={{ width: `${beliefFire * 100}%` }}
          />
        </div>
      </div>

      {/* High Conflict Alert Warning */}
      {isHighConflict && (
        <div className="mt-3 p-2.5 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-200 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <strong>High Dissonance Warning (K = {conflictK.toFixed(2)}):</strong> Satellite sensors strongly
            contradict one another (e.g. massive thermal signature over protected terrain without flaring registry).
            Sensor hardware failure or unmodeled disaster underway.
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## 4. Integration Verification Checklist

1. **Verify Backend Endpoint**:
   ```bash
   curl -X POST http://localhost:8000/api/v1/classify \
     -H "Content-Type: application/json" \
     -d '{"latitude": 21.706, "longitude": 72.592, "frp": 192.6, "brightness_temp": 426.5}'
   ```
2. **Verify Response Attributes**:
   Response includes `fused_hazard_probability`, `belief_fire`, `plausibility_fire`, `sensor_conflict_k`, `fusion_verdict`.
3. **Mount Evidential Card**:
   Render `<EvidentialFusionCard />` inside the event detail drawer.
