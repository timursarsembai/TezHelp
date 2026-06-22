# Error Monitoring Baseline

This baseline captures application failures with correlation IDs while keeping
personal data out of monitoring payloads.

## Current Scope

- API endpoint: `POST /v1/monitoring/frontend-errors`
- Frontend reporters in `apps/web` and `apps/admin`
- Local structured monitoring sink using sanitized stdout logs
- Shared frontend error report contract and validation schema
- Route-level error boundaries for web and admin

## Privacy Rules

Monitoring events must not include:

- phone numbers, OTPs, tokens, passwords, emails, or IIN
- identity-document data, raw object keys, or private signed URLs
- exact customer/provider coordinates
- form bodies, chat contents, voice contents, or uploaded file contents
- full backend stack traces in client-visible responses

The accepted frontend report shape is intentionally narrow: source, route path,
error name, short message, optional digest, optional component stack, user agent,
and timestamp. Routes with query strings or hashes are rejected by validation.
The API scrubber redacts sensitive keys and risky scalar values before writing
to the configured sink.

## Correlation

Use `x-correlation-id` and the response envelope correlation ID to connect:

- user-visible failures
- frontend monitoring reports
- API request logs
- API error envelopes

Incident notes should reference correlation IDs and stable route names instead
of personal data.

## Configuration

`ERROR_MONITORING_SINK` controls the first sink:

- `local`: write sanitized structured events to stdout
- `disabled`: accept reports but drop them

No external monitoring credentials are supported in this slice.

## Production Gaps

Before launch:

- choose a Kazakhstan-hosted monitoring/logging destination or complete legal
  review for any foreign provider
- add alert routing for SEV-1 and wallet/location/document exposure risks
- add retention rules for monitoring logs
- connect API unhandled exception reporting to the same port
- add frontend source-map handling that does not expose source or personal data
- review CSP when a real monitoring provider is introduced
