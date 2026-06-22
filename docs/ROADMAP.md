# TezHelp MVP implementation roadmap

Codex must execute this roadmap as small, reviewable tasks. Do not implement the entire product in one prompt.

## Phase 0 — repository foundation

Deliver:

- pnpm/Turborepo monorepo
- web, admin, API applications
- shared packages
- strict TypeScript
- linting, formatting, tests
- Docker Compose
- PostgreSQL/PostGIS
- Redis
- object-storage development service
- CI
- environment validation
- health checks
- initial documentation

## Phase 1 — identity and account foundation

Deliver:

- user schema
- Google identity adapter boundary
- development test OTP
- phone verification workflow
- role switching
- locale preference
- security audit events

No real SMS provider yet.

## Phase 2 — service catalog and provider moderation

Deliver:

- service categories
- provider profile
- provider service profiles
- documents
- separate moderation per category
- admin moderation queue
- three-working-hour SLA indicators
- configurable tax-status allowance

## Phase 3 — customer orders

Deliver:

- order draft and publication
- category-specific forms
- Almaty location
- up to five images
- order state history
- mobile-first customer flow

## Phase 4 — provider discovery and offers

Deliver:

- all-Almaty default feed
- optional straight-line radius filter
- PostGIS query
- 5 km default, 3 km minimum, 1 km increments
- provider eligibility
- free response credits
- 100 KZT response fee
- unlimited offers
- response count visibility

## Phase 5 — wallet and commission

Deliver:

- append-only ledger
- manual admin credit
- operational minimum
- potential commission eligibility
- atomic response charge
- atomic provider selection and commission reservation
- configurable commission strategies

This phase requires strong integration and concurrency tests.

## Phase 6 — active order lifecycle

Deliver:

- one active order constraint
- departure
- phone reveal
- arrival
- in progress
- provider completion
- commission capture
- cancellation matrix
- held-for-review cancellation after arrival

## Phase 7 — chat and attachments

Deliver:

- order conversation
- text
- photos
- voice
- system events
- private storage
- access control
- dispute evidence warning

## Phase 8 — maps and live tracking

Deliver:

- MapLibre integration
- customer and provider markers
- browser geolocation
- realtime updates
- stale state
- resume behavior
- route-provider interface
- active-order authorization

## Phase 9 — reputation and sanctions

Deliver:

- two-way reviews
- service-specific provider rating
- customer indicators
- activity score foundation
- public reliability
- consecutive-cancellation blocks
- administrative appeal and override audit

## Phase 10 — production hardening

Deliver:

- RU/KK/EN completion
- accessibility
- performance
- error monitoring
- backups and restore test
- Kazakhstan production deployment
- real SMS adapter
- security review
- operational runbooks
