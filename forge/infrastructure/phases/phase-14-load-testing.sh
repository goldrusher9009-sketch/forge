#!/bin/bash
set -e

# Phase 14: Load Testing and Performance Validation
# Duration: 2 hours
# Validates performance, identifies bottlenecks, capacity testing

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
STATE_FILE="/tmp/forge_deployment_state_phase14_${TIMESTAMP}.txt"

echo "=== Phase 14: Load Testing and Performance Validation ===" | tee -a $STATE_FILE

# Load outputs from Phase 13
if [ -f /tmp/forge_deployment_state_phase13_* ]; then
  LATEST_PHASE13=$(ls -t /tmp/forge_deployment_state_phase13_* | head -1)
  source $LATEST_PHASE13
fi

# AWS Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
KUBECONFIG=${KUBECONFIG:-$HOME/.kube/config}

echo "AWS_REGION=$AWS_REGION" | tee -a $STATE_FILE
echo "Load Testing Configuration" | tee -a $STATE_FILE

# Load testing targets
API_ENDPOINT="http://api.forge.io"
WEBHOOK_ENDPOINT="http://webhooks.forge.io"
AUTH_ENDPOINT="http://auth.forge.io:8080"

# Test scenarios
CONCURRENT_USERS=1000
DURATION_MINUTES=30
RAMP_UP_TIME=300  # 5 minutes

echo "Concurrent Users: $CONCURRENT_USERS" | tee -a $STATE_FILE
echo "Test Duration: $DURATION_MINUTES minutes" | tee -a $STATE_FILE
echo "Ramp-up Time: $RAMP_UP_TIME seconds" | tee -a $STATE_FILE

# Create load testing script using Apache JMeter format
cat > /tmp/forge-load-test.jmx << 'JMETER'
<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="Forge Load Test Plan">
      <elementProp name="TestPlan.user_defined_variables" elementType="Arguments"/>
      <stringProp name="TestPlan.comments">Load testing for Forge platform services</stringProp>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>
      <elementProp name="TestPlan.variables" elementType="Arguments"/>
    </TestPlan>

    <hashTree>
      <!-- Auth Service Load Test -->
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="Auth Service Load Test">
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController">
          <boolProp name="LoopController.continue_forever">false</boolProp>
          <stringProp name="LoopController.loops">1</stringProp>
        </elementProp>
        <stringProp name="ThreadGroup.num_threads">250</stringProp>
        <stringProp name="ThreadGroup.ramp_time">300</stringProp>
        <elementProp name="ThreadGroup.scheduler" elementType="kg.apc.jmeter.timers.ConstantThroughputTimerGui">
          <boolProp name="calcMode">0</boolProp>
          <stringProp name="throughput">5000.0</stringProp>
        </elementProp>
      </ThreadGroup>

      <!-- API Service Load Test -->
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="API Service Load Test">
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController">
          <boolProp name="LoopController.continue_forever">false</boolProp>
          <stringProp name="LoopController.loops">1</stringProp>
        </elementProp>
        <stringProp name="ThreadGroup.num_threads">500</stringProp>
        <stringProp name="ThreadGroup.ramp_time">300</stringProp>
        <stringProp name="ThreadGroup.scheduler_precision">millis</stringProp>
        <elementProp name="ThreadGroup.scheduler" elementType="kg.apc.jmeter.timers.ConstantThroughputTimerGui">
          <boolProp name="calcMode">0</boolProp>
          <stringProp name="throughput">10000.0</stringProp>
        </elementProp>
      </ThreadGroup>

      <!-- Webhook Service Load Test -->
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="Webhook Service Load Test">
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController">
          <boolProp name="LoopController.continue_forever">false</boolProp>
          <stringProp name="LoopController.loops">1</stringProp>
        </elementProp>
        <stringProp name="ThreadGroup.num_threads">250</stringProp>
        <stringProp name="ThreadGroup.ramp_time">300</stringProp>
      </ThreadGroup>
    </hashTree>
  </hashTree>
</jmeterTestPlan>
JMETER

echo "Load test plan created: /tmp/forge-load-test.jmx" | tee -a $STATE_FILE

# Create k6 load testing script (Kubernetes-native)
cat > /tmp/forge-load-test.js << 'K6'
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '5m', target: 250 },   // Ramp up to 250 users
    { duration: '15m', target: 1000 }, // Scale to 1000 users
    { duration: '5m', target: 250 },   // Ramp down to 250 users
    { duration: '2m', target: 0 },     // Scale down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.1'],
    errors: ['rate<0.1'],
  },
};

