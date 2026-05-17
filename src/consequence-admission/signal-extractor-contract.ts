import { createHash } from 'node:crypto';
import {
  canonicalizeReleaseJson,
  type CanonicalReleaseJsonValue,
} from '../release-kernel/release-canonicalization.js';
import type {
  ShadowEnvelopeProjection,
} from './shadow-envelope-projector.js';
import {
  SHADOW_ENVELOPE_PROJECTOR_VERSION,
} from './shadow-envelope-projector.js';
import {
  SIGNAL_RELATIONSHIP_CONTRACT_VERSION,
  type SignalAuthorityMode,
  type SignalCategory,
  type SignalEvidenceRef,
  type SignalKindForCategory,
  type SignalReadModelRef,
  type SignalRelationshipSignal,
  type SignalSourcePlane,
} from './signal-relationship-contract.js';

export const SIGNAL_EXTRACTOR_CONTRACT_VERSION =
  'attestor.signal-extractor-contract.v1';

export const SIGNAL_EXTRACTOR_EXECUTION_MODES = [
  'shadow-only',
  'offline-replay',
] as const;
export type SignalExtractorExecutionMode =
  typeof SIGNAL_EXTRACTOR_EXECUTION_MODES[number];

export const SIGNAL_EXTRACTOR_OUTPUT_MODES = [
  'signals-only',
] as const;
export type SignalExtractorOutputMode =
  typeof SIGNAL_EXTRACTOR_OUTPUT_MODES[number];

export const SIGNAL_EXTRACTOR_REQUIRED_FIELDS = [
  'extractorId',
  'sourcePlane',
  'category',
  'authorityMode',
  'allowedKinds',
  'readsEnvelope',
  'readsEvidenceRefs',
  'readsRawPayload',
  'grantsAuthority',
  'activatesEnforcement',
  'autoEnforce',
  'productionReady',
] as const;
export type SignalExtractorRequiredField =
  typeof SIGNAL_EXTRACTOR_REQUIRED_FIELDS[number];

export interface SignalExtractorDeclaration<
  Category extends SignalCategory = SignalCategory,
> {
  readonly version: typeof SIGNAL_EXTRACTOR_CONTRACT_VERSION;
  readonly extractorId: string;
  readonly sourcePlane: SignalSourcePlane;
  readonly category: Category;
  readonly authorityMode: SignalAuthorityMode;
  readonly allowedKinds: readonly SignalKindForCategory<Category>[];
  readonly readsEnvelope: true;
  readonly readsEvidenceRefs: true;
  readonly readsReadModelRefs: boolean;
  readonly readsRawPayload: false;
  readonly readsRawPrompt: false;
  readonly readsRawProviderBody: false;
  readonly readsRawCustomerIdentifier: false;
  readonly outputMode: SignalExtractorOutputMode;
  readonly executionMode: SignalExtractorExecutionMode;
  readonly grantsAuthority: false;
  readonly canEmitHardFloor: boolean;
  readonly activatesEnforcement: false;
  readonly autoEnforce: false;
  readonly productionReady: false;
}

export interface CreateSignalExtractorDeclarationInput<
  Category extends SignalCategory = SignalCategory,
> {
  readonly extractorId: string;
  readonly sourcePlane: SignalSourcePlane;
  readonly category: Category;
  readonly authorityMode: SignalAuthorityMode;
  readonly allowedKinds: readonly SignalKindForCategory<Category>[];
  readonly readsReadModelRefs?: boolean;
  readonly executionMode?: SignalExtractorExecutionMode;
}

export interface SignalExtractionBatch<
  Category extends SignalCategory = SignalCategory,
