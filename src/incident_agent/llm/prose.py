"""Normalize remote-provider copy into short console-ready prose."""

from __future__ import annotations

import re

_THINK_BLOCK = re.compile(r"<think>[\s\S]*?</think>", re.IGNORECASE)
_HEADING = re.compile(r"^\s{0,3}#{1,6}\s+", re.MULTILINE)
_BOLD = re.compile(r"\*\*(.+?)\*\*")
_ITALIC = re.compile(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)")
_INLINE_CODE = re.compile(r"`([^`]+)`")
_SENTENCE = re.compile(r"(?<=[.!?])\s+")
_HEADING_FRAGMENT = re.compile(
    r"^(executive summary|business impact|status|next steps|uncertainty|"
    r"most likely root cause|supporting contextual clues|conclusion|"
    r"engineering handoff|facts\b|alternative explanations).*$",
    re.IGNORECASE,
)
_COT_PREFIXES = (
    "we need to",
    "provide that",
    "provide summary",
    "output guidance",
    "task:",
    "write only",
    "plain sentences",
)


def sanitize_analyst_prose(
    text: str,
    *,
    max_sentences: int = 5,
    max_chars: int = 880,
) -> str:
    """Strip markdown dumps and clip to a short analyst brief."""

    cleaned = _prepare(text)
    sentences = [
        sentence
        for sentence in _sentences(cleaned)
        if not _is_instruction_echo(sentence) and not _is_heading_fragment(sentence)
    ]
    if not sentences:
        sentences = _sentences(cleaned)
    clipped = " ".join(sentences[:max_sentences]).strip()
    if len(clipped) > max_chars:
        clipped = clipped[: max_chars - 1].rsplit(" ", 1)[0].rstrip(".,;:") + "."
    return clipped


def remediation_items(text: str, *, limit: int = 5) -> list[str]:
    """Turn remediation copy into a short list of actions."""

    items = [
        sentence
        for sentence in _sentences(_prepare(text))
        if sentence
        and not _is_instruction_echo(sentence)
        and not _is_heading_fragment(sentence)
    ]
    trimmed = [item[:180].rstrip(".,;:") + "." for item in items if item]
    return trimmed[:limit]


def _prepare(text: str) -> str:
    value = text.replace("\ufeff", "").strip()
    value = _THINK_BLOCK.sub(" ", value)
    value = _HEADING.sub("", value)
    kept: list[str] = []
    for raw_line in value.splitlines():
        line = raw_line.strip()
        if not line or set(line) <= {"-", "|", ":", " "}:
            continue
        if _is_table_row(line):
            kept.extend(_useful_table_cells(line))
            continue
        kept.append(line)
    value = " ".join(kept)
    value = _BOLD.sub(r"\1", value)
    value = _ITALIC.sub(r"\1", value)
    value = _INLINE_CODE.sub(r"\1", value)
    value = value.replace("|", " ")
    value = re.sub(r"\s+-\s+", ". ", value)
    value = re.sub(r"[:;]\s*\.", ".", value)
    value = re.sub(r"\.{2,}", ".", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def _useful_table_cells(line: str) -> list[str]:
    cells = [cell.strip(" *") for cell in line.strip("|").split("|")]
    return [
        cell
        for cell in cells
        if len(cell) > 28 and not set(cell) <= {"-", ":"} and cell.lower() not in {"evidence", "what it shows"}
    ]


def _is_table_row(line: str) -> bool:
    return line.count("|") >= 2


def _is_instruction_echo(sentence: str) -> bool:
    lowered = sentence.lower().lstrip("-* ")
    return any(lowered.startswith(prefix) for prefix in _COT_PREFIXES)


def _is_heading_fragment(sentence: str) -> bool:
    lowered = sentence.strip().lower()
    if re.fullmatch(r"\d+\.?", lowered):
        return True
    if _HEADING_FRAGMENT.match(lowered) and len(lowered.split()) <= 6:
        return True
    return len(lowered) < 40 and not any(ch in lowered for ch in ".0123456789")


def _sentences(text: str) -> list[str]:
    chunks = [chunk.strip() for chunk in _SENTENCE.split(text) if chunk.strip()]
    return [_strip_leading_heading(chunk) for chunk in chunks if _strip_leading_heading(chunk)]


def _strip_leading_heading(sentence: str) -> str:
    stripped = re.sub(
        r"^(executive summary|business impact|status|next steps|uncertainty|"
        r"most likely root cause|supporting contextual clues|conclusion|"
        r"engineering handoff|facts)\b.{0,48}?(?=[A-Z])",
        "",
        sentence.strip(),
        count=1,
        flags=re.IGNORECASE,
    ).strip(" -–:")
    return stripped
