import { Footer } from "@/components/site/Footer";
import { TypedWord } from "@/components/site/TypedWord";
import {
  antiPatterns,
  claimStatuses,
  correlationWeights,
  detectors,
  playbook,
  principles,
  reportAnatomy,
  sampleScenarios,
  stages,
} from "@/lib/content";

export default function MethodPage() {
  return (
    <main className="px-8 pt-36">
      <div className="mx-auto max-w-[1440px] space-y-28 pb-8">
        <header className="page-hero">
          <p className="kicker">Method</p>
          <h1 className="display mt-8 max-w-[18ch]" aria-label="Detect, then write. Never the reverse.">
            Detect, then write.
            <span className="serif relative">
              {" "}
              <TypedWord text="Never the reverse." />
            </span>
          </h1>
          <div className="mt-16 grid gap-16 lg:grid-cols-2">
            <p className="text-lg leading-8 text-[var(--muted)]">
              The pipeline is a sequence of contracts. LogEvent and MetricPoint
              in. AnomalyCandidate out of detectors. CorrelatedIncidentCandidate
              out of the graph. RootCauseHypothesis out of scoring.
              FinalIncidentReport last, with claim citations mapped back to
              evidence ids.
            </p>
            <p className="text-lg leading-8 text-[var(--muted)]">
              Optional OpenAI is a rewriter sitting on those contracts. The
              default path composes analyst copy from the evidence JSON itself.
              There is no Ollama sidecar, no downloaded weights, no mock
              &ldquo;Prompt size=&rdquo; theater. If you cannot point at a
              detector row, you do not get to claim a root cause.
            </p>
          </div>
        </header>

        <section>
          <p className="kicker">Order of operations</p>
          <h2 className="mt-6 max-w-3xl text-5xl tracking-tight">
            Generation is mile eight. Miles one through seven are the product.
          </h2>
          <div className="mt-14 space-y-4">
            {stages.map((stage) => (
              <article key={stage.n} className="panel rounded-3xl p-10">
                <p className="font-mono text-sm text-[var(--violet)]">{stage.n}</p>
                <h3 className="mt-3 text-3xl">{stage.title}</h3>
                <p className="mt-4 max-w-3xl leading-8 text-[var(--muted)]">{stage.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <p className="kicker">Detectors</p>
          <h2 className="mt-6 text-4xl tracking-tight">Gates you can read in YAML</h2>
          <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
            Thresholds are not hidden in a notebook. They live in
            configs/default.yaml under anomaly_detection, with min_support,
            lookback_windows, z_threshold, mad_multiplier, and
            min_relative_change per family.
          </p>
          <div className="data-table detectors-table mt-12 overflow-hidden rounded-3xl border border-[var(--line)]">
            {detectors.map((row) => (
              <div
                key={row.name}
                className="grid min-w-0 grid-cols-3 gap-3 border-b border-[var(--line)] px-8 py-6 last:border-0"
              >
                <p className="min-w-0 break-words font-mono text-[var(--mint)]">{row.name}</p>
                <p className="min-w-0 break-words text-sm text-[var(--muted)]">{row.signal}</p>
                <p className="min-w-0 break-words font-mono text-xs text-[var(--blue)]">{row.gate}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="kicker">Correlation & RCA</p>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <article className="panel rounded-3xl p-10">
              <h3 className="text-2xl">How incidents form</h3>
              <p className="mt-4 leading-7 text-[var(--muted)]">
                Anomalies within max_time_distance_minutes can join. Same-service
                weight is 1.0, dependency edges 0.8, cross-signal 0.5. A
                relationship_threshold of 1.0 keeps lonely spikes from becoming
                incidents. The graph path is configs/service_dependencies.yaml.
              </p>
            </article>
            <article className="panel rounded-3xl p-10">
              <h3 className="text-2xl">How origin is ranked</h3>
              <p className="mt-4 leading-7 text-[var(--muted)]">
                Root-cause support is the top candidate score divided by the sum
                of all candidate scores. Downstream pain gets a bonus so it is
                visible, and an upstream penalty so it is not automatically the
                cause. Unresolved ambiguities stay on the hypothesis.
              </p>
            </article>
          </div>
          <div className="data-table mt-10 overflow-hidden rounded-3xl border border-[var(--line)]">
            <div className="grid grid-cols-3 border-b border-[var(--line)] px-8 py-4 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--faint)]">
              <span>Weight</span>
              <span>Value</span>
              <span>Why</span>
            </div>
            {correlationWeights.map((row) => (
              <div
                key={row.name}
                className="grid grid-cols-3 border-b border-[var(--line)] px-8 py-6 text-sm last:border-0"
              >
                <p className="font-mono text-[var(--mint)]">{row.name}</p>
                <p className="font-mono text-[var(--blue)]">{row.value}</p>
                <p className="text-[var(--muted)]">{row.why}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="kicker">Bundled scenarios</p>
          <h2 className="mt-6 max-w-3xl text-4xl tracking-tight">
            Three filesets you can run without inventing telemetry.
          </h2>
          <div className="mt-12 border-t border-[var(--line)]">
            {sampleScenarios.map((item) => (
              <div key={item.id} className="spec-row">
                <p className="font-mono text-sm text-[var(--violet)]">{item.id}</p>
                <div>
                  <p className="text-xl tracking-tight">{item.name}</p>
                  <p className="mt-3 max-w-3xl leading-7 text-[var(--muted)]">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="kicker">Report anatomy</p>
          <h2 className="mt-6 max-w-3xl text-4xl tracking-tight">
            Six sections. Only one of them is allowed to be a fact.
          </h2>
          <div className="mt-12 border-t border-[var(--line)]">
            {reportAnatomy.map((item) => (
              <div key={item.label} className="spec-row">
                <p className="font-mono text-sm text-[var(--mint)]">{item.label}</p>
                <p className="max-w-3xl leading-7 text-[var(--muted)]">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="kicker">Grounding labels</p>
          <h2 className="mt-6 text-4xl tracking-tight">Every sentence gets a status</h2>
          <div className="mt-12 border-t border-[var(--line)]">
            {claimStatuses.map((item) => (
              <div key={item.status} className="spec-row">
                <p className="font-mono text-sm text-[var(--blue)]">{item.status}</p>
                <p className="max-w-3xl leading-7 text-[var(--muted)]">{item.meaning}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="kicker">After the page</p>
          <h2 className="mt-6 text-4xl tracking-tight">A four-step playbook the report already writes</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {playbook.map((item) => (
              <article key={item.step} className="rounded-3xl border border-[var(--line)] p-10">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--violet)]">
                  {item.step}
                </p>
                <p className="mt-4 leading-7 text-[var(--muted)]">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <p className="kicker">Anti-patterns</p>
          <h2 className="mt-6 max-w-3xl text-4xl tracking-tight">
            Ways to misuse a ranked origin.
          </h2>
          <ol className="spine mt-14">
            {antiPatterns.map((item, index) => (
              <li key={item.title} className="spine-item">
                <p className="font-mono text-sm text-[var(--violet)]">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 text-2xl tracking-tight">{item.title}</h3>
                <p className="mt-3 max-w-3xl leading-7 text-[var(--muted)]">{item.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          {principles.map((item) => (
            <article key={item.title} className="panel rounded-3xl p-10">
              <h2 className="text-3xl">{item.title}</h2>
              <p className="mt-5 leading-7 text-[var(--muted)]">{item.body}</p>
            </article>
          ))}
        </section>
      </div>
      <Footer />
    </main>
  );
}
