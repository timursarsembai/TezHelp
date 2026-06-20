#!/usr/bin/env python3
"""Block a small set of destructive or secret-exposing shell commands.

This hook is a guardrail, not a complete security boundary.
"""
from __future__ import annotations

import json
import re
import sys
from typing import Any


def deny(reason: str) -> None:
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": reason,
                }
            },
            ensure_ascii=False,
        )
    )


def read_payload() -> dict[str, Any]:
    try:
        payload = json.load(sys.stdin)
        return payload if isinstance(payload, dict) else {}
    except json.JSONDecodeError:
        return {}


payload = read_payload()
tool_input = payload.get("tool_input")
if not isinstance(tool_input, dict):
    sys.exit(0)

command = tool_input.get("command", "")
if not isinstance(command, str) or not command.strip():
    sys.exit(0)

normalized = " ".join(command.strip().split())

blocked: list[tuple[str, str]] = [
    (r"(?i)(^|[;&|]\s*)rm\s+-[a-z]*r[a-z]*f[a-z]*\s+(/|~|\.\.?)(\s|$)", "Recursive force deletion of a root, home, or repository path is blocked."),
    (r"(?i)\bgit\s+reset\s+--hard\b", "git reset --hard is blocked because it can destroy uncommitted work."),
    (r"(?i)\bgit\s+clean\s+-[a-z]*f[a-z]*d|git\s+clean\s+-[a-z]*d[a-z]*f", "git clean with force and directory deletion is blocked."),
    (r"(?i)\bgit\s+(checkout|restore)\s+--?\s*\.\s*($|[;&|])", "Discarding all working-tree changes is blocked."),
    (r"(?i)\bgit\s+push\b[^\n]*(--force-with-lease|--force|\s-f(\s|$))", "Force-pushing is blocked by repository policy."),
    (r"(?i)\bdocker(\s+compose|-compose)\s+down\b[^\n]*(\s-v\b|--volumes\b)", "Removing Docker volumes is blocked because it can destroy local data."),
    (r"(?i)\bdocker\s+volume\s+(rm|prune)\b", "Docker volume deletion/pruning is blocked."),
    (r"(?i)\b(drop\s+database|truncate\s+table)\b", "Destructive database commands are blocked."),
    (r"(?i)\b(prisma\s+migrate\s+reset|supabase\s+db\s+reset)\b", "Database reset commands are blocked."),
    (r"(?i)\b(kubectl|helm)\b[^\n]*\b(delete|uninstall)\b", "Cluster deletion/uninstall commands are blocked."),
    (r"(?i)\b(cat|type|more|get-content|gc)\b[^\n]*(^|[/\\])\.env(\s|$)", "Reading a real .env file through shell is blocked. Use .env.example and documented variables."),
    (r"(?i)\b(printenv|set)\b[^\n]*(secret|token|password|private[_-]?key)", "Printing secret-bearing environment variables is blocked."),
    (r"(?i)(NODE_ENV|APP_ENV)\s*=\s*production[^\n]*(migrate|seed|reset|drop)", "Production database mutation requires explicit human execution outside the agent loop."),
]

for pattern, reason in blocked:
    if re.search(pattern, normalized):
        deny(f"{reason} Command: {normalized[:500]}")
        sys.exit(0)

# Do not auto-allow or rewrite. Exit quietly and let normal Codex permissions apply.
sys.exit(0)
