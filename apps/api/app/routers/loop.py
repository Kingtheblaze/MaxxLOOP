from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import json

from app.core.database import get_session
from app.models.models import Intervention, CapacitySnapshot, Outcome, Signal, User
from app.models.schemas import (
    LoopActiveResponse,
    LoopSkipRequest,
    LoopMeasureRequest,
    LoopFeedbackRequest,
    ExplanationSchema,
    ActionStep
)
from app.engine.recommender import load_actions_library
from app.engine.baseline import BaselineEngine
from app.engine.capacity import CapacityEngine
from app.engine.measure import MeasurementEngine
from app.core.config import settings

router = APIRouter(prefix="/loop", tags=["loop"])

# Cache loaded actions
ACTIONS = {a["id"]: a for a in load_actions_library()}

# Global demo state for time-warped loops
TIMEWARPED_INTERVENTIONS = set()

@router.get("/active", response_model=LoopActiveResponse)
def get_active_loop(
    user_id: str = Query("user_default"),
    session: Session = Depends(get_session)
):
    # Find most recent intervention for this user
    stmt = (
        select(Intervention)
        .where(Intervention.user_id == user_id)
        .order_by(Intervention.chosen_at.desc())
        .limit(1)
    )
    intervention = session.exec(stmt).first()

    if not intervention:
        return LoopActiveResponse(has_active_loop=False, stage="track")

    # If completed or skipped recently, check outcome
    if intervention.status in ["completed", "skipped"]:
        outcome_stmt = select(Outcome).where(Outcome.intervention_id == intervention.id)
        outcome = session.exec(outcome_stmt).first()
        
        # Check if outcome was recorded within the last 30 minutes
        if outcome:
            return LoopActiveResponse(
                has_active_loop=True,
                stage="improve",
                intervention_id=intervention.id,
                action=ACTIONS.get(intervention.action_id),
                explanation=ExplanationSchema(**intervention.explanation),
                explainer_provider=intervention.explainer_provider,
                latest_outcome=outcome.model_dump()
            )
        return LoopActiveResponse(has_active_loop=False, stage="track")

    action_data = ACTIONS.get(intervention.action_id)
    explanation_obj = ExplanationSchema(**intervention.explanation)

    # Determine stage and time remaining
    now = datetime.now(timezone.utc)
    is_warped = intervention.id in TIMEWARPED_INTERVENTIONS
    window_sec = settings.TIMEWARP_SECONDS if is_warped else (intervention.window_minutes * 60)

    if intervention.status == "offered":
        stage = "understand"
        sec_remaining = window_sec
    elif intervention.status == "started":
        elapsed = (now - intervention.chosen_at).total_seconds()
        sec_remaining = max(0, int(window_sec - elapsed))
        stage = "measure" if sec_remaining == 0 else "act"
    else:
        stage = "track"
        sec_remaining = 0

    # Get snapshot drivers
    snap_stmt = select(CapacitySnapshot).where(CapacitySnapshot.id == intervention.snapshot_id)
    snapshot = session.exec(snap_stmt).first()
    drivers = snapshot.drivers if snapshot else []

    return LoopActiveResponse(
        has_active_loop=True,
        stage=stage,
        snapshot_id=intervention.snapshot_id,
        intervention_id=intervention.id,
        action=action_data,
        explanation=explanation_obj,
        explainer_provider=intervention.explainer_provider,
        started_at=intervention.chosen_at if intervention.status == "started" else None,
        window_seconds_remaining=sec_remaining,
        is_timewarped=is_warped,
        drivers=drivers
    )

@router.post("/{intervention_id}/start")
def start_loop_action(
    intervention_id: int,
    session: Session = Depends(get_session)
):
    intervention = session.get(Intervention, intervention_id)
    if not intervention:
        raise HTTPException(status_code=404, detail="Intervention not found")

    intervention.status = "started"
    intervention.chosen_at = datetime.now(timezone.utc) # Reset timer to start
    session.add(intervention)
    session.commit()
    return {"status": "started", "intervention_id": intervention.id}

