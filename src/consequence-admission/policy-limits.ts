import type {
  RiskClass,
} from '../release-kernel/types.js';
import type {
  ConsequenceAdmissionKnownConsequenceKind,
  ConsequenceAdmissionDomain,
} from './taxonomy.js';

export const CONSEQUENCE_ADMISSION_POLICY_LIMIT_VERSION =
  'attestor.consequence-admission-policy-limits.v1';

export const CONSEQUENCE_ADMISSION_POLICY_LIMIT_KINDS = [
  'amount',
  'velocity',
  'recipient-allowlist',
  'asset-allowlist',
  'data-scope',
  'authority-scope',
  'time-window',
  'risk-class-ceiling',
  'human-review-threshold',
  'custom',
] as const;
export type ConsequenceAdmissionPolicyLimitKind =
  typeof CONSEQUENCE_ADMISSION_POLICY_LIMIT_KINDS[number];

export const CONSEQUENCE_ADMISSION_POLICY_LIMIT_BREACH_ACTIONS = [
  'narrow',
  'review',
  'block',
] as const;
export type ConsequenceAdmissionPolicyLimitBreachAction =
  typeof CONSEQUENCE_ADMISSION_POLICY_LIMIT_BREACH_ACTIONS[number];

export const CONSEQUENCE_ADMISSION_POLICY_LIMIT_RESULT_STATUSES = [
  'pass',
  'breach',
  'not-observed',
  'not-applicable',
] as const;
export type ConsequenceAdmissionPolicyLimitResultStatus =
  typeof CONSEQUENCE_ADMISSION_POLICY_LIMIT_RESULT_STATUSES[number];

export const CONSEQUENCE_ADMISSION_VELOCITY_MEASUREMENT_SOURCES = [
  'shared-durable-counter',
  'single-process-counter',
  'operator-asserted',
  'unknown',
] as const;
export type ConsequenceAdmissionVelocityMeasurementSource =
  typeof CONSEQUENCE_ADMISSION_VELOCITY_MEASUREMENT_SOURCES[number];

export type ConsequenceAdmissionPolicyLimitDecision =
  | 'admit'
  | 'narrow'
  | 'review'
  | 'block';

export interface ConsequenceAdmissionPolicyLimitBase {
  readonly id: string;
  readonly kind: ConsequenceAdmissionPolicyLimitKind;
  readonly label: string;
  readonly consequenceDomain: ConsequenceAdmissionDomain;
  readonly consequenceKinds?: readonly ConsequenceAdmissionKnownConsequenceKind[];
  readonly required?: boolean;
  readonly breachAction: ConsequenceAdmissionPolicyLimitBreachAction;
}

export interface AmountPolicyLimit extends ConsequenceAdmissionPolicyLimitBase {
  readonly kind: 'amount';
  readonly maxAmount: number;
  readonly currency: string;
}

export interface VelocityPolicyLimit extends ConsequenceAdmissionPolicyLimitBase {
  readonly kind: 'velocity';
  readonly maxCount: number;
  readonly windowSeconds: number;
  readonly subject: string;
  readonly requireSharedCounter?: boolean | null;
}

export interface RecipientAllowlistPolicyLimit extends ConsequenceAdmissionPolicyLimitBase {
  readonly kind: 'recipient-allowlist';
  readonly allowedRecipients: readonly string[];
}

export interface AssetAllowlistPolicyLimit extends ConsequenceAdmissionPolicyLimitBase {
  readonly kind: 'asset-allowlist';
  readonly allowedAssets: readonly string[];
}

export interface DataScopePolicyLimit extends ConsequenceAdmissionPolicyLimitBase {
  readonly kind: 'data-scope';
  readonly allowedDataDomains: readonly string[];
  readonly maxRecords?: number | null;
}

export interface AuthorityScopePolicyLimit extends ConsequenceAdmissionPolicyLimitBase {
  readonly kind: 'authority-scope';
  readonly allowedAuthorityScopes: readonly string[];
}

