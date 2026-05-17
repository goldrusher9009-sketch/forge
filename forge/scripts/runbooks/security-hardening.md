# Security Hardening & Network Policies Runbook

**Phase:** 10 - Production Deployment  
**Last Updated:** 2026-05-06  
**Owner:** Security Team  
**Severity:** Critical  

## Overview

This runbook documents security hardening procedures, network policies, and compliance controls for the Forge Platform in production. Security is foundational to platform reliability and customer trust.

## Network Policies

### Namespace Isolation

```yaml
# Deny all ingress traffic by default
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: forge
spec:
  podSelector: {}
  policyTypes:
  - Ingress

# Deny all egress traffic by default
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-egress
  namespace: forge
spec:
  podSelector: {}
  policyTypes:
  - Egress
```

### API Service Access

```yaml
# Allow frontend to call API
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-api
  namespace: forge
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8000

# Allow ingress from outside (via ingress controller)
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-ingress-controller
  namespace: forge
spec:
  podSelector:
    matchLabels:
      app: frontend
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 3000
```

### Database Access

```yaml
# Only API can access database
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-api-to-database
  namespace: forge
spec:
  podSelector:
    matchLabels:
      app: db
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: api
    ports:
    - protocol: TCP
      port: 5432
```

### Cache Access

```yaml
# Both API and background jobs can access Redis
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-app-to-cache
  namespace: forge
spec:
  podSelector:
    matchLabels:
      app: redis
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchExpressions:
        - key: app
          operator: In
          values: ["api", "jobs"]
    ports:
    - protocol: TCP
      port: 6379
```

### Monitoring & Logging Access

```yaml
# Allow Prometheus scrape endpoints
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-prometheus-scrape
  namespace: forge
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: monitoring
    ports:
    - protocol: TCP
      port: 9090
    - protocol: TCP
      port: 9100

# Allow logs to be sent to Logstash
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-logstash-ingress
  namespace: forge
spec:
  podSelector:
    matchLabels:
      app: logstash
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 5000
```

### Egress Rules (Controlled Access)

```yaml
# API can only reach specific external services
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-egress-policy
  namespace: forge
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
  - Egress
  egress:
  # Allow DNS
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: UDP
      port: 53
  # Allow database
  - to:
    - podSelector:
        matchLabels:
          app: db
    ports:
    - protocol: TCP
      port: 5432
  # Allow cache
  - to:
    - podSelector:
        matchLabels:
          app: redis
    ports:
    - protocol: TCP
      port: 6379
  # Allow external API calls (rate limited)
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 443
```

## Pod Security Policies

### Restricted Security Policy

```yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: restricted-psp
  annotations:
    seccomp.security.alpha.kubernetes.io/allowedProfileNames: 'runtime/default'
    apparmor.security.beta.kubernetes.io/allowedProfileNames: 'runtime/default'
    seccomp.security.alpha.kubernetes.io/defaultProfileName: 'runtime/default'
    apparmor.security.beta.kubernetes.io/defaultProfileName: 'runtime/default'
spec:
  # Prevent privileged containers
  privileged: false
  allowPrivilegeEscalation: false
  
  # Require non-root user
  runAsUser:
    rule: 'MustRunAsNonRoot'
  
  # Restrict Linux capabilities
  requiredDropCapabilities:
  - ALL
  allowedCapabilities: []
  
  # Restrict volume types
  volumes:
  - 'configMap'
  - 'emptyDir'
  - 'projected'
  - 'secret'
  - 'downwardAPI'
  - 'persistentVolumeClaim'
  
  # Enforce read-only filesystem
  readOnlyRootFilesystem: true
  
  # Restrict host access
  hostNetwork: false
  hostIPC: false
  hostPID: false
  
  # SELinux restrictions
  seLinux:
    rule: 'MustRunAs'
    seLinuxOptions:
      level: "s0:c123,c456"
  
  # FSGroup restrictions
  fsGroup:
    rule: 'MustRunAs'
    ranges:
    - min: 1000
      max: 2000
  
  # Run as specific UID
  runAsUser:
    rule: 'MustRunAs'
    ranges:
    - min: 1000
      max: 2000
```

