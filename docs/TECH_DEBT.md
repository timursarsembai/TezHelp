# TezHelp technical debt and hardening backlog

Open engineering recommendations that are not yet accepted architecture
decisions (see `docs/DECISIONS.md` for those) and not yet scheduled roadmap
phases (see `docs/ROADMAP.md`). Update status as items are picked up or
resolved. Do not delete entries; mark them `done` with the date and PR/commit
reference instead, so the backlog stays a searchable history.

Status values: `open`, `in progress`, `done`.

## Blocking before any real external user

### 1. Real authorization (RBAC), not development headers

Status: done (2026-07-03).

Replaced `DevelopmentIdentityGuard`/`DevelopmentAdminGuard` (which only
checked for the presence of `x-tezhelp-user-id` / `x-tezhelp-admin-user-id`
headers, no signature or session verification) with real server-issued,
DB-backed sessions: an opaque token in an HttpOnly cookie, hashed
(SHA-256, same pattern as OTP hashing) before storage in `user_sessions`,
verified on every request by `SessionAuthGuard`/`StaffAuthGuard`
(`apps/api/src/foundation/authorization/`). Added `is_staff`/`staff_role` to
`users` as the minimal RBAC surface (migration `000011`), `POST /v1/auth/logout`
for revocation, `GET /v1/admin/me` as a real server-side staff check, and an
`Origin`-header allowlist check on mutating requests as CSRF defense-in-depth
now that auth moved to cookies. Frontend (`apps/web`, `apps/admin`) dropped
`sessionStorage` and all scattered `x-tezhelp-*` header injection in favor of
`credentials: "include"` + bootstrapping via `GET /v1/me` / `GET /v1/admin/me`
on mount. Verified end-to-end through the real Next.js rewrite proxy
(`/backend/*`), not just direct API calls.

### 2. Rate limiting only covers OTP

Status: done (2026-07-03).

Extracted `RedisRateLimitRepository` and `RateLimitPort` from the identity
module to `apps/api/src/foundation/rate-limit/` (`RateLimitModule`) to break
the potential circular dependency with `AuthorizationModule`. Added
`RateLimitGuard` + `@RateLimit({ limit, windowSeconds })` decorator in
`foundation/authorization/`. The guard keys on `identityUserId ??
adminUserId ?? req.ip` and delegates to the existing Redis INCR+EXPIRE
fixed-window counter.

Protected endpoints and limits (all configurable via env vars):
- `POST /auth/otp/verify` — 5/15 min per IP (`RATE_LIMIT_OTP_VERIFY_PER_15MIN`)
- `POST /orders` — 20/hour per user (`RATE_LIMIT_ORDERS_CREATE_PER_HOUR`)
- `POST /provider/orders/:id/offers` — 30/hour per user (`RATE_LIMIT_OFFERS_SUBMIT_PER_HOUR`)
- `POST /admin/wallet/manual-credit` — 30/hour per admin (`RATE_LIMIT_ADMIN_WALLET_PER_HOUR`)
- `POST /admin/wallet/manual-debit-correction` — 30/hour per admin
- `POST /orders/:id/chat/messages` — 120/hour per user (`RATE_LIMIT_CHAT_MESSAGES_PER_HOUR`)
- `POST /provider/orders/:id/location` — 600/hour per user (`RATE_LIMIT_LOCATION_UPDATES_PER_HOUR`)

References: `apps/api/src/foundation/rate-limit/`, `apps/api/src/foundation/authorization/rate-limit.guard.ts`.

## Should fix before production scale

### 3. `AuditEventRepository` is dead code

Status: done (2026-07-03).

Refactored all 8 direct `trx.insertInto("audit_events")` call sites (identity,
moderation, orders ×4, wallet, reputation, service-catalog) to go through
`AuditEventRepository.append(event, trx?)`. The `append()` method now accepts
an optional Kysely executor so callers inside transactions pass their `trx` and
the write stays atomic with the business operation. `AuditModule` is now
imported by all six feature modules, making `AuditEventRepository` a true
single control point for future PII scrubbing in `metadata`.

References: `apps/api/src/foundation/audit/audit-event.repository.ts`.

### 4. No dependency/secret scanning in CI

Status: done (2026-07-04).

Added a parallel `security` job to `.github/workflows/ci.yml` (runs without
Docker infra): `pnpm audit --audit-level=high` for known CVEs in the lock file,
and `trufflesecurity/trufflehog@v3.88.27 --only-verified` for leaked credentials
in PR diffs and push commits. Added `.github/dependabot.yml` with weekly
automated PRs for both npm packages and GitHub Actions versions
(open-pull-requests-limit: 5 each).

References: `.github/workflows/ci.yml`, `.github/dependabot.yml`.

### 5. No concurrency/load test for wallet ledger and commission reservations

Status: done (2026-07-04).

Added `apps/api/src/wallet/wallet-concurrency.integration-spec.ts` — four
`Promise.all` / `Promise.allSettled` integration tests against a real
Postgres instance (skipped when Docker infra is absent):

1. 8 concurrent manual credits with the **same** idempotency key → exactly
   one ledger entry, balance = 1 000 KZT.
2. 8 concurrent manual credits with **distinct** keys → all 8 commit,
   balance = 8 000 KZT.
3. 8 concurrent commission captures with the **same** idempotency key →
   exactly one capture row, reservation state = `captured`.
4. 5 concurrent commission captures with **distinct** keys against one
   reservation → exactly one fulfills, the other 4 reject (row-level lock
   prevents double-capture), reservation state = `captured`.

References: `apps/api/src/wallet/wallet-concurrency.integration-spec.ts`.

### 6. Database connection pool size is hardcoded

Status: open.

`database.module.ts` hardcodes a Kysely/pg pool max of 10 connections.
Fine for MVP load, but should be an env-configurable value now rather than a
value to rediscover during a production incident.

References: `apps/api/src/foundation/database/database.module.ts`.

## Architectural gap, not urgent yet

### 7. Chat and live-location are polling-based, not realtime

Status: open (tracked conceptually in `docs/plans/2026-06-22-live-location-foundation.md`
as future work, listed here so it is not lost as just a README footnote).

For an emergency roadside assistance product, location update latency is a
core UX property, not a nice-to-have. Recommend designing the WebSocket
transport (NestJS Gateway) before a real pilot with paying providers, not
deferred indefinitely as "future work".

---

## Resolved

### Audit logging gaps across wallet, sanctions, tariff changes, and role switching

Status: done (2026-07-02).

Found and closed 4 gaps against the required audit list in
`docs/SECURITY_PRIVACY.md`: manual wallet credit/debit correction, sanction
apply/lift/appeal, service-category commercial-config updates (previously not
audited at all — `adminUserId` was not even passed to the use case), and role
switching. All now dual-write a domain event/ledger row plus a generic
`audit_events` row, consistent with the existing pattern in `orders` and
`moderation`.
