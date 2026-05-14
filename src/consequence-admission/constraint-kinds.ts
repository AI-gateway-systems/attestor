export const CONSEQUENCE_ADMISSION_CONSTRAINT_KINDS = [
  'max-amount',
  'recipient-allowlist',
  'record-scope',
  'time-window',
  'tool-allowlist',
  'policy-ref',
  'release-token',
  'customer-approved-scope',
  'custom',
] as const;

export type ConsequenceAdmissionConstraintKind =
  typeof CONSEQUENCE_ADMISSION_CONSTRAINT_KINDS[number];

export const CONSEQUENCE_ADMISSION_CONSTRAINT_PARAMETER_DIGEST_PATTERN =
  /^sha256:[a-f0-9]{64}$/u;

export function isConsequenceAdmissionConstraintKind(
  value: string,
): value is ConsequenceAdmissionConstraintKind {
  return (CONSEQUENCE_ADMISSION_CONSTRAINT_KINDS as readonly string[]).includes(value);
}
