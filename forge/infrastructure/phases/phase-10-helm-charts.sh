#!/bin/bash
# Phase 10: Helm Charts Deployment
# Duration: 2 hours
# Components: Microservices Helm Charts, Values Configuration, Service Deployment

set -e

PHASE_NAME="10-helm-charts"
LOG_FILE="/tmp/${PHASE_NAME}.log"
OUTPUTS_FILE="/tmp/${PHASE_NAME}-outputs.txt"

echo "Starting Phase 10: Helm Charts Deployment" | tee -a $LOG_FILE
echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a $LOG_FILE

# Load previous outputs
if [ ! -f "/tmp/phase-02-outputs.txt" ]; then
  echo "ERROR: Phase 2 outputs not found" | tee -a $LOG_FILE
  exit 1
fi

source /tmp/phase-02-outputs.txt
CLUSTER_NAME="${CLUSTER_NAME:-forge-eks-cluster}"
REGION="${AWS_REGION:-us-east-1}"

echo "Using EKS Cluster: $CLUSTER_NAME in region $REGION" | tee -a $LOG_FILE

# Create application namespaces
echo "Creating application namespaces..." | tee -a $LOG_FILE
kubectl create namespace forge-prod --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace forge-staging --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace forge-dev --dry-run=client -o yaml | kubectl apply -f -

# Add Bitnami Helm repo for common charts
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Create Auth Service Helm Chart
mkdir -p /tmp/forge-auth-service/templates
cat > /tmp/forge-auth-service/Chart.yaml << 'AUTH_CHART'
apiVersion: v2
name: forge-auth-service
description: Authentication and authorization service for Forge
type: application
version: 1.0.0
appVersion: 1.0.0
AUTH_CHART

cat > /tmp/forge-auth-service/values.yaml << 'AUTH_VALUES'
replicaCount: 3

image:
  repository: forge/auth-service
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 8080
  targetPort: 8080

ingress:
  enabled: true
  ingressClassName: alb
  annotations:
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
  hosts:
    - host: auth.forge.internal
      paths:
        - path: /
          pathType: Prefix

resources:
  requests:
    cpu: 200m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

env:
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: forge-secrets
        key: database-url
  - name: REDIS_URL
    valueFrom:
      secretKeyRef:
        name: forge-secrets
        key: redis-url
  - name: JWT_SECRET
    valueFrom:
      secretKeyRef:
        name: forge-secrets
        key: jwt-secret

livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
AUTH_VALUES

cat > /tmp/forge-auth-service/templates/deployment.yaml << 'AUTH_DEPLOYMENT'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "forge-auth-service.fullname" . }}
  labels:
    {{- include "forge-auth-service.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "forge-auth-service.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "forge-auth-service.selectorLabels" . | nindent 8 }}
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        imagePullPolicy: {{ .Values.image.pullPolicy }}
        ports:
        - name: http
          containerPort: {{ .Values.service.targetPort }}
          protocol: TCP
        {{- with .Values.env }}
        env:
          {{- toYaml . | nindent 10 }}
        {{- end }}
        livenessProbe:
          {{- toYaml .Values.livenessProbe | nindent 10 }}
        readinessProbe:
          {{- toYaml .Values.readinessProbe | nindent 10 }}
        resources:
          {{- toYaml .Values.resources | nindent 10 }}
AUTH_DEPLOYMENT

cat > /tmp/forge-auth-service/templates/service.yaml << 'AUTH_SERVICE'
apiVersion: v1
kind: Service
metadata:
  name: {{ include "forge-auth-service.fullname" . }}
  labels:
    {{- include "forge-auth-service.labels" . | nindent 4 }}
spec:
  type: {{ .Values.service.type }}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: {{ .Values.service.targetPort }}
      protocol: TCP
      name: http
  selector:
    {{- include "forge-auth-service.selectorLabels" . | nindent 4 }}
AUTH_SERVICE