### Bind Policy to Role

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: restricted-psp-user
rules:
- apiGroups:
  - policy
  resources:
  - podsecuritypolicies
  verbs:
  - use
  resourceNames:
  - restricted-psp

apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: restrict-psp-binding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: restricted-psp-user
subjects:
- kind: ServiceAccount
  name: default
  namespace: forge
```

## RBAC Configuration

### Service Accounts & Roles

```yaml
# API service account (minimal permissions)
apiVersion: v1
kind: ServiceAccount
metadata:
  name: api-sa
  namespace: forge

apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: api-role
  namespace: forge
rules:
# Read config maps for configuration
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list", "watch"]
  resourceNames: ["api-config"]
# Read secrets for credentials
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get"]
  resourceNames: ["api-secrets", "db-credentials"]
# Write logs (if using k8s logging)
- apiGroups: [""]
  resources: ["events"]
  verbs: ["create", "patch"]

apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: api-rolebinding
  namespace: forge
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: api-role
subjects:
- kind: ServiceAccount
  name: api-sa
  namespace: forge

# Frontend service account
apiVersion: v1
kind: ServiceAccount
metadata:
  name: frontend-sa
  namespace: forge

apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: frontend-role
  namespace: forge
rules:
# Read-only access to deployed version info
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get"]
  resourceNames: ["version-info"]

apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: frontend-rolebinding
  namespace: forge
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: frontend-role
subjects:
- kind: ServiceAccount
  name: frontend-sa
  namespace: forge
```

## Secret Management

### Secret Encryption at Rest

```yaml
# Enable encryption provider in kube-apiserver
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
- resources:
  - secrets
  providers:
  - aescbc:
      keys:
      - name: key1
        secret: <base64-encoded-32-byte-key>
  - identity: {}
```

### Secret Storage

```bash
# DO NOT store secrets in ConfigMaps
# DO NOT store secrets in environment variables (except as k8s secret references)
# DO NOT commit secrets to Git
# DO encrypt secrets in etcd

# Store credentials using External Secrets Operator
# Fetch from HashiCorp Vault / AWS Secrets Manager at runtime

# Create secret reference in deployment
apiVersion: v1
kind: Secret
metadata:
  name: api-secrets
  namespace: forge
type: Opaque
data:
  DATABASE_URL: <base64-encoded-url>
  JWT_SECRET: <base64-encoded-secret>
  API_KEY: <base64-encoded-key>
```

### Secret Rotation

```bash
# Monthly secret rotation procedure
# 1. Generate new secrets in secure storage system
# 2. Update k8s Secret with new values (dual-write period)
# 3. Restart pods to pick up new secrets
# 4. Verify old secrets no longer work
# 5. Remove old secrets from storage system

# Automated rotation using External Secrets Operator
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: vault-backend
  namespace: forge
spec:
  provider:
    vault:
      server: "https://vault.example.com:8200"
      path: "secret/data/forge"
      auth:
        kubernetes:
          mountPath: "kubernetes"
          role: "forge"

apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: api-secrets
  namespace: forge
spec:
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
  target:
    name: api-secrets
    creationPolicy: Owner
  data:
  - secretKey: DATABASE_URL
    remoteRef:
      key: database_url
  - secretKey: JWT_SECRET
    remoteRef:
      key: jwt_secret
```

## Image Security

### Container Image Scanning

```bash
# Scan images before deployment
trivy image --severity HIGH,CRITICAL registry.example.com/forge/api:latest
trivy image --format json --output scan-report.json registry.example.com/forge/api:latest

# Fail build if critical vulnerabilities found
if trivy image --exit-code 1 --severity CRITICAL registry.example.com/forge/api:latest; then
  echo "Image contains critical vulnerabilities"
  exit 1
fi

