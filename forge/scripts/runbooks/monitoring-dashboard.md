# Production Monitoring Dashboard Runbook

**Phase:** 10 - Production Deployment  
**Last Updated:** 2026-05-06  
**Owner:** Platform Team  
**Severity:** Critical  

## Overview

This runbook covers the setup, configuration, and management of Grafana dashboards for production monitoring of the Forge Platform. Effective dashboards are essential for detecting issues early and maintaining operational visibility.

## Dashboard Architecture

### Core Dashboards

1. **Executive Overview Dashboard**
   - Platform health status (green/yellow/red)
   - Key SLI metrics: Error rate, Latency (p95, p99), Availability (%)
   - Active user count and requests/second
   - Resource utilization: CPU, Memory, Disk
   - Recent deployments and incident count
   - Target audience: C-level, product managers, on-call engineers

2. **API Performance Dashboard**
   - Endpoint latency breakdown (p50, p95, p99)
   - Request rate by endpoint
   - Error rate by endpoint
   - Status code distribution (2xx, 4xx, 5xx)
   - Request body size distribution
   - Response time heatmaps
   - Target audience: Backend engineers, API owners

3. **Infrastructure Dashboard**
   - Pod status and distribution across nodes
   - Node CPU/Memory/Disk utilization
   - Network I/O (bytes in/out)
   - Container restarts and crashes
   - Persistent volume usage
   - Target audience: DevOps, SRE, infrastructure team

4. **Database Dashboard**
   - Connection pool utilization (active/idle/waiting)
   - Query latency (slow query log integration)
   - Transaction rate and duration
   - Replication lag (if applicable)
   - Table size and index usage
   - Lock contention and deadlocks
   - Target audience: DBAs, backend engineers

5. **Frontend Dashboard**
   - JavaScript errors and error rate
   - Page load time (FCP, LCP, CLS)
   - API call latency from frontend perspective
   - Session duration and bounce rate
   - Browser compatibility issues
   - Target audience: Frontend engineers, product team

6. **Cache Performance Dashboard**
   - Redis memory usage and eviction rate
   - Cache hit/miss ratio by key prefix
   - Command latency
   - Connected clients count
   - Key space statistics
   - Target audience: Backend engineers, cache team

7. **Security & Compliance Dashboard**
   - Failed authentication attempts
   - Rate limit violations by IP
   - Suspicious request patterns
   - HTTPS certificate expiration warning
   - Access control violations
   - Security scan results (Trivy, SAST)
   - Target audience: Security team, compliance officer

## Grafana Configuration

### Data Sources

```yaml
# Prometheus (primary metrics)
- Name: Prometheus
  Type: Prometheus
  URL: http://prometheus:9090
  Access: Server
  Interval: 15s
  
# Elasticsearch (logs)
- Name: Elasticsearch
  Type: Elasticsearch
  URL: http://elasticsearch:9200
  Index: logs-app-*
  Time field: @timestamp
  
# PostgreSQL (business metrics)
- Name: PostgreSQL
  Type: PostgreSQL
  Host: db:5432
  Database: forge
  User: grafana_readonly
```

### Authentication & Authorization

```yaml
# Grafana RBAC
Roles:
  - admin: Full access to all dashboards, configuration, users
  - editor: Can create/edit dashboards and alerts
  - viewer: Read-only access to dashboards
  - oncall: Full access to dashboards, alerts, incident management

Team Assignments:
  - Platform Team: admin
  - Backend Team: editor (API, Database dashboards)
  - Frontend Team: editor (Frontend dashboard)
  - DevOps Team: admin
  - Security Team: editor (Security dashboard)
  - On-call rotation: oncall
```

## Dashboard Setup Procedure

### Step 1: Create Executive Overview Dashboard (30 minutes)

