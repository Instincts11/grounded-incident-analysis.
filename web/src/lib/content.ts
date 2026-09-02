export const stages = [
  {
    n: "01",
    title: "Ingest",
    body: "CSV, JSON, and JSONL become typed log events and metric points. Invalid rows are counted, not silently dropped.",
    detail:
      "Log ingestion accepts .csv, .json, and .jsonl. Metric ingestion accepts the same plus a Prometheus query_range adapter. Each row is validated against LogEvent or MetricPoint. Quality metrics — parse failures, missing timestamps, unknown services — land in the run summary instead of disappearing.",
  },
  {
    n: "02",
    title: "Normalize",
    body: "Timestamps lock to UTC. Signals align into five-minute buckets so detectors share one clock.",
    detail:
      "Naive timestamps are assumed UTC. Offset-aware values are converted. Events then fold into configurable buckets (default five minutes) so a latency spike and an error-log burst in the same window can actually meet.",
  },
  {
    n: "03",
    title: "Detect",
    body: "Latency, error rate, CPU, memory, traffic, and availability each have their own z-score and MAD gates.",
    detail:
      "Detectors are independent. A quiet CPU series does not suppress an error-rate spike. Support windows, z-thresholds, MAD multipliers, and minimum relative change all live in configs/default.yaml.",
  },
  {
    n: "04",
    title: "Correlate",
    body: "Anomalies group by time, service, and the dependency graph. Isolated noise stays isolated.",
    detail:
      "Temporal distance, same-service bonus, dependency edges, and cross-signal bonuses are weighted. A lonely traffic blip without companions does not become an incident.",
  },
  {
    n: "05",
    title: "Rank evidence",
    body: "RCA scores origin vs blast radius. Downstream pain is not automatically the cause.",
    detail:
      "checkout-service saturating while api-gateway pages is a classic trap. The scorer applies a downstream bonus and an upstream penalty so the origin is preferred when the graph agrees.",
  },
  {
    n: "06",
    title: "Ground",
    body: "Every claim is checked against detector output and retrieved runbooks. Unsupported prose is marked.",
    detail:
      "Grounding policy can warn or fail. Overlap against evidence ids is measured. Citations from runbooks and historical incidents attach as snippets, not as vibes.",
  },
  {
    n: "07",
    title: "Compose",
    body: "The report is assembled from ranked evidence. Optional Groq or OpenAI can rewrite; the facts never leave the bundle.",
    detail:
      "Default compose is a deterministic narrative over the evidence JSON: summary, RCA, executive, handoff, remediations. The console shows facts on the left and the rewrite on the right. Toggle heuristic vs Groq on the same incident — detectors do not run twice.",
  },
  {
    n: "08",
    title: "Review",
    body: "Draft, reviewed, approved, rejected. Approved reports can leave through a webhook with an audit log.",
    detail:
      "Transitions require a reviewer name and a note. Webhook destinations must match the allowlist. Delivery attempts are appended as JSONL under the run's exports directory.",
  },
];

export const principles = [
  {
    title: "Deterministic first",
    body: "Detectors and correlation do not wait on a model. If generation is unavailable, the incident still exists.",
  },
  {
    title: "Cited or unmarked",
    body: "Facts carry evidence ids. Inferences are labeled. The UI never presents a paragraph as gospel.",
  },
  {
    title: "Degrade, don't die",
    body: "Missing logs, missing metrics, and provider failure become warnings in the run summary, not a blank page.",
  },
  {
    title: "Artifacts you can audit",
    body: "Every run writes JSON the same way a compiler writes IR. Reviewers can disagree with the machine, in public.",
  },
];

export const stats = [
  { value: "14", label: "Anomaly families in the checkout cascade" },
  { value: "5m", label: "Default timeline bucket" },
  { value: "85%", label: "Coverage gate on the Python core" },
  { value: "0", label: "Local model runtime required" },
];

