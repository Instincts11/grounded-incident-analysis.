"""Provider factory and config loading for LLM integrations."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field

from incident_agent.core.settings import load_resilience_config, load_settings_from_yaml
from incident_agent.llm.base import BaseLLMProvider, LLMProviderError
from incident_agent.llm.cache import CachedLLMProvider
from incident_agent.llm.environment import (
    LLM_PROVIDER_ENV_VAR,
    groq_compatible_model,
    load_project_env,
)
from incident_agent.llm.heuristic import HeuristicNarrativeProvider
from incident_agent.llm.openai_provider import GroqProvider, OpenAIProvider

ProviderName = Literal["heuristic", "mock", "openai", "groq"]
_PROVIDER_NAMES = {"heuristic", "mock", "openai", "groq"}


class LLMConfig(BaseModel):
    """Centralized LLM provider and model configuration."""

    provider: ProviderName = "heuristic"
    report_model: str = "gpt-4.1-mini"
    completion_model: str = "gpt-4.1-mini"
    timeout_seconds: float = 20.0
    max_retries: int = 3
    retry_backoff_seconds: float = 1.0
    model_pricing_usd_per_1k_tokens: dict[str, float] = Field(default_factory=dict)


def load_llm_config(path: str | Path = "configs/default.yaml") -> LLMConfig:
    """Load LLM config from YAML, with env overrides for local provider tests."""

    load_project_env()
    loaded = load_settings_from_yaml(Path(path))
    section = loaded.get("llm", {})
    if not isinstance(section, dict):
        raise ValueError("The 'llm' section must be a mapping.")
    config = LLMConfig.model_validate(section)
    env_provider = os.getenv(LLM_PROVIDER_ENV_VAR, "").strip().lower()
    updates: dict[str, str] = {}
    if env_provider in _PROVIDER_NAMES:
        updates["provider"] = env_provider
    provider = updates.get("provider", config.provider)
    if provider == "groq":
        updates["report_model"] = groq_compatible_model(config.report_model)
        updates["completion_model"] = groq_compatible_model(config.completion_model)
    if updates:
        return config.model_copy(update=updates)
    return config


def create_provider(
    config: LLMConfig,
    *,
    config_path: str | Path = "configs/default.yaml",
) -> BaseLLMProvider:
    """Create provider instance from configuration."""

    load_project_env()
    provider: BaseLLMProvider
    if config.provider in {"heuristic", "mock"}:
        provider = HeuristicNarrativeProvider()
    elif config.provider == "openai":
        provider = OpenAIProvider(
            timeout_seconds=config.timeout_seconds,
            max_retries=config.max_retries,
            retry_backoff_seconds=config.retry_backoff_seconds,
            model_pricing_usd_per_1k_tokens=config.model_pricing_usd_per_1k_tokens,
        )
    elif config.provider == "groq":
        provider = GroqProvider(
            timeout_seconds=config.timeout_seconds,
            max_retries=config.max_retries,
            retry_backoff_seconds=config.retry_backoff_seconds,
            model_pricing_usd_per_1k_tokens=config.model_pricing_usd_per_1k_tokens,
        )
    else:
        raise LLMProviderError(f"Unsupported provider '{config.provider}'.")

    resilience = load_resilience_config(config_path)
    if resilience.enable_llm_cache:
        return CachedLLMProvider(provider, cache_dir=resilience.llm_cache_dir)
    return provider
