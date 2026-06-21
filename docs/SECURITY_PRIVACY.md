# TezHelp security and privacy baseline

## Hosting constraint

Production personal data must be stored and processed on infrastructure physically located in Kazakhstan, including:

- PostgreSQL data
- private object storage
- application logs containing personal data
- backups
- document processing artifacts
- chat attachments
- exact live-location records

Foreign services require separate legal review, data minimization, and appropriate consent. They must not become an accidental primary personal-data store.

## Sensitive data

TezHelp may process:

- phone numbers
- email addresses
- names and IIN
- identity documents
- driver licenses
- vehicle registration certificates
- face photographs
- exact customer and provider locations
- order history
- chat and voice messages
- wallet and financial ledger data

Treat all as private unless explicitly public by product design.

## Authentication

MVP supports:

- Google sign-in
- phone OTP
- test OTP only in development/test environments

After Google sign-in, verified phone remains mandatory.

Production must reject test OTP configuration.

Current development defaults:

- `IDENTITY_OTP_ADAPTER=development` is for local and test environments only.
- `IDENTITY_DEVELOPMENT_OTP` is never logged and must not be used in production.
- `IDENTITY_DEV_AUTH_HEADER_ENABLED` enables the local `x-tezhelp-user-id`
  development header and is rejected in production.
- `SESSION_COOKIE_SECURE=true` is required in production.

OTP controls:

- expiration
- attempt limit
- resend cooldown
- per-phone and per-IP rate limits
- abuse monitoring
- hashed OTP storage where persistence is required
- no OTP logging

## Authorization

Use deny-by-default server-side authorization.

Examples:

- customer sees exact provider location only for their active assigned order
- provider sees customer phone only after departure
- provider sees only documents required for the assigned unlocking workflow
- moderator sees documents needed for moderation
- general support staff should not automatically see full identity documents
- wallet adjustments require privileged role and audit reason

## File security

- private buckets only
- short-lived signed URLs
- malware/file validation pipeline
- MIME inspection
- size limits
- image re-encoding for display derivatives
- explicit retention policy
- access log for identity documents
- never expose raw object keys as authorization

Provider moderation documents are stored as private object metadata in the
database. Provider self-access and admin review access must go through signed
URL use cases and write `provider_document_access_audit`. Raw object keys are
not an authorization mechanism. The current development signer is replaceable by
a production S3-compatible presigner before real document uploads are enabled.

## Location security

- start after departure
- stop on completion/cancellation
- store last known location separately from optional history
- minimize history frequency and retention
- mark stale data
- never infer fictional movement
- do not expose location to unrelated providers

Current order discovery stores exact customer order coordinates as PostGIS
geography. Published order discovery exposes those coordinates only to providers
with an approved, non-suspended service profile for the order category. The
nearby filter uses the provider's saved discovery reference point; it is not yet
live provider tracking.

Phone contact visibility is server-side gated. The contact endpoint returns
verified phones only to the assigned customer or assigned provider after provider
departure and before terminal order statuses. Unrelated users receive a
forbidden error.

## Financial security

- append-only ledger
- idempotency keys
- atomic transactions
- privileged adjustment workflow
- dual review may be introduced for large adjustments
- reconciliation jobs
- alert on negative or inconsistent balances

Manual wallet adjustments require an admin actor, reason, and idempotency key.
Offer publication consumes free response credit or charges the response fee in
the same transaction as the offer. Provider selection reserves commission in the
same transaction as order assignment. Completion/capture and cancellation
release or hold workflows use append-only ledger entries and row-locked
commission reservations.

## Audit

Audit at least:

- sign-in security changes
- phone changes
- provider approval/rejection
- document access
- wallet adjustments
- tariff changes
- sanctions
- admin order changes
- complaint decisions
- permission changes

Phase 2 additionally writes moderation decision history for provider service
profiles and audits signed document-review URL creation.

Audit records are immutable to ordinary administrators.

## Secrets

- use environment variables or a secret manager
- never commit secrets
- rotate compromised keys
- separate development, staging, and production credentials
- scope credentials minimally

## Web security

- CSRF protection where cookie authentication is used
- secure, HTTP-only, same-site cookies
- content security policy
- XSS-safe rendering
- upload validation
- SQL injection protection
- rate limiting
- security headers
- dependency scanning

## Privacy by design

- collect only necessary data
- explain the purpose
- define retention
- provide controlled deletion and account closure flows
- separate verification result from raw document retention where possible
- avoid copying personal data into analytics systems
