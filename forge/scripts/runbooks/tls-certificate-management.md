# TLS Certificate Management & Auto-Renewal

**Phase 10 Runbook** | Production Deployment Infrastructure | Last Updated: 2026-05-06

## Overview

This runbook documents the complete TLS certificate lifecycle management for Forge Platform production deployment, including provisioning, validation, auto-renewal, and emergency rotation procedures. All certificate management is automated through `cert-manager` integration with Let's Encrypt, with manual override capabilities and compliance audit trails.

## 1. Architecture & Components

### 1.1 Certificate Management Stack

```
┌─────────────────────────────────────────────────────────┐
│ Production Kubernetes Cluster (forge-prod)             │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ cert-manager (kube-system namespace)            │   │
│ │ ├─ Controller Manager Pod                       │   │
│ │ ├─ Webhook Pod                                  │   │
│ │ ├─ CA Injector Pod                              │   │
│ │ └─ RBAC: ServiceAccount, ClusterRole, Binding  │   │
│ └─────────────────────────────────────────────────┘   │
│                          ↓                              │
│ ┌─────────────────────────────────────────────────┐   │
│ │ ClusterIssuer (Let's Encrypt ACME)              │   │
│ │ ├─ Issuer: letsencrypt-prod                     │   │
│ │ ├─ Solver: HTTP-01 (primary)                    │   │
│ │ ├─ Solver: DNS-01 (backup/wildcard)             │   │
│ │ └─ Email: ops@forge.ai                          │   │
│ └─────────────────────────────────────────────────┘   │
│                          ↓                              │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Certificate Resources                           │   │
│ │ ├─ api.forge.ai                                 │   │
│ │ ├─ app.forge.ai                                 │   │
│ │ ├─ grafana.forge.ai                             │   │
│ │ ├─ *.internal.forge.ai (wildcard)               │   │
│ │ └─ kubernetes.default.svc.cluster.local         │   │
│ └─────────────────────────────────────────────────┘   │
│                          ↓                              │
│ ┌─────────────────────────────────────────────────┐   │
│ │ TLS Secrets (kubernetes.io/tls)                 │   │
│ │ ├─ api-tls-cert                                 │   │
│ │ ├─ app-tls-cert                                 │   │
│ │ ├─ grafana-tls-cert                             │   │
│ │ └─ internal-wildcard-tls-cert                   │   │
│ └─────────────────────────────────────────────────┘   │
│                          ↓                              │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Ingress Resources (nginx-ingress)               │   │
│ │ ├─ frontend-ingress → *.forge.ai                │   │
│ │ ├─ api-ingress → api.forge.ai                   │   │
│ │ ├─ grafana-ingress → grafana.forge.ai           │   │
│ │ └─ All terminating TLS with Secret refs         │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Backup: Self-Signed Certificates (fallback)    │   │
│ │ └─ Issued by cert-manager self-signed issuer    │   │
│ └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
         ↓                                      ↓
    Let's Encrypt API                    Certificate Vault
    (ACME challenges)                    (backup storage)
```

### 1.2 Certificate Types

| Domain | Type | Issuer | Auto-Renew | Priority |
|--------|------|--------|------------|----------|
| api.forge.ai | Single-domain | Let's Encrypt Prod | Yes (60 days) | P0 |
| app.forge.ai | Single-domain | Let's Encrypt Prod | Yes (60 days) | P0 |
| grafana.forge.ai | Single-domain | Let's Encrypt Prod | Yes (60 days) | P1 |
| *.internal.forge.ai | Wildcard | Let's Encrypt Prod | Yes (60 days) | P1 |
| kubernetes.default.svc.cluster.local | K8s API | cert-manager CA | Yes (30 days) | P0 |

### 1.3 Key Components

