# Provider onboarding UI and private uploads

## Goal

Integrate provider onboarding into the map-first web application so a provider
can complete a general profile, create category-specific service profiles,
upload required documents to local private object storage, and submit each
category for moderation.

## Non-goals

- Production authentication, real identity verification, or automatic document
  verification.
- Admin moderation workflow redesign.
- Offer eligibility rules, moderation transitions, or database schema changes.
- Uploading real personal documents in development fixtures or tests.

## Context

The Phase 2 backend already owns provider profiles, service profiles,
data-driven document rules, independent moderation status, signed document
access, and audit history. The current map-first provider UI exposes only the
order feed and offers. The existing document endpoint registers metadata but
does not transfer file bytes.

## Assumptions

- Local MinIO remains the development private object store.
- Provider uploads use a backend multipart endpoint so storage credentials and
  private object keys never reach the browser.
- General documents support face photos and identity documents; category
  documents continue to use the server-owned category rules.
- A profile may be submitted only from `draft` or `rejected`; the backend
  remains authoritative.

## Architecture impact

- `apps/api/foundation/storage`: add private object write/delete operations.
- `apps/api/provider-services`: add a focused upload use case and multipart
  endpoint.
- `packages/api-client`: add typed `FormData` POST support.
- `apps/web`: add provider onboarding orchestration and presentation.
- `packages/i18n`: add RU/KK/EN onboarding labels and states.
- No migration or new environment variable.
- Private files remain in MinIO; tests use synthetic in-memory file contents.

## Domain invariants

- Approval remains independent per service category.
- The UI never computes moderation or offer eligibility.
- Object keys are generated server-side and are not returned as authorization.
- Failed metadata registration deletes the newly uploaded object when possible.
- Required document type, MIME type, and size are validated server-side.
- Submission status and rejection reasons come only from backend responses.

## Implementation steps

1. Extend the private storage port with write/delete operations and implement
   them for the development S3-compatible adapter.
2. Add multipart provider document upload with focused validation and cleanup.
3. Add `FormData` support to the shared API client.
4. Add provider profile/category/document onboarding UI inside the provider
   workspace.
5. Add localization, unit/integration/E2E coverage, and documentation.
6. Run the full quality gate and visually verify desktop/mobile layouts.

## Test plan

- Unit: API client multipart envelope/error behavior and localization keys.
- Integration: uploaded synthetic file is stored, metadata is registered, and
  unauthorized access remains rejected.
- E2E: provider completes profile, creates a category, uploads required
  synthetic documents, and submits it on desktop/mobile.
- Manual: verify responsive onboarding panel in the running local demo.

## Rollout and rollback

This is backward-compatible. Rollback removes the new upload endpoint and web
onboarding panel; existing provider metadata and moderation APIs remain intact.

## Risks

- Browser-to-API multipart uploads hold files in memory; the 20 MB interceptor
  limit keeps the MVP blast radius bounded.
- Real production storage still requires Kazakhstan hosting, malware scanning,
  retention rules, and production authentication.
- Existing development signed read URLs are not part of this upload slice.

## Progress

- [x] Inspect product rules, backend contracts, and current provider workspace.
- [x] Create execution plan.
- [x] Implement private upload endpoint and API client support.
- [x] Implement provider onboarding UI.
- [x] Add tests and documentation.
- [x] Run full quality gate and visual verification.

## Decision log

- 2026-06-24: Upload file bytes through the API rather than letting the browser
  receive storage credentials or fabricate private object keys.
- 2026-06-24: Keep onboarding in a separate provider feature component and
  leave order-feed orchestration focused on marketplace work.
- 2026-06-24: Enforce profile completeness, category tax allowance, and all
  required documents on the backend before moderation submission.

## Completion report

Completed on 2026-06-24.

- Added real multipart provider document upload through the API to private
  S3-compatible local storage with compensating deletion on metadata failure.
- Added backend moderation-submission checks for general profile completeness,
  category tax allowance, two general identity documents, and all required
  category documents.
- Added a map-integrated provider profile surface for general details, identity
  documents, service categories, per-category documents, rejection state, and
  moderation submission.
- Added RU/KK/EN copy, shared `FormData` API-client support, integration tests,
  and desktop/mobile E2E coverage.
- No database migration or environment-variable change was required.
- Full quality gate passed: formatting, operations validation, lint,
  dependency boundaries, type checking, unit tests, production build, 31
  Docker-backed integration tests, and 7 Playwright E2E tests.
