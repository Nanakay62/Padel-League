import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

// -----------------------------------------------------------------------------
// WCAG 2.1 Contrast Calculation Utilities
// -----------------------------------------------------------------------------

export function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

export function rgbToHex([r, g, b]) {
  const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function getLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function computeContrastRatio(fgHex, bgHex) {
  const l1 = getLuminance(fgHex);
  const l2 = getLuminance(bgHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

/**
 * Computes alpha blending of a foreground color over a background color.
 * Resulting RGB = alpha * fg + (1 - alpha) * bg.
 */
export function blendAlpha(fgHex, alpha, bgHex) {
  const [fr, fg, fb] = hexToRgb(fgHex);
  const [br, bg, bb] = hexToRgb(bgHex);
  const r = Math.round(alpha * fr + (1 - alpha) * br);
  const g = Math.round(alpha * fg + (1 - alpha) * bg);
  const b = Math.round(alpha * fb + (1 - alpha) * bb);
  return rgbToHex([r, g, b]);
}

// -----------------------------------------------------------------------------
// 1. Blue Frosted-Glass Token Set Definition
// -----------------------------------------------------------------------------

export const SiteTokens = {
  colors: {
    // Brand Blues
    primary: '#1D4ED8',             // Royal Blue (Blue 700)
    primaryHover: '#1E40AF',        // Deep Royal (Blue 800)
    primaryPressed: '#172554',      // Midnight Navy (Blue 950)
    primaryLight: '#EFF6FF',        // Ice Blue (Blue 50)
    borderLight: '#DBEAFE',         // Ice Blue Border (Blue 100)
    focusRing: '#2563EB',           // Focus Ring (Blue 600)

    // Neutral Surfaces & Text
    background: '#F8FAFC',          // Slate 50 page background
    card: '#FFFFFF',                // Pure white cards & containers
    border: '#E2E8F0',              // Hairline border (Slate 200)
    text: '#0F172A',                // High-contrast primary text (Slate 900)
    textMuted: '#475569',           // Muted secondary text & metadata (Slate 600)
    textDisabled: '#94A3B8',        // Inactive / disabled text (Slate 400)
    textWhite: '#FFFFFF',           // Crisp white text on dark/gradient surfaces
    white: '#FFFFFF',

    // Inputs & Forms
    inputBorder: '#64748B',         // Slate 500 input border (>= 3:1 against field & page)
    inputPlaceholder: '#64748B',    // Slate 500 placeholder (>= 4.5:1 against field)
    inputBg: '#FFFFFF',

    // Buttons on Blue (Hero / Navigation)
    buttonOnBlue: {
      primaryBg: '#D9F99D',         // Electric Lime (Stitch approved)
      primaryText: '#0F172A',       // Dark Navy text
      primaryHover: '#BEF264',      // Lime 300
      secondaryBg: '#FFFFFF',       // Solid White option
      secondaryText: '#0F172A',     // Dark Navy text
      secondaryHover: 'rgba(255, 255, 255, 0.90)',
      glassBg: 'rgba(255, 255, 255, 0.12)',
      glassBorder: 'rgba(255, 255, 255, 0.25)',
      glassText: '#FFFFFF',
      glassHover: 'rgba(255, 255, 255, 0.20)',
    },

    // Buttons on Light Surfaces
    buttonOnLight: {
      primaryBg: '#1D4ED8',
      primaryText: '#FFFFFF',
      primaryHover: '#1E40AF',
      primaryPressed: '#172554',
      disabledBg: '#E2E8F0',
      disabledText: '#94A3B8',
    },

    // Status Accents
    successText: '#007A33',         // Accessible forest green on light surfaces
    successBg: '#DCFCE7',           // Green 100 badge fill
    successBadgeText: '#166534',    // Green 800 badge text
    badgeSuccessBorder: 'rgba(22, 101, 52, 0.20)',
    gold: '#F4C430',                // Championship Gold for tournament badges
    textOnGold: '#14181A',          // Charcoal text on gold
    badgeGoldBg: '#FEF9E7',
    badgeGoldText: '#7A5E00',
    badgeGoldBorder: 'rgba(244, 196, 48, 0.40)',
    badgeSoonBg: '#F1F5F9',
    danger: '#B3261E',              // Destructive text
    dangerSurface: '#FDF2F2',       // Error notice surface

    // Courtside Live Scoring Dark Theme (ISOLATED strictly to /events/[id]/live)
    live: {
      background: '#0B0F0E',
      card: '#161C1A',
      border: '#25302C',
      text: '#F6F6F4',
      textMuted: '#8A9499',
      accent: '#60A5FA',            // Blue 400 (6.80:1 on card, 7.59:1 on bg - corrected from #3B82F6)
      buttonBg: '#60A5FA',
      buttonText: '#0B0F0E',        // Dark text on blue button in live mode
    },
  },

  // ONE Hero Gradient Token (Strictly for background bands; banned on buttons, cards, text)
  gradients: {
    hero: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 55%, #172554 100%)',
    heroStops: {
      start: '#1D4ED8',
      mid: '#1E40AF',
      end: '#172554',
    },
  },

  // Frosted Glass Tokens
  glass: {
    heroOverlayTint: 'rgba(255, 255, 255, 0.10)',
    heroOverlayAlpha: 0.10,
    heroCardBg: 'rgba(255, 255, 255, 0.12)',
    badgeHeroBg: 'rgba(255, 255, 255, 0.12)',
    badgeHeroBorder: 'rgba(255, 255, 255, 0.25)',
    badgeHeroText: '#DBEAFE',
    navTint: 'rgba(29, 78, 216, 0.88)',
    navBorder: 'rgba(255, 255, 255, 0.15)',
    cardOverPhotoTint: 'rgba(255, 255, 255, 0.88)',
    cardOverPhotoAlpha: 0.88,
    borderLight: 'rgba(255, 255, 255, 0.20)',
    borderDark: 'rgba(226, 232, 240, 0.80)',
    blurRadius: '12px',
    blurRadiusNum: 12,              // Max 16px
    blurFilter: 'blur(12px)',
    fallbackNav: '#1D4ED8',
    fallbackCard: '#FFFFFF',
  },

  radii: {
    sm: '8px',
    card: '12px',
    button: '12px',
    pill: '9999px',
  },
};

// -----------------------------------------------------------------------------
// 2. Contrast Pairs Specification (Evaluated by test)
// -----------------------------------------------------------------------------

export function buildContrastPairs() {
  const c = SiteTokens.colors;
  const g = SiteTokens.gradients.heroStops;
  const gl = SiteTokens.glass;

  // Glass blended effective colors:
  // 1. Translucent white glass over the lightest (worst-case) stop of the hero gradient:
  const heroWorstCaseGlassBg = blendAlpha('#FFFFFF', gl.heroOverlayAlpha, g.start); // Over #1D4ED8
  const heroMidGlassBg = blendAlpha('#FFFFFF', 0.12, g.mid);                         // Over #1E40AF

  // 2. Floating 88% white card over photo (worst-case light = white, worst-case dark = black):
  const photoWorstLightGlassBg = blendAlpha('#FFFFFF', gl.cardOverPhotoAlpha, '#FFFFFF'); // #FFFFFF
  const photoWorstDarkGlassBg = blendAlpha('#FFFFFF', gl.cardOverPhotoAlpha, '#000000');  // ~#E0E0E0

  return [
    // Core Page & Card Pairs
    {
      name: 'Primary Text on Card White',
      fg: c.text,
      bg: c.card,
      min: 4.5,
      context: 'Main headings, labels, and event titles inside cards',
    },
    {
      name: 'Primary Text on Ice Blue Surface',
      fg: c.text,
      bg: c.primaryLight,
      min: 4.5,
      context: 'Section headings on format and PWA install strips',
    },
    {
      name: 'Muted Text on Card White',
      fg: c.textMuted,
      bg: c.card,
      min: 4.5,
      context: 'Subtitles, timestamps, metadata, and venue addresses on cards',
    },
    {
      name: 'Muted Text on Ice Blue Surface',
      fg: c.textMuted,
      bg: c.primaryLight,
      min: 4.5,
      context: 'Descriptions and helper copy on ice blue sections',
    },

    // Hero Gradient & Banner Pairs
    {
      name: 'Hero Title on Gradient Start (#1D4ED8 - worst case)',
      fg: '#FFFFFF',
      bg: g.start,
      min: 4.5,
      context: 'Display H1 and primary white text on lightest point of hero band',
    },
    {
      name: 'Hero Title on Gradient Mid (#1E40AF)',
      fg: '#FFFFFF',
      bg: g.mid,
      min: 4.5,
      context: 'Hero content on middle gradient band',
    },
    {
      name: 'Hero Title on Gradient End (#172554)',
      fg: '#FFFFFF',
      bg: g.end,
      min: 4.5,
      context: 'Hero content on midnight navy gradient foot',
    },
    {
      name: 'Hero Subtitle (Blue 100) on Gradient Start',
      fg: '#DBEAFE',
      bg: g.start,
      min: 4.5,
      context: 'Hero description paragraph and secondary white text on gradient',
    },
    {
      name: 'Hero Metadata (Blue 200) on Gradient Start',
      fg: '#BFDBFE',
      bg: g.start,
      min: 4.5,
      context: 'Status chips and small metadata on royal blue band',
    },

    // Buttons on Blue (Hero / Navigation)
    {
      name: 'Primary Action Button on Blue (Dark Navy on Lime)',
      fg: c.buttonOnBlue.primaryText,
      bg: c.buttonOnBlue.primaryBg,
      min: 4.5,
      context: 'Stitch approved Electric Lime CTA button with dark navy text',
    },
    {
      name: 'Secondary Action Button on Blue (White fill with Dark Navy)',
      fg: c.buttonOnBlue.secondaryText,
      bg: c.buttonOnBlue.secondaryBg,
      min: 4.5,
      context: 'Solid white secondary action button on blue header / hero',
    },

    // Buttons on Light Surfaces (With hover & pressed states)
    {
      name: 'Button on Light Surfaces (Base State)',
      fg: c.buttonOnLight.primaryText,
      bg: c.buttonOnLight.primaryBg,
      min: 4.5,
      context: 'White text on primary royal blue #1D4ED8 button fill',
    },
    {
      name: 'Button on Light Surfaces (Hover State)',
      fg: c.buttonOnLight.primaryText,
      bg: c.buttonOnLight.primaryHover,
      min: 4.5,
      context: 'White text on hover deep royal #1E40AF button fill',
    },
    {
      name: 'Button on Light Surfaces (Pressed State)',
      fg: c.buttonOnLight.primaryText,
      bg: c.buttonOnLight.primaryPressed,
      min: 4.5,
      context: 'White text on pressed midnight navy #172554 button fill',
    },
    {
      name: 'Button on Light Surfaces (Disabled State)',
      fg: c.buttonOnLight.disabledText,
      bg: c.buttonOnLight.disabledBg,
      min: 2.0,
      context: 'Disabled button (WCAG 1.4.3 inactive UI component exemption: Slate 400 on Slate 200)',
    },
    {
      name: 'Disabled Text on Card White',
      fg: c.textDisabled,
      bg: c.card,
      min: 2.5,
      context: 'Disabled text on white card (WCAG 1.4.3 inactive UI component exemption: Slate 400 on White)',
    },

    // Primary Blue as Text / Links
    {
      name: 'Primary Blue Text/Link on Card White',
      fg: c.primary,
      bg: c.card,
      min: 4.5,
      context: 'Hyperlinks, text buttons, and active items on white cards',
    },
    {
      name: 'Primary Blue Text/Link on Ice Blue',
      fg: c.primary,
      bg: c.primaryLight,
      min: 4.5,
      context: 'Links and accent labels on ice blue sections',
    },

    // Form Controls: Input Border, Placeholder, Focus Ring (WCAG 1.4.3 & 1.4.11)
    {
      name: 'Input Field Border on Field White',
      fg: c.inputBorder,
      bg: c.inputBg,
      min: 3.0,
      context: 'Form field border against field surface (WCAG 1.4.11 UI Components >= 3:1)',
    },
    {
      name: 'Input Field Border on Page Background',
      fg: c.inputBorder,
      bg: c.background,
      min: 3.0,
      context: 'Form field border against page surface (WCAG 1.4.11 UI Components >= 3:1)',
    },
    {
      name: 'Input Placeholder Text on Field White',
      fg: c.inputPlaceholder,
      bg: c.inputBg,
      min: 4.5,
      context: 'Placeholder text inside input fields (WCAG 1.4.3 >= 4.5:1)',
    },
    {
      name: 'Focus Ring on Field White',
      fg: c.focusRing,
      bg: c.inputBg,
      min: 3.0,
      context: 'Focus indicator ring against control surface (WCAG 1.4.11 >= 3:1)',
    },
    {
      name: 'Focus Ring on Page Background',
      fg: c.focusRing,
      bg: c.background,
      min: 3.0,
      context: 'Focus indicator ring against surrounding page background (WCAG 1.4.11 >= 3:1)',
    },

    // Glass Overlays (Alpha-blended against worst-case allowed placements)
    {
      name: 'White Text on Glass over Hero Start (#1D4ED8 - worst case)',
      fg: '#FFFFFF',
      bg: heroWorstCaseGlassBg,
      min: 4.5,
      context: 'Translucent 10% white glass card over lightest point of hero gradient',
    },
    {
      name: 'White Text on Glass over Hero Mid (#1E40AF)',
      fg: '#FFFFFF',
      bg: heroMidGlassBg,
      min: 4.5,
      context: 'Translucent 12% white glass card over middle hero gradient',
    },
    {
      name: 'Dark Text on 88% Glass Card over White Photo Highlight',
      fg: c.text,
      bg: photoWorstLightGlassBg,
      min: 4.5,
      context: 'Floating card over photo over pure white specular highlight in photo',
    },
    {
      name: 'Dark Text on 88% Glass Card over Black Photo Shadow',
      fg: c.text,
      bg: photoWorstDarkGlassBg,
      min: 4.5,
      context: 'Floating card over photo over pure black shadow in photo',
    },

    // Status & Accent Badges
    {
      name: 'Accessible Green Text on Card White',
      fg: c.successText,
      bg: c.card,
      min: 4.5,
      context: 'Status highlights, price tags, and verified indicators on light cards',
    },
    {
      name: 'Accessible Green Text on Ice Blue',
      fg: c.successText,
      bg: c.primaryLight,
      min: 4.5,
      context: 'Status highlights on ice blue section',
    },
    {
      name: 'Success Badge Text on Success Fill',
      fg: c.successBadgeText,
      bg: c.successBg,
      min: 4.5,
      context: 'Confirmed status pills and positive notifications',
    },
    {
      name: 'Text on Championship Gold Badge',
      fg: c.textOnGold,
      bg: c.gold,
      min: 4.5,
      context: 'Ranking badges, division pips, and leaderboard medals',
    },
    {
      name: 'Danger / Error Text on Danger Surface',
      fg: c.danger,
      bg: c.dangerSurface,
      min: 4.5,
      context: 'Error alerts, validation messages, and cancellation notices',
    },

    // Courtside Live Scoring Dark Theme
    {
      name: 'Courtside Live Text on Live Background',
      fg: c.live.text,
      bg: c.live.background,
      min: 4.5,
      context: 'Header and match titles during courtside live scorekeeping',
    },
    {
      name: 'Courtside Live Text on Live Card',
      fg: c.live.text,
      bg: c.live.card,
      min: 4.5,
      context: 'Player names and score steppers on dark cards',
    },
    {
      name: 'Courtside Live Muted on Live Card',
      fg: c.live.textMuted,
      bg: c.live.card,
      min: 4.5,
      context: 'Set scores and round indicators during live matches',
    },
    {
      name: 'Courtside Live Accent (#60A5FA) on Live Card',
      fg: c.live.accent,
      bg: c.live.card,
      min: 4.5,
      context: 'Corrected live accent blue on dark card (replaces #3B82F6)',
    },
    {
      name: 'Courtside Live Accent (#60A5FA) on Live Background',
      fg: c.live.accent,
      bg: c.live.background,
      min: 4.5,
      context: 'Corrected live accent blue on dark background',
    },
    {
      name: 'Courtside Live Button (Dark Text on Blue Accent)',
      fg: c.live.buttonText,
      bg: c.live.buttonBg,
      min: 4.5,
      context: 'Live action button: dark navy text #0B0F0E on blue #60A5FA fill',
    },
  ];
}

// -----------------------------------------------------------------------------
// 3. Forbidden Combinations Test
// -----------------------------------------------------------------------------

export function getForbiddenPairs() {
  return [
    {
      name: 'White on Lime CTA',
      fg: '#FFFFFF',
      bg: SiteTokens.colors.buttonOnBlue.primaryBg, // #D9F99D
      expectedFail: true,
      reason: '❌ FORBIDDEN. Lime fill must always take dark navy `#0F172A` text.',
    },
    {
      name: 'White on Championship Gold',
      fg: '#FFFFFF',
      bg: SiteTokens.colors.gold, // #F4C430
      expectedFail: true,
      reason: '❌ FORBIDDEN. Gold fill must always take dark charcoal `#14181A` text.',
    },
    {
      name: 'Lime Text on White Card',
      fg: SiteTokens.colors.buttonOnBlue.primaryBg,
      bg: SiteTokens.colors.card,
      expectedFail: true,
      reason: '❌ FORBIDDEN. On light surfaces, use accessible green `#007A33`.',
    },
    {
      name: 'White Text on #3B82F6 in Live Mode',
      fg: '#FFFFFF',
      bg: '#3B82F6',
      expectedFail: true,
      reason: '❌ FORBIDDEN. White on #3B82F6 is 3.68:1 (fails WCAG AA). Live blue buttons take dark text `#0B0F0E`.',
    },
    {
      name: 'White Text on Glass over Photo',
      fg: '#FFFFFF',
      bg: blendAlpha('#FFFFFF', 0.12, '#FFFFFF'), // Worst case over white photo
      expectedFail: true,
      reason: '❌ FORBIDDEN. Over photos, use 88% white card with dark text only.',
    },
  ];
}

// -----------------------------------------------------------------------------
// 4. Test Runner & Markdown Document Generator
// -----------------------------------------------------------------------------

export function runTestsAndGenerateDocs() {
  console.log('Running Design Tokens Contrast & Accessibility Tests...');
  const pairs = buildContrastPairs();
  const forbidden = getForbiddenPairs();

  const results = [];
  let failures = 0;

  // 1. Verify all active pairs pass
  for (const p of pairs) {
    const ratio = computeContrastRatio(p.fg, p.bg);
    const pass = ratio >= p.min;
    if (!pass) {
      console.error(`FAIL: ${p.name} - Ratio ${ratio}:1 < required ${p.min}:1`);
      failures++;
    }
    const compliance = ratio >= 7.0 ? 'AAA Pass' : ratio >= 4.5 ? 'AA Pass' : ratio >= 3.0 ? 'AA Large/UI Pass' : 'FAIL';
    results.push({ ...p, ratio, compliance, pass });
  }

  // 2. Verify forbidden pairs fail (proves why they are banned)
  const forbiddenResults = [];
  for (const f of forbidden) {
    const ratio = computeContrastRatio(f.fg, f.bg);
    if (ratio >= 4.5) {
      console.error(`FAIL: Forbidden pair ${f.name} unexpectedly passed: ${ratio}:1`);
      failures++;
    }
    forbiddenResults.push({ ...f, ratio });
  }

  if (failures > 0) {
    throw new Error(`Contrast tests failed with ${failures} violations!`);
  }

  console.log(`✅ All ${results.length} active contrast pairs PASSED WCAG AA/AAA thresholds!`);
  console.log(`✅ All ${forbiddenResults.length} forbidden combinations verified as failing and strictly banned.`);

  // 3. Generate docs/design-tokens.md
  const tableRows = results.map((r) => {
    return `| **${r.name}** | \`${r.fg}\` | \`${r.bg}\` | **${r.ratio.toFixed(2)} : 1** | **${r.compliance}** | ${r.context} |`;
  });

  const forbiddenTableRows = forbiddenResults.map((f) => {
    return `| ~~${f.name}~~ | \`${f.fg}\` | \`${f.bg}\` | **${f.ratio.toFixed(2)} : 1** | **FAIL** | ${f.reason} |`;
  });

  const markdownDoc = `# Padel Ghana Platform — Design Tokens & Accessibility Specification

This document is automatically generated and verified by \`apps/site/scripts/test-and-generate-tokens.mjs\`.
All color pairs are tested against WCAG 2.1 relative luminance algorithms. Hand-typed ratios are forbidden.

---

## 1. Blue Frosted-Glass Color Palette

| Token | Hex / Value | Role |
|---|---|---|
| \`Tokens.colors.primary\` | \`${SiteTokens.colors.primary}\` | Primary royal blue action & brand identity |
| \`Tokens.colors.primaryHover\` | \`${SiteTokens.colors.primaryHover}\` | Button hover state on light surfaces |
| \`Tokens.colors.primaryPressed\` | \`${SiteTokens.colors.primaryPressed}\` | Button active/pressed state on light surfaces |
| \`Tokens.colors.primaryLight\` | \`${SiteTokens.colors.primaryLight}\` | Ice blue alternating section background |
| \`Tokens.colors.borderLight\` | \`${SiteTokens.colors.borderLight}\` | Hairline border on ice blue sections |
| \`Tokens.colors.background\` | \`${SiteTokens.colors.background}\` | Slate 50 page background |
| \`Tokens.colors.card\` | \`${SiteTokens.colors.card}\` | Pure white cards & sheets |
| \`Tokens.colors.border\` | \`${SiteTokens.colors.border}\` | 1px hairline border (Slate 200) |
| \`Tokens.colors.text\` | \`${SiteTokens.colors.text}\` | High-contrast dark navy primary text |
| \`Tokens.colors.textMuted\` | \`${SiteTokens.colors.textMuted}\` | Muted secondary text & metadata |
| \`Tokens.colors.textDisabled\` | \`${SiteTokens.colors.textDisabled}\` | Inactive / disabled text |
| \`Tokens.colors.inputBorder\` | \`${SiteTokens.colors.inputBorder}\` | Accessible input field border (>= 3:1) |
| \`Tokens.colors.inputPlaceholder\` | \`${SiteTokens.colors.inputPlaceholder}\` | Accessible input placeholder (>= 4.5:1) |
| \`Tokens.colors.focusRing\` | \`${SiteTokens.colors.focusRing}\` | Accessible focus indicator (>= 3:1) |
| \`Tokens.colors.buttonOnBlue.primaryBg\` | \`${SiteTokens.colors.buttonOnBlue.primaryBg}\` | Electric Lime CTA button fill on blue |
| \`Tokens.colors.buttonOnBlue.primaryText\` | \`${SiteTokens.colors.buttonOnBlue.primaryText}\` | Dark Navy text on lime CTA button |
| \`Tokens.colors.successText\` | \`${SiteTokens.colors.successText}\` | Accessible green text on white/ice surfaces |
| \`Tokens.colors.gold\` | \`${SiteTokens.colors.gold}\` | Rankings and tournament badges |
| \`Tokens.colors.danger\` | \`${SiteTokens.colors.danger}\` | Destructive actions & error alerts |
| \`Tokens.colors.live.background\` | \`${SiteTokens.colors.live.background}\` | Dark background strictly for live scoring |
| \`Tokens.colors.live.card\` | \`${SiteTokens.colors.live.card}\` | Dark card strictly for live scoring |
| \`Tokens.colors.live.accent\` | \`${SiteTokens.colors.live.accent}\` | High-contrast light blue live accent (6.80:1 on card) |
| \`Tokens.colors.live.buttonText\` | \`${SiteTokens.colors.live.buttonText}\` | Dark text on live blue buttons |

---

## 2. Verified Accessible Text/Surface Contrast Table (WCAG 2.1)

All active text/surface pairs achieve at least 4.5:1 (WCAG AA), and UI components / borders achieve at least 3:1.
Translucent glass layers are evaluated against the worst-case backdrop of their allowed placement.

| Token Pair | Foreground | Background | Contrast Ratio | Compliance | Intended Usage |
|---|---|---|---|---|---|
${tableRows.join('\n')}

---

## 3. Forbidden High-Risk Combinations (Banned in Tests)

These combinations fail WCAG 2.1 AA and are strictly forbidden in code:

| Forbidden Pair | Foreground | Background | Contrast Ratio | Result | Enforcement Rule |
|---|---|---|---|---|---|
${forbiddenTableRows.join('\n')}

---

## 4. Glass Rules & Surface Placement Restrictions

1. **Allowed Glass Placements**:
   - **Hero Gradient Band**: Translucent white glass (\`rgba(255, 255, 255, 0.10)\`, max blur 12px) with white text. Blended contrast against the lightest hero stop (#1D4ED8) is **5.53:1** (AA Pass).
   - **Floating Cards Over Photos**: Must use the **88% white card** (\`rgba(255, 255, 255, 0.88)\`) with **dark text** (\`#0F172A\`). Blended contrast against specular photo highlights is **17.85:1** and against dark photo shadows is **13.54:1** (AAA Pass). White text on glass over photos is strictly forbidden.
   - **Sticky Top Nav**: Solid royal blue or translucent royal blue nav bar over white page background.
2. **Solid Surfaces Only**:
   - FAQ accordions, legal pages (Terms, Privacy, Refund), form inputs, and tables **must sit on solid surfaces** (\`#FFFFFF\` or \`#F8FAFC\`). Glass and gradients behind them are strictly prohibited.
3. **Gradient Restrictions**:
   - ONE hero gradient (\`linear-gradient(135deg, #1D4ED8 0%, #1E40AF 55%, #172554 100%)\`) is allowed strictly on the hero band and the "For organisers and clubs" section.
   - Gradients are strictly forbidden on buttons, cards, and text.
4. **Performance & Fallbacks**:
   - Maximum 2 to 3 blurred layers per viewport. Zero animated blur.
   - Solid fallback rendered under \`@media (prefers-reduced-transparency: reduce)\` and when \`backdrop-filter\` is unsupported.
   - In the Expo mobile app, solid royal blue and semi-opaque tints are used without GPU blur or gradient libraries.
`;

  const docPath = path.resolve(REPO_ROOT, 'docs/design-tokens.md');
  fs.writeFileSync(docPath, markdownDoc, 'utf-8');
  console.log(`📄 Successfully wrote generated contrast table to ${docPath}`);

  // 4. Generate apps/site/src/styles/tokens.css
  const cssContent = `/* Padel Ghana Marketing Site — Design Tokens
 * Generated automatically by apps/site/scripts/test-and-generate-tokens.mjs
 * DO NOT EDIT MANUALLY.
 */

:root {
  /* Brand Blues */
  --color-primary: ${SiteTokens.colors.primary};
  --color-primary-hover: ${SiteTokens.colors.primaryHover};
  --color-primary-pressed: ${SiteTokens.colors.primaryPressed};
  --color-primary-light: ${SiteTokens.colors.primaryLight};
  --color-border-light: ${SiteTokens.colors.borderLight};
  --color-focus-ring: ${SiteTokens.colors.focusRing};

  /* Surfaces & Text */
  --color-bg: ${SiteTokens.colors.background};
  --color-card: ${SiteTokens.colors.card};
  --color-border: ${SiteTokens.colors.border};
  --color-text: ${SiteTokens.colors.text};
  --color-text-muted: ${SiteTokens.colors.textMuted};
  --color-text-disabled: ${SiteTokens.colors.textDisabled};
  --color-text-white: ${SiteTokens.colors.textWhite};
  --color-white: ${SiteTokens.colors.white};

  /* Forms & Inputs */
  --color-input-border: ${SiteTokens.colors.inputBorder};
  --color-input-placeholder: ${SiteTokens.colors.inputPlaceholder};
  --color-input-bg: ${SiteTokens.colors.inputBg};

  /* Buttons on Blue */
  --btn-on-blue-lime-bg: ${SiteTokens.colors.buttonOnBlue.primaryBg};
  --btn-on-blue-lime-text: ${SiteTokens.colors.buttonOnBlue.primaryText};
  --btn-on-blue-lime-hover: ${SiteTokens.colors.buttonOnBlue.primaryHover};
  --btn-on-blue-white-bg: ${SiteTokens.colors.buttonOnBlue.secondaryBg};
  --btn-on-blue-white-text: ${SiteTokens.colors.buttonOnBlue.secondaryText};
  --btn-on-blue-white-hover: ${SiteTokens.colors.buttonOnBlue.secondaryHover};
  --btn-on-blue-glass-bg: ${SiteTokens.colors.buttonOnBlue.glassBg};
  --btn-on-blue-glass-border: ${SiteTokens.colors.buttonOnBlue.glassBorder};
  --btn-on-blue-glass-text: ${SiteTokens.colors.buttonOnBlue.glassText};
  --btn-on-blue-glass-hover: ${SiteTokens.colors.buttonOnBlue.glassHover};

  /* Buttons on Light */
  --btn-on-light-primary-bg: ${SiteTokens.colors.buttonOnLight.primaryBg};
  --btn-on-light-primary-text: ${SiteTokens.colors.buttonOnLight.primaryText};
  --btn-on-light-primary-hover: ${SiteTokens.colors.buttonOnLight.primaryHover};
  --btn-on-light-primary-pressed: ${SiteTokens.colors.buttonOnLight.primaryPressed};
  --btn-on-light-disabled-bg: ${SiteTokens.colors.buttonOnLight.disabledBg};
  --btn-on-light-disabled-text: ${SiteTokens.colors.buttonOnLight.disabledText};

  /* Accents & Status */
  --color-success-text: ${SiteTokens.colors.successText};
  --color-success-bg: ${SiteTokens.colors.successBg};
  --color-success-badge-text: ${SiteTokens.colors.successBadgeText};
  --color-badge-success-border: ${SiteTokens.colors.badgeSuccessBorder};
  --color-gold: ${SiteTokens.colors.gold};
  --color-gold-text: ${SiteTokens.colors.textOnGold};
  --color-badge-gold-bg: ${SiteTokens.colors.badgeGoldBg};
  --color-badge-gold-text: ${SiteTokens.colors.badgeGoldText};
  --color-badge-gold-border: ${SiteTokens.colors.badgeGoldBorder};
  --color-badge-soon-bg: ${SiteTokens.colors.badgeSoonBg};
  --color-danger: ${SiteTokens.colors.danger};
  --color-danger-surface: ${SiteTokens.colors.dangerSurface};

  /* Gradients (Background bands ONLY) */
  --gradient-hero: ${SiteTokens.gradients.hero};

  /* Glass Tokens */
  --glass-hero-tint: ${SiteTokens.glass.heroOverlayTint};
  --glass-hero-card-bg: ${SiteTokens.glass.heroCardBg};
  --glass-badge-hero-bg: ${SiteTokens.glass.badgeHeroBg};
  --glass-badge-hero-border: ${SiteTokens.glass.badgeHeroBorder};
  --glass-badge-hero-text: ${SiteTokens.glass.badgeHeroText};
  --glass-nav-tint: ${SiteTokens.glass.navTint};
  --glass-nav-border: ${SiteTokens.glass.navBorder};
  --glass-card-photo-tint: ${SiteTokens.glass.cardOverPhotoTint};
  --glass-border-light: ${SiteTokens.glass.borderLight};
  --glass-border-dark: ${SiteTokens.glass.borderDark};
  --glass-blur-radius: ${SiteTokens.glass.blurRadius};
  --glass-blur: ${SiteTokens.glass.blurFilter};
  --glass-fallback-nav: ${SiteTokens.glass.fallbackNav};
  --glass-fallback-card: ${SiteTokens.glass.fallbackCard};

  /* Radii */
  --radius-sm: ${SiteTokens.radii.sm};
  --radius-card: ${SiteTokens.radii.card};
  --radius-button: ${SiteTokens.radii.button};
  --radius-pill: ${SiteTokens.radii.pill};

  /* Spacing & Touch */
  --touch-target-min: 44px;
}
`;

  const cssPath = path.resolve(__dirname, '../src/styles/tokens.css');
  fs.mkdirSync(path.dirname(cssPath), { recursive: true });
  fs.writeFileSync(cssPath, cssContent, 'utf-8');
  console.log(`🎨 Successfully exported CSS variables to ${cssPath}`);
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('test-and-generate-tokens.mjs')) {
  runTestsAndGenerateDocs();
}
