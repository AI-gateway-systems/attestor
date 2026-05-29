import { randomBytes } from 'node:crypto';
import {
  findActiveTenantKey as findActiveTenantKeyFile,
  findTenantKeyRecordById as findTenantKeyRecordByIdFile,
  findTenantRecordByTenantId as findTenantRecordByTenantIdFile,
  hasTenantKeyRecords as hasTenantKeyRecordsFile,
  issueTenantApiKey as issueTenantApiKeyFile,
  listTenantKeyRecords as listTenantKeyRecordsFile,
  revokeTenantApiKey as revokeTenantApiKeyFile,
  rotateTenantApiKey as rotateTenantApiKeyFile,
  setTenantApiKeyStatus as setTenantApiKeyStatusFile,
  syncTenantPlanByTenantId as syncTenantPlanByTenantIdFile,
  tenantKeyStorePolicy,
  TenantKeyStoreError,
  type IssueTenantKeyInput,
  type RotateTenantKeyInput,
  type TenantKeyRecord,
} from '../tenant-key-store.js';
import { DEFAULT_HOSTED_PLAN_ID, resolvePlanSpec } from '../plan-catalog.js';
import {
  controlPlaneStoreSource,
  ensureControlPlanePgSchema,
  getControlPlanePgPool,
  isSharedControlPlaneConfigured,
  type PgClient,
  type PgPool,
} from './pg.js';
import {
  activeReplacementExists,
  buildTenantKeyRecord,
  hashApiKey,
  maybeSealTenantKeyRecord,
  normalizeTenantKeyRecord,
  recoverTenantKeyMaterial,
  rowToTenantKey,
  statusRank,
} from './mappers.js';

export interface TenantKeyStoreSnapshot {
  version: 1;
  exportedAt: string;
  recordCount: number;
  records: TenantKeyRecord[];
}

export async function listTenantKeyRecordsPg(): Promise<TenantKeyRecord[]> {
  await ensureControlPlanePgSchema();
  const pool = await getControlPlanePgPool();
  const result = await pool.query(`
    SELECT record_json
      FROM attestor_control_plane.tenant_api_keys
      ORDER BY created_at ASC, key_id ASC
  `);
  return result.rows.map(rowToTenantKey);
}

export async function upsertTenantKeyPg(record: TenantKeyRecord, executor?: PgPool | PgClient): Promise<void> {
  await ensureControlPlanePgSchema();
  const target = executor ?? await getControlPlanePgPool();
  try {
    await target.query(
      `INSERT INTO attestor_control_plane.tenant_api_keys (
        key_id, tenant_id, tenant_name, plan_id, monthly_run_quota, api_key_hash, api_key_preview, key_status,
        created_at, last_used_at, deactivated_at, revoked_at, rotated_from_key_id, superseded_by_key_id, superseded_at, record_json
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9::timestamptz, $10::timestamptz, $11::timestamptz, $12::timestamptz, $13, $14, $15::timestamptz, $16::jsonb
      )
      ON CONFLICT (key_id) DO UPDATE SET
        tenant_id = EXCLUDED.tenant_id,
        tenant_name = EXCLUDED.tenant_name,
        plan_id = EXCLUDED.plan_id,
        monthly_run_quota = EXCLUDED.monthly_run_quota,
        api_key_hash = EXCLUDED.api_key_hash,
        api_key_preview = EXCLUDED.api_key_preview,
        key_status = EXCLUDED.key_status,
        created_at = EXCLUDED.created_at,
        last_used_at = EXCLUDED.last_used_at,
        deactivated_at = EXCLUDED.deactivated_at,
        revoked_at = EXCLUDED.revoked_at,
        rotated_from_key_id = EXCLUDED.rotated_from_key_id,
        superseded_by_key_id = EXCLUDED.superseded_by_key_id,
        superseded_at = EXCLUDED.superseded_at,
        record_json = EXCLUDED.record_json`,
      [
        record.id,
        record.tenantId,
        record.tenantName,
        record.planId,
        record.monthlyRunQuota,
        record.apiKeyHash,
        record.apiKeyPreview,
        record.status,
        record.createdAt,
        record.lastUsedAt,
        record.deactivatedAt,
        record.revokedAt,
        record.rotatedFromKeyId,
        record.supersededByKeyId,
        record.supersededAt,
        JSON.stringify(record),
      ],
    );
  } catch (err) {
    const pgErr = err as { code?: string };
    if (pgErr?.code === '23505') {
      throw new TenantKeyStoreError('INVALID_STATE', 'Tenant key uniqueness constraint violated.');
    }
    throw err;
  }
}

