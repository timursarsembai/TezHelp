# TezHelp

TezHelp is a marketplace for emergency roadside services in Kazakhstan. This
repository is a production-oriented foundation: mobile-first web, separate
admin web, standalone NestJS API, shared packages, local infrastructure, and the
provider moderation, orders/offers/wallet, chat, live location, and first
reputation/sanctions foundations.

## Requirements

- Node.js 24
- pnpm 11.8.0 through Corepack or a direct install
- Docker with Docker Compose for PostGIS, Redis, and MinIO
- Python 3 for Codex hooks

On Windows, `npm.ps1` may be blocked by PowerShell execution policy. Prefer
`corepack enable pnpm` and run `pnpm.cmd` if needed.

## Setup

```bash
corepack enable pnpm
corepack use pnpm@11.8.0
pnpm install
pnpm infra:up
pnpm db:migrate
pnpm dev
```

Apps:

- Web: `http://localhost:3000`
- Admin: `http://localhost:3001`
- API: `http://localhost:4000`
- OpenAPI: `http://localhost:4000/openapi.json`
- Swagger UI: `http://localhost:4000/docs`
- MinIO console: `http://localhost:9001`

## Identity Foundation

Implemented development endpoints:

- `POST /v1/auth/otp/request`
- `POST /v1/auth/otp/verify`
- `POST /v1/auth/google/development`
- `GET /v1/me`
- `POST /v1/me/phone-completion/request`
- `POST /v1/me/phone-completion/verify`
- `POST /v1/me/phone-change/request`
- `POST /v1/me/phone-change/verify`
- `PATCH /v1/me/locale`
- `PATCH /v1/me/role`

Development OTP is configured by `IDENTITY_DEVELOPMENT_OTP` and defaults to
`123456`. The development OTP adapter and `x-tezhelp-user-id` development auth
header are rejected in production by environment validation. Do not use these as
production authentication.

## Provider Moderation Foundation

Implemented development endpoints:

- `GET /v1/service-categories`
- `GET /v1/provider/profile`
- `PATCH /v1/provider/profile`
- `GET /v1/provider/service-profiles`
- `POST /v1/provider/service-profiles`
- `POST /v1/provider/service-profiles/:serviceProfileId/submit`
- `GET /v1/provider/service-profiles/:serviceProfileId/offer-eligibility`
- `POST /v1/provider/documents`
- `GET /v1/provider/documents/:documentId/access-url`
- `GET /v1/admin/provider-moderation/queue`
- `GET /v1/admin/provider-moderation/service-profiles/:serviceProfileId`
- `POST /v1/admin/provider-moderation/service-profiles/:serviceProfileId/review`
- `POST /v1/admin/provider-moderation/service-profiles/:serviceProfileId/approve`
- `POST /v1/admin/provider-moderation/service-profiles/:serviceProfileId/reject`
- `POST /v1/admin/provider-moderation/service-profiles/:serviceProfileId/suspend`
- `GET /v1/admin/provider-moderation/documents/:documentId/access-url`

Provider endpoints use the development `x-tezhelp-user-id` header. Admin
moderation endpoints use `x-tezhelp-admin-user-id`. Both are local/test
adapters only and are rejected in production through the same development-auth
environment guard.

## Orders, Offers, Wallet Foundation

Implemented development endpoints:

- `POST /v1/orders`
- `GET /v1/orders/:orderId`
- `POST /v1/orders/:orderId/select-provider`
- `GET /v1/orders/:orderId/offers`
- `GET /v1/provider/orders`
- `GET /v1/provider/order-discovery-preferences`
- `PATCH /v1/provider/order-discovery-preferences`
- `POST /v1/provider/orders/:orderId/offers`
- `GET /v1/provider/wallet`
- `GET /v1/provider/wallet/ledger`
- `POST /v1/admin/wallet/manual-credit`
- `POST /v1/admin/wallet/manual-debit-correction`
- `GET /v1/admin/service-categories/:slug/commercial-config`
- `PATCH /v1/admin/service-categories/:slug/commercial-config`

