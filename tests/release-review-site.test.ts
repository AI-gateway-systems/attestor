import assert from 'node:assert/strict';
import type { ReleaseReviewerQueueDetail } from '../src/release-layer/index.js';
import { review } from '../src/release-layer/index.js';
import {
  renderReleaseReviewerQueueDetailPage,
  renderReleaseReviewerQueueInboxPage,
} from '../src/service/release/release-review-site.js';

let passed = 0;

function includes(content: string, expected: string, message: string): void {
  assert.ok(
    content.includes(expected),
    `${message}\nExpected to find: ${expected}`,
  );
  passed += 1;
}

const detail = {
  version: review.RELEASE_REVIEWER_QUEUE_SPEC_VERSION,
  id: 'rq_policy_provenance_ui',
  kind: 'finance.filing-export',
  status: 'approved',
  authorityState: 'approved',
  createdAt: '2026-05-10T05:00:00.000Z',
  updatedAt: '2026-05-10T05:10:00.000Z',
  decisionId: 'rd_policy_provenance_ui',
  releaseDecisionStatus: 'accepted',
  policyVersion: 'policy.release-review-ui.v1',
  policyHash: 'sha256:policy-review-ui',
  policyIrHash: 'sha256:policy-ir-review-ui',
  policyProvenanceSource: 'compiled-admission-policy-index',
  compiledPolicyIndexVersion: 'attestor.compiled-admission-policy-index.v1',
  compiledPolicyIrVersion: 'attestor.compiled-admission-policy-ir.v1',
  consequenceType: 'record',
  consequenceLabel: 'Record export',
  riskClass: 'R4',
  riskLabel: 'Regulated',
  requesterLabel: 'Attestor API',
  targetId: 'finance.filing.prepare',
  targetDisplayName: 'Finance filing export',
  authorityMode: 'dual-approval',
  minimumReviewerCount: 2,
  approvalsRecorded: 2,
  approvalsRemaining: 0,
  headline: 'Policy provenance review packet',
  summary: 'Reviewer can inspect the compiled policy provenance before consequence.',
  findingSummary: 'Human authority is complete.',
  checklistSummary: 'Verify the policy provenance and release token binding.',
  outputHash: 'sha256:output-review-ui',
  consequenceHash: 'sha256:consequence-review-ui',
  evidencePackId: 'ep_policy_provenance_ui',
  findings: [
    {
      code: 'policy_provenance_visible',
      result: 'info',
      message: 'Policy provenance is visible to reviewer-facing surfaces.',
      source: 'evidence',
    },
  ],
  candidate: {
    runId: 'run_policy_provenance_ui',
    adapterId: 'finance.filing',
    certificateId: 'cert_policy_provenance_ui',
    proofMode: 'live_runtime',
    evidenceChainTerminal: 'sha256:evidence-chain-review-ui',
    rowCount: 1,
    rowKeys: ['counterparty_name'],
    previewRows: [{ counterparty_name: 'Example Bank' }],
    financeDecision: 'approved',
    receiptStatus: 'withheld',
    oversightStatus: 'approved',
  },
  checklist: [
    {
      id: 'policy-provenance',
      label: 'Confirm the compiled policy provenance matches the release token.',
      emphasis: 'primary',
    },
  ],
  timeline: [
    {
      occurredAt: '2026-05-10T05:00:00.000Z',
      phase: 'policy-resolution',
      decisionStatus: 'review-required',
      requiresReview: true,
      deterministicChecksCompleted: false,
    },
  ],
  reviewerDecisions: [
    {
      id: 'rr_policy_provenance_ui',
      reviewerId: 'reviewer.alpha',
      reviewerName: 'Alpha Reviewer',
      reviewerRole: 'financial_reporting_manager',
      outcome: 'approved',
      decidedAt: '2026-05-10T05:09:00.000Z',
      note: 'Policy provenance checked.',
    },
  ],
  issuedReleaseToken: {
    tokenId: 'rt_policy_provenance_ui',
    expiresAt: '2026-05-10T06:10:00.000Z',
    audience: 'finance.filing.prepare',
    policyVersion: 'policy.release-review-ui.token.v1',
    policyHash: 'sha256:policy-review-ui-token',
    policyIrHash: 'sha256:policy-ir-review-ui-token',
    policyProvenanceSource: 'compiled-admission-policy-index',
    compiledPolicyIndexVersion: 'attestor.compiled-admission-policy-index.v1',
    compiledPolicyIrVersion: 'attestor.compiled-admission-policy-ir.v1',
  },
  overrideGrant: null,
} satisfies ReleaseReviewerQueueDetail;

function testInboxRendersPolicyProvenanceSummary(): void {
  const html = renderReleaseReviewerQueueInboxPage({
    generatedAt: '2026-05-10T05:11:00.000Z',
    totalPending: 1,
    countsByRiskClass: {
      R0: 0,
      R1: 0,
      R2: 0,
      R3: 0,
      R4: 1,
    },
    items: [detail],
  });

  includes(html, 'Policy hash', 'Release review site: inbox labels policy hash');
  includes(html, 'sha256:policy-review-ui', 'Release review site: inbox exposes policy hash');
  includes(
    html,
    'attestor.compiled-admission-policy-index.v1',
    'Release review site: inbox exposes compiled policy index version',
  );
}

function testDetailRendersPolicyProvenanceAndTokenBinding(): void {
  const html = renderReleaseReviewerQueueDetailPage(detail);

  includes(html, 'Policy provenance', 'Release review site: detail has policy provenance panel');
  includes(html, 'policy.release-review-ui.v1', 'Release review site: detail exposes policy version');
  includes(html, 'sha256:policy-ir-review-ui', 'Release review site: detail exposes policy IR hash');
  includes(
    html,
    'compiled-admission-policy-index',
    'Release review site: detail exposes policy provenance source',
  );
  includes(
    html,
    'policy.release-review-ui.token.v1',
    'Release review site: issued token panel exposes token policy version',
  );
  includes(
    html,
    'sha256:policy-review-ui-token',
    'Release review site: issued token panel exposes token policy hash',
  );
}

testInboxRendersPolicyProvenanceSummary();
testDetailRendersPolicyProvenanceAndTokenBinding();

console.log(`Release review site tests: ${passed} passed, 0 failed`);
