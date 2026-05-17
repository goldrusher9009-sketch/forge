# Forge Platform - Incident Response Runbook

## Incident Severity Levels

### SEV-1: Critical
- Production system completely unavailable
- Data loss or corruption occurring
- Security breach in progress
- Affects all users, no workaround available
- **Response time:** Immediate (page all oncall)
- **Communication:** Every 5 minutes

### SEV-2: Major  
- Production system partially unavailable
- Significant degradation (>25% error rate)
- Large subset of users affected
- Workaround available or alternative service accessible
- **Response time:** < 15 minutes (page oncall)
- **Communication:** Every 15 minutes

### SEV-3: Minor
- Limited functionality affected
- Small subset of users impacted
- Workaround available
- Non-critical features
- **Response time:** < 1 hour (email escalation)
- **Communication:** As needed

### SEV-4: Informational
- No user impact
- Development/staging only
- Enhancement or future planning
- **Response time:** Business hours
- **Communication:** After resolution

## Incident Response Workflow

### 1. Detection & Initial Response (0-5 min)

**Alert received from:**
- PagerDuty monitoring alert
- Slack notification from monitoring bot
- Customer report
- Internal team discovery

**Immediate actions:**
```bash
# STOP - Declare incident
# Assign incident commander
# Page on-call team based on severity
# Start incident channel in Slack (#incident-[timestamp])
# Document incident start time
```

**Initial severity assessment:**
- Check current system status: `curl https://api.forge.ai/health`
- Check error rate: `curl http://prometheus:9090/api/v1/query?query=rate(http_requests_total%7Bstatus=~%225..%22%7D%5B1m%5D)`
- Check customer impact reports
- Verify not false positive

**Declare severity and escalate accordingly.**

### 2. Incident Commander Assumes Control (5 min)

**Incident Commander responsibilities:**
- [ ] Create incident document with timeline
- [ ] Ensure communication channel active
- [ ] Assign roles: observer, scribe, resolver
- [ ] Brief team on known information
- [ ] Set communication cadence (every 5/15/30 min)
- [ ] Document assumptions and decisions

**Roles:**
- **Incident Commander:** Coordinates response, makes decisions, external communication
- **Technical Lead:** Diagnoses root cause, directs mitigation
- **Observer:** Gathers context, prepares for escalation
- **Scribe:** Documents timeline, decisions, technical details

### 3. Triage & Diagnosis (5-30 min)

**Gather information:**

**Check application health:**
```bash
# API status
curl -v https://api.forge.ai/health
curl -v https://api.forge.ai/readiness

# Check deployment status
kubectl get deployment -n forge
kubectl get pods -n forge
kubectl get events -n forge --sort-by='.lastTimestamp'

# Check pod status
kubectl describe pod <pod-name> -n forge
```

**Check logs:**
```bash
# Application logs
kubectl logs -f deployment/prod-forge-api -n forge | grep -E "ERROR|FATAL|panic"

# Recent logs from Kibana
# Visit https://kibana.forge.ai
# Index: logs-api-* or logs-app-*
# Search: level:ERROR OR level:FATAL
```

**Check metrics:**
```bash
# Error rate (should be < 0.1%)
rate(http_requests_total{status=~"5.."}[5m])

# Latency (p95 should be < 200ms)
histogram_quantile(0.95, http_request_duration_seconds_bucket)

# Pod CPU/Memory
sum(rate(container_cpu_usage_seconds_total[5m])) by (pod_name)
sum(container_memory_usage_bytes) by (pod_name)

# Database queries
SELECT pid, query, query_start, state FROM pg_stat_activity WHERE state != 'idle';

# Database connection count
SELECT COUNT(*) FROM pg_stat_activity;
```

**Check external dependencies:**
```bash
# Database connectivity
psql $DATABASE_URL -c "SELECT 1;"

# Redis connectivity
redis-cli -h $REDIS_HOST ping

# External APIs
curl -I https://external-api.example.com/health
```

### 4. Common Incidents & Solutions

#### 4.1 High Error Rate (> 1%)

**Diagnosis:**
```bash
# Get error details
kubectl logs deployment/prod-forge-api -n forge | grep -E "ERROR.*\[" | head -20

# Check specific error type
curl http://prometheus:9090/api/v1/query?query=rate(http_requests_total%7Bstatus=~%225..%22,handler=%22/api/tasks%22%7D%5B5m%5D)
```

**Common causes:**
- Database connection exhaustion
- Memory leak or OOM
- Unhandled exception in new code
- Dependency timeout

**Immediate mitigation:**
```bash
# Scale up pods
kubectl scale deployment prod-forge-api -n forge --replicas=10

# Restart unhealthy pods
kubectl delete pod <unhealthy-pod> -n forge

# Clear cache to reduce pressure
redis-cli -h $REDIS_HOST FLUSHDB

# Enable circuit breaker
kubectl patch configmap prod-forge-config -n forge -p '{"data":{"CIRCUIT_BREAKER_ENABLED":"true"}}'
```

