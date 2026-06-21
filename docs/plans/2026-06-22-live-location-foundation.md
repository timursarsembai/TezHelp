# Live Location Foundation

## Goal

Implement Phase 8 as a small backend-first live tracking foundation:

1. assigned provider can publish browser GPS updates only after departure,
2. assigned customer/provider can read current or last known provider location,
3. authorized admins can read active-order tracking,
4. location state exposes stale/offline/resume hints,
5. coordinates are stored in PostGIS,
6. web/admin shells expose localized map/tracking smoke labels,
7. route-provider and realtime transport remain replaceable interfaces.

## Non-goals

- No production WebSocket gateway in this slice.
- No real browser geolocation loop or MapLibre map canvas in the app UI.
- No route calculation provider implementation.
- No push notifications.
- No location retention job.
- No production RBAC replacement for development headers.

## Assumptions

- Tracking is visible only for statuses `provider_en_route`,
  `provider_arrived`, and `in_progress`.
- `provider_selected` is too early for live tracking; the provider must confirm
  departure first.
- A location becomes stale after 90 seconds without a fresh update.
- Completion or cancellation stops visibility immediately.
- This slice stores latest location plus append-only update rows for testing and
  auditability; a future retention job must minimize history before production.

## Architecture Impact

- New `live-location` backend module:
  - domain: visibility and stale policy,
  - application: publish provider location, read participant/admin location,
  - infrastructure: Kysely/PostGIS repository,
  - presentation: provider, participant, and admin controllers.
- Database:
  - `live_location_sessions`,
  - `live_location_updates`.
- API:
  - `POST /v1/provider/orders/:orderId/location`
  - `GET /v1/orders/:orderId/location`
  - `GET /v1/admin/orders/:orderId/location`
- Shared packages:
  - public live location contracts in `@tezhelp/types`,
  - validation schemas in `@tezhelp/validation`,
  - route/realtime provider interfaces in `@tezhelp/maps`,
  - localized smoke labels in `@tezhelp/i18n`.

## Domain Invariants

- Tracking cannot begin before provider departure.
- Only the assigned provider can publish provider GPS updates.
- Only assigned parties and authorized administrators can read active tracking.
- Terminal orders never expose live location.
- Stale state is explicit; the system must not infer movement.
- Coordinates must be valid WGS84 latitude/longitude values.

## Implementation Steps

1. Create this execution plan.
2. Add migration and Kysely types.
3. Add shared contracts and validation.
4. Implement location policy, repository, use cases, and controllers.
5. Register `LiveLocationModule` in API root.
6. Add integration tests using existing selected-order helpers.
7. Add web/admin smoke labels and tests.
8. Update docs and ADRs.
9. Run migration, quality gates, commit, push, and check GitHub CI.

## Test Plan

- Unit:
  - tracking visibility after departure,
  - stale calculation,
  - validation schema ranges.
- Integration:
  - provider cannot publish before departure,
  - assigned provider publishes after departure,
  - assigned customer reads current point,
  - stale state is exposed for old GPS records,
  - unrelated user cannot read,
  - terminal order hides tracking,
  - admin can read active-order tracking.
- E2E:
  - mobile web smoke includes map/live tracking labels,
  - admin smoke includes active-order tracking label.
- Quality:
  - `pnpm format:check`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm test:integration`
  - `pnpm test:e2e`
  - `pnpm build`
  - `.codex/hooks/run_quality_gate.py --full`

## Progress

- [x] Create execution plan.
- [x] Add migration and database types.
- [x] Add contracts and validation.
- [x] Implement live location module.
- [x] Add smoke UI labels.
- [x] Add tests.
- [x] Update docs.
- [x] Run quality gates.
- [x] Commit and push.

## Decision Log

- 2026-06-22: Phase 8 starts with REST-backed live tracking foundation because
  the current API dependencies do not include Nest WebSocket packages.
- 2026-06-22: Stale threshold is 90 seconds for MVP foundation; future product
  tuning can change this through configuration.

## Completion Report

Implemented on 2026-06-22.

Changed areas:

- Added `live-location` backend module with policy, Kysely/PostGIS repository,
  use cases, participant/provider/admin controllers, and API root registration.
- Added migration `000008_live_location_foundation` for live location sessions
  and provider GPS updates.
- Added shared live location contracts, validation schemas, route/realtime
  provider interfaces, localized smoke labels, and web/admin smoke coverage.
- Updated README, architecture, domain model, security/privacy, testing
  strategy, and ADRs.

Verification:

- `pnpm infra:up`: passed.
- `pnpm db:migrate`: passed; applied `000008_live_location_foundation`.
- `pnpm format:check`: passed.
- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- `pnpm test:integration`: passed with Docker Postgres/Redis/MinIO.
- `pnpm test:e2e`: passed.
- `pnpm build`: passed.
- `.codex/hooks/run_quality_gate.py --full`: passed with bundled Codex Python.

Remaining work:

- WebSocket delivery, real browser geolocation loops, MapLibre canvas work,
  route-provider implementation, retention jobs, and production RBAC remain
  outside this slice.
