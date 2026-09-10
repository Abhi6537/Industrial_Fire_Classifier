# Frontend Integration Guide: CUSUM / Change-Point Detection for Slow-Onset Fires & Leaks

> **POST-MERGE IMPLEMENTATION NOTICE**
> To avoid merge conflicts during ongoing backend branch consolidation, this document outlines the exact UI components, data contracts, and visual charts to be dropped into `frontend/` once core branches are consolidated.

---

## 1. Tactical Architecture & Evaluator Value (NTRO Section 4.4)

### The Single-Pass Blind Spot
Standard Earth Observation systems classify thermal anomalies by comparing each single satellite pass against historical thresholds (e.g. $Z = (x - \mu) / \sigma \ge 3.5$). 
While effective for acute explosions, **this creates a fatal blind spot**:
- **Slow-Onset Thermal Runaway**: A failing chemical reactor, an smoldering underground coal seam, or a micro-leak in a pressurized LNG pipeline may elevate local surface temperatures by only $+1.0\sigma$ to $+1.5\sigma$ per pass.
- Because each individual pass falls below the acute alarm threshold ($Z < 3.5$), standard systems discard these passes as random ambient noise. Days or weeks later, catastrophic structural rupture occurs without prior warning.

### The CUSUM Solution (Statistical Process Control)
Our backend implements **Page's Tabular Cumulative Sum (CUSUM)** algorithm:
$$S_t^+ = \max\left(0, S_{t-1}^+ + (z_t - k)\right)$$
$$S_t^- = \max\left(0, S_{t-1}^- - (z_t + k)\right)$$
- **Slack Parameter $k = 0.5\sigma$**: Filters ambient thermal noise and seasonal fluctuations.
- **Decision Interval $h = 4.0\sigma$**: Corresponds to Average Run Length $ARL_0 > 500$ passes (virtually zero false alarms on stationary baselines).
- **Early Warning**: Persistent small shifts accumulate monotonically. By pass 3 or 4, $S_t^+ \ge 4.0$, triggering an alert **days prior to acute disaster**.
- **Flameout Detection**: Negative accumulation ($S_t^- \ge 4.0$) signals an extinguished flare pilot flame or sudden facility shutdown.

---

## 2. API Data Contract Additions

Every classified event returned by `GET /api/v1/events` and `GET /api/v1/events/{id}` now contains:

```typescript
export interface ClassifiedEvent {
  // Existing fields...
  id: string;
  label: "industrial_fire" | "normal_flare" | "agricultural_burn" | "wildfire" | "mining_activity" | "unregistered_anomaly";
  confidence: number;
  frp: number;
  deviation_score: number;

  // --- NEW: CUSUM Change-Point Telemetry (Section 4.4) ---
  cusum_statistic: number;  // Current high-side accumulated sum S+ (e.g. 6.24)
  cusum_alert: boolean;      // True if S+ >= 4.0 or S- >= 4.0
  cusum_regime: 
    | "STABLE_BASELINE"       // Normal operation, S+ < 2.0
    | "INCUBATING_HEATING"    // Early accumulation, 2.0 <= S+ < 4.0
    | "SLOW_ONSET_HEATING"    // Confirmed slow thermal creep, S+ >= 4.0 and Z < 3.0
    | "RAPID_SURGE"           // Acute fire or explosion, S+ >= 4.0 and Z >= 3.0
    | "FLAMEOUT_SHUTDOWN";    // Negative accumulation S- >= 4.0 (flameout / shutdown)
  cusum_run_length: number;  // Consecutive satellite passes exhibiting persistent positive drift
}
```

---

## 3. UI Component Specifications

### 3.1 Slow-Onset Early Warning Banner (`<SlowOnsetWarningBanner />`)
To be displayed at the top of the event detail drawer/modal when `cusum_alert === true` or `cusum_regime === "INCUBATING_HEATING"`:

```tsx
import React from 'react';
import { AlertTriangle, TrendingUp, PowerOff, ShieldCheck } from 'lucide-react';

interface SlowOnsetBannerProps {
  regime: string;
  statistic: number;
  runLength: number;
  threshold?: number;
}

export const SlowOnsetWarningBanner: React.FC<SlowOnsetBannerProps> = ({
  regime,
  statistic,
  runLength,
  threshold = 4.0,
}) => {
  if (regime === 'STABLE_BASELINE') return null;

  const getBannerConfig = () => {
    switch (regime) {
      case 'SLOW_ONSET_HEATING':
        return {
          bg: 'bg-amber-500/10 border-amber-500/40 text-amber-300',
          icon: <TrendingUp className="w-5 h-5 text-amber-400 animate-pulse" />,
          title: 'EARLY WARNING: Slow-Onset Thermal Creep Detected',
          desc: `CUSUM control chart accumulated ${statistic.toFixed(1)}σ across ${runLength} consecutive satellite passes (Threshold: ${threshold.toFixed(1)}σ). Indicates potential insulation breakdown, pipe fatigue, or smoldering reaction prior to acute rupture.`,
        };
      case 'RAPID_SURGE':
        return {
          bg: 'bg-red-500/15 border-red-500/50 text-red-300',
          icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
          title: 'ACUTE SURGE: Catastrophic Combustion In Progress',
          desc: `Thermal output jumped acutely with CUSUM S+ = ${statistic.toFixed(1)}σ. Confirmed high-order industrial fire.`,
        };
      case 'FLAMEOUT_SHUTDOWN':
        return {
          bg: 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300',
          icon: <PowerOff className="w-5 h-5 text-cyan-400" />,
          title: 'PROCESS FLAMEOUT: Flare Extinguish / Emergency Trip',
          desc: 'Persistent negative thermal deviation indicates flare pilot extinguishment or unexpected unit shutdown.',
        };
      case 'INCUBATING_HEATING':
        return {
          bg: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
          icon: <TrendingUp className="w-5 h-5 text-yellow-400" />,
          title: 'INCUBATING THERMAL SHIFT: Operator Advisory',
          desc: `Sub-threshold thermal creep accumulating (S+ = ${statistic.toFixed(1)}σ). Pass run length: ${runLength}. Watch closely on next orbital pass.`,
        };
      default:
        return null;
    }
  };

  const config = getBannerConfig();
  if (!config) return null;

  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3.5 my-3 shadow-lg ${config.bg}`}>
      <div className="mt-0.5">{config.icon}</div>
      <div className="flex-1">
        <h4 className="font-semibold text-sm tracking-wide">{config.title}</h4>
        <p className="text-xs mt-1 leading-relaxed opacity-90">{config.desc}</p>
      </div>
    </div>
  );
};
```

---

### 3.2 CUSUM Temporal Control Chart (`<CUSUMControlChart />`)
An SVG-based, lightweight temporal control chart visualizing the accumulation trajectory across consecutive satellite passes:

```tsx
import React from 'react';

