import { createHash } from 'node:crypto';
import {
  canonicalizeReleaseJson,
  type CanonicalReleaseJsonValue,
} from '../release-kernel/release-canonicalization.js';
import type {
  ActiveQuestion,
  ActiveQuestionEngineResult,
} from './active-question-engine.js';
import type {
  PolicyCandidatePrCandidate,
  PolicyCandidatePrContract,
} from './policy-candidate-pr-contract.js';

export const COUNTEREXAMPLE_REPLAY_GENERATOR_VERSION =
  'attestor.counterexample-replay-generator.v1';

export const COUNTEREXAMPLE_REPLAY_FIXTURE_KINDS = [
  'tenant-mismatch',
  'stale-approval',
  'missing-evidence',
  'bypass-route',
  'repeated-action',
  'prompt-injection',
  'tool-poisoning',
  'unsafe-approval',
  'crypto-transaction-abuse',
] as const;
export type CounterexampleReplayFixtureKind =
  typeof COUNTEREXAMPLE_REPLAY_FIXTURE_KINDS[number];

export const COUNTEREXAMPLE_REPLAY_EXPECTED_OUTCOMES = [
  'block',
  'review-required',
  'hold',
] as const;
export type CounterexampleReplayExpectedOutcome =
  typeof COUNTEREXAMPLE_REPLAY_EXPECTED_OUTCOMES[number];

export const COUNTEREXAMPLE_REPLAY_SEVERITIES = [
  'medium',
  'high',
  'blocker',
] as const;
export type CounterexampleReplaySeverity =
  typeof COUNTEREXAMPLE_REPLAY_SEVERITIES[number];

export interface CreateCounterexampleReplayGeneratorInput {
  readonly policyCandidatePrContract: PolicyCandidatePrContract;
  readonly activeQuestionEngine: ActiveQuestionEngineResult;
  readonly generatedAt?: string | null;
  readonly maxFixturesPerCandidate?: number | null;
  readonly includeCryptoTransactionAbuse?: boolean | null;
}

export interface CounterexampleReplayFixture {
  readonly fixtureId: string;
  readonly fixtureDigest: string;
  readonly kind: CounterexampleReplayFixtureKind;
  readonly severity: CounterexampleReplaySeverity;
  readonly expectedOutcome: CounterexampleReplayExpectedOutcome;
  readonly candidateId: string;
  readonly surfaceId: string;
  readonly actionSurface: string;
  readonly tenantRefDigest: string;
  readonly sourcePolicyCandidateDigest: string;
  readonly sourceEvidenceStateDigest: string;
  readonly sourceEventDigests: readonly string[];
  readonly sourceQuestionDigests: readonly string[];
  readonly schemaDigest: string;
  readonly replayInputDigest: string;
  readonly mutationDigest: string;
  readonly protectedPrinciples: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly mustNotAdmit: true;
  readonly mustNotActivatePolicy: true;
  readonly rawPayloadStored: false;
  readonly syntheticOnly: true;
  readonly localReplayOnly: true;
  readonly executesProductionTraffic: false;
  readonly downstreamMutationAllowed: false;
  readonly credentialUseAllowed: false;
}

export interface CounterexampleReplayGeneratorResult {
  readonly version: typeof COUNTEREXAMPLE_REPLAY_GENERATOR_VERSION;
  readonly generatedAt: string;
  readonly policyCandidatePrContractDigest: string;
  readonly activeQuestionEngineDigest: string;
  readonly tenantRefDigest: string;
  readonly graphDigest: string;
  readonly schemaDigest: string;
  readonly candidateCount: number;
  readonly candidateWithFixtureCount: number;
  readonly fixtureCount: number;
  readonly omittedFixtureCount: number;
  readonly fixtureKinds: readonly CounterexampleReplayFixtureKind[];
  readonly blockerFixtureCount: number;
  readonly fixtures: readonly CounterexampleReplayFixture[];
  readonly approvalRequired: true;
  readonly autoEnforce: false;
  readonly activatesEnforcement: false;
  readonly rawPayloadStored: false;
  readonly productionReady: false;
  readonly syntheticOnly: true;
  readonly localReplayOnly: true;
  readonly executesProductionTraffic: false;
  readonly downstreamMutationAllowed: false;
  readonly credentialUseAllowed: false;
  readonly reviewMaterialOnly: true;
  readonly canonical: string;
  readonly digest: string;
}

