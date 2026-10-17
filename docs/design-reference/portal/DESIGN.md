---
name: Padel Court Management
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434655'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#747686'
  outline-variant: '#c4c5d7'
  surface-tint: '#2151da'
  primary: '#0037b0'
  on-primary: '#ffffff'
  primary-container: '#1d4ed8'
  on-primary-container: '#cad3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#3755c3'
  on-secondary: '#ffffff'
  secondary-container: '#708cfd'
  on-secondary-container: '#00217a'
  tertiary: '#344c01'
  on-tertiary: '#ffffff'
  tertiary-container: '#4b641a'
  on-tertiary-container: '#c1e087'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001551'
  on-primary-fixed-variant: '#0039b5'
  secondary-fixed: '#dde1ff'
  secondary-fixed-dim: '#b8c4ff'
  on-secondary-fixed: '#001453'
  on-secondary-fixed-variant: '#173bab'
  tertiary-fixed: '#ceee93'
  tertiary-fixed-dim: '#b3d17a'
  on-tertiary-fixed: '#131f00'
  on-tertiary-fixed-variant: '#364e03'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  data-currency:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  data-metric:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 32px
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
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system drives the administrative engines for sports venue operators and regional platform supervisors across Ghana. The visual tone is authoritative, brisk, and crystal-clear. It merges modern athletic poise with rigorous operational utility.

The core visual style is a controlled hybrid of **Modern Corporate Architecture** and **Precision Glassmorphism**. Semi-translucent, frosted structures organize the high-level application chrome (navigation sidebars, contextual global headers, and floating overlays), framing an ultra-legible, crisp, opaque workspace below. Core task surfaces—financial ledgers, schedule matrices, membership rosters, and audit trails—remain unapologetically grounded on high-contrast solid backgrounds to eliminate visual distortion, fatigue, and latency.

The system communicates athletic vigor through deep stadium-grade royal blues and high-visibility accents, balanced by structural discipline: 1px hairline dividers, razor-sharp tabular data arrays, clean linear iconography, and forgiving, plain-spoken transaction workflows.

## Colors

The palette establishes hierarchical depth through deliberate contrast and functional zoning:

### Structural Foundations
- **Page Background Canvas**: `#F8FAFC` (Slate 50). Provides soft, low-glare contrast for bright white content tiles.
- **Card & Content Surface**: `#FFFFFF` (Pure solid white). Absolute crispness for tables, inputs, forms, and analytical grids.
- **Header & Structural Ice Blue**: `#EFF6FF` (Blue 50). Used for segmented table headers, inactive step banners, and auxiliary metric containers.
- **Hairline Borders**: `#E2E8F0` (Slate 200). Strict 1px dividers that delineate dense operational panels.

### Brand Palette & Navigation
- **Primary Royal Blue**: `#1D4ED8`. Primary action driver, high-emphasis interactive elements, and focal icons.
- **Deep Stadium Blue**: `#1E40AF`. Hover state for primary buttons, active navigation selections, and club portal headers.
- **Midnight Blue**: `#172554`. Super Admin portal chrome, terminal navigation bars, and high-security modal crowns.

### Functional Accents & Status Roles
- **Electric Lime Accent**: `#D9F99D`. High-contrast focal button fill or status badge exclusively used over dark royal/midnight blue header backgrounds. Text on lime must always be Deep Navy `#0F172A`.
- **Ghana Gold Accent**: `#F4C430`. Micro-accent used exclusively for VIP tiers, court lighting overrides, and premium bookings. Paired strictly with charcoal/navy text `#1E293B`.
- **System Success Green**: `#007A33`. Confirmed court bookings, active payment reconciliations, and healthy sensor statuses.
- **System Danger Red**: `#B3261E`. Cancellation states, refunded payments, club deactivation triggers, and overdue accounts.

### Text Hierarchy
- **Navy Primary Text**: `#0F172A`. Headlines, table data values, form labels, and critical indicators.
- **Slate Muted Text**: `#475569`. Secondary captions, metadata, table headers, and helper instructions.
- **Input Border Slate**: `#64748B`. Unfocused, accessible default borders for form fields.

