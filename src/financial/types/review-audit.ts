/**
 * Financial report, audit, reviewer, lineage, policy, replay, and manifest contracts.
 */

import type { BreakHandling, ReconciliationClass } from './base.js';
import type { LiveProofMetadata } from './live-proof.js';
import type { FinancialDecision } from './output-dossier.js';

export interface MetricProvenance {
  /** The reported metric field name. */
  metric: string;
  /** How this value was derived from execution data. */
  aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'first' | 'last' | 'direct';
  /** Source column in execution evidence. */
  sourceColumn: string;
  /** The computed value from execution evidence. */
  computedValue: number;
  /** The value reported in the report section. */
  reportedValue: number;
  /** Whether the reported value matches the computed value (within tolerance). */
  matches: boolean;
}

// ─── Report Contracts ────────────────────────────────────────────────────────

export interface ReportSection {
  /** Section identifier. */
  id: string;
  /** Human-readable title. */
  title: string;
  /** Whether this section is mandatory. */
  required: boolean;
  /** Expected content type. */
  contentType: 'narrative' | 'table' | 'metric' | 'disclaimer';
  /** If metric: expected numeric reference field in the data. */
  numericReference?: string;
  /** Expected aggregation method for numeric references. */
  expectedAggregation?: MetricProvenance['aggregation'];
}

export interface ReportContract {
  /** Report type identifier. */
  reportType: string;
  /** Required sections. */
  sections: ReportSection[];
  /** Required metadata fields in the report. */
  requiredMetadata: string[];
}

export interface GeneratedReport {
  /** Report type. */
  reportType: string;
  /** Metadata (author, date, version, etc.). */
  metadata: Record<string, string>;
  /** Report sections. */
  sections: GeneratedReportSection[];
}

export interface GeneratedReportSection {
  id: string;
  title: string;
  contentType: 'narrative' | 'table' | 'metric' | 'disclaimer';
  content: string;
  /** Numeric values referenced in this section (for cross-check against data). */
  numericValues?: Record<string, number>;
}

export interface ReportValidationResult {
  result: 'pass' | 'fail' | 'warn';
  checks: ReportValidationCheck[];
  totalChecks: number;
  failedChecks: number;
  /** Provenance records for numeric cross-references. */
  provenance: MetricProvenance[];
}

export interface ReportValidationCheck {
  check: string;
  passed: boolean;
  detail: string;
}

// ─── Audit Trail (v2) ────────────────────────────────────────────────────────

/** Evidence category for audit entries. */
export type AuditCategory = 'governance' | 'execution' | 'validation' | 'decision' | 'oversight' | 'lifecycle';

export interface AuditEntry {
  /** Monotonic sequence number. */
  seq: number;
  /** ISO timestamp. */
  timestamp: string;
  /** Stage that produced this entry. */
  stage: string;
  /** What happened. */
  action: string;
  /** Evidence category. */
  category: AuditCategory;
  /** Truncated SHA-256 evidence hash (16 hex chars). Chain uses truncated hashes throughout. */
  evidenceHash: string;
  /** Previous entry's evidence hash (truncated). Genesis uses hash of runId. */
  previousHash: string;
  /** Structured detail. */
  detail: Record<string, unknown>;
}

export interface AuditTrail {
  runId: string;
  entries: AuditEntry[];
  /**
   * Whether the truncated-SHA-256 hash chain is intact (verified on finalization).
   * Hash truncation to 16 hex chars (64 bits) is sufficient for tamper evidence
   * in an audit context but is NOT cryptographically equivalent to full SHA-256.
   */
  chainIntact: boolean;
}

// ─── Human Oversight ─────────────────────────────────────────────────────────

/** Whether human approval is required, completed, or not applicable. */
export type ApprovalStatus = 'not_required' | 'pending' | 'approved' | 'rejected';

/**
 * Reviewer identity — binds approval to a specific reviewer, not just a role.
 *
 * This is the first step toward workflow-bound reviewer authority:
 * the system knows WHO approved, not just THAT it was approved.
 * Future: Ed25519-signed reviewer endorsement (reviewer signs the approval).
 */
