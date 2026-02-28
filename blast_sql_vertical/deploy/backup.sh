#!/usr/bin/env bash
# backup.sh – SQLite database backup with rotation
#
# Usage (manual):     ./backup.sh
# Usage (cron, daily at 03:00):
#   0 3 * * * /path/to/blast_sql_vertical/deploy/backup.sh >> /var/log/blast-backup.log 2>&1
#
# Environment:
#   BACKUP_DIR    – directory to write backups (default: /backups/blast-sql)
#   RETAIN_DAYS   – days to keep (default: 14)
#   COMPOSE_FILE  – path to production compose file (default: ./docker-compose.prod.yml)
#   ENV_FILE      – path to env file (default: ./.env.prod)

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups/blast-sql}"
RETAIN_DAYS="${RETAIN_DAYS:-14}"
COMPOSE_FILE="${COMPOSE_FILE:-$(dirname "$0")/docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-$(dirname "$0")/.env.prod}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/users_${TIMESTAMP}.db"

mkdir -p "$BACKUP_DIR"

echo "[backup] $(date) – starting SQLite backup"

# Use SQLite's online backup via the .backup command so we get a consistent
# snapshot even while the backend is writing to the database.
docker compose \
    -f "$COMPOSE_FILE" \
    --env-file "$ENV_FILE" \
    exec -T backend \
    sqlite3 /app/data/users.db ".backup '/tmp/blast_backup.db'"

# Copy out of the container
docker compose \
    -f "$COMPOSE_FILE" \
    --env-file "$ENV_FILE" \
    cp backend:/tmp/blast_backup.db "$BACKUP_FILE"

echo "[backup] written to $BACKUP_FILE ($(du -sh "$BACKUP_FILE" | cut -f1))"

# Rotation – remove files older than RETAIN_DAYS
find "$BACKUP_DIR" -name "users_*.db" -mtime +"$RETAIN_DAYS" -delete
echo "[backup] pruned backups older than ${RETAIN_DAYS} days"

echo "[backup] done – kept files:"
ls -lh "$BACKUP_DIR"/users_*.db 2>/dev/null || true
