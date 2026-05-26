# Golden Path: External Communication

Status: in progress. E01 is repository-side only. It is not a live email,
SMS, ticketing, social, CRM, SendGrid, or Mailgun connector, not customer PEP
proof, not compliance certification, not production readiness, and not
enterprise readiness.

## Decision

External Communication is the next pack after Money Movement, Data Movement,
and Authority Change. It keeps the same Attestor consequence grammar, but moves
the example into customer-facing, legal, billing, support, regulated, and
public messages:

```text
AI-prepared outbound message intent
  -> synthetic canonical shadow events
  -> digest-only recipient, message-class, claim-class, approval, policy, replay, and trace refs
  -> admit / narrow / review / block shadow decisions
  -> later Policy Foundry projection, runtime smoke, reviewer sandbox, and demo output
```

Non-split boundary:

```text
Not an email service.
Not a CRM or ticketing system.
Not a support inbox.
Not a marketing automation platform.
Not a legal approval system.
Not a sender, mailbox owner, or delivery provider.
Not a new Attestor mode.
```

The communication domain supplies the example surface; it does not get
independent authority. Every scenario remains shadow-only and review material
until a later customer-controlled PEP/gate consumes an Attestor decision.

## Repository Evidence

| Area | Evidence | State |
|---|---|---|
| External Communication taxonomy | `README.md` lists External Communication as customer-facing, legal, regulated, billing, support, or public messages, and says the pack list is taxonomy, not an equal-maturity claim. | repo-proven |
| Canonical consequence class | `src/consequence-admission/canonical-shadow-event-schema.ts` includes `external-communication` as a canonical shadow-event consequence class. | repo-proven |
| Action-surface inference | `src/consequence-admission/action-surface-declaration-ingestors.ts` maps message, email, ticket, notification, SMS, Slack, and reply language into `external-communication`. | repo-proven |
| E01 fixture contract | `src/consequence-admission/golden-external-communication-shadow-fixtures.ts` emits eight synthetic digest-only canonical shadow events for external communication scenarios. | repo-proven once merged |
| E01 tests | `tests/golden-external-communication-shadow-fixtures.test.ts` locks the suite shape, digest-only canonical events, scenario semantics, no-target-system-call flags, no raw message bodies, no raw recipient identifiers, and no raw customer identifiers. | repo-proven once merged |

## Research Anchors

FTC commercial-email guidance anchors the idea that outbound commercial email
has sender, content, opt-out, and recipient-control obligations. FTC
endorsement guidance anchors public-facing claim discipline. These are
engineering anchors only, not compliance certification.

- [FTC CAN-SPAM Act: A Compliance Guide for Business](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business)
- [FTC Endorsement Guides](https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides)

SendGrid Sandbox Mode and Mailgun test mode anchor the provider-side pattern
of validating message shape without actually delivering a message. Attestor
uses the same safety idea at the action-control boundary: structure and check
the outbound message intent before any customer-owned delivery provider sends
it.

- [Twilio SendGrid Sandbox Mode](https://www.twilio.com/docs/sendgrid/for-developers/sending-email/sandbox-mode)
- [Mailgun Test Mode](https://documentation.mailgun.com/docs/mailgun/user-manual/sending-messages/test-mode)

NIST AI RMF anchors the broader risk-management vocabulary: map context,
measure risk, manage controls, and govern accountability for AI-enabled system
actions. This is an engineering anchor only, not a NIST conformance claim.

- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)

## E-Series Tracker

Progress after E01 lands: 1/4 complete. 3 steps remain.

| Step | Status | Slice | Evidence target |
|---|---|---|---|
| E01 | complete once merged | External Communication shadow fixture contract | Synthetic digest-only canonical shadow events for support-reply-approved, refund-promise-review, legal-claim-blocked, wrong-recipient-blocked, public-overclaim-narrowing, commercial-email-control-gap, prompt-injection-in-ticket, and duplicate-send-replay-blocked scenarios. |
| E02 | pending | Policy Foundry communication projection | Review-only candidate, named gaps, decision counts, and Policy Twin summary over E01 fixtures. |
| E03 | pending | Runtime smoke and pilot readiness | Run the existing shadow runtime chain over E01/E02 material and emit only `ready-for-shadow-pilot` or `not-ready`. |
| E04 | pending | Demo CLI and reviewer sandbox | Markdown-first local demo plus strict local JSON reviewer input, with no provider calls and no raw message material. |

## E01 Scenario Contract

E01 covers eight fixture-only cases:

```text
support-reply-approved
refund-promise-review
legal-claim-blocked
wrong-recipient-blocked
public-overclaim-narrowing
commercial-email-control-gap
prompt-injection-in-ticket
duplicate-send-replay-blocked
```

Every fixture records:

```text
tenantRefDigest
actorRefDigest
targetAccountRefDigest
channel class
message class
recipient class
claim class
approval freshness
tenant scope
commercial email posture
evidence authority
evidence refs
approval refs
policy refs
replay/idempotency/trace refs
```

Every fixture forbids:

```text
raw message bodies
raw recipient identifiers
raw customer identifiers
raw provider payloads
target-system calls
provider sends
auto enforcement
production readiness claims
```

## E02-E04 Planned Shape

E02 should project E01 fixtures into review-only Policy Foundry material with
named gaps for refund or credit promises, legal claims, recipient mismatch,
public overclaim, commercial-email control gaps, instruction-like ticket text,
and duplicate send replay.

E03 should replay E01/E02 through the existing shadow runtime smoke chain and
produce a shadow-entry pilot readiness packet only. It must not send a message,
write an audit record, activate policy, or claim scoped enforcement readiness.

E04 should make the path locally inspectable:

```bash
npm run demo:golden-external-communication
npm run demo:golden-external-communication -- --json
npm run demo:golden-external-communication -- --scenario fixtures/golden-external-communication-reviewer-sandbox.example.json
```

Those commands are planned, not available in E01. They must not be added to
README until the CLI and reviewer sandbox exist.

## No-Claims

E01 does not prove:

- live email, SMS, ticketing, CRM, or public-post delivery;
- native SendGrid, Mailgun, CRM, Zendesk, Slack, or social-platform connector coverage;
- commercial email legal compliance;
- legal approval correctness;
- support response correctness;
- customer PEP no-bypass enforcement;
- live replay/idempotency store wiring;
- automatic policy activation;
- production readiness;
- enterprise readiness.
