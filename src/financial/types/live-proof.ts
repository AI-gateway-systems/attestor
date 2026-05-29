import type { LlmProviderProofContextBinding } from '../../api/llm-provider-registry.js';

export type ProofMode = 'offline_fixture' | 'mocked_model' | 'live_model' | 'live_runtime' | 'hybrid';

export interface ProofGap {
  category: string;
  description: string;
}

export interface LiveProofUpstreamEvidence {
  provider: string | null;
  model: string | null;
  tokenUsage: { input: number; output: number } | null;
  latencyMs: number | null;
  requestId: string | null;
  providerProofContext: LlmProviderProofContextBinding | null;
  live: boolean;
}

export interface LiveProofExecutionEvidence {
  provider: string | null;
  mode: 'fixture' | 'sandbox' | 'live_db';
  latencyMs: number | null;
  live: boolean;
}

export interface LiveProofInput {
  collectedAt?: string;
  upstream?: Partial<LiveProofUpstreamEvidence>;
  execution?: Partial<LiveProofExecutionEvidence>;
  gaps?: ProofGap[];
}

export interface LiveProof {
  /** Explicit proof mode — what kind of runtime evidence exists. */
  mode: ProofMode;
  /** When proof was collected. */
  collectedAt: string;
  runId: string;
  replayIdentity: string;

  /** Upstream model evidence. */
  upstream: LiveProofUpstreamEvidence;

  /** Execution/database evidence. */
  execution: LiveProofExecutionEvidence;

  /** What is NOT proven in this run. */
  gaps: ProofGap[];

  /** Verification: does the proof-mode match the collected evidence? */
  consistent: boolean;
}

// Backward-compatible alias for manifest
export type LiveProofMetadata = LiveProof;

function deriveProofMode(upstream: LiveProofUpstreamEvidence, execution: LiveProofExecutionEvidence): ProofMode {
  if (upstream.live && execution.live) return 'hybrid';
  if (upstream.live) return 'live_model';
  if (execution.live) return 'live_runtime';
  return execution.mode === 'sandbox' ? 'mocked_model' : 'offline_fixture';
}

function deriveProofGaps(upstream: LiveProofUpstreamEvidence, execution: LiveProofExecutionEvidence): ProofGap[] {
  const gaps: ProofGap[] = [];

  if (!upstream.live) {
    gaps.push({
      category: 'model',
      description: execution.mode === 'sandbox'
        ? 'No live upstream model invocation — model path is mocked or simulated'
        : 'No live upstream model invocation — all model calls are mocked',
    });
  }

  if (!execution.live) {
    gaps.push({
      category: 'execution',
      description: execution.mode === 'sandbox'
        ? 'No live database execution — sandbox path only'
        : 'No live database execution — fixture-based sandbox only',
    });
  }

  if (!upstream.tokenUsage) {
    gaps.push({ category: 'cost', description: 'No real token/cost data observed for this run' });
  }

  return gaps;
}

function isLiveProofConsistent(proof: LiveProof): boolean {
  if (!proof.runId || !proof.replayIdentity || Number.isNaN(Date.parse(proof.collectedAt))) return false;

  if (proof.mode !== deriveProofMode(proof.upstream, proof.execution)) return false;

  if (proof.upstream.live && (!proof.upstream.provider || !proof.upstream.model)) return false;
  if (!proof.upstream.live && proof.upstream.requestId) return false;

  if (proof.execution.live) {
    if (proof.execution.mode !== 'live_db') return false;
    if (!proof.execution.provider) return false;
  } else if (proof.execution.mode === 'live_db') {
    return false;
  }

  if (proof.mode === 'hybrid') return proof.upstream.live && proof.execution.live;
  if (proof.mode === 'live_model') return proof.upstream.live && !proof.execution.live;
  if (proof.mode === 'live_runtime') return !proof.upstream.live && proof.execution.live;
  if (proof.mode === 'mocked_model') return !proof.upstream.live && !proof.execution.live && proof.execution.mode === 'sandbox';
  return !proof.upstream.live && !proof.execution.live && proof.execution.mode === 'fixture';
}

