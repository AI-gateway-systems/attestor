import {
  createConsequenceAdmissionCheck,
  createConsequenceAdmissionRequest,
  createConsequenceAdmissionResponse,
  mapFinancePipelineDecisionToAdmission,
  type ConsequenceAdmissionCheck,
  type ConsequenceAdmissionCheckKind,
  type ConsequenceAdmissionCheckOutcome,
  type ConsequenceAdmissionConstraint,
  type ConsequenceAdmissionDecision,
  type ConsequenceAdmissionEvidenceRef,
  type ConsequenceAdmissionNativeDecision,
  type ConsequenceAdmissionProofRef,
  type ConsequenceAdmissionProposedConsequence,
  type ConsequenceAdmissionRequest,
  type ConsequenceAdmissionResponse,
} from './index.js';
import {
  evaluateConsequenceApprovalProvenance,
  type ConsequenceApprovalProvenanceClaim,
  type ConsequenceApprovalProvenanceDecision,
} from './approval-provenance-guard.js';
import {
  evaluateConsequenceAgenticSupplyChain,
  type ConsequenceAgenticSupplyChainDecision,
} from './agentic-supply-chain-guard.js';
import type {
  GenericAdmissionAgenticSupplyChain,
  GenericAdmissionDecisionContextDrift,
  GenericAdmissionGuardInputKind,
  GenericAdmissionGuardInputProvenanceDecision,
  GenericAdmissionGuardInputProvenanceRecord,
  GenericAdmissionHumanReviewFatigue,
  GenericAdmissionMultiAgentDelegation,
  GenericAdmissionNoGoCondition,
  GenericAdmissionScopeInput,
  GenericAdmissionStaleAuthorityPolicy,
} from './contracts.js';
import {
  evaluateConsequenceDecisionContextDrift,
  type ConsequenceDecisionContextDriftDecision,
} from './decision-context-drift-binding.js';
import {
  evaluateGenericAdmissionGuardInputProvenance,
} from './guard-input-provenance.js';
import {
  evaluateConsequenceHumanReviewFatigue,
  type ConsequenceHumanReviewFatigueDecision,
} from './human-review-fatigue-guard.js';
import {
  evaluateConsequenceMultiAgentDelegation,
  type ConsequenceMultiAgentDelegationDecision,
} from './multi-agent-delegation-guard.js';
import {
  evaluateConsequenceNoGoConditionLedger,
  type ConsequenceNoGoConditionLedgerDecision,
} from './no-go-condition-ledger.js';
import {
  evaluateConsequenceScopeExplosion,
  type ConsequenceScopeExplosionDecision,
} from './scope-explosion-guard.js';
import {
  evaluateConsequenceStaleAuthorityPolicy,
  type ConsequenceStaleAuthorityPolicyDecision,
} from './stale-authority-policy-guard.js';
import {
  evaluateConsequenceToolResultPoisoning,
  type ConsequenceToolResultClaim,
  type ConsequenceToolResultEvidenceClass,
  type ConsequenceToolResultPoisoningDecision,
} from './tool-result-poisoning-guard.js';
import {
  evaluateConsequenceUntrustedContentAuthority,
  type ConsequenceUntrustedContentAuthorityDecision,
  type ConsequenceUntrustedContentAuthoritySource,
} from './untrusted-content-authority-guard.js';

export const FINANCE_PIPELINE_ADMISSION_ROUTE = '/api/v1/pipeline/run';
export const FINANCE_PIPELINE_ADMISSION_ENTRY_POINT_ID = 'finance-pipeline-run';
export const FINANCE_PIPELINE_ADMISSION_SOURCE_REF =
  'src/service/http/routes/pipeline-execution-routes.ts';

type OperationalPrimitive = string | number | boolean | null;

export interface FinancePipelineAdmissionTrustGuardInput {
  readonly authoritySources?: readonly ConsequenceUntrustedContentAuthoritySource[];
  readonly approvals?: readonly ConsequenceApprovalProvenanceClaim[];
  readonly scopeOwnerPolicyRef?: string | null;
  readonly requestedScope?: GenericAdmissionScopeInput | null;
  readonly approvedScope?: GenericAdmissionScopeInput | null;
  readonly allowedToolResultEvidenceClasses?:
    readonly ConsequenceToolResultEvidenceClass[] | null;
  readonly toolResults?: readonly ConsequenceToolResultClaim[] | null;
  readonly agenticSupplyChain?: GenericAdmissionAgenticSupplyChain | null;
  readonly humanReviewFatigue?: GenericAdmissionHumanReviewFatigue | null;
  readonly multiAgentDelegation?: GenericAdmissionMultiAgentDelegation | null;
  readonly staleAuthorityPolicy?: GenericAdmissionStaleAuthorityPolicy | null;
  readonly decisionContextDrift?: GenericAdmissionDecisionContextDrift | null;
  readonly guardInputProvenance?:
    readonly GenericAdmissionGuardInputProvenanceRecord[];
  readonly requiredGuardInputProvenance?:
    readonly GenericAdmissionGuardInputKind[];
  readonly noGoLedgerRef?: string | null;
  readonly noGoConditions?: readonly GenericAdmissionNoGoCondition[] | null;
  readonly noGoNaturalLanguageBypassAttempted?: boolean | null;
  readonly noGoNaturalLanguageSignals?: readonly string[];
  readonly noGoBypassAttemptRef?: string | null;
}

export interface FinancePipelineAdmissionRequestInput
  extends FinancePipelineAdmissionTrustGuardInput {
  readonly requestedAt: string;
  readonly requestId?: string | null;
  readonly runId?: string | null;
  readonly actor?: string | null;
  readonly action?: string | null;
  readonly downstreamSystem?: string | null;
  readonly consequenceKind?: ConsequenceAdmissionProposedConsequence['consequenceKind'];
  readonly riskClass?: ConsequenceAdmissionProposedConsequence['riskClass'];
  readonly summary?: string | null;
  readonly policyRef?: string | null;
  readonly tenantId?: string | null;
  readonly environment?: string | null;
  readonly dimensions?: Readonly<Record<string, OperationalPrimitive>>;
  readonly actorRef?: string | null;
  readonly reviewerRef?: string | null;
  readonly signerRef?: string | null;
  readonly delegationRef?: string | null;
  readonly authorityMode?: string | null;
  readonly evidence?: readonly ConsequenceAdmissionEvidenceRef[];
  readonly nativeInputRefs?: readonly string[];
}

export interface FinanceFilingReleaseAdmissionSummary {
  readonly targetId?: string | null;
  readonly decisionId?: string | null;
  readonly decisionStatus?: string | null;
  readonly policyVersion?: string | null;
  readonly introspectionRequired?: boolean | null;
  readonly outputHash?: string | null;
  readonly consequenceHash?: string | null;
  readonly tokenId?: string | null;
  readonly token?: string | null;
  readonly expiresAt?: string | null;
  readonly evidencePackId?: string | null;
  readonly evidencePackPath?: string | null;
  readonly evidencePackDigest?: string | null;
  readonly reviewQueueId?: string | null;
  readonly reviewQueuePath?: string | null;
}

