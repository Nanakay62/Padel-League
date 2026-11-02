import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  TextStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { Tokens, Typography } from '@/constants/theme';

export interface ButtonProps {
  title?: string;
  children?: React.ReactNode;
  onPress?: (event?: any) => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'ink' | 'outlineOnDark';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  testID?: string;
  icon?: React.ReactNode;
}

export function Button({
  title,
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
  testID,
  icon,
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isInk = variant === 'ink';
  const isOutlineOnDark = variant === 'outlineOnDark';
  const isGhost = variant === 'ghost';
  const isDanger = variant === 'danger';

  const label = title ?? (typeof children === 'string' ? children : undefined);
  const a11y = accessibilityLabel ?? label ?? 'Button';

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed, focused }: any) => [
        styles.base,
        size === 'sm' && styles.sizeSm,
        size === 'md' && styles.sizeMd,
        size === 'lg' && styles.sizeLg,
        isPrimary && styles.primary,
        isSecondary && styles.secondary,
        isInk && styles.ink,
        isOutlineOnDark && styles.outlineOnDark,
        isGhost && styles.ghost,
        isDanger && styles.danger,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        focused && Platform.OS === 'web' && styles.focusedWeb,
        style,
      ]}
    >
      {icon}
      {title ? (
        <Text
          style={[
            styles.baseText,
            isPrimary && styles.primaryText,
            isSecondary && styles.secondaryText,
            isInk && styles.inkText,
            isOutlineOnDark && styles.outlineOnDarkText,
            isGhost && styles.ghostText,
            isDanger && styles.dangerText,
            size === 'sm' && styles.textSm,
            disabled && styles.disabledText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: Tokens.touch.minTarget,
    borderRadius: Tokens.radii.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Tokens.spacing.lg,
    gap: Tokens.spacing.sm,
  },
  sizeSm: {
    minHeight: 40,
    paddingHorizontal: Tokens.spacing.md,
    paddingVertical: Tokens.spacing.xs,
  },
  sizeMd: {
    minHeight: Tokens.touch.minTarget,
    paddingHorizontal: Tokens.spacing.xl,
    paddingVertical: Tokens.spacing.md,
  },
  sizeLg: {
    minHeight: 52,
    paddingHorizontal: Tokens.spacing.xxl,
    paddingVertical: Tokens.spacing.md,
  },
  primary: {
    backgroundColor: Tokens.colors.lime,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Tokens.colors.line,
  },
  ink: {
    backgroundColor: Tokens.colors.ink,
  },
  outlineOnDark: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Tokens.colors.onInkMuted,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: Tokens.colors.danger,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  focusedWeb: {
    outlineWidth: 2,
    outlineColor: Tokens.colors.ink,
    outlineOffset: 2,
    outlineStyle: 'solid',
  } as ViewStyle,
  baseText: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    textAlign: 'center',
  },
  textSm: {
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
  },
  primaryText: {
    color: Tokens.colors.ink,
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Tokens.fontWeight.bold,
  },
  secondaryText: {
    color: Tokens.colors.text,
  },
  inkText: {
    color: Tokens.colors.chalk,
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Tokens.fontWeight.bold,
  },
  outlineOnDarkText: {
    color: Tokens.colors.onInk,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Tokens.fontWeight.medium,
  },
  ghostText: {
    color: Tokens.colors.textMuted,
  },
  dangerText: {
    color: Tokens.colors.card,
  },
  disabledText: {
    color: Tokens.colors.textMuted,
  },
});
