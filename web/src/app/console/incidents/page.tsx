"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, uniqueBy, type Incident } from "@/lib/api";
import { antiPatterns, correlationWeights } from "@/lib/content";

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [emptyHint, setEmptyHint] = useState("");

  useEffect(() => {
    api
      .jobs()
      .then(async (payload) => {
        const latestId = payload.jobs[0]?.job_id;
        if (!latestId) {
          setIncidents([]);
          setEmptyHint("Run a scenario from Overview to populate this view.");
          return;
        }
        const filtered = await api.incidents(latestId);
        setIncidents(uniqueBy(filtered.incidents, (incident) => incident.incident_id));
        setEmptyHint(
          filtered.incidents.length === 0
            ? "This run produced no correlated incident. Healthy baseline and Degraded partial are supposed to look like this."
            : "",
        );
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const visibleIncidents = useMemo(
    () => uniqueBy(incidents, (incident) => incident.incident_id),
    [incidents],
  );

  return (
    <div className="space-y-12">
      <header className="page-hero">
        <p className="kicker">Incidents</p>
        <h1 className="mt-4 text-5xl tracking-tight">Correlated candidates</h1>
        <p className="mt-4 max-w-2xl text-[var(--muted)]">
          Correlation groups detector hits by time, service, and the dependency
          graph. Isolated spikes stay out of this list.
        </p>
      </header>
      {error ? <p className="text-[var(--danger)]">{error}</p> : null}
      <div className="space-y-4">
        {visibleIncidents.length === 0 ? (
          <p className="text-[var(--muted)]">
            {emptyHint || "Run a scenario from Overview to populate this view."}
          </p>
        ) : null}
        {visibleIncidents.map((incident, index) => (
          <article key={`incident-${index}`}>
            <Link
              href={`/console/incidents/${incident.incident_id}`}
              className="panel block rounded-3xl p-8 transition hover:border-[var(--violet)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <p className="font-mono text-sm text-[var(--mint)]">{incident.incident_id}</p>
                  <h2 className="mt-3 text-2xl">{incident.suspected_primary_service}</h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {incident.impacted_services.join(" · ") || "no blast radius listed"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-3xl text-[var(--violet)]">
                    {incident.correlation_score.toFixed(2)}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--faint)]">
                    correlation
                  </p>
                </div>
              </div>
              <p className="mt-6 font-mono text-xs text-[var(--faint)]">
                {incident.start_time ? new Date(incident.start_time).toISOString() : "—"} →{" "}
                {incident.end_time ? new Date(incident.end_time).toISOString() : "—"} ·{" "}
                {incident.evidence.length} evidence items
              </p>
            </Link>
          </article>
        ))}
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <article className="panel rounded-3xl p-8">
          <h2 className="text-2xl">Why this is not an alert list</h2>
          <p className="mt-4 leading-7 text-[var(--muted)]">
            Fourteen detector hits in the checkout cascade collapse to one
            incident because they share a window, a service, and a graph
            neighborhood. If you still see fourteen rows here, correlation
            failed — that is a bug, not a dashboard preference.
          </p>
        </article>
        <article className="panel rounded-3xl p-8">
          <h2 className="text-2xl">Reading the score</h2>
          <p className="mt-4 leading-7 text-[var(--muted)]">
            Correlation score is a weighted sum: time proximity, same service,
            dependency edges, cross-signal bonus. Higher is tighter. It is not
            a probability and it is not severity. Severity lives on the
            evidence rows inside the candidate.
          </p>
        </article>
      </section>

      <section className="rounded-3xl border border-[var(--line)] p-10">
        <h2 className="text-2xl">Empty board</h2>
        <p className="mt-4 max-w-3xl leading-7 text-[var(--muted)]">
          Healthy baseline is supposed to produce no incidents. Degraded
          partial may produce a degraded run with warnings and still zero
          candidates. Only Checkout cascade is guaranteed to light this list
          in a clean clone.
        </p>
      </section>

      <section>
        <h2 className="text-3xl tracking-tight">How the score is built</h2>
        <p className="mt-4 max-w-2xl text-[var(--muted)]">
          Weights live in configs/default.yaml under correlation. Same-family
          evidence is intentionally weak and cannot cluster two spikes alone.
        </p>
        <div className="data-table mt-8 overflow-hidden rounded-3xl border border-[var(--line)]">
          {correlationWeights.map((row) => (
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

      <section>
        <h2 className="text-3xl tracking-tight">Do not</h2>
        <ol className="spine mt-8">
          {antiPatterns.map((item, index) => (
            <li key={item.title} className="spine-item">
              <p className="font-mono text-sm text-[var(--violet)]">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-2 text-xl">{item.title}</h3>
              <p className="mt-3 max-w-3xl leading-7 text-[var(--muted)]">{item.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
