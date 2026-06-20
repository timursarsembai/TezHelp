#!/usr/bin/env python3
"""Warn Codex about likely architecture and maintainability regressions.

The hook intentionally warns rather than blocks because heuristics can be false positives.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
import re
import subprocess
import sys
from typing import Iterable


SOURCE_EXTENSIONS = {".ts", ".tsx", ".js", ".jsx", ".py"}
IGNORED_PARTS = {
    "node_modules",
    ".next",
    "dist",
    "build",
    "coverage",
    ".turbo",
    ".git",
    "generated",
    "vendor",
}
GENERIC_NAMES = {
    "utils.ts",
    "utils.tsx",
    "helpers.ts",
    "helpers.tsx",
    "common.service.ts",
    "marketplace.service.ts",
    "app.service.ts",
    "global.store.ts",
    "store.ts",
}
MAX_LINES = 650
CONTROLLER_WARNING_LINES = 260
COMPONENT_WARNING_LINES = 450


def git_root(cwd: str) -> Path | None:
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        cwd=cwd,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        return None
    return Path(result.stdout.strip())


def changed_files(root: Path) -> list[Path]:
    commands = [
        ["git", "diff", "--name-only", "--diff-filter=ACMR", "HEAD"],
        ["git", "ls-files", "--others", "--exclude-standard"],
    ]
    names: set[str] = set()
    for command in commands:
        result = subprocess.run(command, cwd=root, capture_output=True, text=True, check=False)
        if result.returncode == 0:
            names.update(line.strip() for line in result.stdout.splitlines() if line.strip())

    files: list[Path] = []
    for name in sorted(names):
        path = (root / name).resolve()
        try:
            path.relative_to(root.resolve())
        except ValueError:
            continue
        if path.is_file() and not any(part in IGNORED_PARTS for part in path.parts):
            files.append(path)
    return files


def inspect_file(root: Path, path: Path) -> Iterable[str]:
    rel = path.relative_to(root).as_posix()
    if path.suffix.lower() not in SOURCE_EXTENSIONS:
        return []

    try:
        text = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        return []

    lines = text.splitlines()
    warnings: list[str] = []
    lower_name = path.name.lower()

    if lower_name in GENERIC_NAMES:
        warnings.append(
            f"{rel}: generic catch-all filename may become a god module; use a domain-specific name and responsibility."
        )

    if len(lines) > MAX_LINES:
        warnings.append(
            f"{rel}: {len(lines)} lines. Review cohesion and split by domain/use case if the file has multiple reasons to change."
        )

    if (lower_name.endswith(".controller.ts") or lower_name.endswith(".controller.js")) and len(lines) > CONTROLLER_WARNING_LINES:
        warnings.append(
            f"{rel}: large controller ({len(lines)} lines). Controllers must stay transport-only and thin."
        )

    if path.suffix.lower() in {".tsx", ".jsx"} and len(lines) > COMPONENT_WARNING_LINES:
        warnings.append(
            f"{rel}: large UI component ({len(lines)} lines). Separate presentation, feature orchestration, forms, and server state."
        )

    suspicious_patterns = [
        (r"\bclass\s+(MarketplaceService|CommonService|AppService|Manager|Helper)\b", "generic service/class name"),
        (r"\b(console\.log|debugger)\b", "debug statement"),
        (r"\b(TODO|FIXME|HACK)\b", "unfinished marker"),
        (r"(:\s*any\b|\bas\s+any\b|<any>)", "explicit any"),
    ]
    for pattern, label in suspicious_patterns:
        matches = len(re.findall(pattern, text))
        if matches:
            warnings.append(f"{rel}: found {matches} occurrence(s) of {label}; review before completion.")

    if lower_name.endswith(".controller.ts") and re.search(r"\b(prisma|drizzle|db\.)\b", text, re.IGNORECASE):
        warnings.append(f"{rel}: controller appears to access persistence directly; move this behind an application use case.")

    return warnings


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        payload = {}

    cwd = str(payload.get("cwd") or os.getcwd())
    root = git_root(cwd)
    if root is None:
        return 0

    warnings: list[str] = []
    for path in changed_files(root):
        warnings.extend(inspect_file(root, path))

    if not warnings:
        return 0

    message = "TezHelp architecture review warnings:\n- " + "\n- ".join(warnings[:20])
    if len(warnings) > 20:
        message += f"\n- ...and {len(warnings) - 20} more warning(s)."

    print(
        json.dumps(
            {
                "systemMessage": message,
                "hookSpecificOutput": {
                    "hookEventName": "PostToolUse",
                    "additionalContext": (
                        "Review these warnings against AGENTS.md and CODE_REVIEW.md. "
                        "They are heuristic warnings, not automatic proof of a defect."
                    ),
                },
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
