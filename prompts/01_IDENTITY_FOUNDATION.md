# Codex task 01 — Identity, phone verification, and role profiles

## Mode

Plan first. Inspect the implemented repository and documentation before editing.

## Goal

Implement the identity foundation without integrating a real SMS vendor.

## Scope

### User identity

Create:

- user account
- preferred locale: `ru`, `kk`, `en`
- account status
- authentication identity links
- customer profile
- provider profile
- role-switching capability

One user can be both customer and provider.

### Authentication methods

Implement architecture for:

- Google sign-in
- phone OTP

For this phase:

- provide a development/test OTP adapter
- make the adapter impossible to enable accidentally in production
- do not attempt to extract a trusted phone from Google identity
- require separate verified phone before full account activation
- one verified phone cannot belong to multiple active accounts

Define a narrow `SmsProvider` port.

Do not integrate SMSC.kz yet.

### Phone change

Implement a secure flow:

- authenticated user requests new phone
- OTP goes to new phone
- recent authentication or Google re-authentication is required
- successful change is audited
- sessions may be revoked according to documented policy

### Security

Add:

- OTP expiry
- resend cooldown
- attempt limits
- IP and phone rate limits
- no OTP logging
- secure session/cookie configuration
- audit records for identity changes

### API and UI

Create mobile-first screens for:

- sign in
- Google sign in entry
- phone input
- OTP verification
- required phone completion after Google sign in
- role selection/switching
- locale selection

All strings must exist in RU/KK/EN.

## Architecture constraints

- do not put auth business rules in controllers
- do not create a universal `AuthService`
- split use cases such as request OTP, verify OTP, link identity, change phone
- external provider payloads remain inside adapters
- write domain/application tests
- keep frontend state narrowly scoped
- do not implement provider category moderation yet

## Acceptance criteria

- development OTP works only outside production
- production startup fails if unsafe test OTP is enabled
- duplicate phone linking is prevented by database constraint
- Google identity can exist without phone but account remains incomplete
- verified phone completes activation
- role switching works
- security events are audited
- relevant quality commands pass
- documentation and `.env.example` are updated

## Required tests

- OTP expiration
- invalid attempt lockout/rate limit behavior
- duplicate phone race
- Google account requiring phone
- successful phone change
- unauthorized phone change
- locale persistence
- role-switch visibility
