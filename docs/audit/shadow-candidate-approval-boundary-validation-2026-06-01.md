# Shadow Candidate Approval Boundary Validation - 2026-06-01

## Recent Fixes Chain-Effect Check

Current `origin/master` source head at validation start:

```text
a1405e626c24616406362e748b89531ca4ecad36
```

Recent policy-control lifecycle hardening is closed repo-side as OPS-206 and was not reopened by this pass. Prior generic middleware binding/default findings remain contradicted by OPS-194, OPS-204, and current tests. This validation is scoped to shadow policy-candidate lifecycle attribution and promotion readiness only.

## Validation Frame

Trust surface: shadow policy candidate materialization, status transitions, promotion draft generation, and hosted route audit metadata.

Protected principles:

- customer authority
- proof integrity
- auditability
- replay and idempotency safety
- no overclaim

Source anchors:

- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html): authorize each request, deny by default, log authorization events, and test authorization logic.
- [NIST SP 800-162 ABAC](https://csrc.nist.gov/pubs/sp/800/162/upd2/final): authorization decisions can bind subject, object, action, and environmental attributes.
- [NIST SP 800-63B](https://pages.nist.gov/800-63-4/sp800-63b.html): authenticated session evidence anchors the route context; arbitrary request metadata remains non-authoritative here.
- [NIST SP 800-218 SSDF](https://csrc.nist.gov/pubs/sp/800/218/final): security fixes should be reviewed, tested, and tracked to prevent recurrence.

These anchors support control mapping only. They do not prove production readiness, compliance, or independent assurance.

## Inspected Files

- `src/service/http/routes/shadow-policy-foundry-promotion-routes.ts`
- `src/service/http/routes/shadow-routes.ts`
- `src/service/bootstrap/routes.ts`
- `src/service/shadow/shadow-policy-candidate-store.ts`
- `src/service/shadow/shadow-persistence-types.ts`
- `src/consequence-admission/policy-discovery-candidates.ts`
- `src/consequence-admission/shadow-policy-promotion-draft.ts`
- `tests/shadow-policy-candidate-approval-routes.test.ts`
- `tests/shadow-persistence-store.test.ts`
- `tests/shadow-policy-promotion-draft.test.ts`
- `docs/02-architecture/policy-discovery-candidates.md`
- `docs/audit/report-index.md`
- `docs/audit/finding-index.md`
- `docs/audit/control-map.md`

## Findings

### OPS-207 - Shadow policy-candidate status actor provenance

State: closed repo-side / live-proof-only.

The hosted policy-candidate status route previously accepted `actorRef` from the request body and passed it into the candidate store as the approval/status actor. The route was tenant-authenticated, but the actor label itself was caller-supplied metadata rather than derived route authority.

Remediation:

- `ShadowRouteDeps` now exposes `currentShadowMutationActorRef`.
- The hosted status route derives the status actor from authenticated account access when present, otherwise from the current tenant-auth context.
- The derived actor is part of the status-transition idempotency payload, so replay/conflict handling treats actor context as mutation semantics.
- Request-body `actorRef` is no longer required and is not persisted as authority; audit metadata records only bounded presence/length fields.
- Route tests lock that a body-supplied actor label does not become persisted approval authority.

Remaining boundary:

- This does not prove an independently authenticated customer approval workflow.
- Live role/session/key deployment and shared shadow mutation audit proof remain live/operator work.

### OPS-208 - Shadow policy-candidate approval drift after candidate changes

State: closed repo-side / live-proof-only.

Policy candidate IDs are derived from stable recommendation dimensions, while candidate text and source metadata can change. Existing persistence preserved approved/activated lifecycle state across a same-ID update, so changed candidate content could keep stale approval status.

Remediation:

- Candidate status history entries now carry the candidate digest they approved.
- Upserting a same-ID candidate with changed content or source binding resets status to `draft` and clears prior approval history for re-review.
- Promotion draft generation includes approver references and approval-trail digests only from status-history entries matching the current candidate digest.
- Persistence tests lock approval reset behavior when candidate content changes.

Remaining boundary:

- Existing persisted histories without digest metadata become non-promotable through the current digest-matching path and require re-review.
- Live shared candidate-store behavior and customer PEP no-bypass remain outside this repository slice.

## Chain Reactions

- Promotion drafts may now block older persisted approved candidates that lack digest-bound approval history. This is intentionally fail-closed for candidate promotion.
- Hosted transition request compatibility is preserved for clients still sending `actorRef`, but that field is metadata only.
- The route still records tenant-bound mutation audit metadata without raw actor-label persistence.

## Coverage Delta

Added and updated locking coverage:

- `tests/shadow-policy-candidate-approval-routes.test.ts`
- `tests/shadow-persistence-store.test.ts`
- `tests/shadow-policy-promotion-draft.test.ts`

Related regression coverage to run for this slice:

- `tests/shadow-policy-promotion-packet.test.ts`
- `tests/shadow-policy-bundle-publication.test.ts`
- `tests/service-shadow-routes-http.test.ts`
- `tests/shadow-route-tenant-boundary.test.ts`
- `npm run typecheck`
- `npm run typecheck:hygiene`
- `npm run test:audit-finding-test-coverage`
- `npm run test:audit-finding-evidence`
- `npm run check:security-evidence-system`
- `npm run check:public-artifacts-redaction`
- `git diff --check`

## Verdict

The two scoped shadow policy-candidate approval findings are repo-proven and remediated repo-side. The fix strengthens the single Attestor consequence boundary by making shadow policy promotion depend on authenticated route context and current candidate digest evidence, without granting automatic enforcement authority.

## Final Checkpoint

Scoped repository remediation: complete after the listed tests pass.

No repo-proven P0/P1 remains in this slice.

Live proof still needed:

- live account/session/key deployment proof
- live shared shadow candidate-store proof
- live shadow mutation audit-chain proof
- customer PEP no-bypass proof
- production readiness proof

This report does not claim production readiness, compliance readiness, enterprise readiness, customer PEP no-bypass, or live customer approval workflow proof.