export interface ReviewerIdentity {
  /** Reviewer's display name (e.g., 'Jane Chen'). */
  name: string;
  /** Reviewer's organizational role (e.g., 'risk_officer'). */
  role: string;
  /** Reviewer's unique identifier (e.g., employee ID, email). */
  identifier: string;
  /** Ed25519 public key fingerprint, if the reviewer has a signing key. Null if unsigned. */
  signerFingerprint: string | null;
}

/**
 * Reviewer endorsement — structured approval with identity binding.
 *
 * Goes beyond a plain status flag: captures WHO endorsed, WHEN, WHY,
 * and the specific scope of what was reviewed.
 * Future: Ed25519 signature by the reviewer over the endorsement body.
 */
export interface ReviewerEndorsement {
  /** Endorsement timestamp. */
  endorsedAt: string;
  /** The reviewer who endorsed. */
  reviewer: ReviewerIdentity;
  /** What the reviewer endorsed: the decision they saw. */
  endorsedDecision: string;
  /** Free-text rationale from the reviewer. */
  rationale: string;
  /** What the reviewer examined (e.g., 'output_pack', 'dossier', 'full_report'). */
  scope: string[];
  /** Run-binding: the specific run this endorsement is bound to. Prevents replay across runs. */
  runBinding: {
    runId: string;
    replayIdentity: string;
    evidenceChainTerminal: string;
  } | null;
  /** Ed25519 signature over the endorsement body (including run binding). Null when unsigned. */
  signature: string | null;
}

export interface HumanOversight {
  /** Whether this run requires human approval based on materiality tier. */
  required: boolean;
  /** Reason why approval is required (or why it is not). */
  reason: string;
  /** Current approval status. */
  status: ApprovalStatus;
  /** Reviewer identity (role, not person — e.g., 'risk_officer', 'compliance_reviewer'). */
  reviewerRole?: string;
  /** Approval/rejection reason from the reviewer. */
  reviewNote?: string;
  /** ISO timestamp of the approval/rejection decision. */
  decisionTimestamp?: string;
  /** Workflow-bound reviewer identity. Null when review is not required or reviewer identity is not provided. */
  reviewerIdentity?: ReviewerIdentity | null;
  /** Structured reviewer endorsement. Null when review is not completed or endorsement is not provided. */
  endorsement?: ReviewerEndorsement | null;
}

// ─── Lineage Evidence ────────────────────────────────────────────────────────

/**
 * Lineage evidence for a financial run.
 * Answers: what source objects were touched, what output was produced,
 * which metrics came from which evidence, and which decision followed.
 *
 * Inspired by OpenLineage facets, implemented as a bounded Attestor-native structure.
 */
export interface LineageEvidence {
  /** Run identifier for traceability. */
  runId: string;
  /** Input artifacts. */
  inputs: LineageArtifact[];
  /** Output artifacts. */
  outputs: LineageArtifact[];
  /** Source-to-metric mappings (from report provenance). */
  metricMappings: MetricProvenance[];
  /** Whether all metric sections have provenance records. */
  provenanceComplete: boolean;
  /** Evidence chain summary: hash links between pipeline stages. */
  chainSummary: { stage: string; hash: string }[];
}

export interface LineageArtifact {
  /** Artifact type. */
  type: 'schema' | 'table' | 'query' | 'result_set' | 'report';
  /** Artifact name or identifier. */
  name: string;
  /** Truncated SHA-256 hash. */
  hash: string;
  /** Additional metadata. */
  metadata?: Record<string, unknown>;
}

export interface ReviewPolicyResult {
  /** Whether review is required by policy. */
  required: boolean;
  /** Whether the required review has been approved. */
  approved: boolean;
  /** Whether the required review has been explicitly rejected. */
  rejected: boolean;
  /** Which triggers fired. */
  triggeredBy: string[];
  /** Explanation for the escalation decision. */
  reason: string;
}

// ─── Replay Benchmark ────────────────────────────────────────────────────────

export type BenchmarkCategory =
  | 'sql_safety'
  | 'data_quality'
  | 'reconciliation'
  | 'report_structure'
  | 'provenance'
  | 'oversight'
  | 'lineage'
  | 'pass';

