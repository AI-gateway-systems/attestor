import { createHash } from 'node:crypto';
import {
  canonicalizeReleaseJson,
  type CanonicalReleaseJsonValue,
} from '../release-kernel/release-canonicalization.js';
import {
  CONSEQUENCE_DATA_MINIMIZATION_REDACTION_POLICY_VERSION,
} from './data-minimization-redaction-policy.js';

export const POLICY_FOUNDRY_AUTHORITY_RELATIONSHIP_CONTEXT_VERSION =
  'attestor.policy-foundry-authority-relationship-context.v1';

export const POLICY_FOUNDRY_AUTHORITY_ENTITY_KINDS = [
  'actor',
  'group',
  'service-account',
  'tenant',
  'organization',
  'downstream-system',
  'action-surface',
  'policy-template',
  'approval-workflow',
] as const;
export type PolicyFoundryAuthorityEntityKind =
  typeof POLICY_FOUNDRY_AUTHORITY_ENTITY_KINDS[number];

export const POLICY_FOUNDRY_AUTHORITY_RELATION_KINDS = [
  'owner',
  'approver',
  'delegate',
  'reviewer',
  'operator',
  'tenant-member',
  'scope-owner',
  'break-glass-approver',
] as const;
export type PolicyFoundryAuthorityRelationKind =
  typeof POLICY_FOUNDRY_AUTHORITY_RELATION_KINDS[number];

export const POLICY_FOUNDRY_AUTHORITY_RELATIONSHIP_SOURCES = [
  'customer-manifest',
  'idp-directory',
  'access-log',
  'approval-workflow',
  'manual-review',
  'llm-suggested',
] as const;
export type PolicyFoundryAuthorityRelationshipSource =
  typeof POLICY_FOUNDRY_AUTHORITY_RELATIONSHIP_SOURCES[number];

export const POLICY_FOUNDRY_AUTHORITY_CONTEXT_STATUSES = [
  'not-provided',
  'needs-customer-binding',
  'review-ready',
] as const;
export type PolicyFoundryAuthorityRelationshipContextStatus =
  typeof POLICY_FOUNDRY_AUTHORITY_CONTEXT_STATUSES[number];

export const POLICY_FOUNDRY_AUTHORITY_CONTEXT_NO_GO_REASONS = [
  'authority-relationships-missing',
  'owner-binding-missing',
  'approver-binding-missing',
  'tenant-scope-missing',
  'unscoped-delegation',
  'expired-authority-grant',
  'missing-authority-evidence-digest',
  'llm-authority-source',
] as const;
export type PolicyFoundryAuthorityRelationshipNoGoReason =
  typeof POLICY_FOUNDRY_AUTHORITY_CONTEXT_NO_GO_REASONS[number];

export interface PolicyFoundryAuthorityRelationshipInput {
  readonly subjectKind: PolicyFoundryAuthorityEntityKind;
  readonly subjectRef: string;
  readonly relation: PolicyFoundryAuthorityRelationKind;
  readonly objectKind: PolicyFoundryAuthorityEntityKind;
  readonly objectRef: string;
  readonly source: PolicyFoundryAuthorityRelationshipSource;
  readonly evidenceDigest?: string | null;
  readonly scopeKind?: PolicyFoundryAuthorityEntityKind | null;
  readonly scopeRef?: string | null;
  readonly observedAt?: string | null;
  readonly expiresAt?: string | null;
}

export interface CreatePolicyFoundryAuthorityRelationshipContextInput {
  readonly generatedAt?: string | null;
  readonly actionSurface?: string | null;
  readonly domain?: string | null;
  readonly tenantScopeRef?: string | null;
  readonly relationships?: readonly PolicyFoundryAuthorityRelationshipInput[] | null;
  readonly requiredRelations?: readonly PolicyFoundryAuthorityRelationKind[] | null;
}

