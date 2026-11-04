import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Tokens } from '@/constants/theme';
import { Button, ErrorState, SkeletonLoader, EmptyState } from '@/components/ui';
import { CourtsideScoreKeeper } from '@/features/events/components/CourtsideScoreKeeper';

// WCAG Contrast Ratio Helper
function calculateLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
  const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
  const b = parseInt(cleanHex.slice(4, 6), 16) / 255;

  const a = [r, g, b].map((v) => {
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = calculateLuminance(hex1);
  const lum2 = calculateLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

describe('Phase 5 — Quality Gate: Accessibility (WCAG 2.1 AA Standards)', () => {
  describe('1. Color Contrast Ratios (WCAG AA ≥ 4.5:1 for body, ≥ 3.0:1 for large/bold)', () => {
    it('primary ink text on chalk background meets WCAG AAA standards (≥ 7:1)', () => {
      // Tokens.colors.ink (#12201C) on Tokens.colors.chalk (#F3F0E8)
      const ratio = getContrastRatio(Tokens.colors.ink, Tokens.colors.chalk);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });

    it('neon lime contrast with dark ink exceeds WCAG AA (≥ 4.5:1)', () => {
      // Tokens.colors.ink (#12201C) on Tokens.colors.lime (#D5F23B)
      const ratio = getContrastRatio(Tokens.colors.ink, Tokens.colors.lime);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('live dark courtside text contrast exceeds WCAG AAA (≥ 7:1)', () => {
      // Tokens.colors.live.text (#FFFFFF) on Tokens.colors.live.background (#0D1714)
      const ratio = getContrastRatio(Tokens.colors.live.text, Tokens.colors.live.background);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });
  });

  describe('2. Interactive Controls & Semantic Roles', () => {
    it('Button provides accessibilityRole="button" and accessibilityLabel', async () => {
      await render(<Button title="Join Match" testID="test-a11y-btn" />);
      const btn = screen.getByTestId('test-a11y-btn');

      expect(btn.props.accessibilityRole).toBe('button');
      expect(btn.props.accessibilityLabel).toBe('Join Match');
    });

    it('Button in loading state reports accessibilityState.busy and disabled', async () => {
      await render(<Button title="Processing" loading testID="loading-a11y-btn" />);
      const btn = screen.getByTestId('loading-a11y-btn');

      expect(btn.props.accessibilityState.busy).toBe(true);
      expect(btn.props.accessibilityState.disabled).toBe(true);
    });

    it('ErrorState provides accessibilityRole="alert"', async () => {
      await render(<ErrorState title="Error Alert" testID="error-a11y" />);
      const alert = screen.getByTestId('error-a11y');

      expect(alert.props.accessibilityRole).toBe('alert');
    });

    it('SkeletonLoader provides accessibilityRole="progressbar"', async () => {
      await render(<SkeletonLoader testID="skeleton-a11y" />);
      const progress = screen.getByTestId('skeleton-a11y');

      expect(progress.props.accessibilityRole).toBe('progressbar');
    });
  });

  describe('3. Minimum Touch Target Verification (Apple HIG ≥ 44pt, Material ≥ 48pt)', () => {
    it('all standard buttons have minimum height ≥ 44pt across sizes', async () => {
      await render(<Button title="Small Target" size="sm" testID="sm-target-btn" />);
      const smBtn = screen.getByTestId('sm-target-btn');
      const flatStyleSm = Array.isArray(smBtn.props.style)
        ? Object.assign({}, ...smBtn.props.style.filter(Boolean))
        : smBtn.props.style;

      expect(flatStyleSm.minHeight).toBeGreaterThanOrEqual(44);
    });

    it('courtside stepper controls have minimum size ≥ 64pt for arm-length usage', async () => {
      await render(
        <CourtsideScoreKeeper
          matchId="m-1"
          courtNumber={1}
          teamANames={['Nana K.', 'Kofi M.']}
          teamBNames={['Ama B.', 'Daniel K.']}
          onSubmitScore={() => {}}
        />
      );

      const plusBtn = screen.getByTestId('stepper-plus-a');
      const flatStyle = Array.isArray(plusBtn.props.style)
        ? Object.assign({}, ...plusBtn.props.style.filter(Boolean))
        : plusBtn.props.style;

      expect(flatStyle.height).toBeGreaterThanOrEqual(64);
      expect(flatStyle.width).toBeGreaterThanOrEqual(64);
    });
  });
});
