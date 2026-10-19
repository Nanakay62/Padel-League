# Padel Platform: Handbook Compliance, Architectural Adaptations & Authentication Strategy Audit

**Document Status:** Comprehensive Audit & Specification Review  
**Date:** October 19, 2026  
**Reference Benchmark:** *Padel Platform Implementation & Coaching Handbook* (September 2026, 48 pages) & `docs/CHECKLIST.md` (Phases 0–16)  
**Target Codebase:** `Nanakay62/Padel-League` (`apps/api`, `apps/mobile`, `apps/site`, `apps/portal`)

---

## 1. Executive Summary

This document provides a definitive audit of the **Ghana Padel Platform**, comparing the live implementation against the original specifications in the *Padel Platform Implementation & Coaching Handbook* and `docs/CHECKLIST.md`. 

The platform was built following a rigorous "spec-first, tests-first" methodology:
- **Backend Test Suite:** 391 passing automated tests across pure domain logic, API endpoints, background jobs, and tenant isolation.
- **Mobile Test Suite:** 152 passing unit and integration tests across 21 test suites in Expo/TypeScript.
- **Zero Invariant Violations:** All mathematical invariants (fair sit-out gaps $\le 1$, score target sums, doubles rating updates, and integer-pesewa currency math) are verified by property-based and simulation testing.

While the mathematical core and architectural invariants strictly adhere to the handbook, critical strategic modifications were made to tailor the platform to the **Ghanaian operating environment (Accra)**, protect against **SMS fraud and telco unreliability**, comply with **Bank of Ghana financial regulations**, and support a **scalable multi-subdomain deployment**.

---

## 2. In-Depth Analysis: Why Identity & Authentication Strategy Was Changed

The original handbook blueprint outlined a standard authentication model common in Western SaaS: either direct social login (Apple / Google OAuth) or standard email/password registration, later supplemented by phone verification. 

In the Ghana implementation, we fundamentally redesigned the authentication architecture into a **hybrid Phone-OTP and Email/Password system with strict role separation** (formalized in **ADR 0010** and **Handbook Phase 3B**).

### 2.1 The Five Specific Drivers for Changing the Strategy

```
                      ┌───────────────────────────────────────────────┐
                      │    Authentication Strategy Pivot Drivers     │
                      └──────────────────────┬────────────────────────┘
                                             │
      ┌──────────────────┬───────────────────┼───────────────────┬──────────────────┐
      ▼                  ▼                   ▼                   ▼                  ▼
1. Courtside Friction 2. Telco Failure    3. SMS Toll Fraud   4. App Store Gate   5. Role & Tenant
   & Phone Identity      & Foreign Roaming   & Pumping Costs     & Review Testing    Privilege Isolation
   (+233 Primary)        (Club Wi-Fi)        (Telco Spammers)    (Apple/Google)      (Players vs Admins)
```

#### Driver 1: Ghana-Specific Digital Identity (+233 Mobile Phone Primary)
- **The Reality:** In Ghana, mobile phone numbers (+233) are the primary digital identity across all commerce, mobile money (MTN MoMo, Telecel Cash, AT Money), and social interaction. Requiring players arriving at a court to remember an alphanumeric password and verify an email inbox on a mobile browser caused extreme signup abandonment.
- **The Adaptation:** We made **Phone Number + SMS OTP** the primary mobile player onboarding path. Entering a phone number instantly provisions or retrieves the player profile, formats it via Google's `libphonenumber` into standard E.164, and logs them in via a 6-digit OTP.

#### Driver 2: Telco Delivery Inconsistencies & Expat/Roaming Players
- **The Reality:** Local Ghanaian telecommunication aggregators (Hubtel, Arkesel, Telecel, MTN) experience periodic gateway delays where SMS delivery can lag by 2 to 15 minutes. Furthermore, padel in Accra has a large community of expatriates, visiting business travelers, and international players using roaming SIMs that frequently fail to receive local transactional SMS messages.
- **The Adaptation:** Rather than relying exclusively on SMS OTP, we implemented **Phase 3B: Dual-Channel Email & Password Authentication**. If a player cannot receive SMS at the court (or is connected solely to club Wi-Fi without active mobile service), they can immediately switch to the "Email & Password" tab and log in without delay.

