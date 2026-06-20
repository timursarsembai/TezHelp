# TezHelp

TezHelp is a marketplace for emergency roadside services in Kazakhstan. This
repository is a production-oriented foundation: mobile-first web, separate
admin web, standalone NestJS API, shared packages, local infrastructure, and the
Phase 1 identity foundation.

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
pnpm infra:down
pnpm local:dev
```

`test:integration` loads `.env.example` for local Docker defaults. Run it after
`pnpm infra:up` and `pnpm db:migrate` when validating the Docker-backed health
checks.

## Architecture

The MVP remains a modular monolith with a standalone NestJS backend.

- `apps/web`: customer/provider responsive web shell.
- `apps/admin`: separate protected administration shell.
- `apps/api`: NestJS API foundation with configuration, database, health, audit, and identity modules.
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
security events. The migration command loads `.env.example` for local
development defaults; production and CI should provide real environment
variables explicitly.

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
