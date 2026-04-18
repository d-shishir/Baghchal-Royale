import { Platform, TurboModuleRegistry } from 'react-native';

import * as adsStubs from './adsStubs';

const RNGoogleMobileAds = 'RNGoogleMobileAdsModule';

/**
 * `react-native-google-mobile-ads` calls `TurboModuleRegistry.getEnforcing` at
 * import time. Expo Go and some runtimes do not ship the native module — loading
 * the package would crash. Only require the real implementation when the module
 * is registered (e.g. `expo run:ios` / `expo run:android` after prebuild).
 */
function isGoogleMobileAdsNativeLinked(): boolean {
  if (Platform.OS === 'web') return false;
  return TurboModuleRegistry.get(RNGoogleMobileAds) != null;
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const impl = isGoogleMobileAdsNativeLinked() ? require('./adsNativeImpl') : adsStubs;

export type { ShowRewardedInterstitialResult, MaybeShowInterstitialResult } from './adsTypes';

export const initializeAds = impl.initializeAds as typeof adsStubs.initializeAds;
export const preloadRewardedInterstitial = impl.preloadRewardedInterstitial as typeof adsStubs.preloadRewardedInterstitial;
export const isRewardedInterstitialReady = impl.isRewardedInterstitialReady as typeof adsStubs.isRewardedInterstitialReady;
export const showRewardedInterstitial = impl.showRewardedInterstitial as typeof adsStubs.showRewardedInterstitial;
export const preloadInterstitial = impl.preloadInterstitial as typeof adsStubs.preloadInterstitial;
export const isInterstitialReady = impl.isInterstitialReady as typeof adsStubs.isInterstitialReady;
export const getInterstitialCooldownRemainingMs =
  impl.getInterstitialCooldownRemainingMs as typeof adsStubs.getInterstitialCooldownRemainingMs;
export const maybeShowInterstitial = impl.maybeShowInterstitial as typeof adsStubs.maybeShowInterstitial;
