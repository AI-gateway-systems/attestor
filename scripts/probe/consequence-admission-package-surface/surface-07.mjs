export async function runConsequenceAdmissionPackageSurface07({ assert, root, admission }) {
  assert.equal(
    admission.policyFoundryCoverageScoreDescriptor().dataMinimizationSurfaceKind,
    'policy-foundry-coverage-score',
  );

  assert.equal(
    admission.policyFoundryCoverageScoreDescriptor().autoEnforce,
    false,
  );

  assert.equal(
    typeof admission.createPolicyFoundryCoverageScore,
    'function',
  );

  assert.equal(
    admission.POLICY_FOUNDRY_GATE_PLANNER_VERSION,
    'attestor.policy-foundry-gate-planner.v1',
  );

  assert.equal(
    admission.policyFoundryGatePlannerDescriptor().dataMinimizationSurfaceKind,
    'policy-foundry-gate-planner',
  );

  assert.equal(
    admission.policyFoundryGatePlannerDescriptor().deploysInfrastructure,
    false,
  );

  assert.equal(
    typeof admission.createPolicyFoundryGatePlanner,
    'function',
  );

  assert.equal(
    admission.POLICY_FOUNDRY_CANDIDATE_REGISTRY_VERSION,
    'attestor.policy-foundry-candidate-registry.v1',
  );

  assert.equal(
    admission.policyFoundryCandidateRegistryDescriptor().dataMinimizationSurfaceKind,
    'policy-foundry-candidate-registry',
  );

  assert.equal(
    admission.policyFoundryCandidateRegistryDescriptor().llmThresholdAuthorityAllowed,
    false,
  );

  assert.equal(
    typeof admission.createPolicyFoundryCandidateRegistry,
    'function',
  );

  assert.equal(
    admission.POLICY_FOUNDRY_COUNTEREXAMPLE_LEDGER_VERSION,
    'attestor.policy-foundry-counterexample-ledger.v1',
  );

  assert.equal(
    admission.policyFoundryCounterexampleLedgerDescriptor().dataMinimizationSurfaceKind,
    'policy-foundry-counterexample-ledger',
  );

  assert.equal(
    admission.policyFoundryCounterexampleLedgerDescriptor().evidenceDigestOnly,
    true,
  );

  assert.equal(
    typeof admission.createPolicyFoundryCounterexampleLedger,
    'function',
  );

  assert.equal(
    admission.POLICY_FOUNDRY_POLICY_TWIN_SUMMARY_VERSION,
    'attestor.policy-foundry-policy-twin-summary.v1',
  );

  assert.equal(
    admission.policyFoundryPolicyTwinSummaryDescriptor().dataMinimizationSurfaceKind,
    'policy-foundry-policy-twin-summary',
  );

  assert.equal(
    admission.policyFoundryPolicyTwinSummaryDescriptor().policyTwinEvidenceOnly,
    true,
  );

  assert.equal(
    typeof admission.createPolicyFoundryPolicyTwinSummary,
    'function',
  );

  assert.equal(
    admission.POLICY_FOUNDRY_AUTHORITY_RELATIONSHIP_CONTEXT_VERSION,
    'attestor.policy-foundry-authority-relationship-context.v1',
  );

  assert.equal(
    admission.policyFoundryAuthorityRelationshipContextDescriptor().dataMinimizationSurfaceKind,
    'policy-foundry-authority-relationship-context',
  );

  assert.equal(
    admission.policyFoundryAuthorityRelationshipContextDescriptor().digestOnly,
    true,
  );

  assert.equal(
    admission.policyFoundryAuthorityRelationshipContextDescriptor().authorityDecisionAllowed,
    false,
  );

  assert.equal(
    typeof admission.createPolicyFoundryAuthorityRelationshipContext,
    'function',
  );

  assert.equal(
    admission.POLICY_FOUNDRY_REVIEW_ONLY_PATCH_PACK_VERSION,
    'attestor.policy-foundry-review-only-patch-pack.v1',
  );

  assert.equal(
    admission.policyFoundryReviewOnlyPatchPackDescriptor().dataMinimizationSurfaceKind,
    'policy-foundry-review-only-patch-pack',
  );

  assert.equal(
    admission.policyFoundryReviewOnlyPatchPackDescriptor().appliesPatches,
    false,
  );

  assert.equal(
    admission.policyFoundryReviewOnlyPatchPackDescriptor().reviewMaterialOnly,
    true,
  );

  assert.equal(
    typeof admission.createPolicyFoundryReviewOnlyPatchPack,
    'function',
  );

  assert.equal(
    admission.POLICY_FOUNDRY_SELF_ONBOARDING_CLI_VERSION,
    'attestor.policy-foundry-self-onboarding-cli.v1',
  );

  assert.equal(
    admission.policyFoundrySelfOnboardingCliDescriptor().dataMinimizationSurfaceKind,
    'policy-foundry-self-onboarding-cli',
  );

  assert.equal(
    admission.policyFoundrySelfOnboardingCliDescriptor().appliesPatches,
    false,
  );

  assert.equal(
    admission.policyFoundrySelfOnboardingCliDescriptor().reviewMaterialOnly,
    true,
  );

  assert.equal(
    typeof admission.createPolicyFoundrySelfOnboardingCliPacket,
    'function',
  );

  assert.equal(
    admission.POLICY_FOUNDRY_OUTCOME_FEEDBACK_LOOP_VERSION,
    'attestor.policy-foundry-outcome-feedback-loop.v1',
  );

  assert.equal(
    admission.policyFoundryOutcomeFeedbackLoopDescriptor().dataMinimizationSurfaceKind,
    'policy-foundry-outcome-feedback-loop',
  );

  assert.equal(
    admission.policyFoundryOutcomeFeedbackLoopDescriptor().automaticScoreMutationAllowed,
    false,
  );

  assert.equal(
    admission.policyFoundryOutcomeFeedbackLoopDescriptor().llmTrainingAllowed,
    false,
  );

  assert.equal(
    typeof admission.createPolicyFoundryOutcomeFeedbackLoop,
    'function',
  );

  assert.equal(
    admission.POLICY_FOUNDRY_DRIFT_POLICY_DEBT_DETECTOR_VERSION,
    'attestor.policy-foundry-drift-policy-debt-detector.v1',
  );

  assert.equal(
    admission.policyFoundryDriftPolicyDebtDetectorDescriptor().dataMinimizationSurfaceKind,
    'policy-foundry-drift-policy-debt-detector',
  );

  assert.equal(
    admission.policyFoundryDriftPolicyDebtDetectorDescriptor().automaticRemediationAllowed,
    false,
  );

  assert.equal(
    admission.policyFoundryDriftPolicyDebtDetectorDescriptor().policyMutationAllowed,
    false,
  );

  assert.equal(
    typeof admission.createPolicyFoundryDriftPolicyDebtDetector,
    'function',
  );

  assert.equal(
    admission.POLICY_FOUNDRY_COMMERCIAL_BOUNDARY_VERSION,
    'attestor.policy-foundry-commercial-boundary.v1',
  );

  assert.equal(
    admission.policyFoundryCommercialBoundaryDescriptor().dataMinimizationSurfaceKind,
    'policy-foundry-commercial-boundary',
  );

  assert.equal(
    admission.policyFoundryCommercialBoundaryDescriptor().safetyMinimumsPaidOnlyAllowed,
    false,
  );

  assert.equal(
    admission.policyFoundryCommercialBoundaryDescriptor().billingStateRequiredForSafetyMinimums,
    false,
  );

  assert.equal(
    typeof admission.createPolicyFoundryCommercialBoundary,
    'function',
  );

  assert.equal(
    admission.POLICY_FOUNDRY_ADVERSARIAL_REPLAY_EXECUTOR_VERSION,
    'attestor.policy-foundry-adversarial-replay-executor.v1',
  );

  assert.equal(
    admission.policyFoundryAdversarialReplayExecutorDescriptor().dataMinimizationSurfaceKind,
    'policy-foundry-adversarial-replay-executor',
  );

  assert.equal(
    admission.policyFoundryAdversarialReplayExecutorDescriptor().downstreamMutationAllowed,
    false,
  );

  assert.equal(
    admission.policyFoundryAdversarialReplayExecutorDescriptor().credentialUseAllowed,
    false,
  );

  assert.equal(
    admission.policyFoundryAdversarialReplayExecutorDescriptor().executesProductionTraffic,
    false,
  );

  assert.equal(
    typeof admission.createPolicyFoundryAdversarialReplayExecutor,
    'function',
  );

  assert.equal(
    admission.POLICY_FOUNDRY_HOSTED_ONBOARDING_WORKFLOW_VERSION,
    'attestor.policy-foundry-hosted-onboarding-workflow.v1',
  );

  assert.equal(
    admission.policyFoundryHostedOnboardingWorkflowDescriptor().dataMinimizationSurfaceKind,
    'policy-foundry-hosted-onboarding-workflow',
  );

  assert.equal(
    admission.policyFoundryHostedOnboardingWorkflowDescriptor().hostedUiWorkflowContract,
    true,
  );

  assert.equal(
    admission.policyFoundryHostedOnboardingWorkflowDescriptor().hostedUiImplemented,
    false,
  );

  assert.equal(
    admission.policyFoundryHostedOnboardingWorkflowDescriptor().hostedRouteImplemented,
    false,
  );

  assert.equal(
    admission.policyFoundryHostedOnboardingWorkflowDescriptor().deploymentEntitlementEnforcementImplemented,
    false,
  );

  assert.equal(
    typeof admission.createPolicyFoundryHostedOnboardingWorkflow,
    'function',
  );

  const blockedInternalPaths = [
    'attestor/consequence-admission/facade.js',
    'attestor/consequence-admission/runtime-signal-envelope.js',
    'attestor/consequence-admission/runtime-signal-authority-guard.js',
    'attestor/consequence-admission/runtime-signal-source-binding.js',
    'attestor/consequence-admission/runtime-signal-normalizer.js',
    'attestor/consequence-admission/runtime-signal-consequence-mapping.js',
    'attestor/consequence-admission/action-surface-auto-context.js',
    'attestor/consequence-admission/runtime-signal-integration-readiness-bridge.js',
    'attestor/consequence-admission/runtime-signal-review-packet.js',
    'attestor/consequence-admission/runtime-signal-proof-intake.js',
  ];

  for (const internalPath of blockedInternalPaths) {
    let blockedInternalPath = false;
    try {
      await import(internalPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      blockedInternalPath =
        message.includes('Package subpath') ||
        message.includes('ERR_PACKAGE_PATH_NOT_EXPORTED');
    }

    assert.equal(
      blockedInternalPath,
      true,
      `${internalPath} should stay outside the public package surface`,
    );
  }

}
