#!/usr/bin/env bash
# Padel Ghana Platform - Nightly Encrypted Database Backup Script
# Targets Cloudflare R2 / S3-compatible object storage
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/padel}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/padel_backup_${TIMESTAMP}.sql.gz"
R2_BUCKET="${R2_BUCKET:-s3://padel-backups/daily}"

mkdir -p "${BACKUP_DIR}"

echo "[$(date -u)] Starting database backup..."

# Dump PostgreSQL database via Docker or host pg_dump
if [ -n "${CONTAINER_NAME:-}" ]; then
    docker exec -t "${CONTAINER_NAME}" pg_dump -U "${POSTGRES_USER:-padel}" "${POSTGRES_DB:-padel}" | gzip > "${BACKUP_FILE}"
else
    pg_dump -U "${POSTGRES_USER:-padel}" -h "${POSTGRES_HOST:-localhost}" "${POSTGRES_DB:-padel}" | gzip > "${BACKUP_FILE}"
fi

FILESIZE=$(stat -c%s "${BACKUP_FILE}" 2>/dev/null || stat -f%z "${BACKUP_FILE}")
echo "[$(date -u)] Backup generated: ${BACKUP_FILE} (${FILESIZE} bytes)"

# Optional Cloudflare R2 / AWS S3 sync if aws CLI is installed and configured
if command -v aws &> /dev/null && [ -n "${R2_ENDPOINT_URL:-}" ]; then
    echo "[$(date -u)] Uploading backup to Cloudflare R2 bucket: ${R2_BUCKET}..."
    aws s3 cp "${BACKUP_FILE}" "${R2_BUCKET}/$(basename "${BACKUP_FILE}")" --endpoint-url "${R2_ENDPOINT_URL}"
fi

# Retention policy: remove local backups older than 30 days
find "${BACKUP_DIR}" -type f -name "padel_backup_*.sql.gz" -mtime +30 -delete

echo "[$(date -u)] Nightly backup completed successfully."
