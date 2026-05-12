import { createHash } from 'node:crypto';
import {
  canonicalizeReleaseJson,
  type CanonicalReleaseJsonValue,
} from '../release-kernel/release-canonicalization.js';
import {
  type ActionSurfaceProfile,
} from './action-surface-profiler.js';
import {
  type AttestorGeneratedIntegrationArtifactKind,
  type AttestorIntegrationMode,
} from './integration-mode-readiness.js';

export const ACTION_SURFACE_INTEGRATION_ARTIFACTS_VERSION =
  'attestor.action-surface-integration-artifacts.v1';

export const ACTION_SURFACE_INTEGRATION_ARTIFACT_REVIEW_STATUS = [
  'requires-review',
] as const;
export type ActionSurfaceIntegrationArtifactReviewStatus =
  typeof ACTION_SURFACE_INTEGRATION_ARTIFACT_REVIEW_STATUS[number];

export interface CreateActionSurfaceIntegrationArtifactBundleInput {
  readonly profiles: readonly ActionSurfaceProfile[];
  readonly generatedAt?: string | null;
  readonly attestorBaseUrl?: string | null;
}

export interface ActionSurfaceIntegrationArtifact {
  readonly artifactId: string;
  readonly kind: AttestorGeneratedIntegrationArtifactKind;
  readonly actionSurface: string;
  readonly mode: AttestorIntegrationMode;
  readonly domain: string | null;
  readonly downstreamSystem: string | null;
  readonly operationRefs: readonly string[];
  readonly template: Readonly<Record<string, CanonicalReleaseJsonValue>>;
  readonly requiredReview: true;
  readonly rawPayloadStored: false;
  readonly productionReady: false;
  readonly digest: string;
}

export interface ActionSurfaceIntegrationArtifactBundle {
  readonly version: typeof ACTION_SURFACE_INTEGRATION_ARTIFACTS_VERSION;
  readonly generatedAt: string;
  readonly profileCount: number;
  readonly artifactCount: number;
  readonly artifacts: readonly ActionSurfaceIntegrationArtifact[];
  readonly artifactKinds: readonly AttestorGeneratedIntegrationArtifactKind[];
  readonly reviewStatus: ActionSurfaceIntegrationArtifactReviewStatus;
  readonly approvalRequired: true;
  readonly autoEnforce: false;
  readonly rawPayloadStored: false;
  readonly productionReady: false;
  readonly nonBypassableClaimAllowed: false;
  readonly limitations: readonly string[];
  readonly canonical: string;
  readonly digest: string;
}

export interface ActionSurfaceIntegrationArtifactsDescriptor {
  readonly version: typeof ACTION_SURFACE_INTEGRATION_ARTIFACTS_VERSION;
  readonly reviewStatus: ActionSurfaceIntegrationArtifactReviewStatus;
  readonly approvalRequired: true;
  readonly autoEnforce: false;
  readonly rawPayloadStored: false;
  readonly productionReady: false;
  readonly nonBypassableClaimAllowed: false;
  readonly outputIsReviewDraftOnly: true;
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

function hashCanonical(value: CanonicalReleaseJsonValue): string {
  return canonicalObject(value).digest;
}

function normalizeIsoTimestamp(
  value: string | null | undefined,
  fallback: string,
  fieldName: string,
): string {
  const raw = value ?? fallback;
  const timestamp = new Date(raw);
  if (Number.isNaN(timestamp.getTime())) {
    throw new Error(`Action surface integration artifacts ${fieldName} must be an ISO timestamp.`);
  }
  return timestamp.toISOString();
}

function normalizeBaseUrl(value: string | null | undefined): string {
  const raw = value?.trim() || 'https://attestor.example.invalid';
  const parsed = new URL(raw);
  if (parsed.protocol !== 'https:') {
    throw new Error('Action surface integration artifacts attestorBaseUrl must use https.');
  }
  parsed.hash = '';
  parsed.search = '';
  return parsed.toString().replace(/\/$/u, '');
}

function operationValue(profile: ActionSurfaceProfile, prefix: string): string | null {
  const ref = profile.operationRefs.find((item) => item.startsWith(prefix));
  if (!ref) return null;
  return ref.slice(prefix.length);
}

function httpOperation(profile: ActionSurfaceProfile): {
  readonly method: string | null;
  readonly path: string | null;
} {
  const ref = profile.operationRefs.find((item) => /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|TRACE) /u.test(item));
  if (!ref) return { method: null, path: null };
  const [method, ...pathParts] = ref.split(' ');
  return {
    method: method ?? null,
    path: pathParts.join(' ') || null,
  };
}

