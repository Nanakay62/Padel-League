---
name: Mica Court
colors:
  surface: '#f9f9f7'
  surface-dim: '#dadad8'
  surface-bright: '#f9f9f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f4f2'
  surface-container: '#eeeeec'
  surface-container-high: '#e8e8e6'
  surface-container-highest: '#e2e3e1'
  on-surface: '#1a1c1b'
  on-surface-variant: '#3c4a3c'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f1ef'
  outline: '#6c7b6a'
  outline-variant: '#bbcbb8'
  surface-tint: '#006e2a'
  primary: '#006e2a'
  on-primary: '#ffffff'
  primary-container: '#00c853'
  on-primary-container: '#004c1b'
  inverse-primary: '#3ce36a'
  secondary: '#5b5f61'
  on-secondary: '#ffffff'
  secondary-container: '#dde0e3'
  on-secondary-container: '#5f6365'
  tertiary: '#755b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#d5a807'
  on-tertiary-container: '#523f00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#69ff87'
  primary-fixed-dim: '#3ce36a'
  on-primary-fixed: '#002108'
  on-primary-fixed-variant: '#00531e'
  secondary-fixed: '#e0e3e5'
  secondary-fixed-dim: '#c4c7c9'
  on-secondary-fixed: '#181c1e'
  on-secondary-fixed-variant: '#43474a'
  tertiary-fixed: '#ffdf90'
  tertiary-fixed-dim: '#f0c12c'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#584400'
  background: '#f9f9f7'
  on-background: '#1a1c1b'
  surface-variant: '#e2e3e1'
typography:
  display:
    fontFamily: Inter
    fontSize: 56px
    fontWeight: '600'
    lineHeight: 64px
    letterSpacing: -0.03em
  display-mobile:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.015em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  price-display:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system embodies the "Mica" aesthetic: quiet confidence, architectural precision, and an athletic atmosphere defined by clarity rather than chaos. Tailored for a premier sports and social club in Ghana, it communicates prestige, community, and active wellness without resorting to the flashy, aggressive tropes common in sports marketing. 

The aesthetic is strictly flat, matte, architectural, and restrained. It eliminates glossy sheen, skeuomorphic depth, backdrop blurs, and decorative gradients. Visual weight is communicated through deliberate spatial rhythms, disciplined hairline boundaries, and high-legibility typography. 

The emotional response should evoke the calm focus of an early morning court booking: orderly, tactile, premium, and effortless. Interfaces must feel crisp and grounded, serving both seasoned padel players and newcomers looking for a world-class sporting lifestyle.

## Colors

The palette relies on high-discipline neutrals accented by purposeful, highly controlled bursts of court green and warm championship gold:

- **Primary Action (Electric Green - `#00C853`):** Reserved strictly for primary action elements, key interactive triggers, and high-priority court booking affordances. When placed on `#00C853`, text and iconography **must** be Primary Charcoal (`#14181A`). Never render white text over `#00C853`.
- **Accessible Text Green (`#007A33`):** When green text, subtle pill badge typography, or icon accents sit directly on White (`#FFFFFF`) or Warm Off-White (`#F6F6F4`), use `#007A33` to guarantee WCAG AAA contrast compliance.
- **Secondary / Primary Text (Charcoal - `#14181A`):** The primary color for all core body copy, high-level headers, and primary button labels.
- **Tertiary Accent (Championship Gold - `#F4C430`):** Used in minute amounts: tournament badges, pro-tier membership pips, rating stars, or verified tags. Never used for general button fills.
- **Muted Charcoal (`#5F676B`):** Applied to secondary descriptions, metadata, inactive tab states, table labels, and helper copy.
- **Canvas Neutral (`#F6F6F4`):** The universal matte page background. Soft, warm, and low-fatigue.
- **Surface Pure White (`#FFFFFF`):** Applied to floating cards, active booking slots, modal sheets, and standard secondary button fills.
- **Hairline Border (`#E7E7E3`):** A strict 1px solid stroke separating surfaces, defining table rows, and outlining cards without dropping shadows.
- **Inverted Contrast Section (`#0B0F0E`):** A monolithic deep charcoal ground reserved for high-impact night sessions, premium membership showcases, and structural footer blocks. Over this surface, text switches to Pure White (`#FFFFFF`) and Muted Slate (`#9BA3A7`), with hairline borders transitioning to 1px solid `#1E2523`.

## Typography

The typography is built entirely on `Inter` using weights 400 (Regular), 500 (Medium), and 600 (Semi-Bold). Black, Extra-Bold, or heavy weights are strictly forbidden to maintain a disciplined, editorial tone.

