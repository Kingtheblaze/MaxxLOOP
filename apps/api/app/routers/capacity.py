from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any

from app.core.database import get_session
from app.models.models import CapacitySnapshot, User
from app.models.schemas import CapacityResponse
from app.core.safety import check_persistent_low_capacity

router = APIRouter(prefix="/capacity", tags=["capacity"])

@router.get("/now", response_model=CapacityResponse)
def get_current_capacity(
    user_id: str = Query("user_default"),
    session: Session = Depends(get_session)
):
    # Ensure user exists
    user = session.get(User, user_id)
    if not user:
        user = User(id=user_id, display_name="Student User")
        session.add(user)
        session.commit()

    # Get latest snapshot
    stmt = (
        select(CapacitySnapshot)
        .where(CapacitySnapshot.user_id == user_id)
        .order_by(CapacitySnapshot.ts.desc())
        .limit(1)
    )
    latest_snapshot = session.exec(stmt).first()

    # Get 14-day history for sparkline
    cutoff = datetime.now(timezone.utc) - timedelta(days=14)
    sparkline_stmt = (
        select(CapacitySnapshot)
        .where(CapacitySnapshot.user_id == user_id)
        .where(CapacitySnapshot.ts >= cutoff)
        .order_by(CapacitySnapshot.ts.asc())
    )
    history = session.exec(sparkline_stmt).all()

    sparkline_data = [
        {
            "ts": s.ts.isoformat(),
            "score": round(s.score, 1),
            "baseline": round(s.baseline, 1),
            "is_drop": s.is_drop
        }
        for s in history
    ]

    # Check persistent low capacity
    past_scores = [s.score for s in history]
    is_persistent_low = check_persistent_low_capacity(past_scores, threshold=30.0, days=5)

    if latest_snapshot:
        score = latest_snapshot.score
        baseline = latest_snapshot.baseline
        delta = latest_snapshot.delta
        is_drop = latest_snapshot.is_drop
        drivers = latest_snapshot.drivers
        last_updated = latest_snapshot.ts
    else:
        # Default cold start state
        score = 50.0
        baseline = 50.0
        delta = 0.0
        is_drop = False
        drivers = []
        last_updated = datetime.now(timezone.utc)

    # Determine status label
    if is_drop:
        status_label = "Capacity Drop Detected"
    elif score >= 65.0:
        status_label = "Optimal Focus & Energy"
    elif score <= 35.0:
        status_label = "Depleted Capacity"
    else:
        status_label = "Balanced Operational Capacity"

    if is_persistent_low:
        status_label += " (Low trend: consider talking to someone)"

    # Clean drivers to ensure label and z_score are populated
    clean_drivers = []
    for d in drivers:
        clean_drivers.append({
            "kind": d.get("kind", "signal"),
            "contribution": d.get("contribution", 0.0),
            "label": d.get("label") or f"{d.get('kind', 'Signal').replace('_', ' ').title()} variation",
            "z_score": d.get("z_score", 0.0)
        })

    return CapacityResponse(
        score=score,
        baseline=baseline,
        delta=delta,
        is_drop=is_drop,
        status_label=status_label,
        drivers=clean_drivers,
        sparkline=sparkline_data,
        last_updated=last_updated
    )
