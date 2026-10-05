# ADR 0001: Modular Monolith with Pure Domain Layer

## Status
Accepted

## Context
The platform needs to handle social formats (Americano, Mexicano), leagues, ratings, venue management, and payments. Maintaining separate microservices would introduce excessive operational overhead and cost for a small engineering team and pilot budget. Furthermore, padel format rules vary by club and need to be easily testable and adaptable.

## Decision
We choose a **modular monolith** architecture in Python with FastAPI and SQLAlchemy 2 async:
- Domain business logic lives strictly in `apps/api/app/domain/` as **pure Python functions** with zero framework dependencies (no FastAPI, no SQLAlchemy).
- Format and rotation math is tested exhaustively in isolation with pure unit tests and property-based tests (Hypothesis).
- Application boundaries are organized into coherent vertical modules (`identity`, `venues`, `events`, `leagues`, `billing`, `rating`, `notify`).

## Consequences
- Clean separation of concerns.
- Fast, deterministic tests without needing database mocks for format math.
- Low operational complexity running on a single low-cost VPS.
