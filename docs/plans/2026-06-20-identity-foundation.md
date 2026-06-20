# Identity Foundation

## Goal

Implement the Phase 1 identity foundation for TezHelp: accounts, phone OTP
verification, Google identity boundaries, role switching, locale persistence,
security audit events, and mobile-first entry screens without a real SMS vendor.

## Non-goals

- No SMSC.kz or production SMS integration.
- No real Google OAuth token verification flow beyond a replaceable adapter
  boundary and safe development contract.
- No provider-category moderation, service catalog, orders, wallets, payments,
  chat, live location, or admin permission model.
- No fake production authentication.

## Context

This follows `prompts/01_IDENTITY_FOUNDATION.md`, `AGENTS.md`, the product
specification, security baseline, domain model, and ADRs. The backend remains
the source of truth. One user may be both customer and provider. A Google
identity can exist before phone verification, but the account remains
incomplete until a phone is verified.

## Assumptions

- Session hardening will be represented by API contracts and secure cookie
  configuration helpers in this phase; full browser session persistence can be
  expanded in a later auth/session task.
- Development OTP is deterministic only in non-production and is never logged.
- Phone numbers are normalized to E.164-like strings at the API boundary for
  this phase; country-specific phone parsing can be hardened before launch.
- Google provider payloads stay inside adapters; public contracts expose only
  internal identity outcomes.

## Architecture impact

- Adds an `identity` backend module with domain policies, application use
  cases, ports, infrastructure adapters, persistence, and thin HTTP
  controllers.
- Adds database tables for users, auth identity links, customer/provider
  profiles, OTP challenges, sessions, and identity security events.
- Extends shared public contracts and validation schemas for identity flows.
- Extends web shell with localized mobile-first identity screens and narrowly
  scoped UI state.
- Adds environment variables for identity provider mode, development OTP,
  session cookie settings, and security limits.
- Uses Redis for rate-limit counters where available and PostgreSQL constraints
  for durable uniqueness.

## Domain invariants

- One verified phone cannot belong to multiple active accounts.
- Development OTP cannot be enabled in production.
- OTPs expire, have resend cooldowns, attempt limits, and rate limits.
- OTP values are not logged or returned by production-safe paths.
- Google identity does not imply trusted phone ownership.
- Phone change requires an authenticated user and recent authentication marker.
- Identity changes are audited.
- A user can hold customer and provider roles at the same time.

## Implementation steps

1. Add identity migration, Kysely schema types, and env validation.
2. Add identity domain value objects, policies, ports, and focused use cases.
3. Add development OTP and Google adapter boundaries with production safety
   checks.
4. Add repositories, Redis-backed rate limiting, and audit integration.
5. Add HTTP routes under `/v1/auth` and `/v1/me`.
6. Add shared validation/types and localized web identity screens.
7. Add unit, integration, and e2e coverage for required flows.
8. Run quality gates and record results.

## Test plan

- Unit: OTP expiration, attempt lockout, locale persistence, role visibility,
  production safety checks, phone normalization.
- Integration: duplicate verified phone constraint, request/verify OTP,
  Google identity requiring phone, successful and unauthorized phone change,
  audit event creation.
- E2E: mobile sign-in/phone/OTP/role/locale shell smoke.
- Migration: apply identity migration after foundation migration.
- Manual: inspect localized identity screens and OpenAPI routes.

## Rollout and rollback

This is pre-production work. Rollback is reverting the identity commit and
running a fresh local database. In production later, rollback would require
keeping migrations additive or adding explicit down migrations for pre-release
environments only.

## Risks

- Authentication touches personal data and must avoid logs containing phones or
  OTP values.
- Incomplete session persistence could be mistaken for production auth if not
  documented clearly.
- Race conditions around phone uniqueness must be enforced by the database, not
  only application checks.
- OTP abuse controls need realistic thresholds before launch.

## Progress

- [x] Plan created
- [x] Database migration and schema types
- [x] Domain/application use cases
- [x] Adapters and safety checks
- [x] HTTP routes
- [x] Web identity screens
- [x] Tests
- [x] Documentation and quality gates

## Decision log

- Use narrow use cases rather than a universal auth service.
- Store OTP hashes in PostgreSQL and enforce runtime rate limits with Redis.
- Keep test OTP adapter available only outside production.

## Completion report

Implemented the Phase 1 identity foundation without a real SMS vendor.

Changed surface:

- Added identity migration `000002_identity_foundation` for users, auth links,
  customer/provider profiles, OTP challenges, sessions, and security events.
- Added NestJS `identity` module with focused use cases for OTP request/verify,
  development Google sign-in, phone completion, phone change, locale update,
  role switching, and current user summary.
- Added development OTP adapter, Redis rate limiting, production safety env
  validation, and development-only `x-tezhelp-user-id` guard.
- Added `/v1/auth/*` and `/v1/me/*` identity routes.
- Added localized mobile-first identity entry UI in `apps/web`.
- Repaired RU/KK/EN dictionaries from mojibake to UTF-8 text.
- Added a Windows-stable e2e runner that starts and stops Next dev servers
  explicitly.

Migrations:

- `pnpm db:migrate` passed locally after fixing the explicit check constraint
  SQL in the identity migration.

Commands run:

- `pnpm db:migrate` - passed.
- `pnpm format` / `pnpm format:check` - passed.
- `pnpm lint` - passed.
- `pnpm typecheck` - passed.
- `pnpm test` - passed.
- `pnpm test:integration` - passed; identity integration tests cover OTP
  expiry, invalid attempt lockout, rate limits, duplicate phone constraint,
  Google account requiring phone, phone change authorization, locale
  persistence, role switching, and audit event creation.
- `pnpm build` - passed.
- `pnpm test:e2e` - passed.
- `.codex/hooks/run_quality_gate.py --full` - passed.

Remaining work:

- Real SMS provider integration is intentionally deferred.
- Production session persistence and real Google token verification need a
  follow-up hardening task before launch.