cat > /tmp/forge-auth-service/templates/_helpers.tpl << 'AUTH_HELPERS'
{{/*
Expand the name of the chart.
*/}}
{{- define "forge-auth-service.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "forge-auth-service.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "forge-auth-service.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "forge-auth-service.labels" -}}
helm.sh/chart: {{ include "forge-auth-service.chart" . }}
{{ include "forge-auth-service.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "forge-auth-service.selectorLabels" -}}
app.kubernetes.io/name: {{ include "forge-auth-service.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
AUTH_HELPERS

# Create API Service Helm Chart
mkdir -p /tmp/forge-api-service/templates
cp /tmp/forge-auth-service/templates/_helpers.tpl /tmp/forge-api-service/templates/

cat > /tmp/forge-api-service/Chart.yaml << 'API_CHART'
apiVersion: v2
name: forge-api-service
description: Main API service for Forge
type: application
version: 1.0.0
appVersion: 1.0.0
API_CHART

cat > /tmp/forge-api-service/values.yaml << 'API_VALUES'
replicaCount: 3

image:
  repository: forge/api-service
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: LoadBalancer
  port: 443
  targetPort: 8443

resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 1000m
    memory: 1Gi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 20
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 75

ingress:
  enabled: true
  ingressClassName: alb
  annotations:
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/ssl-policy: ELBSecurityPolicy-TLS-1-2-2017-01
  hosts:
    - host: api.forge.io
      paths:
        - path: /
          pathType: Prefix

env:
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: forge-secrets
        key: database-url
  - name: REDIS_URL
    valueFrom:
      secretKeyRef:
        name: forge-secrets
        key: redis-url
  - name: KAFKA_BROKERS
    valueFrom:
      secretKeyRef:
        name: forge-secrets
        key: kafka-brokers
  - name: LOG_LEVEL
    value: "info"
API_VALUES

# Create shared Secrets for all services
echo "Creating shared Secrets configuration..." | tee -a $LOG_FILE
cat > /tmp/forge-secrets.yaml << 'FORGE_SECRETS'
apiVersion: v1
kind: Secret
metadata:
  name: forge-secrets
  namespace: forge-prod
type: Opaque
stringData:
  database-url: "postgresql://user:password@rds-endpoint:5432/forge_db"
  redis-url: "redis://redis-endpoint:6379/0"
  kafka-brokers: "kafka-broker-1:9092,kafka-broker-2:9092,kafka-broker-3:9092"
  jwt-secret: "your-jwt-secret-key-here-change-in-production"
  aws-access-key: "YOUR_AWS_ACCESS_KEY"
  aws-secret-key: "YOUR_AWS_SECRET_KEY"
FORGE_SECRETS

kubectl apply -f /tmp/forge-secrets.yaml

# Deploy services using Helm
echo "Deploying Auth Service with Helm..." | tee -a $LOG_FILE
helm upgrade --install forge-auth /tmp/forge-auth-service \
  -n forge-prod \
  --create-namespace \
  --wait \
  --timeout 5m

echo "Deploying API Service with Helm..." | tee -a $LOG_FILE
helm upgrade --install forge-api /tmp/forge-api-service \
  -n forge-prod \
  --create-namespace \
  --wait \
  --timeout 5m

# Create HPA for data processing service
cat > /tmp/data-processing-hpa.yaml << 'DATA_HPA'
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: forge-data-processing-hpa
  namespace: forge-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: forge-data-processing
  minReplicas: 2
  maxReplicas: 15
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 50
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 30
      policies:
        - type: Percent
          value: 100
          periodSeconds: 30
        - type: Pods
          value: 2
          periodSeconds: 30
      selectPolicy: Max
DATA_HPA

kubectl apply -f /tmp/data-processing-hpa.yaml

# Verify deployments
echo "Verifying deployments..." | tee -a $LOG_FILE
kubectl get deployments -n forge-prod -o wide

# Save outputs
{
  echo "FORGE_AUTH_RELEASE=forge-auth"
  echo "FORGE_API_RELEASE=forge-api"
  echo "FORGE_PROD_NAMESPACE=forge-prod"
  echo "HELM_REPO_BITNAMI=bitnami"
  echo "AUTH_SERVICE_ENDPOINT=auth.forge.internal:8080"
  echo "API_SERVICE_ENDPOINT=api.forge.io:443"
} | tee $OUTPUTS_FILE

echo "Phase 10 completed successfully" | tee -a $LOG_FILE
echo "Next: Phase 11 - Security Setup" | tee -a $LOG_FILE
