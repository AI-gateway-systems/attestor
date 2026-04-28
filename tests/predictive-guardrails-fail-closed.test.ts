import assert from 'node:assert/strict';
import { analyzePlan } from '../src/connectors/predictive-guardrails.js';

let passed = 0;

function equal<T>(actual: T, expected: T, message: string): void {
  assert.equal(actual, expected, message);
  passed += 1;
}

function ok(condition: unknown, message: string): void {
  assert.ok(condition, message);
  passed += 1;
}

function testMissingExplainPlanFailsClosed(): void {
  const result = analyzePlan(null);

  equal(result.performed, false, 'Predictive guardrail: missing EXPLAIN plan is not treated as performed');
  equal(result.riskLevel, 'critical', 'Predictive guardrail: missing EXPLAIN plan is critical');
  equal(result.recommendation, 'deny', 'Predictive guardrail: missing EXPLAIN plan denies execution');
  equal(result.signals[0]?.signal, 'explain_plan_missing', 'Predictive guardrail: missing plan reason is explicit');
}

function testMalformedExplainPlanFailsClosed(): void {
  const result = analyzePlan([
    {
      Plan: {
        get 'Node Type'() {
          throw new Error('malformed plan');
        },
      },
    },
  ]);

  equal(result.performed, false, 'Predictive guardrail: malformed EXPLAIN plan is not treated as performed');
  equal(result.riskLevel, 'critical', 'Predictive guardrail: malformed EXPLAIN plan is critical');
  equal(result.recommendation, 'deny', 'Predictive guardrail: malformed EXPLAIN plan denies execution');
  equal(result.signals[0]?.signal, 'explain_plan_malformed', 'Predictive guardrail: malformed plan reason is explicit');
}

function testValidLowRiskPlanCanProceed(): void {
  const result = analyzePlan([
    {
      Plan: {
        'Node Type': 'Index Scan',
        'Plan Rows': 10,
        'Total Cost': 5,
      },
    },
  ]);

  equal(result.performed, true, 'Predictive guardrail: valid EXPLAIN plan is treated as performed');
  equal(result.riskLevel, 'low', 'Predictive guardrail: low-risk plan stays low risk');
  equal(result.recommendation, 'proceed', 'Predictive guardrail: low-risk valid plan can proceed');
  ok(result.plannerEvidence?.nodeTypes.includes('Index Scan'), 'Predictive guardrail: valid plan evidence is retained');
}

testMissingExplainPlanFailsClosed();
testMalformedExplainPlanFailsClosed();
testValidLowRiskPlanCanProceed();

console.log(`Predictive guardrails fail-closed tests: ${passed} passed, 0 failed`);
