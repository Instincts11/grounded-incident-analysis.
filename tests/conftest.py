"""Keep developer Groq/OpenAI env from leaking into pytest."""

from __future__ import annotations

import pytest


@pytest.fixture(autouse=True)
def isolate_llm_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("INCIDENT_AGENT_LLM_PROVIDER", raising=False)
    monkeypatch.delenv("INCIDENT_AGENT_GROQ_API_KEY", raising=False)
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    monkeypatch.delenv("INCIDENT_AGENT_OPENAI_API_KEY", raising=False)