export function buildLiveProof(runId: string, replayIdentity: string, input: LiveProofInput = {}): LiveProof {
  const upstream: LiveProofUpstreamEvidence = {
    provider: null,
    model: null,
    tokenUsage: null,
    latencyMs: null,
    requestId: null,
    providerProofContext: null,
    live: false,
    ...input.upstream,
  };

  const execution: LiveProofExecutionEvidence = {
    provider: null,
    mode: 'fixture',
    latencyMs: null,
    live: false,
    ...input.execution,
  };

  const proof: LiveProof = {
    mode: deriveProofMode(upstream, execution),
    collectedAt: input.collectedAt ?? new Date().toISOString(),
    runId,
    replayIdentity,
    upstream,
    execution,
    gaps: input.gaps ?? deriveProofGaps(upstream, execution),
    consistent: true,
  };

  return { ...proof, consistent: isLiveProofConsistent(proof) };
}

export function buildOfflineProof(runId: string, replayIdentity: string): LiveProof {
  return buildLiveProof(runId, replayIdentity);
}

/**
 * Verify that a LiveProof is internally consistent.
 * offline_fixture: upstream.live and execution.live must be false
 * live_model: upstream.live must be true
 * live_runtime: execution.live must be true
 */
export function verifyLiveProof(proof: LiveProof): boolean {
  return proof.consistent === isLiveProofConsistent(proof) && proof.consistent;
}

// ─── Live Proof v1.1 — Readiness Assessment ────────────────────────────────

/**
 * Live Readiness Assessment v1.1
 *
 * Truthfully evaluates what live-proof capabilities are available
 * in the current runtime environment. Does NOT fake any live evidence.
 *
 * A reviewer should be able to answer from this artifact:
 * - what was truly live?
 * - what remained offline?
 * - what proof gaps remain?
 * - what external dependencies are still missing?
 * - whether this was a real live exercise or only a readiness result
 */
export interface LiveReadinessResult {
  /** Version of the readiness assessment. */
  version: '1.1';
  /** When the readiness assessment was performed. */
  assessedAt: string;
  /** Whether this is a real live exercise result or only a readiness check. */
  exerciseType: 'readiness_only' | 'live_exercise';
  /** Upstream model credential availability. */
  upstream: {
    openaiAvailable: boolean;
    anthropicAvailable: boolean;
    anyModelAvailable: boolean;
    detail: string;
  };
  /** Execution/database credential availability. */
  execution: {
    liveDbAvailable: boolean;
    sandboxAvailable: boolean;
    detail: string;
  };
  /** What could be exercised right now. */
  availableModes: ProofMode[];
  /** What is blocked and why. */
  blockedModes: Array<{ mode: ProofMode; reason: string }>;
  /** Explicit next steps for a reviewer or operator. */
  nextSteps: string[];
  /** Whether authority semantics would change if live proof were available. */
  authorityImpact: string;
}

export interface LiveReadinessOptions {
  exerciseType?: 'readiness_only' | 'live_exercise';
  liveDbAvailable?: boolean;
  sandboxAvailable?: boolean;
}

/**
 * Assess live-proof readiness by checking environment for credentials.
 * Does NOT call any external APIs — only checks presence of env vars.
 */