# Scan regularly (nightly)
# Use Trivy in CI/CD and as Kubernetes Admission Controller
```

### Image Signing & Verification

```yaml
# Sign images with Cosign
# cosign sign --key cosign.key registry.example.com/forge/api:latest

# Verify image signature on deployment
apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingWebhookConfiguration
metadata:
  name: image-signature-verification
webhooks:
- name: verify.sigstore.dev
  clientConfig:
    service:
      name: image-signature-verifier
      namespace: kube-system
  rules:
  - operations: ["CREATE", "UPDATE"]
    apiGroups: [""]
    apiVersions: ["v1"]
    resources: ["pods"]
  failurePolicy: Fail
```

### Private Image Registry

```yaml
# Create secret for private registry authentication
kubectl create secret docker-registry regcred \
  --docker-server=registry.example.com \
  --docker-username=$REGISTRY_USER \
  --docker-password=$REGISTRY_PASSWORD \
  --docker-email=$REGISTRY_EMAIL \
  -n forge

# Reference in deployments
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: forge
spec:
  template:
    spec:
      imagePullSecrets:
      - name: regcred
      containers:
      - name: api
        image: registry.example.com/forge/api:latest
```

## Runtime Security

### Falco Runtime Monitoring

```yaml
# Deploy Falco for runtime threat detection
apiVersion: v1
kind: ConfigMap
metadata:
  name: falco-rules
  namespace: falco
data:
  custom-rules.yaml: |
    - rule: Suspicious Binary Execution
      desc: Detect execution of suspicious binaries
      condition: >
        spawned_process and
        container and
        (proc.name in (nc, bash, sh, curl, wget) or
         proc.args contains "exec" or
         proc.args contains "/tmp/")
      output: >
        Suspicious process execution
        (user=%user.name command=%proc.cmdline container=%container.name)
      priority: WARNING
      tags: [container, shell, security]

    - rule: Unauthorized File Access
      desc: Detect access to sensitive files
      condition: >
        open and
        container and
        (fd.name glob "*/.ssh/*" or
         fd.name glob "*/passwd" or
         fd.name glob "*/shadow")
      output: >
        Sensitive file access attempt
        (user=%user.name file=%fd.name container=%container.name)
      priority: CRITICAL
      tags: [container, filesystem, security]

    - rule: Reverse Shell Detection
      desc: Detect potential reverse shell attempts
      condition: >
        spawned_process and
        container and
        ((proc.name = bash and proc.args contains "/dev/tcp/") or
         (proc.name = nc and proc.args regex ".*-[a-z]*e.*"))
      output: >
        Potential reverse shell attempt
        (user=%user.name command=%proc.cmdline container=%container.name)
      priority: CRITICAL
      tags: [container, shell, security]
```

## Compliance & Auditing

### Audit Logging

```yaml
# Enable Kubernetes audit logging
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
# Log all at Metadata level
- level: Metadata
  omitStages:
  - RequestReceived

# Log secret access at RequestResponse level
- level: RequestResponse
  verbs: ["get", "list"]
  resources: ["secrets"]
  
# Log pod exec commands
- level: RequestResponse
  verbs: ["create"]
  resources: ["pods/exec"]
  
# Log all ClusterRole/RoleBinding changes
- level: RequestResponse
  verbs: ["create", "update", "patch", "delete"]
  resources: ["clusterroles", "clusterrolebindings", "roles", "rolebindings"]

# Catch-all rule
- level: Metadata
```

### Compliance Scanning

```bash
# Run Kubernetes CIS Benchmarks
kubesec scan deployment.yaml
kube-bench run --targets node,policies

# Output:
# [PASS] 1.1.1 Ensure that the API server pod specification file permissions are set to 644 or more restrictive
# [WARN] 1.1.2 Ensure that the API server pod specification file ownership is set to root:root
# [FAIL] 1.1.3 Ensure that the controller manager pod specification file permissions are set to 644 or more restrictive
```

### Data Protection

```yaml
# Encryption at rest for etcd
# Encryption in transit: enforce TLS 1.2+
# Data classification and retention