> {
  readonly version: typeof SIGNAL_EXTRACTOR_CONTRACT_VERSION;
  readonly signalRelationshipContractVersion:
    typeof SIGNAL_RELATIONSHIP_CONTRACT_VERSION;
  readonly shadowEnvelopeProjectorVersion:
    typeof SHADOW_ENVELOPE_PROJECTOR_VERSION;
  readonly extractor: SignalExtractorDeclaration<Category>;
  readonly projectionDigest: string;
  readonly envelopeRefDigest: string;
  readonly sourceEventDigest: string;
  readonly tenantBindingDigest: string;
  readonly signals: readonly SignalRelationshipSignal<Category>[];
  readonly signalCount: number;
  readonly sourceEvidenceDigests: readonly string[];
  readonly readModelDigests: readonly string[];
  readonly outputMode: SignalExtractorOutputMode;
  readonly executionMode: SignalExtractorExecutionMode;
  readonly categoryBoundOutput: true;
  readonly sourcePlaneTagPreserved: true;
  readonly authorityModePreserved: true;
  readonly rawPayloadRead: false;
  readonly grantsAuthority: false;
  readonly canAdmit: false;
  readonly activatesEnforcement: false;
  readonly autoEnforce: false;
  readonly productionReady: false;
  readonly canonical: string;
  readonly digest: string;
}

export interface SignalExtractorContractDescriptor {
  readonly version: typeof SIGNAL_EXTRACTOR_CONTRACT_VERSION;
  readonly signalRelationshipContractVersion:
    typeof SIGNAL_RELATIONSHIP_CONTRACT_VERSION;
  readonly shadowEnvelopeProjectorVersion:
    typeof SHADOW_ENVELOPE_PROJECTOR_VERSION;
  readonly executionModes: readonly SignalExtractorExecutionMode[];
  readonly outputModes: readonly SignalExtractorOutputMode[];
  readonly requiredFields: readonly SignalExtractorRequiredField[];
  readonly categoryBoundOutputRequired: true;
  readonly sourcePlaneTagRequired: true;
  readonly sourceEvidenceDigestRequired: true;
  readonly advisoryCannotEmitHardFloor: true;
  readonly hardFloorRequiresTierOne: true;
  readonly readsRawPayload: false;
  readonly grantsAuthority: false;
  readonly canAdmit: false;
  readonly activatesEnforcement: false;
  readonly autoEnforce: false;
  readonly productionReady: false;
  readonly nonClaims: readonly string[];
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

function normalizeDigest(value: string | null | undefined, fieldName: string): string {
  if (typeof value !== 'string' || !/^sha256:[0-9a-f]{64}$/u.test(value)) {
    throw new Error(`Signal extractor ${fieldName} must be a sha256 digest reference.`);
  }
  return value;
}

function normalizeId(value: string, fieldName: string): string {
  if (!/^[a-z0-9][a-z0-9_.:-]{2,127}$/u.test(value)) {
    throw new Error(`Signal extractor ${fieldName} must be a stable lowercase id.`);
  }
  return value;
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)].sort());
}

function assertHardFloorAllowed(
  sourcePlane: SignalSourcePlane,
  authorityMode: SignalAuthorityMode,
  canEmitHardFloor: boolean,
): void {
  if (!canEmitHardFloor) return;
  if (sourcePlane !== 'tier-1-hard-gate' || authorityMode !== 'hard-floor') {
    throw new Error('Signal extractor hard_floor output requires tier-1 hard-floor authority.');
  }
}

function mayEmitHardFloor(
  sourcePlane: SignalSourcePlane,
  authorityMode: SignalAuthorityMode,
  allowedKinds: readonly string[],
): boolean {
  const canEmitHardFloor = allowedKinds.includes('hard_floor');
  assertHardFloorAllowed(sourcePlane, authorityMode, canEmitHardFloor);
  return canEmitHardFloor;
}

export function createSignalExtractorDeclaration<
  Category extends SignalCategory,
