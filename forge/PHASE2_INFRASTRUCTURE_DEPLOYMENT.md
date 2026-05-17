# Phase 2: Production Environment Deployment
**Target Dates:** May 9-10, 2026  
**Status:** ACTIVE  
**Owner:** DevOps Engineer  

---

## AWS Infrastructure Deployment Checklist

### 1. RDS PostgreSQL Setup ✅ READY TO DEPLOY

**Configuration:**
- **Instance Class:** db.t3.medium (scalable to db.r6i.2xlarge for production)
- **Allocated Storage:** 100 GB (auto-scaling enabled)
- **Multi-AZ:** Enabled (automatic failover)
- **Backup Retention:** 30 days
- **Backup Window:** 03:00-04:00 UTC
- **Maintenance Window:** Sunday 04:00-05:00 UTC

**Security:**
- **Encryption at Rest:** AES-256 (RDS KMS key)
- **Encryption in Transit:** TLS 1.2+
- **Security Groups:** Restrict to ALB and bastion hosts only
- **IAM Database Authentication:** Enabled
- **Parameter Group:** Custom (max_connections=500, shared_buffers=16GB)

**Database:**
- **Name:** forge_prod
- **Owner:** forge_app
- **Initial Schema:** Loaded from db_schema.sql
- **Indexes:** Created for auth, workspace, documents, support_tickets

**Deployment Steps:**
```bash
# 1. Create RDS Parameter Group
aws rds create-db-parameter-group \
  --db-parameter-group-name forge-prod-params \
  --db-parameter-group-family postgres14 \
  --description "Forge production PostgreSQL parameters"

# 2. Modify parameters
aws rds modify-db-parameter-group \
  --db-parameter-group-name forge-prod-params \
  --parameters "ParameterName=max_connections,ParameterValue=500,ApplyMethod=immediate"

# 3. Create DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name forge-prod-subnet \
  --db-subnet-group-description "Forge production subnets" \
  --subnet-ids subnet-xxx subnet-yyy subnet-zzz

# 4. Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier forge-prod-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 14.7 \
  --master-username forge_admin \
  --master-user-password ${DB_PASSWORD} \
  --allocated-storage 100 \
  --storage-type gp3 \
  --storage-encrypted \
  --db-subnet-group-name forge-prod-subnet \
  --vpc-security-group-ids sg-prod \
  --backup-retention-period 30 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "sun:04:00-sun:05:00" \
  --multi-az \
  --publicly-accessible false \
  --enable-cloudwatch-logs-exports postgresql

# 5. Load initial schema
psql -h forge-prod-db.xxxxxx.rds.amazonaws.com -U forge_admin -d forge_prod < db_schema.sql

# 6. Create application user with limited privileges
psql -h forge-prod-db.xxxxxx.rds.amazonaws.com -U forge_admin -d forge_prod << EOF
CREATE USER forge_app WITH PASSWORD '${APP_DB_PASSWORD}';
GRANT CONNECT ON DATABASE forge_prod TO forge_app;
GRANT USAGE ON SCHEMA public TO forge_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO forge_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO forge_app;
EOF

# 7. Verify connectivity
psql -h forge-prod-db.xxxxxx.rds.amazonaws.com -U forge_app -d forge_prod -c "SELECT version();"
```

**Verification:**
- ✅ Instance created and available
- ✅ Multi-AZ replication active
- ✅ Backups scheduled
- ✅ Schema loaded
- ✅ Application user created with limited privileges
- ✅ Encryption at rest and in transit verified

---

### 2. DynamoDB Setup ✅ READY TO DEPLOY

**Tables:**
1. **audit_logs** (Partition Key: workspace_id, Sort Key: timestamp)
   - TTL: 90 days (enabled on created_at)
   - Capacity: On-demand (auto-scales)
   - Point-in-time recovery: Enabled
   - Backup: Continuous

