# GHANA PADEL PLATFORM: COMPLETION CHECKLIST (FOR GEMINI / ANTIGRAVITY)

> **Companion to** `Ghana_Padel_Platform_Build_Plan.md`. The plan says *what to build*; this file says *how to prove it is done*.

## HOW GEMINI MUST USE THIS FILE

1. Copy this file to `docs/CHECKLIST.md` in the repo. Keep it updated as you work.
2. **Tick a box `[x]` only with evidence**, written beside it: the command you ran and its result, or the exact test name that proves it. Format: `[x] item: evidence: pytest tests/domain/test_americano.py::test_gap_never_exceeds_one PASSED`.
3. **Never tick on assumption.** If you cannot prove it, leave it `[ ]` and write why.
4. Items marked **[HUMAN]** cannot be completed by you. Leave them `[ ]`, list them in your report and ask the developer to confirm.
5. Items marked **[VERIFY]** need current provider documentation read first. Write the doc page you used as evidence.
6. At the end of each phase, print: `Phase N: X/Y items done, Z blocked`, and stop for the developer's "approved".
7. A phase is **not complete** if any item in it is unticked without a written reason. Do not start the next phase.
8. If a later phase breaks an earlier tick, untick it and fix it.

---

## GLOBAL GATES (re-check at the end of EVERY phase)

- [ ] `make check` passes (ruff, mypy, pytest)
- [ ] `cd apps/mobile && npm run lint && npm test && npx tsc --noEmit` passes
- [ ] CI is green on the latest commit
- [ ] No secrets, tokens, or real phone numbers committed (`git log -p | grep -iE "secret|sk_live|sk_test|password"` is clean)
- [ ] No tests were deleted or weakened this phase (`git diff` reviewed for removed assertions)
- [ ] Client API types regenerated after any API change (`npm run api:types`, no diff afterwards)
- [ ] Docs, ADRs and this checklist updated

---

## PHASE 0: DISCOVERY AND WORKSTATION

- [ ] **[HUMAN]** One Accra padel club agreed to a pilot night (club name and contact recorded in `docs/product-notes.md`)
- [ ] **[HUMAN]** Club's courts, hourly prices in GH₵, peak hours, current booking method and payment method (cash/MoMo) noted
- [ ] **[HUMAN]** Accounts created: GitHub (private), Paystack (test mode), Expo, Cloudflare, SMS provider, Sentry
- [ ] git, Python 3.12+, uv, Node LTS, Docker + Compose, eas-cli all print versions
- [ ] `docker run hello-world` works
- [ ] **[HUMAN]** Expo Go opens a sample app on an Android phone
- [ ] Monorepo skeleton exists (`apps/`, `docs/adr/`, `infra/`, `scripts/`) with `.gitignore`
- [ ] `.env` is git-ignored; `.env.example` has names only

## PHASE 1: FOUNDATION