export interface TimeWindowPolicyLimit extends ConsequenceAdmissionPolicyLimitBase {
  readonly kind: 'time-window';
  readonly notBefore?: string | null;
  readonly notAfter?: string | null;
}

export interface RiskClassCeilingPolicyLimit extends ConsequenceAdmissionPolicyLimitBase {
  readonly kind: 'risk-class-ceiling';
  readonly maxRiskClass: RiskClass;
}

export interface HumanReviewThresholdPolicyLimit extends ConsequenceAdmissionPolicyLimitBase {
  readonly kind: 'human-review-threshold';
  readonly thresholdAmount: number;
  readonly currency: string;
  readonly breachAction: 'review';
}

export interface CustomPolicyLimit extends ConsequenceAdmissionPolicyLimitBase {
  readonly kind: 'custom';
  readonly expectedRef: string;
}

export type ConsequenceAdmissionPolicyLimit =
  | AmountPolicyLimit
  | VelocityPolicyLimit
  | RecipientAllowlistPolicyLimit
  | AssetAllowlistPolicyLimit
  | DataScopePolicyLimit
  | AuthorityScopePolicyLimit
  | TimeWindowPolicyLimit
  | RiskClassCeilingPolicyLimit
  | HumanReviewThresholdPolicyLimit
  | CustomPolicyLimit;

export interface ConsequenceAdmissionPolicyLimitSet {
  readonly version: typeof CONSEQUENCE_ADMISSION_POLICY_LIMIT_VERSION;
  readonly id: string;
  readonly policyRef: string;
  readonly consequenceDomain: ConsequenceAdmissionDomain;
  readonly limits: readonly ConsequenceAdmissionPolicyLimit[];
}

export interface CreateConsequenceAdmissionPolicyLimitSetInput {
  readonly id: string;
  readonly policyRef: string;
  readonly consequenceDomain: ConsequenceAdmissionDomain;
  readonly limits: readonly ConsequenceAdmissionPolicyLimit[];
}

export interface ConsequenceAdmissionAmountMeasurement {
  readonly value: number;
  readonly currency: string;
}

export interface ConsequenceAdmissionVelocityMeasurement {
  readonly count: number;
  readonly windowSeconds: number;
  readonly subject: string;
  readonly source?: ConsequenceAdmissionVelocityMeasurementSource | null;
}

export interface ConsequenceAdmissionDataScopeMeasurement {
  readonly domains: readonly string[];
  readonly recordCount?: number | null;
}

export interface ConsequenceAdmissionPolicyLimitObservation {
  readonly consequenceKind?: ConsequenceAdmissionKnownConsequenceKind | null;
  readonly amount?: ConsequenceAdmissionAmountMeasurement | null;
  readonly velocity?: ConsequenceAdmissionVelocityMeasurement | null;
  readonly recipient?: string | null;
  readonly asset?: string | null;
  readonly dataScope?: ConsequenceAdmissionDataScopeMeasurement | null;
  readonly authorityScope?: string | null;
  readonly occurredAt?: string | null;
  readonly riskClass?: RiskClass | 'custom' | null;
  readonly customRefs?: readonly string[];
}

export interface ConsequenceAdmissionPolicyLimitConstraint {
  readonly id: string;
  readonly summary: string;
  readonly enforcedBy: string;
}

export interface ConsequenceAdmissionPolicyLimitResult {
  readonly limitId: string;
  readonly kind: ConsequenceAdmissionPolicyLimitKind;
  readonly status: ConsequenceAdmissionPolicyLimitResultStatus;
  readonly effectiveDecision: ConsequenceAdmissionPolicyLimitDecision;
  readonly measuredValue: string | null;
  readonly expectedValue: string;
  readonly reasonCodes: readonly string[];
  readonly constraint: ConsequenceAdmissionPolicyLimitConstraint | null;
}

