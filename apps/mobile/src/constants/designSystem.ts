export type MoMoProviderId = 'mtn' | 'telecel' | 'at';

export interface MoMoRailConfig {
  id: MoMoProviderId;
  name: string;
  shortName: string;
  brandColor: string;
  textColor: string;
  prefixes: string[];
}

export const MOMO_RAILS: Record<MoMoProviderId, MoMoRailConfig> = {
  mtn: {
    id: 'mtn',
    name: 'MTN Mobile Money',
    shortName: 'MTN MoMo',
    brandColor: '#FFCC00',
    textColor: '#000000',
    prefixes: ['024', '054', '055', '059'],
  },
  telecel: {
    id: 'telecel',
    name: 'Telecel Cash',
    shortName: 'Telecel',
    brandColor: '#E60000',
    textColor: '#FFFFFF',
    prefixes: ['020', '050'],
  },
  at: {
    id: 'at',
    name: 'AT Money',
    shortName: 'AT Money',
    brandColor: '#0055A5',
    textColor: '#FFFFFF',
    prefixes: ['026', '056', '027', '057'],
  },
};

export type RatingTier = 'beginner' | 'intermediate' | 'advanced' | 'pro';

export interface RatingTierConfig {
  tier: RatingTier;
  min: number;
  max: number;
  labelKey: 'ratingTierBeginner' | 'ratingTierIntermediate' | 'ratingTierAdvanced' | 'ratingTierPro';
  badgeBg: string;
  badgeText: string;
}

export const PLAYTOMIC_RATING_SCALE = {
  min: 0.0,
  max: 7.0,
  tiers: [
    {
      tier: 'beginner' as RatingTier,
      min: 0.0,
      max: 1.99,
      labelKey: 'ratingTierBeginner' as const,
      badgeBg: '#E6E1D3', // Tokens.colors.track / surfaceMuted
      badgeText: '#5A655F', // Tokens.colors.muted
    },
    {
      tier: 'intermediate' as RatingTier,
      min: 2.0,
      max: 3.99,
      labelKey: 'ratingTierIntermediate' as const,
      badgeBg: '#FBFAF6', // Tokens.colors.card
      badgeText: '#12201C', // Tokens.colors.ink
    },
    {
      tier: 'advanced' as RatingTier,
      min: 4.0,
      max: 5.49,
      labelKey: 'ratingTierAdvanced' as const,
      badgeBg: '#D5F23B', // Tokens.colors.lime
      badgeText: '#12201C', // Tokens.colors.ink
    },
    {
      tier: 'pro' as RatingTier,
      min: 5.5,
      max: 7.0,
      labelKey: 'ratingTierPro' as const,
      badgeBg: '#12201C', // Tokens.colors.ink
      badgeText: '#D5F23B', // Tokens.colors.lime
    },
  ],
};

export function getPlaytomicBand(level: number): RatingTierConfig {
  const clamped = Math.min(Math.max(level, PLAYTOMIC_RATING_SCALE.min), PLAYTOMIC_RATING_SCALE.max);
  if (clamped < 2.0) return PLAYTOMIC_RATING_SCALE.tiers[0];
  if (clamped < 4.0) return PLAYTOMIC_RATING_SCALE.tiers[1];
  if (clamped < 5.5) return PLAYTOMIC_RATING_SCALE.tiers[2];
  return PLAYTOMIC_RATING_SCALE.tiers[3];
}

export const MOTION_DURATIONS = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 500,
} as const;

export const MOTION_EASINGS = {
  standard: 'cubic-bezier(0.2, 0.0, 0, 1.0)',
  decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1.0)',
  accelerate: 'cubic-bezier(0.4, 0.0, 1.0, 1.0)',
} as const;

export const ACCESSIBILITY_TOKENS = {
  minTouchTarget: 48,
  touchTargetApple: 44,
  touchTargetMaterial: 48,
  maxFontSizeMultiplier: 1.35,
} as const;
