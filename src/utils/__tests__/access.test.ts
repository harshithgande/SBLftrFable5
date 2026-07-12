import { canUse, isPremiumFeature } from '../access';

describe('premium feature access', () => {
  it('locks premium features for free users', () => {
    expect(canUse('ai-assessment', false)).toBe(false);
    expect(canUse('ai-photo-comparison', false)).toBe(false);
    expect(canUse('personalized-split', false)).toBe(false);
    expect(canUse('custom-split-builder', false)).toBe(false);
  });

  it('keeps core tracking usable on the free plan', () => {
    expect(canUse('core-tracking', false)).toBe(true);
    expect(canUse('weight-logging', false)).toBe(true);
    expect(canUse('basic-charts', false)).toBe(true);
    expect(canUse('history', false)).toBe(true);
    expect(canUse('daily-goals', false)).toBe(true);
  });

  it('unlocks everything for premium users', () => {
    expect(canUse('ai-assessment', true)).toBe(true);
    expect(canUse('custom-split-builder', true)).toBe(true);
  });

  it('classifies features consistently', () => {
    expect(isPremiumFeature('ai-assessment')).toBe(true);
    expect(isPremiumFeature('core-tracking')).toBe(false);
  });
});