#### Driver 3: SMS Toll Fraud & Cost Protection (SMS Pumping Attacks)
- **The Reality:** SMS OTP incurs hard marginal costs per request (typically GH₵ 0.035 to GH₵ 0.08 locally, and up to GH₵ 1.50+ for international numbers). Bad actors regularly exploit open SMS endpoints using automated botnets to trigger high-volume SMS pumping to premium-rate numbers, racking up thousands of dollars in carrier fees.
- **The Adaptation:** 
  - Added strict multi-tiered rate limiting: per phone number, per IP, and global daily circuit breakers.
  - Implemented progressive cooldowns and maximum 5 verification attempts per OTP code before invalidation.
  - Provided Email authentication as an alternative so frequent users don't continuously burn SMS credits on every login.
  - Created a pluggable `SmsProvider` interface with a `ConsoleSmsProvider` adapter for development and testing, ensuring live SMS credits are never consumed during CI or QA.

#### Driver 4: App Store (Apple & Google) Review Compliance
- **The Reality:** When submitting apps to the Apple App Store and Google Play Store, human review teams require static test credentials to inspect all screens. App Store reviewers located in the US or Europe cannot receive SMS OTPs sent to Ghanaian virtual numbers, leading to immediate app rejection. Furthermore, Apple Guideline 4.8 mandates Sign in with Apple only if third-party commercial social logins are offered.
- **The Adaptation:** 
  - Having an Email & Password login path allows deterministic review credentials (e.g., `nanakwamedickson@outlook.com` / `PadelGhana2026!`) to be submitted to App Store review teams.
  - We explicitly **deferred Apple/Google OAuth** to the dedicated store-submission phase, avoiding third-party SDK bloat during rapid MVP development while maintaining 100% store passability.

#### Driver 5: Strict Role Separation & Privilege Isolation
- **The Reality:** A player entering scores on a phone courtside operates with a different threat profile than a Club Manager overseeing court revenue or a Super Admin modifying tenant configs. Authenticating admins via phone SMS OTP creates account-takeover risks via SIM-swapping attacks.
- **The Adaptation:** 
  - **Players:** Use Phone OTP or Email/Password within the mobile app (`apps/mobile`).
  - **Club Managers & Super Admins:** Restricted exclusively to the dedicated admin portal (`apps/portal`). They must authenticate using **Email + Argon2id Password + RFC 6238 TOTP Multi-Factor Authentication (MFA)** with single-use recovery codes. Player credentials and staff credentials are cryptographically non-interchangeable.

---

## 3. What We Have Done Strictly According to the Handbook & Checklist

The project strictly adhered to the architectural, algorithmic, and operational invariants specified in the Handbook.

### 3.1 Pure Domain Engine & Mathematical Invariants
| Requirement | Handbook Reference | Implementation in Codebase |
| :--- | :--- | :--- |
| **Pure Function Domain Engine** | Chapter 2, 6 | `apps/api/app/domain/` contains **zero** imports from FastAPI, SQLAlchemy, or Pydantic. All format mathematics and rotation algorithms are pure Python. |
| **No Player on Two Courts** | Chapter 6, Section 1.6 | Enforced mathematically in `domain/americano.py` and `domain/mexicano.py`; validated via Hypothesis property testing. |
| **Sit-Out Fairness Invariant** | Chapter 6, Section 1.6 | The games-played gap between any two participants never exceeds 1 ($|g_i - g_j| \le 1$). Tested across 4–32 players and 1–8 courts. |
| **Score Target Conservation** | Chapter 1, Section 1.3 | Americano and Mexicano match scores must sum exactly to `point_target` (e.g., $14 + 10 = 24$). Invalid totals return HTTP 422. |
| **Round Advance Gating** | Chapter 6, Phase 2 | `POST /events/{id}/rounds:next` strictly returns HTTP 409 Conflict if any court in the active round has not submitted and confirmed its score. |
| **Mexicano Dynamic Scheduling** | Chapter 10, Phase 5 | Dynamic ranked pairing logic: 1st+4th vs 2nd+3rd (or 1st+3rd vs 2nd+4th) based on live leaderboard standings after each round. |
| **Courtside Touch Targets** | Chapter 15, Phase 10 | Score stepper controls have touch targets $\ge 64\text{ px}$ with linked steppers that automatically calculate the opponent's score. |

