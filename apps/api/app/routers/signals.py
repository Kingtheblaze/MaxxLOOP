from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from typing import Optional
from datetime import datetime, timezone

from app.core.auth import get_current_profile
from app.core.database import get_session
from app.models.models import Signal, User
from app.models.schemas import SignalCreate, SignalBatch

router = APIRouter(prefix="/signals", tags=["signals"])

@router.post("")
def ingest_signal(
    signal_in: SignalCreate,
    user: User = Depends(get_current_profile),
    session: Session = Depends(get_session)
):
    user_id = user.id

    if signal_in.source == "calendar" and not user.consent_calendar:
        return {"status": "skipped", "reason": "User has not consented to calendar signals"}
    if signal_in.source == "browser" and not user.consent_browser_signals:
        return {"status": "skipped", "reason": "User has not consented to browser signals"}

    sig = Signal(
        user_id=user_id,
        kind=signal_in.kind,
        value=signal_in.value,
        source=signal_in.source,
        ts=signal_in.ts or datetime.now(timezone.utc)
    )
    session.add(sig)
    session.commit()
    session.refresh(sig)

    return {"status": "success", "signal_id": sig.id}

@router.post("/batch")
def ingest_signal_batch(
    batch: SignalBatch,
    user: User = Depends(get_current_profile),
    session: Session = Depends(get_session)
):
    user_id = user.id

    saved_count = 0
    for s in batch.signals:
        if s.source == "calendar" and not user.consent_calendar:
            continue
        if s.source == "browser" and not user.consent_browser_signals:
            continue
        sig = Signal(
            user_id=user_id,
            kind=s.kind,
            value=s.value,
            source=s.source,
            ts=s.ts or datetime.now(timezone.utc)
        )
        session.add(sig)
        saved_count += 1

    session.commit()
    return {"status": "success", "saved_count": saved_count}

@router.get("")
def list_signals(
    user: User = Depends(get_current_profile),
    kind: Optional[str] = None,
    limit: int = 50,
    session: Session = Depends(get_session)
):
    query = select(Signal).where(Signal.user_id == user.id)
    if kind:
        query = query.where(Signal.kind == kind)
    query = query.order_by(Signal.ts.desc()).limit(limit)
    return [signal.model_dump(exclude={"user_id"}) for signal in session.exec(query).all()]