- [ ] `apps/api` created with all listed dependencies (incl. `phonenumbers`, `procrastinate`, `sqladmin`)
- [ ] `apps/mobile` created: Expo Router, TypeScript strict, ESLint, Prettier, Jest
- [ ] Backend layout matches the plan (`domain/`, `identity/`, `venues/`, `events/`, `leagues/`, `billing/`, `rating/`, `notify/`, `tests/`)
- [ ] `config.py` has a typed default for **every** rule in plan Section 3, including `currency="GHS"`, `timezone="Africa/Accra"`, `rounding_unit_pesewas=100`, `seat_hold_minutes=10`
- [ ] `infra/docker-compose.dev.yml` (Postgres 17) and `Makefile` (`dev`, `worker`, `migrate`, `check`) work
- [ ] `GET /health` returns 200; Alembic baseline migration applies and rolls back
- [ ] GitHub Actions: backend job (with Postgres service) and client job (`npx expo export --platform web`) exist
- [ ] **CI proof:** a test was broken on purpose, CI failed, the test was restored, CI passed (link both runs)
- [ ] ADRs written for all 9 decisions in the plan (modular monolith, Expo everywhere, Postgres job queue, money as integer pesewas, SSE with polling fallback, idempotent offline scores, own rating scale, Paystack + manual payments, phone-OTP auth, club-authorised booking integrations only)
- [ ] `GEMINI.md` and `AGENTS.md` at repo root contain every non-negotiable rule from plan Section 0
- [ ] **Design tokens file created** from the approved UI mockups (colours, type scale, spacing, radii) and shared components (Button, Card, Stepper, Badge, ListRow)
- [ ] Button/text colour pairs checked for contrast: normal text **at least 4.5:1** (white on #00C853 is only about 2.2:1, so use charcoal text on that green or a darker green fill); evidence = a contrast table in `docs/design-tokens.md`

## PHASE 2: FIRST VERTICAL SLICE (AMERICANO)

**Domain**
- [ ] `domain/americano.py`, `scoring.py`, `leaderboard.py` implemented as pure functions (no FastAPI/SQLAlchemy imports; verify with `grep -rE "fastapi|sqlalchemy" app/domain` returning nothing)
- [ ] 4 players / 1 court yields exactly the 3 possible partnerships
- [ ] Hypothesis: no player appears twice in a round
- [ ] Hypothesis: games-played gap never exceeds 1 (50 random configurations)
- [ ] Hypothesis: matches per round = `min(courts, n // 4)`
- [ ] Hypothesis: partners repeat only after all distinct pairings are used (where counts allow). Any failing case is reported, not hidden
- [ ] Score validation: sum must equal `point_target`; invalid sum returns 422
- [ ] Leaderboard tie-break order: head-to-head, then point difference

**API**
- [ ] `POST /events`, `POST /events/{id}/players`, `POST /events/{id}/rounds:next`, `POST /events/{id}/matches/{mid}/score`, `GET /events/{id}/live`, `GET /events/{id}/summary.txt` all exist
- [ ] `rounds:next` returns 409 while a round is open
- [ ] Score on a finished event returns 409
- [ ] Replaying one `result_id` 10 times changes nothing after the first (test name recorded)
- [ ] `summary.txt` output is WhatsApp-ready (plain text, no markdown tables, under about 1,000 characters for 12 players)

**Mobile**
- [ ] One screen per round; two **linked** steppers that always sum to the target; each touch target **at least 64 px**
- [ ] Confirm step before submit, in large type
- [ ] Offline queue persists across app restart
- [ ] `expo-keep-awake` active on live screens
- [ ] "Share to WhatsApp" button on results (OS share sheet)
- [ ] Checked at 375 px and 1280 px web, and on a real Android phone
- [ ] **[HUMAN]** A real event run with friends, with a late arrival, a phone losing signal, and a score correction

## PHASE 3: IDENTITY, LEVELS, FINDING PLAYERS

- [ ] `POST /auth/otp/request` and `/auth/otp/verify` work; numbers normalised to E.164 with default region `GH` (`024 123 4567` and `+233241234567` both resolve to one user)
- [ ] OTP: 6 digits, hashed at rest, 5-minute expiry, max 5 attempts, rate limit per number AND per IP (tests prove each)
- [ ] OTP replay and brute force blocked (tests)
- [ ] Access token about 15 min; refresh token rotates and is stored hashed; mobile uses `expo-secure-store`; web uses HttpOnly/Secure/SameSite cookie
- [ ] `SmsProvider` interface + `ConsoleSmsProvider`; no vendor hard-coded
- [ ] Admin login separate: email + argon2 + optional TOTP
- [ ] Guest players added by name + phone; claim via WhatsApp-shareable invite keeps history and rating
- [ ] Profile fields complete (name, level, reliability, side, home venue, play times, competitiveness, regular partners, notification prefs)
- [ ] Level onboarding gives a **range** (e.g. 2.5-3.0) marked PROVISIONAL; organiser adjustment writes a `RatingEvent`
- [ ] Partner finder and "looking for a fourth" posts work; invitations expire
- [ ] **Public display is first name + initial everywhere** (including leaderboards and Top Players); phone numbers revealed only after mutual accept or inside a confirmed event
- [ ] `DELETE /me` anonymises results as "Former player", deletes personal data, leaderboards intact
- [ ] `GET /app/version` minimum-version gate works
- [ ] Login screen, OTP screen and level-onboarding screens built (they were missing from the mockups)

## PHASE 4: VENUES, COURTS AND COST IN GH₵

- [ ] Venue, Court, price bands (pesewas), CourtSlot models and endpoints exist
- [ ] Venue has `ghanapost_gps` (loose validation, never hard-rejects unknown formats), `maps_url`, booking phone, WhatsApp link, "Book at the club" link
- [ ] `domain/money.py`: `price_per_player`, `round_up`, `format_ghs` implemented; **no floats anywhere in money code** (`grep -rE "float|\* 0\.|/ 100\." app/domain/money.py app/billing` is clean)
- [ ] Money tests include rounding edge cases (capacity 3, 5, 7; costs ending in 1 pesewa)
- [ ] Per-player price × capacity is always at least total cost (property test)
- [ ] Published price never changes after publishing (test)
- [ ] Under-filled policy selectable at event creation (absorb / price rises / cancel with refunds)
- [ ] Open matches: publish, join, full state, everyone notified with venue + court
- [ ] Venue page renders correctly for a 3-court club and a 14-court club
- [ ] **One price source of truth:** every UI price comes from the API. Event Detail, Home, Payment and Wallet all show the **same total** for the same event (screenshot evidence for one event across 4 screens). Fee breakdown is consistent (court share + platform fee = total, no double-counting)
- [ ] Display format is `GH₵ 85.00` / `GHS 85` consistently, chosen once in the tokens file

## PHASE 5: PAYMENTS, MANUAL CONFIRMATION, WAITLIST

**5A Manual**
- [ ] `Order.method` supports `PAYSTACK`, `MANUAL_MOMO`, `CASH`
- [ ] Join creates `PENDING_PAYMENT` and holds the seat for `seat_hold_minutes`
- [ ] Player sees organiser's MoMo details or "pay cash at the club" instructions
- [ ] Organiser "Mark paid" confirms the registration and writes `AuditLog` (who, when, amount, reference)
- [ ] A normal player **cannot** call Mark paid (authorisation test)
- [ ] Expired holds release the seat via job
- [ ] **Payment screen has a "Pay at the club / pay organiser" option** and an organiser "Mark paid" list screen

**5B Paystack**
- [ ] **[VERIFY]** Paystack Ghana docs read: channels, fees, MoMo flow, refunds, minimums (doc URLs recorded)
- [ ] Checkout initialises with `amount` in pesewas, `currency: "GHS"`, channels `mobile_money` + `card`, our unique `reference`, `metadata.registration_id`
- [ ] Native flow uses `expo-web-browser` + deep link return; web redirects back
- [ ] Webhook verifies **HMAC-SHA512 signature**; invalid signature rejected (test)
- [ ] Webhook de-duplicates by event/reference; replay never double-confirms (test)
- [ ] Payment is **also verified server-side** with Paystack's verify endpoint before confirming; client redirect is never proof
- [ ] MoMo async flow: "Waiting for approval on your phone" state; polling `GET /orders/{id}`; hold stays valid while pending
- [ ] Simulated slow MoMo (success after 4 min) and timeout/failure both behave correctly (tests)
- [ ] Refunds: automatic where the channel supports it, otherwise platform credit
- [ ] Pair payments: single payer for both seats, or expiring pay-link each
- [ ] Platform fee shown as its own line
- [ ] Network label reads **"AT Money"** (not AirtelTigo) unless Paystack docs say otherwise

**Credits instead of a wallet (legal risk)**
- [ ] Feature is named **Credits**; non-withdrawable; platform-only; issued for cancellations only
- [ ] **No Top Up button and no "wallet balance" payment method in v1**
- [ ] Credit expiry rule stored in config and stated in terms
- [ ] **[HUMAN]** Ghanaian lawyer confirms credit rules before any top-up feature is considered

**5C Waitlist**
- [ ] Position-ordered; freed seat is offered to next person with an exclusive window
- [ ] No offers during quiet hours (22:00-06:00 Africa/Accra)
- [ ] Cancelled event refunds/credits each confirmed player **exactly once** with one notification (test)
- [ ] Seat holds expire correctly after the worker is killed mid-flow (test)

## PHASE 6: FULL EVENT ENGINE

- [ ] `domain/mexicano.py`: ranked pairing, default 1+4 vs 2+3, 1+3 vs 2+4 via `rotation_strategy`
- [ ] **Sit-outs handled for counts not divisible by 4** (fewest games sit out first); test with 5, 6, 9, 10, 11 players
- [ ] Team Americano (fixed pairs) and round-robin sets with golden point / super tiebreak
- [ ] Round gate: next round only when every court has reported (test)
- [ ] Late arrivals and mid-event drop-outs handled (tests)
- [ ] Court rotation so the same people don't always get the worst court
- [ ] SSE `GET /events/{id}/stream` with 10 s polling fallback
- [ ] Read-only TV display URL recovers after network loss, server restart and power cut (manual test: pull network 1 min, restore; evidence = screen recording or log)
- [ ] 200-event simulation passes all invariants (4-32 players, 1-8 courts)
- [ ] Mexicano with 11 players gives explainable pairings each round

## PHASE 7: NOTIFICATIONS AND JOBS

- [ ] Jobs exist: `send_push`, `send_sms` (critical only), `send_email`, `expire_seat_holds`, `waitlist_offer`, `event_reminder` (24h and 2h), `fill_check`, `round_nudge`, `settle_event`, `recalculate_ratings`, `league_deadline`, `strike_expiry`, `backup_database`
- [ ] Each job enqueued **in the same DB transaction** as the change that caused it
- [ ] Each job safe to run twice (test per job); each tested with a frozen clock
- [ ] Per-user monthly SMS cap enforced (test)
- [ ] Quiet hours 22:00-06:00 `Africa/Accra` respected
- [ ] Dead Expo push tokens dropped
- [ ] Reminders include venue, court, Maps link, GhanaPostGPS code
- [ ] Notification deep links open the right screen
- [ ] Nightly backup encrypted and uploaded to R2 (**[HUMAN]** confirm the object exists)

## PHASE 8: CLUB AND ORGANISER BACK OFFICE

- [ ] SQLAdmin views scoped by club (a club admin cannot see another club's data: test)
- [ ] **Duplicate last event** works
- [ ] Organiser can manage player list, waitlist, mark paid, cancel event
- [ ] Score correction requires a reason; leaderboard and ratings recalculate; players notified; `AuditLog` row written
- [ ] Level adjustment writes `RatingEvent`
- [ ] CSV export: registrations, results, settlement
- [ ] Club dashboard: court hours used, fill rate, waitlist demand by slot, new players, unreported matches, pending settlements
- [ ] Weekly summary generated in email/WhatsApp-ready text
- [ ] Create-event and manage-event screens built (missing from mockups)
- [ ] **[HUMAN]** Pilot club runs its own event end to end without touching the database

## PHASE 9: RATING ENGINE

- [ ] `domain/rating.py` doubles-aware, margin-aware, reliability-weighted (K 0.30 new / 0.12 established)
- [ ] Per-match and per-week change caps implemented and tested
- [ ] **Ratings change only via `RatingEvent`** (grep shows no direct rating UPDATE; test enforces)
- [ ] Correcting a score replays ratings from the log correctly (test)
- [ ] Review queue for suspicious results (sandbagging)
- [ ] Rated/unrated competition flag
- [ ] Explained change text ("+0.06: you beat a pair rated 0.4 above you")
- [ ] **Players below 0.85 reliability see a range and a "Provisional" tag, not a single number** (desktop and mobile)
- [ ] Level-band table in app (Beginner 1.0-2.0, Improver 2.0-3.0, Intermediate 3.0-4.0, Advanced 4.0-5.5, Expert 5.5-7.0)
- [ ] Rating history screen works
- [ ] Pilot metric tracked: after 10 matches, under 10% of players request a correction

## PHASE 10: LEAGUES

- [ ] Leagues and events share the **same Match table** (no second results pipeline)
- [ ] Pair league: divisions by combined rating; 3 pts win / 1 played loss / 0 walkover given
- [ ] Tie-break: head-to-head, set difference, game difference
- [ ] Substitute policy implemented
- [ ] `domain/boxes.py` fully implemented (box size 4-6, round robin, promote/relegate top/bottom N)
- [ ] Unplayed matches auto-scored at the deadline by published rule (nightly job test)
- [ ] Box 1 cannot be promoted; last box cannot be relegated (tests)
- [ ] Simulated four-week box cycle promotes/relegates correctly
- [ ] Venue used per match recorded for club demand reporting

## PHASE 11: POLISH, OFFLINE, ACCESSIBILITY

- [ ] Screens exist: Home, Play, Event detail, Live event, Courtside score, Create event, Leagues, My rating, Venues, Partner finder, Credits, Club dashboard, Settings
- [ ] Screens match the approved mockups except where this checklist overrides them
- [ ] **Chat icon removed** (or replaced with a WhatsApp link); no in-app messaging in v1
- [ ] **No placeholder statistics** ("1,240+ players", "18 clubs", "4.7") ship; stats come from real data or are hidden
- [ ] Airplane-mode score entry works; queue replays exactly once; live screen reconnects with backoff
- [ ] Low-end Android: JS bundle size recorded and justified; screens lazy-loaded; tested on a low-RAM emulator profile
- [ ] Data-light mode: no large images auto-load on mobile data; images compressed with placeholders; venue/event lists cached for offline reading
- [ ] Placeholder/AI-generated photos replaced with real club photos **[HUMAN: consent obtained]**
- [ ] Sunlight contrast pass on a real court; minimum body text size 14 px; dynamic text sizes work
- [ ] Dark mode, accessibility labels, landscape, deep links, empty states with next action
- [ ] Web build `output: "static"`; layout adapts by width
- [ ] Phone and currency formatting: `GH₵ 50.00`; +233 entry accepts both local and international forms
- [ ] Verified on web, Android and iPhone

## PHASE 12: SECURITY, PRIVACY, COMPLIANCE

- [ ] Read-only money and security review (prompt B6) run and its report saved to `docs/security-review.md`
- [ ] All high/critical findings fixed and re-reviewed
- [ ] Authorisation + club scoping verified on **every** endpoint (table of endpoints × roles in docs)
- [ ] Strict CORS allow-list; security headers via Caddy; rate limits on auth, join and score endpoints
- [ ] SMS-pumping/cost-abuse protection on OTP (per-number, per-IP, per-country caps, global daily cap)
- [ ] `pip-audit` and `npm audit` clean or exceptions documented; Dependabot on
- [ ] Phone numbers and PII scrubbed from logs and Sentry (test with a fake number)
- [ ] `docs/privacy-data-inventory.md` written; retention periods defined; export and deletion work
- [ ] Photo consent and easy takedown
- [ ] App-store readiness: in-app account deletion, privacy labels / Data safety form, seeded demo account with a live event, location permission requested only on "events near me"
- [ ] **[HUMAN][VERIFY]** Registered with the Data Protection Commission (Act 843)
- [ ] **[HUMAN][VERIFY]** Business registration and tax set up
- [ ] **[HUMAN]** Ghanaian lawyer reviewed Terms, Privacy Policy, refund rules, credit terms
- [ ] **[HUMAN]** Paystack business verification complete for live payments
- [ ] Legal documents linked from checkout

## PHASE 13: DEPLOYMENT, RELEASE, PILOT LAUNCH

- [ ] `docker-compose.prod.yml` (caddy, api, worker, db); Caddy SSE buffering **disabled** on the stream route
- [ ] Staging environment (separate DB and subdomain) works
- [ ] Production deploy requires manual approval
- [ ] Migrations follow expand-and-contract
- [ ] `scripts/backup.sh` and `restore.sh` exist
- [ ] **[HUMAN]** One full test restore completed **before** taking real money
- [ ] EAS: preview build to internal testers works; production profile and OTA config ready
- [ ] `docs/runbook.md` covers deploy, rollback, restore, key rotation, Paystack outage, SMS outage (fallback to manual payments/email)
- [ ] **[HUMAN]** VPS hardened (SSH keys only, firewall, unattended upgrades); Cloudflare DNS; live Paystack webhook URL; spending alerts set
- [ ] **[HUMAN]** Real GH₵ test purchase and refund with live Paystack
- [ ] **[HUMAN]** Google Play internal testing → production; Apple TestFlight; PWA/web link live as fallback
- [ ] **[HUMAN]** Developer present at the pilot club for the first two events
- [ ] No release shipped on the morning of an event

---

## FINAL AUDIT (run after Phase 13; Gemini prints this report)

**A. Invariants (each needs a named passing test)**
- [ ] No player on two courts in the same round
- [ ] Games-played gap never exceeds 1
- [ ] Americano/Mexicano scores always sum to `point_target`
- [ ] Money is integer pesewas everywhere (grep + tests)
- [ ] Court cost split across CONFIRMED players only
- [ ] Ratings change only via `RatingEvent`
- [ ] Score submission is offline-safe and idempotent
- [ ] Every correction, refund, manual payment confirmation, rating override and cancellation writes `AuditLog`
- [ ] No private booking-platform API is called or scraped
- [ ] All timestamps UTC in storage, `Africa/Accra` in display
- [ ] All user-facing strings live in translation files

**B. Ghana-specific**
- [ ] Phone OTP login works with local and international number formats
- [ ] MoMo asynchronous flow handled; manual cash/MoMo path works
- [ ] WhatsApp share works for events, results, leaderboards and invites
- [ ] GhanaPostGPS + Maps link on every venue
- [ ] Works on a low-end Android on mobile data
- [ ] Power-cut recovery proven on the TV display page
- [ ] No wallet top-up; credits only

**C. Event-day checklist (full run on staging)**
- [ ] Create, publish, join and pay as a player (Paystack test mode **and** manual path)
- [ ] Three rounds with an odd player count; late arrival; a player marked out
- [ ] Scores entered from two phones at once; one phone in airplane mode mid-submit
- [ ] Organiser corrects a score; leaderboard and ratings update
- [ ] Event cancelled; refunds/credits issued once; one notification each
- [ ] TV display open 30 minutes, network interrupted once, recovers

**D. Report format**
You print: total items, ticked with evidence, blocked on **[HUMAN]**, blocked on **[VERIFY]**, and failed. The pilot launches only when **every non-HUMAN item is ticked with evidence** and every **[HUMAN]** item has been confirmed by the developer in writing.
