import type { Context, Hono } from 'hono';
import {
  createActionRiskInventory,
  createConsequenceAuditEvidenceExport,
  createConsequenceBusinessRiskDashboard,
  createConsequenceDashboardApiSummary,
  createShadowPolicyDiscoveryCandidates,
  createShadowSummarySurface,
  type ShadowAdmissionEvent,
  type ShadowPolicySimulationReport,
} from '../../../consequence-admission/index.js';
import type { TenantContext } from '../../tenant-isolation.js';
import type { ShadowRouteDeps } from './shadow-routes.js';
import {
  assertTenantBoundRecords,
  boundedErrorDetail,
  problem,
  tenantSummary,
} from './shadow-route-helpers.js';

export type SafeShadowSummaryResult = {
  readonly tenant: TenantContext;
  readonly events: readonly ShadowAdmissionEvent[];
  readonly simulations: readonly ShadowPolicySimulationReport[];
  readonly surface: ReturnType<typeof createShadowSummarySurface>;
};

export function safeShadowSummary(
  c: Context,
  deps: ShadowRouteDeps,
  tenantInput?: TenantContext,
): SafeShadowSummaryResult | Response {
  c.header('cache-control', 'no-store');

  try {
    const tenant = tenantInput ?? deps.currentTenant(c);
    const events = assertTenantBoundRecords(
      tenant,
      deps.listShadowEvents({ tenant }),
      'shadow admission event',
      { allowNullTenantId: true },
    );
    const simulations = deps.listShadowSimulations?.({ tenant }) ?? [];
    const surface = createShadowSummarySurface({
      events,
      simulations,
      generatedAt: deps.now?.() ?? null,
      proposedMode: 'review',
    });

    return {
      tenant,
      events,
      simulations,
      surface,
    };
  } catch (error) {
    return problem(c, {
      type: 'https://attestor.dev/problems/shadow-summary-unavailable',
      title: 'Shadow summary unavailable',
      status: 503,
      detail: boundedErrorDetail(error, 'The shadow summary could not be evaluated.', {
        tenantBoundarySafeDetail: 'The shadow summary rejected a tenant boundary violation.',
      }),
      reasonCodes: ['shadow-summary-unavailable'],
    });
  }
}

function simulationsForAuditEvidence(input: {
  readonly simulations: readonly ShadowPolicySimulationReport[];
  readonly latestSimulation: ShadowPolicySimulationReport | null;
}): readonly ShadowPolicySimulationReport[] {
  if (input.simulations.length > 0) return input.simulations;
  return input.latestSimulation ? Object.freeze([input.latestSimulation]) : Object.freeze([]);
}

