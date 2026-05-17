# 🎯 Forge Platform Deployment Checklist

Use this checklist to ensure nothing is missed during deployment.

---

## Pre-Deployment (Before Running Any Scripts)

### Prerequisites

- [ ] **DigitalOcean Account Created**
  - Go to: https://www.digitalocean.com/
  - Sign up or log in

- [ ] **DigitalOcean API Token Generated**
  - Visit: https://cloud.digitalocean.com/account/api/tokens
  - Click "Generate New Token"
  - Name: `forge-terraform`
  - Select: Read ✓ and Write ✓
  - Copy token and save safely

- [ ] **Domain Name Ready**
  - Decide on your domain (e.g., forge.example.com)
  - Ensure you control the domain DNS settings
  - Have access to domain registrar account

- [ ] **Tools Installed Locally**
  ```bash
  # Check each:
  terraform --version        # Should be v1.5.0 or newer
  kubectl version            # Should be v1.27.0 or newer
  docker --version           # Should be v24.0.0 or newer
  doctl version              # Should be v1.98.0 or newer
  ```
  - [ ] Terraform installed
  - [ ] kubectl installed
  - [ ] Docker installed
  - [ ] doctl installed

### Security

- [ ] **DigitalOcean Token Secured**
  - Stored securely (not in chat history)
  - Not shared with anyone
  - Have backup copy in safe location

- [ ] **.gitignore Updated**
  - `terraform/terraform.tfvars` will not commit
  - `.env` files excluded
  - Secret files not versioned

---

## Configuration Phase

### Step 1: Domain Setup

- [ ] **Run domain configuration script**
  ```bash
  cd forge-deployment
  ./scripts/setup-domain.sh forge.yourdomain.com
  ```
  Replace `forge.yourdomain.com` with YOUR actual domain

- [ ] **Verify script output**
  - All Kubernetes manifests updated ✓
  - terraform.tfvars generated ✓
  - DNS_CONFIGURATION.txt created ✓

### Step 2: Terraform Configuration

- [ ] **Edit terraform.tfvars**
  ```bash
  nano terraform/terraform.tfvars
  ```

- [ ] **Update with your values:**
  - [ ] `do_token` = your actual DigitalOcean token
  - [ ] `domain` = your actual domain
  - [ ] `region` = nyc3 (or your preferred region)
  - [ ] `environment` = production
  - [ ] `node_count` = 3 (initial count)
  - [ ] `node_size` = s-2vcpu-4gb (or preferred size)

- [ ] **Save and exit**
  - Press Ctrl+X, then Y, then Enter

- [ ] **Verify file was saved**
  ```bash
  cat terraform/terraform.tfvars
  # Should show your values
  ```

### Step 3: Verification

- [ ] **Double-check configuration**
  - [ ] Domain in ingress.yaml matches your domain
  - [ ] Domain in configmap.yaml matches your domain
  - [ ] API token in terraform.tfvars is valid
  - [ ] Region and node sizes are desired values

- [ ] **Terraform syntax check**
  ```bash
  terraform validate
  # Should output: Success! The configuration is valid.
  ```

---

## Infrastructure Deployment Phase

### Step 4: Terraform Init & Plan

- [ ] **Initialize Terraform**
  ```bash
  terraform init
  ```
  - [ ] Initialization completes successfully
  - [ ] Backend initialized

- [ ] **Review deployment plan**
  ```bash
  terraform plan
  # Review output carefully
  ```
  - [ ] Plan shows resources being created
  - [ ] No unexpected deletions
  - [ ] Kubernetes cluster mentioned
  - [ ] Database clusters mentioned
  - [ ] Container registry mentioned

### Step 5: Terraform Apply

- [ ] **Apply infrastructure**
  ```bash
  terraform apply
  ```
  - [ ] Review plan one more time
  - [ ] Type `yes` when prompted
  - [ ] Wait for completion (~10-15 minutes)

- [ ] **Save Terraform outputs**
  - [ ] Copy `loadbalancer_ip` value
  - [ ] Copy database endpoint
  - [ ] Copy Redis endpoint
  - [ ] Copy container registry URL
  - [ ] Save all outputs to safe location

- [ ] **Verify infrastructure created**
  ```bash
  doctl compute load-balancer list
  doctl databases list
  doctl compute kubernetes cluster list
  ```

---

## DNS Configuration Phase

### Step 6: Configure Domain DNS

⚠️ **IMPORTANT: Don't skip this step!** Without proper DNS, SSL won't provision.