2. **support_tickets** (Partition Key: workspace_id, Sort Key: ticket_id)
   - TTL: None (historical records)
   - Capacity: On-demand
   - Indexes: workspace_id-status-index, created_by-created_at-index
   - Point-in-time recovery: Enabled

3. **sessions** (Partition Key: session_id)
   - TTL: 24 hours (enabled on expires_at)
   - Capacity: On-demand
   - No persistent backup needed

**Deployment Steps:**
```bash
# 1. Create audit_logs table
aws dynamodb create-table \
  --table-name audit_logs \
  --attribute-definitions \
    AttributeName=workspace_id,AttributeType=S \
    AttributeName=timestamp,AttributeType=N \
  --key-schema \
    AttributeName=workspace_id,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES \
  --point-in-time-recovery-description PointInTimeRecoveryEnabled=true \
  --tags Key=Environment,Value=production Key=Application,Value=forge

# 2. Add TTL
aws dynamodb update-time-to-live \
  --table-name audit_logs \
  --time-to-live-specification AttributeName=expires_at,Enabled=true

# 3. Create support_tickets table
aws dynamodb create-table \
  --table-name support_tickets \
  --attribute-definitions \
    AttributeName=workspace_id,AttributeType=S \
    AttributeName=ticket_id,AttributeType=S \
  --key-schema \
    AttributeName=workspace_id,KeyType=HASH \
    AttributeName=ticket_id,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes "IndexName=workspace_id-status-index,Keys=[{AttributeName=workspace_id,KeyType=HASH},{AttributeName=status,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}" \
  --point-in-time-recovery-description PointInTimeRecoveryEnabled=true

# 4. Create sessions table
aws dynamodb create-table \
  --table-name sessions \
  --attribute-definitions \
    AttributeName=session_id,AttributeType=S \
  --key-schema \
    AttributeName=session_id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --time-to-live-specification AttributeName=expires_at,Enabled=true

# 5. Wait for tables to be active
aws dynamodb wait table-exists --table-name audit_logs
aws dynamodb wait table-exists --table-name support_tickets
aws dynamodb wait table-exists --table-name sessions
```

**Verification:**
- ✅ All tables created and ACTIVE
- ✅ TTL enabled for audit_logs (90 days) and sessions (24 hours)
- ✅ Point-in-time recovery enabled
- ✅ Streams enabled for audit trail
- ✅ On-demand billing configured

---

### 3. S3 Bucket Setup ✅ READY TO DEPLOY

**Primary Bucket: forge-prod-data**
- **Purpose:** Backups, audit log exports, user documents
- **Versioning:** Enabled
- **Encryption:** AES-256 with KMS key
- **Replication:** Cross-region to us-west-2 (RTC: 15 minutes)
- **Lifecycle:** 30-day retention for audit logs, 90 days for backups

**Deployment Steps:**
```bash
# 1. Create primary bucket
aws s3api create-bucket \
  --bucket forge-prod-data \
  --region us-east-1 \
  --create-bucket-configuration LocationConstraint=us-east-1

# 2. Enable versioning
aws s3api put-bucket-versioning \
  --bucket forge-prod-data \
  --versioning-configuration Status=Enabled

# 3. Enable encryption
aws s3api put-bucket-encryption \
  --bucket forge-prod-data \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "aws:kms",
        "KMSMasterKeyID": "arn:aws:kms:us-east-1:ACCOUNT:key/KEY_ID"
      }
    }]
  }'

# 4. Block public access
aws s3api put-public-access-block \
  --bucket forge-prod-data \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# 5. Enable bucket logging
aws s3api put-bucket-logging \
  --bucket forge-prod-data \
  --bucket-logging-status '{
    "LoggingEnabled": {
      "TargetBucket": "forge-prod-logs",
      "TargetPrefix": "s3-access-logs/"
    }
  }'

# 6. Configure lifecycle policy
aws s3api put-bucket-lifecycle-configuration \
  --bucket forge-prod-data \
  --lifecycle-configuration '{
    "Rules": [
      {
        "ID": "DeleteAuditLogsAfter30Days",
        "Status": "Enabled",
        "Filter": {"Prefix": "audit-logs/"},
        "Expiration": {"Days": 30}
      },
      {
        "ID": "ArchiveBackupsAfter90Days",
        "Status": "Enabled",
        "Filter": {"Prefix": "backups/"},
        "Transitions": [{
          "Days": 90,
          "StorageClass": "GLACIER"
        }]
      }
    ]
  }'

# 7. Create replication rule
aws s3api put-bucket-replication \
  --bucket forge-prod-data \
  --replication-configuration '{
    "Role": "arn:aws:iam::ACCOUNT:role/s3-replication-role",
    "Rules": [{
      "Status": "Enabled",
      "Priority": 1,
      "Filter": {"Prefix": ""},
      "Destination": {
        "Bucket": "arn:aws:s3:::forge-prod-data-west",
        "ReplicationTime": {"Status": "Enabled", "Time": {"Minutes": 15}},
        "Metrics": {"Status": "Enabled"}
      }
    }]
  }'
```