export interface FinanceShadowReleaseAdmissionSummary {
  readonly targetId?: string | null;
  readonly decisionId?: string | null;
  readonly decisionStatus?: string | null;
  readonly policyVersion?: string | null;
  readonly policyRolloutMode?: string | null;
  readonly policyEvaluationMode?: string | null;
  readonly wouldBlockIfEnforced?: boolean | null;
  readonly wouldRequireReview?: boolean | null;
  readonly wouldRequireToken?: boolean | null;
  readonly outputHash?: string | null;
  readonly consequenceHash?: string | null;
}

export interface FinancePipelineAdmissionRun {
  readonly runId: string;
  readonly decision: string;
  readonly proofMode?: string | null;
  readonly warrant?: string | null;
  readonly escrow?: string | null;
  readonly receipt?: string | null;
  readonly capsule?: string | null;
  readonly auditChainIntact?: boolean | null;
  readonly certificate?: Record<string, unknown> | null;
  readonly verification?: Record<string, unknown> | null;
  readonly signingMode?: string | null;
  readonly identitySource?: string | null;
  readonly reviewerName?: string | null;
  readonly tenantContext?: {
    readonly tenantId?: string | null;
    readonly source?: string | null;
    readonly planId?: string | null;
  } | null;
  readonly usage?: {
    readonly used?: number | null;
    readonly remaining?: number | null;
    readonly quota?: number | null;
    readonly enforced?: boolean | null;
  } | null;
  readonly rateLimit?: {
    readonly remaining?: number | null;
    readonly resetAt?: string | null;
    readonly enforced?: boolean | null;
  } | null;
  readonly release?: {
    readonly filingExport?: FinanceFilingReleaseAdmissionSummary | null;
    readonly communication?: FinanceShadowReleaseAdmissionSummary | null;
    readonly action?: FinanceShadowReleaseAdmissionSummary | null;
  } | null;
  readonly filingExport?: {
    readonly adapterId?: string | null;
    readonly coveragePercent?: number | null;
    readonly mappedCount?: number | null;
  } | null;
  readonly filingPackage?: {
    readonly adapterId?: string | null;
    readonly coveragePercent?: number | null;
    readonly mappedCount?: number | null;
    readonly issuedPackage?: Record<string, unknown> | null;
  } | null;
}

export interface CreateFinancePipelineAdmissionResponseInput
  extends FinancePipelineAdmissionTrustGuardInput {
  readonly run: FinancePipelineAdmissionRun;
  readonly decidedAt: string;
  readonly request?: ConsequenceAdmissionRequest | null;
  readonly constraints?: readonly ConsequenceAdmissionConstraint[];
  readonly operationalContext?: Readonly<Record<string, OperationalPrimitive>>;
}

export interface FinancePipelineAdmissionDescriptor {
  readonly packFamily: 'finance';
  readonly nativeSurface: 'finance-pipeline';
  readonly route: typeof FINANCE_PIPELINE_ADMISSION_ROUTE;
  readonly entryPointId: typeof FINANCE_PIPELINE_ADMISSION_ENTRY_POINT_ID;
  readonly sourceRef: typeof FINANCE_PIPELINE_ADMISSION_SOURCE_REF;
  readonly nativeDecisionOrder: readonly [
    'release.filingExport.decisionStatus',
    'decision',
  ];
  readonly hostedRouteBehavior: 'unchanged';
}

function textOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function statusOrNull(value: string | null | undefined): string | null {
  return textOrNull(value)?.toLowerCase() ?? null;
}

function hasClosedAuthorityChain(run: FinancePipelineAdmissionRun): boolean {
  const warrantStatus = statusOrNull(run.warrant);
  const escrowStatus = statusOrNull(run.escrow);
  const receiptStatus = statusOrNull(run.receipt);
  const capsuleStatus = statusOrNull(run.capsule);
  return (
    (warrantStatus === 'issued' || warrantStatus === 'fulfilled') &&
    escrowStatus === 'released' &&
    receiptStatus === 'issued' &&
    (capsuleStatus === 'closed' || capsuleStatus === 'authorized')
  );
}

function hasValidProofMode(run: FinancePipelineAdmissionRun): boolean {
  const proofMode = statusOrNull(run.proofMode);
  return (
    proofMode !== null &&
    !['missing', 'missing-evidence', 'missing_evidence', 'none', 'unavailable', 'unknown'].includes(proofMode)
  );
}

function recordOrNull(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function stringField(record: Record<string, unknown> | null | undefined, key: string): string | null {
  return textOrNull(record?.[key]);
}

function numberOrNull(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function boolOrNull(value: boolean | null | undefined): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function contextWithoutUndefined(
  input: Readonly<Record<string, OperationalPrimitive | undefined>>,
): Readonly<Record<string, OperationalPrimitive>> {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined),
    ) as Record<string, OperationalPrimitive>,
  );
}

function evidenceIds(
  request: ConsequenceAdmissionRequest,
  proof: readonly ConsequenceAdmissionProofRef[],
): readonly string[] {
  return Object.freeze([
    ...request.evidence.map((entry) => entry.id),
    ...proof.map((entry) => entry.id),
  ]);
}

function normalizeReleaseStatus(run: FinancePipelineAdmissionRun): {
  readonly value: string;
  readonly source: 'release.filingExport.decisionStatus' | 'decision';
  readonly filingRelease: FinanceFilingReleaseAdmissionSummary | null;
} {
  const filingRelease = run.release?.filingExport ?? null;
  const releaseStatus = textOrNull(filingRelease?.decisionStatus);
  if (releaseStatus) {
    return Object.freeze({
      value: releaseStatus,
      source: 'release.filingExport.decisionStatus',
      filingRelease,
    });
  }
  return Object.freeze({
    value: run.decision,
    source: 'decision',
    filingRelease,
  });
}

function certificateIdFor(run: FinancePipelineAdmissionRun): string | null {
  return stringField(run.certificate, 'certificateId');
}

function certificateFingerprintFor(run: FinancePipelineAdmissionRun): string | null {
  const signing = recordOrNull(run.certificate?.signing);
  return stringField(signing, 'fingerprint');
}

