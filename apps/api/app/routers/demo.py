from fastapi import APIRouter, Depends, Query, HTTPException
from sqlmodel import Session, select, delete
from datetime import datetime, timedelta
import random
import json

from app.core.database import get_session
from app.models.models import User, Signal, CapacitySnapshot, Intervention, Outcome, ActionPrior
from app.models.schemas import DemoSeedRequest, DemoTriggerDropRequest, DemoTimewarpRequest
from app.engine.baseline import BaselineEngine
from app.engine.capacity import CapacityEngine
from app.engine.drivers import DriverEngine
from app.engine.recommender import RecommenderEngine, load_actions_library
from app.llm import generate_explanation_with_fallback
from app.routers.loop import TIMEWARPED_INTERVENTIONS
from app.core.config import settings

router = APIRouter(prefix="/demo", tags=["demo"])

ACTIONS = load_actions_library()

PERSONAS = {
    "aarav": {
        "name": "Aarav Sharma",
        "description": "Final-year CS student facing midterms, late-night coding, and high tab thrashing.",
        "sleep_base": 5.8,
        "switches_base": 24.0,
        "meetings_base": 60.0,
        "focus_base": 3.2,
        "energy_base": 2.9,
        "stress_base": 3.8
    },
    "meera": {
        "name": "Meera Patel",
        "description": "Tech Intern overwhelmed with 6+ hours of back-to-back Zoom meetings and zero breaks.",
        "sleep_base": 6.8,
        "switches_base": 12.0,
        "meetings_base": 260.0,
        "focus_base": 3.4,
        "energy_base": 2.7,
        "stress_base": 3.5
    }
}

CURRENT_DEMO_STATE = {
    "persona": "aarav",
    "provider": "template",
    "is_seeded": False,
    "last_drop_triggered": None
}

