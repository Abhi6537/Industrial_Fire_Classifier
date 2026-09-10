# Frontend Integration Guide: India Contextual Intelligence & Operational Urgency Scoring

> **POST-MERGE IMPLEMENTATION NOTICE**
> To avoid merge conflicts during ongoing branch consolidation, this document provides the exact React UI components, visual urgency dials, population impact cards, and data contracts to be dropped into `frontend/` once core branches are consolidated.

---

## 1. Tactical Architecture & Evaluator Value (NTRO Section 4.5)

### The India-Specific Problem Space
Global wildfire and industrial monitoring platforms suffer from high false-alarm rates when deployed over the Indian subcontinent because they ignore two fundamental local realities:
1. **Seasonal Crop Residue Burning (Punjab, Haryana, Western UP, Indo-Gangetic Plain)**:
   - **Kharif Season (Paddy/Stubble Burning)**: October 1 – November 30.
   - **Rabi Season (Wheat/Crop Burning)**: April 1 – May 15.
   - Without calendar and geographic boundary awareness, systems confuse widespread agricultural sweeps with industrial emergencies, overwhelming emergency dispatchers.
2. **Population Proximity & Civil Defense Urgency**:
   - As emphasized by senior defense evaluators:
     > *"A fire at a remote open-cast mine vs. a fire at a petrochemical complex 2 km from a city hospital have completely different urgency profiles."*
   - An industrial fire with toxic chemical inventory spreading towards a dense urban settlement (e.g. Bharuch, Dahej, Surat) warrants immediate Tier-1 National Disaster Management Authority (NDMA) evacuation, whereas an isolated flare does not.

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

  // --- NEW: India Contextual Intelligence & Urgency (Section 4.5) ---
  is_stubble_season: boolean;             // True if detection falls within active agro-burning calendar
  seasonal_context_label: string;         // e.g. "Active Kharif Paddy Stubble Burn Window (Punjab/Haryana/UP)"
  population_density_within_5km: number;  // Estimated density in persons/km² (e.g. 2850)
  distance_to_population_km: number;      // Geodesic distance to closest urban settlement (e.g. 4.2 km)
  nearest_population_center: string;      // Name of settlement (e.g. "Bharuch Urban Agglomeration")
  operational_urgency_score: number;      // Composite civil defense urgency index [1, 100]
  urgency_tier: 
    | "CRITICAL_URGENCY"    // Score >= 80: Immediate Tier-1 civil defense & evacuation advisory
    | "ELEVATED_URGENCY"    // Score 55-79: Dispatch fire tender units & standby protocols
    | "MONITORED_ADVISORY"   // Score 30-54: Automated orbital surveillance tracking
    | "ROUTINE_BASELINE";   // Score < 30: Routine logging, no civil action required
}
```

---

## 3. Turnkey React Components (Ready for Post-Merge Drop-In)

### 3.1 Operational Urgency Badge & Dial (`<OperationalUrgencyBadge />`)
A high-visibility triage badge for event headers and map popups:

```tsx
import React from 'react';
import { ShieldAlert, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

interface UrgencyBadgeProps {
  score: number;
  tier: string;
  showScore?: boolean;
}

export const OperationalUrgencyBadge: React.FC<UrgencyBadgeProps> = ({
  score,
  tier,
  showScore = true,
}) => {
  const getBadgeConfig = () => {
    switch (tier) {
      case 'CRITICAL_URGENCY':
        return {
          bg: 'bg-red-500/20 text-red-300 border-red-500/50 shadow-red-500/20',
          dot: 'bg-red-500 animate-ping',
          icon: <ShieldAlert className="w-4 h-4 text-red-400" />,
          label: 'CRITICAL CIVIL DEFENSE',
        };
      case 'ELEVATED_URGENCY':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-500/20',
          dot: 'bg-amber-400',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
          label: 'ELEVATED RESPONSE',
        };
      case 'MONITORED_ADVISORY':
        return {
          bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          dot: 'bg-blue-400',
          icon: <Info className="w-4 h-4 text-blue-400" />,
          label: 'MONITORED ADVISORY',
        };
      case 'ROUTINE_BASELINE':
      default:
        return {
          bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          dot: 'bg-emerald-400',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          label: 'ROUTINE OPERATION',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono font-bold shadow-sm ${config.bg}`}>
      <span className="relative flex h-2 w-2">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dot}`} />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot.split(' ')[0]}`} />
      </span>
      {config.icon}
      <span>{config.label}</span>
      {showScore && (
        <span className="ml-1 pl-2 border-l border-white/20 font-sans font-black">
          {score}/100
        </span>
      )}
    </div>
  );
};
```

---

### 3.2 Population Proximity & Vulnerability Card (`<PopulationProximityCard />`)
Visualizes settlement distance, local density, and hospital proximity in the event detail drawer:

```tsx
import React from 'react';
import { Users, Building2, Hospital, Navigation } from 'lucide-react';

interface PopulationCardProps {
  nearestCenter: string;
  distanceKm: number;
  densityWithin5km: number;
  hasHospitalNearby?: boolean;
}

export const PopulationProximityCard: React.FC<PopulationCardProps> = ({
  nearestCenter,
  distanceKm,
  densityWithin5km,
  hasHospitalNearby = false,
}) => {
  const isHighThreat = distanceKm <= 5.0 && densityWithin5km >= 1500;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 my-3 text-slate-200">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-400" />
          <h4 className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
            Population & Civil Infrastructure Exposure
          </h4>
        </div>
        {isHighThreat && (
          <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.5 rounded font-mono font-bold">
            HIGH EXPOSURE ZONE
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        {/* Nearest Center */}
        <div className="bg-slate-800/50 rounded-lg p-2.5">
          <span className="text-[10px] text-slate-400 block mb-0.5">Nearest Urban Center</span>
          <span className="font-semibold text-slate-100 flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-blue-400" />
            {nearestCenter}
          </span>
        </div>

        {/* Distance */}
        <div className="bg-slate-800/50 rounded-lg p-2.5">
          <span className="text-[10px] text-slate-400 block mb-0.5">Buffer Distance</span>
          <span className={`font-mono font-bold text-sm ${distanceKm <= 5.0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {distanceKm.toFixed(1)} km
          </span>
        </div>

        {/* Population Density */}
        <div className="bg-slate-800/50 rounded-lg p-2.5">
          <span className="text-[10px] text-slate-400 block mb-0.5">Density (5km Radius)</span>
          <span className="font-mono font-semibold text-slate-100 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            {densityWithin5km.toLocaleString()} /km²
          </span>
        </div>

        {/* Hospital Facility */}
        <div className="bg-slate-800/50 rounded-lg p-2.5">
          <span className="text-[10px] text-slate-400 block mb-0.5">Healthcare Proximity</span>
          <span className="font-semibold flex items-center gap-1.5 text-xs">
            <Hospital className={`w-3.5 h-3.5 ${hasHospitalNearby ? 'text-emerald-400' : 'text-slate-500'}`} />
            {hasHospitalNearby ? 'Major Civil Hospital Within Buffer' : 'No Critical Facility Within 5km'}
          </span>
        </div>
      </div>
    </div>
  );
};
```

---

### 3.3 Seasonal Agro-Calendar Banner (`<SeasonalAgroCalendarBanner />`)
To be displayed when agricultural burn events occur during the post-harvest burning window:

```tsx
import React from 'react';
import { Calendar, Sprout, ShieldCheck } from 'lucide-react';

interface SeasonalBannerProps {
  isStubbleSeason: boolean;
  contextLabel: string;
}

export const SeasonalAgroCalendarBanner: React.FC<SeasonalBannerProps> = ({
  isStubbleSeason,
  contextLabel,
}) => {
  if (!isStubbleSeason) return null;

  return (
    <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 flex items-start gap-3 my-2.5 shadow-sm">
      <Sprout className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
      <div className="text-xs">
        <div className="font-semibold flex items-center gap-2">
          <span>{contextLabel}</span>
          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">
            CONFIRMED AGRO CYCLE
          </span>
        </div>
        <p className="text-[11px] opacity-85 mt-0.5 leading-relaxed">
          Thermal signature corresponds with India's regional post-harvest residue clearing calendar. Suppressed from industrial emergency escalation.
        </p>
      </div>
    </div>
  );
};
```

---

## 4. Verification & Validation Checklist

| Checkpoint | Requirement | Status |
| :--- | :--- | :--- |
| **Seasonal Window** | Kharif (Oct-Nov) & Rabi (Apr-May) correctly flagged | Verified via `test_context_intelligence.py` |
| **Off-Season Filter** | Monsoon/Winter non-crop periods flagged as baseline | Passes `test_seasonal_calendar_off_season` |
| **Population Proximity** | Dahej/Bharuch, Surat, Jamnagar, Panipat indexed | Passes `test_population_proximity_resolution` |
| **Urgency Index** | Chemical fire near Bharuch yields $U \ge 80$ (Critical) | Passes `test_operational_urgency_scoring` |
| **Flare Suppression** | Routine flare yields $U \le 24$ (Routine Baseline) | Passes `test_operational_urgency_scoring` |
| **Zero Frontend Direct Edits** | `git status --porcelain frontend/` empty | Verified clean (0 changes) |