**Resolution:**
```bash
# Check database connections
psql $DATABASE_URL -c "SELECT datname, usename, state, COUNT(*) FROM pg_stat_activity GROUP BY datname, usename, state;"

# Check for memory leaks
kubectl top pod <pod-name> -n forge --containers

# Review recent logs for patterns
kubectl logs deployment/prod-forge-api -n forge --tail=1000 | grep ERROR | sort | uniq -c | sort -rn
```

#### 4.2 Database Connection Exhaustion

**Diagnosis:**
```bash
# Check connection limit
psql $DATABASE_URL -c "SELECT setting FROM pg_settings WHERE name='max_connections';"

# Check active connections
psql $DATABASE_URL -c "SELECT COUNT(*) as connections FROM pg_stat_activity;"

# Check idle connections
psql $DATABASE_URL -c "SELECT COUNT(*) FROM pg_stat_activity WHERE state='idle';"
```

**Immediate mitigation:**
```bash
# Identify long-running queries
psql $DATABASE_URL -c "SELECT pid, query, query_start, state_change FROM pg_stat_activity WHERE state != 'idle' ORDER BY query_start ASC;"

# Terminate idle connections
psql $DATABASE_URL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state='idle' AND query_start < now() - interval '30 minutes';"

# Reduce connection pool in app
kubectl patch configmap prod-forge-config -n forge -p '{"data":{"DATABASE_POOL_SIZE":"5"}}'
kubectl rollout restart deployment/prod-forge-api -n forge
```

**Root cause analysis:**
- Connection leak in application code
- Slow queries holding connections
- Insufficient connection pool size
- External service timeout

**Resolution:**
```bash
# Increase database connection limit (if safe)
ALTER SYSTEM SET max_connections = 300;
SELECT pg_reload_conf();

# OR reduce pool size in deployment
kubectl edit deployment prod-forge-api -n forge
# Change POOL_SIZE to match DB limit / number of replicas
```

#### 4.3 Pod Crashes (CrashLoopBackOff)

**Diagnosis:**
```bash
# Check pod status
kubectl get pods -n forge -o wide | grep -i crash

# Get crash details
kubectl describe pod <crashing-pod> -n forge

# Get logs from previous instance
kubectl logs <crashing-pod> -n forge --previous
```

**Common causes:**
- OOMKilled: Memory exhaustion
- Readiness probe failure
- Startup failure (missing config, failed migration)
- Segmentation fault

**Immediate mitigation:**
```bash
# Increase memory limit
kubectl edit deployment prod-forge-api -n forge
# Increase spec.containers[].resources.limits.memory to 4Gi

# Disable readiness probe temporarily
kubectl set probe deployment/prod-forge-api liveness --initial-delay-seconds=60 -n forge

# Scale to fewer replicas to reduce load
kubectl scale deployment prod-forge-api -n forge --replicas=2
```

**Resolution:**
```bash
# Check why pod is crashing
kubectl logs <pod> -n forge --previous | tail -100

# If OOMKilled
kubectl top pod <pod> -n forge

# If readiness probe failure
curl http://<pod-ip>:8000/health

# If startup failure
# Review recent code changes
git log --oneline -5
git diff HEAD~1

# Run database migrations
kubectl exec -it <pod> -n forge -- npm run migrate:up
```

#### 4.4 High Latency (p95 > 500ms)

**Diagnosis:**
```bash
# Get latency by endpoint
curl http://prometheus:9090/api/v1/query?query=histogram_quantile(0.95,http_request_duration_seconds_bucket)%20by%20(handler)

# Get slow queries from database
psql $DATABASE_URL -c "SELECT query, calls, mean_time, max_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

**Common causes:**
- Slow database queries
- N+1 query problem
- External API timeout
- High CPU/memory usage

**Immediate mitigation:**
```bash
# Scale up pods to distribute load
kubectl scale deployment prod-forge-api -n forge --replicas=10

# Enable query caching
kubectl patch configmap prod-forge-config -n forge -p '{"data":{"CACHE_ENABLED":"true"}}'

# Increase database work_mem
psql $DATABASE_URL -c "ALTER SYSTEM SET work_mem = '256MB';"
psql $DATABASE_URL -c "SELECT pg_reload_conf();"
```

**Resolution:**
```bash
# Identify slow endpoint
# Find corresponding code and optimize

# Add database index if missing
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT ... FROM tasks WHERE project_id = 'x';"

# Check for N+1 queries in logs
kubectl logs deployment/prod-forge-api -n forge | grep "SELECT.*;" | sort | uniq -c | sort -rn
```

#### 4.5 Memory Leak

**Diagnosis:**
```bash
# Monitor memory over time
watch -n 5 'kubectl top pod <pod-name> -n forge --containers | grep -A 1 Memory'

# Check for memory growth in Prometheus
curl http://prometheus:9090/api/v1/query_range?query=container_memory_usage_bytes%7Bpod=%22<pod-name>%22%7D&start=...&end=...&step=60s
```

**Immediate mitigation:**
```bash
# Restart pod to clear memory
kubectl delete pod <pod-name> -n forge

