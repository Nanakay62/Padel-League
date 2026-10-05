# GEMINI.md - Padel Ghana Platform

## Product
Cross-platform padel platform for Ghana (Android, iPhone, Web): Americano and Mexicano events, pair and box leagues, venue directory, event fees in Ghana Cedis (GHS), ratings, and club back office.
Backend: Python 3.12+, FastAPI, SQLAlchemy 2 async, Alembic, PostgreSQL, Procrastinate.
Client: Expo + Expo Router + TypeScript (apps/mobile).

## Commands
- Backend dev: `make dev` / `cd apps/api && uv run fastapi dev app/main.py --host 0.0.0.0`
- Worker: `make worker` / `cd apps/api && uv run procrastinate --app=app.jobs.app worker`
- Migrate: `make migrate` / `cd apps/api && uv run alembic upgrade head`
- Check backend: `make check` / `cd apps/api && uv run ruff check . && uv run ruff format --check . && uv run mypy app && uv run pytest -q`
- Check mobile: `cd apps/mobile && npm run lint && npm test && npx tsc --noEmit`

## Non-Negotiable Rules
- Format and rotation logic lives in `apps/api/app/domain/` as **pure Python functions** (no FastAPI, no SQLAlchemy) with unit tests. Routes and screens never re-implement format maths.
- A player is never on two courts in the same round. The games-played gap between any two participants never exceeds 1.
- Americano/Mexicano scores must add up exactly to the event's `point_target`.
- **Money is stored as integer pesewas** (1 GH₵ = 100 pesewas). Never floats. Currency is `GHS`. Court cost is split across CONFIRMED players only.
- Ratings change only through `RatingEvent` rows. Never edit a rating in place.
- Score entry works **offline** and is **idempotent** (client-generated `result_id`; replays never double-apply).
- Every score correction, refund, manual payment confirmation and rating override writes an `AuditLog` row.
- Never scrape or call a booking platform's private API. Booking happens at the club. We store the slot and link to the club.
- Regenerate client API types after any API change (`npm run api:types`).
- Time zone is `Africa/Accra` (UTC+0, no daylight saving). Store all timestamps in UTC.
- All user-facing text goes in translation files, even though we ship English first.

## Working Method (Every Phase)
1. **Plan first.** Short plan: files to change, data model changes, tests first, risks. Wait for "approved".
2. **Tests first, then code.** Write failing tests, then implement.
3. **Validate.** Run `make check` and client checks. Both must pass.
4. **Report.** Finish with: changed files, commands run, test results, assumptions, open risks.
5. Only edit paths named in the current phase. Stop and ask before adding dependencies, changing schema outside plan, or touching payments/rotation/ratings outside plan.
6. **Stop conditions:** tests being weakened/deleted; same failure repeated 3 times; diff exceeds 15-min review; unapproved booking APIs.
7. Never read or print production secrets. Never deploy. Never run destructive database commands.
