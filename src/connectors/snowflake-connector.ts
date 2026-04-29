/**
 * Attestor Snowflake Connector — Real warehouse connector implementing DatabaseConnector.
 *
 * Uses the official snowflake-sdk for governed read-only query execution.
 * Includes: connection, execution, EXPLAIN-based preflight, evidence collection.
 *
 * Safety: SQL governance (write/stacked-query rejection) is enforced inside
 * this connector before SDK loading or connection, because explicit connector
 * calls must not rely on a later pipeline layer to fail closed.
 */

import { createHash } from 'node:crypto';
import type {
  DatabaseConnector, ConnectorConfig, ConnectorExecutionResult,
  ConnectorPreflightResult, ConnectorProbeResult,
} from './connector-interface.js';
import { validateReadOnlySql } from './postgres.js';
import { captureSnowflakeSchemaAttestation } from './snowflake-attestation.js';

// ─── Configuration ──────────────────────────────────────────────────────────

export interface SnowflakeConfig extends ConnectorConfig {
  provider: 'snowflake';
  /** Snowflake account identifier (e.g., HJCKOWO-VR06454). */
  account: string;
  username: string;
  password: string;
  warehouse: string;
  database?: string;
  schema?: string;
}

const SNOWFLAKE_TABLE_REF_PATTERN =
  /\b(?:FROM|JOIN|TABLE)\s+((?:"[^"]+"|[A-Za-z_][\w$]*)(?:\s*\.\s*(?:"[^"]+"|[A-Za-z_][\w$]*)){0,2})/gi;

export function loadSnowflakeConfig(): SnowflakeConfig | null {
  const account = process.env.SNOWFLAKE_ACCOUNT;
  const username = process.env.SNOWFLAKE_USERNAME;
  const password = process.env.SNOWFLAKE_PASSWORD;
  if (!account || !username || !password) return null;
  const allowedSchemas = (process.env.SNOWFLAKE_ALLOWED_SCHEMAS ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  return {
    provider: 'snowflake',
    connectionUrl: `https://${account}.snowflakecomputing.com`,
    account,
    username,
    password,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE ?? 'COMPUTE_WH',
    database: process.env.SNOWFLAKE_DATABASE,
    schema: process.env.SNOWFLAKE_SCHEMA,
    timeoutMs: parseInt(process.env.SNOWFLAKE_TIMEOUT_MS ?? '30000', 10),
    maxRows: parseInt(process.env.SNOWFLAKE_MAX_ROWS ?? '10000', 10),
    allowedSchemas: allowedSchemas.length > 0 ? allowedSchemas : undefined,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getSnowflakeSDK() {
  try {
    const sdk = await import('snowflake-sdk');
    return sdk.default ?? sdk;
  } catch {
    return null;
  }
}

function boundedSnowflakeTimeoutMs(timeoutMs: number | undefined): number {
  return Number.isFinite(timeoutMs) && timeoutMs !== undefined && timeoutMs > 0 ? timeoutMs : 30000;
}

function execSql(conn: any, sql: string, timeoutMs?: number): Promise<any[]> {
  const boundedTimeoutMs = boundedSnowflakeTimeoutMs(timeoutMs);
  return new Promise((resolve, reject) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const finish = (err: unknown, rows?: any[]) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      if (err) {
        reject(err);
        return;
      }
      resolve(rows ?? []);
    };

    timer = setTimeout(() => {
      finish(new Error(`Snowflake query timed out after ${boundedTimeoutMs}ms`));
    }, boundedTimeoutMs);

    try {
      conn.execute({
        sqlText: sql,
        complete: (err: any, _stmt: any, rows: any[]) => finish(err, rows),
      });
    } catch (err) {
      finish(err);
    }
  });
}

function normalizeSnowflakeIdentifier(identifier: string): string {
  const trimmed = identifier.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/""/g, '"').toLowerCase();
  }
  return trimmed.toLowerCase();
}

function splitSnowflakeObjectRef(ref: string): string[] {
  return ref
    .split('.')
    .map((part) => normalizeSnowflakeIdentifier(part))
    .filter(Boolean);
}

