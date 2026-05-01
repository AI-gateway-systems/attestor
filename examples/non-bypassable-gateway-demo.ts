import { pathToFileURL } from 'node:url';
import {
  ConsequenceAdmissionVerificationHeldError,
  createConsequenceAdmissionCheck,
  createConsequenceAdmissionRequest,
  createConsequenceAdmissionResponse,
  createConsequenceAdmissionVerifier,
  type ConsequenceAdmissionCheck,
  type ConsequenceAdmissionResponse,
  type ConsequenceAdmissionVerification,
} from '../src/consequence-admission/index.js';

interface PaymentCommand {
  readonly id: string;
  readonly supplierId: string;
  readonly amountEur: number;
  readonly downstreamSystem: string;
  readonly idempotencyKey: string | null;
  readonly requestedBypass: boolean;
}

interface PaymentExecution {
  readonly paymentId: string;
  readonly supplierId: string;
  readonly amountEur: number;
  readonly admissionId: string;
  readonly verificationDigest: string;
}

interface DemoScenario {
  readonly label: string;
  readonly admission: ConsequenceAdmissionResponse;
  readonly payment: PaymentCommand;
}

interface DemoScenarioResult {
  readonly label: string;
  readonly requestedBypass: boolean;
  readonly outcome: 'executed' | 'held';
  readonly paymentId: string;
  readonly downstreamSystem: string;
  readonly ledgerCountAfter: number;
  readonly verification: ConsequenceAdmissionVerification;
}

export interface NonBypassableGatewayDemoResult {
  readonly rawDispatchExposed: false;
  readonly scenarios: readonly DemoScenarioResult[];
  readonly ledger: readonly PaymentExecution[];
  readonly output: string;
}

function passCheck(kind: ConsequenceAdmissionCheck['kind']): ConsequenceAdmissionCheck {
  return createConsequenceAdmissionCheck({
    kind,
    label: `${kind} check`,
    outcome: 'pass',
    required: true,
    summary: `${kind} passed for the proposed payment consequence.`,
    reasonCodes: [`payment-${kind}-passed`],
    evidenceRefs: [`evidence:${kind}`],
  });
}

function paymentAdmission(input: {
  readonly requestId: string;
  readonly decision: 'admit' | 'block';
  readonly proof: boolean;
}): ConsequenceAdmissionResponse {
  const request = createConsequenceAdmissionRequest({
    requestedAt: '2026-05-01T12:00:00.000Z',
    requestId: input.requestId,
    packFamily: 'general',
    entryPoint: {
      kind: 'internal-service',
      id: 'non-bypassable-payment-adapter',
      route: null,
      packageSubpath: null,
      sourceRef: 'examples/non-bypassable-gateway-demo.ts',
    },
    proposedConsequence: {
      actor: 'AI-assisted procurement workflow',
      action: 'prepare supplier payment dispatch',
      downstreamSystem: 'supplier-payment-service',
      consequenceKind: 'action',
      riskClass: 'R3',
      summary:
        'AI-assisted workflow asks to dispatch a supplier payment through the customer payment adapter.',
    },
    policyScope: {
      policyRef: 'policy:payments:v1',
      tenantId: 'tenant_demo_payments',
      environment: 'local-demo',
      dimensions: {
        domain: 'money-movement',
      },
    },
    authority: {
      actorRef: 'actor:procurement-agent',
      reviewerRef: 'reviewer:finance-ops',
      authorityMode: 'named-reviewer',
    },
    evidence: [
      {
        id: 'evidence:supplier-invoice',
        kind: 'invoice',
        digest: 'sha256:supplier-invoice',
        uri: null,
      },
    ],
    nativeInputRefs: ['supplierId', 'amountEur', 'downstreamSystem', 'idempotencyKey'],
  });

  return createConsequenceAdmissionResponse({
    request,
    decidedAt: '2026-05-01T12:00:01.000Z',
    decision: input.decision,
    reason:
      input.decision === 'admit'
        ? 'Payment consequence passed the gateway checks.'
        : 'Payment consequence was blocked before the payment adapter.',
    reasonCodes: [`payment-${input.decision}`],
    checks:
      input.decision === 'admit'
        ? [
            passCheck('policy'),
            passCheck('authority'),
            passCheck('evidence'),
            passCheck('freshness'),
            passCheck('enforcement'),
          ]
        : [],
    proof: input.proof
      ? [
          {
            kind: 'release-token',
            id: `rt_${input.requestId}`,
            digest: `sha256:${input.requestId}`,
            uri: null,
            verifyHint: 'Verify the Attestor release token before dispatching payment.',
          },
        ]
      : [],
  });
}

