function canonicalizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalizeValue);
  }

  if (value && typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};

    for (const key of Object.keys(source).sort()) {
      const child = source[key];
      if (child !== undefined) {
        sorted[key] = canonicalizeValue(child);
      }
    }

    return sorted;
  }

  return value;
}

export function canonicalizeForSignature(value: unknown): string {
  return JSON.stringify(canonicalizeValue(value));
}