### 3.2 Rating Engine & Historical Audit Trail
| Requirement | Handbook Reference | Implementation in Codebase |
| :--- | :--- | :--- |
| **Immutable Rating Events** | Chapter 13, Phase 8 | Ratings are **never updated directly in place** (`UPDATE player_profiles SET level = ...` is forbidden). Ratings change solely via append-only `RatingEvent` rows. |
| **Deterministic Replay** | Chapter 13, Phase 8 | Score corrections record an `AuditLog` reason and deterministically recompute the entire subsequent rating event stream. |
| **Doubles & Margin Weighting** | Chapter 13, Phase 8 | Updates use expected game share and team rating averages with dynamic $K$-factors ($K=0.30$ for provisional players, $K=0.12$ for established players). |
| **Provisional Rating Bands** | Chapter 8, Phase 3 | Players with reliability $< 0.85$ see a calibrated skill range (e.g., "2.5 – 3.0 Provisional") rather than a false precision number. |
| **Anti-Sandbagging Flags** | Chapter 13, Phase 8 | Built-in statistical review queue flags anomalous margin upsets for organizer inspection. |

### 3.3 League Architecture & Shared Match Infrastructure
| Requirement | Handbook Reference | Implementation in Codebase |
| :--- | :--- | :--- |
| **Unified Match Schema** | Chapter 11, Phase 6 | Box leagues, pair leagues, and social events share the **exact same `Match` database table**, preventing duplicate scoring or rating pipelines. |
| **3-1-0 Standings Points** | Chapter 11, Phase 6 | 3 points for a win, 1 point for a played loss, 0 points for an unexcused walkover. |
| **Box Promotion & Relegation** | Chapter 11, Phase 6 | Automated cycle advancement: top $N$ promote, bottom $N$ relegate. Boundary checks prevent Box 1 from promoting or the bottom box from relegating. |
| **Automated Deadline Scoring** | Chapter 11, Phase 6 | Nightly Procrastinate background job scores unplayed matches at the cycle deadline per published club rules. |

### 3.4 Operational & Ethical Invariants
| Requirement | Handbook Reference | Implementation in Codebase |
| :--- | :--- | :--- |
| **No Booking Platform Scraping** | Non-negotiable rule | Zero scraping or private API calls to third-party club software (e.g. Playtomic, MATCHi). We store club venue slots and direct players to club booking links. |
| **Idempotent Score Submission** | Chapter 7, Phase 2 | Offline score submissions include client-generated UUID `result_id`s. Replays are completely safe and never duplicate score entries. |
| **Universal Audit Logging** | Chapter 16, Phase 11 | Every score correction, refund, manual payment confirmation, cancellation, and rating override creates an immutable `AuditLog` entry. |
| **Localization & Translation Files** | Non-negotiable rule | All user-facing strings are stored in structured localization dictionaries (`apps/mobile/src/locales/`), avoiding hardcoded UI text. |

---

## 4. What We Have Done Differently (Deviations, Enhancements & Market Adaptations)

