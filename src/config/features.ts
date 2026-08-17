/**
 * Build-time feature flags.
 * Production = the deployed build (`import.meta.env.PROD`).
 */

const isProd = import.meta.env.PROD;

export const FEATURES = {
  /** Legacy GILM course / certificate / invoice platform. Isolated from Stain Master. */
  legacyCourses: !isProd,
  /** "Acting as" role simulation inside the admin workspace. Never on in production. */
  roleSimulation: !isProd,
  /** Demo sign-in shortcut. Never on in production. */
  demoAuth: !isProd,
} as const;

export const IS_PRODUCTION_BUILD = isProd;

export type FeatureKey = keyof typeof FEATURES;

export function isEnabled(key: FeatureKey): boolean {
  return FEATURES[key];
}
