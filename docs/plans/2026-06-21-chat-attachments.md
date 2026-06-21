# Chat and Attachments Foundation

## Goal

Implement Phase 7 as a backend-first order conversation slice:

1. each selected order has one conversation,
2. assigned customer and provider can exchange text messages,
3. assigned customer and provider can register private photo/voice attachment
   metadata,
4. attachment access uses short-lived private signed URLs,
5. chat messages keep delivery timestamps,
6. participants can report messages for dispute review,
7. administrators can view order conversations and access attachments for
   dispute handling,
8. system event messages can be recorded for order lifecycle events.

## Non-goals

- No WebSocket/realtime delivery yet.
- No browser upload flow or presigned upload URL generation.
- No malware scanning, image derivatives, waveform generation, or voice
  transcoding.
- No chat search, pagination cursor beyond a simple limit, or unread counters.
- No production RBAC replacement; development headers remain local/test only.
- No complaint workflow, sanctions, or moderation resolution.
- No live location or maps.

## Context

- `docs/ROADMAP.md` Phase 7 requires order conversation, text, photos, voice,
  system events, private storage, access control, and dispute evidence warning.
- `docs/PRODUCT_SPEC.md` says communication occurs in TezHelp before departure,
  chat supports text/photos/voice/system events/delivery timestamps/reporting,
  and administrators may access dispute evidence.
- Existing storage foundation exposes `PrivateObjectStoragePort.signReadUrl`.
- Existing provider document access already stores private object metadata and
  audits signed URL creation.
- Existing orders module owns assignment and lifecycle state; chat must use
  order assignment for authorization and must not duplicate order policy in the
  frontend.

## Assumptions

- Chat opens after provider selection and remains readable after terminal
  statuses for dispute evidence.
- Sending user messages is allowed only while the order is active:
  `provider_selected`, `provider_en_route`, `provider_arrived`, `in_progress`.
- System messages may be appended by backend use cases regardless of terminal
  status.
- Photo attachments accept JPEG, PNG, and WebP up to 20 MB.
- Voice attachments accept WebM, Ogg, and MPEG audio up to 10 MB and 180
  seconds.
- This slice registers attachment metadata after an object already exists in
  private storage; upload orchestration is future attachment pipeline work.
- Admin access uses `x-tezhelp-admin-user-id`, matching existing development
  admin endpoints.

## Architecture Impact

- New `chat` backend module:
  - domain: message/attachment policy and errors,
  - application: conversation, send message, signed attachment URL, report
    message, admin conversation query,
  - infrastructure: Kysely repository,
  - presentation: customer/provider chat controller and admin chat controller.
- Database:
  - `order_conversations`,
  - `chat_messages`,
  - `chat_attachments`,
  - `chat_message_reports`,
  - `chat_attachment_access_audit`.
- API:
  - `GET /v1/orders/:orderId/chat`
  - `POST /v1/orders/:orderId/chat/messages`
  - `POST /v1/orders/:orderId/chat/messages/:messageId/report`
  - `GET /v1/orders/:orderId/chat/attachments/:attachmentId/access-url`
  - `GET /v1/admin/orders/:orderId/chat`
  - `GET /v1/admin/orders/:orderId/chat/attachments/:attachmentId/access-url`
- Frontend:
  - add smoke UI labels only; no frontend-owned authorization or attachment
    policy.
- Documentation:
  - update architecture, domain model, security/privacy, testing, README, and
    ADRs.

## Domain Invariants

- Only the order customer, assigned provider, and authorized administrators can
  read a conversation.
- Only the assigned customer/provider can send user messages.
- User sending is blocked before provider selection and after terminal order
  states.
- Attachment object keys are not authorization.
- Every signed attachment URL writes an access audit row.
- A message can have either text content or exactly one attachment in this
  slice.
- Attachment metadata must match kind-specific MIME, size, and duration rules.
- Reports are append-only and idempotent per reporter/message.
- System messages have no private attachment and no user sender.

