# How to use the Codex prompts

## Before the first task

1. Clone or open the clean repository:
   `https://github.com/timursarsembai/TezHelp`
2. Copy this starter pack into the repository root.
3. Commit the documentation.
4. Open the repository in Codex.
5. Review and trust Codex hooks with `/hooks` after inspecting `.codex/hooks.json` and `.codex/hooks/`.
6. Start with `prompts/00_BOOTSTRAP.md`.

Codex reads `AGENTS.md` as durable repository guidance. Keep it in the repository root.

## Recommended workflow

Do not ask Codex to build the whole marketplace in one run.

For each phase:

1. Use Ask/Plan mode first.
2. Paste the relevant prompt.
3. Review the plan.
4. Ask Codex to implement only the approved scope.
5. Require tests and command output.
6. Commit the result.
7. Continue with the next phase.

The prompts are intentionally issue-like and scoped. Codex performs better when tasks are focused, testable, and reviewable.

## Prompt order

1. `00_BOOTSTRAP.md`
2. `01_IDENTITY_FOUNDATION.md`
3. `02_PROVIDER_MODERATION.md`
4. `03_ORDERS_OFFERS_WALLET.md`

The later roadmap should be converted into similarly scoped prompts after the foundation is reviewed.

## Do not skip review

After every implementation, ask Codex:

```text
Review the current diff using CODE_REVIEW.md. Do not change code yet. Identify correctness, architecture, security, concurrency, testing, and maintainability issues. Pay special attention to god objects and duplicated business rules.
```

Then ask it to fix only approved findings.
