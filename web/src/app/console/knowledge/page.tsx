import { knowledgeCards, retrievalParams } from "@/lib/content";

export default function KnowledgePage() {
  return (
    <div className="space-y-16">
      <header className="page-hero">
        <p className="kicker">Retrieval</p>
        <h1 className="mt-4 text-5xl tracking-tight">Knowledge</h1>
        <p className="mt-4 max-w-2xl leading-8 text-[var(--muted)]">
          Runbooks and historical incidents are retrieved as snippets with
          citation ids. Nothing is smuggled in from an unbounded local model.
          Overlap is lexical and scored; a pretty paragraph without a snippet
          is just prose.
        </p>
      </header>

      <section className="knowledge-intro grid min-w-0 gap-6 lg:grid-cols-2">
        <article className="panel min-w-0 rounded-3xl p-8">
          <h2 className="text-2xl">How retrieval is wired</h2>
          <p className="mt-4 leading-7 break-words text-[var(--muted)]">
            Console jobs set retrieval_enabled and pass
            data/knowledge/runbooks plus data/knowledge/incidents. The core
            chunks files, scores them against the incident context, and keeps
            top_k snippets (default 3) clipped to max_snippet_chars.
          </p>
        </article>
        <article className="panel min-w-0 rounded-3xl p-8">
          <h2 className="text-2xl">What a citation looks like</h2>
          <p className="mt-4 leading-7 break-words text-[var(--muted)]">
            citation_id is a source path plus chunk id, for example
            data/knowledge/runbooks/checkout_latency.md#chunk-1. Reports attach
            these ids. Grounding then checks whether the sentence actually
            overlaps the snippet.
          </p>
        </article>
      </section>

      <div className="grid grid-cols-1 gap-6 min-[960px]:grid-cols-2 min-[1400px]:grid-cols-3">
        {knowledgeCards.map((card) => (
          <article key={card.title} className="panel rounded-3xl p-8">
            <p className="font-mono text-[11px] text-[var(--violet)]">{card.path}</p>
            <h2 className="mt-4 text-2xl">{card.title}</h2>
            <p className="mt-4 leading-7 text-[var(--muted)]">{card.body}</p>
            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--faint)]">
              {card.owner}
            </p>
          </article>
        ))}
      </div>

      <section className="rounded-3xl border border-[var(--line)] p-10">
        <h2 className="text-2xl">Adding your own corpus</h2>
        <p className="mt-4 max-w-3xl leading-7 text-[var(--muted)]">
          Drop Markdown under a directory inside the read allowlist, then pass
          that path as knowledge_source_paths on the next job. Keep snippets
          operational: service names, detector families, and the next check to
          run. Memoirs of the outage do not retrieve well. Checklists do.
        </p>
      </section>

      <section>
        <h2 className="text-3xl tracking-tight">Retrieval knobs</h2>
        <p className="mt-4 max-w-2xl text-[var(--muted)]">
          Defaults live under knowledge: in configs/default.yaml. Console jobs
          turn retrieval on and point at the bundled runbooks plus incidents.
        </p>
        <div className="data-table mt-8 overflow-hidden rounded-3xl border border-[var(--line)]">
          {retrievalParams.map((row) => (
            <div
              key={row.name}
              className="grid gap-4 border-b border-[var(--line)] px-6 py-5 md:grid-cols-3 last:border-0"
            >
              <p className="font-mono text-sm text-[var(--mint)]">{row.name}</p>
              <p className="font-mono text-sm text-[var(--blue)]">{row.value}</p>
              <p className="text-sm text-[var(--muted)]">{row.why}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
