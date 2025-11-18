function resolveRawFlags(): string {
  return process.env.NEXT_PUBLIC_FEATURE_FLAGS ?? process.env.FEATURE_FLAGS ?? "";
}

export function getFeatureFlags(source?: string): string[] {
  const raw = source ?? resolveRawFlags();
  return raw
    .split(",")
    .map((flag) => flag.trim())
    .filter(Boolean);
}

export function isFeatureEnabled(feature: string, flags: string[] = getFeatureFlags()): boolean {
  return flags.includes(feature.trim());
}
