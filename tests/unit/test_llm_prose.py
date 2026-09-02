from __future__ import annotations

from incident_agent.llm.heuristic import compose_narrative
from incident_agent.llm.prose import remediation_items, sanitize_analyst_prose


def test_sanitize_analyst_prose_strips_markdown_tables() -> None:
    dump = (
        "**Most likely root cause**\n"
        "| Evidence | What it shows |\n"
        "|----------|---------------|\n"
        "| **CPU anomaly** | Checkout-service was overloaded. |\n"
        "All seven anomalies are confined to checkout-service.\n"
        "The most likely root cause is resource exhaustion."
    )
    cleaned = sanitize_analyst_prose(dump)
    assert "|" not in cleaned
    assert "**" not in cleaned
    assert "resource exhaustion" in cleaned.lower()
    assert len(cleaned) < len(dump)


def test_sanitize_analyst_prose_drops_chain_of_thought() -> None:
    dump = (
        "We need to produce an incident summary. "
        "Checkout-service CPU rose from 35 to 96 in the 11:15 window. "
        "Provide that we have no evidence of root cause."
    )
    cleaned = sanitize_analyst_prose(dump)
    assert "We need to" not in cleaned
    assert "CPU rose" in cleaned


def test_remediation_items_skip_table_rows() -> None:
    dump = (
        "**Facts (directly from evidence)**\n"
        "| Observation | Value | Source |\n"
        "|-------------|-------|--------|\n"
        "| CPU usage spiked to 96% | 96% | cpu_anomaly |\n"
        "Contain traffic on checkout-service.\n"
        "Confirm error-rate charts against the ranked windows."
    )
    items = remediation_items(dump)
    assert items
    assert all("|" not in item for item in items)
    assert any("checkout-service" in item.lower() for item in items)


def test_sanitize_keeps_heuristic_brief() -> None:
    prompt = (
        "Task: Write an executive summary.\n\nEvidence payload:\n"
        '{"incident_id":"inc-1","root_cause_hypothesis":'
        '{"suspected_root_cause_service":"checkout-service",'
        '"root_cause_support":1.0,"contributing_signals":["cpu_anomaly"],'
        '"impacted_downstream_services":[]}}'
    )
    original = compose_narrative(prompt)
    cleaned = sanitize_analyst_prose(original)
    assert "checkout-service" in cleaned
    assert len(cleaned) > 80
