/**
 * Financial base contracts and execution evidence types.
 *
 * Extracted from ../types.ts; keep ../types.ts as the compatibility facade.
 */

export type MaterialityTier = 'low' | 'medium' | 'high';

// ─── Financial Query Intent ──────────────────────────────────────────────────

export type FinancialQueryType =
  | 'counterparty_exposure'
  | 'liquidity_risk'
  | 'reconciliation_variance'
  | 'regulatory_summary'
  | 'concentration_limit';

export interface FinancialQueryIntent {
  /** What kind of financial query this is. */
  queryType: FinancialQueryType;
  /** Human-readable description of the query goal. */
  description: string;
  /** Which schemas/tables the query is allowed to access. */
  allowedSchemas: string[];
  /** Which schemas/tables must never be accessed. */
  forbiddenSchemas: string[];
  /** Expected output columns with types. */
  expectedColumns: DataContractColumn[];
  /** Business constraints on the output. */
  businessConstraints: BusinessConstraint[];
  /** Risk/materiality tier for this query. Default: 'medium'. */
  materialityTier?: MaterialityTier;
  /** Control totals for reconciliation-first acceptance. */
  controlTotals?: ControlTotal[];
  /** Review policy triggers beyond materiality-based escalation. */
  reviewTriggers?: ReviewTrigger[];
  /** Reconciliation class for this query. */
  reconciliationClass?: ReconciliationClass;
  /** Execution class: what kind of query this should be. */
  executionClass?: ExecutionClass;
  /** Execution budget: bounded resource/shape expectations. */
  executionBudget?: ExecutionBudget;
}

// --- Execution Class & Budget ---

export type ExecutionClass = 'aggregate_summary' | 'bounded_detail' | 'reconciliation_check' | 'control_total_check' | 'unbounded';

export interface ExecutionBudget {
  maxJoins?: number;
  maxProjectedColumns?: number;
  requireWhere?: boolean;
  requireLimit?: boolean;
  maxResultRows?: number;
  allowWildcard?: boolean;
}

// --- Execution Guardrails ---

export interface GuardrailCheck {
  check: string;
  passed: boolean;
  detail: string;
}

export interface GuardrailResult {
  result: 'pass' | 'fail' | 'warn';
  checks: GuardrailCheck[];
  executionClass: ExecutionClass;
  totalChecks: number;
  failedChecks: number;
}

// --- Snapshot Semantics ---

export interface SnapshotIdentity {
  snapshotId: string;
  snapshotHash: string;
  version: string;
  fixtureCount: number;
  sourceKind?: 'fixture' | 'live_db';
  sourceCount?: number;
}

// --- Financial Warrant ---

export type TrustLevel = 'observe_only' | 'human_approved' | 'bounded_autonomy' | 'domain_autonomy';
export type WarrantStatus = 'active' | 'fulfilled' | 'violated';

export interface EvidenceObligation {
  id: string;
  description: string;
  fulfilled: boolean;
}

export interface FinancialWarrant {
  warrantId: string;
  issuedAt: string;
  runId: string;
  contractHash: string;
  replayIdentity: string;
  snapshotHash: string;
  /** Allowed table/schema references from policy. */
  allowedScope: string[];
  /** Denied references. */
  deniedScope: string[];
  executionClass: ExecutionClass;
  executionBudget: ExecutionBudget;
  trustLevel: TrustLevel;
  /** Allowed pipeline stages in order. */
  allowedPath: string[];
  /** Evidence that must be produced for authority to be considered satisfied. */
  evidenceObligations: EvidenceObligation[];
  /** Whether human review is required. */
  reviewRequired: boolean;
  /** Materiality tier. */
  materialityTier: MaterialityTier;
  /** Warrant status. */
  status: WarrantStatus;
  /** Violations detected during the run. */
  violations: string[];
}

// --- Authority Escrow ---

export type EscrowState = 'held' | 'partial' | 'released' | 'withheld';

export interface EscrowRelease {
  obligationId: string;
  released: boolean;
  releasedBy: string;
  releaseTimestamp: string | null;
}

export interface AuthorityEscrow {
  warrantId: string;
  state: EscrowState;
  totalObligations: number;
  releasedCount: number;
  heldCount: number;
  releases: EscrowRelease[];
  /** Why escrow is in its current state. */
  stateReason: string;
  /** Whether human review obligation exists and its status. */
  reviewHeld: boolean;
}

// ─── SQL Governance (v2) ─────────────────────────────────────────────────────

export type SqlSafetyResult = 'pass' | 'fail';

