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

## 5. Real Android Device Connection Over Local Network (LAN)
When testing on a physical Android device or Expo Go over Wi-Fi, the phone cannot resolve `localhost` on the host PC. Follow these steps:

### 1. Find Host PC's LAN IP
In PowerShell on Windows:
```powershell
ipconfig
# Look for IPv4 Address under your active Wi-Fi or Ethernet adapter (e.g., 192.168.1.150)
```

### 2. Configure Windows Firewall
Allow inbound TCP traffic on port 8000 (run PowerShell as Administrator):
```powershell
netsh advfirewall firewall add rule name="FastAPI Dev Port 8000" dir=in action=allow protocol=TCP localport=8000
```
To remove after testing:
```powershell
netsh advfirewall firewall delete rule name="FastAPI Dev Port 8000"
```

### 3. Start Backend with 0.0.0.0 Host
Bind FastAPI to all network interfaces so it listens on the LAN IP:
```bash
cd apps/api
uv run fastapi dev app/main.py --host 0.0.0.0 --port 8000
```

### 4. Verify Android Phone Can Reach the API
On the physical Android phone, open Chrome or mobile browser and navigate to:
```
http://<YOUR_PC_LAN_IP>:8000/health
```
**Verification Confirmation**: The browser must return HTTP 200 with JSON:
```json
{"status":"healthy","database":"connected","version":"0.1.0"}
```

### 5. Start Mobile App with LAN API URL
In `apps/mobile`:
```bash
$env:EXPO_PUBLIC_API_URL="http://<YOUR_PC_LAN_IP>:8000"
npx expo start --lan
```
Scan the QR code with the Expo Go app on your Android phone (ensure both phone and PC are connected to the same Wi-Fi network/SSID).

