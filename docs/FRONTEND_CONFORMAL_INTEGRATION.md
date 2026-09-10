# Frontend Integration Guide: Conformal Prediction Uncertainty Sets (P3.1 Milestone)

> **POST-MERGE IMPLEMENTATION NOTICE**
> To avoid merge conflicts during ongoing backend branch consolidation, this document outlines the exact UI components, data contracts, and visual uncertainty set cards to be dropped into `frontend/` once core branches are consolidated.
> **ZERO files in `frontend/` were modified in this phase.**

---

## 1. Tactical Architecture & Evaluator Value (NTRO Section 3.1)

### The Point-Prediction Blind Spot
Standard multi-class machine learning models output soft probabilities ($p \in [0, 1]$) and choose the argmax class.
In defense operations and industrial disaster monitoring, this creates catastrophic vulnerabilities:
- Suppose an observation at an industrial chemical terminal yields:
  - $p(\text{normal\_flare}) = 0.51$
  - $p(\text{industrial\_fire}) = 0.49$
- An argmax classifier labels this event as **"NORMAL_FLARE"** and logs it as routine.
- A human operator never looks at it, and a severe chemical tank runaway is missed.

### The Conformal Prediction Solution
Our backend implements **Split Conformal Classification** using Least Ambiguous set-valued Classifier (LAC) nonconformity scores ($s_i = 1 - \hat{\pi}(y_i \mid x_i)$):
$$\mathbb{P}\left(Y_{\text{test}} \in C_\alpha(X_{\text{test}})\right) \ge 1 - \alpha$$
- **Finite-Sample Mathematical Guarantee**: Calibrated on real NASA FIRMS VIIRS satellite passes across India, guaranteed distribution-free under exchangeability.
- **Coverage Levels**: $\alpha = 0.10$ provides guaranteed 90% confidence; $\alpha = 0.05$ provides guaranteed 95% confidence.
- **Triage Implications**:
  1. **Singleton Set ($|C_\alpha| = 1$, e.g., `["normal_flare"]`)**: Unambiguous classification. All other 5 classes are mathematically excluded at 90% confidence.
  2. **Multi-Label Ambiguous Set ($|C_\alpha| > 1$, e.g., `["normal_flare", "industrial_fire"]`)**: **Critical Triage Alert**. Even if `normal_flare` has a slightly higher point probability, the system proves that `industrial_fire` cannot be excluded at 90% confidence, triggering automated secondary review!
  3. **Empty Set ($|C_\alpha| = 0$)**: Extreme out-of-distribution anomaly, signaling an unprecedented observation.

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

  // --- NEW: Conformal Prediction Uncertainty Sets (P3.1) ---
  conformal_prediction_set: string[];      // e.g. ["normal_flare"] or ["normal_flare", "industrial_fire"]
  conformal_confidence_level: number;     // e.g. 0.90 (90% mathematical coverage guarantee)
  conformal_set_size: number;              // Number of candidate classes in uncertainty set (1, 2, ...)
  is_conformal_single_class: boolean;      // True if set_size === 1 (statistically unambiguous)
  is_conformal_ambiguous: boolean;         // True if set_size > 1 (statistically ambiguous)
}
```

---

## 3. UI Component Specifications

### 3.1 Conformal Uncertainty Badge (`<ConformalSetBadge />`)
Renders next to the primary label in event lists, map pins, and detail headers:

```tsx
// components/conformal/ConformalSetBadge.tsx
import React from 'react';
import { ShieldCheck, AlertCircle, HelpCircle } from 'lucide-react';

interface ConformalSetBadgeProps {
  predictionSet: string[];
  confidenceLevel: number;
  isSingleClass: boolean;
  isAmbiguous: boolean;
}

export const ConformalSetBadge: React.FC<ConformalSetBadgeProps> = ({
  predictionSet,
  confidenceLevel,
  isSingleClass,
  isAmbiguous,
}) => {
  const coveragePct = Math.round(confidenceLevel * 100);
  const containsFire = predictionSet.includes('industrial_fire');

  if (isSingleClass) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
        <ShieldCheck className="w-3.5 h-3.5" />
        {coveragePct}% Guarantee: Single-Class ({predictionSet[0].replace('_', ' ')})
      </span>
    );
  }

  if (isAmbiguous && containsFire) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
        <AlertCircle className="w-3.5 h-3.5" />
        {coveragePct}% Ambiguity: Fire Not Ruled Out ({predictionSet.length} classes)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30">
      <HelpCircle className="w-3.5 h-3.5" />
      {coveragePct}% Uncertainty Set ({predictionSet.length} candidate classes)
    </span>
  );
};
```

---

### 3.2 Conformal Uncertainty Card (`<UncertaintySetCard />`)
Displays the candidate classes with probability threshold breakdown inside the event inspector drawer:

```tsx
// components/conformal/UncertaintySetCard.tsx
import React from 'react';
import { Shield, Info } from 'lucide-react';

interface UncertaintySetCardProps {
  predictionSet: string[];
  confidenceLevel: number;
  isAmbiguous: boolean;
  primaryLabel: string;
}

export const UncertaintySetCard: React.FC<UncertaintySetCardProps> = ({
  predictionSet,
  confidenceLevel,
  isAmbiguous,
  primaryLabel,
}) => {
  const coveragePct = Math.round(confidenceLevel * 100);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg my-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Conformal Prediction Guarantee ({coveragePct}% Coverage)
          </h4>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          Finite-Sample LAC
        </span>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-slate-300">
          The true ground-truth class is mathematically guaranteed to reside inside this set with at least{' '}
          <strong className="text-cyan-300">{coveragePct}% probability</strong>:
        </p>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {predictionSet.map((cls) => {
            const isPrimary = cls === primaryLabel;
            const isHazard = cls === 'industrial_fire';
            return (
              <span
                key={cls}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border ${
                  isHazard
                    ? 'bg-rose-950/60 border-rose-500/70 text-rose-300 font-bold'
                    : isPrimary
                    ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                {cls.replace('_', ' ').toUpperCase()} {isPrimary && '(Primary)'}
              </span>
            );
          })}
        </div>

        {isAmbiguous && predictionSet.includes('industrial_fire') && primaryLabel !== 'industrial_fire' && (
          <div className="mt-3 p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-2">
            <Info className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Safety Triage Alert:</strong> Primary prediction is{' '}
              <span className="font-mono">{primaryLabel}</span>, but statistical evidence cannot rule out an{' '}
              <span className="font-mono text-rose-300 font-bold">industrial_fire</span> at the {coveragePct}%
              confidence level. Elevated operator review is mandatory.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

## 4. Integration Verification Checklist

1. **Verify Backend Prediction Output**:
   ```bash
   curl -X POST http://localhost:8000/api/v1/classify \
     -H "Content-Type: application/json" \
     -d '{"latitude": 21.706, "longitude": 72.592, "frp": 192.6, "brightness_temp": 426.5}'
   ```
2. **Confirm Schema Attributes**:
   Response must include `conformal_prediction_set`, `conformal_confidence_level`, `conformal_set_size`, `is_conformal_single_class`, `is_conformal_ambiguous`.
3. **Inspect Frontend Card**:
   Render `<UncertaintySetCard />` inside the event details drawer.
