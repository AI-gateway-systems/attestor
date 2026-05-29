export async function runConsequenceAdmissionPackageSurface01({ assert, root, admission }) {
  assert.equal(
    root.CONSEQUENCE_ADMISSION_FACADE_SPEC_VERSION,
    'attestor.consequence-admission-facade.v1',
  );

  assert.equal(
    root.consequenceAdmissionFacadeDescriptor().publicSubpath,
    'attestor/consequence-admission',
  );

  assert.equal(
    admission.CONSEQUENCE_ADMISSION_FACADE_SPEC_VERSION,
    'attestor.consequence-admission-facade.v1',
  );

  assert.equal(
    admission.consequenceAdmissionFacadeDescriptor().publicSubpath,
    'attestor/consequence-admission',
  );

  assert.equal(
    admission.consequenceAdmissionFacadeDescriptor().automaticPackDetection,
    false,
  );

  assert.equal(
    admission.consequenceAdmissionFacadeDescriptor().entryPoints.financePipelineRun.route,
    '/api/v1/pipeline/run',
  );

  assert.equal(
    admission.consequenceAdmissionFacadeDescriptor().entryPoints.cryptoExecutionPlan.route,
    null,
  );

  assert.equal(
    admission.consequenceAdmissionFacadeDescriptor().entryPoints.cryptoExecutionPlan.packageSubpath,
    'attestor/crypto-execution-admission',
  );

  assert.equal(
    admission.consequenceAdmissionDescriptor().consequenceDomains.includes('programmable-money'),
    true,
  );

  assert.equal(
    admission.consequenceAdmissionDomainProfile('money-movement').controlRequirements.includes(
      'non-bypassable-integration',
    ),
    true,
  );

  assert.equal(
    admission.consequenceAdmissionDownstreamContractDescriptor().bindingFields.includes(
      'idempotency-key',
    ),
    true,
  );

  assert.equal(
    admission.consequenceAdmissionDownstreamContractDescriptor().decisionExposesRawConstraints,
    false,
  );

  assert.equal(
    admission.consequenceAdmissionDownstreamContractDescriptor().decisionConstraintReferenceMode,
    'digests-only',
  );

  assert.equal(
    typeof admission.evaluateConsequenceAdmissionDownstreamContract,
    'function',
  );

  assert.equal(
    admission.consequenceAdmissionVerifierHelperDescriptor().cryptographicTokenVerification,
    false,
  );

  assert.equal(
    typeof admission.createConsequenceAdmissionVerifier,
    'function',
  );

  assert.equal(
    admission.consequenceAdmissionAdapterFrameworkDescriptor().adapterKinds.includes(
      'mcp-tool-wrapper',
    ),
    true,
  );

  assert.equal(
    admission.consequenceAdmissionDescriptor().adapterKinds.includes('tool-wrapper'),
    true,
  );

  assert.equal(
    typeof admission.createConsequenceAdmissionProtectedAdapter,
    'function',
  );

  assert.equal(
    admission.consequenceAuditEvidenceExportDescriptor().artifactKinds.includes(
      'shadow-event-set',
    ),
    true,
  );

  assert.equal(
    admission.consequenceAdmissionDescriptor().auditEvidenceFindingKinds.includes(
      'raw-payload-present',
    ),
    true,
  );

  assert.equal(
    typeof admission.createConsequenceAuditEvidenceExport,
    'function',
  );

  assert.equal(
    admission.consequenceTamperEvidentHistoryDescriptor().entryKinds.includes(
      'audit-evidence-export',
    ),
    true,
  );

  assert.equal(
    admission.consequenceAdmissionDescriptor().tamperEvidentHistoryEntryKinds.includes(
      'downstream-execution-receipt',
    ),
    true,
  );

  assert.equal(
    typeof admission.createConsequenceTamperEvidentHistoryLedger,
    'function',
  );

  assert.equal(
    admission.consequenceBusinessRiskDashboardDescriptor().widgets.includes(
      'consequence-domain-risk',
    ),
    true,
  );

  assert.equal(
    admission.consequenceAdmissionDescriptor().businessRiskSignals.includes(
      'policy-gap',
    ),
    true,
  );

  assert.equal(
    typeof admission.createConsequenceBusinessRiskDashboard,
    'function',
  );

  assert.equal(
    admission.consequenceDashboardApiSummaryDescriptor().tileKinds.includes(
      'policy-gaps',
    ),
    true,
  );

  assert.equal(
    admission.consequenceDashboardApiSummaryDescriptor().attentionKinds.includes(
      'define-policy',
    ),
    true,
  );

  assert.equal(
    admission.consequenceAdmissionDescriptor().dashboardApiSummaryLinkKinds.includes(
      'business-risk-dashboard',
    ),
    true,
  );

  assert.equal(
    typeof admission.createConsequenceDashboardApiSummary,
    'function',
  );

  assert.equal(
    admission.consequenceExternalReviewPacketDescriptor().focusAreas.includes(
      'proof-integrity',
    ),
    true,
  );

  assert.equal(
    admission.consequenceExternalReviewPacketDescriptor().evidenceKinds.includes(
      'supply-chain-baseline',
    ),
    true,
  );

  assert.equal(
    admission.consequenceAdmissionDescriptor().externalReviewFindingKinds.includes(
      'external-review-required',
    ),
    true,
  );

  assert.equal(
    typeof admission.createConsequenceExternalReviewPacket,
    'function',
  );

  assert.equal(
    admission.consequenceDataMinimizationRedactionPolicyDescriptor().surfaceKinds.includes(
      'audit-evidence-export',
    ),
    true,
  );

  assert.equal(
    admission.consequenceDataMinimizationRedactionPolicyDescriptor().surfaceKinds.includes(
      'dashboard-api-summary',
    ),
    true,
  );

  assert.equal(
    admission.consequenceDataMinimizationRedactionPolicyDescriptor().surfaceKinds.includes(
      'external-review-packet',
    ),
    true,
  );

  assert.equal(
    admission.consequenceAdmissionDescriptor().dataMinimizationForbiddenRawClasses.includes(
      'credential-or-secret',
    ),
    true,
  );

  assert.equal(
    admission.consequenceAdmissionDescriptor().packDecisionProfileVersion,
    'attestor.consequence-admission-pack-decision-profile.v1',
  );

  assert.equal(
    admission.consequenceAdmissionDescriptor().domainPackBoundaryVersion,
    'attestor.consequence-domain-pack-boundary.v1',
  );

  assert.equal(
    admission.consequenceAdmissionDescriptor().controlPlaneRoleVersion,
    'attestor.control-plane-roles.v1',
  );

  assert.equal(
    admission.consequenceAdmissionDescriptor().failureModeRegistryPlacementVersion,
    'attestor.consequence-failure-mode-registry-placement.v1',
  );

  assert.equal(
    admission.consequenceFailureModeRegistryPlacementDescriptor().owningLayer,
    'shared-control-layer',
  );

  assert.equal(
    admission.consequenceAdmissionDescriptor().failureModeRegistryPlacement.sourceFiles.includes(
      'src/consequence-admission/failure-mode-control-bindings.ts',
    ),
    true,
  );

  assert.equal(
    admission.consequenceAdmissionDescriptor().failureModeRegistryPlacement.sourceFiles.includes(
      'src/consequence-admission/failure-mode-runtime-extensions.ts',
    ),
    true,
  );

  assert.equal(
    admission.consequenceAdmissionDescriptor().failureModeRegistryPlacement.nonOwningRoles.includes(
      'pack',
    ),
    true,
  );

  assert.equal(
    admission.consequenceAdmissionDescriptor().failureModeRuntimeExtensionVersion,
    'attestor.consequence-failure-mode-runtime-extension.v1',
  );

  assert.equal(
    admission.consequenceFailureModeRuntimeExtensionDescriptor().mutatesCanonicalRegistry,
    false,
  );

  assert.equal(
    admission.consequenceFailureModeRuntimeExtensionDescriptor().requiresOwnerAuthorityDigest,
    true,
  );

  assert.equal(
    admission.evaluateConsequenceFailureModeRuntimeExtensions({
      generatedAt: '2026-05-14T00:00:00.000Z',
      extensions: [],
    }).outcome,
    'review',
  );

  assert.equal(
    admission.consequenceAdmissionDescriptor().replayLayerPlacementVersion,
    'attestor.consequence-replay-layer-placement.v1',
  );

  assert.equal(
    admission.consequenceReplayLayerPlacementDescriptor().primaryRole,
    'replay',
  );

  assert.equal(
    admission.consequenceAdmissionDescriptor().replayLayerPlacement.surfaces.some((surface) =>
      surface.kind === 'presentation-replay-consumption'
    ),
    true,
  );

  assert.equal(
    admission.consequenceAdmissionDescriptor().replayLayerPlacement.nonOwningRoles.includes(
      'hosted-service',
    ),
    true,
  );

  assert.equal(
    admission.consequenceAdmissionDescriptor().guardActivationReadinessVersion,
    'attestor.consequence-guard-activation-readiness.v1',
  );

  assert.equal(
    admission.consequenceGuardActivationReadinessDescriptor().separatesDecisionRenderingFromEnforcement,
    true,
  );

  assert.equal(
    admission.consequenceGuardActivationReadinessDescriptor().guardIds.includes(
      'tool-result-poisoning-guard',
    ),
    true,
  );

  assert.equal(
    admission.consequenceUntrustedContentAuthorityGuardDescriptor().rejectsUntrustedPromotion,
    true,
  );

  assert.equal(
    admission.consequenceUntrustedContentAuthorityGuardDescriptor().requiresTrustedAuthorityEvidence,
    true,
  );

  assert.equal(
    admission.evaluateConsequenceUntrustedContentAuthority({
      generatedAt: '2026-05-14T00:00:00.000Z',
      sources: [
        {
          sourceKind: 'customer-email',
          claimKind: 'approval',
          sourceRef: 'raw-private-email',
          trustClass: 'trusted-authority',
          evidenceDigest: `sha256:${'0'.repeat(64)}`,
        },
      ],
    }).reasonCodes.includes('trust-class-override-rejected'),
    true,
  );

  assert.equal(
    admission.consequenceGuardActivationReadinessDescriptor().criterionIds.includes(
      'downstream-verifier-integrated',
    ),
    true,
  );

  assert.equal(
    admission.evaluateConsequenceGuardActivationReadiness().productionReady,
    false,
  );

  assert.equal(
    admission.consequenceAdmissionDescriptor().shadowReadinessClaimAlignmentVersion,
    'attestor.shadow-readiness-claim-alignment.v1',
  );

  assert.equal(
    admission.consequenceShadowReadinessClaimAlignmentDescriptor().stageIds.includes(
      'shadow-customer-activation-receipt',
    ),
    true,
  );

  assert.equal(
    admission.consequenceShadowReadinessClaimAlignmentDescriptor().criterionIds.includes(
      'selected-profile-storage-ready',
    ),
    true,
  );

  assert.equal(
    admission.evaluateConsequenceShadowReadinessClaimAlignment({
      runtimeProfileId: 'production-shared',
      productionStoragePath: {
        readyForSelectedProfile: false,
        blockers: [{ code: 'evaluation-store-not-shared', component: 'shadow-admission-events' }],
      },
    }).readyForSelectedProfile,
    false,
  );

  assert.equal(
    admission.evaluateConsequenceShadowReadinessClaimAlignment().productionReady,
    false,
  );

  assert.equal(
    admission.consequenceAdmissionDescriptor().failureModeGuardCoverageVersion,
    'attestor.consequence-failure-mode-guard-coverage.v1',
  );

  assert.equal(
    admission.consequenceFailureModeGuardCoverageMatrix().productionReady,
    false,
  );

}
