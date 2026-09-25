from typing import Dict, Any, List
from app.llm.base import BaseLLMProvider
from app.models.schemas import ExplanationSchema

class TemplateProvider(BaseLLMProvider):
    @property
    def provider_name(self) -> str:
        return "template"

    async def generate_explanation(
        self,
        score: float,
        baseline: float,
        drivers: List[Dict[str, Any]],
        action: Dict[str, Any],
        tone_preference: str = "calm"
    ) -> ExplanationSchema:
        """
        Deterministic, zero-API-key fallback generator.
        Constructs clear, calm, non-judgmental human language explanations directly from calculated drivers.
        """
        pts_down = int(round(abs(baseline - score)))
        headline = f"Focus and capacity dipped {pts_down} points below your normal."

        # Summarize primary driver in plain language
        if drivers:
            primary_driver = drivers[0]
            label = primary_driver.get("label", "Elevated workload tension")
            if len(drivers) > 1:
                secondary_label = drivers[1].get("label", "")
                why = f"{label}. Additionally, {secondary_label.lower()}."
            else:
                why = f"{label}."
        else:
            why = "Your cognitive load has outpaced your recovery capacity over the last window."

        action_title = action.get("title", "micro-recovery action")
        duration = action.get("duration_min", 3)
        one_line_why = action.get("one_line_why", "Restores physiological equilibrium.")

        action_intro = f"Take a {duration}-minute {action_title}. {one_line_why}"
        encouragement = "One focused intervention closes the loop. Step into it without rushing."

        return ExplanationSchema(
            headline=headline,
            why=why,
            action_intro=action_intro,
            encouragement=encouragement
        )
