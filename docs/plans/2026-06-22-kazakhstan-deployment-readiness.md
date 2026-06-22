# Kazakhstan Deployment Readiness

## Goal

Document the production-readiness checklist for choosing and preparing
Kazakhstan-hosted infrastructure before TezHelp buys or configures a VPS.

## Non-goals

- No VPS purchase or production server setup in this slice.
- No Terraform, Kubernetes, Ansible, or production Docker deployment.
- No vendor recommendation.
- No production secrets, credentials, domains, TLS certificates, or real
  personal data.
- No change to application runtime behavior.

## Context

TezHelp is still running locally for development. The product requires
Kazakhstan hosting for production personal data, private files, exact
live-location records, logs that may contain personal data, generated document
artifacts, and backups. The current deployment README only states the
constraint; it does not yet tell a non-operator what must be checked before
buying hosting.

## Assumptions

- Local Docker remains the development environment for now.
- Production hosting will be selected later, after the readiness checklist is
  reviewed.
- Any foreign SaaS provider touching personal data requires separate legal and
  security review before use.
- The first production deployment should stay simple and modular, matching the
  current monolith architecture.

## Architecture Impact

- Add a provider-neutral Kazakhstan deployment readiness runbook.
- Link the runbook from root and deployment documentation.
- Extend operations validation so the readiness runbook keeps the required
  sections.

## Implementation Steps

1. Create this execution plan.
2. Add `infrastructure/deployment/kazakhstan-readiness.md`.
3. Link the readiness runbook from `infrastructure/deployment/README.md`,
   `README.md`, and security documentation.
4. Extend `pnpm ops:validate` to validate the deployment runbook.
5. Run quality gates.
6. Commit, push, and verify CI.

## Test Plan

- `pnpm format:check`
- `pnpm ops:validate`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:integration`
- `pnpm test:e2e`
- `pnpm build`
- `.codex/hooks/run_quality_gate.py --full`

## Rollout and Rollback

This is documentation and validation only. Rollback removes the readiness
runbook, its links, and its validation entry. No migration rollback is required.

## Risks

- The checklist can become stale as production architecture changes, so it is
  included in operations validation and linked from the main docs.
- The document must not create fake confidence that production is ready today;
  it explicitly separates local development from future production hosting.

## Progress

- [x] Create execution plan.
- [x] Add Kazakhstan deployment readiness runbook.
- [x] Link documentation.
- [x] Extend validation coverage.
- [x] Run quality gates.
- [x] Commit, push, and verify CI.

## Decision Log

- 2026-06-22: Keep this provider-neutral and pre-purchase focused; no VPS
  commands are added until a real hosting provider and environment are chosen.

## Completion Report

Implemented the Kazakhstan deployment readiness documentation baseline:

- added a provider-neutral pre-purchase checklist for Kazakhstan-hosted
  production infrastructure
- documented local-vs-production boundaries, data-residency requirements,
  production environment checks, deployment gates, rollback/restore rules, and
  remaining production gaps
- linked the readiness runbook from root, deployment, and security
  documentation
- extended `pnpm ops:validate` to validate both the incident response runbook
  and the deployment readiness runbook

Local validation completed on 2026-06-22:

- `pnpm format:check`
- `pnpm ops:validate`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm db:migrate`
- `pnpm db:backup:validate`
- `pnpm test:integration`
- `pnpm test:e2e`
- `.codex/hooks/run_quality_gate.py --full` using bundled Codex Python with
  local Docker services available

Remaining production work:

- choose a Kazakhstan hosting provider and record data-residency evidence
- implement production deployment automation, secrets management, TLS/domain
  setup, production authentication/RBAC, provider integrations, alerting, and
  retention schedules

Committed and pushed on 2026-06-22:

- `94aa0f6 docs: add kazakhstan deployment readiness`
- GitHub Actions CI run `27968204310` passed.
