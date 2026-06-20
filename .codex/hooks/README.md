# TezHelp Codex hooks

These project-local hooks are loaded from `.codex/hooks.json`.

Codex requires review and trust for new or changed command hooks. Open `/hooks`, inspect each definition, and trust it only after reviewing the scripts.

## Included hooks

### `PreToolUse` — `pre_tool_policy.py`

Blocks a deliberately small set of destructive or secret-exposing shell commands, including:

- destructive Git resets and cleans
- force pushes
- destructive database resets
- Docker volume deletion
- obvious `.env` secret reads
- production migration/reset commands

This is a guardrail, not a complete security boundary. Codex documentation states that interception is not complete for every possible tool path.

### `PostToolUse` — `post_edit_architecture_check.py`

Runs after file edits and provides heuristic warnings for:

- generic catch-all service or utility names
- very large files
- large controllers or UI components
- direct persistence access in controllers
- explicit `any`
- debugging statements
- TODO/FIXME/HACK markers

It warns rather than blocks because these checks can produce false positives. The actual architectural rules remain in `AGENTS.md`, lint rules, tests, and code review.

### `Stop` — `stop_quality_gate.py`

Before Codex finishes, it checks whether the current working-tree fingerprint has a successful cached quality-gate result.

Run:

```bash
python3 .codex/hooks/run_quality_gate.py
```

Windows:

```powershell
py -3 .codex/hooks/run_quality_gate.py
```

Run extended checks when relevant:

```bash
python3 .codex/hooks/run_quality_gate.py --full
```

The result is stored under `.git/codex-hooks/` and is not committed.

## Quality-gate behavior

When root `package.json` exists, the runner attempts the available canonical scripts:

- `format:check`
- `lint`
- `typecheck`
- `test`
- `build`

With `--full`:

- `test:integration`
- `test:e2e`

The bootstrap task is responsible for creating these scripts.

Before the repository is bootstrapped, the runner records that no root scripts exist and allows documentation-only preparation.

## Windows requirement

Python 3 must be available through the `py -3` launcher.

The Windows hook commands use PowerShell to resolve the Git repository root, so Codex may be started from a subdirectory.

In Codex Desktop sessions where system Python is not on `PATH`, the bundled
Python runtime can run `run_quality_gate.py` manually. This fallback does not
change the hook definitions developers review through `/hooks`.

## Maintenance

Changing any hook definition or command causes Codex to require trust review again.

Keep hook logic deterministic, fast, and free of network calls.
