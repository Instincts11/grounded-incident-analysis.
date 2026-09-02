import { Footer } from "@/components/site/Footer";
import { TypedWord } from "@/components/site/TypedWord";
import {
  claimStatuses,
  limitations,
  reviewStates,
  securityControls,
} from "@/lib/content";

export default function SecurityPage() {
  return (
    <main className="px-8 pt-36">
      <div className="mx-auto max-w-[1440px] space-y-28 pb-8">
        <header className="page-hero">
          <p className="kicker">Grounding</p>
          <h1 className="display mt-8 max-w-[16ch]" aria-label="If it is not in the bundle, it is unmarked.">
            If it is not in the bundle,
            <span className="serif relative">
              {" "}
              <TypedWord text="it is unmarked." />
            </span>
          </h1>
          <p className="mt-10 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            Trust in this product is not a brand color. It is path allowlists,
            claim overlap, outbound URL policy, and a review state machine.
            Generated language that cannot point at evidence stays in the report
            with a reason — never promoted to a fact.
          </p>
        </header>

        <section className="grid gap-8 md:grid-cols-2">
          {securityControls.map((item) => (
            <article key={item.title} className="panel rounded-3xl p-10">
              <h2 className="text-3xl">{item.title}</h2>
              <p className="mt-5 leading-7 text-[var(--muted)]">{item.body}</p>
            </article>
          ))}
        </section>

        <section>
          <p className="kicker">Threat model, local edition</p>
          <h2 className="mt-6 max-w-3xl text-5xl tracking-tight">
            The API is for a trusted workstation. We still refuse the usual foot-guns.
          </h2>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {[
              {
                title: "What we assume",
                body: "An operator on the same machine, or a trusted network. There is no end-user auth. Do not expose :8000 to the public internet.",
              },
              {
                title: "What we still block",
                body: "Path traversal, writes outside artifacts, webhook URLs that are not exact allowlist matches, Prometheus hosts that were never opted in.",
              },
              {
                title: "What we record",
                body: "Request ids, stage durations, grounding summaries, review history, webhook delivery attempts. If it happened, it is in JSON.",
              },
            ].map((item) => (
              <article key={item.title} className="rounded-3xl border border-[var(--line)] p-8">
                <h3 className="text-2xl">{item.title}</h3>
                <p className="mt-4 leading-7 text-[var(--muted)]">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel rounded-[2rem] p-10 md:p-16">
          <p className="kicker">Grounding policy</p>
          <h2 className="mt-6 text-4xl tracking-tight">warn by default, fail when you are ready</h2>
          <p className="mt-6 max-w-3xl leading-8 text-[var(--muted)]">
            configs/default.yaml sets grounding.enabled and grounding.policy.
            Policy warn keeps unsupported claims and flags them. Policy fail
            drops the report if overlap is below minimum_support_overlap (0.34
            by default). Use warn while you are tuning detectors. Use fail
            before a report is allowed to leave through a webhook.
          </p>
          <div className="mt-10 border-t border-[var(--line)]">
            {claimStatuses.map((item) => (
              <div key={item.status} className="spec-row">
                <p className="font-mono text-sm text-[var(--mint)]">{item.status}</p>
                <p className="leading-7 text-[var(--muted)]">{item.meaning}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="kicker">Review machine</p>
          <h2 className="mt-6 max-w-3xl text-5xl tracking-tight">
            Four states. One of them may leave the building.
          </h2>
          <ol className="spine mt-14">
            {reviewStates.map((item) => (
              <li key={item.state} className="spine-item">
                <p className="font-mono text-sm text-[var(--violet)]">{item.state}</p>
                <p className="mt-3 max-w-3xl leading-7 text-[var(--muted)]">{item.meaning}</p>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <p className="kicker">Allowlists</p>
          <h2 className="mt-6 max-w-3xl text-4xl tracking-tight">
            Reads, writes, hosts, and URLs are named. Everything else is refused.
          </h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--line)] md:grid-cols-2">
            <article className="bg-[var(--bg)] p-10">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--faint)]">
                Read
              </p>
              <ul className="mt-6 space-y-3 font-mono text-sm text-[var(--mint)]">
                <li>data/</li>
                <li>configs/</li>
                <li>artifacts/</li>
                <li>eval/</li>
              </ul>
              <p className="mt-6 leading-7 text-[var(--muted)]">
                Traversal and absolute escapes are rejected before the pipeline
                starts. Bring logs from inside those trees.
              </p>
            </article>
            <article className="bg-[var(--bg)] p-10">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--faint)]">
                Write & outbound
              </p>
              <ul className="mt-6 space-y-3 font-mono text-sm text-[var(--blue)]">
                <li>artifacts/ only</li>
                <li>webhook allowed_urls exact match</li>
                <li>Prometheus allowed_hosts</li>
                <li>HTTP / private nets default off</li>
              </ul>
              <p className="mt-6 leading-7 text-[var(--muted)]">
                Failed deliveries still append JSONL. A missing reviewer name
                is a 400, not a silent approve.
              </p>
            </article>
          </div>
        </section>

        <section>
          <p className="kicker">What we do not store</p>
          <h2 className="mt-6 max-w-3xl text-4xl tracking-tight">
            No phone-home. No weights. No stray OPENAI_API_KEY.
          </h2>
          <div className="mt-12 border-t border-[var(--line)]">
            {limitations.map((item) => (
              <div key={item.label} className="spec-row">
                <p className="font-mono text-sm text-[var(--violet)]">{item.label}</p>
                <p className="max-w-3xl leading-7 text-[var(--muted)]">{item.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 max-w-3xl leading-8 text-[var(--muted)]">
            Credential hygiene: .env is gitignored. .env.example never carries
            secret values. Only INCIDENT_AGENT_OPENAI_API_KEY can activate the
            optional rewriter. A generic OPENAI_API_KEY export in the shell is
            ignored on purpose.
          </p>
        </section>
      </div>
      <Footer />
    </main>
  );
}
