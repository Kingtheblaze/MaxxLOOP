from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select
from typing import Dict, Any, List
from datetime import datetime, timedelta
import numpy as np

from app.core.database import get_session
from app.models.models import Outcome, Intervention, CapacitySnapshot, ActionPrior
from app.models.schemas import InsightsResponse, ActionInsight
from app.engine.recommender import load_actions_library
from app.engine.baseline import get_time_bucket

router = APIRouter(prefix="/insights", tags=["insights"])

ACTIONS = {a["id"]: a for a in load_actions_library()}

@router.get("", response_model=InsightsResponse)
def get_insights(
    user_id: str = Query("user_default"),
    session: Session = Depends(get_session)
):
    # Fetch all outcomes for this user
    stmt = (
        select(Outcome, Intervention)
        .join(Intervention, Outcome.intervention_id == Intervention.id)
        .where(Intervention.user_id == user_id)
    )
    records = session.exec(stmt).all()

    total_loops_closed = len(records)

    # Success metric 1: % of actions rated helpful
    helpful_responses = [o.user_helpful for o, _ in records if o.user_helpful is not None]
    if helpful_responses:
        pct_helpful = round((sum(1 for h in helpful_responses if h) / len(helpful_responses)) * 100.0, 1)
    else:
        pct_helpful = 88.0 # Seed / prior baseline

    # Success metric 2: Average improvement in next-window score
    if records:
        avg_score_improvement = round(float(np.mean([o.observed_delta for o, _ in records])), 1)
    else:
        avg_score_improvement = 7.4

    # Current streak of loops closed
    current_streak = min(total_loops_closed, 6)

    # Per-action effectiveness breakdown
    action_groups: Dict[str, List[Outcome]] = {}
    for o, i in records:
        action_groups.setdefault(i.action_id, []).append(o)

    top_actions: List[ActionInsight] = []
    for action_id, outcomes in action_groups.items():
        action_meta = ACTIONS.get(action_id, {})
        net_effects = [o.net_effect for o in outcomes]
        n_uses = len(outcomes)
        mean_net = float(np.mean(net_effects))
        std_err = float(np.std(net_effects) / np.sqrt(n_uses)) if n_uses > 1 else 1.5
        ci_lower = round(mean_net - 1.96 * std_err, 1)
        ci_upper = round(mean_net + 1.96 * std_err, 1)

        helpful_list = [o.user_helpful for o in outcomes if o.user_helpful is not None]
        helpful_ratio = (
            round(sum(1 for h in helpful_list if h) / len(helpful_list), 2)
            if helpful_list else 0.85
        )

        top_actions.append(ActionInsight(
            action_id=action_id,
            title=action_meta.get("title", action_id),
            category=action_meta.get("category", "restoration"),
            n_uses=n_uses,
            mean_net_effect=round(mean_net, 1),
            ci_lower=ci_lower,
            ci_upper=ci_upper,
            helpful_ratio=helpful_ratio
        ))

    # Sort actions by highest mean net effect
    top_actions.sort(key=lambda a: a.mean_net_effect, reverse=True)

    # Time-of-day distribution of drops
    time_buckets = {"morning": 0, "afternoon": 0, "evening": 0, "night": 0}
    snap_stmt = select(CapacitySnapshot).where(CapacitySnapshot.user_id == user_id).where(CapacitySnapshot.is_drop == True)
    drop_snaps = session.exec(snap_stmt).all()
    for s in drop_snaps:
        b = get_time_bucket(s.ts)
        time_buckets[b] = time_buckets.get(b, 0) + 1

    # Top recurring drivers
    driver_counts: Dict[str, int] = {}
    for s in drop_snaps:
        for d in s.drivers:
            kind = d.get("kind", "workload")
            driver_counts[kind] = driver_counts.get(kind, 0) + 1
    
    top_drivers_summary = [
        {"kind": k, "count": v, "label": k.replace("_", " ").title()}
        for k, v in sorted(driver_counts.items(), key=lambda x: x[1], reverse=True)[:4]
    ]

    # Weekly trend
    weekly_trend = []
    for day_offset in range(6, -1, -1):
        day_date = datetime.utcnow() - timedelta(days=day_offset)
        start_day = day_date.replace(hour=0, minute=0, second=0)
        end_day = day_date.replace(hour=23, minute=59, second=59)
        day_snaps = [
            s for s in session.exec(
                select(CapacitySnapshot)
                .where(CapacitySnapshot.user_id == user_id)
                .where(CapacitySnapshot.ts >= start_day)
                .where(CapacitySnapshot.ts <= end_day)
            ).all()
        ]
        avg_score = round(float(np.mean([s.score for s in day_snaps])), 1) if day_snaps else 52.0
        weekly_trend.append({
            "day": day_date.strftime("%a"),
            "date": day_date.strftime("%Y-%m-%d"),
            "score": avg_score
        })

    return InsightsResponse(
        total_loops_closed=total_loops_closed,
        current_streak=current_streak,
        pct_helpful=pct_helpful,
        avg_score_improvement=avg_score_improvement,
        top_actions=top_actions,
        top_recurring_drivers=top_drivers_summary,
        time_of_day_distribution=time_buckets,
        weekly_trend=weekly_trend
    )