function buildProofRefs(run: FinancePipelineAdmissionRun): readonly ConsequenceAdmissionProofRef[] {
  const proof: ConsequenceAdmissionProofRef[] = [];
  const certificateId = certificateIdFor(run);
  const certificateFingerprint = certificateFingerprintFor(run);
  const filingRelease = run.release?.filingExport ?? null;

  if (certificateId) {
    proof.push({
      kind: 'certificate',
      id: certificateId,
      digest: certificateFingerprint ? `fingerprint:${certificateFingerprint}` : null,
      uri: null,
      verifyHint: 'Verify the signed Attestor certificate with the returned public key material.',
    });
  }

  if (run.verification) {
    proof.push({
      kind: 'verification-kit',
      id: `verification:${run.runId}`,
      digest: stringField(run.verification, 'digest'),
      uri: stringField(run.verification, 'path'),
      verifyHint: 'Use the verification object returned by the finance pipeline response.',
    });
  }

  if (textOrNull(filingRelease?.tokenId)) {
    const tokenId = textOrNull(filingRelease?.tokenId);
    proof.push({
      kind: 'release-token',
      id: tokenId!,
      digest: null,
      uri: null,
      verifyHint: 'Verify the release token before allowing the downstream filing consequence.',
    });
  }

  const evidencePackId = textOrNull(filingRelease?.evidencePackId);
  if (evidencePackId) {
    proof.push({
      kind: 'release-evidence-pack',
      id: evidencePackId,
      digest: textOrNull(filingRelease?.evidencePackDigest),
      uri: textOrNull(filingRelease?.evidencePackPath),
      verifyHint: 'Fetch and verify the release evidence pack for the filing decision.',
    });
  }

  const reviewQueueId = textOrNull(filingRelease?.reviewQueueId);
  if (reviewQueueId) {
    proof.push({
      kind: 'local-artifact',
      id: reviewQueueId,
      digest: null,
      uri: textOrNull(filingRelease?.reviewQueuePath),
      verifyHint: 'Review queue material must be resolved before automatic consequence.',
    });
  }

  return Object.freeze(proof);
}

function tokenFreshnessOutcome(
  filingRelease: FinanceFilingReleaseAdmissionSummary | null,
  decidedAt: string,
): ConsequenceAdmissionCheckOutcome {
  const expiresAt = textOrNull(filingRelease?.expiresAt);
  if (!expiresAt) return 'not-applicable';
  const expiry = new Date(expiresAt);
  if (Number.isNaN(expiry.getTime())) return 'fail';
  return expiry.getTime() > new Date(decidedAt).getTime() ? 'pass' : 'fail';
}

function financeAuthorityGuardDecisionFor(input: {
  readonly request: ConsequenceAdmissionRequest;
  readonly decidedAt: string;
  readonly authoritySources?: readonly ConsequenceUntrustedContentAuthoritySource[];
}): ConsequenceUntrustedContentAuthorityDecision | null {
  const authoritySources = input.authoritySources ?? [];
  if (authoritySources.length === 0) return null;
  return evaluateConsequenceUntrustedContentAuthority({
    generatedAt: input.decidedAt,
    actionSurface: 'finance-pipeline',
    action: input.request.proposedConsequence.action,
    requiredAuthority: true,
    sources: authoritySources,
  });
}

function financeApprovalGuardDecisionFor(input: {
  readonly request: ConsequenceAdmissionRequest;
  readonly decidedAt: string;
  readonly authoritySources?: readonly ConsequenceUntrustedContentAuthoritySource[];
  readonly approvals?: readonly ConsequenceApprovalProvenanceClaim[];
}): ConsequenceApprovalProvenanceDecision | null {
  const approvals = input.approvals ?? [];
  const approvalClaimPresent = (input.authoritySources ?? [])
    .some((source) => source.claimKind === 'approval');
  if (approvals.length === 0 && !approvalClaimPresent) return null;
  return evaluateConsequenceApprovalProvenance({
    generatedAt: input.decidedAt,
    actionSurface: 'finance-pipeline',
    action: input.request.proposedConsequence.action,
    approvals,
  });
}

function financeToolResultGuardDecisionFor(input: {
  readonly request: ConsequenceAdmissionRequest;
  readonly decidedAt: string;
  readonly allowedToolResultEvidenceClasses?:
    readonly ConsequenceToolResultEvidenceClass[] | null;
  readonly toolResults?: readonly ConsequenceToolResultClaim[] | null;
}): ConsequenceToolResultPoisoningDecision | null {
  const hasInput =
    (input.allowedToolResultEvidenceClasses !== null &&
      input.allowedToolResultEvidenceClasses !== undefined) ||
    (input.toolResults !== null &&
      input.toolResults !== undefined);
  if (!hasInput) return null;
  return evaluateConsequenceToolResultPoisoning({
    generatedAt: input.decidedAt,
    actionSurface: 'finance-pipeline',
    action: input.request.proposedConsequence.action,
    allowedEvidenceClasses: input.allowedToolResultEvidenceClasses ?? null,
    toolResults: input.toolResults ?? null,
  });
}

function financeScopeExplosionGuardDecisionFor(input: {
  readonly request: ConsequenceAdmissionRequest;
  readonly decidedAt: string;
  readonly scopeOwnerPolicyRef?: string | null;
  readonly requestedScope?: GenericAdmissionScopeInput | null;
  readonly approvedScope?: GenericAdmissionScopeInput | null;
}): ConsequenceScopeExplosionDecision | null {
  const hasInput =
    (input.scopeOwnerPolicyRef !== null && input.scopeOwnerPolicyRef !== undefined) ||
    (input.requestedScope !== null && input.requestedScope !== undefined) ||
    (input.approvedScope !== null && input.approvedScope !== undefined);
  if (!hasInput) return null;
  return evaluateConsequenceScopeExplosion({
    generatedAt: input.decidedAt,
    actionSurface: 'finance-pipeline',
    action: input.request.proposedConsequence.action,
    scopeOwnerPolicyRef: input.scopeOwnerPolicyRef ?? null,
    requestedScope: input.requestedScope ?? null,
    approvedScope: input.approvedScope ?? null,
  });
}

function financeAgenticSupplyChainGuardDecisionFor(input: {
  readonly request: ConsequenceAdmissionRequest;
  readonly decidedAt: string;
  readonly agenticSupplyChain?: GenericAdmissionAgenticSupplyChain | null;
}): ConsequenceAgenticSupplyChainDecision | null {
  if (input.agenticSupplyChain === null || input.agenticSupplyChain === undefined) return null;
  return evaluateConsequenceAgenticSupplyChain({
    generatedAt: input.decidedAt,
    actionSurface: 'finance-pipeline',
    action: input.request.proposedConsequence.action,
    components: input.agenticSupplyChain.components,
  });
}

function financeHumanReviewFatigueGuardDecisionFor(input: {
  readonly request: ConsequenceAdmissionRequest;
  readonly decidedAt: string;
  readonly humanReviewFatigue?: GenericAdmissionHumanReviewFatigue | null;
}): ConsequenceHumanReviewFatigueDecision | null {
  if (input.humanReviewFatigue === null || input.humanReviewFatigue === undefined) return null;
  return evaluateConsequenceHumanReviewFatigue({
    ...input.humanReviewFatigue,
    generatedAt: input.decidedAt,
    actionSurface: 'finance-pipeline',
    action: input.request.proposedConsequence.action,
  });
}

function financeMultiAgentDelegationGuardDecisionFor(input: {
  readonly request: ConsequenceAdmissionRequest;
  readonly decidedAt: string;
  readonly multiAgentDelegation?: GenericAdmissionMultiAgentDelegation | null;
}): ConsequenceMultiAgentDelegationDecision | null {
  if (input.multiAgentDelegation === null || input.multiAgentDelegation === undefined) {
    return null;
  }
  return evaluateConsequenceMultiAgentDelegation({
    ...input.multiAgentDelegation,
    generatedAt: input.decidedAt,
    actionSurface: 'finance-pipeline',
    action: input.request.proposedConsequence.action,
  });
}