function baseTemplate(input: {
  readonly profile: ActionSurfaceProfile;
  readonly baseUrl: string;
}): Readonly<Record<string, CanonicalReleaseJsonValue>> {
  return Object.freeze({
    actionSurface: input.profile.actionSurface,
    downstreamSystem: input.profile.downstreamSystem,
    domain: input.profile.domain,
    attestorAdmissionEndpoint: `${input.baseUrl}/api/v1/admissions`,
    failClosed: true,
    idempotencyRequired: true,
    replayProtectionRequired: true,
    tenantBoundaryRequired: true,
    customerReviewRequired: true,
    generatedArtifactReviewRequired: true,
  } as const);
}

function gatewayProxyTemplate(
  profile: ActionSurfaceProfile,
  baseUrl: string,
): Readonly<Record<string, CanonicalReleaseJsonValue>> {
  const operation = httpOperation(profile);
  return Object.freeze({
    ...baseTemplate({ profile, baseUrl }),
    pattern: 'gateway-proxy',
    envoyExtAuthz: {
      authorizationService: `${baseUrl}/api/v1/admissions`,
      pathMatcher: operation.path ?? '<downstream-path>',
      method: operation.method ?? '<http-method>',
      failureModeAllow: false,
    },
    nginxAuthRequest: {
      authRequestPath: '/_attestor_auth',
      protectedPath: operation.path ?? '<downstream-path>',
      failClosedOnNon2xx: true,
    },
  } as const);
}

function mcpGatewayTemplate(
  profile: ActionSurfaceProfile,
  baseUrl: string,
): Readonly<Record<string, CanonicalReleaseJsonValue>> {
  return Object.freeze({
    ...baseTemplate({ profile, baseUrl }),
    pattern: 'mcp-tool-gateway',
    toolName: operationValue(profile, 'tool:') ?? profile.action ?? '<tool-name>',
    gatewayOwnsToolCredential: true,
    agentDirectToolCredentialAllowed: false,
  } as const);
}

function sidecarTemplate(
  profile: ActionSurfaceProfile,
  baseUrl: string,
): Readonly<Record<string, CanonicalReleaseJsonValue>> {
  return Object.freeze({
    ...baseTemplate({ profile, baseUrl }),
    pattern: 'sidecar-ext-authz',
    workflowRef: operationValue(profile, 'workflow:') ?? '<workflow-ref>',
    sidecarDelegatesAuthorization: true,
    workloadSelectorReviewRequired: true,
  } as const);
}

function providerConnectorTemplate(
  profile: ActionSurfaceProfile,
  baseUrl: string,
): Readonly<Record<string, CanonicalReleaseJsonValue>> {
  return Object.freeze({
    ...baseTemplate({ profile, baseUrl }),
    pattern: 'provider-native-connector',
    provider: profile.downstreamSystem ?? '<provider>',
    providerDelegationRequired: true,
    providerIdempotencyRequired: true,
  } as const);
}

function verifierTemplate(
  profile: ActionSurfaceProfile,
  baseUrl: string,
): Readonly<Record<string, CanonicalReleaseJsonValue>> {
  return Object.freeze({
    ...baseTemplate({ profile, baseUrl }),
    pattern: 'verifier-helper-config',
    acceptOnlyDecisions: Object.freeze(['admit', 'narrow']),
    rejectOnReviewRequired: true,
    rejectOnMissingPresentationBinding: true,
  } as const);
}

