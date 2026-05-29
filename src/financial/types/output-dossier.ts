/**
 * Financial scoring, output pack, filing readiness, dossier, and run-report contracts.
 */

import type {
  AuthorityEscrow,
  DataContractResult,
  ExecutionEvidence,
  FinancialQueryIntent,
  FinancialWarrant,
  GuardrailResult,
  SnapshotIdentity,
  SqlGovernanceResult,
} from './base.js';
import type { LiveProof, LiveReadinessResult } from './live-proof.js';
import type {
  AuditTrail,
  BreakReport,
  EvidenceChain,
  HumanOversight,
  IndependenceProof,
  LineageEvidence,
  MetricProvenance,
  PolicyResult,
  ReplayMetadata,
  ReportValidationResult,
  ReviewPolicyResult,
  ReviewerIdentity,
  RunManifest,
  TimelinessProof,
} from './review-audit.js';
import type { SemanticClauseResult } from './semantic.js';

export interface FinancialScore {
  scorer: string;
  value: boolean | 'warn' | 'skip';
  verdict: string;
  explanation: string;
}

export type FinancialDecision = 'pass' | 'fail' | 'warn' | 'block' | 'pending_approval' | 'rejected';

export interface FinancialScoringResult {
  decision: FinancialDecision;
  scores: FinancialScore[];
  scorersRun: number;
}

export interface OutputPack {
  version: '1.0';
  generatedAt: string;
  runId: string;
  decision: string;
  summary: PackSummary;
  sqlGovernance: PackSqlGovernance;
  execution: PackExecution | null;
  dataContracts: PackDataContracts | null;
  reportProvenance: PackProvenance | null;
  lineage: PackLineage;
  policy: PackPolicy | null;
  guardrails: PackGuardrails | null;
  snapshot: PackSnapshot;
  breakOps: PackBreakOps;
  reviewPolicy: PackReviewPolicy;
  oversight: PackOversight;
  auditIntegrity: PackAuditIntegrity;
  warrant: { warrantId: string; status: string; trustLevel: string; contractHash: string; snapshotHash: string; pathStages: number; obligationsFulfilled: number; obligationsTotal: number; violations: string[] };
  escrow: { state: string; released: number; total: number; reviewHeld: boolean; reason: string };
  receipt: { receiptId: string; status: string; decision: string; warrantId: string; signatureMode: string; issuanceReason: string } | null;
  capsule: { capsuleId: string; authorityState: string; decision: string; reason: string; hardFacts: number; advisorySignals: number } | null;
  liveProof: { mode: string; upstreamLive: boolean; executionLive: boolean; gaps: number; gapCategories: string[]; consistent: boolean; readiness: string | null; availableModes: string[] | null } | null;
  predictiveGuardrail: { performed: boolean; riskLevel: string; recommendation: string; signalCount: number; signals: Array<{ signal: string; severity: string; detail: string }> } | null;
  semanticClauses: { performed: boolean; clauseCount: number; passCount: number; failCount: number; hardFailCount: number; failedClauses: Array<{ id: string; type: string; severity: string; explanation: string }> } | null;
  filingReadiness: FilingReadiness;
  regulatoryAlignment: RegulatoryAlignmentNote[];
}

export interface PackPolicy {
  result: string;
  leastPrivilegePreserved: boolean;
  deniedReferences: string[];
  restrictedReferences: string[];
}

export interface PackGuardrails {
  result: string;
  executionClass: string;
  failedChecks: string[];
}

export interface PackSnapshot {
  snapshotId: string;
  snapshotHash: string;
  version: string;
  fixtureCount: number;
  sourceKind?: 'fixture' | 'live_db';
  sourceCount?: number;
}

export interface PackBreakOps {
  hasBreaks: boolean;
  totalBreaks: number;
  hardStops: number;
  reviewableVariances: number;
  informational: number;
  breaks: Array<{
    check: string;
    reconClass: string;
    handling: string;
    expected: string | number;
    actual: string | number;
    variance: string | number;
    column: string;
  }>;
}

// --- Filing Readiness ---

export type ReadinessStatus = 'review_ready' | 'internal_report_ready' | 'filing_not_ready' | 'blocked';

export interface ReadinessGap {
  category: string;
  description: string;
  blocking: boolean;
}

export interface FilingReadiness {
  status: ReadinessStatus;
  gaps: ReadinessGap[];
  totalGaps: number;
  blockingGaps: number;
}

export interface PackSummary {
  queryType: string;
  description: string;
  materialityTier: string;
  decision: string;
  scorersRun: number;
  totalAuditEntries: number;
}

export interface PackSqlGovernance {
  result: string;
  gatesPassed: number;
  gatesTotal: number;
  failedGates: string[];
  referencedTables: string[];
  sqlHash: string;
}

export interface PackExecution {
  success: boolean;
  rowCount: number;
  columns: string[];
  schemaHash: string;
  error: string | null;
}

