#!/usr/bin/env bash
# Padel Ghana Platform - Database Restore Drill Script
set -euo pipefail

BACKUP_FILE="${1:-}"

if [ -z "${BACKUP_FILE}" ]; then
    echo "Usage: $0 <path_to_backup_file.sql.gz>"
    exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "Error: Backup file '${BACKUP_FILE}' not found."
    exit 1
fi

DRILL_DB="${DRILL_DB:-padel_restore_drill}"

echo "[$(date -u)] Initiating restore drill into test database: '${DRILL_DB}'..."

# Create temporary drill database
createdb -U "${POSTGRES_USER:-padel}" -h "${POSTGRES_HOST:-localhost}" "${DRILL_DB}" || true

# Stream gunzip into psql
gunzip -c "${BACKUP_FILE}" | psql -U "${POSTGRES_USER:-padel}" -h "${POSTGRES_HOST:-localhost}" -d "${DRILL_DB}" -q

# Validate integrity of restored tables
TABLE_COUNT=$(psql -U "${POSTGRES_USER:-padel}" -h "${POSTGRES_HOST:-localhost}" -d "${DRILL_DB}" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "[$(date -u)] Restore drill successful! Verified ${TABLE_COUNT// /} tables restored."

# Cleanup temporary drill database
dropdb -U "${POSTGRES_USER:-padel}" -h "${POSTGRES_HOST:-localhost}" "${DRILL_DB}"
echo "[$(date -u)] Drill database cleaned up."