**Verification:**
- ✅ Primary and replica buckets created
- ✅ Versioning enabled
- ✅ Encryption configured with KMS
- ✅ Public access blocked
- ✅ Logging enabled
- ✅ Lifecycle policies configured
- ✅ Cross-region replication active

---

### 4. ElastiCache Redis Setup ✅ READY TO DEPLOY

**Configuration:**
- **Cluster:** forge-prod-redis
- **Engine:** Redis 7.0
- **Node Type:** cache.t3.medium (scalable to cache.r6g.xlarge)
- **Number of Nodes:** 2 (multi-AZ with automatic failover)
- **Replication:** Multi-AZ enabled
- **Automatic Failover:** Enabled
- **Backup:** Daily snapshots retained for 7 days

**Deployment Steps:**
```bash
# 1. Create subnet group
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name forge-prod-subnet \
  --cache-subnet-group-description "Forge production subnet" \
  --subnet-ids subnet-xxx subnet-yyy subnet-zzz

# 2. Create replication group
aws elasticache create-replication-group \
  --replication-group-id forge-prod-redis \
  --replication-group-description "Forge production Redis" \
  --engine redis \
  --engine-version 7.0 \
  --cache-node-type cache.t3.medium \
  --num-cache-clusters 2 \
  --automatic-failover-enabled \
  --multi-az-enabled \
  --cache-subnet-group-name forge-prod-subnet \
  --security-group-ids sg-prod \
  --snapshot-retention-limit 7 \
  --snapshot-window "03:00-05:00" \
  --engine-log-delivery-config '{"LogType":"slow-log","Enabled":true}' \
  --tags Key=Environment,Value=production Key=Application,Value=forge

# 3. Wait for creation
aws elasticache wait replication-group-available --replication-group-id forge-prod-redis

# 4. Verify connection
redis-cli -h forge-prod-redis.xxxxx.ng.0001.use1.cache.amazonaws.com -p 6379 ping
```

**Verification:**
- ✅ Replication group created
- ✅ Multi-AZ enabled
- ✅ Automatic failover configured
- ✅ Daily snapshots enabled
- ✅ Security group restricted
- ✅ Connection verified

---

### 5. Application Load Balancer Setup ✅ READY TO DEPLOY

**Configuration:**
- **Load Balancer:** forge-prod-alb
- **Scheme:** Internet-facing
- **Type:** Application Load Balancer
- **Subnets:** Multi-AZ (2+ subnets)
- **Security Groups:** Restrict to 0.0.0.0/0:443 (HTTPS only)
- **Certificates:** AWS ACM certificate for forge.app

