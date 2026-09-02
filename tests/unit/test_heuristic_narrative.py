from __future__ import annotations

import json

from incident_agent.llm.heuristic import HeuristicNarrativeProvider, compose_narrative
from incident_agent.schemas.llm import LLMCompletionRequest


def test_compose_narrative_uses_evidence_payload() -> None:
    payload = {
        "incident_id": "inc-1",
        "root_cause_hypothesis": {
            "suspected_root_cause_service": "checkout-service",
            "root_cause_support": 0.82,
            "contributing_signals": ["latency_spike"],
            "impacted_downstream_services": ["api-gateway"],
        },
        "evidence_bundle": {
            "ranked_evidence": [
                {
                    "affected_service": "checkout-service",
                    "anomaly_type": "latency_spike",
                    "observed_value": 1900,
                    "baseline_value": 125,
                }
            ]
        },
    }
    prompt = (
        "Task: Produce an incident summary.\n\nEvidence payload:\n" + json.dumps(payload)
    )
    text = compose_narrative(prompt)
    assert "checkout-service" in text
    assert "inc-1" in text
    assert "Mock completion" not in text


def test_heuristic_provider_complete_without_payload() -> None:
    provider = HeuristicNarrativeProvider()
    response = provider.complete(
        LLMCompletionRequest(prompt="hello", model="heuristic", max_output_tokens=20)
    )
    assert "Insufficient structured evidence" in response.content
    assert response.raw_response["provider"] == "heuristic"
