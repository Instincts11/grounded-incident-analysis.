from __future__ import annotations

import os
from pathlib import Path

import pytest

from incident_agent.llm.environment import groq_compatible_model, load_project_env


def test_load_project_env_does_not_overwrite_existing(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    env_file = tmp_path / ".env"
    env_file.write_text("INCIDENT_AGENT_GROQ_API_KEY=from-file\nOTHER=value\n", encoding="utf-8")
    monkeypatch.setenv("INCIDENT_AGENT_GROQ_API_KEY", "already-set")
    monkeypatch.delenv("OTHER", raising=False)

    load_project_env(paths=[env_file])

    assert os.environ["INCIDENT_AGENT_GROQ_API_KEY"] == "already-set"
    assert os.environ["OTHER"] == "value"


def test_groq_compatible_model_remaps_openai_ids() -> None:
    assert groq_compatible_model("gpt-4.1-mini") == "openai/gpt-oss-20b"
    assert groq_compatible_model("llama-3.1-8b-instant") == "llama-3.1-8b-instant"