- **cert-manager**: Automated certificate provisioning and renewal (v1.12.0+)
- **ClusterIssuer**: Let's Encrypt ACME server with email challenge
- **Certificate CRD**: Kubernetes Certificate resources triggering automatic renewal
- **Webhook**: ACME challenge validation via HTTP-01 and DNS-01 solvers
- **CA Injector**: Automatic CA certificate injection into webhooks
- **Secret Backend**: Kubernetes Secrets (encrypted at rest with etcd encryption key)

## 2. Installation & Configuration

### 2.1 Install cert-manager

```bash
# Add cert-manager Helm repository
helm repo add jetstack https://charts.jetstack.io
helm repo update

# Create namespace
kubectl create namespace cert-manager

# Install CRDs (must be done separately before Helm install)
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.12.0/cert-manager.crds.yaml

# Install cert-manager via Helm
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --version v1.12.0 \
  --set global.leaderElection.namespace=cert-manager \
  --set installCRDs=false \
  --set securityContext.fsGroup=1001 \
  --set serviceAccount.automountServiceAccountToken=true \
  --wait
```

### 2.2 Verify Installation

```bash
# Check cert-manager pods are running
kubectl get pods -n cert-manager
# Expected output:
# NAME                                    READY   STATUS    RESTARTS   AGE
# cert-manager-5c5f8d9c7f-abc12          1/1     Running   0          2m
# cert-manager-cainjector-7f8c4d2-xyz89  1/1     Running   0          2m
# cert-manager-webhook-6f4c8e9-def45     1/1     Running   0          2m

# Verify webhook is working
kubectl get validatingwebhookconfigurations | grep cert-manager
# Expected: cert-manager-webhook and cert-manager-webhook-validation

# Check cert-manager logs for any startup errors
kubectl logs -n cert-manager -l app.kubernetes.io/name=cert-manager --tail=50
```

### 2.3 Create ClusterIssuer (Let's Encrypt Production)

**File: `k8s/cert-manager/cluster-issuer.yaml`**

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    # Production Let's Encrypt server (enforces rate limits)
    server: https://acme-v02.api.letsencrypt.org/directory
    email: ops@forge.ai
    privateKeySecretRef:
      name: letsencrypt-prod-key
    
    # HTTP-01 solver (primary for domain validation)
    solvers:
    - http01:
        ingress:
          class: nginx
      selector:
        matchLabels:
          cert-type: http-domain
    
    # DNS-01 solver (for wildcard and backup validation)
    - dns01:
        route53:
          region: us-east-1
          accessKeyID: ""  # Set via AWS IAM role
          secretAccessKeySecretRef:
            name: route53-credentials
            key: aws-secret-access-key
      selector:
        matchLabels:
          cert-type: wildcard

---
# Fallback: Self-signed issuer for emergency scenarios
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: selfsigned-issuer
spec:
  selfSigned: {}

---
# Internal CA for Kubernetes services
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: internal-ca-issuer
spec:
  ca:
    secretName: internal-ca-secret
```

Apply the ClusterIssuer:

```bash
kubectl apply -f k8s/cert-manager/cluster-issuer.yaml

# Verify ClusterIssuer is ready
kubectl get clusterissuer
# Expected:
# NAME                READY   AGE
# letsencrypt-prod    True    1m
# selfsigned-issuer   True    1m
# internal-ca-issuer  True    1m

# Check ClusterIssuer status
kubectl describe clusterissuer letsencrypt-prod
```

### 2.4 Create Certificate Resources

**File: `k8s/cert-manager/certificates.yaml`**

```yaml
---
# API Server Certificate (api.forge.ai)
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: api-forge-ai-cert
  namespace: default
spec:
  secretName: api-tls-cert
  duration: 2160h  # 90 days
  renewBefore: 1440h  # Renew 60 days before expiry
  commonName: api.forge.ai
  dnsNames:
  - api.forge.ai
  - "*.api.forge.ai"
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  labels:
    cert-type: http-domain

---
# Frontend Certificate (app.forge.ai)
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: app-forge-ai-cert
  namespace: default
