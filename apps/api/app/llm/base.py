from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from app.models.schemas import ExplanationSchema

class BaseLLMProvider(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Identifier of the provider (template | gemini | ollama | openai)"""
        pass

    @abstractmethod
    async def generate_explanation(
        self,
        score: float,
        baseline: float,
        drivers: list[Dict[str, Any]],
        action: Dict[str, Any],
        tone_preference: str = "calm"
    ) -> ExplanationSchema:
        """
        Generates structured explanation from redacted parameters.
        Must return validated ExplanationSchema or raise Exception to trigger fallback.
        """
        pass
