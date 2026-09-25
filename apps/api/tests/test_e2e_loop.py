import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from app.main import app
from app.core.database import get_session

@pytest.fixture(name="client")
def client_fixture():
    # Use memory database for e2e test isolation
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)

    def get_test_session():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = get_test_session
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()

def test_full_closed_loop_e2e(client):
    # Step 1: Health check
    health_resp = client.get("/health")
    assert health_resp.status_code == 200
    assert health_resp.json()["status"] == "healthy"

    # Step 2: Seed Demo Persona (Aarav)
    seed_resp = client.post("/demo/seed", json={"persona": "aarav"})
    assert seed_resp.status_code == 200
    assert seed_resp.json()["status"] == "seeded"

    # Step 3: Trigger Capacity Drop
    drop_resp = client.post("/demo/trigger-drop")
    assert drop_resp.status_code == 200
    drop_data = drop_resp.json()
    assert drop_data["status"] == "drop_triggered"
    assert drop_data["score"] < 40.0
    assert len(drop_data["drivers"]) > 0
    assert drop_data["chosen_action"] is not None
    intervention_id = drop_data["intervention_id"]

    # Step 4: Verify Active Loop State (Understand stage)
    active_resp = client.get("/loop/active")
    assert active_resp.status_code == 200
    active_data = active_resp.json()
    assert active_data["has_active_loop"] is True
    assert active_data["stage"] == "understand"
    assert active_data["action"]["id"] == drop_data["chosen_action"]["id"]

    # Step 5: Start the action
    start_resp = client.post(f"/loop/{intervention_id}/start")
    assert start_resp.status_code == 200
    assert start_resp.json()["status"] == "started"

    # Step 6: Timewarp window for rapid demo
    warp_resp = client.post("/demo/timewarp")
    assert warp_resp.status_code == 200

    # Step 7: Measure post-action outcome (Measure stage)
    measure_payload = {
        "focus_self": 4.0,
        "energy_self": 3.8,
        "stress_self": 2.2,
        "note": "Felt noticeable calm and clarity."
    }
    measure_resp = client.post(f"/loop/{intervention_id}/measure", json=measure_payload)
    assert measure_resp.status_code == 200
    outcome_data = measure_resp.json()
    assert outcome_data["status"] == "measured"
    assert outcome_data["post_score"] > outcome_data["pre_score"]
    assert outcome_data["net_effect"] > 0
    assert outcome_data["confidence"] in ["Low", "Medium", "High"]

    # Step 8: Submit feedback to close loop (Improve stage)
    feedback_resp = client.post(f"/loop/{intervention_id}/feedback", json={"helpful": True, "note": "Great reset"})
    assert feedback_resp.status_code == 200
    assert feedback_resp.json()["helpful"] is True

    # Step 9: Verify Insights aggregated
    insights_resp = client.get("/insights")
    assert insights_resp.status_code == 200
    insights_data = insights_resp.json()
    assert insights_data["total_loops_closed"] >= 1
    assert insights_data["pct_helpful"] > 50.0

    # Step 10: Privacy Transparency Check
    privacy_resp = client.get("/privacy/llm-payload")
    assert privacy_resp.status_code == 200
    assert privacy_resp.json()["sanitized"] is True
    assert len(privacy_resp.json()["raw_personal_data_excluded"]) > 0
