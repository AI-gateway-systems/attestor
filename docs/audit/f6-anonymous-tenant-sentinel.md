# F6 Anonymous Tenant Sentinel Validation

Status: repository-side validation for F6-T10.

This is not a production multi-tenant isolation claim. It only closes the
collision-prone anonymous fallback identifier used by local-dev and public
auth-route contexts.

## Decision

Anonymous tenant context now uses the reserved sentinel:

```text
__attestor_anonymous__
```

The legacy anonymous `default` value is accepted only as compatibility input
when the tenant source is `anonymous`. A real authenticated tenant whose id is
`default` remains a normal tenant when the source is `api_key` or
`account_session`.

## Repository Evidence

- `src/service/tenant-isolation.ts` exports `ANONYMOUS_TENANT_ID`,
  `LEGACY_ANONYMOUS_TENANT_ID`, and `isAnonymousTenantContext`.
- `tenantMiddleware` writes the reserved anonymous sentinel for local-dev
  fallback and public pre-auth contexts.
- `getTenantContextFromHeaders` normalizes missing internal tenant headers and
  legacy anonymous `default` headers to the reserved sentinel.
- `src/service/request-context.ts` no longer treats the literal `default`
  tenant id as anonymous unless the context is actually anonymous.
- `src/service/request-observability-middleware.ts` avoids hosted-account
  lookup for anonymous context through the shared helper, not a string match.
- `src/service/async/async-pipeline.ts` normalizes anonymous job metadata to the
  reserved sentinel.

## Tests

Run:

```bash
npm run test:f6-anonymous-tenant-sentinel
npx tsx tests/tenant-isolation-production-guard.test.ts
```

The sentinel test verifies:

- missing internal tenant headers resolve to `__attestor_anonymous__`;
- legacy anonymous `default` headers normalize to `__attestor_anonymous__`;
- an API-key tenant named `default` remains distinct from anonymous context;
- local-dev fallback writes the reserved sentinel;
- release requester and evaluation context still suppress anonymous tenant ids.

## Remaining F6 Boundary

This does not make Attestor cryptographically tenant-isolated. Per-tenant
signer isolation, RLS/data-path wiring, usage-meter shared-store posture, and
recipient/tenant runtime boundary enforcement remain separate F6 items.
