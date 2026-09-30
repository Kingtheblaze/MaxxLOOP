from datetime import timezone

import pytest
from fastapi.testclient import TestClient
from pymongo.errors import DuplicateKeyError
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app.core import auth as auth_module
from app.core.database import get_session
from app.main import app
from app.models.models import CapacitySnapshot, Intervention, Outcome, User


class MemoryCollection:
    def __init__(self, unique_email=False):
        self.documents = []
        self.unique_email = unique_email

    def create_index(self, *args, **kwargs):
        return None

    def insert_one(self, document):
        if self.unique_email and any(item.get("email") == document.get("email") for item in self.documents):
            raise DuplicateKeyError("duplicate email")
        self.documents.append(dict(document))

    def find_one(self, query):
        for document in self.documents:
            matched = True
            for key, expected in query.items():
                actual = document.get(key)
                if isinstance(expected, dict) and "$gt" in expected:
                    if not actual or actual.replace(tzinfo=timezone.utc) <= expected["$gt"]:
                        matched = False
                elif actual != expected:
                    matched = False
            if matched:
                return dict(document)
        return None

    def delete_one(self, query):
        before = len(self.documents)
        self.documents = [item for item in self.documents if any(item.get(k) != v for k, v in query.items())]
        return type("DeleteResult", (), {"deleted_count": before - len(self.documents)})()


class MemoryDatabase:
    def __init__(self):
        self.users = MemoryCollection(unique_email=True)
        self.sessions = MemoryCollection()

    def __getitem__(self, name):
        return getattr(self, name)


@pytest.fixture
def client(monkeypatch):
    database = MemoryDatabase()
    monkeypatch.setattr(auth_module, "get_auth_database", lambda: database)
    monkeypatch.setattr(auth_module, "ensure_auth_indexes", lambda db: None)
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    def get_test_session():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = get_test_session
    with TestClient(app) as test_client:
        test_client.auth_database = database
        test_client.test_engine = engine
        yield test_client
    app.dependency_overrides.clear()
    engine.dispose()


def signup(client, name, email, password="a-long-test-password"):
    return client.post("/auth/signup", json={"name": name, "email": email, "password": password})


def test_signup_hashes_password_and_returns_only_public_user(client):
    response = signup(client, "User A", "User@Gmail.com")
    assert response.status_code == 201
    assert response.json()["user"]["email"] == "user@gmail.com"
    assert "password" not in response.json()["user"]
    assert "passwordHash" not in response.json()["user"]
    stored = client.auth_database.users.documents[0]
    assert stored["passwordHash"] != "a-long-test-password"
    assert stored["passwordHash"].startswith("$argon2id$")
    session_token = response.cookies.get("maxxloop_session")
    assert session_token
    assert client.auth_database.sessions.documents[0]["_id"] != session_token
    assert len(client.auth_database.sessions.documents[0]["_id"]) == 64
    assert client.get("/auth/me").json()["user"]["name"] == "User A"
    assert "passwordHash" not in client.get("/auth/me").text
    assert client.post("/auth/logout").status_code == 200
    assert client.get("/auth/me").status_code == 401


def test_email_normalization_duplicate_and_invalid_credentials(client):
    assert signup(client, "User A", "User@Gmail.com").status_code == 201
    duplicate = signup(client, "Another", "user@gmail.com")
    assert duplicate.status_code == 409
    invalid = client.post("/auth/login", json={"email": "missing@example.com", "password": "wrong-password"})
    assert invalid.status_code == 401
    assert invalid.json()["detail"] == "Invalid email or password."
    wrong_password = client.post("/auth/login", json={"email": "user@gmail.com", "password": "wrong-password"})
    assert wrong_password.status_code == 401
    assert wrong_password.json()["detail"] == "Invalid email or password."


def test_password_length_and_email_validation(client):
    assert client.post("/auth/signup", json={"name": "Name", "email": "nope", "password": "12345678"}).status_code == 422
    assert client.post("/auth/signup", json={"name": "Name", "email": "name@example.com", "password": "short"}).status_code == 422


def test_user_data_isolation_and_untrusted_user_id_is_ignored(client):
    response_a = signup(client, "User A", "a@example.com")
    assert response_a.status_code == 201
    id_a = response_a.json()["user"]["id"]
    assert client.post("/signals", params={"user_id": "user_default"}, json={"kind": "focus_self", "value": 2}).status_code == 200
    assert len(client.get("/signals", params={"user_id": "user_default"}).json()) == 1

    assert client.post("/auth/logout").status_code == 200
    assert client.get("/auth/me").status_code == 401
    assert signup(client, "User B", "b@example.com").status_code == 201
    id_b = client.get("/auth/me").json()["user"]["id"]
    assert id_a != id_b
    assert client.get("/signals", params={"user_id": id_a}).json() == []
    assert client.post("/signals", json={"kind": "focus_self", "value": 4}).status_code == 200
    assert [item["value"] for item in client.get("/signals", params={"user_id": id_a}).json()] == [4]

    client.post("/auth/logout")
    assert client.post("/auth/login", json={"email": "a@example.com", "password": "a-long-test-password"}).status_code == 200
    assert [item["value"] for item in client.get("/signals", params={"user_id": id_b}).json()] == [2]


def test_protected_routes_and_object_ids_require_ownership(client):
    assert client.get("/capacity/now").status_code == 401
    assert client.get("/insights").status_code == 401
    assert client.get("/demo/status").status_code == 401
    assert client.get("/privacy/export").status_code == 401
    response = signup(client, "User A", "owner@example.com")
    owner_id = response.json()["user"]["id"]
    with Session(client.test_engine) as session:
        intervention = Intervention(user_id=owner_id, snapshot_id=1, action_id="test_action")
        session.add(intervention)
        session.commit()
        intervention_id = intervention.id
    client.post("/auth/logout")
    assert signup(client, "User B", "attacker@example.com").status_code == 201
    attack = client.post(f"/loop/{intervention_id}/start")
    assert attack.status_code == 404
    with Session(client.test_engine) as session:
        assert session.get(Intervention, intervention_id).status == "offered"


def test_demo_reseeding_cannot_delete_account_outcomes(client):
    account = signup(client, "Account User", "account@example.com")
    assert account.status_code == 201
    account_id = account.json()["user"]["id"]
    assert client.post("/signals", json={"kind": "focus_self", "value": 3}).status_code == 200

    with Session(client.test_engine) as session:
        snapshot = CapacitySnapshot(user_id=account_id, score=50, baseline=50, delta=0)
        session.add(snapshot)
        session.commit()
        session.refresh(snapshot)
        intervention = Intervention(user_id=account_id, snapshot_id=snapshot.id, action_id="test_action")
        session.add(intervention)
        session.commit()
        session.refresh(intervention)
        outcome = Outcome(
            intervention_id=intervention.id,
            pre_score=50,
            post_score=55,
            observed_delta=5,
            expected_delta_no_action=0,
            net_effect=5,
            confidence="Low",
        )
        session.add(outcome)
        session.commit()
        outcome_id = outcome.id

    seeded = client.post("/demo/seed", json={"persona": "aarav"})
    assert seeded.status_code == 200
    with Session(client.test_engine) as session:
        assert session.get(Outcome, outcome_id) is not None
    assert len(client.get("/signals").json()) == 1