export interface PolicyFoundryAuthorityRelationship {
  readonly subjectKind: PolicyFoundryAuthorityEntityKind;
  readonly subjectDigest: string;
  readonly relation: PolicyFoundryAuthorityRelationKind;
  readonly objectKind: PolicyFoundryAuthorityEntityKind;
  readonly objectDigest: string;
  readonly source: PolicyFoundryAuthorityRelationshipSource;
  readonly evidenceDigest: string | null;
  readonly scopeKind: PolicyFoundryAuthorityEntityKind | null;
  readonly scopeDigest: string | null;
  readonly observedAt: string | null;
  readonly expiresAt: string | null;
  readonly reasonCodes: readonly string[];
}

export interface PolicyFoundryAuthorityRelationshipCounts {
  readonly relationshipCount: number;
  readonly ownerCount: number;
  readonly approverCount: number;
  readonly delegateCount: number;
  readonly reviewerCount: number;
  readonly tenantRelationshipCount: number;
  readonly serviceAccountRelationshipCount: number;
  readonly scopedRelationshipCount: number;
  readonly evidenceBoundRelationshipCount: number;
  readonly expiredGrantCount: number;
  readonly llmSuggestedRelationshipCount: number;
}

export interface PolicyFoundryAuthorityRelationshipContext {
  readonly version: typeof POLICY_FOUNDRY_AUTHORITY_RELATIONSHIP_CONTEXT_VERSION;
  readonly generatedAt: string;
  readonly actionSurface: string | null;
  readonly domain: string | null;
  readonly tenantScopeDigest: string | null;
  readonly status: PolicyFoundryAuthorityRelationshipContextStatus;
  readonly counts: PolicyFoundryAuthorityRelationshipCounts;
  readonly relationships: readonly PolicyFoundryAuthorityRelationship[];
  readonly requiredRelations: readonly PolicyFoundryAuthorityRelationKind[];
  readonly missingRelations: readonly PolicyFoundryAuthorityRelationKind[];
  readonly noGoReasons: readonly PolicyFoundryAuthorityRelationshipNoGoReason[];
  readonly nextSafeStep: string;
  readonly approvalRequired: true;
  readonly autoEnforce: false;
  readonly rawPayloadStored: false;
  readonly productionReady: false;
  readonly activatesEnforcement: false;
  readonly authorityDecisionAllowed: false;
  readonly storesRawIdentity: false;
  readonly digestOnly: true;
  readonly dataMinimizationPolicyVersion: typeof CONSEQUENCE_DATA_MINIMIZATION_REDACTION_POLICY_VERSION;
  readonly dataMinimizationSurfaceKind: 'policy-foundry-authority-relationship-context';
  readonly limitation: string;
  readonly canonical: string;
  readonly digest: string;
}

export interface PolicyFoundryAuthorityRelationshipContextDescriptor {
  readonly version: typeof POLICY_FOUNDRY_AUTHORITY_RELATIONSHIP_CONTEXT_VERSION;
  readonly entityKinds: typeof POLICY_FOUNDRY_AUTHORITY_ENTITY_KINDS;
  readonly relationKinds: typeof POLICY_FOUNDRY_AUTHORITY_RELATION_KINDS;
  readonly sources: typeof POLICY_FOUNDRY_AUTHORITY_RELATIONSHIP_SOURCES;
  readonly statuses: typeof POLICY_FOUNDRY_AUTHORITY_CONTEXT_STATUSES;
  readonly noGoReasons: typeof POLICY_FOUNDRY_AUTHORITY_CONTEXT_NO_GO_REASONS;
  readonly approvalRequired: true;
  readonly autoEnforce: false;
  readonly rawPayloadStored: false;
  readonly productionReady: false;
  readonly activatesEnforcement: false;
  readonly authorityDecisionAllowed: false;
  readonly storesRawIdentity: false;
  readonly digestOnly: true;
  readonly dataMinimizationPolicyVersion: typeof CONSEQUENCE_DATA_MINIMIZATION_REDACTION_POLICY_VERSION;
  readonly dataMinimizationSurfaceKind: 'policy-foundry-authority-relationship-context';
}

