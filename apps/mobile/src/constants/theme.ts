import '@/global.css';
import { Platform, TextStyle, useWindowDimensions } from 'react-native';
import {
  MOMO_RAILS,
  MOTION_DURATIONS,
  MOTION_EASINGS,
  ACCESSIBILITY_TOKENS,
} from './designSystem';

export const Tokens = {
  colors: {
    // Court Chalk Design Language Tokens
    chalk: '#F3F0E8', // Page background
    card: '#FBFAF6', // Cards on chalk
    line: '#DAD4C4', // 1px borders
    track: '#E6E1D3', // Progress and slider tracks
    ink: '#12201C', // Primary text, focal dark cards, active nav pill
    inkSoft: '#2F4239', // Empty segments on ink
    muted: '#5A655F', // Secondary text on chalk and card
    onInk: '#F3F0E8', // Labels on ink
    onInkMuted: '#C9D3CC', // Sublabels/secondary on ink
    lime: '#D5F23B', // Primary action, filled progress on ink, rating chips, highlight blocks
    court: '#1D5F5B', // Only for the court diagram

    // Core Semantic Aliases
    background: '#F3F0E8',
    border: '#DAD4C4',
    text: '#12201C',
    textMuted: '#5A655F',
    primary: '#1D4ED8',
    textOnPrimary: '#FFFFFF',
    greenText: '#1D5F5B',
    gold: '#D5F23B',
    textOnGold: '#12201C',
    surfaceElevated: '#FBFAF6',
    surface: '#FBFAF6',
    surfaceMuted: '#E6E1D3',
    primaryForeground: '#FFFFFF',
    primaryText: '#12201C',
    primaryLight: '#F3F0E8',
    primaryBorder: '#DAD4C4',
    goldText: '#12201C',
    goldLight: '#F3F0E8',
    goldBorder: '#DAD4C4',
    errorLight: '#FDF2F2',
    errorBorder: '#F5B8B5',
    errorText: '#B3261E',
    danger: '#B3261E',
    dangerSurface: '#FDF2F2',

    // Brand Blue & Hero Gradient (preserved for legacy views)
    brandBlue: '#1D4ED8',
    brandBlueDark: '#1E40AF',
    heroGradient: 'linear-gradient(135deg, #12201C 0%, #1D5F5B 100%)',
    heroOverlayGradient: 'linear-gradient(135deg, rgba(18, 32, 28, 0.72) 0%, rgba(29, 95, 91, 0.78) 100%)',
    bannerBlueDark: '#1E40AF',
    bannerBlueBorder: 'rgba(255, 255, 255, 0.15)',
    bannerBlueText: '#FFFFFF',
    bannerBlueTextMuted: '#DBEAFE',
    bannerBlueTag: '#93C5FD',
    bannerBlueIcon: '#BFDBFE',
    bannerBluePillBg: 'rgba(255, 255, 255, 0.18)',
    bannerBluePillBorder: 'rgba(255, 255, 255, 0.28)',
    bannerBlueDot: 'rgba(255, 255, 255, 0.6)',

    // Desktop Navigation Sidebar (legacy tokens preserved)
    sidebarBackground: '#0B0F0E',
    sidebarBorder: '#1F2426',
    sidebarText: '#FFFFFF',
    sidebarTextMuted: '#9BA2A6',
    sidebarItemActiveBg: 'rgba(29, 78, 216, 0.12)',
    sidebarQuickActionBg: 'rgba(255, 255, 255, 0.06)',
    sidebarQuickActionBorder: '#25302C',

    // Hero Banner Media Overlays & Accents
    heroOverlay: 'rgba(18, 32, 28, 0.45)',
    heroTagBg: 'rgba(213, 242, 59, 0.15)',
    heroTagBorder: 'rgba(213, 242, 59, 0.35)',
    heroPillBg: 'rgba(255, 255, 255, 0.12)',
    heroPillBorder: 'rgba(255, 255, 255, 0.2)',
    heroTextMuted: '#C9D3CC',

    // Surface Containers & Badges
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

    // Semantic UI Tokens
    slotFilledBg: '#F3F0E8',
    slotFilledBorder: '#DAD4C4',
    slotEmptyBorder: '#DAD4C4',
    slotEmptyBg: '#FBFAF6',
    slotEmptyIcon: '#5A655F',
    dayPickerActiveBg: '#12201C',
    dayPickerActiveText: '#F3F0E8',
    dayPickerInactiveBg: '#FBFAF6',
    dayPickerInactiveBorder: '#DAD4C4',
    dayPickerInactiveText: '#5A655F',
    dayPickerInactiveSub: '#5A655F',
    quickActionBlueBg: '#FBFAF6',
    quickActionGreenBg: '#FBFAF6',
    quickActionGoldBg: '#FBFAF6',
    quickActionPurpleBg: '#FBFAF6',
    quickActionPurpleText: '#12201C',
    whatsapp: '#25D366',
    whatsappDark: '#128C7E',

    // Courtside Live Scoring Dark Theme
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
    hero: 28, // Hero/large cards
    cardLg: 28,
    tile: 22, // Quick action tiles
    card: 20, // Small cards / standard cards
    statTile: 16, // Stat tiles
    button: 999, // Buttons
    chip: 999, // Chips
    pill: 999, // Nav pills
    xs: 4,
    sm: 8,
    input: 12,
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
    minTarget: 48,
    minStepper: 64,
  },
  accessibility: ACCESSIBILITY_TOKENS,
  motion: {
    duration: MOTION_DURATIONS,
    easing: MOTION_EASINGS,
  },
  momo: MOMO_RAILS,
  fontSize: {
    badge: 9,
    xxs: 10,
    xs: 12,
    sm: 14,
    base: 15, // 15px base as specified in prompt
    lg: 18,
    xl: 20,
    xxl: 24,
    displayMobile: 32, // 32px mobile display title
    display: 36,
    displayLg: 48, // 48px desktop display title
    displayXl: 72, // 72px desktop big rating value
  },
  lineHeight: {
    badge: 11,
    xxs: 14,
    xs: 16,
    sm: 20,
    base: 22,
    lg: 26,
    xl: 28,
    xxl: 32,
    displayMobile: 36,
    display: 40,
    displayLg: 52,
    displayXl: 76,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  fontFamily: {
    display: Platform.select({
      web: "'Bricolage Grotesque', 'Satoshi', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      ios: 'Bricolage Grotesque, Satoshi-Bold',
      android: 'Bricolage Grotesque, Satoshi-Bold',
      default: 'Bricolage Grotesque, Satoshi-Bold',
    }),
    body: Platform.select({
      web: "'DM Sans', 'Figtree', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      ios: 'DM Sans, Figtree-Regular',
      android: 'DM Sans, Figtree-Regular',
      default: 'DM Sans, Figtree-Regular',
    }),
    regular: Platform.select({
      web: "'DM Sans', 'Figtree', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      ios: 'DM Sans, Figtree-Regular',
      android: 'DM Sans, Figtree-Regular',
      default: 'DM Sans, Figtree-Regular',
    }),
    medium: Platform.select({
      web: "'DM Sans', 'Figtree', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      ios: 'DM Sans, Figtree-Medium',
      android: 'DM Sans, Figtree-Medium',
      default: 'DM Sans, Figtree-Medium',
    }),
    semibold: Platform.select({
      web: "'DM Sans', 'Figtree', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      ios: 'DM Sans, Figtree-SemiBold',
      android: 'DM Sans, Figtree-SemiBold',
      default: 'DM Sans, Figtree-SemiBold',
    }),
    bold: Platform.select({
      web: "'Bricolage Grotesque', 'Satoshi', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      ios: 'Bricolage Grotesque, Satoshi-Bold',
      android: 'Bricolage Grotesque, Satoshi-Bold',
      default: 'Bricolage Grotesque, Satoshi-Bold',
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
  uppercaseEyebrow: {
    fontFamily: Tokens.fontFamily.semibold,
    fontSize: Tokens.fontSize.xs,
    lineHeight: Tokens.lineHeight.xs,
    fontWeight: Tokens.fontWeight.semibold,
    letterSpacing: 1.0,
  } as TextStyle,
  displayXl: {
    fontFamily: Tokens.fontFamily.display,
    fontSize: Tokens.fontSize.displayXl,
    lineHeight: Tokens.lineHeight.displayXl,
    fontWeight: Tokens.fontWeight.bold,
    letterSpacing: -1.4,
  } as TextStyle,
  displayLg: {
    fontFamily: Tokens.fontFamily.display,
    fontSize: Tokens.fontSize.displayLg,
    lineHeight: Tokens.lineHeight.displayLg,
    fontWeight: Tokens.fontWeight.bold,
    letterSpacing: -0.96,
  } as TextStyle,
  displayLgMobile: {
    fontFamily: Tokens.fontFamily.display,
    fontSize: Tokens.fontSize.displayMobile,
    lineHeight: Tokens.lineHeight.displayMobile,
    fontWeight: Tokens.fontWeight.bold,
    letterSpacing: -0.64,
  } as TextStyle,
  headlineLg: {
    fontFamily: Tokens.fontFamily.display,
    fontSize: Tokens.fontSize.xxl,
    lineHeight: Tokens.lineHeight.xxl,
    fontWeight: Tokens.fontWeight.bold,
    letterSpacing: -0.36,
  } as TextStyle,
  headlineMd: {
    fontFamily: Tokens.fontFamily.display,
    fontSize: Tokens.fontSize.xl,
    lineHeight: Tokens.lineHeight.xl,
    fontWeight: Tokens.fontWeight.semibold,
    letterSpacing: -0.2,
  } as TextStyle,
  headlineSm: {
    fontFamily: Tokens.fontFamily.display,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    fontWeight: Tokens.fontWeight.semibold,
    letterSpacing: -0.08,
  } as TextStyle,
  bodyLg: {
    fontFamily: Tokens.fontFamily.body,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
    fontWeight: Tokens.fontWeight.regular,
  } as TextStyle,
  bodyMd: {
    fontFamily: Tokens.fontFamily.body,
    fontSize: Tokens.fontSize.sm,
    lineHeight: Tokens.lineHeight.sm,
    fontWeight: Tokens.fontWeight.regular,
  } as TextStyle,
  bodySm: {
    fontFamily: Tokens.fontFamily.body,
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
    context: 'White text on brand blue primary CTA buttons',
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
