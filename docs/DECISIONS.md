# TezHelp architecture decision log

## ADR-001 — Modular monolith

Status: accepted.

Use a modular monolith for MVP. Do not start with microservices.

Reason:

- transactional marketplace workflows
- lower operational complexity
- easier local hosting in Kazakhstan
- clear future extraction path

## ADR-002 — Separate backend

Status: accepted.

Use a standalone NestJS backend. Do not place core business logic only in Next.js.

Reason:

- future native mobile client
- realtime
- financial integrity
- reusable API
- background jobs

## ADR-003 — PostgreSQL and PostGIS

Status: accepted.

Use PostgreSQL as source of truth and PostGIS for straight-line radius queries.

## ADR-004 — Ledger wallet

Status: accepted.

Wallet history is append-only. Corrections are compensating transactions.

## ADR-005 — Accepted order price immutable

Status: accepted.

After customer selection, the order price in TezHelp cannot change.

## ADR-006 — Provider completes order

Status: accepted.

Customer confirmation and five-minute auto-confirmation are excluded. Provider completion captures commission immediately.

## ADR-007 — One active order per provider

Status: accepted.

Enforce at application and database levels.

## ADR-008 — Mobile-first web before native mobile

Status: accepted.

First release is responsive web/PWA. Future native app uses the same backend and database.

## ADR-009 — Personal-data production hosting in Kazakhstan

Status: accepted.

Database, files, relevant logs, and backups reside in Kazakhstan.

## ADR-010 — MapLibre and OpenStreetMap foundation

Status: accepted.

Use MapLibre for rendering and OpenStreetMap data. Do not depend on public OSM tile infrastructure for production.

## ADR-011 — Provider adapters

Status: accepted.

SMS, payments, storage, maps, geocoding, routing, and verification are behind interfaces.

## ADR-012 — Three languages from the start

Status: accepted.

Russian, Kazakh, and English are mandatory architecture constraints.

## ADR-013 — Kysely persistence foundation

Status: accepted.

Use Kysely with `pg` and `node-pg-migrate` for the bootstrap persistence
foundation.

Reason:

- explicit SQL and transaction boundaries
- raw SQL support for PostGIS
- type-safe query construction without hiding database behavior
- future wallet and commission workflows need visible, testable transactions

## ADR-014 - Identity development adapters

Status: accepted.

Use a development OTP adapter and development auth header only in local/test
environments. Production environment validation must fail when either unsafe
adapter is enabled.

Reason:

- Phase 1 needs testable identity flows before real SMS integration
- OTP values must never be logged or exposed by production-safe paths
- Google identity must remain separate from trusted phone verification
- local development must not masquerade as production authentication

## ADR-015 - Provider moderation module boundaries

Status: accepted.

Phase 2 provider onboarding is split into `service-catalog`,
`provider-services`, and `moderation` modules.

Reason:

- category policy belongs to service catalog configuration
- provider-owned profiles and documents are separate from admin decisions
- manual moderation decisions need their own audit history and authorization
- future automatic verification can attach through adapters without turning the
  provider module into a god service
- approval must remain independent per service category