function canonicalObject(value: CanonicalReleaseJsonValue): {
  readonly canonical: string;
  readonly digest: string;
} {
  const canonical = canonicalizeReleaseJson(value);
  return Object.freeze({
    canonical,
    digest: `sha256:${createHash('sha256').update(canonical).digest('hex')}`,
  });
}

function digestText(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function nonEmptyString(value: string, fieldName: string): string {
  if (value.trim().length === 0) {
    throw new Error(`Policy Foundry authority relationship context ${fieldName} must be non-empty.`);
  }
  return value;
}

function normalizeIsoTimestamp(
  value: string | null | undefined,
  fieldName: string,
): string | null {
  if (value === null || value === undefined) return null;
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    throw new Error(`Policy Foundry authority relationship context ${fieldName} must be an ISO timestamp.`);
  }
  return timestamp.toISOString();
}

function normalizeGeneratedAt(value: string | null | undefined): string {
  const raw = value ?? new Date().toISOString();
  const timestamp = new Date(raw);
  if (Number.isNaN(timestamp.getTime())) {
    throw new Error('Policy Foundry authority relationship context generatedAt must be an ISO timestamp.');
  }
  return timestamp.toISOString();
}

function normalizedEvidenceDigest(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const raw = nonEmptyString(value, 'evidenceDigest');
  if (!raw.startsWith('sha256:')) {
    throw new Error('Policy Foundry authority relationship context evidenceDigest must be a sha256 digest.');
  }
  return raw;
}

function scopedDigest(input: {
  readonly kind: PolicyFoundryAuthorityEntityKind | null | undefined;
  readonly ref: string | null | undefined;
}): string | null {
  if (input.ref === null || input.ref === undefined) return null;
  const kind = input.kind ?? 'tenant';
  return digestText(`${kind}:${nonEmptyString(input.ref, 'scopeRef')}`);
}

function normalizeRelationship(
  input: PolicyFoundryAuthorityRelationshipInput,
  generatedAt: string,
): PolicyFoundryAuthorityRelationship {
  const subjectRef = nonEmptyString(input.subjectRef, 'subjectRef');
  const objectRef = nonEmptyString(input.objectRef, 'objectRef');
  const observedAt = normalizeIsoTimestamp(input.observedAt, 'observedAt');
  const expiresAt = normalizeIsoTimestamp(input.expiresAt, 'expiresAt');
  const evidenceDigest = normalizedEvidenceDigest(input.evidenceDigest);
  const scopeDigest = scopedDigest({
    kind: input.scopeKind,
    ref: input.scopeRef,
  });
  const reasonCodes: string[] = [];

  if (evidenceDigest === null) reasonCodes.push('missing-authority-evidence-digest');
  if (input.source === 'llm-suggested') reasonCodes.push('llm-authority-source');
  if (input.relation === 'delegate' && scopeDigest === null) reasonCodes.push('unscoped-delegation');
  if (expiresAt !== null && new Date(expiresAt).getTime() <= new Date(generatedAt).getTime()) {
    reasonCodes.push('expired-authority-grant');
  }

  return Object.freeze({
    subjectKind: input.subjectKind,
    subjectDigest: digestText(`${input.subjectKind}:${subjectRef}`),
    relation: input.relation,
    objectKind: input.objectKind,
    objectDigest: digestText(`${input.objectKind}:${objectRef}`),
    source: input.source,
    evidenceDigest,
    scopeKind: input.scopeKind ?? null,
    scopeDigest,
    observedAt,
    expiresAt,
    reasonCodes: Object.freeze([...new Set(reasonCodes)].sort()),
  });
}

function deriveTenantScopeDigest(input: {
  readonly tenantScopeRef: string | null | undefined;
  readonly relationships: readonly PolicyFoundryAuthorityRelationshipInput[];
}): string | null {
  const explicit = scopedDigest({
    kind: 'tenant',
    ref: input.tenantScopeRef,
  });
  if (explicit !== null) return explicit;
  const tenantRelationship = input.relationships.find((relationship) =>
    relationship.subjectKind === 'tenant' || relationship.objectKind === 'tenant'
  );
  if (tenantRelationship === undefined) return null;
  const tenantRef = tenantRelationship.subjectKind === 'tenant'
    ? tenantRelationship.subjectRef
    : tenantRelationship.objectRef;
  return digestText(`tenant:${nonEmptyString(tenantRef, 'tenantScopeRef')}`);
}

