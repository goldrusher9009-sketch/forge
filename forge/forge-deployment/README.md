# Forge Platform Deployment

This directory contains complete infrastructure-as-code and deployment automation for the Forge platform on DigitalOcean.

## Architecture Overview

- **Infrastructure**: DigitalOcean Kubernetes Service (DOKS) with managed PostgreSQL, Redis, and Container Registry
- **Orchestration**: Kubernetes with 3-10 node auto-scaling
- **Networking**: Nginx Ingress with Let's Encrypt TLS
- **Monitoring**: Prometheus, Grafana, and ELK Stack
- **Security**: RBAC, network policies, non-root containers, read-only filesystems

## Prerequisites

1. DigitalOcean Account with API token
2. Installed tools:
   - `terraform` >= 1.0
   - `kubectl` >= 1.24
   - `docker`
   - `doctl` (DigitalOcean CLI)

## Setup Instructions

### 1. Configure Terraform Variables

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:
```hcl
do_token = "dop_v1_xxxxxxxxxxxxxxxxxxxx"
domain   = "forge.yourdomain.com"
region   = "nyc3"
```

### 2. Set Environment Variables

```bash
export DO_TOKEN="dop_v1_xxxxxxxxxxxxxxxxxxxx"
export DOMAIN="forge.yourdomain.com"
```

### 3. Run Deployment

```bash
cd scripts
chmod +x deploy.sh
./deploy.sh
```

The deployment script will:
1. Verify prerequisites
2. Provision infrastructure with Terraform
3. Build and push Docker images
4. Configure kubectl
5. Create Kubernetes namespaces and resources
6. Deploy backend, frontend, and monitoring
7. Run database migrations
8. Verify deployment health

### 4. Verify Deployment

```bash
chmod +x verify-deployment.sh
./verify-deployment.sh
```

## Access Your Deployment

After deployment completes, your Forge platform will be available at:

- **Frontend**: https://forge.yourdomain.com
- **API**: https://api.forge.yourdomain.com
- **Monitoring**: https://monitoring.forge.yourdomain.com

## Infrastructure Components

### Kubernetes Cluster
- 3-10 nodes (auto-scaling)
- Node size: s-2vcpu-4gb (configurable)
- VPC for isolated networking
- Load balancer with static IP

### Databases
- PostgreSQL 15 cluster (3 nodes)
  - 100GB storage
  - Automated backups
  - Firewall restricted to K8s cluster

- Redis 7 cluster (3 nodes)
  - Automatic failover
  - Firewall restricted to K8s cluster

### Container Registry
- DigitalOcean Container Registry
- Private image storage
- Automatic cleanup policies

### DNS & TLS
- Managed domain with DigitalOcean
- Automatic A/CNAME records
- Let's Encrypt certificates via cert-manager
- Automatic renewal

## Deployment Configuration

### Backend Deployment
- 3-10 replicas (auto-scaling based on CPU/memory)
- Rolling updates with zero downtime
- Health checks (liveness & readiness)
- Resource limits: 1Gi memory, 500m CPU

### Frontend Deployment
- 3-8 replicas (auto-scaling)
- Static content optimization
- Resource limits: 512Mi memory, 250m CPU

### Monitoring Stack
- **Prometheus**: 2 replicas, 50Gi storage, 30-day retention
- **Grafana**: 2 replicas, 10Gi storage
- **Elasticsearch**: 3-node cluster, 30Gi per node
- Pre-configured dashboards and alerts

## Scaling Configuration

### Horizontal Pod Autoscaling
```yaml
Backend:
  Min: 3 replicas
  Max: 10 replicas
  Triggers: CPU 70%, Memory 80%

Frontend:
  Min: 3 replicas
  Max: 8 replicas
  Triggers: CPU 75%
```

### Cluster Autoscaling
```yaml
Nodes:
  Min: 3
  Max: 10
```

## Security Features

1. **Network Security**
   - VPC isolation
   - Network policies
   - Firewall rules on databases
   - Ingress rate limiting

2. **Container Security**
   - Non-root users
   - Read-only root filesystems
   - No privilege escalation
   - Resource limits

3. **Secrets Management**
   - Kubernetes Secrets for sensitive data
   - Encrypted at rest in etcd
   - Separate secrets per environment

4. **TLS/HTTPS**
   - Automatic certificate provisioning
   - Let's Encrypt integration
   - SSL redirect enforced

## Monitoring & Logging

### Prometheus Metrics
- Application metrics from `/metrics` endpoint
- Kubernetes cluster metrics
- Custom dashboards in Grafana

### ELK Stack
- Centralized logging
- Elasticsearch for storage
- Kibana for visualization
- Log retention: configurable

### Alerts
- Pod restart alerts
- High CPU/memory alerts
- Database connectivity alerts
- API health alerts

## Backup & Recovery

### Database Backups
- Automated daily backups
- 7-day retention
- Point-in-time recovery
- Replicated across 3 nodes

### Persistent Volume Backups
- Snapshots stored in Spaces
- Automated cleanup
- Cross-region replication

## Troubleshooting

### Check Deployment Status
```bash
kubectl get deployments -n forge
kubectl get pods -n forge
kubectl describe pod <pod-name> -n forge
```

### View Logs
```bash
kubectl logs deployment/forge-backend -n forge
kubectl logs deployment/forge-frontend -n forge
```

### Access Kubernetes Dashboard
```bash
kubectl proxy
# Navigate to http://localhost:8001/api/v1/namespaces/kube-dashboard/services/https:kubernetes-dashboard:/proxy/
```

### Database Connection
```bash
# Forward database port
kubectl port-forward svc/postgres 5432:5432 -n forge
# Connect with psql
psql -h localhost -U forge -d forge
```

## Cost Optimization

1. **Adjust Node Size**: Edit `node_size` in `terraform.tfvars`
2. **Reduce Auto-scaling**: Decrease `max_nodes` for Kubernetes cluster
3. **Reduce Replicas**: Edit deployment replica counts
4. **Use Spot Nodes**: Configure spot pricing in Terraform
5. **Storage Optimization**: Adjust PVC sizes for monitoring

## Cleanup

To destroy all infrastructure:

```bash
cd terraform
terraform destroy
```

This will remove:
- Kubernetes cluster
- Databases
- Redis cache
- Domain and DNS records
- Container registry
- VPC and networking

## Advanced Configuration

### Custom Domain
Update `domain` in `terraform.tfvars` to use your existing domain.

### Multiple Environments
Create separate `terraform.tfvars` files:
- `terraform.tfvars.dev`
- `terraform.tfvars.staging`
- `terraform.tfvars.prod`

### Custom TLS Certificates
Replace cert-manager with your own certificates in `k8s/secrets.yaml`.

### Email Configuration
Update email addresses in:
- `k8s/ingress.yaml` (Let's Encrypt)
- Alert configurations

## Support

For issues or questions:
1. Check logs: `kubectl logs -n forge`
2. Verify resources: `kubectl get all -n forge`
3. Check Terraform state: `terraform show`
4. Review monitoring: https://monitoring.yourdomain.com

## License

All deployment code is provided as-is for the Forge platform.
