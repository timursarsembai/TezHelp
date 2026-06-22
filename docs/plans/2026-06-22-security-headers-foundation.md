# Security Headers Foundation

## Goal

Add a small production-hardening baseline for HTTP security headers across the
web, admin, and API applications.

## Non-goals

- No production hosting setup.
- No final production CSP nonce pipeline.
- No authentication, RBAC, CSRF, or rate-limit implementation.
- No external monitoring or WAF integration.

## Context

Phase 10 requires security review and production hardening. The security
baseline already lists security headers and content security policy as required
before production. The repository has separate Next.js web/admin apps and a
NestJS API with an existing HTTP foundation module for middleware.

## Assumptions

- The customer/provider web app may later need browser geolocation, so its
  browser permissions policy must not permanently block geolocation.
- The admin app does not need browser geolocation in this foundation slice.
- Next.js CSP is introduced as report-only first because a production nonce and
  asset policy needs deployment-specific review.
- The API can use an enforcing API-safe CSP except for Swagger UI under `/docs`.

## Architecture Impact

- `apps/web/next.config.mjs`: add response headers.
- `apps/admin/next.config.mjs`: add response headers.
- `apps/api/src/foundation/http`: add focused security-headers middleware.
- `tests/e2e`: assert web/admin headers.
- `docs/SECURITY_PRIVACY.md`: document current header baseline and remaining
  production work.

## Domain Invariants

- Security headers must not weaken localization, health, OpenAPI, or e2e flows.
- API docs remain reachable for local development.
- No production secrets or hosting assumptions are introduced.

## Implementation Steps

1. Create this execution plan.
2. Add web/admin security headers in Next configs.
3. Add API security headers middleware.
4. Add unit and e2e tests for headers.
5. Update security documentation.
6. Run quality gates.
7. Commit, push, and verify CI.

## Test Plan

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:integration`
- `pnpm test:e2e`
- `pnpm build`
- `.codex/hooks/run_quality_gate.py --full`

## Rollout and Rollback

This is application-level HTTP header configuration. Rollback removes the
headers, middleware, tests, and documentation updates.

## Risks

- A too-strict enforced CSP could break Next.js runtime scripts, so Next CSP is
  report-only in this foundation slice.
- Future map, upload, and realtime providers will require CSP and
  Permissions-Policy review.
- Swagger UI needs different CSP treatment from JSON API endpoints.

## Progress

- [x] Create execution plan.
- [x] Add web/admin security headers.
- [x] Add API security headers middleware.
- [x] Add tests.
- [x] Update docs.
- [x] Run quality gates.
- [ ] Commit and push.

## Decision Log

- 2026-06-22: Start with report-only CSP for Next.js apps and API-enforced CSP
  outside `/docs`.

## Completion Report

Implemented baseline HTTP security headers for web, admin, and API.

Web and admin now emit `X-Content-Type-Options`, `Referrer-Policy`,
`X-Frame-Options`, `Permissions-Policy`, and report-only CSP headers from their
Next.js configs. The web app keeps geolocation available for future map/live
tracking flows; admin blocks geolocation.

The API now applies focused security headers through `SecurityHeadersMiddleware`
in the HTTP foundation module. API JSON endpoints receive an enforcing
API-safe CSP, while Swagger UI under `/docs` is excluded from that API-only CSP.

Validation completed locally:

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:integration`
- `pnpm test:e2e`
- `pnpm build`
- `.codex/hooks/run_quality_gate.py --full`

Pending commit, push, and CI verification.