spec:
  secretName: app-tls-cert
  duration: 2160h
  renewBefore: 1440h
  commonName: app.forge.ai
  dnsNames:
  - app.forge.ai
  - "*.app.forge.ai"
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  labels:
    cert-type: http-domain

---
# Grafana Certificate (grafana.forge.ai)
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: grafana-forge-ai-cert
  namespace: monitoring
spec:
  secretName: grafana-tls-cert
  duration: 2160h
  renewBefore: 1440h
  commonName: grafana.forge.ai
  dnsNames:
  - grafana.forge.ai
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  labels:
    cert-type: http-domain

---
# Wildcard Certificate for Internal Services (*.internal.forge.ai)
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: internal-wildcard-cert
  namespace: default
spec:
  secretName: internal-wildcard-tls-cert
  duration: 2160h
  renewBefore: 1440h
  commonName: "*.internal.forge.ai"
  dnsNames:
  - "*.internal.forge.ai"
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  labels:
    cert-type: wildcard

---
# Kubernetes API Server Certificate (internal)
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: kubernetes-api-cert
  namespace: kube-system
spec:
  secretName: kubernetes-api-tls-cert
  duration: 720h  # 30 days for internal certs
  renewBefore: 240h  # Renew 10 days before expiry
  commonName: kubernetes.default.svc.cluster.local
  dnsNames:
  - kubernetes
  - kubernetes.default
  - kubernetes.default.svc
  - kubernetes.default.svc.cluster.local
  issuerRef:
    name: internal-ca-issuer
    kind: ClusterIssuer
```

Apply the certificates:

```bash
kubectl apply -f k8s/cert-manager/certificates.yaml

# Monitor certificate issuance
kubectl get certificate -w
# Expected output (after ~30s):
# NAME                       READY   SECRET                        AGE
# api-forge-ai-cert          True    api-tls-cert                  45s
# app-forge-ai-cert          True    app-tls-cert                  45s
# grafana-forge-ai-cert      True    grafana-tls-cert              45s
# internal-wildcard-cert     True    internal-wildcard-tls-cert    45s
# kubernetes-api-cert        True    kubernetes-api-tls-cert       45s

# Check certificate details
kubectl describe certificate api-forge-ai-cert

# Verify TLS secrets were created
kubectl get secrets -o jsonpath='{.items[*].metadata.name}' | grep -i tls
```

## 3. Ingress Configuration

### 3.1 Frontend Ingress with TLS

**File: `k8s/ingress/frontend-ingress.yaml`**

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: frontend-ingress
  namespace: default
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/ssl-protocols: "TLSv1.2 TLSv1.3"
    nginx.ingress.kubernetes.io/configuration-snippet: |
      more_set_headers "Strict-Transport-Security: max-age=31536000; includeSubDomains; preload";
      more_set_headers "X-Frame-Options: DENY";
      more_set_headers "X-Content-Type-Options: nosniff";
spec:
  tls:
  - hosts:
    - app.forge.ai
    secretName: app-tls-cert
  rules:
  - host: app.forge.ai
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 3000
```

### 3.2 API Ingress with TLS

**File: `k8s/ingress/api-ingress.yaml`**

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
  namespace: default
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/ssl-protocols: "TLSv1.2 TLSv1.3"
    nginx.ingress.kubernetes.io/proxy-body-size: "100m"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
  - hosts:
    - api.forge.ai
    secretName: api-tls-cert
  rules:
  - host: api.forge.ai
    http:
      paths:
      - path: /api/v1
        pathType: Prefix
        backend:
          service:
            name: api
            port:
              number: 8000
```

Apply ingress resources:

```bash
kubectl apply -f k8s/ingress/frontend-ingress.yaml
kubectl apply -f k8s/ingress/api-ingress.yaml

