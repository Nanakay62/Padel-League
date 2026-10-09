import '@/global.css';
import { Platform, TextStyle } from 'react-native';

export const Tokens = {
  colors: {
    // Mica Light Theme (Application-wide default)
    background: '#F6F6F4',
    card: '#FFFFFF',
    border: '#E7E7E3',
    text: '#14181A',
    textMuted: '#5F676B',
    primary: '#00C853', // Used ONLY for primary button fill & active nav
    textOnPrimary: '#14181A', // Charcoal text on primary button
    greenText: '#007A33', // Accessible green text on light surfaces (>= 4.5:1)
    gold: '#F4C430',
    textOnGold: '#14181A',
    surfaceElevated: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceMuted: '#F6F6F4',
    primaryForeground: '#14181A',
    primaryText: '#007A33',
    primaryLight: '#E6F9EE',
    primaryBorder: '#A3E8BC',
    goldText: '#8F6B00',
    goldLight: '#FEF8E7',
    goldBorder: '#F9DE8B',
    errorLight: '#FDF2F2',
    errorBorder: '#F5B8B5',
    errorText: '#B3261E',
    danger: '#B3261E',
    dangerSurface: '#FDF2F2',

    // Courtside Live Scoring Dark Theme (ONLY for /events/[id]/live)
    live: {
      background: '#0B0F0E',
      card: '#161C1A',
      surface: '#161C1A',
      surfaceMuted: '#1E2623',
      border: '#25302C',
      text: '#F6F6F4',
      textMuted: '#8A9499',
      primary: '#00C853',
      primaryForeground: '#0B0F0E',
      textOnPrimary: '#14181A',
      gold: '#F4C430',
      textOnGold: '#14181A',
      error: '#EF4444',
      errorBackground: '#3F1212',
      errorBorder: '#7F1D1D',
      errorText: '#FCA5A5',
      successBackground: '#133E2B',
      goldBackground: '#372E15',
    },
  },
  borders: {
    width: 1,
  },
  dimensions: {
    minTouchTarget: 44,
    minStepper: 64,
  },
  radii: {
    sm: 8,
    card: 12,
    button: 12,
    input: 12,
    pill: 9999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },
  touch: {
    minTarget: 44,
    minStepper: 64,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    display: 30,
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 26,
    xl: 28,
    xxl: 32,
    display: 38,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
  },
  fontFamily: {
    regular: Platform.select({
      web: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      ios: 'Inter-Regular',
      android: 'Inter-Regular',
      default: 'Inter-Regular',
    }),
    medium: Platform.select({
      web: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      ios: 'Inter-Medium',
      android: 'Inter-Medium',
      default: 'Inter-Medium',
    }),
    semibold: Platform.select({
      web: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      ios: 'Inter-SemiBold',
      android: 'Inter-SemiBold',
      default: 'Inter-SemiBold',
    }),
  },
} as const;

// Backward-compatible Colors object referencing Tokens
export const Colors = {
  light: {
    text: Tokens.colors.text,
    background: Tokens.colors.background,
    backgroundElement: Tokens.colors.border,
    backgroundSelected: Tokens.colors.primary,
    textSecondary: Tokens.colors.textMuted,
    primary: Tokens.colors.primary,
    card: Tokens.colors.card,
    border: Tokens.colors.border,
    gold: Tokens.colors.gold,
  },
  dark: {
    text: Tokens.colors.live.text,
    background: Tokens.colors.live.background,
    backgroundElement: Tokens.colors.live.card,
    backgroundSelected: Tokens.colors.live.primary,
    textSecondary: Tokens.colors.live.textMuted,
    primary: Tokens.colors.live.primary,
    card: Tokens.colors.live.card,
    border: Tokens.colors.live.border,
    gold: Tokens.colors.live.gold,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = {
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'Courier' }),
} as const;

export const PadelBrand = {
  charcoal: Tokens.colors.text,
  electricGreen: Tokens.colors.primary,
  gold: Tokens.colors.gold,
  offWhite: Tokens.colors.background,
  cardDark: Tokens.colors.live.card,
  borderDark: Tokens.colors.live.border,
} as const;

export const Typography = {
  fontSize: Tokens.fontSize,
  lineHeight: Tokens.lineHeight,
  fontWeight: Tokens.fontWeight,
  fontFamily: Tokens.fontFamily,
  tabularNums: {
    fontVariant: ['tabular-nums'] as TextStyle['fontVariant'],
  },
} as const;

export const Spacing = {
  half: Tokens.spacing.xs,
  one: Tokens.spacing.xs,
  two: Tokens.spacing.sm,
  three: Tokens.spacing.base,
  four: Tokens.spacing.xl,
  five: Tokens.spacing.xxl,
  six: Tokens.spacing.xxxl,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export interface TokenPair {
  name: string;
  foreground: string;
  background: string;
  context: string;
  minRatio?: number;
}

export const TokenContrastPairs: TokenPair[] = [
  {
    name: 'Primary Text on App Background',
    foreground: Tokens.colors.text,
    background: Tokens.colors.background,
    context: 'Main page titles, headers, and body text on off-white background',
  },
  {
    name: 'Primary Text on Card White',
    foreground: Tokens.colors.text,
    background: Tokens.colors.card,
    context: 'Headings, labels, and event titles inside cards',
  },
  {
    name: 'Muted Text on Card White',
    foreground: Tokens.colors.textMuted,
    background: Tokens.colors.card,
    context: 'Subtitles, timestamps, metadata, and venue addresses on cards',
  },
  {
    name: 'Muted Text on App Background',
    foreground: Tokens.colors.textMuted,
    background: Tokens.colors.background,
    context: 'Section descriptions and footnotes on page background',
  },
  {
    name: 'Text on Primary Button',
    foreground: Tokens.colors.textOnPrimary,
    background: Tokens.colors.primary,
    context: 'Button label and icon inside electric green primary CTA buttons',
  },
  {
    name: 'Green Text on Card White',
    foreground: Tokens.colors.greenText,
    background: Tokens.colors.card,
    context: 'Accessible green highlight text, badges, and status pills on cards',
  },
  {
    name: 'Green Text on App Background',
    foreground: Tokens.colors.greenText,
    background: Tokens.colors.background,
    context: 'Accessible green text labels on warm off-white page background',
  },
  {
    name: 'Text on Gold Badge',
    foreground: Tokens.colors.textOnGold,
    background: Tokens.colors.gold,
    context: 'Charcoal text on gold badges and ranking pills',
  },
  {
    name: 'Live Mode Text on Live Card',
    foreground: Tokens.colors.live.text,
    background: Tokens.colors.live.card,
    context: 'Courtside Live scorekeeper player names and score numbers on dark cards',
  },
  {
    name: 'Live Mode Text on Live Background',
    foreground: Tokens.colors.live.text,
    background: Tokens.colors.live.background,
    context: 'Courtside Live titles and header text on dark background',
  },
  {
    name: 'Live Mode Muted Text on Live Card',
    foreground: Tokens.colors.live.textMuted,
    background: Tokens.colors.live.card,
    context: 'Courtside Live set scores and round indicators on dark cards',
  },
  {
    name: 'Danger Text on Danger Surface',
    foreground: Tokens.colors.danger,
    background: Tokens.colors.dangerSurface,
    context: 'Error alerts and destructive confirmation notices',
  },
];
