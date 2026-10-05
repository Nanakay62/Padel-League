# ADR 0002: Expo Cross-Platform Client for Web, Android, and iOS

## Status
Accepted

## Context
Padel players and organisers enter scores courtside on mobile phones, while organizers and admins also use laptops/desktops. Ghana is heavily Android-first, but players also use iPhones and mobile web browsers.

## Decision
We build a single cross-platform client codebase in TypeScript using **Expo (React Native) + Expo Router**:
- Unified codebase deployed to Android, iOS, and Web (static pre-rendering on Cloudflare Pages).
- Courtside scoring is optimized for one-handed operation on low-end Android devices with high-contrast UI for outdoor sunlight.
- State management and server queries use TanStack Query with persisted offline mutation queues.

## Consequences
- Eliminates duplicated frontend logic across platforms.
- Over-the-air updates (via EAS Update) allow rapid bugfixes during live event tournaments.
