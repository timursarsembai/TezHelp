# TezHelp — Codex project instructions

## Purpose

Build TezHelp as a maintainable, production-oriented marketplace for emergency roadside services in Kazakhstan.

Read these files before making architectural or product decisions:

- `docs/PRODUCT_SPEC.md`
- `docs/ARCHITECTURE.md`
- `docs/DOMAIN_MODEL.md`
- `docs/CODING_STANDARDS.md`
- `docs/SECURITY_PRIVACY.md`
- `docs/TESTING_STRATEGY.md`
- `docs/ROADMAP.md`
- `CODE_REVIEW.md`
- `PLANS.md`

When documents conflict, use this priority:

1. The current user task.
2. This `AGENTS.md`.
3. Accepted architecture decisions in `docs/DECISIONS.md`.
4. Other project documentation.

## Mandatory working method

For every non-trivial task:

1. Inspect the repository and relevant documentation.
2. State assumptions and identify missing information.
3. Create or update an execution plan when the task spans multiple modules, introduces infrastructure, changes domain rules, or is expected to exceed roughly one hour.
4. Implement the smallest coherent vertical slice.
5. Add or update tests.
6. Run formatting, linting, type checking, tests, and build commands relevant to the changed area.
7. Update documentation when behavior, architecture, setup, API, database, or operational rules change.
8. Report changed files, commands run, test results, migrations, risks, and remaining work.

Do not silently invent business rules. If a required rule is absent and implementation would be unsafe or difficult to reverse, stop and ask.

## Architecture rules

TezHelp must remain a modular monolith during MVP development.

Required boundaries:

- identity and access
- customer profiles
- provider profiles
- provider service profiles and moderation
- service catalog and tariffs
- orders
- offers
- provider wallet and ledger
- commission reservations
- chat and attachments
- live location
- ratings and reviews
- activity, reliability, sanctions
- complaints and administration
- notifications
- audit logging

Do not create a god object, god service, god controller, god repository, god hook, god store, god component, or generic `utils` dumping ground.

A module must have one cohesive responsibility. A class or function must have one clear reason to change.

Forbidden patterns:

- one service coordinating unrelated domains
- controllers containing business rules
- frontend components directly implementing financial or order-state rules
- direct database access from controllers or UI components
- repositories deciding business policy
- circular module dependencies
- shared mutable global state
- catch-all `CommonService`, `AppService`, `MarketplaceService`, or `Helpers`
- files that grow without a clear cohesion boundary
- transaction-sensitive behavior split across unrelated calls
- duplicating critical rules in web, admin, and future mobile clients

When a module becomes broad, split by use case or domain capability, not by arbitrary file size alone.

## Domain and transaction rules

The backend is the source of truth.

The following operations must be atomic database transactions:

- publish offer and charge a paid response
- choose provider and reserve commission
- complete order and capture reserved commission
- cancel order and release or hold commission according to policy
- administrative wallet adjustment
- enforce one active order per provider
- apply sanctions that change provider eligibility

Money is stored as integer minor units. For KZT, store whole tenge as integers unless a future payment provider requires tiyn-level precision. Never use floating point for balances, prices, fees, or commissions.

The wallet is ledger-based:

- never edit historical transactions
- corrections are new compensating transactions
- every mutation has an idempotency key
- every mutation records actor, reason, related entity, timestamp, and resulting balance
- cached balance must be reconcilable from the ledger

Accepted order price is immutable in TezHelp after provider selection.

A provider may have only one active order.

A response fee is not refundable except for a platform technical failure, duplicate charge, or failed response creation.

## Data and privacy

Production personal data, files, logs containing personal data, and backups must be hosted in Kazakhstan.

Never commit real identity documents, phone numbers, credentials, production coordinates, access tokens, or personal chat content.

Use synthetic fixtures and test data.

Apply least privilege. Live provider location is visible only to:

- the assigned customer during the active order
- the assigned provider
- authorized administrators

Stop live-location access after order completion or cancellation.

Sensitive files require private object storage and short-lived signed URLs.

## API and compatibility

Design APIs for reuse by:

- responsive web application
- admin web application
- future native mobile application

Do not make business logic depend on Next.js server actions or browser-only behavior.

Use explicit request and response schemas. Validate all external input. Keep API changes backward-compatible when practical. Document breaking changes.

Use provider interfaces for replaceable external systems:

- SMS
- OAuth
- payments
- object storage
- geocoding
- map tiles
- routing
- notifications
- document verification

## Frontend rules

The web application is mobile-first and must remain fully usable on smartphones.

Separate:

- presentation components
- feature orchestration
- server state
- forms and validation
- domain models
- API clients

Do not put application-wide state into one store. Prefer local state, URL state, query cache, and narrowly scoped stores.

All user-facing strings must use localization keys. Languages: Russian, Kazakh, English.

Accessibility is required:

- semantic HTML
- keyboard access
- visible focus
- accessible labels
- adequate contrast
- reduced-motion support where appropriate

## Testing requirements

At minimum, add tests for:

- domain invariants
- financial calculations and ledger behavior
- order state transitions
- authorization and access control
- response fee charging
- commission reservation and capture
- cancellation cases
- one-active-order constraint
- provider eligibility
- localization fallback
- critical mobile viewport flows

Use integration tests for transaction-sensitive flows. Do not rely only on mocked unit tests for wallet and order transitions.

## Quality gates

Before considering a task complete, run the applicable commands for:

- formatting
- linting
- type checking
- unit tests
- integration tests
- end-to-end tests
- production build
- database migration validation

Do not claim success if a command was not run. State failures exactly.

## Git discipline

Keep changes focused. Do not mix unrelated refactors with feature work.

Use migrations for schema changes. Never rewrite an already-applied production migration.

Do not commit secrets or generated credentials.

Prefer conventional commit messages when creating commits.

## Documentation discipline

Update documentation in the same change when introducing:

- a module
- a domain rule
- a new environment variable
- a database migration
- an API endpoint
- an external provider
- deployment steps
- a security-sensitive behavior
- a material product behavior change

## Codex hooks

Repository hooks live in `.codex/`.

Before trusting them, inspect `.codex/hooks.json` and every script in `.codex/hooks/`, then use `/hooks` to approve the exact definitions.

The hooks provide:

- a narrow destructive-command guardrail
- heuristic architecture warnings after edits
- a stop-time quality gate tied to the current working-tree fingerprint

Hooks do not replace permissions, sandboxing, lint rules, tests, CI, or code review.

Before completing code changes, run:

```bash
python3 .codex/hooks/run_quality_gate.py
```

On Windows:

```powershell
py -3 .codex/hooks/run_quality_gate.py
```

Use `--full` when integration or end-to-end tests are relevant.
