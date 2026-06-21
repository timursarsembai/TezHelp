# Orders, Offers, Wallet, and Commission Reservation

## Goal

Implement the first marketplace transaction slice:

1. customer publishes an Almaty order,
2. eligible provider discovers it,
3. provider submits an offer,
4. a free response credit or response fee is consumed atomically,
5. customer selects one provider,
6. accepted price is frozen,
7. commission is reserved atomically,
8. one-active-order rule is enforced.

## Non-goals

- No departure, arrival, in-progress, completion, commission capture, or
  cancellation matrix.
- No chat, live tracking, phone reveal, notifications, reviews, sanctions, or
  real payment gateway.
- No production authentication/RBAC replacement; development headers remain
  local/test only.
- No real image upload pipeline; order images are private object metadata only.
- No customer-side payment processing; the customer still pays the provider
  directly outside TezHelp.

## Context

- `prompts/03_ORDERS_OFFERS_WALLET.md` requires plan-first and approval before
  coding.
- `docs/PRODUCT_SPEC.md` defines customer order creation, provider discovery,
  response fee, first five free responses, balance eligibility, one active
  order, accepted price immutability, and 10% initial commission.
- `docs/DOMAIN_MODEL.md` assigns ownership to `Order`, `Offer`, `Wallet`, and
  `CommissionReservation`.
- ADR-003 requires PostGIS for straight-line radius queries.
- ADR-004 requires append-only ledger.
- ADR-005 requires accepted order price immutability.
- ADR-007 requires one active order per provider.
- ADR-013 requires Kysely + `pg` + `node-pg-migrate`.
- Phase 2 already provides service categories and independently approved
  provider service profiles.

## Assumptions

- Initial city is Almaty only.
- Coordinates are stored as PostGIS geography points in WGS84.
- Provider nearby discovery uses a saved reference point in the provider's
  discovery preference until live provider location exists.
- Customer and provider endpoints continue to use `x-tezhelp-user-id` for local
  development until real auth/RBAC is implemented.
- Admin wallet/config endpoints use `x-tezhelp-admin-user-id`, matching Phase 2
  development moderation admin auth.
- Order image support in this slice records private object metadata and enforces
  max five images; real multipart upload, malware scanning, and derivatives are
  future attachment pipeline work.
- Vehicle unlocking stores lawful-access metadata and a pending verification
  flag. Full verification workflow remains a later task.
- KZT amounts are integer tenge. Commission calculation for percentage uses
  floor division unless a later product decision specifies a different rounding
  rule.
- First five free responses are account-wide and consumed through transactional
  counters/ledger references.

## Architecture Impact

- New backend modules:
  - `orders`: order draft/publication, status history, image metadata, customer
    order queries, selection command orchestration.
  - `offers`: offer publication, offer counts, provider order discovery, offer
    availability.
  - `wallet`: provider wallet, immutable ledger entries, manual admin credit and
    debit correction, response-fee charge/reversal, idempotency.
  - `commissions`: commission configuration, calculation, reservation state.
- Existing modules touched:
  - `service-catalog`: add response-fee, commission, and operational-minimum
    configuration to category policy.
  - `provider-services`: expose a narrow eligibility/read port for approved
    service profiles; avoid direct order/wallet policy inside provider services.
  - `moderation`: no behavior changes expected.
- Database changes:
  - order tables with PostGIS location and status history,
  - order image metadata,
  - offers and offer availability,
  - provider discovery preferences,
  - wallet accounts and append-only ledger,
  - provider free response credits,
  - commission reservations,
  - category commercial configuration,
  - unique/partial indexes for active provider assignment and selected order
    offer,
  - idempotency constraints for wallet and selection commands.
- API changes:
  - `POST /v1/orders`
  - `GET /v1/orders/:orderId`
  - `GET /v1/orders/:orderId/offers`
  - `GET /v1/provider/orders`
  - `PATCH /v1/provider/order-discovery-preferences`
  - `POST /v1/orders/:orderId/offers`
  - `POST /v1/orders/:orderId/select-provider`
  - `GET /v1/provider/wallet`
  - `GET /v1/provider/wallet/ledger`
  - `POST /v1/admin/wallet/manual-credit`
  - `POST /v1/admin/wallet/manual-debit-correction`
  - `GET/PATCH /v1/admin/service-categories/:slug/commercial-config`
- Security and privacy impact:
  - exact customer coordinates are personal data; provider discovery exposes
    order location only to eligible providers and only for published orders.
  - order image object keys stay private and are not authorization.
  - wallet adjustments require admin actor and reason.
  - ledger and selection commands must not log sensitive payloads or raw DB
    errors.
- Localization impact:
  - web/admin smoke shells get RU/KK/EN labels for order publication, provider
    discovery, wallet balance, and admin ledger/config concepts.

