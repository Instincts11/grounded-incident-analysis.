"use client";

import { useState } from "react";
import { api, type AskResponse } from "@/lib/api";
import { askPrompts } from "@/lib/content";

export function IncidentAsk({
  jobId,
  incidentId,
}: {
  jobId: string;
  incidentId?: string;
}) {
  const [question, setQuestion] = useState(askPrompts[0].question);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (nextQuestion: string) => {
    setBusy(true);
    setError(null);
    try {
      const payload = await api.ask(jobId, nextQuestion, incidentId);
      setResult(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ask failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="ask-box">
      <p className="kicker">Closed-book Q&amp;A</p>
      <h3 className="mt-3 text-2xl tracking-tight">Ask this run</h3>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
        Answers may only use this job&apos;s detector facts, RCA hypothesis, and
        retrieved runbooks. If the pack does not support the claim, the API
        refuses. That is the demo — not a chatbot.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {askPrompts.map((prompt) => (
          <button
            key={prompt.label}
            type="button"
            className="ask-box__chip"
            onClick={() => {
              setQuestion(prompt.question);
              void submit(prompt.question);
            }}
            disabled={busy}
          >
            {prompt.label}
          </button>
        ))}
      </div>
      <form
        className="ask-box__form"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(question);
        }}
      >
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask only from this evidence pack"
          aria-label="Question about this incident"
        />
        <button type="submit" disabled={busy || question.trim().length < 3}>
          {busy ? "Checking pack…" : "Ask"}
        </button>
      </form>
      {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}
      {result ? (
        <div className={result.refused ? "ask-box__result is-refused" : "ask-box__result"}>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--violet)]">
            {result.refused ? "refused" : "grounded"} · {result.source}
            {result.used_llm ? " · llm" : " · extractive"}
          </p>
          <p className="mt-4 leading-7">{result.answer}</p>
          {result.citations.length > 0 ? (
            <ul className="mt-5 space-y-2 font-mono text-xs leading-6 text-[var(--blue)]">
              {result.citations.map((citation) => (
                <li key={`${citation.citation_id}-${citation.excerpt.slice(0, 24)}`}>
                  [{citation.citation_id}] {citation.excerpt}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-sm text-[var(--faint)]">
          Try &ldquo;Refuse this&rdquo; after a real question so the interviewer
          sees both paths.
        </p>
      )}
    </section>
  );
}
