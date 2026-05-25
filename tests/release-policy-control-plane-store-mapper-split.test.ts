import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const storeSource = readFileSync(
  'src/release-policy-control-plane/store.ts',
  'utf8',
);
const recordSource = readFileSync(
  'src/release-policy-control-plane/store-records.ts',
  'utf8',
);

function testStoreReexportsStableRecordContract(): void {
  assert.match(
    storeSource,
    /from '\.\/store-records\.js'/,
    'runtime store should depend on the record mapper module',
  );
  assert.match(
    storeSource,
    /export \{\s*POLICY_STORE_RECORD_SPEC_VERSION,\s*POLICY_STORE_SNAPSHOT_SPEC_VERSION,\s*assertBundleRecordContentIsImmutable,\s*\} from '\.\/store-records\.js';/s,
    'store.ts should preserve value exports for existing callers',
  );
  assert.match(
    storeSource,
    /export type \{\s*PolicyStoreSnapshot,\s*StoredPolicyBundleRecord,\s*UpsertStoredPolicyBundleInput,\s*\} from '\.\/store-records\.js';/s,
    'store.ts should preserve type exports for existing callers',
  );
}

function testPureRecordMappersMovedOutOfRuntimeStore(): void {
  for (const helper of [
    'assertBundleRecordCoherence',
    'normalizeBundleRecord',
    'normalizeSnapshot',
    'compareBundleRecords',
    'cloneAndFreeze',
  ]) {
    assert.ok(
      recordSource.includes(`function ${helper}`),
      `store-records.ts should own ${helper}`,
    );
    assert.ok(
      !storeSource.includes(`function ${helper}`),
      `store.ts should not define ${helper}`,
    );
  }
}

function testRecordMapperModuleHasNoRuntimeStoreBackEdge(): void {
  assert.ok(
    !recordSource.includes("from './store.js'"),
    'store-records.ts must not import the runtime store module',
  );
  assert.ok(
    !recordSource.includes('PolicyControlPlaneStore'),
    'store-records.ts should not define the runtime store interface',
  );
  assert.ok(
    !recordSource.includes('node:fs') && !recordSource.includes('node:path'),
    'store-records.ts should not own file-system persistence concerns',
  );
}

testStoreReexportsStableRecordContract();
testPureRecordMappersMovedOutOfRuntimeStore();
testRecordMapperModuleHasNoRuntimeStoreBackEdge();

console.log('Release policy control-plane store mapper split tests: 13 passed, 0 failed');
