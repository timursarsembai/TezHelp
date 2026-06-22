# Error Monitoring Foundation

## Goal

Add a privacy-preserving error monitoring foundation for API, web, and admin so
runtime failures can be captured with correlation IDs without sending personal
data to an external provider.

## Non-goals

- No external SaaS monitoring integration.
- No browser session replay, analytics, or user-behavior tracking.
- No production alert-routing integration.
- No database persistence for error events in this slice.
- No full observability stack or dashboards.

## Context

Phase 10 requires error monitoring. The API already has correlation IDs,
structured request logging, stable error envelopes, and security/privacy rules
that prohibit copying personal data into foreign systems. This slice should
make errors reportable and scrubbable while keeping future monitoring providers
behind a replaceable port.

## Assumptions

- Local development can log sanitized monitoring events to stdout through the
  existing structured logging approach.
- Browser clients may report only sanitized route-level error context, never
  raw form contents, document names, object keys, exact coordinates, phone
  numbers, OTPs, tokens, or stack traces containing sensitive values.
- External production monitoring will need a Kazakhstan data-residency and legal
  review before real provider credentials are added.

## Architecture Impact

- `@tezhelp/types`: shared frontend error report contract.
- `@tezhelp/validation`: request schema for frontend error reports and env
  validation for local monitoring mode.
- `@tezhelp/api-client`: add a narrow POST helper and frontend monitoring
  reporter.
- `apps/api`: add `foundation/monitoring` port, scrubber, local sink, and
  controller.
- `apps/web` and `apps/admin`: add route-level error boundaries that report
  sanitized errors.
- Documentation: describe privacy rules, operational gaps, and future provider
  integration requirements.

## Domain Invariants

- Error monitoring must not become analytics or session replay.
- Monitoring payloads must be sanitized before logging or provider delivery.
- Correlation IDs remain the join key between user-visible failures and server
  logs.
- Production personal data and monitoring data that may contain personal data
  must stay in Kazakhstan-hosted infrastructure.
- Existing API error envelopes must remain backward compatible.

## Implementation Steps

1. Create this execution plan.
2. Add shared contracts and validation for frontend error reports.
3. Add API monitoring module with scrubber, port, local sink, and controller.
4. Add frontend reporter helpers and route-level error boundaries.
5. Update docs for monitoring privacy and future production rollout.
6. Add unit/e2e coverage for sanitization and browser error reporting.
7. Run quality gates.
8. Commit, push, and verify CI.

## Test Plan

- Unit:
  - monitoring scrubber redacts sensitive keys and risky scalar values
  - frontend error report schema rejects oversized or unsafe payloads
  - API client sends monitoring payloads with correlation IDs
- Frontend/build:
  - web/admin route-level error boundaries typecheck and build without
    product-visible test routes
- Quality:
  - `pnpm format:check`
  - `pnpm ops:validate`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm test:integration`
  - `pnpm test:e2e`
  - `pnpm build`
  - `.codex/hooks/run_quality_gate.py --full`

## Rollout and Rollback

This is additive. Rollback removes the monitoring module, frontend reporters,
error boundaries, contracts, and docs. No migration rollback is required.

## Risks

- Sanitization can be incomplete if future callers pass raw domain payloads, so
  docs and schema must keep the accepted payload narrow.
- Browser error reporting can fail during network outages; the UI fallback must
  remain useful without successful reporting.
- Exact production alerting remains future work.

## Progress

- [x] Create execution plan.
- [x] Add shared contracts and validation.
- [x] Add API monitoring module.
- [x] Add frontend reporter helpers and route-level error boundaries.
- [x] Update documentation.
- [x] Add tests.
- [x] Run quality gates.
- [ ] Commit and push.

## Decision Log

- 2026-06-22: Keep the first monitoring sink local and sanitized; external
  monitoring providers require a later Kazakhstan data-residency review.
- 2026-06-22: Do not keep a product-visible error-test route only for e2e;
  validate monitoring through schema, scrubber, reporter, and production build.

## Completion Report

Implemented the privacy-preserving error monitoring foundation:

- added shared frontend error report contracts and validation
- added `foundation/monitoring` with a replaceable sink port, local structured
  sink, disabled sink, scrubber, use case, and
  `POST /v1/monitoring/frontend-errors`
- added web/admin route-level error boundaries and frontend reporter helpers
- documented monitoring privacy rules, configuration, and production gaps
- kept monitoring tests focused on schema, scrubbing, reporter behavior, and
  production builds without product-visible test routes

Local validation completed on 2026-06-22:

- `pnpm install`
- `pnpm format`
- `pnpm format:check`
- `pnpm ops:validate`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:integration`
- `pnpm test:e2e`
- `pnpm build`
- `.codex/hooks/run_quality_gate.py --full` using bundled Codex Python with
  local Docker services available

Remaining production work:

- choose a Kazakhstan-hosted monitoring/logging destination or complete legal
  review for any foreign provider
- add production alert routing, retention, source-map policy, and CSP review
