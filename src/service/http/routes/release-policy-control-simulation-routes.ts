import type { Hono } from 'hono';
import {
  RELEASE_ADMIN_MUTATION_ROLES,
  authorizeReleaseAdminRoute,
  createPolicyImpactApi,
  createPolicySimulationApi,
  findRequiredBundle,
  isJsonRecord,
  noStore,
  optionalString,
  parseActivationTarget,
  parseJsonBody,
  policyErrorResponse,
  requiredString,
  routeAdminActor,
  snapshotPolicyStore,
  type ReleasePolicyControlRouteDeps,
} from './release-policy-control-route-context.js';

export function registerReleasePolicyControlSimulationRoutes(app: Hono, deps: ReleasePolicyControlRouteDeps): void {
  const {
    policyControlPlaneStore: store,
  } = deps;

  app.post('/api/v1/admin/release-policy/resolve', async (c) => {
    const authorized = authorizeReleaseAdminRoute(c, RELEASE_ADMIN_MUTATION_ROLES, deps.currentAdminAuthorized);
    if (authorized instanceof Response) return authorized;

    const body = await parseJsonBody(c);
    if (body instanceof Response) return body;
    try {
      const resolverInput = (body.resolverInput ?? body.input ?? body) as never;
      const result = createPolicySimulationApi(await snapshotPolicyStore(store)).resolveCurrent(resolverInput);
      noStore(c);
      return c.json({ resolution: result });
    } catch (error) {
      return policyErrorResponse(c, error);
    }
  });

  app.post('/api/v1/admin/release-policy/simulations', async (c) => {
    const authorized = authorizeReleaseAdminRoute(c, RELEASE_ADMIN_MUTATION_ROLES, deps.currentAdminAuthorized);
    if (authorized instanceof Response) return authorized;

    const body = await parseJsonBody(c);
    if (body instanceof Response) return body;
    try {
      const overlaySource = body.overlay;
      if (!isJsonRecord(overlaySource)) {
        return c.json({ error: 'overlay must be provided as an object.' }, 400);
      }
      const packId = requiredString(overlaySource, 'packId');
      const bundleId = requiredString(overlaySource, 'bundleId');
      const bundle = await findRequiredBundle(store, packId, bundleId);
      if (!bundle) {
        return c.json({ error: `Policy bundle '${bundleId}' in pack '${packId}' not found.` }, 404);
      }
      const resolverInput = (body.resolverInput ?? body.input) as never;
      if (!resolverInput) {
        return c.json({ error: 'resolverInput is required.' }, 400);
      }
      const preview = createPolicyImpactApi(await snapshotPolicyStore(store)).previewCandidateActivation(resolverInput, {
        bundleRecord: bundle,
        target: parseActivationTarget(overlaySource.target),
        discoveryMode: (optionalString(overlaySource, 'discoveryMode') ?? undefined) as never,
        activationId: optionalString(overlaySource, 'activationId') ?? undefined,
        actor: routeAdminActor(c),
        activatedAt: optionalString(overlaySource, 'activatedAt') ?? undefined,
        reasonCode: optionalString(overlaySource, 'reasonCode') ?? 'simulation',
        rationale:
          optionalString(overlaySource, 'rationale') ??
          `Simulate policy bundle ${bundle.bundleId}.`,
      });
      noStore(c);
      return c.json({ preview });
    } catch (error) {
      return policyErrorResponse(c, error);
    }
  });
}
