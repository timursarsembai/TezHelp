# Active Order Lifecycle, Completion, and Cancellation

## Goal

Implement Phase 6 as a small coherent backend-first slice:

1. provider confirms departure,
2. customer/provider contact visibility opens after departure,
3. provider confirms arrival,
4. provider starts work,
5. provider completes the order,
6. reserved commission is captured atomically,
7. customer/provider/admin cancellations release or hold the commission
   according to the documented matrix,
8. the provider is no longer blocked by the one-active-order rule after terminal
   statuses.

## Non-goals

- No chat implementation.
- No live location stream, map markers, routing, or browser geolocation.
- No customer confirmation for completion.
- No production RBAC replacement; development headers remain local/test only.
- No payment gateway or customer-side payment handling.
- No activity-score sanctions, reviews, complaints, or appeal workflow.
- No real phone masking provider; this slice only gates already verified phone
  visibility through server-side authorization.

## Context

- `docs/ROADMAP.md` Phase 6 requires active order lifecycle, phone reveal,
  completion, commission capture, cancellation matrix, and held-for-review
  cancellation after arrival.
- `docs/PRODUCT_SPEC.md` says the provider completes the order, completion
  captures commission immediately, and response fees remain charged except for
  technical failures.
- `docs/DOMAIN_MODEL.md` requires accepted price immutability, one active order
  maximum, selected-provider-only provider transitions, and exactly-once
  commission capture.
- `docs/ARCHITECTURE.md` requires explicit transaction boundaries and narrow
  module responsibilities.
- Current implementation already has `orders`, `offers`, `wallet`, and
  `commissions` modules, selected order assignment, commission reservation, and
  append-only wallet ledger.

## Assumptions

- Development `x-tezhelp-user-id` is enough for customer/provider endpoints in
  this slice.
- Admin cancellation uses `x-tezhelp-admin-user-id`, matching the existing
  development admin guard.
- Phone reveal means an endpoint returns verified phone numbers only to the
  assigned customer/provider after `provider_en_route`.
- Live tracking starts in product terms after departure, but actual location
  capture/streaming is Phase 8. This slice only creates the lifecycle state that
  later live tracking will use.
- Cancellation reasons are free text with stable actor/status semantics; richer
  reason taxonomy can be added later without rewriting ledger history.
- Provider completion increments completed-order counters. Activity penalties
  and reliability scoring are Phase 9.

## Architecture Impact

- `orders`:
  - add lifecycle transition policy/use cases,
  - add provider/customer/admin cancellation use cases,
  - add contact visibility query,
  - keep controllers thin.
- `wallet`:
  - add commission capture and commission release ledger operations,
  - keep ledger append-only and idempotent.
- Database:
  - add explicit lifecycle timestamps to `orders`:
    - `departed_at`,
    - `arrived_at`,
    - `work_started_at`,
    - `completed_at`,
    - `cancelled_at`;
  - optionally add cancellation metadata:
    - `cancelled_by_user_id`,
    - `cancellation_reason`;
  - no rewrite of existing financial migrations.
- API:
  - `POST /v1/provider/orders/:orderId/depart`
  - `POST /v1/provider/orders/:orderId/arrive`
  - `POST /v1/provider/orders/:orderId/start-work`
  - `POST /v1/provider/orders/:orderId/complete`
  - `POST /v1/orders/:orderId/cancel`
  - `POST /v1/provider/orders/:orderId/cancel`
  - `POST /v1/admin/orders/:orderId/cancel`
  - `GET /v1/orders/:orderId/contact`
- Security/privacy:
  - phone data is returned only to assigned parties after departure,
  - terminal statuses stop contact visibility for future live-location work,
  - all terminal financial transitions write ledger entries and audit/status
    history.
- Localization:
  - add RU/KK/EN smoke labels for lifecycle/contact/admin cancellation shell
    surfaces only; no frontend-owned policy.

## Domain Invariants

- Only the assigned provider can confirm departure, arrival, start work, or
  complete.
- Only the order customer can perform customer cancellation.
- Only an admin can perform admin cancellation.
- Valid lifecycle path:
  - `provider_selected` -> `provider_en_route`
  - `provider_en_route` -> `provider_arrived`
  - `provider_arrived` -> `in_progress`
  - `in_progress` -> `completed`
- Completion captures reserved commission exactly once.
- Cancellation before provider arrival releases reserved commission.
- Customer cancellation after provider arrival holds the reservation for admin
  review.
- Provider cancellation after provider arrival releases commission but records a
  stronger provider-cancellation stage for later reliability work.
- Admin cancellation releases commission unless marked held-for-review by the
  explicit admin use case input.
