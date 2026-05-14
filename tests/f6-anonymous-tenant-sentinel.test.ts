import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Hono } from 'hono';
import {
  ANONYMOUS_TENANT_ID,
  LEGACY_ANONYMOUS_TENANT_ID,
  getTenantContextFromHeaders,
  isAnonymousTenantContext,
  resetTenantEnvKeyCacheForTests,
  tenantMiddleware,
} from '../src/service/tenant-isolation.js';
import { resetTenantKeyStoreForTests } from '../src/service/tenant-key-store.js';
import {
  currentReleaseEvaluationContext,
  currentReleaseRequester,
} from '../src/service/request-context.js';

let passed = 0;

function ok(condition: boolean, msg: string): void {
  assert(condition, msg);
  passed += 1;
}

const envKeys = [
  'NODE_ENV',
  'ATTESTOR_HA_MODE',
  'ATTESTOR_PUBLIC_HOSTNAME',
  'ATTESTOR_PUBLIC_BASE_URL',
  'ATTESTOR_RUNTIME_PROFILE',
  'ATTESTOR_TENANT_KEYS',
  'ATTESTOR_TENANT_KEY_STORE_PATH',
] as const;

const savedEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]])) as Record<
  typeof envKeys[number],
  string | undefined
>;
const tempDir = mkdtempSync(join(tmpdir(), `attestor-anonymous-sentinel-${randomUUID()}-`));
const tenantKeyStorePath = join(tempDir, 'tenant-keys.json');

function restoreSavedEnv(): void {
  for (const key of envKeys) {
    const value = savedEnv[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function resetEnvForCase(): void {
  restoreSavedEnv();
  for (const key of envKeys) delete process.env[key];
  process.env.ATTESTOR_TENANT_KEY_STORE_PATH = tenantKeyStorePath;
  resetTenantEnvKeyCacheForTests();
  resetTenantKeyStoreForTests();
}

function createApp(): Hono {
  const app = new Hono();
  app.use('*', tenantMiddleware());
  app.get('/api/v1/account/usage', (c) => {
    const tenant = getTenantContextFromHeaders(c.req.raw.headers);
    return c.json({
      headerTenantId: c.req.raw.headers.get('x-attestor-tenant-id'),
      tenantId: tenant.tenantId,
      source: tenant.source,
      anonymous: isAnonymousTenantContext(tenant),
      requester: currentReleaseRequester(c),
      evaluationContext: currentReleaseEvaluationContext(c),
    });
  });
  return app;
}

async function readJson(response: Response): Promise<Record<string, any>> {
  return await response.json() as Record<string, any>;
}

async function run() {
  console.log('\nF6 Anonymous Tenant Sentinel Tests');

  try {
    resetEnvForCase();
    {
      const headers = new Headers();
      const tenant = getTenantContextFromHeaders(headers);
      ok(tenant.tenantId === ANONYMOUS_TENANT_ID, 'missing internal tenant headers normalize to reserved anonymous sentinel');
      ok(tenant.source === 'anonymous', 'missing internal tenant headers default to anonymous source');
      ok(isAnonymousTenantContext(tenant), 'reserved anonymous sentinel is classified as anonymous');
    }

    {
      const headers = new Headers({
        'x-attestor-tenant-id': LEGACY_ANONYMOUS_TENANT_ID,
        'x-attestor-tenant-source': 'anonymous',
      });
      const tenant = getTenantContextFromHeaders(headers);
      ok(tenant.tenantId === ANONYMOUS_TENANT_ID, 'legacy anonymous default header normalizes to reserved sentinel');
      ok(isAnonymousTenantContext(tenant), 'legacy anonymous default remains classified as anonymous');
    }

    {
      const headers = new Headers({
        'x-attestor-tenant-id': LEGACY_ANONYMOUS_TENANT_ID,
        'x-attestor-tenant-source': 'api_key',
      });
      const tenant = getTenantContextFromHeaders(headers);
      ok(tenant.tenantId === LEGACY_ANONYMOUS_TENANT_ID, 'api_key tenant named default remains a real tenant id');
      ok(!isAnonymousTenantContext(tenant), 'api_key tenant named default is not classified as anonymous');
    }

    {
      const app = createApp();
      const response = await app.request('/api/v1/account/usage');
      const body = await readJson(response);
      ok(response.status === 200, 'local-dev without tenant keys keeps anonymous fallback');
      ok(body.headerTenantId === ANONYMOUS_TENANT_ID, 'middleware writes reserved anonymous sentinel header');
      ok(body.tenantId === ANONYMOUS_TENANT_ID, 'current tenant resolves reserved anonymous sentinel');
      ok(body.source === 'anonymous', 'anonymous sentinel keeps anonymous source');
      ok(body.anonymous === true, 'anonymous sentinel is classified as anonymous');
      ok(body.requester?.id === 'svc.attestor.api', 'anonymous requester remains service runtime');
      ok(body.requester?.displayName === 'Attestor API Runtime', 'anonymous requester display name remains runtime');
      ok(body.evaluationContext?.tenantId === null, 'anonymous sentinel is omitted from release evaluation tenant id');
    }

    console.log(`F6 Anonymous Tenant Sentinel Tests: ${passed} passed, 0 failed`);
  } finally {
    restoreSavedEnv();
    process.env.ATTESTOR_TENANT_KEY_STORE_PATH = tenantKeyStorePath;
    resetTenantEnvKeyCacheForTests();
    resetTenantKeyStoreForTests();
    restoreSavedEnv();
    rmSync(tempDir, { recursive: true, force: true });
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
