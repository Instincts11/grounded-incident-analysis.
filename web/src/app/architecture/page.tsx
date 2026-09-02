import { Footer } from "@/components/site/Footer";
import { TypedWord } from "@/components/site/TypedWord";
import {
  apiSurface,
  artifacts,
  cliCommands,
  contracts,
  packageMap,
  qualityGates,
  runtimeLayers,
  sampleScenarios,
  stages,
} from "@/lib/content";

export default function ArchitecturePage() {
  return (
    <main className="px-8 pt-36">
      <div className="mx-auto max-w-[1440px] space-y-28 pb-8">
        <header className="page-hero">
          <p className="kicker">Architecture</p>
          <h1 className="display mt-8 max-w-[16ch]" aria-label="Schemas in the middle. Interfaces at the edge.">
            Schemas in the middle.
            <span className="serif relative">
              {" "}
              <TypedWord text="Interfaces at the edge." />
            </span>
          </h1>
          <p className="mt-10 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            The Python package is the system of record. FastAPI exposes jobs,
            incidents, anomalies, and reports. Next.js 16 is the product surface —
            Three.js for the horizon, TypeScript for every contract the console
            touches. Nothing important lives only in a React state tree.
          </p>
        </header>

        <section className="arch-layers grid items-stretch gap-6 min-[901px]:grid-cols-3">
          {[
            {
              title: "Core",
              body: "src/incident_agent — ingestion, detectors, correlation, RCA, grounding, artifact storage. This is the compiler. The UI is a viewer.",
            },
            {
              title: "API",
              body: "FastAPI on :8000 with CORS for the studio, an in-memory job store, and artifacts on disk. Restarts clear jobs; they do not clear JSON.",
            },
            {
              title: "Studio",
              body: "web/ — App Router, Geist + Instrument Serif, navy dark with amber action and ice signal. Pages proxy /backend to the API so the browser never hardcodes ports in fetch logic.",
            },
          ].map((item) => (
            <article key={item.title} className="panel flex h-full min-w-0 flex-col rounded-3xl p-10">
              <h2 className="text-2xl">{item.title}</h2>
              <p className="mt-4 flex-1 leading-7 text-[var(--muted)]">{item.body}</p>
            </article>
          ))}
        </section>

        <section>
          <p className="kicker">Runtime</p>
          <h2 className="mt-6 max-w-3xl text-5xl tracking-tight">
            Four layers. None of them is a local model.
          </h2>
          <div className="mt-12 border-t border-[var(--line)]">
            {runtimeLayers.map((item) => (
              <div key={item.label} className="spec-row">
                <p className="font-mono text-sm text-[var(--mint)]">{item.label}</p>
                <p className="max-w-3xl leading-7 text-[var(--muted)]">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="kicker">Contracts</p>
          <h2 className="mt-6 max-w-3xl text-5xl tracking-tight">
            Every stage emits a typed object. The next stage refuses anything else.
          </h2>
          <div className="data-table contracts-table mt-14 overflow-hidden rounded-3xl border border-[var(--line)]">
            {contracts.map((row) => (
              <div
                key={row.name}
                className="grid min-w-0 gap-4 border-b border-[var(--line)] px-8 py-7 md:grid-cols-3 last:border-0"
              >
                <p className="min-w-0 break-words font-mono text-[var(--mint)]">{row.name}</p>
                <p className="min-w-0 text-sm text-[var(--violet)]">{row.out}</p>
                <p className="min-w-0 text-sm text-[var(--muted)]">{row.fields}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="kicker">Package map</p>
          <h2 className="mt-6 text-4xl tracking-tight">Where the work actually lives</h2>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {packageMap.map((item) => (
              <article key={item.dir} className="rounded-3xl border border-[var(--line)] p-8">
                <p className="font-mono text-[var(--blue)]">{item.dir}</p>
                <p className="mt-3 text-[var(--muted)]">{item.why}</p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <p className="kicker">HTTP</p>
          <h2 className="mt-6 text-4xl tracking-tight">The console only speaks these routes</h2>
          <div className="data-table mt-12 overflow-hidden rounded-3xl border border-[var(--line)]">
            {apiSurface.map((row) => (
              <div
                key={`${row.method} ${row.path}`}
                className="grid gap-4 border-b border-[var(--line)] px-8 py-6 md:grid-cols-[5rem_1fr_1.2fr] last:border-0"
              >
                <p className="font-mono text-xs text-[var(--mint)]">{row.method}</p>
                <p className="font-mono text-sm">{row.path}</p>
                <p className="text-sm text-[var(--muted)]">{row.use}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="kicker">On disk</p>
          <h2 className="mt-6 text-4xl tracking-tight">A run is a directory, not a chat log</h2>
          <div className="mt-12 space-y-3">
            {artifacts.map((item) => (
              <div
                key={item.path}
                className="flex flex-wrap items-baseline justify-between gap-4 rounded-2xl border border-[var(--line)] px-8 py-5"
              >
                <p className="font-mono text-sm text-[var(--mint)]">{item.path}</p>
                <p className="text-sm text-[var(--muted)]">{item.why}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="kicker">CLI</p>
          <h2 className="mt-6 max-w-3xl text-4xl tracking-tight">
            The console is a viewer. The compiler also has a keyboard.
          </h2>
          <div className="data-table mt-12 overflow-hidden rounded-3xl border border-[var(--line)]">
            {cliCommands.map((row) => (
              <div
                key={row.cmd}
                className="grid gap-4 border-b border-[var(--line)] px-8 py-6 md:grid-cols-[14rem_1fr] last:border-0"
              >
                <p className="font-mono text-sm text-[var(--mint)]">{row.cmd}</p>
                <p className="text-sm text-[var(--muted)]">{row.use}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="kicker">Samples</p>
          <h2 className="mt-6 text-4xl tracking-tight">What GET /workspace/samples returns</h2>
          <div className="mt-12 border-t border-[var(--line)]">
            {sampleScenarios.map((item) => (
              <div key={item.id} className="spec-row">
                <p className="font-mono text-sm text-[var(--violet)]">{item.id}</p>
                <p className="max-w-3xl leading-7 text-[var(--muted)]">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="kicker">Quality</p>
          <h2 className="mt-6 text-4xl tracking-tight">CI is part of the architecture</h2>
          <div className="mt-12 border-t border-[var(--line)]">
            {qualityGates.map((item) => (
              <div key={item.name} className="spec-row">
                <p className="font-mono text-sm text-[var(--mint)]">{item.name}</p>
                <p className="max-w-3xl leading-7 text-[var(--muted)]">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="kicker">Pipeline</p>
          <ol className="mt-12 grid gap-4 md:grid-cols-2">
            {stages.map((stage) => (
              <li key={stage.n} className="rounded-3xl border border-[var(--line)] p-8">
                <p className="font-mono text-[var(--violet)]">{stage.n}</p>
                <h3 className="mt-4 text-2xl">{stage.title}</h3>
                <p className="mt-3 text-[var(--muted)]">{stage.body}</p>
                <p className="mt-4 text-sm leading-6 text-[var(--faint)]">{stage.detail}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <Footer />
    </main>
  );
}