export interface CounterexampleReplayGeneratorDescriptor {
  readonly version: typeof COUNTEREXAMPLE_REPLAY_GENERATOR_VERSION;
  readonly fixtureKinds: typeof COUNTEREXAMPLE_REPLAY_FIXTURE_KINDS;
  readonly expectedOutcomes: typeof COUNTEREXAMPLE_REPLAY_EXPECTED_OUTCOMES;
  readonly severities: typeof COUNTEREXAMPLE_REPLAY_SEVERITIES;
  readonly defaultMaxFixturesPerCandidate: number;
  readonly tenantBound: true;
  readonly approvalRequired: true;
  readonly autoEnforce: false;
  readonly activatesEnforcement: false;
  readonly rawPayloadStored: false;
  readonly productionReady: false;
  readonly syntheticOnly: true;
  readonly localReplayOnly: true;
  readonly executesProductionTraffic: false;
  readonly downstreamMutationAllowed: false;
  readonly credentialUseAllowed: false;
  readonly reviewMaterialOnly: true;
}

const DEFAULT_MAX_FIXTURES_PER_CANDIDATE = 9;

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
    throw new Error(`Counterexample replay generator ${fieldName} must be an ISO timestamp.`);
  }
  return timestamp.toISOString();
}

function normalizeMaxFixtures(value: number | null | undefined): number {
  const raw = value ?? DEFAULT_MAX_FIXTURES_PER_CANDIDATE;
  if (!Number.isInteger(raw) || raw < 1 || raw > 25) {
    throw new Error(
      'Counterexample replay generator maxFixturesPerCandidate must be an integer from 1 to 25.',
    );
  }
  return raw;
}

function questionsByCandidate(
  result: ActiveQuestionEngineResult,
): ReadonlyMap<string, readonly ActiveQuestion[]> {
  const map = new Map<string, ActiveQuestion[]>();
  for (const question of result.questions) {
    const list = map.get(question.candidateId) ?? [];
    list.push(question);
    map.set(question.candidateId, list);
  }
  return new Map(
    [...map.entries()].map(([candidateId, questions]) => [
      candidateId,
      Object.freeze([...questions].sort((left, right) =>
        right.priorityScore - left.priorityScore ||
        left.kind.localeCompare(right.kind)
      )),
    ]),
  );
}

function validateSources(input: {
  readonly contract: PolicyCandidatePrContract;
  readonly activeQuestions: ActiveQuestionEngineResult;
}): void {
  if (input.activeQuestions.policyCandidatePrContractDigest !== input.contract.digest) {
    throw new Error(
      'Counterexample replay generator active question source digest must match policy candidate PR contract digest.',
    );
  }
  if (input.activeQuestions.tenantRefDigest !== input.contract.tenantRefDigest) {
    throw new Error(
      'Counterexample replay generator active question tenant digest must match policy candidate PR contract tenant digest.',
    );
  }
  if (input.activeQuestions.graphDigest !== input.contract.graphDigest) {
    throw new Error(
      'Counterexample replay generator active question graph digest must match policy candidate PR contract graph digest.',
    );
  }
  if (input.activeQuestions.schemaDigest !== input.contract.schemaDigest) {
    throw new Error(
      'Counterexample replay generator active question schema digest must match policy candidate PR contract schema digest.',
    );
  }
}

function cryptoLike(candidate: PolicyCandidatePrCandidate): boolean {
  return /crypto|wallet|safe|userop|erc20|approve|permit|swap|bridge|native|x402/iu
    .test(candidate.actionSurface);
}

function severityFor(kind: CounterexampleReplayFixtureKind): CounterexampleReplaySeverity {
  switch (kind) {
    case 'tenant-mismatch':
    case 'missing-evidence':
    case 'bypass-route':
    case 'unsafe-approval':
    case 'crypto-transaction-abuse':
      return 'blocker';
    case 'repeated-action':
    case 'prompt-injection':
    case 'tool-poisoning':
    case 'stale-approval':
      return 'high';
  }
}

function outcomeFor(kind: CounterexampleReplayFixtureKind): CounterexampleReplayExpectedOutcome {
  switch (kind) {
    case 'stale-approval':
    case 'unsafe-approval':
      return 'review-required';
    case 'repeated-action':
      return 'hold';
    default:
      return 'block';
  }
}

function principlesFor(kind: CounterexampleReplayFixtureKind): readonly string[] {
  const common = ['fail-closed boundary', 'proof integrity'];
  switch (kind) {
    case 'tenant-mismatch':
      return Object.freeze([...common, 'tenant isolation']);
    case 'stale-approval':
    case 'unsafe-approval':
      return Object.freeze([...common, 'customer authority']);
    case 'missing-evidence':
      return Object.freeze([...common, 'auditability']);
    case 'bypass-route':
      return Object.freeze([...common, 'runtime readiness']);
    case 'repeated-action':
      return Object.freeze([...common, 'replay and idempotency safety']);
    case 'prompt-injection':
    case 'tool-poisoning':
      return Object.freeze([...common, 'data minimization and redaction']);
    case 'crypto-transaction-abuse':
      return Object.freeze([...common, 'operational boundedness']);
  }
}

