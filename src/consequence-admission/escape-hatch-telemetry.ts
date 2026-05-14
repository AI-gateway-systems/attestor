import { createHash } from 'node:crypto';
import {
  canonicalizeReleaseJson,
  type CanonicalReleaseJsonValue,
} from '../release-kernel/release-canonicalization.js';

export const CONSEQUENCE_ESCAPE_HATCH_TELEMETRY_VERSION =
  'attestor.consequence-escape-hatch-telemetry.v1';

export const CONSEQUENCE_ESCAPE_HATCH_IDS = [
  'verify-developer-mode',
  'verify-legacy-flat-ed25519',
  'certificate-legacy-unbounded',
  'customer-gate-proof-skipped',
  'policy-limit-single-process-counter',
  'shadow-break-glass-rollout',
  'no-go-natural-language-bypass',
  'shadow-operator-supplied-redaction',
  'runtime-ca-replacement',
  'local-dev-runtime-profile',
  'hosted-oidc-insecure-http',
  'trusted-proxy-wildcard',
] as const;
export type ConsequenceEscapeHatchId = typeof CONSEQUENCE_ESCAPE_HATCH_IDS[number];

export const CONSEQUENCE_ESCAPE_HATCH_SEVERITIES = [
  'low',
  'medium',
  'high',
] as const;
export type ConsequenceEscapeHatchSeverity =
  typeof CONSEQUENCE_ESCAPE_HATCH_SEVERITIES[number];

export interface ConsequenceEscapeHatchCatalogEntry {
  readonly id: ConsequenceEscapeHatchId;
  readonly label: string;
  readonly severity: ConsequenceEscapeHatchSeverity;
  readonly requiresReason: boolean;
  readonly requiresProductionGate: boolean;
  readonly structuredTelemetryRequired: true;
}

export interface ConsequenceEscapeHatchUsageEventInput {
  readonly escapeHatchId: ConsequenceEscapeHatchId;
  readonly usedAt: string;
  readonly actorRef?: string | null;
  readonly tenantId?: string | null;
  readonly reason?: string | null;
  readonly sourceRef?: string | null;
}

export interface ConsequenceEscapeHatchUsageEvent {
  readonly version: typeof CONSEQUENCE_ESCAPE_HATCH_TELEMETRY_VERSION;
  readonly escapeHatchId: ConsequenceEscapeHatchId;
  readonly usedAt: string;
  readonly actorRefDigest: string | null;
  readonly tenantIdDigest: string | null;
  readonly reasonDigest: string | null;
  readonly sourceRefDigest: string | null;
  readonly rawPayloadStored: false;
  readonly digestOnly: true;
  readonly digest: string;
}

export interface ConsequenceEscapeHatchUsageSummary {
  readonly version: typeof CONSEQUENCE_ESCAPE_HATCH_TELEMETRY_VERSION;
  readonly generatedAt: string;
  readonly totalUsageCount: number;
  readonly byEscapeHatchId: Readonly<Record<ConsequenceEscapeHatchId, number>>;
  readonly highSeverityUsageCount: number;
  readonly reasonMissingCount: number;
  readonly rawPayloadStored: false;
  readonly digestOnly: true;
  readonly digest: string;
}

export const CONSEQUENCE_ESCAPE_HATCH_CATALOG = Object.freeze([
  {
    id: 'verify-developer-mode',
    label: 'Verifier developer mode trusts kit-contained CA roots for local chain-integrity checks.',
    severity: 'medium',
    requiresReason: false,
    requiresProductionGate: true,
    structuredTelemetryRequired: true,
  },
  {
    id: 'verify-legacy-flat-ed25519',
    label: 'Verifier legacy flat Ed25519 mode checks pre-PKI kits.',
    severity: 'medium',
    requiresReason: true,
    requiresProductionGate: true,
    structuredTelemetryRequired: true,
  },
  {
    id: 'certificate-legacy-unbounded',
    label: 'Certificate verification may accept legacy certificates without bounded validity.',
    severity: 'medium',
    requiresReason: true,
    requiresProductionGate: true,
    structuredTelemetryRequired: true,
  },
  {
    id: 'customer-gate-proof-skipped',
    label: 'Customer gate caller explicitly skipped proof requirements.',
    severity: 'high',
    requiresReason: true,
    requiresProductionGate: true,
    structuredTelemetryRequired: true,
  },
  {
    id: 'policy-limit-single-process-counter',
    label: 'Policy limit accepts a single-process counter instead of a shared counter.',
    severity: 'medium',
    requiresReason: false,
    requiresProductionGate: true,
    structuredTelemetryRequired: true,
  },
  {
    id: 'shadow-break-glass-rollout',
    label: 'Shadow activation uses break-glass rollout controls.',
    severity: 'high',
    requiresReason: true,
    requiresProductionGate: true,
    structuredTelemetryRequired: true,
  },
  {
    id: 'no-go-natural-language-bypass',
    label: 'No-go ledger detected or received a natural-language bypass attempt.',
    severity: 'medium',
    requiresReason: false,
    requiresProductionGate: true,
    structuredTelemetryRequired: true,
  },
  {
    id: 'shadow-operator-supplied-redaction',
    label: 'Shadow event redaction was asserted by the operator.',
    severity: 'medium',
    requiresReason: false,
    requiresProductionGate: true,
    structuredTelemetryRequired: true,
  },
  {
    id: 'runtime-ca-replacement',
    label: 'Runtime keyless CA was explicitly replaced.',
    severity: 'high',
    requiresReason: true,
    requiresProductionGate: true,
    structuredTelemetryRequired: true,
  },
  {
    id: 'local-dev-runtime-profile',
    label: 'Runtime selected local-dev profile.',
    severity: 'low',
    requiresReason: false,
    requiresProductionGate: true,
    structuredTelemetryRequired: true,
  },
  {
    id: 'hosted-oidc-insecure-http',
    label: 'Hosted OIDC discovery allowed insecure HTTP.',
    severity: 'medium',
    requiresReason: true,
    requiresProductionGate: true,
    structuredTelemetryRequired: true,
  },
  {
    id: 'trusted-proxy-wildcard',
    label: 'Trusted proxy wildcard override was enabled.',
    severity: 'medium',
    requiresReason: true,
    requiresProductionGate: true,
    structuredTelemetryRequired: true,
  },
] as const satisfies readonly ConsequenceEscapeHatchCatalogEntry[]);

