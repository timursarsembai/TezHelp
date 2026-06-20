# Bootstrap Foundation

## Goal

Create the Phase 0 monorepo foundation for TezHelp without implementing
marketplace business features.

## Non-goals

- No real OTP, Google OAuth, users, providers, orders, wallets, maps workflow,
  chat, payments, moderation, or fake production authentication.
- No production deployment implementation.

## Context

This work follows `prompts/00_BOOTSTRAP.md`, `AGENTS.md`, accepted ADRs, and
the Phase 0 roadmap. TezHelp remains a modular monolith with a standalone NestJS
backend and mobile-first web surfaces.

## Assumptions

- Default UI locale is Russian.
- Kazakh and English dictionaries exist from the foundation.
- TypeScript is pinned to 5.9.3 for ecosystem compatibility.
- Docker checks require Docker to be installed and available on `PATH`.

## Architecture impact

- Adds `apps/web`, `apps/admin`, and `apps/api`.
- Adds shared packages for UI, contracts, validation, i18n, API client, maps, and config.
- Adds PostGIS/Redis/MinIO local infrastructure.
- Adds initial `audit_events` migration.
- Adds root quality scripts, CI, dependency-boundary checks, and e2e foundation.
- Security impact is limited to safe local example credentials and private object-storage defaults.
- Localization impact: RU/KK/EN foundation and fallback tests.

## Domain invariants

- Backend remains source of truth.
- No frontend business rules are introduced.
- No business modules are created before their task.
- Audit records are append-only by design.
- Money/order/wallet rules are not implemented in Phase 0.

## Implementation steps

1. Create pnpm/Turborepo workspace and shared strict TypeScript tooling.
2. Add dependency-boundary enforcement and no-circular checks.
3. Add shared foundation packages.
4. Add mobile-first web and protected admin shells.
5. Add NestJS API foundation modules.
6. Add Docker Compose, migration workflow, CI, and docs.
7. Run canonical checks and record results.

## Test plan

- Unit: i18n fallback, validation schemas, API error envelope, health controller.
- Integration: Docker-backed health/migration foundation when environment is available.
- E2E: mobile web smoke and admin protected-shell smoke.
- Migration: apply initial PostGIS/audit migration with `pnpm db:migrate`.
- Manual: inspect `README.md` setup and `docs/MODULE_TEMPLATE.md`.

## Rollout and rollback

This is pre-production foundation work. Rollback is reverting the bootstrap
commit. No production data or schema exists yet.

## Risks

- Current local machine may lack `pnpm`, Docker, or system Python on `PATH`.
- Next/Nest ecosystem may lag latest TypeScript 6, so TypeScript 5.9.3 is used.
- Integration and e2e checks require local services and Playwright browsers.

## Progress

- [x] Workspace and tooling
- [x] Shared packages
- [x] Web/admin shells
- [x] API foundation
- [x] Docker/CI/docs
- [x] Quality commands executed and results recorded

## Decision log

- Chose Kysely + `pg` + `node-pg-migrate` for explicit SQL, PostGIS, and future ledger transactions.
- Chose no fake admin auth; admin renders an auth-required foundation state.
- Chose Russian default locale with Kazakh and English dictionaries.
- Chose root dependency-cruiser plus ESLint import restrictions for boundary enforcement.

## Completion report

Implemented the Phase 0 monorepo foundation with pnpm/Turborepo, Next.js web
and admin shells, NestJS API foundation, shared packages, Docker Compose,
initial PostGIS/audit migration, CI, dependency-boundary checks, and Codex hook
documentation.

Commands run:

- `corepack pnpm install` — passed after explicit `allowBuilds` entries.
- `pnpm format` — passed.
- `pnpm format:check` — passed.
- `pnpm lint` — passed; dependency-cruiser reported no boundary violations.
- `pnpm typecheck` — passed.
- `pnpm test` — passed; real tests executed for i18n, validation, API client,
  web shell, admin shell, health controller, and error envelope.
- `pnpm infra:up` — passed after Docker Desktop was installed; PostGIS, Redis,
  MinIO, and the MinIO init container started successfully.
- `pnpm db:migrate` — passed after converting the migration file to ESM exports.
- `pnpm test:integration` — passed with Docker-backed env; API readiness checked
  PostGIS, Redis, and private object storage.
- `pnpm build` — passed for all packages, API, web, and admin.
- `pnpm test:e2e` — passed after installing Playwright Chromium.
- `.codex/hooks/run_quality_gate.py --full` — passed using bundled Codex Python
  and a temporary `pnpm` shim for this sandbox.

Known limitations:

- No production authentication or business domains are implemented by design.
- The local temporary `C:\tmp\pnpm.cmd` shim was used only so Turborepo could
  find pnpm in this sandbox; CI and normal developer machines should use
  Corepack or `pnpm/action-setup`.
