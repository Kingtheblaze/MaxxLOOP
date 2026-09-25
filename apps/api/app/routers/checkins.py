from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from datetime import datetime, timezone
from typing import Dict, Any

from app.core.database import get_session
from app.core.safety import scan_text_for_crisis
from app.models.models import Signal, CapacitySnapshot, Intervention, User
from app.models.schemas import CheckinCreate
from app.engine.baseline import BaselineEngine
from app.engine.capacity import CapacityEngine
from app.engine.drop_detect import DropDetectionEngine
from app.engine.drivers import DriverEngine
from app.engine.recommender import RecommenderEngine
from app.llm import generate_explanation_with_fallback
import json

router = APIRouter(prefix="/checkins", tags=["checkins"])

@router.post("")
async def create_checkin(
    checkin: CheckinCreate,
    user_id: str = Query("user_default"),
    session: Session = Depends(get_session)
):
    # 1. Safety interceptor: Scan note for crisis keywords
    is_crisis, helpline_data = scan_text_for_crisis(checkin.note)
    if is_crisis:
        # Stop normal flow immediately. Do NOT save the note. Return supportive crisis resources.
        return {
            "status": "crisis_intercepted",
            "message": "Crisis language detected. Normal flow paused.",
            "crisis_card": helpline_data
        }

    # Ensure user exists
    user = session.get(User, user_id)
    if not user:
        user = User(id=user_id, display_name="Student User")
        session.add(user)
        session.commit()

    now = datetime.now(timezone.utc)

    # 2. Ingest self-report signals
    signals_to_add = [
        Signal(user_id=user_id, kind="focus_self", value=checkin.focus_self, source="self_report", ts=now),
        Signal(user_id=user_id, kind="energy_self", value=checkin.energy_self, source="self_report", ts=now),
        Signal(user_id=user_id, kind="stress_self", value=checkin.stress_self, source="self_report", ts=now)
    ]
    session.add_all(signals_to_add)
    session.commit()

    # 3. Gather latest signals for current capacity evaluation
    # Look for passive signals in the last 2 hours (sleep from today)
    all_signals: Dict[str, float] = {
        "focus_self": checkin.focus_self,
        "energy_self": checkin.energy_self,
        "stress_self": checkin.stress_self
    }
    
    # Query most recent signals for other kinds
    other_kinds = [
        "sleep_hours", "meeting_minutes", "back_to_back_count",
        "context_switches_per_hour", "movement_minutes", "hours_since_break"
    ]
    for kind in other_kinds:
        stmt = (
            select(Signal)
            .where(Signal.user_id == user_id)
            .where(Signal.kind == kind)
            .order_by(Signal.ts.desc())
            .limit(1)
        )
        sig = session.exec(stmt).first()
        if sig:
            all_signals[kind] = sig.value

    # 4. Compute Capacity & Baseline
    baseline_engine = BaselineEngine(session)
    capacity_engine = CapacityEngine(baseline_engine)
    score, baseline, driver_details = capacity_engine.compute_capacity(user_id, all_signals)

    # Extract top drivers
    top_drivers = DriverEngine.extract_top_drivers(driver_details, top_k=3)

    # 5. Drop Detection
    drop_engine = DropDetectionEngine(session)
    is_drop, drop_reason = drop_engine.evaluate_drop(user_id, score, baseline)
    cooldown_ok, cooldown_reason = drop_engine.check_cooldown(user_id, now)

    # Create Capacity Snapshot
    snapshot = CapacitySnapshot(
        user_id=user_id,
        ts=now,
        score=score,
        baseline=baseline,
        delta=round(score - baseline, 1),
        drivers_json=json.dumps(top_drivers),
        is_drop=is_drop,
        window_context=checkin.window_context or "normal"
    )
    session.add(snapshot)
    session.commit()
    session.refresh(snapshot)

    active_intervention = None

    # 6. If drop detected and cooldown allows, trigger recommendation & explanation
    if is_drop and cooldown_ok:
        recommender = RecommenderEngine(session)
        driver_kinds = [d["kind"] for d in top_drivers]
        chosen_action, was_exploration, why_chosen, math_details = recommender.select_action(
            user_id, driver_kinds
        )

        # Generate explanation via LLM layer with template fallback
        explanation, provider_used = await generate_explanation_with_fallback(
            score=score,
            baseline=baseline,
            drivers=top_drivers,
            action=chosen_action,
            requested_provider=user.llm_provider
        )

        intervention = Intervention(
            user_id=user_id,
            snapshot_id=snapshot.id,
            action_id=chosen_action["id"],
            chosen_at=now,
            window_minutes=25,
            status="offered",
            explanation_json=json.dumps(explanation.model_dump()),
            explainer_provider=provider_used,
            was_exploration=was_exploration
        )
        session.add(intervention)
        session.commit()
        session.refresh(intervention)

        active_intervention = {
            "intervention_id": intervention.id,
            "action": chosen_action,
            "explanation": explanation.model_dump(),
            "explainer_provider": provider_used,
            "was_exploration": was_exploration,
            "why_chosen": why_chosen,
            "math_details": math_details
        }

    return {
        "status": "success",
        "snapshot_id": snapshot.id,
        "score": score,
        "baseline": baseline,
        "delta": round(score - baseline, 1),
        "is_drop": is_drop,
        "drop_reason": drop_reason,
        "cooldown_ok": cooldown_ok,
        "drivers": top_drivers,
        "active_intervention": active_intervention
    }
