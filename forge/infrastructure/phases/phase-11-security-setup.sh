#!/bin/bash
# Phase 11: Security Setup
# Duration: 1.5 hours
# Components: Network Policies, RBAC, Pod Security, Secrets Management, cert-manager

set -e

PHASE_NAME="11-security-setup"
LOG_FILE="/tmp/${PHASE_NAME}.log"
OUTPUTS_FILE="/tmp/${PHASE_NAME}-outputs.txt"

echo "Starting Phase 11: Security Setup" | tee -a $LOG_FILE
echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a $LOG_FILE

# Load previous outputs
if [ ! -f "/tmp/phase-02-outputs.txt" ]; then
  echo "ERROR: Phase 2 outputs not found" | tee -a $LOG_FILE
  exit 1
fi

source /tmp/phase-02-outputs.txt
CLUSTER_NAME="${CLUSTER_NAME:-forge-eks-cluster}"
REGION="${AWS_REGION:-us-east-1}"

echo "Using EKS Cluster: $CLUSTER_NAME" | tee -a $LOG_FILE

# Create cert-manager namespace
echo "Installing cert-manager for certificate management..." | tee -a $LOG_FILE
kubectl create namespace cert-manager --dry-run=client -o yaml | kubectl apply -f -

# Add cert-manager Helm repository
helm repo add jetstack https://charts.jetstack.io
helm repo update

# Install cert-manager
helm upgrade --install cert-manager jetstack/cert-manager \
  -n cert-manager \
  --set installCRDs=true \
  --wait \
  --timeout 10m

# Create ClusterIssuer for Let's Encrypt
cat > /tmp/letsencrypt-issuer.yaml << 'ISSUER_CONFIG'
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@forge.io
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: alb
      - dns01:
          route53:
            region: us-east-1
---
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: admin@forge.io
    privateKeySecretRef:
      name: letsencrypt-staging
    solvers:
      - http01:
          ingress:
            class: alb
      - dns01:
          route53:
            region: us-east-1
ISSUER_CONFIG

kubectl apply -f /tmp/letsencrypt-issuer.yaml

# Create NetworkPolicy for forge-prod namespace
cat > /tmp/network-policies.yaml << 'NETWORK_POLICIES'
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: forge-default-deny
  namespace: forge-prod
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  # Explicitly deny all
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-ingress-controller
  namespace: forge-prod
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: TCP
      port: 8080
    - protocol: TCP
      port: 8443
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-auth-service
  namespace: forge-prod
spec:
  podSelector:
    matchLabels:
      app: forge-auth-service
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: forge-api-service
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 5432
    - protocol: TCP
      port: 6379
    - protocol: TCP
      port: 9200
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-api-service
  namespace: forge-prod
spec:
  podSelector:
    matchLabels:
      app: forge-api-service
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: TCP
      port: 8443
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: forge-auth-service
    ports:
    - protocol: TCP
      port: 8080
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 5432
    - protocol: TCP
      port: 6379
    - protocol: TCP
      port: 9092
    - protocol: TCP
      port: 9200
NETWORK_POLICIES

kubectl apply -f /tmp/network-policies.yaml

# Create RBAC Roles
echo "Creating RBAC configuration..." | tee -a $LOG_FILE
cat > /tmp/rbac-config.yaml << 'RBAC_CONFIG'
apiVersion: v1
kind: ServiceAccount
metadata:
  name: forge-app-sa
  namespace: forge-prod
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: forge-app-role
  namespace: forge-prod