# Scale to fewer replicas temporarily
kubectl scale deployment prod-forge-api -n forge --replicas=2
```

**Root cause analysis:**
```bash
# Check for event listeners not being removed
kubectl logs <pod> -n forge | grep -i "listener\|subscription"

# Check for circular references
# Review recent code changes
git log --oneline -10 --grep="memory\|cache\|listener"

# Profile memory usage
# Run heap dump if application supports it
kubectl exec -it <pod> -n forge -- curl -X POST http://localhost:8000/debug/heap-dump
```

#### 4.6 Security Incident

**Diagnosis - Potential Breach:**
```bash
# Check for suspicious activity in logs
kubectl logs deployment/prod-forge-api -n forge | grep -E "unauthorized|forbidden|invalid.*token"

# Check for unusual database activity
psql $DATABASE_URL -c "SELECT * FROM audit_log WHERE timestamp > NOW() - INTERVAL '1 hour' AND operation IN ('DELETE', 'TRUNCATE') ORDER BY timestamp DESC;"

# Check network logs in Kubernetes
kubectl get networkpolicies -n forge
```

**Immediate actions (SEV-1):**
1. **Page security team immediately**
2. **Notify privacy officer and legal**
3. **Preserve evidence:**
   ```bash
   # Capture pod logs
   kubectl logs deployment/prod-forge-api -n forge > api-logs-$(date +%s).txt
   
   # Capture network policies
   kubectl get networkpolicies -n forge -o yaml > network-policies-$(date +%s).yaml
   
   # Dump suspicious query activity
   psql $DATABASE_URL -c "SELECT * FROM audit_log WHERE timestamp > NOW() - INTERVAL '2 hours';" > audit-logs-$(date +%s).txt
   ```

4. **Isolate if necessary:**
   ```bash
   # Revoke API keys if compromised
   psql $DATABASE_URL -c "UPDATE api_keys SET revoked_at = NOW() WHERE status='active';"
   
   # Block suspicious IP
   kubectl patch networkpolicy default -n forge --type merge -p '{"spec":{"ingress":[{"from":[{"ipBlock":{"cidr":"0.0.0.0/0","except":["suspected-ip/32"]}}]}]}}'
   ```

5. **Do NOT delete logs or evidence**
6. **Follow incident response plan**
7. **Prepare for external audit/law enforcement**

### 5. Mitigation & Recovery (5-60 min depending on severity)

**Decision point: Can we mitigate without rollback?**

**If YES (apply fix):**
```bash
# Fix code or configuration
git checkout -b hotfix/incident-name
# Make minimal changes
git commit
git push

# Deploy hotfix
# Merge to main, let CI/CD deploy
# OR manually: kustomize build overlays/production | kubectl apply -f -
```

**If NO (rollback required):**
```bash
# Rollback to previous version
kubectl rollout undo deployment/prod-forge-api -n forge
kubectl rollout undo deployment/prod-forge-frontend -n forge

# Verify health
curl https://api.forge.ai/health
kubectl get pods -n forge
```

**After mitigation:**
```bash
# Monitor closely
kubectl logs -f deployment/prod-forge-api -n forge
kubectl top pods -n forge
curl http://prometheus:9090/api/v1/query?query=rate(http_requests_total%7Bstatus=~%225..%22%7D%5B1m%5D)

# Verify normal operation for 15+ minutes
# Error rate should return to < 0.1%
# Latency p95 should return to < 200ms
# No pod restarts
```

### 6. Communication (Ongoing)

**Update status page every 5-15 minutes:**
```
[Timestamp] - Investigating high error rate on api.forge.ai
[Timestamp] - Identified database connection issue, deploying fix
[Timestamp] - Fix deployed, monitoring for stability
[Timestamp] - Issue resolved, systems returning to normal
```

**Customer notification (if >15 min outage):**
- Email to all customers
- Slack to customer channels
- Status page update
- Include root cause, impact, resolution time

### 7. Post-Incident (After stability confirmed)

**Immediate (while still in incident channel):**
- [ ] Document timeline of events
- [ ] Record decisions made
- [ ] Capture diagnostic output
- [ ] Note workarounds used
- [ ] Identify preventive measures

**Within 24 hours (incident retrospective):**
```bash
# Schedule incident retrospective meeting
# Invite: incident commander, tech lead, on-call engineer, manager

# Prepare retrospective document
- What happened
- Timeline of events
- Root cause analysis
- What went well
- What could be improved
- Action items with owners and due dates
```

**Action items (examples):**
- [ ] Add alert for database connection exhaustion
- [ ] Add capacity test to CI/CD pipeline
- [ ] Improve error messages in logs
- [ ] Add circuit breaker for external API calls
- [ ] Increase monitoring granularity
- [ ] Update runbook with new learnings

**Update runbook based on learnings**

---
**Last Updated:** 2026-05-06
**Review Cadence:** Quarterly or after major incidents
