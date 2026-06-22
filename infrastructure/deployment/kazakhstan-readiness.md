# Kazakhstan Deployment Readiness

## Purpose

This runbook explains what must be true before TezHelp buys, configures, or uses
production hosting. It is written for the current stage: local development is
active, but no VPS or production provider has been selected.

The goal is to avoid an unsafe launch path. Production infrastructure must be
chosen around Kazakhstan data residency, restore ability, auditability, and
clear rollback rules.

## Non-goals

- Do not buy hosting from this document alone.
- Do not copy local `.env.example` credentials into production.
- Do not deploy real users, identity documents, chats, phone numbers, wallet
  data, or exact coordinates to a test VPS.
- Do not add foreign SaaS logging, monitoring, storage, analytics, or support
  tools that receive personal data without legal and security review.
- Do not simulate production authentication with the development auth headers.

## Data Residency

Production personal data must be stored and processed on infrastructure
physically located in Kazakhstan. This includes:

- PostgreSQL/PostGIS data;
- Redis data if it contains sessions, rate-limit keys, queues, or personal
  workflow state;
- private object storage for documents, order photos, chat attachments, and
  generated artifacts;
- application logs, error monitoring events, audit exports, and support notes
  that may contain personal data;
- backups, WAL/archive logs, snapshots, and restore-test artifacts;
- exact live-location records and route-related operational data.

Any provider outside Kazakhstan is blocked for these categories until a separate
legal, privacy, and security decision explicitly approves the use case.

## Current Local Stage

For now, TezHelp runs locally on the developer PC:

- Next.js web on `localhost:3000`;
- Next.js admin on `localhost:3001`;
- NestJS API on `localhost:4000`;
- Docker Compose Postgres/PostGIS, Redis, and MinIO for development only.

This is enough for development and automated checks. It is not production
hosting and it must not receive real personal data.

## Pre-purchase Hosting Checklist

Before buying or committing to a production provider, confirm all items:

- the provider can place compute, database storage, object storage, logs, and
  backups physically in Kazakhstan;
- the provider can document the data-center location and support data-residency
  requirements;
- private networking or firewall rules can prevent public database, Redis, and
  object-storage admin access;
- persistent storage supports regular backups and restore testing;
- object storage supports private buckets, server-side encryption or encrypted
  volumes, and short-lived signed URLs;
- production logs can be retained securely in Kazakhstan with access controls;
- monitoring and alerting can be configured without exporting personal data to
  an unapproved foreign service;
- TLS certificates, domain routing, and reverse proxy configuration are
  supported;
- the provider offers enough support and operational visibility for SEV-1
  incidents;
- legal/commercial terms do not conflict with the privacy and security baseline.

## Baseline Production Topology

The first production topology should stay simple:

- reverse proxy with TLS in front of the apps;
- `apps/web` for customer/provider web traffic;
- `apps/admin` for administrative traffic with production authentication;
- `apps/api` as the only backend source of truth;
- PostgreSQL/PostGIS for durable state;
- Redis for ephemeral coordination only;
- private object storage for sensitive files and generated artifacts;
- backup storage in Kazakhstan;
- logs and error monitoring in Kazakhstan-hosted systems;
- separate production, staging, and local credentials.

Database, Redis, and object storage admin ports must not be public internet
interfaces. Public buckets are forbidden for sensitive files.

## Production Environment Checklist

Before production boot, verify:

- `NODE_ENV=production`;
- `SESSION_COOKIE_SECURE=true`;
- `IDENTITY_OTP_ADAPTER` is not `development`;
- `IDENTITY_DEV_AUTH_HEADER_ENABLED=false`;
- `ERROR_MONITORING_SINK` is either disabled or points to an approved
  Kazakhstan-hosted sink;
- `DATABASE_URL` points to the production PostgreSQL/PostGIS instance;
- `REDIS_URL` points to private production Redis;
- `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and
  `S3_BUCKET_PRIVATE` point to private production object storage;
- CORS origins, cookie domains, API base URLs, and admin URLs match production
  domains;
- no development OTP, test phone numbers, synthetic admin headers, or local
  MinIO credentials are present.

Secrets must come from a secret manager or locked-down production environment
variables, not from committed files.

## Deployment Gates

Do not launch with real users until all gates are complete:

- GitHub Actions CI is green on the exact commit being deployed;
- migrations apply cleanly against an empty production-equivalent database;
- rollback plan is written and approved before the release;
- backup and restore drill proves PostgreSQL/PostGIS, migration metadata,
  wallet ledger reconciliation, and private object availability;
- incident response runbook is reviewed and contact paths are known;
- production authentication and admin access controls are implemented;
- SMS, payments, object storage, maps/routing, document verification, logging,
  and monitoring providers are approved through replaceable interfaces;
- browser security headers and CSP are reviewed for production domains and
  providers;
- retention rules exist for logs, monitoring events, chat attachments,
  documents, backups, and live-location history;
- support/admin access is least-privilege and auditable.

## Rollback and Restore Rules

Rollback can replace application images or configuration with the previous
known-good version. Rollback must not:

- never rewrite applied migrations;
- edit wallet ledger history;
- silently mutate order state;
- delete audit events;
- expose private files through public object storage;
- restore a database over production without an approved incident plan.

When database restore is required, create an incident record, preserve evidence,
restore into a separate environment first, validate the restore, and only then
execute the approved production recovery plan.

## Local Validation Commands

These commands validate the local development baseline:

```bash
pnpm infra:up
pnpm db:migrate
pnpm db:backup:validate
pnpm test:integration
pnpm test:e2e
pnpm build
pnpm ops:validate
```

Passing local checks does not mean production hosting is ready. It only proves
the current code and local infrastructure can pass the expected baseline.

## Remaining Gaps

Before production, TezHelp still needs:

- selected Kazakhstan hosting provider and documented data-residency evidence;
- production deployment automation;
- production authentication and RBAC;
- approved SMS, payment, monitoring, and storage provider configuration;
- production secrets management;
- TLS/domain setup;
- backup schedule and restore drill evidence;
- retention schedule for personal data and logs;
- operational alerting and on-call process.

## What the Owner Needs To Do Now

Nothing needs to be bought yet. Continue local development until the MVP
requires an externally reachable staging or production environment. When that
time comes, use this checklist before choosing a hosting provider.
