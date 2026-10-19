#!/usr/bin/env bash
# Deploy on the VM: pulls the images published to ghcr.io by CI, migrates the
# database and restarts. The images to run come from .env (IMAGE_API,
# IMAGE_WEB); any KEY=VALUE passed is written to .env first.
#
#   ./deploy/deploy.sh                                     # what .env says (:latest = newest build)
#   ./deploy/deploy.sh IMAGE_API=ghcr.io/aritzbl/sprintboard-api:<sha>
#   ./deploy/deploy.sh IMAGE_WEB=ghcr.io/aritzbl/sprintboard-web:v0.2.0
#   ./deploy/deploy.sh IMAGE_API=...:<sha> IMAGE_WEB=...:<sha>   # roll both back
#
# If the ghcr packages are private, once: docker login ghcr.io (GitHub user +
# classic PAT with scope read:packages).
#
# Order matters: `migrate` runs before the new `api` starts. If the migration
# fails, the old `api` keeps serving. `up --no-deps` keeps Compose from running
# `migrate` again (it already ran with `run`).

set -euo pipefail
cd "$(dirname "$0")/.."

COMPOSE="docker compose -f compose.prod.yml"

[ -f .env ] || { echo "Missing .env — copy .env.prod.example and fill it in." >&2; exit 1; }

for kv in "$@"; do
    key="${kv%%=*}"
    [[ "$key" =~ ^[A-Z_]+$ && "$kv" == *=* ]] || { echo "invalid argument: $kv (expected KEY=VALUE)" >&2; exit 1; }
    if grep -q "^$key=" .env; then
        sed -i "s|^$key=.*|$kv|" .env
    else
        echo "$kv" >> .env
    fi
done

echo "==> images"
grep -E '^IMAGE_(API|WEB)=' .env

echo "==> pull"
$COMPOSE pull --quiet

echo "==> postgres"
$COMPOSE up -d --wait --wait-timeout 180 postgres

echo "==> migrations"
$COMPOSE run --rm migrate

echo "==> restart"
$COMPOSE up -d --no-deps --wait --wait-timeout 180 api web mailpit
$COMPOSE up -d --no-deps caddy

# Old images: the disk is small.
docker image prune -f >/dev/null

echo "==> status"
$COMPOSE ps
