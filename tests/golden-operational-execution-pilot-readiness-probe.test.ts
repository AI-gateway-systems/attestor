import assert from 'node:assert/strict';
import {
  createGoldenOperationalExecutionPilotReadinessProbe,
  goldenOperationalExecutionPilotReadinessProbeDescriptor,
  runGoldenOperationalExecutionRuntimeSmoke,
  type GoldenOperationalExecutionRuntimeSmokeResult,
} from '../src/consequence-admission/index.js';

let passed = 0;

function equal<T>(actual: T, expected: T, message: string): void {
  assert.equal(actual, expected, message);
  passed += 1;
}

function ok(condition: unknown, message: string): void {
  assert.ok(condition, message);
  passed += 1;
}

function excludes(content: string, unexpected: RegExp, message: string): void {
  assert.doesNotMatch(content, unexpected, message);
  passed += 1;
}

function testDescriptor(): void {
  const descriptor = goldenOperationalExecutionPilotReadinessProbeDescriptor();

  equal(descriptor.version, 'attestor.golden-operational-execution-pilot-readiness-probe.v1', 'O03 probe descriptor: version is explicit');
  equal(descriptor.step, 'O03', 'O03 probe descriptor: step is explicit');
  assert.deepEqual(
    descriptor.allowedVerdicts,
    ['ready-for-shadow-pilot', 'not-ready'],
    'O03 probe descriptor: allowed verdicts exclude scoped pilot',
  );
  passed += 1;
  equal(descriptor.scopedPilotVerdictExcluded, true, 'O03 probe descriptor: scoped pilot verdict is excluded');
  equal(descriptor.shadowOnly, true, 'O03 probe descriptor: shadow-only is true');
  equal(descriptor.fixtureOnly, true, 'O03 probe descriptor: fixture-only is true');
  equal(descriptor.previewOnly, true, 'O03 probe descriptor: preview-only is true');
  equal(descriptor.noTargetSystemCall, true, 'O03 probe descriptor: target calls are forbidden');
  equal(descriptor.noDeployment, true, 'O03 probe descriptor: deployments are forbidden');
  equal(descriptor.noInfrastructureChange, true, 'O03 probe descriptor: infrastructure changes are forbidden');
  equal(descriptor.noSecretManagerWrite, true, 'O03 probe descriptor: secret-manager writes are forbidden');
  equal(descriptor.noIncidentAutomationExecution, true, 'O03 probe descriptor: incident automation is forbidden');
  equal(descriptor.noRunbookExecution, true, 'O03 probe descriptor: runbook execution is forbidden');
  equal(descriptor.noPolicyActivation, true, 'O03 probe descriptor: policy activation is forbidden');
  equal(descriptor.canAdmit, false, 'O03 probe descriptor: cannot admit');
  equal(descriptor.productionReady, false, 'O03 probe descriptor: production readiness is false');
}

function testProbeEmitsOnlyShadowPilotVerdict(): void {
  const result = createGoldenOperationalExecutionPilotReadinessProbe();

  equal(result.version, 'attestor.golden-operational-execution-pilot-readiness-probe.v1', 'O03 probe result: version is explicit');
  equal(result.step, 'O03', 'O03 probe result: step is explicit');
  equal(result.decision.verdict, 'ready-for-shadow-pilot', 'O03 probe result: default fixture smoke is shadow-pilot ready');
  equal(result.decision.blockers.length, 0, 'O03 probe result: default fixture smoke has no blockers');
  equal(result.pilotReadinessPacket.decision.verdict, 'ready-for-shadow-pilot', 'O03 probe result: packet verdict is shadow-pilot ready');
  equal(result.pilotReadinessPacket.stage, 'shadow-entry', 'O03 probe result: packet stage is shadow-entry');
  equal(result.pilotReadinessPacket.rolloutMode, 'shadow-only', 'O03 probe result: rollout mode is shadow-only');
  equal(result.scopedPilotVerdictExcluded, true, 'O03 probe result: scoped pilot verdict is excluded');
  ok(!result.allowedVerdicts.includes('ready-for-scoped-pilot' as never), 'O03 probe result: allowed verdicts omit ready-for-scoped-pilot');
  ok(/^sha256:[a-f0-9]{64}$/u.test(result.digest), 'O03 probe result: digest is canonical');
  ok(/^sha256:[a-f0-9]{64}$/u.test(result.pilotReadinessPacketDigest), 'O03 probe result: packet digest is canonical');
}

