# Security & Payments Review - Padel Ghana Platform

## 1. Overview
This document records the security, authorization, and financial integrity audit of the Padel Ghana Platform.

## 2. Key Security Controls

### 2.1 Payments & Billing
- **Integer Pesewas Accounting**: All monetary values (`price_pesewas`, `amount_pesewas`, `balance_pesewas`) are strictly integers (1 GHS = 100 pesewas). Zero float math is permitted in financial logic.
- **Paystack Webhook Verification**: All webhook callbacks are validated via HMAC-SHA512 using `settings.paystack_secret_key`.
- **Double-Confirmation Protection**: Webhook replays are idempotent; if an order is already `PAID`, callbacks return `{"status": "already_processed"}` without re-crediting or re-confirming registrations.
- **Server-Side Verification**: Before finalizing any transaction, `BillingService` verifies transaction status directly with the Paystack REST API.

### 2.2 Authorization & Role Scoping (RBAC)
- **Score Submission**: Only verified match participants or authenticated event organisers/admins may submit courtside scores. Uninvited third parties receive `403 Forbidden`.
- **Administrative Operations**: Duplicate event, cancel event, manual payment confirmations (`MANUAL_MOMO`, `CASH`), and score corrections are restricted to `ORGANIZER` and `ADMIN` roles.
- **Audit Logging**: Every sensitive mutation (score correction, event cancellation, manual payment confirmation, rating override) writes an immutable `AuditLog` row recording actor, timestamp, and details.

### 2.3 Rate Limiting & Anti-Abuse
- **SMS OTP Rate Limiting**: `POST /auth/otp/request` enforces a strict maximum of 3 requests per phone number within a 10-minute sliding window to prevent SMS toll fraud and credit exhaustion. The 4th attempt returns `429 Too Many Requests`.
- **Brute Force Protection**: OTP codes expire after 5 minutes and lock out after 5 incorrect attempts.

### 2.4 Network & HTTP Headers
- **Security Headers**: All responses include `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-XSS-Protection: 1; mode=block`, and HSTS for HTTPS connections.
- **Unbuffered SSE**: Real-time scoreboard streams emit `X-Accel-Buffering: no` and Caddy is configured with `flush_interval -1` to prevent intermediate proxy buffering.
