import '@/global.css';
import { Platform } from 'react-native';

export const PadelBrand = {
  charcoal: '#0B0F0E',
  electricGreen: '#00C853',
  gold: '#F4C430',
  offWhite: '#F7F7F5',
  cardDark: '#161C1A',
  borderDark: '#25302C',
} as const;

export const Colors = {
  light: {
    text: '#0B0F0E',
    background: '#F7F7F5',
    backgroundElement: '#EBEBE8',
    backgroundSelected: '#00C853',
    textSecondary: '#60646C',
    primary: '#00C853',
    card: '#FFFFFF',
    border: '#E2E8F0',
    gold: '#F4C430',
  },
  dark: {
    text: '#F7F7F5',
    background: '#0B0F0E',
    backgroundElement: '#161C1A',
    backgroundSelected: '#00C853',
    textSecondary: '#94A3B8',
    primary: '#00C853',
    card: '#161C1A',
    border: '#25302C',
    gold: '#F4C430',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
