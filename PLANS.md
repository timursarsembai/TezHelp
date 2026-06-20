# TezHelp execution plans

Use an execution plan for work that:

- spans multiple applications or modules
- changes the database schema
- introduces an external service
- changes financial, order, moderation, security, or location behavior
- requires migrations or deployment changes
- is expected to take more than roughly one hour
- has meaningful rollback risk

Create plans in `docs/plans/YYYY-MM-DD-short-title.md`.

## Plan template

```md
# <Title>

## Goal

What user or system outcome will exist after this work?

## Non-goals

What is explicitly excluded?

## Context

Relevant modules, documents, decisions, constraints, and current behavior.

## Assumptions

List assumptions. Mark any assumption that requires confirmation.

## Architecture impact

- modules touched
- new boundaries
- database changes
- API changes
- background jobs
- external providers
- security and privacy impact
- localization impact

## Domain invariants

List the rules that must remain true.

## Implementation steps

Use ordered, reviewable steps. Prefer vertical slices.

## Test plan

- unit
- integration
- end-to-end
- migration
- manual verification

## Rollout and rollback

How is the change deployed, monitored, and reversed?

## Risks

List concrete technical and product risks.

## Progress

- [ ] Step 1
- [ ] Step 2

## Decision log

Record decisions made during implementation.

## Completion report

Summarize changed files, commands run, test results, migrations, and remaining work.
```

Plans are living documents. Update progress and decisions during implementation.
