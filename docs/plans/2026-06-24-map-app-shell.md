# Map-first web application shell

## Goal

Deliver the first real customer-facing web slice:

1. the initial route shows phone OTP sign-in;
2. successful local development authentication opens a MapLibre map centered on Almaty;
3. desktop and mobile navigation keep the map as the primary surface;
4. a signed-in customer can select a map point and publish an order through the existing API.

## Non-goals

- Production sessions, real SMS, or Google OAuth.
- Geocoding, routing, realtime WebSocket delivery, or inferred movement.
- Provider discovery UI, offer submission, chat UI, payments, or admin changes.
- A production map-tile vendor decision.

## Context

The backend already owns identity, service categories, order publication, and
live-location authorization. `@tezhelp/maps` contains MapLibre/provider
interfaces but the web app still renders a foundation showcase. Phase 8 calls
for MapLibre integration, while production use of public OpenStreetMap tile
servers is explicitly forbidden.

## Assumptions

- Local development continues to use the documented OTP `123456`.
- Until production session cookies are implemented, the returned local user ID
  may be retained in browser session storage and sent through the existing
  development-only identity header.
- Public OpenStreetMap raster tiles are acceptable only for low-volume local
  development and automated smoke tests must remain useful when tiles are
  unavailable.
- The first slice is customer-focused. Provider map discovery remains a
  separate vertical slice.

## Architecture impact

- `apps/web`: replaces the showcase page with focused auth and map features.
- `@tezhelp/api-client`: adds request-header support needed by development auth.
- `@tezhelp/maps`: adds an explicitly development-only OSM raster style adapter.
- No database migration or backend API change.
- Exact coordinates remain browser/API data and are not logged.
- New user-facing strings are added for RU/KK/EN.

## Domain invariants

- Order publication remains an API command; the UI does not decide eligibility
  or order-state policy.
- A customer cannot publish until a service category, map point, landmark, and
  description are present.
- Development identity headers must never be presented as production auth.
- No fictional provider movement or fake marketplace orders are rendered.

## Implementation steps

1. Extend shared map/API client boundaries.
2. Build the phone OTP entry flow and local session boundary.
3. Build the responsive map-first workspace and map point selection.
4. Load real service categories and publish orders through the existing API.
5. Update localization, documentation, and tests.
6. Run the full quality gate and visually verify desktop/mobile layouts.

## Test plan

- Unit: API client custom headers and development map-style structure.
- Unit: RU/KK/EN keys and Russian fallback.
- End-to-end: mobile sign-in with mocked API, map workspace landmarks, order
  panel interaction, security headers, keyboard skip link.
- Manual: desktop and mobile screenshots; MapLibre canvas is nonblank and does
  not overlap navigation or panels.
- Build/type/lint/format and existing integration suites.

## Rollout and rollback

The change is frontend-only and uses existing APIs. Rollback restores the
previous web page and removes the development style adapter; no persisted data
or migration rollback is required.

## Risks

- Public raster tiles can be unavailable or rate-limited; this is not a
  production provider.
- Session storage is deliberately development-only and must be replaced by
  secure server-issued sessions.
- Browser map bundles increase the existing foundation resource budget, so the
  e2e budget must be updated to a map-aware baseline.

## Progress

- [x] Read required product, architecture, security, testing, and hook docs.
- [x] Extend shared boundaries.
- [x] Implement authentication entry.
- [x] Implement map workspace and order publication.
- [x] Update tests and documentation.
- [x] Run full quality gate and visual verification.

## Decision log

- 2026-06-24: Use the existing real development OTP endpoints rather than a
  fake login screen.
- 2026-06-24: Keep OSM raster styling explicitly development-only; production
  tile hosting remains a deployment decision.
- 2026-06-24: Start with the customer order flow and leave provider discovery
  for the next vertical slice.
- 2026-06-24: Keep a small local Almaty road layer below the external raster
  map so the interactive surface remains visible when development tile access
  is unavailable.
- 2026-06-24: Bind the default browser `fetch` implementation inside
  `ApiClient`; unbound `window.fetch` fails with `Illegal invocation` in
  Chromium.

## Completion report

Implemented the customer map-first web slice without database or backend API
changes. The web route now authenticates against the existing development OTP
endpoints, retains only a tab-scoped local session, opens a responsive MapLibre
workspace, loads real service categories, selects coordinates from map clicks,
and publishes through `POST /v1/orders`.

Changed areas:

- web auth, map, responsive navigation, and order-panel feature components;
- RU/KK/EN messages;
- API client request headers, PATCH support, bound browser fetch, and
  correlation-ID fallback;
- development OSM style plus local Almaty fallback geometry;
- desktop/mobile Playwright coverage and screenshot verification;
- README, architecture, accessibility, and this execution plan.

Checks completed before the final hook gate:

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `node scripts/run-e2e.mjs` with mobile web, desktop web, and admin passing

No migration was introduced. Public OSM raster tiles were unavailable inside
the isolated test browser; screenshots confirmed the local fallback layer and
responsive layout, while production tile hosting remains unresolved.
