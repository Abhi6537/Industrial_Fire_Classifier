# Frontend Integration Guide: Dual-Engine AI & Isolation Forest Unsupervised Anomaly Layer

> **POST-MERGE IMPLEMENTATION NOTICE**
> To avoid merge conflicts during ongoing branch integration, this specification outlines the exact UI components, dual-engine badges, anomaly dials, and data contracts to be implemented in `frontend/` once core branches are consolidated.

---

## 1. Tactical Architecture & Evaluator Value (NTRO Section 5.1)

Standard satellite monitoring systems rely exclusively on **supervised classification** (e.g. Random Forest, XGBoost). While accurate for known classes (`industrial_fire`, `normal_flare`, `agricultural_burn`), supervised models have a critical weakness:
> **The Closed-World Assumption**: If an unprecedented disaster occurs (a multi-tank chemical BLEVE, pipeline sabotage, or novel exothermic reaction), a supervised model forces the observation into known historical classes.

Our platform introduces a **Dual-Engine Hybrid AI Architecture**:
1. **Engine A (Supervised Ensemble)**: Evaluates multi-class probability distributions, assigning tactical category (`industrial_fire` at 94.2%).
2. **Engine B (Unsupervised Isolation Forest)**: Evaluates structural tree path lengths $h(x)$ across high-dimensional feature space without needing historical labels.
3. **Consensus & Discrepancy Matrix**:
   - **Both Agree (`industrial_fire` + Anomaly Score $\ge 0.65$)**: `VERIFIED_CRITICAL_HAZARD` (P1 Alert).
   - **Both Agree (`normal_flare` + Anomaly Score $< 0.45$)**: `VERIFIED_ROUTINE_OPERATION` (Silent/Suppressed).
   - **Discrepancy (`normal_flare` + Anomaly Score $\ge 0.65$)**: `OPERATIONAL_DEVIATION_ALERT` (Flare stack operating far outside safe engineering envelope).
   - **Extreme Novelty (Anomaly Score $\ge 0.80$)**: `UNKNOWN_UNKNOWN_NOVELTY` (Flagged for urgent aerial imagery audit).

---

## 2. API Data Contract Additions

Every classified event from `GET /api/v1/events` and `GET /api/v1/events/{id}` now includes:

```typescript
export interface ClassifiedEvent {
  // Existing fields...
  id: string;
  label: "industrial_fire" | "normal_flare" | "agricultural_burn" | "wildfire" | "mining_activity" | "unregistered_anomaly";
  confidence: number;

  // --- NEW: Unsupervised Isolation Forest Engine B ---
  isolation_anomaly_score: number;  // 0.0 to 1.0 (continuous anomaly score)
  is_isolation_outlier: boolean;    // true if score >= 0.60
  dual_engine_status:
    | "VERIFIED_CRITICAL_HAZARD"
    | "VERIFIED_ROUTINE_OPERATION"
    | "OPERATIONAL_DEVIATION_ALERT"
    | "ANOMALOUS_THERMAL_SURGE"
    | "UNKNOWN_UNKNOWN_NOVELTY"
    | "STANDARD_EVALUATION";
}
```

---

## 3. UI Components

### A. `<DualEngineBadge />` Component
Save as `frontend/components/events/DualEngineBadge.tsx`:

