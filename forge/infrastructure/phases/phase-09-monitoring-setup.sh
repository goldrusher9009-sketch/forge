#!/bin/bash
# Phase 9: Monitoring & Observability Setup
# Duration: 2.5 hours
# Components: Prometheus, Grafana, AlertManager, ELK Stack, OpenTelemetry

set -e

PHASE_NAME="09-monitoring-setup"
LOG_FILE="/tmp/${PHASE_NAME}.log"
OUTPUTS_FILE="/tmp/${PHASE_NAME}-outputs.txt"

echo "Starting Phase 9: Monitoring & Observability Setup" | tee -a $LOG_FILE
echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a $LOG_FILE

# Load previous outputs
if [ ! -f "/tmp/phase-02-outputs.txt" ]; then
  echo "ERROR: Phase 2 outputs not found" | tee -a $LOG_FILE
  exit 1
fi

source /tmp/phase-02-outputs.txt
REGION="${AWS_REGION:-us-east-1}"
CLUSTER_NAME="${CLUSTER_NAME:-forge-eks-cluster}"

echo "Using EKS Cluster: $CLUSTER_NAME" | tee -a $LOG_FILE

# Create monitoring namespace
echo "Creating monitoring namespace..." | tee -a $LOG_FILE
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

# Add Prometheus Helm Repository
echo "Adding Prometheus Helm repository..." | tee -a $LOG_FILE
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Create Prometheus Values File
cat > /tmp/prometheus-values.yaml << 'PROMETHEUS_CONFIG'
prometheus:
  prometheusSpec:
    retention: 30d
    resources:
      requests:
        cpu: 500m
        memory: 2Gi
      limits:
        cpu: 1000m
        memory: 4Gi
    externalLabels:
      cluster: forge-prod
      environment: production
    serviceMonitorSelectorNilUsesHelmValues: false
    podMonitorSelectorNilUsesHelmValues: false
    
    # Alert rules
    additionalPrometheusRulesMap:
      custom-rules:
        groups:
          - name: forge.rules
            interval: 30s
            rules:
              - alert: HighErrorRate
                expr: 'rate(http_requests_total{status=~"5.."}[5m]) > 0.05'
                for: 5m
                annotations:
                  summary: "High error rate detected"
              - alert: HighLatency
                expr: 'histogram_quantile(0.95, http_request_duration_seconds) > 1'
                for: 5m
                annotations:
                  summary: "High P95 latency detected"
              - alert: PodCrashLooping
                expr: 'rate(kube_pod_container_status_restarts_total[15m]) > 0.1'
                for: 5m
                annotations:
                  summary: "Pod crash looping detected"
              - alert: HighMemoryUsage
                expr: 'container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.85'
                for: 5m
                annotations:
                  summary: "High memory usage detected"
              - alert: DiskSpaceRunningOut
                expr: 'node_filesystem_avail_bytes / node_filesystem_size_bytes < 0.1'
                for: 5m
                annotations:
                  summary: "Low disk space available"
              - alert: DatabaseConnectionPoolExhausted
                expr: 'pg_stat_activity_count / max_connections > 0.8'
                for: 5m
                annotations:
                  summary: "Database connection pool nearing limit"
              - alert: RedisMemoryHigh
                expr: 'redis_memory_used_bytes / redis_memory_max_bytes > 0.85'
                for: 5m
                annotations:
                  summary: "Redis memory usage high"

alertmanager:
  alertmanagerSpec:
    storage:
      volumeClaimTemplate:
        spec:
          accessModes: [ "ReadWriteOnce" ]
          resources:
            requests:
              storage: 10Gi
  config:
    route:
      groupBy: ['alertname', 'cluster', 'service']
      groupWait: 30s
      groupInterval: 5m
      repeatInterval: 4h
      receiver: 'default'
      routes:
        - match:
            severity: critical
          receiver: 'pagerduty'
          groupWait: 10s
    receivers:
      - name: 'default'
      - name: 'pagerduty'

grafana:
  enabled: true
  adminPassword: ChangeMe123!
  persistence:
    enabled: true
    size: 20Gi
  resources:
    requests:
      cpu: 250m
      memory: 512Mi
    limits:
      cpu: 500m
      memory: 1Gi
  datasources:
    datasources.yaml:
      apiVersion: 1
      datasources:
        - name: Prometheus
          type: prometheus
          url: http://prometheus-operated:9090

