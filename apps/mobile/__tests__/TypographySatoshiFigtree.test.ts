import fs from 'fs';
import path from 'path';
import { Tokens, Typography } from '@/constants/theme';

describe('Satoshi and Figtree Typography Design System', () => {
  const FONTS_DIR = path.resolve(__dirname, '../assets/fonts');

  it('contains all required Satoshi font asset files on disk', () => {
    const requiredSatoshiFonts = [
      'Satoshi-Regular.ttf',
      'Satoshi-Medium.ttf',
      'Satoshi-Bold.ttf',
    ];

    for (const fontFile of requiredSatoshiFonts) {
      const fullPath = path.join(FONTS_DIR, fontFile);
      expect(fs.existsSync(fullPath)).toBe(true);
      const stat = fs.statSync(fullPath);
      expect(stat.size).toBeGreaterThan(1000); // Valid font file
    }
  });

  it('contains all required Figtree font asset files on disk', () => {
    const requiredFigtreeFonts = [
      'Figtree-Regular.ttf',
      'Figtree-Medium.ttf',
      'Figtree-SemiBold.ttf',
    ];

    for (const fontFile of requiredFigtreeFonts) {
      const fullPath = path.join(FONTS_DIR, fontFile);
      expect(fs.existsSync(fullPath)).toBe(true);
      const stat = fs.statSync(fullPath);
      expect(stat.size).toBeGreaterThan(1000); // Valid font file
    }
  });

  it('exposes Satoshi for display and brand typography tokens', () => {
    expect(Tokens.fontFamily.display).toBeDefined();
    expect(Tokens.fontFamily.display).toContain('Satoshi');
  });

  it('exposes Figtree for body and data UI typography tokens', () => {
    expect(Tokens.fontFamily.body).toBeDefined();
    expect(Tokens.fontFamily.body).toContain('Figtree');
  });

  it('maps Typography presets to the appropriate pairing', () => {
    // Headlines and display use Satoshi
    expect(Typography.displayLg.fontFamily).toContain('Satoshi');
    expect(Typography.displayLgMobile.fontFamily).toContain('Satoshi');
    expect(Typography.headlineLg.fontFamily).toContain('Satoshi');

    // Body and captions use Figtree
    expect(Typography.bodyLg.fontFamily).toContain('Figtree');
    expect(Typography.bodyMd.fontFamily).toContain('Figtree');
    expect(Typography.bodySm.fontFamily).toContain('Figtree');
  });

  it('preserves tabular-nums for match scores, ratings, and money formatting', () => {
    expect(Typography.tabularNums).toBeDefined();
    expect(Typography.tabularNums.fontVariant).toEqual(['tabular-nums']);
  });
});