```tsx
import React from "react";
import { Cpu, ShieldAlert, CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";

interface DualEngineBadgeProps {
  status: string;
  supervisedLabel: string;
  supervisedConfidence: number;
  isolationScore: number;
}

export const DualEngineBadge: React.FC<DualEngineBadgeProps> = ({
  status,
  supervisedLabel,
  supervisedConfidence,
  isolationScore,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case "VERIFIED_CRITICAL_HAZARD":
        return {
          bg: "bg-rose-950/80 border-rose-700 text-rose-300",
          icon: ShieldAlert,
          label: "Dual-Engine: Critical Hazard",
        };
      case "OPERATIONAL_DEVIATION_ALERT":
        return {
          bg: "bg-amber-950/80 border-amber-600 text-amber-300",
          icon: AlertTriangle,
          label: "Flaring Envelope Anomaly",
        };
      case "VERIFIED_ROUTINE_OPERATION":
        return {
          bg: "bg-emerald-950/80 border-emerald-700 text-emerald-300",
          icon: CheckCircle2,
          label: "Dual-Engine: Routine Flare",
        };
      case "UNKNOWN_UNKNOWN_NOVELTY":
        return {
          bg: "bg-purple-950/80 border-purple-600 text-purple-300",
          icon: HelpCircle,
          label: "Novel Structural Outlier",
        };
      default:
        return {
          bg: "bg-slate-900 border-slate-700 text-slate-300",
          icon: Cpu,
          label: "Dual-Engine Verified",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`inline-flex flex-col gap-1 p-2 rounded-lg border text-xs ${config.bg}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-bold">
          <Icon className="w-4 h-4" />
          <span>{config.label}</span>
        </div>
        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/40 border border-white/10">
          iForest Score: {isolationScore.toFixed(2)}
        </span>
      </div>

      <div className="flex items-center gap-3 text-[11px] opacity-90 font-mono mt-0.5">
        <span>Engine A (RF): {(supervisedConfidence * 100).toFixed(1)}%</span>
        <span>•</span>
        <span>Engine B (iForest): {isolationScore >= 0.60 ? "OUTLIER" : "INLIER"}</span>
      </div>
    </div>
  );
};
```

### B. `<IsolationAnomalyDial />` Component
Save as `frontend/components/events/IsolationAnomalyDial.tsx`:

```tsx
import React from "react";

interface AnomalyDialProps {
  score: number;
}

export const IsolationAnomalyDial: React.FC<AnomalyDialProps> = ({ score }) => {
  const percentage = Math.min(Math.max(score * 100, 0), 100);
  const isHigh = score >= 0.65;
  const isModerate = score >= 0.50 && score < 0.65;

  const strokeColor = isHigh ? "#f43f5e" : isModerate ? "#f59e0b" : "#10b981";

  return (
    <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Unsupervised Isolation Anomaly Index
        </span>
        <span
          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border"
          style={{
            color: strokeColor,
            backgroundColor: `${strokeColor}15`,
            borderColor: `${strokeColor}40`,
          }}
        >
          {isHigh ? "STRUCTURAL OUTLIER" : isModerate ? "ELEVATED" : "NORMAL BASELINE"}
        </span>
      </div>

      {/* Progress Bar with Threshold Markers */}
      <div className="relative w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
        <div
          className="h-full transition-all duration-500 rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: strokeColor,
          }}
        />
        {/* Safe vs Anomaly threshold line at 60% */}
        <div className="absolute top-0 bottom-0 left-[60%] w-0.5 bg-rose-500/60" title="Outlier Threshold (0.60)" />
      </div>

      <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-1">
        <span>0.0 (Baseline Flaring)</span>
        <span className="text-rose-400">0.60 (Outlier Threshold)</span>
        <span>1.0 (Severe Novelty)</span>
      </div>

      <div className="mt-2 text-[11px] text-slate-400 leading-snug">
        Tree path length analysis confirms this hotspot is isolated in{" "}
        <strong className="text-slate-200">
          {score >= 0.65 ? "extremely shallow decision branches" : "deep baseline clusters"}
        </strong>
        , indicating {score >= 0.65 ? "unprecedented thermal magnitude" : "routine operational recurrence"}.
      </div>
    </div>
  );
};
```

---

## 4. Post-Merge Verification Checklist

1. [ ] Check that `GET http://localhost:8000/api/v1/events` returns `isolation_anomaly_score`, `is_isolation_outlier`, and `dual_engine_status`.
2. [ ] Verify that Dahej explosion displays `VERIFIED_CRITICAL_HAZARD` with score $\ge 0.85$.
3. [ ] Verify that Jamnagar refinery flare displays `VERIFIED_ROUTINE_OPERATION` with score $< 0.45$.
4. [ ] Mount `<DualEngineBadge />` and `<IsolationAnomalyDial />` inside the event inspector card.
