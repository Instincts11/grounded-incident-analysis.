import { artifacts, cliCommands, stages } from "@/lib/content";

export default function PipelinePage() {
  return (
    <div className="space-y-16">
      <header className="page-hero">
        <p className="kicker">Compiler</p>
        <h1 className="mt-4 text-5xl tracking-tight">Pipeline stages</h1>
        <p className="mt-4 max-w-2xl leading-8 text-[var(--muted)]">
          Each run writes a timestamped artifact directory. If a later stage
          degrades, earlier JSON remains inspectable. Think of this page as the
          IR dump of an incident compiler — not a progress spinner.
        </p>
      </header>
                                       
      <section className="grid gap-6 md:grid-cols-2">
        <article className="panel rounded-3xl p-8">
          <h2 className="text-2xl">Synchronous jobs</h2>
          <p className="mt-4 leading-7 text-[var(--muted)]">
            POST /analysis-jobs runs the pipeline in the request. The console
            button waits. For local sample files this is seconds, not minutes.
            Failures return 400 with the job marked failed in the store.
          </p>
        </article>
        <article className="panel rounded-3xl p-8">
          <h2 className="text-2xl">Caches</h2>
          <p className="mt-4 leading-7 text-[var(--muted)]">
            Intermediate pipeline cache and compose cache live under
            artifacts/cache. Identical prompts reuse compose output. Delete the
            cache directory if you change heuristic copy and need a fresh
            narrative.
          </p>
        </article>
      </section>

      <ol className="space-y-4">
        {stages.map((stage) => (
          <li key={stage.n} className="panel flex gap-8 rounded-3xl p-8">
            <span className="font-mono text-[var(--violet)]">{stage.n}</span>
            <div>
              <h2 className="text-2xl">{stage.title}</h2>
              <p className="mt-3 max-w-3xl leading-7 text-[var(--muted)]">{stage.body}</p>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--faint)]">{stage.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <section>
        <h2 className="text-3xl tracking-tight">Artifact layout</h2>
        <p className="mt-4 max-w-2xl text-[var(--muted)]">
          After a console run, open artifacts/ui/&lt;scenario&gt;/&lt;run_id&gt;/
          beside this page. The files below are the contract with the UI.
        </p>
        <div className="mt-8 space-y-3">
          {artifacts.map((item) => (
            <div
              key={item.path}
              className="flex flex-wrap justify-between gap-4 rounded-2xl border border-[var(--line)] px-6 py-4"
            >
              <p className="font-mono text-sm text-[var(--mint)]">{item.path}</p>
              <p className="text-sm text-[var(--muted)]">{item.why}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-3xl tracking-tight">CLI equivalents</h2>
        <p className="mt-4 max-w-2xl text-[var(--muted)]">
          The console always runs the full compiler. These commands exist when
          you need a single stage, a demo directory, or an eval compare.
        </p>
        <div className="data-table mt-8 overflow-hidden rounded-3xl border border-[var(--line)]">
          {cliCommands.map((row) => (
            <div
              key={row.cmd}
              className="grid gap-4 border-b border-[var(--line)] px-6 py-5 md:grid-cols-[14rem_1fr] last:border-0"
            >
              <p className="font-mono text-sm text-[var(--mint)]">{row.cmd}</p>
              <p className="text-sm text-[var(--muted)]">{row.use}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
