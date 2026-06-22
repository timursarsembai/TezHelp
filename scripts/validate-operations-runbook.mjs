import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const runbooks = [
  {
    path: "infrastructure/operations/incident-response.md",
    requiredSnippets: [
      "# Incident Response Runbook",
      "## Principles",
      "## Severity Levels",
      "### SEV-1 Critical",
      "### SEV-2 High",
      "### SEV-3 Medium",
      "## Initial Triage",
      "## Error Monitoring Baseline",
      "## Privacy and Security Handling",
      "## Mitigation and Rollback",
      "## Communication",
      "## Postmortem Checklist",
      "## Production Readiness Gaps",
      "Kazakhstan",
      "correlation IDs",
      "wallet ledger",
      "live location",
      "personal data",
      "never rewrite applied migrations",
      "pnpm test:integration",
      "pnpm db:backup:validate",
    ],
  },
  {
    path: "infrastructure/deployment/kazakhstan-readiness.md",
    requiredSnippets: [
      "# Kazakhstan Deployment Readiness",
      "## Purpose",
      "## Non-goals",
      "## Data Residency",
      "## Current Local Stage",
      "## Pre-purchase Hosting Checklist",
      "## Baseline Production Topology",
      "## Production Environment Checklist",
      "## Deployment Gates",
      "## Rollback and Restore Rules",
      "## Remaining Gaps",
      "Kazakhstan",
      "PostgreSQL/PostGIS",
      "private object storage",
      "application logs",
      "backups",
      "ERROR_MONITORING_SINK",
      "SESSION_COOKIE_SECURE=true",
      "IDENTITY_DEV_AUTH_HEADER_ENABLED=false",
      "never rewrite applied migrations",
    ],
  },
];

const failures = [];

for (const runbook of runbooks) {
  const absolutePath = resolve(runbook.path);
  const content = readFileSync(absolutePath, "utf8");

  for (const snippet of runbook.requiredSnippets) {
    if (!content.includes(snippet)) {
      failures.push(`${runbook.path} is missing required text: ${snippet}`);
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(failure);
  }
  process.exitCode = 1;
} else {
  console.log(`Validated ${runbooks.length} operations runbook(s).`);
}
