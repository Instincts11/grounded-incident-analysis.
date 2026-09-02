"""Schemas for dual-compose narratives and model-trace metadata."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

NarrativeSource = Literal["heuristic", "groq", "openai", "fallback"]


class NarrativeBundle(BaseModel):
    """One composed narrative over the same evidence bundle."""

    source: NarrativeSource = "heuristic"
    model: str = ""
    incident_summary: str = ""
    root_cause_explanation: str = ""
    executive_summary: str = ""
    engineering_handoff: str = ""
    remediation_suggestions: list[str] = Field(default_factory=list)
    fallback_used: bool = False


class RetrievedCitation(BaseModel):
    """Retrieved runbook or historical snippet attached to a report."""

    citation_id: str
    source_path: str = ""
    content: str = ""


class ComposeTrace(BaseModel):
    """Per-run model trace shown in the console and interviews."""

    provider: str = "heuristic"
    model: str = ""
    call_count: int = 0
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    average_latency_ms: float = 0.0
    estimated_cost_usd: float = 0.0
    used_llm_cache: bool = False
    cache_hits: int = 0
    fallback_used: bool = False
    grounding_passed: bool | None = None
    supported_claims: int = 0
    total_claims: int = 0
    retrieved_snippet_count: int = 0