# Verify ingress TLS status
kubectl get ingress -o wide
kubectl describe ingress frontend-ingress
kubectl describe ingress api-ingress
```

## 4. Certificate Monitoring & Validation

### 4.1 Monitor Certificate Expiration

```bash
# Script: scripts/monitoring/check-cert-expiry.sh

#!/bin/bash
set -e

THRESHOLD_DAYS=30
ALERT_EMAIL="ops@forge.ai"
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL}"

echo "=== Certificate Expiration Report ==="
echo "Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

# Check all certificates in cluster
CERTS=$(kubectl get certificate -A -o json)

EXPIRING_SOON=()
EXPIRED=()
HEALTHY=()

echo "$CERTS" | jq -r '.items[] | 
  "\(.metadata.namespace)|\(.metadata.name)|\(.status.notAfter)"' | 
while IFS='|' read -r namespace cert notafter; do
  
  if [[ -z "$notafter" ]]; then
    echo "⚠️  PENDING: $namespace/$cert (waiting for issuance)"
    continue
  fi
  
  expiry_epoch=$(date -d "$notafter" +%s)
  now_epoch=$(date +%s)
  days_until=$((($expiry_epoch - $now_epoch) / 86400))
  
  if [[ $days_until -lt 0 ]]; then
    echo "❌ EXPIRED: $namespace/$cert (expired $((-$days_until)) days ago)"
    EXPIRED+=("$namespace/$cert")
  elif [[ $days_until -lt $THRESHOLD_DAYS ]]; then
    echo "⚠️  EXPIRING SOON: $namespace/$cert ($days_until days until expiry)"
    EXPIRING_SOON+=("$namespace/$cert")
  else
    echo "✅ HEALTHY: $namespace/$cert ($days_until days until expiry)"
    HEALTHY+=("$namespace/$cert")
  fi
done

echo ""
echo "Summary: ${#HEALTHY[@]} healthy, ${#EXPIRING_SOON[@]} expiring soon, ${#EXPIRED[@]} expired"

# Alert if certificates expiring or expired
if [[ ${#EXPIRING_SOON[@]} -gt 0 ]] || [[ ${#EXPIRED[@]} -gt 0 ]]; then
  # Slack notification
  curl -X POST -H 'Content-type: application/json' \
    --data "{
      \"text\": \"⚠️  Certificate expiration alert\",
      \"blocks\": [{
        \"type\": \"section\",
        \"text\": {
          \"type\": \"mrkdwn\",
          \"text\": \"*Certificate Expiration Alert*\n\n*Expiring Soon:* ${#EXPIRING_SOON[@]}\n*Expired:* ${#EXPIRED[@]}\n\nCheck Kubernetes certificates immediately.\"
        }
      }]
    }" \
    "$SLACK_WEBHOOK" 2>/dev/null || true
  
  # Email notification
  echo "Certificate expiration alert - $(date)" | \
    mail -s "Certificate Expiration Alert" "$ALERT_EMAIL" || true
  
  exit 1
fi

exit 0
```

Run the script:

```bash
# Make executable
chmod +x scripts/monitoring/check-cert-expiry.sh

# Run manually
./scripts/monitoring/check-cert-expiry.sh

# Add to cron for daily checks (6 AM UTC)
0 6 * * * /opt/forge/scripts/monitoring/check-cert-expiry.sh >> /var/log/cert-check.log 2>&1
```

### 4.2 Verify Certificate Chain

```bash
# Extract certificate from secret
kubectl get secret api-tls-cert -o jsonpath='{.data.tls\.crt}' | base64 -d > /tmp/api-cert.pem

# View certificate details
openssl x509 -in /tmp/api-cert.pem -text -noout

# Verify certificate chain
openssl x509 -in /tmp/api-cert.pem -noout -issuer -subject -dates

# Check certificate against domain
echo | openssl s_client -servername api.forge.ai -connect api.forge.ai:443 2>/dev/null | \
  openssl x509 -noout -text

