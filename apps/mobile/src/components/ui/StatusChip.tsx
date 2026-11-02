import React from 'react';
import { StyleSheet, Text, View, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Tokens, Typography } from '@/constants/theme';

export type StatusChipType = 'confirmed' | 'pending' | 'unpaid' | 'cancelled' | 'open';

export interface StatusChipProps {
  status: StatusChipType;
  label?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  onDark?: boolean;
}

export function StatusChip({
  status,
  label,
  style,
  textStyle,
  onDark = false,
}: StatusChipProps) {
  const displayLabel = label ?? status.toUpperCase();

  const isConfirmed = status === 'confirmed' || status === 'open';
  const isPending = status === 'pending' || status === 'unpaid';
  const isCancelled = status === 'cancelled';

  return (
    <View
      style={[
        styles.base,
        isConfirmed && styles.confirmed,
        isPending && (onDark ? styles.pendingOnDark : styles.pending),
        isCancelled && (onDark ? styles.cancelledOnDark : styles.cancelled),
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          isConfirmed && styles.confirmedText,
          isPending && (onDark ? styles.pendingTextOnDark : styles.pendingText),
          isCancelled && styles.cancelledText,
          textStyle,
        ]}
      >
        {displayLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: Tokens.spacing.md,
    paddingVertical: Tokens.spacing.xs,
    borderRadius: Tokens.radii.chip,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmed: {
    backgroundColor: Tokens.colors.lime,
  },
  confirmedText: {
    color: Tokens.colors.ink,
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Tokens.fontWeight.bold,
  },
  pending: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Tokens.colors.ink,
  },
  pendingText: {
    color: Tokens.colors.ink,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  pendingOnDark: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Tokens.colors.onInk,
  },
  pendingTextOnDark: {
    color: Tokens.colors.onInk,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  cancelled: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Tokens.colors.muted,
  },
  cancelledOnDark: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Tokens.colors.onInkMuted,
  },
  cancelledText: {
    color: Tokens.colors.muted,
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
  },
  text: {
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
