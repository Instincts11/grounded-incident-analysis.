"use client";

import { useMemo, useState } from "react";
import type { NarrativeBundle, Report } from "@/lib/api";
import { ReportProse } from "@/components/console/ReportProse";
import { clipRemediationItems } from "@/lib/reportProse";

function bundleFromReport(report: Report, mode: "heuristic" | "rewrite"): NarrativeBundle | null {
  if (mode === "heuristic") {
    return report.heuristic ?? null;
  }
  return report.rewrite ?? null;
}

export function ComposeSplit({ report }: { report: Report }) {
  const hasRewrite = Boolean(report.rewrite);
  const [mode, setMode] = useState<"heuristic" | "rewrite">(hasRewrite ? "rewrite" : "heuristic");
  const bundle = useMemo(() => bundleFromReport(report, mode), [report, mode]);
  const active: NarrativeBundle = bundle ?? {
    source: "heuristic",
    model: "heuristic",
    incident_summary: report.incident_summary,
    root_cause_explanation: report.root_cause_explanation,
    executive_summary: report.executive_summary,
    engineering_handoff: report.engineering_handoff,
    remediation_suggestions: report.remediation_suggestions,
    fallback_used: false,
  };
  const remediations = clipRemediationItems(active.remediation_suggestions);
  const rewriteLabel = report.rewrite?.source === "openai" ? "OpenAI" : "Groq";

  return (
    <div className="compose-split">
      <p className="compose-split__talk">
        Left is the evidence bundle. Right is a rewrite of the same JSON. Toggle
        does not re-run detectors.
      </p>
      <div className="compose-split__grid">
        <article className="compose-split__col">
          <p className="kicker">Immutable facts</p>
          <h3 className="mt-3 text-2xl tracking-tight">Detector rows</h3>
          <ul className="mt-6 space-y-3 font-mono text-sm leading-6 text-[var(--blue)]">
            {report.facts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
          {report.inferences.length > 0 ? (
            <>
              <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--violet)]">
                RCA inference
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{report.inferences[0]}</p>
            </>
          ) : null}
          {report.uncertainties.length > 0 ? (
            <>
              <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--faint)]">
                Uncertainties
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--muted)]">
                {report.uncertainties.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          ) : null}
        </article>
        <article className="compose-split__col">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="kicker">Rewrite</p>
            <div className="compose-split__toggle" role="tablist" aria-label="Narrative source">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "heuristic"}
                className={mode === "heuristic" ? "is-active" : ""}
                onClick={() => setMode("heuristic")}
              >
                Heuristic
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "rewrite"}
                className={mode === "rewrite" ? "is-active" : ""}
                disabled={!hasRewrite}
                onClick={() => setMode("rewrite")}
              >
                {rewriteLabel}
              </button>
            </div>
          </div>
          <p className="mt-3 font-mono text-xs text-[var(--faint)]">
            {active.source}
            {active.model ? ` · ${active.model}` : ""}
            {active.fallback_used ? " · fallback copy" : ""}
            {!hasRewrite ? " · Groq off for this run" : ""}
          </p>
          <h3 className="mt-6 text-2xl tracking-tight">Executive</h3>
          <div className="mt-4">
            <ReportProse text={active.executive_summary} maxSentences={4} />
          </div>
          <h3 className="mt-8 text-2xl tracking-tight">Root cause</h3>
          <div className="mt-4">
            <ReportProse text={active.root_cause_explanation} />
          </div>
          <h3 className="mt-8 text-2xl tracking-tight">Handoff</h3>
          <div className="mt-4">
            <ReportProse text={active.engineering_handoff} />
          </div>
          {remediations.length > 0 ? (
            <>
              <h3 className="mt-8 text-2xl tracking-tight">Remediation</h3>
              <ul className="mt-4 space-y-2 text-sm leading-7 text-[var(--muted)]">
                {remediations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          ) : null}
        </article>
      </div>
    </div>
  );
}
