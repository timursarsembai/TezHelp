# Backup Restore Runbook Foundation

## Goal

Add a safe local backup/restore validation workflow for the Docker PostgreSQL
database and document the production backup requirements for Kazakhstan-hosted
infrastructure.

## Non-goals

- No production deployment implementation.
- No remote backup provider integration.
- No MinIO object-storage backup automation.
- No destructive restore into the main local `tezhelp` database.
- No VPS setup.

## Context

Phase 10 includes backups, restore testing, Kazakhstan production deployment,
security review, and operational runbooks. The repository already has Docker
Postgres/PostGIS, migration workflow, and CI. We can add a local restore
validation script that exercises `pg_dump`/`pg_restore` without needing a VPS or
real production credentials.

## Assumptions

- Local backup validation targets Docker Compose service `postgres`.
- The validation database name is fixed to `tezhelp_restore_validation`.
- The script may drop only that validation database.
- Production backups must live in Kazakhstan alongside production personal data.

## Architecture Impact

- New local script:
  - `scripts/validate-postgres-backup.mjs`
- New root script:
  - `pnpm db:backup:validate`
- Docs:
  - deployment/runbook notes,
  - README command list,
  - security/privacy backup requirements,
  - testing strategy.

## Domain Invariants

- Main development database is never dropped or restored by this script.
- Backup files are generated under ignored local paths only.
- Restore validation checks PostGIS and migration metadata before reporting
  success.

## Implementation Steps

1. Create this execution plan.
2. Add ignored local backup output directory.
3. Implement Docker-backed backup/restore validation script.
4. Add root script.
5. Update docs.
6. Run backup validation and quality gates.
7. Commit, push, and check CI.

## Test Plan

- `pnpm db:backup:validate`
- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:integration`
- `pnpm test:e2e`
- `pnpm build`
- `.codex/hooks/run_quality_gate.py --full`

## Rollout and Rollback

This is local tooling and documentation. Rollback removes the script, package
script, docs, and ignored backup path.

## Risks

- The script uses Docker and will fail when Docker is not running.
- Production object-storage backup remains future work.
- Production restore procedures still need provider-specific commands once
  hosting is chosen.

## Progress

- [x] Create execution plan.
- [x] Add ignored local backup output directory.
- [x] Implement backup/restore validation script.
- [x] Add root script.
- [x] Update docs.
- [x] Run quality gates.
- [ ] Commit and push.

## Decision Log

- 2026-06-22: Validate restore into `tezhelp_restore_validation`, never into the
  main local database.
- 2026-06-22: Keep production backup provider selection out of repo until the
  Kazakhstan hosting provider is chosen.

## Completion Report

Implemented local PostgreSQL backup/restore validation for the Docker
development stack. The script creates a custom-format dump under the ignored
`backups/postgres/` directory, restores it into `tezhelp_restore_validation`,
validates PostGIS and migration metadata, and drops only that temporary
database.

Updated README, Docker, deployment, security/privacy, and testing docs with the
local command and production backup/restore constraints. Also hardened the e2e
runner cleanup on Windows so repeated quality-gate runs release ports 3000 and 3001.

Validation completed locally:

- `pnpm db:backup:validate`
- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:integration`
- `pnpm test:e2e`
- `pnpm build`
- `.codex/hooks/run_quality_gate.py --full`

Pending commit, push, and CI verification.
