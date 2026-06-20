# Provider Moderation Foundation

## Goal

Implement the Phase 2 foundation for provider onboarding with one general
provider profile and independently moderated service-category profiles.

## Non-goals

- No order, offer, wallet, commission, chat, live-location, or payment workflows.
- No real production authentication, RBAC, SMS, malware scanning, or automatic
  document verification.
- No public object storage access and no storage of real identity-document
  content in the repository.
- No hardcoded legal eligibility decisions beyond seeded configurable defaults.

## Context

- `prompts/02_PROVIDER_MODERATION.md` requires service categories, provider
  profiles, per-category documents, manual moderation, admin/provider UI, and
  private document access.
- `docs/ROADMAP.md` defines this as Phase 2.
- `docs/DOMAIN_MODEL.md` assigns category policy to `ServiceCategory` and
  category-specific moderation/documents to `ProviderServiceProfile`.
- `docs/SECURITY_PRIVACY.md` requires private storage, signed URLs, and document
  access audit.
- ADR-001, ADR-002, ADR-011, ADR-012, and ADR-013 remain binding.

## Assumptions

- Development-only auth continues to use `x-tezhelp-user-id` until a production
  auth/RBAC task is implemented.
- Admin endpoints are guarded by a development admin header and audit every
  sensitive moderation action; production startup must reject this adapter.
- Document upload in this slice records private object metadata and validates
  declared type/size; real multipart upload and malware scanning are future
  adapter work.
- SLA is calculated as three hours from submission in this slice; a future
  business-calendar service can replace the clock policy for working hours.

## Architecture Impact

- Backend modules: `service-catalog`, `provider-services`, `moderation`, and a
  narrow `foundation/storage` port.
- Database changes: service categories, category translations, category tax
  allowance, document rules, provider profile details, service profiles,
  document metadata, moderation history, and document access audit.
- API changes:
  - provider catalog/profile/category/document endpoints under `/v1`.
  - admin moderation queue/detail/decision/suspension endpoints under `/v1/admin`.
- Security impact: private object keys never authorize access by themselves;
  signed URL creation is permission scoped and audited.
- Localization impact: RU/KK/EN category labels and UI strings.

## Domain Invariants

- One provider can have multiple service profiles.
- Approval in one category never approves another category.
- A provider service profile must be approved and not suspended before later
  offer workflows may use it.
- Tax-status allowance and required document rules are category configuration.
- Moderation decisions require an actor, reason, document version, and audit
  history entry.
- Document access requires explicit authorization and creates an audit record.

## Implementation Steps

1. Add migration and database types for service catalog and provider moderation.
2. Seed eight MVP categories with RU/KK/EN names/descriptions, tax-status
   allowances, and configurable document rules.
3. Add shared contract and validation types for provider profile, service
   profile, documents, moderation statuses, and decisions.
4. Implement backend modules with thin controllers and focused use cases.
5. Add a private object-storage port with a development signed-URL adapter.
6. Add provider-facing mobile-first UI examples for profile/category/document
   status.
7. Add admin moderation queue/detail/actions UI shell without fake production
   auth simulation.
8. Add unit, integration, authorization, and e2e smoke tests.
9. Update docs and mark this plan with completion details.

## Test Plan

- Unit:
  - category document rule validation
  - moderation decision/status transitions
  - SLA deadline calculation
  - localization/category fallback
- Integration:
  - category seed/migration applies cleanly
  - provider category approval does not approve another category
  - unapproved/suspended category eligibility is false
  - unauthorized document URL access is rejected
  - admin moderation decision writes audit history
- E2E:
  - mobile provider onboarding smoke
  - admin moderation queue smoke
- Quality:
  - `pnpm format:check`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm test:integration`
  - `pnpm test:e2e`
  - `pnpm build`
  - `.codex/hooks/run_quality_gate.py --full`

## Rollout and Rollback

Apply migration `000003_provider_moderation_foundation`. Rollback drops only
Phase 2 tables and leaves identity/foundation tables intact. Production rollout
must wait for real auth/RBAC, upload scanning, and Kazakhstan-hosted private
storage configuration.

## Risks

- Development auth can accidentally look like real authorization; env validation
  must reject it in production.
- Document metadata can become sensitive; logs and UI must avoid raw object keys.
- SLA working-hours behavior is simplified until a business-calendar policy is
  introduced.
- Full acceptance depends on future order/offer phases for actual offer blocking.

## Progress

- [x] Read prompt and required architecture/product documents.
- [x] Add database migration and types.
- [x] Add shared contracts and validation.
- [x] Implement backend service-catalog/provider-services/moderation slice.
- [x] Add provider and admin UI shells.
- [x] Add tests.
- [x] Run quality gates.

## Decision Log

- 2026-06-21: Keep Phase 2 as three cohesive backend modules rather than a
  single provider service: service-catalog owns category policy, provider-services
  owns provider-owned profiles/documents, and moderation owns review decisions.
- 2026-06-21: Use development-only admin/user headers for this local slice and
  fail production config when those headers are enabled.
- 2026-06-21: API integration tests that share the local Docker database run
  sequentially because existing tests truncate shared tables.

## Completion Report

Implemented:

- migration `000003_provider_moderation_foundation`
- service catalog category seed with RU/KK/EN translations
- configurable tax-status allowances and document rules
- provider profile, provider service profiles, document metadata, submission,
  signed document URL use cases, and future offer eligibility
- admin moderation queue/detail/review/approve/reject/suspend/document access
- provider and admin UI smoke shells with localized strings
- provider moderation integration tests and updated localization tests

Commands run so far:

- `pnpm format`
- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm db:migrate`
- `pnpm build`
- `pnpm test:e2e`
- `pnpm test:integration`
- `.codex/hooks/run_quality_gate.py --full`

Result:

- full quality gate passed with Docker-backed integration tests and Playwright
  e2e smoke.
