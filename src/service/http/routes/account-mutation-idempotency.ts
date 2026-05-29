import type { Context } from 'hono';
import type {
  PipelineIdempotencyReadyResult,
  PipelineIdempotencyService,
} from '../../application/pipeline-idempotency-service.js';
import type { AccountAccessContext } from '../../tenant-isolation.js';

export type AccountMutationIdempotencyBegin =
  | { readonly kind: 'ready'; readonly ready: PipelineIdempotencyReadyResult | null }
  | { readonly kind: 'response'; readonly response: Response };

export function accountIdempotencyKeyFor(c: Context): string | null {
  const normalized = c.req.header('Idempotency-Key')?.trim() ?? '';
  return normalized.length > 0 ? normalized : null;
}

export function accountIdempotencyReplayResponse(input: {
  readonly statusCode: number;
  readonly responseBody: unknown;
  readonly replay: boolean;
}): Response {
  return new Response(JSON.stringify(input.responseBody), {
    status: input.statusCode,
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      'cache-control': 'no-store',
      ...(input.replay ? { 'x-attestor-idempotent-replay': 'true' } : {}),
    },
  });
}

export async function beginAccountMutationIdempotency(
  c: Context,
  access: AccountAccessContext,
  routeId: string,
  requestPayload: unknown,
  accountMutationIdempotencyService: PipelineIdempotencyService | undefined,
): Promise<AccountMutationIdempotencyBegin> {
  const idempotencyKey = accountIdempotencyKeyFor(c);
  if (!idempotencyKey) {
    return { kind: 'ready', ready: null };
  }

  if (!accountMutationIdempotencyService) {
    return {
      kind: 'response',
      response: c.json({
        error: 'Account mutation idempotency store is not configured.',
      }, 503),
    };
  }

  const begin = await accountMutationIdempotencyService.begin({
    idempotencyKey,
    tenantId: `account:${access.accountId}`,
    routeId,
    requestPayload,
  });

  if (begin.kind === 'ready') {
    return { kind: 'ready', ready: begin };
  }

  if (begin.kind === 'replay') {
    return {
      kind: 'response',
      response: accountIdempotencyReplayResponse({
        statusCode: begin.statusCode,
        responseBody: begin.responseBody,
        replay: true,
      }),
    };
  }

  if (begin.kind === 'conflict') {
    return {
      kind: 'response',
      response: c.json({
        error: 'Idempotency-Key was already used for a different account mutation request.',
      }, 409),
    };
  }

  return {
    kind: 'response',
    response: c.json({
      error: 'Account mutation idempotency store is not configured.',
    }, 503),
  };
}

export async function finalizeAccountMutationIdempotency(
  access: AccountAccessContext,
  routeId: string,
  requestPayload: unknown,
  idempotency: PipelineIdempotencyReadyResult | null,
  statusCode: number,
  responseBody: Record<string, unknown>,
  accountMutationIdempotencyService: PipelineIdempotencyService | undefined,
): Promise<Record<string, unknown>> {
  if (!idempotency?.idempotencyKey || !accountMutationIdempotencyService) {
    return responseBody;
  }
  return accountMutationIdempotencyService.finalize({
    idempotencyKey: idempotency.idempotencyKey,
    tenantId: `account:${access.accountId}`,
    routeId,
    requestPayload,
    statusCode,
    responseBody,
  });
}