export const caseFacts = [
  "checkout-service CPU 96.0 against a 35.0 baseline",
  "error rate 0.22 against 0.012",
  "p95 latency 1900ms against 125ms",
  "memory 1200 against 425",
  "error log burst with no counterpart on the healthy window",
  "traffic drop on the same five-minute bucket",
  "service unavailability flagged beside the saturation cluster",
  "one correlated incident, not seven disconnected alerts",
];

export const faqs = [
  {
    q: "Do I need an OpenAI key to use the product?",
    a: "No. The console runs the full pipeline with grounded heuristic reports. Groq or OpenAI can rewrite the same evidence contracts; they are not the analysis engine.",
  },
  {
    q: "Where does the data live?",
    a: "On disk, under artifacts/. The API never phones home. Prometheus is opt-in and host-allowlisted.",
  },
  {
    q: "Is this a replacement for PagerDuty?",
    a: "No. It is the investigation layer after the page: correlate, rank, write the handoff, keep an audit trail.",
  },
  {
    q: "Can I bring my own logs?",
    a: "Yes, as long as they sit inside the configured read allowlist (data, configs, artifacts, eval).",
  },
  {
    q: "What happens if metrics are missing?",
    a: "Degraded execution continues. The run summary records the gap. Detectors that lack support simply emit nothing instead of inventing a baseline.",
  },
  {
    q: "How do I export a report?",
    a: "CLI and API both serialize JSON, Markdown, and HTML. Approved reports can POST to a webhook after URL policy checks.",
  },
  {
    q: "Does the console persist jobs?",
    a: "The job store is in-memory for the API process. Artifacts persist on disk. Re-run a scenario after a restart to refill the board.",
  },
  {
    q: "Why not just paste logs into ChatGPT?",
    a: "Because paste has no schema, no detector, no graph, no grounding, and no artifact. You get a paragraph you cannot defend.",
  },
  {
    q: "What is closed-book Q&A?",
    a: "POST /analysis-jobs/{id}/ask answers only from that run's facts, hypothesis, and retrieved snippets. If the pack does not support the question, it refuses. That refusal is intentional.",
  },
  {
    q: "What file formats are accepted?",
    a: "Logs: CSV, JSON, JSONL. Metrics: the same, plus an optional Prometheus query_range adapter. Rows that fail schema validation are counted in the run summary.",
  },
  {
    q: "How large a file can I send?",
    a: "The local workstation path is the limit. There is no cloud upload. Keep runs inside the read allowlist so the API can open them.",
  },
  {
    q: "Does correlation invent services?",
    a: "No. Services come from ingested rows and the dependency graph. Compose is scored against unexpected service mentions in evaluation.",
  },
  {
    q: "What is root-cause support?",
    a: "Top candidate score divided by the sum of all candidate scores. It ranks origins inside one incident. It is not a calibrated probability.",
  },
  {
    q: "Can I run stages one at a time?",
    a: "Yes. The CLI exposes ingest, normalize, detect, correlate, and RCA as separate commands. The console always runs the full compiler.",
  },
];

export const knowledgeCards = [
  {
    title: "Checkout latency runbook",
    path: "data/knowledge/runbooks",
    body: "If checkout-service shows a sustained latency spike, inspect upstream database saturation before blaming the edge.",
    owner: "payments SRE",
  },
  {
    title: "Historical incident corpus",
    path: "data/knowledge/incidents",
    body: "Prior incidents are retrieved as snippets and attached as citations, not as free-form memory.",
    owner: "incident commanders",
  },
  {
    title: "Grafana annotations",
    path: "docs/grafana_context_ingestion.md",
    body: "Dashboard annotations can be folded into retrieval so the model is not the only historian.",
    owner: "observability",
  },
  {
    title: "Error-budget burn",
    path: "data/knowledge/runbooks",
    body: "When error rate exceeds 15× baseline in two consecutive buckets, page the owning service — not every downstream waiter.",
    owner: "SLO guild",
  },
  {
    title: "Memory saturation",
    path: "data/knowledge/runbooks",
    body: "Memory anomalies paired with GC log bursts usually precede latency. Check heap dumps after containment, not before.",
    owner: "platform",
  },
  {
    title: "Dependency timeouts",
    path: "data/knowledge/incidents",
    body: "A 2019 checkout outage taught us that gateway 504s are often the symptom. Rank origin with the graph, then write the handoff.",
    owner: "archive",
  },
  {
    title: "Traffic disappearance",
    path: "data/knowledge/runbooks",
    body: "A sudden RPS drop with a quiet error ledger is often a bad deploy or a lost heartbeat, not a happy cache. Check availability first.",
    owner: "edge",
  },
  {
    title: "Ambiguous dual origin",
    path: "data/knowledge/incidents",
    body: "When two services sit inside ambiguity_delta, keep both on the hypothesis. Do not force a single name for the exec summary.",
    owner: "incident commanders",
  },
];

