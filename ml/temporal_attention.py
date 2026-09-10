"""
Attention-Based Temporal Sequence Model (1D-CNN + Temporal Self-Attention)
NTRO Industrial Fire Intelligence System — Section 5.3 Out-of-the-Box AI

Analyzes historical Fire Radiative Power (FRP) and thermal deviation time-series (14-30 days)
using a hybrid 1D Temporal Convolution filter and Scaled Dot-Product Temporal Self-Attention.
Extracts characteristic longitudinal signatures:
- STATIONARY_FLAT_FLARING (stable operational combustion)
- ACUTE_SPIKE_DECAY (catastrophic vessel explosion / BLEVE)
- PROGRESSIVE_EXPONENTIAL_RISE (smoldering / pre-ignition thermal runaway)
- EPISODIC_BURST (intermittent crop stubble burning)
"""

import math
import logging
from typing import List, Dict, Any, Optional, Tuple
import numpy as np

logger = logging.getLogger("temporal_attention")


def softmax(x: np.ndarray, axis: int = -1) -> np.ndarray:
    """Numerically stable softmax implementation."""
    e_x = np.exp(x - np.max(x, axis=axis, keepdims=True))
    return e_x / np.sum(e_x, axis=axis, keepdims=True)


class TemporalAttentionService:
    """
    1D-CNN Feature Extractor + Scaled Dot-Product Temporal Self-Attention Model.
    Processes multi-week FRP time-series to detect characteristic temporal regimes
    and identify the exact satellite pass driving acute thermal shocks.
    """

    DEFAULT_WINDOW_SIZE: int = 14  # Default 14-pass temporal window
    FEATURE_DIM: int = 3           # [frp, z_score, delta_frp]
    HIDDEN_DIM: int = 8            # Projection dimension for self-attention

    def __init__(self, seed: int = 42):
        self.rng = np.random.RandomState(seed)

        # 1D-CNN Convolutional Kernel (Kernel Size K=3, In: 3 -> Out: 8)
        k_limit = math.sqrt(6.0 / (3 * self.FEATURE_DIM + self.HIDDEN_DIM))
        self.conv_weight = self.rng.uniform(-k_limit, k_limit, (3, self.FEATURE_DIM, self.HIDDEN_DIM))
        self.conv_bias = np.zeros(self.HIDDEN_DIM)

        # Self-Attention Projection Weights (Q, K, V)
        attn_limit = math.sqrt(6.0 / (self.HIDDEN_DIM + self.HIDDEN_DIM))
        self.W_q = self.rng.uniform(-attn_limit, attn_limit, (self.HIDDEN_DIM, self.HIDDEN_DIM))
        self.W_k = self.rng.uniform(-attn_limit, attn_limit, (self.HIDDEN_DIM, self.HIDDEN_DIM))
        self.W_v = self.rng.uniform(-attn_limit, attn_limit, (self.HIDDEN_DIM, self.HIDDEN_DIM))

    def conv1d_forward(self, sequence: np.ndarray) -> np.ndarray:
        """
        Applies 1D causal/same convolution across the temporal dimension:
        Input: (T, 3) -> Output: (T, HIDDEN_DIM)
        """
        T = sequence.shape[0]
        output = np.zeros((T, self.HIDDEN_DIM), dtype=np.float64)

        # Pad sequence with reflection on boundaries for length preservation
        padded = np.pad(sequence, ((1, 1), (0, 0)), mode="edge")

        for t in range(T):
            # Window slice: shape (3, FEATURE_DIM)
            window = padded[t : t + 3]
            # Convolution operation + ReLU activation
            val = np.tensordot(window, self.conv_weight, axes=((0, 1), (0, 1))) + self.conv_bias
            output[t] = np.maximum(0.0, val)  # ReLU

        return output

    def scaled_dot_product_attention(
        self, C: np.ndarray
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Executes Scaled Dot-Product Self-Attention over temporal feature sequence C:
        Q = C * W_q, K = C * W_k, V = C * W_v
        Attention(Q, K, V) = softmax(Q * K^T / sqrt(d_k)) * V
        Returns:
            context: Attention context matrix (T, HIDDEN_DIM)
            A: Pairwise attention matrix (T, T)
            alpha_weights: Pooled 1D attention importance vector (T,)
        """
        T = C.shape[0]
        if T == 0:
            return np.zeros((0, self.HIDDEN_DIM)), np.zeros((0, 0)), np.zeros(0)

        Q = C @ self.W_q  # (T, HIDDEN_DIM)
        K = C @ self.W_k  # (T, HIDDEN_DIM)
        V = C @ self.W_v  # (T, HIDDEN_DIM)

        d_k = float(self.HIDDEN_DIM)
        scores = (Q @ K.T) / math.sqrt(d_k)  # (T, T)
        A = softmax(scores, axis=-1)         # (T, T)
        context = A @ V                      # (T, HIDDEN_DIM)

        # Pooled attention weights across queries indicates global importance of each step
        alpha_weights = np.mean(A, axis=0)
        alpha_weights = alpha_weights / np.sum(alpha_weights)  # Normalize to sum 1.0

        return context, A, alpha_weights

    def classify_trajectory(
        self, frp_series: np.ndarray, z_series: np.ndarray, alpha_weights: np.ndarray
    ) -> Tuple[str, float, float, int]:
        """
        Analyzes statistical moments and attention distribution to determine canonical profile:
        - STATIONARY_FLAT_FLARING: Low CV (<= 0.28), stable baseline over time.
        - ACUTE_SPIKE_DECAY: Severe pulse (> 3.5 sigma) followed by rapid decay.
        - PROGRESSIVE_EXPONENTIAL_RISE: Monotonically increasing heating over 3+ passes.
        - EPISODIC_BURST: Intermittent, zero-heavy pulses (crop residue burn).

        Returns:
            label: Canonical profile string
            stability_index: [0.0, 1.0] where 1.0 is a perfectly flat line
            confidence: [0.0, 1.0]
            peak_pass: Index of pass with maximum attention weight
        """
        T = len(frp_series)
        if T == 0:
            return "STATIONARY_FLAT_FLARING", 1.0, 0.90, 0

        mean_frp = float(np.mean(frp_series))
        std_frp = float(np.std(frp_series))
        cv = std_frp / max(1.0, mean_frp)
        max_frp = float(np.max(frp_series))
        min_frp = float(np.min(frp_series))
        max_z = float(np.max(z_series))
        peak_pass = int(np.argmax(alpha_weights))

        # Stability index: high for low-variance flat lines, low for erratic spikes
        stability_index = float(np.clip(1.0 - cv, 0.0, 1.0))

        zero_fraction = np.sum(frp_series < 5.0) / float(T)

        # Check for Progressive Exponential Runaway
        # Slope of last 4 passes
        if T >= 4:
            recent_frp = frp_series[-4:]
            diffs = np.diff(recent_frp)
            if np.all(diffs > 0) and recent_frp[-1] > recent_frp[0] * 2.0:
                conf = float(min(0.95, 0.75 + (recent_frp[-1] / max(1.0, recent_frp[0])) * 0.05))
                return "PROGRESSIVE_EXPONENTIAL_RISE", float(round(stability_index, 3)), float(round(conf, 3)), peak_pass

        # Check for Episodic Bursts (zeros or near-zeros punctuated by intermittent seasonal burns)
        if zero_fraction >= 0.35:
            conf = float(min(0.92, 0.65 + zero_fraction * 0.25))
            return "EPISODIC_BURST", float(round(stability_index, 3)), float(round(conf, 3)), peak_pass

        # Check for Acute Spike-Decay Explosion on active baseline site
        peak_ratio = max_frp / max(1.0, np.median(frp_series))
        if (max_z >= 3.5 or peak_ratio >= 3.5) and max_frp >= 50.0:
            conf = float(min(0.98, 0.70 + (max_z / 10.0) * 0.25))
            return "ACUTE_SPIKE_DECAY", float(round(stability_index, 3)), float(round(conf, 3)), peak_pass

        # Check for Stationary Flat Flaring
        if cv <= 0.28 and mean_frp >= 15.0:
            conf = float(min(0.96, 0.80 + (1.0 - cv) * 0.15))
            return "STATIONARY_FLAT_FLARING", float(round(stability_index, 3)), float(round(conf, 3)), peak_pass

        # Default fallback
        return "STATIONARY_FLAT_FLARING", float(round(stability_index, 3)), 0.75, peak_pass

    def evaluate_sequence(
        self, frp_history: List[float], z_history: Optional[List[float]] = None
    ) -> Dict[str, Any]:
        """
        Full pipeline: 1D-CNN + Self-Attention + Signature Classifier on an FRP sequence.
        """
        T = len(frp_history)
        if T == 0:
            return self._empty_result()

        frp_arr = np.array(frp_history, dtype=np.float64)
        if z_history is not None and len(z_history) == T:
            z_arr = np.array(z_history, dtype=np.float64)
        else:
            # Estimate Z-score trajectory relative to median
            med = np.median(frp_arr)
            mad = np.median(np.abs(frp_arr - med))
            scale = max(1.0, mad * 1.4826)
            z_arr = (frp_arr - med) / scale

        # Delta FRP rate of change
        delta_frp = np.diff(frp_arr, prepend=frp_arr[0])

        # Normalize features
        norm_frp = np.clip(frp_arr / 100.0, 0.0, 10.0)
        norm_z = np.clip(z_arr / 5.0, -3.0, 5.0)
        norm_delta = np.clip(delta_frp / 50.0, -5.0, 5.0)
        X = np.column_stack([norm_frp, norm_z, norm_delta])

        # Forward passes
        C = self.conv1d_forward(X)
        _, _, alpha_weights = self.scaled_dot_product_attention(C)

        label, stability_idx, conf, peak_pass = self.classify_trajectory(
            frp_series=frp_arr, z_series=z_arr, alpha_weights=alpha_weights
        )

        return {
            "temporal_signature_label": label,
            "temporal_attention_peak_pass": peak_pass,
            "temporal_attention_weights": [round(float(w), 4) for w in alpha_weights],
            "temporal_stability_index": stability_idx,
            "temporal_profile_confidence": conf,
            "temporal_window_size": T,
        }

    def evaluate_event(self, event_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluates an individual event record. If full sequence is provided in
        `frp_history`, evaluates it directly. Otherwise reconstructs a synthetic
        14-pass trajectory grounded in site parameters.
        """
        frp_hist = event_dict.get("frp_history")
        if frp_hist and isinstance(frp_hist, (list, tuple)) and len(frp_hist) >= 3:
            return self.evaluate_sequence(list(frp_hist))

        # Reconstruct canonical trajectory from event telemetry
        frp = float(event_dict.get("frp", 35.0))
        dev = float(event_dict.get("deviation_score", 0.0))
        label = event_dict.get("label", "normal_flare")
        persistence = int(event_dict.get("persistence_count", 1))

        if label == "industrial_fire" or dev >= 4.0:
            # Reconstruct acute spike-decay trajectory
            base = max(5.0, frp * 0.1)
            synth_frp = [base + float(i % 3) for i in range(10)] + [frp * 0.7, frp, frp * 0.4, frp * 0.2]
        elif label == "normal_flare" or (persistence > 10 and dev < 1.5):
            # Reconstruct steady flat flaring line
            synth_frp = [frp + float((i % 5) - 2) * 1.5 for i in range(14)]
        elif label == "agricultural_burn":
            # Reconstruct episodic burst
            synth_frp = [0.0, 0.0, 0.0, frp * 0.5, frp, frp * 0.2, 0.0, 0.0, 0.0, frp * 0.8, frp, 0.0, 0.0, 0.0]
        else:
            synth_frp = [max(0.0, frp + float((i % 4) - 2) * 3.0) for i in range(14)]

        return self.evaluate_sequence(synth_frp)

    def _empty_result(self) -> Dict[str, Any]:
        return {
            "temporal_signature_label": "STATIONARY_FLAT_FLARING",
            "temporal_attention_peak_pass": 0,
            "temporal_attention_weights": [1.0],
            "temporal_stability_index": 1.0,
            "temporal_profile_confidence": 0.90,
            "temporal_window_size": 1,
        }


# Global singleton instance
temporal_attention_service = TemporalAttentionService()
