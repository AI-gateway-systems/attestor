import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import {
  packageProductionPromotionCandidate,
  type ProductionPromotionCandidateSummary,
} from '../scripts/ops/package-production-promotion-candidate.ts';
import { generateKeyPair } from '../src/signing/keys.js';
import {
  canonicalize,
  verifySignature,
} from '../src/signing/sign.js';

let passed = 0;

function ok(condition: unknown, message: string): void {
  assert.ok(condition, message);
  passed += 1;
}

function equal<T>(actual: T, expected: T, message: string): void {
  assert.equal(actual, expected, message);
  passed += 1;
}

function includes(content: string, expected: string, message: string): void {
  assert.ok(
    content.includes(expected),
    `${message}\nExpected to find: ${expected}`,
  );
  passed += 1;
}

function readProjectFile(...segments: string[]): string {
  return readFileSync(join(process.cwd(), ...segments), 'utf8');
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(resolve(path, '..'), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeText(path: string, value: string): void {
  mkdirSync(resolve(path, '..'), { recursive: true });
  writeFileSync(path, value, 'utf8');
}

function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function createTempRoot(): string {
  return mkdtempSync(resolve(tmpdir(), 'attestor-promotion-bundle-'));
}

function createSigningKey(root: string): string {
  const keyPair = generateKeyPair();
  const keyPath = resolve(root, 'promotion-private.pem');
  writeFileSync(keyPath, keyPair.privateKeyPem, 'utf8');
  return keyPath;
}

function writeEvidence(root: string, options?: {
  readonly readinessState?: string;
  readonly readinessPromotionGatePassed?: boolean;
  readonly omitArtifact?: string;
}): void {
  const files: Record<string, unknown | string> = {
    '.attestor/rehearsal/evidence/repo-verify.txt': 'verify passed\n',
    '.attestor/production-readiness/evidence/readiness.json': {
      readiness: {
        state: options?.readinessState ?? 'ready-for-environment-promotion',
        promotionGatePassed: options?.readinessPromotionGatePassed ?? true,
        issues: options?.readinessState === 'blocked-on-environment-inputs'
          ? ['missing external target input']
          : [],
        missingInputs: options?.readinessState === 'blocked-on-environment-inputs'
          ? ['ATTESTOR_RELEASE_AUTHORITY_PG_URL']
          : [],
      },
    },
    '.attestor/rehearsal/evidence/substrate.json': { readiness: { state: 'ready-for-rehearsal', passed: true, issues: [] } },
    '.attestor/rehearsal/evidence/consequence.json': { readiness: { state: 'passed-core-consequence-rehearsal', passed: true, issues: [] } },
    '.attestor/rehearsal/evidence/async.json': { readiness: { state: 'passed-async-recovery-rehearsal', passed: true, issues: [] } },
    '.attestor/rehearsal/evidence/dr.json': { readiness: { state: 'passed-backup-restore-dr-rehearsal', passed: true, issues: [] } },
    '.attestor/rehearsal/evidence/observability.json': { readiness: { state: 'passed-observability-alerting-runbook-rehearsal', passed: true, issues: [] } },
    '.attestor/rehearsal/release-provenance/release-provenance.txt': 'gh attestation verified\n',
  };
  for (const [relativePath, value] of Object.entries(files)) {
    if (relativePath === options?.omitArtifact) continue;
    const path = resolve(root, relativePath);
    if (typeof value === 'string') writeText(path, value);
    else writeJson(path, value);
  }
}

function manifest(root: string, options?: {
  readonly verdict?: 'pending' | 'go' | 'no-go';
  readonly failedEvidenceId?: string;
  readonly missingArtifactPath?: string;
  readonly extraEvidenceItems?: readonly unknown[];
}): unknown {
  const evidence = [
    {
      id: 'repo-verify-output',
      phase: 'repo-baseline',
      kind: 'terminal-output',
      producer: 'npm run verify',
      artifactPath: '.attestor/rehearsal/evidence/repo-verify.txt',
      verification: 'All suite commands exit 0.',
    },
    {
      id: 'production-readiness-packet',
      phase: 'render',
      kind: 'json',
      producer: 'npm run render:production-readiness-packet',
      artifactPath: '.attestor/production-readiness/evidence/readiness.json',
      verification: 'Readiness state is ready-for-environment-promotion.',
    },
    {
      id: 'production-rehearsal-substrate-readiness',
      phase: 'probe',
      kind: 'json',
      producer: 'npm run probe:production-rehearsal-substrates',
      artifactPath: '.attestor/rehearsal/evidence/substrate.json',
      verification: 'Substrate readiness passed.',
    },
    {
      id: 'production-rehearsal-consequence-behavior',
      phase: 'rehearsal',
      kind: 'json',
      producer: 'npm run rehearse:production-consequence',
      artifactPath: '.attestor/rehearsal/evidence/consequence.json',
      verification: 'Consequence behavior passed.',
    },
    {
      id: 'production-rehearsal-async-recovery',
      phase: 'rehearsal',
      kind: 'json',
      producer: 'npm run rehearse:production-async-recovery',
      artifactPath: '.attestor/rehearsal/evidence/async.json',
      verification: 'Async recovery passed.',
    },
    {
      id: 'production-rehearsal-backup-restore-dr',
      phase: 'recovery',
      kind: 'json',
      producer: 'npm run rehearse:production-backup-restore-dr',
      artifactPath: '.attestor/rehearsal/evidence/dr.json',
      verification: 'Backup restore DR passed.',
    },
    {
      id: 'production-rehearsal-observability-alerting',
      phase: 'observability',
      kind: 'json',
      producer: 'npm run rehearse:production-observability-alerting',
      artifactPath: options?.missingArtifactPath ?? '.attestor/rehearsal/evidence/observability.json',
      verification: 'Observability alerting passed.',
    },
    {
      id: 'release-provenance-verification',
      phase: 'provenance',
      kind: 'attestation',
      producer: 'gh attestation verify',
      artifactPath: '.attestor/rehearsal/release-provenance/release-provenance.txt',
      digestSha256: sha256(resolve(root, '.attestor/rehearsal/release-provenance/release-provenance.txt')),
      verification: 'Release provenance verified.',
    },
  ].map((item) => ({
    ...item,
    required: true,
    status: item.id === options?.failedEvidenceId ? 'fail' : 'pass',
  }));

  return {
    schemaVersion: 'attestor.production-rehearsal.manifest.v1',
    rehearsalId: 'v0.2-production-rehearsal-test',
    targetEnvironment: {
      name: 'gke-prod-rehearsal',
      type: 'production-like',
      provider: 'gke',
      region: 'europe-west1',
      cluster: 'attestor-prod-rehearsal',
      namespace: 'attestor',
      publicHostname: 'attestor.example.invalid',
      owner: 'operator@example.invalid',
    },
    source: {
      repository: 'AI-gateway-systems/attestor',
      commit: '62cf89b',
      tag: 'v0.2-production-candidate',
      release: 'v0.2-production-candidate',
      workflowRuns: {
        evaluationSmoke: '24925665095',
        fullVerify: '24925665096',
        releaseProvenance: '24925665097',
        productionRehearsal: '24925665098',
      },
    },
    runtime: {
      profile: 'production-shared',
      requireSharedAuthority: true,
      noLocalFallback: true,
      releaseAuthorityPgUrlRef: 'external-secret:ATTESTOR_RELEASE_AUTHORITY_PG_URL',
      redisUrlRef: 'external-secret:REDIS_URL',
    },
    secretPosture: {
      mode: 'external-secret',
      plaintextSecretsAllowed: false,
      redactedFields: [
        'ATTESTOR_RELEASE_AUTHORITY_PG_URL',
        'REDIS_URL',
      ],
    },
    commandPlan: [
      {
        id: 'repo-verify',
        phase: 'repo-baseline',
        command: 'npm run verify',
        required: true,
        stopOnFailure: true,
        expectedArtifacts: ['.attestor/rehearsal/evidence/repo-verify.txt'],
        evidenceIds: ['repo-verify-output'],
      },
      {
        id: 'rehearse-production-observability-alerting',
        phase: 'observability',
        command: 'npm run rehearse:production-observability-alerting',
        required: true,
        stopOnFailure: true,
        expectedArtifacts: ['.attestor/rehearsal/evidence/observability.json'],
        evidenceIds: ['production-rehearsal-observability-alerting'],
      },
      {
        id: 'package-production-promotion-candidate',
        phase: 'decision',
        command: 'npm run package:production-promotion-candidate',
        required: true,
        stopOnFailure: true,
        expectedArtifacts: [
          '.attestor/rehearsal/gke-production-rehearsal/production-promotion-candidate/summary.json',
          '.attestor/rehearsal/gke-production-rehearsal/production-promotion-candidate/production-promotion-candidate.tar.gz',
          '.attestor/rehearsal/gke-production-rehearsal/production-promotion-candidate/production-promotion-attestation.json',
        ],
        evidenceIds: [
          'production-promotion-candidate-bundle',
          'production-promotion-candidate-attestation',
        ],
      },
    ],
    evidenceItems: [
      ...evidence,
      ...(options?.extraEvidenceItems ?? []),
      {
        id: 'production-promotion-candidate-bundle',
        phase: 'decision',
        kind: 'tarball',
        required: true,
        producer: 'npm run package:production-promotion-candidate',
        artifactPath: '.attestor/rehearsal/gke-production-rehearsal/production-promotion-candidate/production-promotion-candidate.tar.gz',
        verification: 'Archive digest is recorded and local attestation binds it.',
        status: 'pending',
      },
      {
        id: 'production-promotion-candidate-attestation',
        phase: 'decision',
        kind: 'attestation',
        required: true,
        producer: 'npm run package:production-promotion-candidate',
        artifactPath: '.attestor/rehearsal/gke-production-rehearsal/production-promotion-candidate/production-promotion-attestation.json',
        verification: 'Local Ed25519 attestation verifies the archive digest.',
        status: 'pending',
      },
    ],
    stopConditions: [
      'Any required evidence item remains pending, failed, blocked, or missing.',
      'Any required artifact lacks a digest before packaging the final evidence bundle.',
      'The production promotion signing key is missing.',
    ],
    nonClaims: [
      'This manifest is not market validation or customer adoption proof.',
      'This manifest is not a blanket production guarantee for every environment.',
    ],
    goNoGo: {
      verdict: options?.verdict ?? 'go',
      decidedBy: 'operator@example.invalid',
      decidedAt: '2026-04-28T10:00:00.000Z',
      notes: 'All target evidence reviewed for the test fixture.',
    },
  };
}

async function packageFixture(options?: {
  readonly verdict?: 'pending' | 'go' | 'no-go';
  readonly failedEvidenceId?: string;
  readonly omitArtifact?: string;
  readonly missingArtifactPath?: string;
  readonly readinessState?: string;
  readonly readinessPromotionGatePassed?: boolean;
  readonly omitSigningKey?: boolean;
  readonly extraEvidenceItems?: readonly unknown[];
  readonly extraEvidenceItemsFactory?: (root: string) => readonly unknown[];
  readonly extraFiles?: Readonly<Record<string, string>>;
}): Promise<{
  readonly root: string;
  readonly summary: ProductionPromotionCandidateSummary;
}> {
  const root = createTempRoot();
  writeEvidence(root, {
    readinessState: options?.readinessState,
    readinessPromotionGatePassed: options?.readinessPromotionGatePassed,
    omitArtifact: options?.omitArtifact,
  });
  for (const [path, value] of Object.entries(options?.extraFiles ?? {})) {
    writeText(resolve(root, path), value);
  }
  const manifestPath = resolve(root, 'manifest.json');
  const extraEvidenceItems = [
    ...(options?.extraEvidenceItems ?? []),
    ...(options?.extraEvidenceItemsFactory?.(root) ?? []),
  ];
  writeJson(manifestPath, manifest(root, {
    verdict: options?.verdict,
    failedEvidenceId: options?.failedEvidenceId,
    missingArtifactPath: options?.missingArtifactPath,
    extraEvidenceItems,
  }));
  const signingKey = options?.omitSigningKey ? null : createSigningKey(root);
  const summary = await packageProductionPromotionCandidate({
    rootDir: root,
    manifestPath: 'manifest.json',
    outputDir: 'out',
    signingKeyPath: signingKey ?? undefined,
    env: {},
  });
  return { root, summary };
}

async function testPackagesGoCandidateAndSignsArchive(): Promise<void> {
  const { root, summary } = await packageFixture();
  try {
    equal(summary.goNoGo.verdict, 'go', 'Production promotion bundle: passing fixture produces go verdict');
    equal(summary.environmentPacket.state, 'ready-for-environment-promotion', 'Production promotion bundle: environment packet state is captured');
    ok(summary.evidence.includedArtifacts.some((artifact) => artifact.id === 'production-rehearsal-observability-alerting'), 'Production promotion bundle: Step 09 evidence is included');
    ok(summary.evidence.finalEvidenceIds.includes('production-promotion-candidate-bundle'), 'Production promotion bundle: final bundle evidence is excluded from prerequisites and recorded');
    ok(existsSync(summary.artifacts.archivePath), 'Production promotion bundle: archive is written');
    ok(existsSync(summary.artifacts.archiveSha256Path), 'Production promotion bundle: archive digest is written');
    ok(Boolean(summary.artifacts.attestationPath && existsSync(summary.artifacts.attestationPath)), 'Production promotion bundle: local attestation is written');
    ok(Boolean(summary.artifacts.publicKeyPath && existsSync(summary.artifacts.publicKeyPath)), 'Production promotion bundle: public key is written');

    const attestation = summary.attestation.localSignature;
    assert.ok(attestation);
    const { signing, ...body } = attestation;
    const publicKeyPem = readFileSync(summary.artifacts.publicKeyPath!, 'utf8');
    ok(
      verifySignature(canonicalize(body), signing.signature, publicKeyPem),
      'Production promotion bundle: local Ed25519 attestation verifies against the public key',
    );
    includes(
      readFileSync(summary.artifacts.readmePath, 'utf8'),
      'gh attestation verify production-promotion-candidate.tar.gz',
      'Production promotion bundle: README includes optional GitHub attestation verification path',
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

async function testMissingRequiredArtifactProducesNoGoBundle(): Promise<void> {
  const { root, summary } = await packageFixture({
    omitArtifact: '.attestor/rehearsal/evidence/observability.json',
  });
  try {
    equal(summary.goNoGo.verdict, 'no-go', 'Production promotion bundle: missing required artifact produces no-go');
    ok(summary.goNoGo.blockers.some((blocker) => blocker.includes('required-artifacts-present')), 'Production promotion bundle: missing artifact blocker is surfaced');
    ok(existsSync(summary.artifacts.archivePath), 'Production promotion bundle: no-go archive is still written for operator evidence');
    ok(Boolean(summary.attestation.localSignature), 'Production promotion bundle: no-go archive can still be signed for audit evidence');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

async function testPendingManifestVerdictProducesNoGo(): Promise<void> {
  const { root, summary } = await packageFixture({ verdict: 'pending' });
  try {
    equal(summary.goNoGo.verdict, 'no-go', 'Production promotion bundle: pending manifest verdict is fail-closed no-go');
    ok(summary.goNoGo.blockers.some((blocker) => blocker.includes('manifest-go-no-go')), 'Production promotion bundle: pending verdict blocker is surfaced');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

async function testBlockedEnvironmentPacketProducesNoGo(): Promise<void> {
  const { root, summary } = await packageFixture({
    readinessState: 'blocked-on-environment-inputs',
    readinessPromotionGatePassed: false,
  });
  try {
    equal(summary.goNoGo.verdict, 'no-go', 'Production promotion bundle: blocked readiness packet produces no-go');
    equal(summary.environmentPacket.state, 'blocked-on-environment-inputs', 'Production promotion bundle: blocked environment packet state is recorded');
    ok(summary.goNoGo.blockers.some((blocker) => blocker.includes('environment-packet')), 'Production promotion bundle: environment packet blocker is surfaced');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

async function testMissingSigningKeyProducesNoGoWithoutSignature(): Promise<void> {
  const { root, summary } = await packageFixture({ omitSigningKey: true });
  try {
    equal(summary.goNoGo.verdict, 'no-go', 'Production promotion bundle: missing signing key produces no-go');
    equal(summary.attestation.localSignature, null, 'Production promotion bundle: missing signing key does not fake a signature');
    ok(summary.goNoGo.blockers.some((blocker) => blocker.includes('local-signing-key')), 'Production promotion bundle: signing key blocker is surfaced');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

async function testManifestArtifactPathBoundaryDeniesUnsafePaths(): Promise<void> {
  const { root, summary } = await packageFixture({
    extraFiles: {
      'package-lock.json': '{}\n',
      '.env': 'PLACEHOLDER_ONLY=true\n',
      'outside.txt': 'outside allowlist\n',
    },
    extraEvidenceItemsFactory: (fixtureRoot) => [
      {
        id: 'unsafe-absolute-path',
        phase: 'repo-baseline',
        kind: 'terminal-output',
        required: true,
        producer: 'fixture',
        artifactPath: resolve(fixtureRoot, 'package-lock.json'),
        verification: 'Must be denied by absolute-path boundary.',
        status: 'pass',
      },
      {
        id: 'unsafe-parent-traversal',
        phase: 'repo-baseline',
        kind: 'terminal-output',
        required: true,
        producer: 'fixture',
        artifactPath: '.attestor/rehearsal/../outside.txt',
        verification: 'Must be denied by parent traversal boundary.',
        status: 'pass',
      },
      {
        id: 'unsafe-repo-file',
        phase: 'repo-baseline',
        kind: 'terminal-output',
        required: true,
        producer: 'fixture',
        artifactPath: 'package-lock.json',
        verification: 'Must be denied outside the promotion evidence roots.',
        status: 'pass',
      },
      {
        id: 'unsafe-env-file',
        phase: 'repo-baseline',
        kind: 'terminal-output',
        required: true,
        producer: 'fixture',
        artifactPath: '.env',
        verification: 'Must be denied outside the promotion evidence roots.',
        status: 'pass',
      },
    ],
  });
  try {
    equal(summary.goNoGo.verdict, 'no-go', 'Production promotion bundle: denied artifact paths produce no-go');
    equal(
      summary.artifactPathBoundary.policyVersion,
      'attestor.production-promotion.artifact-path-boundary.v1',
      'Production promotion bundle: artifact path boundary policy is recorded',
    );
    ok(
      summary.evidence.deniedArtifacts.some((artifact) =>
        artifact.id === 'unsafe-absolute-path' && artifact.reason === 'absolute-path-not-allowed'),
      'Production promotion bundle: absolute manifest artifact paths are denied',
    );
    ok(
      summary.evidence.deniedArtifacts.some((artifact) =>
        artifact.id === 'unsafe-parent-traversal' && artifact.reason === 'parent-traversal-not-allowed'),
      'Production promotion bundle: parent traversal manifest artifact paths are denied',
    );
    ok(
      summary.evidence.deniedArtifacts.some((artifact) =>
        artifact.id === 'unsafe-repo-file' && artifact.reason === 'outside-allowed-artifact-roots'),
      'Production promotion bundle: unrelated repository files are denied',
    );
    ok(
      summary.evidence.deniedArtifacts.some((artifact) =>
        artifact.id === 'unsafe-env-file' && artifact.reason === 'outside-allowed-artifact-roots'),
      'Production promotion bundle: local env files are denied',
    );
    ok(
      summary.goNoGo.blockers.some((blocker) => blocker.includes('artifact-path-boundary')),
      'Production promotion bundle: artifact path boundary blocker is surfaced',
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function testDocsAndScriptsExposeStep10(): void {
  const packageJson = JSON.parse(readProjectFile('package.json')) as {
    readonly scripts: Record<string, string>;
  };
  const tracker = readProjectFile('docs', '02-architecture', 'production-rehearsal-buildout.md');
  const manifestDoc = readProjectFile('docs', '08-deployment', 'production-rehearsal-manifest.md');
  const manifestExample = readProjectFile('docs', '08-deployment', 'production-rehearsal-manifest.example.json');

  equal(
    packageJson.scripts['package:production-promotion-candidate'],
    'tsx scripts/ops/package-production-promotion-candidate.ts',
    'Production promotion bundle: package script is exposed',
  );
  equal(
    packageJson.scripts['test:production-rehearsal-promotion-bundle'],
    'tsx tests/production-rehearsal-promotion-bundle.test.ts',
    'Production promotion bundle: test script is exposed',
  );
  includes(tracker, '| Completed | 10 |', 'Production promotion bundle: tracker marks all ten steps complete');
  includes(tracker, '| Not started | 0 |', 'Production promotion bundle: tracker has no remaining frozen steps');
  includes(tracker, '| 10 | complete | Package the v0.2 production-promotion candidate evidence bundle |', 'Production promotion bundle: Step 10 is complete without renumbering');
  includes(manifestDoc, 'npm run package:production-promotion-candidate', 'Production promotion bundle: manifest doc names the package command');
  includes(manifestDoc, 'local Ed25519 attestation', 'Production promotion bundle: manifest doc explains local attestation');
  includes(manifestExample, 'production-promotion-candidate-bundle', 'Production promotion bundle: manifest example records final bundle evidence');
  includes(manifestExample, 'production-promotion-candidate-attestation', 'Production promotion bundle: manifest example records final attestation evidence');
}

await testPackagesGoCandidateAndSignsArchive();
await testMissingRequiredArtifactProducesNoGoBundle();
await testPendingManifestVerdictProducesNoGo();
await testBlockedEnvironmentPacketProducesNoGo();
await testMissingSigningKeyProducesNoGoWithoutSignature();
await testManifestArtifactPathBoundaryDeniesUnsafePaths();
testDocsAndScriptsExposeStep10();

console.log(`Production rehearsal promotion bundle tests: ${passed} passed, 0 failed`);
