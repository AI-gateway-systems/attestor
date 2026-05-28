import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';

let passed = 0;

function readProjectFile(...segments: string[]): string {
  return readFileSync(join(process.cwd(), ...segments), 'utf8');
}

function includes(content: string, expected: string, message: string): void {
  assert.ok(
    content.includes(expected),
    `${message}\nExpected to find: ${expected}`,
  );
  passed += 1;
}

function testAuditReadmeKeepsNavigatorSections(): void {
  const doc = readProjectFile('docs', 'audit', 'README.md');

  for (const expected of [
    '## Pick One Door',
    'Do not start by opening every report in this directory.',
    '## Active Current-State Files',
    '## Historical Evidence Families',
    '## Fast Search',
    '## Move Rule',
    'Until then, prefer navigation over churn.',
  ]) {
    includes(doc, expected, `Audit evidence navigator: keeps ${expected}`);
  }
}

function testAuditReadmeSeparatesCurrentAndHistoricalTruth(): void {
  const doc = readProjectFile('docs', 'audit', 'README.md');

  for (const expected of [
    '| `current-posture-baseline.md` | Current calibrated posture baseline. |',
    '| `report-index.md` | Report and sweep state index. |',
    '| `finding-index.md` | Current high-signal finding registry. |',
    '| `live-proof-register.md` | Live/customer/operator proof register. |',
    '| `ops-sweep-*.md` |',
    '| `f*.md` |',
    '| `v0.2.0-*.md` |',
    '| `AUD-*.md` |',
    '| `REM-*.md` |',
    'Historical reports are evidence leaves. They are not current truth by',
    'If a historical note disagrees with the active indexes, the active indexes win',
  ]) {
    includes(doc, expected, `Audit evidence navigator: separates current/historical evidence with ${expected}`);
  }
}

function testAuditReadmeKeepsNoClaimBoundaries(): void {
  const doc = readProjectFile('docs', 'audit', 'README.md');

  for (const expected of [
    'not a certification package',
    'not proof of live production',
    'Repository evidence can close repository findings. It cannot prove:',
    'customer PEP non-bypassability',
    'KMS/HSM runtime authority',
    'production traffic behavior',
  ]) {
    includes(doc, expected, `Audit evidence navigator: keeps no-claim ${expected}`);
  }
}

function testAuditReadmeLinksResolve(): void {
  const docPath = join(process.cwd(), 'docs', 'audit', 'README.md');
  const doc = readFileSync(docPath, 'utf8');
  const docDir = dirname(docPath);
  const missing: string[] = [];

  for (const match of doc.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const href = match[1];
    if (/^https?:\/\//iu.test(href) || href.startsWith('#')) continue;
    const pathOnly = href.split('#')[0];
    const resolved = normalize(join(docDir, pathOnly));
    if (!existsSync(resolved)) missing.push(href);
  }

  assert.deepEqual(missing, [], 'Audit evidence navigator: all relative links resolve');
  passed += 1;
}

function testPackageScriptExposesNavigatorGuard(): void {
  const packageJson = JSON.parse(readProjectFile('package.json')) as {
    readonly scripts: Readonly<Record<string, string>>;
  };

  assert.equal(
    packageJson.scripts['test:audit-evidence-navigator'],
    'tsx tests/audit-evidence-navigator.test.ts',
    'Package scripts: audit evidence navigator docs guard is exposed',
  );
  passed += 1;
}

testAuditReadmeKeepsNavigatorSections();
testAuditReadmeSeparatesCurrentAndHistoricalTruth();
testAuditReadmeKeepsNoClaimBoundaries();
testAuditReadmeLinksResolve();
testPackageScriptExposesNavigatorGuard();

console.log(`Audit evidence navigator tests: ${passed} passed, 0 failed`);
