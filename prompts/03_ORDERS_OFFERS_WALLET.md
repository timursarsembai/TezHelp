# Codex task 03 — Orders, offers, provider eligibility, wallet, and commission reservation

## Mode

Plan first. This is financially and transactionally sensitive. Produce a detailed execution plan and wait for approval before coding.

## Goal

Implement the first coherent marketplace transaction slice:

1. customer publishes an order
2. eligible provider sees it
3. provider submits an offer
4. response fee or free credit is consumed
5. customer selects provider
6. commission is reserved
7. one-active-order rule is enforced

Do not implement chat or live tracking in this task.

## Order creation

Support all seeded service categories.

Create category-aware fields. At minimum:

- category
- Almaty location
- address/landmark
- vehicle make, model, year where relevant
- description
- up to five images
- customer
- timestamps
- status history

Vehicle unlocking requires additional lawful-access metadata but full document verification workflow may be stubbed behind a clear pending requirement if not yet implemented.

## Provider order discovery

Default: all eligible Almaty orders.

Optional nearby filter:

- off by default
- 5 km initial radius when enabled
- 3 km minimum
- 1 km increment
- straight-line PostGIS distance
- saved provider preference

Only approved category profiles can see/respond as eligible providers.

## Offer policy

Initial response fee: 100 KZT.

First five responses per provider account are free.

Unlimited offers per order.

Offer includes:

- price
- arrival estimate in minutes
- comment

Accepted price is immutable.

Provider must see current offer count before submission.

## Wallet and ledger

Implement append-only wallet ledger.

Transaction types should support at least:

- manual credit
- manual debit correction
- response fee charge
- response fee reversal for technical failure
- commission reserve
- commission release
- commission capture

Every command:

- uses idempotency key
- records actor and reason
- links relevant order/offer
- is atomic
- is auditable

No floating point.

## Eligibility

At offer submission, provider must:

- have approved service profile
- not be blocked
- have no active order
- satisfy operational minimum
- have enough potential commission coverage
- have enough response fee unless free credit remains

Initial operational minimum: 3,000 KZT.

Required balance:

```text
max(operational minimum, calculated potential commission) + response fee
```

At customer selection:

- recheck eligibility
- recheck current balance
- ensure provider still has no active order
- reserve commission atomically
- assign provider atomically
- make provider's other offers unavailable

Commission: initial 10%, but architecture must support percentage, fixed, combined, and zero strategies.

## Concurrency requirements

Test:

- duplicate offer submission
- duplicate response charge
- two customers selecting same provider
- two providers selected for one order
- provider balance changing before selection
- retry of selection command
- free-credit race
- rollback after failed assignment

Use database constraints and transactions, not only application checks.

## Admin

Implement:

- manual wallet credit with reason
- ledger view
- category response fee configuration
- category commission configuration
- operational minimum configuration

## Non-goals

- order departure/arrival/completion
- cancellation matrix
- chat
- live location
- ratings
- real payment gateway

## Acceptance criteria

- end-to-end flow reaches `provider_selected`
- financial mutations are reconcilable
- accepted order price is immutable
- provider has only one active assignment
- insufficient balance has stable error code
- all concurrency tests pass against real PostgreSQL/PostGIS
- no god wallet or order service is introduced
- API remains suitable for future mobile client