function relationshipCounts(
  relationships: readonly PolicyFoundryAuthorityRelationship[],
): PolicyFoundryAuthorityRelationshipCounts {
  const relationCount = (relation: PolicyFoundryAuthorityRelationKind): number =>
    relationships.filter((item) => item.relation === relation).length;

  return Object.freeze({
    relationshipCount: relationships.length,
    ownerCount: relationCount('owner') + relationCount('scope-owner'),
    approverCount: relationCount('approver') + relationCount('break-glass-approver'),
    delegateCount: relationCount('delegate'),
    reviewerCount: relationCount('reviewer'),
    tenantRelationshipCount: relationships.filter((item) =>
      item.subjectKind === 'tenant' || item.objectKind === 'tenant'
    ).length,
    serviceAccountRelationshipCount: relationships.filter((item) =>
      item.subjectKind === 'service-account' || item.objectKind === 'service-account'
    ).length,
    scopedRelationshipCount: relationships.filter((item) => item.scopeDigest !== null).length,
    evidenceBoundRelationshipCount: relationships.filter((item) => item.evidenceDigest !== null).length,
    expiredGrantCount: relationships.filter((item) =>
      item.reasonCodes.includes('expired-authority-grant')
    ).length,
    llmSuggestedRelationshipCount: relationships.filter((item) => item.source === 'llm-suggested').length,
  });
}

function missingRequiredRelations(
  relationships: readonly PolicyFoundryAuthorityRelationship[],
  requiredRelations: readonly PolicyFoundryAuthorityRelationKind[],
): readonly PolicyFoundryAuthorityRelationKind[] {
  const present = new Set(relationships.map((relationship) => relationship.relation));
  return Object.freeze(requiredRelations.filter((relation) => !present.has(relation)));
}

function noGoReasons(input: {
  readonly relationships: readonly PolicyFoundryAuthorityRelationship[];
  readonly missingRelations: readonly PolicyFoundryAuthorityRelationKind[];
  readonly tenantScopeDigest: string | null;
}): readonly PolicyFoundryAuthorityRelationshipNoGoReason[] {
  const reasons = new Set<PolicyFoundryAuthorityRelationshipNoGoReason>();
  if (input.relationships.length === 0) reasons.add('authority-relationships-missing');
  if (input.missingRelations.includes('owner')) reasons.add('owner-binding-missing');
  if (input.missingRelations.includes('approver')) reasons.add('approver-binding-missing');
  if (input.tenantScopeDigest === null) reasons.add('tenant-scope-missing');
  for (const relationship of input.relationships) {
    for (const reason of relationship.reasonCodes) {
      if (POLICY_FOUNDRY_AUTHORITY_CONTEXT_NO_GO_REASONS.includes(
        reason as PolicyFoundryAuthorityRelationshipNoGoReason,
      )) {
        reasons.add(reason as PolicyFoundryAuthorityRelationshipNoGoReason);
      }
    }
  }
  return Object.freeze([...reasons].sort());
}

function statusFor(input: {
  readonly relationships: readonly PolicyFoundryAuthorityRelationship[];
  readonly noGoReasons: readonly PolicyFoundryAuthorityRelationshipNoGoReason[];
}): PolicyFoundryAuthorityRelationshipContextStatus {
  if (input.relationships.length === 0) return 'not-provided';
  if (input.noGoReasons.length > 0) return 'needs-customer-binding';
  return 'review-ready';
}

function nextSafeStep(
  status: PolicyFoundryAuthorityRelationshipContextStatus,
): string {
  switch (status) {
    case 'not-provided':
      return 'Collect owner, approver, tenant, delegation, and scope relationships from customer-controlled authority sources.';
    case 'needs-customer-binding':
      return 'Resolve missing or unsafe authority bindings, then regenerate the digest-only authority context for review.';
    case 'review-ready':
      return 'Attach this digest-only authority context to the Policy Foundry review packet; do not activate enforcement from it alone.';
  }
}

