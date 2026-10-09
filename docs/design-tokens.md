# Padel Ghana Platform — Design Tokens & Accessibility Specification

This document is automatically generated and verified by `__tests__/TokensContrast.test.ts`.
All color pairs are tested against WCAG 2.1 relative luminance algorithms. Hand-typed ratios are forbidden.

---

## 1. Mica Color Palette

| Token | Hex | Role |
|---|---|---|
| `Tokens.colors.background` | `#F6F6F4` | Warm off-white app background |
| `Tokens.colors.card` | `#FFFFFF` | White cards & sheets |
| `Tokens.colors.border` | `#E7E7E3` | Subtle 1px dividers and borders |
| `Tokens.colors.text` | `#14181A` | High-contrast charcoal primary text |
| `Tokens.colors.textMuted` | `#5F676B` | Muted secondary text & metadata |
| `Tokens.colors.primary` | `#00C853` | Primary button fill & active tab highlight ONLY |
| `Tokens.colors.textOnPrimary` | `#14181A` | Charcoal text on primary button fill |
| `Tokens.colors.greenText` | `#007A33` | Accessible forest green for text on white/off-white |
| `Tokens.colors.gold` | `#F4C430` | Rankings and achievement badges |
| `Tokens.colors.danger` | `#B3261E` | Destructive actions & error alerts |
| `Tokens.colors.live.background` | `#0B0F0E` | Dark background strictly for live scoring |
| `Tokens.colors.live.card` | `#161C1A` | Dark card strictly for live scoring |
| `Tokens.colors.live.text` | `#F6F6F4` | Light text strictly for live scoring |
| `Tokens.colors.live.textMuted` | `#8A9499` | Muted text strictly for live scoring |

---

## 2. Verified Accessible Text/Surface Contrast Table (WCAG 2.1)

All active text/surface pairs achieve at least 4.5:1 (WCAG AA).

| Token Pair | Foreground | Background | Contrast Ratio | Compliance | Intended Usage |
|---|---|---|---|---|---|
| **Primary Text on App Background** | `#14181A` | `#F6F6F4` | **16.51 : 1** | **AAA Pass** | Main page titles, headers, and body text on off-white background |
| **Primary Text on Card White** | `#14181A` | `#FFFFFF` | **17.87 : 1** | **AAA Pass** | Headings, labels, and event titles inside cards |
| **Muted Text on Card White** | `#5F676B` | `#FFFFFF` | **5.77 : 1** | **AA Pass** | Subtitles, timestamps, metadata, and venue addresses on cards |
| **Muted Text on App Background** | `#5F676B` | `#F6F6F4` | **5.33 : 1** | **AA Pass** | Section descriptions and footnotes on page background |
| **Text on Primary Button** | `#14181A` | `#00C853` | **7.99 : 1** | **AAA Pass** | Button label and icon inside electric green primary CTA buttons |
| **Green Text on Card White** | `#007A33` | `#FFFFFF` | **5.48 : 1** | **AA Pass** | Accessible green highlight text, badges, and status pills on cards |
| **Green Text on App Background** | `#007A33` | `#F6F6F4` | **5.07 : 1** | **AA Pass** | Accessible green text labels on warm off-white page background |
| **Text on Gold Badge** | `#14181A` | `#F4C430` | **10.88 : 1** | **AAA Pass** | Charcoal text on gold badges and ranking pills |
| **Live Mode Text on Live Card** | `#F6F6F4` | `#161C1A` | **15.97 : 1** | **AAA Pass** | Courtside Live scorekeeper player names and score numbers on dark cards |
| **Live Mode Text on Live Background** | `#F6F6F4` | `#0B0F0E` | **17.82 : 1** | **AAA Pass** | Courtside Live titles and header text on dark background |
| **Live Mode Muted Text on Live Card** | `#8A9499` | `#161C1A` | **5.58 : 1** | **AA Pass** | Courtside Live set scores and round indicators on dark cards |
| **Danger Text on Danger Surface** | `#B3261E` | `#FDF2F2` | **5.96 : 1** | **AA Pass** | Error alerts and destructive confirmation notices |

---

## 3. Forbidden High-Risk Combinations (Banned)

These combinations fail WCAG 2.1 AA and are strictly forbidden in code:

| Forbidden Pair | Foreground | Background | Contrast Ratio | Result | Enforcement Rule |
|---|---|---|---|---|---|
| ~~White on Electric Green~~ | `#FFFFFF` | `#00C853` | **2.24 : 1** | **FAIL** | ❌ FORBIDDEN. Green fill must always take charcoal `#14181A` text. |
| ~~White on Gold~~ | `#FFFFFF` | `#F4C430` | **1.64 : 1** | **FAIL** | ❌ FORBIDDEN. Gold fill must always take charcoal `#14181A` text. |
| ~~Electric Green on White Card~~ | `#00C853` | `#FFFFFF` | **2.24 : 1** | **FAIL** | ❌ FORBIDDEN. For green text on white, use accessible `#007A33`. |

---

## 4. Typography, Touch Targets & Theme Boundaries

1. **Font Family**: Inter only (`InterVariable.woff2` on web, static `Inter-Regular.ttf`, `Inter-Medium.ttf`, `Inter-SemiBold.ttf` on native).
2. **Font Weights**: 400 (`regular`), 500 (`medium`), 600 (`semibold`). Heavy weights (800, 900) are forbidden.
3. **Tabular Numerals**: Tabular figures (`fontVariant: ['tabular-nums']`) must be used for prices, match scores, and leaderboard ranks.
4. **Ghana Cedi Sign**: Cedi sign (`₵`, `U+20B5`) is verified in the font subset and formatted via `formatGhanaCedis()`.
5. **Touch Targets**: Minimum 44 px height for Button, Chip, and ListRow; minimum 64 px for Courtside Live score steppers.
6. **No Button Arrows**: Buttons never include trailing arrows (`→`, `←`).
7. **Theme Boundaries**: Dark theme is STRICTLY isolated to Courtside Live (`/events/[id]/live`). All other screens use light mica.
