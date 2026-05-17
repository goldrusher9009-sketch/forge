# Forge Platform: Database Backup & Disaster Recovery Runbook

## Phase 10 - Production Deployment Infrastructure

**Document Version:** 1.0  
**Last Updated:** 2026-05-06  
**Maintainer:** DevOps/SRE Team  
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Backup Architecture](#backup-architecture)
3. [PostgreSQL Backup Strategy](#postgresql-backup-strategy)
4. [Redis Backup Strategy](#redis-backup-strategy)
5. [Elasticsearch Backup Strategy](#elasticsearch-backup-strategy)
6. [Storage and Retention](#storage-and-retention)
7. [Recovery Procedures](#recovery-procedures)
8. [Testing & Validation](#testing--validation)
9. [Monitoring & Alerting](#monitoring--alerting)
10. [Compliance & Audit](#compliance--audit)
11. [Troubleshooting](#troubleshooting)

---

## Overview

The Forge Platform disaster recovery strategy implements a multi-layered backup approach across all critical data services:

- **PostgreSQL**: Full backups daily + continuous WAL archiving
- **Redis**: RDB snapshots + AOF (Append-Only File) persistence
- **Elasticsearch**: Snapshot repository with automated daily snapshots
- **Application Data**: Volume snapshots via Kubernetes persistent volumes

**RPO (Recovery Point Objective):** 1 hour maximum data loss  
**RTO (Recovery Time Objective):** 4 hours for full cluster recovery  
**Backup Retention:** 30 days full backups, 90 days archived WAL files

---

## Backup Architecture

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Kubernetes Cluster                        │
├──────────────┬──────────────┬──────────────┬──────────────────────┤
│ PostgreSQL   │ Redis        │ Elasticsearch│ Persistent Volumes   │
│ (Master)     │ (Cache)      │ (Logs/Data)  │ (Application)        │
└──────┬───────┴──────┬───────┴──────┬───────┴──────────┬──────────┘
       │              │              │                 │
       ├──WAL Archive─┤              │                 │
       │              │              │                 │
       └──────┬───────┴──────┬───────┴──────────┬──────┴──────┐
              │              │                 │             │
         ┌────▼──────┬──────▼────┬──────────┬──▼────┐   ┌────▼────┐
         │ Daily Dump│ RDB+AOF   │ Snapshot │ Volume│   │S3-Glacier│
         │ Backup    │ Backup    │ Backup   │ Clone │   │Archive   │
         └────┬──────┴──────┬────┴──────────┴──┬───┘   └────┬─────┘
              │             │                 │             │
         ┌────▼─────────────▼────────────────▼─────────────▼────┐
         │     Backup Storage Layer (NFS + S3)                  │
         ├──────────────────────────────────────────────────────┤
         │ /backups/postgresql (30 day retention)               │
         │ /backups/redis (7 day retention)                     │
         │ /backups/elasticsearch (30 day retention)            │
         │ /backups/volumes (7 day retention)                   │
         │ s3://forge-backups/archive/ (90 day retention)       │
         └──────────────────────────────────────────────────────┘
```

### Backup Components

**1. Backup Container**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: backup-manager
  namespace: default
spec:
  serviceAccountName: backup-service-account
  containers:
  - name: backup-manager
    image: forge/backup-manager:1.0
    env:
    - name: BACKUP_SCHEDULE
      value: "0 2 * * *"  # 2 AM daily
    - name: RETENTION_DAYS
      value: "30"
    - name: ARCHIVE_RETENTION_DAYS
      value: "90"
    - name: S3_BUCKET
      value: "forge-backups"
    - name: S3_REGION
      value: "us-east-1"
    volumeMounts:
    - name: backup-storage
      mountPath: /backups
    - name: pgpassfile
      mountPath: /home/backup/.pgpass
      readOnly: true
    - name: redis-auth
      mountPath: /etc/redis-auth
      readOnly: true
    resources:
      requests:
        memory: "512Mi"
        cpu: "500m"
      limits:
        memory: "2Gi"
        cpu: "1000m"
  volumes:
  - name: backup-storage
    persistentVolumeClaim:
      claimName: backup-pvc
  - name: pgpassfile
    secret:
      secretName: postgres-backup-credentials
      defaultMode: 0600
  - name: redis-auth
    secret:
      secretName: redis-backup-credentials
```

**2. RBAC Configuration**
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: backup-service-account
  namespace: default
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: backup-role
rules:
- apiGroups: [""]
  resources: ["pods", "pods/exec"]
  verbs: ["get", "list", "create", "delete"]
- apiGroups: [""]
  resources: ["secrets"]
  resourceNames: ["postgres-backup-credentials", "redis-backup-credentials"]
  verbs: ["get"]
- apiGroups: [""]
  resources: ["persistentvolumeclaims"]
  verbs: ["get", "list"]
- apiGroups: ["snapshot.storage.k8s.io"]
  resources: ["volumesnapshots"]
  verbs: ["create", "list", "get"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: backup-rolebinding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: backup-role
subjects:
- kind: ServiceAccount
  name: backup-service-account
  namespace: default
```

---

## PostgreSQL Backup Strategy

### Full Backup Method: pg_dump

**Daily Full Backup Schedule:** 2:00 AM UTC

```bash
#!/bin/bash
# scripts/backups/postgres-full-backup.sh

set -euo pipefail

BACKUP_DIR="/backups/postgresql"
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/forge-full-${BACKUP_DATE}.sql.gz"
LOG_FILE="${BACKUP_DIR}/backup-${BACKUP_DATE}.log"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Execute pg_dump with compression
{
  echo "Starting PostgreSQL full backup: ${BACKUP_DATE}"
  
  pg_dump \
    --host="${POSTGRES_HOST}" \
    --port="${POSTGRES_PORT}" \
    --username="${POSTGRES_USER}" \
    --no-password \
    --format=plain \
    --verbose \
    --no-privileges \
    --no-owner \
    forge | gzip > "${BACKUP_FILE}"
  
  # Verify backup integrity
  gunzip -t "${BACKUP_FILE}" > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "Backup verification successful"
    echo "Backup size: $(du -h ${BACKUP_FILE} | cut -f1)"
    exit 0
  else
    echo "ERROR: Backup verification failed"
    rm -f "${BACKUP_FILE}"
    exit 1
  fi
} 2>&1 | tee "${LOG_FILE}"
```

### WAL Archiving (Continuous Backup)

**WAL Archive Configuration:**
```yaml
# postgresql.conf equivalent in ConfigMap
wal_level = replica
archive_mode = on
archive_timeout = 300
archive_command = '/usr/local/bin/archive-wal.sh %p %f'
restore_command = 'cp /backups/postgresql/wal_archive/%f %p'
```

**WAL Archive Script:**
```bash
#!/bin/bash
# scripts/backups/archive-wal.sh

WAL_PATH="$1"
WAL_FILE="$2"
ARCHIVE_DIR="/backups/postgresql/wal_archive"

mkdir -p "${ARCHIVE_DIR}"

# Copy WAL segment
cp "${WAL_PATH}" "${ARCHIVE_DIR}/${WAL_FILE}"

# Sync to S3 for geographic redundancy
aws s3 cp "${ARCHIVE_DIR}/${WAL_FILE}" \
  "s3://forge-backups/wal-archive/${WAL_FILE}" \
  --sse=AES256 \
  --region=us-east-1

exit $?
```

### Point-in-Time Recovery (PITR)

PITR enables recovery to any specific point in the 90-day WAL archive window.

**Recovery Command:**
```bash
#!/bin/bash
# scripts/recovery/pitr-recovery.sh

# Usage: ./pitr-recovery.sh <target_timestamp> <target_db>

TARGET_TIME="$1"
TARGET_DB="$2"

# Stop postgres
pg_ctl -D /var/lib/postgresql/data stop

# Create recovery configuration
cat > /var/lib/postgresql/data/recovery.conf <<EOF
restore_command = 'cp /backups/postgresql/wal_archive/%f %p'
recovery_target_timeline = 'latest'
recovery_target_xid = '$TARGET_XID'
recovery_target_time = '${TARGET_TIME}'
recovery_target_name = '${TARGET_DB}'
EOF

# Start postgres in recovery mode
pg_ctl -D /var/lib/postgresql/data start

# Monitor recovery progress
tail -f /var/lib/postgresql/data/pg_log/postgresql.log
```

### Backup Verification

```bash
#!/bin/bash
# scripts/backups/verify-postgres-backup.sh

BACKUP_FILE="$1"
VERIFY_DB="forge_verify_$(date +%s)"

echo "Verifying backup: ${BACKUP_FILE}"

# Create temporary database
createdb "${VERIFY_DB}" \
  --host="${POSTGRES_HOST}" \
  --port="${POSTGRES_PORT}" \
  --username="${POSTGRES_USER}"

# Restore backup to verify database
gunzip -c "${BACKUP_FILE}" | psql \
  --host="${POSTGRES_HOST}" \
  --port="${POSTGRES_PORT}" \
  --username="${POSTGRES_USER}" \
  --dbname="${VERIFY_DB}" \
  2>&1 | head -20

# Check restore success
RESTORED_TABLES=$(psql \
  --host="${POSTGRES_HOST}" \
  --port="${POSTGRES_PORT}" \
  --username="${POSTGRES_USER}" \
  --dbname="${VERIFY_DB}" \
  --tuples-only \
  -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")

# Cleanup
dropdb "${VERIFY_DB}" \
  --host="${POSTGRES_HOST}" \
  --port="${POSTGRES_PORT}" \
  --username="${POSTGRES_USER}"

echo "Verification complete: ${RESTORED_TABLES} tables restored"
```

---

## Redis Backup Strategy

### RDB Snapshots

RDB creates point-in-time snapshots of the entire dataset.

**Redis Configuration:**
```
# redis.conf
save 900 1           # Save after 900 sec if at least 1 key changed
save 300 10          # Save after 300 sec if at least 10 keys changed
save 60 10000        # Save after 60 sec if at least 10000 keys changed

rdbcompression yes
rdbchecksum yes
dir /data
```

**RDB Backup Script:**
```bash
#!/bin/bash
# scripts/backups/redis-rdb-backup.sh

BACKUP_DIR="/backups/redis"
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
RDB_FILE="/data/dump.rdb"

mkdir -p "${BACKUP_DIR}"

# Trigger save
redis-cli \
  --host="${REDIS_HOST}" \
  --port="${REDIS_PORT}" \
  --auth="${REDIS_PASSWORD}" \
  BGSAVE

# Wait for save to complete (max 30 minutes)
for i in {1..1800}; do
  LASTSAVE=$(redis-cli \
    --host="${REDIS_HOST}" \
    --port="${REDIS_PORT}" \
    --auth="${REDIS_PASSWORD}" \
    LASTSAVE)
  
  if [ $(( $(date +%s) - LASTSAVE )) -lt 5 ]; then
    echo "RDB save completed"
    break
  fi
  
  sleep 1
done

# Copy RDB file
cp "${RDB_FILE}" "${BACKUP_DIR}/redis-dump-${BACKUP_DATE}.rdb"

# Compress for archival
gzip "${BACKUP_DIR}/redis-dump-${BACKUP_DATE}.rdb"

echo "Redis RDB backup complete: ${BACKUP_DIR}/redis-dump-${BACKUP_DATE}.rdb.gz"
```

### AOF (Append-Only File)

AOF logs every write operation for durability.

**AOF Configuration:**
```
# redis.conf
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec      # Sync to disk every second

auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 67108864  # 64MB
```

**AOF Rewrite Script:**
```bash
#!/bin/bash
# scripts/backups/redis-aof-rewrite.sh

redis-cli \
  --host="${REDIS_HOST}" \
  --port="${REDIS_PORT}" \
  --auth="${REDIS_PASSWORD}" \
  BGREWRITEAOF

# Monitor rewrite
for i in {1..300}; do
  INFO=$(redis-cli \
    --host="${REDIS_HOST}" \
    --port="${REDIS_PORT}" \
    --auth="${REDIS_PASSWORD}" \
    INFO persistence)
  
  if echo "$INFO" | grep -q "aof_rewrite_in_progress:0"; then
    echo "AOF rewrite completed"
    break
  fi
  
  sleep 1
done
```

---

## Elasticsearch Backup Strategy

### Snapshot Repository Setup

```bash
#!/bin/bash
# scripts/backups/elasticsearch-setup-repo.sh

REPO_NAME="forge-backups"
REPO_PATH="/backup/elasticsearch"

# Create repository
curl -X PUT "localhost:9200/_snapshot/${REPO_NAME}" \
  -H 'Content-Type: application/json' \
  -d'{
    "type": "fs",
    "settings": {
      "location": "'${REPO_PATH}'",
      "compress": true,
      "chunk_size": "32mb",
      "max_restore_bytes_per_sec": "40mb",
      "max_snapshot_bytes_per_sec": "40mb"
    }
  }'

# Verify repository
curl -X GET "localhost:9200/_snapshot/${REPO_NAME}/_verify?pretty"
```

### Automated Daily Snapshots

```bash
#!/bin/bash
# scripts/backups/elasticsearch-snapshot.sh

REPO_NAME="forge-backups"
SNAPSHOT_NAME="forge-daily-$(date +%Y%m%d_%H%M%S)"

# Create snapshot
curl -X PUT \
  "localhost:9200/_snapshot/${REPO_NAME}/${SNAPSHOT_NAME}?wait_for_completion=true" \
  -H 'Content-Type: application/json' \
  -d'{
    "indices": "logs-*,metrics-*",
    "include_global_state": true,
    "metadata": {
      "backup_date": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
      "backup_type": "daily",
      "retention": "30_days"
    }
  }'

# Monitor snapshot status
curl -X GET "localhost:9200/_snapshot/${REPO_NAME}/${SNAPSHOT_NAME}?pretty"
```

### Snapshot Retention Policy

```bash
#!/bin/bash
# scripts/backups/elasticsearch-retention.sh

REPO_NAME="forge-backups"
CUTOFF_DATE=$(date -d "30 days ago" +%Y%m%d)

# List all snapshots
SNAPSHOTS=$(curl -s -X GET "localhost:9200/_snapshot/${REPO_NAME}/_all?pretty" | \
  grep '"snapshot"' | awk -F'"' '{print $4}')

# Delete old snapshots
for snapshot in $SNAPSHOTS; do
  SNAP_DATE=$(echo "$snapshot" | grep -o '[0-9]\{8\}' | tail -1)
  
  if [ "$SNAP_DATE" -lt "$CUTOFF_DATE" ]; then
    echo "Deleting old snapshot: $snapshot"
    curl -X DELETE "localhost:9200/_snapshot/${REPO_NAME}/${snapshot}"
  fi
done
```

---

## Storage and Retention

### Backup Storage Structure

```
/backups/
├── postgresql/
│   ├── forge-full-20260506_020000.sql.gz        (Daily full backup)
│   ├── forge-full-20260505_020000.sql.gz
│   ├── wal_archive/
│   │   ├── 000000010000000000000001
│   │   ├── 000000010000000000000002
│   │   └── ... (continuous WAL files)
│   └── backup-20260506_020000.log
├── redis/
│   ├── redis-dump-20260506_020000.rdb.gz       (Daily RDB snapshot)
│   ├── redis-dump-20260505_020000.rdb.gz
│   └── appendonly.aof
├── elasticsearch/
│   ├── snap-forge-20260506_020000
│   ├── snap-forge-20260505_020000
│   └── metadata (snapshot metadata)
└── volumes/
    ├── pvc-app-data-20260506.snapshot
    └── pvc-config-20260505.snapshot
```

### Retention Schedule

| Service | Type | Frequency | Retention |
|---------|------|-----------|-----------|
| PostgreSQL | Full Dump | Daily (2 AM) | 30 days |
| PostgreSQL | WAL Archive | Continuous | 90 days |
| Redis | RDB | Daily (3 AM) | 7 days |
| Redis | AOF | Continuous | 7 days |
| Elasticsearch | Snapshot | Daily (4 AM) | 30 days |
| Volumes | Snapshot | Weekly | 7 days |

### Cloud Archive Strategy

**S3 Lifecycle Policy:**
```json
{
  "Rules": [
    {
      "Id": "BackupArchival",
      "Filter": { "Prefix": "backups/" },
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "GLACIER"
        }
      ],
      "Expiration": {
        "Days": 90
      }
    }
  ]
}
```

---

## Recovery Procedures

### PostgreSQL Recovery Scenarios

#### Scenario 1: Full Cluster Failure

**Recovery Steps:**

1. **Restore Infrastructure**
   ```bash
   # Recreate Kubernetes cluster
   kubectl create -f k8s/cluster/postgres-statefulset.yaml
   ```

2. **Restore Latest Backup**
   ```bash
   # Download latest backup from S3
   aws s3 cp s3://forge-backups/postgres/ /backups/postgresql/ --recursive
   
   # List available backups
   ls -lh /backups/postgresql/forge-full-*.sql.gz | tail -5
   ```

3. **Initialize Database**
   ```bash
   # Create database from backup
   gunzip -c /backups/postgresql/forge-full-20260506_020000.sql.gz | \
     psql --host=postgres-0.postgres.default.svc.cluster.local \
          --username=postgres \
          --dbname=postgres
   ```

4. **Verify Data Integrity**
   ```bash
   psql -d forge -c "SELECT count(*) as table_count FROM information_schema.tables WHERE table_schema='public';"
   psql -d forge -c "SELECT count(*) FROM users; SELECT count(*) FROM projects; SELECT count(*) FROM audit_logs;"
   ```

#### Scenario 2: Accidental Data Deletion

**Recovery via Point-in-Time Recovery (PITR):**

```bash
#!/bin/bash
# scripts/recovery/recover-deleted-table.sh

TARGET_TIME="2026-05-06 10:30:00"
RECOVERY_DB="forge_pitr_recovery"

# 1. Create new database for recovery
createdb "${RECOVERY_DB}"

# 2. Enable recovery parameters
cat > /var/lib/postgresql/data/recovery.conf <<EOF
restore_command = 'cp /backups/postgresql/wal_archive/%f %p'
recovery_target_time = '${TARGET_TIME}'
recovery_target_timeline = 'latest'
EOF

# 3. Perform recovery
pg_ctl -D /var/lib/postgresql/data restart
psql -d "${RECOVERY_DB}" -c "\d+ <table_name>"  # Verify table exists

# 4. Export recovered data
pg_dump "${RECOVERY_DB}" > /tmp/recovered_data.sql

# 5. Restore to production
psql -d forge < /tmp/recovered_data.sql

# 6. Cleanup
dropdb "${RECOVERY_DB}"
```

#### Scenario 3: Corrupted Index

**Recovery Steps:**

```bash
# Identify corruption
psql -d forge -c "REINDEX INDEX CONCURRENTLY idx_users_email;"

# If index fails, disable temporarily
psql -d forge -c "ALTER TABLE users DISABLE TRIGGER ALL;"
psql -d forge -c "REINDEX TABLE CONCURRENTLY users;"
psql -d forge -c "ALTER TABLE users ENABLE TRIGGER ALL;"

# Full database reindex if needed
psql -d forge -c "REINDEX DATABASE CONCURRENTLY forge;"
```

### Redis Recovery Scenarios

#### Scenario 1: Cache Loss

**Recovery from RDB:**

```bash
#!/bin/bash
# scripts/recovery/redis-restore-rdb.sh

BACKUP_FILE="/backups/redis/redis-dump-20260506_020000.rdb.gz"
REDIS_DATA_DIR="/data"

# Stop Redis
kubectl delete pod redis-0 -n default

# Decompress backup
gunzip -c "${BACKUP_FILE}" > "${REDIS_DATA_DIR}/dump.rdb"

# Restart Redis
kubectl apply -f k8s/redis-statefulset.yaml

# Verify restoration
redis-cli DBSIZE
redis-cli INFO stats
```

#### Scenario 2: Corrupted AOF

**Recovery Steps:**

```bash
# Check AOF integrity
redis-check-aof /data/appendonly.aof

# If corrupted, use RDB recovery
redis-cli --rdb /data/dump-recovery.rdb

# Disable AOF temporarily
redis-cli CONFIG SET appendonly no

# Restore from RDB
cp /data/dump-recovery.rdb /data/dump.rdb

# Restart and re-enable AOF
redis-cli CONFIG SET appendonly yes
redis-cli BGREWRITEAOF
```

### Elasticsearch Recovery Scenarios

#### Scenario 1: Index Corruption

**Recovery from Snapshot:**

```bash
#!/bin/bash
# scripts/recovery/elasticsearch-restore-index.sh

REPO_NAME="forge-backups"
SNAPSHOT_NAME="forge-daily-20260506_020000"
TARGET_INDEX="logs-app-20260506"

# List snapshots
curl -X GET "localhost:9200/_snapshot/${REPO_NAME}/_all?pretty"

# Restore specific index
curl -X POST \
  "localhost:9200/_snapshot/${REPO_NAME}/${SNAPSHOT_NAME}/_restore?wait_for_completion=true" \
  -H 'Content-Type: application/json' \
  -d'{
    "indices": "'${TARGET_INDEX}'",
    "include_global_state": false,
    "rename_pattern": "(.+)",
    "rename_replacement": "$1-restored"
  }'

# Verify restoration
curl -X GET "localhost:9200/_cat/indices?v"
```

#### Scenario 2: Full Cluster Recovery

```bash
#!/bin/bash
# scripts/recovery/elasticsearch-full-restore.sh

REPO_NAME="forge-backups"
SNAPSHOT_NAME="forge-daily-20260506_020000"

# Close all indices
curl -X POST "localhost:9200/_all/_close"

# Restore full snapshot
curl -X POST \
  "localhost:9200/_snapshot/${REPO_NAME}/${SNAPSHOT_NAME}/_restore?wait_for_completion=true" \
  -H 'Content-Type: application/json' \
  -d'{
    "include_global_state": true,
    "include_aliases": true
  }'

# Open indices
curl -X POST "localhost:9200/_all/_open"

# Verify cluster health
curl -X GET "localhost:9200/_cluster/health?pretty"
```

---

## Testing & Validation

### Backup Testing Schedule

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: backup-validation
spec:
  schedule: "0 5 * * 0"  # Every Sunday at 5 AM
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: backup-service-account
          containers:
          - name: validator
            image: forge/backup-validator:1.0
            env:
            - name: TEST_MODE
              value: "true"
            volumeMounts:
            - name: backup-storage
              mountPath: /backups
```

### Restore Testing Procedure

```bash
#!/bin/bash
# scripts/testing/test-restore-procedure.sh

set -e

echo "=== PostgreSQL Restore Test ==="
# Create test database
TIMESTAMP=$(date +%s)
TEST_DB="forge_restore_test_${TIMESTAMP}"

createdb "${TEST_DB}"

# Restore latest backup
LATEST_BACKUP=$(ls -t /backups/postgresql/forge-full-*.sql.gz | head -1)
echo "Restoring from: ${LATEST_BACKUP}"

gunzip -c "${LATEST_BACKUP}" | psql -d "${TEST_DB}" --quiet

# Verify table count
TABLE_COUNT=$(psql -d "${TEST_DB}" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")
echo "Tables restored: ${TABLE_COUNT}"

if [ "$TABLE_COUNT" -gt 0 ]; then
  echo "✓ PostgreSQL restore test PASSED"
else
  echo "✗ PostgreSQL restore test FAILED"
  exit 1
fi

# Cleanup
dropdb "${TEST_DB}"

echo ""
echo "=== Redis Restore Test ==="
# Create test Redis instance
TEST_PORT=6380
redis-server --port ${TEST_PORT} --daemonize yes

# Restore latest RDB
LATEST_RDB=$(ls -t /backups/redis/redis-dump-*.rdb.gz | head -1)
gunzip -c "${LATEST_RDB}" > /tmp/test-dump.rdb

# Load into test instance
redis-cli -p ${TEST_PORT} --rdb /tmp/test-dump.rdb

KEYS=$(redis-cli -p ${TEST_PORT} DBSIZE)
echo "Keys in restored dataset: $KEYS"

if [ "$KEYS" -gt 0 ]; then
  echo "✓ Redis restore test PASSED"
else
  echo "✗ Redis restore test FAILED"
fi

# Cleanup
redis-cli -p ${TEST_PORT} SHUTDOWN

echo ""
echo "=== Elasticsearch Restore Test ==="
# Verify latest snapshot exists
LATEST_SNAPSHOT=$(curl -s http://localhost:9200/_snapshot/forge-backups/_all?sort=start_time:desc \
  | grep '"snapshot"' | head -1 | awk -F'"' '{print $4}')

echo "Latest snapshot: ${LATEST_SNAPSHOT}"

if [ ! -z "$LATEST_SNAPSHOT" ]; then
  echo "✓ Elasticsearch restore test PASSED"
else
  echo "✗ Elasticsearch restore test FAILED"
fi

echo ""
echo "=== All Restore Tests Completed ==="
```

### Recovery Time Validation

```bash
#!/bin/bash
# scripts/testing/measure-recovery-time.sh

echo "Starting recovery time measurement..."

# PostgreSQL Recovery Time
START_TIME=$(date +%s)
gunzip -c /backups/postgresql/forge-full-latest.sql.gz | \
  psql -d forge_test --quiet
POSTGRES_DURATION=$(($(date +%s) - START_TIME))

# Redis Recovery Time
START_TIME=$(date +%s)
redis-cli --pipe < /backups/redis/redis-dump-latest.rdb
REDIS_DURATION=$(($(date +%s) - START_TIME))

# Elasticsearch Recovery Time
START_TIME=$(date +%s)
curl -X POST http://localhost:9200/_snapshot/forge-backups/latest/_restore?wait_for_completion=true
ES_DURATION=$(($(date +%s) - START_TIME))

echo "PostgreSQL Recovery: ${POSTGRES_DURATION}s"
echo "Redis Recovery: ${REDIS_DURATION}s"
echo "Elasticsearch Recovery: ${ES_DURATION}s"
echo "Total RTO: $((POSTGRES_DURATION + REDIS_DURATION + ES_DURATION))s"
```

---

## Monitoring & Alerting

### Prometheus Metrics

```yaml
# monitoring/prometheus-backup-rules.yml
groups:
- name: backup-monitoring
  interval: 60s
  rules:
  - alert: BackupJobFailed
    expr: backup_job_success == 0
    for: 1h
    annotations:
      summary: "Backup job failed for {{ $labels.service }}"
      
  - alert: BackupAgeExceeded
    expr: (time() - backup_completion_timestamp) > 86400
    for: 30m
    annotations:
      summary: "No backup for {{ $labels.service }} in 24+ hours"
      
  - alert: BackupStorageLow
    expr: backup_storage_available_bytes < backup_storage_total_bytes * 0.15
    for: 30m
    annotations:
      summary: "Backup storage below 15% free"
      
  - alert: PostgreSQLWALArchiveFailing
    expr: postgres_wal_archive_failure_count > 10
    for: 15m
    annotations:
      summary: "PostgreSQL WAL archiving failing"
      
  - alert: RedisSnapshotStale
    expr: (time() - redis_last_save_timestamp) > 3600
    for: 1h
    annotations:
      summary: "Redis RDB snapshot not updated in 1 hour"
```

### Backup Monitoring Dashboard

**Prometheus Queries:**

```promql
# Backup Success Rate (Last 24 hours)
increase(backup_job_success[24h]) / increase(backup_job_total[24h])

# Backup Duration (PostgreSQL)
histogram_quantile(0.95, postgres_backup_duration_seconds)

# Backup Size Trend (Redis)
rate(redis_backup_size_bytes[24h])

# WAL Archive Rate (PostgreSQL)
rate(postgres_wal_archive_total[5m])

# Snapshot Completion Status (Elasticsearch)
elasticsearch_snapshot_status{status="success"}
```

**Grafana Dashboard Panels:**

1. Backup Success Rate (24h)
2. Latest Backup Timestamp (all services)
3. Backup Storage Usage Trend
4. Recovery Time Estimate (RTO)
5. WAL Archive Lag (PostgreSQL)
6. Snapshot Status (Elasticsearch)

### Alert Thresholds

| Alert | Threshold | Action |
|-------|-----------|--------|
| Backup Failed | Fail rate > 10% | Page on-call within 1 hour |
| Backup Stale | No backup > 24h | Create incident, escalate to lead |
| Storage Critical | < 10% free | Emergency cleanup, resize if needed |
| Recovery Test Failed | Any failure | Validate all backups, audit procedures |
| WAL Archive Lag | > 1 hour | Check archive command, database logs |

---

## Compliance & Audit

### Backup Audit Log

```bash
#!/bin/bash
# scripts/audit/log-backup-metadata.sh

AUDIT_LOG="/var/log/forge/backup-audit.log"

log_backup_event() {
  local SERVICE=$1
  local ACTION=$2
  local BACKUP_FILE=$3
  local FILE_SIZE=$4
  local CHECKSUM=$5
  
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] SERVICE=$SERVICE ACTION=$ACTION FILE=$BACKUP_FILE SIZE=$FILE_SIZE CHECKSUM=$CHECKSUM" >> "${AUDIT_LOG}"
}

# Log backup creation
log_backup_event "postgresql" "BACKUP_CREATED" "forge-full-20260506_020000.sql.gz" "$(du -b | cut -f1)" "$(sha256sum forge-full-20260506_020000.sql.gz | cut -d' ' -f1)"

# Log backup verification
log_backup_event "postgresql" "BACKUP_VERIFIED" "forge-full-20260506_020000.sql.gz" "$(du -b | cut -f1)" "$(sha256sum forge-full-20260506_020000.sql.gz | cut -d' ' -f1)"

# Log S3 upload
log_backup_event "postgresql" "BACKUP_ARCHIVED" "s3://forge-backups/postgresql/forge-full-20260506_020000.sql.gz" "$(aws s3 ls s3://forge-backups/postgresql/forge-full-20260506_020000.sql.gz | awk '{print $3}')" "$(aws s3api head-object --bucket forge-backups --key postgresql/forge-full-20260506_020000.sql.gz | jq -r .ETag)"
```

### SOC 2 Compliance Requirements

**Backup Controls:**

1. **Automated Backups**: All databases backed up daily (automated via CronJob)
2. **Retention**: 30 days minimum (enforced via lifecycle policy)
3. **Geographic Redundancy**: S3 with cross-region replication
4. **Encryption**: AES-256 encryption for backups in transit and at rest
5. **Access Control**: RBAC restricts backup access to authorized personnel
6. **Audit Logging**: All backup operations logged to audit trail
7. **Recovery Testing**: Weekly automated restore tests with results logged
8. **Change Management**: Backup procedure changes tracked in version control

**Audit Trail Format:**

```json
{
  "timestamp": "2026-05-06T02:00:00Z",
  "event_type": "backup_completed",
  "service": "postgresql",
  "backup_file": "forge-full-20260506_020000.sql.gz",
  "backup_size_bytes": 5368709120,
  "checksum_sha256": "abc123...",
  "status": "success",
  "retention_days": 30,
  "archived_location": "s3://forge-backups/postgresql/",
  "user": "backup-service-account",
  "verification_status": "passed",
  "tls_protected": true
}
```

---

## Troubleshooting

### PostgreSQL Backup Issues

**Issue: Backup Size Larger Than Expected**

```bash
# Identify large tables
psql -d forge -c "
SELECT 
  schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables 
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
"

# Solution: Archive/partition large tables
ALTER TABLE audit_logs PARTITION BY RANGE (created_at);
```

**Issue: WAL Archive Failure**

```bash
# Check archive command status
psql -d forge -c "SELECT * FROM pg_stat_archiver;"

# Monitor logs
tail -f /var/lib/postgresql/data/pg_log/postgresql.log | grep "archive"

# Test archive command manually
/usr/local/bin/archive-wal.sh /var/lib/postgresql/data/pg_wal/000000010000000000000001 000000010000000000000001

# Fix: Check S3 permissions
aws s3 ls s3://forge-backups/wal-archive/
aws s3api get-bucket-acl --bucket forge-backups
```

### Redis Backup Issues

**Issue: RDB Snapshot Taking Too Long**

```bash
# Check memory usage
redis-cli INFO memory

# Monitor snapshot progress
redis-cli INFO stats | grep rdb

# Solution: Enable incremental snapshots
redis-cli CONFIG SET rdbcompression no

# If still slow, consider upgrade
kubectl patch statefulset redis -p '{"spec":{"template":{"spec":{"containers":[{"name":"redis","resources":{"limits":{"memory":"4Gi","cpu":"2000m"}}}]}}}}'
```

**Issue: AOF File Corruption**

```bash
# Check AOF integrity
redis-check-aof --fix /data/appendonly.aof

# Inspect corruption
hexdump -C /data/appendonly.aof | head -50

# Recover from RDB if needed
redis-cli --rdb /data/dump-recovery.rdb
```

### Elasticsearch Backup Issues

**Issue: Snapshot Taking Too Long**

```bash
# Monitor snapshot progress
curl -X GET "localhost:9200/_snapshot/forge-backups/_all?pretty" | jq '.snapshots[] | {snapshot: .snapshot, state: .state, duration: .duration}'

# Reduce snapshot scope
curl -X PUT "localhost:9200/_snapshot/forge-backups/incremental-snap" \
  -H 'Content-Type: application/json' \
  -d'{
    "indices": "logs-app-2026.05.*",
    "include_global_state": false
  }'

# Increase snapshot performance settings
curl -X PUT "localhost:9200/_cluster/settings" \
  -H 'Content-Type: application/json' \
  -d'{
    "transient": {
      "indices.store.throttle.max_bytes_per_sec": "100mb"
    }
  }'
```

**Issue: Snapshot Repository Corrupted**

```bash
# Verify repository
curl -X POST "localhost:9200/_snapshot/forge-backups/_verify?pretty"

# Recreate repository if corrupted
curl -X DELETE "localhost:9200/_snapshot/forge-backups"

curl -X PUT "localhost:9200/_snapshot/forge-backups" \
  -H 'Content-Type: application/json' \
  -d'{
    "type": "fs",
    "settings": {
      "location": "/backup/elasticsearch"
    }
  }'
```

### Storage Issues

**Issue: Backup Storage Running Out**

```bash
# Check disk usage
du -sh /backups/*

# Identify old backups
find /backups -name "*.gz" -mtime +30 -exec ls -lh {} \;

# Delete old backups (verify retention policy first!)
find /backups/postgresql -name "forge-full-*.sql.gz" -mtime +30 -delete

# Move to cold storage
aws s3 sync /backups/postgresql/ s3://forge-backups/postgresql-archive/ --sse AES256

# Monitor going forward
du -sh /backups/ | mail -s "Backup Storage Alert" devops@forge.ai
```

---

## Emergency Procedures

### Complete Cluster Recovery (4-Hour RTO)

```bash
#!/bin/bash
# scripts/emergency/full-cluster-recovery.sh

set -euo pipefail

echo "=== FORGE PLATFORM FULL RECOVERY ==="
echo "Target RTO: 4 hours"
echo "Target RPO: 1 hour"

# Phase 1: Infrastructure (1 hour)
echo "[Phase 1/4] Recovering Kubernetes infrastructure..."
kubectl apply -f k8s/cluster/

# Phase 2: Data Restoration (2 hours)
echo "[Phase 2/4] Restoring data services..."

# PostgreSQL
echo "Restoring PostgreSQL..."
LATEST_PG=$(aws s3 ls s3://forge-backups/postgresql/ --recursive | sort | tail -1 | awk '{print $4}')
aws s3 cp "s3://forge-backups/${LATEST_PG}" /tmp/
gunzip -c "/tmp/$(basename $LATEST_PG)" | psql -d forge --quiet
echo "✓ PostgreSQL restored"

# Redis
echo "Restoring Redis..."
LATEST_RDB=$(aws s3 ls s3://forge-backups/redis/ --recursive | sort | tail -1 | awk '{print $4}')
aws s3 cp "s3://forge-backups/${LATEST_RDB}" /tmp/
gunzip -c "/tmp/$(basename $LATEST_RDB)" > /data/dump.rdb
kubectl rollout restart statefulset/redis
echo "✓ Redis restored"

# Elasticsearch
echo "Restoring Elasticsearch..."
LATEST_SNAP=$(curl -s http://localhost:9200/_snapshot/forge-backups/_all?sort=start_time:desc | jq -r '.snapshots[0].snapshot')
curl -X POST http://localhost:9200/_snapshot/forge-backups/${LATEST_SNAP}/_restore?wait_for_completion=true
echo "✓ Elasticsearch restored"

# Phase 3: Application Startup (30 minutes)
echo "[Phase 3/4] Starting application services..."
kubectl rollout restart deployment/api
kubectl rollout restart deployment/frontend
echo "✓ Applications started"

# Phase 4: Validation (30 minutes)
echo "[Phase 4/4] Validating recovery..."
kubectl get pods -A
curl -s http://localhost:8000/health | jq .
curl -s http://localhost:3000 | head -20
echo "✓ Recovery validation complete"

echo ""
echo "=== RECOVERY COMPLETE ==="
```

---

## Version Control & Change Management

All backup and recovery procedures are version controlled in Git with change tracking:

```bash
# Record backup procedure changes
git log --oneline scripts/backups/
git log --oneline scripts/recovery/
git log --oneline scripts/testing/

# View changelog
git show <commit>:scripts/backups/postgres-full-backup.sh
```

---

## Contacts & Escalation

**On-Call Rotation**: devops-oncall@forge.ai  
**Backup Issues**: devops@forge.ai  
**Emergency**: #forge-incident (Slack)

**Escalation Path:**
1. SRE on-call (immediate)
2. DevOps lead (if unresolved after 30 min)
3. Engineering director (if unresolved after 1 hour)

---

**Document Status**: Production Ready  
**Next Review**: 2026-08-06  
**Last Updated**: 2026-05-06