import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let passed = 0;

function ok(condition: unknown, message: string): void {
  assert.ok(condition, message);
  passed += 1;
}

function includes(value: string, expected: string, message: string): void {
  assert.ok(value.includes(expected), `${message}\nExpected to include: ${expected}`);
  passed += 1;
}

function excludes(value: string, unexpected: RegExp, message: string): void {
  assert.doesNotMatch(value, unexpected, message);
  passed += 1;
}

function readProjectFile(...segments: string[]): string {
  return readFileSync(join(process.cwd(), ...segments), 'utf8');
}

try {
  const docs = readProjectFile('docs', '01-overview', 'finance-and-crypto-first-integrations.md');
  const validation = readProjectFile(
    'docs',
    'audit',
    'f5-crypto-trust-delegation-boundary-validation.md',
  );
  const tracker = readProjectFile('docs', 'audit', 'attestor-audit-remediation-tracker.md');
  const eip712 = readProjectFile(
    'src',
    'crypto-authorization-core',
    'eip712-authorization-envelope.ts',
  );
  const replayFreshness = readProjectFile(
    'src',
    'crypto-authorization-core',
    'replay-freshness-rules.ts',
  );
  const packageJson = readProjectFile('package.json');

  includes(
    eip712,
    'does not perform wallet signing, secp256k1 recovery, or ERC-1271 validation',
    'F5-B1: EIP-712 envelope source states wallet/signature validation boundary',
  );
  includes(
    replayFreshness,
    'It does not read chain state or wallet registries',
    'F5-B1: replay/freshness source states chain-state boundary',
  );
  includes(
    replayFreshness,
    'adapters provide observations',
    'F5-B1: replay/freshness source names adapter observations',
  );

  includes(docs, '### Crypto Trust Delegation Boundary', 'F5-B1 docs: trust boundary section exists');
  includes(
    docs,
    'It does not independently recover secp256k1 signatures, call',
    'F5-B1 docs: signature and ERC-1271 boundary is explicit',
  );
  includes(
    docs,
    'read ERC-4337 EntryPoint nonce state',
    'F5-B1 docs: ERC-4337 nonce boundary is explicit',
  );
  includes(docs, 'EIP-7702 authorization tuples on chain', 'F5-B1 docs: EIP-7702 boundary is explicit');
  includes(
    docs,
    'prove x402 settlement unless a trusted integration',
    'F5-B1 docs: x402 settlement boundary is explicit',
  );
  includes(
    docs,
    'verifiable adapter evidence',
    'F5-B1 docs: adapter evidence requirement is explicit',
  );
  includes(
    docs,
    'not proof that the downstream crypto action',
    'F5-B1 docs: overclaim boundary is explicit',
  );

  includes(validation, 'Status: `accepted-limitation`', 'F5-B1 validation: accepted limitation status is explicit');
  includes(validation, 'EIP-712', 'F5-B1 validation: EIP-712 research anchor is present');
  includes(validation, 'ERC-1271', 'F5-B1 validation: ERC-1271 research anchor is present');
  includes(validation, 'ERC-4337', 'F5-B1 validation: ERC-4337 research anchor is present');
  includes(validation, 'EIP-7702', 'F5-B1 validation: EIP-7702 research anchor is present');
  includes(validation, 'Safe', 'F5-B1 validation: Safe incident research anchor is present');
  includes(validation, 'not production readiness', 'F5-B1 validation: no production overclaim is explicit');

  includes(
    tracker,
    'F5-B1 crypto-authorization adapter trust delegation | `accepted-limitation`',
    'F5-B1 tracker: row is accepted limitation',
  );
  includes(
    tracker,
    'F5 Crypto Trust Delegation Boundary Validation',
    'F5-B1 tracker: validation evidence is linked',
  );
  includes(
    packageJson,
    '"test:f5-crypto-trust-delegation-boundary-validation"',
    'F5-B1 package: validation script is exposed',
  );

  excludes(
    docs,
    /Attestor\s+(independently\s+)?(verifies|proves)\s+(all\s+)?(on-chain|chain-state|settlement|wallet-signature)/iu,
    'F5-B1 docs: no independent crypto truth overclaim remains',
  );

  ok(docs.split('\n').length > 140, 'F5-B1 docs: crypto integration section remains substantive');
  console.log(`F5 crypto trust delegation boundary validation tests: ${passed} passed, 0 failed`);
} catch (error) {
  console.error('F5 crypto trust delegation boundary validation tests failed:', error);
  process.exitCode = 1;
}