export async function listTenantKeyRecordsState(): Promise<{
  records: TenantKeyRecord[];
  path: string | null;
}> {
  if (!isSharedControlPlaneConfigured()) return listTenantKeyRecordsFile();
  return {
    records: await listTenantKeyRecordsPg(),
    path: controlPlaneStoreSource(),
  };
}

export async function issueTenantApiKeyState(input: IssueTenantKeyInput): Promise<{
  apiKey: string;
  record: TenantKeyRecord;
  path: string | null;
}> {
  if (!isSharedControlPlaneConfigured()) return issueTenantApiKeyFile(input);
  const resolvedPlan = resolvePlanSpec({
    planId: input.planId,
    monthlyRunQuota: input.monthlyRunQuota,
    defaultPlanId: DEFAULT_HOSTED_PLAN_ID,
  });
  const records = await listTenantKeyRecordsPg();
  const activeCount = records.filter((entry) => entry.tenantId === input.tenantId && entry.status === 'active').length;
  const maxActive = tenantKeyStorePolicy().maxActiveKeysPerTenant;
  if (activeCount >= maxActive) {
    throw new TenantKeyStoreError(
      'LIMIT_EXCEEDED',
      `Tenant '${input.tenantId}' already has ${activeCount} active keys. Deactivate or revoke one before issuing another. Max active keys per tenant: ${maxActive}.`,
    );
  }
  const apiKey = `atk_${randomBytes(24).toString('hex')}`;
  let record = buildTenantKeyRecord({
    tenantId: input.tenantId,
    tenantName: input.tenantName,
    planId: resolvedPlan.planId,
    monthlyRunQuota: resolvedPlan.monthlyRunQuota,
    apiKey,
    createdAt: new Date().toISOString(),
  });
  record = await maybeSealTenantKeyRecord(record, apiKey);
  await upsertTenantKeyPg(record);
  return { apiKey, record, path: controlPlaneStoreSource() };
}

export async function rotateTenantApiKeyState(id: string, input?: RotateTenantKeyInput): Promise<{
  apiKey: string;
  record: TenantKeyRecord;
  previousRecord: TenantKeyRecord;
  path: string | null;
}> {
  if (!isSharedControlPlaneConfigured()) return rotateTenantApiKeyFile(id, input);
  const records = await listTenantKeyRecordsPg();
  const sourceRecord = records.find((entry) => entry.id === id);
  if (!sourceRecord) {
    throw new TenantKeyStoreError('NOT_FOUND', `Tenant key record not found: ${id}`);
  }
  if (sourceRecord.status !== 'active') {
    throw new TenantKeyStoreError(
      'INVALID_STATE',
      `Tenant key '${id}' must be active before rotation. Current status: ${sourceRecord.status}.`,
    );
  }
  if (activeReplacementExists(records, sourceRecord)) {
    throw new TenantKeyStoreError(
      'INVALID_STATE',
      `Tenant key '${id}' already has an unreconciled replacement key. Reuse or revoke the replacement before rotating again.`,
    );
  }
  const activeCount = records.filter((entry) => entry.tenantId === sourceRecord.tenantId && entry.status === 'active').length;
  const maxActive = tenantKeyStorePolicy().maxActiveKeysPerTenant;
  if (activeCount >= maxActive) {
    throw new TenantKeyStoreError(
      'LIMIT_EXCEEDED',
      `Tenant '${sourceRecord.tenantId}' already has ${activeCount} active keys. Deactivate or revoke one before issuing another. Max active keys per tenant: ${maxActive}.`,
    );
  }
  const resolvedPlan = resolvePlanSpec({
    planId: input?.planId ?? sourceRecord.planId,
    monthlyRunQuota: input?.monthlyRunQuota ?? sourceRecord.monthlyRunQuota,
    defaultPlanId: DEFAULT_HOSTED_PLAN_ID,
  });
  const apiKey = `atk_${randomBytes(24).toString('hex')}`;
  const createdAt = new Date().toISOString();
  let record = buildTenantKeyRecord({
    tenantId: sourceRecord.tenantId,
    tenantName: sourceRecord.tenantName,
    planId: resolvedPlan.planId,
    monthlyRunQuota: resolvedPlan.monthlyRunQuota,
    apiKey,
    createdAt,
    rotatedFromKeyId: sourceRecord.id,
  });
  record = await maybeSealTenantKeyRecord(record, apiKey);
  sourceRecord.supersededByKeyId = record.id;
  sourceRecord.supersededAt = createdAt;
  await upsertTenantKeyPg(sourceRecord);
  await upsertTenantKeyPg(record);
  return {
    apiKey,
    record,
    previousRecord: sourceRecord,
    path: controlPlaneStoreSource(),
  };
}

