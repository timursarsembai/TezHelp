# Admin moderation workspace

## Goal

Replace the static admin moderation shell with a working local-development
workspace that authenticates an admin actor through the existing OTP flow,
lists and filters moderation submissions, opens provider/document details, and
records review, approval, rejection, or suspension decisions.

## Non-goals

- Production RBAC, staff roles, SSO, or permission administration.
- General user management, complaints, wallets, tariffs, sanctions, or active
  order operations.
- Automated document verification or malware scanning.
- Changes to moderation statuses or database schema.

## Context

The moderation backend already exposes queue, detail, transition, and audited
document-access endpoints behind the development admin header. The admin app is
currently a static auth-required shell. Provider onboarding now uploads real
private objects to local MinIO.

## Assumptions

- Local admin access uses the existing OTP endpoint and stores the returned user
  ID only in admin-app session storage.
- The user ID acts as the audited development admin actor; it is not a
  production authorization claim.
- Real document review requires S3-compatible presigned read URLs.
- Moderation reasons remain mandatory for approval, rejection, and suspension.

## Architecture impact

- `apps/admin`: development OTP gate and moderation feature components.
- `apps/admin/next.config.mjs`: local `/backend` proxy to the standalone API.
- `apps/api/foundation/storage`: asynchronous real S3 presigned read URLs.
- `apps/api/moderation`: include general provider documents in moderation
  detail.
- `@tezhelp/i18n`: RU/KK/EN admin moderation labels.
- No migration or environment-variable change.

## Domain invariants

- The backend remains the source of moderation transitions.
- Every decision includes an actor, reason, document version, and audit event.
- Document reads remain private, short-lived, permission-scoped, and audited.
- Approval in one category never approves another category.
- The UI never fabricates queue items or decisions.

## Implementation steps

1. Replace the development storage URL stub with a real S3 presigner.
2. Include general documents in moderation detail.
3. Add a local OTP admin gate and `/backend` API proxy.
4. Implement queue filters, SLA indicators, detail, document review, history,
   and decision actions.
5. Add localization, tests, and documentation.
6. Run the full quality gate and visually verify desktop/mobile layouts.

## Test plan

- Unit: admin localization and signed URL adapter behavior.
- Integration: general/category documents appear in moderation detail and
  signed admin access is audited.
- E2E: local admin enters, filters queue, reviews a document, and approves or
  rejects a profile.
- Manual: verify responsive queue/detail layouts.

## Rollout and rollback

Backward-compatible. Rollback restores the static admin shell and previous
storage adapter; moderation APIs and data remain unchanged.

## Risks

- Development admin access is intentionally not production RBAC and must remain
  rejected in production configuration.
- Opening a presigned document URL transmits a private-object request to local
  MinIO; tests use synthetic files only.
- Real production review requires Kazakhstan-hosted storage and staff access
  controls.

## Progress

- [x] Inspect moderation APIs, current admin shell, and development auth.
- [x] Create execution plan.
- [x] Implement real signed read URLs and moderation detail documents.
- [x] Implement local admin access and moderation workspace.
- [x] Add tests and documentation.
- [x] Run applicable local checks and visual verification.

## Decision log

- 2026-06-24: Reuse existing OTP identity only to identify the local audited
  admin actor; do not simulate production staff authorization.
- 2026-06-24: Keep moderation as the only working admin surface in this slice.
- 2026-06-24: Reuse catalog document labels in the review UI so data-driven
  category rules remain the source of user-facing document names.

## Completion report

Completed on 2026-06-24.

- Added local OTP admin access with a session-scoped audited moderator actor.
- Added a responsive moderation queue with status/category filters, SLA
  indicators, provider facts, general/category documents, audit history, and
  review/approve/reject/suspend actions.
- Replaced the development storage URL stub with real five-minute S3-compatible
  presigned read URLs and included general documents in moderation detail.
- Added RU/KK/EN copy, shared contracts, desktop/mobile admin E2E, and MinIO
  signed-read integration coverage.
- No database migration or environment-variable change was required.
- Local formatting, lint, dependency boundaries, type checking, unit tests,
  production build, the focused Docker integration test, and all desktop/mobile
  E2E scenarios passed.
- The local all-in-one Codex hook could not be started because the execution
  approval layer reported a temporary usage limit. GitHub CI remains the final
  full-gate authority for this commit.