rules:
  - apiGroups: [""]
    resources: ["configmaps", "secrets"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["services"]
    verbs: ["get", "list"]
  - apiGroups: ["batch"]
    resources: ["jobs"]
    verbs: ["create", "get", "list", "watch", "patch"]
  - apiGroups: ["apps"]
    resources: ["deployments"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: forge-app-rolebinding
  namespace: forge-prod
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: forge-app-role
subjects:
  - kind: ServiceAccount
    name: forge-app-sa
    namespace: forge-prod
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: forge-read-only
rules:
  - apiGroups: [""]
    resources: ["pods", "services", "nodes"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["apps"]
    resources: ["deployments", "statefulsets"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["batch"]
    resources: ["jobs"]
    verbs: ["get", "list", "watch"]
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: forge-reader
  namespace: forge-prod
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: forge-read-only-binding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: forge-read-only
subjects:
  - kind: ServiceAccount
    name: forge-reader
    namespace: forge-prod
RBAC_CONFIG

kubectl apply -f /tmp/rbac-config.yaml

# Create Pod Security Policy
cat > /tmp/pod-security-policy.yaml << 'PSP_CONFIG'
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: forge-restricted
  annotations:
    seccomp.security.alpha.kubernetes.io/allowedProfileNames: 'runtime/default'
    apparmor.security.beta.kubernetes.io/allowedProfileNames: 'runtime/default'
    seccomp.security.alpha.kubernetes.io/defaultProfileName: 'runtime/default'
    apparmor.security.beta.kubernetes.io/defaultProfileName: 'runtime/default'
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  hostNetwork: false
  hostIPC: false
  hostPID: false
  runAsUser:
    rule: 'MustRunAsNonRoot'
  seLinux:
    rule: 'MustRunAs'
    seLinuxOptions:
      level: 's0:c123,c456'
  supplementalGroups:
    rule: 'MustRunAs'
    ranges:
      - min: 1
        max: 65535
  fsGroup:
    rule: 'MustRunAs'
    ranges:
      - min: 1
        max: 65535
  readOnlyRootFilesystem: false
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: forge-psp-restricted
rules:
  - apiGroups: ['policy']
    resources: ['podsecuritypolicies']
    verbs: ['use']
    resourceNames: ['forge-restricted']
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: forge-psp-restricted-binding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: forge-psp-restricted
subjects:
  - kind: ServiceAccount
    name: forge-app-sa
    namespace: forge-prod
PSP_CONFIG

kubectl apply -f /tmp/pod-security-policy.yaml || echo "PSP may not be available in this K8s version" | tee -a $LOG_FILE

# Create Secrets encryption configuration
echo "Configuring secrets encryption..." | tee -a $LOG_FILE
cat > /tmp/secrets-encryption-provider.yaml << 'ENCRYPTION_CONFIG'
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
  - resources:
    - secrets
    providers:
    - aescbc:
        keys:
        - name: key1
          secret: YOUR_32_BYTE_BASE64_ENCODED_KEY_HERE
    - identity: {}
ENCRYPTION_CONFIG

# Create ExternalSecrets integration for AWS Secrets Manager
echo "Setting up ExternalSecrets for AWS integration..." | tee -a $LOG_FILE
helm repo add external-secrets https://charts.external-secrets.io
helm repo update

helm upgrade --install external-secrets external-secrets/external-secrets \
  -n external-secrets-system \
  --create-namespace \
  --set installCRDs=true \
  --wait \
  --timeout 5m

# Create SecretStore for AWS Secrets Manager
cat > /tmp/secretstore.yaml << 'SECRETSTORE_CONFIG'
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets
  namespace: forge-prod
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: external-secrets-sa
  namespace: forge-prod
---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: forge-secrets-sync
  namespace: forge-prod
spec:
  refreshInterval: 15m
  secretStoreRef:
    name: aws-secrets
    kind: SecretStore
  target:
    name: forge-secrets
    creationPolicy: Owner
  data:
    - secretKey: database-url
      remoteRef:
        key: ForgePostgresConfig
        property: database_url
    - secretKey: redis-url
      remoteRef:
        key: ForgeRedisConfig
        property: redis_url
    - secretKey: kafka-brokers
      remoteRef:
        key: ForgeKafkaConfig
        property: bootstrap_servers
SECRETSTORE_CONFIG

kubectl apply -f /tmp/secretstore.yaml

# Create audit logging configuration
echo "Setting up audit logging..." | tee -a $LOG_FILE
cat > /tmp/audit-policy.yaml << 'AUDIT_POLICY'
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
  - level: RequestResponse
    verbs: ["create", "delete", "deleteCollection"]
    resources: ["secrets", "configmaps"]
    namespaces: ["forge-prod"]
  - level: Metadata
    verbs: ["create", "update", "patch", "delete"]
    resources: ["deployments", "statefulsets"]
    namespaces: ["forge-prod"]
  - level: RequestResponse
    verbs: ["create", "update", "patch"]
    resources: ["pods"]
    namespaces: ["forge-prod"]
  - level: Metadata
    resources: ["*"]
  - level: None
    resources: ["endpoints"]
    verbs: ["get", "watch", "list"]
AUDIT_POLICY

# Save outputs
{
  echo "CERT_MANAGER_NAMESPACE=cert-manager"
  echo "LETSENCRYPT_ISSUER=letsencrypt-prod"
  echo "FORGE_APP_SA=forge-app-sa"
  echo "EXTERNAL_SECRETS_NAMESPACE=external-secrets-system"
  echo "SECRET_STORE=aws-secrets"
  echo "PSP_NAME=forge-restricted"
} | tee $OUTPUTS_FILE

echo "Phase 11 completed successfully" | tee -a $LOG_FILE
echo "Next: Phase 12 - SSL Certificates Setup" | tee -a $LOG_FILE
