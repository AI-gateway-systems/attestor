import { pathToFileURL } from 'node:url';
import {
  createGoldenRefundDemoSummary,
  renderGoldenRefundDemoJson,
  renderGoldenRefundDemoMarkdown,
} from '../src/consequence-admission/index.js';
import { safeErrorMessage } from './secret-safe-output.ts';

function printUsage(): void {
  console.log(`Usage:
  npm run demo:golden-refund
  npm run demo:golden-refund -- --json

Default output is Markdown for copy/paste, screenshots, and demos.
Use --json for secondary machine-readable output.

This command is fixture-only and shadow-only. It does not call Stripe, Shopify,
Google Cloud, a worker, an audit database, or any target system. It does not
activate policies, train models, admit actions, or prove production readiness.`);
}

function main(): void {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printUsage();
    return;
  }
  const summary = createGoldenRefundDemoSummary();
  if (process.argv.includes('--json')) {
    console.log(renderGoldenRefundDemoJson(summary).trimEnd());
    return;
  }
  console.log(renderGoldenRefundDemoMarkdown(summary).trimEnd());
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(safeErrorMessage(error));
    process.exit(1);
  }
}
