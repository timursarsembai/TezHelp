# Accessibility Performance Baseline

## Goal

Add a small, testable accessibility and frontend performance baseline for the
web and admin shells before production hardening continues.

## Non-goals

- No visual redesign.
- No Lighthouse CI or external SaaS monitoring.
- No full WCAG audit.
- No real production performance budgets for future map/upload/realtime flows.
- No new business workflows.

## Context

Phase 10 requires accessibility and performance hardening. The web/admin shells
already have mobile smoke tests and security-header assertions. The shared UI
shell can provide stronger semantic landmarks and keyboard navigation without
changing domain behavior.

## Assumptions

- Current web/admin foundation pages should remain lightweight and should not
  load image, audio, video, or font resources.
- Next.js development mode has extra script resources, so e2e resource budgets
  must be conservative and only catch obvious regressions.
- Skip-link text is user-facing and must use localization keys.

## Architecture Impact

- `@tezhelp/ui`: improve shell semantics and skip-link support.
- `@tezhelp/i18n`: add skip-link localization key.
- `apps/web` and `apps/admin`: pass localized skip labels.
- `tests/e2e`: assert landmarks, keyboard skip behavior, and basic resource
  budgets.
- Documentation: record the baseline and future production hardening gaps.

## Domain Invariants

- Frontend remains presentation-only and does not gain backend business policy.
- Existing localized content and security-header assertions remain intact.
- Accessibility improvements must not add product flows, fake auth, or fake
  business data.

## Implementation Steps

1. Create this execution plan.
2. Add semantic shell landmarks and skip-link support.
3. Add skip-link localization.
4. Add e2e accessibility and resource-budget assertions.
5. Update documentation.
6. Run quality gates.
7. Commit, push, and verify CI.

## Test Plan

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

This is shared UI shell, localization, tests, and documentation. Rollback
removes the shell changes, localization key, e2e assertions, and docs updates.

## Risks

- Resource budgets can become flaky if tied to exact Next.js dev internals, so
  they are intentionally broad.
- Full accessibility and production performance audits remain future work.

## Progress

- [x] Create execution plan.
- [x] Add semantic shell landmarks and skip-link support.
- [x] Add skip-link localization.
- [x] Add e2e accessibility and resource-budget assertions.
- [x] Update documentation.
- [x] Run quality gates.
- [x] Commit and push.

## Decision Log

- 2026-06-22: Keep the first performance baseline in Playwright e2e instead of
  adding Lighthouse CI or an external service.

## Completion Report

Implemented the first frontend accessibility and performance baseline:

- Added localized skip-link support, banner/main/status landmarks, and
  reduced-motion/focus-visible CSS coverage for the web and admin shells.
- Added e2e assertions for keyboard skip-link behavior, semantic landmarks,
  and broad resource budgets that catch unexpected media or large foundation
  resource growth.
- Documented the baseline and future production gaps in
  `docs/ACCESSIBILITY_PERFORMANCE.md`, and linked it from the README and
  testing strategy.

Local validation completed on 2026-06-22:

- `pnpm format`
- `pnpm ops:validate`
- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:integration`
- `pnpm test:e2e`
- `pnpm build`
- `.codex/hooks/run_quality_gate.py --full` using bundled Codex Python with
  local Docker services available.

Committed and pushed on 2026-06-22:

- `0cf135b chore: add accessibility performance baseline`
- GitHub Actions CI run `27944299106` passed.