function reasonCodesFor(input: {
  readonly kind: CounterexampleReplayFixtureKind;
  readonly candidate: PolicyCandidatePrCandidate;
  readonly questions: readonly ActiveQuestion[];
}): readonly string[] {
  const codes = new Set<string>();
  codes.add(`counterexample:${input.kind}`);
  for (const code of input.candidate.blockerReasonCodes) codes.add(code);
  for (const question of input.questions) {
    for (const code of question.resolvesReasonCodes) codes.add(code);
  }
  if (input.kind === 'missing-evidence') {
    for (const field of input.candidate.missingEvidenceFields) {
      codes.add(`missing-field:${field}`);
    }
  }
  if (input.kind === 'prompt-injection') codes.add('owasp-llm01-prompt-injection');
  if (input.kind === 'tool-poisoning') codes.add('owasp-mcp03-tool-poisoning');
  if (input.kind === 'crypto-transaction-abuse') codes.add('crypto-abuse-fixture');
  return Object.freeze([...codes].sort());
}

function candidateKinds(
  candidate: PolicyCandidatePrCandidate,
  includeCryptoTransactionAbuse: boolean,
): readonly CounterexampleReplayFixtureKind[] {
  const kinds: CounterexampleReplayFixtureKind[] = [
    'tenant-mismatch',
    'missing-evidence',
    'bypass-route',
    'repeated-action',
    'prompt-injection',
    'tool-poisoning',
    'stale-approval',
    'unsafe-approval',
  ];
  if (includeCryptoTransactionAbuse && cryptoLike(candidate)) {
    kinds.push('crypto-transaction-abuse');
  }
  return Object.freeze(kinds);
}

function createFixture(input: {
  readonly kind: CounterexampleReplayFixtureKind;
  readonly candidate: PolicyCandidatePrCandidate;
  readonly tenantRefDigest: string;
  readonly schemaDigest: string;
  readonly questions: readonly ActiveQuestion[];
}): CounterexampleReplayFixture {
  const sourceQuestionDigests = Object.freeze(
    [...new Set(input.questions.flatMap((question) => [
      question.questionDigest,
      ...question.sourceQuestionDigests,
    ]))].sort(),
  );
  const mutationDigest = hashCanonical({
    kind: input.kind,
    candidateId: input.candidate.candidateId,
    sourcePolicyCandidateDigest: input.candidate.digest,
    syntheticMutation: 'digest-only-counterexample',
    rawPayloadStored: false,
  } as unknown as CanonicalReleaseJsonValue);
  const replayInputDigest = hashCanonical({
    kind: input.kind,
    candidateId: input.candidate.candidateId,
    sourceEventDigests: input.candidate.sourceEventDigests,
    sourceQuestionDigests,
    mutationDigest,
    expectedOutcome: outcomeFor(input.kind),
  } as unknown as CanonicalReleaseJsonValue);
  const base = {
    kind: input.kind,
    severity: severityFor(input.kind),
    expectedOutcome: outcomeFor(input.kind),
    candidateId: input.candidate.candidateId,
    surfaceId: input.candidate.surfaceId,
    actionSurface: input.candidate.actionSurface,
    tenantRefDigest: input.tenantRefDigest,
    sourcePolicyCandidateDigest: input.candidate.digest,
    sourceEvidenceStateDigest: input.candidate.sourceEvidenceStateDigest,
    sourceEventDigests: input.candidate.sourceEventDigests,
    sourceQuestionDigests,
    schemaDigest: input.schemaDigest,
    replayInputDigest,
    mutationDigest,
    protectedPrinciples: principlesFor(input.kind),
    reasonCodes: reasonCodesFor(input),
    mustNotAdmit: true as const,
    mustNotActivatePolicy: true as const,
    rawPayloadStored: false as const,
    syntheticOnly: true as const,
    localReplayOnly: true as const,
    executesProductionTraffic: false as const,
    downstreamMutationAllowed: false as const,
    credentialUseAllowed: false as const,
  };
  const fixtureDigest = hashCanonical(base as unknown as CanonicalReleaseJsonValue);
  return Object.freeze({
    fixtureId: `counterexample:${fixtureDigest.slice('sha256:'.length, 23)}`,
    fixtureDigest,
    ...base,
  });
}

