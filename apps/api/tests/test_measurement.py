import pytest
from sqlmodel import Session, SQLModel, create_engine
from app.models.models import Intervention, CapacitySnapshot, Outcome, ActionPrior
from app.engine.measure import MeasurementEngine

@pytest.fixture
def test_db_session():
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

def test_measurement_net_effect_and_posterior_update(test_db_session):
    # Setup test snapshot and intervention
    snap = CapacitySnapshot(
        user_id="user_test",
        score=32.0,
        baseline=50.0,
        delta=-18.0,
        drivers_json="[]",
        is_drop=True
    )
    test_db_session.add(snap)
    test_db_session.commit()

    intervention = Intervention(
        user_id="user_test",
        snapshot_id=snap.id,
        action_id="box_breathing_4x4",
        window_minutes=25,
        status="started"
    )
    test_db_session.add(intervention)
    
    prior = ActionPrior(
        user_id="user_test",
        action_id="box_breathing_4x4",
        alpha=2.0,
        beta=2.0
    )
    test_db_session.add(prior)
    test_db_session.commit()

    measure_engine = MeasurementEngine(test_db_session)
    outcome = measure_engine.record_measurement(
        intervention=intervention,
        pre_score=32.0,
        post_score=44.0, # observed delta = +12.0
        user_helpful=True
    )

    assert outcome.observed_delta == 12.0
    assert outcome.net_effect > 0
    assert outcome.confidence in ["Low", "Medium", "High"]

    # Verify that Beta posterior alpha increased because net_effect > 2.0
    test_db_session.refresh(prior)
    assert prior.alpha == 3.0
    assert prior.beta == 2.0
