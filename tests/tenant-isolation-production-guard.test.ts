/**
 * Tenant isolation production guard tests.
 *
 * Ensures local-dev anonymous fallback does not become a production/public/HA
 * deployment footgun for tenant-scoped APIs.
 */

import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Hono } from 'hono';
import {
  ANONYMOUS_TENANT_ID,
  resetTenantEnvKeyCacheForTests,
  tenantMiddleware,
} from '../src/service/tenant-isolation.js';
import { resetTenantKeyStoreForTests } from '../src/service/tenant-key-store.js';

let passed = 0;
function ok(condition: boolean, msg: string): void {
  assert(condition, msg);
  passed++;
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
const tempDir = mkdtempSync(join(tmpdir(), `attestor-tenant-guard-${randomUUID()}-`));
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
  delete process.env.NODE_ENV;
  delete process.env.ATTESTOR_HA_MODE;
  delete process.env.ATTESTOR_PUBLIC_HOSTNAME;
  delete process.env.ATTESTOR_PUBLIC_BASE_URL;
  delete process.env.ATTESTOR_RUNTIME_PROFILE;
  delete process.env.ATTESTOR_TENANT_KEYS;
  process.env.ATTESTOR_TENANT_KEY_STORE_PATH = tenantKeyStorePath;
  resetTenantEnvKeyCacheForTests();
  resetTenantKeyStoreForTests();
}

function createApp(): Hono {
  const app = new Hono();
  app.use('*', tenantMiddleware());
  app.get('/api/v1/account/usage', (c) => c.json({
    tenantId: c.req.raw.headers.get('x-attestor-tenant-id'),
    source: c.req.raw.headers.get('x-attestor-tenant-source'),
    planId: c.req.raw.headers.get('x-attestor-plan-id'),
  }));
  app.post('/api/v1/auth/login', (c) => c.json({
    tenantId: c.req.raw.headers.get('x-attestor-tenant-id'),
    source: c.req.raw.headers.get('x-attestor-tenant-source'),
  }));
  return app;
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  return await response.json() as Record<string, unknown>;
}

async function run() {
  console.log('\nTenant Isolation Production Guard Tests');

  try {
    resetEnvForCase();
    {
      const app = createApp();
      const response = await app.request('/api/v1/account/usage');
      const body = await readJson(response);
      ok(response.status === 200, 'local-dev without tenant keys keeps anonymous fallback');
      ok(body.tenantId === ANONYMOUS_TENANT_ID, 'local-dev anonymous fallback uses reserved anonymous sentinel');
      ok(body.source === 'anonymous', 'local-dev anonymous fallback marks source');
    }

    resetEnvForCase();
    process.env.NODE_ENV = 'production';
    {
      const app = createApp();
      const response = await app.request('/api/v1/account/usage');
      const body = await readJson(response);
      ok(response.status === 401, 'NODE_ENV=production rejects anonymous tenant fallback');
      ok(
        typeof body.error === 'string' && body.error.includes('Anonymous tenant fallback is disabled'),
        'production rejection explains the tenant configuration requirement',
      );
    }

    resetEnvForCase();
    process.env.ATTESTOR_HA_MODE = 'true';
    {
      const app = createApp();
      const response = await app.request('/api/v1/account/usage');
      ok(response.status === 401, 'ATTESTOR_HA_MODE rejects anonymous tenant fallback');
    }

    resetEnvForCase();
    process.env.ATTESTOR_PUBLIC_HOSTNAME = 'attestor.example.com';
    {
      const app = createApp();
      const response = await app.request('/api/v1/account/usage');
      ok(response.status === 401, 'public hostname rejects anonymous tenant fallback');
    }

    resetEnvForCase();
    process.env.NODE_ENV = 'production';
    {
      const app = createApp();
      const response = await app.request('/api/v1/auth/login', { method: 'POST' });
      const body = await readJson(response);
      ok(response.status === 200, 'production-like guard does not block public auth route');
      ok(body.source === 'anonymous', 'public auth route still gets anonymous context before login');
    }

    resetEnvForCase();
    process.env.NODE_ENV = 'production';
    process.env.ATTESTOR_TENANT_KEYS = 'prod-key:tenant-prod:Prod:pro:100';
    {
      const app = createApp();
      const response = await app.request('/api/v1/account/usage', {
        headers: { authorization: 'Bearer prod-key' },
      });
      const body = await readJson(response);
      ok(response.status === 200, 'production-like tenant API key allows tenant API route');
      ok(body.tenantId === 'tenant-prod', 'tenant API key resolves configured tenant id');
      ok(body.source === 'api_key', 'tenant API key marks api_key source');
    }

    console.log(`Tenant Isolation Production Guard Tests: ${passed} passed, 0 failed`);
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