apiVersion: v1
kind: ConfigMap
metadata:
  name: data-policy
  namespace: forge
data:
  retention-policy.txt: |
    Public Data: No retention requirement
    Internal Data: 30 days
    User Data: 365 days (required by GDPR)
    Financial Data: 7 years (compliance)
    
    Encryption:
    - All data encrypted in transit (TLS 1.2+)
    - All data encrypted at rest (AES-256)
    - Keys rotated every 90 days
    - HSM for key storage
```

## Access Control

### Multi-Factor Authentication

```bash
# Enforce MFA for all cluster access
# Users must provide:
# 1. SSH key or certificate
# 2. Time-based OTP (TOTP)
# 3. Approval from second person

# Use Kubernetes audit logs to track who made changes
kubectl logs -n kube-system kube-apiserver-*.log | grep "user.username=john" | grep "verdict=allow"
```

### Least Privilege Principle

```yaml
# Default deny all
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: no-default-permissions
rules: []

apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: no-default-permissions
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: no-default-permissions
subjects:
- kind: Group
  name: system:authenticated

# Grant specific permissions per role
# Example: read-only access to certain namespaces
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: read-pods
  namespace: forge
rules:
- apiGroups: [""]
  resources: ["pods", "pods/logs"]
  verbs: ["get", "list", "watch"]
```

## Incident Response

### Security Incident Classification

```
SEV-1 (Immediate):
- Data breach confirmed
- Unauthorized root access
- Malware detected
- Active ongoing attack

SEV-2 (Urgent - <1 hour):
- Unauthorized access attempt
- Suspicious network activity
- Policy violation
- Unpatched critical vulnerability

SEV-3 (Important - <4 hours):
- Failed security scan
- Configuration drift
- Certificate expiration <30 days
- Suspicious log patterns
```

### Incident Response Procedure

```bash
# 1. Detect (automated alerts + manual review)
# 2. Isolate (disconnect affected pods/nodes)
kubectl cordon <node>
kubectl drain <node> --ignore-daemonsets

# 3. Preserve evidence
kubectl describe node <node>
kubectl logs <pod> --previous
kubectl get events -A --sort-by='.lastTimestamp'

# 4. Investigate root cause
grep -r "pattern" /var/log/
kubesec scan <deployment>
trivy image <image>

# 5. Remediate
# - Patch vulnerability
# - Revoke compromised credentials
# - Update security rules
# - Restart affected pods

# 6. Communicate
# - Notify security team
# - Notify affected customers (if PII exposed)
# - Update status page

# 7. Post-incident
# - Document root cause
# - Update security policies
# - Implement preventive controls
```

## Security Checklist for Production

### Pre-Deployment
- [ ] All images scanned for vulnerabilities (Trivy)
- [ ] All images signed and verified
- [ ] All secrets encrypted at rest
- [ ] Network policies configured
- [ ] RBAC roles reviewed and approved
- [ ] PSP/Pod Security Standards applied
- [ ] Audit logging enabled
- [ ] Falco rules deployed
- [ ] TLS certificates valid

### Post-Deployment
- [ ] Verify network policies are working
- [ ] Verify secret encryption is active
- [ ] Verify audit logs are being collected
- [ ] Verify runtime monitoring is active
- [ ] Verify no privileged containers running
- [ ] Verify no secrets in logs/environment
- [ ] Verify image registry authentication working
- [ ] Verify compliance scanning passing

### Ongoing
- [ ] Weekly security advisory review
- [ ] Monthly vulnerability scan
- [ ] Quarterly penetration testing
- [ ] Annual SOC 2 audit
- [ ] Continuous compliance monitoring
- [ ] Regular access reviews
- [ ] Secret rotation schedule maintained
- [ ] Security incident response drills

## Security Documentation

For detailed security procedures, see:
- [TLS Certificate Management](./tls-certificate-management.md)
- [Incident Response](./incident-response.md)
- [Backup & Recovery](./backup-recovery.md)
- [Access Control Policy](../policies/access-control.md)