# Verify TLS on live endpoint
curl -v https://api.forge.ai/health 2>&1 | grep -A5 "certificate:"
```

### 4.3 Prometheus Metrics for Certificate Expiration

**Alerting rules: `k8s/monitoring/cert-expiry-rules.yaml`**

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: cert-expiry-alerts
  namespace: monitoring
spec:
  groups:
  - name: certificate-alerts
    interval: 30s
    rules:
    
    # Alert: Certificate expiring within 7 days
    - alert: CertificateExpiringSoon
      expr: |
        (certmanager_certificate_expiration_timestamp_seconds - time()) / 86400 < 7
      for: 1h
      labels:
        severity: warning
        component: certificates
      annotations:
        summary: "Certificate {{ $labels.name }} expiring in {{ ($value | humanizeDuration) }}"
        description: "Certificate {{ $labels.namespace }}/{{ $labels.name }} will expire in {{ printf \"%.0f\" $value }} days"
    
    # Alert: Certificate expired
    - alert: CertificateExpired
      expr: |
        (certmanager_certificate_expiration_timestamp_seconds - time()) < 0
      for: 5m
      labels:
        severity: critical
        component: certificates
      annotations:
        summary: "Certificate {{ $labels.name }} has expired"
        description: "Certificate {{ $labels.namespace }}/{{ $labels.name }} expired {{ printf \"%.0f\" (-(($value) / 86400)) }} days ago. Immediate action required."
    
    # Alert: Certificate renewal failed
    - alert: CertificateRenewalFailed
      expr: |
        increase(certmanager_certificate_renewal_errors_total[1h]) > 0
      labels:
        severity: high
        component: certificates
      annotations:
        summary: "Certificate renewal failed for {{ $labels.name }}"
        description: "cert-manager failed to renew certificate {{ $labels.namespace }}/{{ $labels.name }}. Check cert-manager logs."
```

Apply the rules:

```bash
kubectl apply -f k8s/monitoring/cert-expiry-rules.yaml

# Verify rules are loaded
kubectl get prometheusrule -n monitoring
```

## 5. Automatic Renewal Process

### 5.1 How Auto-Renewal Works

```
Day 1 (Certificate Issued)
├─ Certificate valid for: 90 days
├─ Renewal window: 60 days before expiry (day 30)
└─ Status: READY (Secret created with cert + key)

Day 30 (Renewal Window Opens)
├─ cert-manager observes: Certificate.renewBefore threshold met
├─ Action: Initiates new ACME order with Let's Encrypt
├─ Challenge: HTTP-01 validation (prove domain ownership)
├─ Solver: nginx-ingress validates HTTP challenge
└─ Status: PENDING (new certificate being issued)

Day 31 (Renewal Complete)
├─ New certificate received from Let's Encrypt
├─ Action: Secret api-tls-cert updated with new cert + key
├─ Validation: New cert immediately available to Ingress
└─ Status: READY (new certificate active)

Day 90 (Original Certificate Expires)
├─ New certificate already in use for 59 days
├─ No service disruption (certificate already renewed)
└─ Status: READY (new cert active, old cert not used)

Day 120 (New Certificate Renewal Window Opens)
├─ New cert issued on day 31, valid until day 121
├─ Renewal window: Day 91 (60 days before day 121)
├─ Cycle repeats
└─ Status: Automatic renewal continues
```

### 5.2 Monitor Renewal Activity

```bash
# Watch certificate status during renewal
kubectl get certificate api-forge-ai-cert -w

# Check cert-manager controller logs
kubectl logs -n cert-manager -l app.kubernetes.io/name=cert-manager --tail=100 | grep -i renewal

# Check for ACME orders
kubectl get orders -A
kubectl describe order api-forge-ai-cert-<random>

# Check for ACME challenges
kubectl get challenges -A
kubectl describe challenge api-forge-ai-cert-<random>-<random>

# Verify renewed certificate in secret
kubectl get secret api-tls-cert -o jsonpath='{.data.tls\.crt}' | base64 -d | \
  openssl x509 -noout -dates

# Monitor renewal metrics in Prometheus
# Query: certmanager_certificate_renewal_errors_total
# Query: increase(certmanager_certificate_renewal_errors_total[24h])
```

