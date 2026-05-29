import type { Hono } from 'hono';
import {
  RELEASE_ADMIN_READ_ROLES,
  activationView,
  applyBundleCacheHeaders,
  approvalRequestView,
  auditEntryView,
  authorizeReleaseAdminRoute,
  bundleDetailView,
  bundleSummaryView,
  createPolicyBundleConditionalResponse,
  filterAuditEntries,
  findRequiredBundle,
  noStore,
  packView,
  paginateReleasePolicyList,
  parseApprovalState,
  policyErrorResponse,
  type ReleasePolicyControlRouteDeps,
} from './release-policy-control-route-context.js';

export function registerReleasePolicyControlReadRoutes(app: Hono, deps: ReleasePolicyControlRouteDeps): void {
  const {
    policyControlPlaneStore: store,
    policyActivationApprovalStore: approvalStore,
    policyMutationAuditLog: auditLog,
  } = deps;

  app.get('/api/v1/admin/release-policy/control-plane', async (c) => {
    const authorized = authorizeReleaseAdminRoute(c, RELEASE_ADMIN_READ_ROLES, deps.currentAdminAuthorized);
    if (authorized instanceof Response) return authorized;

    const snapshot = await store.exportSnapshot();
    const auditVerification = await auditLog.verify();
    noStore(c);
    return c.json({
      storeKind: store.kind,
      metadata: snapshot.metadata,
      counts: {
        packs: snapshot.packs.length,
        bundles: snapshot.bundles.length,
        activations: snapshot.activations.length,
        activationApprovals: (await approvalStore.list()).length,
        auditEntries: (await auditLog.entries()).length,
      },
      audit: {
        valid: auditVerification.valid,
        latestEntryDigest: await auditLog.latestEntryDigest(),
      },
    });
  });

  app.get('/api/v1/admin/release-policy/packs', async (c) => {
    const authorized = authorizeReleaseAdminRoute(c, RELEASE_ADMIN_READ_ROLES, deps.currentAdminAuthorized);
    if (authorized instanceof Response) return authorized;

    const page = paginateReleasePolicyList(await store.listPacks(), c);
    if (page instanceof Response) return page;
    noStore(c);
    return c.json({
      packs: page.items.map(packView),
      pageInfo: page.pageInfo,
    });
  });

  app.get('/api/v1/admin/release-policy/packs/:packId', async (c) => {
    const authorized = authorizeReleaseAdminRoute(c, RELEASE_ADMIN_READ_ROLES, deps.currentAdminAuthorized);
    if (authorized instanceof Response) return authorized;

    const pack = await store.getPack(c.req.param('packId'));
    if (!pack) {
      return c.json({ error: `Policy pack '${c.req.param('packId')}' not found.` }, 404);
    }
    noStore(c);
    return c.json({ pack: packView(pack) });
  });

  app.get('/api/v1/admin/release-policy/packs/:packId/bundles', async (c) => {
    const authorized = authorizeReleaseAdminRoute(c, RELEASE_ADMIN_READ_ROLES, deps.currentAdminAuthorized);
    if (authorized instanceof Response) return authorized;

    const page = paginateReleasePolicyList(await store.listBundleHistory(c.req.param('packId')), c);
    if (page instanceof Response) return page;
    noStore(c);
    return c.json({
      packId: c.req.param('packId'),
      bundles: page.items.map(bundleSummaryView),
      pageInfo: page.pageInfo,
    });
  });

  app.get('/api/v1/admin/release-policy/packs/:packId/versions', async (c) => {
    const authorized = authorizeReleaseAdminRoute(c, RELEASE_ADMIN_READ_ROLES, deps.currentAdminAuthorized);
    if (authorized instanceof Response) return authorized;

    const history = await store.listBundleHistory(c.req.param('packId'));
    const page = paginateReleasePolicyList(history, c);
    if (page instanceof Response) return page;
    noStore(c);
    return c.json({
      packId: c.req.param('packId'),
      versions: page.items.map(bundleSummaryView),
      pageInfo: page.pageInfo,
    });
  });

  app.get('/api/v1/admin/release-policy/packs/:packId/bundles/:bundleId', async (c) => {
    const authorized = authorizeReleaseAdminRoute(c, RELEASE_ADMIN_READ_ROLES, deps.currentAdminAuthorized);
    if (authorized instanceof Response) return authorized;

    const record = await findRequiredBundle(store, c.req.param('packId'), c.req.param('bundleId'));
    if (!record) {
      return c.json({
        error: `Policy bundle '${c.req.param('bundleId')}' in pack '${c.req.param('packId')}' not found.`,
      }, 404);
    }
    const conditional = createPolicyBundleConditionalResponse(
      record,
      c.req.header('if-none-match'),
      {
        now: new Date().toISOString(),
        persisted: store.kind === 'file-backed' || store.kind === 'postgres',
      },
    );
    applyBundleCacheHeaders(c, conditional.descriptor);
    if (conditional.status === 'not-modified') {
      return c.body(null, 304);
    }
    return c.json({
      bundle: bundleDetailView(record, c),
      cache: conditional.descriptor,
    });
  });

  app.get('/api/v1/admin/release-policy/activation-approvals', async (c) => {
    const authorized = authorizeReleaseAdminRoute(c, RELEASE_ADMIN_READ_ROLES, deps.currentAdminAuthorized);
    if (authorized instanceof Response) return authorized;

    try {
      const requests = await approvalStore.list({
        state: parseApprovalState(c.req.query('state')),
        targetLabel: c.req.query('targetLabel')?.trim() || null,
        packId: c.req.query('packId')?.trim() || null,
        bundleId: c.req.query('bundleId')?.trim() || null,
      });
      const page = paginateReleasePolicyList(requests, c);
      if (page instanceof Response) return page;
      noStore(c);
      return c.json({
        approvalRequests: page.items.map(approvalRequestView),
        pageInfo: page.pageInfo,
      });
    } catch (error) {
      return policyErrorResponse(c, error);
    }
  });

  app.get('/api/v1/admin/release-policy/activation-approvals/:id', async (c) => {
    const authorized = authorizeReleaseAdminRoute(c, RELEASE_ADMIN_READ_ROLES, deps.currentAdminAuthorized);
    if (authorized instanceof Response) return authorized;

    const approvalRequest = await approvalStore.get(c.req.param('id'));
    if (!approvalRequest) {
      return c.json({
        error: `Policy activation approval request '${c.req.param('id')}' not found.`,
      }, 404);
    }
    noStore(c);
    return c.json({ approvalRequest: approvalRequestView(approvalRequest) });
  });

  app.get('/api/v1/admin/release-policy/activations', async (c) => {
    const authorized = authorizeReleaseAdminRoute(c, RELEASE_ADMIN_READ_ROLES, deps.currentAdminAuthorized);
    if (authorized instanceof Response) return authorized;

    const targetLabel = c.req.query('targetLabel')?.trim();
    const state = c.req.query('state')?.trim();
    const activations = (await store
      .listActivations())
      .filter((record) => !targetLabel || record.targetLabel === targetLabel)
      .filter((record) => !state || record.state === state);
    const page = paginateReleasePolicyList(activations, c);
    if (page instanceof Response) return page;
    noStore(c);
    return c.json({
      activations: page.items.map(activationView),
      pageInfo: page.pageInfo,
    });
  });

  app.get('/api/v1/admin/release-policy/activations/:id', async (c) => {
    const authorized = authorizeReleaseAdminRoute(c, RELEASE_ADMIN_READ_ROLES, deps.currentAdminAuthorized);
    if (authorized instanceof Response) return authorized;

    const record = await store.getActivation(c.req.param('id'));
    if (!record) {
      return c.json({ error: `Policy activation '${c.req.param('id')}' not found.` }, 404);
    }
    noStore(c);
    return c.json({ activation: activationView(record) });
  });

  app.get('/api/v1/admin/release-policy/audit', async (c) => {
    const authorized = authorizeReleaseAdminRoute(c, RELEASE_ADMIN_READ_ROLES, deps.currentAdminAuthorized);
    if (authorized instanceof Response) return authorized;

    const entries = filterAuditEntries(await auditLog.entries(), c);
    if (entries instanceof Response) return entries;
    const includeSnapshots = c.req.query('includeSnapshots') === 'true';
    const verification = await auditLog.verify();
    noStore(c);
    return c.json({
      verification,
      latestEntryDigest: await auditLog.latestEntryDigest(),
      entries: entries.map((entry) => auditEntryView(entry, includeSnapshots)),
    });
  });

  app.get('/api/v1/admin/release-policy/audit/verify', async (c) => {
    const authorized = authorizeReleaseAdminRoute(c, RELEASE_ADMIN_READ_ROLES, deps.currentAdminAuthorized);
    if (authorized instanceof Response) return authorized;

    noStore(c);
    return c.json({
      verification: await auditLog.verify(),
      latestEntryDigest: await auditLog.latestEntryDigest(),
    });
  });
}
