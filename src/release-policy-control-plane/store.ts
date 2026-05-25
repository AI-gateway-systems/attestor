import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { withFileLock, writeTextFileAtomic } from '../platform/file-store.js';
import type {
  PolicyActivationRecord,
  PolicyControlPlaneMetadata,
  PolicyPackMetadata,
} from './object-model.js';
import {
  assertBundleRecordContentIsImmutable,
  cloneAndFreeze,
  compareActivations,
  compareBundleRecords,
  comparePacks,
  defaultPolicyStoreFile,
  normalizeBundleRecord,
  normalizeSnapshot,
  type PolicyStoreFile,
  type PolicyStoreSnapshot,
  type StoredPolicyBundleRecord,
  type UpsertStoredPolicyBundleInput,
} from './store-records.js';

export {
  POLICY_STORE_RECORD_SPEC_VERSION,
  POLICY_STORE_SNAPSHOT_SPEC_VERSION,
  assertBundleRecordContentIsImmutable,
} from './store-records.js';
export type {
  PolicyStoreSnapshot,
  StoredPolicyBundleRecord,
  UpsertStoredPolicyBundleInput,
} from './store-records.js';

/**
 * Policy control-plane store abstraction.
 *
 * Step 06 does not yet decide the long-term deployment boundary, but it does
 * freeze the repository contract that later activation, discovery, simulation,
 * and tenant rollout features will rely on. The store keeps packs, bundle
 * versions, signatures, activation history, and metadata under one explicit
 * contract instead of scattering them across future route wiring.
 */

export interface PolicyControlPlaneStore {
  readonly kind: 'embedded-memory' | 'file-backed';
  getMetadata(): PolicyControlPlaneMetadata | null;
  setMetadata(metadata: PolicyControlPlaneMetadata): PolicyControlPlaneMetadata;
  upsertPack(pack: PolicyPackMetadata): PolicyPackMetadata;
  getPack(packId: string): PolicyPackMetadata | null;
  listPacks(): readonly PolicyPackMetadata[];
  upsertBundle(input: UpsertStoredPolicyBundleInput): StoredPolicyBundleRecord;
  getBundle(packId: string, bundleId: string): StoredPolicyBundleRecord | null;
  listBundleHistory(packId: string): readonly StoredPolicyBundleRecord[];
  listBundles(): readonly StoredPolicyBundleRecord[];
  upsertActivation(record: PolicyActivationRecord): PolicyActivationRecord;
  getActivation(id: string): PolicyActivationRecord | null;
  listActivations(): readonly PolicyActivationRecord[];
  exportSnapshot(): PolicyStoreSnapshot;
}

function loadPolicyStoreFile(path: string): PolicyStoreFile {
  if (!existsSync(path)) {
    return defaultPolicyStoreFile();
  }

  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as PolicyStoreFile;
    if (
      parsed.version === 1 &&
      Array.isArray(parsed.packs) &&
      Array.isArray(parsed.bundles) &&
      Array.isArray(parsed.activations)
    ) {
      return parsed;
    }
  } catch {
    // fall through to safe default
  }

  return defaultPolicyStoreFile();
}

function savePolicyStoreFile(path: string, store: PolicyStoreFile): void {
  writeTextFileAtomic(path, `${JSON.stringify(store, null, 2)}\n`);
}

