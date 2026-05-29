import {
  createHash,
} from 'node:crypto';
import {
  canonicalizeReleaseJson,
  type CanonicalReleaseJsonValue,
} from '../release-kernel/release-canonicalization.js';
import {
  CONSEQUENCE_ADMISSION_CONSTRAINT_KINDS,
  CONSEQUENCE_ADMISSION_CONSTRAINT_PARAMETER_DIGEST_PATTERN,
  isConsequenceAdmissionConstraintKind,
  type ConsequenceAdmissionConstraintKind,
} from './constraint-kinds.js';
import type {
  ConsequenceAdmissionConstraint,
  ConsequenceAdmissionDecision,
  ConsequenceAdmissionEvidenceRef,
  ConsequenceAdmissionNativeDecision,
  ConsequenceAdmissionProofRef,
  ConsequenceAdmissionRequest,
  CreateConsequenceAdmissionConstraintInput,
} from './contracts.js';
import {
  CONSEQUENCE_ADMISSION_CONTRACT_VERSION,
  CONSEQUENCE_ADMISSION_DECISIONS,
  CONSEQUENCE_ADMISSION_NATIVE_SURFACES,
  CONSEQUENCE_ADMISSION_PROOF_KINDS,
} from './contracts.js';

export function normalizeIdentifier(value: string | null | undefined, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Consequence admission ${fieldName} requires a non-empty string value.`);
  }
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`Consequence admission ${fieldName} requires a non-empty value.`);
  }
  return normalized;
}

export function inferConstraintKind(id: string): ConsequenceAdmissionConstraintKind {
  const normalized = id.toLowerCase();
  if (normalized.includes('max-amount') || normalized.includes('amount')) {
    return 'max-amount';
  }
  if (normalized.includes('recipient')) {
    return 'recipient-allowlist';
  }
  if (normalized.includes('record') || normalized.includes('data-scope')) {
    return 'record-scope';
  }
  if (normalized.includes('time') || normalized.includes('window')) {
    return 'time-window';
  }
  if (normalized.includes('tool')) {
    return 'tool-allowlist';
  }
  if (normalized.includes('policy')) {
    return 'policy-ref';
  }
  if (normalized.includes('release-token') || normalized.startsWith('rt_')) {
    return 'release-token';
  }
  if (normalized.includes('generic-narrow') || normalized.includes('customer')) {
    return 'customer-approved-scope';
  }
  return 'custom';
}

export function normalizeConstraintKind(
  kind: ConsequenceAdmissionConstraintKind | null | undefined,
  id: string,
): ConsequenceAdmissionConstraintKind {
  if (kind === undefined || kind === null) return inferConstraintKind(id);
  if (!isConsequenceAdmissionConstraintKind(kind)) {
    throw new Error(
      `Consequence admission constraint kind must be one of: ${CONSEQUENCE_ADMISSION_CONSTRAINT_KINDS.join(', ')}.`,
    );
  }
  return kind;
}

export function normalizeConstraintParameterDigest(
  value: string | null | undefined,
): string | null {
  if (value === undefined || value === null) return null;
  const normalized = normalizeIdentifier(value, 'constraint.parameterDigest');
  if (!CONSEQUENCE_ADMISSION_CONSTRAINT_PARAMETER_DIGEST_PATTERN.test(normalized)) {
    throw new Error(
      'Consequence admission constraint parameterDigest must be a sha256 digest.',
    );
  }
  return normalized;
}

export function normalizeConstraint(
  input: CreateConsequenceAdmissionConstraintInput,
): ConsequenceAdmissionConstraint {
  const id = normalizeIdentifier(input.id, 'constraint.id');
  return Object.freeze({
    id,
    kind: normalizeConstraintKind(input.kind, id),
    summary: normalizeIdentifier(input.summary, 'constraint.summary'),
    enforcedBy: normalizeIdentifier(input.enforcedBy, 'constraint.enforcedBy'),
    parameterDigest: normalizeConstraintParameterDigest(input.parameterDigest),
  });
}

export function normalizeOptionalIdentifier(
  value: string | null | undefined,
  fieldName: string,
): string | null {
  if (value === undefined || value === null) return null;
  return normalizeIdentifier(value, fieldName);
}

export function normalizeEnumValue<T extends string>(
  value: string,
  allowedValues: readonly T[],
  fieldName: string,
): T {
  const normalized = normalizeIdentifier(value, fieldName);
  if (!allowedValues.includes(normalized as T)) {
    throw new Error(
      `Consequence admission ${fieldName} must be one of: ${allowedValues.join(', ')}.`,
    );
  }
  return normalized as T;
}

export function normalizeEvidenceRef(
  input: ConsequenceAdmissionEvidenceRef,
): ConsequenceAdmissionEvidenceRef {
  return Object.freeze({
    id: normalizeIdentifier(input.id, 'evidence.id'),
    kind: normalizeIdentifier(input.kind, 'evidence.kind'),
    digest: normalizeOptionalIdentifier(input.digest, 'evidence.digest'),
    uri: normalizeOptionalIdentifier(input.uri, 'evidence.uri'),
  });
}

export function normalizeProofRef(input: ConsequenceAdmissionProofRef): ConsequenceAdmissionProofRef {
  return Object.freeze({
    kind: normalizeEnumValue(input.kind, CONSEQUENCE_ADMISSION_PROOF_KINDS, 'proof.kind'),
    id: normalizeIdentifier(input.id, 'proof.id'),
    digest: normalizeOptionalIdentifier(input.digest, 'proof.digest'),
    uri: normalizeOptionalIdentifier(input.uri, 'proof.uri'),
    verifyHint: normalizeIdentifier(input.verifyHint, 'proof.verifyHint'),
  });
}

export function normalizeNativeDecision(
  input: ConsequenceAdmissionNativeDecision | null | undefined,
): ConsequenceAdmissionNativeDecision | null {
  if (!input) return null;
  return Object.freeze({
    surface: normalizeEnumValue(
      input.surface,
      CONSEQUENCE_ADMISSION_NATIVE_SURFACES,
      'nativeDecision.surface',
    ),
    value: normalizeIdentifier(input.value, 'nativeDecision.value'),
    mappedDecision: normalizeEnumValue(
      input.mappedDecision,
      CONSEQUENCE_ADMISSION_DECISIONS,
      'nativeDecision.mappedDecision',
    ),
    mappingReason: normalizeIdentifier(input.mappingReason, 'nativeDecision.mappingReason'),
  });
}

export function normalizeIsoTimestamp(value: string, fieldName: string): string {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    throw new Error(`Consequence admission ${fieldName} must be an ISO timestamp.`);
  }
  return timestamp.toISOString();
}

export function canonicalObject<T extends CanonicalReleaseJsonValue>(value: T): {
  readonly canonical: string;
  readonly digest: string;
} {
  const canonical = canonicalizeReleaseJson(value);
  return Object.freeze({
    canonical,
    digest: `sha256:${createHash('sha256').update(canonical).digest('hex')}`,
  });
}

export function requestIdFor(input: Omit<ConsequenceAdmissionRequest, 'requestId'>): string {
  return canonicalObject({
    version: input.version,
    requestedAt: input.requestedAt,
    packFamily: input.packFamily,
    entryPoint: input.entryPoint,
    proposedConsequence: input.proposedConsequence,
    policyScope: input.policyScope,
    authority: input.authority,
    evidence: input.evidence,
    nativeInputRefs: input.nativeInputRefs,
  } as unknown as CanonicalReleaseJsonValue).digest;
}

export function admissionIdFor(input: {
  readonly decidedAt: string;
  readonly requestId: string;
  readonly decision: ConsequenceAdmissionDecision;
  readonly reasonCodes: readonly string[];
  readonly proofDigests: readonly string[];
}): string {
  return canonicalObject({
    version: CONSEQUENCE_ADMISSION_CONTRACT_VERSION,
    decidedAt: input.decidedAt,
    requestId: input.requestId,
    decision: input.decision,
    reasonCodes: input.reasonCodes,
    proofDigests: input.proofDigests,
  }).digest;
}

export function readonlyCopy<T>(items: readonly T[] | null | undefined): readonly T[] {
  return Object.freeze([...(items ?? [])]);
}

export function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readRequiredString(
  record: Readonly<Record<string, unknown>>,
  fieldName: string,
): string {
  const value = record[fieldName];
  if (typeof value !== 'string') {
    throw new Error(`Consequence admission ${fieldName} requires a non-empty string value.`);
  }
  return normalizeIdentifier(value, fieldName);
}

export function readOptionalString(
  record: Readonly<Record<string, unknown>>,
  fieldName: string,
): string | null {
  const value = record[fieldName];
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    throw new Error(`Consequence admission ${fieldName} must be a string when provided.`);
  }
  return normalizeOptionalIdentifier(value, fieldName);
}

export function readOptionalBoolean(
  record: Readonly<Record<string, unknown>>,
  fieldName: string,
): boolean | null {
  const value = record[fieldName];
  if (value === undefined || value === null) return null;
  if (typeof value !== 'boolean') {
    throw new Error(`Consequence admission ${fieldName} must be a boolean when provided.`);
  }
  return value;
}

export function readOptionalTimestamp(
  record: Readonly<Record<string, unknown>>,
  fieldName: string,
): string | null {
  const value = readOptionalString(record, fieldName);
  return value === null ? null : normalizeIsoTimestamp(value, fieldName);
}

export function normalizePositiveInteger(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new Error(`Consequence admission ${fieldName} must be a positive integer.`);
  }
  return value;
}

export function normalizeStringArray(value: unknown, fieldName: string): readonly string[] {
  if (value === undefined || value === null) return Object.freeze([]);
  if (!Array.isArray(value)) {
    throw new Error(`Consequence admission ${fieldName} must be an array when provided.`);
  }
  return Object.freeze(
    value.map((entry, index) => {
      if (typeof entry !== 'string') {
        throw new Error(
          `Consequence admission ${fieldName}[${index}] must be a string.`,
        );
      }
      return normalizeIdentifier(entry, `${fieldName}[${index}]`);
    }),
  );
}