prometheus-node-exporter:
  enabled: true
  
kubeStateMetrics:
  enabled: true
PROMETHEUS_CONFIG

echo "Installing Prometheus Operator..." | tee -a $LOG_FILE
helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
  -n monitoring \
  -f /tmp/prometheus-values.yaml \
  --wait \
  --timeout 10m

# Create Grafana Dashboards ConfigMap
cat > /tmp/grafana-dashboard-config.yaml << 'GRAFANA_CONFIG'
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-dashboard-providers
  namespace: monitoring
data:
  dashboards.yaml: |
    apiVersion: 1
    providers:
    - name: 'default'
      orgId: 1
      folder: ''
      type: file
      disableDeletion: false
      editable: true
      options:
        path: /var/lib/grafana/dashboards/default
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-dashboards
  namespace: monitoring
data:
  kubernetes-cluster.json: |
    {
      "dashboard": {
        "title": "Kubernetes Cluster Overview",
        "panels": [
          {
            "title": "Cluster CPU Usage",
            "targets": [
              {
                "expr": "sum(rate(container_cpu_usage_seconds_total[5m]))"
              }
            ]
          },
          {
            "title": "Cluster Memory Usage",
            "targets": [
              {
                "expr": "sum(container_memory_usage_bytes) / sum(kube_node_status_allocatable{resource=\"memory\"})"
              }
            ]
          },
          {
            "title": "Pod Count by Namespace",
            "targets": [
              {
                "expr": "count(kube_pod_info) by (namespace)"
              }
            ]
          }
        ]
      }
    }
  forge-services.json: |
    {
      "dashboard": {
        "title": "Forge Services Health",
        "panels": [
          {
            "title": "Request Rate by Service",
            "targets": [
              {
                "expr": "sum(rate(http_requests_total[5m])) by (service)"
              }
            ]
          },
          {
            "title": "Error Rate by Service",
            "targets": [
              {
                "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) by (service)"
              }
            ]
          },
          {
            "title": "P95 Latency by Service",
            "targets": [
              {
                "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) by (service)"
              }
            ]
          }
        ]
      }
    }
  database-performance.json: |
    {
      "dashboard": {
        "title": "Database Performance",
        "panels": [
          {
            "title": "Query Performance",
            "targets": [
              {
                "expr": "rate(pg_stat_statements_calls[5m])"
              }
            ]
          },
          {
            "title": "Active Connections",
            "targets": [
              {
                "expr": "pg_stat_activity_count"
              }
            ]
          },
          {
            "title": "Cache Hit Ratio",
            "targets": [
              {
                "expr": "rate(pg_stat_heap_blks_hit[5m]) / (rate(pg_stat_heap_blks_hit[5m]) + rate(pg_stat_heap_blks_read[5m]))"
              }
            ]
          }
        ]
      }
    }
GRAFANA_CONFIG

kubectl apply -f /tmp/grafana-dashboard-config.yaml

# Create AlertManager Configuration
cat > /tmp/alertmanager-config.yaml << 'ALERTMANAGER_CONFIG'
apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-custom
  namespace: monitoring
data:
  alertmanager.yml: |
    global:
      resolve_timeout: 5m
      slack_api_url: 'YOUR_SLACK_WEBHOOK_URL'
    
    route:
      receiver: 'default-receiver'
      group_by: ['alertname', 'cluster', 'service']
      group_wait: 30s
      group_interval: 5m
      repeat_interval: 4h
      routes:
        - match:
            severity: critical
          receiver: 'critical-receiver'
          group_wait: 10s
          continue: true
        - match:
            severity: warning
          receiver: 'warning-receiver'
          group_wait: 2m
    
    receivers:
      - name: 'default-receiver'
        slack_configs:
          - channel: '#alerts'
            title: 'Alert: {{ .GroupLabels.alertname }}'
      - name: 'critical-receiver'
        slack_configs:
          - channel: '#critical-alerts'
            title: 'CRITICAL: {{ .GroupLabels.alertname }}'
      - name: 'warning-receiver'
        slack_configs:
          - channel: '#warnings'
          - title: 'WARNING: {{ .GroupLabels.alertname }}'
ALERTMANAGER_CONFIG

