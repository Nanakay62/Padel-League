import fs from 'fs';
import path from 'path';
import { TokenContrastPairs, Tokens } from '../src/constants/theme';

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

export function computeContrastRatio(fgHex: string, bgHex: string): number {
  const l1 = getLuminance(fgHex);
  const l2 = getLuminance(bgHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

describe('Design Tokens Contrast & WCAG 2.1 Compliance', () => {
  it('all token pairs must pass WCAG AA (>= 4.5:1) for body/ui text', () => {
    for (const pair of TokenContrastPairs) {
      const ratio = computeContrastRatio(pair.foreground, pair.background);
      const minRequired = pair.minRatio ?? 4.5;
      expect(ratio).toBeGreaterThanOrEqual(minRequired);
    }
  });

  it('verifies forbidden combinations fail WCAG AA (confirming why they are banned)', () => {
    // White on primary electric green (#00C853) fails badly
    const whiteOnGreen = computeContrastRatio('#FFFFFF', Tokens.colors.primary);
    expect(whiteOnGreen).toBeLessThan(4.5);

    // White on gold (#F4C430) fails badly
    const whiteOnGold = computeContrastRatio('#FFFFFF', Tokens.colors.gold);
    expect(whiteOnGold).toBeLessThan(4.5);
  });

  it('generates docs/design-tokens.md with calculated contrast ratios table', () => {
    const tableRows = TokenContrastPairs.map((pair) => {
      const ratio = computeContrastRatio(pair.foreground, pair.background);
      const compliance = ratio >= 7 ? 'AAA Pass' : ratio >= 4.5 ? 'AA Pass' : 'FAIL';
      return `| **${pair.name}** | \`${pair.foreground}\` | \`${pair.background}\` | **${ratio.toFixed(2)} : 1** | **${compliance}** | ${pair.context} |`;
    });

    const forbiddenRows = [
      {
        name: 'White on Electric Green',
        fg: '#FFFFFF',
        bg: Tokens.colors.primary,
        reason: '❌ FORBIDDEN. Green fill must always take charcoal `#14181A` text.',
      },
      {
        name: 'White on Gold',
        fg: '#FFFFFF',
        bg: Tokens.colors.gold,
        reason: '❌ FORBIDDEN. Gold fill must always take charcoal `#14181A` text.',
      },
      {
        name: 'Electric Green on White Card',
        fg: Tokens.colors.primary,
        bg: Tokens.colors.card,
        reason: '❌ FORBIDDEN. For green text on white, use accessible `#007A33`.',
      },
    ].map((f) => {
      const ratio = computeContrastRatio(f.fg, f.bg);
      return `| ~~${f.name}~~ | \`${f.fg}\` | \`${f.bg}\` | **${ratio.toFixed(2)} : 1** | **FAIL** | ${f.reason} |`;
    });

    const docContent = `# Padel Ghana Platform — Design Tokens & Accessibility Specification

This document is automatically generated and verified by \`__tests__/TokensContrast.test.ts\`.
All color pairs are tested against WCAG 2.1 relative luminance algorithms. Hand-typed ratios are forbidden.

---

## 1. Mica Color Palette

| Token | Hex | Role |
|---|---|---|
| \`Tokens.colors.background\` | \`${Tokens.colors.background}\` | Warm off-white app background |
| \`Tokens.colors.card\` | \`${Tokens.colors.card}\` | White cards & sheets |
| \`Tokens.colors.border\` | \`${Tokens.colors.border}\` | Subtle 1px dividers and borders |
| \`Tokens.colors.text\` | \`${Tokens.colors.text}\` | High-contrast charcoal primary text |
| \`Tokens.colors.textMuted\` | \`${Tokens.colors.textMuted}\` | Muted secondary text & metadata |
| \`Tokens.colors.primary\` | \`${Tokens.colors.primary}\` | Primary button fill & active tab highlight ONLY |
| \`Tokens.colors.textOnPrimary\` | \`${Tokens.colors.textOnPrimary}\` | Charcoal text on primary button fill |
| \`Tokens.colors.greenText\` | \`${Tokens.colors.greenText}\` | Accessible forest green for text on white/off-white |
| \`Tokens.colors.gold\` | \`${Tokens.colors.gold}\` | Rankings and achievement badges |
| \`Tokens.colors.danger\` | \`${Tokens.colors.danger}\` | Destructive actions & error alerts |
| \`Tokens.colors.live.background\` | \`${Tokens.colors.live.background}\` | Dark background strictly for live scoring |
| \`Tokens.colors.live.card\` | \`${Tokens.colors.live.card}\` | Dark card strictly for live scoring |
| \`Tokens.colors.live.text\` | \`${Tokens.colors.live.text}\` | Light text strictly for live scoring |
| \`Tokens.colors.live.textMuted\` | \`${Tokens.colors.live.textMuted}\` | Muted text strictly for live scoring |

---

## 2. Verified Accessible Text/Surface Contrast Table (WCAG 2.1)

All active text/surface pairs achieve at least 4.5:1 (WCAG AA).

| Token Pair | Foreground | Background | Contrast Ratio | Compliance | Intended Usage |
|---|---|---|---|---|---|
${tableRows.join('\n')}

---

## 3. Forbidden High-Risk Combinations (Banned)

These combinations fail WCAG 2.1 AA and are strictly forbidden in code:

| Forbidden Pair | Foreground | Background | Contrast Ratio | Result | Enforcement Rule |
|---|---|---|---|---|---|
${forbiddenRows.join('\n')}

---

## 4. Typography, Touch Targets & Theme Boundaries

1. **Font Family**: Inter only (\`InterVariable.woff2\` on web, static \`Inter-Regular.ttf\`, \`Inter-Medium.ttf\`, \`Inter-SemiBold.ttf\` on native).
2. **Font Weights**: 400 (\`regular\`), 500 (\`medium\`), 600 (\`semibold\`). Heavy weights (800, 900) are forbidden.
3. **Tabular Numerals**: Tabular figures (\`fontVariant: ['tabular-nums']\`) must be used for prices, match scores, and leaderboard ranks.
4. **Ghana Cedi Sign**: Cedi sign (\`₵\`, \`U+20B5\`) is verified in the font subset and formatted via \`formatGhanaCedis()\`.
5. **Touch Targets**: Minimum 44 px height for Button, Chip, and ListRow; minimum 64 px for Courtside Live score steppers.
6. **No Button Arrows**: Buttons never include trailing arrows (\`→\`, \`←\`).
7. **Theme Boundaries**: Dark theme is STRICTLY isolated to Courtside Live (\`/events/[id]/live\`). All other screens use light mica.
`;

    const docPath = path.resolve(__dirname, '../../../docs/design-tokens.md');
    fs.mkdirSync(path.dirname(docPath), { recursive: true });
    fs.writeFileSync(docPath, docContent, 'utf-8');
    expect(fs.existsSync(docPath)).toBe(true);
  });
});
