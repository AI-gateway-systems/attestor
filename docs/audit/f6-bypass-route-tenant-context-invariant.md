# F6 Bypass Route Tenant Context Invariant

Status: repository-side validation for F6-T5.

This closes the scoped bypass-route tenant-header invariant. It does not prove
all multi-tenant data paths are isolated; it only prevents routes that bypass
tenant middleware from accidentally trusting client-supplied internal tenant or
account headers.

## Invariant

Client-supplied `x-attestor-tenant-*` and `x-attestor-account-*` headers are
never trusted as tenant context.

Tenant context is trusted only when `tenantMiddleware` has written the internal
headers and marked them with:

```text
x-attestor-tenant-context-verified: true
```

Bypass routes clear all internal tenant/account headers before route handling.
Normal tenant-scoped routes also clear client-supplied internal headers before
writing their own verified context.

## Repository Evidence

- `src/service/tenant-isolation.ts` exports `TENANT_CONTEXT_VERIFIED_HEADER`,
  `clearTenantContextHeaders`, `markTenantContextVerified`, and
  `hasVerifiedTenantContext`.
- `tenantMiddleware` clears internal tenant/account headers on bypass routes.
- `tenantMiddleware` clears spoofed internal headers before writing verified
  tenant context on non-bypass routes.
- `src/service/request-context.ts` returns anonymous tenant context and `null`
  account access unless the verified marker is present.
- `src/service/request-observability-middleware.ts` therefore cannot treat
  spoofed bypass-route tenant headers as trusted tenant identity.

## Tests

Run:

```bash
npm run test:f6-bypass-route-tenant-context-invariant
```

The test verifies:

- `/api/v1/health` strips spoofed `x-attestor-tenant-*` headers before handler
  code runs;
- bypass routes do not set the verified tenant-context marker;
- `currentTenant` refuses spoofed bypass-route tenant ids;
- `currentAccountAccess` refuses spoofed bypass-route account headers;
- non-bypass routes overwrite spoofed internal headers with middleware-owned
  anonymous context in local-dev fallback mode.

## Remaining F6 Boundary

This does not solve F6-T2 RLS/data-path wiring, F6-T4 usage-meter shared-store
posture, F6-T8 recipient/tenant runtime output enforcement, or per-tenant signer
isolation for F6-T1/F6-T6.