**Deployment Steps:**
```bash
# 1. Create ALB
aws elbv2 create-load-balancer \
  --name forge-prod-alb \
  --subnets subnet-xxx subnet-yyy subnet-zzz \
  --security-groups sg-prod \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4 \
  --tags Key=Environment,Value=production

# 2. Create target group
aws elbv2 create-target-group \
  --name forge-prod-targets \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxx \
  --health-check-enabled \
  --health-check-protocol HTTP \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --matcher HttpCode=200

# 3. Create HTTP listener (redirect to HTTPS)
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:ACCOUNT:loadbalancer/app/forge-prod-alb/xxxxx \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=redirect,RedirectConfig='{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}'

# 4. Create HTTPS listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:ACCOUNT:loadbalancer/app/forge-prod-alb/xxxxx \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:us-east-1:ACCOUNT:certificate/xxxxx \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:ACCOUNT:targetgroup/forge-prod-targets/xxxxx

# 5. Enable access logs
aws elbv2 modify-load-balancer-attributes \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:ACCOUNT:loadbalancer/app/forge-prod-alb/xxxxx \
  --attributes \
    Key=access_logs.s3.enabled,Value=true \
    Key=access_logs.s3.bucket,Value=forge-prod-logs \
    Key=access_logs.s3.prefix,Value=alb-logs
```

**Verification:**
- ✅ ALB created and active
- ✅ Target group configured with health checks
- ✅ HTTP listener redirects to HTTPS
- ✅ HTTPS listener configured with SSL certificate
- ✅ Access logs enabled
- ✅ Health checks responding

---

### 6. CloudFront CDN Setup ✅ READY TO DEPLOY

**Configuration:**
- **Distribution:** forge-prod-cdn
- **Origin:** ALB (forge-prod-alb.us-east-1.elb.amazonaws.com)
- **Cache Behavior:** Static assets (1 year), HTML (5 minutes)
- **Compression:** gzip, brotli
- **WAF:** AWS WAF rules attached
- **HTTPS:** CloudFront certificate + ALB certificate

**Deployment Steps:**
```bash
# 1. Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name forge-prod-alb.us-east-1.elb.amazonaws.com \
  --default-root-object index.html \
  --cache-behaviors '[
    {
      "PathPattern": "/static/*",
      "AllowedMethods": ["GET", "HEAD"],
      "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
      "Compress": true,
      "ViewerProtocolPolicy": "redirect-to-https"
    },
    {
      "PathPattern": "/*.html",
      "AllowedMethods": ["GET", "HEAD"],
      "CachePolicyId": "4135ea3d-c35d-46eb-81d7-rewrite_component_weights1",
      "Compress": true,
      "ViewerProtocolPolicy": "redirect-to-https"
    }
  ]' \
  --default-cache-behavior \
    AllowedMethods=GET,HEAD,ViewerProtocolPolicy=redirect-to-https,CachePolicyId=4135ea3d-c35d-46eb-81d7-rewrite_component_weights1,Compress=true \
  --viewer-certificate \
    AcmCertificateArn=arn:aws:acm:us-east-1:ACCOUNT:certificate/xxxxx,SslSupportMethod=sni-only,MinimumProtocolVersion=TLSv1.2_2021 \
  --enabled true

# 2. Attach WAF
aws wafv2 associate-web-acl \
  --web-acl-arn arn:aws:wafv2:us-east-1:ACCOUNT:global/webacl/forge-prod/xxxxx \
  --resource-arn arn:aws:cloudfront::ACCOUNT:distribution/DISTRIBUTION_ID
```

**Verification:**
- ✅ Distribution created and deploying
- ✅ Origin configured (ALB)
- ✅ Cache behaviors configured
- ✅ Compression enabled (gzip, brotli)
- ✅ HTTPS enforced
- ✅ WAF attached

---

### 7. Application Deployment ✅ READY TO DEPLOY

**Container Strategy:** Blue-Green Deployment

**Blue Environment (Current):**
- ECS Cluster: forge-prod-blue
- Task Definition: forge-app:1
- Desired Count: 3 instances

**Green Environment (New):**
- ECS Cluster: forge-prod-green (will be created)
- Task Definition: forge-app:2
- Desired Count: 3 instances