export const evalModes = [
  {
    mode: "heuristic-only",
    f1: "0.94",
    root: "76.7%",
    note: "Detectors and RCA without generated prose.",
  },
  {
    mode: "grounded-compose",
    f1: "0.94",
    root: "pipeline",
    note: "Same analysis, narrative composed from the evidence bundle.",
  },
  {
    mode: "openai-optional",
    f1: "opt-in",
    root: "opt-in",
    note: "Remote rewrite. Never the default path.",
  },
  {
    mode: "mock-llm-retrieval",
    f1: "harness",
    root: "harness",
    note: "Eval-only path for citation and completeness gates.",
  },
];

export const audiences = [
  {
    title: "On-call engineer",
    body: "Need a ranked origin in minutes, not a wall of Grafana panels. The console names the service, lists facts, and writes the handoff you would have typed anyway.",
  },
  {
    title: "Incident commander",
    body: "Need a single candidate, not seven alerts. Correlation score, blast radius, and review state live on one board so you can decide who to page next.",
  },
  {
    title: "Staff SRE / platform",
    body: "Need artifacts you can regress. Golden evaluation summaries, coverage gates, and schema contracts keep the pipeline honest across releases.",
  },
  {
    title: "Engineering manager",
    body: "Need a paragraph a VP can read. Executive summary, facts, and uncertainties are separated so nobody has to decode detector jargon in a staff meeting.",
  },
];

export const detectors = [
  {
    name: "error_rate_spike",
    signal: "HTTP 5xx / error_rate",
    gate: "z ≥ 2.5 · MAD × 2.5 · Δ ≥ 15%",
  },
  {
    name: "latency_spike",
    signal: "p95 / request_latency_ms",
    gate: "z ≥ 2.5 · MAD × 2.5 · Δ ≥ 20%",
  },
  {
    name: "cpu_anomaly",
    signal: "cpu_usage / cpu_percent",
    gate: "z ≥ 2.5 · lookback 20 buckets",
  },
  {
    name: "memory_anomaly",
    signal: "memory_usage_mb",
    gate: "z ≥ 2.5 · relative change 15%",
  },
  {
    name: "traffic_drop",
    signal: "rps / throughput",
    gate: "z ≥ 2.2 · MAD × 2.2",
  },
  {
    name: "service_unavailability",
    signal: "upstream_failure / unavailable",
    gate: "z ≥ 2.0 · higher severity weight",
  },
  {
    name: "error_log_burst",
    signal: "ERROR log count",
    gate: "burst vs baseline · min support 3",
  },
  {
    name: "critical_log_burst",
    signal: "CRITICAL log count",
    gate: "severity weight 1.2 in correlation",
  },
];

export const artifacts = [
  { path: "normalized/timeline.json", why: "UTC buckets and aligned events" },
  { path: "anomalies/anomalies.json", why: "Every detector hit with observed vs baseline" },
  { path: "incidents/incidents.json", why: "Correlated candidates and evidence lists" },
  { path: "rca/rca_hypotheses.json", why: "Ranked origin, support, ambiguities" },
  { path: "grounding/grounding_summary.json", why: "Claim overlap and policy result" },
  { path: "reports/final_reports.json", why: "The document the console renders" },
  { path: "run_summary.json", why: "Stages, warnings, degraded flags, token usage" },
  { path: "exports/webhook_deliveries.jsonl", why: "Audit of outbound approved reports" },
];

