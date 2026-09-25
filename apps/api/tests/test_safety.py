import pytest
from app.core.safety import scan_text_for_crisis, HELPLINE_INFO
from app.llm.validator import validate_explanation_text, parse_and_validate_llm_json
from app.models.schemas import ExplanationSchema

def test_crisis_keyword_detection_english():
    text_normal = "Feeling a bit exhausted after late study hours."
    is_crisis, _ = scan_text_for_crisis(text_normal)
    assert is_crisis is False

    text_crisis = "I feel completely hopeless and want to end my life."
    is_crisis, helpline = scan_text_for_crisis(text_crisis)
    assert is_crisis is True
    assert helpline is not None
    assert "14416" in helpline["toll_free_number"]
    assert helpline["primary_helpline"] == "Tele-MANAS"

def test_crisis_keyword_detection_indic():
    text_hindi = "Mujhe marne ka man kar raha hai, bilkul akela hoon."
    is_crisis, helpline = scan_text_for_crisis(text_hindi)
    assert is_crisis is True

    text_kannada = "jeevana saaku antha ansutthe."
    is_crisis, _ = scan_text_for_crisis(text_kannada)
    assert is_crisis is True

def test_banned_medical_claims_rejection():
    # Explanation attempting medical diagnosis or drug claim
    schema_bad = ExplanationSchema(
        headline="Clinical Depression Identified",
        why="Your symptoms indicate clinical ADHD disorder and insomnia.",
        action_intro="Take this medication prescription.",
        encouragement="Hope you cure this disease."
    )
    is_valid = validate_explanation_text(schema_bad, [{"kind": "focus_self"}])
    assert is_valid is False

def test_driver_consistency_check():
    # Driver input only has sleep_hours
    input_drivers = [{"kind": "sleep_hours", "label": "Low sleep"}]
    
    # Mentioning tabs when tab was not in input drivers
    schema_hallucinated = ExplanationSchema(
        headline="Capacity drop",
        why="You were switching tabs too frequently.",
        action_intro="Close your tabs.",
        encouragement="Stay calm."
    )
    is_valid = validate_explanation_text(schema_hallucinated, input_drivers)
    assert is_valid is False
