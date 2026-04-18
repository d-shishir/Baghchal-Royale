import type { MaybeShowInterstitialResult, ShowRewardedInterstitialResult } from './adsTypes';

let loggedNoopHint = false;

function logNoopOnce(): void {
  if (!__DEV__ || loggedNoopHint) return;
  loggedNoopHint = true;
  console.warn(
    '[ads] Google Mobile Ads is not available in this runtime (e.g. Expo Go, web, or a dev build without the native module). Ad calls are no-ops.',
  );
}

export async function initializeAds(): Promise<void> {
  logNoopOnce();
}

export function preloadRewardedInterstitial(): Promise<void> {
  return Promise.resolve();
}

export function isRewardedInterstitialReady(): boolean {
  return false;
}

export function showRewardedInterstitial(): Promise<ShowRewardedInterstitialResult> {
  return Promise.resolve({ shown: false, rewarded: false });
}

export function preloadInterstitial(): Promise<void> {
  return Promise.resolve();
}

export function isInterstitialReady(): boolean {
  return false;
}

export async function getInterstitialCooldownRemainingMs(): Promise<number> {
  return 0;
}

export async function maybeShowInterstitial(): Promise<MaybeShowInterstitialResult> {
  return { shown: false, reason: 'not_ready' };
}
