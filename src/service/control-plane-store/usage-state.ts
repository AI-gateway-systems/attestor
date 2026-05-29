import {
  canConsumePipelineRun as canConsumePipelineRunFile,
  consumePipelineRun as consumePipelineRunFile,
  getUsageContext as getUsageContextFile,
  queryUsageLedger as queryUsageLedgerFile,
  readUsageLedgerSnapshot,
  type UsageContext,
  type UsageLedgerRecord,
} from '../usage-meter.js';
import {
  ensureControlPlanePgSchema,
  getControlPlanePgPool,
  isSharedControlPlaneConfigured,
} from './pg.js';
import { currentPeriod, rowToUsageRecord, usageContextFromRecord } from './mappers.js';

export interface UsageLedgerStoreSnapshot {
  version: 1;
  exportedAt: string;
  recordCount: number;
  monthlyPipelineRuns: UsageLedgerRecord[];
}

async function listUsageLedgerPg(filters?: { tenantId?: string | null; period?: string | null }): Promise<UsageLedgerRecord[]> {
  await ensureControlPlanePgSchema();
  const pool = await getControlPlanePgPool();
  const where: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  if (filters?.tenantId) {
    where.push(`tenant_id = $${idx++}`);
    params.push(filters.tenantId);
  }
  if (filters?.period) {
    where.push(`period = $${idx++}`);
    params.push(filters.period);
  }
  const sql = `
    SELECT tenant_id, period, used, updated_at
      FROM attestor_control_plane.usage_ledger
      ${where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY period DESC, used DESC, tenant_id ASC
  `;
  const result = await pool.query(sql, params);
  return result.rows.map(rowToUsageRecord);
}

async function readUsageCountPg(tenantId: string, period: string): Promise<number> {
  await ensureControlPlanePgSchema();
  const pool = await getControlPlanePgPool();
  const result = await pool.query(
    `SELECT used
       FROM attestor_control_plane.usage_ledger
      WHERE tenant_id = $1 AND period = $2
      LIMIT 1`,
    [tenantId, period],
  );
  return result.rows.length > 0 ? Number(result.rows[0].used) : 0;
}

async function consumeUsagePg(tenantId: string, period: string): Promise<number> {
  await ensureControlPlanePgSchema();
  const pool = await getControlPlanePgPool();
  const result = await pool.query(
    `INSERT INTO attestor_control_plane.usage_ledger (
      tenant_id, period, used, updated_at
    ) VALUES (
      $1, $2, 1, NOW()
    )
    ON CONFLICT (tenant_id, period) DO UPDATE SET
      used = attestor_control_plane.usage_ledger.used + 1,
      updated_at = NOW()
    RETURNING used`,
    [tenantId, period],
  );
  return Number(result.rows[0].used);
}

export async function getUsageContextState(
  tenantId: string,
  planId: string | null | undefined,
  quota: number | null | undefined,
): Promise<UsageContext> {
  if (!isSharedControlPlaneConfigured()) return getUsageContextFile(tenantId, planId, quota);
  const period = currentPeriod();
  const used = await readUsageCountPg(tenantId, period);
  return usageContextFromRecord(tenantId, planId, quota, used, period);
}

export async function canConsumePipelineRunState(
  tenantId: string,
  planId: string | null | undefined,
  quota: number | null | undefined,
): Promise<{ allowed: boolean; usage: UsageContext }> {
  if (!isSharedControlPlaneConfigured()) return canConsumePipelineRunFile(tenantId, planId, quota);
  const usage = await getUsageContextState(tenantId, planId, quota);
  if (!usage.enforced) return { allowed: true, usage };
  return { allowed: usage.used < (usage.quota ?? 0), usage };
}

export async function consumePipelineRunState(
  tenantId: string,
  planId: string | null | undefined,
  quota: number | null | undefined,
): Promise<UsageContext> {
  if (!isSharedControlPlaneConfigured()) return consumePipelineRunFile(tenantId, planId, quota);
  const period = currentPeriod();
  const used = await consumeUsagePg(tenantId, period);
  return usageContextFromRecord(tenantId, planId, quota, used, period);
}

export async function queryUsageLedgerState(filters?: {
  tenantId?: string | null;
  period?: string | null;
}): Promise<UsageLedgerRecord[]> {
  if (!isSharedControlPlaneConfigured()) return queryUsageLedgerFile(filters);
  return listUsageLedgerPg(filters);
}

export async function exportUsageLedgerStoreSnapshot(): Promise<UsageLedgerStoreSnapshot> {
  const records = isSharedControlPlaneConfigured()
    ? await listUsageLedgerPg()
    : readUsageLedgerSnapshot().records;
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    recordCount: records.length,
    monthlyPipelineRuns: records,
  };
}

export async function restoreUsageLedgerStoreSnapshot(
  snapshot: UsageLedgerStoreSnapshot,
  options?: { replaceExisting?: boolean },
): Promise<{ recordCount: number }> {
  if (!isSharedControlPlaneConfigured()) {
    throw new Error('Shared control-plane PostgreSQL is not configured for usage ledger restore.');
  }
  await ensureControlPlanePgSchema();
  const pool = await getControlPlanePgPool();
  if (options?.replaceExisting) {
    await pool.query('TRUNCATE TABLE attestor_control_plane.usage_ledger');
  }
  for (const record of snapshot.monthlyPipelineRuns) {
    await pool.query(
      `INSERT INTO attestor_control_plane.usage_ledger (
        tenant_id, period, used, updated_at
      ) VALUES (
        $1, $2, $3, $4::timestamptz
      )
      ON CONFLICT (tenant_id, period) DO UPDATE SET
        used = EXCLUDED.used,
        updated_at = EXCLUDED.updated_at`,
      [record.tenantId, record.period, record.used, record.updatedAt],
    );
  }
  return { recordCount: snapshot.monthlyPipelineRuns.length };
}
