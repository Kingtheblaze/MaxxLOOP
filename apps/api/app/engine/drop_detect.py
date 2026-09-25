from datetime import datetime, timedelta, timezone
from typing import Tuple, List, Optional
from sqlmodel import Session, select
from app.models.models import CapacitySnapshot, Intervention
from app.core.config import settings

class DropDetectionEngine:
    def __init__(self, session: Session):
        self.session = session
        self.drop_threshold = settings.DROP_THRESHOLD_POINTS # 10.0
        self.rapid_drop_threshold = settings.RAPID_DROP_POINTS # 15.0
        self.min_cooldown_minutes = settings.MIN_COOLDOWN_MINUTES # 45
        self.max_daily_interventions = settings.MAX_INTERVENTIONS_PER_DAY # 3

    def check_cooldown(self, user_id: str, now: datetime = None) -> Tuple[bool, str]:
        """
        Enforces cooldown rules:
        - Max 3 interventions in the last 24 hours.
        - Min 45 minutes since last intervention.
        Returns: (is_allowed, reason)
        """
        now = now or datetime.now(timezone.utc)
        twenty_four_hours_ago = now - timedelta(hours=24)
        min_cooldown_time = now - timedelta(minutes=self.min_cooldown_minutes)

        # Check last 24h count
        stmt_day = (
            select(Intervention)
            .where(Intervention.user_id == user_id)
            .where(Intervention.chosen_at >= twenty_four_hours_ago)
            .order_by(Intervention.chosen_at.desc())
        )
        day_interventions = self.session.exec(stmt_day).all()

        if len(day_interventions) >= self.max_daily_interventions:
            return False, f"Daily limit reached ({self.max_daily_interventions} max per 24 hours)"

        if day_interventions:
            last_intervention = day_interventions[0]
            if last_intervention.chosen_at > min_cooldown_time:
                elapsed_min = int((now - last_intervention.chosen_at).total_seconds() / 60)
                remaining = self.min_cooldown_minutes - elapsed_min
                return False, f"Cooldown active ({remaining} minutes remaining)"

        return True, "Cooldown clear"

    def evaluate_drop(
        self,
        user_id: str,
        current_score: float,
        baseline_score: float,
        robust_spread: float = 10.0,
        now: datetime = None
    ) -> Tuple[bool, str]:
        """
        Evaluates whether a drop is flagged:
        Rule 1: score is below baseline by more than max(10, 1.0 * robust_spread)
        Rule 2: score falls at least 15 points across last two snapshots
        Returns: (is_drop, reason)
        """
        now = now or datetime.now(timezone.utc)
        delta = current_score - baseline_score

        # Dynamic threshold: max(10, 1.0 * robust_spread)
        required_drop = max(self.drop_threshold, 1.0 * robust_spread)

        if delta <= -required_drop:
            return True, f"Capacity score is {abs(round(delta, 1))} pts below normal (threshold: {round(required_drop, 1)})"

        # Check last snapshot for rapid drop
        stmt = (
            select(CapacitySnapshot)
            .where(CapacitySnapshot.user_id == user_id)
            .order_by(CapacitySnapshot.ts.desc())
            .limit(1)
        )
        last_snapshot = self.session.exec(stmt).first()
        if last_snapshot:
            fall = last_snapshot.score - current_score
            if fall >= self.rapid_drop_threshold:
                return True, f"Rapid drop detected: fell {round(fall, 1)} pts since last snapshot"

        return False, "Capacity within normal range"