function financeStaleAuthorityPolicyGuardDecisionFor(input: {
  readonly request: ConsequenceAdmissionRequest;
  readonly decidedAt: string;
  readonly staleAuthorityPolicy?: GenericAdmissionStaleAuthorityPolicy | null;
}): ConsequenceStaleAuthorityPolicyDecision | null {
  if (input.staleAuthorityPolicy === null || input.staleAuthorityPolicy === undefined) {
    return null;
  }
  return evaluateConsequenceStaleAuthorityPolicy({
    ...input.staleAuthorityPolicy,
    generatedAt: input.decidedAt,
    actionSurface: 'finance-pipeline',
    action: input.request.proposedConsequence.action,
  });
}

function financeDecisionContextDriftDecisionFor(input: {
  readonly request: ConsequenceAdmissionRequest;
  readonly decidedAt: string;
  readonly decisionContextDrift?: GenericAdmissionDecisionContextDrift | null;
}): ConsequenceDecisionContextDriftDecision | null {
  if (input.decisionContextDrift === null || input.decisionContextDrift === undefined) {
    return null;
  }
  return evaluateConsequenceDecisionContextDrift({
    ...input.decisionContextDrift,
    generatedAt: input.decidedAt,
    actionSurface: 'finance-pipeline',
    action: input.request.proposedConsequence.action,
  });
}

function financeHasNoGoInput(input: FinancePipelineAdmissionTrustGuardInput): boolean {
  return input.noGoLedgerRef !== null && input.noGoLedgerRef !== undefined ||
    input.noGoConditions !== null && input.noGoConditions !== undefined ||
    input.noGoNaturalLanguageBypassAttempted === true ||
    (input.noGoNaturalLanguageSignals ?? []).length > 0 ||
    input.noGoBypassAttemptRef !== null && input.noGoBypassAttemptRef !== undefined;
}

function financeNoGoConditionLedgerDecisionFor(input: {
  readonly request: ConsequenceAdmissionRequest;
  readonly decidedAt: string;
} & FinancePipelineAdmissionTrustGuardInput): ConsequenceNoGoConditionLedgerDecision | null {
  if (!financeHasNoGoInput(input)) return null;
  return evaluateConsequenceNoGoConditionLedger({
    generatedAt: input.decidedAt,
    actionSurface: 'finance-pipeline',
    action: input.request.proposedConsequence.action,
    ledgerRef: input.noGoLedgerRef ?? null,
    conditions: input.noGoConditions ?? null,
    naturalLanguageBypassAttempted: input.noGoNaturalLanguageBypassAttempted ?? null,
    naturalLanguageSignals: input.noGoNaturalLanguageSignals ?? [],
    bypassAttemptRef: input.noGoBypassAttemptRef ?? null,
  });
}

function financeGuardInputProvenanceDecisionFor(input: {
  readonly request: ConsequenceAdmissionRequest;
  readonly decidedAt: string;
  readonly guardInputProvenance?:
    readonly GenericAdmissionGuardInputProvenanceRecord[];
  readonly requiredGuardInputProvenance?:
    readonly GenericAdmissionGuardInputKind[];
}): GenericAdmissionGuardInputProvenanceDecision | null {
  const records = input.guardInputProvenance ?? [];
  const requiredGuardKinds = input.requiredGuardInputProvenance ?? [];
  if (records.length === 0 && requiredGuardKinds.length === 0) return null;
  return evaluateGenericAdmissionGuardInputProvenance({
    generatedAt: input.decidedAt,
    actionSurface: 'finance-pipeline',
    action: input.request.proposedConsequence.action,
    records,
    requiredGuardKinds,
  });
}

function financeGuardOutcome(
  outcome: 'pass' | 'review' | 'block' | 'narrow',
): ConsequenceAdmissionCheckOutcome {
  if (outcome === 'pass') return 'pass';
  if (outcome === 'block') return 'fail';
  return 'warn';
}

function addFinanceGuardCheck(
  checks: ConsequenceAdmissionCheck[],
  input: {
    readonly kind: ConsequenceAdmissionCheckKind;
    readonly label: string;
    readonly outcome: 'pass' | 'review' | 'block' | 'narrow';
    readonly passSummary: string;
    readonly holdSummary: string;
    readonly reasonCodes: readonly string[];
    readonly digest: string;
  },
): void {
  checks.push(createConsequenceAdmissionCheck({
    kind: input.kind,
    label: input.label,
    outcome: financeGuardOutcome(input.outcome),
    required: true,
    summary: input.outcome === 'pass' ? input.passSummary : input.holdSummary,
    reasonCodes: input.reasonCodes,
    evidenceRefs: [input.digest],
  }));
}

