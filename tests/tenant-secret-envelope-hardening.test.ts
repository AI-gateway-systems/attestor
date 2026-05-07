import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  normalizeSecretEnvelopeRecord,
  sealSecretEnvelope,
  type SecretEnvelopeRecord,
} from '../src/service/secret-envelope.js';
import {
  issueTenantApiKey,
  resetTenantKeyStoreForTests,
} from '../src/service/tenant-key-store.js';

let passed = 0;

const ENV_KEYS = [
  'NODE_ENV',
  'ATTESTOR_HA_MODE',
  'ATTESTOR_PUBLIC_HOSTNAME',
  'ATTESTOR_PUBLIC_BASE_URL',
  'ATTESTOR_SECRET_ENVELOPE_PROVIDER',
  'ATTESTOR_VAULT_TRANSIT_BASE_URL',
  'ATTESTOR_VAULT_TRANSIT_TOKEN',
  'ATTESTOR_VAULT_TRANSIT_KEY_NAME',
  'ATTESTOR_VAULT_TRANSIT_TIMEOUT_MS',
  'ATTESTOR_TENANT_KEY_STORE_PATH',
] as const;

type FetchMock = typeof fetch;

function ok(condition: unknown, message: string): void {
  assert.ok(condition, message);
  passed += 1;
}

function restoreEnv(snapshot: Map<string, string | undefined>): void {
  for (const key of ENV_KEYS) {
    const value = snapshot.get(key);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

async function withCleanEnv(action: () => Promise<void> | void): Promise<void> {
  const snapshot = new Map<string, string | undefined>();
  for (const key of ENV_KEYS) {
    snapshot.set(key, process.env[key]);
    delete process.env[key];
  }
  try {
    await action();
  } finally {
    restoreEnv(snapshot);
  }
}

function configureVault(baseUrl: string): void {
  process.env.ATTESTOR_SECRET_ENVELOPE_PROVIDER = 'vault_transit';
  process.env.ATTESTOR_VAULT_TRANSIT_BASE_URL = baseUrl;
  process.env.ATTESTOR_VAULT_TRANSIT_TOKEN = 'vault-test-token';
  process.env.ATTESTOR_VAULT_TRANSIT_KEY_NAME = 'tenant-key';
}

function jsonResponse(body: unknown, init?: { ok?: boolean; status?: number }): Response {
  return {
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    json: async () => body,
  } as Response;
}

async function testProductionRejectsNonLoopbackHttpVaultUrl(): Promise<void> {
  await withCleanEnv(async () => {
    process.env.NODE_ENV = 'production';
    configureVault('http://vault.internal:8200');

    await assert.rejects(
      sealSecretEnvelope('secret', { scope: 'test' }),
      /must use https in production-like runtimes/u,
      'Vault Transit HTTP base URL is rejected for non-loopback production-like runtimes',
    );
    passed += 1;
  });
}

async function testLoopbackHttpVaultUrlAllowedAndVersionTracked(): Promise<void> {
  await withCleanEnv(async () => {
    const originalFetch = globalThis.fetch;
    process.env.NODE_ENV = 'production';
    configureVault('http://127.0.0.1:8200');

    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      ok(init?.signal instanceof AbortSignal, 'Vault Transit request passes an abort signal');
      return jsonResponse({ data: { ciphertext: 'vault:v7:sealed-material' } });
    }) as FetchMock;

    try {
      const record = await sealSecretEnvelope('secret', { scope: 'test' });
      assert(record);
      ok(record.keyVersion === 7, 'Vault Transit ciphertext version is recorded');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
}

async function testVaultTransitTimeoutFailsClosed(): Promise<void> {
  await withCleanEnv(async () => {
    const originalFetch = globalThis.fetch;
    process.env.ATTESTOR_VAULT_TRANSIT_TIMEOUT_MS = '5';
    configureVault('https://vault.example.test');

    globalThis.fetch = ((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        const error = new Error('aborted');
        error.name = 'AbortError';
        reject(error);
      });
    })) as FetchMock;

    try {
      await assert.rejects(
        sealSecretEnvelope('secret', { scope: 'test' }),
        /timed out after 5ms/u,
        'Vault Transit request times out instead of hanging indefinitely',
      );
      passed += 1;
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
}

function testLegacySecretEnvelopeNormalizesKeyVersion(): void {
  const legacyRecord = {
    provider: 'vault_transit',
    keyName: 'tenant-key',
    ciphertext: 'vault:v1:legacy',
    contextBase64: 'e30=',
    sealedAt: new Date(0).toISOString(),
  } as SecretEnvelopeRecord;

  const normalized = normalizeSecretEnvelopeRecord(legacyRecord);
  ok(normalized.keyVersion === null, 'Legacy secret envelope records normalize to keyVersion null');
}

async function testTenantApiKeyPreviewMinimizesVisibleMaterial(): Promise<void> {
  await withCleanEnv(() => {
    const tempRoot = mkdtempSync(join(tmpdir(), 'attestor-tenant-key-preview-'));
    process.env.ATTESTOR_TENANT_KEY_STORE_PATH = join(tempRoot, 'tenant-keys.json');
    try {
      resetTenantKeyStoreForTests();
      const issued = issueTenantApiKey({
        tenantId: 'tenant-preview',
        tenantName: 'Preview Tenant',
      });
      const expectedPreview = `${issued.apiKey.slice(0, 4)}...${issued.apiKey.slice(-4)}`;
      ok(issued.record.apiKeyPreview === expectedPreview, 'Tenant API key preview exposes only 4 prefix and 4 suffix chars');
      ok(!issued.record.apiKeyPreview.includes(issued.apiKey.slice(0, 8)), 'Tenant API key preview no longer exposes the first 8 chars');
    } finally {
      resetTenantKeyStoreForTests();
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });
}

async function run(): Promise<void> {
  await testProductionRejectsNonLoopbackHttpVaultUrl();
  await testLoopbackHttpVaultUrlAllowedAndVersionTracked();
  await testVaultTransitTimeoutFailsClosed();
  testLegacySecretEnvelopeNormalizesKeyVersion();
  await testTenantApiKeyPreviewMinimizesVisibleMaterial();
  console.log(`Tenant secret envelope hardening tests: ${passed} passed, 0 failed`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