## Domain Invariants

- Only approved, non-suspended provider service profiles can submit offers.
- Provider cannot submit offers while blocked or assigned to an active order.
- One provider can have at most one active assigned order:
  - `provider_selected`
  - `provider_en_route`
  - `provider_arrived`
  - `in_progress`
- Only one offer can be selected for an order.
- Accepted order price is immutable after provider selection.
- Response fee is charged only after offer publication succeeds.
- First five provider responses are free account-wide and consumed atomically.
- Wallet ledger is append-only; corrections are new compensating entries.
- Every wallet mutation has idempotency key, actor, reason, related entity, and
  resulting balances.
- Available balance cannot become negative.
- Commission reservation is created once per selected order and can be retried
  safely by idempotency key.
- Provider's other outstanding offers become unavailable after provider
  selection.
- Category response fee, commission configuration, and operational minimum are
  data-driven.
- Provider discovery uses PostGIS straight-line distance only when the optional
  nearby filter is enabled.

## Implementation Steps

1. Add execution-plan approval gate.
   - Create this plan.
   - Wait for user approval before coding.
2. Add schema and Kysely types.
   - Extend service category commercial configuration.
   - Add orders, order status history, order images, offers, provider
     preferences, wallet accounts, ledger entries, free response credits, and
     commission reservations.
   - Add PostGIS geography columns and indexes.
   - Add unique/partial indexes for one active provider assignment, one selected
     offer per order, offer idempotency, and wallet command idempotency.
3. Add shared contracts and validation.
   - Order create/publication schemas.
   - Offer submission schemas.
   - Provider discovery filter schemas.
   - Wallet/admin adjustment schemas.
   - Stable error codes for insufficient balance, ineligible provider,
     duplicate offer, stale order selection, and idempotency conflicts.
4. Implement wallet core first.
   - Money helper/value object for integer KZT.
   - Ledger repository with explicit transaction APIs.
   - Manual credit/debit correction use cases.
   - Response fee charge/reversal use cases.
   - Balance reconciliation helper for tests.
5. Implement commission configuration and calculator.
   - Percentage, fixed, combined, zero strategies.
   - Initial seed: response fee 100 KZT, commission 10%, operational minimum
     3,000 KZT.
   - Unit tests for integer rounding and strategy variants.
6. Implement orders.
   - Customer create/publish order.
   - Category-aware metadata including vehicle fields and unlocking lawful
     access metadata.
   - Status history append.
   - Private image metadata validation, max five images.
7. Implement provider discovery.
   - Eligible all-Almaty default query.
   - Optional nearby filter using PostGIS geography distance.
   - Provider saved preference: disabled by default, 5 km initial radius, 3 km
     minimum, saved reference point in Almaty.
   - Offer count visible in discovery response.
8. Implement offer publication.
   - Recheck provider account/service-profile/order eligibility.
   - Lock provider wallet/free-credit state.
   - Consume free credit or charge response fee atomically.
   - Insert offer only once per idempotency key and prevent duplicate provider
     offer for the same order if required by product safety.
   - Make failure roll back charge/free-credit consumption.
9. Implement provider selection.
   - Lock order, offer, provider active assignment, wallet, and commission
     reservation state in one transaction.
   - Recheck order selectable state, offer availability, approved provider
     category, provider active-order rule, and balance.
   - Freeze accepted price.
   - Reserve commission.
   - Mark selected offer accepted and provider's other offers unavailable.
   - Append order status history.
10. Implement admin endpoints.
    - Manual wallet credit and debit correction with reason.
    - Ledger view.
    - Category response fee, commission, and operational minimum view/update.
11. Add frontend smoke surfaces.
    - Web mobile-first customer order shell.
    - Web provider order feed/offer/wallet shell.
    - Admin wallet ledger/config shell.
    - No frontend-owned financial/order policy.
12. Update docs and ADRs.
    - Architecture module boundaries.
    - Domain invariants.
    - API/README setup.
    - Security/privacy notes for wallet, order location, and image metadata.
13. Run quality gates.
    - Migration validation.
    - Unit, integration, e2e, build, full Codex hook gate.
14. Commit and push only after green checks.

## Test Plan

### Unit

- commission calculator:
  - percentage 10%,
  - fixed,
  - combined,
  - zero,
  - integer rounding.
- provider offer eligibility policy:
  - approved category required,
  - blocked provider rejected,
  - active order rejected,
  - operational minimum,
  - response fee/free credit,
  - potential commission coverage.
- order state transition policy:
  - publish,
  - select provider,
  - immutable accepted price.
- wallet ledger helpers:
  - no negative available balance,
  - resulting balance calculation,
  - idempotency key reuse.
