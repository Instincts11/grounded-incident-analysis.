"""Compatibility module for the deterministic narrative composer."""

from incident_agent.llm.heuristic import HeuristicNarrativeProvider

MockLLMProvider = HeuristicNarrativeProvider
MockLLMClient = HeuristicNarrativeProvider

__all__ = ["HeuristicNarrativeProvider", "MockLLMClient", "MockLLMProvider"]
