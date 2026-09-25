import pytest
from sqlmodel import Session, SQLModel, create_engine
from app.models.models import ActionPrior
from app.engine.recommender import RecommenderEngine, load_actions_library

@pytest.fixture
def test_db_session():
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

def test_actions_library_loaded():
    actions = load_actions_library()
    assert len(actions) >= 20
    for a in actions:
        assert "id" in a
        assert "title" in a
        assert "target_drivers" in a
        assert "duration_min" in a
        assert a.get("risk_level") == "low"

def test_thompson_sampling_selection(test_db_session):
    recommender = RecommenderEngine(test_db_session)
    active_drivers = ["stress_self", "context_switches_per_hour"]

    chosen, was_exploration, why_chosen, math_details = recommender.select_action(
        user_id="user_test",
        active_driver_kinds=active_drivers,
        exploration_rate=0.0 # Force pure Thompson sampling
    )

    assert chosen is not None
    assert "id" in chosen
    assert was_exploration is False
    assert "theta_sample" in math_details
    assert math_details["alpha"] > 0
    assert math_details["beta"] > 0

def test_prior_update(test_db_session):
    recommender = RecommenderEngine(test_db_session)
    prior = recommender.get_or_create_prior("user_test", "box_breathing_4x4")
    initial_alpha = prior.alpha

    prior.alpha += 1.0
    test_db_session.add(prior)
    test_db_session.commit()

    updated = recommender.get_or_create_prior("user_test", "box_breathing_4x4")
    assert updated.alpha == initial_alpha + 1.0
