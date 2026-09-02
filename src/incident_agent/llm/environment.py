"""Environment variable names used by LLM integrations."""

from __future__ import annotations

import os
from pathlib import Path

OPENAI_API_KEY_ENV_VAR = "INCIDENT_AGENT_OPENAI_API_KEY"
GROQ_API_KEY_ENV_VAR = "INCIDENT_AGENT_GROQ_API_KEY"
GROQ_API_KEY_FALLBACK_ENV_VAR = "GROQ_API_KEY"
GROQ_BASE_URL_ENV_VAR = "INCIDENT_AGENT_GROQ_BASE_URL"
LLM_PROVIDER_ENV_VAR = "INCIDENT_AGENT_LLM_PROVIDER"

GROQ_DEFAULT_BASE_URL = "https://api.groq.com/openai/v1"
GROQ_DEFAULT_MODEL = "openai/gpt-oss-20b"

_OPENAI_ONLY_MODEL_PREFIXES = ("gpt-", "o1", "o3", "o4")


def _default_env_paths() -> list[Path]:
    repo_root = Path(__file__).resolve().parents[3]
    return [Path.cwd() / ".env", repo_root / ".env"]


def load_project_env(*, paths: list[Path] | None = None) -> None:
    """Load KEY=VALUE pairs from .env into os.environ without overwriting.

    Pytest isolation: default files are skipped so a developer .env cannot
    leak into unit tests. Pass ``paths`` explicitly to exercise this loader.
    """

    if paths is None and os.getenv("PYTEST_CURRENT_TEST"):
        return
    seen: set[Path] = set()
    for candidate in paths if paths is not None else _default_env_paths():
        resolved = candidate.resolve()
        if resolved in seen or not resolved.is_file():
            continue
        seen.add(resolved)
        _apply_env_file(resolved)


def _apply_env_file(path: Path) -> None:
    try:
        raw = path.read_text(encoding="utf-8")
    except OSError:
        return
    if raw.startswith("\ufeff"):
        raw = raw[1:]
    for line in raw.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if stripped.lower().startswith("export "):
            stripped = stripped[7:].strip()
        if "=" not in stripped:
            continue
        key, _, value = stripped.partition("=")
        key = key.strip()
        if not key:
            continue
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
            value = value[1:-1]
        os.environ.setdefault(key, value)


def groq_api_key() -> str | None:
    """Return the Groq key from the canonical env var, then Groq's default name."""

    for name in (GROQ_API_KEY_ENV_VAR, GROQ_API_KEY_FALLBACK_ENV_VAR):
        value = os.getenv(name, "").strip()
        if value:
            return value
    return None


def groq_base_url() -> str:
    return os.getenv(GROQ_BASE_URL_ENV_VAR, GROQ_DEFAULT_BASE_URL).rstrip("/")


def groq_compatible_model(model: str) -> str:
    """Swap OpenAI model ids that Groq will reject for a Groq chat model."""

    lowered = model.strip().lower()
    if any(lowered.startswith(prefix) for prefix in _OPENAI_ONLY_MODEL_PREFIXES):
        return GROQ_DEFAULT_MODEL
    return model
