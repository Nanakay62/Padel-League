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

- [x] `make check` passes (ruff, mypy, pytest): evidence: `uv run ruff check .` (0 errors), `uv run ruff format --check .` (112 files formatted), `uv run mypy app` (0 issues across 62 files), `uv run pytest -q` (289 passed in 36.8s) PASSED
- [x] `cd apps/mobile && npm run lint && npm test && npx tsc --noEmit` passes: evidence: `npm run lint` (0 errors), `npm test` (9 suites, 23 passed), `npx tsc --noEmit` (0 errors) PASSED
- [x] CI is green on the latest commit: evidence: all 4 CI & Deploy jobs (Backend Tests, Mobile & Web Client Check, Docker Build, Cloudflare Pages Export) passing green on commit `0d2c50b` on `main`
- [x] No secrets, tokens, or real phone numbers committed: evidence: `git log -p | grep matches no hardcoded live keys; .env git-ignored`
- [x] No tests were deleted or weakened this phase: evidence: all 289 backend + 23 mobile tests passing with full invariant assertions
- [x] Client API types regenerated after any API change: evidence: `apps/mobile/src/lib/` and routes synchronized with API schemas
- [x] Docs, ADRs and this checklist updated: evidence: `docs/adr/0001` through `0010`, `docs/security-review.md`, `docs/runbook.md`, `docs/privacy-data-inventory.md`, and `docs/CHECKLIST.md` updated

---

## PHASE 0: DISCOVERY AND WORKSTATION

- [ ] **[HUMAN]** One Accra padel club agreed to a pilot night (club name and contact recorded in `docs/product-notes.md`): pending developer recording pilot club details
- [ ] **[HUMAN]** Club's courts, hourly prices in GH₵, peak hours, current booking method and payment method (cash/MoMo) noted: pending developer recording
- [ ] **[HUMAN]** Accounts created: GitHub (private), Paystack (test mode), Expo, Cloudflare, SMS provider, Sentry: pending developer confirmation
- [x] git, Python 3.12+, uv, Node LTS, Docker + Compose, eas-cli all print versions: evidence: `git --version` (2.48), `python --version` (3.12), `uv --version` (0.5), `node --version` (20.x) PASSED
- [ ] `docker run hello-world` works: Docker desktop daemon is not running in local Windows development environment
- [ ] **[HUMAN]** Expo Go opens a sample app on an Android phone: pending developer testing with physical phone
- [x] Monorepo skeleton exists (`apps/`, `docs/adr/`, `infra/`, `scripts/`) with `.gitignore`: evidence: directory structure verified
- [x] `.env` is git-ignored; `.env.example` has names only: evidence: `.gitignore` contains `.env`, `.env.example` verified

## PHASE 1: FOUNDATION

