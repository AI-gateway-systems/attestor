import assert from 'node:assert/strict';
import { Hono } from 'hono';
import type { FilingAdapter, FilingPackage, TaxonomyMapping } from '../src/filing/filing-adapter.js';
import {
  isReleaseBoundFilingAdapter,
  registerPipelineFilingRoutes,
} from '../src/service/http/routes/pipeline-filing-routes.js';
import type {
  FinanceFilingReleaseCandidate,
  FinanceFilingReleaseMaterial,
} from '../src/release-layer/finance.js';
import type {
  ReleaseTokenVerificationKey,
  ReleaseVerificationContext,
  ReleaseVerificationInput,
} from '../src/release-layer/index.js';
import { ReleaseVerificationError } from '../src/release-kernel/release-verification.js';
import type { RequestPathReleaseTokenIntrospectionStore } from '../src/service/release-authority-request-path.js';

let passed = 0;

function equal<T>(actual: T, expected: T, message: string): void {
  assert.equal(actual, expected, message);
  passed += 1;
}

function ok(condition: unknown, message: string): void {
  assert.ok(condition, message);
  passed += 1;
}

function unsupportedAdapter(flags: { mapped: boolean; packaged: boolean }): FilingAdapter {
  return {
    id: 'iso20022-payments-draft',
    format: 'iso20022',
    taxonomyVersion: 'draft',
    description: 'Unbound test adapter',
    mapToTaxonomy(): TaxonomyMapping {
      flags.mapped = true;
      throw new Error('Unsupported adapter should not map without an explicit release binding.');
    },
    generatePackage(): FilingPackage {
      flags.packaged = true;
      throw new Error('Unsupported adapter should not package without an explicit release binding.');
    },
  };
}

async function testReleaseBindingPredicateIsDefaultDeny(): Promise<void> {
  equal(
    isReleaseBoundFilingAdapter('xbrl-us-gaap-2024', 'xbrl-us-gaap-2024'),
    true,
    'Filing export: current finance adapter is explicitly release-bound',
  );
  equal(
    isReleaseBoundFilingAdapter('iso20022-payments-draft', 'xbrl-us-gaap-2024'),
    false,
    'Filing export: unknown registered adapter is not release-bound by default',
  );
}

async function testRegisteredButUnboundAdapterFailsClosedBeforeExport(): Promise<void> {
  const app = new Hono();
  const flags = {
    mapped: false,
    packaged: false,
    tokenResolved: false,
    releaseVerified: false,
    materialBuilt: false,
  };
  const adapter = unsupportedAdapter(flags);

  registerPipelineFilingRoutes(app, {
    FINANCE_FILING_ADAPTER_ID: 'xbrl-us-gaap-2024',
    buildFinanceFilingReleaseMaterial(_candidate: FinanceFilingReleaseCandidate): FinanceFilingReleaseMaterial {
      flags.materialBuilt = true;
      throw new Error('Unbound adapter should not build finance release material.');
    },
    apiReleaseIntrospectionStore: {} as RequestPathReleaseTokenIntrospectionStore,
    filingRegistry: {
      get(id: string) {
        return id === adapter.id ? adapter : undefined;
      },
      list() {
        return [adapter];
      },
    },
    buildCounterpartyEnvelope() {
      throw new Error('Unbound adapter should not build a decision envelope.');
    },
    apiReleaseVerificationKeyPromise: Promise.resolve({} as ReleaseTokenVerificationKey),
    resolveReleaseTokenFromRequest() {
      flags.tokenResolved = true;
      return 'unexpected';
    },
    async verifyReleaseAuthorization(_input: ReleaseVerificationInput): Promise<ReleaseVerificationContext> {
      flags.releaseVerified = true;
      throw new Error('Unbound adapter should not verify release authorization.');
    },
    apiReleaseIntrospector: async () => ({
      active: false,
      reason: 'not-called',
      claims: null,
      checkedAt: new Date().toISOString(),
    }),
    ReleaseVerificationError,
  });

  const response = await app.request('/api/v1/filing/export', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      adapterId: adapter.id,
      runId: 'run_unbound_adapter',
      decision: 'pass',
      certificateId: 'cert_unbound',
      evidenceChainTerminal: 'sha256:unbound',
      rows: [{ amount: 100 }],
      proofMode: 'fixture',
    }),
  });
  const body = await response.json() as { error?: string; error_description?: string };

  equal(response.status, 403, 'Filing export: registered but unbound adapter returns forbidden');
  equal(body.error, 'filing_adapter_not_release_bound', 'Filing export: unbound adapter error is explicit');
  ok(
    body.error_description?.includes('Add an explicit release material and token verification binding'),
    'Filing export: remediation explains explicit binding requirement',
  );
  equal(flags.materialBuilt, false, 'Filing export: unbound adapter does not build release material');
  equal(flags.tokenResolved, false, 'Filing export: unbound adapter does not resolve a release token');
  equal(flags.releaseVerified, false, 'Filing export: unbound adapter does not call release verification');
  equal(flags.mapped, false, 'Filing export: unbound adapter does not map taxonomy');
  equal(flags.packaged, false, 'Filing export: unbound adapter does not generate a package');
}

await testReleaseBindingPredicateIsDefaultDeny();
await testRegisteredButUnboundAdapterFailsClosedBeforeExport();

console.log(`Pipeline filing default-secure tests: ${passed} passed, 0 failed`);
