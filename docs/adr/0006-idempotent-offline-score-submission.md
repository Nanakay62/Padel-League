# ADR 0006: Idempotent Offline-First Score Submission

## Status
Accepted

## Context
Indoor courts, glass structures, and metal cages in Ghana frequently degrade cellular connectivity. If a player submits a match result courtside and loses connectivity, the score submission must not be lost or double-counted upon retry.

## Decision
- Score submissions require a client-generated UUID `result_id`.
- The score submission endpoint (`POST /events/{id}/matches/{mid}/score`) is strictly idempotent: if a `result_id` has already been recorded, the server returns the existing result with status 200 without modifying state or recalculating leaderboards.
- The mobile app queues mutations locally using TanStack Query's persisted queue.

## Consequences
- Guaranteed zero lost or duplicated match results under intermittent connectivity.
