export async function runConsequenceAdmissionPackageSurface04({ assert, root, admission }) {
  assert.equal(
    admission.shadowOutboxWorkItemContractDescriptor().outboxWriteIncluded,
    false,
  );

  assert.equal(
    admission.shadowOutboxWorkItemContractDescriptor().canAdmit,
    false,
  );

  assert.equal(
    typeof admission.createShadowOutboxWorkItemContract,
    'function',
  );

  assert.equal(
    admission.SHADOW_DISPATCH_CLAIM_CONTRACT_VERSION,
    'attestor.shadow-dispatch-claim-contract.v1',
  );

  assert.equal(
    admission.SHADOW_DISPATCH_CLAIM_TOKEN_VERSION,
    'attestor.shadow-dispatch-claim-token.v1',
  );

  assert.equal(
    admission.shadowDispatchClaimContractDescriptor().sourceWorkItemContractVersion,
    admission.SHADOW_OUTBOX_WORK_ITEM_CONTRACT_VERSION,
  );

  assert.equal(
    admission.shadowDispatchClaimContractDescriptor().sourceWorkItemEventType,
    admission.SHADOW_OUTBOX_WORK_ITEM_EVENT_TYPE,
  );

  assert.equal(
    admission.shadowDispatchClaimContractDescriptor().rowLockSemantics,
    'for-update-skip-locked',
  );

  assert.equal(
    admission.shadowDispatchClaimContractDescriptor().claimLeaseSemantics,
    'time-bounded-lease',
  );

  assert.equal(
    admission.shadowDispatchClaimContractDescriptor().retrySemantics,
    'bounded-attempt-increment',
  );

  assert.equal(
    admission.shadowDispatchClaimContractDescriptor().claimContractIncluded,
    true,
  );

  assert.equal(
    admission.shadowDispatchClaimContractDescriptor().claimStorageMutationIncluded,
    false,
  );

  assert.equal(
    admission.shadowDispatchClaimContractDescriptor().runnerInvocationIncluded,
    false,
  );

  assert.equal(
    admission.shadowDispatchClaimContractDescriptor().canAdmit,
    false,
  );

  assert.equal(
    typeof admission.createShadowDispatchClaimContract,
    'function',
  );

  assert.equal(
    admission.SHADOW_RUNTIME_ACTIVATION_RUNNER_VERSION,
    'attestor.shadow-runtime-activation-runner.v1',
  );

  assert.equal(
    admission.shadowRuntimeActivationRunnerDescriptor().sourceClaimContractVersion,
    admission.SHADOW_DISPATCH_CLAIM_CONTRACT_VERSION,
  );

  assert.equal(
    admission.shadowRuntimeActivationRunnerDescriptor().shadowRuntimePipelineVersion,
    admission.SHADOW_RUNTIME_PIPELINE_VERSION,
  );

  assert.equal(
    admission.shadowRuntimeActivationRunnerDescriptor().calls,
    'runShadowRuntimePipelineDryRun',
  );

  assert.equal(
    admission.shadowRuntimeActivationRunnerDescriptor().executionMode,
    'shadow-only',
  );

  assert.equal(
    admission.shadowRuntimeActivationRunnerDescriptor().claimLeaseRequired,
    true,
  );

  assert.equal(
    admission.shadowRuntimeActivationRunnerDescriptor().eventDigestMustMatchClaim,
    true,
  );

  assert.equal(
    admission.shadowRuntimeActivationRunnerDescriptor().runnerInvocationIncluded,
    true,
  );

  assert.equal(
    admission.shadowRuntimeActivationRunnerDescriptor().workerBehaviorIncluded,
    false,
  );

  assert.equal(
    admission.shadowRuntimeActivationRunnerDescriptor().claimStorageMutationIncluded,
    false,
  );

  assert.equal(
    admission.shadowRuntimeActivationRunnerDescriptor().outboxWriteIncluded,
    false,
  );

  assert.equal(
    admission.shadowRuntimeActivationRunnerDescriptor().canAdmit,
    false,
  );

  assert.equal(
    admission.shadowRuntimeActivationRunnerDescriptor().activatesEnforcement,
    false,
  );

  assert.equal(
    admission.shadowRuntimeActivationRunnerDescriptor().productionReady,
    false,
  );

  assert.equal(
    typeof admission.runShadowRuntimeActivation,
    'function',
  );

  assert.equal(
    admission.SHADOW_RUNTIME_OBSERVABILITY_HOOKS_VERSION,
    'attestor.shadow-runtime-observability-hooks.v1',
  );

  assert.equal(
    admission.shadowRuntimeObservabilityHooksDescriptor().shadowRuntimeActivationRunnerVersion,
    admission.SHADOW_RUNTIME_ACTIVATION_RUNNER_VERSION,
  );

  assert.equal(
    admission.shadowRuntimeObservabilityHooksDescriptor().shadowRuntimePipelineVersion,
    admission.SHADOW_RUNTIME_PIPELINE_VERSION,
  );

  assert.equal(
    admission.shadowRuntimeObservabilityHooksDescriptor().decisionTraceLoggerVersion,
    admission.DECISION_TRACE_LOGGER_VERSION,
  );

  assert.equal(
    admission.shadowRuntimeObservabilityHooksDescriptor().runtimeMonitorSkeletonVersion,
    admission.RUNTIME_MONITOR_SKELETON_VERSION,
  );

  assert.equal(
    admission.shadowRuntimeObservabilityHooksDescriptor().assuranceCaseContractVersion,
    admission.ASSURANCE_CASE_CONTRACT_VERSION,
  );

  assert.equal(
    admission.shadowRuntimeObservabilityHooksDescriptor().decisionLineageGraphVersion,
    admission.DECISION_LINEAGE_GRAPH_VERSION,
  );

  assert.equal(
    admission.shadowRuntimeObservabilityHooksDescriptor().assuranceMeasurementPlaneVersion,
    admission.ASSURANCE_MEASUREMENT_PLANE_VERSION,
  );

  assert.equal(
    admission.shadowRuntimeObservabilityHooksDescriptor().traceHooked,
    true,
  );

  assert.equal(
    admission.shadowRuntimeObservabilityHooksDescriptor().lineageHooked,
    true,
  );

  assert.equal(
    admission.shadowRuntimeObservabilityHooksDescriptor().measurementHookOptional,
    true,
  );

  assert.equal(
    admission.shadowRuntimeObservabilityHooksDescriptor().writesAuditPlane,
    false,
  );

  assert.equal(
    admission.shadowRuntimeObservabilityHooksDescriptor().measurementAuthorityIncluded,
    false,
  );

  assert.equal(
    admission.shadowRuntimeObservabilityHooksDescriptor().canAdmit,
    false,
  );

  assert.equal(
    typeof admission.runShadowRuntimeObservabilityHooks,
    'function',
  );

  assert.equal(
    admission.SHADOW_RUNTIME_OUTCOME_FEEDBACK_HOOK_VERSION,
    'attestor.shadow-runtime-outcome-feedback-hook.v1',
  );

  assert.equal(
    admission.shadowRuntimeOutcomeFeedbackHookDescriptor().shadowRuntimeObservabilityHooksVersion,
    admission.SHADOW_RUNTIME_OBSERVABILITY_HOOKS_VERSION,
  );

  assert.equal(
    admission.shadowRuntimeOutcomeFeedbackHookDescriptor().outcomeIncidentFeedbackContractVersion,
    admission.OUTCOME_INCIDENT_FEEDBACK_CONTRACT_VERSION,
  );

  assert.equal(
    admission.shadowRuntimeOutcomeFeedbackHookDescriptor().outcomeFeedbackCoeWiringVersion,
    admission.OUTCOME_FEEDBACK_COE_WIRING_VERSION,
  );

  assert.equal(
    admission.shadowRuntimeOutcomeFeedbackHookDescriptor().assuranceCaseContractVersion,
    admission.ASSURANCE_CASE_CONTRACT_VERSION,
  );

  assert.equal(
    admission.shadowRuntimeOutcomeFeedbackHookDescriptor().decisionLineageGraphVersion,
    admission.DECISION_LINEAGE_GRAPH_VERSION,
  );

  assert.equal(
    admission.shadowRuntimeOutcomeFeedbackHookDescriptor().requiresR06Observability,
    true,
  );

  assert.equal(
    admission.shadowRuntimeOutcomeFeedbackHookDescriptor().requiresPacketDigestBinding,
    true,
  );

  assert.equal(
    admission.shadowRuntimeOutcomeFeedbackHookDescriptor().writesAuditPlane,
    false,
  );

  assert.equal(
    admission.shadowRuntimeOutcomeFeedbackHookDescriptor().mutatesPolicy,
    false,
  );

  assert.equal(
    admission.shadowRuntimeOutcomeFeedbackHookDescriptor().activatesLearning,
    false,
  );

  assert.equal(
    admission.shadowRuntimeOutcomeFeedbackHookDescriptor().canAdmit,
    false,
  );

  assert.equal(
    typeof admission.runShadowRuntimeOutcomeFeedbackHook,
    'function',
  );

  assert.equal(
    admission.SHADOW_RUNTIME_FIXTURE_REPLAY_SMOKE_VERSION,
    'attestor.shadow-runtime-fixture-replay-smoke.v1',
  );

  assert.equal(
    admission.shadowRuntimeFixtureReplaySmokeDescriptor().canonicalShadowEventSchemaVersion,
    admission.CANONICAL_SHADOW_EVENT_SCHEMA_VERSION,
  );

  assert.equal(
    admission.shadowRuntimeFixtureReplaySmokeDescriptor().shadowActivationProfileContractVersion,
    admission.SHADOW_ACTIVATION_PROFILE_CONTRACT_VERSION,
  );

  assert.equal(
    admission.shadowRuntimeFixtureReplaySmokeDescriptor().shadowOutboxWorkItemContractVersion,
    admission.SHADOW_OUTBOX_WORK_ITEM_CONTRACT_VERSION,
  );

  assert.equal(
    admission.shadowRuntimeFixtureReplaySmokeDescriptor().shadowDispatchClaimContractVersion,
    admission.SHADOW_DISPATCH_CLAIM_CONTRACT_VERSION,
  );

  assert.equal(
    admission.shadowRuntimeFixtureReplaySmokeDescriptor().shadowRuntimeActivationRunnerVersion,
    admission.SHADOW_RUNTIME_ACTIVATION_RUNNER_VERSION,
  );

  assert.equal(
    admission.shadowRuntimeFixtureReplaySmokeDescriptor().shadowRuntimeObservabilityHooksVersion,
    admission.SHADOW_RUNTIME_OBSERVABILITY_HOOKS_VERSION,
  );

  assert.equal(
    admission.shadowRuntimeFixtureReplaySmokeDescriptor().shadowRuntimeOutcomeFeedbackHookVersion,
    admission.SHADOW_RUNTIME_OUTCOME_FEEDBACK_HOOK_VERSION,
  );

  assert.equal(
    admission.shadowRuntimeFixtureReplaySmokeDescriptor().runsR02ThroughR07,
    true,
  );

  assert.equal(
    admission.shadowRuntimeFixtureReplaySmokeDescriptor().noTargetSystemCall,
    true,
  );

  assert.equal(
    admission.shadowRuntimeFixtureReplaySmokeDescriptor().noAuditWrite,
    true,
  );

  assert.equal(
    admission.shadowRuntimeFixtureReplaySmokeDescriptor().canAdmit,
    false,
  );

  assert.equal(
    typeof admission.runShadowRuntimeFixtureReplaySmoke,
    'function',
  );

  assert.equal(
    admission.DECISION_TRACE_LOGGER_VERSION,
    'attestor.decision-trace-logger.v1',
  );

  assert.equal(
    admission.decisionTraceLoggerDescriptor().shadowRuntimePipelineVersion,
    admission.SHADOW_RUNTIME_PIPELINE_VERSION,
  );

  assert.equal(
    admission.decisionTraceLoggerDescriptor().ttlRequired,
    true,
  );

  assert.equal(
    admission.decisionTraceLoggerDescriptor().replayRejected,
    true,
  );

  assert.equal(
    admission.decisionTraceLoggerDescriptor().digestOnly,
    true,
  );

  assert.equal(
    admission.decisionTraceLoggerDescriptor().writesAuditPlane,
    false,
  );

  assert.equal(
    admission.decisionTraceLoggerDescriptor().canAdmit,
    false,
  );

  assert.equal(
    typeof admission.createDecisionTraceLogger,
    'function',
  );

  assert.equal(
    typeof admission.verifyDecisionTraceEntries,
    'function',
  );

  assert.equal(
    admission.BASELINE_COHORT_CONTRACT_VERSION,
    'attestor.baseline-cohort-contract.v1',
  );

  assert.equal(
    admission.baselineCohortContractDescriptor().canonicalShadowEventSchemaVersion,
    admission.CANONICAL_SHADOW_EVENT_SCHEMA_VERSION,
  );

  assert.equal(
    admission.baselineCohortContractDescriptor().shadowRuntimePipelineVersion,
    admission.SHADOW_RUNTIME_PIPELINE_VERSION,
  );

  assert.equal(
    admission.baselineCohortContractDescriptor().excludesBlockedTraffic,
    true,
  );

  assert.equal(
    admission.baselineCohortContractDescriptor().noAutoPromotion,
    true,
  );

  assert.equal(
    admission.baselineCohortContractDescriptor().learnsFromTraffic,
    false,
  );

}