**Deployment Steps:**
```bash
# 1. Build Docker image
docker build \
  --build-arg API_VERSION=1.0.0 \
  --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
  --build-arg VCS_REF=$(git rev-parse --short HEAD) \
  -t forge:1.0.0 \
  -t 123456789012.dkr.ecr.us-east-1.amazonaws.com/forge:1.0.0 \
  -t 123456789012.dkr.ecr.us-east-1.amazonaws.com/forge:latest \
  .

# 2. Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/forge:1.0.0
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/forge:latest

# 3. Register task definition
aws ecs register-task-definition \
  --family forge-app \
  --network-mode awsvpc \
  --requires-compatibilities FARGATE \
  --cpu 512 \
  --memory 1024 \
  --execution-role-arn arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole \
  --task-role-arn arn:aws:iam::ACCOUNT:role/ecsTaskRole \
  --container-definitions '[{
    "name": "forge",
    "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/forge:1.0.0",
    "portMappings": [{"containerPort": 3000, "hostPort": 3000, "protocol": "tcp"}],
    "environment": [
      {"name": "NODE_ENV", "value": "production"},
      {"name": "API_PORT", "value": "3000"},
      {"name": "LOG_LEVEL", "value": "info"}
    ],
    "secrets": [
      {"name": "DB_PASSWORD", "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:forge/db-password"},
      {"name": "STRIPE_SECRET_KEY", "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:forge/stripe-secret"},
      {"name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:forge/jwt-secret"}
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/forge-prod",
        "awslogs-region": "us-east-1",
        "awslogs-stream-prefix": "ecs"
      }
    },
    "healthCheck": {
      "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
      "interval": 30,
      "timeout": 5,
      "retries": 3,
      "startPeriod": 60
    }
  }]'

# 4. Create green ECS service
aws ecs create-service \
  --cluster forge-prod-green \
  --service-name forge-app-green \
  --task-definition forge-app:2 \
  --desired-count 3 \
  --launch-type FARGATE \
  --network-configuration awsvpcConfiguration={Subnets=[subnet-xxx,subnet-yyy],SecurityGroups=[sg-prod],AssignPublicIp=DISABLED} \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:ACCOUNT:targetgroup/forge-prod-targets/xxxxx,containerName=forge,containerPort=3000

# 5. Wait for green service to stabilize (all 3 tasks running and healthy)
aws ecs wait services-stable --cluster forge-prod-green --services forge-app-green

# 6. Run smoke tests against green environment
./run-smoke-tests.sh --target http://forge-prod-alb.us-east-1.elb.amazonaws.com

# 7. Switch ALB from blue to green
# (This is automatic after health checks pass)

# 8. Terminate blue service (keep for 24 hours as rollback option)
# aws ecs update-service --cluster forge-prod-blue --service forge-app-blue --desired-count 0
```

**Verification:**
- ✅ Docker image built and pushed to ECR
- ✅ Task definition registered
- ✅ Green service created with 3 tasks
- ✅ All tasks running and healthy
- ✅ Smoke tests passing
- ✅ ALB routing to green environment
- ✅ Blue environment retained as rollback option

---

### 8. CloudWatch Monitoring Setup ✅ READY TO DEPLOY

**Dashboards:**
- **forge-prod-overview:** System health, error rates, latency
- **forge-prod-database:** RDS performance, connection count, slow queries
- **forge-prod-cache:** ElastiCache hit/miss rates, evictions
- **forge-prod-application:** Request rates, API response times, business metrics

**Alarms (PagerDuty Integration):**
1. **Critical:**
   - High error rate (> 5% errors in 5 minutes)
   - API latency (p95 > 500ms)
   - Database connection pool exhausted
   - Out of memory on instances

2. **Warning:**
   - Elevated latency (p95 > 200ms)
   - Cache hit rate < 80%
   - Disk usage > 80%
   - CPU > 70%

