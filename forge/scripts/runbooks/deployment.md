# Forge Platform - Production Deployment Runbook

## Overview
This runbook covers standard deployment procedures, rollback processes, and common operational tasks for the Forge Platform production environment.

## Pre-Deployment Checklist

### 1. Code Review and Testing
- [ ] All pull requests approved by minimum 2 reviewers
- [ ] CI/CD pipeline passed: tests, linting, type checking, security scanning
- [ ] Code coverage maintained above 80%
- [ ] No high-severity security vulnerabilities in Trivy scan
- [ ] E2E tests passed on staging environment
- [ ] Performance benchmarks reviewed (target <200ms p95 latency)

### 2. Database Readiness
- [ ] Database backup completed within last 24 hours
- [ ] Replication lag < 1 second
- [ ] Disk space available: at least 30% free
- [ ] No long-running queries blocking deployment
- [ ] Pending migrations identified and scheduled

### 3. Infrastructure Readiness
- [ ] Kubernetes cluster nodes healthy
- [ ] All system pods running
- [ ] PersistentVolumes available and bound
- [ ] Monitoring stack operational (Prometheus, Grafana, Elasticsearch)
- [ ] Alert channels tested (Slack, PagerDuty)
- [ ] Backup storage accessible

### 4. Communication Plan
- [ ] Maintenance window scheduled (off-peak hours)
- [ ] Status page updated with planned maintenance notice
- [ ] Customer notifications sent (if applicable)
- [ ] On-call engineer confirmed available
- [ ] Incident commander designated

## Standard Deployment Procedure (7 Phases)

### Phase 1: Pre-Deployment Validation (15 min)

**Run validation checks:**
```bash
# Kubernetes connectivity
kubectl cluster-info
kubectl get nodes

# Docker registry access
docker login ghcr.io

# Database connectivity
psql $DATABASE_URL -c "SELECT version();"

# Redis connectivity
redis-cli -h $REDIS_HOST ping

# Secret verification
kubectl get secrets -n forge
```

### Phase 2: Blue-Green Setup (20 min)

**Check current deployment:**
```bash
kubectl get deployment -n forge
kubectl get pods -n forge -o wide
kubectl describe deployment prod-forge-api -n forge
```

**Verify pod readiness:**
```bash
kubectl get pods -n forge -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.conditions[?(@.type=="Ready")].status}{"\n"}{end}'
```

### Phase 3: Deploy Green Environment (25 min)

**Trigger deployment:**
```bash
# Via GitHub - merge PR to main
# OR manually apply:
cd kustomize
kustomize build overlays/production | kubectl apply -f -
```

**Monitor rollout:**
```bash
kubectl rollout status deployment/prod-forge-api -n forge --timeout=10m
kubectl logs -f deployment/prod-forge-api -n forge
```

### Phase 4: Health Verification (15 min)

**Health check endpoints:**
```bash
curl https://api.forge.ai/health
curl https://forge.ai/health
```

**Check all services:**
```bash
kubectl get svc -n forge
kubectl get endpoints -n forge
```

### Phase 5: Smoke Testing (10 min)

**Automated tests:**
```bash
npm run test:smoke -- --environment=production
```

**Manual verification:**
- User registration works
- Project creation works
- Task assignment and notifications work
- API endpoints respond correctly

### Phase 6: Traffic Migration (5 min)

Traffic migrates automatically via rolling update. Monitor:
```bash
kubectl top pods -n forge
```

### Phase 7: Post-Deployment Monitoring (30 min)

**Watch critical metrics:**
```bash
# Error rate
curl http://prometheus:9090/api/v1/query?query=rate(http_requests_total%7Bstatus=~%225..%22%7D%5B5m%5D)

# Latency p95
curl http://prometheus:9090/api/v1/query?query=histogram_quantile(0.95,http_request_duration_seconds_bucket)
```

**Verify no pod restarts:**
```bash
kubectl get pods -n forge -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.containerStatuses[0].restartCount}{"\n"}{end}'
```

## Rollback Procedure

**Immediate rollback:**
```bash
kubectl rollout undo deployment/prod-forge-api -n forge
kubectl rollout undo deployment/prod-forge-frontend -n forge
kubectl rollout status deployment/prod-forge-api -n forge
```

**Verify rollback:**
```bash
curl https://api.forge.ai/health
kubectl get pods -n forge
```

**Root cause analysis:**
```bash
kubectl logs <pod-name> -n forge --previous
kubectl describe pod <pod-name> -n forge
kubectl get events -n forge --sort-by='.lastTimestamp'
```

## Common Operational Tasks

### Scale Deployment
```bash
# Check current HPA
kubectl get hpa -n forge

# Manual scale (if needed)
kubectl scale deployment prod-forge-api -n forge --replicas=5
```

### View Logs
```bash
# Recent logs
kubectl logs -n forge <pod-name> --tail=100

# Stream logs
kubectl logs -f -n forge deployment/prod-forge-api

# All pods
kubectl logs -n forge -l app=prod-forge-api --all-containers=true
```

### Execute Commands
```bash
# Interactive shell
kubectl exec -it -n forge <pod-name> -- /bin/sh

# Run command
kubectl exec -n forge <pod-name> -- npm run health-check
```

### Database Maintenance
```bash
# Backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Analyze performance
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM tasks LIMIT 10;"

# Vacuum and analyze
psql $DATABASE_URL -c "VACUUM ANALYZE;"
```

### Clear Cache
```bash
# Flush Redis
redis-cli -h $REDIS_HOST FLUSHDB

# Delete specific key
redis-cli -h $REDIS_HOST DEL "cache:key"
```

### Update Configuration
```bash
# Update ConfigMap
kubectl create configmap prod-forge-config --from-file=config -n forge --dry-run=client -o yaml | kubectl apply -f -

# Restart pods to pick up changes
kubectl rollout restart deployment/prod-forge-api -n forge
```

### Monitor Resources
```bash
# Current usage
kubectl top nodes
kubectl top pods -n forge

# Historical via Prometheus
curl http://prometheus:9090/api/v1/query?query=sum(rate(container_cpu_usage_seconds_total%5B5m%5D))%20by%20(pod_name)
```

## Post-Deployment

- [ ] Update release notes
- [ ] Document any configuration changes
- [ ] Update deployment history
- [ ] Send stakeholder notifications
- [ ] Continue monitoring for 24 hours
- [ ] Conduct retrospective within 48 hours

## Emergency Contacts

- **On-Call Engineer:** Page immediately for deployment issues
- **Database Administrator:** For database emergencies
- **Infrastructure Lead:** For Kubernetes/infrastructure issues
- **Security Team:** For security incidents
- **VP Engineering:** Final escalation authority

## Incident Thresholds

- **Error rate > 5%** → Page on-call engineer
- **Service unavailable > 5 min** → Page incident commander
- **Data corruption** → Page DBA + security immediately
- **Security breach suspected** → Page security team immediately
- **Cannot rollback** → Declare SEV-1, page all leads

---
**Last Updated:** 2026-05-06
**Next Review:** 2026-06-06