export async function setTenantApiKeyStatusState(id: string, nextStatus: 'active' | 'inactive'): Promise<{
  record: TenantKeyRecord;
  path: string | null;
}> {
  if (!isSharedControlPlaneConfigured()) return setTenantApiKeyStatusFile(id, nextStatus);
  const records = await listTenantKeyRecordsPg();
  const record = records.find((entry) => entry.id === id);
  if (!record) {
    throw new TenantKeyStoreError('NOT_FOUND', `Tenant key record not found: ${id}`);
  }
  if (record.status === 'revoked') {
    throw new TenantKeyStoreError(
      'INVALID_STATE',
      `Tenant key '${id}' is revoked and cannot transition back to ${nextStatus}.`,
    );
  }
  if (nextStatus === 'inactive') {
    if (record.status === 'inactive') return { record, path: controlPlaneStoreSource() };
    record.status = 'inactive';
    record.deactivatedAt = new Date().toISOString();
    await upsertTenantKeyPg(record);
    return { record, path: controlPlaneStoreSource() };
  }
  if (record.status === 'active') return { record, path: controlPlaneStoreSource() };
  const activeCount = records.filter((entry) => entry.tenantId === record.tenantId && entry.status === 'active').length;
  const maxActive = tenantKeyStorePolicy().maxActiveKeysPerTenant;
  if (activeCount >= maxActive) {
    throw new TenantKeyStoreError(
      'LIMIT_EXCEEDED',
      `Tenant '${record.tenantId}' already has ${activeCount} active keys. Deactivate or revoke one before issuing another. Max active keys per tenant: ${maxActive}.`,
    );
  }
  record.status = 'active';
  record.deactivatedAt = null;
  await upsertTenantKeyPg(record);
  return { record, path: controlPlaneStoreSource() };
}

export async function revokeTenantApiKeyState(id: string): Promise<{
  record: TenantKeyRecord | null;
  path: string | null;
}> {
  if (!isSharedControlPlaneConfigured()) return revokeTenantApiKeyFile(id);
  const records = await listTenantKeyRecordsPg();
  const record = records.find((entry) => entry.id === id) ?? null;
  if (!record) return { record: null, path: controlPlaneStoreSource() };
  if (record.status === 'revoked') return { record, path: controlPlaneStoreSource() };
  record.status = 'revoked';
  record.revokedAt = new Date().toISOString();
  await upsertTenantKeyPg(record);
  return { record, path: controlPlaneStoreSource() };
}

export async function findActiveTenantKeyState(
  apiKey: string,
  options?: { markUsed?: boolean },
): Promise<TenantKeyRecord | null> {
  if (!isSharedControlPlaneConfigured()) return findActiveTenantKeyFile(apiKey, options);
  await ensureControlPlanePgSchema();
  const pool = await getControlPlanePgPool();
  const hashed = hashApiKey(apiKey);
  const result = await pool.query(
    `SELECT record_json
       FROM attestor_control_plane.tenant_api_keys
      WHERE api_key_hash = $1 AND key_status = 'active'
      LIMIT 1`,
    [hashed],
  );
  const record = result.rows[0] ? rowToTenantKey(result.rows[0]) : null;
  if (!record) return null;
  if (options?.markUsed) {
    record.lastUsedAt = new Date().toISOString();
    await upsertTenantKeyPg(record);
  }
  return record;
}