>(
  input: CreateSignalExtractorDeclarationInput<Category>,
): SignalExtractorDeclaration<Category> {
  if (input.allowedKinds.length === 0) {
    throw new Error('Signal extractor allowedKinds must not be empty.');
  }
  const extractorId = normalizeId(input.extractorId, 'extractorId');
  const allowedKinds = Object.freeze([...new Set(input.allowedKinds)].sort()) as
    readonly SignalKindForCategory<Category>[];
  const canEmitHardFloor = mayEmitHardFloor(
    input.sourcePlane,
    input.authorityMode,
    allowedKinds,
  );

  return Object.freeze({
    version: SIGNAL_EXTRACTOR_CONTRACT_VERSION,
    extractorId,
    sourcePlane: input.sourcePlane,
    category: input.category,
    authorityMode: input.authorityMode,
    allowedKinds,
    readsEnvelope: true,
    readsEvidenceRefs: true,
    readsReadModelRefs: input.readsReadModelRefs ?? false,
    readsRawPayload: false,
    readsRawPrompt: false,
    readsRawProviderBody: false,
    readsRawCustomerIdentifier: false,
    outputMode: 'signals-only',
    executionMode: input.executionMode ?? 'shadow-only',
    grantsAuthority: false,
    canEmitHardFloor,
    activatesEnforcement: false,
    autoEnforce: false,
    productionReady: false,
  });
}

function assertProjection(projection: ShadowEnvelopeProjection): void {
  normalizeDigest(projection.digest, 'projection.digest');
  normalizeDigest(projection.envelopeRefDigest, 'projection.envelopeRefDigest');
  normalizeDigest(projection.sourceEventDigest, 'projection.sourceEventDigest');
  normalizeDigest(projection.tenantBindingDigest, 'projection.tenantBindingDigest');
  if (projection.projectionMode !== 'shadow-only') {
    throw new Error('Signal extractor input projection must be shadow-only.');
  }
  if (
    projection.rawPayloadRead !== false ||
    projection.grantsAuthority !== false ||
    projection.canAdmit !== false ||
    projection.activatesEnforcement !== false ||
    projection.autoEnforce !== false ||
    projection.productionReady !== false
  ) {
    throw new Error('Signal extractor input projection must preserve no-authority invariants.');
  }
}

function assertEvidenceRefs(refs: readonly SignalEvidenceRef[], fieldName: string): void {
  if (refs.length === 0) {
    throw new Error(`Signal extractor ${fieldName} must include at least one digest evidence ref.`);
  }
  refs.forEach((ref, index) => normalizeDigest(ref.digest, `${fieldName}[${index}].digest`));
}

function assertReadModelRefs(refs: readonly SignalReadModelRef[], fieldName: string): void {
  refs.forEach((ref, index) => normalizeDigest(ref.digest, `${fieldName}[${index}].digest`));
}

function assertScore(value: number | null, fieldName: string): void {
  if (value === null) return;
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`Signal extractor ${fieldName} must be null or a number between 0 and 1.`);
  }
}

function assertSignalMatchesExtractor<Category extends SignalCategory>(
  declaration: SignalExtractorDeclaration<Category>,
  projection: ShadowEnvelopeProjection,
  signal: SignalRelationshipSignal<Category>,
): void {
  normalizeId(signal.signalId, 'signalId');
  if (signal.category !== declaration.category) {
    throw new Error('Signal extractor output category must match extractor declaration.');
  }
  if (!declaration.allowedKinds.includes(signal.kind)) {
    throw new Error('Signal extractor output kind must be declared in allowedKinds.');
  }
  if (signal.sourcePlane !== declaration.sourcePlane) {
    throw new Error('Signal extractor output sourcePlane must match extractor declaration.');
  }
  if (signal.authorityMode !== declaration.authorityMode) {
    throw new Error('Signal extractor output authorityMode must match extractor declaration.');
  }
  if (signal.envelopeRefDigest !== projection.envelopeRefDigest) {
    throw new Error('Signal extractor output envelopeRefDigest must match projection envelope digest.');
  }
  if (signal.kind === 'hard_floor') {
    assertHardFloorAllowed(
      declaration.sourcePlane,
      declaration.authorityMode,
      declaration.canEmitHardFloor,
    );
  }
  assertEvidenceRefs(signal.evidenceRefs, `signal ${signal.signalId} evidenceRefs`);
  assertReadModelRefs(signal.readModelRefs, `signal ${signal.signalId} readModelRefs`);
  if (!signal.appliesToConsequenceClasses.includes(projection.envelope.consequenceClass)) {
    throw new Error('Signal extractor output must apply to the projection consequence class.');
  }
  assertScore(signal.confidence, `signal ${signal.signalId} confidence`);
  assertScore(signal.uncertainty, `signal ${signal.signalId} uncertainty`);
  if (
    signal.grantsAuthority !== false ||
    signal.activatesEnforcement !== false ||
    signal.autoEnforce !== false ||
    signal.productionReady !== false ||
    signal.rawPayloadStored !== false ||
    signal.rawPromptStored !== false ||
    signal.rawProviderBodyStored !== false
  ) {
    throw new Error('Signal extractor output must preserve no-authority and no-raw-material invariants.');
  }
}

