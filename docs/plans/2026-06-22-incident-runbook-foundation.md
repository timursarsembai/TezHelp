# Incident Runbook Foundation

## Goal

Add an operational incident-response and error-monitoring runbook that can be
used before production hosting is chosen, plus a lightweight validation script
so critical runbook sections stay present in CI.

## Non-goals

- No external monitoring provider integration.
- No VPS, Kubernetes, or production deployment setup.
- No on-call paging vendor configuration.
- No real customer communication templates tied to a production brand channel.
- No automated rollback or deployment tooling.

## Context

Phase 10 requires error monitoring, security review, and operational runbooks.
The repository already has health endpoints, Docker infrastructure, CI, security
headers, backup/restore validation, and quality gates. A provider-specific
monitoring stack should wait until Kazakhstan production hosting is selected,
but the incident process can be documented and validated now.

## Assumptions

- Production logs that may contain personal data must be hosted in Kazakhstan.
- Until production hosting exists, incident checks target local Docker, GitHub
  Actions, API health endpoints, and structured API logs.
- External monitoring tools require a later data-residency and privacy review.

## Architecture Impact

- New runbook:
  - `infrastructure/operations/incident-response.md`
- New validation script:
  - `scripts/validate-operations-runbook.mjs`
- New root script:
  - `pnpm ops:validate`
- CI and Codex quality gate run the validation script.

## Domain Invariants

- The runbook must not ask operators to paste real personal data into foreign
  systems.
- Incident severity must account for safety, live location, wallet/ledger,
  orders, chat attachments, provider moderation, and authentication.
- Rollback guidance must avoid rewriting migrations or ledger history.

## Implementation Steps

1. Create this execution plan.
2. Add incident-response runbook.
3. Add runbook validation script and root command.
4. Wire validation into CI and Codex quality gate.
5. Update README and testing/security docs.
6. Run quality gates.
7. Commit, push, and verify CI.

## Test Plan

- `pnpm ops:validate`
- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:integration`
- `pnpm test:e2e`
- `pnpm build`
- `.codex/hooks/run_quality_gate.py --full`

## Rollout and Rollback

This is documentation and local validation tooling. Rollback removes the
runbook, validation script, root command, CI step, hook entry, and docs updates.

## Risks

- The runbook is a baseline, not a substitute for a real production monitoring
  provider.
- Alert thresholds and escalation contacts remain placeholders until hosting
  and support operations are chosen.
- Future production deployment may require provider-specific sections.

## Progress

- [x] Create execution plan.
- [x] Add incident-response runbook.
- [x] Add runbook validation script and root command.
- [x] Wire validation into CI and Codex quality gate.
- [x] Update README and testing/security docs.
- [x] Run quality gates.
- [ ] Commit and push.

## Decision Log

- 2026-06-22: Keep monitoring-provider selection out of this slice; document
  Kazakhstan data-residency constraints for any future provider.

## Completion Report

Implemented the provider-neutral incident-response and error-monitoring runbook
at `infrastructure/operations/incident-response.md`. The runbook covers
severity levels, initial triage, current local monitoring signals, privacy and
security handling, mitigation/rollback rules, communication, postmortems, and
production readiness gaps.

Added `scripts/validate-operations-runbook.mjs` and the root
`pnpm ops:validate` command. The validation is now wired into GitHub Actions and
the Codex quality gate so required runbook sections stay present.

Also hardened `scripts/run-e2e.mjs` on Windows by clearing test ports before
starting web/admin dev servers, which prevents stale local Next.js processes
from causing false e2e failures.

Validation completed locally:

- `pnpm ops:validate`
- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:integration`
- `pnpm test:e2e`
- `pnpm build`
- `.codex/hooks/run_quality_gate.py --full`

Pending commit, push, and CI verification.