### Key Rules
- **Tabular Numerals (`font-feature-settings: "tnum"`):** Mandatory across all price tags, schedule tables, booking slots, and match scoreboards. This guarantees that currency strings like `GH₵ 85.00` and `GH₵ 120.00` align precisely across columns and matrices without horizontal jitter.
- **Headings & Display:** Kept tight and intentional. Negative letter-spacing prevents larger sizes from feeling detached.
- **Ghana Cedi Symbol:** Always set as `GH₵` followed by a non-breaking space and the tabular value (e.g., `GH₵ 150.00`).

## Layout & Spacing

The layout adheres to a structured 12-column grid system on desktop (max width: 1280px, centered) transitioning to a 4-column system on mobile devices:

- **Desktop (≥ 1024px):** 12 columns, 24px (`1.5rem`) gutters, 48px (`3rem`) outer canvas margins.
- **Tablet (768px – 1023px):** 8 columns, 20px (`1.25rem`) gutters, 32px (`2rem`) outer margins.
- **Mobile (< 768px):** 4 columns, 16px (`1rem`) gutters, 20px (`1.25rem`) outer margins.

The spacing rhythm relies on multiples of 4px and 8px. Layouts must provide generous structural margins between functional regions, avoiding clumped widgets. Use full-bleed backgrounds for dark contrast bands (`#0B0F0E`), while internal content bounds remain locked to the primary 1280px container.

## Elevation & Depth

This system intentionally eliminates traditional shadow drop stacks, ambient glows, blur layers, and skeuomorphic bevels. Visual separation is accomplished exclusively through:

1. **Surface Tonality:** Separation of background layers (`#F6F6F4`) and foreground panels (`#FFFFFF`).
2. **Hairline Outlines:** Pure, crisp 1px solid borders (`#E7E7E3`) defining all edges.
3. **Contrast Sectioning:** Inverting large thematic bands to `#0B0F0E` with 1px `#1E2523` borders to introduce visceral contrast without spatial lifting.
4. **Interactive States:** Surface changes occur via background tint swaps (e.g., white transitions to `#F0F0EC` on hover or press), never via simulated Z-axis elevation or expanding shadows.

## Shapes

The geometric architecture is balanced and architectural:
- **Cards, Panels, & Containers:** Fixed at `12px` border radius (`rounded-xl` equivalent in this system).
- **Buttons & Input Fields:** Set to `8px` (`rounded-lg`) for a defined, tactile boundary.
- **Filter Chips & Status Pills:** Fully rounded / pill-shaped (`9999px`) to immediately communicate status or filter attributes in contrast to rectangular cards.
- **Hairline Borders:** Uniform 1px thickness applied consistently to all framed elements.

## Components

### Buttons
- **Primary Action CTA:** Solid Electric Green (`#00C853`) background, Primary Charcoal (`#14181A`) text (600 weight), 8px border radius. Minimum height 48px to satisfy accessible touch targets. Hover state shifts background to `#00B34A`. Active state `#009E40`.
- **Secondary Button:** Solid White (`#FFFFFF`) background, 1px hairline border (`#E7E7E3`), Primary Charcoal (`#14181A`) text (500 weight). Hover shifts background to `#F9F9F8`. Active shifts to `#EEEEEC`.
- **Inverted Dark Section CTA:** Solid Electric Green (`#00C853`) background with `#14181A` text. Secondary button in dark sections uses `#0B0F0E` background, 1px border `#2A3330`, White (`#FFFFFF`) text.

### Cards
- **Standard Card:** Pure White (`#FFFFFF`) fill, 1px hairline border (`#E7E7E3`), 12px corner radius. No drop shadow. Padding defaults to `1.5rem` (`space-lg`).
- **Court Schedule Card:** Features tabular court availability grids, a status pill, and court slot buttons framed with 1px hairline dividers between hours.

### Chips & Badges
- **Status Pills (e.g., "Available", "Court 1"):** Fully rounded (9999px), 6px vertical by 12px horizontal padding. Subtle background tint (`#E8F8EE`), Dark Accessible Green text (`#007A33`), font size 12px with 600 weight.
- **Membership/Tournament Badge:** Light gold tint (`#FEF9E7`) background, dark gold/brown text (`#7A5E00`), accompanied by a 6px circular dot indicator in `#F4C430` invariant.

### Form Fields & Inputs
- **Base Input:** Height 48px, pure white fill, 1px border (`#E7E7E3`), 8px corner radius. Text `#14181A`, placeholder `#5F676B`.
- **Focus State:** 1px solid `#14181A` border (or 1.5px `#00C853`). No glow or ring blur.

### Iconography
- **Style:** Linear 1.5px stroke width (Lucide or Feather standard). Crisp, unadorned, aligned with baseline typography. 
- **Scale:** 20px default icon box for in-line copy; 24px inside standalone actions. Never use emojis.

### Lists & Tables
- **Pricing & Schedule Rows:** Separated by 1px solid hairline rules (`#E7E7E3`). Alternating fills are prohibited; differentiation relies on hover tints (`#FAFAFA`) and aligned tabular figures for Ghana Cedi prices.
