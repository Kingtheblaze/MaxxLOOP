import pytest
import numpy as np
from datetime import datetime, timedelta
from sqlmodel import Session, SQLModel, create_engine

from app.models.models import Signal, CapacitySnapshot, User
from app.engine.baseline import BaselineEngine, compute_mad, get_time_bucket
from app.engine.capacity import CapacityEngine
from app.engine.drop_detect import DropDetectionEngine
from app.engine.drivers import DriverEngine

@pytest.fixture
def test_db_session():
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

def test_mad_computation():
    # Regular values with clear median
    data = np.array([2.0, 3.0, 3.0, 4.0, 5.0])
    mad = compute_mad(data)
    assert mad > 0.0

    # Flat data edge case (MAD should not divide by zero)
    flat = np.array([4.0, 4.0, 4.0, 4.0])
    mad_flat = compute_mad(flat)
    assert mad_flat == 0.01

def test_time_bucketing():
    dt_morning = datetime(2026, 4, 1, 9, 30)
    dt_afternoon = datetime(2026, 4, 1, 14, 0)
    dt_evening = datetime(2026, 4, 1, 20, 15)
    dt_night = datetime(2026, 4, 1, 2, 45)

    assert get_time_bucket(dt_morning) == "morning"
    assert get_time_bucket(dt_afternoon) == "afternoon"
    assert get_time_bucket(dt_evening) == "evening"
    assert get_time_bucket(dt_night) == "night"

def test_capacity_scoring(test_db_session):
    baseline_eng = BaselineEngine(test_db_session)
    capacity_eng = CapacityEngine(baseline_eng)

    # Balanced normal signals -> should be around 50.0
    signals = {
        "focus_self": 3.5,
        "energy_self": 3.2,
        "stress_self": 2.6,
        "sleep_hours": 7.2,
        "context_switches_per_hour": 14.0,
        "meeting_minutes": 120.0
    }
    score, baseline, drivers = capacity_eng.compute_capacity("test_user", signals)
    assert 45.0 <= score <= 55.0
    assert baseline == 50.0

    # Acute fatigue / drop signals -> should be significantly below 50.0
    fatigue_signals = {
        "focus_self": 1.5,
        "energy_self": 1.5,
        "stress_self": 4.5,
        "sleep_hours": 4.5,
        "context_switches_per_hour": 35.0,
        "meeting_minutes": 250.0
    }
    drop_score, _, fatigue_drivers = capacity_eng.compute_capacity("test_user", fatigue_signals)
    assert drop_score < 40.0
    assert len(fatigue_drivers) > 0

def test_drop_detection_and_cooldown(test_db_session):
    drop_eng = DropDetectionEngine(test_db_session)

    # Significant drop test
    is_drop, reason = drop_eng.evaluate_drop("test_user", current_score=35.0, baseline_score=50.0)
    assert is_drop is True
    assert "below normal" in reason

    # Within normal bounds
    is_not_drop, _ = drop_eng.evaluate_drop("test_user", current_score=48.0, baseline_score=50.0)
    assert is_not_drop is False

    # Cooldown check
    can_intervene, _ = drop_eng.check_cooldown("test_user")
    assert can_intervene is True

def test_driver_attribution():
    driver_details = [
        {"kind": "focus_self", "raw_value": 2.0, "median": 3.5, "z_score": -1.5, "contribution": -0.45},
        {"kind": "context_switches_per_hour", "raw_value": 30.0, "median": 12.0, "z_score": -2.0, "contribution": -0.20},
        {"kind": "movement_minutes", "raw_value": 45.0, "median": 30.0, "z_score": 1.0, "contribution": 0.05}
    ]
    top_drivers = DriverEngine.extract_top_drivers(driver_details, top_k=2)
    assert len(top_drivers) == 2
    assert top_drivers[0]["kind"] == "focus_self"
    assert "focus" in top_drivers[0]["label"].lower()
    assert top_drivers[1]["kind"] == "context_switches_per_hour"
