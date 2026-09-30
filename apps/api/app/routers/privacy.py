from fastapi import APIRouter, Depends
from sqlmodel import Session, select, delete
from app.core.database import get_session
from app.core.auth import AuthenticatedUser, get_current_profile, get_current_user
from app.models.models import User, Signal, CapacitySnapshot, Intervention, Outcome, ActionPrior
from app.models.schemas import PrivacyExportResponse, LLMPayloadInspection
from app.llm import get_llm_transaction

router = APIRouter(prefix="/privacy", tags=["privacy"])

@router.get("/llm-payload", response_model=LLMPayloadInspection)
def inspect_llm_payload(user: AuthenticatedUser = Depends(get_current_user)):
    """
    Shows the exact structured JSON payload sent to the LLM and the raw response received.
    Demonstrates zero transmission of raw calendar titles, browser URLs, or free-text notes.
    """
    return LLMPayloadInspection(**get_llm_transaction(user.id))

@router.get("/export", response_model=PrivacyExportResponse)
def export_user_data(
    user: User = Depends(get_current_profile),
    session: Session = Depends(get_session)
):
    user_id = user.id

    signals = session.exec(select(Signal).where(Signal.user_id == user_id)).all()
    snapshots = session.exec(select(CapacitySnapshot).where(CapacitySnapshot.user_id == user_id)).all()
    interventions = session.exec(select(Intervention).where(Intervention.user_id == user_id)).all()
    
    intervention_ids = [i.id for i in interventions]
    outcomes = session.exec(select(Outcome).where(Outcome.intervention_id.in_(intervention_ids))).all() if intervention_ids else []

    return PrivacyExportResponse(
        user=user.model_dump(exclude={"id"}),
        signals_count=len(signals),
        snapshots_count=len(snapshots),
        interventions_count=len(interventions),
        outcomes_count=len(outcomes),
        signals=[s.model_dump() for s in signals],
        snapshots=[s.model_dump() for s in snapshots],
        interventions=[i.model_dump() for i in interventions],
        outcomes=[o.model_dump() for o in outcomes]
    )

@router.delete("/data")
def delete_all_user_data(
    user: AuthenticatedUser = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Permanently erases all signals, snapshots, interventions, outcomes, and priors for this user.
    """
    user_id = user.id
    interventions = session.exec(select(Intervention).where(Intervention.user_id == user_id)).all()
    for i in interventions:
        session.exec(delete(Outcome).where(Outcome.intervention_id == i.id))

    session.exec(delete(Intervention).where(Intervention.user_id == user_id))
    session.exec(delete(CapacitySnapshot).where(CapacitySnapshot.user_id == user_id))
    session.exec(delete(Signal).where(Signal.user_id == user_id))
    session.exec(delete(ActionPrior).where(ActionPrior.user_id == user_id))

    # Preserve the account; only clear this account's MaxxLoop telemetry.
    profile = session.get(User, user_id)
    if profile:
        profile.consent_calendar = False
        profile.consent_browser_signals = False
        profile.consent_llm_sharing = False
        session.add(profile)
    session.commit()

    return {"status": "success", "message": "Your MaxxLoop data has been permanently deleted."}

@router.post("/consent")
def update_consent(
    consent_calendar: bool,
    consent_browser_signals: bool,
    consent_llm_sharing: bool,
    llm_provider: str = "template",
    user: User = Depends(get_current_profile),
    session: Session = Depends(get_session)
):
    user.consent_calendar = consent_calendar
    user.consent_browser_signals = consent_browser_signals
    user.consent_llm_sharing = consent_llm_sharing
    user.llm_provider = llm_provider
    session.add(user)
    session.commit()
    return {"status": "success", "consent": user.model_dump(exclude={"id"})}
