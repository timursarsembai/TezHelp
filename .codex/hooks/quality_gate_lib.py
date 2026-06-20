#!/usr/bin/env python3
"""Shared helpers for TezHelp quality-gate hooks."""
from __future__ import annotations

import hashlib
from pathlib import Path
import subprocess


IGNORED_PREFIXES = (
    ".git/",
    "node_modules/",
    ".next/",
    "dist/",
    "build/",
    "coverage/",
    ".turbo/",
)


def repository_fingerprint(root: Path) -> str:
    digest = hashlib.sha256()

    diff = subprocess.run(
        ["git", "diff", "--binary", "HEAD"],
        cwd=root,
        capture_output=True,
        check=False,
    )
    digest.update(diff.stdout)

    untracked = subprocess.run(
        ["git", "ls-files", "--others", "--exclude-standard", "-z"],
        cwd=root,
        capture_output=True,
        check=False,
    )
    for raw_name in sorted(part for part in untracked.stdout.split(b"\0") if part):
        name = raw_name.decode("utf-8", errors="surrogateescape").replace("\\", "/")
        if name.startswith(IGNORED_PREFIXES):
            continue
        path = root / name
        digest.update(name.encode("utf-8", errors="surrogateescape"))
        if path.is_file():
            try:
                digest.update(path.read_bytes())
            except OSError:
                pass

    return digest.hexdigest()


def git_root(cwd: str | Path) -> Path | None:
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        cwd=str(cwd),
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        return None
    return Path(result.stdout.strip())
