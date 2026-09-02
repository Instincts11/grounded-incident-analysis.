"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api, type JobDetail, type SampleDataset } from "@/lib/api";
import { clipReportText } from "@/lib/reportProse";

const STAGES = ["Ingest", "Detect", "Correlate", "Compose"];

const FALLBACK_SUMMARY =
  "checkout-service is the ranked origin. CPU, latency, and error-rate detectors fire in the same windows. The handoff names the service, lists facts, and withholds inference until RCA.";

export function ConsoleDemo() {
  const frame = useRef<HTMLDivElement>(null);
  const [samples, setSamples] = useState<SampleDataset[]>([]);
  const [latest, setLatest] = useState<JobDetail | null>(null);
  const [cached, setCached] = useState<JobDetail | null>(null);
  const [jobCount, setJobCount] = useState(0);
  const [health, setHealth] = useState("checking");
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "aim" | "click" | "running" | "report">("idle");
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(0);
  const [typed, setTyped] = useState("");
  const [clock, setClock] = useState("0:00");
  const [cursor, setCursor] = useState({ x: 72, y: 18 });
  const [inView, setInView] = useState(false);

  const samplesRef = useRef<SampleDataset[]>([]);
  const healthRef = useRef("checking");
  const ranLive = useRef(false);
  const summaryRef = useRef(FALLBACK_SUMMARY);

  const refresh = useCallback(async () => {
    const [samplePayload, jobPayload, healthPayload] = await Promise.all([
      api.samples(),
      api.jobs(),
      api.health().catch(() => ({ status: "down" })),
    ]);
    setSamples(samplePayload.samples);
    samplesRef.current = samplePayload.samples;
    setJobCount(jobPayload.jobs.length);
    setHealth(healthPayload.status);
    healthRef.current = healthPayload.status;
    if (jobPayload.jobs[0]) {
      const detail = await api.job(jobPayload.jobs[0].job_id);
      setLatest(detail);
      setCached(detail);
      if (detail.reports[0]?.executive_summary) {
        summaryRef.current = clipReportText(detail.reports[0].executive_summary, {
          maxSentences: 3,
          maxChars: 360,
        });
      }
    }
  }, []);

  useEffect(() => {
    const node = frame.current;
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    refresh().catch((err: Error) => setError(err.message));
  }, [refresh]);

  const runLive = useCallback(async (sample: SampleDataset) => {
    await api.runJob({
      logs_path: sample.logs_path,
      metrics_path: sample.metrics_path,
      artifact_root: `artifacts/ui/${sample.id}`,
    });
    await refresh();
  }, [refresh]);

  useEffect(() => {
    if (!inView) {
      return;
    }
    let cancelled = false;
    let started = 0;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, ms);
      });

    const play = async () => {
      started = performance.now();
      while (!cancelled) {
        const elapsed = () => {
          const seconds = Math.floor((performance.now() - started) / 1000) % 60;
          setClock(`0:${String(seconds).padStart(2, "0")}`);
        };
        const tick = window.setInterval(elapsed, 250);
        setPhase("idle");
        setProgress(4);
        setStage(0);
        setTyped("");
        setCursor({ x: 78, y: 16 });
        await wait(900);
        if (cancelled) break;
        setPhase("aim");
        setCursor({ x: 91, y: 54 });
        setProgress(12);
        await wait(1000);
        if (cancelled) break;
        setPhase("click");
        await wait(280);
        if (cancelled) break;
        setPhase("running");
        setProgress(22);
        const sample = samplesRef.current[0];
        const shouldHitApi = Boolean(sample) && healthRef.current === "ok" && !ranLive.current;
        if (shouldHitApi && sample) {
          ranLive.current = true;
        }
        const work = shouldHitApi && sample ? runLive(sample) : wait(2400);
        for (let i = 0; i < STAGES.length; i += 1) {
          if (cancelled) break;
          setStage(i);
          setProgress(28 + i * 14);
          await wait(520);
        }
        await work.catch((err: Error) => {
          if (!cancelled) {
            setError(err.message);
          }
        });
        if (cancelled) {
          window.clearInterval(tick);
          break;
        }
        setPhase("report");
        setProgress(86);
        const summary = summaryRef.current;
        for (let i = 1; i <= summary.length; i += 4) {
          if (cancelled) break;
          setTyped(summary.slice(0, i));
          await wait(18);
        }
        if (!cancelled) {
          setTyped(summary);
          setProgress(100);
        }
        await wait(4200);
        window.clearInterval(tick);
        started = performance.now();
      }
    };

    void play();
    return () => {
      cancelled = true;
    };
  }, [inView, runLive]);

  const report = latest?.reports[0] ?? cached?.reports[0];
  const jobs = phase === "idle" || phase === "aim" ? 0 : Math.max(jobCount, 1);
  const incidents =
    phase === "report" ? Math.max(latest?.incidents.length ?? 1, 1) : phase === "running" ? 0 : 0;
  const anomalies =
    phase === "report" ? Math.max(latest?.anomalies.length ?? 5, 1) : phase === "running" ? 2 : 0;

  return (
    <section className="console-demo px-5 py-24">
      <div className="console-demo__grid">
        <div className="console-demo__copy">
          <p className="kicker">Live console</p>
          <h2 className="console-demo__title">
            <span className="console-demo__title-line">The board is running.</span>
            <span className="serif">Watch it work.</span>
          </h2>
          <p className="console-demo__lede mt-8 text-lg leading-8 text-[var(--muted)]">
            A looping capture of the real console. The pipeline runs against
            the live API when it is up, then the board fills with jobs,
            incidents, and a grounded report.
          </p>
          <ul className="mt-8 space-y-3 text-[var(--muted)] leading-7">
            <li>1. Health pill is live against 127.0.0.1:8000.</li>
            <li>2. Checkout cascade is the noisy, production-like path.</li>
            <li>3. Facts stay attached to detector rows — not model prose.</li>
          </ul>
          <Link
            href="/console"
            className="mt-10 inline-flex rounded-full bg-[var(--violet)] px-7 py-3 text-sm font-medium text-[var(--on-accent)] transition hover:opacity-90"
          >
            Open the full console
          </Link>
        </div>

        <div className="console-demo__stage">
          <div
            ref={frame}
            className="console-demo__frame relative overflow-hidden rounded-[1.7rem] border border-[var(--line)] bg-[var(--bg-elevated)] shadow-[var(--panel-shadow)]"
          >
          <div className="flex items-center gap-3 border-b border-[var(--line)] px-5 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#fb7185]/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#34d399]/80" />
            <p className="ml-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">
              incident · console
            </p>
            <span className="ml-auto flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--mint)]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--danger)]" />
              rec {clock}
            </span>
            <span className="rounded-full border border-[var(--line)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--mint)]">
              api {health}
            </span>
          </div>

          <div className="console-demo__board relative grid min-h-[640px] w-full grid-cols-[160px_minmax(0,1fr)]">
            <aside className="border-r border-[var(--line)] px-4 py-6">
              {["Overview", "Pipeline", "Incidents", "Reports"].map((item, index) => (
                <p
                  key={item}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    index === 0 ? "bg-[var(--violet)]/10 text-[var(--text)]" : "text-[var(--muted)]"
                  }`}
                >
                  {item}
                </p>
              ))}
            </aside>
            <div className="min-w-0 space-y-6 p-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="kicker">Command center</p>
                  <h3 className="mt-3 text-3xl tracking-tight">Tonight&apos;s board</h3>
                </div>
                {phase === "running" ? (
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--violet)]">
                    {STAGES[stage]}…
                  </p>
                ) : null}
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Jobs", value: String(jobs) },
                  { label: "Incidents", value: String(incidents) },
                  { label: "Anomalies", value: String(anomalies) },
                ].map((card) => (
                  <article key={card.label} className="rounded-2xl border border-[var(--line)] px-5 py-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--faint)]">
                      {card.label}
                    </p>
                    <p className="mt-3 text-3xl tracking-tight">{card.value}</p>
                  </article>
                ))}
              </div>
              {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
              <div className="space-y-3">
                {(samples.length ? samples : [
                  { id: "checkout-cascade", name: "Checkout cascade", scenario: "cascade" },
                  { id: "healthy-baseline", name: "Healthy baseline", scenario: "healthy" },
                  { id: "degraded-partial", name: "Degraded partial", scenario: "degraded" },
                ]).slice(0, 3).map((sample, index) => (
                  <div
                    key={sample.id}
                    className={`flex items-center justify-between gap-3 rounded-2xl border px-5 py-3.5 transition ${
                      phase !== "idle" && index === 0
                        ? "border-[var(--violet)] bg-[var(--violet)]/10"
                        : "border-[var(--line)]"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-[var(--text)]">{sample.name}</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--violet)]">
                        {sample.scenario}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium ${
                        phase === "running" && index === 0
                          ? "bg-[var(--text)] text-[var(--bg)]"
                          : "bg-[var(--violet)] text-[var(--on-accent)]"
                      }`}
                    >
                      {phase === "running" && index === 0 ? "Analyzing…" : "Run"}
                    </span>
                  </div>
                ))}
              </div>
              <article className="min-h-[132px] rounded-2xl border border-[var(--line)] p-5">
                {phase === "report" || typed ? (
                  <>
                    <p className="font-mono text-[11px] text-[var(--mint)]">
                      {report?.incident_id ?? "INC-CHECKOUT-001"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{typed}</p>
                  </>
                ) : (
                  <p className="text-sm text-[var(--muted)]">
                    {phase === "running"
                      ? "Composing grounded report from detector rows…"
                      : "Waiting for a scenario run."}
                  </p>
                )}
              </article>
            </div>
            <div
              className="pointer-events-none absolute z-10 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/90 bg-white/10 shadow-[0_0_0_6px_color-mix(in_srgb,var(--mint)_16%,transparent)] transition-all duration-700 ease-out"
              style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
            >
              <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--mint)]" />
            </div>
            {phase === "click" ? (
              <span
                className="pointer-events-none absolute z-10 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--mint)]"
                style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
              />
            ) : null}
          </div>

          <div className="relative border-t border-[var(--line)] px-5 py-3">
            <div className="h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[var(--mint)] transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
              <span>autoplay · loop</span>
              <span>{progress}%</span>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[length:100%_3px] opacity-30 mix-blend-overlay" />
          </div>
        </div>
      </div>
    </section>
  );
}