## Typography

The typography relies entirely on **Inter** to ensure maximum computational clarity across high-density administrative views.

### Typographic Directives
- **Tabular Numerics (`tnum`)**: All fiscal values, court timers, membership counters, and pricing strings (e.g., `GH₵ 120.00`) must enforce tabular numbers via `font-feature-settings: 'tnum' on, 'lnum' on`. This prevents horizontal jitter in tables, booking slot calendars, and analytical dashboards.
- **Weight Restraint**: Use only three font weights: `400` (Regular) for descriptions and general values, `500` (Medium) for labels, interactive controls, and financial data, and `600` (Semi-Bold) for page headlines, card titles, and active tabs. Never use `700` or heavier.
- **Currency Convention**: Ghana Cedis must always be prefixed using the official unicode sign and an unbreaking space: `GH₵ 85.00`. Never shorten to `GHS` inside standard table rows unless constrained by mobile tabular viewports.

## Layout & Spacing

The portal layout operates on a 12-column responsive fluid grid pinned within administrative desktop parameters.

### Canvas Grid & Breakpoints
- **Desktop (1280px and above)**: Collapsible fixed-width glass navigation rail (260px expanded, 72px icon-only rail). The main work area spans remaining width with `gutter: 1.5rem` and outer page canvas `margin: 2rem`. Content cards span in columns of 3, 4, 6, or 12.
- **Tablet / Small Laptop (768px – 1279px)**: Navigation docks to an icon rail or top bar. Grid adjusts to 8 columns with `gutter: 1rem` and `margin: 1.5rem`. Multi-court schedule grids switch to horizontal drag-scroll with pinned time labels.
- **Mobile Handheld (Below 768px)**: Navigation moves into an off-canvas drawer. Single-column linear stack, `margin: 1rem`. Data tables switch to card-based ledger items with key-value pairs.

### Rhythm & Alignment
Spacing adheres to a strict 4px base increment (`0.25rem`). Component padding must never be arbitrary:
- Modal, flyout, and card interiors use `space-lg` (24px) for desktop; `space-md` (16px) for compact viewports.
- Stacked form fields enforce `space-md` (16px) separation between label-input clusters.
- Table cell padding is locked to 12px vertical by 16px horizontal to balance scan efficiency with tap accessibility.

## Elevation & Depth

Visual depth is achieved through an intentional discipline: **structural glassmorphism for navigation chrome**, and **crisp 1px outlined surface architecture for operational workflows**.

### Glassmorphism Boundary Rules
Frosted glass is strictly restricted to:
1. **Left Global Navigation Sidebar**: `background: rgba(255, 255, 255, 0.70); backdrop-filter: blur(12px); border-right: 1px solid #E2E8F0`. (On dark super-admin headers: `background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(12px)`).
2. **Top Global Bar**: `background: rgba(255, 255, 255, 0.80); backdrop-filter: blur(8px); border-bottom: 1px solid #E2E8F0`.
3. **Floating Header Cards**: Overlaid across royal blue hero bands (e.g., club occupancy summaries), using `background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.6)`.

*Under no circumstances may frosted glass be applied to data tables, form input fields, modal bodies, or operational cards.*

### Ambient Shadows & Tiers
- **Tier 0 (Flat)**: Work canvas (`#F8FAFC`).
- **Tier 1 (Surface Card)**: Solid `#FFFFFF`, `border: 1px solid #E2E8F0`, `box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.04)`.
- **Tier 2 (Interactive Flyout / Dropdowns)**: Solid `#FFFFFF`, `border: 1px solid #CBD5E1`, `box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.03)`.
- **Tier 3 (Modals & Confirmation Drawers)**: Solid `#FFFFFF`, `box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.04)`. Dimmed scrim behind: `rgba(15, 23, 42, 0.45)`.

## Shapes

The design system enforces a unified curve geometry:

- **Primary Component Radius**: Default radius is locked at **12px** (`rounded-lg` equivalent in this scale) for cards, container panels, modal windows, table envelopes, and interactive banner boxes.
- **Controls & Form Elements**: Input fields, select boxes, and standard buttons utilize **8px** (half-tier curve) to preserve internal vertical space and maintain architectural precision.
- **Pills**: Badges, status markers, court tag filters, and user avatars utilize fully rounded pill contours (`9999px`).
- **Zero Radius Prohibitions**: Never use 0px sharp corners except when separating internal segments of unified button clusters.

## Components

### Buttons & Interactive Triggers
- **Primary Button**: Solid `#1D4ED8` background, `#FFFFFF` text, 8px border radius, height 40px (desktop) or 44px (touch). Hover: `#1E40AF`. Active: `#172554`. Focus: 2px offset ring `#1D4ED8`.
- **Secondary Button**: `#FFFFFF` background, `#0F172A` text, 1px solid `#CBD5E1` border. Hover: `#F8FAFC` background with border `#94A3B8`.
- **Header Accent Button (Over Royal Blue Canvas)**: Solid Electric Lime `#D9F99D` fill, Navy `#0F172A` text, font weight 600. Hover: `#BEF264`. Secondary alternative: Solid White `#FFFFFF` with Navy `#0F172A` text.
- **Destructive Button**: Solid `#B3261E` fill, `#FFFFFF` text. Hover: `#991B1B`.

### Form Inputs & Select Controls
- **Geometry**: Strict 44px height across all standard text inputs, date pickers, and selects to satisfy touch accuracy.
- **Resting State**: 1px solid `#64748B` border on `#FFFFFF` background with 8px radius.
- **Focus State**: 1px solid `#1D4ED8` with an outer 3px glow ring `rgba(29, 78, 216, 0.15)`. No default browser outlines.
- **Layout Rhythm**: Label placed explicitly above the input in `label-md` (`#0F172A`). Helper or error text positioned precisely 4px below in `body-sm`. Error state: `#B3261E` border and message text.

### Data Tables & Booking Grids
- **Wrapper**: Crisp `#FFFFFF` card container, 12px radius, bounded by 1px solid `#E2E8F0`.
- **Header Row**: `#EFF6FF` (Ice Blue) fill, text in `#475569`, uppercase `label-sm`, tracking `0.04em`. 40px height.
- **Body Rows**: Solid white background, alternating row divider 1px solid `#F1F5F9`. Hover state: `#F8FAFC`.
- **Financial Alignment**: Numeric and currency figures right-aligned with tabular figures enabled.

### Badges & Status Indicators
Pill-shaped containers (`px-2.5 py-0.5`, 11px font size, semi-bold):
- **Success (Active / Paid)**: Light green background `rgba(0, 122, 51, 0.10)`, text `#007A33`.
- **Pending / In Review**: Light gold background `rgba(244, 196, 48, 0.18)`, text `#78350F`.
- **Danger (Canceled / Overdue)**: Light red background `rgba(179, 38, 30, 0.10)`, text `#B3261E`.
- **Neutral (Draft / Closed)**: Ice blue background `#EFF6FF`, text `#1D4ED8`.

### Checkboxes & Radio Controls
- Square 18px box with 4px radius (checkbox) or circular 18px disc (radio).
- Unchecked: 1.5px solid `#64748B` border on white background.
- Checked: Solid `#1D4ED8` with crisp white SVG check icon. Focus: 2px offset ring.

### Cards & Metrics
- All metrics cards sit on solid white with 12px radius and 1px `#E2E8F0` border.
- Floating overlay cards applied across top hero sections utilize frosted glass: `bg-white/70 backdrop-blur-md border border-white/60`.

### Forgiving Admin UX Patterns
- **Destructive Actions**: Permanent deletions (e.g., canceling a paid court booking or expelling a club) require explicit confirmation modals with red action buttons and contextual undo toasts with a 10-second buffer window.
- **Input Examples**: Placeholder text must demonstrate real Ghanaian data conventions (e.g., `e.g., 024 123 4567` or `GH₵ 150.00`).
- **Iconography**: Clean 1.5px or 1.75px linear Lucide icons. Never utilize emoji characters or glossy 3D emblems.