function buildFinanceTrustGuardChecks(input: {
  readonly authorityGuardDecision: ConsequenceUntrustedContentAuthorityDecision | null;
  readonly approvalGuardDecision: ConsequenceApprovalProvenanceDecision | null;
  readonly scopeExplosionGuardDecision: ConsequenceScopeExplosionDecision | null;
  readonly toolResultGuardDecision: ConsequenceToolResultPoisoningDecision | null;
  readonly agenticSupplyChainGuardDecision: ConsequenceAgenticSupplyChainDecision | null;
  readonly humanReviewFatigueGuardDecision: ConsequenceHumanReviewFatigueDecision | null;
  readonly multiAgentDelegationGuardDecision: ConsequenceMultiAgentDelegationDecision | null;
  readonly staleAuthorityPolicyGuardDecision: ConsequenceStaleAuthorityPolicyDecision | null;
  readonly decisionContextDriftDecision: ConsequenceDecisionContextDriftDecision | null;
  readonly noGoConditionLedgerDecision: ConsequenceNoGoConditionLedgerDecision | null;
  readonly guardInputProvenanceDecision: GenericAdmissionGuardInputProvenanceDecision | null;
}): readonly ConsequenceAdmissionCheck[] {
  const checks: ConsequenceAdmissionCheck[] = [];

  if (input.authorityGuardDecision !== null) {
    addFinanceGuardCheck(checks, {
      kind: 'authority',
      label: 'Finance authority-source guard',
      outcome: input.authorityGuardDecision.outcome,
      passSummary: 'Structured finance authority sources passed the untrusted-content guard.',
      holdSummary:
        'Structured finance authority sources require review before downstream consequence.',
      reasonCodes: input.authorityGuardDecision.reasonCodes,
      digest: input.authorityGuardDecision.digest,
    });
  }

  if (input.approvalGuardDecision !== null) {
    addFinanceGuardCheck(checks, {
      kind: 'authority',
      label: 'Finance approval provenance guard',
      outcome: input.approvalGuardDecision.outcome,
      passSummary: 'Structured finance approvals passed provenance checks.',
      holdSummary: 'Structured finance approvals require review before downstream consequence.',
      reasonCodes: input.approvalGuardDecision.reasonCodes,
      digest: input.approvalGuardDecision.digest,
    });
  }

  if (input.scopeExplosionGuardDecision !== null) {
    addFinanceGuardCheck(checks, {
      kind: 'authority',
      label: 'Finance scope guard',
      outcome: input.scopeExplosionGuardDecision.outcome,
      passSummary: 'Structured finance scope metadata stayed within the approved boundary.',
      holdSummary: 'Structured finance scope metadata requires narrowing or review.',
      reasonCodes: input.scopeExplosionGuardDecision.reasonCodes,
      digest: input.scopeExplosionGuardDecision.digest,
    });
  }

  if (input.toolResultGuardDecision !== null) {
    addFinanceGuardCheck(checks, {
      kind: 'evidence',
      label: 'Finance tool-result guard',
      outcome: input.toolResultGuardDecision.outcome,
      passSummary: 'Structured finance tool-result evidence passed poisoning checks.',
      holdSummary:
        'Structured finance tool-result evidence requires review before downstream consequence.',
      reasonCodes: input.toolResultGuardDecision.reasonCodes,
      digest: input.toolResultGuardDecision.digest,
    });
  }

  if (input.agenticSupplyChainGuardDecision !== null) {
    addFinanceGuardCheck(checks, {
      kind: 'evidence',
      label: 'Finance supply-chain guard',
      outcome: input.agenticSupplyChainGuardDecision.outcome,
      passSummary: 'Structured finance supply-chain metadata passed guard checks.',
      holdSummary: 'Structured finance supply-chain metadata requires review.',
      reasonCodes: input.agenticSupplyChainGuardDecision.reasonCodes,
      digest: input.agenticSupplyChainGuardDecision.digest,
    });
  }

  if (input.humanReviewFatigueGuardDecision !== null) {
    addFinanceGuardCheck(checks, {
      kind: 'evidence',
      label: 'Finance human-review guard',
      outcome: input.humanReviewFatigueGuardDecision.outcome,
      passSummary: 'Structured finance review metadata passed reviewer-safety checks.',
      holdSummary: 'Structured finance review metadata requires review before promotion.',
      reasonCodes: input.humanReviewFatigueGuardDecision.reasonCodes,
      digest: input.humanReviewFatigueGuardDecision.digest,
    });
  }

  if (input.multiAgentDelegationGuardDecision !== null) {
    addFinanceGuardCheck(checks, {
      kind: 'authority',
      label: 'Finance delegation guard',
      outcome: input.multiAgentDelegationGuardDecision.outcome,
      passSummary: 'Structured finance delegation metadata passed guard checks.',
      holdSummary: 'Structured finance delegation metadata requires review.',
      reasonCodes: input.multiAgentDelegationGuardDecision.reasonCodes,
      digest: input.multiAgentDelegationGuardDecision.digest,
    });
  }

  if (input.staleAuthorityPolicyGuardDecision !== null) {
    addFinanceGuardCheck(checks, {
      kind: 'policy',
      label: 'Finance stale-policy guard',
      outcome: input.staleAuthorityPolicyGuardDecision.outcome,
      passSummary: 'Structured finance policy and authority freshness metadata passed.',
      holdSummary: 'Structured finance policy or authority freshness requires review.',
      reasonCodes: input.staleAuthorityPolicyGuardDecision.reasonCodes,
      digest: input.staleAuthorityPolicyGuardDecision.digest,
    });
  }

  if (input.decisionContextDriftDecision !== null) {
    addFinanceGuardCheck(checks, {
      kind: 'freshness',
      label: 'Finance decision-context guard',
      outcome: input.decisionContextDriftDecision.outcome,
      passSummary: 'Structured finance decision context stayed bound to current metadata.',
      holdSummary: 'Structured finance decision context requires review.',
      reasonCodes: input.decisionContextDriftDecision.reasonCodes,
      digest: input.decisionContextDriftDecision.digest,
    });
  }

  if (input.noGoConditionLedgerDecision !== null) {
    addFinanceGuardCheck(checks, {
      kind: 'policy',
      label: 'Finance no-go ledger guard',
      outcome: input.noGoConditionLedgerDecision.outcome,
      passSummary: 'Structured finance no-go ledger metadata passed guard checks.',
      holdSummary: 'Structured finance no-go ledger metadata requires review or block.',
      reasonCodes: input.noGoConditionLedgerDecision.reasonCodes,
      digest: input.noGoConditionLedgerDecision.digest,
    });
  }

  if (input.guardInputProvenanceDecision !== null) {
    addFinanceGuardCheck(checks, {
      kind: 'authority',
      label: 'Finance guard-input provenance guard',
      outcome: input.guardInputProvenanceDecision.outcome,
      passSummary: 'Structured finance guard-input provenance passed guard checks.',
      holdSummary: 'Structured finance guard-input provenance requires review or block.',
      reasonCodes: input.guardInputProvenanceDecision.reasonCodes,
      digest: input.guardInputProvenanceDecision.digest,
    });
  }

  return Object.freeze(checks);
}

