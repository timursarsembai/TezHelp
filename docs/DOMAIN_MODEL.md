# TezHelp domain model

## Aggregates and ownership

### User

Owns:

- identity status
- authentication links
- preferred locale
- account-level block status

Does not own provider-category moderation or wallet policy.

### CustomerProfile

Owns:

- customer statistics
- customer reliability indicators
- customer review summary

### ProviderProfile

Owns:

- provider-wide identity verification
- activity score
- account-level availability
- consecutive cancellation counters
- provider-wide sanctions

### ProviderServiceProfile

Owns category-specific:

- moderation status
- documents
- rating
- reviews
- completed order statistics
- category suspension
- category description and qualifications

Current Phase 2 statuses:

- `draft`
- `submitted`
- `under_review`
- `approved`
- `rejected`
- `suspended`

Approval is category-specific. A provider service profile is eligible for future
offer publication only when its status is `approved` and it is not suspended.
Submission records a document version and a target SLA deadline.

### ServiceCategory

Owns configurable policy:

- enabled status
- response fee
- commission type and value
- allowed tax statuses
- required document rules
- operational minimum override, if introduced

Initial seeded categories are jump start, engine start assistance, wheel
replacement, wheel inflation, mobile tire service, fuel delivery, tow truck,
and vehicle unlocking. Each category has RU/KK/EN labels and descriptions.
Tax-status allowance and required documents are stored as category configuration,
not hardcoded legal policy.

### Order

Owns:

- customer
- category
- location
- vehicle details
- status
- selected offer
- immutable accepted price
- assigned provider
- lifecycle timestamps

Current lifecycle timestamps include provider departure, arrival, work started,
completion, and cancellation. Terminal commands use an idempotency key so
retries do not double-capture or double-release commission.

### Offer

Owns:

- order
- provider service profile
- proposed price
- proposed arrival minutes
- comment
- availability
- response fee transaction reference

Current rule: one provider can create only one offer per order. Duplicate
idempotency keys return the original offer only when the command payload is the
same.

### Wallet

Owns:

- provider wallet identity
- cached available balance
- cached reserved balance

Ledger entries are immutable.

Current wallet account state stores available balance, reserved balance, and
free response credits. The first five provider responses are free account-wide;
after that, offer publication charges the category response fee inside the same
transaction as offer creation.

Commission capture removes money from reserved balance after provider
completion. Commission release returns reserved money to available balance after
eligible cancellation. Held-for-review reservations keep money reserved for
future administrative resolution.

### CommissionReservation

Owns:

- order
- provider
- calculated amount
- state: reserved, captured, released, held_for_review
- idempotency keys and timestamps

### Conversation

Owned by an order.

Owns:

- text messages
- system event messages
- private photo/voice attachment metadata
- message reports for dispute review
- attachment access audit

Participants are the order customer, assigned provider, and authorized
administrators. Attachment object keys are metadata only; signed URL creation is
the controlled access path.

### LiveLocationSession

Owned by an active assigned order.

Owns:

- tracking state
- last known point
- customer order point for marker snapshots
- provider GPS update history
- accuracy
- recorded time
- stale state

### Review

Owned by a completed order. One review per direction per order.

Customer-to-provider reviews reference the assigned provider service profile and
update category-specific provider rating. Provider-to-customer reviews feed the
customer reliability summary and do not reference a provider service profile.

### ProviderSanction

Owned by a provider profile and optionally scoped to one provider service
profile.

Owns:

- sanction type
- reason
- active time window
- lift reason and actor
- appeal status and reason
- immutable event history

## Key invariants

### Order

- accepted price cannot change
- only a published/receiving order can select a provider
- only the selected provider can transition provider states
- completion captures commission exactly once
- cancelled or completed orders cannot return to active status without an explicit administrative recovery workflow
- customer cancellation after provider arrival holds commission for review
- provider completion is the only normal completion path in MVP

### Provider

- one active order maximum
- provider can respond only through an approved service profile
- provider cannot respond while blocked or assigned to an active order
- provider cannot respond while an active provider-wide or matching
  service-profile sanction exists
- provider must satisfy balance eligibility

### Wallet

- no mutation without a ledger entry
- no duplicate command effect for the same idempotency key
- available balance cannot be negative
- reserved commission cannot exceed funds
- captured and released reservations cannot be reused

### Location

- tracking cannot begin before departure
- location is not visible to unrelated users
- tracking ends after completion or cancellation
- stale data is labeled and never presented as current
- stale provider markers require route rebuild from a fresh GPS point
- provider movement is never inferred between updates

### Conversation

- user messages can be sent only while a selected order is active
- readable conversation history remains available after terminal order states
  for dispute evidence
- every private attachment read is audited
- photos must be JPEG, PNG, or WebP and no larger than 20 MB
- voice messages must be WebM, Ogg, or MPEG audio, no larger than 10 MB, and no
  longer than 180 seconds
- reports are idempotent per reporter/message

### Reputation

- reviews are allowed only after order completion
- only assigned order counterparties can review each other
- provider rating is service-profile/category specific
- one review per order per direction
- active sanctions block new offer publication until lifted or expired
- sanction event history is append-only

## Important domain services or policies

Recommended narrow policies:

- `ProviderOfferEligibilityPolicy`
- `CommissionCalculator`
- `ProviderSelectionPolicy`
- `OrderTransitionPolicy`
- `CancellationPolicy`
- `ChatPolicy`
- `ReputationPolicy`
- `LiveLocationPolicy`
- `ProviderActivityPolicy`
- `ProviderReliabilityCalculator`
- `UnlockingVerificationPolicy`
- `LocationVisibilityPolicy`

Avoid a single all-purpose policy service.

## Financial calculation

Represent commission configuration as a value object.

Examples:

```text
Percentage(10%)
Fixed(500 KZT)
Combined(5% + 300 KZT)
Zero
```

All calculations return integer KZT and use an explicit rounding policy.

Initial percentage commission:

```text
commission = acceptedPrice * 10 / 100
```

Current implementation floors percentage commission in integer KZT:

```text
commission = floor(acceptedPriceKzt * percentageBps / 10000)
```

Fixed and combined commission strategies are available through category
commercial configuration. All values are integer tenge.

## Active order definition

The database and application must share one definition of active statuses:

- `provider_selected`
- `provider_en_route`
- `provider_arrived`
- `in_progress`

`disputed` does not block new work unless a sanction separately does.

## Customer cancellation indicators

Track at least:

- total published orders
- total orders with provider selected
- total completed orders
- cancellations before selection
- cancellations after selection
- cancellations after departure
- cancellations after arrival

Expose only product-approved summaries to providers.
