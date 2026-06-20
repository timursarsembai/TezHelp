# TezHelp architecture

## Architectural style

Use a modular monolith for MVP.

A modular monolith provides:

- one deployable backend
- strong transactional integrity
- clear domain boundaries
- lower operational complexity than microservices
- a migration path to services if scale later justifies it

Do not create microservices during MVP unless a measured operational requirement proves they are necessary.

## Applications

### `apps/web`

Next.js responsive application for customers and providers.

Responsibilities:

- presentation
- routing
- localized forms
- browser permissions
- API consumption
- realtime client
- map rendering
- mobile-first experience

It must not own business rules.

### `apps/admin`

Separate Next.js administration application.

Responsibilities:

- moderation
- tariff management
- ledger inspection and adjustments
- complaint handling
- sanctions
- active-order oversight
- audit visibility

### `apps/api`

NestJS backend.

Responsibilities:

- authentication orchestration
- authorization
- domain use cases
- transactions
- persistence
- WebSocket events
- background work
- provider integrations

### `apps/mobile`

Reserved for future React Native / Expo application.

It must reuse API contracts, localization concepts, validation schemas where safe, and domain types without embedding backend policy.

## Backend modules

Recommended modules:

```text
identity
customers
providers
provider-services
moderation
service-catalog
orders
offers
wallet
commissions
chat
attachments
live-location
reviews
reputation
sanctions
complaints
notifications
administration
audit
```

## Layering inside a module

Prefer:

```text
module/
  domain/
    entities/
    value-objects/
    policies/
    events/
  application/
    commands/
    queries/
    use-cases/
    ports/
  infrastructure/
    persistence/
    external/
  presentation/
    http/
    websocket/
```

Use this structure pragmatically. Small modules need not contain empty folders.

### Domain

Contains business concepts and invariants. It should not depend on NestJS, HTTP, database clients, or external providers.

### Application

Coordinates use cases. Depends on domain and ports.

### Infrastructure

Implements persistence and external adapters.

### Presentation

Maps HTTP/WebSocket input to application use cases. Controllers remain thin.

## Preventing god objects

A god object is any unit that knows or controls too many unrelated parts of the system.

Warning signs:

- more unrelated dependencies added after every feature
- a service named `MarketplaceService`, `CommonService`, `AppService`, or `Utils`
- methods for orders, wallets, moderation, chat, and location in one class
- a frontend store containing authentication, orders, maps, chat, and wallet
- a React component fetching data, calculating policy, rendering, and mutating the backend
- a repository deciding whether a cancellation is allowed
- one transaction script spanning many domains without explicit orchestration

Correct response:

1. Identify the actual business capability.
2. Move policy into the owning domain.
3. Expose a narrow port or application use case.
4. Orchestrate cross-domain workflows explicitly.
5. Keep transaction boundaries visible.

Example:

Bad:

```text
MarketplaceService.completeOrderAndUpdateEverything()
```

Better:

```text
CompleteOrderUseCase
  -> OrderCompletionPolicy
  -> CommissionReservationPort.capture()
  -> ProviderAvailabilityPort.release()
  -> OrderRepository.save()
  -> DomainEventPublisher.publish()
```

The use case coordinates the workflow; each dependency remains narrow.

## Cross-module communication

Prefer explicit application ports and domain events.

Use synchronous calls when:

- the caller requires the result to preserve an invariant
- the work must be in the same transaction

Use events when:

- side effects can occur after the transaction
- failure can be retried
- the core outcome does not depend on immediate completion

Examples:

Synchronous:

- choose provider and reserve commission
- complete order and capture commission
- enforce one active order

Event-driven:

- send realtime notification
- create analytics event
- generate thumbnail
- schedule stale-location warning

Use an outbox pattern before relying on asynchronous events for critical behavior.

## Transactions and concurrency

Use database constraints in addition to application checks.

Examples:

- partial unique index preventing more than one active assignment per provider
- optimistic version column or row locks for order selection
- idempotency key on wallet commands
- unique response per provider per order, if product policy requires it
- unique active commission reservation per order

Critical workflows must tolerate retries.

## API design

Use REST for commands and queries in MVP, plus WebSocket for realtime events.

Possible route grouping:

```text
/v1/auth
/v1/me
/v1/service-categories
/v1/orders
/v1/orders/:id/offers
/v1/orders/:id/status
/v1/orders/:id/chat
/v1/orders/:id/location
/v1/provider-service-profiles
/v1/provider/wallet
/v1/admin
```

Use stable error codes such as:

```json
{
  "code": "PROVIDER_BALANCE_INSUFFICIENT",
  "message": "Localized by the client",
  "details": {}
}
```

Do not return localized backend error strings as the only machine-readable contract.

## Realtime

Use WebSocket rooms scoped to authorized resources:

- user room
- active order room
- admin monitoring room with explicit permission

Events should be versioned and typed.

Example:

```text
order.offer.created.v1
order.provider_selected.v1
order.status.changed.v1
chat.message.created.v1
provider.location.updated.v1
wallet.balance.changed.v1
```

Clients must recover after missed events by refetching current server state.

## Data storage

- PostgreSQL: transactional data
- PostGIS: spatial points and straight-line filtering
- Redis: rate limiting, queues, ephemeral coordination, later pub/sub
- private S3-compatible storage: identity documents, order photos, voice messages
- append-only audit log: critical administrative and financial actions

## Persistence foundation

Use Kysely with `pg` and `node-pg-migrate`.

Kysely is the query builder, not the owner of domain policy. Repositories and
application use cases must keep transaction boundaries explicit. Raw SQL is
allowed for PostGIS and database features that need exact SQL control.

## Identity foundation

The `identity` backend module owns accounts, authentication links, phone OTP
verification, locale preference, selected role, and account-level security
events. It uses focused use cases such as request OTP, verify OTP, development
Google sign-in, request phone change, update locale, and switch role.

Development OTP and development auth headers are allowed only outside
production. Production startup fails if those unsafe adapters are enabled. A
verified phone is unique across non-blocked accounts by database constraint.
Google identity links do not imply trusted phone ownership; phone completion is
required before the account becomes active.

## Maps

Use replaceable interfaces:

```text
MapStyleProvider
GeocodingProvider
RoutingProvider
LocationTrackingGateway
```

MapLibre renders the map.

OpenStreetMap is the geographic data foundation.

Do not rely on public OSM tile or Nominatim servers for production load.

## External provider abstraction

Define application ports for:

- SMS
- Google OAuth verification
- payment top-up
- object storage
- geocoding
- routing
- notification delivery
- document verification

Provider-specific payloads must not leak into the domain.

## Scalability path

Scale in this order:

1. optimize queries and indexes
2. add caching where measured
3. move background work to queues
4. horizontally scale stateless web/API containers
5. use managed or dedicated PostgreSQL in Kazakhstan
6. use Redis pub/sub for multiple WebSocket instances
7. split a module only when operational evidence justifies it

Avoid speculative microservices.