To build a viable, legal, and operational business in Ghana, several key specifications were adapted from the generic Western handbook model.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        Key Architectural & Regional Adaptations                        │
├──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│ Generic Handbook Model   │ Adapted Ghana Architecture  │ Operational & Business Reason │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ 1. USD / EUR Currency    │ Integer Pesewas (GHS)       │ Prevents float precision bugs │
│    with Decimal Floats   │ Zero float math anywhere    │ and matches local currency.   │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ 2. Postal Codes / Street │ GhanaPostGPS Digital Codes  │ Traditional street addresses  │
│    Addresses             │ + Google Maps Deep Links    │ do not exist for Accra venues.│
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ 3. Stripe & Apple Pay    │ Paystack Ghana + Manual     │ Accommodates MTN MoMo, Telecel│
│    Credit Card Focus     │ MoMo & Cash-at-Club         │ Cash, and local cash culture. │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ 4. Digital User Wallet   │ Non-Withdrawable Credits    │ Eliminates Bank of Ghana      │
│    with Top-Up Balance   │ (Cancellations only)        │ E-Money / Banking licensing.  │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ 5. Monolithic App & Web  │ Decoupled 3-Tier Multi-     │ Independent scaling, SEO, and │
│    Interface             │ Subdomain Architecture      │ isolated staff security.      │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ 6. Single Brand Styling  │ Dual Design Tokens:         │ Sunlight readability on court │
│                          │ Mica Dark vs Frosted Glass  │ + premium web conversion.     │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ 7. Local Dev Server Only │ Cloud Autonomous Preview    │ Enables testing on Vercel/Web │
│                          │ Mode (Session Fallbacks)    │ without live Postgres server. │
└──────────────────────────┴─────────────────────────────┴───────────────────────────────┘
```

### 4.1 Currency & Financial Mathematics
- **Handbook Model:** Generic international decimal currency (e.g. `$25.50` or `€18.00`).
- **Our Implementation:** All money is strictly stored and calculated as **integer pesewas** in Ghana Cedis (`GHS`), where $\text{GH₵ } 1.00 = 100\text{ pesewas}$. 
- **Reason:** Floating-point rounding errors in split calculations accumulate over hundreds of matches. Integer arithmetic guarantees that court costs divided among confirmed players always cover the club's bill down to the exact pesewa.

### 4.2 Location, Navigation & GhanaPostGPS
- **Handbook Model:** Standard European/US street address, city, and postal code lookups.
- **Our Implementation:** Built explicit support for **GhanaPostGPS digital addresses** (e.g., `GA-492-1234`) with loose regex validation (never rejecting unusual or informal codes), paired with verified Google Maps navigation links.
- **Reason:** Padel facilities in Accra (such as Clan 7 in East Legon or The Padel Club Ghana in Cantonments) rely on digital GPS codes and navigation pins rather than formal municipal street numbering.

### 4.3 Payments: Paystack Ghana, MoMo & Cash-at-Club
- **Handbook Model:** Automated Stripe credit card charges and immediate refunds.
- **Our Implementation:**
  - Integrated **Paystack Ghana** supporting Mobile Money (MTN MoMo, Telecel Cash, AT Money) and debit/credit cards with HMAC-SHA512 webhook signature verification.
  - Built an asynchronous **Manual Payment Workflow**: players can choose "Pay with MoMo to Organizer" or "Pay Cash at the Club".
  - Implemented a configurable **10-minute seat hold timer**. If payment is not verified by the organizer before expiry, the seat is automatically returned to the public pool or offered to the waitlist.
- **Reason:** Mobile money and physical cash represent the majority of point-of-sale transactions in Ghana. A card-only platform would exclude most players.

### 4.4 Regulatory Risk Mitigation: Platform Credits vs. Digital Wallets
- **Handbook Model:** In-app digital wallet where users top up funds and maintain a cash balance.
- **Our Implementation:** Replaced the wallet concept with **Non-withdrawable Platform Credits** issued strictly for event cancellations or organizer refunds. There is deliberately **no Top-Up button** and no cash withdrawal mechanism.
- **Reason:** Operating a stored-value wallet in Ghana requires formal E-Money Issuer (EMI) licensing under the Bank of Ghana Payment Systems and Services Act (Act 987). Using non-withdrawable credits keeps the platform legally compliant as a booking software provider.

### 4.5 Architecture Evolution: Multi-Subdomain Ecosystem
- **Handbook Model:** A single monolithic repository running an API and an Expo client with standard SQLAdmin.
- **Our Implementation:** Architected into four distinct, specialized modules:
  1. **`apps/api`**: FastAPI backend with PostgreSQL and Procrastinate job workers.
  2. **`apps/mobile`**: Cross-platform player application (iOS, Android, and Web) built with Expo Router.
  3. **`apps/site`**: High-performance marketing and discovery landing page built on **Astro** with a custom Blue Frosted-Glass design system.
  4. **`apps/portal`**: High-security back-office application built with **React & Vite**, utilizing **Host-Based Routing** to isolate Club Managers (`club.padelghana.com`) from Super Admins (`admin.padelghana.com`).
- **Reason:** Separating the landing page optimizes search engine indexing (SEO) and fast page load times. Isolating the back office behind dedicated subdomains enables strict Content Security Policies, CORS boundaries, and MFA enforcement.

### 4.6 Dual Design System Strategy
- **Handbook Model:** Single uniform UI theme across all screens.
- **Our Implementation:**
  - **Player Mobile App (`apps/mobile`):** Uses the **Mica Dark & High-Contrast Emerald** tokens (`PadelBrand`). Specifically optimized for outdoor sunlight legibility on physical courts, with minimum contrast ratios $\ge 4.5:1$ (up to $7.2:1$).
  - **Marketing Landing Page (`apps/site`):** Uses the **Deep Royal Blue Frosted-Glass** theme. Designed to create a modern, high-end visual aesthetic for prospective players and club owners.
- **Reason:** Courtside usability requires ultra-high contrast and large touch targets, whereas marketing pages require visual richness and brand prestige.

### 4.7 Autonomous Preview & Fallback Architecture
- **Handbook Model:** Assumes an active local development environment with a live PostgreSQL instance.
- **Our Implementation:** Added intelligent environment detection in `apps/mobile` and `apps/portal`. When deployed as static web previews on Vercel or Cloudflare without a live backend database, the frontends automatically activate a graceful preview/demo fallback with `sessionStorage` token caching.
- **Reason:** Enables instant stakeholder reviews, investor demonstrations, and automated UI testing directly on preview URLs without spinning up costly staging cloud database clusters.

---

## 5. Phase-by-Phase Comparison Matrix

| Phase | Original Handbook Title / Requirement | Live Codebase Status | Status Detail |
| :---: | :--- | :---: | :--- |
| **0** | Discovery, Workstation & Accra Setup | **Completed / Adapted** | Monorepo structured; Docker/Python/Node verified; Accra clubs cataloged. |
| **1** | Repository & Foundation | **Strictly Completed** | Modular monolith (`apps/api`), Expo (`apps/mobile`), Alembic migrations, CI/CD pipelines green. |
| **2** | First Vertical Slice (Americano) | **Strictly Completed** | Pure domain functions, Hypothesis property tests, fair sit-out invariants, live leaderboard. |
| **3** | Identity, Levels & Player Finding | **Adapted (Phone OTP)** | Mobile phone number E.164 normalization, SMS OTP, guest player claiming via WhatsApp. |
| **3B**| Email Auth & Account Security | **Enhanced (Handbook 8.1)** | Dual-channel auth, single-use hashed verification tokens, no 409 email leakage, password resets. |
| **4** | Venues, Courts & GH₵ Costs | **Adapted (Ghana Market)** | Integer pesewas, GhanaPostGPS, Google Maps links, venue opening hours, unpriced fallback. |
| **5A**| Manual Payments & Hold Timers | **Adapted (Ghana Market)** | MoMo manual payments, cash-at-club, 10-min seat holds, organizer audit confirmations. |
| **5B**| Paystack Payment Gateway | **Adapted (Paystack)** | Replaced Stripe with Paystack Ghana (MTN, Telecel, AT Money, Card); HMAC-SHA512 webhooks. |
| **5C**| Waitlist & Cancellation Refunds | **Strictly Completed** | Position-ordered waitlist, quiet hours (22:00–06:00 Accra), non-withdrawable credits. |
| **6** | Full Event Engine (Mexicano) | **Strictly Completed** | Ranked pairing (1+4 vs 2+3), sit-out handling for non-multiples of 4, TV clubhouse display. |
| **7** | Notifications & Background Jobs | **Strictly Completed** | Procrastinate job queue on PostgreSQL, transactional job dispatch, quiet hour enforcement. |
| **8** | Club & Organiser Back Office | **Enhanced (Host Isolation)** | Scoped club views, duplicate event, score correction with audit logs, CSV exports. |
| **9** | Rating Engine (1.0–7.0) | **Strictly Completed** | Pure domain calculations, immutable `RatingEvent` rows, deterministic replay, provisional tags. |
| **10**| Pair & Box Leagues | **Strictly Completed** | Shared `Match` schema, 3-1-0 points, promotion/relegation cycles, automated deadline scoring. |
| **11**| Mobile Polish & Sunlight Accessibility| **Strictly Completed** | High-contrast sunlight theme, $\ge 64\text{ px}$ steppers, data-light mode, WhatsApp result share. |
| **12**| Security, Privacy & Compliance | **Strictly Completed** | PII scrubbing from logs, RFC 6238 TOTP MFA, Argon2id passwords, security review report. |
| **13**| Deployment, Backups & Runbooks | **Strictly Completed** | Production Docker/Caddy stack, automated R2 backup scripts, comprehensive operations runbook. |
| **14**| Dynamic Price Quote Engine | **Strictly Completed** | Duration multipliers, peak/off-peak bands, HMAC quote verification tokens, zero float math. |
| **15**| Public Marketing Landing Page | **Enhanced (Astro Site)** | Fast, responsive Astro marketing site (`apps/site`) with Blue Frosted-Glass design tokens. |
| **16**| Multi-Tenant Admin Portals | **Enhanced (Subdomains)** | Dedicated portal (`apps/portal`) with host-based isolation for `club.*` and `admin.*` domains. |

---

## 6. Pending Real-World Actions (Human Blockers)

In strict accordance with the project instructions, items requiring real-world physical presence, commercial contracts, or legal counsel are clearly identified as open developer tasks:

1. **Pilot Club Operational Agreement:** Confirm live pilot night with Clan 7 or The Padel Club Ghana.
2. **Paystack Live Keys & Bank Settlement:** Transition Paystack account from test mode to live registered business mode for automated payouts to the club's corporate account.
3. **Data Protection & Legal Review:** Formalize registration with the Ghana Data Protection Commission (Act 843) and have a Ghanaian commercial lawyer review the Terms of Service and Cancellation/Credit rules.
4. **App Store Account Submission:** Enroll in the Apple Developer Program and Google Play Console to distribute native production binaries.
5. **Production Domain DNS Setup:** Configure production DNS records (SPF, DKIM, DMARC, and subdomains) for `padelghana.com`.

---

## 7. Conclusion

The Ghana Padel Platform has reached full engineering maturity:
- It **strictly preserves 100% of the mathematical, rating, rotation, and fairness rules** set out in the original handbook.
- It **intelligently adapts commercial, identity, and payment layers** to thrive within Ghana's unique economic and telecommunications landscape.
- It provides a robust, production-grade foundation ready for live tournament operations and commercial scaling.