export function registerShadowSummaryDashboardRoutes(app: Hono, deps: ShadowRouteDeps): void {
  app.get('/api/v1/shadow/summary', (c) => {
    const result = safeShadowSummary(c, deps);
    if (result instanceof Response) return result;

    return c.json({
      tenant: tenantSummary(result.tenant),
      ...result.surface,
    });
  });

  app.get('/api/v1/shadow/recommendations', (c) => {
    const result = safeShadowSummary(c, deps);
    if (result instanceof Response) return result;

    return c.json({
      tenant: tenantSummary(result.tenant),
      version: result.surface.version,
      generatedAt: result.surface.generatedAt,
      storageMode: result.surface.storageMode,
      productionReady: result.surface.productionReady,
      rawPayloadStored: result.surface.rawPayloadStored,
      eventCount: result.surface.eventCount,
      recommendationCount: result.surface.recommendations.length,
      recommendations: result.surface.recommendations,
      latestSimulationDigest: result.surface.latestSimulation?.digest ?? null,
      source: 'shadow-summary',
    });
  });

  app.get('/api/v1/shadow/action-risk-inventory', (c) => {
    const result = safeShadowSummary(c, deps);
    if (result instanceof Response) return result;

    return c.json({
      tenant: tenantSummary(result.tenant),
      ...createActionRiskInventory({
        events: result.events,
        generatedAt: deps.now?.() ?? null,
      }),
    });
  });

  app.get('/api/v1/shadow/audit-evidence', (c) => {
    const result = safeShadowSummary(c, deps);
    if (result instanceof Response) return result;
    const policyDiscovery = createShadowPolicyDiscoveryCandidates({
      report: result.surface.latestSimulation,
      generatedAt: result.surface.generatedAt,
    });
    const auditEvidence = createConsequenceAuditEvidenceExport({
      events: result.events,
      summarySurface: result.surface,
      simulations: simulationsForAuditEvidence({
        simulations: result.simulations,
        latestSimulation: result.surface.latestSimulation,
      }),
      policyDiscovery,
      generatedAt: result.surface.generatedAt,
      tenantId: result.tenant.tenantId,
    });

    return c.json({
      tenant: tenantSummary(result.tenant),
      storageMode: result.surface.storageMode,
      productionReady: false,
      complianceClaimed: false,
      approvalRequired: true,
      autoEnforce: false,
      rawPayloadStored: false,
      source: 'shadow-summary',
      auditEvidence,
    });
  });

  app.get('/api/v1/shadow/business-risk-dashboard', (c) => {
    const result = safeShadowSummary(c, deps);
    if (result instanceof Response) return result;
    const policyDiscovery = createShadowPolicyDiscoveryCandidates({
      report: result.surface.latestSimulation,
      generatedAt: result.surface.generatedAt,
    });
    const auditEvidence = createConsequenceAuditEvidenceExport({
      events: result.events,
      summarySurface: result.surface,
      simulations: simulationsForAuditEvidence({
        simulations: result.simulations,
        latestSimulation: result.surface.latestSimulation,
      }),
      policyDiscovery,
      generatedAt: result.surface.generatedAt,
      tenantId: result.tenant.tenantId,
    });
    const dashboard = createConsequenceBusinessRiskDashboard({
      auditExport: auditEvidence,
      generatedAt: result.surface.generatedAt,
    });

    return c.json({
      tenant: tenantSummary(result.tenant),
      storageMode: result.surface.storageMode,
      productionReady: false,
      complianceClaimed: false,
      decisionSupportOnly: true,
      autoEnforce: false,
      rawPayloadStored: false,
      rawImpactValueStored: false,
      impactMode: dashboard.impactMode,
      source: 'audit-evidence',
      auditEvidenceDigest: auditEvidence.digest,
      dashboard,
    });
  });

  app.get('/api/v1/shadow/dashboard-summary', (c) => {
    const result = safeShadowSummary(c, deps);
    if (result instanceof Response) return result;
    const policyDiscovery = createShadowPolicyDiscoveryCandidates({
      report: result.surface.latestSimulation,
      generatedAt: result.surface.generatedAt,
    });
    const auditEvidence = createConsequenceAuditEvidenceExport({
      events: result.events,
      summarySurface: result.surface,
      simulations: simulationsForAuditEvidence({
        simulations: result.simulations,
        latestSimulation: result.surface.latestSimulation,
      }),
      policyDiscovery,
      generatedAt: result.surface.generatedAt,
      tenantId: result.tenant.tenantId,
    });
    const dashboard = createConsequenceBusinessRiskDashboard({
      auditExport: auditEvidence,
      generatedAt: result.surface.generatedAt,
    });
    const summary = createConsequenceDashboardApiSummary({
      auditEvidence,
      dashboard,
      generatedAt: result.surface.generatedAt,
    });

    return c.json({
      tenant: tenantSummary(result.tenant),
      storageMode: result.surface.storageMode,
      productionReady: false,
      complianceClaimed: false,
      decisionSupportOnly: true,
      autoEnforce: false,
      rawPayloadStored: false,
      rawImpactValueStored: false,
      source: 'business-risk-dashboard',
      auditEvidenceDigest: auditEvidence.digest,
      dashboardDigest: dashboard.digest,
      summary,
    });
  });
}
