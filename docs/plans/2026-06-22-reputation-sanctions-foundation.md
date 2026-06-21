# Reputation and Sanctions Foundation

## Goal

Implement Phase 9 as a small backend-first reputation slice:

1. completed orders can receive one customer-to-provider review and one
   provider-to-customer review,
2. customer-to-provider reviews update service-specific provider rating,
3. provider-facing customer reliability summary is derived from real orders,
4. administrators can apply/lift provider sanctions with audit history,
5. providers can submit sanction appeals,
6. active sanctions block new offer publication.

## Non-goals

- No automatic activity-score penalty values; product specifies direction but
  not exact deltas.
- No automatic seven-cancellation block automation in this slice.
- No complaint resolution workflow.
- No public ranking/feed ordering changes.
- No production RBAC replacement for development headers.

## Assumptions

- Review rating is an integer from 1 to 5.
- Reviews are allowed only after `completed` orders.
- The order customer reviews the assigned provider, and the assigned provider
  reviews the customer.
- Active provider sanctions are manually applied by admin and block new offer
  publication until lifted or expired.
- Customer reliability summary can be derived from existing `orders` rows
  without a separate counter table in this slice.

## Architecture Impact

- New `reputation` backend module:
  - domain: review/sanction policy and errors,
  - application: submit review, customer reliability, admin sanction, provider
    appeal,
  - infrastructure: Kysely repository,
  - presentation: order review, provider reliability, provider appeal, admin
    sanction controllers.
- Database:
  - `order_reviews`,
  - `provider_sanctions`,
  - `provider_sanction_events`.
- API:
  - `POST /v1/orders/:orderId/reviews`
  - `GET /v1/provider/orders/:orderId/customer-reliability`
  - `GET /v1/provider/sanctions`
  - `POST /v1/provider/sanctions/:sanctionId/appeal`
  - `POST /v1/admin/providers/:providerUserId/sanctions`
  - `POST /v1/admin/provider-sanctions/:sanctionId/lift`

## Domain Invariants

- One review per order per direction.
- A user can review only their assigned counterparty.
- Provider rating is category/service-profile specific.
- Active sanctions block new offer publication.
- Sanction history is append-only through events.
- Appeal and admin lift require a reason.

## Implementation Steps

1. Create this execution plan.
2. Add migration and Kysely types.
3. Add shared contracts and validation.
4. Implement reputation domain policy, repository, use cases, controllers.
5. Register `ReputationModule` in API root.
6. Make offer eligibility reject active provider sanctions.
7. Add integration and unit tests.
8. Add web/admin smoke labels.
9. Update docs and ADRs.
10. Run migration, quality gates, commit, push, and check GitHub CI.

## Test Plan

- Unit:
  - review policy allows only completed orders,
  - sanction active/expired predicate,
  - validation schemas.
- Integration:
  - customer reviews completed provider and updates service-profile rating,
  - provider reviews customer once,
  - duplicate review is rejected,
  - review before completion is rejected,
  - provider can read customer reliability for an order they offered/are
    assigned to,
  - admin sanction blocks future offers,
  - provider appeal and admin lift create sanction events.
- E2E:
  - mobile web smoke includes reviews/reliability labels,
  - admin smoke includes sanctions/appeals label.

## Progress

- [x] Create execution plan.
- [x] Add migration and database types.
- [x] Add contracts and validation.
- [x] Implement reputation module.
- [x] Enforce active sanctions in offers.
- [x] Add smoke UI labels.
- [x] Add tests.
- [x] Update docs.
- [x] Run quality gates.
- [x] Commit.
- [x] Push.

## Decision Log

- 2026-06-22: Activity-score automatic deltas are deferred because the product
  spec defines direction but not exact penalty/restore values.
- 2026-06-22: Customer reliability is derived from order history in this slice
  to avoid duplicating counters before the final reliability model is accepted.

## Completion Report

Implemented:

- migration `000009_reputation_sanctions` for completed-order reviews,
  provider sanctions, and sanction event history;
- shared contracts and validation for reviews, reliability, sanctions, appeals,
  and lifts;
- `ReputationModule` with completed-order review submission, customer
  reliability summaries, provider sanction listing/appeal, and admin
  sanction/lift endpoints;
- active sanction enforcement in offer publication;
- web/admin shell smoke labels and localized RU/KK/EN strings;
- unit, integration, and e2e coverage for the Phase 9 foundation.

Validated locally:

- `pnpm db:migrate`
- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:integration`
- `pnpm test:e2e`
- `pnpm build`
- bundled Python `.codex/hooks/run_quality_gate.py --full`
