# Public Provider Reliability Foundation

## Goal

Expose a public, read-only provider service reliability summary based on already
accepted marketplace facts: category-specific rating, completed orders, provider
cancellations, active sanction presence, and current offer eligibility.

## Non-goals

- No automatic activity-score penalty formula.
- No automatic seven-consecutive-cancellation block.
- No complaint/no-show scoring.
- No ranking/feed ordering changes.
- No exposure of sanction reasons, admin actors, documents, phone numbers, or
  private provider data.

## Context

Phase 9 already added completed-order reviews, service-specific ratings,
customer reliability summaries, manual provider sanctions, appeals, and active
sanction enforcement during offer publication.

`provider_service_profiles` already stores `rating_average`, `rating_count`,
`completed_order_count`, and `cancellation_count`. Completion updates
`completed_order_count`; provider cancellation still needs to update
`cancellation_count`.

## Assumptions

- `cancellation_count` means provider-caused cancellations for this service
  profile, not customer/admin cancellations.
- Public reliability can show active sanction presence only as a boolean
  eligibility signal, without reason/history details.
- Public reliability should be available without development identity headers
  because customers need to inspect provider trust signals.

## Architecture Impact

- Extend `@tezhelp/types` with `PublicProviderReliabilitySummary`.
- Extend `reputation` module with a public reliability use case and controller
  endpoint:
  - `GET /v1/providers/service-profiles/:serviceProfileId/reliability`
- Extend order cancellation lifecycle to increment provider cancellation count
  once when a provider cancels an assigned order.
- Add localized shell labels and docs.

## Domain Invariants

- Provider cancellation count increments only on first terminal provider
  cancellation, never on idempotent retries.
- Customer/admin cancellations do not worsen provider cancellation counters.
- Active sanction details remain private; public API exposes only boolean
  presence/current eligibility.
- Reliability summary is derived from backend state, not frontend heuristics.

## Implementation Steps

1. Create this execution plan.
2. Add shared public reliability contract and localized labels.
3. Increment provider cancellation count during provider cancellation.
4. Add public reliability repository/use-case/controller endpoint.
5. Add integration, unit/smoke, and e2e coverage.
6. Update docs and ADRs.
7. Run quality gates.
8. Commit, push, and check CI.

## Test Plan

- Unit:
  - localization labels render in RU/KK/EN.
- Integration:
  - completed order appears in public reliability counters.
  - customer-to-provider review appears in rating fields.
  - provider cancellation increments provider cancellation counters exactly once.
  - active sanction makes public `offerEligible` false without exposing reason.
- E2E:
  - mobile web shell contains public reliability labels.

## Rollout and Rollback

This change has no migration. Rollback removes the endpoint and code changes.
Existing counters remain valid because completion already increments completed
orders and provider cancellation increments are monotonic aggregate facts.

## Risks

- Publicly exposing active sanction presence may need product review before
  production; the endpoint intentionally omits sanction reason/history.
- Counter semantics must stay stable when future complaint/no-show automation is
  added.

## Progress

- [x] Create execution plan.
- [x] Add shared contract and localization.
- [x] Update provider cancellation counter.
- [x] Add public reliability endpoint.
- [x] Add tests.
- [x] Update docs.
- [x] Run quality gates.
- [x] Commit and push.

## Decision Log

- 2026-06-22: Provider cancellation count is scoped to provider-caused
  cancellations only.
- 2026-06-22: Public sanction visibility is reduced to boolean eligibility
  signals; sanction reasons and events remain private.

## Completion Report

Implemented:

- public provider service reliability contract;
- `GET /v1/providers/service-profiles/:serviceProfileId/reliability`;
- provider cancellation counter update on provider-caused cancellation;
- aggregate public reliability fields for rating, completed orders, provider
  cancellations, active sanction presence, and offer eligibility;
- localized web shell labels for public reliability;
- integration coverage for rating, completion count, provider cancellation
  count, active sanction eligibility, and idempotent provider cancellation.

Validated locally:

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:integration`
- `pnpm test:e2e`
- `pnpm build`
- bundled Python `.codex/hooks/run_quality_gate.py --full`
