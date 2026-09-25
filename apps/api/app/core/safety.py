import re
from typing import Tuple, Dict, Any, Optional

# Crisis keywords in English and transliterated Hindi/Kannada
CRISIS_PATTERNS = [
    # English
    r"\b(suicide|suicidal|kill\s+myself|end\s+my\s+life|want\s+to\s+die|no\s+reason\s+to\s+live)\b",
    r"\b(self[\s-]?harm|cut\s+myself|hopeless|cannot\s+go\s+on|can\'?t\s+go\s+on|worthless)\b",
    r"\b(better\s+off\s+dead|giving\s+up\s+on\s+life)\b",
    # Transliterated Hindi
    r"\b(mar\s+jaana|khudkushi|jeene\s+ka\s+man\s+nahi|marne\s+ka\s+man)\b",
    # Transliterated Kannada
    r"\b(saayabeku|jeevana\s+saaku|aathmahatye)\b"
]

CRISIS_REGEX = re.compile("|".join(CRISIS_PATTERNS), re.IGNORECASE)

HELPLINE_INFO = {
    "country": "India",
    "primary_helpline": "Tele-MANAS",
    "toll_free_number": "14416 / 1800-891-4416",
    # Note: Tele-MANAS is India's 24/7 mental health helpline. Verify before production deployment.
    "secondary_helpline": "KIRAN Helpline (1800-599-0019)",
    "international_resource": "Find a local helpline: https://findahelpline.com/",
    "support_message": (
        "We noticed you may be carrying an overwhelming amount of weight right now. "
        "MaxxLoop is a student focus and energy companion, not a crisis or medical service. "
        "Please connect with someone who can support you right now."
    ),
    "disclaimer": "Wellness support companion, not medical advice. No diagnoses, treatments, or prescriptions."
}

def scan_text_for_crisis(text: Optional[str]) -> Tuple[bool, Optional[Dict[str, Any]]]:
    """
    Scans text for crisis keywords.
    Returns:
        (is_crisis, helpline_payload)
    If crisis is detected, raw text must NOT be stored in the database.
    """
    if not text:
        return False, None
    
    if CRISIS_REGEX.search(text):
        return True, HELPLINE_INFO
    
    return False, None

def check_persistent_low_capacity(recent_scores: list[float], threshold: float = 30.0, days: int = 5) -> bool:
    """
    If capacity remains below threshold for multiple days, recommend talking to someone.
    """
    if len(recent_scores) < days:
        return False
    return all(score < threshold for score in recent_scores[-days:])
