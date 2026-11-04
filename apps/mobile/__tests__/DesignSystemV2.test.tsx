import React from 'react';
import fs from 'fs';
import path from 'path';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Tokens, Typography } from '@/constants/theme';
import {
  PLAYTOMIC_RATING_SCALE,
  getPlaytomicBand,
  MOMO_RAILS,
} from '@/constants/designSystem';
import { Button, ErrorState, SkeletonLoader, RatingBand } from '@/components/ui';

describe('Phase 2 — Design System Spec v2 & Token Architecture', () => {
  describe('1. Documentation Specification (docs/design-system.md)', () => {
    const docPath = path.resolve(__dirname, '../../../docs/design-system.md');

    it('docs/design-system.md must exist', () => {
      expect(fs.existsSync(docPath)).toBe(true);
    });

    it('contains all required design-system sections', () => {
      const content = fs.readFileSync(docPath, 'utf8');
      expect(content).toContain('Design System Specification v2');
      expect(content).toContain('4-Point Spacing Grid');
      expect(content).toContain('Typography & Dynamic Type');
      expect(content).toContain('0.0–7.0 Playtomic Rating Scale');
      expect(content).toContain('Ghana Mobile Money Rails');
      expect(content).toContain('Motion Tokens & Reduced Motion');
      expect(content).toContain('Component States & Touch Target Minimums');
    });
  });

  describe('2. 4-pt Spacing Grid & Accessibility Tokens', () => {
    it('spacing values are divisible by 4 (4-pt grid)', () => {
      expect(Tokens.spacing.xs).toBe(4);
      expect(Tokens.spacing.sm).toBe(8);
      expect(Tokens.spacing.md).toBe(12);
      expect(Tokens.spacing.base).toBe(16);
      expect(Tokens.spacing.lg).toBe(20);
      expect(Tokens.spacing.xl).toBe(24);
      expect(Tokens.spacing.xxl).toBe(32);
      expect(Tokens.spacing.xxxl).toBe(48);

      Object.values(Tokens.spacing).forEach((val) => {
        expect(val % 4).toBe(0);
      });
    });

    it('accessibility tokens enforce minimum touch target (≥44pt) and max font multiplier', () => {
      expect(Tokens.accessibility).toBeDefined();
      expect(Tokens.accessibility.minTouchTarget).toBeGreaterThanOrEqual(44);
      expect(Tokens.accessibility.maxFontSizeMultiplier).toBe(1.35);
    });
  });

  describe('3. Motion Tokens', () => {
    it('defines standard duration tokens and easing curves', () => {
      expect(Tokens.motion).toBeDefined();
      expect(Tokens.motion.duration.instant).toBe(100);
      expect(Tokens.motion.duration.fast).toBe(200);
      expect(Tokens.motion.duration.normal).toBe(300);
      expect(Tokens.motion.duration.slow).toBe(500);

      expect(Tokens.motion.easing.standard).toBeDefined();
      expect(Tokens.motion.easing.decelerate).toBeDefined();
      expect(Tokens.motion.easing.accelerate).toBeDefined();
    });
  });

  describe('4. Ghana Mobile Money Rails (MTN MoMo, Telecel, AT Money)', () => {
    it('contains brand tokens for all three Ghana MoMo providers', () => {
      expect(MOMO_RAILS.mtn).toBeDefined();
      expect(MOMO_RAILS.mtn.brandColor).toBe('#FFCC00');
      expect(MOMO_RAILS.mtn.textColor).toBe('#000000');
      expect(MOMO_RAILS.mtn.id).toBe('mtn');

      expect(MOMO_RAILS.telecel).toBeDefined();
      expect(MOMO_RAILS.telecel.brandColor).toBe('#E60000');
      expect(MOMO_RAILS.telecel.textColor).toBe('#FFFFFF');
      expect(MOMO_RAILS.telecel.id).toBe('telecel');

      expect(MOMO_RAILS.at).toBeDefined();
      expect(MOMO_RAILS.at.brandColor).toBe('#0055A5');
      expect(MOMO_RAILS.at.textColor).toBe('#FFFFFF');
      expect(MOMO_RAILS.at.id).toBe('at');
    });

    it('is linked directly under Tokens.momo in theme.ts', () => {
      expect(Tokens.momo).toBeDefined();
      expect(Tokens.momo.mtn.brandColor).toBe('#FFCC00');
      expect(Tokens.momo.telecel.brandColor).toBe('#E60000');
      expect(Tokens.momo.at.brandColor).toBe('#0055A5');
    });
  });

  describe('5. 0.0–7.0 Playtomic-Style Rating Scale', () => {
    it('defines scale boundaries from 0.0 to 7.0', () => {
      expect(PLAYTOMIC_RATING_SCALE.min).toBe(0.0);
      expect(PLAYTOMIC_RATING_SCALE.max).toBe(7.0);
      expect(PLAYTOMIC_RATING_SCALE.tiers).toHaveLength(4);
    });

    it('correctly maps rating to tier name, key, and badge styling', () => {
      const beginner = getPlaytomicBand(1.25);
      expect(beginner.tier).toBe('beginner');
      expect(beginner.labelKey).toBe('ratingTierBeginner');

      const intermediate = getPlaytomicBand(3.15);
      expect(intermediate.tier).toBe('intermediate');
      expect(intermediate.labelKey).toBe('ratingTierIntermediate');

      const advanced = getPlaytomicBand(4.8);
      expect(advanced.tier).toBe('advanced');
      expect(advanced.labelKey).toBe('ratingTierAdvanced');

      const pro = getPlaytomicBand(6.3);
      expect(pro.tier).toBe('pro');
      expect(pro.labelKey).toBe('ratingTierPro');
    });

    it('clamps ratings below 0.0 and above 7.0 gracefully', () => {
      const low = getPlaytomicBand(-1);
      expect(low.tier).toBe('beginner');

      const high = getPlaytomicBand(8.5);
      expect(high.tier).toBe('pro');
    });
  });

  describe('6. Component States & UI Primitives', () => {
    it('Button supports loading state with activity indicator and blocks presses', async () => {
      const onPress = jest.fn();
      await render(
        <Button title="Book Session" onPress={onPress} loading testID="test-btn" />
      );

      expect(screen.getByTestId('test-btn-spinner')).toBeTruthy();
      expect(screen.queryByText('Book Session')).toBeNull();

      fireEvent.press(screen.getByTestId('test-btn'));
      expect(onPress).not.toHaveBeenCalled();
    });

    it('Button size sm respects minimum Apple touch target (44pt)', async () => {
      await render(
        <Button title="Join" size="sm" testID="small-btn" />
      );
      const button = screen.getByTestId('small-btn');
      // style array contains sizeSm with minHeight 44
      const flatStyle = Array.isArray(button.props.style)
        ? Object.assign({}, ...button.props.style.filter(Boolean))
        : button.props.style;
      expect(flatStyle.minHeight).toBeGreaterThanOrEqual(44);
    });

    it('ErrorState renders alert role, message, and executes retry callback', async () => {
      const onRetry = jest.fn();
      await render(
        <ErrorState
          title="Network Connection Failed"
          message="Could not reach Accra Padel servers."
          onRetry={onRetry}
          testID="custom-error"
        />
      );

      expect(screen.getByText('Network Connection Failed')).toBeTruthy();
      expect(screen.getByText('Could not reach Accra Padel servers.')).toBeTruthy();

      fireEvent.press(screen.getByTestId('custom-error-retry-btn'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('SkeletonLoader renders progressbar role with geometry props', async () => {
      await render(
        <SkeletonLoader width={120} height={24} testID="custom-skeleton" />
      );

      const skeleton = screen.getByTestId('custom-skeleton');
      expect(skeleton.props.accessibilityRole).toBe('progressbar');
      const flatStyle = Array.isArray(skeleton.props.style)
        ? Object.assign({}, ...skeleton.props.style.filter(Boolean))
        : skeleton.props.style;
      expect(flatStyle.width).toBe(120);
      expect(flatStyle.height).toBe(24);
    });

    it('RatingBand displays Playtomic tier badge and 0.0 - 7.0 scale bounds', async () => {
      await render(<RatingBand currentRating={4.35} />);

      // Tier badge for 4.35 should show Advanced
      expect(screen.getByText('Advanced')).toBeTruthy();
      expect(screen.getByText('0.0')).toBeTruthy();
      expect(screen.getByText('7.0')).toBeTruthy();
      expect(screen.getByText('4.35')).toBeTruthy();
    });
  });
});
