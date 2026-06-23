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

Current marketplace transaction slice:

- `orders` owns order publication, status history, image metadata, and provider
  selection orchestration.
- `offers` owns provider discovery and offer publication.
- `wallet` owns provider balances and append-only ledger entries.
- `commissions` owns integer KZT commission calculation and reservation state.
- Provider selection locks the order, selected offer, provider wallet, and
  reservation state in one transaction, freezes accepted price, reserves
  commission, and marks other active offers unavailable.
- Provider discovery uses PostGIS straight-line distance against the saved
  provider discovery reference point only when the nearby filter is enabled.

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

Implemented marketplace endpoints include:

```text
POST /v1/orders
GET /v1/orders/:orderId
POST /v1/orders/:orderId/select-provider
GET /v1/orders/:orderId/offers
GET /v1/provider/orders
GET /v1/provider/order-discovery-preferences
PATCH /v1/provider/order-discovery-preferences
POST /v1/provider/orders/:orderId/offers
GET /v1/provider/wallet
GET /v1/provider/wallet/ledger
POST /v1/admin/wallet/manual-credit
POST /v1/admin/wallet/manual-debit-correction
GET /v1/admin/service-categories/:slug/commercial-config
PATCH /v1/admin/service-categories/:slug/commercial-config
```

Implemented active-order lifecycle endpoints include:

```text
GET /v1/orders/:orderId/contact
POST /v1/orders/:orderId/cancel
POST /v1/provider/orders/:orderId/depart
POST /v1/provider/orders/:orderId/arrive
POST /v1/provider/orders/:orderId/start-work
POST /v1/provider/orders/:orderId/complete
POST /v1/provider/orders/:orderId/cancel
POST /v1/admin/orders/:orderId/cancel
```

Implemented chat and attachment endpoints include:

```text
GET /v1/orders/:orderId/chat
POST /v1/orders/:orderId/chat/messages
POST /v1/orders/:orderId/chat/messages/:messageId/report
GET /v1/orders/:orderId/chat/attachments/:attachmentId/access-url
GET /v1/admin/orders/:orderId/chat
GET /v1/admin/orders/:orderId/chat/attachments/:attachmentId/access-url
```

Implemented live-location endpoints include:

```text
POST /v1/provider/orders/:orderId/location
GET /v1/orders/:orderId/location
GET /v1/admin/orders/:orderId/location
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

## Provider moderation foundation

Phase 2 keeps provider onboarding split across cohesive modules:

- `service-catalog` owns service categories, localized category labels,
  configurable tax-status allowances, and category-specific document rules.
- `provider-services` owns the provider general profile, provider-owned service
  profiles, private document metadata, submission, and future offer eligibility.
- `moderation` owns admin review queues, moderation decisions, category
  suspension, decision history, and audited document-review access.

One provider may create multiple provider service profiles. Each profile has its
own moderation status, document version, submitted time, SLA deadline,
moderator, decision reason, and rating/statistics placeholders. Approval in one
category never approves another category.

The current auth path for these endpoints is development-only:
`x-tezhelp-user-id` for provider endpoints and `x-tezhelp-admin-user-id` for
admin moderation endpoints. Production startup rejects the development-auth
configuration. A later identity/RBAC task must replace these headers before
production use.

## Chat and attachments foundation

The `chat` backend module owns order conversation records, chat messages,
private photo/voice attachment metadata, message reports, and attachment access
audit.

Current rules:

- one conversation is created per order when chat is first used;
- only the order customer, assigned provider, or authorized admin can read a
  conversation;
- only the assigned customer/provider can send user messages, and only while
  the selected order is active;
- private object keys never authorize access;
- signed attachment reads are short-lived and always recorded in
  `chat_attachment_access_audit`;
- message reports are idempotent per reporter/message and retained for dispute
  review;
- system event messages are recorded through an internal use case so order
  lifecycle hooks can be attached without putting chat policy into `orders`.

Realtime WebSocket delivery, upload orchestration, malware scanning, complaint
resolution, and production RBAC are outside this foundation slice.

## Error monitoring foundation

The `foundation/monitoring` backend module owns sanitized runtime error reports
and exposes `POST /v1/monitoring/frontend-errors` for web/admin route-level
error boundaries. Monitoring sinks are behind a port; the current local sink
writes sanitized structured events to stdout or drops them when disabled.

Monitoring payloads are deliberately narrow and use correlation IDs as the join
key with request logs and API error envelopes. They must not contain form
payloads, phone numbers, OTPs, identity-document data, raw object keys, signed
URLs, exact coordinates, chat contents, or uploaded file contents. External
monitoring providers require a later Kazakhstan hosting and legal review.

## Live location foundation

The `live-location` backend module owns active-order tracking visibility,
provider GPS update persistence, stale/offline state, and marker snapshots for
assigned parties/admins.

Current rules:

- tracking starts only after provider departure;
- only the assigned provider can publish GPS updates;
- assigned customer/provider and authorized administrators can read active
  tracking only before terminal order states;
- the customer marker is the order point and the provider marker is the latest
  provider GPS point;
- stale state is explicit after 90 seconds without a fresh point;
- stale/offline snapshots require clients to fetch a fresh browser GPS point
  and rebuild the route, not animate along an assumed path.

This slice is REST-backed. The `@tezhelp/maps` package exposes route and
realtime gateway interfaces so a later WebSocket/route-provider task can attach
without moving location policy into frontend code.

## Reputation and sanctions foundation

The `reputation` backend module owns completed-order reviews, customer
reliability summaries, provider activity policy, manual and automatic provider
sanctions, provider sanction appeals, sanction event history, and public
provider service reliability summaries.

Current rules:

- reviews are accepted only for completed orders;
- each order has at most one `customer_to_provider` review and one
  `provider_to_customer` review;
- customer-to-provider reviews update the assigned provider service profile
  rating, keeping rating category-specific;
- customer reliability shown to a provider is derived from real order history
  and visible only to providers involved with that order;
- admin-applied sanctions are scoped either provider-wide or to one provider
  service profile;
- provider-caused cancellations update the provider activity score and
  consecutive-cancellation counter inside the same order cancellation
  transaction;
- seven consecutive provider-caused cancellations create an automatic
  provider-wide sanction: 24 hours for the first episode, seven days for the
  second, and indefinite from the third episode;
- active sanctions block new offer publication until lifted or expired;
- sanction applications, appeals, and lifts are stored as event history.
- public provider reliability exposes aggregate rating, completed orders,
  provider-caused cancellations, active sanction presence, and current offer
  eligibility without exposing sanction reasons or private documents.

Ranking changes, complaint resolution, activity history UI, and production RBAC
are outside this foundation slice.

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

The current `DevelopmentOpenStreetMapStyleProvider` is used only by the local
map-first web demo. It supplies a resilient background plus public OSM raster
tiles for low-volume development. A production tile adapter must replace it
after Kazakhstan hosting, privacy, capacity, and CSP review.

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
