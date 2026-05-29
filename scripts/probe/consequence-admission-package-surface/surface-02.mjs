export async function runConsequenceAdmissionPackageSurface02({ assert, root, admission }) {
  assert.equal(
    admission.consequenceFailureModeGuardCoverageMatrix().entries.some((entry) =>
      entry.failureModeId === 'agentic-supply-chain-compromise' &&
      entry.coverageKind === 'dedicated-guard'
    ),
    true,
  );

  assert.equal(
    admission.consequenceAdmissionDescriptor().agenticSupplyChainGuardVersion,
    'attestor.consequence-agentic-supply-chain-guard.v1',
  );

  assert.equal(
    admission.consequenceAgenticSupplyChainGuardDescriptor().requiresVerifiedProvenance,
    true,
  );

  assert.equal(
    admission.consequenceAgenticSupplyChainGuardDescriptor().rejectsOverbroadPermissions,
    true,
  );

  assert.equal(
    admission.evaluateConsequenceAgenticSupplyChain({
      generatedAt: '2026-05-14T00:00:00.000Z',
      components: [],
    }).outcome,
    'review',
  );

  assert.equal(
    admission.consequenceAdmissionDescriptor().multiAgentDelegationGuardVersion,
    'attestor.consequence-multi-agent-delegation-guard.v1',
  );

  assert.equal(
    admission.consequenceMultiAgentDelegationGuardDescriptor().requiresPrincipalChain,
    true,
  );

  assert.equal(
    admission.consequenceMultiAgentDelegationGuardDescriptor().rejectsSelfApproval,
    true,
  );

  assert.equal(
    admission.evaluateConsequenceMultiAgentDelegation({
      generatedAt: '2026-05-14T00:00:00.000Z',
      principalChain: [],
    }).outcome,
    'review',
  );

  assert.equal(
    admission.consequenceDomainPackBoundaryDescriptor().primaryRole,
    'pack',
  );

  assert.equal(
    admission.consequenceDomainPackBoundaryDescriptor().surfaces.some((surface) =>
      surface.kind === 'crypto-admission-projection'
    ),
    true,
  );

  assert.equal(
    admission.consequenceAdmissionDescriptor().domainPackBoundary.separateProductIdentityAllowed,
    false,
  );

  assert.equal(
    admission.consequenceAdmissionDescriptor().domainPackBoundary.sharedContractsRequired.includes(
      'attestor.consequence-replay-layer-placement.v1',
    ),
    true,
  );

  assert.equal(
    admission.consequenceAdmissionDescriptor().controlPlaneRoles.includes('pdp'),
    true,
  );

  assert.equal(
    admission.attestorControlPlaneRoleDescriptor('pep').name,
    'Policy Enforcement Point',
  );

  assert.equal(
    admission.attestorControlPlaneRoleDescriptor('pip').mayApproveActionByItself,
    false,
  );

  assert.equal(
    admission.consequenceAdmissionPackDecisionProfileDescriptor().signalKinds.includes(
      'crypto-adapter-readiness-posture',
    ),
    true,
  );

  assert.equal(
    admission.consequenceDataMinimizationRedactionPolicyDescriptor().surfaceKinds.includes(
      'pack-decision-profile',
    ),
    true,
  );

  assert.equal(
    typeof admission.createConsequenceAdmissionPackDecisionProfile,
    'function',
  );

  assert.equal(
    typeof admission.evaluateConsequenceDataMinimizationArtifact,
    'function',
  );

  assert.equal(
    admission.consequenceAdmissionPolicyLimitDescriptor().limitKinds.includes('velocity'),
    true,
  );

  assert.equal(
    typeof admission.evaluateConsequenceAdmissionPolicyLimits,
    'function',
  );

  assert.equal(
    admission.consequenceAdmissionPresentationBindingDescriptor().bindingFields.includes(
      'body-digest',
    ),
    true,
  );

  assert.equal(
    admission.consequenceAdmissionPresentationBindingDescriptor().supportsReplayKeyDigestObservations,
    true,
  );

  assert.equal(
    admission.consequenceAdmissionPresentationBindingDescriptor().canonicalUsesReplayKeyDigest,
    true,
  );

  assert.equal(
    admission.consequenceAdmissionPresentationBindingDescriptor().canonicalUsesTargetDigest,
    true,
  );

  assert.equal(
    admission.consequenceAdmissionPresentationBindingDescriptor().canonicalUsesEnforcementPointIdDigest,
    true,
  );

  assert.equal(
    admission.consequenceAdmissionPresentationBindingDescriptor().canonicalUsesDownstreamSystemDigest,
    true,
  );

  assert.equal(
    admission.consequenceAdmissionPresentationBindingDescriptor().canonicalUsesPolicyRefDigest,
    true,
  );

  assert.equal(
    admission.consequenceAdmissionPresentationBindingDescriptor().canonicalUsesConstraintIdDigests,
    true,
  );

  assert.equal(
    typeof admission.evaluateConsequenceAdmissionPresentationBinding,
    'function',
  );

  assert.equal(
    admission.consequenceAdmissionPresentationReplayLedgerDescriptor().failureReasons.includes(
      'replay-key-already-consumed',
    ),
    true,
  );

  assert.equal(
    typeof admission.createConsequenceAdmissionPresentationReplayLedger,
    'function',
  );

  assert.equal(
    admission.consequenceAdmissionDownstreamExecutionReceiptDescriptor().statuses.includes(
      'succeeded',
    ),
    true,
  );

  assert.equal(
    typeof admission.recordConsequenceAdmissionDownstreamExecution,
    'function',
  );

  assert.equal(
    admission.consequenceAdmissionRetryAttemptLedgerDescriptor().failureReasons.includes(
      'idempotency-key-conflict',
    ),
    true,
  );

  assert.equal(
    typeof admission.createConsequenceAdmissionRetryAttemptLedger,
    'function',
  );

  assert.equal(
    typeof admission.createConsequenceAdmissionRetryAttemptBinding,
    'function',
  );

  assert.equal(
    admission.consequenceAdmissionAgentLoopAbuseGuardDescriptor().reasonCodes.includes(
      'agent-loop-policy-probing-risk',
    ),
    true,
  );

  assert.equal(
    admission.consequenceAdmissionDescriptor().agentLoopAbuseGuardOutcomes.includes('throttle'),
    true,
  );

  assert.equal(
    typeof admission.createConsequenceAdmissionAgentLoopAbuseGuard,
    'function',
  );

  assert.equal(
    admission.CONSEQUENCE_ENVELOPE_CONTRACT_VERSION,
    'attestor.consequence-envelope-contract.v1',
  );

  assert.equal(
    admission.consequenceEnvelopeContractDescriptor().requiredFields.includes(
      'canonicalActionType',
    ),
    true,
  );

  assert.equal(
    admission.consequenceEnvelopeContractDescriptor().digestOnlyRefsRequired,
    true,
  );

  assert.equal(
    admission.consequenceEnvelopeContractDescriptor().grantsAuthority,
    false,
  );

  assert.equal(
    admission.consequenceEnvelopeContractDescriptor().rawWalletMaterialStored,
    false,
  );

  assert.equal(
    admission.SIGNAL_RELATIONSHIP_CONTRACT_VERSION,
    'attestor.signal-relationship-contract.v1',
  );

  assert.equal(
    admission.signalRelationshipContractDescriptor().categoryBoundSignalKindsRequired,
    true,
  );

  assert.equal(
    admission.signalRelationshipContractDescriptor().directedRelationshipKinds.includes(
      'overrides',
    ),
    true,
  );

  assert.equal(
    admission.signalRelationshipContractDescriptor().unaryRelationshipKinds.includes(
      'requires_review',
    ),
    true,
  );

  assert.equal(
    admission.signalRelationshipContractDescriptor().grantsAuthority,
    false,
  );

  assert.equal(
    admission.LAYER_OPINION_SCHEMA_VERSION,
    'attestor.layer-opinion-schema.v1',
  );

  assert.equal(
    admission.layerOpinionSchemaDescriptor().advisoryOnly,
    true,
  );

  assert.equal(
    admission.layerOpinionSchemaDescriptor().positions.includes(
      'no-advisory-objection',
    ),
    true,
  );

  assert.equal(
    admission.layerOpinionSchemaDescriptor().abstentionIsFirstClass,
    true,
  );

  assert.equal(
    admission.layerOpinionSchemaDescriptor().mayMarkSafe,
    false,
  );

  assert.equal(
    admission.MODULATOR_AUTHORITY_TIER_VERSION,
    'attestor.modulator-authority-tier.v1',
  );

  assert.equal(
    admission.modulatorAuthorityTierDescriptor().dimensions.includes('freshness'),
    true,
  );

  assert.equal(
    admission.modulatorAuthorityTierDescriptor().preservesHardFloor,
    true,
  );

  assert.equal(
    admission.modulatorAuthorityTierDescriptor().maySuppressHardDeny,
    false,
  );

  assert.equal(
    admission.modulatorAuthorityTierDescriptor().mayMarkSafe,
    false,
  );

  assert.equal(
    admission.RELATIONSHIP_AWARE_MONOTONE_FUSION_VERSION,
    'attestor.relationship-aware-monotone-fusion.v1',
  );

  assert.equal(
    admission.relationshipAwareMonotoneFusionDescriptor().duplicateDiscountSupported,
    true,
  );

  assert.equal(
    admission.relationshipAwareMonotoneFusionDescriptor().hardFloorPreservationRequired,
    true,
  );

  assert.equal(
    admission.relationshipAwareMonotoneFusionDescriptor().grantsAuthority,
    false,
  );

  assert.equal(
    typeof admission.fuseRelationshipAwareMonotoneHazard,
    'function',
  );

  assert.equal(
    admission.CONFLICT_ABSTENTION_GATE_VERSION,
    'attestor.conflict-abstention-gate.v1',
  );

  assert.equal(
    admission.conflictAbstentionGateDescriptor().uncertaintyCannotAdmit,
    true,
  );

  assert.equal(
    admission.conflictAbstentionGateDescriptor().canAdmit,
    false,
  );

  assert.equal(
    admission.conflictAbstentionGateDescriptor().grantsAuthority,
    false,
  );

  assert.equal(
    typeof admission.evaluateConflictAbstentionGate,
    'function',
  );

  assert.equal(
    admission.HUMAN_COMPREHENSION_GATE_VERSION,
    'attestor.human-comprehension-gate.v1',
  );

  assert.equal(
    admission.humanComprehensionGateDescriptor().maxReasonLinesEnforced,
    true,
  );

  assert.equal(
    admission.humanComprehensionGateDescriptor().activeQuestionCapEnforced,
    true,
  );

  assert.equal(
    admission.humanComprehensionGateDescriptor().canAdmit,
    false,
  );

  assert.equal(
    typeof admission.evaluateHumanComprehensionGate,
    'function',
  );

  assert.equal(
    admission.SIGNED_ASSURANCE_PACKET_VERSION,
    'attestor.signed-assurance-packet.v1',
  );

  assert.equal(
    admission.signedAssurancePacketDescriptor().digestOnlyRefs,
    true,
  );

  assert.equal(
    admission.signedAssurancePacketDescriptor().tamperEvidentHistoryBound,
    true,
  );

}
