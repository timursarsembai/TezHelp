# TezHelp MVP product specification

## Product summary

TezHelp is a two-sided marketplace for urgent roadside services.

A customer publishes a request. Verified providers submit a price, arrival estimate, and comment. The customer selects a provider. The provider travels to the customer, performs the service, and completes the order. TezHelp charges providers for responses and successful orders.

Initial city: Almaty.

Initial interface languages:

- Russian
- Kazakh
- English

The web product must be mobile-first and fully usable on smartphones.

## Roles

### Customer

Can:

- create an order
- attach up to five photos
- select a provider
- use in-app chat
- call the provider after departure is confirmed
- see the provider's current or last known location
- rate and review the provider
- submit a complaint

### Provider

Can:

- maintain one account with multiple service profiles
- pass separate moderation for each category
- browse all Almaty orders or enable a straight-line radius filter
- submit paid or free responses
- manage wallet balance
- accept one active order at a time
- chat and exchange photos and voice messages
- confirm departure, arrival, and completion
- rate and review the customer

### Administrator

Can:

- manage users and service profiles
- review documents
- manage categories and tariffs
- manually credit or adjust wallets through ledger entries
- view orders, locations, complaints, sanctions, and audit logs
- block users or service profiles
- resolve suspicious cancellation and commission-avoidance cases

## MVP service categories

1. Jump-start vehicle
2. Engine-start assistance
3. Replace wheel
4. Inflate wheel
5. Mobile tire service
6. Fuel delivery
7. Tow truck
8. Vehicle unlocking

## Vehicle unlocking requirements

Vehicle unlocking is a high-risk category and requires:

- separate provider moderation
- clear customer reason
- vehicle make, model, year, and photos
- proof of lawful access
- identity document and vehicle registration certificate (СРТС / technical passport)
- post-opening verification if documents are locked inside
- refusal when lawful access is doubtful
- an auditable verification result

## Account model

One user may be both customer and provider.

A provider has one general profile and one independent profile per service category.

Each provider service profile has:

- moderation status
- category-specific documents
- category-specific rating and reviews
- completed-order count
- cancellation statistics
- availability
- suspension status

## Order discovery

Default behavior: show all available orders in Almaty.

Optional nearby filter:

- disabled by default
- when enabled, initial radius is 5 km
- minimum radius is 3 km
- plus and minus controls change radius by 1 km
- distance is straight-line distance
- district filters are not used
- filter preference is saved per provider

## Offers

Initial response fee: 100 KZT.

Rules:

- first five responses are free for each new provider account
- free responses are account-wide, not per category
- category tariffs are configurable for future changes
- unlimited providers may respond to an order
- provider sees how many responses already exist
- response fee is non-refundable after successful response publication
- refund is allowed only for platform technical failure, duplicate charge, or failed response creation

## Price and commission

Initial commission: 10% of accepted order price.

The platform must support configurable:

- percentage commission
- fixed commission
- combined commission
- zero commission

The accepted price becomes immutable after provider selection.

The customer pays the provider directly. TezHelp does not receive or distribute service payment.

## Provider balance

A provider must have:

1. positive balance
2. configured operational minimum
3. enough balance to cover potential commission for the specific offer
4. enough balance to pay the response fee if no free credit remains

Recommended initial operational minimum: 3,000 KZT.

Required available balance:

```text
max(operational minimum, potential commission) + response fee
```

For a free response, response fee is zero.

Commission is reserved atomically when the customer selects the provider.

## One active order

A provider may have only one active order.

While assigned to an active order, the provider cannot:

- submit new responses
- be selected for another order
- accept another order

Other outstanding responses become unavailable while the active order exists.

## Order lifecycle

Core states:

- `draft`
- `published`
- `receiving_offers`
- `provider_selected`
- `provider_en_route`
- `provider_arrived`
- `in_progress`
- `completed`
- `cancelled_by_customer`
- `cancelled_by_provider`
- `cancelled_by_admin`
- `disputed`

Completion does not require customer confirmation.

The provider completes the order. Reserved commission is captured immediately. The provider then becomes available.

The customer may later submit a complaint, but that does not automatically reverse commission or block the provider.

## Contact and chat

Before departure confirmation:

- exact customer phone is hidden
- communication occurs inside TezHelp

After provider confirms departure:

- phone numbers become visible to the assigned parties
- live tracking begins

The interface must remind users that price, conditions, and changes should be discussed in TezHelp chat for dispute evidence.

Chat supports:

- text
- photos
- voice messages
- system events
- delivery timestamp
- reporting
- administrator access for dispute handling

Images:

- maximum five
- maximum 20 MB each at upload
- validated and processed server-side
- optimized derivatives for display

Voice:

- recommended WebM/Opus
- maximum three minutes
- maximum 10 MB

Video is excluded from MVP.

## Live location

Tracking begins only after provider confirms departure.

Customer sees:

- current point when available
- otherwise last known point
- timestamp of last update
- stale/offline state

When browser tracking pauses:

- marker remains at last known point
- marker must not move along an assumed route
- when browser becomes active, fetch a fresh GPS point
- update marker and rebuild route from fresh point
- continue live tracking

Location access stops after completion or cancellation.

Administrator may view active-order tracking.

## Cancellation rules

Response fee is never refunded except technical failure.

### Customer before provider selection

- free cancellation
- no commission
- response fees remain charged
- cancellation affects customer statistics

### Customer after selection, before departure

- commission reservation released
- response fee remains charged
- cancellation metrics worsen

### Customer after departure

- commission reservation released
- platform pays no compensation
- response fee remains charged
- stronger reliability impact

### Customer after provider arrival

- provider is released
- response fee remains charged
- commission reservation remains pending for administrator review of possible commission avoidance

### Provider before departure

- commission released
- response fee remains charged
- activity score decreases

### Provider after departure

- commission released
- response fee remains charged
- stronger activity and public reliability penalty
- respectful reasons are reviewed separately

### Platform cancellation

Used for illegality, safety risk, fraud, technical failure, or account blocking.

## Activity and reliability

### Activity

Internal score, initially 100.

It affects:

- notification priority
- order visibility timing
- temporary restrictions

Cancellations reduce activity, with stronger penalties after departure or arrival. Successful orders can restore activity.

Initial consecutive-cancellation policy:

- seven unjustified consecutive cancellations: 24-hour block
- second episode: seven-day block
- third episode: indefinite block with administrative appeal

The general cancellation percentage is tracked independently.

### Reliability

Public provider score.

Inputs include:

- completion rate
- provider cancellations
- no-shows
- complaints
- verified documents
- rating
- time on platform

Customer reliability indicators visible to providers include:

- cancellation rate
- completed/confirmed-order indicators
- reviews

## Moderation

Moderation is manual for MVP and separate per service category.

Target: within three working hours.

The system records:

- submission time
- deadline
- moderator
- decision
- rejection reason
- document version
- audit history

Future automated verification must be pluggable.

## Notifications

First technical release requires realtime in-app notifications.

Browser push, SMS operational notifications, and mobile push may be added later.

## Branding

Name: TezHelp.

Initial visual direction:

- primary blue `#165DFF`
- urgent orange `#FF7A00`
- success green `#16A36A`
- danger red `#DC3545`
- background `#F6F8FC`
- text `#152033`

The product should look modern, reliable, and suitable for urgent use.
