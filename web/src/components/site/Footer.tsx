import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative mt-32 border-t border-[var(--line)]">
      <div className="mx-auto grid max-w-[1440px] gap-16 px-8 py-24 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="serif text-4xl">grounded analysis</p>
          <p className="mt-6 max-w-md leading-7 text-[var(--muted)]">
            A studio for incident intelligence. Typed ingestion, deterministic
            detection, ranked RCA, and reports you can defend in a war room.
            Built for operators who are tired of pasting logs into a chat box.
          </p>
          <p className="mt-6 max-w-md text-sm leading-6 text-[var(--faint)]">
            Python core on :8000 · Next.js 16 studio on :3000 · artifacts on
            disk · no containers · no local model runtime.
          </p>
        </div>
        <div className="space-y-3 text-sm text-[var(--muted)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--faint)]">
            Product
          </p>
          <Link href="/architecture" className="block hover:text-[var(--text)]">
            Architecture
          </Link>
          <Link href="/method" className="block hover:text-[var(--text)]">
            Method
          </Link>
          <Link href="/security" className="block hover:text-[var(--text)]">
            Grounding
          </Link>
          <Link href="/console" className="block hover:text-[var(--text)]">
            Console
          </Link>
          <Link href="/console/pipeline" className="block hover:text-[var(--text)]">
            Pipeline
          </Link>
          <Link href="/console/evaluation" className="block hover:text-[var(--text)]">
            Evaluation
          </Link>
        </div>
        <div className="space-y-3 text-sm text-[var(--muted)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--faint)]">
            Operators
          </p>
          <Link href="/console/incidents" className="block hover:text-[var(--text)]">
            Incidents
          </Link>
          <Link href="/console/anomalies" className="block hover:text-[var(--text)]">
            Anomalies
          </Link>
          <Link href="/console/reports" className="block hover:text-[var(--text)]">
            Reports
          </Link>
          <Link href="/console/knowledge" className="block hover:text-[var(--text)]">
            Knowledge
          </Link>
          <p className="pt-4">CSV · JSON · JSONL · Prometheus</p>
          <p>JSON · Markdown · HTML export</p>
        </div>
      </div>
    </footer>
  );
}