function createProtectedPaymentAdapter() {
  const ledger: PaymentExecution[] = [];
  const verifier = createConsequenceAdmissionVerifier({
    verifierRef: 'payment-adapter:supplier-payment-service',
    now: () => '2026-05-01T12:00:02.000Z',
    contract: {
      enforcementPointId: 'payment-adapter:supplier-payment-service',
      boundaryKind: 'payment-adapter',
      consequenceDomain: 'money-movement',
      downstreamSystems: ['supplier-payment-service'],
      acceptedConsequenceKinds: ['action', 'agent-payment'],
      acceptedRiskClasses: ['R3', 'R4'],
      policyRefs: ['policy:payments:v1'],
      environment: 'local-demo',
    },
  });

  function dispatch(payment: PaymentCommand, verification: ConsequenceAdmissionVerification): void {
    ledger.push({
      paymentId: payment.id,
      supplierId: payment.supplierId,
      amountEur: payment.amountEur,
      admissionId: verification.admissionId,
      verificationDigest: verification.receiptDigest,
    });
  }

  return Object.freeze({
    rawDispatchExposed: false as const,
    handle(input: {
      readonly admission: ConsequenceAdmissionResponse;
      readonly payment: PaymentCommand;
    }): DemoScenarioResult {
      try {
        const verification = verifier.assert({
          admission: input.admission,
          observation: {
            downstreamSystem: input.payment.downstreamSystem,
            idempotencyKey: input.payment.idempotencyKey,
          },
        });
        dispatch(input.payment, verification);
        return {
          label: '',
          requestedBypass: input.payment.requestedBypass,
          outcome: 'executed',
          paymentId: input.payment.id,
          downstreamSystem: input.payment.downstreamSystem,
          ledgerCountAfter: ledger.length,
          verification,
        };
      } catch (error) {
        if (!(error instanceof ConsequenceAdmissionVerificationHeldError)) {
          throw error;
        }
        return {
          label: '',
          requestedBypass: input.payment.requestedBypass,
          outcome: 'held',
          paymentId: input.payment.id,
          downstreamSystem: input.payment.downstreamSystem,
          ledgerCountAfter: ledger.length,
          verification: error.verification,
        };
      }
    },
    ledger(): readonly PaymentExecution[] {
      return Object.freeze([...ledger]);
    },
  });
}

const allowedAdmission = paymentAdmission({
  requestId: 'admission_payment_allowed',
  decision: 'admit',
  proof: true,
});

const scenarios: readonly DemoScenario[] = Object.freeze([
  {
    label: 'Allowed payment through gateway',
    admission: allowedAdmission,
    payment: {
      id: 'pay_001',
      supplierId: 'supplier_steel_works',
      amountEur: 240,
      downstreamSystem: 'supplier-payment-service',
      idempotencyKey: 'idem:pay_001',
      requestedBypass: false,
    },
  },
  {
    label: 'Bypass attempt with no idempotency key',
    admission: allowedAdmission,
    payment: {
      id: 'pay_002',
      supplierId: 'supplier_steel_works',
      amountEur: 240,
      downstreamSystem: 'supplier-payment-service',
      idempotencyKey: null,
      requestedBypass: true,
    },
  },
  {
    label: 'Bypass attempt against wrong downstream system',
    admission: allowedAdmission,
    payment: {
      id: 'pay_003',
      supplierId: 'supplier_steel_works',
      amountEur: 240,
      downstreamSystem: 'unapproved-payment-service',
      idempotencyKey: 'idem:pay_003',
      requestedBypass: true,
    },
  },
  {
    label: 'Blocked admission cannot reach payment adapter',
    admission: paymentAdmission({
      requestId: 'admission_payment_blocked',
      decision: 'block',
      proof: false,
    }),
    payment: {
      id: 'pay_004',
      supplierId: 'supplier_steel_works',
      amountEur: 240,
      downstreamSystem: 'supplier-payment-service',
      idempotencyKey: 'idem:pay_004',
      requestedBypass: false,
    },
  },
]);

function renderFailureReasons(verification: ConsequenceAdmissionVerification): string {
  const reasons = verification.downstreamDecision.failureReasons;
  return reasons.length === 0 ? 'none' : reasons.join(', ');
}

function renderResult(result: Omit<NonBypassableGatewayDemoResult, 'output'>): string {
  const lines = [
    'Non-bypassable gateway demo',
    '===========================',
    '',
    'The payment dispatch function is private to the protected adapter.',
    'Every path goes through the Attestor verifier helper before the ledger changes.',
    `raw dispatch exposed: ${String(result.rawDispatchExposed)}`,
    '',
  ];

  for (const scenario of result.scenarios) {
    lines.push(
      `Scenario: ${scenario.label}`,
      `  requested bypass: ${String(scenario.requestedBypass)}`,
      `  payment: ${scenario.paymentId}`,
      `  downstream system: ${scenario.downstreamSystem}`,
      `  gateway outcome: ${scenario.outcome.toUpperCase()}`,
      `  verified: ${String(scenario.verification.verified)}`,
      `  failure reasons: ${renderFailureReasons(scenario.verification)}`,
      `  ledger count after: ${scenario.ledgerCountAfter}`,
      '',
    );
  }

  lines.push(
    `final ledger entries: ${result.ledger.length}`,
    'No verifier allow, no downstream consequence.',
  );
  return lines.join('\n');
}

export function runNonBypassableGatewayDemo(): NonBypassableGatewayDemoResult {
  const adapter = createProtectedPaymentAdapter();
  const renderedScenarios = scenarios.map((scenario) => ({
    ...adapter.handle({
      admission: scenario.admission,
      payment: scenario.payment,
    }),
    label: scenario.label,
  }));
  const result = {
    rawDispatchExposed: adapter.rawDispatchExposed,
    scenarios: Object.freeze(renderedScenarios),
    ledger: adapter.ledger(),
  } as const;

  return {
    ...result,
    output: renderResult(result),
  };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  console.log(runNonBypassableGatewayDemo().output);
}