export async function hasTenantKeyRecordsState(): Promise<boolean> {
  if (!isSharedControlPlaneConfigured()) return hasTenantKeyRecordsFile();
  await ensureControlPlanePgSchema();
  const pool = await getControlPlanePgPool();
  const result = await pool.query(`SELECT EXISTS(SELECT 1 FROM attestor_control_plane.tenant_api_keys) AS present`);
  return Boolean(result.rows[0]?.present);
}

export async function findTenantRecordByTenantIdState(tenantId: string): Promise<TenantKeyRecord | null> {
  if (!isSharedControlPlaneConfigured()) return findTenantRecordByTenantIdFile(tenantId);
  const records = await listTenantKeyRecordsPg();
  const candidates = records.filter((entry) => entry.tenantId === tenantId);
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    const statusDelta = statusRank(a.status) - statusRank(b.status);
    if (statusDelta !== 0) return statusDelta;
    return a.createdAt > b.createdAt ? -1 : 1;
  });
  return candidates[0] ?? null;
}

export async function syncTenantPlanByTenantIdState(tenantId: string, options: {
  planId: string;
  monthlyRunQuota: number | null;
}): Promise<{
  records: TenantKeyRecord[];
  path: string | null;
}> {
  if (!isSharedControlPlaneConfigured()) return syncTenantPlanByTenantIdFile(tenantId, options);
  const records = await listTenantKeyRecordsPg();
  const matching = records.filter((entry) => entry.tenantId === tenantId && entry.status !== 'revoked');
  if (matching.length === 0) return { records: [], path: controlPlaneStoreSource() };
  const resolvedPlan = resolvePlanSpec({
    planId: options.planId,
    monthlyRunQuota: options.monthlyRunQuota,
    defaultPlanId: DEFAULT_HOSTED_PLAN_ID,
  });
  for (const record of matching) {
    record.planId = resolvedPlan.planId;
    record.monthlyRunQuota = resolvedPlan.monthlyRunQuota;
    await upsertTenantKeyPg(record);
  }
  return { records: matching, path: controlPlaneStoreSource() };
}

export async function recoverTenantApiKeyState(id: string): Promise<{
  record: TenantKeyRecord;
  apiKey: string;
  path: string | null;
}> {
  if (!isSharedControlPlaneConfigured()) {
    const current = findTenantKeyRecordByIdFile(id);
    if (!current.record) {
      throw new TenantKeyStoreError('NOT_FOUND', `Tenant key record not found: ${id}`);
    }
    const apiKey = await recoverTenantKeyMaterial(current.record);
    return {
      record: current.record,
      apiKey,
      path: current.path,
    };
  }

  const records = await listTenantKeyRecordsPg();
  const record = records.find((entry) => entry.id === id);
  if (!record) {
    throw new TenantKeyStoreError('NOT_FOUND', `Tenant key record not found: ${id}`);
  }
  const apiKey = await recoverTenantKeyMaterial(record);
  return {
    record,
    apiKey,
    path: controlPlaneStoreSource(),
  };
}

export async function exportTenantKeyStoreSnapshot(): Promise<TenantKeyStoreSnapshot> {
  const records = isSharedControlPlaneConfigured()
    ? await listTenantKeyRecordsPg()
    : listTenantKeyRecordsFile().records;
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    recordCount: records.length,
    records,
  };
}

export async function restoreTenantKeyStoreSnapshot(
  snapshot: TenantKeyStoreSnapshot,
  options?: { replaceExisting?: boolean },
): Promise<{ recordCount: number }> {
  if (!isSharedControlPlaneConfigured()) {
    throw new Error('Shared control-plane PostgreSQL is not configured for tenant key restore.');
  }
  await ensureControlPlanePgSchema();
  const pool = await getControlPlanePgPool();
  if (options?.replaceExisting) {
    await pool.query('TRUNCATE TABLE attestor_control_plane.tenant_api_keys');
  }
  for (const record of snapshot.records) {
    await upsertTenantKeyPg(normalizeTenantKeyRecord(record));
  }
  return { recordCount: snapshot.records.length };
}