```bash
# Create dashboard JSON file
cat > /tmp/exec-dashboard.json << 'EOF'
{
  "dashboard": {
    "title": "Executive Overview - Production",
    "description": "High-level platform health and SLI metrics",
    "tags": ["production", "executive"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Platform Health Status",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=~'api|frontend|db|redis'} == 1",
            "legendFormat": "{{instance}}"
          }
        ]
      },
      {
        "id": 2,
        "title": "Request Error Rate (% last 5min)",
        "type": "stat",
        "targets": [
          {
            "expr": "100 * (rate(http_requests_total{status=~'5..'}[5m]) / rate(http_requests_total[5m]))",
            "legendFormat": "Error Rate"
          }
        ],
        "thresholds": {
          "mode": "absolute",
          "steps": [{"value": 0, "color": "green"}, {"value": 1, "color": "yellow"}, {"value": 5, "color": "red"}]
        }
      },
      {
        "id": 3,
        "title": "Latency p95 (ms last 5min)",
        "type": "stat",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) * 1000",
            "legendFormat": "p95"
          }
        ]
      },
      {
        "id": 4,
        "title": "Availability (% last hour)",
        "type": "stat",
        "targets": [
          {
            "expr": "100 * (1 - (rate(http_requests_total{status=~'5..'}[1h]) / rate(http_requests_total[1h])))",
            "legendFormat": "Availability"
          }
        ]
      },
      {
        "id": 5,
        "title": "Active Requests per Second",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[1m])",
            "legendFormat": "{{method}} {{path}}"
          }
        ]
      },
      {
        "id": 6,
        "title": "CPU Utilization (Cluster)",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(container_cpu_usage_seconds_total[5m])) / sum(machine_cpu_cores) * 100",
            "legendFormat": "CPU %"
          }
        ]
      },
      {
        "id": 7,
        "title": "Memory Utilization (Cluster)",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(container_memory_usage_bytes) / sum(machine_memory_bytes) * 100",
            "legendFormat": "Memory %"
          }
        ]
      }
    ]
  }
}
EOF

# Deploy to Grafana via API
curl -X POST http://localhost:3001/api/dashboards/db \
  -H "Authorization: Bearer $GRAFANA_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d @/tmp/exec-dashboard.json
```

### Step 2: Create API Performance Dashboard (30 minutes)

Key metrics to include:
- Endpoint latency percentiles (p50, p95, p99)
- Request rate per endpoint
- Error rate per endpoint
- Status code distribution
- Top slow endpoints
- Request/response size distribution

PromQL queries:
```promql
# Latency percentiles by endpoint
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="api"}[5m])) by (handler)

# Error rate by endpoint
rate(http_requests_total{job="api", status=~"5.."}[5m]) by (handler)

# Request rate by endpoint
rate(http_requests_total{job="api"}[1m]) by (handler, method)

# Top slow endpoints
topk(10, histogram_quantile(0.99, rate(http_request_duration_seconds_bucket{job="api"}[5m])) by (handler))
```

### Step 3: Create Infrastructure Dashboard (30 minutes)

Key metrics to include:
- Pod count and status distribution (Running, Pending, Failed, Unknown)
- Node resource utilization (CPU, Memory, Disk)
- Network I/O per node
- Pod restart count (last 24h)
- Persistent volume usage
- Kubelet health

PromQL queries:
```promql
# Pod status distribution
count(kube_pod_status_phase{namespace="forge"}) by (phase)

# Node CPU utilization
sum(rate(container_cpu_usage_seconds_total{namespace="forge"}[5m])) by (node) / on(node) group_left kube_node_labels * 100

# Pod restart count
sum(rate(kube_pod_container_status_restarts_total{namespace="forge"}[24h])) by (pod, namespace)

# Persistent volume usage
kubelet_volume_stats_used_bytes{namespace="forge"} / kubelet_volume_stats_capacity_bytes * 100
```

### Step 4: Create Database Dashboard (30 minutes)

Key metrics to include:
- Connection pool status (active, idle, waiting, max)
- Query latency (fast, slow, very slow)
- Transaction rate and duration
- Table size and growth
- Index usage and bloat
- Lock contention

PostgreSQL queries for Grafana:
```sql
-- Active connections
SELECT COUNT(*) as active_connections 
FROM pg_stat_activity 
WHERE state != 'idle';

-- Connection pool utilization
SELECT 
  setting as max_connections,
  (SELECT COUNT(*) FROM pg_stat_activity) as current_connections
FROM pg_settings 
WHERE name = 'max_connections';

-- Slow queries (>1 second)
SELECT query, calls, mean_time 
FROM pg_stat_statements 
WHERE mean_time > 1000 
ORDER BY mean_time DESC 
LIMIT 10;

-- Table sizes
SELECT 
  schemaname, tablename, 
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Step 5: Create Frontend Dashboard (30 minutes)

Key metrics to include:
- JavaScript error count and rate
- Page load metrics (FCP, LCP, CLS)
- API latency from frontend
- Session metrics (duration, bounce rate)
- Browser error distribution

JavaScript instrumentation for Grafana (via OpenTelemetry):
```javascript
// In frontend application
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { PrometheusExporter } from '@opentelemetry/exporter-metrics-prometheus';

