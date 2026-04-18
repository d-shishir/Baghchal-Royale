import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import mobileAds, {
  AdEventType,
  InterstitialAd,
  RewardedAdEventType,
  RewardedInterstitialAd,
  TestIds,
  MaxAdContentRating,
  type RewardedAdReward,
} from 'react-native-google-mobile-ads';

import type { MaybeShowInterstitialResult, ShowRewardedInterstitialResult } from './adsTypes';

// Production ad unit IDs (AdMob)
// NOTE: AdMob issues platform-specific unit IDs. If iOS gets its own later,
// swap in that ID here.
const REWARDED_INTERSTITIAL_UNIT_ID_ANDROID = 'ca-app-pub-4706890560108753/6790802492';
const REWARDED_INTERSTITIAL_UNIT_ID_IOS = 'ca-app-pub-4706890560108753/6790802492';

const INTERSTITIAL_UNIT_ID_ANDROID = 'ca-app-pub-4706890560108753/4368865317';
const INTERSTITIAL_UNIT_ID_IOS = 'ca-app-pub-4706890560108753/4368865317';

const getRewardedInterstitialUnitId = (): string => {
  if (__DEV__) return TestIds.REWARDED_INTERSTITIAL;
  return Platform.select({
    ios: REWARDED_INTERSTITIAL_UNIT_ID_IOS,
    android: REWARDED_INTERSTITIAL_UNIT_ID_ANDROID,
    default: REWARDED_INTERSTITIAL_UNIT_ID_ANDROID,
  });
};

const getInterstitialUnitId = (): string => {
  if (__DEV__) return TestIds.INTERSTITIAL;
  return Platform.select({
    ios: INTERSTITIAL_UNIT_ID_IOS,
    android: INTERSTITIAL_UNIT_ID_ANDROID,
    default: INTERSTITIAL_UNIT_ID_ANDROID,
  });
};

let sdkInitialized = false;

/**
 * Initialize Google Mobile Ads SDK. Safe to call multiple times.
 * Also applies some conservative request configuration.
 */
export async function initializeAds(): Promise<void> {
  if (sdkInitialized) return;
  try {
    await mobileAds().setRequestConfiguration({
      maxAdContentRating: MaxAdContentRating.T,
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
    });
    await mobileAds().initialize();
    sdkInitialized = true;
    console.log('[ads] Mobile Ads SDK initialized');
  } catch (err) {
    console.warn('[ads] Failed to initialize Mobile Ads SDK:', err);
  }
}

// ---- Rewarded Interstitial (shown at game end) ----------------------------

type AdState = 'idle' | 'loading' | 'loaded' | 'showing';

let currentAd: RewardedInterstitialAd | null = null;
let state: AdState = 'idle';
let loadPromise: Promise<void> | null = null;
let unsubscribers: Array<() => void> = [];

function cleanupListeners() {
  unsubscribers.forEach((u) => {
    try {
      u();
    } catch {}
  });
  unsubscribers = [];
}

function createAd(): RewardedInterstitialAd {
  return RewardedInterstitialAd.createForAdRequest(getRewardedInterstitialUnitId(), {
    requestNonPersonalizedAdsOnly: false,
  });
}

/**
 * Preload a rewarded interstitial ad. Idempotent and safe to call anytime.
 * Resolves once the ad has finished loading (success or failure).
 */
export function preloadRewardedInterstitial(): Promise<void> {
  if (state === 'loaded' || state === 'showing') return Promise.resolve();
  if (loadPromise) return loadPromise;

  cleanupListeners();
  currentAd = createAd();
  state = 'loading';

  loadPromise = new Promise<void>((resolve) => {
    const ad = currentAd!;

    const offLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      state = 'loaded';
      loadPromise = null;
      console.log('[ads] Rewarded interstitial loaded');
      resolve();
    });

    const offError = ad.addAdEventListener(AdEventType.ERROR, (error) => {
      console.warn('[ads] Rewarded interstitial failed to load:', error);
      state = 'idle';
      currentAd = null;
      loadPromise = null;
      cleanupListeners();
      resolve();
    });

    unsubscribers.push(offLoaded, offError);

    try {
      ad.load();
    } catch (err) {
      console.warn('[ads] ad.load() threw:', err);
      state = 'idle';
      currentAd = null;
      loadPromise = null;
      cleanupListeners();
      resolve();
    }
  });

  return loadPromise;
}

