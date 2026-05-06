import { strict as assert } from 'node:assert';
import {
  hostedOidcAllowsAutomaticLinking,
  type HostedOidcCallbackIdentity,
} from '../src/service/account-oidc.js';

let passed = 0;

function ok(condition: unknown, message: string): void {
  assert.ok(condition, message);
  passed += 1;
}

function identity(
  input: Partial<HostedOidcCallbackIdentity> = {},
): HostedOidcCallbackIdentity {
  return {
    issuer: 'https://idp.example',
    subject: 'sub_123',
    email: 'owner@example.com',
    emailVerified: true,
    name: 'Owner',
    claims: {},
    ...input,
  };
}

function main(): void {
  const previous = process.env.ATTESTOR_HOSTED_OIDC_ALLOW_UNVERIFIED_EMAIL_LINK;

  try {
    delete process.env.ATTESTOR_HOSTED_OIDC_ALLOW_UNVERIFIED_EMAIL_LINK;

    ok(
      hostedOidcAllowsAutomaticLinking(identity({ emailVerified: true })) === true,
      'OIDC linking policy: verified email may use automatic first-link fallback',
    );
    ok(
      hostedOidcAllowsAutomaticLinking(identity({ emailVerified: false })) === false,
      'OIDC linking policy: explicitly unverified email fails closed',
    );
    ok(
      hostedOidcAllowsAutomaticLinking(identity({ emailVerified: null })) === false,
      'OIDC linking policy: missing email_verified fails closed',
    );
    ok(
      hostedOidcAllowsAutomaticLinking(identity({ email: null, emailVerified: true })) === false,
      'OIDC linking policy: missing email cannot use automatic fallback',
    );

    process.env.ATTESTOR_HOSTED_OIDC_ALLOW_UNVERIFIED_EMAIL_LINK = 'true';
    ok(
      hostedOidcAllowsAutomaticLinking(identity({ emailVerified: null })) === false,
      'OIDC linking policy: generic true is not enough for unverified email override',
    );

    process.env.ATTESTOR_HOSTED_OIDC_ALLOW_UNVERIFIED_EMAIL_LINK = 'accept-the-risk';
    ok(
      hostedOidcAllowsAutomaticLinking(identity({ emailVerified: null })) === true,
      'OIDC linking policy: explicit risk-acceptance override allows missing email_verified',
    );

    console.log(`Account OIDC linking policy tests: ${passed} passed, 0 failed`);
  } finally {
    if (previous === undefined) delete process.env.ATTESTOR_HOSTED_OIDC_ALLOW_UNVERIFIED_EMAIL_LINK;
    else process.env.ATTESTOR_HOSTED_OIDC_ALLOW_UNVERIFIED_EMAIL_LINK = previous;
  }
}

main();
