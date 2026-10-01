import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.llm.gemini import GeminiProvider


@pytest.mark.asyncio
async def test_gemini_uses_current_model_and_api_key_header():
    provider = GeminiProvider(api_key="test-key")
    response = MagicMock()
    response.json.return_value = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "text": json.dumps(
                                {
                                    "headline": "Focus is below baseline",
                                    "why": "Low sleep may affect focus.",
                                    "action_intro": "Try a short reset.",
                                    "encouragement": "One step at a time.",
                                }
                            )
                        }
                    ]
                }
            }
        ]
    }
    client = MagicMock()
    client.__aenter__ = AsyncMock(return_value=client)
    client.__aexit__ = AsyncMock(return_value=None)
    client.post = AsyncMock(return_value=response)
    drivers = [{"kind": "sleep_hours", "label": "Low sleep", "contribution": -1}]
    action = {"title": "Breathing", "duration_min": 3, "one_line_why": "Reset"}

    with patch("app.llm.gemini.httpx.AsyncClient", return_value=client):
        await provider.generate_explanation(42, 60, drivers, action)

    url = client.post.call_args.args[0]
    assert url.endswith("gemini-3.8-flash:generateContent")
    assert client.post.call_args.kwargs["headers"] == {"x-goog-api-key": "test-key"}
    assert "key=" not in url