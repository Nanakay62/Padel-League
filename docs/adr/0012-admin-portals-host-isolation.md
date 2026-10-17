# ADR 0012: Admin Portals Host Isolation & Build Verification

## Status
Accepted

## Context
The back office consists of two distinct applications: the Club Back Office (for club owners and staff) and the Super Admin Portal (for platform administrators). To protect against privilege escalation, token confusion, and unauthorized bundle inspection, these applications must run on distinct domain hosts (`CLUB_HOST` and `ADMIN_HOST`).

## Decision
1. **Host-Only Cookies:** Sessions use host-specific cookies (`padel_club_session` on `CLUB_HOST`, `padel_admin_session` on `ADMIN_HOST`) configured with `HttpOnly; Secure; SameSite=Strict`. The backend enforces host matching: club cookies are rejected on the admin host, and admin cookies are rejected on the club host.
2. **Reverse Proxy Topology (Caddy):** Caddy acts as the TLS reverse proxy for `CLUB_HOST` and `ADMIN_HOST`, serving static assets from the portal build and proxying `/portal/*` and `/api/*` directly to FastAPI. Cross-Origin Resource Sharing (CORS) is eliminated as portal requests are same-origin.
3. **Mandatory 2FA (RFC 6238 TOTP):** Platform Super Admins must configure 2FA (TOTP) and store 8 single-use recovery codes before accessing admin features.
4. **Production Build Gate:** `scripts/validate_portal_build.mjs` runs during build/CI to strictly block deployment if `CLUB_HOST` or `ADMIN_HOST` are missing, localhost (`127.0.0.1`), or contain `stitch.google.com`. The asset scanner rejects bundles containing forbidden compliance or marketing claims.
5. **JWT Claim Discrimination & Mobile Bearer Demotion:** Portal session tokens enforce `token_use="portal_session"`. Standard mobile API tokens (`token_use="access"`) are rejected on `/portal/*` routes, enforcing cookie-backed browser access and preventing mobile token replay against admin endpoints.
6. **MFA Brute-Force Lockout:** 5 consecutive failed MFA verification attempts trigger a 15-minute 429 lockout per IP and session (`HTTP_429_TOO_MANY_REQUESTS`).

## Consequences
- Total host and cookie segregation between club operations and platform management.
- Zero cross-host token leaks.
- Build-time safety guarantees preventing development or prototype strings from reaching production.
- Brute-force attacks against TOTP and recovery codes are suppressed by fail-closed rate-limiting.
- Clean separation between mobile app tokens and portal administration sessions.
