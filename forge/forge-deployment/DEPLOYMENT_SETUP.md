# Forge Platform Deployment Setup Guide

## Current Issue: SSL Certificate Warning

The "not safe" error you're seeing occurs because the configuration is using placeholder certificates. Once you complete this setup, Let's Encrypt will automatically provision valid SSL certificates.

## Prerequisites

### 1. DigitalOcean Account & API Token

1. Go to https://cloud.digitalocean.com/account/api/tokens
2. Click "Generate New Token"
3. Name it: `forge-terraform`
4. Select scopes:
   - [x] Read
   - [x] Write
5. Copy the token (you won't see it again)

### 2. Your Domain

Decide on your domain. Examples:
- `forge.yourdomain.com` - for production
- `forge-staging.yourdomain.com` - for staging
- Any domain you own and can configure DNS for

### 3. System Requirements

```bash
# Check you have these installed:
terraform --version          # v1.5.0+
kubectl version             # v1.27.0+
docker --version            # v24.0.0+
doctl version               # v1.98.0+
```

Install missing tools:
- Terraform: https://developer.hashicorp.com/terraform/downloads
- kubectl: https://kubernetes.io/docs/tasks/tools/
- Docker: https://docs.docker.com/get-docker/
- doctl: https://docs.digitalocean.com/reference/doctl/how-to/install/

## Setup Steps

### Step 1: Configure Terraform Variables

Create `terraform/terraform.tfvars`:

```hcl
do_token       = "dop_v1_YOUR_ACTUAL_TOKEN_HERE"
domain         = "forge.yourdomain.com"
region         = "nyc3"
environment    = "production"
node_count     = 3
node_size      = "s-2vcpu-4gb"
```

Replace:
- `YOUR_ACTUAL_TOKEN_HERE` with your DigitalOcean API token
- `forge.yourdomain.com` with your actual domain

### Step 2: Update Kubernetes Manifests

Update these files with your actual domain:

**k8s/ingress.yaml** - Change all instances of `forge.yourdomain.com`:
```yaml
spec:
  tls:
    - hosts:
        - forge.yourdomain.com
        - www.forge.yourdomain.com
        - api.forge.yourdomain.com
      secretName: forge-tls
  rules:
    - host: forge.yourdomain.com
      ...
    - host: www.forge.yourdomain.com
      ...
    - host: api.forge.yourdomain.com
      ...
```

**k8s/configmap.yaml** - Update CORS and API settings:
```yaml
CORS_ORIGIN: "https://forge.yourdomain.com"
API_BASE_URL: "https://api.forge.yourdomain.com"
```

### Step 3: Configure DNS

After Terraform applies, it outputs your Kubernetes load balancer IP. Point your domain to it:

**For your domain registrar:**

1. Set DNS A record:
   - Type: A
   - Name: forge
   - Value: `YOUR_LOAD_BALANCER_IP` (from Terraform output)

2. Set CNAME records:
   - Type: CNAME
   - Name: www
   - Value: forge.yourdomain.com
   
   - Type: CNAME
   - Name: api
   - Value: forge.yourdomain.com

**Wait 5-15 minutes for DNS propagation**

### Step 4: Deploy

```bash
cd forge-deployment

# Initialize Terraform
terraform init

# Verify plan
terraform plan

# Apply infrastructure
terraform apply

# This will output:
# - Load balancer IP (for DNS configuration)
# - PostgreSQL connection details
# - Redis endpoint
# - Container Registry URL
# - All other infrastructure endpoints

# Configure kubectl
doctl kubernetes cluster kubeconfig save forge-cluster

# Deploy services
./scripts/deploy.sh

# Verify deployment
./scripts/verify-deployment.sh
```

### Step 5: Access Your Services

After deployment completes, you can access:

**Frontend:**
- URL: `https://forge.yourdomain.com`
- Should show your web studio interface
- SSL certificate is auto-provisioned by Let's Encrypt

**Backend API:**
- URL: `https://api.forge.yourdomain.com`
- Health check: `https://api.forge.yourdomain.com/health`
- Status: `https://api.forge.yourdomain.com/ready`

**Monitoring:**
- Grafana: `https://api.forge.yourdomain.com/grafana`
- Prometheus: `https://api.forge.yourdomain.com/prometheus`
- Kibana: `https://api.forge.yourdomain.com/kibana`

**Database Access:**
- PostgreSQL: Connection details in Terraform output
- Redis: Managed cluster endpoint from Terraform output

## Security Notes

1. **API Token**: Keep your DigitalOcean API token private
   - Don't commit `terraform.tfvars` to Git
   - Add to `.gitignore`

2. **SSL Certificates**: Let's Encrypt auto-renews every 90 days
   - cert-manager handles renewal automatically
   - No manual intervention needed

3. **Database Credentials**: Stored securely in Kubernetes Secrets
   - Not visible in logs or Terraform state
   - Rotated independently from infrastructure

4. **Network Isolation**: All services run in private VPC
   - Only ingress controller exposed publicly
   - Databases not internet-accessible

## Troubleshooting

### SSL Certificate Not Provisioning

1. Verify DNS is pointing to load balancer:
   ```bash
   nslookup forge.yourdomain.com
   ```

2. Check cert-manager logs:
   ```bash
   kubectl logs -n cert-manager deploy/cert-manager
   ```

3. Check certificate status:
   ```bash
   kubectl get certificate -n forge
   kubectl describe certificate forge-tls -n forge
   ```

### Can't Connect to Frontend

1. Verify pods are running:
   ```bash
   kubectl get pods -n forge
   ```

2. Check ingress configuration:
   ```bash
   kubectl get ingress -n forge
   kubectl describe ingress forge-ingress -n forge
   ```

3. View pod logs:
   ```bash
   kubectl logs -n forge -l app=forge-frontend
   ```

### Database Connection Issues

1. Verify database exists and is accessible:
   ```bash
   doctl databases list
   ```

2. Check firewall rules allow K8s cluster:
   ```bash
   doctl databases get-sql-mode YOUR_DB_ID
   ```

3. Verify connection string in secrets:
   ```bash
   kubectl get secret forge-secrets -n forge -o yaml
   ```

## Next Steps

1. ✅ Install prerequisites
2. ✅ Create `terraform/terraform.tfvars` with your token and domain
3. ✅ Update `k8s/ingress.yaml` with your domain
4. ✅ Update `k8s/configmap.yaml` with your domain
5. ✅ Configure DNS A/CNAME records
6. ✅ Run `terraform init && terraform apply`
7. ✅ Configure kubectl: `doctl kubernetes cluster kubeconfig save forge-cluster`
8. ✅ Run `./scripts/deploy.sh`
9. ✅ Run `./scripts/verify-deployment.sh`
10. ✅ Access your live services!

## Cost Estimation

Monthly costs (approximate):
- DOKS Cluster (3 nodes, s-2vcpu-4gb): $90/month
- PostgreSQL (3 nodes, 100GB): $150/month
- Redis (3 nodes): $45/month
- Load Balancer: $12/month
- Domain/DNS: $0-15/month
- **Total: ~$300-320/month**

To reduce costs:
- Use smaller node size: `s-1vcpu-2gb` (~$6/node = $18 vs $30)
- Single-node databases (not HA): -$100/month
- Auto-scale to 0 nodes at night: -$50/month

## Support

For DigitalOcean-specific issues:
- https://docs.digitalocean.com/products/kubernetes/
- https://docs.digitalocean.com/products/databases/

For Kubernetes issues:
- https://kubernetes.io/docs/
- https://helm.sh/docs/

For Let's Encrypt certificate issues:
- https://cert-manager.io/docs/
