import type { Context, Hono } from 'hono';
import {
  recordAuthAttemptFailureShared as recordAuthAttemptFailure,
  recordAuthAttemptSuccessShared as recordAuthAttemptSuccess,
  recordAuthAttemptUseShared as recordAuthAttemptUse,
} from '../../account/auth-abuse-guard.js';
import { AccountUserManagementServiceError } from '../../application/account-user-management-service.js';
import type { AccountMutationAuditInput, AccountRouteDeps } from './account-routes.js';
import {
  beginAccountMutationIdempotency as beginSharedAccountMutationIdempotency,
  type AccountMutationIdempotencyBegin,
  finalizeAccountMutationIdempotency as finalizeSharedAccountMutationIdempotency,
} from './account-mutation-idempotency.js';
import type { PipelineIdempotencyReadyResult } from '../../application/pipeline-idempotency-service.js';
import type { AccountAccessContext } from '../../tenant-isolation.js';
import {
  accountApiKeyServiceErrorResponse,
  accountPasswordErrorResponse,
  accountUserManagementServiceErrorResponse,
  accountUserRoleFilter,
  AUTH_ATTEMPT_KIND,
  authAttemptBucket,
  authAttemptFor,
  authAttemptForActionToken,
  maybeRateLimitAuthAttempt,
  readAccountJsonBody,
} from './account-route-helpers.js';

