"""Deterministic grounded narrative composer.

This is not a local language model. It turns RCA evidence into analyst copy
so the product can run without a remote provider.
"""

from __future__ import annotations

import json
import re
from typing import Any

from incident_agent.llm.base import BaseLLMProvider
from incident_agent.schemas.llm import (
    LLMCompletionRequest,
    LLMCompletionResponse,
    LLMStructuredReportRequest,
    LLMStructuredReportResponse,
    LLMUsage,
)
from incident_agent.schemas.report import EvidenceItem, IncidentReport


def _extract_payload(prompt: str) -> dict[str, Any]:
    marker = "Evidence payload:"
    if marker not in prompt:
        return {}
    raw = prompt.split(marker, 1)[1].strip()
    try:
        loaded = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    return loaded if isinstance(loaded, dict) else {}


def _service(payload: dict[str, Any]) -> str:
    hypothesis = payload.get("root_cause_hypothesis")
    if isinstance(hypothesis, dict):
        service = hypothesis.get("suspected_root_cause_service")
        if isinstance(service, str) and service:
            return service
    features = payload.get("summary_features")
    if isinstance(features, dict):
        services = features.get("impacted_services")
        if isinstance(services, list) and services:
            return str(services[0])
    return "the primary service"


def _downstream(payload: dict[str, Any]) -> list[str]:
    hypothesis = payload.get("root_cause_hypothesis")
    if isinstance(hypothesis, dict):
        values = hypothesis.get("impacted_downstream_services")
        if isinstance(values, list):
            return [str(item) for item in values if item]
    bundle = payload.get("evidence_bundle")
    if isinstance(bundle, dict):
        values = bundle.get("impacted_downstream_services")
        if isinstance(values, list):
            return [str(item) for item in values if item]
    return []


def _signals(payload: dict[str, Any]) -> list[str]:
    hypothesis = payload.get("root_cause_hypothesis")
    if isinstance(hypothesis, dict):
        values = hypothesis.get("contributing_signals")
        if isinstance(values, list) and values:
            return [str(item).replace("_", " ") for item in values]
    return []


def _evidence_lines(payload: dict[str, Any], limit: int = 4) -> list[str]:
    bundle = payload.get("evidence_bundle")
    if not isinstance(bundle, dict):
        return []
    ranked = bundle.get("ranked_evidence")
    if not isinstance(ranked, list):
        return []
    lines: list[str] = []
    for item in ranked[:limit]:
        if not isinstance(item, dict):
            continue
        service = item.get("affected_service", "unknown-service")
        anomaly = str(item.get("anomaly_type", "anomaly")).replace("_", " ")
        observed = item.get("observed_value")
        baseline = item.get("baseline_value")
        lines.append(f"{service} {anomaly} (observed {observed}, baseline {baseline})")
    return lines


def _support(payload: dict[str, Any]) -> str:
    hypothesis = payload.get("root_cause_hypothesis")
    if isinstance(hypothesis, dict):
        score = hypothesis.get("root_cause_support")
        if isinstance(score, int | float):
            return f"{round(float(score) * 100):.0f}% support"
    return "ranked evidence support"


def _incident_id(payload: dict[str, Any]) -> str:
    value = payload.get("incident_id")
    return str(value) if value else "this incident"


def _join_list(values: list[str]) -> str:
    if not values:
        return "none recorded"
    if len(values) == 1:
        return values[0]
    return ", ".join(values[:-1]) + f" and {values[-1]}"


