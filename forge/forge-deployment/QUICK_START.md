# 🚀 Forge Platform Quick Start Guide

## The SSL Issue You're Experiencing

The "not safe" warning happens because:
1. Your domain isn't yet configured in the deployment
2. SSL certificates haven't been provisioned by Let's Encrypt
3. The ingress controller is using placeholder certificates

**Solution:** Follow this guide to fix it in 15 minutes.

---

## 5-Minute Setup

### Step 1: Get Your DigitalOcean Token (2 minutes)

1. Go to https://cloud.digitalocean.com/account/api/tokens
2. Click **"Generate New Token"**
3. Name: `forge-terraform`
4. Check both boxes: **Read** and **Write**
5. Click **"Generate Token"**
6. **Copy the token** (you won't see it again!)

### Step 2: Configure Your Domain (1 minute)

From the `forge-deployment` directory:

```bash
# Replace forge.example.com with YOUR actual domain
./scripts/setup-domain.sh forge.example.com
```

This script:
- ✅ Updates all configuration files with your domain
- ✅ Generates Terraform configuration
- ✅ Creates DNS setup instructions
- ✅ Configures Let's Encrypt certificates

### Step 3: Add Your API Token (1 minute)

Edit `terraform/terraform.tfvars`:

```bash
nano terraform/terraform.tfvars
```

Replace `YOUR_TOKEN_HERE_REPLACE_ME` with your actual DigitalOcean token.

Save and exit (Ctrl+X, then Y, then Enter)

### Step 4: Deploy Infrastructure (5+ minutes, automatic)

```bash
cd forge-deployment

# Check if tools are installed
terraform --version
kubectl version
doctl version

# Initialize Terraform
terraform init

# See what will be created
terraform plan

# Create infrastructure on DigitalOcean
terraform apply
```

When prompted, type `yes` to proceed.

**Save the output!** You'll need the Load Balancer IP for DNS.

### Step 5: Configure DNS (2 minutes)

After Terraform completes, it shows:

```
Outputs:
loadbalancer_ip = "192.0.2.1"
```

Go to your domain registrar (GoDaddy, Namecheap, etc.) and add:

**A Record:**
- Name: `forge`
- Type: `A`
- Value: `192.0.2.1` (the IP from Terraform output)

**CNAME Records:**
- Name: `www` → Value: `forge.yourdomain.com`
- Name: `api` → Value: `forge.yourdomain.com`

**Wait 5-15 minutes** for DNS to propagate.

### Step 6: Deploy Services

```bash
# Configure kubectl to use your new cluster
doctl kubernetes cluster kubeconfig save forge-cluster

# Deploy all services
./scripts/deploy.sh

# Wait 2-3 minutes for services to start
./scripts/verify-deployment.sh
```

### Step 7: Access Your Platform

After certificate provisioning (wait 5+ minutes):

```
✅ Frontend:     https://forge.yourdomain.com
✅ API:          https://api.yourdomain.com/health
✅ Grafana:      https://api.yourdomain.com/grafana
✅ Prometheus:   https://api.yourdomain.com/prometheus
```

**No more "not safe" warnings!** Let's Encrypt provides valid certificates.

---

## What Gets Created

| Component | Details | Cost |
|-----------|---------|------|
| **Kubernetes Cluster** | 3-10 auto-scaling nodes, s-2vcpu-4gb | ~$90/mo |
| **PostgreSQL Database** | 3-node cluster, 100GB storage, automated backups | ~$150/mo |
| **Redis Cache** | 3-node managed cluster | ~$45/mo |
| **Load Balancer** | Public IP for routing | $12/mo |
| **Container Registry** | Private Docker image storage | ~$5/mo |
| **Backups Storage** | Spaces object storage | ~$5/mo |
| **Total Monthly Cost** | | **~$310/mo** |

### Cost Reduction Options

- Use smaller nodes: `s-1vcpu-2gb` → Save ~$10/month
- Single-node DB: No HA → Save ~$100/month
- Delete at night: Schedule cluster to 0 nodes → Save ~$50/month

---

## Troubleshooting

### "DNS records haven't propagated yet"

```bash
# Check DNS status
nslookup forge.yourdomain.com

# Should show your Load Balancer IP
# If not, wait another 5 minutes and retry
```

### "Certificate not provisioning"

```bash
# Check certificate status
kubectl get certificate -n forge

# See detailed status
kubectl describe certificate forge-tls -n forge

# View cert-manager logs
kubectl logs -n cert-manager deploy/cert-manager -f
```

### "Frontend still shows 'not safe'"

1. Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear SSL cache: Close and reopen browser
3. Check if DNS is working: `nslookup forge.yourdomain.com`
4. Wait for cert-manager: Can take 5-15 minutes after DNS propagates

### "Can't connect to database"

```bash
# Verify database cluster exists
doctl databases list

# Check firewall rules
doctl databases firewall list YOUR_DATABASE_ID

# Verify connection secret
kubectl get secret forge-secrets -n forge -o yaml
```

### "Pods aren't starting"

```bash
# Check pod status
kubectl get pods -n forge

# View pod logs
kubectl logs -n forge -l app=forge-backend

# Describe pod for events
kubectl describe pod <pod-name> -n forge
```

---

## Key Files

| File | Purpose |
|------|---------|
| `terraform/terraform.tfvars` | Your credentials and configuration |
| `terraform/main.tf` | Infrastructure definition |
| `k8s/ingress.yaml` | Routing rules and SSL certificates |
| `k8s/configmap.yaml` | Application configuration |
| `scripts/deploy.sh` | Automated deployment script |
| `scripts/setup-domain.sh` | Domain configuration helper |

---

## Important: Keep These Secret

Never commit to GitHub:
- `terraform/terraform.tfvars` (contains API token)
- `.env` files with credentials
- Kubernetes secret values

Add to `.gitignore`:
```
terraform/terraform.tfvars
.env
*.key
*.pem
```

---

## Next Steps After Deployment

1. **Verify all services**
   ```bash
   ./scripts/verify-deployment.sh
   ```

2. **Check monitoring**
   - Grafana: https://api.forge.yourdomain.com/grafana
   - Prometheus: https://api.forge.yourdomain.com/prometheus

3. **Review logs**
   ```bash
   kubectl logs -n forge -l app=forge-backend -f
   ```

4. **Configure monitoring**
   - Set up alerts
   - Create dashboards
   - Configure backup schedules

5. **Enable auto-scaling**
   - Already configured!
   - Pods scale 3-10 based on CPU
   - Nodes scale 3-10 based on load

---

## Common Questions

**Q: Can I change the domain later?**
A: Yes, but it requires updating DNS and certificates. Better to get it right first.

**Q: What if I lose my API token?**
A: Generate a new one from the DO dashboard and update terraform.tfvars.

**Q: How do I delete everything?**
A: `terraform destroy` removes all infrastructure.

**Q: Can I use a cheaper database?**
A: Yes, change `db_engine` in terraform to single-node mode.

**Q: Is my data backed up?**
A: Yes! Automated daily backups to DigitalOcean Spaces (included).

---

## Support Resources

- **DigitalOcean Docs**: https://docs.digitalocean.com/products/kubernetes/
- **Kubernetes Docs**: https://kubernetes.io/docs/
- **Let's Encrypt**: https://letsencrypt.org/
- **Cert-Manager**: https://cert-manager.io/docs/

---

## Success Checklist

- [ ] API token obtained from DigitalOcean
- [ ] `setup-domain.sh` ran successfully
- [ ] `terraform.tfvars` updated with token
- [ ] `terraform apply` completed successfully
- [ ] DNS records configured at registrar
- [ ] DNS propagation verified (5-15 min)
- [ ] Certificate provisioned (check `kubectl get certificate`)
- [ ] `./scripts/deploy.sh` completed
- [ ] All pods running (`kubectl get pods -n forge`)
- [ ] Frontend accessible at https://forge.yourdomain.com
- [ ] No SSL warnings in browser

---

**You're ready to deploy! 🎉**

Start with: `./scripts/setup-domain.sh forge.yourdomain.com`
