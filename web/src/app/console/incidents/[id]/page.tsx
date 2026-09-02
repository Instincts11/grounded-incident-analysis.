"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, type Incident, type JobDetail } from "@/lib/api";
import { playbook, reportAnatomy } from "@/lib/content";
import { ComposeSplit } from "@/components/console/ComposeSplit";
import { IncidentAsk } from "@/components/console/IncidentAsk";
import { ModelTrace } from "@/components/console/ModelTrace";

export default function IncidentDetailPage() {
  const params = useParams<{ id: string }>();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [job, setJob] = useState<JobDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const jobs = await api.jobs();
      for (const status of jobs.jobs) {
        const detail = await api.job(status.job_id);
        const match = detail.incidents.find((item) => item.incident_id === params.id);
        if (match) {
          setIncident(match);
          setJob(detail);
          return;
        }
      }
      setError("Incident not found in the in-memory job store. Run a scenario first.");
    }
    load().catch((err: Error) => setError(err.message));
  }, [params.id]);

  const report = job?.reports.find((item) => item.incident_id === params.id);

  return (
    <div className="space-y-12">
      <header className="page-hero">
        <p className="kicker">Incident</p>
        <h1 className="mt-4 text-4xl tracking-tight md:text-6xl">{params.id}</h1>
        {incident ? (
          <p className="mt-4 text-lg text-[var(--muted)]">
            Primary service {incident.suspected_primary_service} · correlation{" "}
            {incident.correlation_score.toFixed(2)}
          </p>
        ) : null}
      </header>
      {error ? <p className="text-[var(--danger)]">{error}</p> : null}

      {job?.compose_trace ? <ModelTrace trace={job.compose_trace} /> : null}

      {report ? (
        <section className="space-y-8">
          <ComposeSplit report={report} />
          {job ? <IncidentAsk jobId={job.job_id} incidentId={report.incident_id} /> : null}
        </section>
      ) : null}

      {incident ? (
        <section>
          <h2 className="text-3xl tracking-tight">Evidence</h2>
          <div className="data-table mt-8 overflow-hidden rounded-3xl border border-[var(--line)]">
            {incident.evidence.map((item) => (
              <div
                key={`${item.anomaly_type}-${item.timestamp_window_start}`}
                className="grid gap-4 border-b border-[var(--line)] px-6 py-5 md:grid-cols-5 last:border-0"
              >
                <p className="font-mono text-sm text-[var(--mint)]">
                  {item.anomaly_type.replaceAll("_", " ")}
                </p>
                <p>{item.affected_service}</p>
                <p className="font-mono text-sm">obs {item.observed_value}</p>
                <p className="font-mono text-sm">base {item.baseline_value}</p>
                <p className="text-sm text-[var(--muted)]">{item.evidence_summary}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 md:grid-cols-2">
        <article className="panel rounded-3xl p-8">
          <h2 className="text-2xl">How to read this page</h2>
          <p className="mt-4 leading-7 text-[var(--muted)]">
            Primary service is the correlation guess, not yet RCA. Evidence
            rows are detector hits that joined the candidate. The report
            sections below are composed from that bundle. If the API process
            restarted, this id will 404 until you re-run a scenario.
          </p>
        </article>
        <article className="panel rounded-3xl p-8">
          <h2 className="text-2xl">What to do next</h2>
          <p className="mt-4 leading-7 text-[var(--muted)]">
            Contain the origin, not every impacted service. Copy the handoff
            into the ticket. If the graph looks wrong, reject the report with
            a note — do not silently edit facts. Facts are detector output.
          </p>
        </article>
      </section>

      <section>
        <h2 className="text-3xl tracking-tight">Playbook already in the report</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {playbook.map((item) => (
            <article key={item.step} className="rounded-3xl border border-[var(--line)] p-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--violet)]">
                {item.step}
              </p>
              <p className="mt-3 leading-7 text-[var(--muted)]">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-3xl tracking-tight">How the document is split</h2>
        <div className="mt-8 border-t border-[var(--line)]">
          {reportAnatomy.map((item) => (
            <div key={item.label} className="spec-row">
              <p className="font-mono text-sm text-[var(--mint)]">{item.label}</p>
              <p className="leading-7 text-[var(--muted)]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
