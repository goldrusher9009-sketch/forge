#!/bin/bash

set -euo pipefail

# Database Migration Script for Forge Platform
# Handles schema migrations, data transformations, and rollback procedures

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
MIGRATIONS_DIR="${PROJECT_ROOT}/migrations"
LOG_FILE="${PROJECT_ROOT}/logs/migrations.log"

# Environment variables
DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-5432}"
DB_USER="${DATABASE_USER:-postgres}"
DB_NAME="${DATABASE_NAME:-forge}"
DB_PASSWORD="${DATABASE_PASSWORD:-}"
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

# Ensure log directory exists
mkdir -p "$(dirname "${LOG_FILE}")"

# Check prerequisites
check_prerequisites() {
  log_info "Checking prerequisites..."

  if ! command -v psql &> /dev/null; then
    log_error "psql not found. Please install PostgreSQL client."
    exit 1
  fi

  if ! command -v node &> /dev/null; then
    log_error "Node.js not found. Please install Node.js."
    exit 1
  fi

  if [ ! -d "${MIGRATIONS_DIR}" ]; then
    log_error "Migrations directory not found at ${MIGRATIONS_DIR}"
    exit 1
  fi

  log_success "Prerequisites check passed"
}

# Connect to database and verify
verify_database_connection() {
  log_info "Verifying database connection..."

  if [ -z "${DB_PASSWORD}" ]; then
    local conn_result
    conn_result=$(PGPASSWORD="${DB_PASSWORD}" psql \
      -h "${DB_HOST}" \
      -p "${DB_PORT}" \
      -U "${DB_USER}" \
      -d "${DB_NAME}" \
      -c "SELECT NOW();" 2>&1 || echo "FAILED")

    if [ "${conn_result}" = "FAILED" ]; then
      log_error "Failed to connect to database at ${DB_HOST}:${DB_PORT}"
      exit 1
    fi
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

# Initialize migrations tracking table
init_migrations_table() {
  log_info "Initializing migrations tracking table..."

  PGPASSWORD="${DB_PASSWORD}" psql \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    << EOF
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  version VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  installed_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  execution_time INTEGER,
  success BOOLEAN DEFAULT true,
  rollback_available BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_migrations_version ON schema_migrations(version);
CREATE INDEX IF NOT EXISTS idx_migrations_installed_on ON schema_migrations(installed_on DESC);
EOF

  log_success "Migrations tracking table ready"
}

# Get list of applied migrations
get_applied_migrations() {
  PGPASSWORD="${DB_PASSWORD}" psql \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    -t -c "SELECT version FROM schema_migrations WHERE success = true ORDER BY installed_on;" 2>/dev/null || echo ""
}

# Get list of pending migrations
get_pending_migrations() {
  local applied_versions
  applied_versions=$(get_applied_migrations)
  
  for migration_file in "${MIGRATIONS_DIR}"/*.sql; do
    if [ -f "${migration_file}" ]; then
      local filename
      filename=$(basename "${migration_file}")
      local version="${filename%%_*}"
      
      if ! echo "${applied_versions}" | grep -q "^${version}$"; then
        echo "${filename}"
      fi
    fi
  done
}

# Execute migration
execute_migration() {
  local migration_file="$1"
  local version="${migration_file%%_*}"
  
  log_info "Executing migration: ${migration_file}"
  
  local start_time
  start_time=$(date +%s)
  
  if PGPASSWORD="${DB_PASSWORD}" psql \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    -f "${MIGRATIONS_DIR}/${migration_file}" > /dev/null 2>&1; then
    
    local end_time
    end_time=$(date +%s)
    local execution_time=$((end_time - start_time))
    
    PGPASSWORD="${DB_PASSWORD}" psql \
      -h "${DB_HOST}" \
      -p "${DB_PORT}" \
      -U "${DB_USER}" \
      -d "${DB_NAME}" \
      -c "INSERT INTO schema_migrations (version, description, execution_time, success, rollback_available) VALUES ('${version}', '${migration_file}', ${execution_time}, true, true);" > /dev/null 2>&1
    
    log_success "Migration executed: ${migration_file} (${execution_time}s)"
    return 0
  else
    log_error "Migration failed: ${migration_file}"
    PGPASSWORD="${DB_PASSWORD}" psql \
      -h "${DB_HOST}" \
      -p "${DB_PORT}" \
      -U "${DB_USER}" \
      -d "${DB_NAME}" \
      -c "INSERT INTO schema_migrations (version, description, execution_time, success, rollback_available) VALUES ('${version}', '${migration_file}', 0, false, false);" > /dev/null 2>&1
    return 1
  fi
}

# Run all pending migrations
migrate_up() {
  log_info "Running migrations..."
  
  init_migrations_table
  
  local pending_migrations
  pending_migrations=$(get_pending_migrations)
  
  if [ -z "${pending_migrations}" ]; then
    log_info "No pending migrations found"
    return 0
  fi
  
  local failed=0
  while IFS= read -r migration_file; do
    if [ -n "${migration_file}" ]; then
      if ! execute_migration "${migration_file}"; then
        failed=1
        break
      fi
    fi
  done <<< "${pending_migrations}"
  
  if [ ${failed} -eq 0 ]; then
    log_success "All migrations completed successfully"
  else
    log_error "Migration process aborted due to failure"
    exit 1
  fi
}

# Status of migrations
migrate_status() {
  log_info "Migration Status:"
  
  init_migrations_table
  
  echo ""
  log_info "Applied Migrations:"
  PGPASSWORD="${DB_PASSWORD}" psql \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    -c "SELECT version, description, installed_on, execution_time FROM schema_migrations WHERE success = true ORDER BY installed_on;"
  
  echo ""
  log_info "Pending Migrations:"
  local pending_migrations
  pending_migrations=$(get_pending_migrations)
  
  if [ -z "${pending_migrations}" ]; then
    log_info "No pending migrations"
  else
    echo "${pending_migrations}"
  fi
}

# Main execution
main() {
  local command="${1:-up}"
  
  log_info "Starting database migration process (Environment: ${ENVIRONMENT})"
  
  check_prerequisites
  verify_database_connection
  
  case "${command}" in
    up)
      migrate_up
      ;;
    status)
      migrate_status
      ;;
    *)
      log_error "Unknown command: ${command}"
      echo "Usage: $0 {up|status}"
      exit 1
      ;;
  esac
  
  log_success "Migration process completed"
}

main "$@"
