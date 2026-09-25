import re
import json
from typing import Dict, Any, List, Optional
from app.models.schemas import ExplanationSchema

# Banned medical / diagnostic terms and guilt-inducing phrases
BANNED_TERMS = [
    r"\b(diagnos|patholog|disorder|prescrib|medicat|cure|treat(ing|ment)?\s+disease)\b",
    r"\b(depression|adhd|bipolar|insomnia|clinical|neurosis|syndrome)\b",
    r"\b(lazy|guilty|failure|disappointing|procrastinating|wasting\s+time|shame)\b",
    r"\b(fasting|detox|supplements|adderall|nootropic)\b"
]

BANNED_REGEX = re.compile("|".join(BANNED_TERMS), re.IGNORECASE)

ALL_POSSIBLE_DRIVERS = {
    "sleep": ["sleep_hours", "sleep"],
    "meeting": ["meeting_minutes", "back_to_back_count"],
    "tab": ["context_switches_per_hour"],
    "switch": ["context_switches_per_hour"],
    "stress": ["stress_self"],
    "break": ["hours_since_break"],
    "screen": ["screen_minutes"],
    "movement": ["movement_minutes"],
    "energy": ["energy_self"],
    "focus": ["focus_self"]
}

def validate_explanation_text(
    explanation: ExplanationSchema,
    input_drivers: List[Dict[str, Any]]
) -> bool:
    """
    Validates:
    1. No banned medical or guilt terms.
    2. Driver consistency: does not hallucinate drivers that were absent from the input.
    """
    full_text = f"{explanation.headline} {explanation.why} {explanation.action_intro} {explanation.encouragement}"

    # Check banned terms
    if BANNED_REGEX.search(full_text):
        return False

    # Check driver consistency
    input_driver_kinds = [d.get("kind", "") for d in input_drivers]
    
    # Check for hallucinated drivers
    for keyword, linked_kinds in ALL_POSSIBLE_DRIVERS.items():
        if re.search(r"\b" + keyword + r"\b", full_text, re.IGNORECASE):
            # If keyword is present, at least one linked kind must be in input drivers or general
            matched = any(k in input_driver_kinds for k in linked_kinds)
            # Allow general terms like focus or energy as they describe general capacity
            if not matched and keyword not in ["focus", "energy"]:
                return False

    return True

def parse_and_validate_llm_json(
    raw_response: str,
    input_drivers: List[Dict[str, Any]]
) -> Optional[ExplanationSchema]:
    """
    Extracts JSON object from text, validates against ExplanationSchema, and applies safety checks.
    """
    try:
        # Extract json block if surrounded by markdown code blocks
        clean_text = raw_response.strip()
        if "```json" in clean_text:
            clean_text = clean_text.split("```json")[1].split("```")[0].strip()
        elif "```" in clean_text:
            clean_text = clean_text.split("```")[1].split("```")[0].strip()

        data = json.loads(clean_text)
        schema = ExplanationSchema(
            headline=data.get("headline", "Capacity Drop Detected"),
            why=data.get("why", ""),
            action_intro=data.get("action_intro", ""),
            encouragement=data.get("encouragement", "")
        )

        if validate_explanation_text(schema, input_drivers):
            return schema
        return None
    except Exception:
        return None
