import yaml
import os
from typing import Dict, Any, List, Tuple
import numpy as np
from app.engine.baseline import BaselineEngine

WEIGHTS_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "weights.yaml")

def load_weights_config() -> Tuple[Dict[str, float], Dict[str, bool]]:
    try:
        with open(WEIGHTS_PATH, "r") as f:
            data = yaml.safe_load(f)
            weights = data.get("weights", {})
            inverted = data.get("inverted_signals", {})
            return weights, inverted
    except Exception:
        weights = {
            "focus_self": 0.30,
            "energy_self": 0.25,
            "sleep_hours": 0.15,
            "context_switches_per_hour": 0.10,
            "meeting_minutes": 0.10,
            "movement_minutes": 0.05,
            "stress_self": 0.05
        }
        inverted = {
            "stress_self": True,
            "context_switches_per_hour": True,
            "meeting_minutes": True,
            "back_to_back_count": True,
            "hours_since_break": True
        }
        return weights, inverted

class CapacityEngine:
    def __init__(self, baseline_engine: BaselineEngine):
        self.baseline_engine = baseline_engine
        self.weights, self.inverted_signals = load_weights_config()

    def compute_z_score(self, kind: str, value: float, median: float, spread: float) -> float:
        """
        Z-score calculation with clipping to [-3.0, 3.0].
        Respects inverted signals (where higher raw value is negative for capacity).
        """
        raw_spread = max(spread, 0.05)
        raw_z = (value - median) / raw_spread

        # If signal is inverted (e.g., stress, context switches, meeting load), reverse sign
        if self.inverted_signals.get(kind, False):
            raw_z = -raw_z

        # Clip to [-3.0, 3.0]
        return float(np.clip(raw_z, -3.0, 3.0))

    def compute_capacity(self, user_id: str, current_signals: Dict[str, float]) -> Tuple[float, float, List[Dict[str, Any]]]:
        """
        Calculates capacity score (0-100) and driver attributions.
        Returns:
            (score, baseline_score, driver_attributions)
        Formula:
            z_total = sum(weight_i * z_i) / sum(weight_i)
            score = 50.0 + (z_total / 3.0) * 50.0  -> bounded in [0, 100]
        Baseline score is 50.0 (by definition of centered z-score).
        """
        weighted_z_sum = 0.0
        total_weight = 0.0
        driver_details = []

        for kind, weight in self.weights.items():
            if kind in current_signals and current_signals[kind] is not None:
                val = float(current_signals[kind])
                median, spread, _ = self.baseline_engine.get_signal_stats(user_id, kind)
                z = self.compute_z_score(kind, val, median, spread)
                
                contribution = weight * z
                weighted_z_sum += contribution
                total_weight += weight

                driver_details.append({
                    "kind": kind,
                    "raw_value": val,
                    "median": median,
                    "spread": spread,
                    "z_score": round(z, 2),
                    "weight": weight,
                    "contribution": round(contribution, 3)
                })

        if total_weight == 0.0:
            # Fallback if no weighted signals provided
            return 50.0, 50.0, []

        normalized_z = weighted_z_sum / total_weight
        # Map z [-3, 3] to [0, 100] with 50 at 0.0
        score = 50.0 + (normalized_z / 3.0) * 50.0
        score = float(np.clip(round(score, 1), 0.0, 100.0))
        baseline = 50.0

        return score, baseline, driver_details
