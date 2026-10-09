import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor, Tokens } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const colorKey: ThemeColor = themeColor ?? 'text';

  return (
    <Text
      style={[
        { color: (theme as Record<ThemeColor, string>)[colorKey] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontSize: Tokens.fontSize.sm,
    lineHeight: 20,
    fontWeight: Tokens.fontWeight.medium,
  },
  smallBold: {
    fontSize: Tokens.fontSize.sm,
    lineHeight: 20,
    fontWeight: Tokens.fontWeight.semibold,
  },
  default: {
    fontSize: Tokens.fontSize.base,
    lineHeight: 24,
    fontWeight: Tokens.fontWeight.medium,
  },
  title: {
    fontSize: Tokens.fontSize.xxl,
    fontWeight: Tokens.fontWeight.semibold,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: Tokens.fontSize.xl,
    lineHeight: 28,
    fontWeight: Tokens.fontWeight.semibold,
  },
  link: {
    lineHeight: 30,
    fontSize: Tokens.fontSize.sm,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: Tokens.fontSize.sm,
    color: Tokens.colors.primaryText,
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: Tokens.fontWeight.semibold }) ?? Tokens.fontWeight.medium,
    fontSize: Tokens.fontSize.xs,
  },
});
