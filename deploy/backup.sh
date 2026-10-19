#!/usr/bin/env bash
# Database backup: compressed pg_dump in ./backups, and optionally to S3.
#
#   ./deploy/backup.sh                                # local only
#   BACKUP_S3_URI=s3://kanbio-files/backups ./deploy/backup.sh   # also uploads
#
# Daily cron on the VM:
#   0 3 * * * cd /home/ec2-user && BACKUP_S3_URI=s3://kanbio-files/backups ./deploy/backup.sh >> /var/log/kanbio-backup.log 2>&1
#
# Uploading uses the instance's IAM role (s3:PutObject on that prefix), not
# credentials on the machine.
#
# Restore:
#   gunzip -c backups/kanbio-YYYY-MM-DD-HHMM.sql.gz | docker compose -f compose.prod.yml exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

set -euo pipefail
cd "$(dirname "$0")/.."

# No `source .env` (see update-dns.sh): only the keys we need.
envval() { grep -m1 "^$1=" .env | cut -d= -f2- | sed -e 's/\r$//' -e 's/^"\(.*\)"$/\1/'; }
POSTGRES_USER=$(envval POSTGRES_USER)
POSTGRES_DB=$(envval POSTGRES_DB)

mkdir -p backups
FILE="backups/kanbio-$(date -u +%Y-%m-%d-%H%M).sql.gz"

docker compose -f compose.prod.yml exec -T postgres \
    pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner | gzip > "$FILE"
echo "==> $FILE ($(du -h "$FILE" | cut -f1))"

# Keep the last 14 locally.
ls -1t backups/kanbio-*.sql.gz | tail -n +15 | xargs -r rm --

if [ -n "${BACKUP_S3_URI:-}" ]; then
    aws s3 cp "$FILE" "${BACKUP_S3_URI%/}/$(basename "$FILE")" --only-show-errors
    echo "==> uploaded to ${BACKUP_S3_URI%/}/"
fi