## 6. Manual Certificate Renewal

### 6.1 Force Certificate Renewal

Use when certificate renewal fails automatically or immediate renewal is needed:

```bash
# Delete the certificate (triggers immediate renewal)
kubectl delete certificate api-forge-ai-cert

# Immediately reapply (new renewal cycle begins)
kubectl apply -f k8s/cert-manager/certificates.yaml

# Watch status
kubectl get certificate api-forge-ai-cert -w

# Expected progression:
# NAME                  READY   SECRET              AGE
# api-forge-ai-cert     False   api-tls-cert        5s     (Issuing)
# api-forge-ai-cert     True    api-tls-cert        30s    (Ready)
```

### 6.2 Replace Specific Certificate

For single domain renewal without affecting others:

```bash
# Edit certificate resource
kubectl edit certificate api-forge-ai-cert

# Change renewBefore to trigger immediate renewal
# From:  renewBefore: 1440h
# To:    renewBefore: 8760h  (much earlier threshold)

# Save and exit (renewal triggers automatically)

# Revert after renewal completes
kubectl edit certificate api-forge-ai-cert
# Change back to: renewBefore: 1440h
```

## 7. Emergency Certificate Procedures

### 7.1 Use Self-Signed Certificate (Temporary)

When Let's Encrypt fails or temporary certificate needed:

```bash
# Create temporary self-signed certificate
kubectl patch certificate api-forge-ai-cert -p \
  '{"spec":{"issuerRef":{"name":"selfsigned-issuer","kind":"ClusterIssuer"}}}'

# Monitor
kubectl get certificate api-forge-ai-cert -w

# Once ready, verify in browser (expect self-signed warning)
curl -k https://api.forge.ai/health  # -k ignores self-signed cert

# When Let's Encrypt recovers, switch back
kubectl patch certificate api-forge-ai-cert -p \
  '{"spec":{"issuerRef":{"name":"letsencrypt-prod","kind":"ClusterIssuer"}}}'
```

### 7.2 Manual Certificate Import

Import existing external certificate (for migration scenarios):

```bash
# Create TLS secret with external cert
kubectl create secret tls external-cert \
  --cert=path/to/cert.pem \
  --key=path/to/key.pem \
  --namespace=default

# Update Ingress to use external cert
kubectl patch ingress frontend-ingress -p \
  '{"spec":{"tls":[{"hosts":["app.forge.ai"],"secretName":"external-cert"}]}}'

# Verify
curl -v https://app.forge.ai
```

## 8. Certificate Rotation & Cleanup

### 8.1 Scheduled Rotation (Annual)

Process for rotating certificates annually:

```bash
# 1. Notify all stakeholders 2 weeks before rotation
# Email ops@forge.ai, security@forge.ai

# 2. Create backup of current certificates
./scripts/backup/backup-certificates.sh

# 3. Verify Let's Encrypt rate limits are not exceeded
kubectl logs -n cert-manager -l app.kubernetes.io/name=cert-manager | grep -i "rate"

# 4. Create new ClusterIssuer (staging for validation)
kubectl apply -f k8s/cert-manager/cluster-issuer-staging.yaml

# 5. Batch renew all certificates (in sequence to avoid rate limits)
for cert in api-forge-ai-cert app-forge-ai-cert grafana-forge-ai-cert; do
  kubectl delete certificate $cert
  sleep 60  # Wait between renewals to avoid rate limits
  kubectl apply -f k8s/cert-manager/certificates.yaml
done

# 6. Verify all certificates renewed successfully
./scripts/monitoring/check-cert-expiry.sh

# 7. Monitor for 24 hours for any TLS errors
kubectl logs -f -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx | grep -i tls

# 8. Cleanup old certificates from secrets (optional, keep for 30 days)
kubectl delete secret api-tls-cert-old --ignore-not-found

# 9. Document completion
echo "Certificate rotation completed: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> /var/log/cert-rotation.log
```

