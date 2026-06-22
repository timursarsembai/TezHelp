#!/usr/bin/env python3
"""Run repository quality checks and cache the result for the Stop hook."""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

from quality_gate_lib import git_root, repository_fingerprint


CORE_SCRIPTS = ["format:check", "ops:validate", "lint", "typecheck", "test", "build"]
FULL_SCRIPTS = ["test:integration", "test:e2e"]


def load_package_scripts(root: Path) -> dict[str, str]:
    package_json = root / "package.json"
    if not package_json.exists():
        return {}
    try:
        payload = json.loads(package_json.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}
    scripts = payload.get("scripts", {})
    return scripts if isinstance(scripts, dict) else {}


def state_path(root: Path) -> Path:
    state_dir = root / ".git" / "codex-hooks"
    state_dir.mkdir(parents=True, exist_ok=True)
    return state_dir / "quality-gate.json"


def run_command(root: Path, command: list[str]) -> dict[str, object]:
    print(f"\n$ {' '.join(command)}", flush=True)
    completed = subprocess.run(command, cwd=root, check=False)
    return {"command": command, "returncode": completed.returncode}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--full", action="store_true", help="Also run integration and end-to-end scripts when defined.")
    args = parser.parse_args()

    root = git_root(os.getcwd())
    if root is None:
        print("Not inside a Git repository.", file=sys.stderr)
        return 2

    scripts = load_package_scripts(root)
    package_manager = shutil.which("pnpm")

    results: list[dict[str, object]] = []
    success = True
    note = ""

    if not scripts:
        note = "No root package.json scripts exist yet; repository is still in documentation/bootstrap preparation."
    elif package_manager is None:
        note = "pnpm is not installed or not available on PATH."
        success = False
    else:
        requested = list(CORE_SCRIPTS)
        if args.full:
            requested.extend(FULL_SCRIPTS)

        available = [name for name in requested if name in scripts]
        missing_core = [name for name in CORE_SCRIPTS if name not in scripts]

        if missing_core:
            note = "Missing expected root scripts: " + ", ".join(missing_core)
            success = False

        for script in available:
            result = run_command(root, [package_manager, "run", script])
            results.append(result)
            if result["returncode"] != 0:
                success = False
                break

    state = {
        "fingerprint": repository_fingerprint(root),
        "passed": success,
        "full": bool(args.full),
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "results": results,
        "note": note,
    }
    state_path(root).write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    if note:
        print(note)
    print("Quality gate:", "PASSED" if success else "FAILED")
    return 0 if success else 1


if __name__ == "__main__":
    raise SystemExit(main())
