/**
 * Centralized feature-access rules. Screens must gate premium functionality
 * through this module (usually via the <PremiumGate> component) so free vs
 * premium behavior stays consistent everywhere.
 */
export type FeatureKey =
  | 'ai-assessment'
  | 'ai-photo-comparison'
  | 'personalized-split'
  | 'custom-split-builder'
  | 'core-tracking'
  | 'weight-logging'
  | 'basic-charts'
  | 'history'
  | 'daily-goals';

const PREMIUM_FEATURES: ReadonlySet<FeatureKey> = new Set<FeatureKey>([
  'ai-assessment',
  'ai-photo-comparison',
  'personalized-split',
  'custom-split-builder',
]);

export function isPremiumFeature(feature: FeatureKey): boolean {
  return PREMIUM_FEATURES.has(feature);
}

export function canUse(feature: FeatureKey, premium: boolean): boolean {
  return premium || !isPremiumFeature(feature);
}

/** User-facing names for upgrade prompts. */
export const FEATURE_NAMES: Record<FeatureKey, string> = {
  'ai-assessment': 'Personal AI assessment',
  'ai-photo-comparison': 'AI progress comparison',
  'personalized-split': 'Personalized training split',
  'custom-split-builder': 'Custom split builder',
  'core-tracking': 'Workout tracking',
  'weight-logging': 'Weight logging',
  'basic-charts': 'Progress charts',
  history: 'Workout history',
  'daily-goals': 'Daily goals',
};
