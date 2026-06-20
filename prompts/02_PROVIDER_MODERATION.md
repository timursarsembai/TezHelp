# Codex task 02 — Provider service profiles and manual moderation

## Mode

Plan first. Create an execution plan because this task changes multiple modules and the database.

## Goal

Implement provider onboarding with separate profiles and moderation for each service category.

## Service categories

Seed:

- jump start
- engine start assistance
- wheel replacement
- wheel inflation
- mobile tire service
- fuel delivery
- tow truck
- vehicle unlocking

Each category must have localized name and description in RU/KK/EN.

## Provider model

Create:

- general provider profile
- face photo
- identity-document metadata
- IIN
- city
- tax status
- provider service profile per category
- category-specific documents
- category-specific moderation status
- category-specific rating placeholder and statistics
- category suspension status

Do not store files in public storage.

### Tax status

Support configurable category allowance for:

- individual entrepreneur
- self-employed/special tax regime

Do not hardcode legal eligibility. Administrator configures allowed statuses per category.

### Category-specific document rules

Rules must be data-driven and configurable.

Initial examples:

Tow truck:

- driver license
- tow vehicle data
- state number
- vehicle registration certificate (СРТС / technical passport)
- right to use the vehicle

Vehicle unlocking:

- proof of experience or qualification
- separate acceptance of lawful-access rules
- no mandatory provider vehicle unless category policy requires it

### Moderation

Manual moderation per service profile.

Statuses should include at least:

- draft
- submitted
- under_review
- approved
- rejected
- suspended

Target SLA: three working hours.

Record:

- submitted time
- SLA deadline
- moderator
- decision
- reason
- document version
- audit history

## Admin UI

Implement:

- moderation queue
- filters
- overdue indicator
- profile and document review
- approve/reject with reason
- suspend category
- audit history

## Provider UI

Implement mobile-first:

- general profile
- category selection
- document upload
- per-category status
- rejection reason
- resubmission

## Security

- private signed URLs
- permission-scoped document access
- document access audit
- file type and size validation
- no identity document content in application logs

## Architecture constraints

- moderation rules belong to moderation/provider-service modules
- object storage is behind a port
- no god provider service
- each category rule is data-driven
- future automatic verification must be attachable through an adapter

## Acceptance criteria

- one provider can have multiple independently moderated categories
- approval in one category does not approve another
- unapproved category cannot later submit offers
- admin access is authorized and audited
- private files are inaccessible without signed authorization
- RU/KK/EN UI works
- integration and authorization tests pass