export const contracts = [
  { name: "LogEvent", out: "ingestion", fields: "timestamp, service, severity, message" },
  { name: "MetricPoint", out: "ingestion", fields: "timestamp, service, metric_name, value" },
  { name: "AnomalyCandidate", out: "detectors", fields: "type, window, observed, baseline, severity" },
  {
    name: "CorrelatedIncidentCandidate",
    out: "correlation",
    fields: "incident_id, services, evidence, score",
  },
  {
    name: "RootCauseHypothesis",
    out: "RCA",
    fields: "origin service, support, rationale, ambiguities",
  },
  {
    name: "FinalIncidentReport",
    out: "compose",
    fields: "summary, RCA, exec, handoff, facts, citations, review",
  },
];

export const apiSurface = [
  { method: "GET", path: "/health", use: "Liveness for the console pill" },
  { method: "GET", path: "/config", use: "Effective YAML after load, without secrets" },
  { method: "GET", path: "/workspace/samples", use: "Bundled scenarios for one-click runs" },
  { method: "POST", path: "/analysis-jobs", use: "Execute the file pipeline and store the job" },
  { method: "GET", path: "/analysis-jobs", use: "List in-memory jobs, newest first" },
  { method: "GET", path: "/analysis-jobs/{id}", use: "Incidents, anomalies, and reports together" },
  { method: "GET", path: "/analysis-jobs/{id}/reports", use: "Reports for one job, filterable by review" },
  { method: "POST", path: "/analysis-jobs/{id}/reports/{inc}/review", use: "draft → reviewed → approved | rejected" },
  { method: "POST", path: "/analysis-jobs/{id}/reports/{inc}/export-webhook", use: "POST an approved report to an allowlisted URL" },
  { method: "GET", path: "/incidents", use: "Candidates across jobs or one job_id" },
  { method: "GET", path: "/anomalies", use: "Detector ledger for the board" },
  { method: "POST", path: "/analyze-pipeline", use: "Synchronous full run without the job store" },
];

export const securityControls = [
  {
    title: "Path allowlists",
    body: "Reads are limited to data, configs, artifacts, and eval. Writes stay in artifacts. Traversal and absolute escapes are rejected before the pipeline starts.",
  },
  {
    title: "Claim citations",
    body: "Each sentence is scored against evidence overlap. Unsupported claims stay visible with a reason — they are not deleted in shame, and they are not promoted to facts.",
  },
  {
    title: "Outbound policy",
    body: "Prometheus hosts and webhook URLs are allowlisted. Private networks and plain HTTP require an explicit opt-in. Failed deliveries are still logged.",
  },
  {
    title: "No local model",
    body: "The workstation does not host weights. Heuristic compose is deterministic. OpenAI is optional and keyed only via INCIDENT_AGENT_OPENAI_API_KEY.",
  },
  {
    title: "Review workflow",
    body: "Draft → reviewed → approved | rejected. Every transition stores reviewer, note, and timestamp. Webhooks only fire for approved reports.",
  },
  {
    title: "Credential hygiene",
    body: ".env is gitignored. .env.example never carries secret values. The generic OPENAI_API_KEY variable is ignored so a stray shell export cannot silently activate a provider.",
  },
];

export const evalMetrics = [
  { name: "Incident F1", meaning: "Did correlation produce the expected candidate set?" },
  { name: "Root-cause correctness", meaning: "Did RCA name the labeled origin service?" },
  { name: "Impacted-service F1", meaning: "Blast radius vs the benchmark graph." },
  { name: "Anomaly-type recall", meaning: "Which detector families fired when they should." },
  { name: "Factual support rate", meaning: "Share of report claims with evidence overlap." },
  { name: "Unexpected service mentions", meaning: "Did compose invent a service not in the bundle?" },
  { name: "Citation coverage", meaning: "Runbook / corpus snippets actually attached." },
  { name: "Report completeness", meaning: "Required sections present even under degradation." },
];

