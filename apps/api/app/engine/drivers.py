from typing import List, Dict, Any

def generate_driver_label(kind: str, raw_val: float, median: float, z_score: float) -> str:
    """
    Translates mathematical deviations into calm, human, non-judgmental explanations.
    """
    diff = raw_val - median

    if kind == "sleep_hours":
        if diff < 0:
            return f"You slept {abs(round(diff, 1))}h less than your usual baseline ({round(median, 1)}h)"
        return f"Sleep duration slightly irregular ({round(raw_val, 1)}h vs {round(median, 1)}h)"

    elif kind == "context_switches_per_hour":
        if diff > 0:
            ratio = round(raw_val / max(median, 1.0), 1)
            return f"Tab switching is {ratio}x higher than your usual sprint pace"
        return "Frequent browser context shifts during your session"

    elif kind == "meeting_minutes":
        return f"{int(raw_val)} minutes of calendar load logged today"

    elif kind == "back_to_back_count":
        return f"{int(raw_val)} back-to-back meetings without buffer time"

    elif kind == "stress_self":
        return f"Self-reported stress level is elevated ({round(raw_val, 1)}/5)"

    elif kind == "energy_self":
        return f"Energy level is {abs(round(diff, 1))} pts below your typical afternoon level"

    elif kind == "focus_self":
        return f"Focus rating is {abs(round(diff, 1))} pts below your typical baseline"

    elif kind == "hours_since_break":
        return f"Over {round(raw_val, 1)} hours elapsed since your last restorative break"

    elif kind == "movement_minutes":
        return f"Sedentary desk posture: only {int(raw_val)}m movement logged"

    elif kind == "screen_minutes":
        return f"Extended screen exposure: {int(raw_val)}m active monitor time"

    return f"{kind.replace('_', ' ').capitalize()} deviated from your baseline"

class DriverEngine:
    @staticmethod
    def extract_top_drivers(driver_details: List[Dict[str, Any]], top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Filters and sorts by most negative contribution.
        Returns top 2-3 negative contributors with human labels.
        """
        # Negative contribution means it pulled capacity DOWN
        negative_drivers = [d for d in driver_details if d.get("contribution", 0.0) < 0.0]
        
        # Sort ascending (most negative first)
        negative_drivers.sort(key=lambda x: x["contribution"])

        top = negative_drivers[:top_k]
        result = []
        for d in top:
            label = generate_driver_label(
                d["kind"],
                d.get("raw_value", 0.0),
                d.get("median", 0.0),
                d.get("z_score", 0.0)
            )
            result.append({
                "kind": d["kind"],
                "contribution": d["contribution"],
                "label": label,
                "z_score": d["z_score"]
            })
        return result