export interface SqlTableReference {
  /** Full reference as written (e.g., 'risk.counterparty_exposures'). */
  reference: string;
  /** Extracted schema (e.g., 'risk'). Null if unqualified. */
  schema: string | null;
  /** Extracted table name (e.g., 'counterparty_exposures'). */
  table: string;
  /** How this table is referenced (FROM, JOIN, subquery). */
  context: 'from' | 'join' | 'subquery';
}

export interface SqlGovernanceResult {
  /** Whether the SQL passed all safety gates. */
  result: SqlSafetyResult;
  /** Individual gate results. */
  gates: SqlGateResult[];
  /** The SQL text that was evaluated. */
  sqlText: string;
  /** Truncated SHA-256 hash of the SQL text (16 hex chars). */
  sqlHash: string;
  /** Structured table references extracted from the SQL. */
  referencedTables: SqlTableReference[];
}

export interface SqlGateResult {
  gate: string;
  passed: boolean;
  detail: string;
}

// ─── Execution Evidence ──────────────────────────────────────────────────────

export interface ExecutionEvidence {
  /** Whether the query executed successfully. */
  success: boolean;
  /** Execution duration in ms. */
  durationMs: number;
  /** Number of rows returned. */
  rowCount: number;
  /** Column names in the result. */
  columns: string[];
  /** Column types in the result. */
  columnTypes: string[];
  /** The actual result rows (for fixture-based execution). */
  rows: Record<string, unknown>[];
  /** Error message if execution failed. */
  error: string | null;
  /** Truncated SHA-256 hash of the result schema (columns + types, 16 hex chars). */
  schemaHash: string;
  /** Execution provider: fixture, sqlite, postgres. */
  provider?: 'fixture' | 'sqlite' | 'postgres';
  /**
   * Execution context hash (Postgres only).
   * SHA-256 of (server version + current_schemas + sanitized connection URL).
   * Proves WHICH database environment was queried, NOT the full schema/data state.
   */
  executionContextHash?: string | null;
}

// ─── Data Contracts ──────────────────────────────────────────────────────────

export interface DataContractColumn {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'null';
  required: boolean;
  /** If true, column must not contain null values. */
  notNull?: boolean;
}

export interface BusinessConstraint {
  /** What this constraint checks. */
  description: string;
  /** Column to check (or '*' for row-level). */
  column: string;
  /** Constraint type. */
  check: 'min' | 'max' | 'range' | 'not_empty' | 'row_count_min' | 'row_count_max' | 'sum_equals' | 'non_negative';
  /** Threshold value(s). */
  value?: number;
  min?: number;
  max?: number;
}

export interface DataContractResult {
  /** Overall pass/fail. */
  result: 'pass' | 'fail' | 'warn';
  /** Individual check results. */
  checks: DataContractCheck[];
  /** Total checks run. */
  totalChecks: number;
  /** Checks that failed. */
  failedChecks: number;
}

export interface DataContractCheck {
  check: string;
  passed: boolean;
  detail: string;
  severity: 'hard' | 'soft';
}

// ─── Report Provenance ───────────────────────────────────────────────────────

/**
 * Provenance record for a reported metric.
 * Links a reported value back to its source in execution evidence.
 */

// ─── Reconciliation Authority ────────────────────────────────────────────────

/**
 * Control total for reconciliation-first acceptance.
 * A control total is a mandatory balance check: if the total doesn't match,
 * the run fails regardless of other structural correctness.
 */
export interface ControlTotal {
  /** Human-readable description. */
  description: string;
  /** Column to sum. */
  column: string;
  /** Expected total value. */
  expectedTotal: number;
  /** Acceptable variance (absolute). 0 = exact match required. */
  tolerance: number;
}

// ─── Review Policy ───────────────────────────────────────────────────────────

/** Escalation trigger — what evidence condition triggers review. */
export interface ReviewTrigger {
  /** Trigger identifier. */
  id: string;
  /** Human-readable description. */
  description: string;
  /** Condition type. */
  condition:
    | 'materiality_high'
    | 'reconciliation_failure'
    | 'provenance_mismatch'
    | 'sensitive_schema_access'
    | 'audit_integrity_failure'
    | 'warning_count_exceeds'
    | 'control_total_breach';
  /** Threshold for count-based conditions. */
  threshold?: number;
}

export type ReconciliationClass =
  | 'exact_balance'
  | 'tolerance_balance'
  | 'variance_explanation_required'
  | 'control_total_only'
  | 'aggregate_crosscheck';

export type BreakHandling = 'hard_stop' | 'reviewable_variance' | 'informational' | 'explanation_required' | 'approval_required';