export function registerAccountAdminUserRoutes(app: Hono, deps: AccountRouteDeps): void {
  const {
    apiKeyService,
    userManagementService,
    setSessionCookieForRecord,
    accountUserView,
    adminAccountView,
    accountApiKeyView,
    requireAccountSession,
    currentAccountAccess,
    accountUserActionTokenView,
    recordAccountMutationAudit,
    accountMutationIdempotencyService,
  } = deps;

  async function recordAccountSessionMutationAudit(input: AccountMutationAuditInput): Promise<void> {
    await recordAccountMutationAudit(input);
  }

  async function beginAccountMutationIdempotency(
    c: Context,
    access: AccountAccessContext,
    routeId: string,
    requestPayload: unknown,
  ): Promise<AccountMutationIdempotencyBegin> {
    return beginSharedAccountMutationIdempotency(
      c,
      access,
      routeId,
      requestPayload,
      accountMutationIdempotencyService,
    );
  }

  async function finalizeAccountMutationIdempotency(
    access: AccountAccessContext,
    routeId: string,
    requestPayload: unknown,
    idempotency: PipelineIdempotencyReadyResult | null,
    statusCode: number,
    responseBody: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return finalizeSharedAccountMutationIdempotency(
      access,
      routeId,
      requestPayload,
      idempotency,
      statusCode,
      responseBody,
      accountMutationIdempotencyService,
    );
  }

  app.get('/api/v1/account/api-keys', async (c) => {
    const unauthorized = requireAccountSession(c, {
      roles: ['account_admin'],
    });
    if (unauthorized) return unauthorized;
    const access = currentAccountAccess(c)!;
    try {
      const result = await apiKeyService.list(access.accountId);
      return c.json({
        keys: result.keys.map((entry) => accountApiKeyView(entry)),
        defaults: result.defaults,
      });
    } catch (err) {
      const mapped = accountApiKeyServiceErrorResponse(c, err);
      if (mapped) return mapped;
      throw err;
    }
  });

  app.post('/api/v1/account/api-keys', async (c) => {
    const unauthorized = requireAccountSession(c, {
      roles: ['account_admin'],
    });
    if (unauthorized) return unauthorized;
    const access = currentAccountAccess(c)!;
    const routeId = 'account.api_keys.issue';
    const requestPayload = { accountId: access.accountId, action: 'issue' };
    const idempotency = await beginAccountMutationIdempotency(c, access, routeId, requestPayload);
    if (idempotency.kind === 'response') return idempotency.response;
    try {
      const issued = await apiKeyService.issue(access.accountId);
      await recordAccountSessionMutationAudit({
        routeId,
        action: 'account.api_key.issued',
        access,
        requestPayload,
        statusCode: 201,
        tenantId: issued.record.tenantId,
        tenantKeyId: issued.record.id,
        planId: issued.record.planId,
        idempotencyKey: idempotency.ready?.idempotencyKey ?? null,
        metadata: {
          keyStatus: issued.record.status,
        },
      });
      const responseBody = await finalizeAccountMutationIdempotency(access, routeId, requestPayload, idempotency.ready, 201, {
        key: {
          ...accountApiKeyView(issued.record),
          apiKey: issued.apiKey,
        },
      });
      return c.json(responseBody, 201);
    } catch (err) {
      const mapped = accountApiKeyServiceErrorResponse(c, err);
      if (mapped) return mapped;
      throw err;
    }
  });

  app.post('/api/v1/account/api-keys/:id/rotate', async (c) => {
    const unauthorized = requireAccountSession(c, {
      roles: ['account_admin'],
    });
    if (unauthorized) return unauthorized;
    const access = currentAccountAccess(c)!;
    const keyId = c.req.param('id');
    const routeId = 'account.api_keys.rotate';
    const requestPayload = { accountId: access.accountId, keyId };
    const idempotency = await beginAccountMutationIdempotency(c, access, routeId, requestPayload);
    if (idempotency.kind === 'response') return idempotency.response;
    try {
      const rotated = await apiKeyService.rotate(access.accountId, keyId);
      await recordAccountSessionMutationAudit({
        routeId,
        action: 'account.api_key.rotated',
        access,
        requestPayload,
        statusCode: 201,
        tenantId: rotated.record.tenantId,
        tenantKeyId: rotated.record.id,
        planId: rotated.record.planId,
        idempotencyKey: idempotency.ready?.idempotencyKey ?? null,
        metadata: {
          rotatedFromKeyId: rotated.previousRecord.id,
        },
      });
      const responseBody = await finalizeAccountMutationIdempotency(access, routeId, requestPayload, idempotency.ready, 201, {
        previousKey: accountApiKeyView(rotated.previousRecord),
        newKey: {
          ...accountApiKeyView(rotated.record),
          apiKey: rotated.apiKey,
        },
      });
      return c.json(responseBody, 201);
    } catch (err) {
      const mapped = accountApiKeyServiceErrorResponse(c, err);
      if (mapped) return mapped;
      throw err;
    }
  });

  app.post('/api/v1/account/api-keys/:id/deactivate', async (c) => {
    const unauthorized = requireAccountSession(c, {
      roles: ['account_admin'],
    });
    if (unauthorized) return unauthorized;
    const access = currentAccountAccess(c)!;
    const keyId = c.req.param('id');
    const routeId = 'account.api_keys.deactivate';
    const requestPayload = { accountId: access.accountId, keyId, status: 'inactive' };
    const idempotency = await beginAccountMutationIdempotency(c, access, routeId, requestPayload);
    if (idempotency.kind === 'response') return idempotency.response;
    try {
      const result = await apiKeyService.setStatus(access.accountId, keyId, 'inactive');
      await recordAccountSessionMutationAudit({
        routeId,
        action: 'account.api_key.deactivated',
        access,
        requestPayload,
        statusCode: 200,
        tenantId: result.record.tenantId,
        tenantKeyId: result.record.id,
        planId: result.record.planId,
        idempotencyKey: idempotency.ready?.idempotencyKey ?? null,
        metadata: {
          keyStatus: result.record.status,
        },
      });
      const responseBody = await finalizeAccountMutationIdempotency(access, routeId, requestPayload, idempotency.ready, 200, {
        key: accountApiKeyView(result.record),
      });
      return c.json(responseBody);
    } catch (err) {
      const mapped = accountApiKeyServiceErrorResponse(c, err);
      if (mapped) return mapped;
      throw err;
    }
  });

  app.post('/api/v1/account/api-keys/:id/reactivate', async (c) => {
    const unauthorized = requireAccountSession(c, {
      roles: ['account_admin'],
    });
    if (unauthorized) return unauthorized;
    const access = currentAccountAccess(c)!;
    const keyId = c.req.param('id');
    const routeId = 'account.api_keys.reactivate';
    const requestPayload = { accountId: access.accountId, keyId, status: 'active' };
    const idempotency = await beginAccountMutationIdempotency(c, access, routeId, requestPayload);
    if (idempotency.kind === 'response') return idempotency.response;
    try {
      const result = await apiKeyService.setStatus(access.accountId, keyId, 'active');
      await recordAccountSessionMutationAudit({
        routeId,
        action: 'account.api_key.reactivated',
        access,
        requestPayload,
        statusCode: 200,
        tenantId: result.record.tenantId,
        tenantKeyId: result.record.id,
        planId: result.record.planId,
        idempotencyKey: idempotency.ready?.idempotencyKey ?? null,
        metadata: {
          keyStatus: result.record.status,
        },
      });
      const responseBody = await finalizeAccountMutationIdempotency(access, routeId, requestPayload, idempotency.ready, 200, {
        key: accountApiKeyView(result.record),
      });
      return c.json(responseBody);
    } catch (err) {
      const mapped = accountApiKeyServiceErrorResponse(c, err);
      if (mapped) return mapped;
      throw err;
    }
  });

  app.post('/api/v1/account/api-keys/:id/revoke', async (c) => {
    const unauthorized = requireAccountSession(c, {
      roles: ['account_admin'],
    });
    if (unauthorized) return unauthorized;
    const access = currentAccountAccess(c)!;
    const keyId = c.req.param('id');
    const routeId = 'account.api_keys.revoke';
    const requestPayload = { accountId: access.accountId, keyId };
    const idempotency = await beginAccountMutationIdempotency(c, access, routeId, requestPayload);
    if (idempotency.kind === 'response') return idempotency.response;
    try {
      const result = await apiKeyService.revoke(access.accountId, keyId);
      await recordAccountSessionMutationAudit({
        routeId,
        action: 'account.api_key.revoked',
        access,
        requestPayload,
        statusCode: 200,
        tenantId: result.record.tenantId,
        tenantKeyId: result.record.id,
        planId: result.record.planId,
        idempotencyKey: idempotency.ready?.idempotencyKey ?? null,
        metadata: {
          keyStatus: result.record.status,
        },
      });
      const responseBody = await finalizeAccountMutationIdempotency(access, routeId, requestPayload, idempotency.ready, 200, {
        key: accountApiKeyView(result.record),
      });
      return c.json(responseBody);
    } catch (err) {
      const mapped = accountApiKeyServiceErrorResponse(c, err);
      if (mapped) return mapped;
      throw err;
    }
  });

  app.get('/api/v1/account/users', async (c) => {
    const unauthorized = requireAccountSession(c, {
      roles: ['account_admin'],
    });
    if (unauthorized) return unauthorized;
    const access = currentAccountAccess(c)!;
    const users = await userManagementService.listUsers(access.accountId);
    return c.json({
      users: users.map(accountUserView),
    });
  });

  app.post('/api/v1/account/users', async (c) => {
    const unauthorized = requireAccountSession(c, {
      roles: ['account_admin'],
    });
    if (unauthorized) return unauthorized;
    const access = currentAccountAccess(c)!;
    const body = await readAccountJsonBody(c);
    if (body instanceof Response) return body;
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const role = accountUserRoleFilter(typeof body.role === 'string' ? body.role.trim() : null);
    if (!email || !displayName || !password || !role) {
      return c.json({ error: 'email, displayName, password, and role are required.' }, 400);
    }
    const passwordPolicyError = accountPasswordErrorResponse(c, password, 'password', {
      displayName,
      email,
    });
    if (passwordPolicyError) return passwordPolicyError;
    const routeId = 'account.users.create';
    const requestPayload = {
      accountId: access.accountId,
      email,
      displayName,
      role,
    };
    const idempotency = await beginAccountMutationIdempotency(c, access, routeId, requestPayload);
    if (idempotency.kind === 'response') return idempotency.response;

    try {
      const created = await userManagementService.createUser({
        accountId: access.accountId,
        email,
        displayName,
        password,
        role,
      });
      await recordAccountSessionMutationAudit({
        routeId,
        action: 'account.user.created',
        access,
        requestPayload,
        statusCode: 201,
        idempotencyKey: idempotency.ready?.idempotencyKey ?? null,
        metadata: {
          targetUserId: created.id,
          targetRole: created.role,
        },
      });
      const responseBody = await finalizeAccountMutationIdempotency(access, routeId, requestPayload, idempotency.ready, 201, {
        user: accountUserView(created),
      });
      return c.json(responseBody, 201);
    } catch (err) {
      const mapped = accountUserManagementServiceErrorResponse(c, err);
      if (mapped) return mapped;
      throw err;
    }
  });

  app.get('/api/v1/account/users/invites', async (c) => {
    const unauthorized = requireAccountSession(c, {
      roles: ['account_admin'],
    });
    if (unauthorized) return unauthorized;
    const access = currentAccountAccess(c)!;
    const invites = await userManagementService.listInvites(access.accountId);
    return c.json({
      invites: invites.map(accountUserActionTokenView),
    });
  });

  app.post('/api/v1/account/users/invites', async (c) => {
    const unauthorized = requireAccountSession(c, {
      roles: ['account_admin'],
    });
    if (unauthorized) return unauthorized;
    const access = currentAccountAccess(c)!;
    const body = await readAccountJsonBody(c);
    if (body instanceof Response) return body;
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';
    const role = accountUserRoleFilter(typeof body.role === 'string' ? body.role.trim() : null);
    const expiresHours = typeof body.expiresHours === 'number' ? body.expiresHours : null;
    if (!email || !displayName || !role) {
      return c.json({ error: 'email, displayName, and role are required.' }, 400);
    }
    const routeId = 'account.users.invites.issue';
    const requestPayload = {
      accountId: access.accountId,
      email,
      displayName,
      role,
      expiresHours,
    };
    const idempotency = await beginAccountMutationIdempotency(c, access, routeId, requestPayload);
    if (idempotency.kind === 'response') return idempotency.response;
    try {
      const issued = await userManagementService.issueInvite({
        accountId: access.accountId,
        actorUserId: access.accountUserId,
        email,
        displayName,
        role,
        expiresHours,
      });
      await recordAccountSessionMutationAudit({
        routeId,
        action: 'account.user.invite_issued',
        access,
        requestPayload,
        statusCode: 201,
        idempotencyKey: idempotency.ready?.idempotencyKey ?? null,
        metadata: {
          inviteId: issued.record.id,
          targetRole: issued.record.role,
          tokenReturned: issued.delivery.tokenReturned,
          deliveryMode: issued.delivery.mode,
        },
      });
      const responseBody = await finalizeAccountMutationIdempotency(access, routeId, requestPayload, idempotency.ready, 201, {
        invite: accountUserActionTokenView(issued.record),
        ...(issued.delivery.tokenReturned ? { inviteToken: issued.token } : {}),
        delivery: issued.delivery,
      });
      return c.json(responseBody, 201);
    } catch (err) {
      const mapped = accountUserManagementServiceErrorResponse(c, err);
      if (mapped) return mapped;
      throw err;
    }
  });

  app.post('/api/v1/account/users/invites/:id/revoke', async (c) => {
    const unauthorized = requireAccountSession(c, {
      roles: ['account_admin'],
    });
    if (unauthorized) return unauthorized;
    const access = currentAccountAccess(c)!;
    const inviteId = c.req.param('id');
    const routeId = 'account.users.invites.revoke';
    const requestPayload = { accountId: access.accountId, inviteId };
    const idempotency = await beginAccountMutationIdempotency(c, access, routeId, requestPayload);
    if (idempotency.kind === 'response') return idempotency.response;
    try {
      const revoked = await userManagementService.revokeInvite(access.accountId, inviteId);
      await recordAccountSessionMutationAudit({
        routeId,
        action: 'account.user.invite_revoked',
        access,
        requestPayload,
        statusCode: 200,
        idempotencyKey: idempotency.ready?.idempotencyKey ?? null,
        metadata: {
          inviteId: revoked.id,
          targetRole: revoked.role,
        },
      });
      const responseBody = await finalizeAccountMutationIdempotency(access, routeId, requestPayload, idempotency.ready, 200, {
        invite: accountUserActionTokenView(revoked),
      });
      return c.json(responseBody);
    } catch (err) {
      const mapped = accountUserManagementServiceErrorResponse(c, err);
      if (mapped) return mapped;
      throw err;
    }
  });

  app.post('/api/v1/account/users/invites/accept', async (c) => {
    const body = await readAccountJsonBody(c);
    if (body instanceof Response) return body;
    const inviteToken = typeof body.inviteToken === 'string' ? body.inviteToken.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const authAttempt = authAttemptForActionToken(c, AUTH_ATTEMPT_KIND.invite, inviteToken);
    const inviteAcceptRateLimit = await maybeRateLimitAuthAttempt(c, authAttempt);
    if (inviteAcceptRateLimit) return inviteAcceptRateLimit;
    try {
      const accepted = await userManagementService.acceptInvite({
        inviteToken,
        password,
      });
      await recordAuthAttemptSuccess(authAttempt);
      setSessionCookieForRecord(c, accepted.sessionToken, accepted.session.expiresAt);
      return c.json({
        accepted: true,
        session: {
          id: accepted.session.id,
          expiresAt: accepted.session.expiresAt,
          source: 'account_session',
        },
        user: accountUserView(accepted.user),
        account: adminAccountView(accepted.account),
      }, 201);
    } catch (err) {
      const mapped = accountUserManagementServiceErrorResponse(c, err);
      if (mapped) {
        if (err instanceof AccountUserManagementServiceError && err.statusCode === 400) {
          await recordAuthAttemptFailure(authAttempt);
        }
        return mapped;
      }
      throw err;
    }
  });

  app.post('/api/v1/account/users/:id/deactivate', async (c) => {
    const unauthorized = requireAccountSession(c, {
      roles: ['account_admin'],
    });
    if (unauthorized) return unauthorized;
    const access = currentAccountAccess(c)!;
    const targetUserId = c.req.param('id');
    const routeId = 'account.users.deactivate';
    const requestPayload = { accountId: access.accountId, targetUserId, status: 'inactive' };
    const idempotency = await beginAccountMutationIdempotency(c, access, routeId, requestPayload);
    if (idempotency.kind === 'response') return idempotency.response;
    try {
      const updated = await userManagementService.setUserStatus(access.accountId, targetUserId, 'inactive');
      await recordAccountSessionMutationAudit({
        routeId,
        action: 'account.user.deactivated',
        access,
        requestPayload,
        statusCode: 200,
        idempotencyKey: idempotency.ready?.idempotencyKey ?? null,
        metadata: {
          targetUserId: updated.record.id,
          targetRole: updated.record.role,
        },
      });
      const responseBody = await finalizeAccountMutationIdempotency(access, routeId, requestPayload, idempotency.ready, 200, {
        user: accountUserView(updated.record),
      });
      return c.json(responseBody);
    } catch (err) {
      const mapped = accountUserManagementServiceErrorResponse(c, err);
      if (mapped) return mapped;
      throw err;
    }
  });

  app.post('/api/v1/account/users/:id/reactivate', async (c) => {
    const unauthorized = requireAccountSession(c, {
      roles: ['account_admin'],
    });
    if (unauthorized) return unauthorized;
    const access = currentAccountAccess(c)!;
    const targetUserId = c.req.param('id');
    const routeId = 'account.users.reactivate';
    const requestPayload = { accountId: access.accountId, targetUserId, status: 'active' };
    const idempotency = await beginAccountMutationIdempotency(c, access, routeId, requestPayload);
    if (idempotency.kind === 'response') return idempotency.response;
    try {
      const updated = await userManagementService.setUserStatus(access.accountId, targetUserId, 'active');
      await recordAccountSessionMutationAudit({
        routeId,
        action: 'account.user.reactivated',
        access,
        requestPayload,
        statusCode: 200,
        idempotencyKey: idempotency.ready?.idempotencyKey ?? null,
        metadata: {
          targetUserId: updated.record.id,
          targetRole: updated.record.role,
        },
      });
      const responseBody = await finalizeAccountMutationIdempotency(access, routeId, requestPayload, idempotency.ready, 200, {
        user: accountUserView(updated.record),
      });
      return c.json(responseBody);
    } catch (err) {
      const mapped = accountUserManagementServiceErrorResponse(c, err);
      if (mapped) return mapped;
      throw err;
    }
  });

  app.post('/api/v1/account/users/:id/password-reset', async (c) => {
    const unauthorized = requireAccountSession(c, {
      roles: ['account_admin'],
    });
    if (unauthorized) return unauthorized;
    const access = currentAccountAccess(c)!;
    const body = await readAccountJsonBody(c);
    if (body instanceof Response) return body;
    const ttlMinutes = typeof body.ttlMinutes === 'number' ? body.ttlMinutes : null;
    const targetUserId = c.req.param('id');
    const requestPayload = { accountId: access.accountId, targetUserId, ttlMinutes };
    const authAttempt = authAttemptFor(c, authAttemptBucket(
      AUTH_ATTEMPT_KIND.passwordResetIssue,
      access.accountId,
      targetUserId,
    ));
    const resetIssueRateLimit = await maybeRateLimitAuthAttempt(c, authAttempt);
    if (resetIssueRateLimit) return resetIssueRateLimit;
    const routeId = 'account.users.password_reset.issue';
    const idempotency = await beginAccountMutationIdempotency(c, access, routeId, requestPayload);
    if (idempotency.kind === 'response') return idempotency.response;
    await recordAuthAttemptUse(authAttempt);
    try {
      const issued = await userManagementService.issuePasswordReset({
        accountId: access.accountId,
        actorUserId: access.accountUserId,
        targetUserId,
        ttlMinutes,
      });
      await recordAccountSessionMutationAudit({
        routeId,
        action: 'account.user.password_reset_issued',
        access,
        requestPayload,
        statusCode: 201,
        idempotencyKey: idempotency.ready?.idempotencyKey ?? null,
        metadata: {
          resetTokenId: issued.record.id,
          targetUserId: issued.record.accountUserId,
          tokenReturned: issued.delivery.tokenReturned,
          deliveryMode: issued.delivery.mode,
        },
      });
      const responseBody = await finalizeAccountMutationIdempotency(access, routeId, requestPayload, idempotency.ready, 201, {
        reset: accountUserActionTokenView(issued.record),
        ...(issued.delivery.tokenReturned ? { resetToken: issued.token } : {}),
        delivery: issued.delivery,
      });
      return c.json(responseBody, 201);
    } catch (err) {
      const mapped = accountUserManagementServiceErrorResponse(c, err);
      if (mapped) return mapped;
      throw err;
    }
  });
}
