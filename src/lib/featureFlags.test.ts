import { describe, it, expect } from 'vitest';
import { isFeatureEnabled } from './featureFlags';

describe('Feature Flags Tests', () => {
  it('should return true for ENABLE_ACTIVITY_FEED by default', () => {
    expect(isFeatureEnabled('ENABLE_ACTIVITY_FEED')).toBe(true);
  });

  it('should return true for ENABLE_HEATMAP by default', () => {
    expect(isFeatureEnabled('ENABLE_HEATMAP')).toBe(true);
  });

  it('should return false for ENABLE_BUSINESS_BOUNTIES by default', () => {
    expect(isFeatureEnabled('ENABLE_BUSINESS_BOUNTIES')).toBe(false);
  });

  it('should handle undefined flags gracefully', () => {
    // @ts-expect-error - testing invalid flag
    expect(isFeatureEnabled('INVALID_FLAG')).toBe(false);
  });
});
