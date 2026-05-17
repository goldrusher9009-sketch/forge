#!/bin/bash

###############################################################################
# Forge Platform Domain & Certificate Setup Script
# Configures your domain, updates all manifests, and prepares for deployment
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logo
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║          Forge Platform Domain Setup                           ║"
echo "║  Configure your domain and fix SSL certificate issues          ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if domain is provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage:${NC} ./setup-domain.sh your-domain.com"
    echo ""
    echo "Example: ./setup-domain.sh forge.example.com"
    echo ""
    echo "This script will:"
    echo "  1. Update all Kubernetes manifests with your domain"
    echo "  2. Configure Let's Encrypt SSL certificates"
    echo "  3. Prepare DNS configuration instructions"
    echo "  4. Generate terraform.tfvars template"
    exit 1
fi

DOMAIN=$1
DOMAIN_ROOT=$(echo $DOMAIN | sed 's/^forge\.//')

echo -e "${GREEN}✓${NC} Domain: ${BLUE}$DOMAIN${NC}"
echo -e "${GREEN}✓${NC} Root domain: ${BLUE}$DOMAIN_ROOT${NC}"
echo ""

# Validate domain format
if [[ ! $DOMAIN =~ ^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$ ]]; then
    echo -e "${RED}✗ Invalid domain format: $DOMAIN${NC}"
    echo "Please provide a valid domain (e.g., forge.example.com)"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${YELLOW}→${NC} Updating Kubernetes manifests..."

# Update ingress.yaml
echo "  - Updating k8s/ingress.yaml..."
sed -i.bak "s/forge\.yourdomain\.com/$DOMAIN/g" "$PROJECT_DIR/k8s/ingress.yaml"
sed -i.bak "s/yourdomain\.com/$DOMAIN_ROOT/g" "$PROJECT_DIR/k8s/ingress.yaml"
rm -f "$PROJECT_DIR/k8s/ingress.yaml.bak"

# Update configmap.yaml
echo "  - Updating k8s/configmap.yaml..."
sed -i.bak "s|https://forge\.yourdomain\.com|https://$DOMAIN|g" "$PROJECT_DIR/k8s/configmap.yaml"
sed -i.bak "s|https://api\.forge\.yourdomain\.com|https://api.$DOMAIN|g" "$PROJECT_DIR/k8s/configmap.yaml"
rm -f "$PROJECT_DIR/k8s/configmap.yaml.bak"

# Update backend deployment
echo "  - Updating k8s/backend-deployment.yaml..."
sed -i.bak "s/forge\.yourdomain\.com/$DOMAIN/g" "$PROJECT_DIR/k8s/backend-deployment.yaml"
rm -f "$PROJECT_DIR/k8s/backend-deployment.yaml.bak"

# Update terraform main.tf
echo "  - Updating terraform/main.tf..."
sed -i.bak "s/forge\.yourdomain\.com/$DOMAIN/g" "$PROJECT_DIR/terraform/main.tf"
sed -i.bak "s/yourdomain\.com/$DOMAIN_ROOT/g" "$PROJECT_DIR/terraform/main.tf"
rm -f "$PROJECT_DIR/terraform/main.tf.bak"

echo -e "${GREEN}✓${NC} Manifests updated successfully"
echo ""

# Generate terraform.tfvars if not exists
echo -e "${YELLOW}→${NC} Preparing Terraform configuration..."
if [ ! -f "$PROJECT_DIR/terraform/terraform.tfvars" ]; then
    cat > "$PROJECT_DIR/terraform/terraform.tfvars" << EOF
# DigitalOcean Terraform Configuration
# Get your token from: https://cloud.digitalocean.com/account/api/tokens

do_token       = "dop_v1_YOUR_TOKEN_HERE_REPLACE_ME"
domain         = "$DOMAIN"
region         = "nyc3"
environment    = "production"
node_count     = 3
node_size      = "s-2vcpu-4gb"
EOF
    echo -e "${GREEN}✓${NC} Created terraform/terraform.tfvars template"
else
    echo -e "${YELLOW}!${NC} terraform/terraform.tfvars already exists (not overwriting)"
fi

echo ""
echo -e "${YELLOW}→${NC} DNS Configuration Instructions:"
echo ""
echo "After running 'terraform apply', you'll get a load balancer IP."
echo "Configure your domain's DNS records:"
echo ""
echo -e "${BLUE}A Record:${NC}"
echo "  Name: forge"
echo "  Type: A"
echo "  Value: <YOUR_LOAD_BALANCER_IP>"
echo ""
echo -e "${BLUE}CNAME Records:${NC}"
echo "  Name: www"
echo "  Type: CNAME"
echo "  Value: $DOMAIN"
echo ""
echo "  Name: api"
echo "  Type: CNAME"
echo "  Value: $DOMAIN"
echo ""
echo "Wait 5-15 minutes for DNS propagation, then the certificate will auto-provision."
echo ""

# Create DNS instructions file
cat > "$PROJECT_DIR/DNS_CONFIGURATION.txt" << EOF
FORGE PLATFORM DNS CONFIGURATION
Domain: $DOMAIN
Generated: $(date)

After Terraform Apply:
1. Get the Load Balancer IP from Terraform output
2. Configure these DNS records at your registrar:

A Record:
  Hostname: forge
  Type: A
  Value: <LOAD_BALANCER_IP>
  TTL: 3600

CNAME Records:
  Hostname: www
  Type: CNAME
  Target: $DOMAIN
  TTL: 3600

  Hostname: api
  Type: CNAME
  Target: $DOMAIN
  TTL: 3600

3. Wait 5-15 minutes for DNS propagation
4. SSL certificate will auto-provision via Let's Encrypt
5. Access your services:
   - Frontend: https://$DOMAIN
   - API: https://api.$DOMAIN
   - Monitoring: https://api.$DOMAIN/grafana

EOF

echo -e "${GREEN}✓${NC} DNS configuration saved to DNS_CONFIGURATION.txt"
echo ""

echo -e "${YELLOW}→${NC} Next steps:"
echo ""
echo "1. Edit terraform/terraform.tfvars and add your DigitalOcean token:"
echo -e "   ${BLUE}nano terraform/terraform.tfvars${NC}"
echo ""
echo "2. Initialize Terraform:"
echo -e "   ${BLUE}terraform init${NC}"
echo ""
echo "3. Review the infrastructure plan:"
echo -e "   ${BLUE}terraform plan${NC}"
echo ""
echo "4. Apply the configuration:"
echo -e "   ${BLUE}terraform apply${NC}"
echo ""
echo "5. After Terraform completes, configure your DNS records"
echo "   (see DNS_CONFIGURATION.txt for details)"
echo ""
echo "6. Wait for DNS propagation and certificate provisioning (~5-15 minutes)"
echo ""
echo "7. Deploy the services:"
echo -e "   ${BLUE}./scripts/deploy.sh${NC}"
echo ""
echo "8. Verify the deployment:"
echo -e "   ${BLUE}./scripts/verify-deployment.sh${NC}"
echo ""

echo -e "${GREEN}✓${NC} Setup complete! Domain configured for: ${BLUE}$DOMAIN${NC}"
echo ""
echo -e "${YELLOW}Important:${NC} Update terraform/terraform.tfvars with your actual DigitalOcean API token"
echo "Token location: https://cloud.digitalocean.com/account/api/tokens"
echo ""