export const voices = [
  {
    role: "On-call, payments",
    quote:
      "I used to screenshot six Grafana rows and write the same paragraph. Now I run the cascade and edit the handoff.",
  },
  {
    role: "Incident commander",
    quote:
      "The correlation score is the only number I read first. If it is one incident, we stay in one bridge.",
  },
  {
    role: "Staff SRE",
    quote:
      "I will not ship a detector I cannot regress. The golden summary is the contract, not the landing page.",
  },
  {
    role: "Engineering manager",
    quote:
      "The executive section is the only thing I paste upstairs. Facts stay downstairs where they belong.",
  },
  {
    role: "Platform, observability",
    quote:
      "Missing metrics used to blank the page. Now the run summary warns and the detectors that still have support keep firing.",
  },
  {
    role: "Payments SRE, nights",
    quote:
      "Healthy baseline is the control I wanted. If that ledger is empty, I trust the noisy run a lot more.",
  },
];

export const playbook = [
  {
    step: "Contain",
    body: "Roll back or shed load on the ranked origin. Do not restart every downstream waiter because they are noisy.",
  },
  {
    step: "Verify",
    body: "Re-run the same log and metric files. Confirm the detector windows still exist. If they vanished, you contained the symptom, not the cause.",
  },
  {
    step: "Handoff",
    body: "Paste the engineering section into the ticket. Facts stay attached to evidence ids so the next shift does not re-litigate the origin.",
  },
  {
    step: "Review",
    body: "Mark reviewed, then approved when the owner agrees. Reject with a note if the graph was wrong — that note is how the corpus learns.",
  },
];

export const packageMap = [
  { dir: "ingestion/", why: "Typed log and metric parsers, quality counts" },
  { dir: "anomaly_detection/", why: "Independent detectors per signal family" },
  { dir: "normalization/", why: "UTC conversion and bucket alignment" },
  { dir: "correlation/", why: "Graph + temporal grouping" },
  { dir: "rca/", why: "Evidence ranking and origin scoring" },
  { dir: "grounding/", why: "Claim overlap and policy" },
  { dir: "knowledge/", why: "Runbook and corpus retrieval" },
  { dir: "export/", why: "JSON / Markdown / HTML / webhook" },
  { dir: "eval/", why: "Benchmark runner, golden compare, mode matrix" },
  { dir: "api/", why: "FastAPI jobs, review, webhook, samples" },
];

export const contrast = [
  {
    them: "Paste a CSV into a chat box",
    us: "Validate every row against LogEvent and MetricPoint",
  },
  {
    them: "Ask a model what went wrong",
    us: "Fire eight independent detectors, then rank origin on a graph",
  },
  {
    them: "A fluent paragraph with no citations",
    us: "Claims mapped to evidence ids; unsupported sentences stay marked",
  },
  {
    them: "A chatbot that will invent a root cause",
    us: "Closed-book Q&A that cites this run's pack or refuses",
  },
  {
    them: "Restart the session and lose the thread",
    us: "A timestamped artifact directory you can re-open tomorrow",
  },
  {
    them: "Hope the next shift believes you",
    us: "Review states, reviewer names, and webhook delivery JSONL",
  },
];

export const inputs = [
  {
    label: "Logs",
    body: "CSV, JSON, or JSONL with timestamp, service, severity, and message. Invalid rows increment parse failures instead of vanishing.",
  },
  {
    label: "Metrics",
    body: "The same file types, plus optional Prometheus query_range. Series names map through configs/default.yaml — latency, CPU, memory, error rate, traffic, availability.",
  },
  {
    label: "Graph",
    body: "configs/service_dependencies.yaml. Edges tell RCA which pain is downstream and which service is allowed to be the origin.",
  },
  {
    label: "Knowledge",
    body: "Markdown runbooks and historical incidents under data/knowledge. Retrieved as snippets with citation ids, never as unbounded memory.",
  },
];