@router.post("/seed")
def seed_demo_persona(
    req: DemoSeedRequest,
    session: Session = Depends(get_session)
):
    persona_key = req.persona.lower()
    if persona_key not in PERSONAS:
        persona_key = "aarav"

    p_data = PERSONAS[persona_key]
    user_id = "user_default"

    # Reset existing user data
    session.exec(delete(Outcome))
    session.exec(delete(Intervention))
    session.exec(delete(CapacitySnapshot).where(CapacitySnapshot.user_id == user_id))
    session.exec(delete(Signal).where(Signal.user_id == user_id))
    session.exec(delete(ActionPrior).where(ActionPrior.user_id == user_id))
    session.commit()

    user = session.get(User, user_id)
    if not user:
        user = User(id=user_id, display_name=p_data["name"])
        session.add(user)
    else:
        user.display_name = p_data["name"]
        session.add(user)
    session.commit()

    # Generate 14 days of realistic history
    now = datetime.utcnow()
    signals = []
    snapshots = []

    for d in range(14, 0, -1):
        day_date = now - timedelta(days=d)
        
        # 3 check-ins per day (morning, afternoon, evening)
        for hour in [9, 14, 19]:
            ts = day_date.replace(hour=hour, minute=random.randint(5, 50))
            
            # Add slight realistic noise
            focus = float(np_clip(p_data["focus_base"] + random.uniform(-0.8, 0.8), 1.0, 5.0))
            energy = float(np_clip(p_data["energy_base"] + random.uniform(-0.8, 0.8), 1.0, 5.0))
            stress = float(np_clip(p_data["stress_base"] + random.uniform(-0.8, 0.8), 1.0, 5.0))
            sleep = float(np_clip(p_data["sleep_base"] + random.uniform(-0.9, 0.9), 4.0, 9.0))
            switches = float(max(4.0, p_data["switches_base"] + random.uniform(-6.0, 8.0)))
            meetings = float(max(0.0, p_data["meetings_base"] + random.uniform(-40.0, 50.0)))
            movement = float(random.randint(15, 60))

            signals.extend([
                Signal(user_id=user_id, kind="focus_self", value=focus, source="demo", ts=ts),
                Signal(user_id=user_id, kind="energy_self", value=energy, source="demo", ts=ts),
                Signal(user_id=user_id, kind="stress_self", value=stress, source="demo", ts=ts),
                Signal(user_id=user_id, kind="sleep_hours", value=sleep, source="demo", ts=ts),
                Signal(user_id=user_id, kind="context_switches_per_hour", value=switches, source="demo", ts=ts),
                Signal(user_id=user_id, kind="meeting_minutes", value=meetings, source="demo", ts=ts),
                Signal(user_id=user_id, kind="movement_minutes", value=movement, source="demo", ts=ts)
            ])

            # Synthetic baseline score for history graph
            score = 50.0 + (focus - 3.0)*10.0 + (energy - 3.0)*8.0 - (stress - 3.0)*6.0
            score = float(np_clip(score, 25.0, 85.0))
            snapshots.append(CapacitySnapshot(
                user_id=user_id,
                ts=ts,
                score=score,
                baseline=50.0,
                delta=round(score - 50.0, 1),
                drivers_json=json.dumps([
                    {"kind": "focus_self", "contribution": -0.4, "label": "Fluctuating study focus", "z_score": -0.8}
                ]),
                is_drop=(score < 40.0),
                window_context="demo_history"
            ))

    session.add_all(signals)
    session.add_all(snapshots)
    session.commit()

    # Seed past completed intervention & outcome to populate insights
    dummy_interv = Intervention(
        user_id=user_id,
        snapshot_id=snapshots[0].id if snapshots else 1,
        action_id="box_breathing_4x4",
        chosen_at=now - timedelta(days=2),
        window_minutes=25,
        status="completed",
        explanation_json=json.dumps({
            "headline": "Historical recovery logged",
            "why": "Exam anxiety drove sympathetic spike.",
            "action_intro": "Box breathing reset autonomic tone.",
            "encouragement": "Measured 8.2 point net improvement."
        }),
        explainer_provider="template",
        was_exploration=False
    )
    session.add(dummy_interv)
    session.commit()

    dummy_outcome = Outcome(
        intervention_id=dummy_interv.id,
        pre_score=36.0,
        post_score=46.5,
        observed_delta=10.5,
        expected_delta_no_action=2.3,
        net_effect=8.2,
        confidence="Medium",
        user_helpful=True,
        note="Calmed heart rate significantly."
    )
    session.add(dummy_outcome)

    # Seed prior
    prior = ActionPrior(
        user_id=user_id,
        action_id="box_breathing_4x4",
        alpha=5.2,
        beta=1.8
    )
    session.add(prior)
    session.commit()

    CURRENT_DEMO_STATE["persona"] = persona_key
    CURRENT_DEMO_STATE["is_seeded"] = True

    return {
        "status": "seeded",
        "persona": persona_key,
        "persona_name": p_data["name"],
        "description": p_data["description"],
        "signals_seeded": len(signals),
        "snapshots_seeded": len(snapshots)
    }

def np_clip(val, min_v, max_v):
    return max(min_v, min(val, max_v))