export function enforceSnowflakeAllowedSchemas(
  sql: string,
  allowedSchemas: readonly string[] = [],
  allowedDatabase?: string,
): void {
  if (allowedSchemas.length === 0) return;

  const allowed = new Set(allowedSchemas.map((schema) => normalizeSnowflakeIdentifier(schema)));
  const allowedDb = allowedDatabase ? normalizeSnowflakeIdentifier(allowedDatabase) : null;
  const refs: Array<{ database: string | null; schema: string | null; table: string }> = [];
  let match: RegExpExecArray | null;
  const pattern = new RegExp(SNOWFLAKE_TABLE_REF_PATTERN.source, SNOWFLAKE_TABLE_REF_PATTERN.flags);

  while ((match = pattern.exec(sql)) !== null) {
    const parts = splitSnowflakeObjectRef(match[1]);
    if (parts.length === 1) {
      refs.push({ database: null, schema: null, table: parts[0] });
      continue;
    }
    if (parts.length === 2) {
      refs.push({ database: null, schema: parts[0], table: parts[1] });
      continue;
    }
    refs.push({ database: parts[0], schema: parts[1], table: parts[2] });
  }

  for (const ref of refs) {
    if (ref.schema === null) {
      throw new Error(
        `Unqualified Snowflake table reference "${ref.table}" is not allowed when schema allowlist is active. Use fully qualified "schema.table" or "database.schema.table" syntax. Allowed schemas: [${allowedSchemas.join(', ')}].`,
      );
    }
    if (allowedDb && ref.database !== null && ref.database !== allowedDb) {
      throw new Error(
        `Snowflake database "${ref.database}" is not the configured database "${allowedDb}" for an allowlisted connector query.`,
      );
    }
    if (!allowed.has(ref.schema)) {
      throw new Error(`Snowflake schema "${ref.schema}" is not in allowedSchemas [${allowedSchemas.join(', ')}].`);
    }
  }
}

function injectLimit(sql: string, maxRows: number): string {
  if (/\bLIMIT\b/i.test(sql)) return sql;
  return `${sql.replace(/;\s*$/, '')} LIMIT ${maxRows}`;
}

function connectSnowflake(sdk: any, config: SnowflakeConfig): Promise<any> {
  return new Promise((resolve, reject) => {
    const conn = sdk.createConnection({
      account: config.account,
      username: config.username,
      password: config.password,
      warehouse: config.warehouse,
      database: config.database,
      schema: config.schema,
      application: 'Attestor_Connector',
    });
    conn.connect((err: any, c: any) => {
      if (err) reject(err);
      else resolve(c);
    });
  });
}

// ─── Connector Implementation ───────────────────────────────────────────────

