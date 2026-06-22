# Incident Response Runbook

This runbook is the baseline operational process for TezHelp before production
hosting is selected. It is intentionally provider-neutral and must be updated
when Kazakhstan-hosted production infrastructure, monitoring, support channels,
and deployment tooling are chosen.

## Principles

- protect customer and provider safety first
- preserve wallet, ledger, order, moderation, chat, and location integrity
- keep production personal data, logs, files, and backups in Kazakhstan
- avoid copying phone numbers, identity documents, exact coordinates, chat
  content, access tokens, or private object URLs into foreign tools
- prefer reversible mitigations over risky manual edits
- never rewrite applied migrations or historical ledger entries during incident
  response

## Severity Levels

### SEV-1 Critical

Use SEV-1 when any of these are true:

- order assignment, active-order lifecycle, or provider availability is broadly
  unavailable
- live location is exposed to unauthorized users or fails for active orders in a
  safety-impacting way
- wallet ledger, commission reservation, or response-fee charging integrity is
  at risk
- authentication allows account takeover or bypasses required phone completion
- private documents, chat attachments, exact coordinates, or phone numbers are
  exposed outside authorized users
- production database, object storage, or backups are corrupted or unavailable

Target response: immediate triage, freeze risky deployments, owner assigned,
status update every 15 minutes until mitigated.

### SEV-2 High

Use SEV-2 when a core workflow is degraded but there is no confirmed broad data
exposure or ledger integrity issue:

- provider moderation queue is unavailable
- order discovery or offer publication fails for a meaningful user segment
- chat, attachment access, or admin review tools are unavailable for active
  disputes
- health readiness fails for one dependency while fallback behavior keeps the
  system partially usable

Target response: owner assigned, status update every 30 minutes until
mitigated.

### SEV-3 Medium

Use SEV-3 for limited or non-critical issues:

- localized text or UI layout regression with a workaround
- non-critical admin view issue
- flaky non-production check
- documentation, runbook, or dashboard mismatch

Target response: track in normal engineering workflow with a clear owner.

## Initial Triage

1. Assign one incident lead and one note taker.
2. Record start time, severity, affected surfaces, and current commit SHA.
3. Check GitHub Actions for the current `main` commit.
4. Check API health endpoints:

   ```bash
   curl http://localhost:4000/v1/health/live
   curl http://localhost:4000/v1/health/ready
   curl http://localhost:4000/v1/health
   ```

5. Check local infrastructure health when reproducing locally:

   ```bash
   pnpm infra:up
   pnpm db:migrate
   pnpm test:integration
   ```

6. Capture correlation IDs, error codes, route names, commit SHA, and timestamps.
7. Do not paste personal data, access tokens, private object keys, exact
   coordinates, or full chat content into issue trackers or external tools.

## Error Monitoring Baseline

Current local signals:

- GitHub Actions `CI / quality`
- API structured logs from `RequestLoggerMiddleware`
- correlation IDs through `x-correlation-id`
- API error envelope `{ error: { code, messageKey, details, correlationId } }`
- readiness checks for PostGIS, Redis, and S3-compatible private storage
- e2e smoke tests for web/admin shells

Future production monitoring must add Kazakhstan-hosted or legally reviewed:

- API error rate and latency dashboards
- frontend error capture with personal-data scrubbing
- uptime checks for web, admin, API, object storage, and database readiness
- alert routing with escalation contacts
- log retention and deletion policy
- audit-log review for privileged admin and wallet actions

## Privacy and Security Handling

Treat these as sensitive during every incident:

- phone numbers
- names, IIN, identity documents, driver licenses, vehicle certificates
- exact customer/provider coordinates
- chat messages and voice/photo attachments
- wallet ledger entries and balances
- access tokens, private object keys, signed URLs, OTPs, and credentials

Allowed in public or foreign systems:

- synthetic reproduction data
- stable error codes
- correlation IDs
- route names
- non-sensitive timestamps
- aggregate counts that cannot identify a person

If personal data may be exposed, raise severity to SEV-1, preserve evidence in
Kazakhstan-hosted storage, rotate affected credentials if needed, and prepare a
legal/privacy review before external disclosure.

## Mitigation and Rollback

Prefer this order:

1. disable or hide the risky feature if a flag or route-level guard exists
2. roll forward with a narrowly scoped fix when the cause is obvious and tested
3. roll back the application deployment when the last known good build is clear
4. restore service dependencies only from verified backups

Never:

- edit wallet ledger history
- rewrite already-applied production migrations
- manually change order state without an audited administrative action
- delete private files needed for disputes or moderation review
- restore a database backup over the main database without an approved restore
  plan and fresh validation

After mitigation, run the relevant checks:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
pnpm build
```

For database or restore-related incidents, also run:

```bash
pnpm db:backup:validate
```

## Communication

Internal updates should include:

- severity
- user impact
- affected routes or workflows
- whether personal data, wallet integrity, or live location is involved
- current mitigation
- next update time

Do not include personal data in chat, email, GitHub issues, or external
monitoring tools. Use correlation IDs and internal audit/event IDs instead.

Customer/provider messaging must be factual and short:

- what is affected
- whether a workaround exists
- when the next update is expected
- whether action is required from the user

## Postmortem Checklist

Create a postmortem for every SEV-1 and SEV-2 incident.

Required sections:

- summary
- timeline with absolute timestamps
- customer/provider impact
- root cause
- detection source
- what worked
- what failed
- data/privacy assessment
- wallet/ledger/order/location integrity assessment
- rollback or mitigation details
- follow-up actions with owners and due dates

Follow-up actions must include tests, monitoring, documentation, or operational
changes when they would have prevented or shortened the incident.

## Production Readiness Gaps

Before launch, fill these gaps:

- choose Kazakhstan-hosted monitoring and log storage
- define support and escalation contacts
- define public status/update channel
- add frontend error capture with scrubbing
- add alert thresholds for health readiness, error rate, latency, queue lag,
  wallet reconciliation, failed offer charging, and storage signing failures
- document production rollback commands after deployment tooling exists
