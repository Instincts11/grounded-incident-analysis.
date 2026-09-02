"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Footer } from "@/components/site/Footer";
import { TypedWord } from "@/components/site/TypedWord";
import SignalField from "@/components/canvas/SignalField";
import { ConsoleDemo } from "@/components/site/ConsoleDemo";
import {
  audiences,
  caseFacts,
  contrast,
  detectors,
  evalModes,
  faqs,
  inputs,
  limitations,
  notFor,
  outputs,
  principles,
  qualityGates,
  shiftSteps,
  stages,
  stats,
  voices,
} from "@/lib/content";

const fade = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function Home() {
  return (
    <main className="relative overflow-x-hidden">
      <section className="page-hero relative min-h-[100vh] px-8 pt-28">
        <div className="pointer-events-none absolute inset-0">
          <SignalField />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[var(--bg)] to-transparent" />
        </div>
        <div className="relative mx-auto max-w-[1440px] pb-24">
          <motion.p
            initial="hidden"
            animate="show"
            variants={fade}
            className="kicker"
          >
            Grounded incident intelligence
          </motion.p>
          <motion.h1
            initial="hidden"
            animate="show"
            variants={fade}
            className="display mt-10 max-w-[18ch]"
            aria-label="The war room, composed."
          >
            The war room,
            <span className="serif text-[1.04em] relative">
              {" "}
              <TypedWord text="composed." />
            </span>
          </motion.h1>
          <motion.p
            initial="hidden"
            animate="show"
            variants={fade}
            className="mt-10 max-w-xl text-lg leading-8 text-[var(--muted)]"
          >
            Logs and metrics enter as files. They leave as a ranked incident,
            a cited RCA hypothesis, and a report an on-call engineer can
            actually hand to a VP. No containers. No local model. Navy war-room,
            amber action, built like a product company.
          </motion.p>
          <motion.div
            initial="hidden"
            animate="show"
            variants={fade}
            className="mt-12 flex flex-wrap gap-4 max-[500px]:flex-nowrap max-[500px]:gap-2"
          >
            <Link
              href="/console"
              className="rounded-full bg-[var(--violet)] px-8 py-3 text-sm font-medium text-[var(--on-accent)] transition hover:opacity-90 max-[500px]:flex-1 max-[500px]:px-3 max-[500px]:text-center max-[500px]:text-xs"
            >
              Enter the console
            </Link>
            <Link
              href="/method"
              className="rounded-full border border-[var(--line)] px-8 py-3 text-sm text-[var(--text)]/80 hover:border-[var(--violet)] max-[500px]:flex-1 max-[500px]:px-3 max-[500px]:text-center max-[500px]:text-xs"
            >
              Read the method
            </Link>
          </motion.div>
          <div className="mt-24 grid gap-px overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--line)] md:grid-cols-4">
            {stats.map((item) => (
              <div key={item.label} className="bg-[var(--bg)] px-8 py-10">
                <p className="font-mono text-4xl text-[var(--mint)]">{item.value}</p>
                <p className="mt-4 max-w-[16rem] text-sm leading-6 text-[var(--muted)]">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-8 py-32">
        <p className="kicker">Manifesto</p>
        <div className="mt-8 grid gap-20 lg:grid-cols-[1.1fr_0.9fr]">
          <h2 className="manifesto-title text-5xl leading-[1.05] tracking-tight md:text-7xl">
            Most incident demos skip the layers that make generated analysis
            <span className="serif"> trustworthy.</span>
          </h2>
          <div className="space-y-8 text-lg leading-8 text-[var(--muted)]">
            <p>
              We built the boring machinery first: typed ingestion, UTC
              timelines, MAD detectors, a dependency graph, evidence ranking,
              and grounding checks. Generation is the last mile, not the
              product.
            </p>
            <p>
              The console is designed the way Linear, Cursor, and GitHub
              Copilot are designed — dark density, generous type, one accent
              for action, another for signal. Amber for action. Ice for
              telemetry. Navy from a 1am war room.
            </p>
            <p>
              Bring a CSV. Leave with a hypothesis you can argue with.
            </p>
          </div>
        </div>
        <div className="mt-24 grid gap-6 md:grid-cols-2">
          {principles.map((item) => (
            <article key={item.title} className="panel rounded-3xl p-10">
              <h3 className="text-2xl tracking-tight">{item.title}</h3>
              <p className="mt-5 max-w-lg text-[var(--muted)] leading-7">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-8 py-24">
        <p className="kicker">Scope</p>
        <h2 className="mt-6 max-w-3xl text-5xl tracking-tight">
          Investigation after the page. Not a second paging product.
        </h2>
        <div className="mt-14 border-t border-[var(--line)]">
          {notFor.map((item) => (
            <div key={item.label} className="spec-row">
              <p className="font-mono text-sm text-[var(--mint)]">{item.label}</p>
              <p className="max-w-3xl leading-7 text-[var(--muted)]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <ConsoleDemo />

      <section className="mx-auto max-w-[1440px] px-8 py-24">
        <p className="kicker">Eight stages</p>
        <h2 className="mt-6 max-w-3xl text-5xl tracking-tight md:text-6xl">
          A compiler for incidents, not a chatbot with logs pasted in.
        </h2>
        <div className="mt-20 grid gap-px overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--line)] md:grid-cols-2">
          {stages.map((stage) => (
            <article key={stage.n} className="bg-[var(--bg)] p-10 md:p-14">
              <p className="font-mono text-sm text-[var(--violet)]">{stage.n}</p>
              <h3 className="mt-6 text-3xl tracking-tight">{stage.title}</h3>
              <p className="mt-5 max-w-md leading-7 text-[var(--muted)]">{stage.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-8 py-24">
        <div className="panel overflow-hidden rounded-[2rem]">
          <div className="grid lg:grid-cols-2">
            <div className="border-b border-[var(--line)] p-10 md:p-16 lg:border-r lg:border-b-0">
              <p className="kicker">Case 001 · checkout cascade</p>
              <h2 className="mt-8 text-4xl tracking-tight md:text-5xl">
                One service. Five signals. Zero mystery theater.
              </h2>
              <p className="mt-8 max-w-lg leading-8 text-[var(--muted)]">
                The bundled sample is a saturated checkout path: CPU, memory,
                latency, error rate, and an error-log burst arriving in the
                same five-minute windows. Correlation collapses them into a
                single incident. RCA names checkout-service because the
                evidence is there — not because a model felt poetic.
              </p>
              <Link
                href="/console"
                className="mt-10 inline-flex text-sm text-[var(--mint)] hover:text-[var(--text)]"
              >
                Run it in the console →
              </Link>
            </div>
            <div className="space-y-6 p-10 md:p-16">
              {caseFacts.map((fact) => (
                <p
                  key={fact}
                  className="border-b border-[var(--line)] pb-5 font-mono text-sm leading-6 text-[var(--blue)] last:border-0"
                >
                  {fact}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-8 py-24">
        <p className="kicker">Paste vs pipeline</p>
        <h2 className="mt-6 max-w-3xl text-5xl tracking-tight">
          A chat box is not an incident compiler.
        </h2>
        <div className="compare-grid mt-14">
          <div className="border-b border-[var(--line)] p-8 md:border-b-0 md:border-r md:p-12">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--faint)]">
              Chat paste
            </p>
            <ul className="mt-8 space-y-6">
              {contrast.map((row) => (
                <li key={row.them} className="leading-7 text-[var(--muted)]">
                  {row.them}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-8 md:p-12">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--mint)]">
              This pipeline
            </p>
            <ul className="mt-8 space-y-6">
              {contrast.map((row) => (
                <li key={row.us} className="leading-7 text-[var(--text)]">
                  {row.us}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-8 py-24">
        <p className="kicker">Who it is for</p>
        <h2 className="mt-6 max-w-3xl text-5xl tracking-tight">
          Four chairs in the same war room.
        </h2>
        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {audiences.map((item) => (
            <article key={item.title} className="panel rounded-3xl p-10">
              <h3 className="text-2xl tracking-tight">{item.title}</h3>
              <p className="mt-5 leading-7 text-[var(--muted)]">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-8 py-24">
        <p className="kicker">Detectors</p>
        <h2 className="mt-6 max-w-3xl text-5xl tracking-tight">
          Eight families. Independent gates. No silent fusion.
        </h2>
        <p className="mt-6 max-w-2xl leading-8 text-[var(--muted)]">
          Each detector reads its own series, applies its own z-score and MAD
          thresholds, and emits an AnomalyCandidate. Correlation happens later.
          That order is the whole product.
        </p>
        <div className="data-table mt-14 overflow-hidden rounded-3xl border border-[var(--line)]">
          <div className="grid grid-cols-3 border-b border-[var(--line)] px-8 py-4 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--faint)]">
            <span>Family</span>
            <span>Signal</span>
            <span>Gate</span>
          </div>
          {detectors.map((row) => (
            <div
              key={row.name}
              className="grid grid-cols-3 border-b border-[var(--line)] px-8 py-6 text-sm last:border-0"
            >
              <span className="font-mono text-[var(--mint)]">{row.name}</span>
              <span className="text-[var(--muted)]">{row.signal}</span>
              <span className="font-mono text-xs text-[var(--blue)]">{row.gate}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-8 py-24">
        <p className="kicker">A shift</p>
        <h2 className="mt-6 max-w-3xl text-5xl tracking-tight">
          Five moves between the page and the handoff.
        </h2>
        <ol className="spine mt-16">
          {shiftSteps.map((step) => (
            <li key={step.n} className="spine-item">
              <p className="font-mono text-sm text-[var(--violet)]">{step.n}</p>
              <h3 className="mt-2 text-2xl tracking-tight">{step.title}</h3>
              <p className="mt-3 max-w-3xl leading-7 text-[var(--muted)]">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-[1440px] px-8 py-24">
        <p className="kicker">From the floor</p>
        <div className="mt-16 grid gap-10 min-[981px]:grid-cols-3">
          {voices.map((item) => (
            <blockquote key={item.role} className="panel rounded-3xl p-10">
              <p className="text-xl leading-8 tracking-tight">&ldquo;{item.quote}&rdquo;</p>
              <footer className="mt-8 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--faint)]">
                {item.role}
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-8 py-24">
        <p className="kicker">Evaluation</p>
        <h2 className="mt-6 max-w-3xl text-5xl tracking-tight">
          Modes you can regress, not vibes you can demo once.
        </h2>
        <div className="data-table mt-16 overflow-hidden rounded-3xl border border-[var(--line)]">
          <div className="grid grid-cols-4 border-b border-[var(--line)] px-8 py-4 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--faint)]">
            <span>Mode</span>
            <span>Incident F1</span>
            <span>Root cause</span>
            <span>Note</span>
          </div>
          {evalModes.map((row) => (
            <div
              key={row.mode}
              className="grid grid-cols-4 border-b border-[var(--line)] px-8 py-7 text-sm last:border-0"
            >
              <span className="font-mono text-[var(--mint)]">{row.mode}</span>
              <span>{row.f1}</span>
              <span>{row.root}</span>
              <span className="text-[var(--muted)]">{row.note}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-8 py-24">
        <div className="grid gap-20 lg:grid-cols-2">
          <div>
            <p className="kicker">In</p>
            <h2 className="mt-6 text-4xl tracking-tight">Files, a graph, a corpus.</h2>
            <div className="mt-10 border-t border-[var(--line)]">
              {inputs.map((item) => (
                <div key={item.label} className="spec-row">
                  <p className="font-mono text-sm text-[var(--mint)]">{item.label}</p>
                  <p className="leading-7 text-[var(--muted)]">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="kicker">Out</p>
            <h2 className="mt-6 text-4xl tracking-tight">Artifacts you can argue with.</h2>
            <div className="mt-10 border-t border-[var(--line)]">
              {outputs.map((item) => (
                <div key={item.label} className="spec-row">
                  <p className="font-mono text-sm text-[var(--blue)]">{item.label}</p>
                  <p className="leading-7 text-[var(--muted)]">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-8 py-24">
        <p className="kicker">Quality</p>
        <h2 className="mt-6 max-w-3xl text-5xl tracking-tight">
          Gates that fail the build, not the landing page.
        </h2>
        <div className="mt-14 border-t border-[var(--line)]">
          {qualityGates.map((item) => (
            <div key={item.name} className="spec-row">
              <p className="font-mono text-sm text-[var(--mint)]">{item.name}</p>
              <p className="max-w-3xl leading-7 text-[var(--muted)]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-8 py-24">
        <p className="kicker">Limits</p>
        <h2 className="mt-6 max-w-3xl text-5xl tracking-tight">
          Honest edges, written down.
        </h2>
        <div className="mt-14 border-t border-[var(--line)]">
          {limitations.map((item) => (
            <div key={item.label} className="spec-row">
              <p className="font-mono text-sm text-[var(--violet)]">{item.label}</p>
              <p className="max-w-3xl leading-7 text-[var(--muted)]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-8 py-24">
        <p className="kicker">Questions</p>
        <div className="mt-12 grid gap-12 md:grid-cols-2">
          {faqs.map((item) => (
            <article key={item.q}>
              <h3 className="text-2xl tracking-tight">{item.q}</h3>
              <p className="mt-4 leading-7 text-[var(--muted)]">{item.a}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-8 pb-8">
        <div className="relative overflow-hidden rounded-[2.2rem] border border-[var(--line)] px-10 py-24 md:px-20">
          <div className="glow-orb right-10 top-0 h-64 w-64 bg-[var(--violet)]/30" />
          <p className="kicker relative">Now</p>
          <h2 className="cta-title relative mt-8 max-w-3xl text-5xl tracking-tight md:text-7xl">
            Open the console. Run the cascade. Read the handoff.
          </h2>
          <Link
            href="/console"
            className="relative mt-12 inline-flex rounded-full bg-white px-8 py-3 text-sm font-medium text-black"
          >
            Launch product
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
