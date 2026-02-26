export const FEATURE_FLAGS = {
  ENABLE_SQUADS: true,
  ENABLE_ACTIVITY_FEED: true,
  ENABLE_LEADERBOARD: false,
  ENABLE_BUSINESS_BOUNTIES: false,
  ENABLE_HEATMAP: true, // New flag for Civic Heatmap layer
};

export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  return !!FEATURE_FLAGS[flag];
}