This slice publishes Almaty orders, lets eligible approved providers discover
orders through optional PostGIS radius filtering, submits one offer per provider
per order, consumes free response credits or a response fee atomically, freezes
the selected offer price, reserves commission, and enforces one active assigned
order per provider. Completion, cancellation, phone reveal, real payments, and
production RBAC remain future work.

## Active Order Lifecycle Foundation

Implemented development endpoints:

- `GET /v1/orders/:orderId/contact`
- `POST /v1/orders/:orderId/cancel`
- `POST /v1/provider/orders/:orderId/depart`
- `POST /v1/provider/orders/:orderId/arrive`
- `POST /v1/provider/orders/:orderId/start-work`
- `POST /v1/provider/orders/:orderId/complete`
- `POST /v1/provider/orders/:orderId/cancel`
- `POST /v1/admin/orders/:orderId/cancel`

This slice moves assigned orders through departure, arrival, work started, and
provider completion. Completion captures the reserved commission atomically.
Customer/provider/admin cancellation releases or holds the reservation
according to the current cancellation matrix. Contact visibility opens only to
assigned parties after provider departure and closes on terminal statuses.
Production RBAC, activity sanctions, complaints, reviews, and real phone
masking remain future work.

## Chat and Attachments Foundation

Implemented development endpoints:

- `GET /v1/orders/:orderId/chat`
- `POST /v1/orders/:orderId/chat/messages`
- `POST /v1/orders/:orderId/chat/messages/:messageId/report`
- `GET /v1/orders/:orderId/chat/attachments/:attachmentId/access-url`
- `GET /v1/admin/orders/:orderId/chat`
- `GET /v1/admin/orders/:orderId/chat/attachments/:attachmentId/access-url`

This slice creates one conversation per selected order, allows assigned
customer/provider text messages and private photo/voice attachment metadata,
returns short-lived audited signed URLs for attachment reads, stores idempotent
message reports for dispute review, and provides an internal use case for
system event messages. Realtime delivery, browser upload orchestration, malware
scanning, complaint resolution, and production RBAC remain future work.

## Live Location Foundation

Implemented development endpoints:

- `POST /v1/provider/orders/:orderId/location`
- `GET /v1/orders/:orderId/location`
- `GET /v1/admin/orders/:orderId/location`

This slice lets the assigned provider publish browser GPS points only after
departure, stores current and historical points with PostGIS, exposes customer
and provider marker coordinates only to assigned parties or authorized admins,
and marks waiting/current/stale/offline state without inferring movement.
Realtime WebSocket delivery, real browser geolocation loops, route calculation,
location retention jobs, and production RBAC remain future work.

## Reputation and Sanctions Foundation

Implemented development endpoints:

- `POST /v1/orders/:orderId/reviews`
- `GET /v1/provider/orders/:orderId/customer-reliability`
- `GET /v1/providers/service-profiles/:serviceProfileId/reliability`
- `GET /v1/provider/sanctions`
- `POST /v1/provider/sanctions/:sanctionId/appeal`
- `POST /v1/admin/providers/:providerUserId/sanctions`
- `POST /v1/admin/provider-sanctions/:sanctionId/lift`

This slice allows one customer-to-provider and one provider-to-customer review
after order completion, updates category-specific provider rating from real
reviews, derives customer reliability indicators from order history, records
manual provider sanctions with append-only events, accepts provider appeals, and
blocks new offer publication while an active provider or service-profile
sanction exists. The public provider reliability endpoint exposes only aggregate
service-profile trust signals and boolean offer eligibility; sanction reasons
and event history remain private. Automatic activity-score penalties,
seven-cancellation automation, complaint workflows, ranking changes, and
production RBAC remain future work.