export function isRewardedInterstitialReady(): boolean {
  return state === 'loaded' && currentAd !== null;
}

/**
 * Show the rewarded interstitial if it is loaded. Returns a result describing
 * whether the ad played and whether the user earned the reward. Also kicks off
 * loading the next ad so it is ready for the next opportunity.
 */
export function showRewardedInterstitial(): Promise<ShowRewardedInterstitialResult> {
  return new Promise((resolve) => {
    if (!isRewardedInterstitialReady() || !currentAd) {
      // Not ready — try to preload for next time.
      preloadRewardedInterstitial();
      resolve({ shown: false, rewarded: false });
      return;
    }

    const ad = currentAd;
    let earnedReward: RewardedAdReward | undefined;
    let resolved = false;
    let closeFinalizeTimer: ReturnType<typeof setTimeout> | null = null;

    const clearCloseTimer = () => {
      if (closeFinalizeTimer) {
        clearTimeout(closeFinalizeTimer);
        closeFinalizeTimer = null;
      }
    };

    const finish = (result: ShowRewardedInterstitialResult) => {
      if (resolved) return;
      resolved = true;
      clearCloseTimer();

      cleanupListeners();
      currentAd = null;
      state = 'idle';
      // Preload the next one in the background.
      preloadRewardedInterstitial();

      resolve(result);
    };

    const offEarned = ad.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward) => {
        earnedReward = reward;
      },
    );
    // On some Android builds, EARNED_REWARD is delivered shortly after CLOSED.
    // Defer finalizing until the reward callback has had a chance to run.
    const offClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      clearCloseTimer();
      closeFinalizeTimer = setTimeout(() => {
        closeFinalizeTimer = null;
        finish({
          shown: true,
          rewarded: !!earnedReward,
          reward: earnedReward,
        });
      }, 280);
    });
    const offError = ad.addAdEventListener(AdEventType.ERROR, (error) => {
      console.warn('[ads] Rewarded interstitial show error:', error);
      clearCloseTimer();
      finish({ shown: false, rewarded: false });
    });

    unsubscribers.push(offEarned, offClosed, offError);

    state = 'showing';
    try {
      ad.show();
    } catch (err) {
      console.warn('[ads] ad.show() threw:', err);
      finish({ shown: false, rewarded: false });
    }
  });
}

// ---- Standard Interstitial (shown at game completion, 5-min cooldown) -----

const INTERSTITIAL_COOLDOWN_MS = 5 * 60 * 1000;
const INTERSTITIAL_LAST_SHOWN_KEY = '@ads/interstitial/lastShownAt';

type InterstitialState = 'idle' | 'loading' | 'loaded' | 'showing';

let interstitialAd: InterstitialAd | null = null;
let interstitialState: InterstitialState = 'idle';
let interstitialLoadPromise: Promise<void> | null = null;
let interstitialUnsubs: Array<() => void> = [];
// Cached cooldown value; persisted to AsyncStorage so it survives app restarts.
let interstitialLastShownAt = 0;
let cooldownHydrated = false;

function cleanupInterstitialListeners() {
  interstitialUnsubs.forEach((u) => {
    try {
      u();
    } catch {}
  });
  interstitialUnsubs = [];
}

function createInterstitial(): InterstitialAd {
  return InterstitialAd.createForAdRequest(getInterstitialUnitId(), {
    requestNonPersonalizedAdsOnly: false,
  });
}

async function hydrateCooldown(): Promise<void> {
  if (cooldownHydrated) return;
  cooldownHydrated = true;
  try {
    const raw = await AsyncStorage.getItem(INTERSTITIAL_LAST_SHOWN_KEY);
    const parsed = raw ? parseInt(raw, 10) : 0;
    if (Number.isFinite(parsed) && parsed > 0) {
      interstitialLastShownAt = parsed;
    }
  } catch (err) {
    console.warn('[ads] Failed to hydrate interstitial cooldown:', err);
  }
}

