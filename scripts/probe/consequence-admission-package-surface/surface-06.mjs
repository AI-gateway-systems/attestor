export async function runConsequenceAdmissionPackageSurface06({ assert, root, admission }) {
  assert.equal(
    admission.calibrationLowerBoundRunnerDescriptor().candidateInvariantSynthesizerVersion,
    admission.CANDIDATE_INVARIANT_SYNTHESIZER_VERSION,
  );

  assert.equal(
    admission.calibrationLowerBoundRunnerDescriptor().invariantCalibrationContractVersion,
    admission.INVARIANT_CALIBRATION_CONTRACT_VERSION,
  );

  assert.equal(
    admission.calibrationLowerBoundRunnerDescriptor().counterexampleMinimalWitnessVersion,
    admission.COUNTEREXAMPLE_MINIMAL_WITNESS_VERSION,
  );

  assert.equal(
    admission.calibrationLowerBoundRunnerDescriptor().requiresLowerBound,
    true,
  );

  assert.equal(
    admission.calibrationLowerBoundRunnerDescriptor().opensUndercuttingDefeaterOnWeakLowerBound,
    true,
  );

  assert.equal(
    admission.calibrationLowerBoundRunnerDescriptor().pointEstimateAuthorityAllowed,
    false,
  );

  assert.equal(
    admission.calibrationLowerBoundRunnerDescriptor().lowerBoundAuthorityAllowed,
    false,
  );

  assert.equal(
    admission.calibrationLowerBoundRunnerDescriptor().measurementMutationAllowed,
    false,
  );

  assert.equal(
    admission.calibrationLowerBoundRunnerDescriptor().canAdmit,
    false,
  );

  assert.equal(
    typeof admission.createCalibrationLowerBoundRunner,
    'function',
  );

  assert.equal(
    admission.REVIEWER_OPEN_DEFEATER_VIEW_VERSION,
    'attestor.reviewer-open-defeater-view.v1',
  );

  assert.equal(
    admission.reviewerOpenDefeaterViewDescriptor().assuranceCaseContractVersion,
    admission.ASSURANCE_CASE_CONTRACT_VERSION,
  );

  assert.equal(
    admission.PROMOTION_GATE_RUNNER_VERSION,
    'attestor.promotion-gate-runner.v1',
  );

  assert.equal(
    admission.promotionGateRunnerDescriptor().reviewerOpenDefeaterViewVersion,
    admission.REVIEWER_OPEN_DEFEATER_VIEW_VERSION,
  );

  assert.equal(
    admission.promotionGateRunnerDescriptor().invariantPromotionGateVersion,
    admission.INVARIANT_PROMOTION_GATE_VERSION,
  );

  assert.equal(
    admission.reviewerOpenDefeaterViewDescriptor().candidateInvariantSynthesizerVersion,
    admission.CANDIDATE_INVARIANT_SYNTHESIZER_VERSION,
  );

  assert.equal(
    admission.reviewerOpenDefeaterViewDescriptor().counterexampleMinimalWitnessVersion,
    admission.COUNTEREXAMPLE_MINIMAL_WITNESS_VERSION,
  );

  assert.equal(
    admission.reviewerOpenDefeaterViewDescriptor().calibrationLowerBoundRunnerVersion,
    admission.CALIBRATION_LOWER_BOUND_RUNNER_VERSION,
  );

  assert.equal(
    admission.reviewerOpenDefeaterViewDescriptor().maxReasonLines,
    7,
  );

  assert.equal(
    admission.reviewerOpenDefeaterViewDescriptor().maxQuestions,
    3,
  );

  assert.equal(
    admission.reviewerOpenDefeaterViewDescriptor().rendersOpenDefeatersOnly,
    true,
  );

  assert.equal(
    admission.reviewerOpenDefeaterViewDescriptor().digestOnly,
    true,
  );

  assert.equal(
    admission.reviewerOpenDefeaterViewDescriptor().boundedHumanReview,
    true,
  );

  assert.equal(
    admission.reviewerOpenDefeaterViewDescriptor().noRawEvidence,
    true,
  );

  assert.equal(
    admission.reviewerOpenDefeaterViewDescriptor().noReviewerDecision,
    true,
  );

  assert.equal(
    admission.reviewerOpenDefeaterViewDescriptor().noDefeaterClosure,
    true,
  );

  assert.equal(
    admission.reviewerOpenDefeaterViewDescriptor().noPromotion,
    true,
  );

  assert.equal(
    admission.reviewerOpenDefeaterViewDescriptor().canAdmit,
    false,
  );

  assert.equal(
    typeof admission.createReviewerOpenDefeaterView,
    'function',
  );

  assert.equal(
    admission.TLA_TRACE_VALIDATOR_BRIDGE_VERSION,
    'attestor.tla-trace-validator-bridge.v1',
  );

  assert.equal(
    admission.tlaTraceValidatorBridgeDescriptor().decisionTraceLoggerVersion,
    admission.DECISION_TRACE_LOGGER_VERSION,
  );

  assert.equal(
    admission.tlaTraceValidatorBridgeDescriptor().assuranceCaseContractVersion,
    admission.ASSURANCE_CASE_CONTRACT_VERSION,
  );

  assert.equal(
    admission.tlaTraceValidatorBridgeDescriptor().doesNotRunModelChecker,
    true,
  );

  assert.equal(
    admission.tlaTraceValidatorBridgeDescriptor().noFormalProofClaim,
    true,
  );

  assert.equal(
    admission.tlaTraceValidatorBridgeDescriptor().canAdmit,
    false,
  );

  assert.equal(
    typeof admission.createTlaTraceValidatorBridge,
    'function',
  );

  assert.equal(
    admission.RUNTIME_MONITOR_SKELETON_VERSION,
    'attestor.runtime-monitor-skeleton.v1',
  );

  assert.equal(
    admission.runtimeMonitorSkeletonDescriptor().shadowRuntimePipelineVersion,
    admission.SHADOW_RUNTIME_PIPELINE_VERSION,
  );

  assert.equal(
    admission.runtimeMonitorSkeletonDescriptor().decisionTraceLoggerVersion,
    admission.DECISION_TRACE_LOGGER_VERSION,
  );

  assert.equal(
    admission.runtimeMonitorSkeletonDescriptor().assuranceCaseContractVersion,
    admission.ASSURANCE_CASE_CONTRACT_VERSION,
  );

  assert.equal(
    admission.runtimeMonitorSkeletonDescriptor().noAuditWrite,
    true,
  );

  assert.equal(
    admission.runtimeMonitorSkeletonDescriptor().notRuntimeOracle,
    true,
  );

  assert.equal(
    admission.runtimeMonitorSkeletonDescriptor().canAdmit,
    false,
  );

  assert.equal(
    typeof admission.createRuntimeMonitorSkeleton,
    'function',
  );

  assert.equal(
    admission.DECISION_LINEAGE_GRAPH_VERSION,
    'attestor.decision-lineage-graph.v1',
  );

  assert.equal(
    admission.decisionLineageGraphDescriptor().assuranceCaseContractVersion,
    admission.ASSURANCE_CASE_CONTRACT_VERSION,
  );

  assert.equal(
    admission.decisionLineageGraphDescriptor().buildsDigestBoundDag,
    true,
  );

  assert.equal(
    admission.decisionLineageGraphDescriptor().doesNotCreateSignatures,
    true,
  );

  assert.equal(
    admission.decisionLineageGraphDescriptor().noExternalLineageExport,
    true,
  );

  assert.equal(
    admission.decisionLineageGraphDescriptor().canAdmit,
    false,
  );

  assert.equal(
    typeof admission.createDecisionLineageGraph,
    'function',
  );

  assert.equal(
    admission.AUTHORITY_CREEP_GUARD_VERSION,
    'attestor.authority-creep-guard.v1',
  );

  assert.equal(
    admission.authorityCreepGuardDescriptor().decisionLineageGraphVersion,
    admission.DECISION_LINEAGE_GRAPH_VERSION,
  );

  assert.equal(
    admission.authorityCreepGuardDescriptor().measurementIsNotAuthority,
    true,
  );

  assert.equal(
    admission.authorityCreepGuardDescriptor().opensUndercuttingDefeater,
    true,
  );

  assert.equal(
    admission.authorityCreepGuardDescriptor().canAdmit,
    false,
  );

  assert.equal(
    typeof admission.createAuthorityCreepGuard,
    'function',
  );

  assert.equal(
    admission.OUTCOME_FEEDBACK_COE_WIRING_VERSION,
    'attestor.outcome-feedback-coe-wiring.v1',
  );

  assert.equal(
    admission.outcomeFeedbackCoeWiringDescriptor().outcomeIncidentFeedbackContractVersion,
    admission.OUTCOME_INCIDENT_FEEDBACK_CONTRACT_VERSION,
  );

  assert.equal(
    admission.outcomeFeedbackCoeWiringDescriptor().mapsOutcomeToRebuttingDefeater,
    true,
  );

  assert.equal(
    admission.outcomeFeedbackCoeWiringDescriptor().feedbackIsNotAuthority,
    true,
  );

  assert.equal(
    admission.outcomeFeedbackCoeWiringDescriptor().canAdmit,
    false,
  );

  assert.equal(
    typeof admission.createOutcomeFeedbackCoeWiring,
    'function',
  );

  assert.equal(
    admission.financePipelineAdmissionDescriptor().route,
    '/api/v1/pipeline/run',
  );

  assert.equal(
    admission.cryptoExecutionPlanAdmissionDescriptor().hostedRouteClaimed,
    false,
  );

  assert.equal(
    admission.isConsequenceAdmissionFacadeSurface('finance-pipeline-run'),
    true,
  );

  assert.equal(
    admission.isConsequenceAdmissionFacadeSurface('auto'),
    false,
  );

  assert.equal(
    admission.mapFinancePipelineDecisionToAdmission('pass').mappedDecision,
    'admit',
  );

  assert.equal(
    admission.mapCryptoAdmissionOutcomeToAdmission('needs-evidence').mappedDecision,
    'review',
  );

  assert.equal(
    admission.CONSEQUENCE_ADMISSION_CUSTOMER_GATE_VERSION,
    'attestor.consequence-admission-customer-gate.v1',
  );

  assert.equal(
    typeof admission.evaluateConsequenceAdmissionGate,
    'function',
  );

  assert.equal(
    typeof admission.assertConsequenceAdmissionGateAllows,
    'function',
  );

  assert.equal(
    admission.CONSEQUENCE_ADMISSION_PROTECTED_RELEASE_TOKEN_ISSUANCE_VERSION,
    'attestor.consequence-admission-protected-release-token-issuance.v1',
  );

  assert.equal(
    typeof admission.issueGenericAdmissionProtectedReleaseToken,
    'function',
  );

  assert.equal(
    typeof admission.evaluateGenericAdmissionProtectedReleaseTokenRequirement,
    'function',
  );

  assert.equal(
    admission.CUSTOMER_PEP_RUNTIME_ADOPTION_VERSION,
    'attestor.customer-pep-runtime-adoption.v1',
  );

  assert.equal(
    admission.customerPepRuntimeAdoptionDescriptor().requiresSenderConstrainedPresentation,
    true,
  );

  assert.equal(
    admission.customerPepRuntimeAdoptionDescriptor().productionReady,
    false,
  );

  assert.equal(
    typeof admission.evaluateCustomerPepRuntimeAdoption,
    'function',
  );

  assert.equal(
    typeof admission.assertCustomerPepRuntimeAdoptionReady,
    'function',
  );

  assert.equal(
    admission.CUSTOMER_PEP_ADOPTION_PACKAGE_VERSION,
    'attestor.customer-pep-adoption-package.v1',
  );

  assert.equal(
    admission.customerPepAdoptionPackageDescriptor().requiresProtectedAdmissionE2eProof,
    true,
  );

  assert.equal(
    admission.customerPepAdoptionPackageDescriptor().productionReady,
    false,
  );

  assert.equal(
    typeof admission.evaluateCustomerPepAdoptionPackage,
    'function',
  );

  assert.equal(
    typeof admission.assertCustomerPepAdoptionPackageReady,
    'function',
  );

  assert.equal(
    admission.POLICY_FOUNDRY_COVERAGE_SCORE_VERSION,
    'attestor.policy-foundry-coverage-score.v1',
  );

}
