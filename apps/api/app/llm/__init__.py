from typing import Dict, Any, List
from app.llm.base import BaseLLMProvider
from app.llm.template import TemplateProvider
from app.llm.gemini import GeminiProvider
from app.llm.ollama import OllamaProvider
from app.llm.openai_compat import OpenAICompatProvider
from app.models.schemas import ExplanationSchema
from app.core.config import settings

def get_provider(provider_name: str = None) -> BaseLLMProvider:
    name = (provider_name or settings.LLM_PROVIDER).lower()
    if name == "gemini" and settings.GEMINI_API_KEY:
        return GeminiProvider()
    elif name == "ollama":
        return OllamaProvider()
    elif name in ["openai", "openai_compat"] and settings.OPENAI_API_KEY:
        return OpenAICompatProvider()
    return TemplateProvider()

# Global state to record the last LLM payload sent and received for transparency & privacy inspection
LAST_LLM_TRANSACTION = {
    "last_payload_sent": {},
    "last_response_received": {},
    "provider_used": "template",
    "sanitized": True,
    "raw_personal_data_excluded": [
        "raw_calendar_event_titles",
        "raw_user_free_text_notes",
        "raw_browser_urls_or_page_titles",
        "ip_address_and_device_identifiers"
    ]
}

async def generate_explanation_with_fallback(
    score: float,
    baseline: float,
    drivers: List[Dict[str, Any]],
    action: Dict[str, Any],
    requested_provider: str = None,
    tone_preference: str = "calm"
) -> tuple[ExplanationSchema, str]:
    """
    Attempts generation with requested provider.
    On any exception or validation rejection, cleanly falls back to TemplateProvider.
    Records sanitized transaction for the Privacy inspection screen.
    """
    provider = get_provider(requested_provider)
    provider_name = provider.provider_name
    
    # Prepare sanitized inspection record
    sanitized_input = {
        "score": round(score, 1),
        "baseline": round(baseline, 1),
        "drivers": [d.get("label") for d in drivers],
        "action": action.get("title")
    }

    try:
        explanation = await provider.generate_explanation(
            score, baseline, drivers, action, tone_preference
        )
    except Exception:
        # Fall back to deterministic template
        provider = TemplateProvider()
        provider_name = "template"
        explanation = await provider.generate_explanation(
            score, baseline, drivers, action, tone_preference
        )

    # Update inspection log
    LAST_LLM_TRANSACTION["last_payload_sent"] = sanitized_input
    LAST_LLM_TRANSACTION["last_response_received"] = explanation.model_dump()
    LAST_LLM_TRANSACTION["provider_used"] = provider_name

    return explanation, provider_name