@router.post("/trigger-drop")
async def trigger_capacity_drop(
    req: Optional[DemoTriggerDropRequest] = None,
    session: Session = Depends(get_session)
):
    """
    Instantly triggers a capacity drop for the active persona.
    Injects acute drop signals, computes capacity, and creates an intervention.
    """
    user_id = "user_default"
    now = datetime.utcnow()
    user = session.get(User, user_id)
    if not user:
        user = User(id=user_id, display_name="Aarav Sharma")
        session.add(user)
        session.commit()

    # Acute drop signals (high tab switching, sleep loss, high stress)
    drop_signals = [
        Signal(user_id=user_id, kind="focus_self", value=1.5, source="demo", ts=now),
        Signal(user_id=user_id, kind="energy_self", value=1.8, source="demo", ts=now),
        Signal(user_id=user_id, kind="stress_self", value=4.5, source="demo", ts=now),
        Signal(user_id=user_id, kind="sleep_hours", value=4.5, source="demo", ts=now),
        Signal(user_id=user_id, kind="context_switches_per_hour", value=38.0, source="demo", ts=now),
        Signal(user_id=user_id, kind="meeting_minutes", value=180.0, source="demo", ts=now),
        Signal(user_id=user_id, kind="hours_since_break", value=3.5, source="demo", ts=now)
    ]
    session.add_all(drop_signals)
    session.commit()

    baseline_engine = BaselineEngine(session)
    capacity_engine = CapacityEngine(baseline_engine)
    current_signals_map = {
        "focus_self": 1.5,
        "energy_self": 1.8,
        "stress_self": 4.5,
        "sleep_hours": 4.5,
        "context_switches_per_hour": 38.0,
        "meeting_minutes": 180.0,
        "hours_since_break": 3.5
    }
    score, baseline, driver_details = capacity_engine.compute_capacity(user_id, current_signals_map)
    top_drivers = DriverEngine.extract_top_drivers(driver_details, top_k=3)

    # Force score to represent an acute drop (e.g., 32.0 pts)
    drop_score = 32.0
    snapshot = CapacitySnapshot(
        user_id=user_id,
        ts=now,
        score=drop_score,
        baseline=50.0,
        delta=-18.0,
        drivers_json=json.dumps(top_drivers),
        is_drop=True,
        window_context="demo_triggered_drop"
    )
    session.add(snapshot)
    session.commit()
    session.refresh(snapshot)

    # Select ONE action with Thompson Sampling
    recommender = RecommenderEngine(session)
    driver_kinds = [d["kind"] for d in top_drivers]
    chosen_action, was_exploration, why_chosen, math_details = recommender.select_action(
        user_id, driver_kinds
    )

    # Generate explanation
    explanation, provider_used = await generate_explanation_with_fallback(
        score=drop_score,
        baseline=50.0,
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

    CURRENT_DEMO_STATE["last_drop_triggered"] = now.isoformat()

    return {
        "status": "drop_triggered",
        "snapshot_id": snapshot.id,
        "intervention_id": intervention.id,
        "score": drop_score,
        "baseline": 50.0,
        "delta": -18.0,
        "drivers": top_drivers,
        "chosen_action": chosen_action,
        "explanation": explanation.model_dump(),
        "explainer_provider": provider_used,
        "why_chosen": why_chosen
    }

@router.post("/timewarp")
def timewarp_window(
    req: Optional[DemoTimewarpRequest] = None,
    session: Session = Depends(get_session)
):
    """
    Fast-forwards the active intervention's measurement window.
    Sets remaining countdown to 0 so judge can immediately test the 'Measure' phase.
    """
    stmt = (
        select(Intervention)
        .where(Intervention.user_id == "user_default")
        .where(Intervention.status.in_(["offered", "started"]))
        .order_by(Intervention.chosen_at.desc())
        .limit(1)
    )
    active = session.exec(stmt).first()
    if not active:
        raise HTTPException(status_code=400, detail="No active intervention to timewarp.")

    # Mark as timewarped and shift chosen_at back in time to simulate window elapsed
    TIMEWARPED_INTERVENTIONS.add(active.id)
    active.status = "started"
    active.chosen_at = datetime.utcnow() - timedelta(minutes=active.window_minutes + 1)
    session.add(active)
    session.commit()

    return {
        "status": "timewarped",
        "intervention_id": active.id,
        "window_elapsed": True,
        "message": "Window time-warped: Re-check-in / measurement is ready right now."
    }

@router.get("/status")
def get_demo_status():
    return {
        "demo_mode": settings.DEMO_MODE,
        "persona": CURRENT_DEMO_STATE["persona"],
        "is_seeded": CURRENT_DEMO_STATE["is_seeded"],
        "provider": settings.LLM_PROVIDER,
        "timewarp_seconds": settings.TIMEWARP_SECONDS,
        "available_personas": list(PERSONAS.keys())
    }
