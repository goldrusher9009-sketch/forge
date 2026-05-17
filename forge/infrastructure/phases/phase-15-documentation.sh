#!/bin/bash
set -e

# Phase 15: Documentation and Runbooks
# Duration: 2 hours
# Creates API documentation, deployment runbooks, troubleshooting guides

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
STATE_FILE="/tmp/forge_deployment_state_phase15_${TIMESTAMP}.txt"

echo "=== Phase 15: Documentation and Runbooks ===" | tee -a $STATE_FILE

# Create API Documentation
mkdir -p /tmp/api-docs

# API Reference documentation
cat > /tmp/api-docs/API-REFERENCE.md << 'APIREF'
# Forge Platform API Reference

## Base URL
```
https://api.forge.io/api/v1
```

## Authentication
All requests require a valid JWT token in the Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```

## Core Endpoints

### Auth Service (auth.forge.io:8080)

#### POST /auth/login
Authenticate user and receive JWT token.

Request:
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

Response (200):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "admin"
  }
}
```

Error Responses:
- 401: Invalid credentials
- 429: Too many login attempts
- 500: Server error

#### POST /auth/refresh
Refresh expired JWT token using refresh token.

Request:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Response (200):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}
```

#### POST /auth/logout
Invalidate current token and refresh token.

Response (200):
```json
{
  "message": "Successfully logged out"
}
```

### API Service (api.forge.io)

#### GET /api/v1/resources
List all resources accessible to authenticated user.

Query Parameters:
- `limit` (default: 20, max: 100)
- `offset` (default: 0)
- `sort` (default: created_at)
- `filter` (optional JSON filter)

Response (200):
```json
{
  "data": [
    {
      "id": "resource_123",
      "name": "Production API Key",
      "type": "api_key",
      "created_at": "2026-05-01T10:00:00Z",
      "updated_at": "2026-05-06T15:30:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0
  }
}
```

#### POST /api/v1/resources
Create new resource.

Request:
```json
{
  "name": "New API Key",
  "type": "api_key",
  "config": {
    "scope": ["read", "write"],
    "ip_whitelist": ["203.0.113.0/24"]
  }
}
```

Response (201):
```json
{
  "id": "resource_124",
  "name": "New API Key",
  "type": "api_key",
  "secret": "sk_live_abcdef123456",
  "created_at": "2026-05-06T16:00:00Z"
}
```

#### GET /api/v1/resources/{resource_id}
Get specific resource details.

Response (200):
```json
{
  "id": "resource_123",
  "name": "Production API Key",
  "type": "api_key",
  "scope": ["read", "write"],
  "created_at": "2026-05-01T10:00:00Z",
  "last_used": "2026-05-06T15:45:00Z"
}
```

#### DELETE /api/v1/resources/{resource_id}
Delete a resource (soft delete, 30-day recovery window).

Response (202):
```json
{
  "id": "resource_123",
  "message": "Resource marked for deletion",
  "deletion_date": "2026-06-05T16:00:00Z"
}
```

### Webhook Service (webhooks.forge.io)

#### POST /webhooks/receive
Receive webhook event from external source.

Headers:
- `X-Webhook-Signature`: HMAC-SHA256 signature for verification
- `X-Webhook-ID`: Unique webhook event identifier

Request:
```json
{
  "event": "user.created",
  "timestamp": 1620040800,
  "data": {
    "user_id": "user_123",
    "email": "user@example.com"
  }
}
```

Response (202):
```json
{
  "message": "Webhook event accepted",
  "webhook_id": "evt_abc123def456",
  "status": "processing"
}
```

## Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request is malformed",
    "details": {
      "field": "email",
      "issue": "must be a valid email address"
    }
  }
}
```

### HTTP Status Codes
- 200: Success
- 201: Created
- 202: Accepted (async processing)
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests (rate limited)
- 500: Internal Server Error
- 503: Service Unavailable

## Rate Limiting
- **Default:** 100 requests per minute per API key
- **Burst:** 200 requests per 10 seconds
- **Headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

APIREF

echo "API Reference created" | tee -a $STATE_FILE

# Create deployment runbooks
cat > /tmp/api-docs/DEPLOYMENT-RUNBOOK.md << 'RUNBOOK'
# Forge Platform Deployment Runbook

## Pre-Deployment Checklist

### Infrastructure
- [ ] AWS Account access verified
- [ ] IAM permissions validated
- [ ] VPC and networking ready
- [ ] SSL certificates provisioned
- [ ] DNS records configured

### Application
- [ ] All services built and tested
- [ ] Database migrations prepared
- [ ] Kubernetes manifests validated
- [ ] Helm charts updated with versions
- [ ] Configuration secrets created in AWS Secrets Manager

### Documentation
- [ ] Deployment guide reviewed
- [ ] Rollback plan documented
- [ ] Contact list updated
- [ ] Monitoring dashboards configured

## Phase-by-Phase Deployment

### Phase 1: Foundation (2 hours)
```bash
./phase-01-foundation.sh
# Creates VPC, subnets, security groups, IAM roles
```

**Success Criteria:**
- VPC created with CIDR 10.0.0.0/16
- Public/private subnets in 2 AZs
- Security groups with correct rules
- IAM roles with proper trust relationships

**Rollback:** Delete CloudFormation stack (no data loss)

### Phase 2: EKS Setup (3 hours)
```bash
./phase-02-eks-setup.sh
# Creates Kubernetes cluster and node groups
```

**Success Criteria:**
- EKS cluster v1.28 operational
- 3 nodes running (t3.medium)
- Cluster logging enabled
- kubectl access verified

**Rollback:** Scale down nodes, then delete cluster

### Phase 3-8: Data Layer (10 hours total)
Deploy in sequence:
- Phase 3: RDS PostgreSQL
- Phase 4: Redis ElastiCache
- Phase 5: Elasticsearch
- Phase 6: S3 + CloudFront
- Phase 7: DynamoDB
- Phase 8: Kafka MSK

**Success Criteria (per phase):**
- Resources created and available
- Security groups configured
- Monitoring enabled
- Backups configured

**Rollback:** Delete resources in reverse order

### Phase 9: Monitoring (2.5 hours)
```bash
./phase-09-monitoring-setup.sh
# Installs Prometheus, Grafana, Jaeger, OTEL
```

**Success Criteria:**
- Prometheus scraping metrics
- Grafana dashboards accessible
- AlertManager routing alerts
- Jaeger collecting traces

**Verification:**
```bash
kubectl get pods -n monitoring
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
# Access at http://localhost:3000 (admin/prom-operator)
```

### Phase 10: Helm Deployment (2 hours)
```bash
./phase-10-helm-charts.sh
# Deploys all microservices
```

**Success Criteria:**
- All 7 services deployed
- Pods in Running state
- LoadBalancer IPs assigned
- Health checks passing

**Verification:**
```bash
kubectl get all -n forge-prod
kubectl logs -n forge-prod -l app=forge-auth --tail=100
```

### Phase 11: Security (1.5 hours)
```bash
./phase-11-security-setup.sh
# Enables cert-manager, RBAC, NetworkPolicies
```

**Success Criteria:**
- Certificates issued and active
- NetworkPolicies enforced
- RBAC roles assigned
- Audit logging enabled

## Testing Post-Deployment

### Health Checks
```bash
# Check all services
curl -H "Authorization: Bearer token" https://api.forge.io/health

# Check auth service
curl http://auth.forge.io:8080/health

# Check database connectivity
kubectl exec -n forge-prod deployment/forge-api -- \
  psql $DATABASE_URL -c "SELECT 1"
```

### Smoke Tests
1. Create user account
2. Authenticate and obtain JWT
3. Create API key
4. Test webhook delivery
5. Query analytics data

## Rollback Procedures

### Full Rollback (All Phases)
1. Delete Helm releases: `helm uninstall forge-* -n forge-prod`
2. Delete namespaces: `kubectl delete ns forge-prod`
3. Delete security resources: `kubectl delete ns cert-manager external-secrets-system`
4. Delete monitoring: `kubectl delete ns monitoring`
5. Delete EKS cluster: `aws eks delete-cluster --name forge-prod`
6. Delete RDS, ElastiCache, etc. (Phase 3-8 in reverse)
7. Delete VPC (Phase 1)

### Partial Rollback (Services Only)
```bash
helm uninstall forge-auth -n forge-prod
helm uninstall forge-api -n forge-prod
# Services redeploy with previous version
helm install forge-auth ./helm-charts/auth -n forge-prod \
  --values values-prod.yaml
```

### Database Rollback
```bash
# RDS: Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier forge-postgres-restored \
  --db-snapshot-identifier forge-backup-20260505

# DynamoDB: Point-in-time recovery
aws dynamodb restore-table-to-point-in-time \
  --source-table-name users \
  --target-table-name users-restored \
  --restore-date-time 2026-05-06T12:00:00Z
```

## Monitoring During Deployment

### Real-time Dashboard
```bash
# Watch pod status
kubectl get pods -n forge-prod -w

# Watch service endpoints
kubectl get endpoints -n forge-prod -w

# Monitor resource usage
kubectl top pods -n forge-prod --containers
```

### Log Monitoring
```bash
# Auth service logs
kubectl logs -n forge-prod -l app=forge-auth -f

# API service logs
kubectl logs -n forge-prod -l app=forge-api -f --tail=500

# Check for errors
kubectl logs -n forge-prod --all-containers=true \
  --since=1h | grep ERROR
```

## Escalation Contacts
- **Infrastructure Lead:** [Name] [Slack]
- **Database Admin:** [Name] [Slack]
- **Security Lead:** [Name] [Slack]
- **AWS Support:** [Support Plan ID]

RUNBOOK

echo "Deployment Runbook created" | tee -a $STATE_FILE

# Create troubleshooting guide
cat > /tmp/api-docs/TROUBLESHOOTING-GUIDE.md << 'TROUBLESHOOTING'
# Forge Platform Troubleshooting Guide

## Service Health Checks

### Auth Service Issues

**Symptom: Login failing with 500 errors**
```
Solution:
1. Check service health: curl http://auth.forge.io:8080/health
2. Check pod status: kubectl get pods -n forge-prod -l app=forge-auth
3. View logs: kubectl logs -n forge-prod -l app=forge-auth --tail=100
4. Verify database connectivity: kubectl exec deploy/forge-auth -- \
   psql $DATABASE_URL -c "SELECT 1"
5. Check if JWT secret is properly configured
```

**Symptom: Rate limiting (429 errors)**
```
Solution:
1. Check rate limiting configuration in deployment
2. Increase rate limits if legitimate traffic
3. Check for DDoS: grep "429" /var/log/auth-service.log | wc -l
4. Add IP to whitelist if known client
```

### API Service Issues

**Symptom: API returning 503 Service Unavailable**
```
Solution:
1. Check if service is running: kubectl get svc -n forge-prod
2. Check pod status: kubectl get pods -n forge-prod -l app=forge-api
3. Verify dependencies:
   - Database: kubectl logs deploy/forge-api | grep "database"
   - Redis: kubectl logs deploy/forge-api | grep "redis"
   - Kafka: kubectl logs deploy/forge-api | grep "kafka"
4. Check resource limits: kubectl describe pod <pod-name> -n forge-prod
5. Scale up pods if CPU/memory constrained: kubectl scale deploy/forge-api \
   --replicas=5 -n forge-prod
```

**Symptom: High latency (>1s response times)**
```
Solution:
1. Check database slow queries:
   SELECT query, mean_time FROM pg_stat_statements
   ORDER BY mean_time DESC LIMIT 10;
2. Check Redis hit rate: Check Grafana dashboard
3. Check network latency: kubectl exec pod -- mtr api-service
4. Check Kafka consumer lag: kafka-consumer-groups.sh --bootstrap-server \
   kafka:9092 --group forge-api --describe
5. Increase caching or add replicas
```

## Database Issues

**Symptom: Database connection pool exhausted**
```
Error: "too many connections"
Solution:
1. Check current connections:
   SELECT count(*) FROM pg_stat_activity;
2. Kill idle connections:
   SELECT pg_terminate_backend(pid) FROM pg_stat_activity
   WHERE state = 'idle' AND query_start < now() - interval '30 min';
3. Increase max_connections in RDS parameter group
4. Check for connection leaks in application code
5. Implement connection pooling (PgBouncer)
```

**Symptom: DynamoDB throttling**
```
Error: "ProvisionedThroughputExceededException"
Solution:
1. Check current throttling: CloudWatch metrics
2. Increase on-demand billing or provisioned capacity
3. Optimize query patterns (batch operations)
4. Enable DynamoDB auto-scaling
5. Check for hot partitions (GSI optimization)
```

## Network and Security Issues

**Symptom: Cannot reach API from external network**
```
Solution:
1. Verify security group rules:
   aws ec2 describe-security-groups --group-ids sg-xxxxx
2. Check NACLs: aws ec2 describe-network-acls
3. Test DNS resolution: nslookup api.forge.io
4. Check load balancer status: aws elbv2 describe-load-balancers
5. Verify SSL certificate: openssl s_client -connect api.forge.io:443
```

**Symptom: Certificate validation errors**
```
Error: "certificate verify failed"
Solution:
1. Check certificate status: kubectl get certificate -n forge-prod
2. Check certificate expiry: openssl x509 -in cert.pem -noout -dates
3. Verify DNS CAA records for cert-manager
4. Check cert-manager logs: kubectl logs -n cert-manager -l app=cert-manager
5. Manually renew if needed: kubectl delete secret tls-secret -n forge-prod
```

## Storage Issues

**Symptom: Elasticsearch cluster red**
```
Solution:
1. Check cluster health:
   curl -s http://elasticsearch:9200/_cluster/health | jq
2. Check shard allocation:
   curl -s http://elasticsearch:9200/_cat/shards
3. Restart nodes if necessary
4. Check disk space: df -h on Elasticsearch nodes
5. Implement shard management policy
```

**Symptom: S3 bucket permission denied**
```
Solution:
1. Verify IAM role has S3 permissions
2. Check bucket policy: aws s3api get-bucket-policy --bucket bucket-name
3. Check CORS configuration if cross-origin access needed
4. Verify SSL/TLS configuration for uploads
```

## Performance Optimization

### Quick Wins
1. **Enable caching:** Add Redis caching to expensive queries
2. **Database indexing:** Add indexes to frequently filtered columns
3. **Connection pooling:** Implement PgBouncer for database
4. **Content compression:** Enable gzip in API responses
5. **CDN optimization:** Cache static assets aggressively

### Medium-term Improvements
1. **Microservice optimization:** Profile services for bottlenecks
2. **Database partitioning:** Partition large tables
3. **Read replicas:** Add read replicas for read-heavy queries
4. **Async processing:** Move long-running tasks to Kafka
5. **Distributed caching:** Expand Redis cluster

## Monitoring and Alerting

**Key metrics to watch:**
- HTTP error rate (should be <0.1%)
- P95 latency (should be <500ms)
- Database connection pool utilization (should be <70%)
- Redis memory utilization (should be <80%)
- Kafka consumer lag (should be <1s)
- Pod restart count (should be 0)

TROUBLESHOOTING

echo "Troubleshooting Guide created" | tee -a $STATE_FILE

# Create maintenance procedures
cat > /tmp/api-docs/MAINTENANCE-PROCEDURES.md << 'MAINTENANCE'
# Forge Platform Maintenance Procedures

## Daily Tasks
- [ ] Check service health dashboards
- [ ] Review error logs for anomalies
- [ ] Verify backup completion
- [ ] Monitor disk space usage
- [ ] Check certificate expiration dates

## Weekly Tasks
- [ ] Review slow query logs
- [ ] Analyze application performance metrics
- [ ] Test disaster recovery procedures
- [ ] Review security audit logs
- [ ] Update dependencies and patches

## Monthly Tasks
- [ ] Full disaster recovery drill
- [ ] Capacity planning review
- [ ] Cost analysis and optimization
- [ ] Security vulnerability scanning
- [ ] Documentation updates

## Quarterly Tasks
- [ ] Database optimization and reindexing
- [ ] Infrastructure scaling assessment
- [ ] Multi-region failover test
- [ ] Compliance audit
- [ ] Performance baseline update

MAINTENANCE

echo "Maintenance Procedures created" | tee -a $STATE_FILE

# Export final outputs
echo "" | tee -a $STATE_FILE
echo "=== Phase 15 Outputs ===" | tee -a $STATE_FILE
echo "export API_DOCS_PATH=/tmp/api-docs" >> $STATE_FILE
echo "export API_REFERENCE=/tmp/api-docs/API-REFERENCE.md" >> $STATE_FILE
echo "export DEPLOYMENT_RUNBOOK=/tmp/api-docs/DEPLOYMENT-RUNBOOK.md" >> $STATE_FILE
echo "export TROUBLESHOOTING_GUIDE=/tmp/api-docs/TROUBLESHOOTING-GUIDE.md" >> $STATE_FILE
echo "export MAINTENANCE_PROCEDURES=/tmp/api-docs/MAINTENANCE-PROCEDURES.md" >> $STATE_FILE
echo "Phase 15 completed successfully!" | tee -a $STATE_FILE
