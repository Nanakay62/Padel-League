# ADR 0009: Integration with Booking Systems Only via Club-Authorised APIs

## Status
Accepted

## Context
Clubs in Ghana frequently utilize proprietary court booking platforms or manual front-desk reservations. Scraping or reverse-engineering private mobile APIs violates terms of service and exposes the platform to sudden breaking changes.

## Decision
- We do not build an adversarial court booking system and never scrape private APIs.
- We record the court slot (`CourtSlot`), its start/end times, and link to the club's booking page, phone number, or WhatsApp contact ("Book at the club").
- Direct integration is implemented only where a club explicitly grants API credentials or webhook access.

## Consequences
- Preserves trust and collaborative relationships with partner clubs.
- Eliminates legal risks and unexpected breakage.
