# ADR 0003: PostgreSQL-Backed Job Queue (Procrastinate)

## Status
Accepted

## Context
Background tasks (waitlist expirations, SMS/push reminders, rating recalculation, event settlements) require reliable scheduling and execution. Running an additional Redis or RabbitMQ cluster adds infrastructure maintenance and monthly hosting costs.

## Decision
We use **Procrastinate** backed directly by PostgreSQL:
- Jobs are enqueued within the exact same database transaction as the business operation that triggers them, ensuring atomic consistency (e.g., rolled-back registrations never send notifications).
- No Redis instance is needed.

## Consequences
- Zero additional database/cache services to maintain or pay for.
- Transactional integrity between application state changes and background jobs.
