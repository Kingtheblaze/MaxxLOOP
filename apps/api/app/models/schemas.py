from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class SignalCreate(BaseModel):
    kind: str
    value: float
    source: str = "self_report"
    ts: Optional[datetime] = None

class SignalBatch(BaseModel):
    signals: List[SignalCreate]

class CheckinCreate(BaseModel):
    focus_self: float = Field(ge=1.0, le=5.0)
    energy_self: float = Field(ge=1.0, le=5.0)
    stress_self: float = Field(ge=1.0, le=5.0)
    note: Optional[str] = None
    tags: Optional[List[str]] = []
    window_context: Optional[str] = "normal"

class DriverItem(BaseModel):
    kind: str
    contribution: float
    label: str
    z_score: float

class CapacityResponse(BaseModel):
    score: float
    baseline: float
    delta: float
    is_drop: bool
    status_label: str
    drivers: List[DriverItem]
    sparkline: List[Dict[str, Any]]
    last_updated: datetime

class ActionStep(BaseModel):
    id: str
    title: str
    one_line_why: str
    steps: List[str]
    duration_min: int
    category: str
    target_drivers: List[str]
    caution_note: str
    prior_effect: float
    risk_level: str

class ExplanationSchema(BaseModel):
    headline: str
    why: str
    action_intro: str
    encouragement: str

class LoopActiveResponse(BaseModel):
    has_active_loop: bool
    stage: str # "track" | "understand" | "act" | "measure" | "improve"
    snapshot_id: Optional[int] = None
    intervention_id: Optional[int] = None
    action: Optional[ActionStep] = None
    explanation: Optional[ExplanationSchema] = None
    explainer_provider: Optional[str] = None
    started_at: Optional[datetime] = None
    window_seconds_remaining: Optional[int] = None
    is_timewarped: bool = False
    latest_outcome: Optional[Dict[str, Any]] = None
    drivers: Optional[List[DriverItem]] = None

class LoopStartRequest(BaseModel):
    pass

class LoopSkipRequest(BaseModel):
    reason: Optional[str] = None

class LoopMeasureRequest(BaseModel):
    focus_self: float = Field(ge=1.0, le=5.0)
    energy_self: float = Field(ge=1.0, le=5.0)
    stress_self: float = Field(ge=1.0, le=5.0)
    note: Optional[str] = None

class LoopFeedbackRequest(BaseModel):
    helpful: bool
    note: Optional[str] = None

class ActionInsight(BaseModel):
    action_id: str
    title: str
    category: str
    n_uses: int
    mean_net_effect: float
    ci_lower: float
    ci_upper: float
    helpful_ratio: float

class InsightsResponse(BaseModel):
    total_loops_closed: int
    current_streak: int
    pct_helpful: float
    avg_score_improvement: float
    top_actions: List[ActionInsight]
    top_recurring_drivers: List[Dict[str, Any]]
    time_of_day_distribution: Dict[str, int]
    weekly_trend: List[Dict[str, Any]]

class PrivacyExportResponse(BaseModel):
    user: Dict[str, Any]
    signals_count: int
    snapshots_count: int
    interventions_count: int
    outcomes_count: int
    signals: List[Dict[str, Any]]
    snapshots: List[Dict[str, Any]]
    interventions: List[Dict[str, Any]]
    outcomes: List[Dict[str, Any]]

class LLMPayloadInspection(BaseModel):
    last_payload_sent: Dict[str, Any]
    last_response_received: Dict[str, Any]
    provider_used: str
    sanitized: bool
    raw_personal_data_excluded: List[str]

class DemoSeedRequest(BaseModel):
    persona: str = "aarav" # "aarav" (exam week) | "meera" (meeting heavy)

class DemoTriggerDropRequest(BaseModel):
    drop_severity: float = 18.0

class DemoTimewarpRequest(BaseModel):
    seconds: int = 20