function buildFinanceChecks(input: {
  readonly run: FinancePipelineAdmissionRun;
  readonly request: ConsequenceAdmissionRequest;
  readonly decidedAt: string;
  readonly proof: readonly ConsequenceAdmissionProofRef[];
  readonly nativeDecisionSource: 'release.filingExport.decisionStatus' | 'decision';
  readonly filingRelease: FinanceFilingReleaseAdmissionSummary | null;
}): readonly ConsequenceAdmissionCheck[] {
  const { run, request, decidedAt, proof, nativeDecisionSource, filingRelease } = input;
  const proofEvidenceRefs = evidenceIds(request, proof);
  const status = textOrNull(filingRelease?.decisionStatus)?.toLowerCase() ?? run.decision.toLowerCase();
  const hasHardReleaseToken = Boolean(textOrNull(filingRelease?.tokenId));
  const hasReviewQueue = Boolean(textOrNull(filingRelease?.reviewQueueId));
  const hasAuthorityMaterial = hasClosedAuthorityChain(run);
  const hasProofMaterial = proof.length > 0 || run.auditChainIntact === true || hasValidProofMode(run);
  const allowStatuses = ['pass', 'accepted', 'allow', 'allowed', 'narrow', 'constrained', 'scope-reduced', 'limited'];
  const reviewStatuses = ['hold', 'review', 'review-required', 'needs-review', 'pending-review'];
  const denyStatuses = ['denied', 'fail', 'block', 'blocked', 'deny', 'revoked', 'expired'];
  const policyOutcome: ConsequenceAdmissionCheckOutcome =
    denyStatuses.includes(status)
      ? 'fail'
      : reviewStatuses.includes(status)
        ? 'warn'
        : allowStatuses.includes(status)
          ? 'pass'
          : 'fail';
  const authorityOutcome: ConsequenceAdmissionCheckOutcome =
    policyOutcome === 'fail'
      ? 'fail'
      : hasAuthorityMaterial || hasHardReleaseToken
        ? 'pass'
        : policyOutcome === 'pass'
          ? 'fail'
          : 'warn';
  const evidenceOutcome: ConsequenceAdmissionCheckOutcome =
    hasProofMaterial
      ? 'pass'
      : policyOutcome === 'fail' || policyOutcome === 'pass'
        ? 'fail'
        : 'warn';
  const freshnessOutcome = tokenFreshnessOutcome(filingRelease, decidedAt);
  const enforcementOutcome: ConsequenceAdmissionCheckOutcome =
    hasHardReleaseToken
      ? 'pass'
      : hasReviewQueue
        ? 'warn'
        : policyOutcome === 'fail'
          ? 'fail'
          : 'warn';

  return Object.freeze([
    createConsequenceAdmissionCheck({
      kind: 'policy',
      label: 'Finance policy decision',
      outcome: policyOutcome,
      required: true,
      summary:
        nativeDecisionSource === 'release.filingExport.decisionStatus'
          ? 'Finance filing release decision was projected into the canonical admission vocabulary.'
          : 'Finance pipeline decision was projected into the canonical admission vocabulary.',
      reasonCodes: [`finance-policy-${policyOutcome}`, `finance-native-${status}`],
      evidenceRefs: proofEvidenceRefs,
    }),
    createConsequenceAdmissionCheck({
      kind: 'authority',
      label: 'Finance authority closure',
      outcome: authorityOutcome,
      required: true,
      summary: hasAuthorityMaterial
        ? 'Finance warrant, escrow, receipt, and capsule are closed in valid authority states.'
        : hasHardReleaseToken
          ? 'A finance release token is present for downstream authority closure.'
          : 'Finance authority material is missing or not in closed valid states.',
      reasonCodes: [`finance-authority-${authorityOutcome}`],
      evidenceRefs: proofEvidenceRefs,
    }),
    createConsequenceAdmissionCheck({
      kind: 'evidence',
      label: 'Finance proof material',
      outcome: evidenceOutcome,
      required: true,
      summary: hasProofMaterial
        ? 'Finance proof material is present for independent inspection.'
        : 'Finance proof material is missing from the native response.',
      reasonCodes: [`finance-evidence-${evidenceOutcome}`],
      evidenceRefs: proofEvidenceRefs,
    }),
    createConsequenceAdmissionCheck({
      kind: 'freshness',
      label: 'Finance token freshness',
      outcome: freshnessOutcome,
      required: freshnessOutcome !== 'not-applicable',
      summary: textOrNull(filingRelease?.expiresAt)
        ? 'Finance release token expiry was checked against the admission decision time.'
        : 'No finance release token expiry is present on this native response.',
      reasonCodes: [`finance-freshness-${freshnessOutcome}`],
      evidenceRefs: proofEvidenceRefs,
    }),
    createConsequenceAdmissionCheck({
      kind: 'enforcement',
      label: 'Finance downstream enforcement',
      outcome: enforcementOutcome,
      required: true,
      summary: hasHardReleaseToken
        ? 'A finance release token is present for downstream enforcement.'
        : hasReviewQueue
          ? 'A finance review queue item is present, so automatic downstream consequence must hold.'
          : 'No finance release token is present; the customer system must enforce the canonical decision itself.',
      reasonCodes: [`finance-enforcement-${enforcementOutcome}`],
      evidenceRefs: proofEvidenceRefs,
    }),
    createConsequenceAdmissionCheck({
      kind: 'adapter-readiness',
      label: 'Finance hosted route adapter',
      outcome: 'pass',
      required: true,
      summary: 'The existing finance hosted proof route is wrapped without changing route behavior.',
      reasonCodes: ['finance-adapter-ready'],
      evidenceRefs: [FINANCE_PIPELINE_ADMISSION_SOURCE_REF],
    }),
  ]);
}

function failedRequiredChecks(
  checks: readonly ConsequenceAdmissionCheck[],
): readonly ConsequenceAdmissionCheck[] {
  return Object.freeze(
    checks.filter((check) => check.required && check.outcome === 'fail'),
  );
}

function effectiveFinanceDecision(
  nativeDecision: ConsequenceAdmissionNativeDecision,
  failedChecks: readonly ConsequenceAdmissionCheck[],
  guardBlockHolds: readonly ConsequenceAdmissionCheck[],
  reviewGuardHolds: readonly ConsequenceAdmissionCheck[],
  scopeNarrowHolds: readonly ConsequenceAdmissionCheck[],
): ConsequenceAdmissionDecision {
  if (
    guardBlockHolds.length > 0 &&
    (nativeDecision.mappedDecision === 'admit' ||
      nativeDecision.mappedDecision === 'narrow' ||
      nativeDecision.mappedDecision === 'review')
  ) {
    return 'block';
  }

  if (
    (failedChecks.length > 0 || reviewGuardHolds.length > 0) &&
    (nativeDecision.mappedDecision === 'admit' || nativeDecision.mappedDecision === 'narrow')
  ) {
    return 'review';
  }

  if (scopeNarrowHolds.length > 0 && nativeDecision.mappedDecision === 'admit') {
    return 'narrow';
  }

  return nativeDecision.mappedDecision;
}

function nativeDecisionForEffectiveDecision(input: {
  readonly nativeDecision: ConsequenceAdmissionNativeDecision;
  readonly decision: ConsequenceAdmissionDecision;
  readonly holdChecks: readonly ConsequenceAdmissionCheck[];
}): ConsequenceAdmissionNativeDecision {
  const { nativeDecision, decision, holdChecks } = input;
  if (nativeDecision.mappedDecision === decision) {
    return nativeDecision;
  }

  const heldLabels = holdChecks.map((check) => check.label).join(', ');
  const effectiveReason = decision === 'block'
    ? 'blocked by structured guard constraints'
    : decision === 'narrow'
      ? 'narrowed by structured guard constraints'
      : 'held at review because required checks require review';
  return Object.freeze({
    ...nativeDecision,
    mappedDecision: decision,
    mappingReason:
      `${nativeDecision.mappingReason} Effective canonical admission is ${effectiveReason}: ${heldLabels}.`,
  });
}

function financeTrustGuardHoldChecks(
  checks: readonly ConsequenceAdmissionCheck[],
): readonly ConsequenceAdmissionCheck[] {
  return Object.freeze(
    checks.filter((check) => check.outcome === 'warn' || check.outcome === 'fail'),
  );
}

function financeScopeNarrowHoldChecks(
  checks: readonly ConsequenceAdmissionCheck[],
): readonly ConsequenceAdmissionCheck[] {
  return Object.freeze(
    checks.filter((check) =>
      check.label === 'Finance scope guard' &&
      check.outcome === 'warn' &&
      check.reasonCodes.includes('scope-narrowing-required')
    ),
  );
}

function financeReviewGuardHoldChecks(
  checks: readonly ConsequenceAdmissionCheck[],
): readonly ConsequenceAdmissionCheck[] {
  const scopeNarrowChecks = new Set(financeScopeNarrowHoldChecks(checks));
  return Object.freeze(
    financeTrustGuardHoldChecks(checks).filter((check) =>
      check.outcome !== 'fail' && !scopeNarrowChecks.has(check)
    ),
  );
}