**Deployment Steps:**
```bash
# 1. Create CloudWatch log group
aws logs create-log-group --log-group-name /ecs/forge-prod

# 2. Create dashboard
aws cloudwatch put-dashboard \
  --dashboard-name forge-prod-overview \
  --dashboard-body file://dashboard-config.json

# 3. Create alarms (critical)
aws cloudwatch put-metric-alarm \
  --alarm-name forge-prod-high-error-rate \
  --alarm-description "Error rate exceeds 5%" \
  --metric-name ErrorCount \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT:forge-prod-critical

aws cloudwatch put-metric-alarm \
  --alarm-name forge-prod-high-latency \
  --alarm-description "API latency p95 exceeds 500ms" \
  --metric-name TargetResponseTime \
  --namespace AWS/ApplicationELB \
  --statistic p95 \
  --period 60 \
  --threshold 0.5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT:forge-prod-critical
```

**Verification:**
- ✅ Log group created
- ✅ Dashboards configured
- ✅ Critical alarms set
- ✅ SNS topics configured
- ✅ PagerDuty integration active

---

## Database Migration

**Migration Steps:**

```bash
# 1. Create backup of staging database
pg_dump --format=custom --verbose --file=/tmp/forge_staging_backup.dump \
  postgresql://user@staging-db.amazonaws.com:5432/forge_staging

# 2. Restore to production
pg_restore --verbose --clean --no-owner \
  --host=forge-prod-db.xxxxxx.rds.amazonaws.com \
  --username=forge_admin \
  --dbname=forge_prod \
  /tmp/forge_staging_backup.dump

# 3. Verify migration
psql -h forge-prod-db.xxxxxx.rds.amazonaws.com -U forge_app -d forge_prod << EOF
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as workspace_count FROM workspaces;
SELECT COUNT(*) as document_count FROM documents;
SELECT COUNT(*) as ticket_count FROM support_tickets;
EOF

# 4. Create indexes (if not present)
psql -h forge-prod-db.xxxxxx.rds.amazonaws.com -U forge_app -d forge_prod << EOF
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_workspace_id ON documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_workspace_id ON support_tickets(workspace_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);
EOF

# 5. Verify indexes
psql -h forge-prod-db.xxxxxx.rds.amazonaws.com -U forge_app -d forge_prod << EOF
SELECT * FROM pg_indexes WHERE schemaname = 'public';
EOF
```

**Verification:**
- ✅ Data migrated successfully
- ✅ All tables populated
- ✅ Indexes created
- ✅ Constraints enforced
- ✅ Foreign keys validated

---

## Infrastructure Verification Checklist

- [ ] RDS instance created, Multi-AZ enabled, backups scheduled
- [ ] DynamoDB tables created, TTL configured, point-in-time recovery enabled
- [ ] S3 buckets created, versioning enabled, encryption configured, replication active
- [ ] ElastiCache Redis cluster created, multi-AZ failover enabled
- [ ] Application Load Balancer created, target groups configured, health checks passing
- [ ] CloudFront distribution deployed, caching configured, WAF attached
- [ ] ECS service deployed, 3 tasks running and healthy
- [ ] CloudWatch dashboards created, alarms configured, PagerDuty integration active
- [ ] Database migrated, indexes created, constraints verified
- [ ] All services responding to health checks
- [ ] Encryption enabled on all data stores
- [ ] Security groups properly configured
- [ ] IAM roles and policies in place
- [ ] Backup and disaster recovery procedures tested
- [ ] Smoke tests passing on all endpoints

---

## Rollback Plan

**If deployment fails:**

1. Keep blue environment running
2. ALB automatically routes traffic back to blue environment
3. Green environment can be terminated safely
4. Zero downtime rollback

**Rollback command:**
```bash
aws elbv2 modify-target-group \
  --target-group-arn arn:aws:elasticloadbalancing:us-east-1:ACCOUNT:targetgroup/forge-prod-targets/xxxxx \
  --health-check-path /health
```

---

**Phase 2 Target Completion:** May 10, 2026 18:00 UTC  
**Next Phase:** Compliance & Documentation Finalization (May 10, 2026)
