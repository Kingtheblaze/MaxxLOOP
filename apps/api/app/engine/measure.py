from datetime import datetime, timedelta, timezone
from typing import Tuple, Dict, Any, List, Optional
import numpy as np
from scipy import stats
from sqlmodel import Session, select
from app.models.models import Outcome, Intervention, CapacitySnapshot, ActionPrior

# Prior expected drift when no action is taken during an acute drop (natural slight recovery or continued fatigue)
DEFAULT_CONTROL_DRIFT_PRIOR = 1.5

class MeasurementEngine:
    def __init__(self, session: Session):
        self.session = session

    def get_control_window_delta(self, user_id: str) -> Tuple[float, int]:
        """
        Calculates expected_delta_no_action:
        Mean score change over skipped/ignored drops for this user.
        If fewer than 3 control windows exist, blends with DEFAULT_CONTROL_DRIFT_PRIOR.
        """
        # Find all skipped interventions
        stmt = (
            select(Intervention)
            .where(Intervention.user_id == user_id)
            .where(Intervention.status == "skipped")
        )
        skipped_interventions = self.session.exec(stmt).all()

        deltas = []
        for skip in skipped_interventions:
            # Find snapshot right before skip
            snap_stmt = select(CapacitySnapshot).where(CapacitySnapshot.id == skip.snapshot_id)
            snap = self.session.exec(snap_stmt).first()
            if not snap:
                continue

            # Look for subsequent snapshot within 15-60 min
            subsequent_stmt = (
                select(CapacitySnapshot)
                .where(CapacitySnapshot.user_id == user_id)
                .where(CapacitySnapshot.ts > snap.ts)
                .where(CapacitySnapshot.ts <= snap.ts + timedelta(minutes=60))
                .order_by(CapacitySnapshot.ts.asc())
            )
            next_snap = self.session.exec(subsequent_stmt).first()
            if next_snap:
                deltas.append(next_snap.score - snap.score)

        n = len(deltas)
        if n >= 3:
            return float(np.mean(deltas)), n
        elif n > 0:
            blended = float((sum(deltas) + DEFAULT_CONTROL_DRIFT_PRIOR * (3 - n)) / 3.0)
            return blended, n
        else:
            return DEFAULT_CONTROL_DRIFT_PRIOR, 0

    def compute_confidence(self, sample_size: int, variance: float, consistent_sign: bool) -> str:
        """
        Confidence rating based on sample count, variance, and directional consistency.
        Low: n < 3 or high variance
        Medium: 3 <= n < 8
        High: n >= 8 with consistent sign
        """
        if sample_size < 3:
            return "Low"
        if sample_size >= 8 and consistent_sign and variance < 25.0:
            return "High"
        return "Medium"

    def record_measurement(
        self,
        intervention: Intervention,
        pre_score: float,
        post_score: float,
        user_helpful: Optional[bool] = None,
        note: Optional[str] = None
    ) -> Outcome:
        """
        Computes observed delta, counterfactual baseline, and net effect.
        Updates the Thompson Sampling Beta posterior for (user, action).
        """
        observed_delta = round(post_score - pre_score, 1)
        expected_no_action, control_n = self.get_control_window_delta(intervention.user_id)
        expected_no_action = round(expected_no_action, 1)
        net_effect = round(observed_delta - expected_no_action, 1)

        # Check historical outcomes for this specific action to evaluate confidence
        stmt = (
            select(Outcome)
            .join(Intervention, Outcome.intervention_id == Intervention.id)
            .where(Intervention.user_id == intervention.user_id)
            .where(Intervention.action_id == intervention.action_id)
        )
        past_outcomes = self.session.exec(stmt).all()
        past_nets = [o.net_effect for o in past_outcomes] + [net_effect]
        n_samples = len(past_nets)
        var = float(np.var(past_nets)) if n_samples > 1 else 10.0
        consistent_sign = all(x > 0 for x in past_nets) or all(x < 0 for x in past_nets)
        confidence = self.compute_confidence(n_samples, var, consistent_sign)

        outcome = Outcome(
            intervention_id=intervention.id,
            pre_score=pre_score,
            post_score=post_score,
            observed_delta=observed_delta,
            expected_delta_no_action=expected_no_action,
            net_effect=net_effect,
            confidence=confidence,
            user_helpful=user_helpful,
            note=note
        )
        self.session.add(outcome)

        # Update Beta posterior for action
        prior_stmt = (
            select(ActionPrior)
            .where(ActionPrior.user_id == intervention.user_id)
            .where(ActionPrior.action_id == intervention.action_id)
        )
        prior = self.session.exec(prior_stmt).first()
        if prior:
            # Positive net effect (> 2.0 pts) considered a success
            if net_effect > 2.0:
                prior.alpha += 1.0
            else:
                prior.beta += 1.0
            prior.updated_at = datetime.now(timezone.utc)
            self.session.add(prior)

        self.session.commit()
        self.session.refresh(outcome)
        return outcome
