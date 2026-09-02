from __future__ import annotations

from datetime import UTC, datetime

import pytest

from incident_agent.api.store import AnalysisJobRecord
from incident_agent.schemas.anomaly import AnomalyCandidate
from incident_agent.schemas.compose import RetrievedCitation
from incident_agent.schemas.final_report import FinalIncidentReport
from incident_agent.schemas.incident import CorrelatedIncidentCandidate
from incident_agent.llm.base import LLMProviderError
from incident_agent.llm.factory import LLMConfig
from incident_agent.schemas.llm import LLMCompletionRequest, LLMCompletionResponse, LLMUsage
from incident_agent.services.ask import REFUSAL, ask_incident_question


def _job() -> AnalysisJobRecord:
    now = datetime.now(UTC)
    anomaly = AnomalyCandidate(
        timestamp_window_start=now,
        timestamp_window_end=now,
        anomaly_type="cpu_anomaly",
        affected_service="checkout-service",
        severity_score=10.0,
        observed_value=96.0,
        baseline_value=35.0,
        evidence_summary="Observed=96.000, baseline=35.000, z=41.14",
        scope="service",
    )
    return AnalysisJobRecord(
        job_id="job-ask",
        status="completed",
        created_at=now,
        updated_at=now,
        reports=[
            FinalIncidentReport(
                incident_id="inc-1",
                incident_summary="Checkout saturated during the 11:15 window.",
                root_cause_explanation="checkout-service CPU is the origin.",
                executive_summary="Checkout latency rose after CPU saturation.",
                engineering_handoff="Inspect checkout-service CPU and dependency timeouts.",
                facts=["checkout-service: cpu_anomaly observed=96.0 baseline=35.0"],
                inferences=["checkout-service is the origin with relative support 0.84"],
                retrieved_snippets=[
                    RetrievedCitation(
                        citation_id="rb-checkout-cpu",
                        source_path="data/knowledge/runbooks/checkout.md",
                        content="If checkout-service CPU exceeds the baseline, contain that origin first.",
                    )
                ],
                citations=["rb-checkout-cpu"],
            )
        ],
        incidents=[
            CorrelatedIncidentCandidate(
                incident_id="inc-1",
                start_time=now,
                end_time=now,
                impacted_services=["checkout-service", "api-gateway"],
                suspected_primary_service="checkout-service",
                evidence=[anomaly],
                correlation_score=0.91,
            )
        ],
    )


def test_ask_answers_from_detector_facts(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("INCIDENT_AGENT_LLM_PROVIDER", "heuristic")

    result = ask_incident_question(_job(), question="What was checkout CPU vs baseline?")

    assert result.refused is False
    assert result.source == "heuristic"
    assert "96" in result.answer
    assert "35" in result.answer
    assert result.citations


def test_ask_refuses_unsupported_question(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("INCIDENT_AGENT_LLM_PROVIDER", "heuristic")

    result = ask_incident_question(_job(), question="What is the weather in Tokyo today?")

    assert result.refused is True
    assert result.source == "refuse"
    assert result.answer == REFUSAL
    assert result.citations == []


def test_ask_refuses_service_absent_from_the_run(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("INCIDENT_AGENT_LLM_PROVIDER", "heuristic")

    result = ask_incident_question(
        _job(),
        question="Did billing-ledger fail independently?",
    )

    assert result.refused is True
    assert "cannot answer" in result.answer.lower()


def test_ask_uses_llm_rewrite_when_grounded(monkeypatch: pytest.MonkeyPatch) -> None:
    class FakeProvider:
        def complete(self, request: LLMCompletionRequest) -> LLMCompletionResponse:
            return LLMCompletionResponse(
                model="openai/gpt-oss-20b",
                content=(
                    "checkout-service CPU observed=96.0 against baseline=35.0 [fact-1]."
                ),
                raw_response={},
                usage=LLMUsage(total_tokens=40),
            )

    monkeypatch.setattr(
        "incident_agent.services.ask.load_llm_config",
        lambda *_args, **_kwargs: LLMConfig(provider="groq", completion_model="openai/gpt-oss-20b"),
    )
    monkeypatch.setattr(
        "incident_agent.services.ask.create_provider",
        lambda *_args, **_kwargs: FakeProvider(),
    )

    result = ask_incident_question(_job(), question="What was checkout CPU vs baseline?")

    assert result.refused is False
    assert result.used_llm is True
    assert result.source == "groq"
    assert "96" in result.answer


def test_ask_falls_back_when_llm_invents_numbers(monkeypatch: pytest.MonkeyPatch) -> None:
    class FakeProvider:
        def complete(self, request: LLMCompletionRequest) -> LLMCompletionResponse:
            return LLMCompletionResponse(
                model="openai/gpt-oss-20b",
                content="checkout-service CPU peaked at 9999 versus a baseline of 1.",
                raw_response={},
            )

    monkeypatch.setattr(
        "incident_agent.services.ask.load_llm_config",
        lambda *_args, **_kwargs: LLMConfig(provider="groq", completion_model="openai/gpt-oss-20b"),
    )
    monkeypatch.setattr(
        "incident_agent.services.ask.create_provider",
        lambda *_args, **_kwargs: FakeProvider(),
    )

    result = ask_incident_question(_job(), question="What was checkout CPU vs baseline?")

    assert result.refused is False
    assert result.used_llm is False
    assert result.source == "heuristic"
    assert "96" in result.answer


def test_ask_falls_back_when_llm_provider_errors(monkeypatch: pytest.MonkeyPatch) -> None:
    class FakeProvider:
        def complete(self, request: LLMCompletionRequest) -> LLMCompletionResponse:
            raise LLMProviderError("boom")

    monkeypatch.setattr(
        "incident_agent.services.ask.load_llm_config",
        lambda *_args, **_kwargs: LLMConfig(provider="groq", completion_model="openai/gpt-oss-20b"),
    )
    monkeypatch.setattr(
        "incident_agent.services.ask.create_provider",
        lambda *_args, **_kwargs: FakeProvider(),
    )

    result = ask_incident_question(_job(), question="What was checkout CPU vs baseline?")

    assert result.refused is False
    assert result.used_llm is False
    assert "96" in result.answer


def test_ask_refuses_when_job_has_no_pack() -> None:
    now = datetime.now(UTC)
    job = AnalysisJobRecord(
        job_id="job-empty",
        status="completed",
        created_at=now,
        updated_at=now,
    )
    result = ask_incident_question(job, question="What was checkout CPU vs baseline?")
    assert result.refused is True
    assert result.source == "refuse"