const exporter = new PrometheusExporter({port: 9090});
const meterProvider = new MeterProvider({
  readers: [new PeriodicExportingMetricReader({exporter})],
});

const meter = meterProvider.getMeter('frontend');

// Track page load
performance.getEntriesByType('navigation').forEach(entry => {
  meter.createHistogram('page_load_ms').record(entry.loadEventEnd - entry.fetchStart);
});

// Track API calls
fetch(url)
  .then(r => {
    meter.createHistogram('api_latency_ms').record(Date.now() - start);
    return r;
  });
```

### Step 6: Create Cache Dashboard (20 minutes)

Key metrics to include:
- Redis memory usage and fragmentation
- Eviction rate
- Cache hit/miss ratio
- Command latency distribution
- Connected clients

PromQL queries for Redis Exporter:
```promql
# Memory usage
redis_memory_used_bytes / redis_memory_max_bytes * 100

# Eviction rate
rate(redis_evicted_keys_total[5m])

# Cache hit ratio
redis_keyspace_hits_total / (redis_keyspace_hits_total + redis_keyspace_misses_total) * 100

# Connected clients
redis_connected_clients

# Command latency
histogram_quantile(0.95, rate(redis_command_duration_seconds_bucket[5m])) by (cmd)
```

### Step 7: Create Security Dashboard (30 minutes)

Key metrics to include:
- Failed auth attempts per user
- Rate limit violations by IP
- Suspicious request patterns (SQL injection, XSS attempts)
- HTTPS certificate expiration (days remaining)
- Access control violations
- Security scan findings

Elasticsearch queries for Grafana:
```json
// Failed authentication attempts
{
  "query": {
    "match": {"event.action": "authentication_failure"}
  },
  "aggs": {
    "by_user": {
      "terms": {"field": "user.name", "size": 10}
    }
  }
}

// Rate limit violations
{
  "query": {
    "match": {"event.category": "rate_limit"}
  },
  "aggs": {
    "by_ip": {
      "terms": {"field": "source.ip", "size": 20}
    }
  }
}

// Suspicious request patterns
{
  "query": {
    "terms": {"event.risk_score": [7, 8, 9]}
  }
}
```

## Alert Configuration

### Alert Rules in Prometheus

```yaml
# High error rate alert
alert: HighErrorRate
expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
for: 5m
annotations:
  summary: "High error rate detected"
  description: "Error rate is {{ $value | humanizePercentage }}"
  severity: "SEV-1"

# High latency alert
alert: HighLatency
expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1.0
for: 5m
annotations:
  summary: "High API latency detected"
  description: "p95 latency is {{ $value }}s"
  severity: "SEV-2"

# Pod restart storm
alert: PodRestartStorm
expr: rate(kube_pod_container_status_restarts_total[5m]) > 0.1
for: 2m
annotations:
  summary: "Pod restart storm detected"
  description: "Pod {{ $labels.pod }} is restarting frequently"
  severity: "SEV-1"

# Database connection pool exhaustion
alert: DBConnectionPoolExhausted
expr: pg_stat_activity_active / pg_setting_max_connections > 0.9
for: 3m
annotations:
  summary: "Database connection pool near capacity"
  description: "Using {{ $value | humanizePercentage }} of connections"
  severity: "SEV-1"

# Certificate expiration
alert: CertificateExpiring
expr: certmanager_certificate_expiration_timestamp_seconds - time() < 86400 * 30
for: 1h
annotations:
  summary: "Certificate expiring soon"
  description: "Certificate {{ $labels.name }} expires in {{ $value | humanizeDuration }}"
  severity: "SEV-2"
```

### Alert Notification Channels

```yaml
# Slack integration
- name: "Slack Production Channel"
  type: "slack"
  settings:
    url: "$SLACK_WEBHOOK_PRODUCTION"
    channel: "#prod-alerts"
    mention_users: ["@oncall-rotation"]
  for_alerts:
    - "SEV-1"
    - "SEV-2"

# PagerDuty integration (for SEV-1 only)
- name: "PagerDuty Escalation"
  type: "pagerduty"
  settings:
    integration_key: "$PAGERDUTY_INTEGRATION_KEY"
    severity: "critical"
  for_alerts:
    - "SEV-1"

# Email escalation (24h no resolution)
- name: "Email Escalation"
  type: "email"
  settings:
    to: ["platform-team@forge.ai", "cto@forge.ai"]
    subject: "CRITICAL: {{ alert_name }} - 24h unresolved"
  escalation_delay: 86400
  for_alerts:
    - "SEV-1"