- validation schemas:
  - max five order images,
  - Almaty coordinates,
  - offer price integer,
  - discovery radius constraints.

### Integration

Use real PostgreSQL/PostGIS and run files sequentially:

- migration applies cleanly and PostGIS distance query works.
- admin manual credit creates wallet and append-only ledger entry.
- provider with approved category sees published order.
- provider without approved category cannot see/respond.
- provider discovery default returns all eligible Almaty orders.
- nearby filter respects 5 km default, 3 km minimum, saved reference point, and
  straight-line distance.
- first five responses are free and account-wide.
- sixth response charges 100 KZT.
- duplicate offer idempotency does not duplicate charge or free-credit
  consumption.
- insufficient balance returns stable `PROVIDER_BALANCE_INSUFFICIENT`.
- customer selects provider and reaches `provider_selected`.
- accepted price is frozen from the selected offer.
- commission reservation is created once.
- provider cannot have two active selected orders.
- two providers racing for one order select only one.
- two customers racing to select the same provider select only one active order.
- provider balance change between offer and selection is rechecked.
- failed selection rolls back assignment and commission reservation.
- admin category commercial config update affects later eligibility checks.

### E2E

- mobile customer order shell smoke.
- mobile provider discovery/offer/wallet shell smoke.
- admin ledger/config shell smoke.

### Migration

- `pnpm db:migrate`
- optionally rollback in a disposable database before final completion.

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

- Apply migration `000004_orders_offers_wallet`.
- Seed category commercial defaults.
- Keep dev auth enabled only in local/test.
- Do not enable production use until real RBAC, upload pipeline, monitoring, and
  operational reconciliation are ready.

Rollback:

- In development, rollback drops Phase 3/4/5 tables and commercial config
  columns added by the migration.
- In production, do not rewrite applied financial migrations. Use a forward
  migration or feature flag if real ledger data exists.

## Risks

- This task spans phases 3-5 and is large. To reduce review risk, implementation
  should be committed as one coherent slice only after all checks pass; if it
  becomes too broad, split after wallet + orders foundations but before offer
  publication.
- Concurrency bugs can create financial imbalance or double assignment. Use row
  locks, constraints, and idempotency, not only application checks.
- Free-credit race can charge or consume twice. Free credits must be updated in
  the same transaction as offer publication.
- Partial failure between offer insert and wallet charge must roll back both.
- Customer/provider location and image metadata are sensitive; avoid exposing
  unrelated orders or raw object keys.
- Percentage rounding can be contested. Initial floor rounding must be
  documented and tested before production.
- Development headers are not production authorization; production config must
  continue rejecting them.

## Progress

- [x] Plan created and approved by the user.
- [x] Schema and Kysely types added.
- [x] Shared contracts and validation added.
- [x] Wallet ledger and manual admin adjustments implemented.
- [x] Commission calculator implemented and unit-tested.
- [x] Order creation and status history implemented.
- [x] Provider discovery with PostGIS radius preference implemented.
- [x] Offer publication with free credit/response fee transaction implemented.
- [x] Provider selection with accepted price freeze and commission reservation
      implemented.
- [x] Admin category commercial config endpoints implemented.
- [x] Web/admin smoke surfaces added.
- [x] Documentation and ADR updated.
- [x] Final quality gates.
- [x] Commit and push.

## Decision log

- 2026-06-21: Plan splits prompt 03 into `orders`, `offers`, `wallet`, and
  `commissions` modules to avoid a god marketplace service.
- 2026-06-21: Provider selection is treated as the central transaction boundary:
  order lock, offer lock, active-provider constraint, wallet lock, and commission
  reservation must be checked together.
- 2026-06-21: Order image handling remains metadata-only in this slice; real
  upload processing belongs to the future attachments pipeline.
- 2026-06-21: Vehicle unlocking lawful-access verification is represented as
  required metadata plus pending verification status, not a full verification
  workflow.
- Added `000005_provider_discovery_reference_point` instead of rewriting the
  already applied local `000004_orders_offers_wallet` migration.
- Percentage commission uses floor division in integer KZT.
- Discovery reference point defaults to central Almaty until live provider
  location is implemented in a later phase.

## Completion report

Implemented the first orders/offers/wallet transaction slice with migrations
`000004_orders_offers_wallet` and
`000005_provider_discovery_reference_point`.

Validation completed on 2026-06-21:

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm infra:up`
- `pnpm db:migrate`
- `pnpm test:integration`
- `pnpm test:e2e`
- bundled Codex Python `.codex/hooks/run_quality_gate.py --full`

Remaining product work is intentionally outside this slice: completion,
cancellation, commission capture/release, chat, live location, phone reveal,
real payments, production RBAC, and upload processing.