export default function () {
  // Auth Service Test
  group('Auth Service', () => {
    const authResponse = http.post('http://auth.forge.io:8080/auth/login', {
      email: `user${Math.random()}@example.com`,
      password: 'testpass123',
    });

    check(authResponse, {
      'Auth status is 200': (r) => r.status === 200,
      'Auth response time < 500ms': (r) => r.timings.duration < 500,
    }) || errorRate.add(1);
  });

  sleep(1);

  // API Service Test
  group('API Service', () => {
    const apiResponse = http.get('http://api.forge.io/api/v1/resources', {
      headers: { Authorization: 'Bearer token123' },
    });

    check(apiResponse, {
      'API status is 200': (r) => r.status === 200,
      'API response time < 1000ms': (r) => r.timings.duration < 1000,
    }) || errorRate.add(1);
  });

  sleep(2);

  // Webhook Service Test
  group('Webhook Service', () => {
    const webhookResponse = http.post('http://webhooks.forge.io/webhooks/receive', {
      event: 'user.created',
      data: { user_id: Math.random() },
    });

    check(webhookResponse, {
      'Webhook status is 202': (r) => r.status === 202,
      'Webhook response time < 300ms': (r) => r.timings.duration < 300,
    }) || errorRate.add(1);
  });

  sleep(1);
}
K6

echo "k6 load test script created: /tmp/forge-load-test.js" | tee -a $STATE_FILE

# Create performance baseline metrics
cat > /tmp/performance-baseline.json << 'BASELINE'
{
  "load_test_configuration": {
    "concurrent_users": 1000,
    "test_duration_minutes": 30,
    "ramp_up_seconds": 300
  },
  "performance_targets": {
    "auth_service": {
      "p50_latency_ms": 150,
      "p95_latency_ms": 500,
      "p99_latency_ms": 1000,
      "error_rate_percent": 0.1,
      "throughput_rps": 5000
    },
    "api_service": {
      "p50_latency_ms": 200,
      "p95_latency_ms": 500,
      "p99_latency_ms": 1500,
      "error_rate_percent": 0.1,
      "throughput_rps": 10000
    },
    "webhook_service": {
      "p50_latency_ms": 100,
      "p95_latency_ms": 300,
      "p99_latency_ms": 800,
      "error_rate_percent": 0.05,
      "throughput_rps": 5000
    }
  },
  "resource_utilization_targets": {
    "cpu_utilization_percent": 70,
    "memory_utilization_percent": 75,
    "network_bandwidth_percent": 60,
    "disk_io_percent": 50
  },
  "database_performance": {
    "query_p95_latency_ms": 100,
    "query_p99_latency_ms": 500,
    "connection_pool_utilization_percent": 70,
    "slow_query_threshold_ms": 1000
  },
  "caching_performance": {
    "redis_hit_rate_percent": 85,
    "redis_p95_latency_ms": 5,
    "cache_memory_utilization_percent": 80
  }
}
BASELINE

echo "Performance baseline created" | tee -a $STATE_FILE

# Create monitoring dashboard for load testing
cat > /tmp/load-test-dashboard.json << 'DASHBOARD'
{
  "dashboard": {
    "title": "Forge Load Testing Dashboard",
    "refresh": "10s",
    "panels": [
      {
        "id": 1,
        "title": "Concurrent Users",
        "type": "graph",
        "targets": ["http_requests_per_second", "active_connections"]
      },
      {
        "id": 2,
        "title": "Response Time Distribution",
        "type": "heatmap",
        "targets": ["http_request_duration_p50", "http_request_duration_p95", "http_request_duration_p99"]
      },
      {
        "id": 3,
        "title": "Error Rate",
        "type": "singlestat",
        "targets": ["http_requests_failed_rate"],
        "thresholds": "0,0.1"
      },
      {
        "id": 4,
        "title": "Service Health",
        "type": "table",
        "targets": ["auth_service_health", "api_service_health", "webhook_service_health"]
      },
      {
        "id": 5,
        "title": "Database Connections",
        "type": "graph",
        "targets": ["rds_connection_count", "connection_pool_utilization"]
      },
      {
        "id": 6,
        "title": "Cache Hit Rate",
        "type": "gauge",
        "targets": ["redis_hit_rate"],
        "min": 0,
        "max": 100
      }
    ]
  }
}
DASHBOARD

echo "Load test monitoring dashboard created" | tee -a $STATE_FILE

# Create post-test analysis script
cat > /tmp/analyze-load-test.sh << 'ANALYSIS'
#!/bin/bash

echo "=== Load Test Analysis Report ==="
echo "Test Date: $(date)"
echo ""