```

## Dashboard Maintenance

### Daily Tasks (5 minutes)
- Review alert status in Executive Overview
- Check for any false positive alerts
- Verify all dashboard data sources are green

### Weekly Tasks (30 minutes)
- Review alert notification channels for delivery issues
- Check for trending metrics (error rate, latency increasing)
- Validate dashboard correctness against actual incidents
- Update thresholds based on business changes

### Monthly Tasks (1 hour)
- Full dashboard audit and refresh
- Remove unused metrics and queries
- Add new metrics for new features
- Review dashboard organization and user feedback
- Update dashboard documentation

### Quarterly Tasks (2 hours)
- Dashboard redesign review
- Metric strategy alignment with SLOs/SLIs
- Performance optimization of heavy queries
- Template updates for new products/teams

## Common Dashboard Issues & Solutions

### Issue: Metric gaps in time series

**Symptoms:** Dashboard shows "no data" for certain time ranges

**Diagnosis:**
```bash
# Check Prometheus scrape targets
curl http://prometheus:9090/api/v1/targets | jq '.data.activeTargets'

# Check metric availability
curl 'http://prometheus:9090/api/v1/query_range?query=up&start=<unix_time>&end=<unix_time>&step=60'
```

**Solution:**
- Verify application metrics exporter is running
- Check network connectivity to Prometheus
- Restart metrics collection if needed
- Increase Prometheus retention if needed

### Issue: Dashboard loads slowly

**Symptoms:** Dashboard takes >5 seconds to load

**Diagnosis:**
```bash
# Check Grafana performance
curl http://localhost:3001/api/datasources/proxy/<datasource_id>/api/v1/query_range?query=<long_query>

# Profile Prometheus query execution
curl 'http://prometheus:9090/api/v1/query_range?query=<query>&start=<start>&end=<end>' | jq '.stats'
```

**Solution:**
- Break large queries into smaller panels
- Increase time range aggregation (use 5m instead of 1m)
- Add `offset` modifiers to reduce cardinality
- Create separate dashboards for detailed drill-downs

### Issue: Alert fatigue

**Symptoms:** Receiving too many notifications, ignoring alerts

**Diagnosis:**
- Check alert firing frequency in Prometheus UI
- Review alert resolution time vs. for duration
- Analyze false positive rate

**Solution:**
- Increase alert thresholds or `for:` duration
- Add context to alert conditions (exclude maintenance windows)
- Create runbook links in alert annotations
- Implement alert aggregation/grouping

## Dashboard Export & Backup

### Export current dashboards

```bash
# Export all dashboards to JSON
for dashboard_id in $(curl -s http://localhost:3001/api/search?query=* | jq -r '.[].id'); do
  curl -s http://localhost:3001/api/dashboards/uid/$(curl -s http://localhost:3001/api/dashboards/id/$dashboard_id | jq -r '.dashboard.uid') \
    > dashboards/$dashboard_id.json
done

# Commit to Git
git add monitoring/dashboards/
git commit -m "Backup: Grafana dashboards as of $(date)"
git push origin main
```

### Import from backup

```bash
# Restore from JSON files
for file in monitoring/dashboards/*.json; do
  curl -X POST http://localhost:3001/api/dashboards/db \
    -H "Authorization: Bearer $GRAFANA_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d @$file
done
```

## Dashboard Documentation Template

Create a README for each dashboard:

```markdown
# [Dashboard Name]

**Owner:** [Team Name]  
**Audience:** [Who uses this dashboard]  
**Update Frequency:** [Weekly/Monthly]  

## Metrics

### Key Metric 1
- **Query:** [PromQL/SQL]
- **Normal Range:** [Expected values]
- **Alert Threshold:** [When to alert]

## Interpretation Guide

### Scenario 1: Metrics look abnormal
1. Check [Related metric] to correlate
2. Review [Logs/Traces/Events]
3. If confirmed, execute [Runbook link]

## Related Resources
- [Incident response runbook](../incident-response.md)
- [Deployment runbook](../deployment.md)
```

## Next Steps

1. Deploy all 7 core dashboards using provided PromQL/SQL queries
2. Configure alert notification channels (Slack, PagerDuty, Email)
3. Set up dashboard change tracking in Git
4. Train team on dashboard navigation and interpretation
5. Schedule weekly dashboard audit reviews
6. Monitor dashboard usage and collect feedback quarterly
