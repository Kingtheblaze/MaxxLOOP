import yaml
import os
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Tuple
import numpy as np
from sqlmodel import Session, select
from app.models.models import Signal

# Path to population priors YAML
PRIORS_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "population_priors.yaml")

def load_population_priors() -> Dict[str, Dict[str, float]]:
    try:
        with open(PRIORS_PATH, "r") as f:
            data = yaml.safe_load(f)
            return data.get("priors", {})
    except Exception:
        # Fallback hardcoded priors
        return {
            "focus_self": {"median": 3.5, "mad": 0.8},
            "energy_self": {"median": 3.2, "mad": 0.8},
            "stress_self": {"median": 2.6, "mad": 0.7},
            "sleep_hours": {"median": 7.2, "mad": 1.0},
            "meeting_minutes": {"median": 120.0, "mad": 45.0},
            "back_to_back_count": {"median": 1.0, "mad": 1.0},
            "context_switches_per_hour": {"median": 14.0, "mad": 6.0},
            "screen_minutes": {"median": 320.0, "mad": 60.0},
            "movement_minutes": {"median": 35.0, "mad": 15.0},
            "hours_since_break": {"median": 2.0, "mad": 0.8}
        }

def get_time_bucket(dt: datetime) -> str:
    hour = dt.hour
    if 6 <= hour < 12:
        return "morning"
    elif 12 <= hour < 18:
        return "afternoon"
    elif 18 <= hour < 24:
        return "evening"
    else:
        return "night"

def compute_mad(arr: np.ndarray) -> float:
    """
    Computes Median Absolute Deviation (MAD).
    Returns max(mad, 0.01) to prevent zero-division.
    """
    if len(arr) == 0:
        return 0.5
    med = np.median(arr)
    mad = np.median(np.abs(arr - med))
    return float(max(mad, 0.01))

class BaselineEngine:
    def __init__(self, session: Session):
        self.session = session
        self.priors = load_population_priors()

    def get_signal_stats(self, user_id: str, kind: str, target_time: datetime = None) -> Tuple[float, float, bool]:
        """
        Returns (median, robust_spread, is_bucketed).
        robust_spread = 1.4826 * MAD.
        Pulls last 14 days of data.
        """
        target_time = target_time or datetime.now(timezone.utc)
        cutoff = target_time - timedelta(days=14)
        target_bucket = get_time_bucket(target_time)

        # Query all signals for user and kind in last 14 days
        stmt = (
            select(Signal)
            .where(Signal.user_id == user_id)
            .where(Signal.kind == kind)
            .where(Signal.ts >= cutoff)
            .order_by(Signal.ts.desc())
        )
        signals = self.session.exec(stmt).all()

        if not signals:
            prior = self.priors.get(kind, {"median": 3.0, "mad": 0.8})
            return prior["median"], prior["mad"] * 1.4826, False

        # Attempt bucket-specific filter
        bucket_vals = [s.value for s in signals if get_time_bucket(s.ts) == target_bucket]
        if len(bucket_vals) >= 5:
            arr = np.array(bucket_vals)
            med = float(np.median(arr))
            mad = compute_mad(arr)
            return med, mad * 1.4826, True

        # Fallback to global 14-day data
        all_vals = [s.value for s in signals]
        if len(all_vals) >= 3:
            arr = np.array(all_vals)
            med = float(np.median(arr))
            mad = compute_mad(arr)
            return med, mad * 1.4826, False

        # Fallback to population prior blended with available data
        prior = self.priors.get(kind, {"median": 3.0, "mad": 0.8})
        blended_med = float((np.mean(all_vals) + prior["median"]) / 2.0)
        return blended_med, prior["mad"] * 1.4826, False