function testProbePreservesNoClaimBoundary(): void {
  const result = createGoldenOperationalExecutionPilotReadinessProbe();

  equal(result.shadowOnly, true, 'O03 probe result: shadow-only is true');
  equal(result.fixtureOnly, true, 'O03 probe result: fixture-only is true');
  equal(result.previewOnly, true, 'O03 probe result: preview-only is true');
  equal(result.deterministicReplay, true, 'O03 probe result: deterministic replay is true');
  equal(result.noTargetSystemCall, true, 'O03 probe result: target-system call is forbidden');
  equal(result.noDeployment, true, 'O03 probe result: deployment is forbidden');
  equal(result.noInfrastructureChange, true, 'O03 probe result: infrastructure change is forbidden');
  equal(result.noSecretManagerWrite, true, 'O03 probe result: secret-manager write is forbidden');
  equal(result.noIncidentAutomationExecution, true, 'O03 probe result: incident automation is forbidden');
  equal(result.noRunbookExecution, true, 'O03 probe result: runbook execution is forbidden');
  equal(result.noProviderCall, true, 'O03 probe result: provider call is forbidden');
  equal(result.noAuditWrite, true, 'O03 probe result: audit write is forbidden');
  equal(result.noPolicyActivation, true, 'O03 probe result: policy activation is forbidden');
  equal(result.noLearningActivation, true, 'O03 probe result: learning activation is forbidden');
  equal(result.noTrainingActivation, true, 'O03 probe result: training activation is forbidden');
  equal(result.grantsAuthority, false, 'O03 probe result: grants authority is false');
  equal(result.canAdmit, false, 'O03 probe result: cannot admit');
  equal(result.activatesEnforcement, false, 'O03 probe result: cannot activate enforcement');
  equal(result.autoEnforce, false, 'O03 probe result: auto enforcement is false');
  equal(result.rawPayloadRead, false, 'O03 probe result: raw payload read is false');
  equal(result.rawPayloadStored, false, 'O03 probe result: raw payload stored is false');
  equal(result.rawDeploymentManifestRead, false, 'O03 probe result: raw deployment manifest read is false');
  equal(result.rawDeploymentManifestStored, false, 'O03 probe result: raw deployment manifest stored is false');
  equal(result.rawTerraformPlanRead, false, 'O03 probe result: raw Terraform plan read is false');
  equal(result.rawTerraformPlanStored, false, 'O03 probe result: raw Terraform plan stored is false');
  equal(result.rawSecretMaterialRead, false, 'O03 probe result: raw secret material read is false');
  equal(result.rawSecretMaterialStored, false, 'O03 probe result: raw secret material stored is false');
  equal(result.rawRunbookTextRead, false, 'O03 probe result: raw runbook text read is false');
  equal(result.rawRunbookTextStored, false, 'O03 probe result: raw runbook text stored is false');
  equal(result.productionReady, false, 'O03 probe result: production readiness is false');
  equal(result.pilotReadinessPacket.productionReady, false, 'O03 packet: production readiness is false');
  equal(result.pilotReadinessPacket.customerDeploymentProven, false, 'O03 packet: customer deployment proof is false');
  equal(result.pilotReadinessPacket.nativeConnectorCoverage, false, 'O03 packet: native connector coverage is false');
}

function testProbeFailsClosedOnRuntimeSmokeRisk(): void {
  const smoke = runGoldenOperationalExecutionRuntimeSmoke();
  const tampered = {
    ...smoke,
    allScenariosCompleted: false,
    noTargetSystemCall: false,
    noDeployment: false,
    noInfrastructureChange: false,
    noSecretManagerWrite: false,
    noIncidentAutomationExecution: false,
    noRunbookExecution: false,
  } as unknown as GoldenOperationalExecutionRuntimeSmokeResult;
  const result = createGoldenOperationalExecutionPilotReadinessProbe(tampered);

  equal(result.decision.verdict, 'not-ready', 'O03 probe result: tampered smoke is not ready');
  ok(
    result.decision.blockers.includes('golden-operational-execution-runtime-smoke-incomplete'),
    'O03 probe result: incomplete smoke blocker is recorded',
  );
  ok(
    result.decision.blockers.includes('golden-operational-execution-runtime-smoke-target-system-call-risk'),
    'O03 probe result: target call risk blocker is recorded',
  );
  ok(
    result.decision.blockers.includes('golden-operational-execution-runtime-smoke-operational-side-effect-risk'),
    'O03 probe result: operational side-effect blocker is recorded',
  );
  ok(
    result.decision.blockers.includes('non-claim-boundary:pilot-non-claims-not-accepted'),
    'O03 probe result: packet non-claim blocker is recorded when source smoke is unsafe',
  );
}

function testDeterminismAndDataMinimization(): void {
  const first = createGoldenOperationalExecutionPilotReadinessProbe();
  const second = createGoldenOperationalExecutionPilotReadinessProbe();
  const serialized = JSON.stringify(first);

  equal(first.digest, second.digest, 'O03 probe: full digest is deterministic');
  equal(first.pilotReadinessPacketDigest, second.pilotReadinessPacketDigest, 'O03 probe: packet digest is deterministic');
  excludes(serialized, /AKIA|ASIA|AIza|sk_live|rk_live|whsec|xox[abprs]-|-----BEGIN [A-Z ]*PRIVATE KEY-----/u, 'O03 probe: no provider or secret token material is serialized');
  excludes(serialized, /"(?:kubeconfig|terraformState|tfvars|privateKey|secretValue|password|accessToken|refreshToken|bearerToken)"\s*:/iu, 'O03 probe: no raw ops credential/config fields are serialized');
  excludes(serialized, /\b(customer|tenant|account)[_-]?[0-9]{3,}\b/iu, 'O03 probe: no raw customer, tenant, or account id is serialized');
  excludes(serialized, /"rawManifest"\s*:|"rawRunbookText"\s*:|"rawTerraformPlan"\s*:|"rawSecret"\s*:|kubectl apply|terraform apply/iu, 'O03 probe: no raw deploy/runbook/plan fields or execution commands are serialized');
}

testDescriptor();
testProbeEmitsOnlyShadowPilotVerdict();
testProbePreservesNoClaimBoundary();
testProbeFailsClosedOnRuntimeSmokeRisk();
testDeterminismAndDataMinimization();

console.log(`golden-operational-execution-pilot-readiness-probe: ${passed} assertions passed`);
