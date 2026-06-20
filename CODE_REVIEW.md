# TezHelp code review checklist

## Correctness

- Does the implementation satisfy the documented product rule?
- Are all state transitions explicit and valid?
- Are failure, retry, timeout, and duplicate-request cases handled?
- Are time zones, locales, KZT amounts, and rounding correct?
- Can two concurrent requests violate an invariant?

## Architecture

- Is the change in the correct domain module?
- Does each class, function, component, and hook have a cohesive responsibility?
- Has any god object, god service, god store, or catch-all utility been introduced?
- Are controllers thin?
- Is business policy outside repositories and UI components?
- Are cross-module dependencies explicit and one-directional?
- Is replaceable infrastructure behind an interface?

## Financial integrity

- Are amounts integers rather than floating point?
- Is the ledger append-only?
- Are operations idempotent?
- Are reservation, release, and capture atomic?
- Can the balance be reconciled?
- Is every administrative adjustment audited?

## Security and privacy

- Is authorization enforced server-side?
- Is personal data minimized?
- Are sensitive files private?
- Are logs free of secrets and unnecessary personal data?
- Does live-location access stop when the order ends?
- Is production data kept in Kazakhstan?
- Are rate limits and abuse cases covered?

## API and database

- Are inputs validated?
- Are error codes stable and documented?
- Are migrations safe and reversible where possible?
- Are indexes and constraints present for important invariants?
- Are N+1 queries and unbounded lists avoided?
- Are pagination and filtering explicit?

## Frontend

- Is the flow usable on a mobile viewport?
- Are strings localized through keys?
- Are loading, empty, error, offline, and stale states handled?
- Are accessibility and keyboard behavior correct?
- Is server state handled through the agreed query layer?
- Is business logic duplicated from the backend?

## Tests

- Do tests cover the invariant rather than only the happy path?
- Are transaction-sensitive flows covered by integration tests?
- Are authorization failures tested?
- Are regression tests included?
- Were relevant checks actually run?

## Maintainability

- Are names domain-specific and unambiguous?
- Is complexity justified?
- Are comments explaining why rather than restating code?
- Is documentation updated?
- Can a future mobile client reuse the API without duplicating rules?
