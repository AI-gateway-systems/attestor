import { randomUUID } from 'node:crypto';
import type { Hono } from 'hono';
import {
  RELEASE_ADMIN_MUTATION_ROLES,
  activatePolicyBundle,
  activationView,
  applyPolicyLifecycle,
  approvalGateView,
  approvalRequestView,
  auditEntryView,
  authorizeReleaseAdminRoute,
  beginMutation,
  createPolicyMutationAuditSubjectFromActivation,
  evaluateActivationApprovalGate,
  findRequiredBundle,
  finishMutation,
  noStore,
  optionalString,
  parseActivationTarget,
  parseJsonBody,
  parseRolloutMode,
  policyErrorResponse,
  publishStoreMetadata,
  recordActivationApprovalDecision,
  requestActivationApproval,
  requiredString,
  rollbackPolicyActivation,
  routeAdminActor,
  type ReleasePolicyControlRouteDeps,
} from './release-policy-control-route-context.js';

export function registerReleasePolicyControlActivationRoutes(app: Hono, deps: ReleasePolicyControlRouteDeps): void {
  const {
    policyControlPlaneStore: store,
    policyActivationApprovalStore: approvalStore,
    policyMutationAuditLog: auditLog,
  } = deps;

  app.post('/api/v1/admin/release-policy/activation-approvals', async (c) => {
    const authorized = authorizeReleaseAdminRoute(c, RELEASE_ADMIN_MUTATION_ROLES, deps.currentAdminAuthorized);
    if (authorized instanceof Response) return authorized;

    const body = await parseJsonBody(c);
    if (body instanceof Response) return body;
    const routeId = 'admin.release_policy.activation_approvals.request';
    const mutation = await beginMutation(c, deps, routeId, body);
    if (mutation instanceof Response) return mutation;

    try {
      const packId = requiredString(body, 'packId');
      const bundleId = requiredString(body, 'bundleId');
      const target = parseActivationTarget(body.target);
      const bundle = await findRequiredBundle(store, packId, bundleId);
      if (!bundle) {
        return c.json({ error: `Policy bundle '${bundleId}' in pack '${packId}' not found.` }, 404);
      }

      const approvalRequest = await requestActivationApproval(approvalStore, {
        id: optionalString(body, 'approvalRequestId') ?? undefined,
        target,
        bundleRecord: bundle,
        requestedBy: routeAdminActor(c),
        requestedAt: optionalString(body, 'requestedAt') ?? undefined,
        expiresAt: optionalString(body, 'expiresAt') ?? undefined,
        reasonCode: optionalString(body, 'reasonCode') ?? undefined,
        rationale:
          optionalString(body, 'rationale') ??
          `Request approval to activate policy bundle ${bundle.bundleId}.`,
      });
      const audit = await auditLog.append({
        occurredAt: new Date().toISOString(),
        action: 'request-activation-approval',
        actor: routeAdminActor(c),
        subject: {
          packId: approvalRequest.bundle.packId,
          bundleId: approvalRequest.bundle.bundleId,
          bundleVersion: approvalRequest.bundle.bundleVersion,
          activationId: null,
          targetLabel: approvalRequest.targetLabel,
        },
        reasonCode: approvalRequest.reasonCode,
        rationale: approvalRequest.rationale,
        mutationSnapshot: approvalRequest,
      });
      const responseBody = {
        approvalRequest: approvalRequestView(approvalRequest),
        audit: auditEntryView(audit, false),
      };
      const finalized = await finishMutation(deps, {
        ...mutation,
        routeId,
        requestPayload: body,
        statusCode: 201,
        responseBody,
        adminAuditAction: 'policy_activation.approval_requested',
        target,
        metadata: {
          packId,
          bundleId,
          approvalRequestId: approvalRequest.id,
          targetLabel: approvalRequest.targetLabel,
          auditEntryId: audit.entryId,
        },
      });
      noStore(c);
      return c.json(finalized, 201);
    } catch (error) {
      return policyErrorResponse(c, error);
    }
  });

  app.post('/api/v1/admin/release-policy/activation-approvals/:id/approve', async (c) => {
    const authorized = authorizeReleaseAdminRoute(c, RELEASE_ADMIN_MUTATION_ROLES, deps.currentAdminAuthorized);
    if (authorized instanceof Response) return authorized;

    const body = await parseJsonBody(c);
    if (body instanceof Response) return body;
    const routeId = 'admin.release_policy.activation_approvals.approve';
    const mutation = await beginMutation(c, deps, routeId, body);
    if (mutation instanceof Response) return mutation;

    try {
      const approvalRequest = await recordActivationApprovalDecision(approvalStore, {
        requestId: c.req.param('id'),
        decision: 'approve',
        reviewer: routeAdminActor(c),
        decidedAt: optionalString(body, 'decidedAt') ?? undefined,
        rationale: optionalString(body, 'rationale') ?? 'Approve policy activation request.',
      });
      const latestDecision = approvalRequest.decisions.at(-1)!;
      const audit = await auditLog.append({
        occurredAt: new Date().toISOString(),
        action: 'approve-activation',
        actor: routeAdminActor(c),
        subject: {
          packId: approvalRequest.bundle.packId,
          bundleId: approvalRequest.bundle.bundleId,
          bundleVersion: approvalRequest.bundle.bundleVersion,
          activationId: null,
          targetLabel: approvalRequest.targetLabel,
        },
        reasonCode: approvalRequest.reasonCode,
        rationale: latestDecision.rationale,
        mutationSnapshot: approvalRequest,
      });
      const responseBody = {
        approvalRequest: approvalRequestView(approvalRequest),
        decision: latestDecision,
        audit: auditEntryView(audit, false),
      };
      const finalized = await finishMutation(deps, {
        ...mutation,
        routeId,
        requestPayload: body,
        statusCode: 200,
        responseBody,
        adminAuditAction: 'policy_activation.approval_approved',
        target: approvalRequest.target,
        metadata: {
          approvalRequestId: approvalRequest.id,
          targetLabel: approvalRequest.targetLabel,
          reviewerId: latestDecision.reviewer.id,
          auditEntryId: audit.entryId,
        },
      });
      noStore(c);
      return c.json(finalized, 200);
    } catch (error) {
      return policyErrorResponse(c, error);
    }
  });

  app.post('/api/v1/admin/release-policy/activation-approvals/:id/reject', async (c) => {
    const authorized = authorizeReleaseAdminRoute(c, RELEASE_ADMIN_MUTATION_ROLES, deps.currentAdminAuthorized);
    if (authorized instanceof Response) return authorized;

    const body = await parseJsonBody(c);
    if (body instanceof Response) return body;
    const routeId = 'admin.release_policy.activation_approvals.reject';
    const mutation = await beginMutation(c, deps, routeId, body);
    if (mutation instanceof Response) return mutation;

    try {
      const approvalRequest = await recordActivationApprovalDecision(approvalStore, {
        requestId: c.req.param('id'),
        decision: 'reject',
        reviewer: routeAdminActor(c),
        decidedAt: optionalString(body, 'decidedAt') ?? undefined,
        rationale: optionalString(body, 'rationale') ?? 'Reject policy activation request.',
      });
      const latestDecision = approvalRequest.decisions.at(-1)!;
      const audit = await auditLog.append({
        occurredAt: new Date().toISOString(),
        action: 'reject-activation',
        actor: routeAdminActor(c),
        subject: {
          packId: approvalRequest.bundle.packId,
          bundleId: approvalRequest.bundle.bundleId,
          bundleVersion: approvalRequest.bundle.bundleVersion,
          activationId: null,
          targetLabel: approvalRequest.targetLabel,
        },
        reasonCode: approvalRequest.reasonCode,
        rationale: latestDecision.rationale,
        mutationSnapshot: approvalRequest,
      });
      const responseBody = {
        approvalRequest: approvalRequestView(approvalRequest),
        decision: latestDecision,
        audit: auditEntryView(audit, false),
      };
      const finalized = await finishMutation(deps, {
        ...mutation,
        routeId,
        requestPayload: body,
        statusCode: 200,
        responseBody,
        adminAuditAction: 'policy_activation.approval_rejected',
        target: approvalRequest.target,
        metadata: {
          approvalRequestId: approvalRequest.id,
          targetLabel: approvalRequest.targetLabel,
          reviewerId: latestDecision.reviewer.id,
          auditEntryId: audit.entryId,
        },
      });
      noStore(c);
      return c.json(finalized, 200);
    } catch (error) {
      return policyErrorResponse(c, error);
    }
  });

  app.post('/api/v1/admin/release-policy/activations', async (c) => {
    const authorized = authorizeReleaseAdminRoute(c, RELEASE_ADMIN_MUTATION_ROLES, deps.currentAdminAuthorized);
    if (authorized instanceof Response) return authorized;

    const body = await parseJsonBody(c);
    if (body instanceof Response) return body;
    const routeId = 'admin.release_policy.activations.activate';
    const mutation = await beginMutation(c, deps, routeId, body);
    if (mutation instanceof Response) return mutation;

    try {
      const packId = requiredString(body, 'packId');
      const bundleId = requiredString(body, 'bundleId');
      const target = parseActivationTarget(body.target);
      const bundle = await findRequiredBundle(store, packId, bundleId);
      if (!bundle) {
        return c.json({ error: `Policy bundle '${bundleId}' in pack '${packId}' not found.` }, 404);
      }
      const approvalGate = await evaluateActivationApprovalGate(approvalStore, {
        target,
        bundleRecord: bundle,
        approvalRequestId: optionalString(body, 'approvalRequestId'),
        now: optionalString(body, 'activatedAt') ?? undefined,
      });
      if (!approvalGate.allowed) {
        return c.json({
          error: approvalGate.message,
          approval: approvalGateView(approvalGate),
        }, 409);
      }
      const lifecycle = await applyPolicyLifecycle(store, (localStore) => activatePolicyBundle(localStore, {
        id: optionalString(body, 'activationId') ?? `activation_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
        target,
        bundle: bundle.manifest.bundle,
        activatedBy: routeAdminActor(c),
        activatedAt: optionalString(body, 'activatedAt') ?? new Date().toISOString(),
        rolloutMode: parseRolloutMode(body.rolloutMode),
        reasonCode: optionalString(body, 'reasonCode') ?? 'activate-bundle',
        rationale: optionalString(body, 'rationale') ?? `Activate policy bundle ${bundle.bundleId}.`,
      }));
      await publishStoreMetadata(store, bundle, lifecycle.appliedRecord.id);
      const audit = await auditLog.append({
        occurredAt: new Date().toISOString(),
        action: 'activate-bundle',
        actor: routeAdminActor(c),
        subject: createPolicyMutationAuditSubjectFromActivation(lifecycle.appliedRecord),
        reasonCode: lifecycle.appliedRecord.reasonCode,
        rationale: lifecycle.appliedRecord.rationale,
        mutationSnapshot: lifecycle,
      });
      const responseBody = {
        activation: activationView(lifecycle.appliedRecord),
        lifecycle,
        approval: approvalGateView(approvalGate),
        audit: auditEntryView(audit, false),
      };
      const finalized = await finishMutation(deps, {
        ...mutation,
        routeId,
        requestPayload: body,
        statusCode: 201,
        responseBody,
        adminAuditAction: 'policy_activation.activated',
        target,
        metadata: {
          packId,
          bundleId,
          activationId: lifecycle.appliedRecord.id,
          approvalRequestId: approvalGate.request?.id ?? null,
          targetLabel: lifecycle.targetLabel,
          auditEntryId: audit.entryId,
        },
      });
      noStore(c);
      return c.json(finalized, 201);
    } catch (error) {
      return policyErrorResponse(c, error);
    }
  });

  app.post('/api/v1/admin/release-policy/activations/:id/rollback', async (c) => {
    const authorized = authorizeReleaseAdminRoute(c, RELEASE_ADMIN_MUTATION_ROLES, deps.currentAdminAuthorized);
    if (authorized instanceof Response) return authorized;

    const body = await parseJsonBody(c);
    if (body instanceof Response) return body;
    const routeId = 'admin.release_policy.activations.rollback';
    const mutation = await beginMutation(c, deps, routeId, body);
    if (mutation instanceof Response) return mutation;

    try {
      const rollbackTarget = await store.getActivation(c.req.param('id'));
      if (!rollbackTarget) {
        return c.json({ error: `Policy activation '${c.req.param('id')}' not found.` }, 404);
      }
      const lifecycle = await applyPolicyLifecycle(store, (localStore) => rollbackPolicyActivation(localStore, {
        id: optionalString(body, 'activationId') ?? `rollback_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
        target: rollbackTarget.target,
        rollbackTargetActivationId: rollbackTarget.id,
        activatedBy: routeAdminActor(c),
        activatedAt: optionalString(body, 'activatedAt') ?? new Date().toISOString(),
        reasonCode: optionalString(body, 'reasonCode') ?? 'rollback',
        rationale: optionalString(body, 'rationale') ?? `Rollback to policy activation ${rollbackTarget.id}.`,
      }));
      const bundle = await findRequiredBundle(
        store,
        lifecycle.appliedRecord.bundle.packId,
        lifecycle.appliedRecord.bundle.bundleId,
      );
      if (bundle) {
        await publishStoreMetadata(store, bundle, lifecycle.appliedRecord.id);
      }
      const audit = await auditLog.append({
        occurredAt: new Date().toISOString(),
        action: 'rollback-activation',
        actor: routeAdminActor(c),
        subject: createPolicyMutationAuditSubjectFromActivation(lifecycle.appliedRecord),
        reasonCode: lifecycle.appliedRecord.reasonCode,
        rationale: lifecycle.appliedRecord.rationale,
        mutationSnapshot: lifecycle,
      });
      const responseBody = {
        activation: activationView(lifecycle.appliedRecord),
        lifecycle,
        audit: auditEntryView(audit, false),
      };
      const finalized = await finishMutation(deps, {
        ...mutation,
        routeId,
        requestPayload: body,
        statusCode: 201,
        responseBody,
        adminAuditAction: 'policy_activation.rolled_back',
        target: lifecycle.appliedRecord.target,
        metadata: {
          rollbackTargetActivationId: rollbackTarget.id,
          activationId: lifecycle.appliedRecord.id,
          targetLabel: lifecycle.targetLabel,
          auditEntryId: audit.entryId,
        },
      });
      noStore(c);
      return c.json(finalized, 201);
    } catch (error) {
      return policyErrorResponse(c, error);
    }
  });
}