export function createCounterexampleReplayGenerator(
  input: CreateCounterexampleReplayGeneratorInput,
): CounterexampleReplayGeneratorResult {
  validateSources({
    contract: input.policyCandidatePrContract,
    activeQuestions: input.activeQuestionEngine,
  });
  const generatedAt = normalizeIsoTimestamp(
    input.generatedAt,
    input.activeQuestionEngine.generatedAt,
    'generatedAt',
  );
  const maxFixturesPerCandidate = normalizeMaxFixtures(input.maxFixturesPerCandidate);
  const includeCryptoTransactionAbuse = input.includeCryptoTransactionAbuse ?? true;
  const questionMap = questionsByCandidate(input.activeQuestionEngine);
  const fixturesWithOmitted = input.policyCandidatePrContract.candidates.map((candidate) => {
    const questions = questionMap.get(candidate.candidateId) ?? Object.freeze([]);
    const allKinds = candidateKinds(candidate, includeCryptoTransactionAbuse);
    const fixtures = allKinds
      .slice(0, maxFixturesPerCandidate)
      .map((kind) => createFixture({
        kind,
        candidate,
        tenantRefDigest: input.policyCandidatePrContract.tenantRefDigest,
        schemaDigest: input.policyCandidatePrContract.schemaDigest,
        questions,
      }));
    return Object.freeze({
      candidateId: candidate.candidateId,
      fixtures,
      omitted: Math.max(0, allKinds.length - fixtures.length),
    });
  });
  const fixtures = Object.freeze(
    fixturesWithOmitted
      .flatMap((entry) => entry.fixtures)
      .sort((left, right) =>
        left.actionSurface.localeCompare(right.actionSurface) ||
        left.kind.localeCompare(right.kind)
      ),
  );
  const fixtureKinds = Object.freeze(
    [...new Set(fixtures.map((fixture) => fixture.kind))].sort(),
  );
  const candidateWithFixtureCount = new Set(fixtures.map((fixture) => fixture.candidateId)).size;
  const payload = {
    version: COUNTEREXAMPLE_REPLAY_GENERATOR_VERSION as typeof COUNTEREXAMPLE_REPLAY_GENERATOR_VERSION,
    generatedAt,
    policyCandidatePrContractDigest: input.policyCandidatePrContract.digest,
    activeQuestionEngineDigest: input.activeQuestionEngine.digest,
    tenantRefDigest: input.policyCandidatePrContract.tenantRefDigest,
    graphDigest: input.policyCandidatePrContract.graphDigest,
    schemaDigest: input.policyCandidatePrContract.schemaDigest,
    candidateCount: input.policyCandidatePrContract.candidateCount,
    candidateWithFixtureCount,
    fixtureCount: fixtures.length,
    omittedFixtureCount: fixturesWithOmitted.reduce((sum, entry) => sum + entry.omitted, 0),
    fixtureKinds,
    blockerFixtureCount: fixtures.filter((fixture) => fixture.severity === 'blocker').length,
    fixtures,
    approvalRequired: true as const,
    autoEnforce: false as const,
    activatesEnforcement: false as const,
    rawPayloadStored: false as const,
    productionReady: false as const,
    syntheticOnly: true as const,
    localReplayOnly: true as const,
    executesProductionTraffic: false as const,
    downstreamMutationAllowed: false as const,
    credentialUseAllowed: false as const,
    reviewMaterialOnly: true as const,
  };
  const canonical = canonicalObject(payload as unknown as CanonicalReleaseJsonValue);
  return Object.freeze({
    ...payload,
    canonical: canonical.canonical,
    digest: canonical.digest,
  });
}

export function counterexampleReplayGeneratorDescriptor(): CounterexampleReplayGeneratorDescriptor {
  return Object.freeze({
    version: COUNTEREXAMPLE_REPLAY_GENERATOR_VERSION,
    fixtureKinds: COUNTEREXAMPLE_REPLAY_FIXTURE_KINDS,
    expectedOutcomes: COUNTEREXAMPLE_REPLAY_EXPECTED_OUTCOMES,
    severities: COUNTEREXAMPLE_REPLAY_SEVERITIES,
    defaultMaxFixturesPerCandidate: DEFAULT_MAX_FIXTURES_PER_CANDIDATE,
    tenantBound: true,
    approvalRequired: true,
    autoEnforce: false,
    activatesEnforcement: false,
    rawPayloadStored: false,
    productionReady: false,
    syntheticOnly: true,
    localReplayOnly: true,
    executesProductionTraffic: false,
    downstreamMutationAllowed: false,
    credentialUseAllowed: false,
    reviewMaterialOnly: true,
  });
}
