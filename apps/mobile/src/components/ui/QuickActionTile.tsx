import React from 'react';
import { StyleSheet, Text, View, Pressable, StyleProp, ViewStyle } from 'react-native';
import { Tokens, Typography } from '@/constants/theme';

export interface QuickActionTileProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function QuickActionTile({
  icon,
  title,
  subtitle,
  onPress,
  style,
  testID,
}: QuickActionTileProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed, style]}
    >
      <View style={styles.iconHolder}>{icon}</View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 220,
    backgroundColor: Tokens.colors.card,
    borderRadius: Tokens.radii.tile,
    borderWidth: 1,
    borderColor: Tokens.colors.line,
    padding: Tokens.spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.md,
  },
  tilePressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  iconHolder: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Tokens.colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    fontWeight: Tokens.fontWeight.semibold,
    color: Tokens.colors.ink,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    color: Tokens.colors.muted,
    marginTop: 2,
  },
});
