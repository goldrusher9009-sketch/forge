#!/bin/bash
# Setup script for Forge Core test database
# This script creates the necessary PostgreSQL database and user for integration testing

set -e

echo "=== Forge Core Test Database Setup ==="

# Configuration
DB_USER="postgres"
DB_NAME="forge_test"
DB_PASSWORD="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# Check if PostgreSQL is running
echo "Checking PostgreSQL connection..."
if ! psql -h "$DB_HOST" -U "$DB_USER" -c "SELECT 1" > /dev/null 2>&1; then
    echo "ERROR: PostgreSQL is not running or not accessible at $DB_HOST:$DB_PORT"
    echo "Please ensure PostgreSQL is installed and running:"
    echo "  - macOS: brew services start postgresql"
    echo "  - Linux: sudo systemctl start postgresql"
    echo "  - Windows: Start PostgreSQL service from Services panel"
    echo "  - Docker: docker run --name forge_postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:14-alpine"
    exit 1
fi

echo "✓ PostgreSQL is running"

# Drop existing test database (optional - uncomment if you want fresh setup)
# echo "Dropping existing test database..."
# psql -h "$DB_HOST" -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;" || true

# Create test database
echo "Creating test database '$DB_NAME'..."
psql -h "$DB_HOST" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "✓ Database already exists"

echo "✓ Test database created"

# Create connection string
CONNECTION_STRING="postgres://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

echo ""
echo "=== Setup Complete ==="
echo "Test database: $DB_NAME"
echo "Connection string:"
echo "  $CONNECTION_STRING"
echo ""
echo "To run integration tests, set the environment variable and run:"
echo "  export TEST_DATABASE_URL=\"$CONNECTION_STRING\""
echo "  cargo test --test integration_executor_handlers -- --ignored --test-threads=1"
echo ""
