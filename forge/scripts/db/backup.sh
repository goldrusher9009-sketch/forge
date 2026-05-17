#!/bin/bash

set -euo pipefail

# Database Backup and Recovery Script for Forge Platform
# Handles full database backups, point-in-time recovery, and backup rotation

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/backups"
LOG_FILE="${PROJECT_ROOT}/logs/backups.log"

# Environment variables
DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-5432}"
DB_USER="${DATABASE_USER:-postgres}"
DB_NAME="${DATABASE_NAME:-forge}"
DB_PASSWORD="${DATABASE_PASSWORD:-}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
ENVIRONMENT="${NODE_ENV:-development}"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
  local message="$1"
  echo -e "${BLUE}[INFO]${NC} ${message}" | tee -a "${LOG_FILE}"
}

log_success() {
  local message="$1"
  echo -e "${GREEN}[SUCCESS]${NC} ${message}" | tee -a "${LOG_FILE}"
}

log_warning() {
  local message="$1"
  echo -e "${YELLOW}[WARNING]${NC} ${message}" | tee -a "${LOG_FILE}"
}

log_error() {
  local message="$1"
  echo -e "${RED}[ERROR]${NC} ${message}" | tee -a "${LOG_FILE}"
}

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"
mkdir -p "$(dirname "${LOG_FILE}")"

# Check prerequisites
check_prerequisites() {
  log_info "Checking prerequisites..."

  if ! command -v pg_dump &> /dev/null; then
    log_error "pg_dump not found. Please install PostgreSQL client tools."
    exit 1
  fi

  if ! command -v psql &> /dev/null; then
    log_error "psql not found. Please install PostgreSQL client."
    exit 1
  fi

  if ! command -v gzip &> /dev/null; then
    log_warning "gzip not found. Backups will not be compressed."
  fi

  log_success "Prerequisites check passed"
}

# Verify database connection
verify_database_connection() {
  log_info "Verifying database connection..."

  if [ -z "${DB_PASSWORD}" ]; then
    PGPASSWORD="${DB_PASSWORD}" psql \
      -h "${DB_HOST}" \
      -p "${DB_PORT}" \
      -U "${DB_USER}" \
      -d "${DB_NAME}" \
      -c "SELECT NOW();" > /dev/null 2>&1 || {
        log_error "Failed to connect to database"
        exit 1
      }
  else
    PGPASSWORD="${DB_PASSWORD}" psql \
      -h "${DB_HOST}" \
      -p "${DB_PORT}" \
      -U "${DB_USER}" \
      -d "${DB_NAME}" \
      -c "SELECT NOW();" > /dev/null 2>&1 || {
        log_error "Failed to connect to database"
        exit 1
      }
  fi

  log_success "Database connection verified"
}

# Create full database backup
create_backup() {
  log_info "Creating database backup..."

  local timestamp
  timestamp=$(date +%Y%m%d_%H%M%S)
  local backup_file="${BACKUP_DIR}/forge_backup_${timestamp}.sql.gz"
  local backup_metadata="${BACKUP_DIR}/forge_backup_${timestamp}.metadata"

  local start_time
  start_time=$(date +%s)

  # Create backup with statistics
  if PGPASSWORD="${DB_PASSWORD}" pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --verbose \
    --format=plain \
    --blobs \
    --no-owner \
    --no-privileges \
    | gzip > "${backup_file}"; then

    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local file_size
    file_size=$(du -h "${backup_file}" | cut -f1)

    # Create metadata file
    cat > "${backup_metadata}" << EOF
Backup Timestamp: $(date)
Database: ${DB_NAME}
Host: ${DB_HOST}
Port: ${DB_PORT}
Duration: ${duration} seconds
File Size: ${file_size}
Compressed File: ${backup_file}
Backup Status: SUCCESS
EOF

    log_success "Backup created: ${backup_file} (${file_size}, ${duration}s)"
    echo "${backup_file}"
  else
    log_error "Backup creation failed"
    rm -f "${backup_file}"
    exit 1
  fi
}

# List available backups
list_backups() {
  log_info "Available backups:"
  
  if [ -z "$(ls -A "${BACKUP_DIR}"/*.sql.gz 2>/dev/null)" ]; then
    log_warning "No backups found"
    return
  fi

  ls -lhS "${BACKUP_DIR}"/*.sql.gz | awk '{print $9, "(" $5 ")"}'
}

# Restore database from backup
restore_backup() {
  local backup_file="$1"

  if [ ! -f "${backup_file}" ]; then
    log_error "Backup file not found: ${backup_file}"
    exit 1
  fi

  log_warning "This will restore the database from: ${backup_file}"
  log_warning "Current database will be overwritten. Continue? (yes/no)"
  read -r confirmation

  if [ "${confirmation}" != "yes" ]; then
    log_info "Restore operation cancelled"
    exit 0
  fi

  log_info "Restoring database from backup..."

  local start_time
  start_time=$(date +%s)

  # Drop existing database and recreate
  PGPASSWORD="${DB_PASSWORD}" psql \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d postgres \
    << EOF
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}';
DROP DATABASE IF EXISTS ${DB_NAME};
CREATE DATABASE ${DB_NAME};
EOF

  # Restore from backup
  if gunzip -c "${backup_file}" | PGPASSWORD="${DB_PASSWORD}" psql \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" > /dev/null 2>&1; then

    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log_success "Database restored successfully (${duration}s)"
  else
    log_error "Database restore failed"
    exit 1
  fi
}

# Clean up old backups
cleanup_old_backups() {
  log_info "Cleaning up backups older than ${BACKUP_RETENTION_DAYS} days..."

  local count=0
  while IFS= read -r backup_file; do
    if [ -n "${backup_file}" ]; then
      local filename
      filename=$(basename "${backup_file}")
      log_info "Removing old backup: ${filename}"
      rm -f "${backup_file}"
      count=$((count + 1))
    fi
  done < <(find "${BACKUP_DIR}" -name "*.sql.gz" -mtime "+${BACKUP_RETENTION_DAYS}")

  if [ ${count} -gt 0 ]; then
    log_success "Removed ${count} old backup(s)"
  else
    log_info "No old backups to remove"
  fi
}

# Main execution
main() {
  local command="${1:-backup}"
  
  log_info "Starting database backup/recovery process (Environment: ${ENVIRONMENT})"
  
  check_prerequisites
  verify_database_connection
  
  case "${command}" in
    backup)
      create_backup
      cleanup_old_backups
      ;;
    list)
      list_backups
      ;;
    restore)
      if [ -z "${2:-}" ]; then
        log_error "Backup file path required"
        echo "Usage: $0 restore <backup_file>"
        exit 1
      fi
      restore_backup "$2"
      ;;
    cleanup)
      cleanup_old_backups
      ;;
    *)
      log_error "Unknown command: ${command}"
      echo "Usage: $0 {backup|list|restore|cleanup}"
      exit 1
      ;;
  esac
  
  log_success "Backup/recovery process completed"
}

main "$@"