### 8.2 Cleanup Expired Certificate Secrets

```bash
# Script: scripts/maintenance/cleanup-expired-certs.sh

#!/bin/bash
set -e

RETENTION_DAYS=30
CLEANUP_LOG="/var/log/cert-cleanup.log"

echo "Certificate cleanup started: $(date)" | tee -a "$CLEANUP_LOG"

# Find all TLS secrets
kubectl get secrets -A -o json | jq -r '.items[] | select(.type=="kubernetes.io/tls") | 
  "\(.metadata.namespace)|\(.metadata.name)|\(.metadata.creationTimestamp)"' | 
while IFS='|' read -r namespace name created; do
  
  # Check if certificate object still exists
  cert_name=$(echo "$name" | sed 's/-tls-cert$//')
  
  if ! kubectl get certificate "$cert_name" -n "$namespace" &>/dev/null; then
    # Certificate object deleted, check age of secret
    created_epoch=$(date -d "$created" +%s)
    now_epoch=$(date +%s)
    age_days=$((($now_epoch - $created_epoch) / 86400))
    
    if [[ $age_days -gt $RETENTION_DAYS ]]; then
      echo "Deleting orphaned secret: $namespace/$name (age: $age_days days)" | tee -a "$CLEANUP_LOG"
      kubectl delete secret "$name" -n "$namespace"
    fi
  fi
done

echo "Certificate cleanup completed: $(date)" | tee -a "$CLEANUP_LOG"
```

## 9. Troubleshooting

### 9.1 Certificate Not Issued

**Symptoms**: Certificate stuck in "Pending" state

```bash
# Check certificate status
kubectl describe certificate api-forge-ai-cert

# Check for failed challenge
kubectl get challenges -n default
kubectl describe challenge <challenge-name>

# Common issues:
# - DNS not propagated (DNS-01): Wait 5 minutes and retry
# - Ingress not ready (HTTP-01): Verify ingress is accessible
# - Rate limit exceeded: Wait 1 hour and retry

# Solution: Delete and reapply
kubectl delete certificate api-forge-ai-cert
sleep 30
kubectl apply -f k8s/cert-manager/certificates.yaml
```

### 9.2 Certificate Renewal Failed

**Symptoms**: Certificate nearing expiration, renewal errors in logs

```bash
# Check cert-manager logs
kubectl logs -n cert-manager -l app.kubernetes.io/name=cert-manager | tail -50

# Check webhook is running
kubectl get pods -n cert-manager | grep webhook

# Restart cert-manager if webhook unhealthy
kubectl rollout restart deployment cert-manager-webhook -n cert-manager
kubectl rollout status deployment cert-manager-webhook -n cert-manager

# Force renewal
kubectl delete certificate api-forge-ai-cert
kubectl apply -f k8s/cert-manager/certificates.yaml
```

### 9.3 TLS Handshake Errors

**Symptoms**: Clients seeing certificate errors, browser warnings

```bash
# Verify certificate in secret
kubectl get secret api-tls-cert -o jsonpath='{.data.tls\.crt}' | base64 -d | \
  openssl x509 -noout -text | head -20

# Check certificate dates
kubectl get secret api-tls-cert -o jsonpath='{.data.tls\.crt}' | base64 -d | \
  openssl x509 -noout -dates

# Verify certificate chain completeness
kubectl get secret api-tls-cert -o jsonpath='{.data.tls\.crt}' | base64 -d | \
  openssl crl2pkcs7 -nocrl -certfile /dev/stdin | openssl pkcs7 -print_certs -text

# Test TLS connection
openssl s_client -connect api.forge.ai:443 -showcerts

# If certificate mismatch, trigger renewal
kubectl patch certificate api-forge-ai-cert -p '{"spec":{"renewBefore":"8760h"}}'
```

