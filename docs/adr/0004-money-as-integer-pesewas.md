# ADR 0004: Money Stored Strictly as Integer Pesewas

## Status
Accepted

## Context
Floating-point arithmetic introduces rounding and precision errors that can cause financial discrepancies during cost splitting and payment reconciliation. In Ghana, the currency is the Ghana Cedi (`GHS`), divided into 100 pesewas.

## Decision
- All monetary amounts across the database, domain logic, APIs, and billing engines are stored as **strictly non-negative integers representing pesewas** ($1\text{ GH₵} = 100\text{ pesewas}$).
- Court cost splitting across confirmed players uses ceiling integer arithmetic and rounds up to the configured rounding unit (`rounding_unit_pesewas = 100` by default, whole Cedis).
- Floating-point representations for money are strictly forbidden.

## Consequences
- Total per-player collections are mathematically guaranteed to be greater than or equal to total event costs ($\sum \ge \text{cost}$).
- Full auditability without fractional cent/pesewa rounding leakage.