function createPolicyControlPlaneStoreFromAccessors(
  kind: PolicyControlPlaneStore['kind'],
  accessors: {
    readonly read: () => PolicyStoreFile;
    readonly mutate: <T>(action: (store: PolicyStoreFile) => T) => T;
  },
): PolicyControlPlaneStore {
  return {
    kind,

    getMetadata(): PolicyControlPlaneMetadata | null {
      return cloneAndFreeze(accessors.read().metadata);
    },

    setMetadata(metadata: PolicyControlPlaneMetadata): PolicyControlPlaneMetadata {
      return accessors.mutate((store) => {
        store.metadata = cloneAndFreeze(metadata);
        return cloneAndFreeze(store.metadata);
      });
    },

    upsertPack(pack: PolicyPackMetadata): PolicyPackMetadata {
      return accessors.mutate((store) => {
        const normalized = cloneAndFreeze(pack);
        const existingIndex = store.packs.findIndex((entry) => entry.id === normalized.id);
        if (existingIndex >= 0) {
          store.packs[existingIndex] = normalized;
        } else {
          store.packs.push(normalized);
        }
        store.packs.sort(comparePacks);
        return normalized;
      });
    },

    getPack(packId: string): PolicyPackMetadata | null {
      const pack = accessors.read().packs.find((entry) => entry.id === packId) ?? null;
      return cloneAndFreeze(pack);
    },

    listPacks(): readonly PolicyPackMetadata[] {
      return cloneAndFreeze([...accessors.read().packs].sort(comparePacks));
    },

    upsertBundle(input: UpsertStoredPolicyBundleInput): StoredPolicyBundleRecord {
      return accessors.mutate((store) => {
        const record = normalizeBundleRecord(input);
        const existingIndex = store.bundles.findIndex(
          (entry) =>
            entry.packId === record.packId &&
            entry.bundleId === record.bundleId,
        );
        if (existingIndex >= 0) {
          assertBundleRecordContentIsImmutable(store.bundles[existingIndex]!, record);
          store.bundles[existingIndex] = record;
        } else {
          store.bundles.push(record);
        }
        store.bundles.sort(compareBundleRecords);
        return record;
      });
    },

    getBundle(packId: string, bundleId: string): StoredPolicyBundleRecord | null {
      const record =
        accessors.read().bundles.find(
          (entry) => entry.packId === packId && entry.bundleId === bundleId,
        ) ?? null;
      return cloneAndFreeze(record);
    },

    listBundleHistory(packId: string): readonly StoredPolicyBundleRecord[] {
      return cloneAndFreeze(
        accessors.read().bundles.filter((entry) => entry.packId === packId).sort(compareBundleRecords),
      );
    },

    listBundles(): readonly StoredPolicyBundleRecord[] {
      return cloneAndFreeze([...accessors.read().bundles].sort(compareBundleRecords));
    },

    upsertActivation(record: PolicyActivationRecord): PolicyActivationRecord {
      return accessors.mutate((store) => {
        const normalized = cloneAndFreeze(record);
        const existingIndex = store.activations.findIndex((entry) => entry.id === normalized.id);
        if (existingIndex >= 0) {
          store.activations[existingIndex] = normalized;
        } else {
          store.activations.push(normalized);
        }
        store.activations.sort(compareActivations);
        return normalized;
      });
    },

    getActivation(id: string): PolicyActivationRecord | null {
      const record =
        accessors.read().activations.find((entry) => entry.id === id) ?? null;
      return cloneAndFreeze(record);
    },

    listActivations(): readonly PolicyActivationRecord[] {
      return cloneAndFreeze([...accessors.read().activations].sort(compareActivations));
    },

    exportSnapshot(): PolicyStoreSnapshot {
      return normalizeSnapshot(accessors.read());
    },
  };
}

export function createInMemoryPolicyControlPlaneStore(): PolicyControlPlaneStore {
  let store = defaultPolicyStoreFile();

  return createPolicyControlPlaneStoreFromAccessors('embedded-memory', {
    read: () => store,
    mutate: (action) => {
      const workingCopy = structuredClone(store) as PolicyStoreFile;
      const result = action(workingCopy);
      store = workingCopy;
      return result;
    },
  });
}

export function createInMemoryPolicyControlPlaneStoreFromSnapshot(
  snapshot: PolicyStoreSnapshot,
): PolicyControlPlaneStore {
  let store: PolicyStoreFile = {
    version: 1,
    metadata: snapshot.metadata ? structuredClone(snapshot.metadata) : null,
    packs: snapshot.packs.map((pack) => structuredClone(pack)),
    bundles: snapshot.bundles.map((bundle) => structuredClone(bundle)),
    activations: snapshot.activations.map((activation) => structuredClone(activation)),
  };

  return createPolicyControlPlaneStoreFromAccessors('embedded-memory', {
    read: () => store,
    mutate: (action) => {
      const workingCopy = structuredClone(store) as PolicyStoreFile;
      const result = action(workingCopy);
      store = workingCopy;
      return result;
    },
  });
}

function defaultPolicyStorePath(): string {
  return resolve(
    process.env.ATTESTOR_POLICY_CONTROL_PLANE_STORE_PATH ??
      '.attestor/release-policy-control-plane-store.json',
  );
}

function ensurePolicyStoreDirectory(path: string): void {
  mkdirSync(dirname(path), { recursive: true });
}

export function createFileBackedPolicyControlPlaneStore(
  path = defaultPolicyStorePath(),
): PolicyControlPlaneStore {
  return createPolicyControlPlaneStoreFromAccessors('file-backed', {
    read: () => {
      ensurePolicyStoreDirectory(path);
      return withFileLock(path, () => loadPolicyStoreFile(path));
    },
    mutate: (action) => {
      ensurePolicyStoreDirectory(path);
      return withFileLock(path, () => {
        const store = loadPolicyStoreFile(path);
        const result = action(store);
        savePolicyStoreFile(path, store);
        return result;
      });
    },
  });
}

export function resetFileBackedPolicyControlPlaneStoreForTests(path?: string): void {
  const resolvedPath = path ?? defaultPolicyStorePath();
  if (existsSync(resolvedPath)) {
    rmSync(resolvedPath, { force: true });
  }
  if (existsSync(`${resolvedPath}.lock`)) {
    rmSync(`${resolvedPath}.lock`, { recursive: true, force: true });
  }
}