## 10. Security Considerations

### 10.1 Securing Certificate Secrets

```bash
# 1. Encrypt secrets at rest (ETCD encryption)
# Already configured in k8s/security-hardening.md

# 2. Restrict RBAC access to TLS secrets
kubectl apply -f k8s/rbac/tls-secret-access.yaml
```

**File: `k8s/rbac/tls-secret-access.yaml`**

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: tls-secret-reader
  namespace: default
rules:
- apiGroups: [""]
  resources: ["secrets"]
  resourceNames:
  - api-tls-cert
  - app-tls-cert
  - internal-wildcard-tls-cert
  verbs: ["get", "watch"]  # No 'list' to prevent enumeration

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: tls-secret-reader-binding
  namespace: default
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: tls-secret-reader
subjects:
- kind: ServiceAccount
  name: api-sa
  namespace: default
- kind: ServiceAccount
  name: frontend-sa
  namespace: default
```

### 10.2 Audit Logging for Certificate Changes

```bash
# Enable Kubernetes audit logging for certificate-related events
# See k8s/security-hardening.md for full audit policy

# Query audit logs for certificate modifications
kubectl get events -A --field-selector reason=Created,involvedObject.kind=Certificate
kubectl get events -A --field-selector reason=Updated,involvedObject.kind=Certificate

# Check cert-manager controller logs for suspicious activity
kubectl logs -n cert-manager -l app.kubernetes.io/name=cert-manager | \
  grep -i "certificate\|renewal\|error" | head -50
```

## 11. Compliance & Audit

### 11.1 Certificate Audit Report

**Script: `scripts/compliance/cert-audit-report.sh`**

```bash
#!/bin/bash

echo "=== Certificate Compliance Audit Report ==="
echo "Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

# 1. List all certificates and expiration dates
echo "## All Certificates"
kubectl get certificate -A -o wide

# 2. Verify all uses TLS 1.2+
echo ""
echo "## TLS Protocol Verification"
for domain in api.forge.ai app.forge.ai grafana.forge.ai; do
  echo -n "Testing $domain: "
  echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | \
    grep "Protocol" | awk '{print $NF}'
done

# 3. Verify Let's Encrypt issuance
echo ""
echo "## Certificate Issuance Source"
kubectl get certificate -A -o jsonpath='{.items[*].spec.issuerRef.name}' | tr ' ' '\n' | sort | uniq -c

# 4. Check certificate secret encryption
echo ""
echo "## Secret Encryption Status"
kubectl get secrets -A -o json | jq '.items[] | select(.type=="kubernetes.io/tls") | 
  {namespace: .metadata.namespace, name: .metadata.name, encrypted: (.metadata.managedFields != null)}'

# 5. RBAC audit for certificate access
echo ""
echo "## RBAC Configuration for TLS Secrets"
kubectl get rolebindings -A -o wide | grep -i tls
kubectl get clusterrolebindings -o wide | grep -i certificate

# 6. cert-manager version and configuration
echo ""
echo "## cert-manager Status"
kubectl get deployment -n cert-manager
kubectl get clusterissuer

# 7. Recent renewal activity
echo ""
echo "## Recent Certificate Events"
kubectl get events -A --sort-by='.lastTimestamp' | grep -i certificate | tail -20
```

### 11.2 SOC 2 Compliance

- **Issuance**: All certificates issued by trusted provider (Let's Encrypt)
- **Rotation**: Automatic renewal 60 days before expiry
- **Validation**: Domain ownership verified via HTTP-01 or DNS-01
- **Encryption**: TLS 1.2+ enforced, weak ciphers disabled
- **Monitoring**: Expiration alerts, renewal tracking, audit logging
- **Access Control**: RBAC restricts certificate secret access
- **Change Tracking**: All modifications logged to Kubernetes audit logs