export function createSignalExtractionBatch<Category extends SignalCategory>(
  input: {
    readonly projection: ShadowEnvelopeProjection;
    readonly extractor: SignalExtractorDeclaration<Category>;
    readonly signals: readonly SignalRelationshipSignal<Category>[];
  },
): SignalExtractionBatch<Category> {
  assertProjection(input.projection);
  if (input.signals.length === 0) {
    throw new Error('Signal extractor batch must include at least one signal.');
  }
  input.signals.forEach((signal) =>
    assertSignalMatchesExtractor(input.extractor, input.projection, signal)
  );
  const sourceEvidenceDigests = uniqueStrings(input.signals.flatMap((signal) =>
    signal.evidenceRefs.map((ref) => ref.digest)
  ));
  const readModelDigests = uniqueStrings(input.signals.flatMap((signal) =>
    signal.readModelRefs.map((ref) => ref.digest)
  ));
  const payload = {
    version: SIGNAL_EXTRACTOR_CONTRACT_VERSION,
    signalRelationshipContractVersion: SIGNAL_RELATIONSHIP_CONTRACT_VERSION,
    shadowEnvelopeProjectorVersion: SHADOW_ENVELOPE_PROJECTOR_VERSION,
    extractor: input.extractor,
    projectionDigest: input.projection.digest,
    envelopeRefDigest: input.projection.envelopeRefDigest,
    sourceEventDigest: input.projection.sourceEventDigest,
    tenantBindingDigest: input.projection.tenantBindingDigest,
    signals: Object.freeze([...input.signals]),
    signalCount: input.signals.length,
    sourceEvidenceDigests,
    readModelDigests,
    outputMode: input.extractor.outputMode,
    executionMode: input.extractor.executionMode,
    categoryBoundOutput: true,
    sourcePlaneTagPreserved: true,
    authorityModePreserved: true,
    rawPayloadRead: false,
    grantsAuthority: false,
    canAdmit: false,
    activatesEnforcement: false,
    autoEnforce: false,
    productionReady: false,
  } as const;
  const canonical = canonicalObject(payload as unknown as CanonicalReleaseJsonValue);
  return Object.freeze({
    ...payload,
    canonical: canonical.canonical,
    digest: canonical.digest,
  });
}

export function signalExtractorContractDescriptor(): SignalExtractorContractDescriptor {
  return Object.freeze({
    version: SIGNAL_EXTRACTOR_CONTRACT_VERSION,
    signalRelationshipContractVersion: SIGNAL_RELATIONSHIP_CONTRACT_VERSION,
    shadowEnvelopeProjectorVersion: SHADOW_ENVELOPE_PROJECTOR_VERSION,
    executionModes: SIGNAL_EXTRACTOR_EXECUTION_MODES,
    outputModes: SIGNAL_EXTRACTOR_OUTPUT_MODES,
    requiredFields: SIGNAL_EXTRACTOR_REQUIRED_FIELDS,
    categoryBoundOutputRequired: true,
    sourcePlaneTagRequired: true,
    sourceEvidenceDigestRequired: true,
    advisoryCannotEmitHardFloor: true,
    hardFloorRequiresTierOne: true,
    readsRawPayload: false,
    grantsAuthority: false,
    canAdmit: false,
    activatesEnforcement: false,
    autoEnforce: false,
    productionReady: false,
    nonClaims: Object.freeze([
      'not-adapter-registry',
      'not-relationship-detection',
      'not-fusion',
      'not-live-enforcement',
      'not-authority-upgrade',
      'not-production-ready',
    ]),
  });
}
