"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type JobDetail, type JobStatus, type SampleDataset } from "@/lib/api";
import { cn } from "@/lib/cn";
import { operatorNotes, shiftSteps } from "@/lib/content";
import { ComposeSplit } from "@/components/console/ComposeSplit";
import { IncidentAsk } from "@/components/console/IncidentAsk";
import { InterviewScript } from "@/components/console/InterviewScript";
import { ModelTrace } from "@/components/console/ModelTrace";

function scenarioIdFromJob(job: { artifact_dir?: string | null } | null): string {
  const dir = (job?.artifact_dir ?? "").replaceAll("\\", "/");
  if (dir.includes("healthy-baseline")) return "healthy-baseline";
  if (dir.includes("degraded-partial")) return "degraded-partial";
  if (dir.includes("checkout-cascade")) return "checkout-cascade";
  return "";
}

const EMPTY_RUN = {
  "healthy-baseline": {
    title: "Healthy baseline",
    kicker: "Control window",
    body: "Quiet traffic. Detectors did not fire. Zero incidents is the correct result for this file pair: data/sample/healthy/logs.csv and data/sample/healthy/metrics.json.",
  },
  "degraded-partial": {
    title: "Degraded partial",
    kicker: "Missing-signal resilience",
    body: "Sparse JSONL logs and incomplete metrics. There is not enough support for a detector window, so no incident is invented. Files: data/sample/degraded/logs.jsonl and data/sample/degraded/metrics.csv.",
  },
} as const;

