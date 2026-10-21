import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Tokens, Typography, useResponsiveLayout } from '@/constants/theme';
import { Card } from './Card';

export interface CircuitBannerStat {
  icon?: React.ReactNode;
  label: string;
}

export interface CircuitBannerProps {
  title: string;
  badge?: string;
  description?: string;
  stats?: CircuitBannerStat[];
  rightAction?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function CircuitBanner({
  title,
  badge,
  description,
  stats,
  rightAction,
  style,
  testID,
}: CircuitBannerProps) {
  const { isDesktop } = useResponsiveLayout();

  return (
    <Card style={[styles.card, style]} testID={testID}>
      <View style={styles.topRow}>
        <View style={styles.textContainer}>
          {badge ? (
            <View style={styles.badgeRow}>
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>{badge}</Text>
              </View>
            </View>
          ) : null}
          <Text style={[styles.title, isDesktop && styles.titleDesktop]}>
            {title}
          </Text>
          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}
        </View>
        {rightAction ? (
          <View style={styles.actionContainer}>{rightAction}</View>
        ) : null}
      </View>

      {stats && stats.length > 0 ? (
        <View style={styles.statsRow}>
          {stats.map((stat, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <Text style={styles.statDot}>•</Text>}
              <View style={styles.statItem}>
                {stat.icon}
                <Text style={styles.statText}>{stat.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Tokens.colors.bannerBlueDark,
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.bannerBlueBorder,
    padding: Tokens.spacing.lg,
    gap: Tokens.spacing.xs,
    ...Platform.select({
      web: {
        backgroundImage: Tokens.colors.heroGradient,
        boxShadow:
          '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      },
      default: {
        elevation: 2,
        shadowColor: Tokens.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  badgePill: {
    backgroundColor: Tokens.colors.bannerBluePillBg,
    paddingHorizontal: Tokens.spacing.xs,
    paddingVertical: 2,
    borderRadius: Tokens.radii.pill,
    borderWidth: 1,
    borderColor: Tokens.colors.bannerBluePillBorder,
  },
  badgePillText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xs,
    color: Tokens.colors.bannerBlueText,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Tokens.spacing.md,
  },
  textContainer: {
    flex: 1,
    gap: Tokens.spacing.xs,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  title: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xl,
    lineHeight: Tokens.lineHeight.xl,
    color: Tokens.colors.bannerBlueText,
  },
  titleDesktop: {
    fontSize: Tokens.fontSize.xxl,
    lineHeight: Tokens.lineHeight.xxl,
  },
  description: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    color: Tokens.colors.bannerBlueTextMuted,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Tokens.spacing.sm,
    paddingTop: Tokens.spacing.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
  },
  statText: {
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Tokens.fontWeight.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.bannerBlueText,
  },
  statDot: {
    color: Tokens.colors.bannerBlueTag,
    fontSize: Tokens.fontSize.xs,
  },
});
