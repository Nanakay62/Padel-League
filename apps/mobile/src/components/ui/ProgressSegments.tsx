import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { Tokens } from '@/constants/theme';

export interface ProgressSegmentsProps {
  total: number;
  filled: number;
  style?: StyleProp<ViewStyle>;
  segmentHeight?: number;
  onDark?: boolean;
}

export function ProgressSegments({
  total,
  filled,
  style,
  segmentHeight = 8,
  onDark = true,
}: ProgressSegmentsProps) {
  const safeTotal = Math.max(1, total);
  const safeFilled = Math.min(Math.max(0, filled), safeTotal);

  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: safeTotal }).map((_, index) => {
        const isFilled = index < safeFilled;
        return (
          <View
            key={index}
            style={[
              styles.segment,
              { height: segmentHeight },
              isFilled
                ? styles.filled
                : onDark
                  ? styles.emptyOnDark
                  : styles.emptyOnLight,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.xs,
    width: '100%',
  },
  segment: {
    flex: 1,
    borderRadius: Tokens.radii.xs,
  },
  filled: {
    backgroundColor: Tokens.colors.lime,
  },
  emptyOnDark: {
    backgroundColor: Tokens.colors.inkSoft,
  },
  emptyOnLight: {
    backgroundColor: Tokens.colors.track,
  },
});
