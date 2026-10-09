import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { Tokens, Typography } from '@/constants/theme';

export interface BadgeProps {
  label: string;
  variant?: 'neutral' | 'success' | 'gold' | 'danger';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

export function Badge({
  label,
  variant = 'neutral',
  style,
  textStyle,
  icon,
}: BadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        variant === 'neutral' && styles.neutralBadge,
        variant === 'success' && styles.successBadge,
        variant === 'gold' && styles.goldBadge,
        variant === 'danger' && styles.dangerBadge,
        style,
      ]}
    >
      {icon}
      <Text
        style={[
          styles.text,
          variant === 'neutral' && styles.neutralText,
          variant === 'success' && styles.successText,
          variant === 'gold' && styles.goldText,
          variant === 'danger' && styles.dangerText,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export const StatusPill = Badge;

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.pill,
    gap: Tokens.spacing.xs,
    alignSelf: 'flex-start',
  },
  neutralBadge: {
    backgroundColor: Tokens.colors.background,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  successBadge: {
    backgroundColor: Tokens.colors.background,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  goldBadge: {
    backgroundColor: Tokens.colors.gold,
  },
  dangerBadge: {
    backgroundColor: Tokens.colors.dangerSurface,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
  },
  text: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
  },
  neutralText: {
    color: Tokens.colors.textMuted,
  },
  successText: {
    color: Tokens.colors.greenText,
  },
  goldText: {
    color: Tokens.colors.textOnGold,
  },
  dangerText: {
    color: Tokens.colors.danger,
  },
});