## Canonical Commands

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
pnpm build
```

Docker-dependent commands:

```bash
pnpm infra:up
pnpm db:migrate
pnpm db:backup:validate
pnpm infra:down
pnpm local:dev
```

`test:integration` loads `.env.example` for local Docker defaults. Run it after
`pnpm infra:up` and `pnpm db:migrate` when validating the Docker-backed health
checks.

`db:backup:validate` creates a local PostgreSQL custom-format dump under
`backups/postgres/`, restores it into the temporary
`tezhelp_restore_validation` database inside the Docker Postgres container,
checks PostGIS and migration metadata, then drops only that validation database.
It never restores into the main local `tezhelp` database.

## Architecture

The MVP remains a modular monolith with a standalone NestJS backend.

- `apps/web`: customer/provider responsive web shell.
- `apps/admin`: separate protected administration shell.
- `apps/api`: NestJS API foundation with configuration, database, health, audit, identity, service catalog, provider-services, moderation, orders, offers, wallet, commissions, chat, live-location, and reputation modules.
- `packages/*`: shared UI, public contracts, validation, i18n, API client, maps, and config.
- `infrastructure/docker`: local PostGIS, Redis, and S3-compatible object storage.

The persistence approach is Kysely + `pg` + `node-pg-migrate`. Kysely keeps SQL
explicit, supports transactions, and permits raw SQL for PostGIS and future
ledger-critical workflows.

## Migrations

Migrations live in `apps/api/migrations`.

```bash
pnpm infra:up
pnpm db:migrate
```

The first migration enables PostGIS and `pgcrypto`, then creates the append-only
`audit_events` foundation table. The second migration adds identity tables for
users, auth links, customer/provider profiles, OTP challenges, sessions, and
security events. The third migration adds service categories, localized category
labels, configurable category tax allowances and document rules, provider
service profiles, private document metadata, moderation history, and document
access audit. The fourth migration adds category commercial configuration,
orders, order status history, private order image metadata, provider discovery
preferences, offers, wallet accounts, append-only wallet ledger entries, and
commission reservations. The fifth migration adds the provider discovery
reference point used by PostGIS radius queries. The sixth migration adds active
order lifecycle timestamps, cancellation metadata, and terminal idempotency keys.
The seventh migration adds order conversations, chat messages, private
photo/voice attachment metadata, message reports, and attachment access audit.
The eighth migration adds live location sessions and provider GPS updates with
PostGIS point indexes.
The ninth migration adds completed-order reviews, manual provider sanctions,
and provider sanction events.
The migration command loads `.env.example` for local development defaults;
production and CI should provide real environment variables explicitly.

## Quality Gates

Root checks:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Full checks with Docker:

```bash
pnpm infra:up
pnpm db:migrate
pnpm db:backup:validate
pnpm test:integration
pnpm test:e2e
```

Codex hook gate:

```bash
python3 .codex/hooks/run_quality_gate.py
```

On Windows, use:

```powershell
py -3 .codex/hooks/run_quality_gate.py
```

If system Python is not on `PATH` inside Codex Desktop, use the bundled Python
runtime shown by the workspace dependencies panel. This fallback is only for the
agent environment; developers should install normal Python 3.

## Troubleshooting

- `pnpm` not found: run `corepack enable pnpm`, then open a new terminal.
- Docker not found: install Docker Desktop or run the non-Docker checks only.
- Backup validation fails because Docker is stopped: run `pnpm infra:up`, then
  retry `pnpm db:backup:validate`.
- API env validation fails: copy values from `.env.example` into your local environment.
- MinIO readiness fails: rerun `pnpm infra:up` and wait for `minio-init` to create the private bucket.
- Playwright browsers missing: run `pnpm exec playwright install chromium`.

## Documentation

Start with:

1. `AGENTS.md`
2. `docs/PRODUCT_SPEC.md`
3. `docs/ARCHITECTURE.md`
4. `docs/DOMAIN_MODEL.md`
5. `docs/CODING_STANDARDS.md`
6. `docs/SECURITY_PRIVACY.md`
7. `docs/TESTING_STRATEGY.md`
8. `docs/ROADMAP.md`
9. `docs/plans/2026-06-19-bootstrap-foundation.md`
10. `docs/plans/2026-06-20-identity-foundation.md`
11. `docs/plans/2026-06-21-provider-moderation.md`
12. `docs/plans/2026-06-21-orders-offers-wallet.md`
13. `docs/plans/2026-06-21-active-order-lifecycle.md`
14. `docs/plans/2026-06-21-chat-attachments.md`
15. `docs/plans/2026-06-22-live-location-foundation.md`
16. `docs/plans/2026-06-22-reputation-sanctions-foundation.md`
17. `docs/plans/2026-06-22-public-provider-reliability.md`
