from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
import json

class User(SQLModel, table=True):
    id: str = Field(default="user_default", primary_key=True)
    display_name: str = Field(default="Maxx User")
    timezone: str = Field(default="UTC")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Consent flags
    consent_calendar: bool = Field(default=True)
    consent_browser_signals: bool = Field(default=True)
    consent_llm_sharing: bool = Field(default=False)
    llm_provider: str = Field(default="template") # template | gemini | ollama | openai

class Signal(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    ts: datetime = Field(default_factory=datetime.utcnow, index=True)
    kind: str = Field(index=True) # focus_self, energy_self, stress_self, sleep_hours, etc.
    value: float
    source: str = Field(default="self_report") # self_report | calendar | browser | manual | import | demo

class CapacitySnapshot(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    ts: datetime = Field(default_factory=datetime.utcnow, index=True)
    score: float # 0 - 100
    baseline: float # 0 - 100
    delta: float # score - baseline
    drivers_json: str = Field(default="[]") # JSON array of {kind, contribution, label, z_score}
    is_drop: bool = Field(default=False)
    window_context: Optional[str] = Field(default="normal") # normal | exam | intense_meetings | demo

    @property
    def drivers(self) -> List[Dict[str, Any]]:
        try:
            return json.loads(self.drivers_json)
        except Exception:
            return []

    @drivers.setter
    def drivers(self, value: List[Dict[str, Any]]):
        self.drivers_json = json.dumps(value)

class Intervention(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    snapshot_id: int = Field(index=True)
    action_id: str = Field(index=True)
    chosen_at: datetime = Field(default_factory=datetime.utcnow)
    window_minutes: int = Field(default=25)
    status: str = Field(default="offered") # offered | started | completed | skipped
    explanation_json: str = Field(default="{}") # {headline, why, action_intro, encouragement}
    explainer_provider: str = Field(default="template")
    was_exploration: bool = Field(default=False)
    
    @property
    def explanation(self) -> Dict[str, Any]:
        try:
            return json.loads(self.explanation_json)
        except Exception:
            return {}

    @explanation.setter
    def explanation(self, value: Dict[str, Any]):
        self.explanation_json = json.dumps(value)

class Outcome(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    intervention_id: int = Field(index=True)
    pre_score: float
    post_score: float
    observed_delta: float
    expected_delta_no_action: float
    net_effect: float
    confidence: str # Low | Medium | High
    user_helpful: Optional[bool] = Field(default=None)
    note: Optional[str] = Field(default=None)

class ActionPrior(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    action_id: str = Field(index=True)
    alpha: float = Field(default=1.0)
    beta: float = Field(default=1.0)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
