"use client";

import { useEffect, useState } from "react";
import { api, uniqueBy, type Anomaly } from "@/lib/api";
import { detectors } from "@/lib/content";

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .jobs()
      .then(async (payload) => {
        const latestId = payload.jobs[0]?.job_id;
        if (!latestId) {
          setAnomalies([]);
          return;
        }
        const filtered = await api.anomalies(latestId);
        setAnomalies(
          uniqueBy(
            filtered.anomalies,
            (item) =>
              `${item.anomaly_type}|${item.affected_service}|${item.timestamp_window_start}|${item.timestamp_window_end}`,
          ),
        );
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="space-y-12">
      <header className="page-hero">
        <p className="kicker">Detectors</p>
        <h1 className="mt-4 text-5xl tracking-tight">Anomaly ledger</h1>
        <p className="mt-4 max-w-2xl text-[var(--muted)]">
          Every row is a detector hit with observed vs baseline values. This is
          the evidence RCA ranks — not a vibe chart.
        </p>
      </header>
      {error ? <p className="text-[var(--danger)]">{error}</p> : null}
      <div className="data-table overflow-hidden rounded-3xl border border-[var(--line)]">
        <div className="grid grid-cols-6 border-b border-[var(--line)] px-6 py-4 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--faint)]">
          <span>Type</span>
          <span>Service</span>
          <span>Severity</span>
          <span>Observed</span>
          <span>Baseline</span>
          <span>Window</span>
        </div>
        {anomalies.length === 0 ? (
          <p className="px-6 py-10 text-[var(--muted)]">No anomalies in memory yet.</p>
        ) : null}
        {anomalies.map((item, index) => (
          <div
            key={`${item.anomaly_type}-${item.timestamp_window_start}-${index}`}
            className="grid grid-cols-6 border-b border-[var(--line)] px-6 py-5 text-sm last:border-0"
          >
            <span className="text-[var(--mint)]">{item.anomaly_type.replaceAll("_", " ")}</span>
            <span>{item.affected_service}</span>
            <span className="font-mono">{item.severity_score.toFixed(2)}</span>
            <span className="font-mono">{item.observed_value}</span>
            <span className="font-mono">{item.baseline_value}</span>
            <span className="font-mono text-xs text-[var(--faint)]">
              {new Date(item.timestamp_window_start).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>

      <section>
        <h2 className="text-3xl tracking-tight">Families you should expect</h2>
        <p className="mt-4 max-w-2xl text-[var(--muted)]">
          Checkout cascade typically emits CPU, memory, latency, error rate,
          traffic, availability, and error-log bursts on checkout-service in
          overlapping five-minute windows. Independent detectors, one clock.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            {
              title: "Observed vs baseline",
              body: "Every row carries both. If baseline is 125ms and observed is 1900ms, that is the claim. Compose is not allowed to say “slightly elevated.”",
            },
            {
              title: "Scope",
              body: "service vs global. Most hits are service-scoped. Global is reserved for signals that have no owner in the graph — treat those as last.",
            },
            {
              title: "Severity score",
              body: "A detector-local number used by correlation weights. It is not an SLO burn. Do not paste it into a customer email.",
            },
            {
              title: "Empty ledger",
              body: "After a healthy-baseline run this table should be empty. That is the control. If it is not empty, the detectors are too hungry.",
            },
          ].map((item) => (
            <article key={item.title} className="rounded-3xl border border-[var(--line)] p-8">
              <h3 className="text-xl">{item.title}</h3>
              <p className="mt-3 leading-7 text-[var(--muted)]">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-3xl tracking-tight">Gates in YAML</h2>
        <p className="mt-4 max-w-2xl text-[var(--muted)]">
          Thresholds live in configs/default.yaml under anomaly_detection. A
          quiet CPU series does not suppress an error-rate spike.
        </p>
        <div className="data-table mt-8 overflow-hidden rounded-3xl border border-[var(--line)]">
          <div className="grid grid-cols-3 border-b border-[var(--line)] px-6 py-4 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--faint)]">
            <span>Family</span>
            <span>Signal</span>
            <span>Gate</span>
          </div>
          {detectors.map((row) => (
            <div
              key={row.name}
              className="grid grid-cols-3 border-b border-[var(--line)] px-6 py-5 text-sm last:border-0"
            >
              <span className="font-mono text-[var(--mint)]">{row.name}</span>
              <span className="text-[var(--muted)]">{row.signal}</span>
              <span className="font-mono text-xs text-[var(--blue)]">{row.gate}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