export const outputs = [
  {
    label: "JSON artifacts",
    body: "Timeline, anomalies, incidents, RCA, grounding, reports, run summary. The compiler IR. The UI is a viewer.",
  },
  {
    label: "Markdown / HTML",
    body: "incident_report.md and .html for the ticket and the war-room screen. Same facts, different surface.",
  },
  {
    label: "Webhook audit",
    body: "Approved reports may POST to an allowlisted URL. Attempts append to exports/webhook_deliveries.jsonl even when they fail.",
  },
  {
    label: "Eval summaries",
    body: "incident F1, root-cause correctness, claim support rate, unexpected service mentions. Compared against eval/golden.",
  },
];

export const notFor = [
  {
    label: "Not paging",
    body: "PagerDuty, Opsgenie, and the phone stay where they are. This is the investigation after the page.",
  },
  {
    label: "Not a metrics warehouse",
    body: "It does not store months of time series. Bring a window. Leave with a hypothesis.",
  },
  {
    label: "Not a public SaaS",
    body: "The API is for a trusted workstation. There is no end-user auth. Do not bind :8000 to the internet.",
  },
  {
    label: "Not a chatbot",
    body: "There is no prompt box on the console. You run a pipeline. You read a report. You approve or reject it.",
  },
];

export const shiftSteps = [
  {
    n: "01",
    title: "Confirm the clock",
    body: "API health on :8000, then a bundled scenario. Checkout cascade is the noisy path. Healthy baseline is the empty-ledger control.",
  },
  {
    n: "02",
    title: "Read one candidate",
    body: "Fourteen detector hits should collapse to one incident. If they do not, correlation failed — that is a bug, not a preference.",
  },
  {
    n: "03",
    title: "Argue with the origin",
    body: "Primary service is a ranked guess. Evidence rows are facts. Contain the origin, not every downstream waiter.",
  },
  {
    n: "04",
    title: "Write the handoff",
    body: "Paste the engineering section into the ticket. Facts stay attached to detector ids so the next shift does not re-litigate the window.",
  },
  {
    n: "05",
    title: "Close the state machine",
    body: "reviewed, then approved or rejected with a name and a note. Only approved reports may leave through a webhook.",
  },
];

export const correlationWeights = [
  { name: "temporal", value: "0.4", why: "Anomalies must share a window inside max_time_distance_minutes (10)" },
  { name: "same_service", value: "1.0", why: "Hits on one service are the strongest join" },
  { name: "dependency", value: "0.8", why: "Direct graph edges, not transitive rumor" },
  { name: "cross_signal", value: "0.5", why: "CPU plus latency plus errors on the same owner" },
  { name: "same_family", value: "0.2", why: "Intentionally weak — two latency spikes cannot cluster alone" },
  { name: "relationship_threshold", value: "1.0", why: "Lonely spikes stay anomalies, not incidents" },
];

export const sampleScenarios = [
  {
    id: "checkout-cascade",
    name: "Checkout cascade",
    body: "Saturated checkout-service: CPU, memory, latency, error rate, traffic drop, unavailability, and an error-log burst in overlapping five-minute windows. Expected: one correlated incident, origin checkout-service.",
  },
  {
    id: "healthy-baseline",
    name: "Healthy baseline",
    body: "Quiet traffic, no detector support. Expected: a completed job with an empty ledger. If this table is not empty, the gates are too hungry.",
  },
  {
    id: "degraded-partial",
    name: "Degraded partial",
    body: "Missing-signal resilience. The run summary warns. Detectors that still have support fire. The board still renders.",
  },
];

