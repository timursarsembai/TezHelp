#!/usr/bin/env python3
"""Require a successful quality-gate run for the current working-tree fingerprint."""
from __future__ import annotations

import json
import os
from pathlib import Path
import sys

from quality_gate_lib import git_root, repository_fingerprint


def emit(payload: dict[str, object]) -> None:
    print(json.dumps(payload, ensure_ascii=False))


def main() -> int:
    try:
        event = json.load(sys.stdin)
    except json.JSONDecodeError:
        event = {}

    root = git_root(str(event.get("cwd") or os.getcwd()))
    if root is None:
        emit({"continue": True})
        return 0

    # Prevent an accidental infinite continuation loop.
    if event.get("stop_hook_active") is True:
        emit(
            {
                "continue": True,
                "systemMessage": (
                    "TezHelp quality gate was requested earlier in this turn. "
                    "If it still has not passed, report that honestly in the completion summary."
                ),
            }
        )
        return 0

    state_file = root / ".git" / "codex-hooks" / "quality-gate.json"
    current = repository_fingerprint(root)

    state: dict[str, object] = {}
    if state_file.exists():
        try:
            loaded = json.loads(state_file.read_text(encoding="utf-8"))
            if isinstance(loaded, dict):
                state = loaded
        except (json.JSONDecodeError, OSError):
            state = {}

    passed = state.get("passed") is True
    same_fingerprint = state.get("fingerprint") == current

    if passed and same_fingerprint:
        emit({"continue": True})
        return 0

    reason = (
        "Before finishing, run the TezHelp quality gate for the current diff:\n"
        "- Windows: py -3 .codex/hooks/run_quality_gate.py\n"
        "- macOS/Linux: python3 .codex/hooks/run_quality_gate.py\n"
        "Use --full when integration or end-to-end tests are relevant. "
        "Fix failures, rerun the gate, then provide the completion report required by AGENTS.md. "
        "Do not claim checks passed unless their commands actually ran."
    )
    emit({"decision": "block", "reason": reason})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
