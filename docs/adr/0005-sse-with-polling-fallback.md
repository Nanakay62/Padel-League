# ADR 0005: Server-Sent Events (SSE) with Polling Fallback

## Status
Accepted

## Context
During live tournaments (Americano, Mexicano), players courtside and spectators on club displays watch real-time leaderboard and round updates. WebSockets require stateful connection infrastructure and separate proxy connection handling.

## Decision
- Real-time updates use lightweight **Server-Sent Events (SSE)** over standard HTTPS (`GET /events/{id}/stream`).
- Caddy reverse proxy disables response buffering (`flush_interval -1`).
- The client app implements an automatic 10-second polling fallback if the SSE connection drops or is blocked by network intermediaries.

## Consequences
- Zero dedicated WebSocket gateway costs.
- Robust reconnection courtside even under unstable cellular coverage in Accra.