## Implementation Steps

1. Add this execution plan and keep it updated.
2. Add migration and Kysely types for conversation/messages/attachments/reports.
3. Add shared types and validation schemas.
4. Implement chat domain policy and errors.
5. Implement Kysely chat repository with order-participant authorization
   queries.
6. Implement application use cases:
   - get conversation,
   - send text/attachment message,
   - get attachment signed URL,
   - report message,
   - admin get conversation,
   - admin get attachment signed URL.
7. Add controllers and register `ChatModule` in API root.
8. Add frontend/admin smoke labels.
9. Add unit and integration tests.
10. Update docs and ADRs.
11. Run quality gates and GitHub CI.
12. Commit and push.

## Test Plan

### Unit

- chat attachment policy:
  - photo MIME/size,
  - voice MIME/size/duration,
  - text-only and attachment-only message validation.
- validation schemas:
  - text length,
  - attachment kind,
  - report reason.

### Integration

- selected order creates/returns a conversation.
- assigned customer sends text.
- assigned provider sends attachment metadata.
- unrelated user cannot read/send.
- sending before provider selection is rejected.
- sending after completion/cancellation is rejected.
- signed attachment URL is returned only to assigned participants/admin.
- signed attachment URL writes access audit row.
- report message is idempotent per reporter/message.
- admin can view conversation after terminal order status.

### E2E

- mobile web smoke includes chat/dispute-evidence labels.
- admin smoke includes dispute evidence chat label.

### Migration

- `pnpm db:migrate`
- integration suite validates schema in Docker Postgres.

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

- Apply migration.
- Keep all chat objects in private storage.
- Keep development auth local/test only.

Rollback:

- In development, rollback can drop chat tables.
- In production, do not delete dispute evidence once real users exist; use
  forward migrations and retention policy.

## Risks

- Chat attachments may contain sensitive dispute evidence; access auditing is
  mandatory.
- Without a real upload pipeline, metadata could point at a missing object; this
  is acceptable for foundation but must be fixed before production.
- Realtime delivery is excluded; clients must refetch conversation state.
- Chat after terminal statuses is sensitive but needed for dispute review; keep
  send blocked and read allowed.

## Progress

- [x] Read roadmap/product/architecture/security context.
- [x] Create execution plan.
- [x] Add migration and database types.
- [x] Add contracts and validation.
- [x] Implement chat policy and repository.
- [x] Implement use cases and controllers.
- [x] Add smoke UI labels.
- [x] Add tests.
- [x] Update docs.
- [x] Run quality gates.
- [x] Commit and push.

## Decision Log

- 2026-06-21: Phase 7 uses a new `chat` module instead of adding chat behavior
  to `orders`, keeping order lifecycle and conversation responsibilities
  separate.
- 2026-06-21: This slice registers private attachment metadata only; upload and
  processing remain future attachment pipeline work.

## Completion Report

Implemented on 2026-06-21.

Changed areas:

- Added `chat` backend module with domain policy, Kysely repository,
  application use cases, participant/admin controllers, and API root
  registration.
- Added migration `000007_chat_attachments` for order conversations, messages,
  private attachment metadata, message reports, and signed URL access audit.
- Added shared chat contracts, validation schemas, localized smoke labels, and
  web/admin smoke coverage.
- Updated README, architecture, domain model, security/privacy, testing
  strategy, and ADRs.

Verification:

- `pnpm infra:up`: passed.
- `pnpm db:migrate`: passed; applied `000007_chat_attachments`.
- `pnpm format:check`: passed.
- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- `pnpm test:integration`: passed with Docker Postgres/Redis/MinIO.
- `pnpm test:e2e`: passed.
- `pnpm build`: passed.
- `.codex/hooks/run_quality_gate.py --full`: passed with bundled Codex Python.

Remaining work:

- Realtime delivery, browser upload orchestration, malware scanning, attachment
  derivatives, complaint resolution, and production RBAC remain outside this
  slice.
