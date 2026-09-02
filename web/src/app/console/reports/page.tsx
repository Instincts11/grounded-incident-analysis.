"use client";

import { useEffect, useMemo, useState } from "react";
import { api, uniqueBy, type JobDetail, type Report } from "@/lib/api";
import { exportFormats, reportAnatomy, reviewStates } from "@/lib/content";
import { ComposeSplit } from "@/components/console/ComposeSplit";
import { IncidentAsk } from "@/components/console/IncidentAsk";
import { ModelTrace } from "@/components/console/ModelTrace";

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [job, setJob] = useState<JobDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const jobs = await api.jobs();
      const latestId = jobs.jobs[0]?.job_id;
      if (!latestId) {
        if (!cancelled) {
          setReports([]);
          setJob(null);
        }
        return;
      }
      const detail = await api.job(latestId);
      if (!cancelled) {
        setJob(detail);
        setReports(uniqueBy(detail.reports ?? [], (report) => report.incident_id));
      }
    }
    load().catch((err: Error) => {
      if (!cancelled) setError(err.message);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleReports = useMemo(
    () => uniqueBy(reports, (report) => report.incident_id),
    [reports],
  );

  return (
    <div className="space-y-12">
      <header className="page-hero">
        <p className="kicker">Studio</p>
        <h1 className="mt-4 text-5xl tracking-tight">Reports</h1>
        <p className="mt-4 max-w-2xl text-[var(--muted)]">
          Facts stay attached to detector rows. Toggle the rewrite. Ask the pack
          a question it cannot answer.
        </p>
      </header>
      {error ? <p className="text-[var(--danger)]">{error}</p> : null}
      {job?.compose_trace ? <ModelTrace trace={job.compose_trace} /> : null}
      {visibleReports.length === 0 ? (
        <p className="text-[var(--muted)]">
          No report on the latest run. Checkout cascade composes one. Healthy
          baseline and Degraded partial complete with an empty ledger.
        </p>
      ) : null}
      <div className="space-y-10">
        {visibleReports.map((report, index) => (
          <article key={`report-${index}`} className="panel rounded-[2rem] p-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-mono text-sm text-[var(--mint)]">{report.incident_id}</h2>
              <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--violet)]">
                {report.review_status}
              </span>
            </div>
            <ComposeSplit report={report} />
            {job ? (
              <div className="mt-8">
                <IncidentAsk jobId={job.job_id} incidentId={report.incident_id} />
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <section className="grid grid-cols-1 gap-6 min-[960px]:grid-cols-2 min-[1400px]:grid-cols-3">
        {[
          {
            title: "Summary",
            body: "What happened and when, using only services present in evidence. Inference is withheld until the RCA section.",
          },
          {
            title: "Facts",
            body: "Detector rows, formatted as service: type observed=x baseline=y. These are the only sentences that may be treated as ground truth.",
          },
          {
            title: "Handoff & remediations",
            body: "Operational next steps. Grounding marks remediations as not_applicable — they are advice, not claims about the past.",
          },
        ].map((item) => (
          <article key={item.title} className="panel rounded-3xl p-8">
            <h3 className="text-xl">{item.title}</h3>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{item.body}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-[var(--line)] p-10">
        <h2 className="text-2xl">Review states</h2>
        <p className="mt-4 max-w-3xl leading-7 text-[var(--muted)]">
          draft is the default after compose. reviewed means a human looked.
          approved is the only state that may leave through a webhook. rejected
          keeps the JSON and records the note so the next run is not gaslit.
          Transitions require a reviewer name — the API will 400 without one.
        </p>
        <ol className="spine mt-8">
          {reviewStates.map((item) => (
            <li key={item.state} className="spine-item">
              <p className="font-mono text-sm text-[var(--violet)]">{item.state}</p>
              <p className="mt-3 max-w-3xl leading-7 text-[var(--muted)]">{item.meaning}</p>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="text-3xl tracking-tight">Anatomy</h2>
        <div className="mt-8 border-t border-[var(--line)]">
          {reportAnatomy.map((item) => (
            <div key={item.label} className="spec-row">
              <p className="font-mono text-sm text-[var(--mint)]">{item.label}</p>
              <p className="leading-7 text-[var(--muted)]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-3xl tracking-tight">Export</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {exportFormats.map((item) => (
            <article key={item.format} className="rounded-3xl border border-[var(--line)] p-8">
              <h3 className="font-mono text-sm text-[var(--blue)]">{item.format}</h3>
              <p className="mt-3 leading-7 text-[var(--muted)]">{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
