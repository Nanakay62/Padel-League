# Design System Specification v2: Court Chalk & Athletic Precision

The Padel Ghana platform design system blends the textural warmth of **Court Chalk** (high-end club culture) with the bold, high-contrast, data-dense athletic precision of **Playtomic** and **Apple Fitness**.

---

## 1. 4-Point Spacing Grid

All dimensions, layout paddings, margins, gaps, and component sizes conform strictly to a base 4-point grid. Multiples of 4 ensure pixel perfection across varying device densities (1x, 2x, 3x) on iOS and Android.

| Token | Value | Base Unit | Primary Usage |
|---|---|---|---|
| `Tokens.spacing.xs` | 4 pt | 1× | Compact pill padding, micro inline badges |
| `Tokens.spacing.sm` | 8 pt | 2× | Internal component spacing, card tag margins, row icon gaps |
| `Tokens.spacing.md` | 12 pt | 3× | Form field internal padding, horizontal card item spacing |
| `Tokens.spacing.base`| 16 pt | 4× | Standard container padding, modal body inset, screen margins |
| `Tokens.spacing.lg` | 20 pt | 5× | Section gap in medium cards, header padding |
| `Tokens.spacing.xl` | 24 pt | 6× | Major section vertical rhythm, drawer padding |
| `Tokens.spacing.xxl`| 32 pt | 8× | Section break between independent page modules |
| `Tokens.spacing.xxxl`| 48 pt | 12× | Hero section separation, empty state vertical insets |

---

## 2. Typography & Dynamic Type

The typographic hierarchy is designed for instant legibility courtside under bright sunlight and at arm's length.

- **Display & Headings**: `Bricolage Grotesque` / `Satoshi` for energetic, authoritative sports headlines.
- **Body & Data**: `DM Sans` / `Figtree` for clean tabular numbers and compact data clarity.
- **Courtside Scores & Timers**: `Menlo` / `monospace` for fixed-width numerals.

### Dynamic Type & Font Scaling
To prevent UI clipping and overlapping in dense match tables and court diagrams:
- All text styles implement `maxFontSizeMultiplier: 1.35` (`Tokens.accessibility.maxFontSizeMultiplier`).
- Crucial numerical displays (scores, ratings, MoMo amounts) maintain horizontal overflow protection and baseline alignment.

---

## 3. 0.0–7.0 Playtomic Rating Scale

Padel skill identity is centered on the internationally recognized 0.0 to 7.0 continuous scale:

| Tier Key | Level Range | Playtomic Level Equivalent | Visual Treatment | Badge Background | Badge Text |
|---|---|---|---|---|---|
| `ratingTierBeginner` | 0.00 – 1.99 | Level 1 (First hits, basic rallying) | Soft Muted Chalk | `#E6E1D3` (`track`) | `#5A655F` (`muted`) |
| `ratingTierIntermediate` | 2.00 – 3.99 | Level 2–3 (Consistent wall play, bandehas) | Solid Card Surface | `#FBFAF6` (`card`) | `#12201C` (`ink`) |
| `ratingTierAdvanced` | 4.00 – 5.49 | Level 4–5 (Tactical mastery, viboras, power) | Vibrant Neon Lime | `#D5F23B` (`lime`) | `#12201C` (`ink`) |
| `ratingTierPro` | 5.50 – 7.00 | Level 6–7 (National circuit, tournament elite)| Deep Ink Obsidian | `#12201C` (`ink`) | `#D5F23B` (`lime`) |

Ratings adapt purely through immutable `RatingEvent` logs in the backend. The UI presents the calibrated rating, confidence interval, and likely skill band without ad-hoc front-end rating calculations.

---

## 4. Ghana Mobile Money Rails

Payment in Ghana is mobile-first. The design system incorporates native brand identities for Ghana's three primary MoMo networks, paired with accessible foreground text:

| Provider | ID | Brand Accent | Text Color | Number Prefixes |
|---|---|---|---|---|
| **MTN Mobile Money** | `mtn` | `#FFCC00` | `#000000` | `024`, `054`, `055`, `059` |
| **Telecel Cash** | `telecel` | `#E60000` | `#FFFFFF` | `020`, `050` |
| **AT Money** | `at` | `#0055A5` | `#FFFFFF` | `026`, `056`, `027`, `057` |

### Payment Principles
- All monetary amounts stored and communicated in **integer pesewas** (`GHS`).
- Court fee splits computed only across `CONFIRMED` participants.
- Single-tap provider chip selection with auto-detection from subscriber phone prefix.

---

## 5. Motion Tokens & Reduced Motion

Transitions are snappy, physical, and restrained, evoking the clean bounce of a padel ball off glass:

| Token | Duration | Purpose |
|---|---|---|
| `Tokens.motion.duration.instant` | 100 ms | Micro-interactions: checkbox, chip toggle, score stepper tap |
| `Tokens.motion.duration.fast` | 200 ms | Modal drawers, alert banners, button press states |
| `Tokens.motion.duration.normal` | 300 ms | Screen transitions, tab switches, card expansions |
| `Tokens.motion.duration.slow` | 500 ms | Large modal presentations, skeleton shimmer loops |

### Easing Curves
- `standard`: `cubic-bezier(0.2, 0.0, 0, 1.0)` (Natural on-screen movement)
- `decelerate`: `cubic-bezier(0.0, 0.0, 0.2, 1.0)` (Incoming views, drawer entry)
- `accelerate`: `cubic-bezier(0.4, 0.0, 1.0, 1.0)` (Dismissals, drawer exit)

### Accessibility & Reduced Motion
When `prefers-reduced-motion` is enabled by the user:
- Scale animations (`transform: [{ scale: 0.98 }]`) and spring transitions are disabled.
- Component state changes switch directly to instant opacity transitions (≤ 100 ms).

---

## 6. Component States & Touch Target Minimums

### Touch Target Minimums
- **Universal Minimum**: All interactive elements (Buttons, stepper controls, checkboxes, tabs) enforce a minimum touch target of **44×44 pt** (Apple HIG) and standard **48×48 pt** (Google Material / `Tokens.touch.minTarget`).
- **Courtside Stepper Controls**: Minimum size of **64×64 pt** (`Tokens.touch.minStepper`) for single-thumb score entry while standing courtside.

### Standardized Component States
Every component in the design system explicitly supports 7 core states:
1. **Default**: High-contrast, clean elevation with 1px border (`#DAD4C4`).
2. **Pressed / Active**: Subtle physical compression (`scale: 0.98`, opacity: 0.85).
3. **Focused**: 2px solid `#12201C` outline offset by 2px on web keyboards.
4. **Disabled**: 50% opacity, non-interactive, preserved contrast on text labels.
5. **Loading**: Replaces label with centered spinner matching contrast tokens (`Tokens.colors.ink` or `#FFFFFF`).
6. **Skeleton**: Pulsing placeholder matching target geometry before data fetch completes.
7. **Empty & Error**: Standardized empty (`EmptyState`) and retryable error (`ErrorState`) boundaries.