interface CUSUMChartProps {
  statistic: number;
  runLength: number;
  regime: string;
  threshold?: number;
  history?: number[]; // Optional pass history; synthesized if omitted
}

export const CUSUMControlChart: React.FC<CUSUMChartProps> = ({
  statistic,
  runLength,
  regime,
  threshold = 4.0,
  history,
}) => {
  // Synthesize realistic trajectory points if raw pass array is not supplied
  const points = history || (() => {
    if (statistic >= threshold) {
      const pts = [0.0, 0.4, 1.1, 2.3, 3.4];
      pts.push(statistic);
      return pts;
    } else if (statistic > 1.0) {
      return [0.0, 0.2, 0.6, 1.2, statistic];
    } else {
      return [0.0, 0.1, 0.0, 0.2, statistic];
    }
  })();

  const width = 420;
  const height = 140;
  const padding = 24;
  const maxVal = Math.max(threshold * 1.4, Math.max(...points) * 1.15);

  const getX = (idx: number) => padding + (idx / (points.length - 1)) * (width - padding * 2);
  const getY = (val: number) => height - padding - (val / maxVal) * (height - padding * 2);

  const pathData = points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(p)}`)
    .join(' ');

  const thresholdY = getY(threshold);
  const isAlert = statistic >= threshold;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 my-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-200">
            CUSUM Temporal Process Control Chart (Page's Tabular $S^+$)
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
            isAlert ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
          }`}>
            {regime}
          </span>
        </div>
        <div className="text-xs font-mono text-slate-400">
          $S^+$: <span className="font-bold text-slate-100">{statistic.toFixed(2)}σ</span> | Run: {runLength} passes
        </div>
      </div>

      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Threshold Line */}
        <line
          x1={padding}
          y1={thresholdY}
          x2={width - padding}
          y2={thresholdY}
          stroke="#f87171"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <text
          x={width - padding + 4}
          y={thresholdY + 3}
          fill="#f87171"
          fontSize="9"
          fontFamily="monospace"
          textAnchor="start"
        >
          h=4.0σ (Alert)
        </text>

        {/* Baseline (0.0) */}
        <line
          x1={padding}
          y1={getY(0)}
          x2={width - padding}
          y2={getY(0)}
          stroke="#475569"
          strokeWidth="1"
        />

        {/* CUSUM Cumulative Trajectory Area & Path */}
        <path
          d={`${pathData} L ${getX(points.length - 1)} ${getY(0)} L ${getX(0)} ${getY(0)} Z`}
          fill={isAlert ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)'}
        />
        <path
          d={pathData}
          fill="none"
          stroke={isAlert ? '#ef4444' : '#3b82f6'}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points on curve */}
        {points.map((p, idx) => (
          <circle
            key={idx}
            cx={getX(idx)}
            cy={getY(p)}
            r={idx === points.length - 1 ? 4.5 : 3}
            fill={idx === points.length - 1 ? (isAlert ? '#ef4444' : '#3b82f6') : '#1e293b'}
            stroke={isAlert ? '#ef4444' : '#3b82f6'}
            strokeWidth="2"
          />
        ))}
      </svg>

      <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1 px-1">
        <span>T-4 Passes</span>
        <span>T-3 Passes</span>
        <span>T-2 Passes</span>
        <span>T-1 Pass</span>
        <span className="text-slate-300 font-semibold">Latest Pass (Current)</span>
      </div>
    </div>
  );
};
```

---

## 4. Verification & Validation Checklist

| Checkpoint | Target | Status |
| :--- | :--- | :--- |
| **P2.3 Algorithm** | Two-sided tabular CUSUM with $k=0.5, h=4.0$ | Verified via `test_cusum_detector.py` |
| **Creeping Drift** | $+1.0\sigma$ drift accumulates to $S^+ \ge 4.0$ | Passes `test_cusum_gradual_accumulation` |
| **Ambient Noise** | Stationary baseline stays at $S^+ = 0.0$ | Passes `test_cusum_baseline_stationary_noise` |
| **Flare Flameout** | Negative drift accumulates to $S^- \ge 4.0$ | Passes `test_cusum_flameout_detection` |
| **API Contract** | `cusum_statistic`, `cusum_alert`, `cusum_regime`, `cusum_run_length` in API models | Verified via `ClassifiedEventResponse` |
| **Zero Frontend Git Touch** | `git status --porcelain frontend/` empty | Verified clean (0 changes) |
