# Operations Runbook - Padel Ghana Platform

## 1. Production Topology & Deployment
- Reverse Proxy: Caddy on 80/443 with automated Let's Encrypt TLS.
- API: FastAPI on port 8000 (proxied via Caddy) running 4 Uvicorn workers.
- Queue Worker: Procrastinate background worker processing notifications and reminders.
- Database: PostgreSQL 17 on NVMe volume.

### Deployment Commands
```bash
# Pull latest main and build containers
git pull origin main
docker compose -f infra/docker-compose.prod.yml build
# Run database migrations
docker compose -f infra/docker-compose.prod.yml run --rm api uv run alembic upgrade head
# Restart services gracefully
docker compose -f infra/docker-compose.prod.yml up -d
```

## 2. Release Freeze Policy
- **Rule**: Never ship an update on the morning of a club tournament.
- Freeze releases on Friday mornings through Sunday nights during high court utilization in Accra.

## 3. Database Backup & Restore Drills
- **Nightly Backup**: `infra/backup.sh` runs `pg_dump | gzip` and uploads to Cloudflare R2 / S3. Local retention is 30 days.
- **Monthly Restore Drill**: Run `bash infra/restore.sh <path_to_backup.sql.gz>` to test database restore into a temporary drill container without affecting production.

## 4. Outage Fallbacks
- **Paystack Outage**: Organisers can switch events to manual confirmation (`MANUAL_MOMO` or `CASH`) via the organizer dashboard. Registrations remain held for 10 minutes.
- **SMS Gateway Outage**: Users with active email addresses receive backup notifications; console logging is available as immediate fallback in dev/staging.
- **SSE Connection Drops**: Live scoreboards on mobile and web automatically fallback to polling every 10 seconds with exponential reconnect backoff.