function financeBlockGuardHoldChecks(
  checks: readonly ConsequenceAdmissionCheck[],
): readonly ConsequenceAdmissionCheck[] {
  return Object.freeze(
    checks.filter((check) => check.outcome === 'fail'),
  );
}

function financeTrustGuardReasonCodes(
  checks: readonly ConsequenceAdmissionCheck[],
): readonly string[] {
  return Object.freeze(
    [...new Set(checks.flatMap((check) => check.reasonCodes))],
  );
}

function uniqueChecksByLabel(
  checks: readonly ConsequenceAdmissionCheck[],
): readonly ConsequenceAdmissionCheck[] {
  return Object.freeze([...new Map(checks.map((check) => [check.label, check])).values()]);
}

function defaultNarrowConstraints(): readonly ConsequenceAdmissionConstraint[] {
  return Object.freeze([
    {
      id: 'finance-native-constraint',
      kind: 'customer-approved-scope',
      summary: 'Proceed only under the constraints returned by the finance native surface.',
      enforcedBy: 'customer downstream system',
      parameterDigest: null,
    },
  ]);
}

function financeScopeConstraints(
  decision: ConsequenceScopeExplosionDecision | null,
): readonly ConsequenceAdmissionConstraint[] {
  if (decision?.outcome !== 'narrow') return Object.freeze([]);
  return Object.freeze(
    decision.constraints.map((constraint) => Object.freeze({
      id: `finance-scope:${constraint.dimension}`,
      kind: 'customer-approved-scope',
      summary: constraint.safeSummary,
      enforcedBy: 'customer finance workflow',
      parameterDigest: constraint.constraintDigest,
    })),
  );
}

export function createFinancePipelineAdmissionRequest(
  input: FinancePipelineAdmissionRequestInput,
): ConsequenceAdmissionRequest {
  return createConsequenceAdmissionRequest({
    requestedAt: input.requestedAt,
    requestId: input.requestId,
    packFamily: 'finance',
    entryPoint: {
      kind: 'hosted-route',
      id: FINANCE_PIPELINE_ADMISSION_ENTRY_POINT_ID,
      route: FINANCE_PIPELINE_ADMISSION_ROUTE,
      packageSubpath: null,
      sourceRef: FINANCE_PIPELINE_ADMISSION_SOURCE_REF,
    },
    proposedConsequence: {
      actor: textOrNull(input.actor) ?? 'AI-assisted finance workflow',
      action: textOrNull(input.action) ?? 'evaluate a finance consequence before release',
      downstreamSystem: textOrNull(input.downstreamSystem) ?? 'customer finance workflow',
      consequenceKind: input.consequenceKind ?? 'record',
      riskClass: input.riskClass ?? 'R4',
      summary:
        textOrNull(input.summary) ??
        'Finance workflow asks Attestor whether a proposed record, filing, communication, or action may proceed.',
    },
    policyScope: {
      policyRef: input.policyRef ?? 'policy:finance:hosted-proof-wedge',
      tenantId: input.tenantId ?? null,
      environment: input.environment ?? null,
      dimensions: {
        domain: 'finance',
        route: FINANCE_PIPELINE_ADMISSION_ROUTE,
        ...(input.runId ? { runId: input.runId } : {}),
        ...(input.dimensions ?? {}),
      },
    },
    authority: {
      actorRef: input.actorRef ?? null,
      reviewerRef: input.reviewerRef ?? null,
      signerRef: input.signerRef ?? null,
      delegationRef: input.delegationRef ?? null,
      authorityMode: input.authorityMode ?? null,
    },
    evidence: input.evidence,
    nativeInputRefs: input.nativeInputRefs ?? ['candidateSql', 'intent', 'fixtures', 'sign'],
  });
}