export const antiPatterns = [
  {
    title: "Do not restart every waiter",
    body: "Downstream 504s are blast radius. The origin is the service the graph and the detectors agree on.",
  },
  {
    title: "Do not treat support as probability",
    body: "0.76 root-cause support means the top candidate outscored the rest in this incident. It does not mean 76% chance in the wild.",
  },
  {
    title: "Do not silently edit facts",
    body: "Facts are detector rows. If the graph was wrong, reject the report with a note. That note is how the corpus learns.",
  },
  {
    title: "Do not ship a detector you cannot regress",
    body: "Change a z-threshold, run eval/benchmarks, compare against eval/golden. If root-cause correctness moves, the gate should fail.",
  },
];

export const reportAnatomy = [
  {
    label: "Incident summary",
    body: "What happened and when, using only services present in evidence. Inference is withheld until RCA.",
  },
  {
    label: "Root cause",
    body: "Ranked origin, support, rationale, ambiguities. Downstream pain is visible and not automatically the cause.",
  },
  {
    label: "Executive",
    body: "The paragraph a VP can read. No detector jargon. Uncertainties stay labeled.",
  },
  {
    label: "Engineering handoff",
    body: "The section that belongs in the ticket: windows, facts, next checks, who to page.",
  },
  {
    label: "Facts / inferences / uncertainties",
    body: "Three lists. Only facts may be treated as ground truth. Inferences are labeled. Uncertainties stay on the page.",
  },
  {
    label: "Remediations",
    body: "Advice, not claims about the past. Grounding marks them not_applicable so they cannot fake overlap.",
  },
];

export const cliCommands = [
  { cmd: "run-demo", use: "Deterministic portfolio run under artifacts/demo/portfolio-demo" },
  { cmd: "run-pipeline", use: "Full compiler: ingest through compose and persist artifacts" },
  { cmd: "detect-anomalies", use: "Detectors only — useful when you are tuning YAML gates" },
  { cmd: "correlate-incidents", use: "Group detector hits with the dependency graph" },
  { cmd: "run-rca", use: "Rank origin without generating prose" },
  { cmd: "list-reports / show-report", use: "Inspect review state and a single document" },
  { cmd: "export-report", use: "JSON, Markdown, or HTML from an artifact directory" },
  { cmd: "run-eval / compare-eval", use: "Benchmark modes against eval/golden/baseline_summary.json" },
];

export const qualityGates = [
  { name: "pytest + coverage", body: "85% coverage gate on the Python core. Detectors and RCA have adversarial fixtures." },
  { name: "ruff + mypy", body: "Lint and strict types on every contract the pipeline emits." },
  { name: "eval regression", body: "compare-eval against golden summaries. A detector change that moves F1 fails CI." },
  { name: "CodeQL + Dependabot", body: "Static analysis and dependency review on the same cadence as the product UI." },
];

export const runtimeLayers = [
  { label: "Python 3.12", body: "incident_agent is the system of record. Typed schemas, detectors, correlation, RCA, grounding, artifacts." },
  { label: "FastAPI :8000", body: "Jobs, incidents, anomalies, reports, review, webhook. In-memory job store. JSON on disk survives restarts." },
  { label: "Next.js 16 :3000", body: "Studio and console. /backend rewrites to the API so the browser never hardcodes ports in fetch logic." },
  { label: "No containers", body: "No Docker in the happy path. No local model runtime. Optional OpenAI is a remote rewriter only." },
];

export const claimStatuses = [
  { status: "supported", meaning: "Overlap with an evidence id or hypothesis rationale above minimum_support_overlap (0.34)." },
  { status: "unsupported", meaning: "Fluent sentence, no bundle overlap. Stays in the report with a reason." },
  { status: "contradictory", meaning: "Reserved for claims that fight detector output. Policy fail can drop the report." },
  { status: "not_applicable", meaning: "Remediations and advice. They are not facts about the past." },
];

export const reviewStates = [
  { state: "draft", meaning: "Default after compose. The machine wrote it. A human has not looked." },
  { state: "reviewed", meaning: "A named reviewer looked and left a note. Still not allowed to leave the building." },
  { state: "approved", meaning: "Owner agrees. The only state that may POST to a webhook." },
  { state: "rejected", meaning: "Graph or copy was wrong. JSON stays. The note is how the next run is not gaslit." },
];