export interface ConsequenceAdmissionPolicyLimitEvaluation {
  readonly version: typeof CONSEQUENCE_ADMISSION_POLICY_LIMIT_VERSION;
  readonly limitSetId: string;
  readonly policyRef: string;
  readonly consequenceDomain: ConsequenceAdmissionDomain;
  readonly decision: ConsequenceAdmissionPolicyLimitDecision;
  readonly allowed: boolean;
  readonly failClosed: boolean;
  readonly results: readonly ConsequenceAdmissionPolicyLimitResult[];
  readonly constraints: readonly ConsequenceAdmissionPolicyLimitConstraint[];
  readonly reasonCodes: readonly string[];
}

export interface ConsequenceAdmissionPolicyLimitDescriptor {
  readonly version: typeof CONSEQUENCE_ADMISSION_POLICY_LIMIT_VERSION;
  readonly limitKinds: typeof CONSEQUENCE_ADMISSION_POLICY_LIMIT_KINDS;
  readonly breachActions: typeof CONSEQUENCE_ADMISSION_POLICY_LIMIT_BREACH_ACTIONS;
  readonly resultStatuses: typeof CONSEQUENCE_ADMISSION_POLICY_LIMIT_RESULT_STATUSES;
  readonly velocityMeasurementSources: typeof CONSEQUENCE_ADMISSION_VELOCITY_MEASUREMENT_SOURCES;
  readonly decisions: readonly ['admit', 'narrow', 'review', 'block'];
  readonly failClosedOnMissingRequiredMeasurement: true;
  readonly supportsSharedVelocitySourceRequirement: true;
}

const RISK_ORDER: Readonly<Record<RiskClass, number>> = Object.freeze({
  R0: 0,
  R1: 1,
  R2: 2,
  R3: 3,
  R4: 4,
});

function normalizeIdentifier(value: string | null | undefined, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Consequence admission policy limit ${fieldName} requires a string.`);
  }
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`Consequence admission policy limit ${fieldName} requires a non-empty value.`);
  }
  return normalized;
}

function normalizeOptionalIdentifier(
  value: string | null | undefined,
  fieldName: string,
): string | null {
  if (value === undefined || value === null) return null;
  return normalizeIdentifier(value, fieldName);
}

function normalizePositiveNumber(value: number, fieldName: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Consequence admission policy limit ${fieldName} must be a positive number.`);
  }
  return value;
}

