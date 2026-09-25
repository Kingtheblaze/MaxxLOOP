import json
import os
import random
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
from sqlmodel import Session, select
from app.models.models import ActionPrior

ACTIONS_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "actions.json")

def load_actions_library() -> List[Dict[str, Any]]:
    with open(ACTIONS_PATH, "r") as f:
        return json.load(f)

class RecommenderEngine:
    def __init__(self, session: Session):
        self.session = session
        self.actions = load_actions_library()
        self.actions_by_id = {a["id"]: a for a in self.actions}

    def get_or_create_prior(self, user_id: str, action_id: str) -> ActionPrior:
        stmt = (
            select(ActionPrior)
            .where(ActionPrior.user_id == user_id)
            .where(ActionPrior.action_id == action_id)
        )
        prior = self.session.exec(stmt).first()
        if not prior:
            action = self.actions_by_id.get(action_id, {})
            # Initialize prior with strength = 4
            base_prior = float(action.get("prior_effect", 0.60))
            prior = ActionPrior(
                user_id=user_id,
                action_id=action_id,
                alpha=base_prior * 4.0,
                beta=(1.0 - base_prior) * 4.0
            )
            self.session.add(prior)
            self.session.commit()
            self.session.refresh(prior)
        return prior

    def select_action(
        self,
        user_id: str,
        active_driver_kinds: List[str],
        exploration_rate: float = 0.15
    ) -> Tuple[Dict[str, Any], bool, str, Dict[str, Any]]:
        """
        1. Filters actions overlapping active drivers.
        2. Pulls or creates Beta priors for each candidate.
        3. Samples from Beta(alpha, beta) for each.
        4. Selects winning action (or random candidate if exploring).
        Returns: (chosen_action, was_exploration, why_chosen, math_details)
        """
        # Filter candidate actions by overlapping target_drivers
        candidates = []
        for a in self.actions:
            overlap = set(a.get("target_drivers", [])).intersection(set(active_driver_kinds))
            if overlap:
                candidates.append((a, list(overlap)))

        # Fallback to general restorative actions if no strict overlap
        if not candidates:
            candidates = [(a, ["general"]) for a in self.actions if a.get("category") in ["breathing", "hydration", "short break"]]

        sampled_scores = []
        priors_info = {}
        for action, overlap in candidates:
            prior = self.get_or_create_prior(user_id, action["id"])
            priors_info[action["id"]] = {"alpha": round(prior.alpha, 2), "beta": round(prior.beta, 2)}
            sample = np.random.beta(prior.alpha, prior.beta)
            sampled_scores.append((sample, action, overlap, prior))

        # Determine exploration
        is_exploring = random.random() < exploration_rate
        if is_exploring and len(candidates) > 1:
            chosen_sample, chosen_action, overlap, prior = random.choice(sampled_scores)
            was_exploration = True
            why_chosen = f"Selected via 15% exploration window to test alternative recovery pathway."
        else:
            # Thompson sampling: choose highest draw
            sampled_scores.sort(key=lambda x: x[0], reverse=True)
            chosen_sample, chosen_action, overlap, prior = sampled_scores[0]
            was_exploration = False
            why_chosen = (
                f"Selected as highest expected payoff (Thompson sampled θ={round(chosen_sample, 3)}) "
                f"addressing active drivers: {', '.join(overlap)}."
            )

        math_details = {
            "theta_sample": round(float(chosen_sample), 3),
            "alpha": round(prior.alpha, 2),
            "beta": round(prior.beta, 2),
            "prior_mean": round(prior.alpha / (prior.alpha + prior.beta), 3),
            "all_candidates": [
                {
                    "action_id": a["id"],
                    "title": a["title"],
                    "theta": round(float(s), 3),
                    "alpha": round(p.alpha, 2),
                    "beta": round(p.beta, 2)
                }
                for s, a, o, p in sampled_scores
            ]
        }

        return chosen_action, was_exploration, why_chosen, math_details