- [ ] **Get Load Balancer IP**
  - From Terraform output: `loadbalancer_ip = "XXX.XXX.XXX.XXX"`
  - Or run: `doctl compute load-balancer list`

- [ ] **Login to domain registrar**
  - [ ] Access your domain registrar (GoDaddy, Namecheap, etc.)
  - [ ] Find DNS management section

- [ ] **Add A Record**
  - [ ] Name: `forge` (or appropriate subdomain)
  - [ ] Type: A
  - [ ] Value: `<LOAD_BALANCER_IP>`
  - [ ] TTL: 3600 (1 hour)
  - [ ] Save record

- [ ] **Add CNAME Records**
  - [ ] First CNAME:
    - [ ] Name: `www`
    - [ ] Type: CNAME
    - [ ] Value: `forge.yourdomain.com`
    - [ ] Save
  
  - [ ] Second CNAME:
    - [ ] Name: `api`
    - [ ] Type: CNAME
    - [ ] Value: `forge.yourdomain.com`
    - [ ] Save

- [ ] **Verify DNS propagation**
  ```bash
  # Wait 5-15 minutes, then check:
  nslookup forge.yourdomain.com
  # Should show your Load Balancer IP
  
  # Verify all subdomains:
  nslookup www.forge.yourdomain.com
  nslookup api.forge.yourdomain.com
  ```

- [ ] **DNS properly configured**
  - [ ] All three domains resolve to load balancer IP
  - [ ] No "NXDOMAIN" errors

---

## Kubernetes & Service Deployment Phase

### Step 7: Configure kubectl

- [ ] **Get cluster kubeconfig**
  ```bash
  doctl kubernetes cluster kubeconfig save forge-cluster
  ```
  - [ ] Command completes successfully
  - [ ] kubeconfig configured

- [ ] **Verify kubectl connection**
  ```bash
  kubectl cluster-info
  # Should show cluster details
  
  kubectl get nodes
  # Should show your 3 nodes
  ```

### Step 8: Deploy Services

- [ ] **Run deployment script**
  ```bash
  ./scripts/deploy.sh
  ```
  - [ ] Script starts successfully
  - [ ] Phase 1: Prerequisites check passes
  - [ ] Phase 2: Infrastructure provisioning (skips, already done)
  - [ ] Phase 3: Docker images build and push
  - [ ] Phase 4: kubectl configuration
  - [ ] Phase 5: Kubernetes resources created
  - [ ] Phase 6: Applications deployed
  - [ ] Phase 7: Database migrations run
  - [ ] Phase 8: Health checks pass

- [ ] **Monitor deployment progress**
  ```bash
  # In another terminal, watch pods:
  kubectl get pods -n forge --watch
  # Wait for all pods to be Running and Ready
  ```

- [ ] **Verify deployment-info.json created**
  ```bash
  cat deployment-info.json
  # Should contain all access URLs
  ```

### Step 9: Post-Deployment Verification

- [ ] **Run verification script**
  ```bash
  ./scripts/verify-deployment.sh
  ```
  - [ ] All checks pass (green ✓)
  - [ ] API responds healthily
  - [ ] Frontend accessible
  - [ ] Database connected
  - [ ] All pods running

- [ ] **Manual verification**
  ```bash
  # Check pods
  kubectl get pods -n forge
  # All should be Running, Ready 1/1
  
  # Check services
  kubectl get svc -n forge
  # All should be ClusterIP with IPs assigned
  
  # Check ingress
  kubectl get ingress -n forge
  # Should show all three domains
  
  # Check certificate
  kubectl get certificate -n forge
  # Should show STATUS "True"
  ```

---

## Post-Deployment Phase

### Step 10: Certificate Provisioning

- [ ] **Wait for Let's Encrypt certificates** (~5-15 minutes)
  ```bash
  # Check status:
  kubectl get certificate -n forge
  kubectl describe certificate forge-tls -n forge
  
  # Wait for:
  # STATUS: True
  # MESSAGE: Certificate issued successfully
  ```

- [ ] **Verify HTTPS works**
  ```bash
  # Test each domain:
  curl -I https://forge.yourdomain.com
  # Should return 200 with valid SSL
  
  curl -I https://api.forge.yourdomain.com/health
  # Should return 200 with valid SSL
  ```

### Step 11: Access Services

- [ ] **Test Frontend**
  - [ ] Open browser to: https://forge.yourdomain.com
  - [ ] No SSL warnings ✓
  - [ ] Page loads successfully ✓
  - [ ] UI responsive ✓

