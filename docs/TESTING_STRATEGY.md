# TezHelp testing strategy

## Test pyramid

### Unit tests

Use for:

- value objects
- commission calculation
- order transition rules
- activity penalty calculation
- reliability calculation
- validation utilities
- localization fallback

### Integration tests

Required for:

- PostgreSQL constraints
- wallet ledger
- paid response publication
- free response consumption
- provider selection and commission reservation
- order completion and commission capture
- cancellation and reservation release/hold
- contact visibility before and after departure
- held-for-review customer cancellation after provider arrival
- order chat participant authorization
- private chat attachment signed URL audit
- message report idempotency
- live location publication after departure
- live location stale/offline visibility
- completed-order review uniqueness
- provider service rating recalculation
- customer reliability visibility and derived counters
- active provider sanctions blocking offer publication
- sanction appeal and lift history
- one-active-order enforcement
- concurrent provider selection attempts
- authorization at repository/use-case boundaries
- PostGIS radius queries

Use a real PostgreSQL/PostGIS test database, preferably via Docker.

API integration tests that share the local Docker database run with file
parallelism disabled. Tests may truncate shared tables, so parallel files can
create false failures by deleting each other's fixtures.

### End-to-end tests

Critical flows:

1. customer creates order
2. provider with approved service sees order
3. provider submits response
4. customer selects provider
5. provider confirms departure
6. phone becomes visible
7. location update reaches customer
8. stale location is labeled without inferred movement
9. provider arrives and completes
10. commission is captured
11. both sides submit reviews

Additional flows:

- insufficient balance
- free response credits
- customer cancellation at each stage
- provider cancellation before and after departure
- vehicle unlocking verification
- admin moderation
- manual wallet credit
- order chat dispute evidence labels
- active-order tracking labels
- responsive mobile viewport

## Concurrency tests

Explicitly test:

- two customers selecting the same provider
- two providers being selected for one order
- duplicate completion request
- duplicate response charge
- duplicate payment webhook
- cancellation racing completion
- balance changed between response and selection

## Security tests

- unauthorized document access
- location access after order completion
- live location publication before departure
- provider phone access before departure
- cross-order chat access
- private attachment access by unrelated users
- admin permission boundaries
- upload type spoofing
- OTP rate limits
- IDOR attempts

## Contract tests

External adapter contracts:

- SMS
- Google OAuth
- payment top-up
- object storage
- geocoding
- routing

Use fakes in most tests and a small sandbox integration suite where providers support it.

## Quality commands

The bootstrap implementation must define canonical commands similar to:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
pnpm build
```

CI must run the relevant set for each pull request.
