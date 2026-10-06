# Privacy & Data Inventory - Padel Ghana Platform

## 1. Compliance Framework
The platform complies with the **Ghana Data Protection Act, 2012 (Act 843)** and international privacy standards (GDPR Article 15, 17, 20).

## 2. Data Inventory & Categories

| Data Element | Purpose | Storage & Protection | Retention Period |
|---|---|---|---|
| **Phone Number (E.164)** | Authentication (SMS OTP) & match notifications | Encrypted at rest, masked in logs (`+23324****567`) | Lifetime of account; tombstoned upon deletion |
| **Player Name** | Leaderboard & match lineups | Public displays first name + initial (`Kofi A.`) | Lifetime of account; anonymized to "Former player" upon deletion |
| **Email Address** | Receipts & export requests (optional) | Normalized, private, never exposed to other players | Lifetime of account; wiped upon deletion |
| **Doubles Rating** | Tournament pairing & fairness | Stored in `player_profiles` and `RatingEvent` ledger | Retained indefinitely for past tournament integrity |
| **Payment Orders** | Audit & club revenue reconciliation | Reference tokens only; no raw card numbers stored | 7 years (statutory financial audit requirement) |

## 3. Data Subject Rights & Endpoints

1. **Right of Access & Portability (Act 843 Section 25 / GDPR Article 20)**:
   - Endpoint: `GET /me/export`
   - Returns structured JSON containing user profile, registered tournaments, and match records.
2. **Right to Erasure / Account Deletion (Apple Guideline 5.1.1 / GDPR Article 17)**:
   - Endpoint: `DELETE /me`
   - Wipes personal details: name becomes `"Former player"`, phone number scrambled to an anonymous tombstone, email cleared, all refresh tokens revoked, and active tournament holds released.