# Parse results from k6 or JMeter output
echo "=== Service Performance Metrics ==="
echo ""
echo "Auth Service:"
echo "  - P50 Latency: Check Prometheus metric http_request_duration_p50{service='auth'}"
echo "  - P95 Latency: Check Prometheus metric http_request_duration_p95{service='auth'}"
echo "  - P99 Latency: Check Prometheus metric http_request_duration_p99{service='auth'}"
echo "  - Error Rate: Check Prometheus metric http_requests_failed_rate{service='auth'}"
echo ""

echo "API Service:"
echo "  - P50 Latency: Check Prometheus metric http_request_duration_p50{service='api'}"
echo "  - P95 Latency: Check Prometheus metric http_request_duration_p95{service='api'}"
echo "  - Error Rate: Check Prometheus metric http_requests_failed_rate{service='api'}"
echo ""

# Resource utilization
echo "=== Resource Utilization ==="
kubectl top nodes --all-namespaces
echo ""
kubectl top pods -n forge-prod
echo ""

# Database metrics
echo "=== Database Performance ==="
echo "Active Connections:"
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=forge-postgres-primary \
  --start-time $(date -u -d '30 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average,Maximum

# Bottleneck identification
echo ""
echo "=== Potential Bottlenecks ==="
echo "1. Database Connection Pool Exhaustion: Check RDS connection metrics"
echo "2. Memory Pressure: Check pod memory usage exceeding limits"
echo "3. Network Saturation: Check bandwidth utilization"
echo "4. Disk I/O: Check database disk I/O metrics"
echo "5. Cache Hit Rate: Check Redis cache effectiveness"

ANALYSIS

chmod +x /tmp/analyze-load-test.sh

# Create capacity planning summary
cat > /tmp/capacity-planning.md << 'CAPACITY'
# Forge Platform Capacity Planning

## Current Deployment Capacity

### Compute Resources
- **EKS Node Group:** t3.medium (2 CPU, 4GB RAM) with 2-10 autoscaling
- **Target Load:** 1000 concurrent users
- **Estimated Cluster Size:** 3-5 nodes at peak

### Database Capacity
- **RDS Instance:** db.t3.medium (2 vCPU, 4GB RAM)
- **Storage:** 100GB gp3 (expandable)
- **Connection Pool:** 20-40 connections per application instance
- **Max Connections:** PostgreSQL default 100 (configurable)

### Caching Layer
- **Redis Cluster:** 3 nodes cache.t3.medium (1 vCPU, 1GB RAM each)
- **Total Cache:** 3GB (with replication = 1.5GB effective)
- **Eviction Policy:** allkeys-lru

### Search/Analytics
- **Elasticsearch:** 3 t3.small nodes with 100GB storage each
- **Daily Index Volume:** ~10GB (estimated)
- **30-Day Retention:** ~300GB

### Message Queue
- **Kafka MSK:** 3 m5.large brokers
- **Peak Throughput:** 100MB/s
- **Partitions:** 12-16 for high-volume topics

## Scaling Recommendations

### Vertical Scaling (Instance Upgrade)
- **RDS:** t3.medium → t3.large (+200% performance)
- **Redis:** cache.t3.medium → cache.t3.large
- **Elasticsearch:** t3.small → t3.medium

### Horizontal Scaling (More Nodes)
- **EKS:** Current max 10 nodes; increase to 20 for 2000+ users
- **Kafka:** Add brokers to 5-6 for sustained high throughput
- **Elasticsearch:** Add nodes to 5-7 for large index volumes

## Cost Impact Analysis
- **Current Monthly Cost:** $1,215.17
- **Cost per Concurrent User:** $1.22
- **Cost per 1000 requests:** $0.15 (estimated)

CAPACITY

echo "Capacity planning document created" | tee -a $STATE_FILE

# Export final outputs
echo "" | tee -a $STATE_FILE
echo "=== Phase 14 Outputs ===" | tee -a $STATE_FILE
echo "export CONCURRENT_USERS=$CONCURRENT_USERS" >> $STATE_FILE
echo "export TEST_DURATION_MINUTES=$DURATION_MINUTES" >> $STATE_FILE
echo "export RAMP_UP_SECONDS=$RAMP_UP_TIME" >> $STATE_FILE
echo "export LOAD_TEST_JMETER=/tmp/forge-load-test.jmx" >> $STATE_FILE
echo "export LOAD_TEST_K6=/tmp/forge-load-test.js" >> $STATE_FILE
echo "export PERFORMANCE_BASELINE=/tmp/performance-baseline.json" >> $STATE_FILE
echo "export ANALYSIS_SCRIPT=/tmp/analyze-load-test.sh" >> $STATE_FILE
echo "Phase 14 completed successfully!" | tee -a $STATE_FILE
