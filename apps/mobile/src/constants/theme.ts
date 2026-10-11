import '@/global.css';
import { Platform, TextStyle, useWindowDimensions } from 'react-native';

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

    // Desktop Navigation Sidebar (Stitch Obsidian Mica anchor)
    sidebarBackground: '#0B0F0E',
    sidebarBorder: '#1F2426',
    sidebarText: '#FFFFFF',
    sidebarTextMuted: '#9BA2A6',
    sidebarItemActiveBg: 'rgba(0, 200, 83, 0.12)',
    sidebarQuickActionBg: 'rgba(255, 255, 255, 0.06)',
    sidebarQuickActionBorder: '#25302C',

    // Hero Banner Media Overlays & Accents
    heroOverlay: 'rgba(24, 28, 30, 0.45)',
    heroTagBg: 'rgba(0, 200, 83, 0.2)',
    heroTagBorder: 'rgba(0, 200, 83, 0.4)',
    heroPillBg: 'rgba(255, 255, 255, 0.12)',
    heroPillBorder: 'rgba(255, 255, 255, 0.2)',
    heroTextMuted: '#CBD5E1',

    // Stitch Surface Containers & Badges
    surfaceContainerLow: '#F1F4F6',
    surfaceContainer: '#EBEEF1',
    surfaceContainerHigh: '#E6E8EB',
    surfaceContainerHighest: '#E0E3E5',
    openBadgeBg: '#D1FADF',
    openBadgeText: '#027A48',
    needsFourthBg: '#FFEDD5',
    needsFourthText: '#C2410C',
    activeRoundBg: '#FEF9E7',
    activeRoundBorder: '#FCE8A3',
    activeRoundText: '#8D6B00',

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
    xs: 4,
    sm: 8,
    chip: 6,
    card: 12,
    button: 12,
    input: 12,
    pill: 9999,
  },
  layout: {
    breakpoints: {
      mobile: 768,
      tablet: 1024,
    },
    maxContentWidth: 1280,
    sidebarWidth: 260,
    gutter: {
      mobile: 12,
      tablet: 16,
      desktop: 24,
    },
    margin: {
      mobile: 16,
      tablet: 24,
      desktop: 32,
    },
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
    displayMobile: 28,
    display: 30,
    displayLg: 36,
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 26,
    xl: 28,
    xxl: 32,
    displayMobile: 36,
    display: 38,
    displayLg: 44,
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
  // Stitch Typography Presets
  displayLg: {
    fontFamily: Tokens.fontFamily.semibold,
    fontSize: Tokens.fontSize.displayLg,
    lineHeight: Tokens.lineHeight.displayLg,
    fontWeight: Tokens.fontWeight.semibold,
    letterSpacing: -0.72,
  } as TextStyle,
  displayLgMobile: {
    fontFamily: Tokens.fontFamily.semibold,
    fontSize: Tokens.fontSize.displayMobile,
    lineHeight: Tokens.lineHeight.displayMobile,
    fontWeight: Tokens.fontWeight.semibold,
    letterSpacing: -0.42,
  } as TextStyle,
  headlineLg: {
    fontFamily: Tokens.fontFamily.semibold,
    fontSize: Tokens.fontSize.xxl,
    lineHeight: Tokens.lineHeight.xxl,
    fontWeight: Tokens.fontWeight.semibold,
    letterSpacing: -0.36,
  } as TextStyle,
  headlineMd: {
    fontFamily: Tokens.fontFamily.semibold,
    fontSize: Tokens.fontSize.xl,
    lineHeight: Tokens.lineHeight.xl,
    fontWeight: Tokens.fontWeight.semibold,
    letterSpacing: -0.2,
  } as TextStyle,
  headlineSm: {
    fontFamily: Tokens.fontFamily.semibold,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    fontWeight: Tokens.fontWeight.semibold,
    letterSpacing: -0.08,
  } as TextStyle,
  bodyLg: {
    fontFamily: Tokens.fontFamily.regular,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    fontWeight: Tokens.fontWeight.regular,
  } as TextStyle,
  bodyMd: {
    fontFamily: Tokens.fontFamily.regular,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    fontWeight: Tokens.fontWeight.regular,
  } as TextStyle,
  bodySm: {
    fontFamily: Tokens.fontFamily.regular,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    fontWeight: Tokens.fontWeight.regular,
  } as TextStyle,
  labelMd: {
    fontFamily: Tokens.fontFamily.medium,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    fontWeight: Tokens.fontWeight.medium,
  } as TextStyle,
  labelSm: {
    fontFamily: Tokens.fontFamily.medium,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    fontWeight: Tokens.fontWeight.medium,
  } as TextStyle,
  dataMonoLg: {
    fontFamily: Tokens.fontFamily.semibold,
    fontSize: Tokens.fontSize.xl,
    lineHeight: Tokens.lineHeight.xl,
    fontWeight: Tokens.fontWeight.semibold,
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'] as TextStyle['fontVariant'],
  } as TextStyle,
  dataMonoMd: {
    fontFamily: Tokens.fontFamily.medium,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    fontWeight: Tokens.fontWeight.medium,
    fontVariant: ['tabular-nums'] as TextStyle['fontVariant'],
  } as TextStyle,
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
export const MaxContentWidth = Tokens.layout.maxContentWidth;
export const Layout = Tokens.layout;
export const Breakpoints = Tokens.layout.breakpoints;

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

export function useResponsiveLayout() {
  const { width } = useWindowDimensions();
  const isMobile = width < Tokens.layout.breakpoints.mobile;
  const isTablet = width >= Tokens.layout.breakpoints.mobile && width < Tokens.layout.breakpoints.tablet;
  const isDesktop = width >= Tokens.layout.breakpoints.tablet;

  return {
    width,
    isMobile,
    isTablet,
    isDesktop,
    gutter: isDesktop
      ? Tokens.layout.gutter.desktop
      : isTablet
        ? Tokens.layout.gutter.tablet
        : Tokens.layout.gutter.mobile,
    margin: isDesktop
      ? Tokens.layout.margin.desktop
      : isTablet
        ? Tokens.layout.margin.tablet
        : Tokens.layout.margin.mobile,
    maxContentWidth: Tokens.layout.maxContentWidth,
  };
}
