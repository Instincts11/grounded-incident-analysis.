import { evalMetrics, evalModes, qualityGates } from "@/lib/content";

export default function EvaluationPage() {
  return (
    <div className="space-y-16">
      <header className="page-hero">
        <p className="kicker">Regression</p>
        <h1 className="mt-4 text-5xl tracking-tight">Evaluation</h1>
        <p className="mt-4 max-w-2xl leading-8 text-[var(--muted)]">
          Benchmarks live in eval/benchmarks. Golden summaries live in
          eval/golden. The console is honest about what the harness measures.
          If a detector change moves root-cause correctness, the gate should
          fail — not the landing page copy.
        </p>
      </header>

      <section>
        <h2 className="text-3xl tracking-tight">Modes</h2>
        <div className="data-table eval-modes mt-8 overflow-hidden rounded-3xl border border-[var(--line)]">
          {evalModes.map((row) => (
            <div
              key={row.mode}
              className="grid min-w-0 gap-4 border-b border-[var(--line)] px-8 py-8 md:grid-cols-4 last:border-0"
            >
              <p className="font-mono text-[var(--mint)]">{row.mode}</p>
              <p>F1 {row.f1}</p>
              <p>Root {row.root}</p>
              <p className="text-[var(--muted)]">{row.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-3xl tracking-tight">What the numbers actually mean</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {evalMetrics.map((item) => (
            <article key={item.name} className="rounded-3xl border border-[var(--line)] p-8">
              <h3 className="text-xl">{item.name}</h3>
              <p className="mt-3 leading-7 text-[var(--muted)]">{item.meaning}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel rounded-[2rem] p-10">
        <h2 className="text-2xl">How to run it</h2>
        <p className="mt-4 max-w-3xl leading-7 text-[var(--muted)]">
          From the repo: incident-agent run-eval --benchmark-path
          eval/benchmarks/scenarios.json --artifact-root artifacts/eval then
          incident-agent compare-eval against eval/golden/baseline_summary.json.
          Real-LLM modes are opt-in and require INCIDENT_AGENT_OPENAI_API_KEY.
          Default CI does not call a remote model.
        </p>
      </section>

      <section>
        <h2 className="text-3xl tracking-tight">What a golden compare actually gates</h2>
        <div className="mt-8 border-t border-[var(--line)]">
          {qualityGates.map((item) => (
            <div key={item.name} className="spec-row">
              <p className="font-mono text-sm text-[var(--mint)]">{item.name}</p>
              <p className="leading-7 text-[var(--muted)]">{item.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-3xl leading-7 text-[var(--muted)]">
          Benchmark labels include incident_expected, expected_root_cause,
          allowed_root_causes, expected_impacted_services, and expected anomaly
          types. A detector change that moves root-cause correctness should fail
          compare-eval — not a screenshot on this page.
        </p>
      </section>
    </div>
  );
}