function digestText(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
}

function normalizeTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Escape-hatch usage event requires a valid usedAt timestamp.');
  }
  return parsed.toISOString();
}

function canonicalDigest(value: CanonicalReleaseJsonValue): string {
  const canonical = canonicalizeReleaseJson(value);
  return `sha256:${createHash('sha256').update(canonical).digest('hex')}`;
}

function emptyCounts(): Record<ConsequenceEscapeHatchId, number> {
  return Object.fromEntries(
    CONSEQUENCE_ESCAPE_HATCH_IDS.map((id) => [id, 0]),
  ) as Record<ConsequenceEscapeHatchId, number>;
}

export function createConsequenceEscapeHatchUsageEvent(
  input: ConsequenceEscapeHatchUsageEventInput,
): ConsequenceEscapeHatchUsageEvent {
  if (!(CONSEQUENCE_ESCAPE_HATCH_IDS as readonly string[]).includes(input.escapeHatchId)) {
    throw new Error(`Unknown escape-hatch id: ${input.escapeHatchId}`);
  }
  const usedAt = normalizeTimestamp(input.usedAt);
  const reason = normalizeOptionalString(input.reason);
  const event: Omit<ConsequenceEscapeHatchUsageEvent, 'digest'> = Object.freeze({
    version: CONSEQUENCE_ESCAPE_HATCH_TELEMETRY_VERSION,
    escapeHatchId: input.escapeHatchId,
    usedAt,
    actorRefDigest: normalizeOptionalString(input.actorRef)
      ? digestText(normalizeOptionalString(input.actorRef) as string)
      : null,
    tenantIdDigest: normalizeOptionalString(input.tenantId)
      ? digestText(normalizeOptionalString(input.tenantId) as string)
      : null,
    reasonDigest: reason ? digestText(reason) : null,
    sourceRefDigest: normalizeOptionalString(input.sourceRef)
      ? digestText(normalizeOptionalString(input.sourceRef) as string)
      : null,
    rawPayloadStored: false,
    digestOnly: true,
  });
  return Object.freeze({
    ...event,
    digest: canonicalDigest(event as unknown as CanonicalReleaseJsonValue),
  });
}

export function summarizeConsequenceEscapeHatchUsage(
  events: readonly ConsequenceEscapeHatchUsageEvent[],
  generatedAt = new Date(0).toISOString(),
): ConsequenceEscapeHatchUsageSummary {
  const byEscapeHatchId = emptyCounts();
  const highSeverity = new Set<ConsequenceEscapeHatchId>(
    CONSEQUENCE_ESCAPE_HATCH_CATALOG
      .filter((entry) => entry.severity === 'high')
      .map((entry) => entry.id),
  );
  const requiresReason = new Set<ConsequenceEscapeHatchId>(
    CONSEQUENCE_ESCAPE_HATCH_CATALOG
      .filter((entry) => entry.requiresReason)
      .map((entry) => entry.id),
  );
  let highSeverityUsageCount = 0;
  let reasonMissingCount = 0;
  for (const event of events) {
    byEscapeHatchId[event.escapeHatchId] += 1;
    if (highSeverity.has(event.escapeHatchId)) highSeverityUsageCount += 1;
    if (requiresReason.has(event.escapeHatchId) && !event.reasonDigest) {
      reasonMissingCount += 1;
    }
  }
  const summary: Omit<ConsequenceEscapeHatchUsageSummary, 'digest'> = Object.freeze({
    version: CONSEQUENCE_ESCAPE_HATCH_TELEMETRY_VERSION,
    generatedAt: normalizeTimestamp(generatedAt),
    totalUsageCount: events.length,
    byEscapeHatchId: Object.freeze({ ...byEscapeHatchId }),
    highSeverityUsageCount,
    reasonMissingCount,
    rawPayloadStored: false,
    digestOnly: true,
  });
  return Object.freeze({
    ...summary,
    digest: canonicalDigest(summary as unknown as CanonicalReleaseJsonValue),
  });
}

export function consequenceEscapeHatchTelemetryDescriptor(): {
  readonly version: typeof CONSEQUENCE_ESCAPE_HATCH_TELEMETRY_VERSION;
  readonly escapeHatchIds: typeof CONSEQUENCE_ESCAPE_HATCH_IDS;
  readonly catalog: typeof CONSEQUENCE_ESCAPE_HATCH_CATALOG;
  readonly rawPayloadStored: false;
  readonly digestOnly: true;
} {
  return Object.freeze({
    version: CONSEQUENCE_ESCAPE_HATCH_TELEMETRY_VERSION,
    escapeHatchIds: CONSEQUENCE_ESCAPE_HATCH_IDS,
    catalog: CONSEQUENCE_ESCAPE_HATCH_CATALOG,
    rawPayloadStored: false,
    digestOnly: true,
  });
}
