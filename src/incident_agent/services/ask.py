"""Closed-book Q&A over one analysis job's evidence pack."""

from __future__ import annotations

import logging
import re
from typing import Literal

from pydantic import BaseModel, Field

from incident_agent.api.store import AnalysisJobRecord
from incident_agent.llm.base import LLMProviderError
from incident_agent.llm.factory import create_provider, load_llm_config
from incident_agent.llm.prose import sanitize_analyst_prose
from incident_agent.schemas.compose import RetrievedCitation
from incident_agent.schemas.final_report import FinalIncidentReport
from incident_agent.schemas.incident import CorrelatedIncidentCandidate
from incident_agent.schemas.llm import LLMCompletionRequest
from incident_agent.utils.observability import get_logger, log_event

logger = get_logger(__name__)

REFUSAL = (
    "I cannot answer from this run's evidence bundle. "
    "The detectors, RCA hypothesis, and retrieved runbooks do not support that claim."
)

_STOPWORDS = {
    "the",
    "and",
    "for",
    "was",
    "were",
    "with",
    "from",
    "that",
    "this",
    "what",
    "when",
    "which",
    "does",
    "did",
    "how",
    "why",
    "are",
    "is",
    "a",
    "an",
    "to",
    "of",
    "in",
    "on",
    "vs",
    "versus",
    "about",
    "into",
    "over",
    "than",
    "its",
    "it",
    "or",
    "be",
    "by",
    "as",
    "at",
}

AskSource = Literal["heuristic", "groq", "openai", "refuse"]


class AskCitation(BaseModel):
    """One cited fact or retrieved snippet supporting an answer."""

    citation_id: str
    source: str
    excerpt: str


class AskResult(BaseModel):
    """Grounded answer or a refusal."""

    answer: str
    refused: bool
    citations: list[AskCitation] = Field(default_factory=list)
    used_llm: bool = False
    source: AskSource = "heuristic"


class EvidencePack(BaseModel):
    """Closed evidence the Q&A is allowed to see."""

    incident_id: str
    primary_service: str = ""
    hypothesis: str = ""
    facts: list[str] = Field(default_factory=list)
    inferences: list[str] = Field(default_factory=list)
    uncertainties: list[str] = Field(default_factory=list)
    evidence_rows: list[str] = Field(default_factory=list)
    snippets: list[RetrievedCitation] = Field(default_factory=list)
    citation_ids: list[str] = Field(default_factory=list)

    def corpus(self) -> str:
        parts = [
            self.primary_service,
            self.hypothesis,
            *self.facts,
            *self.inferences,
            *self.uncertainties,
            *self.evidence_rows,
            *(snippet.content for snippet in self.snippets),
            *self.citation_ids,
        ]
        return "\n".join(part for part in parts if part)


def ask_incident_question(
    job: AnalysisJobRecord,
    *,
    question: str,
    incident_id: str | None = None,
    config_path: str = "configs/default.yaml",
) -> AskResult:
    """Answer only from this job's facts, hypothesis, and retrieved snippets."""

    cleaned = question.strip()
    if len(cleaned) < 3:
        return AskResult(answer=REFUSAL, refused=True, source="refuse")

    pack = build_evidence_pack(job, incident_id=incident_id)
    if pack is None:
        return AskResult(answer=REFUSAL, refused=True, source="refuse")
    if not _question_supported(cleaned, pack):
        return AskResult(answer=REFUSAL, refused=True, source="refuse")

    llm_config = load_llm_config(config_path)
    if llm_config.provider in {"groq", "openai"}:
        try:
            llm_result = _answer_with_llm(
                question=cleaned,
                pack=pack,
                provider_name=llm_config.provider,
                model=llm_config.completion_model,
                config_path=config_path,
            )
            if llm_result is not None:
                return llm_result
        except LLMProviderError as error:
            log_event(
                logger,
                level=logging.WARNING,
                event="ask.llm.fallback",
                message="Q&A provider failed; using extractive answer",
                error=str(error),
            )

    return _extractive_answer(cleaned, pack)


def build_evidence_pack(
    job: AnalysisJobRecord,
    *,
    incident_id: str | None = None,
) -> EvidencePack | None:
    """Assemble the closed pack for one incident on a completed job."""

    report = _select_report(job.reports, incident_id)
    incident = _select_incident(job.incidents, incident_id, report)
    if report is None and incident is None:
        return None

    facts = list(report.facts) if report else []
    evidence_rows: list[str] = []
    if incident is not None:
        for item in incident.evidence:
            row = (
                f"{item.affected_service}: {item.anomaly_type} "
                f"observed={item.observed_value} baseline={item.baseline_value}"
            )
            evidence_rows.append(row)
            if row not in facts:
                facts.append(row)

    snippets = list(report.retrieved_snippets) if report else []
    citation_ids = list(report.citations) if report else []
    for snippet in snippets:
        if snippet.citation_id not in citation_ids:
            citation_ids.append(snippet.citation_id)

    return EvidencePack(
        incident_id=(
            report.incident_id
            if report is not None
            else incident.incident_id
            if incident is not None
            else ""
        ),
        primary_service=incident.suspected_primary_service if incident else "",
        hypothesis=(report.inferences[0] if report and report.inferences else ""),
        facts=facts,
        inferences=list(report.inferences) if report else [],
        uncertainties=list(report.uncertainties) if report else [],
        evidence_rows=evidence_rows,
        snippets=snippets,
        citation_ids=citation_ids,
    )


