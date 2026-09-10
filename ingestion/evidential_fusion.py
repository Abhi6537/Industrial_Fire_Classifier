"""
Multi-Sensor Evidential Fusion Engine
Dempster-Shafer Theory (DST) & Transferable Belief Model for Defense Intelligence
NTRO Industrial Fire Detection & Classification System (P3.2 Milestone)

Fuses disparate Earth observation data sources over Frame of Discernment:
    Omega = {FIRE, FLARE, OTHER}
where:
    FIRE  = Industrial Disaster / Acute Rupture
    FLARE = Routine Operational Gas Flaring
    OTHER = Stubble Burn / Wildfire / Mining / Ambient Noise

Provides:
- Basic Belief Assignments (m_i) per sensor layer
- Exact Dempster Combination with conflict metric K
- Belief lower bound (Bel) and Plausibility upper bound (Pl)
- Pignistic Probability Transform (BetP)
- Inter-sensor dissonance / conflict detection (K >= 0.60)
"""

import math
import logging
from typing import Dict, Any, List, Tuple, Set, Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("evidential_fusion")

# Focal elements of the power set 2^Omega
ELEMENTS = ("FIRE", "FLARE", "OTHER")


class EvidentialMassFunction:
    """
    Represents a Basic Belief Assignment (BBA) / Mass Function m: 2^Omega -> [0, 1].
    Keys are frozensets of elements from Omega.
    """

    def __init__(self, masses: Optional[Dict[frozenset, float]] = None):
        self.masses: Dict[frozenset, float] = {}
        if masses:
            total = sum(masses.values())
            if total > 0:
                for subset, val in masses.items():
                    if val > 0:
                        self.masses[frozenset(subset)] = val / total
            else:
                self.masses[frozenset(ELEMENTS)] = 1.0
        else:
            # Vacuous belief function (complete ignorance)
            self.masses[frozenset(ELEMENTS)] = 1.0

    def get(self, subset: Any, default: float = 0.0) -> float:
        return self.masses.get(frozenset(subset), default)

    @classmethod
    def combine(
        cls, m1: "EvidentialMassFunction", m2: "EvidentialMassFunction"
    ) -> Tuple["EvidentialMassFunction", float]:
        """
        Dempster's Rule of Combination m1 (x) m2.
        Returns: (Combined Mass Function, Conflict Coefficient K)
        """
        raw_combined: Dict[frozenset, float] = {}
        conflict_k = 0.0

        for s1, p1 in m1.masses.items():
            for s2, p2 in m2.masses.items():
                intersection = s1.intersection(s2)
                joint_mass = p1 * p2
                if not intersection:
                    conflict_k += joint_mass
                else:
                    raw_combined[intersection] = raw_combined.get(intersection, 0.0) + joint_mass

        # Normalize by 1 - K (capped to prevent division by zero in complete contradiction)
        normalization = max(1e-6, 1.0 - conflict_k)
        normalized_masses: Dict[frozenset, float] = {}
        for s, val in raw_combined.items():
            normalized_masses[s] = val / normalization

        return cls(normalized_masses), min(1.0, max(0.0, conflict_k))

    def belief(self, hypothesis: str) -> float:
        """Bel(A) = sum_{B subseteq A, B != empty} m(B)"""
        target = frozenset([hypothesis])
        return sum(
            mass for subset, mass in self.masses.items() if subset.issubset(target) and subset
        )

    def plausibility(self, hypothesis: str) -> float:
        """Pl(A) = sum_{B cap A != empty} m(B)"""
        target = frozenset([hypothesis])
        return sum(
            mass for subset, mass in self.masses.items() if subset.intersection(target)
        )

    def pignistic_probabilities(self) -> Dict[str, float]:
        """
        Pignistic Probability Transform BetP(x) = sum_{A ni x} m(A) / |A|
        Transforms belief masses into decision probabilities on singletons.
        """
        bet_p = {elem: 0.0 for elem in ELEMENTS}
        for subset, mass in self.masses.items():
            if subset:
                share = mass / len(subset)
                for elem in subset:
                    if elem in bet_p:
                        bet_p[elem] += share

        total = sum(bet_p.values())
        if total > 0:
            return {k: round(v / total, 4) for k, v in bet_p.items()}
        return {elem: round(1.0 / len(ELEMENTS), 4) for elem in ELEMENTS}


