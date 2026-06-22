# Deployment and operations notes

Production deployment is intentionally not implemented in Phase 0.

Future production infrastructure must satisfy the accepted Kazakhstan hosting
constraint for personal data, files, relevant logs, and backups. Use the
provider-adapter boundaries documented in `docs/ARCHITECTURE.md` before adding
SMS, payments, storage, maps, routing, or document verification providers.

## Backup and restore baseline

Before production launch, choose Kazakhstan-hosted backup storage for:

- PostgreSQL base backups and WAL/archive logs;
- private object storage;
- logs that may contain personal data;
- generated document-processing artifacts.

Production restore drills must prove that:

- a fresh database can be restored from backup;
- PostGIS extensions are present after restore;
- migration metadata is intact;
- wallet ledger balances can be reconciled;
- object-storage metadata and private objects match.

Local development can validate the PostgreSQL portion with:

```bash
pnpm infra:up
pnpm db:migrate
pnpm db:backup:validate
```

The local validation script restores into `tezhelp_restore_validation` and drops
only that temporary database. It does not restore into the main `tezhelp`
development database.
