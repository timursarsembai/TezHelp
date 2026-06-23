# Provider map workspace

## Goal

Add the first provider-facing web slice to the existing map application:

- switch between customer and provider roles;
- show backend-authorized discoverable orders as map markers and a list;
- expose wallet/free-response state;
- submit a price, arrival estimate, and comment through the existing atomic
  offer endpoint.

## Non-goals

- Provider onboarding or document upload UI.
- Active-order lifecycle, chat, routing, or realtime notifications.
- Frontend-owned eligibility or financial calculations.
- Fake orders or synthetic production data.

## Context

The backend already owns provider discovery, PostGIS radius filtering, service
profile eligibility, wallet checks, response charging, and offer publication.
The web app currently exposes only the customer map workspace.

## Assumptions

- Accounts may switch roles through `PATCH /v1/me/role`.
- Providers without approved service profiles receive an empty feed or a stable
  API error; the UI must not fabricate eligibility.
- The all-Almaty feed remains the default. Radius editing is deferred.

## Architecture impact

- `apps/web`: provider workspace orchestration and presentation components.
- `@tezhelp/maps`: reusable order marker rendering.
- `@tezhelp/i18n`: RU/KK/EN provider workspace messages.
- No migration or backend API change.

## Domain invariants

- The backend remains the source of offer eligibility and charging.
- Price is submitted as integer KZT.
- One active order, sanction, moderation, and wallet rules are never duplicated
  in the UI.
- Exact order coordinates are rendered only from the authorized provider feed.

## Implementation steps

1. Add role switching at the auth/workspace boundary.
2. Load provider feed and wallet with development identity headers.
3. Render discoverable orders as markers and a scan-friendly panel.
4. Submit offers with generated idempotency keys.
5. Add mobile/desktop tests, docs, and full quality checks.

## Test plan

- Unit: localization keys and marker rendering contracts.
- E2E: switch to provider, see a mocked discoverable order, open it, submit an
  offer, and see confirmation on mobile and desktop.
- Existing integration tests continue to cover atomic charging and eligibility.

## Rollout and rollback

Frontend-only. Rollback removes provider workspace components and restores the
customer-only role shell.

## Risks

- A fresh local account has no approved service profile and therefore no real
  discoverable orders.
- Production sessions still need to replace the development identity header.

## Progress

- [x] Inspect provider discovery, wallet, and offer contracts.
- [x] Implement role switching and provider data loading.
- [x] Implement map markers, feed, and offer panel.
- [x] Update tests and documentation.
- [x] Run full quality gate and visual verification.

## Decision log

- 2026-06-24: Keep all-Almaty discovery as the initial provider view and defer
  radius preference controls.
- 2026-06-24: Reuse the customer map shell while keeping provider orchestration
  in a separate component.

## Completion report

Completed on 2026-06-24.

- Added customer/provider role switching with the selected role retained in the
  local development session.
- Added the provider map workspace with an authorized order feed, map markers,
  wallet/free-response summary, and offer submission.
- Added RU/KK/EN localization and responsive desktop/mobile presentation.
- Added provider E2E coverage and visually reviewed desktop and mobile
  screenshots.
- No backend contract or database migration was required.
- Full quality gate passed: formatting, operations validation, lint,
  dependency boundaries, type checking, unit tests, build, 29 integration
  tests, and 5 E2E tests.