function credentialIsolationTemplate(
  profile: ActionSurfaceProfile,
  baseUrl: string,
): Readonly<Record<string, CanonicalReleaseJsonValue>> {
  return Object.freeze({
    ...baseTemplate({ profile, baseUrl }),
    pattern: 'credential-isolation-plan',
    currentCredentialPosture: profile.credentialPosture,
    targetCredentialPosture: profile.recommendedIntegrationMode === 'provider-native-connector'
      ? 'provider-native-delegation'
      : 'gateway-held-secret',
    agentDirectCredentialAllowed: false,
  } as const);
}

function policyTwinTemplate(
  profile: ActionSurfaceProfile,
  baseUrl: string,
): Readonly<Record<string, CanonicalReleaseJsonValue>> {
  return Object.freeze({
    ...baseTemplate({ profile, baseUrl }),
    pattern: 'policy-twin-backtest',
    requiredBeforeEnforcement: true,
    minimumRepresentativeShadowTrafficRequired: true,
  } as const);
}

function redTeamReplayTemplate(
  profile: ActionSurfaceProfile,
  baseUrl: string,
): Readonly<Record<string, CanonicalReleaseJsonValue>> {
  return Object.freeze({
    ...baseTemplate({ profile, baseUrl }),
    pattern: 'red-team-replay-fixture',
    scenarios: Object.freeze([
      'unknown-actor',
      'missing-evidence',
      'duplicate-request',
      'foreign-tenant-record',
      'direct-credential-bypass',
    ]),
  } as const);
}

function sdkSnippetTemplate(
  profile: ActionSurfaceProfile,
  baseUrl: string,
): Readonly<Record<string, CanonicalReleaseJsonValue>> {
  return Object.freeze({
    ...baseTemplate({ profile, baseUrl }),
    pattern: 'sdk-snippet',
    callBeforeExecution: true,
    shadowOnlyUntilReviewed: true,
  } as const);
}

function protectedAdapterTemplate(
  profile: ActionSurfaceProfile,
  baseUrl: string,
): Readonly<Record<string, CanonicalReleaseJsonValue>> {
  return Object.freeze({
    ...baseTemplate({ profile, baseUrl }),
    pattern: 'protected-adapter-skeleton',
    adapterMustVerifyBeforeExecute: true,
    adapterMustEmitExecutionReceipt: true,
  } as const);
}

function artifactKindsForMode(
  mode: AttestorIntegrationMode,
): readonly AttestorGeneratedIntegrationArtifactKind[] {
  switch (mode) {
    case 'advisory-api':
      return Object.freeze(['sdk-snippet', 'policy-twin-backtest']);
    case 'shadow-capture-sdk':
      return Object.freeze(['sdk-snippet', 'policy-twin-backtest', 'red-team-replay-fixture']);
    case 'sdk-gate':
      return Object.freeze([
        'sdk-snippet',
        'verifier-helper-config',
        'protected-adapter-skeleton',
        'policy-twin-backtest',
        'red-team-replay-fixture',
      ]);
    case 'gateway-proxy':
      return Object.freeze([
        'gateway-proxy-config',
        'verifier-helper-config',
        'credential-isolation-plan',
        'policy-twin-backtest',
        'red-team-replay-fixture',
      ]);
    case 'mcp-tool-gateway':
      return Object.freeze([
        'mcp-tool-gateway-config',
        'verifier-helper-config',
        'credential-isolation-plan',
        'policy-twin-backtest',
        'red-team-replay-fixture',
      ]);
    case 'sidecar-ext-authz':
      return Object.freeze([
        'sidecar-ext-authz-config',
        'verifier-helper-config',
        'credential-isolation-plan',
        'policy-twin-backtest',
        'red-team-replay-fixture',
      ]);
    case 'provider-native-connector':
      return Object.freeze([
        'provider-native-connector-plan',
        'verifier-helper-config',
        'credential-isolation-plan',
        'policy-twin-backtest',
        'red-team-replay-fixture',
      ]);
  }
}

