"use client";

import type { ComposeTrace } from "@/lib/api";

function chip(label: string, value: string, tone: "mint" | "violet" | "blue" | "danger" | "muted") {
  const color = {
    mint: "text-[var(--mint)]",
    violet: "text-[var(--violet)]",
    blue: "text-[var(--blue)]",
    danger: "text-[var(--danger)]",
    muted: "text-[var(--muted)]",
  }[tone];
  return (
    <span key={label} className="model-trace__chip">
      <span className="model-trace__label">{label}</span>
      <span className={color}>{value}</span>
    </span>
  );
}

export function ModelTrace({ trace }: { trace?: ComposeTrace | null }) {
  if (!trace) return null;
  const grounding =
    trace.grounding_passed == null
      ? "n/a"
      : `${trace.supported_claims}/${trace.total_claims}${trace.grounding_passed ? " pass" : " warn"}`;
  const latency =
    trace.average_latency_ms > 0 ? `${Math.round(trace.average_latency_ms)} ms` : "local";
  return (
    <div className="model-trace">
      <p className="model-trace__kicker">Model trace — say this: the LLM is last-mile, and this strip proves it</p>
      <div className="model-trace__row">
        {chip("provider", trace.provider, "violet")}
        {chip("model", trace.model || "heuristic", "mint")}
        {chip("calls", String(trace.call_count), "blue")}
        {chip("tokens", String(trace.total_tokens), "blue")}
        {chip("latency", latency, "muted")}
        {chip(
          "cache",
          trace.used_llm_cache ? `${trace.cache_hits} hits` : "off",
          "muted",
        )}
        {chip("fallback", trace.fallback_used ? "used" : "none", trace.fallback_used ? "danger" : "mint")}
        {chip("grounding", grounding, trace.grounding_passed === false ? "danger" : "mint")}
        {chip("snippets", String(trace.retrieved_snippet_count), "blue")}
      </div>
    </div>
  );
}
