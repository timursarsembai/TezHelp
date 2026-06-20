# TezHelp local Docker

The development stack contains PostgreSQL with PostGIS, Redis, and MinIO.

```bash
pnpm infra:up
pnpm db:migrate
pnpm infra:down
```

Persistent volumes are used for development convenience. Do not run destructive
volume cleanup through Codex. If local data must be removed, do it manually after
checking that no important development state is stored there.

MinIO console: `http://localhost:9001`

Example credentials are intentionally synthetic and live in `.env.example`.