export function createFinancePipelineAdmissionResponse(
  input: CreateFinancePipelineAdmissionResponseInput,
): ConsequenceAdmissionResponse {
  const request =
    input.request ??
    createFinancePipelineAdmissionRequest({
      requestedAt: input.decidedAt,
      runId: input.run.runId,
      tenantId: input.run.tenantContext?.tenantId ?? null,
      environment: input.run.tenantContext?.source ?? null,
    });
  const native = normalizeReleaseStatus(input.run);
  const nativeDecision = mapFinancePipelineDecisionToAdmission(native.value);
  const proof = buildProofRefs(input.run);
  const financeChecks = buildFinanceChecks({
    run: input.run,
    request,
    decidedAt: input.decidedAt,
    proof,
    nativeDecisionSource: native.source,
    filingRelease: native.filingRelease,
  });
  const authorityGuardDecision = financeAuthorityGuardDecisionFor({
    request,
    decidedAt: input.decidedAt,
    authoritySources: input.authoritySources,
  });
  const approvalGuardDecision = financeApprovalGuardDecisionFor({
    request,
    decidedAt: input.decidedAt,
    authoritySources: input.authoritySources,
    approvals: input.approvals,
  });
  const toolResultGuardDecision = financeToolResultGuardDecisionFor({
    request,
    decidedAt: input.decidedAt,
    allowedToolResultEvidenceClasses: input.allowedToolResultEvidenceClasses,
    toolResults: input.toolResults,
  });
  const scopeExplosionGuardDecision = financeScopeExplosionGuardDecisionFor({
    request,
    decidedAt: input.decidedAt,
    scopeOwnerPolicyRef: input.scopeOwnerPolicyRef,
    requestedScope: input.requestedScope,
    approvedScope: input.approvedScope,
  });
  const agenticSupplyChainGuardDecision = financeAgenticSupplyChainGuardDecisionFor({
    request,
    decidedAt: input.decidedAt,
    agenticSupplyChain: input.agenticSupplyChain,
  });
  const humanReviewFatigueGuardDecision = financeHumanReviewFatigueGuardDecisionFor({
    request,
    decidedAt: input.decidedAt,
    humanReviewFatigue: input.humanReviewFatigue,
  });
  const multiAgentDelegationGuardDecision = financeMultiAgentDelegationGuardDecisionFor({
    request,
    decidedAt: input.decidedAt,
    multiAgentDelegation: input.multiAgentDelegation,
  });
  const staleAuthorityPolicyGuardDecision = financeStaleAuthorityPolicyGuardDecisionFor({
    request,
    decidedAt: input.decidedAt,
    staleAuthorityPolicy: input.staleAuthorityPolicy,
  });
  const decisionContextDriftDecision = financeDecisionContextDriftDecisionFor({
    request,
    decidedAt: input.decidedAt,
    decisionContextDrift: input.decisionContextDrift,
  });
  const noGoConditionLedgerDecision = financeNoGoConditionLedgerDecisionFor({
    request,
    decidedAt: input.decidedAt,
    noGoLedgerRef: input.noGoLedgerRef,
    noGoConditions: input.noGoConditions,
    noGoNaturalLanguageBypassAttempted: input.noGoNaturalLanguageBypassAttempted,
    noGoNaturalLanguageSignals: input.noGoNaturalLanguageSignals,
    noGoBypassAttemptRef: input.noGoBypassAttemptRef,
  });
  const guardInputProvenanceDecision = financeGuardInputProvenanceDecisionFor({
    request,
    decidedAt: input.decidedAt,
    guardInputProvenance: input.guardInputProvenance,
    requiredGuardInputProvenance: input.requiredGuardInputProvenance,
  });
  const guardChecks = buildFinanceTrustGuardChecks({
    authorityGuardDecision,
    approvalGuardDecision,
    scopeExplosionGuardDecision,
    toolResultGuardDecision,
    agenticSupplyChainGuardDecision,
    humanReviewFatigueGuardDecision,
    multiAgentDelegationGuardDecision,
    staleAuthorityPolicyGuardDecision,
    decisionContextDriftDecision,
    noGoConditionLedgerDecision,
    guardInputProvenanceDecision,
  });
  const checks = Object.freeze([...financeChecks, ...guardChecks]);
  const requiredFailures = failedRequiredChecks(financeChecks);
  const trustGuardHolds = financeTrustGuardHoldChecks(guardChecks);
  const guardBlockHolds = financeBlockGuardHoldChecks(guardChecks);
  const reviewGuardHolds = financeReviewGuardHoldChecks(guardChecks);
  const scopeNarrowHolds = financeScopeNarrowHoldChecks(guardChecks);
  const trustGuardReasons = financeTrustGuardReasonCodes(trustGuardHolds);
  const holdChecks = uniqueChecksByLabel([...requiredFailures, ...trustGuardHolds]);
  const decision = effectiveFinanceDecision(
    nativeDecision,
    requiredFailures,
    guardBlockHolds,
    reviewGuardHolds,
    scopeNarrowHolds,
  );
  const effectiveNativeDecision = nativeDecisionForEffectiveDecision({
    nativeDecision,
    decision,
    holdChecks,
  });
  const scopeConstraints = financeScopeConstraints(scopeExplosionGuardDecision);
  const constraints =
    decision === 'narrow'
      ? input.constraints?.length
        ? input.constraints
        : scopeConstraints.length > 0
          ? scopeConstraints
          : defaultNarrowConstraints()
      : input.constraints ?? [];
  const nativeDecisionPhrase =
    native.source === 'release.filingExport.decisionStatus'
      ? `Finance filing release status ${native.value}`
      : `Finance pipeline decision ${native.value}`;
  const reason =
    guardBlockHolds.length > 0 && decision !== nativeDecision.mappedDecision
      ? `${nativeDecisionPhrase} maps to native ${nativeDecision.mappedDecision}, but structured finance guards blocked so canonical admission is block.`
      : requiredFailures.length > 0 && decision !== nativeDecision.mappedDecision
      ? `${nativeDecisionPhrase} maps to native ${nativeDecision.mappedDecision}, but required checks failed so canonical admission is review.`
      : scopeNarrowHolds.length > 0 && decision !== nativeDecision.mappedDecision
        ? `${nativeDecisionPhrase} maps to native ${nativeDecision.mappedDecision}, but structured finance scope requires narrowing so canonical admission is narrow.`
      : `${nativeDecisionPhrase} maps to canonical ${decision}.`;
  const reasonCodes = [
    `finance-${native.source === 'decision' ? 'pipeline' : 'release'}-${decision}`,
    `finance-native-${native.value.toLowerCase()}`,
    ...(requiredFailures.length > 0 ? ['finance-required-check-failed'] : []),
    ...(trustGuardHolds.length > 0 ? ['finance-trust-guard-held'] : []),
    ...(guardBlockHolds.length > 0 ? ['finance-trust-guard-blocked'] : []),
    ...trustGuardReasons,
  ];

  return createConsequenceAdmissionResponse({
    request,
    decidedAt: input.decidedAt,
    decision,
    reason,
    reasonCodes,
    checks,
    constraints,
    nativeDecision: effectiveNativeDecision,
    proof,
    operationalContext: contextWithoutUndefined({
      tenantId: input.run.tenantContext?.tenantId ?? null,
      tenantSource: input.run.tenantContext?.source ?? null,
      planId: input.run.tenantContext?.planId ?? null,
      proofMode: input.run.proofMode ?? null,
      signingMode: input.run.signingMode ?? null,
      identitySource: input.run.identitySource ?? null,
      reviewerName: input.run.reviewerName ?? null,
      auditChainIntact: boolOrNull(input.run.auditChainIntact),
      usageUsed: numberOrNull(input.run.usage?.used),
      usageRemaining: numberOrNull(input.run.usage?.remaining),
      usageQuota: numberOrNull(input.run.usage?.quota),
      usageEnforced: boolOrNull(input.run.usage?.enforced),
      rateLimitRemaining: numberOrNull(input.run.rateLimit?.remaining),
      rateLimitEnforced: boolOrNull(input.run.rateLimit?.enforced),
      releaseDecisionId: native.filingRelease?.decisionId ?? null,
      releasePolicyVersion: native.filingRelease?.policyVersion ?? null,
      releaseIntrospectionRequired: boolOrNull(native.filingRelease?.introspectionRequired),
      authorityGuardOutcome: authorityGuardDecision?.outcome ?? null,
      approvalGuardOutcome: approvalGuardDecision?.outcome ?? null,
      scopeExplosionGuardOutcome: scopeExplosionGuardDecision?.outcome ?? null,
      toolResultGuardOutcome: toolResultGuardDecision?.outcome ?? null,
      agenticSupplyChainGuardOutcome: agenticSupplyChainGuardDecision?.outcome ?? null,
      humanReviewFatigueGuardOutcome: humanReviewFatigueGuardDecision?.outcome ?? null,
      multiAgentDelegationGuardOutcome: multiAgentDelegationGuardDecision?.outcome ?? null,
      staleAuthorityPolicyGuardOutcome: staleAuthorityPolicyGuardDecision?.outcome ?? null,
      decisionContextDriftOutcome: decisionContextDriftDecision?.outcome ?? null,
      noGoConditionOutcome: noGoConditionLedgerDecision?.outcome ?? null,
      guardInputProvenanceOutcome: guardInputProvenanceDecision?.outcome ?? null,
      ...(input.operationalContext ?? {}),
    }),
  });
}

export function financePipelineAdmissionDescriptor():
FinancePipelineAdmissionDescriptor {
  return Object.freeze({
    packFamily: 'finance',
    nativeSurface: 'finance-pipeline',
    route: FINANCE_PIPELINE_ADMISSION_ROUTE,
    entryPointId: FINANCE_PIPELINE_ADMISSION_ENTRY_POINT_ID,
    sourceRef: FINANCE_PIPELINE_ADMISSION_SOURCE_REF,
    nativeDecisionOrder: [
      'release.filingExport.decisionStatus',
      'decision',
    ] as const,
    hostedRouteBehavior: 'unchanged',
  });
}