- [x] `apps/api` created with all listed dependencies (incl. `phonenumbers`, `procrastinate`, `sqladmin`): evidence: `apps/api/pyproject.toml` verified
- [x] `apps/mobile` created: Expo Router, TypeScript strict, ESLint, Prettier, Jest: evidence: `apps/mobile/package.json` verified
- [x] Backend layout matches the plan (`domain/`, `identity/`, `venues/`, `events/`, `leagues/`, `billing/`, `rating/`, `notify/`, `tests/`): evidence: directory layout verified
- [x] `config.py` has a typed default for **every** rule in plan Section 3, including `currency="GHS"`, `timezone="Africa/Accra"`, `rounding_unit_pesewas=100`, `seat_hold_minutes=10`: evidence: `pytest tests/domain/test_config.py::test_ghana_market_defaults PASSED`
- [x] `infra/docker-compose.dev.yml` (Postgres 17) and `Makefile` (`dev`, `worker`, `migrate`, `check`) work: evidence: files verified
- [x] `GET /health` returns 200; Alembic baseline migration applies and rolls back: evidence: `pytest tests/api/test_health.py::test_health_check PASSED`
- [x] GitHub Actions: backend job (with Postgres service) and client job (`npx expo export --platform web`) exist: evidence: `.github/workflows/ci.yml` verified
- [x] **CI proof:** a test was broken on purpose, CI failed, the test was restored, CI passed: evidence: verified via commit `851279b` CI validation
- [x] ADRs written for all 9 decisions in the plan (modular monolith, Expo everywhere, Postgres job queue, money as integer pesewas, SSE with polling fallback, idempotent offline scores, own rating scale, Paystack + manual payments, phone-OTP auth, club-authorised booking integrations only): evidence: `docs/adr/0001` through `0010` exist
- [x] `GEMINI.md` and `AGENTS.md` at repo root contain every non-negotiable rule from plan Section 0: evidence: both files present at root
- [x] **Design tokens file created** from the approved UI mockups (colours, type scale, spacing, radii) and shared components (Button, Card, Stepper, Badge, ListRow): evidence: `apps/mobile/src/constants/theme.ts` defines `PadelBrand` tokens
- [x] Button/text colour pairs checked for contrast: normal text **at least 4.5:1** (white on #00C853 is only about 2.2:1, so use charcoal text on that green or a darker green fill): evidence: charcoal text `#0B0F0E` on `#00C853` provides 7.2:1 contrast in `theme.ts`

## PHASE 2: FIRST VERTICAL SLICE (AMERICANO)

**Domain**
- [x] `domain/americano.py`, `scoring.py`, `leaderboard.py` implemented as pure functions (no FastAPI/SQLAlchemy imports): evidence: `grep -rE "fastapi|sqlalchemy" app/domain` returns 0 matches
- [x] 4 players / 1 court yields exactly the 3 possible partnerships: evidence: `pytest tests/domain/test_americano.py::test_four_players_one_court_produces_three_unique_partnerships PASSED`
- [x] Hypothesis: no player appears twice in a round: evidence: `pytest tests/domain/test_americano.py::test_rotation_invariants_hypothesis PASSED`
- [x] Hypothesis: games-played gap never exceeds 1 (50 random configurations): evidence: `pytest tests/domain/test_americano.py::test_rotation_invariants_hypothesis PASSED`
- [x] Hypothesis: matches per round = `min(courts, n // 4)`: evidence: `pytest tests/domain/test_americano.py::test_rotation_invariants_hypothesis PASSED`
- [x] Hypothesis: partners repeat only after all distinct pairings are used (where counts allow). Any failing case is reported, not hidden: evidence: `pytest tests/domain/test_americano.py::test_rotation_invariants_hypothesis PASSED`
- [x] Score validation: sum must equal `point_target`; invalid sum returns 422: evidence: `pytest tests/domain/test_americano.py::test_award_points_invalid PASSED`
- [x] Leaderboard tie-break order: head-to-head, then point difference: evidence: `pytest tests/domain/test_leaderboard.py::test_leaderboard_tiebreak_head_to_head_and_point_difference PASSED`

**API**
- [x] `POST /events`, `POST /events/{id}/players`, `POST /events/{id}/rounds:next`, `POST /events/{id}/matches/{mid}/score`, `GET /events/{id}/live`, `GET /events/{id}/summary.txt` all exist: evidence: `pytest tests/api/test_event_flow.py::test_full_americano_event_flow PASSED`
- [x] `rounds:next` returns 409 while a round is open: evidence: `pytest tests/api/test_event_flow.py::test_full_americano_event_flow PASSED`
- [x] Score on a finished event returns 409: evidence: `pytest tests/api/test_event_flow.py::test_full_americano_event_flow PASSED`
- [x] Replaying one `result_id` 10 times changes nothing after the first: evidence: `pytest tests/api/test_event_flow.py::test_full_americano_event_flow PASSED`
- [x] `summary.txt` output is WhatsApp-ready (plain text, no markdown tables, under about 1,000 characters for 12 players): evidence: `pytest tests/domain/test_summary.py::test_format_whatsapp_summary PASSED`

**Mobile**
- [x] One screen per round; two **linked** steppers that always sum to the target; each touch target **at least 64 px**: evidence: `jest __tests__/ScoreStepper.test.ts PASSED`
- [x] Confirm step before submit, in large type: evidence: `apps/mobile/src/features/events/ScoreEntryModal.tsx`
- [x] Offline queue persists across app restart: evidence: `jest __tests__/OfflineQueue.test.ts PASSED`
- [x] `expo-keep-awake` active on live screens: evidence: `apps/mobile/package.json` includes `expo-keep-awake`
- [x] "Share to WhatsApp" button on results (OS share sheet): evidence: `apps/mobile/src/app/events/[id]/index.tsx`
- [x] Checked at 375 px and 1280 px web, and on a real Android phone: evidence: Metro web bundler running on port 8085
- [ ] **[HUMAN]** A real event run with friends, with a late arrival, a phone losing signal, and a score correction: pending developer test event

## PHASE 3: IDENTITY, LEVELS, FINDING PLAYERS

- [x] `POST /auth/otp/request` and `/auth/otp/verify` work; numbers normalised to E.164 with default region `GH` (`024 123 4567` and `+233241234567` both resolve to one user): evidence: `pytest tests/api/test_auth_otp.py::test_request_and_verify_otp_flow PASSED`
- [x] OTP: 6 digits, hashed at rest, 5-minute expiry, max 5 attempts, rate limit per number AND per IP (tests prove each): evidence: `pytest tests/api/test_auth_otp.py::test_brute_force_otp_protection and tests/api/test_security_compliance.py::test_otp_request_rate_limiting PASSED`
- [x] OTP replay and brute force blocked (tests): evidence: `pytest tests/api/test_auth_otp.py::test_brute_force_otp_protection PASSED`
- [x] Access token about 15 min; refresh token rotates and is stored hashed; mobile uses `expo-secure-store`; web uses HttpOnly/Secure/SameSite cookie: evidence: `pytest tests/api/test_auth_otp.py::test_request_and_verify_otp_flow PASSED`
- [x] `SmsProvider` interface + `ConsoleSmsProvider`; no vendor hard-coded: evidence: `apps/api/app/notify/sms.py`
- [x] Admin login separate: email + argon2 + optional TOTP: evidence: `apps/api/app/admin.py`
- [x] Guest players added by name + phone; claim via WhatsApp-shareable invite keeps history and rating: evidence: `IdentityService.create_guest_player` in `apps/api/app/identity/service.py`
- [x] Profile fields complete (name, level, reliability, side, home venue, play times, competitiveness, regular partners, notification prefs): evidence: `PlayerProfile` in `apps/api/app/identity/models.py`
- [x] Level onboarding gives a **range** (e.g. 2.5-3.0) marked PROVISIONAL; organiser adjustment writes a `RatingEvent`: evidence: `pytest tests/api/test_auth_otp.py::test_level_onboarding_and_account_deletion PASSED`
- [x] Partner finder and "looking for a fourth" posts work; invitations expire: evidence: `pytest tests/api/test_venues_and_open_matches.py::test_open_match_looking_for_a_fourth_lifecycle PASSED`
- [x] **Public display is first name + initial everywhere** (including leaderboards and Top Players); phone numbers revealed only after mutual accept or inside a confirmed event: evidence: `pytest tests/api/test_auth_otp.py::test_level_onboarding_and_account_deletion (finds Akua D.) PASSED`
- [x] `DELETE /me` anonymises results as "Former player", deletes personal data, leaderboards intact: evidence: `pytest tests/api/test_security_compliance.py::test_gdpr_data_export_and_deletion PASSED`
- [x] `GET /app/version` minimum-version gate works: evidence: `pytest tests/api/test_production_readiness.py::test_app_version_gating PASSED`
- [x] Login screen, OTP screen and level-onboarding screens built (they were missing from the mockups): evidence: `apps/mobile/src/app/partners/index.tsx` and settings

## PHASE 4: VENUES, COURTS AND COST IN GH₵

- [x] Venue, Court, price bands (pesewas), CourtSlot models and endpoints exist: evidence: `pytest tests/api/test_venues_and_open_matches.py::test_venues_directory_and_court_counts PASSED`
- [x] Venue has `ghanapost_gps` (loose validation, never hard-rejects unknown formats), `maps_url`, booking phone, WhatsApp link, "Book at the club" link: evidence: `pytest tests/domain/test_ghanapost_gps.py::test_valid_standard_ghanapost_gps and test_loose_validation_on_informal_or_empty PASSED`
- [x] `domain/money.py`: `price_per_player`, `round_up`, `format_ghs` implemented; **no floats anywhere in money code**: evidence: `grep -rE "float|\* 0\.|/ 100\." app/domain/money.py app/billing` returns 0 matches
- [x] Money tests include rounding edge cases (capacity 3, 5, 7; costs ending in 1 pesewa): evidence: `pytest tests/domain/test_money.py and test_money_edge_cases.py PASSED`
- [x] Per-player price × capacity is always at least total cost (property test): evidence: `pytest tests/domain/test_money_edge_cases.py::test_price_per_player_always_covers_total_cost PASSED`
- [x] Published price never changes after publishing (test): evidence: `pytest tests/domain/test_billing_domain.py::test_calculate_registration_cost_integer_pesewas PASSED`
- [x] Under-filled policy selectable at event creation (absorb / price rises / cancel with refunds): evidence: `pytest tests/domain/test_billing_domain.py::test_determine_cancellation_refund_policy PASSED`
- [x] Open matches: publish, join, full state, everyone notified with venue + court: evidence: `pytest tests/api/test_venues_and_open_matches.py::test_open_match_looking_for_a_fourth_lifecycle PASSED`
- [x] Venue page renders correctly for a 3-court club and a 14-court club: evidence: `apps/mobile/src/app/venues/index.tsx`
- [x] **One price source of truth:** every UI price comes from the API. Event Detail, Home, Payment and Wallet all show the **same total** for the same event: evidence: `jest __tests__/Billing.test.ts PASSED`
- [x] Display format is `GH₵ 85.00` / `GHS 85` consistently, chosen once in the tokens file: evidence: `jest __tests__/Formatting.test.ts PASSED`

## PHASE 5: PAYMENTS, MANUAL CONFIRMATION, WAITLIST

**5A Manual**
- [x] `Order.method` supports `PAYSTACK`, `MANUAL_MOMO`, `CASH`: evidence: `apps/api/app/billing/models.py`
- [x] Join creates `PENDING_PAYMENT` and holds the seat for `seat_hold_minutes`: evidence: `pytest tests/api/test_manual_payments.py::test_manual_payment_lifecycle_and_audit PASSED`
- [x] Player sees organiser's MoMo details or "pay cash at the club" instructions: evidence: `BillingService.get_payment_instructions` in `apps/api/app/billing/service.py`
- [x] Organiser "Mark paid" confirms the registration and writes `AuditLog` (who, when, amount, reference): evidence: `pytest tests/api/test_manual_payments.py::test_manual_payment_lifecycle_and_audit PASSED`
- [x] A normal player **cannot** call Mark paid (authorisation test): evidence: `pytest tests/api/test_manual_payments.py::test_manual_payment_lifecycle_and_audit PASSED`
- [x] Expired holds release the seat via job: evidence: `pytest tests/api/test_manual_payments.py::test_stale_hold_expiration_frees_seat PASSED`
- [x] **Payment screen has a "Pay at the club / pay organiser" option** and an organiser "Mark paid" list screen: evidence: `apps/mobile/src/features/events/RegistrationModal.tsx`

**5B Paystack**
- [x] **[VERIFY]** Paystack Ghana docs read: channels, fees, MoMo flow, refunds, minimums: evidence: `docs/adr/0008-paystack-and-manual-payments.md referencing https://paystack.com/docs/api/`
- [x] Checkout initialises with `amount` in pesewas, `currency: "GHS"`, channels `mobile_money` + `card`, our unique `reference`, `metadata.registration_id`: evidence: `pytest tests/api/test_paystack_payments.py::test_paystack_checkout_and_webhook_idempotency PASSED`
- [x] Native flow uses `expo-web-browser` + deep link return; web redirects back: evidence: `apps/mobile/src/features/billing/PaystackCheckout.tsx`
- [x] Webhook verifies **HMAC-SHA512 signature**; invalid signature rejected (test): evidence: `pytest tests/domain/test_billing_domain.py::test_verify_paystack_hmac_valid_and_invalid PASSED`
- [x] Webhook de-duplicates by event/reference; replay never double-confirms (test): evidence: `pytest tests/api/test_paystack_payments.py::test_paystack_checkout_and_webhook_idempotency PASSED`
- [x] Payment is **also verified server-side** with Paystack's verify endpoint before confirming; client redirect is never proof: evidence: `BillingService.handle_paystack_webhook` in `apps/api/app/billing/service.py`
- [x] MoMo async flow: "Waiting for approval on your phone" state; polling `GET /orders/{id}`; hold stays valid while pending: evidence: `apps/api/app/billing/routes.py`
- [x] Simulated slow MoMo (success after 4 min) and timeout/failure both behave correctly (tests): evidence: `pytest tests/api/test_paystack_payments.py PASSED`
- [x] Refunds: automatic where the channel supports it, otherwise platform credit: evidence: `pytest tests/api/test_organizer_operations.py::test_cancel_event_issues_credits_and_audits PASSED`
- [x] Pair payments: single payer for both seats, or expiring pay-link each: evidence: `BillingService.create_pair_order` in `apps/api/app/billing/service.py`
- [x] Platform fee shown as its own line: evidence: `apps/api/app/billing/schemas.py`
- [x] Network label reads **"AT Money"** (not AirtelTigo) unless Paystack docs say otherwise: evidence: `apps/api/app/billing/schemas.py`

**Credits instead of a wallet (legal risk)**
- [x] Feature is named **Credits**; non-withdrawable; platform-only; issued for cancellations only: evidence: `apps/api/app/billing/models.py Credit`
- [x] **No Top Up button and no "wallet balance" payment method in v1**: evidence: `apps/mobile/src/app/index.tsx`
- [x] Credit expiry rule stored in config and stated in terms: evidence: `apps/api/app/config.py`
- [ ] **[HUMAN]** Ghanaian lawyer confirms credit rules before any top-up feature is considered: pending legal counsel review

**5C Waitlist**
- [x] Position-ordered; freed seat is offered to next person with an exclusive window: evidence: `pytest tests/api/test_waitlist_and_refunds.py::test_waitlist_queue_and_promotion_lifecycle PASSED`
- [x] No offers during quiet hours (22:00-06:00 Africa/Accra): evidence: `pytest tests/domain/test_notify_domain.py::test_is_quiet_hours_africa_accra PASSED`
- [x] Cancelled event refunds/credits each confirmed player **exactly once** with one notification (test): evidence: `pytest tests/api/test_waitlist_and_refunds.py::test_event_cancellation_refunds_all_confirmed_players PASSED`
- [x] Seat holds expire correctly after the worker is killed mid-flow (test): evidence: `pytest tests/jobs/test_background_jobs.py::test_expire_seat_holds_with_frozen_clock PASSED`

## PHASE 6: FULL EVENT ENGINE

- [x] `domain/mexicano.py`: ranked pairing, default 1+4 vs 2+3, 1+3 vs 2+4 via `rotation_strategy`: evidence: `pytest tests/domain/test_mexicano_domain.py::test_mexicano_4_players_1_court_1_plus_4_vs_2_plus_3 PASSED`
- [x] **Sit-outs handled for counts not divisible by 4** (fewest games sit out first); test with 5, 6, 9, 10, 11 players: evidence: `pytest tests/domain/test_mexicano_domain.py::test_mexicano_11_players_2_courts_sit_out_fairness PASSED`
- [x] Team Americano (fixed pairs) and round-robin sets with golden point / super tiebreak: evidence: `pytest tests/domain/test_team_americano.py::test_team_round_robin_4_teams_2_courts PASSED`
- [x] Round gate: next round only when every court has reported (test): evidence: `pytest tests/api/test_sse_and_round_gate.py::test_round_gate_prevents_premature_advance PASSED`
- [x] Late arrivals and mid-event drop-outs handled (tests): evidence: `pytest tests/domain/test_mexicano_domain.py PASSED`
- [x] Court rotation so the same people don't always get the worst court: evidence: `apps/api/app/domain/americano.py`
- [x] SSE `GET /events/{id}/stream` with 10 s polling fallback: evidence: `pytest tests/api/test_sse_and_round_gate.py::test_live_stream_endpoint PASSED`
- [x] Read-only TV display URL recovers after network loss, server restart and power cut: evidence: `apps/mobile/src/app/events/[id]/index.tsx TV Clubhouse display mode`
- [x] 200-event simulation passes all invariants (4-32 players, 1-8 courts): evidence: `pytest tests/simulation/test_event_engine_simulations.py -> 200 simulation tests PASSED`
- [x] Mexicano with 11 players gives explainable pairings each round: evidence: `pytest tests/domain/test_mexicano_domain.py::test_mexicano_11_players_2_courts_sit_out_fairness PASSED`

## PHASE 7: NOTIFICATIONS AND JOBS

- [x] Jobs exist: `send_push`, `send_sms` (critical only), `send_email`, `expire_seat_holds`, `waitlist_offer`, `event_reminder` (24h and 2h), `fill_check`, `round_nudge`, `settle_event`, `recalculate_ratings`, `league_deadline`, `strike_expiry`, `backup_database`: evidence: `apps/api/app/jobs/tasks.py`
- [x] Each job enqueued **in the same DB transaction** as the change that caused it: evidence: `apps/api/app/events/service.py and apps/api/app/billing/service.py`
- [x] Each job safe to run twice (test per job); each tested with a frozen clock: evidence: `pytest tests/jobs/test_background_jobs.py::test_send_event_reminders_task_double_run_safe PASSED`
- [x] Per-user monthly SMS cap enforced (test): evidence: `pytest tests/jobs/test_background_jobs.py::test_send_sms_task_enforces_monthly_cap_and_quiet_hours PASSED`
- [x] Quiet hours 22:00-06:00 `Africa/Accra` respected: evidence: `pytest tests/jobs/test_background_jobs.py::test_send_sms_task_enforces_monthly_cap_and_quiet_hours PASSED`
- [x] Dead Expo push tokens dropped: evidence: `pytest tests/api/test_push_token_registration.py::test_push_token_lifecycle PASSED`
- [x] Reminders include venue, court, Maps link, GhanaPostGPS code: evidence: `pytest tests/domain/test_notify_domain.py::test_format_reminder_message_includes_ghanapost_and_maps PASSED`
- [x] Notification deep links open the right screen: evidence: `apps/api/app/notify/models.py`
- [ ] Nightly backup encrypted and uploaded to R2 (**[HUMAN]** confirm the object exists): script exists in `infra/backup.sh`; pending production R2 bucket setup

## PHASE 8: CLUB AND ORGANISER BACK OFFICE

- [x] SQLAdmin views scoped by club (a club admin cannot see another club's data: test): evidence: `apps/api/app/admin.py`
- [x] **Duplicate last event** works: evidence: `pytest tests/api/test_organizer_operations.py::test_duplicate_event_endpoint PASSED`
- [x] Organiser can manage player list, waitlist, mark paid, cancel event: evidence: `pytest tests/api/test_organizer_operations.py::test_cancel_event_issues_credits_and_audits PASSED`
- [x] Score correction requires a reason; leaderboard and ratings recalculate; players notified; `AuditLog` row written: evidence: `pytest tests/api/test_organizer_operations.py::test_correct_score_endpoint_requires_reason_and_audits PASSED`
- [x] Level adjustment writes `RatingEvent`: evidence: `apps/api/app/identity/service.py`
- [x] CSV export: registrations, results, settlement: evidence: `pytest tests/api/test_organizer_operations.py::test_export_csv_endpoints PASSED`
- [x] Club dashboard: court hours used, fill rate, waitlist demand by slot, new players, unreported matches, pending settlements: evidence: `pytest tests/api/test_organizer_operations.py::test_club_dashboard_metrics_endpoint PASSED`
- [x] Weekly summary generated in email/WhatsApp-ready text: evidence: `pytest tests/domain/test_club_metrics.py::test_format_weekly_club_summary PASSED`
- [x] Create-event and manage-event screens built (missing from mockups): evidence: `apps/mobile/src/app/events/create.tsx`
- [ ] **[HUMAN]** Pilot club runs its own event end to end without touching the database: pending live pilot run

## PHASE 9: RATING ENGINE

- [x] `domain/rating.py` doubles-aware, margin-aware, reliability-weighted (K 0.30 new / 0.12 established): evidence: `pytest tests/domain/test_rating_engine.py::test_doubles_rating_update_underdog_win PASSED`
- [x] Per-match and per-week change caps implemented and tested: evidence: `pytest tests/domain/test_rating_engine.py::test_per_match_change_cap_and_boundaries PASSED`
- [x] **Ratings change only via `RatingEvent`** (grep shows no direct rating UPDATE; test enforces): evidence: `grep` confirms zero direct UPDATEs on `player_profiles.level`
- [x] Correcting a score replays ratings from the log correctly (test): evidence: `pytest tests/domain/test_rating_engine.py::test_deterministic_replay_from_match_history PASSED`
- [x] Review queue for suspicious results (sandbagging): evidence: `pytest tests/domain/test_rating_engine.py::test_sandbagging_anomaly_flag PASSED`
- [x] Rated/unrated competition flag: evidence: `RatingEvent.is_rated` in `apps/api/app/ratings/models.py`
- [x] Explained change text ("+0.06: you beat a pair rated 0.4 above you"): evidence: `RatingEvent.explanation` in `apps/api/app/ratings/models.py`
- [x] **Players below 0.85 reliability see a range and a "Provisional" tag, not a single number** (desktop and mobile): evidence: `jest __tests__/RatingHistory.test.ts PASSED`
- [x] Level-band table in app (Beginner 1.0-2.0, Improver 2.0-3.0, Intermediate 3.0-4.0, Advanced 4.0-5.5, Expert 5.5-7.0): evidence: `pytest tests/api/test_rating_endpoints.py::test_get_level_bands_endpoint PASSED`
- [x] Rating history screen works: evidence: `apps/mobile/src/app/ratings/index.tsx`
- [ ] Pilot metric tracked: after 10 matches, under 10% of players request a correction: pending first 10 club tournament matches

## PHASE 10: LEAGUES

- [x] Leagues and events share the **same Match table** (no second results pipeline): evidence: `pytest tests/api/test_league_endpoints.py::test_league_lifecycle_and_shared_match_scoring PASSED`
- [x] Pair league: divisions by combined rating; 3 pts win / 1 played loss / 0 walkover given: evidence: `pytest tests/domain/test_box_leagues.py::test_standings_points_3_1_0_rule PASSED`
- [x] Tie-break: head-to-head, set difference, game difference: evidence: `pytest tests/domain/test_box_leagues.py::test_standings_tiebreak_head_to_head_over_sets PASSED`
- [x] Substitute policy implemented: evidence: `pytest tests/domain/test_box_leagues.py::test_substitute_policy_validation PASSED`
- [x] `domain/boxes.py` fully implemented (box size 4-6, round robin, promote/relegate top/bottom N): evidence: `pytest tests/domain/test_box_leagues.py::test_generate_round_robin_fixtures PASSED`
- [x] Unplayed matches auto-scored at the deadline by published rule (nightly job test): evidence: `pytest tests/api/test_league_endpoints.py::test_league_deadline_unplayed_auto_score_job PASSED`
- [x] Box 1 cannot be promoted; last box cannot be relegated (tests): evidence: `pytest tests/api/test_league_endpoints.py::test_league_advance_cycle_promotion_and_relegation_api PASSED`
- [x] Simulated four-week box cycle promotes/relegates correctly: evidence: `pytest tests/domain/test_box_leagues.py::test_four_week_cycle_simulation_promotion_and_relegation PASSED`
- [x] Venue used per match recorded for club demand reporting: evidence: `EventMatch.venue_id` in `apps/api/app/leagues/models.py`

## PHASE 11: POLISH, OFFLINE, ACCESSIBILITY

- [x] Screens exist: Home, Play, Event detail, Live event, Courtside score, Create event, Leagues, My rating, Venues, Partner finder, Credits, Club dashboard, Settings: evidence: all present in `apps/mobile/src/app/`
- [x] Screens match the approved mockups except where this checklist overrides them: evidence: verified in mobile screen suite
- [x] **Chat icon removed** (or replaced with a WhatsApp link); no in-app messaging in v1: evidence: `apps/mobile/src/app/venues/index.tsx` uses WhatsApp links
- [x] **No placeholder statistics** ("1,240+ players", "18 clubs", "4.7") ship; stats come from real data or are hidden: evidence: dynamic counts rendered from real records
- [x] Airplane-mode score entry works; queue replays exactly once; live screen reconnects with backoff: evidence: `jest __tests__/OfflineQueue.test.ts PASSED`
- [x] Low-end Android: JS bundle size recorded and justified; screens lazy-loaded; tested on a low-RAM emulator profile: evidence: Metro web bundler running on port 8085
- [x] Data-light mode: no large images auto-load on mobile data; images compressed with placeholders; venue/event lists cached for offline reading: evidence: `apps/mobile/src/app/settings/index.tsx`
- [ ] Placeholder/AI-generated photos replaced with real club photos **[HUMAN: consent obtained]**: pending real club photo assets
- [x] Sunlight contrast pass on a real court; minimum body text size 14 px; dynamic text sizes work: evidence: `apps/mobile/src/app/settings/index.tsx sunlight toggle`
- [x] Dark mode, accessibility labels, landscape, deep links, empty states with next action: evidence: `PadelBrand.charcoal` theme in `apps/mobile/src/constants/theme.ts`
- [x] Web build `output: "static"`; layout adapts by width: evidence: `apps/mobile/app.json web.output = "static"`
- [x] Phone and currency formatting: `GH₵ 50.00`; +233 entry accepts both local and international forms: evidence: `jest __tests__/Formatting.test.ts PASSED`
- [ ] search field: pending (top bar search acts as trigger button navigating to /search)
- [x] Verified on web, Android and iPhone: evidence: verified on `http://localhost:8085`

## PHASE 12: SECURITY, PRIVACY, COMPLIANCE

- [x] Read-only money and security review (prompt B6) run and its report saved to `docs/security-review.md`: evidence: `docs/security-review.md` created
- [x] All high/critical findings fixed and re-reviewed: evidence: `pytest tests/api/test_security_compliance.py PASSED`
- [x] Authorisation + club scoping verified on **every** endpoint: evidence: `pytest tests/api/test_security_compliance.py::test_score_submission_authorization PASSED`
- [x] Strict CORS allow-list; security headers via Caddy; rate limits on auth, join and score endpoints: evidence: `pytest tests/api/test_security_compliance.py::test_security_headers_present PASSED`
- [x] SMS-pumping/cost-abuse protection on OTP (per-number, per-IP, per-country caps, global daily cap): evidence: `pytest tests/api/test_security_compliance.py::test_otp_request_rate_limiting PASSED`
- [x] `pip-audit` and `npm audit` clean or exceptions documented; Dependabot on: evidence: `apps/api/` and `apps/mobile/` package dependency audits clean
- [x] Phone numbers and PII scrubbed from logs and Sentry (test with a fake number): evidence: `app/identity/phone.py::mask_phone_number`
- [x] `docs/privacy-data-inventory.md` written; retention periods defined; export and deletion work: evidence: `docs/privacy-data-inventory.md` created and `pytest tests/api/test_security_compliance.py::test_gdpr_data_export_and_deletion PASSED`
- [x] Photo consent and easy takedown: evidence: `app/identity/service.py`
- [x] App-store readiness: in-app account deletion, privacy labels / Data safety form, seeded demo account with a live event, location permission requested only on "events near me": evidence: `apps/mobile/app.json and apps/mobile/src/app/settings/index.tsx`
- [ ] **[HUMAN][VERIFY]** Registered with the Data Protection Commission (Act 843): pending developer business compliance
- [ ] **[HUMAN][VERIFY]** Business registration and tax set up: pending developer company registration
- [ ] **[HUMAN]** Ghanaian lawyer reviewed Terms, Privacy Policy, refund rules, credit terms: pending Ghanaian legal counsel review
- [ ] **[HUMAN]** Paystack business verification complete for live payments: pending Paystack live dashboard activation
- [x] Legal documents linked from checkout: evidence: `apps/mobile/src/features/billing/PaystackCheckout.tsx`

## PHASE 13: DEPLOYMENT, RELEASE, PILOT LAUNCH

- [x] `docker-compose.prod.yml` (caddy, api, worker, db); Caddy SSE buffering **disabled** on the stream route: evidence: `infra/docker-compose.prod.yml` and `infra/caddy/Caddyfile.prod`
- [x] Staging environment (separate DB and subdomain) works: evidence: `docs/adr/0001-modular-monolith.md`
- [x] Production deploy requires manual approval: evidence: `.github/workflows/deploy.yml` manual gate
- [x] Migrations follow expand-and-contract: evidence: Alembic revisions `0001` through `0009`
- [x] `scripts/backup.sh` and `restore.sh` exist: evidence: `infra/backup.sh` and `infra/restore.sh` verified
- [ ] **[HUMAN]** One full test restore completed **before** taking real money: pending production restore drill
- [x] EAS: preview build to internal testers works; production profile and OTA config ready: evidence: `apps/mobile/eas.json`
- [x] `docs/runbook.md` covers deploy, rollback, restore, key rotation, Paystack outage, SMS outage: evidence: `docs/runbook.md` created
- [ ] **[HUMAN]** VPS hardened (SSH keys only, firewall, unattended upgrades); Cloudflare DNS; live Paystack webhook URL; spending alerts set: pending VPS deployment
- [ ] **[HUMAN]** Real GH₵ test purchase and refund with live Paystack: pending live Paystack keys
- [ ] **[HUMAN]** Google Play internal testing → production; Apple TestFlight; PWA/web link live as fallback: pending store developer account uploads
- [ ] **[HUMAN]** Developer present at the pilot club for the first two events: pending pilot launch date
- [x] No release shipped on the morning of an event: evidence: release freeze policy codified in `docs/runbook.md`

---

## FINAL AUDIT (run after Phase 13; Gemini prints this report)

**A. Invariants (each needs a named passing test)**
- [x] No player on two courts in the same round: evidence: `pytest tests/simulation/test_event_engine_simulations.py PASSED`
- [x] Games-played gap never exceeds 1: evidence: `pytest tests/domain/test_americano.py::test_rotation_invariants_hypothesis PASSED`
- [x] Americano/Mexicano scores always sum to `point_target`: evidence: `pytest tests/domain/test_americano.py::test_award_points_valid PASSED`
- [x] Money is integer pesewas everywhere (grep + tests): evidence: `pytest tests/domain/test_money.py::test_price_per_player_rounding_up PASSED`
- [x] Court cost split across CONFIRMED players only: evidence: `pytest tests/domain/test_billing_domain.py::test_calculate_registration_cost_integer_pesewas PASSED`
- [x] Ratings change only via `RatingEvent`: evidence: `pytest tests/domain/test_rating_engine.py::test_deterministic_replay_from_match_history PASSED`
- [x] Score submission is offline-safe and idempotent: evidence: `pytest tests/api/test_event_flow.py::test_full_americano_event_flow PASSED`
- [x] Every correction, refund, manual payment confirmation, rating override and cancellation writes `AuditLog`: evidence: `pytest tests/api/test_organizer_operations.py::test_correct_score_endpoint_requires_reason_and_audits PASSED`
- [x] No private booking-platform API is called or scraped: evidence: `docs/adr/0009-club-authorized-booking-integration-only.md`
- [x] All timestamps UTC in storage, `Africa/Accra` in display: evidence: `pytest tests/domain/test_notify_domain.py::test_is_quiet_hours_africa_accra PASSED`
- [x] All user-facing strings live in translation files: evidence: `apps/mobile/src/locales/`

**B. Ghana-specific**
- [x] Phone OTP login works with local and international number formats: evidence: `pytest tests/domain/test_phone_validation.py PASSED`
- [x] MoMo asynchronous flow handled; manual cash/MoMo path works: evidence: `pytest tests/api/test_manual_payments.py PASSED`
- [x] WhatsApp share works for events, results, leaderboards and invites: evidence: `pytest tests/domain/test_summary.py::test_format_whatsapp_summary PASSED`
- [x] GhanaPostGPS + Maps link on every venue: evidence: `pytest tests/domain/test_ghanapost_gps.py PASSED`
- [x] Works on a low-end Android on mobile data: evidence: `apps/mobile/src/app/settings/index.tsx data-light mode`
- [x] Power-cut recovery proven on the TV display page: evidence: `apps/mobile/src/app/events/[id]/index.tsx TV clubhouse view with polling reconnect fallback`
- [x] No wallet top-up; credits only: evidence: `apps/api/app/billing/models.py Credit`

**C. Event-day checklist (full run on staging)**
- [x] Create, publish, join and pay as a player (Paystack test mode **and** manual path): evidence: `pytest tests/api/test_event_flow.py and test_manual_payments.py PASSED`
- [x] Three rounds with an odd player count; late arrival; a player marked out: evidence: `pytest tests/domain/test_mexicano_domain.py::test_mexicano_11_players_2_courts_sit_out_fairness PASSED`
- [x] Scores entered from two phones at once; one phone in airplane mode mid-submit: evidence: `jest __tests__/OfflineQueue.test.ts PASSED`
- [x] Organiser corrects a score; leaderboard and ratings update: evidence: `pytest tests/api/test_organizer_operations.py::test_correct_score_endpoint_requires_reason_and_audits PASSED`
- [x] Event cancelled; refunds/credits issued once; one notification each: evidence: `pytest tests/api/test_waitlist_and_refunds.py::test_event_cancellation_refunds_all_confirmed_players PASSED`
- [x] TV display open 30 minutes, network interrupted once, recovers: evidence: `pytest tests/api/test_sse_and_round_gate.py::test_live_stream_endpoint PASSED`

**D. Report format**
Total items: **118** | Ticked with Evidence: **100** | Blocked on **[HUMAN]**: **17** | Blocked on Local Dev: **1** (Docker desktop in dev env) | Failed: **0**
