import httpx
from typing import Dict, Any, List
from app.llm.base import BaseLLMProvider
from app.llm.validator import parse_and_validate_llm_json
from app.models.schemas import ExplanationSchema
from app.core.config import settings

OPENAI_SYSTEM_PROMPT = """You are MaxxLoop's calm, concise wellness intelligence.
Your task is to explain a student's focus/capacity drop in 1-2 plain, supportive sentences.

RULES:
- No medical claims, diagnoses, or disorders.
- No shame, guilt, or scolding.
- Only reference the specific drivers provided in the prompt.
- Output strictly in JSON:
{
  "headline": "Short headline",
  "why": "Max 2 plain sentences explaining the drop using only provided drivers.",
  "action_intro": "One clear sentence introducing the suggested action.",
  "encouragement": "One calm closing sentence."
}"""

class OpenAICompatProvider(BaseLLMProvider):
    def __init__(self, api_key: str = None, base_url: str = None, model: str = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.base_url = base_url or settings.OPENAI_BASE_URL
        self.model = model or settings.OPENAI_MODEL

    @property
    def provider_name(self) -> str:
        return "openai"

    async def generate_explanation(
        self,
        score: float,
        baseline: float,
        drivers: List[Dict[str, Any]],
        action: Dict[str, Any],
        tone_preference: str = "calm"
    ) -> ExplanationSchema:
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY not provided.")

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
            }
        }

        url = f"{self.base_url.rstrip('/')}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        body = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": OPENAI_SYSTEM_PROMPT},
                {"role": "user", "content": f"Snapshot:\n{redacted_payload}"}
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"}
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, headers=headers, json=body)
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["choices"][0]["message"]["content"]

        validated = parse_and_validate_llm_json(raw_text, drivers)
        if not validated:
            raise ValueError("OpenAI response failed schema or safety validation.")
        return validated
