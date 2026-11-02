import React from 'react';
import { StyleSheet, Text, View, StyleProp, ViewStyle } from 'react-native';
import { Tokens, Typography } from '@/constants/theme';

export interface RatingBandProps {
  currentRating: number;
  rangeMin?: number;
  rangeMax?: number;
  reliabilityPercent?: number;
  matchesCount?: number;
  winRatePercent?: number;
  style?: StyleProp<ViewStyle>;
}

export function RatingBand({
  currentRating = 3.40,
  rangeMin = 3.2,
  rangeMax = 3.6,
  reliabilityPercent = 82,
  matchesCount = 14,
  winRatePercent = 64,
  style,
}: RatingBandProps) {
  // Normalize track from 2.0 to 5.0 (total range = 3.0)
  const minScale = 2.0;
  const maxScale = 5.0;
  const totalScale = maxScale - minScale;

  const clamp = (val: number, min: number, max: number) =>
    Math.min(Math.max(val, min), max);

  const safeCurrent = clamp(currentRating, minScale, maxScale);
  const safeMin = clamp(rangeMin, minScale, maxScale);
  const safeMax = clamp(rangeMax, safeMin, maxScale);

  const rangeLeftPercent = `${((safeMin - minScale) / totalScale) * 100}%`;
  const rangeWidthPercent = `${((safeMax - safeMin) / totalScale) * 100}%`;
  const markerLeftPercent = `${((safeCurrent - minScale) / totalScale) * 100}%`;

  return (
    <View style={[styles.card, style]}>
      {/* Eyebrow Label */}
      <Text style={styles.eyebrow}>YOUR RATING</Text>

      {/* Big Display Rating */}
      <Text style={styles.displayRating}>{currentRating.toFixed(2)}</Text>

      {/* Subtitle */}
      <Text style={styles.subtitle}>Accra Metro Skill Index · calculated</Text>

      {/* Slider Track Area */}
      <View style={styles.trackSection}>
        <View style={styles.trackBase}>
          {/* Likely range ink band */}
          <View
            style={[
              styles.rangeBand,
              {
                left: rangeLeftPercent as any,
                width: rangeWidthPercent as any,
              },
            ]}
          />
          {/* Lime marker with ink ring at current rating */}
          <View
            style={[
              styles.markerWrapper,
              { left: markerLeftPercent as any },
            ]}
          >
            <View style={styles.markerCircle} />
          </View>
        </View>

        {/* Captions below slider */}
        <View style={styles.captionsRow}>
          <Text style={styles.scaleBound}>2.0</Text>
          <Text style={styles.likelyRangeText}>
            Likely range {safeMin.toFixed(1)} – {safeMax.toFixed(1)}
          </Text>
          <Text style={styles.scaleBound}>5.0</Text>
        </View>
      </View>

      {/* Reliability Section */}
      <View style={styles.reliabilitySection}>
        <View style={styles.reliabilityHeader}>
          <Text style={styles.reliabilityLabel}>Rating reliability</Text>
          <Text style={styles.reliabilityValue}>{reliabilityPercent}%</Text>
        </View>
        <View style={styles.reliabilityTrack}>
          <View
            style={[
              styles.reliabilityFill,
              { width: `${clamp(reliabilityPercent, 0, 100)}%` as any },
            ]}
          />
        </View>
      </View>

      {/* Stat Tiles: Matches & Win Rate */}
      <View style={styles.statTilesRow}>
        <View style={styles.statTile}>
          <Text style={styles.statTileLabel}>Matches</Text>
          <Text style={styles.statTileValue}>{matchesCount}</Text>
        </View>
        <View style={styles.statTile}>
          <Text style={styles.statTileLabel}>Win rate</Text>
          <Text style={styles.statTileValue}>{winRatePercent}%</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Tokens.colors.card,
    borderRadius: Tokens.radii.cardLg,
    borderWidth: 1,
    borderColor: Tokens.colors.line,
    padding: Tokens.spacing.xl,
    width: '100%',
  },
  eyebrow: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    fontWeight: Tokens.fontWeight.semibold,
    letterSpacing: 1.0,
    color: Tokens.colors.muted,
    textTransform: 'uppercase',
  },
  displayRating: {
    fontFamily: Typography.fontFamily.display,
    fontSize: Tokens.fontSize.displayXl,
    lineHeight: Tokens.lineHeight.displayXl,
    fontWeight: Tokens.fontWeight.bold,
    letterSpacing: -1.5,
    color: Tokens.colors.ink,
    marginTop: Tokens.spacing.xs,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.muted,
    marginTop: 2,
    marginBottom: Tokens.spacing.lg,
  },
  trackSection: {
    width: '100%',
    marginBottom: Tokens.spacing.lg,
  },
  trackBase: {
    height: 10,
    backgroundColor: Tokens.colors.track,
    borderRadius: Tokens.radii.pill,
    position: 'relative',
    justifyContent: 'center',
  },
  rangeBand: {
    position: 'absolute',
    height: 10,
    backgroundColor: Tokens.colors.ink,
    borderRadius: Tokens.radii.pill,
  },
  markerWrapper: {
    position: 'absolute',
    top: -5,
    marginLeft: -10, // center 20px marker
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerCircle: {
    width: 18,
    height: 18,
    borderRadius: Tokens.radii.pill,
    backgroundColor: Tokens.colors.lime,
    borderWidth: 3,
    borderColor: Tokens.colors.ink,
  },
  captionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Tokens.spacing.sm,
  },
  scaleBound: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.muted,
  },
  likelyRangeText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Tokens.fontSize.xs,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.ink,
  },
  reliabilitySection: {
    width: '100%',
    marginBottom: Tokens.spacing.lg,
  },
  reliabilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Tokens.spacing.xs,
  },
  reliabilityLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.sm,
    color: Tokens.colors.muted,
  },
  reliabilityValue: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Tokens.fontSize.sm,
    fontWeight: Tokens.fontWeight.bold,
    color: Tokens.colors.ink,
  },
  reliabilityTrack: {
    height: 6,
    backgroundColor: Tokens.colors.track,
    borderRadius: Tokens.radii.pill,
    overflow: 'hidden',
  },
  reliabilityFill: {
    height: '100%',
    backgroundColor: Tokens.colors.ink,
    borderRadius: Tokens.radii.pill,
  },
  statTilesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.md,
    width: '100%',
  },
  statTile: {
    flex: 1,
    backgroundColor: Tokens.colors.chalk,
    borderRadius: Tokens.radii.statTile,
    padding: Tokens.spacing.base,
    borderWidth: 1,
    borderColor: Tokens.colors.line,
  },
  statTileLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.muted,
    marginBottom: Tokens.spacing.xs,
  },
  statTileValue: {
    fontFamily: Typography.fontFamily.display,
    fontSize: Tokens.fontSize.displayMobile,
    lineHeight: Tokens.lineHeight.displayMobile,
    fontWeight: Tokens.fontWeight.bold,
    letterSpacing: -0.5,
    color: Tokens.colors.ink,
  },
});
