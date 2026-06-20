# TezHelp coding standards

## General

- TypeScript strict mode is mandatory.
- Avoid `any`. When unavoidable at an external boundary, narrow immediately.
- Prefer explicit domain names over generic names.
- Keep functions small enough to understand, but prioritize cohesion over arbitrary line limits.
- Do not add abstractions without a real variation point.
- Do not duplicate business rules.
- Prefer composition over inheritance.
- Use dependency inversion for external systems.

## Naming

Good:

- `ReserveCommissionUseCase`
- `ProviderOfferEligibilityPolicy`
- `WalletLedgerRepository`
- `GetNearbyOrdersQuery`

Bad:

- `Manager`
- `Helper`
- `CommonService`
- `DataService`
- `ProcessEverything`
- `handleData`

Names should reveal domain intent.

## Files and modules

Do not create catch-all files:

- `utils.ts`
- `helpers.ts`
- `constants.ts`
- `types.ts`

unless their scope is narrow and the filename reflects it, for example:

- `phone-number.ts`
- `commission-rounding.ts`
- `order-status.ts`

Do not use barrel exports where they create circular dependencies or hide ownership.

## NestJS

Controllers:

- parse transport input
- call one application use case
- map output to response
- contain no business rules

Use cases:

- express one command or query
- coordinate narrow ports
- define transaction requirements

Repositories:

- persist and retrieve aggregates
- do not decide policy

Guards:

- enforce authentication and coarse authorization
- resource-level authorization must still be checked in application logic

DTOs:

- are transport contracts
- are not domain entities

## React and Next.js

Components:

- presentation components receive data and callbacks
- feature components orchestrate UI state and API hooks
- server state uses the agreed query library
- forms use schema validation
- domain calculations are not performed in UI components

Avoid:

- one global store
- fetching in deeply nested presentational components
- business rules in `useEffect`
- components with unrelated modal, form, map, wallet, and chat responsibilities

Use route-level error, loading, and empty states.

## Errors

Use typed domain/application errors with stable codes.

Never leak:

- database errors
- stack traces
- provider secrets
- internal object storage paths
- document identifiers not authorized for the caller

Log internal detail with correlation IDs.

## Time and dates

Store timestamps in UTC.

Render using the user's locale and Almaty timezone where product behavior requires it.

Use a testable clock abstraction for time-sensitive policies.

## Money

Use integers.

Create a money value object or equivalent helper with strict currency handling.

Never format money in domain code.

Never parse localized formatted amounts in backend business logic.

## Database

Use:

- foreign keys
- unique constraints
- check constraints
- indexes for actual query patterns
- explicit transactions
- idempotency constraints

Avoid soft deletion by default. Use it only where product, legal, or audit requirements require retention.

## Logging

Use structured logs.

Include:

- request/correlation ID
- actor ID when safe
- order ID
- use case
- result code

Do not log:

- OTP codes
- access tokens
- full identity documents
- full voice message URLs
- exact coordinates unless explicitly required in a protected audit context

## Comments

Comments explain:

- why a non-obvious decision exists
- a legal or domain constraint
- a concurrency edge case
- a compatibility reason

Comments should not paraphrase obvious code.

## Dependencies

Before adding a dependency:

- confirm it is maintained
- confirm license compatibility
- confirm it is necessary
- prefer standard platform capabilities for simple needs
- document infrastructure-critical dependencies

Pin versions through the lockfile.

## Refactoring rule

Refactor when:

- adding a feature would create a second reason to change a unit
- a module starts depending on unrelated modules
- tests require excessive setup because responsibilities are mixed
- the same policy appears in more than one layer

Do not perform broad unrelated refactors inside a feature task.
