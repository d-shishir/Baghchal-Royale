/**
 * Public ad result types (no dependency on react-native-google-mobile-ads).
 * Matches RewardedAdReward shape from the SDK for the reward payload.
 */
export interface ShowRewardedInterstitialResult {
  shown: boolean;
  rewarded: boolean;
  reward?: {
    type: string;
    amount: number;
  };
}

export interface MaybeShowInterstitialResult {
  shown: boolean;
  reason?: 'cooldown' | 'not_ready' | 'error';
  cooldownRemainingMs?: number;
}