kubectl apply -f /tmp/alertmanager-config.yaml

# Create OpenTelemetry Collector Deployment
cat > /tmp/otel-collector-deployment.yaml << 'OTEL_CONFIG'
apiVersion: v1
kind: ConfigMap
metadata:
  name: otel-collector-config
  namespace: monitoring
data:
  otel-collector-config.yaml: |
    receivers:
      otlp:
        protocols:
          grpc:
            endpoint: 0.0.0.0:4317
          http:
            endpoint: 0.0.0.0:4318
      prometheus:
        config:
          scrape_configs:
            - job_name: 'kubernetes-pods'
              kubernetes_sd_configs:
                - role: pod
              relabel_configs:
                - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
                  action: keep
                  regex: true
    
    processors:
      batch:
        send_batch_size: 1024
        timeout: 10s
      memory_limiter:
        check_interval: 1s
        limit_mib: 512
        spike_limit_mib: 128
      attributes:
        actions:
          - key: environment
            value: production
            action: insert
    
    exporters:
      jaeger:
        endpoint: jaeger-collector:14250
      prometheus:
        endpoint: 0.0.0.0:8888
      otlp:
        client:
          endpoint: tempo-distributor:4317
    
    service:
      pipelines:
        traces:
          receivers: [otlp]
          processors: [memory_limiter, batch, attributes]
          exporters: [jaeger, otlp]
        metrics:
          receivers: [otlp, prometheus]
          processors: [memory_limiter, batch, attributes]
          exporters: [prometheus]
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: otel-collector
  namespace: monitoring
spec:
  replicas: 3
  selector:
    matchLabels:
      app: otel-collector
  template:
    metadata:
      labels:
        app: otel-collector
    spec:
      containers:
        - name: otel-collector
          image: otel/opentelemetry-collector-k8s:0.88.0
          ports:
            - containerPort: 4317
            - containerPort: 4318
            - containerPort: 8888
          volumeMounts:
            - name: otel-collector-config
              mountPath: /etc/otel-collector-config.yaml
              subPath: otel-collector-config.yaml
          resources:
            requests:
              cpu: 500m
              memory: 512Mi
            limits:
              cpu: 1000m
              memory: 1Gi
      volumes:
        - name: otel-collector-config
          configMap:
            name: otel-collector-config
OTEL_CONFIG

kubectl apply -f /tmp/otel-collector-deployment.yaml

# Create Jaeger Deployment for distributed tracing
echo "Setting up Jaeger for distributed tracing..." | tee -a $LOG_FILE
kubectl apply -f - << 'JAEGER_CONFIG'
apiVersion: v1
kind: Service
metadata:
  name: jaeger-collector
  namespace: monitoring
spec:
  selector:
    app: jaeger
  ports:
    - name: grpc
      port: 14250
      targetPort: 14250
    - name: http
      port: 14268
      targetPort: 14268
  type: ClusterIP
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jaeger
  namespace: monitoring
spec:
  replicas: 2
  selector:
    matchLabels:
      app: jaeger
  template:
    metadata:
      labels:
        app: jaeger
    spec:
      containers:
        - name: jaeger
          image: jaegertracing/all-in-one:latest
          ports:
            - containerPort: 14250
            - containerPort: 14268
            - containerPort: 16686
          resources:
            requests:
              cpu: 500m
              memory: 1Gi
            limits:
              cpu: 1000m
              memory: 2Gi
JAEGER_CONFIG

# Expose Grafana via port-forward command documentation
echo "Grafana access (requires port-forward):" | tee -a $LOG_FILE
echo "kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80" | tee -a $LOG_FILE

# Save outputs
{
  echo "PROMETHEUS_NAMESPACE=monitoring"
  echo "GRAFANA_SERVICE=prometheus-grafana"
  echo "PROMETHEUS_SERVICE=prometheus-operated"
  echo "ALERTMANAGER_SERVICE=prometheus-kube-prom-alertmanager"
  echo "JAEGER_SERVICE=jaeger-collector"
  echo "OTEL_COLLECTOR_SERVICE=otel-collector"
} | tee $OUTPUTS_FILE

echo "Phase 9 completed successfully" | tee -a $LOG_FILE
echo "Next: Phase 10 - Helm Charts Setup" | tee -a $LOG_FILE
