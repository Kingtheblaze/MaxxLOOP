import httpx
from typing import Dict, Any, List
from app.llm.base import BaseLLMProvider
from app.llm.validator import parse_and_validate_llm_json
from app.models.schemas import ExplanationSchema
from app.core.config import settings

OLLAMA_SYSTEM_PROMPT = """You are MaxxLoop's calm, concise wellness intelligence.
Your task is to explain a student's focus/capacity drop in 1-2 plain, supportive sentences.

RULES:
- No medical claims, diagnoses, or disorders.
- No medications, fasting, or supplements.
- No shame or guilt language.
- Only reference the specific drivers provided.
- Output ONLY valid JSON:
{
  "headline": "Short headline",
  "why": "Max 2 plain sentences explaining the drop using only provided drivers.",
  "action_intro": "One clear sentence introducing the suggested action.",
  "encouragement": "One calm closing sentence."
}"""

class OllamaProvider(BaseLLMProvider):
    def __init__(self, base_url: str = None, model: str = None):
        self.base_url = base_url or settings.OLLAMA_BASE_URL
        self.model = model or settings.OLLAMA_MODEL

    @property
    def provider_name(self) -> str:
        return "ollama"

    async def generate_explanation(
        self,
        score: float,
        baseline: float,
        drivers: List[Dict[str, Any]],
        action: Dict[str, Any],
        tone_preference: str = "calm"
    ) -> ExplanationSchema:
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

        url = f"{self.base_url.rstrip('/')}/api/generate"
        body = {
            "model": self.model,
            "prompt": f"{OLLAMA_SYSTEM_PROMPT}\n\nData:\n{redacted_payload}",
            "stream": False,
            "format": "json"
        }

        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post(url, json=body)
            resp.raise_for_status()
            data = resp.json()
            raw_text = data.get("response", "")

        validated = parse_and_validate_llm_json(raw_text, drivers)
        if not validated:
            raise ValueError("Ollama response failed validation.")
        return validated