export function assessLiveReadiness(options: LiveReadinessOptions = {}): LiveReadinessResult {
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  const openaiAvailable = !!openaiKey && !openaiKey.includes('your-') && openaiKey.length > 10;
  const anthropicAvailable = !!anthropicKey && !anthropicKey.includes('your-') && anthropicKey.length > 10;
  const anyModelAvailable = openaiAvailable || anthropicAvailable;

  const liveDbAvailable = options.liveDbAvailable ?? false;
  const sandboxAvailable = options.sandboxAvailable ?? false;

  const availableModes: ProofMode[] = ['offline_fixture'];
  const blockedModes: Array<{ mode: ProofMode; reason: string }> = [];

  if (anyModelAvailable) {
    availableModes.push('live_model');
    if (sandboxAvailable) availableModes.push('mocked_model');
    if (liveDbAvailable) availableModes.push('hybrid');
  } else {
    blockedModes.push({ mode: 'live_model', reason: 'No model API credentials found in environment (OPENAI_API_KEY, ANTHROPIC_API_KEY)' });
    blockedModes.push({ mode: 'hybrid', reason: 'Requires both model credentials and live DB — neither available' });
  }

  if (liveDbAvailable) {
    availableModes.push('live_runtime');
  } else {
    blockedModes.push({ mode: 'live_runtime', reason: 'No live database connection configured' });
  }

  if (!anyModelAvailable && !sandboxAvailable) {
    blockedModes.push({ mode: 'mocked_model', reason: 'No sandbox execution environment configured' });
  }

  const nextSteps: string[] = [];
  if (!anyModelAvailable) nextSteps.push('Add OPENAI_API_KEY or ANTHROPIC_API_KEY to .env to enable live_model proof');
  if (!liveDbAvailable) nextSteps.push('Configure a live database connection to enable live_runtime proof');
  if (anyModelAvailable && !liveDbAvailable) nextSteps.push('Model credentials available — run a bounded live_model exercise as the next highest-value step');
  if (!anyModelAvailable && !liveDbAvailable) nextSteps.push('Current environment supports offline_fixture only — all committed runs remain truthfully offline');

  const upstreamDetail = anyModelAvailable
    ? `Available: ${[openaiAvailable ? 'OpenAI' : null, anthropicAvailable ? 'Anthropic' : null].filter(Boolean).join(', ')}`
    : 'No model API credentials found';

  return {
    version: '1.1',
    assessedAt: new Date().toISOString(),
    exerciseType: options.exerciseType ?? 'readiness_only',
    upstream: {
      openaiAvailable,
      anthropicAvailable,
      anyModelAvailable,
      detail: upstreamDetail,
    },
    execution: {
      liveDbAvailable,
      sandboxAvailable,
      detail: liveDbAvailable ? 'Live DB available' : 'No live database — fixture execution only',
    },
    availableModes,
    blockedModes,
    nextSteps,
    authorityImpact: 'Missing live proof does not deny authority. Authority chain (warrant → escrow → receipt → capsule) operates independently of proof mode. Live proof is a truthfulness artifact, not an authority gate.',
  };
}

/**
 * Build a reviewer-facing live proof summary string.
 * Answers: what was truly live, what remained offline, what gaps remain.
 */
export function buildLiveProofReviewerSummary(proof: LiveProof, readiness?: LiveReadinessResult): string {
  const lines: string[] = [];
  lines.push(`Proof mode: ${proof.mode}`);
  lines.push(`Upstream live: ${proof.upstream.live}${proof.upstream.provider ? ` (${proof.upstream.provider}/${proof.upstream.model})` : ''}`);
  lines.push(`Execution live: ${proof.execution.live}${proof.execution.provider ? ` (${proof.execution.provider})` : ''}`);
  lines.push(`Consistent: ${proof.consistent}`);

  if (proof.gaps.length > 0) {
    lines.push(`Gaps (${proof.gaps.length}):`);
    for (const gap of proof.gaps) {
      lines.push(`  - [${gap.category}] ${gap.description}`);
    }
  } else {
    lines.push('Gaps: none');
  }

  if (readiness) {
    lines.push('');
    lines.push(`Readiness: ${readiness.exerciseType}`);
    lines.push(`Available modes: ${readiness.availableModes.join(', ')}`);
    if (readiness.blockedModes.length > 0) {
      lines.push(`Blocked modes:`);
      for (const b of readiness.blockedModes) {
        lines.push(`  - ${b.mode}: ${b.reason}`);
      }
    }
    if (readiness.nextSteps.length > 0) {
      lines.push(`Next steps:`);
      for (const s of readiness.nextSteps) {
        lines.push(`  - ${s}`);
      }
    }
  }

  return lines.join('\n');
}


// ─── Financial Scoring ───────────────────────────────────────────────────────