function normalizePositiveInteger(value: number, fieldName: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Consequence admission policy limit ${fieldName} must be a positive integer.`);
  }
  return value;
}

function normalizeOptionalPositiveInteger(
  value: number | null | undefined,
  fieldName: string,
): number | null {
  if (value === undefined || value === null) return null;
  return normalizePositiveInteger(value, fieldName);
}

function uniqueIdentifiers(values: readonly string[], fieldName: string): readonly string[] {
  return Object.freeze(
    Array.from(new Set(values.map((value) => normalizeIdentifier(value, fieldName)))).sort(),
  );
}

function normalizeIsoTimestamp(
  value: string | null | undefined,
  fieldName: string,
): string | null {
  if (value === undefined || value === null) return null;
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    throw new Error(`Consequence admission policy limit ${fieldName} must be an ISO timestamp.`);
  }
  return timestamp.toISOString();
}

function required(limit: ConsequenceAdmissionPolicyLimit): boolean {
  return limit.required ?? true;
}

function normalizeLimitBase<T extends ConsequenceAdmissionPolicyLimit>(
  limit: T,
): T {
  return {
    ...limit,
    id: normalizeIdentifier(limit.id, 'limit.id'),
    label: normalizeIdentifier(limit.label, 'limit.label'),
    consequenceKinds: limit.consequenceKinds
      ? Object.freeze([...limit.consequenceKinds])
      : undefined,
    required: required(limit),
  };
}

function normalizePolicyLimit(
  limit: ConsequenceAdmissionPolicyLimit,
): ConsequenceAdmissionPolicyLimit {
  const base = normalizeLimitBase(limit);
  switch (base.kind) {
    case 'amount':
      return Object.freeze({
        ...base,
        maxAmount: normalizePositiveNumber(base.maxAmount, 'amount.maxAmount'),
        currency: normalizeIdentifier(base.currency, 'amount.currency').toUpperCase(),
      });
    case 'velocity':
      return Object.freeze({
        ...base,
        maxCount: normalizePositiveInteger(base.maxCount, 'velocity.maxCount'),
        windowSeconds: normalizePositiveInteger(base.windowSeconds, 'velocity.windowSeconds'),
        subject: normalizeIdentifier(base.subject, 'velocity.subject'),
        requireSharedCounter: base.requireSharedCounter ?? false,
      });
    case 'recipient-allowlist':
      return Object.freeze({
        ...base,
        allowedRecipients: uniqueIdentifiers(
          base.allowedRecipients,
          'recipientAllowlist.allowedRecipients[]',
        ),
      });
    case 'asset-allowlist':
      return Object.freeze({
        ...base,
        allowedAssets: uniqueIdentifiers(base.allowedAssets, 'assetAllowlist.allowedAssets[]'),
      });
    case 'data-scope':
      return Object.freeze({
        ...base,
        allowedDataDomains: uniqueIdentifiers(
          base.allowedDataDomains,
          'dataScope.allowedDataDomains[]',
        ),
        maxRecords: normalizeOptionalPositiveInteger(base.maxRecords, 'dataScope.maxRecords'),
      });
    case 'authority-scope':
      return Object.freeze({
        ...base,
        allowedAuthorityScopes: uniqueIdentifiers(
          base.allowedAuthorityScopes,
          'authorityScope.allowedAuthorityScopes[]',
        ),
      });
    case 'time-window':
      return Object.freeze({
        ...base,
        notBefore: normalizeIsoTimestamp(base.notBefore, 'timeWindow.notBefore'),
        notAfter: normalizeIsoTimestamp(base.notAfter, 'timeWindow.notAfter'),
      });
    case 'risk-class-ceiling':
      return Object.freeze(base);
    case 'human-review-threshold':
      return Object.freeze({
        ...base,
        thresholdAmount: normalizePositiveNumber(
          base.thresholdAmount,
          'humanReviewThreshold.thresholdAmount',
        ),
        currency: normalizeIdentifier(base.currency, 'humanReviewThreshold.currency').toUpperCase(),
        breachAction: 'review',
      });
    case 'custom':
      return Object.freeze({
        ...base,
        expectedRef: normalizeIdentifier(base.expectedRef, 'custom.expectedRef'),
      });
  }
}

function notObserved(
  limit: ConsequenceAdmissionPolicyLimit,
  expectedValue: string,
): ConsequenceAdmissionPolicyLimitResult {
  const missingRequired = required(limit);
  return Object.freeze({
    limitId: limit.id,
    kind: limit.kind,
    status: missingRequired ? 'not-observed' : 'not-applicable',
    effectiveDecision: missingRequired ? 'block' : 'admit',
    measuredValue: null,
    expectedValue,
    reasonCodes: Object.freeze([
      `policy-limit-${limit.kind}`,
      missingRequired ? 'policy-limit-required-measurement-missing' : 'policy-limit-not-applicable',
    ]),
    constraint: null,
  });
}

function limitConstraint(
  limit: ConsequenceAdmissionPolicyLimit,
  summary: string,
): ConsequenceAdmissionPolicyLimitConstraint | null {
  if (limit.breachAction !== 'narrow') return null;
  return Object.freeze({
    id: `constraint:${limit.id}`,
    summary,
    enforcedBy: 'downstream enforcement contract',
  });
}

function result(input: {
  readonly limit: ConsequenceAdmissionPolicyLimit;
  readonly breached: boolean;
  readonly measuredValue: string;
  readonly expectedValue: string;
  readonly constraintSummary: string;
  readonly reasonCode: string;
}): ConsequenceAdmissionPolicyLimitResult {
  const { limit, breached } = input;
  return Object.freeze({
    limitId: limit.id,
    kind: limit.kind,
    status: breached ? 'breach' : 'pass',
    effectiveDecision: breached ? limit.breachAction : 'admit',
    measuredValue: input.measuredValue,
    expectedValue: input.expectedValue,
    reasonCodes: Object.freeze([
      `policy-limit-${limit.kind}`,
      input.reasonCode,
      breached ? `policy-limit-${limit.breachAction}` : 'policy-limit-pass',
    ]),
    constraint: breached ? limitConstraint(limit, input.constraintSummary) : null,
  });
}

function observedAmount(
  observation: ConsequenceAdmissionPolicyLimitObservation,
): ConsequenceAdmissionAmountMeasurement | null {
  if (!observation.amount) return null;
  return Object.freeze({
    value: normalizePositiveNumber(observation.amount.value, 'observation.amount.value'),
    currency: normalizeIdentifier(
      observation.amount.currency,
      'observation.amount.currency',
    ).toUpperCase(),
  });
}

function evaluateAmountLimit(
  limit: AmountPolicyLimit,
  observation: ConsequenceAdmissionPolicyLimitObservation,
): ConsequenceAdmissionPolicyLimitResult {
  const amount = observedAmount(observation);
  const expected = `<= ${limit.maxAmount} ${limit.currency}`;
  if (!amount) return notObserved(limit, expected);
  const currencyMatches = amount.currency === limit.currency;
  const breached = !currencyMatches || amount.value > limit.maxAmount;
  return result({
    limit,
    breached,
    measuredValue: `${amount.value} ${amount.currency}`,
    expectedValue: expected,
    constraintSummary: `Maximum amount is ${limit.maxAmount} ${limit.currency}.`,
    reasonCode: breached ? 'policy-limit-amount-breach' : 'policy-limit-amount-pass',
  });
}

function evaluateVelocityLimit(
  limit: VelocityPolicyLimit,
  observation: ConsequenceAdmissionPolicyLimitObservation,
): ConsequenceAdmissionPolicyLimitResult {
  const velocity = observation.velocity;
  const expected = `<= ${limit.maxCount} events / ${limit.windowSeconds}s for ${limit.subject}`;
  if (!velocity) return notObserved(limit, expected);
  const source = velocity.source ?? 'unknown';
  const sourceBreach = limit.requireSharedCounter === true &&
    source !== 'shared-durable-counter';
  const breached =
    velocity.subject !== limit.subject ||
    velocity.windowSeconds !== limit.windowSeconds ||
    velocity.count > limit.maxCount ||
    sourceBreach;
  return result({
    limit,
    breached,
    measuredValue:
      `${velocity.count} events / ${velocity.windowSeconds}s for ${velocity.subject} (${source})`,
    expectedValue: limit.requireSharedCounter === true
      ? `${expected} from shared-durable-counter`
      : expected,
    constraintSummary: sourceBreach
      ? 'Velocity measurement must come from a shared durable counter.'
      : `Velocity cannot exceed ${limit.maxCount} events per ${limit.windowSeconds}s for ${limit.subject}.`,
    reasonCode: sourceBreach
      ? 'policy-limit-velocity-source-not-shared'
      : breached ? 'policy-limit-velocity-breach' : 'policy-limit-velocity-pass',
  });
}

function evaluateRecipientLimit(
  limit: RecipientAllowlistPolicyLimit,
  observation: ConsequenceAdmissionPolicyLimitObservation,
): ConsequenceAdmissionPolicyLimitResult {
  const recipient = normalizeOptionalIdentifier(observation.recipient, 'observation.recipient');
  const expected = `recipient in ${limit.allowedRecipients.join(', ')}`;
  if (recipient === null) return notObserved(limit, expected);
  const breached = !limit.allowedRecipients.includes(recipient);
  return result({
    limit,
    breached,
    measuredValue: recipient,
    expectedValue: expected,
    constraintSummary: `Recipient must be one of: ${limit.allowedRecipients.join(', ')}.`,
    reasonCode: breached ? 'policy-limit-recipient-breach' : 'policy-limit-recipient-pass',
  });
}

function evaluateAssetLimit(
  limit: AssetAllowlistPolicyLimit,
  observation: ConsequenceAdmissionPolicyLimitObservation,
): ConsequenceAdmissionPolicyLimitResult {
  const asset = normalizeOptionalIdentifier(observation.asset, 'observation.asset');
  const expected = `asset in ${limit.allowedAssets.join(', ')}`;
  if (asset === null) return notObserved(limit, expected);
  const breached = !limit.allowedAssets.includes(asset);
  return result({
    limit,
    breached,
    measuredValue: asset,
    expectedValue: expected,
    constraintSummary: `Asset must be one of: ${limit.allowedAssets.join(', ')}.`,
    reasonCode: breached ? 'policy-limit-asset-breach' : 'policy-limit-asset-pass',
  });
}

function evaluateDataScopeLimit(
  limit: DataScopePolicyLimit,
  observation: ConsequenceAdmissionPolicyLimitObservation,
): ConsequenceAdmissionPolicyLimitResult {
  const dataScope = observation.dataScope;
  const maxRecords = limit.maxRecords ?? null;
  const expected = [
    `domains in ${limit.allowedDataDomains.join(', ')}`,
    maxRecords !== null ? `records <= ${maxRecords}` : null,
  ].filter((entry): entry is string => entry !== null).join(' / ');
  if (!dataScope) return notObserved(limit, expected);
  const domains = uniqueIdentifiers(dataScope.domains, 'observation.dataScope.domains[]');
  const domainBreach = domains.some((domain) => !limit.allowedDataDomains.includes(domain));
  const recordCount = dataScope.recordCount ?? null;
  const recordBreach = maxRecords !== null && (recordCount === null || recordCount > maxRecords);
  const measuredRecords = recordCount === null ? 'unknown records' : `${recordCount} records`;
  return result({
    limit,
    breached: domainBreach || recordBreach,
    measuredValue: `${domains.join(', ')} / ${measuredRecords}`,
    expectedValue: expected,
    constraintSummary: `Data scope must stay within ${limit.allowedDataDomains.join(', ')}${maxRecords !== null ? ` and at most ${maxRecords} records` : ''}.`,
    reasonCode:
      domainBreach || recordBreach ? 'policy-limit-data-scope-breach' : 'policy-limit-data-scope-pass',
  });
}

function evaluateAuthorityScopeLimit(
  limit: AuthorityScopePolicyLimit,
  observation: ConsequenceAdmissionPolicyLimitObservation,
): ConsequenceAdmissionPolicyLimitResult {
  const scope = normalizeOptionalIdentifier(
    observation.authorityScope,
    'observation.authorityScope',
  );
  const expected = `authority scope in ${limit.allowedAuthorityScopes.join(', ')}`;
  if (scope === null) return notObserved(limit, expected);
  const breached = !limit.allowedAuthorityScopes.includes(scope);
  return result({
    limit,
    breached,
    measuredValue: scope,
    expectedValue: expected,
    constraintSummary: `Authority scope must be one of: ${limit.allowedAuthorityScopes.join(', ')}.`,
    reasonCode: breached ? 'policy-limit-authority-scope-breach' : 'policy-limit-authority-scope-pass',
  });
}

function evaluateTimeWindowLimit(
  limit: TimeWindowPolicyLimit,
  observation: ConsequenceAdmissionPolicyLimitObservation,
): ConsequenceAdmissionPolicyLimitResult {
  const occurredAt = normalizeIsoTimestamp(observation.occurredAt, 'observation.occurredAt');
  const expected = [
    limit.notBefore ? `not before ${limit.notBefore}` : null,
    limit.notAfter ? `not after ${limit.notAfter}` : null,
  ].filter((entry): entry is string => entry !== null).join(' / ');
  if (occurredAt === null) return notObserved(limit, expected || 'bounded time window');
  const occurred = new Date(occurredAt).getTime();
  const breached =
    (limit.notBefore !== null && limit.notBefore !== undefined &&
      occurred < new Date(limit.notBefore).getTime()) ||
    (limit.notAfter !== null && limit.notAfter !== undefined &&
      occurred > new Date(limit.notAfter).getTime());
  return result({
    limit,
    breached,
    measuredValue: occurredAt,
    expectedValue: expected,
    constraintSummary: `Execution time must satisfy ${expected}.`,
    reasonCode: breached ? 'policy-limit-time-window-breach' : 'policy-limit-time-window-pass',
  });
}

function evaluateRiskCeilingLimit(
  limit: RiskClassCeilingPolicyLimit,
  observation: ConsequenceAdmissionPolicyLimitObservation,
): ConsequenceAdmissionPolicyLimitResult {
  const riskClass = observation.riskClass ?? null;
  const expected = `risk <= ${limit.maxRiskClass}`;
  if (riskClass === null) return notObserved(limit, expected);
  const breached = riskClass === 'custom' || RISK_ORDER[riskClass] > RISK_ORDER[limit.maxRiskClass];
  return result({
    limit,
    breached,
    measuredValue: riskClass,
    expectedValue: expected,
    constraintSummary: `Risk class must not exceed ${limit.maxRiskClass}.`,
    reasonCode: breached ? 'policy-limit-risk-class-breach' : 'policy-limit-risk-class-pass',
  });
}

function evaluateHumanReviewThresholdLimit(
  limit: HumanReviewThresholdPolicyLimit,
  observation: ConsequenceAdmissionPolicyLimitObservation,
): ConsequenceAdmissionPolicyLimitResult {
  const amount = observedAmount(observation);
  const expected = `< ${limit.thresholdAmount} ${limit.currency} without review`;
  if (!amount) return notObserved(limit, expected);
  const breached = amount.currency !== limit.currency || amount.value >= limit.thresholdAmount;
  return result({
    limit,
    breached,
    measuredValue: `${amount.value} ${amount.currency}`,
    expectedValue: expected,
    constraintSummary: `Human review is required at or above ${limit.thresholdAmount} ${limit.currency}.`,
    reasonCode: breached ? 'policy-limit-review-threshold-breach' : 'policy-limit-review-threshold-pass',
  });
}

function evaluateCustomLimit(
  limit: CustomPolicyLimit,
  observation: ConsequenceAdmissionPolicyLimitObservation,
): ConsequenceAdmissionPolicyLimitResult {
  const customRefs = Object.freeze([...(observation.customRefs ?? [])]);
  const breached = !customRefs.includes(limit.expectedRef);
  return result({
    limit,
    breached,
    measuredValue: customRefs.length > 0 ? customRefs.join(', ') : 'none',
    expectedValue: `custom ref ${limit.expectedRef}`,
    constraintSummary: `Custom policy reference ${limit.expectedRef} must be present.`,
    reasonCode: breached ? 'policy-limit-custom-breach' : 'policy-limit-custom-pass',
  });
}

function evaluateLimit(
  limit: ConsequenceAdmissionPolicyLimit,
  observation: ConsequenceAdmissionPolicyLimitObservation,
): ConsequenceAdmissionPolicyLimitResult {
  if (
    observation.consequenceKind &&
    limit.consequenceKinds &&
    !limit.consequenceKinds.includes(observation.consequenceKind)
  ) {
    return Object.freeze({
      limitId: limit.id,
      kind: limit.kind,
      status: 'not-applicable',
      effectiveDecision: 'admit',
      measuredValue: observation.consequenceKind,
      expectedValue: `consequence kind in ${limit.consequenceKinds.join(', ')}`,
      reasonCodes: Object.freeze(['policy-limit-kind-not-applicable']),
      constraint: null,
    });
  }

  switch (limit.kind) {
    case 'amount':
      return evaluateAmountLimit(limit, observation);
    case 'velocity':
      return evaluateVelocityLimit(limit, observation);
    case 'recipient-allowlist':
      return evaluateRecipientLimit(limit, observation);
    case 'asset-allowlist':
      return evaluateAssetLimit(limit, observation);
    case 'data-scope':
      return evaluateDataScopeLimit(limit, observation);
    case 'authority-scope':
      return evaluateAuthorityScopeLimit(limit, observation);
    case 'time-window':
      return evaluateTimeWindowLimit(limit, observation);
    case 'risk-class-ceiling':
      return evaluateRiskCeilingLimit(limit, observation);
    case 'human-review-threshold':
      return evaluateHumanReviewThresholdLimit(limit, observation);
    case 'custom':
      return evaluateCustomLimit(limit, observation);
  }
}

function strongestDecision(
  results: readonly ConsequenceAdmissionPolicyLimitResult[],
): ConsequenceAdmissionPolicyLimitDecision {
  if (results.some((entry) => entry.effectiveDecision === 'block')) return 'block';
  if (results.some((entry) => entry.effectiveDecision === 'review')) return 'review';
  if (results.some((entry) => entry.effectiveDecision === 'narrow')) return 'narrow';
  return 'admit';
}

export function createConsequenceAdmissionPolicyLimitSet(
  input: CreateConsequenceAdmissionPolicyLimitSetInput,
): ConsequenceAdmissionPolicyLimitSet {
  if (input.limits.length === 0) {
    throw new Error('Consequence admission policy limit set requires at least one limit.');
  }
  return Object.freeze({
    version: CONSEQUENCE_ADMISSION_POLICY_LIMIT_VERSION,
    id: normalizeIdentifier(input.id, 'limitSet.id'),
    policyRef: normalizeIdentifier(input.policyRef, 'limitSet.policyRef'),
    consequenceDomain: input.consequenceDomain,
    limits: Object.freeze(input.limits.map(normalizePolicyLimit)),
  });
}

export function evaluateConsequenceAdmissionPolicyLimits(input: {
  readonly limitSet: ConsequenceAdmissionPolicyLimitSet;
  readonly observation: ConsequenceAdmissionPolicyLimitObservation;
}): ConsequenceAdmissionPolicyLimitEvaluation {
  const results = Object.freeze(
    input.limitSet.limits.map((limit) => evaluateLimit(limit, input.observation)),
  );
  const decision = strongestDecision(results);
  const constraints = Object.freeze(
    results
      .map((entry) => entry.constraint)
      .filter((entry): entry is ConsequenceAdmissionPolicyLimitConstraint => entry !== null),
  );

  return Object.freeze({
    version: CONSEQUENCE_ADMISSION_POLICY_LIMIT_VERSION,
    limitSetId: input.limitSet.id,
    policyRef: input.limitSet.policyRef,
    consequenceDomain: input.limitSet.consequenceDomain,
    decision,
    allowed: decision === 'admit' || decision === 'narrow',
    failClosed: decision === 'review' || decision === 'block',
    results,
    constraints,
    reasonCodes: Object.freeze([
      ...results.flatMap((entry) => entry.reasonCodes),
      `policy-limit-decision-${decision}`,
    ]),
  });
}

export function consequenceAdmissionPolicyLimitDescriptor():
ConsequenceAdmissionPolicyLimitDescriptor {
  return Object.freeze({
    version: CONSEQUENCE_ADMISSION_POLICY_LIMIT_VERSION,
    limitKinds: CONSEQUENCE_ADMISSION_POLICY_LIMIT_KINDS,
    breachActions: CONSEQUENCE_ADMISSION_POLICY_LIMIT_BREACH_ACTIONS,
    resultStatuses: CONSEQUENCE_ADMISSION_POLICY_LIMIT_RESULT_STATUSES,
    velocityMeasurementSources: CONSEQUENCE_ADMISSION_VELOCITY_MEASUREMENT_SOURCES,
    decisions: ['admit', 'narrow', 'review', 'block'] as const,
    failClosedOnMissingRequiredMeasurement: true,
    supportsSharedVelocitySourceRequirement: true,
  });
}