def _select_report(
    reports: list[FinalIncidentReport],
    incident_id: str | None,
) -> FinalIncidentReport | None:
    if incident_id:
        for report in reports:
            if report.incident_id == incident_id:
                return report
        return None
    return reports[0] if reports else None


def _select_incident(
    incidents: list[CorrelatedIncidentCandidate],
    incident_id: str | None,
    report: FinalIncidentReport | None,
) -> CorrelatedIncidentCandidate | None:
    target = incident_id or (report.incident_id if report else None)
    if target:
        for incident in incidents:
            if incident.incident_id == target:
                return incident
        return None
    return incidents[0] if incidents else None


def _question_supported(question: str, pack: EvidencePack) -> bool:
    query = _tokens(question)
    corpus = _tokens(pack.corpus())
    if not query or not corpus:
        return False
    overlap = query & corpus
    if not overlap:
        return False
    if len(overlap) / max(len(query), 1) >= 0.2:
        return True
    return any(len(query & _tokens(fact)) >= 2 for fact in pack.facts)


def _extractive_answer(question: str, pack: EvidencePack) -> AskResult:
    query = _tokens(question)
    scored: list[tuple[int, str, str]] = []
    for index, fact in enumerate(pack.facts):
        score = len(query & _tokens(fact))
        if score:
            scored.append((score, f"fact-{index + 1}", fact))
    for snippet in pack.snippets:
        score = len(query & _tokens(snippet.content))
        if score:
            scored.append((score, snippet.citation_id, snippet.content))
    scored.sort(key=lambda item: (-item[0], item[1]))
    if not scored:
        return AskResult(answer=REFUSAL, refused=True, source="refuse")

    selected = scored[:3]
    sentences = [excerpt for _, _, excerpt in selected]
    if pack.hypothesis and len(query & _tokens(pack.hypothesis)) >= 1:
        sentences.append(pack.hypothesis)
    answer = sanitize_analyst_prose(" ".join(sentences), max_sentences=4, max_chars=720)
    citations = [
        AskCitation(citation_id=citation_id, source="evidence_pack", excerpt=excerpt[:240])
        for _, citation_id, excerpt in selected
    ]
    return AskResult(
        answer=answer,
        refused=False,
        citations=citations,
        used_llm=False,
        source="heuristic",
    )


def _answer_with_llm(
    *,
    question: str,
    pack: EvidencePack,
    provider_name: str,
    model: str,
    config_path: str,
) -> AskResult | None:
    provider = create_provider(load_llm_config(config_path), config_path=config_path)
    pack_json = pack.model_dump_json(indent=2)
    prompt = (
        "Answer the on-call question using ONLY the evidence pack. "
        "If the pack does not contain the answer, reply exactly: "
        f"{REFUSAL} "
        "Write at most four plain sentences. No markdown, no headings, no speculation. "
        "Do not invent numbers. Cite fact ids or citation ids in square brackets.\n\n"
        f"EVIDENCE PACK:\n{pack_json}\n\nQUESTION:\n{question}"
    )
    response = provider.complete(
        LLMCompletionRequest(prompt=prompt, model=model, max_output_tokens=280)
    )
    raw = sanitize_analyst_prose(response.content, max_sentences=4, max_chars=720)
    if not raw or REFUSAL.lower()[:40] in raw.lower() or not _answer_supported(raw, pack):
        return None
    source: AskSource = "groq" if provider_name == "groq" else "openai"
    return AskResult(
        answer=raw,
        refused=False,
        citations=_citations_for_answer(raw, pack),
        used_llm=True,
        source=source,
    )


def _answer_supported(answer: str, pack: EvidencePack) -> bool:
    stripped = re.sub(r"\[[^\]]+\]", " ", answer)
    pack_tokens = _tokens(pack.corpus())
    answer_tokens = _tokens(stripped)
    if not answer_tokens:
        return False
    overlap = answer_tokens & pack_tokens
    if len(overlap) / len(answer_tokens) < 0.28:
        return False
    invented = _numbers(stripped) - _numbers(pack.corpus())
    return not invented


def _citations_for_answer(answer: str, pack: EvidencePack) -> list[AskCitation]:
    mentioned = set(re.findall(r"\[([^\]]+)\]", answer))
    citations: list[AskCitation] = []
    for snippet in pack.snippets:
        if snippet.citation_id in mentioned or snippet.citation_id in pack.citation_ids:
            citations.append(
                AskCitation(
                    citation_id=snippet.citation_id,
                    source=snippet.source_path or "retrieved",
                    excerpt=snippet.content[:240],
                )
            )
    if citations:
        return citations[:4]
    answer_tokens = _tokens(answer)
    ranked = sorted(
        enumerate(pack.facts),
        key=lambda item: len(answer_tokens & _tokens(item[1])),
        reverse=True,
    )
    for index, fact in ranked[:3]:
        if len(answer_tokens & _tokens(fact)) == 0:
            continue
        citations.append(
            AskCitation(citation_id=f"fact-{index + 1}", source="facts", excerpt=fact[:240])
        )
    return citations


def _tokens(text: str) -> set[str]:
    pieces: set[str] = set()
    for token in re.findall(r"[a-z0-9][a-z0-9_.-]*", text.lower()):
        if token not in _STOPWORDS and len(token) > 1:
            pieces.add(token)
        for part in re.split(r"[_.\-]+", token):
            if part not in _STOPWORDS and len(part) > 1:
                pieces.add(part)
    return pieces


def _numbers(text: str) -> set[float]:
    return {float(item) for item in re.findall(r"\d+(?:\.\d+)?", text)}
