# Codex task 00 — Bootstrap the TezHelp repository

## Mode

Start in planning mode. Do not modify files until you have inspected all repository documentation and presented an implementation plan.

## Context

This is a clean repository for TezHelp.

Read:

- `AGENTS.md`
- `PLANS.md`
- `CODE_REVIEW.md`
- every file in `docs/`

The repository must support a mobile-first web marketplace, a separate admin application, a standalone backend, and a future native mobile client.

## Goal

Create a production-oriented monorepo foundation without implementing marketplace business features yet.

## Required deliverables

Create a pnpm workspace with Turborepo and:

```text
apps/
  web/
  admin/
  api/

packages/
  ui/
  types/
  validation/
  i18n/
  api-client/
  maps/
  config/

infrastructure/
  docker/
  deployment/
```

Use current stable, mutually compatible versions after checking official documentation and package compatibility.

### Web and admin

- Next.js
- React
- TypeScript strict mode
- Tailwind CSS
- accessible component foundation
- responsive shell
- RU/KK/EN localization foundation
- no hardcoded user-facing strings
- distinct customer/provider shell in `web`
- protected admin shell in `admin`

Do not implement fake production authentication.

### API

- NestJS
- modular structure
- health endpoint
- structured logging
- environment validation
- API versioning
- OpenAPI generation
- correlation/request IDs
- global validation
- stable error envelope
- no god `AppService`

Create only foundation modules:

- health
- configuration
- database
- audit foundation

Do not create empty business modules merely to fill directories.

### Database and local infrastructure

Docker Compose development environment with:

- PostgreSQL
- PostGIS
- Redis
- S3-compatible local object storage

Add:

- migrations
- a migration command
- health checks
- persistent development volumes
- safe example credentials in `.env.example`
- no real secrets

Select and justify the ORM/query approach. Critical PostGIS and future ledger transactions must support explicit SQL and transactions.

### Tooling

Configure:

- formatting
- linting
- strict type checking
- unit tests
- integration-test foundation
- Playwright foundation
- production builds
- dependency boundary checks if practical
- GitHub Actions CI
- pre-commit tooling only if it remains lightweight and documented

Canonical commands must work from repository root:

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
pnpm build
```

If a command intentionally requires Docker or environment setup, document it clearly.

### Architecture enforcement

Prevent god objects and boundary erosion.

Implement at least:

- workspace dependency rules
- ESLint import boundary rules or an equivalent mechanism
- no backend imports from frontend
- no infrastructure dependencies in domain packages
- no circular dependencies
- a documented module template
- an architecture test or static rule where practical

Keep `AGENTS.md` concise; place detailed rules in existing docs.

### Codex hooks

Preserve and validate the project hooks under `.codex/`.

Requirements:

- review the hooks before trusting them
- keep scripts cross-platform for Windows and POSIX
- ensure the quality-gate runner recognizes the canonical root scripts created in this task
- do not weaken destructive-command protections
- document any necessary change to hook behavior
- run the quality gate after the canonical scripts exist

### Developer experience

Add:

- root `README.md` setup instructions
- `.env.example`
- Docker setup
- local startup script
- database migration workflow
- troubleshooting section
- architecture overview
- CI explanation

## Non-goals

Do not implement:

- real OTP
- Google OAuth
- users
- providers
- orders
- wallets
- maps
- chat
- payments
- moderation

## Acceptance criteria

- clean clone can be set up from documentation
- all canonical quality commands exist
- CI uses the same commands
- web, admin, and API start locally
- API connects to PostGIS
- object storage and Redis health are verifiable
- localization can render one translated example in all three languages
- no business logic exists in frontend shells
- no god-object foundation is introduced
- tests demonstrate the health endpoint and one frontend smoke page
- the implementation plan and completion report follow `PLANS.md`

## Final report

Report:

- architecture choices
- exact dependency versions
- created files
- commands run and results
- known limitations
- next recommended task

Do not claim a command passed unless it was executed.
