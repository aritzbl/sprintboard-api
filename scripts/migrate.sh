#!/bin/sh
# Deploy `migrate` job (compose.prod.yml): brings the database up to date before
# the new API starts. If it fails, the API that is already running keeps serving.
#
# - Empty database: TypeORM creates the schema from the entities, which already
#   include every migration, so they are only recorded as applied.
# - Otherwise: the migrations/*.sql not yet recorded in schema_migrations run in
#   order, each in its own transaction. They are all idempotent, so the first
#   run over a restored Neon dump just re-applies them harmlessly.
set -eu
cd "$(dirname "$0")/.."

export PGHOST="$DB_HOST" PGPORT="${DB_PORT:-5432}" PGUSER="$DB_USERNAME" \
       PGPASSWORD="$DB_PASSWORD" PGDATABASE="$DB_NAME"
sql() { psql -X -q -v ON_ERROR_STOP=1 "$@"; }

sql -c "CREATE TABLE IF NOT EXISTS schema_migrations (
          name text PRIMARY KEY,
          applied_at timestamptz NOT NULL DEFAULT now())"

if [ "$(sql -tA -c "SELECT to_regclass('public.users') IS NULL")" = "t" ]; then
    echo "==> empty database: creating the schema from the entities"
    DB_SYNCHRONIZE=true node dist/main.js --sync-schema
    for file in migrations/*.sql; do
        sql -c "INSERT INTO schema_migrations (name) VALUES ('$(basename "$file")')
                ON CONFLICT DO NOTHING"
    done
fi

for file in migrations/*.sql; do
    name=$(basename "$file")
    if [ -z "$(sql -tA -c "SELECT 1 FROM schema_migrations WHERE name = '$name'")" ]; then
        echo "==> $name"
        sql -1 -f "$file" -c "INSERT INTO schema_migrations (name) VALUES ('$name')"
    fi
done
echo "==> database up to date"
