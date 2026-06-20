#!/usr/bin/env sh
set -eu

pnpm infra:up
pnpm db:migrate
pnpm dev
