# ADR 0010: Phone-OTP Primary Authentication

## Status
Accepted

## Context
In Ghana, mobile phone numbers (+233) are the primary digital identity for users across commerce and social applications. Email adoption is lower for quick courtside onboarding, and remembering complex passwords leads to high login abandonment.

## Decision
- Player authentication is anchored on **Phone Number + SMS OTP** (One-Time Password).
- Phone numbers are validated and normalized to E.164 using Google's `phonenumbers` library with region `GH`.
- OTPs are 6 numeric digits, hashed at rest, valid for 5 minutes, with brute-force protection (max 5 verification attempts) and strict rate-limiting per phone number and IP.
- Verification issues a 15-minute JWT access token and a rotating, cryptographically random refresh token hashed in the database.
- Admin users retain email + argon2 password + TOTP authentication.

## Consequences
- Fast, intuitive courtside onboarding for players in Ghana.
- Minimizes sign-up friction while maintaining security and preventing SMS cost abuse.
