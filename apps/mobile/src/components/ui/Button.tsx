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
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
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
    paddingHorizontal: Tokens.spacing.base,
    gap: Tokens.spacing.sm,
  },
  sizeSm: {
    minHeight: Tokens.touch.minTarget,
    paddingHorizontal: Tokens.spacing.md,
    paddingVertical: Tokens.spacing.xs,
  },
  sizeMd: {
    minHeight: Tokens.touch.minTarget,
    paddingHorizontal: Tokens.spacing.base,
    paddingVertical: Tokens.spacing.sm,
  },
  sizeLg: {
    minHeight: 52,
    paddingHorizontal: Tokens.spacing.xl,
    paddingVertical: Tokens.spacing.md,
  },
  primary: {
    backgroundColor: Tokens.colors.primary,
  },
  secondary: {
    backgroundColor: Tokens.colors.card,
    borderWidth: 1,
    borderColor: Tokens.colors.border,
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
  },
  focusedWeb: {
    outlineWidth: 2,
    outlineColor: Tokens.colors.text,
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
    color: Tokens.colors.textOnPrimary,
  },
  secondaryText: {
    color: Tokens.colors.text,
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