- Response fee remains charged for all normal cancellations.
- Accepted price remains immutable.
- Terminal orders cannot return to active statuses in this slice.
- Provider's other unavailable offers may become active again only when no
  active assignment remains; if reactivation is ambiguous, keep them unavailable
  and document it.

## Implementation Steps

1. Add this execution plan and keep it updated.
2. Add migration and Kysely types for lifecycle timestamps/cancellation metadata.
3. Add shared validation schemas:
   - idempotency key reuse,
   - cancellation reason,
   - admin cancellation hold flag.
4. Add narrow order transition policy:
   - allowed provider transitions,
   - cancellation outcome matrix,
   - terminal status checks.
5. Extend `WalletRepository`:
   - capture reserved commission,
   - release reserved commission,
   - idempotency conflict checks.
6. Implement provider lifecycle use cases:
   - depart,
   - arrive,
   - start work,
   - complete with commission capture.
7. Implement cancellation use cases:
   - customer cancel,
   - provider cancel,
   - admin cancel.
8. Implement contact visibility query:
   - assigned customer/provider only,
   - after `provider_en_route`,
   - before terminal status,
   - return minimal verified phone payload.
9. Add HTTP controllers without business logic.
10. Add web/admin smoke UI labels for active order lifecycle concepts.
11. Update docs and ADRs.
12. Run quality gates and GitHub CI.
13. Commit and push.

## Test Plan

### Unit

- order transition policy:
  - valid provider transitions,
  - invalid skipped transitions,
  - terminal status rejection,
  - cancellation outcome matrix.
- validation schemas:
  - reason length,
  - idempotency key,
  - admin hold flag.

### Integration

- provider departure changes status and writes history.
- contact endpoint hides phone before departure.
- contact endpoint reveals phones to assigned parties after departure.
- unrelated user cannot view contact.
- arrival and start-work require correct preceding statuses.
- completion captures reserved commission and moves reserved balance to captured
  ledger state.
- duplicate completion idempotency does not double-capture.
- customer cancellation before departure releases commission.
- customer cancellation after arrival holds reservation for review.
- provider cancellation after departure releases commission.
- admin cancellation can release or hold reservation.
- provider can be selected for a new order after completion/cancellation.
- cancellation racing completion cannot both mutate commission reservation.

### E2E

- mobile web smoke includes lifecycle/contact labels.
- admin smoke includes active order cancellation oversight label.

### Migration

- `pnpm db:migrate`
- integration suite validates the new schema against Docker PostGIS.

### Quality

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:integration`
- `pnpm test:e2e`
- `pnpm build`
- `.codex/hooks/run_quality_gate.py --full`

## Rollout and Rollback

Rollout:

- Apply a forward migration for lifecycle metadata.
- Keep development auth only in local/test.
- Do not expose production phone reveal until real auth/RBAC and privacy review
  are complete.

Rollback:

- In development, rollback can drop added lifecycle columns.
- In production, do not rewrite financial ledger/reservation migrations after
  real data exists; use forward migrations.

## Risks

- Double completion/cancellation can corrupt reserved balances if not locked.
- Phone reveal is privacy-sensitive and must be server-side authorized.
- Cancellation matrix is product-sensitive; document assumptions and keep error
  codes stable.
- Reactivating old offers after terminal order status may surprise providers;
  if not implemented, document it as remaining work.

## Progress

- [x] Read prompt/roadmap and required project documents.
- [x] Create execution plan.
- [x] Add migration and database types.
- [x] Add contracts and validation.
- [x] Implement transition policy.
- [x] Implement wallet capture/release.
- [x] Implement lifecycle and cancellation use cases.
- [x] Add controllers and smoke UI.
- [x] Add tests.
- [x] Update docs.
- [x] Run quality gates.
- [x] Commit and push.

## Decision Log

- 2026-06-21: Phase 6 is implemented as an `orders` lifecycle extension plus
  narrow `wallet` ledger operations, not as a broad marketplace service.
- 2026-06-21: Live tracking remains Phase 8; this slice only creates the
  departure state and contact reveal gate needed by later tracking.
- 2026-06-21: Customer cancellation after provider arrival moves the commission
  reservation to `held_for_review` without changing wallet balances.

## Completion Report

Implemented Phase 6 active order lifecycle foundation with migration
`000006_active_order_lifecycle`.

Validation completed on 2026-06-21:

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm db:migrate`
- `pnpm test:integration`
- `pnpm test:e2e`
- bundled Codex Python `.codex/hooks/run_quality_gate.py --full`

Remaining product work is intentionally outside this slice: chat, live
location, production RBAC, real phone masking, activity sanctions, reviews,
complaints, and administrative resolution of held commission reservations.