export const snowflakeConnector: DatabaseConnector = {
  id: 'snowflake',
  displayName: 'Snowflake Data Cloud',

  async isAvailable(): Promise<boolean> {
    const sdk = await getSnowflakeSDK();
    if (!sdk) return false;
    const config = loadSnowflakeConfig();
    return config !== null;
  },

  loadConfig(): ConnectorConfig | null {
    return loadSnowflakeConfig();
  },

  async execute(sql: string, config: ConnectorConfig): Promise<ConnectorExecutionResult> {
    const sfConfig = config as SnowflakeConfig;
    const start = Date.now();
    const timestamp = new Date().toISOString();

    try {
      validateReadOnlySql(sql);
      enforceSnowflakeAllowedSchemas(sql, sfConfig.allowedSchemas ?? [], sfConfig.database);
    } catch (err) {
      return {
        success: false,
        provider: 'snowflake',
        durationMs: Date.now() - start,
        rowCount: 0,
        columns: [],
        columnTypes: [],
        rows: [],
        error: err instanceof Error ? err.message : String(err),
        executionContextHash: null,
        executionTimestamp: timestamp,
      };
    }

    const sdk = await getSnowflakeSDK();
    if (!sdk) {
      return { success: false, provider: 'snowflake', durationMs: 0, rowCount: 0, columns: [], columnTypes: [], rows: [], error: 'snowflake-sdk not installed', executionContextHash: null, executionTimestamp: timestamp };
    }

    let conn: any;
    try {
      conn = await connectSnowflake(sdk, sfConfig);

      // Collect context evidence BEFORE query
      const ctxRows = await execSql(conn, `
        SELECT CURRENT_VERSION() AS ver, CURRENT_ACCOUNT() AS acct,
               CURRENT_DATABASE() AS db, CURRENT_SCHEMA() AS sch
      `, sfConfig.timeoutMs);
      const ctx = ctxRows[0] as any;
      const executionContextHash = createHash('sha256')
        .update(`${ctx.VER}|${ctx.ACCT}|${ctx.DB}|${ctx.SCH}|snowflake`)
        .digest('hex')
        .slice(0, 16);

      // Capture schema attestation (best-effort)
      let schemaAttestationResult: ConnectorExecutionResult['schemaAttestation'] = null;
      try {
        const tableRefs = [...sql.matchAll(/\b(\w+)\.(\w+)\.(\w+)\b/g)].map(m => m[3]);
        if (tableRefs.length > 0 && ctx.DB && ctx.SCH) {
          const attestation = await captureSnowflakeSchemaAttestation(
            (s: string) => execSql(conn, s, sfConfig.timeoutMs), ctx.DB, ctx.SCH, tableRefs,
          );
          schemaAttestationResult = {
            schemaFingerprint: attestation.schemaFingerprint,
            sentinelFingerprint: attestation.sentinelFingerprint,
            tables: attestation.tables,
            attestationHash: attestation.attestationHash,
            source: 'snowflake',
          };
        }
      } catch { /* schema attestation is best-effort */ }

      // Execute governed query
      const rows = await execSql(conn, injectLimit(sql, sfConfig.maxRows), sfConfig.timeoutMs);
      const durationMs = Date.now() - start;

      // Extract columns from first row
      const columns = rows.length > 0 ? Object.keys(rows[0] as any) : [];
      const columnTypes = columns.map(() => 'unknown'); // Snowflake SDK doesn't expose types easily

      return {
        success: true,
        provider: 'snowflake',
        durationMs,
        rowCount: rows.length,
        columns,
        columnTypes,
        rows: rows as Record<string, unknown>[],
        error: null,
        executionContextHash,
        executionTimestamp: timestamp,
        schemaAttestation: schemaAttestationResult,
      };
    } catch (err: any) {
      return {
        success: false, provider: 'snowflake', durationMs: Date.now() - start,
        rowCount: 0, columns: [], columnTypes: [], rows: [],
        error: err.message ?? String(err), executionContextHash: null, executionTimestamp: timestamp,
      };
    } finally {
      if (conn) conn.destroy(() => {});
    }
  },

  async preflight(sql: string, config: ConnectorConfig): Promise<ConnectorPreflightResult> {
    const sfConfig = config as SnowflakeConfig;
    try {
      validateReadOnlySql(sql);
      enforceSnowflakeAllowedSchemas(sql, sfConfig.allowedSchemas ?? [], sfConfig.database);
    } catch (err) {
      return {
        performed: false,
        provider: 'snowflake',
        riskLevel: 'critical',
        recommendation: 'deny',
        signals: [{
          signal: 'sql_not_read_only',
          severity: 'critical',
          detail: err instanceof Error ? err.message : String(err),
        }],
      };
    }

    const sdk = await getSnowflakeSDK();
    if (!sdk) {
      return {
        performed: false,
        provider: 'snowflake',
        riskLevel: 'critical',
        recommendation: 'deny',
        signals: [{
          signal: 'driver_missing',
          severity: 'critical',
          detail: 'snowflake-sdk not installed',
        }],
      };
    }

    let conn: any;
    try {
      conn = await connectSnowflake(sdk, sfConfig);
      const rows = await execSql(conn, `EXPLAIN USING JSON ${sql}`, sfConfig.timeoutMs);
      const planStr = JSON.stringify(rows);

      // Basic risk analysis from plan size
      const signals: { signal: string; severity: string; detail: string }[] = [];
      if (planStr.length > 10000) {
        signals.push({ signal: 'complex_plan', severity: 'warn', detail: `Plan is ${planStr.length} chars — may indicate complex query` });
      }

      return {
        performed: true,
        provider: 'snowflake',
        riskLevel: signals.length > 0 ? 'moderate' : 'low',
        recommendation: signals.some(s => s.severity === 'critical') ? 'deny' : signals.length > 0 ? 'warn' : 'proceed',
        signals,
      };
    } catch (err: any) {
      return {
        performed: false, provider: 'snowflake', riskLevel: 'critical', recommendation: 'deny',
        signals: [{ signal: 'explain_failed', severity: 'critical', detail: err.message }],
      };
    } finally {
      if (conn) conn.destroy(() => {});
    }
  },

  async probe(config: ConnectorConfig): Promise<ConnectorProbeResult> {
    const sfConfig = config as SnowflakeConfig;
    const steps: { step: string; passed: boolean; detail: string }[] = [];
    let serverVersion: string | null = null;

    const sdk = await getSnowflakeSDK();
    if (!sdk) {
      steps.push({ step: 'driver', passed: false, detail: 'snowflake-sdk not installed' });
      return { provider: 'snowflake', success: false, steps, serverVersion, message: 'Driver not installed' };
    }
    steps.push({ step: 'driver', passed: true, detail: 'snowflake-sdk available' });

    let conn: any;
    try {
      conn = await connectSnowflake(sdk, sfConfig);
      steps.push({ step: 'connect', passed: true, detail: `Connected to ${sfConfig.account}` });

      const vRows = await execSql(conn, 'SELECT CURRENT_VERSION() AS version', sfConfig.timeoutMs);
      serverVersion = (vRows[0] as any)?.VERSION ?? null;
      steps.push({ step: 'version', passed: !!serverVersion, detail: serverVersion ? `Snowflake ${serverVersion}` : 'Version unknown' });

      const whRows = await execSql(conn, 'SELECT CURRENT_WAREHOUSE() AS wh', sfConfig.timeoutMs);
      const wh = (whRows[0] as any)?.WH;
      steps.push({ step: 'warehouse', passed: !!wh, detail: wh ? `Warehouse: ${wh}` : 'No warehouse' });

      return { provider: 'snowflake', success: steps.every(s => s.passed), steps, serverVersion, message: 'Snowflake probe passed' };
    } catch (err: any) {
      steps.push({ step: 'connect', passed: false, detail: err.message });
      return { provider: 'snowflake', success: false, steps, serverVersion, message: `Probe failed: ${err.message}` };
    } finally {
      if (conn) conn.destroy(() => {});
    }
  },
};