export interface BenchmarkScenario {
  /** Unique scenario identifier. */
  id: string;
  /** Human-readable description. */
  description: string;
  /** Governance category being tested. */
  category: BenchmarkCategory;
  /** Expected failure mode (null = expected pass). */
  expectedFailureMode: string | null;
  /** Expected final decision. */
  expectedDecision: FinancialDecision;
  /** Expected failing scorer (if applicable). */
  expectedFailingScorer?: string;
}


// --- Evidence Chain ---

export interface EvidenceChainLink {
  stage: string;
  artifactType: string;
  hash: string;
  previousHash: string;
}

export interface EvidenceChain {
  runId: string;
  links: EvidenceChainLink[];
  rootHash: string;
  terminalHash: string;
  length: number;
  intact: boolean;
}

// --- Independence Proof ---

export interface IndependenceProof {
  generator: { component: string; role: string };
  validators: Array<{ component: string; role: string; scope: string }>;
  escalation: { component: string; role: string };
  auditRecorder: { component: string; role: string };
  overlapDetected: boolean;
  summary: string;
}

// --- Timeliness Proof ---

export interface StageTimingEntry {
  stage: string;
  startMs: number;
  endMs: number;
  durationMs: number;
}

export interface TimelinessProof {
  totalDurationMs: number;
  stages: StageTimingEntry[];
  controlledAggregationMs: number;
  validationMs: number;
  scoringMs: number;
}

// --- Reconciliation Authority ---

export interface ReconciliationBreak {
  check: string;
  description: string;
  expected: number | string;
  actual: number | string;
  variance: number | string;
  tolerance: number | string;
  column: string;
  severity: 'hard' | 'soft';
  /** Reconciliation class of this check. */
  reconClass: ReconciliationClass;
  /** How this break should be handled. */
  handling: BreakHandling;
  /** Whether review was escalated for this break. */
  reviewEscalated: boolean;
  /** Snapshot identity tied to this break. */
  snapshotHash: string | null;
}

export interface BreakReport {
  hasBreaks: boolean;
  totalBreaks: number;
  breaks: ReconciliationBreak[];
  reviewRequired: boolean;
  /** Hard stops that must block the run. */
  hardStops: number;
  /** Reviewable variances that can proceed with approval. */
  reviewableVariances: number;
  /** Informational mismatches noted but non-blocking. */
  informational: number;
}

// --- Replay Metadata ---

export interface ReplayMetadata {
  /** Run-instance identity (includes runId — unique per run). */
  runIdentity: string;
  /** Replay-equivalence identity (excludes runId — stable across replays of same scenario). */
  replayIdentity: string;
  /** Backward-compatible hash of the input evidence set (fixtures offline, snapshot sources live). */
  fixtureHash: string;
  /** Hash of the decision. */
  decisionHash: string;
  /** Whether this run is replay-stable (same replayIdentity → same decision). */
  replayStable: boolean;
}

// --- Policy & Entitlement ---

export type PolicyVerdict = 'allowed' | 'denied' | 'restricted';

export interface PolicyDecision {
  reference: string;
  schema: string | null;
  table: string;
  verdict: PolicyVerdict;
  reason: string;
}

export interface PolicyResult {
  /** Overall policy verdict. */
  result: 'pass' | 'fail';
  /** Per-reference decisions. */
  decisions: PolicyDecision[];
  /** Whether least-privilege boundaries were preserved. */
  leastPrivilegePreserved: boolean;
  /** Summary explanation. */
  summary: string;
}

// --- Run Manifest ---

export interface RunManifest {
  runId: string;
  timestamp: string;
  decision: FinancialDecision;
  artifacts: {
    runReport: { present: true };
    outputPack: { present: boolean; hash: string | null };
    dossier: { present: boolean; hash: string | null };
    auditTrail: { entries: number; chainIntact: boolean; lastHash: string | null };
    lineage: { inputs: number; outputs: number; provenanceComplete: boolean };
  };
  liveProof: LiveProofMetadata;
  receipt: { receiptId: string; status: string } | null;
  capsule: { capsuleId: string; authorityState: string } | null;
  evidenceChainTerminal: string | null;
}

// --- Live Proof ---
