# ADR 0008: Paystack and Manual Payments Rail (Centrally Collected)

## Status
Accepted

## Context
Stripe does not directly serve Ghana-based registered businesses without complex offshore setup (Stripe Atlas). In Ghana, the vast majority of consumer electronic transactions take place via Mobile Money (MTN MoMo, Telecel Cash, AT Money) and local debit/credit cards. Furthermore, many pilot clubs and social organizers prefer a manual cash/direct MoMo confirmation flow.

## Decision
- We use **Paystack** as the primary online payment gateway for Ghana (`currency: GHS`, channels: `mobile_money`, `card`).
- In parallel, we provide a **manual payment confirmation path** (`MANUAL_MOMO`, `CASH`) where organizers can verify payment directly and mark confirmed, writing an `AuditLog` row.
- Payments are initially collected into a central platform account and reconciled per event, avoiding immediate Stripe Connect / split disbursement complexity.
- Paystack webhook handlers strictly verify the HMAC-SHA512 signature header and re-query the Paystack transaction verification endpoint before confirming state.

## Consequences
- Frictionless payment experience for Ghanaian players across MoMo and local cards.
- Support for grass-roots club payment habits without blocking unbanked players.
