$ErrorActionPreference = "Stop"

pnpm infra:up
pnpm db:migrate
pnpm dev
