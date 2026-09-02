export type SampleDataset = {
  id: string;
  name: string;
  description: string;
  logs_path: string;
  metrics_path: string;
  scenario: string;
};

export type JobStatus = {
  job_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  run_id: string | null;
  artifact_dir: string | null;
  error: string | null;
};

export type Anomaly = {
  timestamp_window_start: string;
  timestamp_window_end: string;
  anomaly_type: string;
  affected_service: string;
  severity_score: number;
  observed_value: number;
  baseline_value: number;
  evidence_summary: string;
  scope: string;
};

export type Incident = {
  incident_id: string;
  start_time: string;
  end_time: string;
  impacted_services: string[];
  suspected_primary_service: string;
  evidence: Anomaly[];
  correlation_score: number;
};

export type Report = {
  incident_id: string;
  incident_summary: string;
  root_cause_explanation: string;
  executive_summary: string;
  engineering_handoff: string;
  remediation_suggestions: string[];
  facts: string[];
  inferences: string[];
  uncertainties: string[];
  citations: string[];
  retrieved_snippets?: RetrievedSnippet[];
  heuristic?: NarrativeBundle | null;
  rewrite?: NarrativeBundle | null;
  review_status: string;
};

export type NarrativeBundle = {
  source: string;
  model: string;
  incident_summary: string;
  root_cause_explanation: string;
  executive_summary: string;
  engineering_handoff: string;
  remediation_suggestions: string[];
  fallback_used: boolean;
};

export type RetrievedSnippet = {
  citation_id: string;
  source_path: string;
  content: string;
};

export type ComposeTrace = {
  provider: string;
  model: string;
  call_count: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  average_latency_ms: number;
  estimated_cost_usd: number;
  used_llm_cache: boolean;
  cache_hits: number;
  fallback_used: boolean;
  grounding_passed: boolean | null;
  supported_claims: number;
  total_claims: number;
  retrieved_snippet_count: number;
};

export type AskCitation = {
  citation_id: string;
  source: string;
  excerpt: string;
};

export type AskResponse = {
  job_id: string;
  incident_id: string | null;
  question: string;
  answer: string;
  refused: boolean;
  citations: AskCitation[];
  used_llm: boolean;
  source: string;
};

export type JobDetail = JobStatus & {
  reports: Report[];
  incidents: Incident[];
  anomalies: Anomaly[];
  compose_trace?: ComposeTrace;
};

const BASE = "/backend";

/** Keep the first row for each key. */
export function uniqueBy<T>(rows: T[], key: (row: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of rows) {
    const id = key(row);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(row);
  }
  return out;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({ detail: response.statusText }))) as {
      detail?: string;
    };
    throw new Error(body.detail ?? `Request failed (${response.status})`);
  }
  return (await response.json()) as T;
}

export const api = {
  health: () =>
    request<{ status: string; llm_provider?: string; report_model?: string }>("/health"),
  samples: () => request<{ samples: SampleDataset[] }>("/workspace/samples"),
  jobs: () => request<{ jobs: JobStatus[] }>("/analysis-jobs"),
  job: (id: string) => request<JobDetail>(`/analysis-jobs/${id}`),
  incidents: (jobId?: string) =>
    request<{ incidents: Incident[] }>(jobId ? `/incidents?job_id=${jobId}` : "/incidents"),
  anomalies: (jobId?: string) =>
    request<{ anomalies: Anomaly[] }>(jobId ? `/anomalies?job_id=${jobId}` : "/anomalies"),
  runJob: (body: { logs_path: string; metrics_path: string; artifact_root?: string }) =>
    request<JobStatus>("/analysis-jobs", {
      method: "POST",
      body: JSON.stringify({
        logs_path: body.logs_path,
        metrics_path: body.metrics_path,
        artifact_root: body.artifact_root ?? "artifacts/pipeline",
        bucket_size_minutes: 5,
        retrieval_enabled: true,
        knowledge_source_paths: ["data/knowledge/runbooks", "data/knowledge/incidents"],
      }),
    }),
  review: (jobId: string, incidentId: string, toStatus: string) =>
    request(`/analysis-jobs/${jobId}/reports/${incidentId}/review`, {
      method: "POST",
      body: JSON.stringify({
        to_status: toStatus,
        reviewer: "console-operator",
        note: "Reviewed from the product console.",
      }),
    }),
  ask: (jobId: string, question: string, incidentId?: string) =>
    request<AskResponse>(`/analysis-jobs/${jobId}/ask`, {
      method: "POST",
      body: JSON.stringify({
        question,
        incident_id: incidentId ?? null,
      }),
    }),
};
