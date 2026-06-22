# Provider Activity Automation Plan

## Summary

Implement the next reputation slice: provider activity counters, automatic
consecutive-cancellation sanctions, and minimal activity-score updates inside
the existing order cancellation transaction.

This is intentionally narrow. It does not introduce ranking, complaints,
notification priority, public activity display, or production RBAC.

## Assumptions

- The product specification already fixes the consecutive-cancellation
  threshold and block windows:
  - seven consecutive provider-caused cancellations: 24-hour block;
  - second episode: seven-day block;
  - third and later episodes: indefinite block with administrative appeal.
- The exact activity-score deltas are not specified yet. The MVP foundation
  uses explicit constants:
  - provider cancellation before departure: -5;
  - provider cancellation after departure/arrival/work start: -12;
  - completed provider order resets the consecutive-cancellation counter but
    does not restore score yet.
- Automatic sanctions are provider-wide because the policy describes provider
  activity, not one service-category moderation decision.

## Implementation

- Add provider profile columns for:
  - consecutive provider cancellations;
  - cancellation block episode count;
  - activity score update timestamp.
- Keep activity score constrained to 0..100 and counters non-negative.
- Add `ProviderActivityPolicy` under `reputation/domain`.
- Update provider cancellation flow so the same database transaction:
  - updates the order terminal state;
  - releases/holds commission;
  - increments category public cancellation count;
  - updates provider activity counters;
  - creates an automatic sanction and sanction event when the threshold is met.
- Update provider completion flow to reset consecutive provider cancellations.
- Allow system-created sanctions by making `created_by_user_id` nullable.

## Tests

- Unit-test activity policy thresholds, block windows, and score floors.
- Integration-test that the seventh consecutive provider cancellation creates an
  automatic active sanction and blocks the next offer.
- Keep existing manual sanction and public reliability tests passing.

## Out Of Scope

- Ranking and dispatch priority changes.
- Complaint review workflows.
- No-show classification separate from provider cancellation.
- Admin UI for activity history.
- Production authorization.