async function persistCooldown(timestamp: number): Promise<void> {
  try {
    await AsyncStorage.setItem(INTERSTITIAL_LAST_SHOWN_KEY, String(timestamp));
  } catch (err) {
    console.warn('[ads] Failed to persist interstitial cooldown:', err);
  }
}

/**
 * Preload a standard interstitial ad. Idempotent; resolves when done loading
 * (success or failure).
 */
export function preloadInterstitial(): Promise<void> {
  if (interstitialState === 'loaded' || interstitialState === 'showing') {
    return Promise.resolve();
  }
  if (interstitialLoadPromise) return interstitialLoadPromise;

  cleanupInterstitialListeners();
  interstitialAd = createInterstitial();
  interstitialState = 'loading';

  interstitialLoadPromise = new Promise<void>((resolve) => {
    const ad = interstitialAd!;

    const offLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      interstitialState = 'loaded';
      interstitialLoadPromise = null;
      console.log('[ads] Interstitial loaded');
      resolve();
    });

    const offError = ad.addAdEventListener(AdEventType.ERROR, (error) => {
      console.warn('[ads] Interstitial failed to load:', error);
      interstitialState = 'idle';
      interstitialAd = null;
      interstitialLoadPromise = null;
      cleanupInterstitialListeners();
      resolve();
    });

    interstitialUnsubs.push(offLoaded, offError);

    try {
      ad.load();
    } catch (err) {
      console.warn('[ads] interstitial.load() threw:', err);
      interstitialState = 'idle';
      interstitialAd = null;
      interstitialLoadPromise = null;
      cleanupInterstitialListeners();
      resolve();
    }
  });

  return interstitialLoadPromise;
}

export function isInterstitialReady(): boolean {
  return interstitialState === 'loaded' && interstitialAd !== null;
}

/**
 * Milliseconds remaining on the interstitial cooldown. `0` means ready.
 */
export async function getInterstitialCooldownRemainingMs(): Promise<number> {
  await hydrateCooldown();
  const elapsed = Date.now() - interstitialLastShownAt;
  return Math.max(0, INTERSTITIAL_COOLDOWN_MS - elapsed);
}

/**
 * Show the interstitial if it is loaded AND at least 5 minutes have elapsed
 * since the previous one. Triggers a preload of the next ad regardless of
 * outcome. Safe to call at any natural game transition.
 */
export async function maybeShowInterstitial(): Promise<MaybeShowInterstitialResult> {
  await hydrateCooldown();
  const remaining = INTERSTITIAL_COOLDOWN_MS - (Date.now() - interstitialLastShownAt);
  if (remaining > 0) {
    // Warm up the cache so it's ready when the cooldown expires.
    preloadInterstitial();
    return { shown: false, reason: 'cooldown', cooldownRemainingMs: remaining };
  }

  if (!isInterstitialReady() || !interstitialAd) {
    preloadInterstitial();
    return { shown: false, reason: 'not_ready' };
  }

  return new Promise<MaybeShowInterstitialResult>((resolve) => {
    const ad = interstitialAd!;
    let resolved = false;

    const finish = (result: MaybeShowInterstitialResult) => {
      if (resolved) return;
      resolved = true;
      cleanupInterstitialListeners();
      interstitialAd = null;
      interstitialState = 'idle';
      preloadInterstitial();
      resolve(result);
    };

    const offClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      const now = Date.now();
      interstitialLastShownAt = now;
      persistCooldown(now);
      finish({ shown: true });
    });

    const offError = ad.addAdEventListener(AdEventType.ERROR, (error) => {
      console.warn('[ads] Interstitial show error:', error);
      finish({ shown: false, reason: 'error' });
    });

    interstitialUnsubs.push(offClosed, offError);

    interstitialState = 'showing';
    try {
      ad.show();
    } catch (err) {
      console.warn('[ads] interstitial.show() threw:', err);
      finish({ shown: false, reason: 'error' });
    }
  });
}
