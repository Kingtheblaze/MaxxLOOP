import httpx
from typing import Dict, Any, List
from app.llm.base import BaseLLMProvider
from app.llm.validator import parse_and_validate_llm_json
from app.models.schemas import ExplanationSchema
from app.core.config import settings

SYSTEM_PROMPT = """You are MaxxLoop's calm, concise wellness intelligence.
Your task is to explain a student's focus/capacity drop in 1-2 plain, supportive sentences.

NON-NEGOTIABLE SAFETY RULES:
- Never make clinical diagnoses, disease claims, or mention disorders (no depression, ADHD, insomnia, anxiety).
- Never prescribe medicines, diets, fasting, or supplements.
- Never use shame, guilt, or scolding (no 'lazy', 'procrastinating', 'you failed').
- Only reference the specific drivers provided in the prompt. Do not invent unmentioned causes.
- Output MUST be valid JSON adhering strictly to this schema:
{
  "headline": "Short headline (e.g. Focus dipped 18 points below baseline)",
  "why": "Max 2 plain sentences explaining the drop using only provided drivers.",
  "action_intro": "One clear sentence introducing the suggested action.",
  "encouragement": "One calm, grounding closing sentence."
}"""

class GeminiProvider(BaseLLMProvider):
    def __init__(self, api_key: str = None):
        self.api_key = api_key or settings.GEMINI_API_KEY

    @property
    def provider_name(self) -> str:
        return "gemini"

    async def generate_explanation(
        self,
        score: float,
        baseline: float,
        drivers: List[Dict[str, Any]],
        action: Dict[str, Any],
        tone_preference: str = "calm"
    ) -> ExplanationSchema:
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not configured.")

        # Prepare sanitized payload
        redacted_payload = {
            "score": round(score, 1),
            "baseline": round(baseline, 1),
            "delta": round(score - baseline, 1),
            "drivers": [
                {"kind": d["kind"], "label": d["label"], "contribution": d["contribution"]}
                for d in drivers
            ],
            "action": {
                "title": action.get("title"),
                "duration_min": action.get("duration_min"),
                "one_line_why": action.get("one_line_why")
            },
            "tone": tone_preference
        }

        user_prompt = f"Analyze this capacity snapshot and recommend the action:\n{redacted_payload}"

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
        body = {
            "contents": [
                {"role": "user", "parts": [{"text": f"{SYSTEM_PROMPT}\n\n{user_prompt}"}]}
            ],
            "generationConfig": {
                "temperature": 0.2,
                "response_mime_type": "application/json"
            }
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=body)
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]

        validated = parse_and_validate_llm_json(raw_text, drivers)
        if not validated:
            raise ValueError("Gemini response failed strict schema or driver consistency validation.")
        return validated
