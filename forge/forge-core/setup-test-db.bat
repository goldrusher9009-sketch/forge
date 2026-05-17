@echo off
REM Setup script for Forge Core test database on Windows
REM This script creates the necessary PostgreSQL database for integration testing

setlocal enabledelayedexpansion

echo === Forge Core Test Database Setup ===
echo.

REM Configuration
set DB_USER=postgres
set DB_NAME=forge_test
set DB_PASSWORD=postgres
set DB_HOST=localhost
set DB_PORT=5432

REM Check if PostgreSQL is in PATH
where psql >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PostgreSQL command line tools not found
    echo Please ensure PostgreSQL is installed and added to PATH
    echo Download from: https://www.postgresql.org/download/windows/
    echo.
    echo After installation, add PostgreSQL bin directory to PATH:
    echo   Typically: C:\Program Files\PostgreSQL\xx\bin
    pause
    exit /b 1
)

echo Checking PostgreSQL connection...
psql -h %DB_HOST% -U %DB_USER% -c "SELECT 1" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PostgreSQL is not running or not accessible at %DB_HOST%:%DB_PORT%
    echo Please ensure PostgreSQL service is running:
    echo   1. Open Services (services.msc)
    echo   2. Find "postgresql-x64-XX" service
    echo   3. Ensure it is running
    echo.
    pause
    exit /b 1
)

echo Connection successful
echo.

REM Create test database
echo Creating test database '%DB_NAME%'...
psql -h %DB_HOST% -U %DB_USER% -c "CREATE DATABASE %DB_NAME%;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Database created successfully
) else (
    echo Database already exists or error occurred
)

echo.
echo === Setup Complete ===
echo Test database: %DB_NAME%
echo Host: %DB_HOST%
echo Port: %DB_PORT%
echo User: %DB_USER%
echo.
echo Connection string:
echo   postgres://%DB_USER%:%DB_PASSWORD%@%DB_HOST%:%DB_PORT%/%DB_NAME%
echo.
echo To run integration tests:
echo   1. Set environment variable in Command Prompt:
echo      set TEST_DATABASE_URL=postgres://%DB_USER%:%DB_PASSWORD%@%DB_HOST%:%DB_PORT%/%DB_NAME%
echo.
echo   2. Or set in PowerShell:
echo      $env:TEST_DATABASE_URL="postgres://%DB_USER%:%DB_PASSWORD%@%DB_HOST%:%DB_PORT%/%DB_NAME%"
echo.
echo   3. Then run tests:
echo      cargo test --test integration_executor_handlers -- --ignored --test-threads=1
echo.
pause