- [ ] **Test Backend**
  - [ ] Visit: https://api.forge.yourdomain.com/health
  - [ ] Shows: `{"status":"healthy"}`
  - [ ] Status endpoint: https://api.forge.yourdomain.com/ready
  - [ ] Returns: `{"ready":true}`

- [ ] **Test Monitoring**
  - [ ] Grafana: https://api.forge.yourdomain.com/grafana
  - [ ] Prometheus: https://api.forge.yourdomain.com/prometheus
  - [ ] Kibana: https://api.forge.yourdomain.com/kibana

### Step 12: Security Verification

- [ ] **SSL Certificate Check**
  ```bash
  # Click lock icon in browser address bar
  # Verify:
  # - Issued by: Let's Encrypt
  # - Valid until: ~90 days from now
  # - Subject: your domain name
  ```

- [ ] **Network Security**
  ```bash
  # Verify only load balancer is public:
  doctl compute load-balancer list
  # Should show 1 public LB
  
  # Database should not be public:
  doctl databases get <DB_ID>
  # Should NOT be internet accessible
  ```

- [ ] **Container Security**
  ```bash
  # Verify non-root containers:
  kubectl get pod -n forge -o yaml | grep runAsUser
  # Should show: runAsUser: 1000
  ```

---

## Final Verification Checklist

- [ ] **All services accessible**
  - [ ] Frontend: ✓
  - [ ] Backend: ✓
  - [ ] Monitoring: ✓

- [ ] **No SSL warnings**
  - [ ] All HTTPS connections valid
  - [ ] No "not safe" messages
  - [ ] Browser shows lock icon

- [ ] **Deployment logged**
  ```bash
  # Save deployment info:
  cp deployment-info.json ~/forge-deployment-info.json
  # Save DNS config:
  cp DNS_CONFIGURATION.txt ~/forge-dns-config.txt
  # Save credentials (securely!):
  # Store terraform.tfvars in secure password manager
  ```

- [ ] **Monitoring configured**
  - [ ] Grafana accessible
  - [ ] Dashboards visible
  - [ ] Prometheus scraping targets
  - [ ] Logs collecting in Elasticsearch

- [ ] **Backup confirmed**
  ```bash
  # Verify database backups enabled:
  doctl databases get <DB_ID>
  # Should show: backup_restore_enabled: true
  ```

---

## Troubleshooting Quick Links

If any step fails:

| Issue | Check This |
|-------|-----------|
| Pods not starting | `kubectl logs -n forge -l app=forge-backend` |
| Certificate not issuing | `kubectl describe certificate forge-tls -n forge` |
| DNS not resolving | `nslookup forge.yourdomain.com` |
| Database not connecting | `kubectl get secret forge-secrets -n forge -o yaml` |
| Load balancer not responding | `doctl compute load-balancer get <LB_ID>` |
| High CPU/Memory | `kubectl top pods -n forge` |

---

## Success Summary

✅ **Deployment Complete When:**

- [x] All Kubernetes pods running and ready
- [x] Services accessible via HTTPS
- [x] Valid SSL certificates from Let's Encrypt
- [x] No browser security warnings
- [x] Database and Redis clusters operational
- [x] Monitoring dashboards showing data
- [x] All health checks passing
- [x] Backups configured and running

---

## Important Files to Keep Safe

After successful deployment, save these files:

```bash
# Configuration
terraform/terraform.tfvars          # Your credentials (SECRET!)
terraform/terraform.tfstate         # Infrastructure state
terraform/terraform.tfstate.backup  # State backup

# Infrastructure info
deployment-info.json                # All service URLs
DNS_CONFIGURATION.txt               # DNS record info

# Backups
cluster-backup.yaml                 # K8s resource backup
kubeconfig                          # Cluster access
```

Store sensitive files in encrypted location or password manager.

---

## Maintenance Schedule

After deployment:

| Task | Frequency |
|------|-----------|
| Review monitoring dashboards | Daily |
| Check backup status | Weekly |
| Review costs | Monthly |
| Update Kubernetes patches | As released |
| Renew SSL certificates | Automatic (every 90 days) |
| Review security logs | Weekly |

---

## Rollback Plan

If something goes wrong:

```bash
# Delete just services (keep infrastructure):
kubectl delete namespace forge forge-monitoring

# Delete everything:
terraform destroy
# Type: yes when prompted
```

---

**You've got this! Follow the checklist and your platform will be live. 🚀**

Get started: `./scripts/setup-domain.sh forge.yourdomain.com`
