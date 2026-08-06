export const closedFeatureFlags = [
  "REAL_DOCUMENTS",
  "EXTERNAL_OCR_AI",
  "EXTERNAL_COMMUNICATIONS",
  "REAL_PAYMENTS",
  "REAL_HUMAN_REVIEW",
  "REAL_PERSONAL_DATA",
  "PRD_2026",
] as const;

export type ClosedFeatureFlag = (typeof closedFeatureFlags)[number];

export type FeatureFlagSnapshot = Record<ClosedFeatureFlag, boolean>;

const productionDenied = new Set<ClosedFeatureFlag>(closedFeatureFlags);

function envName(flag: ClosedFeatureFlag) {
  return `FEATURE_${flag}_ENABLED`;
}

export function readClosedFeatureFlags(env: NodeJS.ProcessEnv = process.env): FeatureFlagSnapshot {
  return Object.fromEntries(
    closedFeatureFlags.map((flag) => [flag, env[envName(flag)]?.toLowerCase() === "true"]),
  ) as FeatureFlagSnapshot;
}

export function assertFeatureClosed(flag: ClosedFeatureFlag, env: NodeJS.ProcessEnv = process.env) {
  const enabled = readClosedFeatureFlags(env)[flag];
  if (!enabled) return;

  if (productionDenied.has(flag)) {
    throw new Error(`La puerta ${flag} permanece cerrada hasta activacion formal documentada.`);
  }
}

export function assertAllRestrictedFeaturesClosed(env: NodeJS.ProcessEnv = process.env) {
  for (const flag of closedFeatureFlags) assertFeatureClosed(flag, env);
}
