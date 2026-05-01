import assert from 'node:assert/strict';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { withFileLock } from '../src/platform/file-store.js';
import {
  createHostedAccount,
  resetAccountStoreForTests,
} from '../src/service/account-store.js';
import {
  issueAccountInviteToken,
  resetAccountUserActionTokenStoreForTests,
} from '../src/service/account-user-token-store.js';
import {
  issueTenantApiKey,
  resetTenantKeyStoreForTests,
} from '../src/service/tenant-key-store.js';
import {
  recordProcessedStripeWebhook,
  resetStripeWebhookStoreForTests,
} from '../src/service/stripe-webhook-store.js';

const envKeys = [
  'ATTESTOR_FILE_LOCK_TIMEOUT_MS',
  'ATTESTOR_FILE_LOCK_RETRY_DELAY_MS',
  'ATTESTOR_FILE_LOCK_STALE_MS',
  'ATTESTOR_ACCOUNT_STORE_PATH',
  'ATTESTOR_ACCOUNT_USER_TOKEN_STORE_PATH',
  'ATTESTOR_TENANT_KEY_STORE_PATH',
  'ATTESTOR_STRIPE_WEBHOOK_STORE_PATH',
] as const;

const savedEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]])) as Record<
  typeof envKeys[number],
  string | undefined
>;

const tempDir = join(process.cwd(), '.attestor-test-runs', `file-store-race-${randomUUID()}`);

function restoreEnv(): void {
  for (const key of envKeys) {
    const value = savedEnv[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function lockDirFor(path: string): string {
  return `${path}.lock`;
}

function createFreshLock(path: string): void {
  mkdirSync(lockDirFor(path), { recursive: true });
}

function removeLock(path: string): void {
  rmSync(lockDirFor(path), { recursive: true, force: true });
}

function assertLockTimeout(action: () => unknown, label: string): void {
  assert.throws(
    action,
    /Timed out waiting for file lock/u,
    label,
  );
}

function configureFileStores(): {
  accountPath: string;
  actionTokenPath: string;
  tenantKeyPath: string;
  stripeWebhookPath: string;
} {
  const accountPath = join(tempDir, 'accounts.json');
  const actionTokenPath = join(tempDir, 'account-user-tokens.json');
  const tenantKeyPath = join(tempDir, 'tenant-keys.json');
  const stripeWebhookPath = join(tempDir, 'stripe-webhooks.json');
  process.env.ATTESTOR_FILE_LOCK_TIMEOUT_MS = '30';
  process.env.ATTESTOR_FILE_LOCK_RETRY_DELAY_MS = '5';
  process.env.ATTESTOR_FILE_LOCK_STALE_MS = '600000';
  process.env.ATTESTOR_ACCOUNT_STORE_PATH = accountPath;
  process.env.ATTESTOR_ACCOUNT_USER_TOKEN_STORE_PATH = actionTokenPath;
  process.env.ATTESTOR_TENANT_KEY_STORE_PATH = tenantKeyPath;
  process.env.ATTESTOR_STRIPE_WEBHOOK_STORE_PATH = stripeWebhookPath;
  return { accountPath, actionTokenPath, tenantKeyPath, stripeWebhookPath };
}

function testStaleLockRecovery(): void {
  const targetPath = join(tempDir, 'stale-store.json');
  const lockPath = lockDirFor(targetPath);
  mkdirSync(lockPath, { recursive: true });
  writeFileSync(
    join(lockPath, 'owner.json'),
    JSON.stringify({
      pid: 999_999_999,
      hostname: 'stale-test-host',
      acquiredAtMs: Date.now() - 60_000,
      acquiredAt: new Date(Date.now() - 60_000).toISOString(),
    }),
  );

  const result = withFileLock(targetPath, () => 'recovered', {
    timeoutMs: 100,
    retryDelayMs: 5,
    staleMs: 1,
  });

  assert.equal(result, 'recovered', 'stale file lock is recovered before the action runs');
}

function testHostedStoreMutationsHonorLocks(): void {
  const {
    accountPath,
    actionTokenPath,
    tenantKeyPath,
    stripeWebhookPath,
  } = configureFileStores();

  createFreshLock(accountPath);
  assertLockTimeout(() => createHostedAccount({
    accountName: 'Acme',
    contactEmail: 'ops@example.com',
    primaryTenantId: 'tenant_acme',
  }), 'hosted account mutation waits on the account store lock');
  removeLock(accountPath);

  const account = createHostedAccount({
    accountName: 'Acme',
    contactEmail: 'ops@example.com',
    primaryTenantId: 'tenant_acme',
  });
  assert.equal(account.record.primaryTenantId, 'tenant_acme');

  createFreshLock(actionTokenPath);
  assertLockTimeout(() => issueAccountInviteToken({
    accountId: account.record.id,
    email: 'new-user@example.com',
    displayName: 'New User',
    role: 'read_only',
    issuedByAccountUserId: 'acctusr_admin',
  }), 'account action-token mutation waits on the token store lock');
  removeLock(actionTokenPath);

  const invite = issueAccountInviteToken({
    accountId: account.record.id,
    email: 'new-user@example.com',
    displayName: 'New User',
    role: 'read_only',
    issuedByAccountUserId: 'acctusr_admin',
  });
  assert.equal(invite.record.email, 'new-user@example.com');

  createFreshLock(tenantKeyPath);
  assertLockTimeout(() => issueTenantApiKey({
    tenantId: 'tenant_keys',
    tenantName: 'Tenant Keys',
  }), 'tenant API key mutation waits on the tenant key store lock');
  removeLock(tenantKeyPath);

  const tenantKey = issueTenantApiKey({
    tenantId: 'tenant_keys',
    tenantName: 'Tenant Keys',
  });
  assert.equal(tenantKey.record.tenantId, 'tenant_keys');

  createFreshLock(stripeWebhookPath);
  assertLockTimeout(() => recordProcessedStripeWebhook({
    eventId: 'evt_lock_test',
    eventType: 'invoice.paid',
    accountId: account.record.id,
    stripeCustomerId: 'cus_lock',
    stripeSubscriptionId: 'sub_lock',
    outcome: 'applied',
    reason: null,
    rawPayload: '{"id":"evt_lock_test"}',
  }), 'Stripe webhook dedupe mutation waits on the webhook store lock');
  removeLock(stripeWebhookPath);

  const webhook = recordProcessedStripeWebhook({
    eventId: 'evt_lock_test',
    eventType: 'invoice.paid',
    accountId: account.record.id,
    stripeCustomerId: 'cus_lock',
    stripeSubscriptionId: 'sub_lock',
    outcome: 'applied',
    reason: null,
    rawPayload: '{"id":"evt_lock_test"}',
  });
  assert.equal(webhook.record.eventId, 'evt_lock_test');
}

try {
  configureFileStores();
  resetAccountStoreForTests();
  resetAccountUserActionTokenStoreForTests();
  resetTenantKeyStoreForTests();
  resetStripeWebhookStoreForTests();

  testStaleLockRecovery();
  testHostedStoreMutationsHonorLocks();

  console.log('File store race hardening tests: 2 passed, 0 failed');
} finally {
  resetAccountStoreForTests();
  resetAccountUserActionTokenStoreForTests();
  resetTenantKeyStoreForTests();
  resetStripeWebhookStoreForTests();
  restoreEnv();
  rmSync(tempDir, { recursive: true, force: true });
}
