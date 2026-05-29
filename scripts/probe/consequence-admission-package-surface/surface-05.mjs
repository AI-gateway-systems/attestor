export async function runConsequenceAdmissionPackageSurface05({ assert, root, admission }) {
  assert.equal(
    typeof admission.createBaselineCohortSourceFromShadowEvent,
    'function',
  );

  assert.equal(
    typeof admission.createBaselineCohortCandidate,
    'function',
  );

  assert.equal(
    typeof admission.evaluateBaselineCohortPromotion,
    'function',
  );

  assert.equal(
    admission.CANDIDATE_INVARIANTS_CATALOG_VERSION,
    'attestor.candidate-invariants-catalog.v1',
  );

  assert.equal(
    admission.candidateInvariantsCatalogDescriptor().baselineCohortContractVersion,
    admission.BASELINE_COHORT_CONTRACT_VERSION,
  );

  assert.equal(
    admission.candidateInvariantsCatalogDescriptor().frequencyImpliesSafetyRejected,
    true,
  );

  assert.equal(
    admission.candidateInvariantsCatalogDescriptor().counterexampleReplayRequired,
    true,
  );

  assert.equal(
    admission.candidateInvariantsCatalogDescriptor().noAutoPromotion,
    true,
  );

  assert.equal(
    admission.candidateInvariantsCatalogDescriptor().learnsFromTraffic,
    false,
  );

  assert.equal(
    typeof admission.createCandidateInvariantFromBaseline,
    'function',
  );

  assert.equal(
    typeof admission.evaluateCandidateInvariantReviewReadiness,
    'function',
  );

  assert.equal(
    admission.INVARIANT_CALIBRATION_CONTRACT_VERSION,
    'attestor.invariant-calibration-contract.v1',
  );

  assert.equal(
    admission.invariantCalibrationContractDescriptor().candidateInvariantsCatalogVersion,
    admission.CANDIDATE_INVARIANTS_CATALOG_VERSION,
  );

  assert.equal(
    admission.invariantCalibrationContractDescriptor().methods.includes('isotonic-regression'),
    true,
  );

  assert.equal(
    admission.invariantCalibrationContractDescriptor().confidenceCapBelowSingleSignalBlock,
    true,
  );

  assert.equal(
    admission.invariantCalibrationContractDescriptor().rawClassifierScoreAuthorityAllowed,
    false,
  );

  assert.equal(
    admission.invariantCalibrationContractDescriptor().calibratedConfidenceAuthorityAllowed,
    false,
  );

  assert.equal(
    admission.invariantCalibrationContractDescriptor().learnsFromTraffic,
    false,
  );

  assert.equal(
    typeof admission.createInvariantCalibrationRecord,
    'function',
  );

  assert.equal(
    typeof admission.evaluateInvariantCalibrationReadiness,
    'function',
  );

  assert.equal(
    admission.INVARIANT_PROMOTION_GATE_VERSION,
    'attestor.invariant-promotion-gate.v1',
  );

  assert.equal(
    admission.invariantPromotionGateDescriptor().candidateInvariantsCatalogVersion,
    admission.CANDIDATE_INVARIANTS_CATALOG_VERSION,
  );

  assert.equal(
    admission.invariantPromotionGateDescriptor().invariantCalibrationContractVersion,
    admission.INVARIANT_CALIBRATION_CONTRACT_VERSION,
  );

  assert.equal(
    admission.invariantPromotionGateDescriptor().reviewOnlyPatchOnly,
    true,
  );

  assert.equal(
    admission.invariantPromotionGateDescriptor().noRelaxation,
    true,
  );

  assert.equal(
    admission.invariantPromotionGateDescriptor().noAutoPromotion,
    true,
  );

  assert.equal(
    admission.invariantPromotionGateDescriptor().activatesEnforcement,
    false,
  );

  assert.equal(
    typeof admission.createInvariantPromotionGateDecision,
    'function',
  );

  assert.equal(
    typeof admission.evaluateInvariantPromotionGate,
    'function',
  );

  assert.equal(
    admission.ASSURANCE_CASE_CONTRACT_VERSION,
    'attestor.assurance-case-contract.v1',
  );

  assert.equal(
    admission.assuranceCaseContractDescriptor().sacmVersionTarget,
    'SACM 2.3',
  );

  assert.equal(
    admission.assuranceCaseContractDescriptor().sacmAlignedNotConformant,
    true,
  );

  assert.equal(
    admission.assuranceCaseContractDescriptor().eliminativeArgumentation,
    true,
  );

  assert.equal(
    admission.assuranceCaseContractDescriptor().assurance2Defeasibility,
    true,
  );

  assert.equal(
    admission.assuranceCaseContractDescriptor().canAdmit,
    false,
  );

  assert.equal(
    admission.assuranceCaseContractDescriptor().activatesEnforcement,
    false,
  );

  assert.equal(
    typeof admission.createAssuranceCaseContract,
    'function',
  );

  assert.equal(
    typeof admission.createAssuranceCaseDefeater,
    'function',
  );

  assert.equal(
    typeof admission.evaluateAssuranceCaseScopeChange,
    'function',
  );

  assert.equal(
    admission.LEARNED_ARTIFACT_RELEASE_BUDGET_VERSION,
    'attestor.learned-artifact-release-budget.v1',
  );

  assert.equal(
    admission.learnedArtifactReleaseBudgetDescriptor().assuranceCaseContractVersion,
    admission.ASSURANCE_CASE_CONTRACT_VERSION,
  );

  assert.equal(
    admission.learnedArtifactReleaseBudgetDescriptor().differentialPrivacyEngine,
    false,
  );

  assert.equal(
    admission.learnedArtifactReleaseBudgetDescriptor().externalDpProofAcceptedAsEvidenceOnly,
    true,
  );

  assert.equal(
    admission.learnedArtifactReleaseBudgetDescriptor().noCrossTenantRelease,
    true,
  );

  assert.equal(
    admission.learnedArtifactReleaseBudgetDescriptor().noPublicRelease,
    true,
  );

  assert.equal(
    admission.learnedArtifactReleaseBudgetDescriptor().canAdmit,
    false,
  );

  assert.equal(
    typeof admission.createLearnedArtifactReleaseBudget,
    'function',
  );

  assert.equal(
    typeof admission.evaluateLearnedArtifactReleaseBudget,
    'function',
  );

  assert.equal(
    admission.SHADOW_DATA_QUALITY_GATE_VERSION,
    'attestor.shadow-data-quality-gate.v1',
  );

  assert.equal(
    admission.shadowDataQualityGateDescriptor().canonicalShadowEventSchemaVersion,
    admission.CANONICAL_SHADOW_EVENT_SCHEMA_VERSION,
  );

  assert.equal(
    admission.shadowDataQualityGateDescriptor().assuranceCaseContractVersion,
    admission.ASSURANCE_CASE_CONTRACT_VERSION,
  );

  assert.equal(
    admission.shadowDataQualityGateDescriptor().opensUnderminingDefeaters,
    true,
  );

  assert.equal(
    admission.shadowDataQualityGateDescriptor().digestOnlyEvidence,
    true,
  );

  assert.equal(
    admission.shadowDataQualityGateDescriptor().canAdmit,
    false,
  );

  assert.equal(
    typeof admission.createShadowDataQualityGate,
    'function',
  );

  assert.equal(
    typeof admission.evaluateShadowDataQualityGate,
    'function',
  );

  assert.equal(
    admission.BASELINE_COHORT_BUILDER_VERSION,
    'attestor.baseline-cohort-builder.v1',
  );

  assert.equal(
    admission.baselineCohortBuilderDescriptor().assuranceCaseContractVersion,
    admission.ASSURANCE_CASE_CONTRACT_VERSION,
  );

  assert.equal(
    admission.baselineCohortBuilderDescriptor().baselineCohortContractVersion,
    admission.BASELINE_COHORT_CONTRACT_VERSION,
  );

  assert.equal(
    admission.baselineCohortBuilderDescriptor().shadowDataQualityGateVersion,
    admission.SHADOW_DATA_QUALITY_GATE_VERSION,
  );

  assert.equal(
    admission.baselineCohortBuilderDescriptor().learnedArtifactReleaseBudgetVersion,
    admission.LEARNED_ARTIFACT_RELEASE_BUDGET_VERSION,
  );

  assert.equal(
    admission.baselineCohortBuilderDescriptor().createsAssuranceEvidenceNode,
    true,
  );

  assert.equal(
    admission.baselineCohortBuilderDescriptor().noLearning,
    true,
  );

  assert.equal(
    admission.baselineCohortBuilderDescriptor().canAdmit,
    false,
  );

  assert.equal(
    typeof admission.createBaselineCohortEvidence,
    'function',
  );

  assert.equal(
    admission.CANDIDATE_INVARIANT_SYNTHESIZER_VERSION,
    'attestor.candidate-invariant-synthesizer.v1',
  );

  assert.equal(
    admission.candidateInvariantSynthesizerDescriptor().assuranceCaseContractVersion,
    admission.ASSURANCE_CASE_CONTRACT_VERSION,
  );

  assert.equal(
    admission.candidateInvariantSynthesizerDescriptor().baselineCohortBuilderVersion,
    admission.BASELINE_COHORT_BUILDER_VERSION,
  );

  assert.equal(
    admission.candidateInvariantSynthesizerDescriptor().candidateInvariantsCatalogVersion,
    admission.CANDIDATE_INVARIANTS_CATALOG_VERSION,
  );

  assert.equal(
    admission.candidateInvariantSynthesizerDescriptor().createsClaimNode,
    true,
  );

  assert.equal(
    admission.candidateInvariantSynthesizerDescriptor().noMining,
    true,
  );

  assert.equal(
    admission.candidateInvariantSynthesizerDescriptor().canAdmit,
    false,
  );

  assert.equal(
    typeof admission.synthesizeCandidateInvariantAssuranceCase,
    'function',
  );

  assert.equal(
    admission.COUNTEREXAMPLE_MINIMAL_WITNESS_VERSION,
    'attestor.counterexample-minimal-witness.v1',
  );

  assert.equal(
    admission.counterexampleMinimalWitnessDescriptor().assuranceCaseContractVersion,
    admission.ASSURANCE_CASE_CONTRACT_VERSION,
  );

  assert.equal(
    admission.counterexampleMinimalWitnessDescriptor().candidateInvariantSynthesizerVersion,
    admission.CANDIDATE_INVARIANT_SYNTHESIZER_VERSION,
  );

  assert.equal(
    admission.counterexampleMinimalWitnessDescriptor().createsEvidenceNode,
    true,
  );

  assert.equal(
    admission.counterexampleMinimalWitnessDescriptor().opensRebuttingDefeater,
    true,
  );

  assert.equal(
    admission.counterexampleMinimalWitnessDescriptor().noReplayExecution,
    true,
  );

  assert.equal(
    admission.counterexampleMinimalWitnessDescriptor().noProductionTraffic,
    true,
  );

  assert.equal(
    admission.counterexampleMinimalWitnessDescriptor().noCredentialUse,
    true,
  );

  assert.equal(
    admission.counterexampleMinimalWitnessDescriptor().noAutoClaimRejection,
    true,
  );

  assert.equal(
    admission.counterexampleMinimalWitnessDescriptor().canAdmit,
    false,
  );

  assert.equal(
    typeof admission.createCounterexampleMinimalWitness,
    'function',
  );

  assert.equal(
    admission.CALIBRATION_LOWER_BOUND_RUNNER_VERSION,
    'attestor.calibration-lower-bound-runner.v1',
  );

  assert.equal(
    admission.calibrationLowerBoundRunnerDescriptor().assuranceCaseContractVersion,
    admission.ASSURANCE_CASE_CONTRACT_VERSION,
  );

}
