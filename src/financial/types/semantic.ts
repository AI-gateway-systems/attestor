// ─── Semantic Clauses ────────────────────────────────────────────────────────

/**
 * Semantic clause: a machine-checkable analytical obligation.
 *
 * Goes beyond SQL-shape governance: these define what the NUMBERS must satisfy,
 * not just what the QUERY must look like.
 */
export type SemanticClauseType = 'balance_identity' | 'control_total' | 'ratio_bound' | 'sign_constraint' | 'completeness_check';

export interface SemanticClause {
  /** Unique clause ID. */
  id: string;
  /** Clause type. */
  type: SemanticClauseType;
  /** Human-readable description. */
  description: string;
  /** The formal expression (e.g., "net = gross_long - gross_short"). */
  expression: string;
  /** Column names involved. */
  columns: string[];
  /** Tolerance for numeric checks (0 = exact). */
  tolerance: number;
  /** Severity: hard = blocks, soft = warns. */
  severity: 'hard' | 'soft';
}

export interface SemanticClauseEvaluation {
  clause: SemanticClause;
  passed: boolean;
  /** Computed values from actual data. */
  observed: Record<string, number>;
  /** Expected relationship. */
  expected: string;
  /** Variance if applicable. */
  variance: number | null;
  /** Explanation. */
  explanation: string;
}

export interface SemanticClauseResult {
  performed: boolean;
  clauseCount: number;
  passCount: number;
  failCount: number;
  hardFailCount: number;
  evaluations: SemanticClauseEvaluation[];
}
