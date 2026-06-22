# API Dev Startup Fix

## Goal

Make `pnpm --filter @tezhelp/api dev` start the NestJS API reliably in local
development without the runtime dependency-injection failure seen with
`tsx watch`.

## Non-goals

- No production runtime change.
- No API endpoint or domain behavior change.
- No dependency injection refactor across all modules.
- No new runtime dependency.

## Context

During local demo startup, `tsx watch src/main.ts` failed before the API could
listen because Nest could not read constructor metadata for class-based
providers. The compiled API started correctly with `node dist/main.js`, which
means the issue is in the dev runner rather than the application modules.

## Assumptions

- TypeScript compilation with `emitDecoratorMetadata` remains the supported
  Nest runtime path.
- A small Node runner is enough for API development: TypeScript watches source
  files and Node watches the compiled `dist` output.
- Local development should load `.env.example` defaults the same way migrations
  and integration tests do.

## Implementation Steps

1. Create this execution plan.
2. Add an API dev runner script that starts `tsc --watch` and `node --watch`.
3. Update the API `dev` script to load `.env.example` and run the new runner.
4. Update docs/troubleshooting for the dev-mode behavior.
5. Verify API dev startup on an alternate port while the demo API keeps using
   `4000`.
6. Run focused quality checks.
7. Commit, push, and verify CI.

## Test Plan

- Start `pnpm --filter @tezhelp/api dev` with `PORT=4100`.
- Request `http://localhost:4100/v1/health/live`.
- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Rollout and Rollback

This changes only local API development startup. Rollback restores the previous
`tsx watch src/main.ts` script and removes the runner.

## Risks

- The runner has a little more process orchestration than a direct command, so
  it must handle shutdown cleanly.
- `node --watch` restarts from compiled output, so TypeScript errors keep the
  last good server running until the code compiles again.

## Progress

- [x] Create execution plan.
- [x] Add API dev runner.
- [x] Update scripts/docs.
- [x] Verify API dev startup.
- [x] Run quality checks.
- [ ] Commit, push, and verify CI.

## Decision Log

- 2026-06-22: Use the TypeScript compiler for dev output instead of `tsx watch`
  because Nest constructor metadata is required at runtime.

## Completion Report

Implemented the API dev startup fix:

- replaced `tsx watch src/main.ts` with a local dev runner
- the runner starts TypeScript in watch mode and launches `node --watch` from
  compiled `dist/main.js`
- the API dev script now loads `.env.example` defaults
- README troubleshooting documents how to handle a busy API port
- ESLint now treats `apps/api/scripts/**/*.mjs` as Node scripts

Local validation completed on 2026-06-22:

- `PORT=4100 pnpm --filter @tezhelp/api dev`
- `GET http://localhost:4100/v1/health/live` returned `200`
- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

Remaining note:

- `node --watch` restarts from compiled output; if TypeScript has a temporary
  compile error, the last good compiled server can remain active until the
  error is fixed.
