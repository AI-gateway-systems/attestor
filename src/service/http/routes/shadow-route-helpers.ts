import type { Context } from 'hono';
import {
  createConsequenceAdmissionProblem,
} from '../../../consequence-admission/index.js';
import type { TenantContext } from '../../tenant-isolation.js';

export type ShadowProblemStatus = 400 | 404 | 409 | 415 | 429 | 503;

const SHADOW_LIST_DEFAULT_LIMIT = 50;
const SHADOW_LIST_MAX_LIMIT = 100;

type ShadowListPage<T> = {
  readonly records: readonly T[];
  readonly pageInfo: {
    readonly limit: number;
    readonly cursor: string | null;
    readonly nextCursor: string | null;
    readonly hasMore: boolean;
    readonly totalRecordCount: number;
  };
};

type TenantBoundRecord = {
  readonly tenantId: string | null;
};

export const SHADOW_TENANT_BOUNDARY_MARKER = 'Shadow tenant boundary violation';

export function tenantSummary(tenant: TenantContext): {
  readonly tenantId: string;
  readonly source: TenantContext['source'];
  readonly planId: string | null;
} {
  return Object.freeze({
    tenantId: tenant.tenantId,
    source: tenant.source,
    planId: tenant.planId,
  });
}

export function assertTenantBoundRecord<T extends TenantBoundRecord>(
  tenant: TenantContext,
  record: T,
  resource: string,
  options?: { readonly allowNullTenantId?: boolean },
): T {
  if (record.tenantId === null && options?.allowNullTenantId === true) return record;
  if (record.tenantId !== tenant.tenantId) {
    throw new Error(
      `${SHADOW_TENANT_BOUNDARY_MARKER}: ${resource} record does not belong to the authenticated tenant.`,
    );
  }
  return record;
}

export function assertTenantBoundRecords<T extends TenantBoundRecord>(
  tenant: TenantContext,
  records: readonly T[],
  resource: string,
  options?: { readonly allowNullTenantId?: boolean },
): readonly T[] {
  for (const record of records) assertTenantBoundRecord(tenant, record, resource, options);
  return records;
}

function caughtErrorMessage(error: unknown): string | null {
  return error instanceof Error ? error.message : null;
}

export function boundedErrorDetail(
  error: unknown,
  fallback: string,
  options?: {
    readonly safeMarkers?: readonly string[];
    readonly safeDetail?: string;
    readonly tenantBoundarySafeDetail?: string;
  },
): string {
  const message = caughtErrorMessage(error);
  if (message?.includes(SHADOW_TENANT_BOUNDARY_MARKER)) {
    return options?.tenantBoundarySafeDetail ?? 'The shadow route rejected a tenant boundary violation.';
  }
  if (
    message &&
    options?.safeMarkers?.some((marker) => message.includes(marker))
  ) {
    return options.safeDetail ?? fallback;
  }
  return fallback;
}

export function caughtErrorStatus(
  error: unknown,
  input: {
    readonly statusMarkers?: readonly {
      readonly marker: string;
      readonly status: ShadowProblemStatus;
    }[];
    readonly defaultStatus: ShadowProblemStatus;
  },
): ShadowProblemStatus {
  const message = caughtErrorMessage(error);
  if (message) {
    const match = input.statusMarkers?.find((candidate) => message.includes(candidate.marker));
    if (match) return match.status;
  }
  return input.defaultStatus;
}

export function problem(c: Context, input: {
  readonly type: string;
  readonly title: string;
  readonly status: ShadowProblemStatus;
  readonly detail: string;
  readonly reasonCodes: readonly string[];
}): Response {
  return c.json(createConsequenceAdmissionProblem({
    ...input,
    instance: c.req.path,
  }), input.status);
}

export function shadowListPage<T>(
  c: Context,
  records: readonly T[],
  resourceName: string,
): ShadowListPage<T> | Response {
  const limitRaw = c.req.query('limit');
  const cursorRaw = c.req.query('cursor');
  const limit = limitRaw === undefined || limitRaw.trim() === ''
    ? SHADOW_LIST_DEFAULT_LIMIT
    : Number.parseInt(limitRaw, 10);
  const offset = cursorRaw === undefined || cursorRaw.trim() === ''
    ? 0
    : Number.parseInt(cursorRaw, 10);

  if (!Number.isInteger(limit) || limit <= 0 || limit > SHADOW_LIST_MAX_LIMIT) {
    return problem(c, {
      type: 'https://attestor.dev/problems/shadow-list-pagination-invalid',
      title: 'Invalid shadow list pagination',
      status: 400,
      detail: `${resourceName} limit must be an integer from 1 to ${SHADOW_LIST_MAX_LIMIT}.`,
      reasonCodes: ['invalid-shadow-list-pagination'],
    });
  }
  if (!Number.isInteger(offset) || offset < 0) {
    return problem(c, {
      type: 'https://attestor.dev/problems/shadow-list-pagination-invalid',
      title: 'Invalid shadow list pagination',
      status: 400,
      detail: `${resourceName} cursor must be a non-negative offset cursor.`,
      reasonCodes: ['invalid-shadow-list-pagination'],
    });
  }

  const pageRecords = records.slice(offset, offset + limit);
  const nextOffset = offset + pageRecords.length;
  const hasMore = nextOffset < records.length;
  return {
    records: pageRecords,
    pageInfo: {
      limit,
      cursor: cursorRaw === undefined || cursorRaw.trim() === '' ? null : String(offset),
      nextCursor: hasMore ? String(nextOffset) : null,
      hasMore,
      totalRecordCount: records.length,
    },
  };
}

export function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