function templateFor(
  kind: AttestorGeneratedIntegrationArtifactKind,
  profile: ActionSurfaceProfile,
  baseUrl: string,
): Readonly<Record<string, CanonicalReleaseJsonValue>> {
  switch (kind) {
    case 'sdk-snippet':
      return sdkSnippetTemplate(profile, baseUrl);
    case 'verifier-helper-config':
      return verifierTemplate(profile, baseUrl);
    case 'protected-adapter-skeleton':
      return protectedAdapterTemplate(profile, baseUrl);
    case 'gateway-proxy-config':
      return gatewayProxyTemplate(profile, baseUrl);
    case 'mcp-tool-gateway-config':
      return mcpGatewayTemplate(profile, baseUrl);
    case 'sidecar-ext-authz-config':
      return sidecarTemplate(profile, baseUrl);
    case 'provider-native-connector-plan':
      return providerConnectorTemplate(profile, baseUrl);
    case 'credential-isolation-plan':
      return credentialIsolationTemplate(profile, baseUrl);
    case 'policy-twin-backtest':
      return policyTwinTemplate(profile, baseUrl);
    case 'red-team-replay-fixture':
      return redTeamReplayTemplate(profile, baseUrl);
  }
}

function artifactFor(input: {
  readonly kind: AttestorGeneratedIntegrationArtifactKind;
  readonly profile: ActionSurfaceProfile;
  readonly baseUrl: string;
}): ActionSurfaceIntegrationArtifact {
  const template = templateFor(input.kind, input.profile, input.baseUrl);
  const digest = hashCanonical({
    kind: input.kind,
    actionSurface: input.profile.actionSurface,
    mode: input.profile.recommendedIntegrationMode,
    template,
  } as unknown as CanonicalReleaseJsonValue);
  return Object.freeze({
    artifactId: `action-surface-artifact:${digest}`,
    kind: input.kind,
    actionSurface: input.profile.actionSurface,
    mode: input.profile.recommendedIntegrationMode,
    domain: input.profile.domain,
    downstreamSystem: input.profile.downstreamSystem,
    operationRefs: Object.freeze([...input.profile.operationRefs].sort()),
    template,
    requiredReview: true,
    rawPayloadStored: false,
    productionReady: false,
    digest,
  });
}

export function createActionSurfaceIntegrationArtifactBundle(
  input: CreateActionSurfaceIntegrationArtifactBundleInput,
): ActionSurfaceIntegrationArtifactBundle {
  const generatedAt = normalizeIsoTimestamp(
    input.generatedAt,
    new Date().toISOString(),
    'generatedAt',
  );
  const baseUrl = normalizeBaseUrl(input.attestorBaseUrl);
  const artifacts = Object.freeze(
    input.profiles
      .flatMap((profile) =>
        artifactKindsForMode(profile.recommendedIntegrationMode).map((kind) =>
          artifactFor({ kind, profile, baseUrl })
        )
      )
      .sort((left, right) =>
        left.actionSurface.localeCompare(right.actionSurface) ||
        left.kind.localeCompare(right.kind)
      ),
  );
  const body = {
    version: ACTION_SURFACE_INTEGRATION_ARTIFACTS_VERSION,
    generatedAt,
    profileCount: input.profiles.length,
    artifactCount: artifacts.length,
    artifacts,
    artifactKinds: Object.freeze([...new Set(artifacts.map((artifact) => artifact.kind))].sort()),
    reviewStatus: 'requires-review' as const,
    approvalRequired: true,
    autoEnforce: false,
    rawPayloadStored: false,
    productionReady: false,
    nonBypassableClaimAllowed: false,
    limitations: Object.freeze([
      'Generated artifacts are review drafts only.',
      'They do not issue credentials, deploy infrastructure, or activate enforcement.',
      'Integration Mode Readiness must verify reviewed artifacts before any non-bypassable claim.',
    ]),
  } as const;
  const canonical = canonicalObject(body as unknown as CanonicalReleaseJsonValue);
  return Object.freeze({
    ...body,
    canonical: canonical.canonical,
    digest: canonical.digest,
  });
}

export function actionSurfaceIntegrationArtifactsDescriptor(): ActionSurfaceIntegrationArtifactsDescriptor {
  return Object.freeze({
    version: ACTION_SURFACE_INTEGRATION_ARTIFACTS_VERSION,
    reviewStatus: 'requires-review',
    approvalRequired: true,
    autoEnforce: false,
    rawPayloadStored: false,
    productionReady: false,
    nonBypassableClaimAllowed: false,
    outputIsReviewDraftOnly: true,
  });
}