export default function ConsoleHome() {
  const [samples, setSamples] = useState<SampleDataset[]>([]);
  const [jobs, setJobs] = useState<JobStatus[]>([]);
  const [latest, setLatest] = useState<JobDetail | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState("checking");
  const [llmProvider, setLlmProvider] = useState("");
  const [lastRunId, setLastRunId] = useState<string | null>(null);

  const refresh = async (jobId?: string) => {
    const [samplePayload, jobPayload, healthPayload] = await Promise.all([
      api.samples(),
      api.jobs(),
      api.health().catch(() => ({ status: "down", llm_provider: "" })),
    ]);
    setSamples(samplePayload.samples);
    setJobs(jobPayload.jobs);
    setHealth(healthPayload.status);
    setLlmProvider(healthPayload.llm_provider ?? "");
    const targetId = jobId ?? jobPayload.jobs[0]?.job_id;
    if (!targetId) {
      setLatest(null);
      return;
    }
    const detail = await api.job(targetId);
    setLatest(detail);
    const fromArtifact = scenarioIdFromJob(detail);
    if (fromArtifact) {
      setLastRunId(fromArtifact);
    }
  };

  useEffect(() => {
    refresh().catch((err: Error) => setError(err.message));
  }, []);

  const run = async (sample: SampleDataset) => {
    setBusy(sample.id);
    setError(null);
    setLastRunId(sample.id);
    try {
      const created = await api.runJob({
        logs_path: sample.logs_path,
        metrics_path: sample.metrics_path,
        artifact_root: `artifacts/ui/${sample.id}`,
      });
      await refresh(created.job_id);
      document.getElementById("console-run-result")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Run failed");
    } finally {
      setBusy(null);
    }
  };

  const activeId = busy ?? lastRunId;
  const selectedScenario = lastRunId || scenarioIdFromJob(latest);
  const latestMatches = !lastRunId || scenarioIdFromJob(latest) === lastRunId;
  const emptyCopy =
    selectedScenario === "healthy-baseline" || selectedScenario === "degraded-partial"
      ? EMPTY_RUN[selectedScenario]
      : null;
  const latestReport = emptyCopy || !latestMatches ? undefined : latest?.reports[0];
  const incidentCount = emptyCopy
    ? latestMatches
      ? (latest?.incidents.length ?? 0)
      : 0
    : (latest?.incidents.length ?? 0);
  const anomalyCount = emptyCopy
    ? latestMatches
      ? (latest?.anomalies.length ?? 0)
      : 0
    : (latest?.anomalies.length ?? 0);

  return (
    <div className="space-y-16">
      <header className="page-hero flex flex-wrap items-end justify-between gap-8">
        <div>
          <p className="kicker">Command center</p>
          <h1 className="mt-4 text-5xl tracking-tight">Tonight&apos;s board</h1>
          <p className="mt-4 max-w-xl text-[var(--muted)]">
            Run a bundled scenario, then inspect incidents, anomalies, and the
            grounded report. Use the model trace, facts vs rewrite, and closed-book
            Q&amp;A when you walk an interviewer through it.
          </p>
        </div>
        <span className="rounded-full border border-[var(--line)] px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--mint)]">
          api {health}
          {health === "ok" && llmProvider ? ` · ${llmProvider}` : ""}
        </span>
      </header>

      {error ? (
        <p className="rounded-2xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-5 py-4 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      <section className="grid grid-cols-1 gap-6 min-[720px]:grid-cols-3">
        {[
          { label: "Jobs", value: String(jobs.length) },
          { label: "Incidents", value: String(incidentCount) },
          { label: "Anomalies", value: String(anomalyCount) },
        ].map((card) => (
          <article key={card.label} className="panel rounded-3xl p-8">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--faint)]">
              {card.label}
            </p>
            <p className="mt-6 text-5xl tracking-tight">{card.value}</p>
          </article>
        ))}
      </section>

      <section>
        <h2 className="text-3xl tracking-tight">Run a scenario</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 min-[960px]:grid-cols-2 min-[1400px]:grid-cols-3">
          {samples.map((sample) => {
            const selected = activeId === sample.id;
            const running = busy === sample.id;
            return (
              <article
                key={sample.id}
                className={cn(
                  "panel flex flex-col rounded-3xl p-8 transition",
                  selected
                    ? "border-[var(--violet)] bg-[var(--violet)]/10"
                    : "border-[var(--line)] bg-[var(--panel)]",
                )}
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--violet)]">
                  {sample.scenario}
                </p>
                <h3 className="mt-4 text-2xl">{sample.name}</h3>
                <p className="mt-4 flex-1 text-sm leading-6 text-[var(--muted)]">
                  {sample.description}
                </p>
                <p className="mt-4 font-mono text-[10px] leading-5 text-[var(--faint)]">
                  {sample.logs_path}
                  <br />
                  {sample.metrics_path}
                </p>
                {selected && !running ? (
                  <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--mint)]">
                    selected run
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => void run(sample)}
                  disabled={busy !== null}
                  className={cn(
                    "mt-8 rounded-full px-5 py-2.5 text-sm font-medium",
                    running
                      ? "bg-[var(--text)] text-[var(--bg)]"
                      : "bg-[var(--violet)] text-[var(--on-accent)]",
                    busy !== null && !running && "cursor-wait opacity-100",
                  )}
                >
                  {running ? "Analyzing…" : "Run pipeline"}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {emptyCopy ? (
        <section id="console-run-result" className="panel scroll-mt-8 rounded-[2rem] p-10">
          <p className="kicker">{emptyCopy.kicker}</p>
          <h2 className="mt-4 text-3xl tracking-tight">{emptyCopy.title}</h2>
          <p className="mt-3 font-mono text-sm text-[var(--mint)]">
            {latestMatches && latest ? latest.status : busy ? "running" : "completed"} ·
            incidents {incidentCount} · anomalies {anomalyCount}
          </p>
          <p className="mt-6 max-w-3xl leading-8 text-[var(--muted)]">{emptyCopy.body}</p>
          {latestMatches && latest?.artifact_dir ? (
            <p className="mt-6 font-mono text-xs leading-6 text-[var(--blue)]">
              {latest.artifact_dir}
            </p>
          ) : null}
        </section>
      ) : latestReport && latest ? (
        <section id="console-run-result" className="panel scroll-mt-8 rounded-[2rem] p-10">
          <p className="kicker">Latest report</p>
          <h2 className="mt-4 text-3xl tracking-tight">{latestReport.incident_id}</h2>
          {latest.incidents[0] ? (
            <p className="mt-3 font-mono text-sm text-[var(--mint)]">
              origin {latest.incidents[0].suspected_primary_service} · correlation{" "}
              {latest.incidents[0].correlation_score.toFixed(2)} ·{" "}
              {latest.anomalies.length} detector hits
            </p>
          ) : null}
          <div className="mt-8">
            <ModelTrace trace={latest.compose_trace} />
          </div>
          <div className="mt-10">
            <ComposeSplit report={latestReport} />
          </div>
          <div className="mt-10">
            <IncidentAsk jobId={latest.job_id} incidentId={latestReport.incident_id} />
          </div>
          <div className="mt-8 flex flex-wrap gap-6">
            <Link href="/console/reports" className="text-sm text-[var(--mint)]">
              Open report studio
            </Link>
            <Link href="/console/incidents" className="text-sm text-[var(--muted)]">
              All incidents
            </Link>
            <Link href="/console/anomalies" className="text-sm text-[var(--mint)]">
              Anomaly ledger
            </Link>
          </div>
        </section>
      ) : latest ? (
        <section id="console-run-result" className="panel scroll-mt-8 rounded-[2rem] p-10">
          <p className="kicker">Pipeline completed</p>
          <h2 className="mt-4 text-3xl tracking-tight">Run finished with no report</h2>
          <p className="mt-6 max-w-3xl leading-8 text-[var(--muted)]">
            The job completed without a correlated incident, so there is no RCA
            document to show.
          </p>
        </section>
      ) : (
        <p id="console-run-result" className="scroll-mt-8 text-[var(--muted)]">
          No jobs yet. Run Checkout cascade for a full report, Healthy baseline
          for an empty ledger, or Degraded partial for a sparse-data completion.
        </p>
      )}

      <section className="grid grid-cols-1 gap-8 min-[960px]:grid-cols-2">
        <article className="rounded-3xl border border-[var(--line)] p-10">
          <h2 className="text-2xl">How a shift starts</h2>
          <ol className="mt-6 space-y-4 text-[var(--muted)] leading-7">
            <li>1. Confirm API health is ok — the pill above is live.</li>
            <li>2. Run Checkout cascade first. It is the noisy, production-like path.</li>
            <li>3. Open Incidents. You should see one candidate, not fourteen alerts.</li>
            <li>4. Read facts vs rewrite. Toggle heuristic and Groq. Facts stay put.</li>
            <li>5. Ask CPU vs baseline, then ask about the weather — the second must refuse.</li>
          </ol>
        </article>
        <article className="rounded-3xl border border-[var(--line)] p-10">
          <h2 className="text-2xl">What the numbers mean</h2>
          <p className="mt-6 leading-7 text-[var(--muted)]">
            Jobs are in-memory analysis runs for this API process. Incidents are
            correlated candidates. Anomalies are raw detector hits. A healthy
            window can complete a job with zero incidents — that is a success,
            not a missing chart. Degraded partial is for missing-signal
            resilience: the run summary will warn, the board will still render.
          </p>
        </article>
      </section>

      <InterviewScript />

      <section>
        <h2 className="text-3xl tracking-tight">After the first run</h2>
        <ol className="spine mt-10">
          {shiftSteps.map((step) => (
            <li key={step.n} className="spine-item">
              <p className="font-mono text-sm text-[var(--violet)]">{step.n}</p>
              <h3 className="mt-2 text-xl tracking-tight">{step.title}</h3>
              <p className="mt-3 max-w-3xl leading-7 text-[var(--muted)]">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="text-3xl tracking-tight">Operator notes</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 min-[960px]:grid-cols-2 min-[1400px]:grid-cols-3">
          {operatorNotes.map((item) => (
            <article key={item.title} className="panel rounded-3xl p-8">
              <h3 className="text-xl">{item.title}</h3>
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