def compose_narrative(prompt: str) -> str:
    """Compose grounded analyst copy from a rendered prompt."""

    payload = _extract_payload(prompt)
    service = _service(payload)
    downstream = _downstream(payload)
    signals = _signals(payload)
    evidence = _evidence_lines(payload)
    support = _support(payload)
    incident_id = _incident_id(payload)
    downstream_text = (
        _join_list(downstream) if downstream else "no confirmed downstream blast radius"
    )
    signal_text = _join_list(signals) if signals else "correlated telemetry"
    evidence_text = "; ".join(evidence) if evidence else "ranked detector output"

    if "Task: Produce an incident summary" in prompt:
        return (
            f"{incident_id} concentrates on {service}. The correlation window shows "
            f"{signal_text}, with {support} pointing at this service as the origin. "
            f"Highest-weight evidence includes {evidence_text}. Downstream exposure is "
            f"{downstream_text}. Facts above are taken only from detector output; "
            f"causal language is withheld until RCA scoring is reviewed."
        )
    if "Task: Explain the most likely root cause" in prompt:
        return (
            f"The leading hypothesis is saturation or failure originating in {service} "
            f"({support}). Contributing signals are {signal_text}. "
            f"The ranked bundle shows {evidence_text}. "
            f"This is an evidence-ranked inference, not a confirmed change event. "
            f"If another service later shows stronger cross-signal support, reopen the hypothesis."
        )
    if "Task: Write an executive summary" in prompt:
        return (
            f"Customer-facing risk is currently localized to {service}, with possible "
            f"follow-on impact on {downstream_text}. "
            f"The incident is in draft review with {support} on the primary hypothesis. "
            f"No production rollback has been asserted by this run. Next decision: contain "
            f"{service} while engineering validates the ranked evidence."
        )
    if "Task: Write an engineering handoff report" in prompt:
        return (
            f"Handoff for {incident_id}: start on {service}. Reproduce using the same "
            f"log and metric files, then inspect {signal_text}. "
            f"Check saturation, recent deploys, dependency timeouts, and error budget burn. "
            f"Evidence to verify first: {evidence_text}. "
            "Do not page downstream owners unless "
            f"{downstream_text} shows independent detector hits."
        )
    if "Task: Suggest remediation actions" in prompt:
        return (
            f"Contain traffic or roll back the latest change on {service}.\n"
            f"Confirm saturation and error-rate charts against the ranked windows.\n"
            f"Raise a temporary alert on {signal_text} "
            "until the hypothesis is accepted or rejected.\n"
            f"Add runbook coverage for {evidence[0] if evidence else service}.\n"
            f"Schedule a post-incident review once review status leaves draft."
        )
    if payload:
        return (
            f"Grounded analysis for {incident_id} identifies {service} as the ranked origin "
            f"with {support}. Signals: {signal_text}."
        )
    compact = re.sub(r"\s+", " ", prompt).strip()
    return (
        "Insufficient structured evidence was provided for a grounded narrative. "
        f"Prompt excerpt: {compact[:240]}"
    )


class HeuristicNarrativeProvider(BaseLLMProvider):
    """Deterministic report composer used when no remote provider is configured."""

    def complete(self, request: LLMCompletionRequest) -> LLMCompletionResponse:
        content = compose_narrative(request.prompt)
        token_estimate = max(1, len(request.prompt) // 4)
        return LLMCompletionResponse(
            model=request.model,
            content=content,
            raw_response={"provider": "heuristic"},
            usage=LLMUsage(
                prompt_tokens=token_estimate,
                completion_tokens=max(1, len(content) // 4),
                total_tokens=token_estimate + max(1, len(content) // 4),
                latency_ms=1.0,
                estimated_cost_usd=0.0,
            ),
        )

    def generate_structured_report(
        self,
        request: LLMStructuredReportRequest,
    ) -> LLMStructuredReportResponse:
        payload = _extract_payload(request.prompt)
        service = _service(payload) if payload else "api-service"
        report = IncidentReport(
            title=f"Incident analysis for {service}",
            severity="high",
            impacted_service=service,
            incident_summary=compose_narrative(
                "Task: Produce an incident summary.\n\nEvidence payload:\n"
                + json.dumps(payload)
            ),
            likely_root_causes=[
                compose_narrative(
                    "Task: Explain the most likely root cause.\n\nEvidence payload:\n"
                    + json.dumps(payload)
                )
            ],
            recommended_actions=[
                line.strip()
                for line in compose_narrative(
                    "Task: Suggest remediation actions.\n\nEvidence payload:\n"
                    + json.dumps(payload)
                ).splitlines()
                if line.strip()
            ],
            evidence=[
                EvidenceItem(
                    kind="prompt_excerpt",
                    timestamp="n/a",
                    content=request.prompt[:160],
                )
            ],
        )
        serialized = json.dumps(report.model_dump(mode="json"))
        return LLMStructuredReportResponse(
            model=request.model,
            content=serialized,
            raw_response={"provider": "heuristic"},
            usage=LLMUsage(
                prompt_tokens=max(1, len(request.prompt) // 4),
                completion_tokens=max(1, len(serialized) // 4),
                total_tokens=max(1, len(request.prompt) // 4) + max(1, len(serialized) // 4),
                latency_ms=1.0,
                estimated_cost_usd=0.0,
            ),
        )


# Backward compatibility for tests and older imports.
MockLLMProvider = HeuristicNarrativeProvider
MockLLMClient = HeuristicNarrativeProvider
