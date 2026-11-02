import { Tokens, Typography } from '@/constants/theme';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

function getLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function computeContrast(fg: string, bg: string): number {
  const l1 = getLuminance(fg);
  const l2 = getLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

describe('Court Chalk Design System - Phase 1 Foundation', () => {
  describe('Tokens Specification', () => {
    it('defines all required Court Chalk palette color tokens', () => {
      const c = Tokens.colors as any;
      expect(c.chalk).toBe('#F3F0E8');
      expect(c.card).toBe('#FBFAF6');
      expect(c.line).toBe('#DAD4C4');
      expect(c.track).toBe('#E6E1D3');
      expect(c.ink).toBe('#12201C');
      expect(c.inkSoft).toBe('#2F4239');
      expect(c.muted).toBe('#5A655F');
      expect(c.onInk).toBe('#F3F0E8');
      expect(c.onInkMuted).toBe('#C9D3CC');
      expect(c.lime).toBe('#D5F23B');
      expect(c.court).toBe('#1D5F5B');
    });

    it('defines Court Chalk radii: 28, 22, 20, 16, 999', () => {
      expect(Tokens.radii.hero).toBe(28);
      expect(Tokens.radii.tile).toBe(22);
      expect(Tokens.radii.card).toBe(20);
      expect(Tokens.radii.statTile).toBe(16);
      expect(Tokens.radii.pill).toBe(999);
      expect(Tokens.radii.button).toBe(999);
      expect(Tokens.radii.chip).toBe(999);
    });
  });

  describe('Typography Specification', () => {
    it('includes Bricolage Grotesque in display fonts', () => {
      expect(Tokens.fontFamily.display).toContain('Bricolage Grotesque');
    });

    it('includes DM Sans in body fonts', () => {
      expect(Tokens.fontFamily.body).toContain('DM Sans');
    });

    it('exposes uppercase eyebrow and big display typography presets', () => {
      expect(Typography.uppercaseEyebrow).toBeDefined();
      expect(Typography.displayXl).toBeDefined();
    });
  });

  describe('WCAG AA & AAA Contrast Compliance', () => {
    it('ink text on lime background exceeds AAA (>= 7:1)', () => {
      const ratio = computeContrast(Tokens.colors.ink, Tokens.colors.lime);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });

    it('chalk text on ink background exceeds AAA (>= 7:1)', () => {
      const ratio = computeContrast(Tokens.colors.onInk, Tokens.colors.ink);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });

    it('onInkMuted text on ink background exceeds AAA (>= 7:1)', () => {
      const ratio = computeContrast(Tokens.colors.onInkMuted, Tokens.colors.ink);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });

    it('muted text on chalk background passes AA (>= 4.5:1)', () => {
      const ratio = computeContrast(Tokens.colors.muted, Tokens.colors.chalk);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('Shared Court Chalk UI Components', () => {
    it('exports all Phase 1 shared components from @/components/ui', () => {
      const UI = require('@/components/ui');
      expect(UI.Button).toBeDefined();
      expect(UI.StatusChip).toBeDefined();
      expect(UI.ProgressSegments).toBeDefined();
      expect(UI.PlayerAvatar).toBeDefined();
      expect(UI.CourtSeatDiagram).toBeDefined();
      expect(UI.RatingBand).toBeDefined();
      expect(UI.CreditBlock).toBeDefined();
      expect(UI.QuickActionTile).toBeDefined();
      expect(UI.Card).toBeDefined();
    });
  });
});