class EvidentialFusionEngine:
    """
    Multi-sensor evidential reasoning engine for industrial fire triage.
    Fuses VIIRS, VNF, ESA WorldCover, Sentinel-2 SWIR NBR, CUSUM, and Isolation Forest.
    """

    def __init__(self):
        logger.info("Initialized Dempster-Shafer Evidential Fusion Engine.")

    def mass_from_baseline_deviation(self, deviation_score: float, frp: float) -> EvidentialMassFunction:
        """Source 1: Satellite thermal output and baseline z-score deviation."""
        z = float(deviation_score)
        power = float(frp)

        if z >= 4.0 or power >= 120.0:
            # Extreme acute thermal surge -> Strong evidence of industrial disaster
            return EvidentialMassFunction({
                ("FIRE",): 0.75,
                ("FIRE", "FLARE"): 0.15,
                ELEMENTS: 0.10,
            })
        elif z >= 2.0 or power >= 60.0:
            # Elevated thermal anomaly -> Favors industrial fire, some flaring possibility
            return EvidentialMassFunction({
                ("FIRE",): 0.50,
                ("FIRE", "FLARE"): 0.35,
                ELEMENTS: 0.15,
            })
        elif -1.5 <= z < 1.0:
            # Stationary baseline behavior -> Favors operational flaring
            return EvidentialMassFunction({
                ("FLARE",): 0.60,
                ("FLARE", "OTHER"): 0.25,
                ELEMENTS: 0.15,
            })
        else:
            # Mildly negative or unmodeled
            return EvidentialMassFunction({
                ("FLARE", "OTHER"): 0.60,
                ELEMENTS: 0.40,
            })

    def mass_from_vnf_catalog(
        self, is_known_vnf: bool, distance_km: Optional[float]
    ) -> EvidentialMassFunction:
        """Source 2: NOAA VIIRS Nightfire registered gas flare cross-reference."""
        dist = float(distance_km) if distance_km is not None else 999.0

        if is_known_vnf or dist <= 0.8:
            # Hotspot coincides directly with registered operational flare stack
            return EvidentialMassFunction({
                ("FLARE",): 0.70,
                ("FIRE", "FLARE"): 0.20,
                ELEMENTS: 0.10,
            })
        elif dist <= 2.0:
            return EvidentialMassFunction({
                ("FLARE",): 0.40,
                ("FIRE", "FLARE"): 0.35,
                ELEMENTS: 0.25,
            })
        else:
            # Far from any known flare stack -> Unlikely to be routine flare
            return EvidentialMassFunction({
                ("FIRE", "OTHER"): 0.65,
                ELEMENTS: 0.35,
            })

    def mass_from_esa_landcover(
        self, esa_code: int, on_known_site: int = 1
    ) -> EvidentialMassFunction:
        """Source 3: ESA WorldCover 10m Sentinel-1 SAR / Sentinel-2 optical terrain."""
        code = int(esa_code)

        if code == 50 or on_known_site == 1:
            # Built-up / Industrial corridor -> Heavily supports industrial phenomena
            return EvidentialMassFunction({
                ("FIRE", "FLARE"): 0.80,
                ("FIRE",): 0.10,
                ELEMENTS: 0.10,
            })
        elif code == 40:
            # Cropland -> Strong evidence for agricultural stubble burning
            return EvidentialMassFunction({
                ("OTHER",): 0.75,
                ("FIRE", "OTHER"): 0.15,
                ELEMENTS: 0.10,
            })
        elif code in (10, 20, 30):
            # Forest / Shrubland -> Supports vegetation wildfire
            return EvidentialMassFunction({
                ("OTHER",): 0.70,
                ELEMENTS: 0.30,
            })
        elif code in (80, 90):
            # Water bodies / Mangroves
            return EvidentialMassFunction({
                ("FIRE", "OTHER"): 0.50,
                ELEMENTS: 0.50,
            })
        else:
            return EvidentialMassFunction({ELEMENTS: 1.0})

    def mass_from_sentinel_imagery(
        self, swir_burn_index: Optional[float]
    ) -> EvidentialMassFunction:
        """Source 4: Sentinel-2 SWIR B12-B8A Normalized Burn Ratio (NBR) / Fire Seat index."""
        if swir_burn_index is None:
            return EvidentialMassFunction({ELEMENTS: 1.0})

        nbr = float(swir_burn_index)
        if nbr >= 0.70:
            # Massive SWIR particulate-piercing combustion seat
            return EvidentialMassFunction({
                ("FIRE",): 0.65,
                ("FIRE", "FLARE"): 0.25,
                ELEMENTS: 0.10,
            })
        elif nbr >= 0.40:
            return EvidentialMassFunction({
                ("FIRE", "FLARE"): 0.60,
                ELEMENTS: 0.40,
            })
        else:
            return EvidentialMassFunction({
                ("FLARE", "OTHER"): 0.50,
                ELEMENTS: 0.50,
            })

    def mass_from_cusum(
        self, cusum_stat: float, cusum_regime: str
    ) -> EvidentialMassFunction:
        """Source 5: Page's Tabular CUSUM statistical change-point detection."""
        stat = float(cusum_stat)
        regime = str(cusum_regime or "STABLE_BASELINE").upper()

        if regime in ("RAPID_SURGE", "SLOW_ONSET_HEATING") or stat >= 4.0:
            # Persistent monotonic thermal accumulation confirms anomalous departure
            return EvidentialMassFunction({
                ("FIRE",): 0.70,
                ("FIRE", "OTHER"): 0.20,
                ELEMENTS: 0.10,
            })
        elif regime == "INCUBATING_HEATING" or stat >= 2.0:
            return EvidentialMassFunction({
                ("FIRE", "FLARE"): 0.50,
                ELEMENTS: 0.50,
            })
        else:
            # Stable baseline noise
            return EvidentialMassFunction({
                ("FLARE", "OTHER"): 0.65,
                ELEMENTS: 0.35,
            })

    def mass_from_isolation_forest(
        self, iso_score: float, is_outlier: bool
    ) -> EvidentialMassFunction:
        """Source 6: Unsupervised Isolation Forest structural anomaly scoring."""
        score = float(iso_score)

        if score >= 0.75 or is_outlier:
            # Severe structural anomaly in multi-dimensional feature space
            return EvidentialMassFunction({
                ("FIRE", "OTHER"): 0.65,
                ("FIRE",): 0.25,
                ELEMENTS: 0.10,
            })
        elif score <= 0.45:
            # Typical inlier geometry consistent with routine industrial flaring
            return EvidentialMassFunction({
                ("FLARE",): 0.60,
                ("FLARE", "OTHER"): 0.25,
                ELEMENTS: 0.15,
            })
        else:
            return EvidentialMassFunction({ELEMENTS: 1.0})

    def evaluate_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Fuses all 6 Earth observation layers into a unified evidential decision.
        """
        dev = float(event_data.get("deviation_score", 0.0))
        frp = float(event_data.get("frp", 0.0))
        is_vnf = bool(event_data.get("is_known_vnf_flare", False))
        vnf_dist = event_data.get("distance_to_vnf_flare_km")
        esa_code = int(event_data.get("esa_worldcover_code", 50))
        on_site = int(event_data.get("on_known_site", 1))
        swir_nbr = event_data.get("swir_burn_index")
        cusum_stat = float(event_data.get("cusum_statistic", 0.0))
        cusum_regime = str(event_data.get("cusum_regime", "STABLE_BASELINE"))
        iso_score = float(event_data.get("isolation_anomaly_score", 0.50))
        is_iso_outlier = bool(event_data.get("is_isolation_outlier", False))

        # Generate individual sensor belief functions
        m1 = self.mass_from_baseline_deviation(dev, frp)
        m2 = self.mass_from_vnf_catalog(is_vnf, vnf_dist)
        m3 = self.mass_from_esa_landcover(esa_code, on_site)
        m4 = self.mass_from_sentinel_imagery(swir_nbr)
        m5 = self.mass_from_cusum(cusum_stat, cusum_regime)
        m6 = self.mass_from_isolation_forest(iso_score, is_iso_outlier)

        # Sequential Dempster Combination
        m_curr, k1 = EvidentialMassFunction.combine(m1, m2)
        m_curr, k2 = EvidentialMassFunction.combine(m_curr, m3)
        m_curr, k3 = EvidentialMassFunction.combine(m_curr, m4)
        m_curr, k4 = EvidentialMassFunction.combine(m_curr, m5)
        m_final, k5 = EvidentialMassFunction.combine(m_curr, m6)

        total_conflict = max(k1, k2, k3, k4, k5)

        # Extract belief measures
        bel_fire = round(m_final.belief("FIRE"), 4)
        pl_fire = round(m_final.plausibility("FIRE"), 4)
        bel_flare = round(m_final.belief("FLARE"), 4)
        pl_flare = round(m_final.plausibility("FLARE"), 4)

        pignistic = m_final.pignistic_probabilities()
        p_fire = pignistic["FIRE"]
        p_flare = pignistic["FLARE"]
        p_other = pignistic["OTHER"]

        # Evidential Verdict Resolution
        if total_conflict >= 0.65:
            verdict = "HIGH_CONFLICT_ANOMALY"
        elif p_fire >= 0.60 and bel_fire >= 0.40:
            verdict = "CONFIRMED_INDUSTRIAL_FIRE"
        elif p_flare >= 0.55:
            verdict = "VERIFIED_ROUTINE_FLARE"
        elif p_other >= 0.55:
            verdict = "SEASONAL_OR_VEGETATION"
        else:
            verdict = "AMBIGUOUS_EVIDENTIAL_STATE"

        return {
            "fused_hazard_probability": p_fire,
            "fused_flare_probability": p_flare,
            "fused_other_probability": p_other,
            "belief_fire": bel_fire,
            "plausibility_fire": pl_fire,
            "belief_flare": bel_flare,
            "plausibility_flare": pl_flare,
            "sensor_conflict_k": round(total_conflict, 4),
            "fusion_verdict": verdict,
            "fused_confidence_interval": [bel_fire, pl_fire],
        }


# Singleton engine instance
fusion_engine = EvidentialFusionEngine()
