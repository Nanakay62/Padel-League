import React from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
  AccessibilityRole,
} from 'react-native';
import { Tokens } from '@/constants/theme';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  testID?: string;
  variant?: 'card' | 'hero' | 'tile' | 'stat' | 'ink';
}

export function Card({
  children,
  style,
  onPress,
  accessibilityRole,
  accessibilityLabel,
  testID,
  variant = 'card',
}: CardProps) {
  const cardStyle = [
    styles.card,
    variant === 'hero' && styles.hero,
    variant === 'tile' && styles.tile,
    variant === 'stat' && styles.stat,
    variant === 'ink' && styles.ink,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        testID={testID}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [
          cardStyle,
          pressed && styles.pressed,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View testID={testID} style={cardStyle}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Tokens.colors.card,
    borderRadius: Tokens.radii.card,
    borderWidth: 1,
    borderColor: Tokens.colors.line,
    padding: Tokens.spacing.base,
  },
  hero: {
    borderRadius: Tokens.radii.hero,
    padding: Tokens.spacing.xxl,
  },
  tile: {
    borderRadius: Tokens.radii.tile,
    padding: Tokens.spacing.lg,
  },
  stat: {
    backgroundColor: Tokens.colors.chalk,
    borderRadius: Tokens.radii.statTile,
    borderWidth: 1,
    borderColor: Tokens.colors.line,
    padding: Tokens.spacing.base,
  },
  ink: {
    backgroundColor: Tokens.colors.ink,
    borderRadius: Tokens.radii.hero,
    borderWidth: 0,
    padding: Tokens.spacing.xxl,
  },
  pressed: {
    opacity: 0.9,
  },
});