export const limitations = [
  {
    label: "Trusted workstation",
    body: "No end-user auth. Path allowlists and URL policy are foot-gun guards, not a multi-tenant security model.",
  },
  {
    label: "Jobs are memory",
    body: "Restarting uvicorn clears the board. Artifacts remain. Re-run a scenario to refill incidents and reports.",
  },
  {
    label: "Heuristic compose",
    body: "Default narrative is assembled from evidence JSON. It is precise, not lyrical. OpenAI is opt-in on top of the same contracts.",
  },
  {
    label: "Graph is yours",
    body: "Wrong edges produce wrong origins. Reject the report and fix configs/service_dependencies.yaml — do not edit facts.",
  },
];

export const exportFormats = [
  { format: "JSON", body: "The contract. Same shape as reports/final_reports.json." },
  { format: "Markdown", body: "Ticket paste. Sections for summary, RCA, facts, handoff, remediations." },
  { format: "HTML", body: "War-room screen. Same content as Markdown, presentable." },
  { format: "Webhook", body: "Approved only. Exact URL allowlist. Delivery attempts logged as JSONL." },
];

export const retrievalParams = [
  { name: "top_k", value: "3", why: "Snippets kept per query. More is noisier, not smarter." },
  { name: "max_snippet_chars", value: "360", why: "Clip so compose cannot swallow a memoir." },
  { name: "source_paths", value: "runbooks + incidents", why: "Must sit inside the read allowlist." },
  { name: "overlap", value: "lexical", why: "Grounding then checks the sentence against the snippet, not the vibe." },
];

export const operatorNotes = [
  {
    title: "Artifacts outlive the board",
    body: "Restarting uvicorn clears jobs. JSON under artifacts/ui/ remains. Re-run a scenario to refill the console.",
  },
  {
    title: "Retrieval is on for console runs",
    body: "Jobs pass data/knowledge/runbooks and incidents. Citations appear when snippets overlap the evidence bundle.",
  },
  {
    title: "No local model",
    body: "Compose is heuristic over the evidence bundle. Groq or OpenAI is an optional rewriter. The model trace on Overview tells you which one actually ran.",
  },
  {
    title: "Caches are under artifacts/cache",
    body: "Identical compose inputs reuse output. Delete the cache directory if you change heuristic copy and need a fresh narrative.",
  },
  {
    title: "Prometheus is opt-in",
    body: "Host allowlist, HTTP and private-network flags default off. A file path is enough for every bundled scenario.",
  },
  {
    title: "Review requires a name",
    body: "The API returns 400 without a reviewer. Webhooks only fire for approved reports after URL policy checks.",
  },
];

export const interviewScript = [
  {
    beat: "What this is",
    say: "This is an AI systems project, not a trained model. Detectors are z-score and MAD. Correlation and RCA are graph heuristics. The LLM is optional last-mile rewrite.",
  },
  {
    beat: "Facts vs rewrite",
    say: "Left column is immutable detector output. Right column is a narrative over that JSON. Toggle heuristic vs Groq on the same incident — the facts do not move.",
  },
  {
    beat: "Model trace",
    say: "Every run records provider, model, tokens, latency, cache hits, and fallback. If Groq 404s, the board still has a heuristic report instead of a blank page.",
  },
  {
    beat: "Closed-book Q&A",
    say: "Ask what checkout CPU was versus baseline and it cites the pack. Ask about weather or a service that was not in the run and it refuses. That refusal is the product.",
  },
];

export const askPrompts = [
  {
    label: "CPU vs baseline",
    question: "What was checkout CPU vs baseline?",
    expect: "Should cite observed=96 against baseline=35.",
  },
  {
    label: "Who is origin?",
    question: "Which service is the origin?",
    expect: "Should name checkout-service from RCA, not api-gateway.",
  },
  {
    label: "Refuse this",
    question: "What is the weather in Tokyo today?",
    expect: "Must refuse. Nothing in the evidence pack supports it.",
  },
];