export function createPolicyFoundryAuthorityRelationshipContext(
  input: CreatePolicyFoundryAuthorityRelationshipContextInput,
): PolicyFoundryAuthorityRelationshipContext {
  const generatedAt = normalizeGeneratedAt(input.generatedAt);
  const rawRelationships = [...(input.relationships ?? [])];
  const relationships = Object.freeze(
    rawRelationships
      .map((relationship) => normalizeRelationship(relationship, generatedAt))
      .sort((left, right) =>
        left.subjectDigest.localeCompare(right.subjectDigest) ||
        left.relation.localeCompare(right.relation) ||
        left.objectDigest.localeCompare(right.objectDigest)
      ),
  );
  const tenantScopeDigest = deriveTenantScopeDigest({
    tenantScopeRef: input.tenantScopeRef,
    relationships: rawRelationships,
  });
  const requiredRelations = Object.freeze([...(input.requiredRelations ?? ['owner', 'approver'])]);
  const missingRelations = missingRequiredRelations(relationships, requiredRelations);
  const reasons = noGoReasons({
    relationships,
    missingRelations,
    tenantScopeDigest,
  });
  const status = statusFor({
    relationships,
    noGoReasons: reasons,
  });
  const counts = relationshipCounts(relationships);

  const canonicalPayload: Omit<PolicyFoundryAuthorityRelationshipContext, 'canonical' | 'digest'> = {
    version: POLICY_FOUNDRY_AUTHORITY_RELATIONSHIP_CONTEXT_VERSION,
    generatedAt,
    actionSurface: input.actionSurface ?? null,
    domain: input.domain ?? null,
    tenantScopeDigest,
    status,
    counts,
    relationships,
    requiredRelations,
    missingRelations,
    noGoReasons: reasons,
    nextSafeStep: nextSafeStep(status),
    approvalRequired: true,
    autoEnforce: false,
    rawPayloadStored: false,
    productionReady: false,
    activatesEnforcement: false,
    authorityDecisionAllowed: false,
    storesRawIdentity: false,
    digestOnly: true,
    dataMinimizationPolicyVersion: CONSEQUENCE_DATA_MINIMIZATION_REDACTION_POLICY_VERSION,
    dataMinimizationSurfaceKind: 'policy-foundry-authority-relationship-context',
    limitation:
      'Authority Relationship Context is customer-review material only; it records digest-only relationships and cannot prove or grant authority by itself.',
  };
  const { canonical, digest } = canonicalObject(
    canonicalPayload as unknown as CanonicalReleaseJsonValue,
  );

  return Object.freeze({
    ...canonicalPayload,
    canonical,
    digest,
  });
}

export function policyFoundryAuthorityRelationshipContextDescriptor():
PolicyFoundryAuthorityRelationshipContextDescriptor {
  return Object.freeze({
    version: POLICY_FOUNDRY_AUTHORITY_RELATIONSHIP_CONTEXT_VERSION,
    entityKinds: POLICY_FOUNDRY_AUTHORITY_ENTITY_KINDS,
    relationKinds: POLICY_FOUNDRY_AUTHORITY_RELATION_KINDS,
    sources: POLICY_FOUNDRY_AUTHORITY_RELATIONSHIP_SOURCES,
    statuses: POLICY_FOUNDRY_AUTHORITY_CONTEXT_STATUSES,
    noGoReasons: POLICY_FOUNDRY_AUTHORITY_CONTEXT_NO_GO_REASONS,
    approvalRequired: true,
    autoEnforce: false,
    rawPayloadStored: false,
    productionReady: false,
    activatesEnforcement: false,
    authorityDecisionAllowed: false,
    storesRawIdentity: false,
    digestOnly: true,
    dataMinimizationPolicyVersion: CONSEQUENCE_DATA_MINIMIZATION_REDACTION_POLICY_VERSION,
    dataMinimizationSurfaceKind: 'policy-foundry-authority-relationship-context',
  });
}