export interface PackDataContracts {
  result: string;
  totalChecks: number;
  failedChecks: number;
  controlTotalChecks: number;
  failures: string[];
}

export interface PackProvenance {
  totalRecords: number;
  allMatch: boolean;
  records: MetricProvenance[];
}

export interface PackLineage {
  inputCount: number;
  outputCount: number;
  metricMappings: number;
  provenanceComplete: boolean;
}

export interface PackReviewPolicy {
  required: boolean;
  approved: boolean;
  rejected: boolean;
  triggeredBy: string[];
  reason: string;
}

export interface PackOversight {
  required: boolean;
  status: string;
  reviewerRole: string | null;
  reviewNote: string | null;
  reviewerIdentity: ReviewerIdentity | null;
  endorsement: { endorsedAt: string; endorsedDecision: string; reviewerName: string; reviewerRole: string; rationale: string; scope: string[]; signed: boolean } | null;
}

export interface PackAuditIntegrity {
  chainIntact: boolean;
  totalEntries: number;
}

export interface RegulatoryAlignmentNote {
  framework: string;
  principle: string;
  relevance: string;
}

// --- Verification Sub-Results ---

export interface VerificationSubResults {
  chainLinkage: boolean;
  canonicalArtifacts: boolean;
  signatureVerified: boolean | null;
  overall: 'passed' | 'partial' | 'failed' | 'unsigned';
  trustModel: string;
}

// --- Decision Dossier ---

export interface DossierSummarySection {
  category: string;
  status: string;
  detail: string;
}

export interface DecisionDossier {
  runId: string;
  generatedAt: string;
  decision: string;
  timeline: DossierEvent[];
  criticalEvidence: DossierEvidence[];
  blockers: DossierBlocker[];
  reviewPath: DossierReviewPath;
  unresolvedRisks: string[];
  artifactHashes: Record<string, string>;
  /** Reviewer packet sections: filing, break, policy, guardrails, snapshot, attestation, interop. */
  reviewerSummary: DossierSummarySection[];
}

export interface DossierEvent {
  seq: number;
  stage: string;
  outcome: string;
  significance: 'routine' | 'notable' | 'critical';
}

export interface DossierEvidence {
  scorer: string;
  value: string;
  verdict: string;
  significance: 'passed' | 'failed' | 'warning' | 'skipped';
}

export interface DossierBlocker {
  source: string;
  reason: string;
}

export interface DossierReviewPath {
  required: boolean;
  triggers: string[];
  outcome: 'not_required' | 'pending' | 'approved' | 'rejected';
  reviewerRole: string | null;
  reviewNote: string | null;
  reviewerIdentity: ReviewerIdentity | null;
  /** Structured endorsement summary. Null when no endorsement. */
  endorsement: { endorsedAt: string; endorsedDecision: string; reviewerName: string; rationale: string; signed: boolean } | null;
}

// ─── Financial Run Report ────────────────────────────────────────────────────

export interface FinancialRunReport {
  runId: string;
  timestamp: string;
  durationMs: number;
  queryIntent: FinancialQueryIntent;
  sqlGovernance: SqlGovernanceResult;
  execution: ExecutionEvidence | null;
  dataContract: DataContractResult | null;
  reportValidation: ReportValidationResult | null;
  scoring: FinancialScoringResult;
  audit: AuditTrail;
  oversight: HumanOversight;
  lineage: LineageEvidence;
  reviewPolicy: ReviewPolicyResult;
  outputPack: OutputPack;
  dossier: DecisionDossier;
  manifest: RunManifest;
  warrant: FinancialWarrant;
  policyResult: PolicyResult;
  guardrailResult: GuardrailResult;
  snapshot: SnapshotIdentity;
  evidenceChain: EvidenceChain;
  independenceProof: IndependenceProof;
  timelinessProof: TimelinessProof;
  breakReport: BreakReport;
  replayMetadata: ReplayMetadata;
  filingReadiness: FilingReadiness;
  attestation: import('../attestation.js').AttestationPack | null;
  escrow: AuthorityEscrow;
  receipt: import('../receipt.js').WarrantReceipt | null;
  capsule: import('../capsule.js').DecisionCapsule | null;
  liveProof: LiveProof;
  liveReadiness: LiveReadinessResult | null;
  openLineageExport: import('../openlineage.js').OpenLineageExport | null;
  /** Ed25519-signed portable attestation certificate. Null if no signing key was provided. */
  certificate: import('../../signing/certificate.js').AttestationCertificate | null;
  /** Predictive guardrail preflight result (Postgres only). Null for fixture/SQLite runs. */
  predictiveGuardrail: import('../../connectors/predictive-guardrails.js').PredictiveGuardrailResult | null;
  /** Semantic clause evaluation results. Null if no clauses defined. */
  semanticClauses: SemanticClauseResult | null;
  /** Final disposition. */
  decision: FinancialDecision;
}