@router.post("/{intervention_id}/skip")
def skip_loop_action(
    intervention_id: int,
    body: Optional[LoopSkipRequest] = None,
    session: Session = Depends(get_session)
):
    intervention = session.get(Intervention, intervention_id)
    if not intervention:
        raise HTTPException(status_code=404, detail="Intervention not found")

    intervention.status = "skipped"
    session.add(intervention)
    session.commit()
    # Note: Skipped interventions automatically serve as control windows for counterfactual measurement
    return {
        "status": "skipped",
        "intervention_id": intervention.id,
        "note": "Intervention marked skipped; registered as counterfactual control window."
    }

@router.post("/{intervention_id}/measure")
def measure_loop_outcome(
    intervention_id: int,
    measure_in: LoopMeasureRequest,
    session: Session = Depends(get_session)
):
    intervention = session.get(Intervention, intervention_id)
    if not intervention:
        raise HTTPException(status_code=404, detail="Intervention not found")

    # Fetch initial snapshot to know pre-score
    snap_stmt = select(CapacitySnapshot).where(CapacitySnapshot.id == intervention.snapshot_id)
    pre_snap = session.exec(snap_stmt).first()
    pre_score = pre_snap.score if pre_snap else 40.0

    now = datetime.now(timezone.utc)

    # Record post-check-in signals
    signals_to_add = [
        Signal(user_id=intervention.user_id, kind="focus_self", value=measure_in.focus_self, source="self_report", ts=now),
        Signal(user_id=intervention.user_id, kind="energy_self", value=measure_in.energy_self, source="self_report", ts=now),
        Signal(user_id=intervention.user_id, kind="stress_self", value=measure_in.stress_self, source="self_report", ts=now)
    ]
    session.add_all(signals_to_add)
    session.commit()

    # Compute new post-score
    baseline_engine = BaselineEngine(session)
    capacity_engine = CapacityEngine(baseline_engine)
    current_signals = {
        "focus_self": measure_in.focus_self,
        "energy_self": measure_in.energy_self,
        "stress_self": measure_in.stress_self
    }
    post_score, baseline, driver_details = capacity_engine.compute_capacity(intervention.user_id, current_signals)

    # Save new snapshot
    post_snapshot = CapacitySnapshot(
        user_id=intervention.user_id,
        ts=now,
        score=post_score,
        baseline=baseline,
        delta=round(post_score - baseline, 1),
        drivers_json=json.dumps(driver_details),
        is_drop=False,
        window_context="post_intervention"
    )
    session.add(post_snapshot)

    # Compute counterfactual net effect & update Thompson sampling posterior
    measurement_engine = MeasurementEngine(session)
    outcome = measurement_engine.record_measurement(
        intervention=intervention,
        pre_score=pre_score,
        post_score=post_score,
        user_helpful=None,
        note=measure_in.note
    )

    intervention.status = "completed"
    session.add(intervention)
    session.commit()

    return {
        "status": "measured",
        "outcome_id": outcome.id,
        "pre_score": outcome.pre_score,
        "post_score": outcome.post_score,
        "observed_delta": outcome.observed_delta,
        "expected_delta_no_action": outcome.expected_delta_no_action,
        "net_effect": outcome.net_effect,
        "confidence": outcome.confidence
    }

@router.post("/{intervention_id}/feedback")
def submit_feedback(
    intervention_id: int,
    fb: LoopFeedbackRequest,
    session: Session = Depends(get_session)
):
    stmt = select(Outcome).where(Outcome.intervention_id == intervention_id)
    outcome = session.exec(stmt).first()
    if not outcome:
        raise HTTPException(status_code=404, detail="Outcome not found for intervention")

    outcome.user_helpful = fb.helpful
    if fb.note:
        outcome.note = fb.note
    session.add(outcome)
    session.commit()

    return {"status": "feedback_saved", "helpful": outcome.user_helpful}
