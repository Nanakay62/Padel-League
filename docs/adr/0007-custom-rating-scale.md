# ADR 0007: Custom Rating Scale (1.0 to 7.0) with Immutable Rating Events

## Status
Accepted

## Context
Commercial platforms use proprietary scales (e.g. Playtomic 0–7, MATCHi 1–7) that do not convert cleanly. Players also experience anxiety and rating disputes when ratings update arbitrarily without transparency.

## Decision
- We use an internal, transparent **1.0 to 7.0 doubles margin-aware Elo rating engine**.
- We never claim official conversion to third-party platforms.
- Ratings are **never mutated directly in place**: every rating change is recorded as an immutable `RatingEvent` row containing the prior rating, new rating, delta, match reference, and timestamp.
- Any score correction or voided match triggers a full deterministic replay of `RatingEvent`s from the event log.

## Consequences
- Full auditability and reconstructability of player rating progression.
- Honest, transparent communication with players.
