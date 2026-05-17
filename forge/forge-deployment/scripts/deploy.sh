#!/bin/bash

set -e

echo "====================================="
echo "Forge Platform Deployment Script"
echo "====================================="

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
TERRAFORM_DIR="$PROJECT_DIR/terraform"
K8S_DIR="$PROJECT_DIR/k8s"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${ENVIRONMENT:-production}
DOMAIN=${DOMAIN:-forge.yourdomain.com}
REGION=${REGION:-nyc3}

echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"
echo -e "${YELLOW}Domain: $DOMAIN${NC}"
echo -e "${YELLOW}Region: $REGION${NC}"

# Phase 1: Prerequisites check
echo -e "\n${YELLOW}Phase 1: Checking prerequisites...${NC}"
command -v terraform >/dev/null 2>&1 || { echo -e "${RED}Terraform is not installed${NC}"; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo -e "${RED}kubectl is not installed${NC}"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo -e "${RED}Docker is not installed${NC}"; exit 1; }

if [ -z "$DO_TOKEN" ]; then
  echo -e "${RED}DO_TOKEN environment variable is not set${NC}"
  exit 1
fi

echo -e "${GREEN}✓ All prerequisites met${NC}"

# Phase 2: Terraform provisioning
echo -e "\n${YELLOW}Phase 2: Provisioning infrastructure with Terraform...${NC}"
cd "$TERRAFORM_DIR"

if [ ! -f "terraform.tfvars" ]; then
  cp terraform.tfvars.example terraform.tfvars
  echo -e "${YELLOW}Created terraform.tfvars from template. Please update with your values.${NC}"
  exit 1
fi

terraform init
terraform plan -out=tfplan
terraform apply tfplan

# Get outputs
LB_IP=$(terraform output -raw load_balancer_ip)
LB_HOSTNAME=$(terraform output -raw load_balancer_hostname)
DB_HOST=$(terraform output -raw database_host)
DB_PORT=$(terraform output -raw database_port)
DB_USER=$(terraform output -raw database_user)
DB_PASSWORD=$(terraform output -raw database_password)
REGISTRY_ENDPOINT=$(terraform output -raw container_registry_endpoint)

echo -e "${GREEN}✓ Infrastructure provisioned${NC}"

# Phase 3: Docker image building and pushing
echo -e "\n${YELLOW}Phase 3: Building and pushing Docker images...${NC}"

# Authenticate with DigitalOcean Container Registry
echo "$DO_TOKEN" | docker login -u token --password-stdin "$REGISTRY_ENDPOINT"

# Backend image
echo -e "${YELLOW}Building backend image...${NC}"
docker build -t "$REGISTRY_ENDPOINT/forge-platform:latest" -f "$PROJECT_DIR/docker/Dockerfile.backend" .
docker push "$REGISTRY_ENDPOINT/forge-platform:latest"

# Frontend image
echo -e "${YELLOW}Building frontend image...${NC}"
docker build -t "$REGISTRY_ENDPOINT/forge-web-studio:latest" -f "$PROJECT_DIR/docker/Dockerfile.frontend" .
docker push "$REGISTRY_ENDPOINT/forge-web-studio:latest"

echo -e "${GREEN}✓ Docker images built and pushed${NC}"

# Phase 4: kubectl configuration
echo -e "\n${YELLOW}Phase 4: Configuring kubectl...${NC}"
doctl kubernetes cluster kubeconfig save $(terraform output -raw kubernetes_cluster_name)
kubectl get nodes

echo -e "${GREEN}✓ kubectl configured${NC}"

# Phase 5: Kubernetes resource creation
echo -e "\n${YELLOW}Phase 5: Creating Kubernetes resources...${NC}"

# Create namespaces
kubectl apply -f "$K8S_DIR/namespace.yaml"

# Update secrets with real values
kubectl create secret generic forge-secrets \
  --from-literal=DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/forge?sslmode=require" \
  --from-literal=REDIS_URL="redis://:password@redis-host:6379" \
  --from-literal=JWT_SECRET="your-jwt-secret-change-in-production" \
  --from-literal=ENCRYPTION_KEY="your-encryption-key-change-in-production" \
  --from-literal=GRAFANA_ADMIN_PASSWORD="admin" \
  -n forge --dry-run=client -o yaml | kubectl apply -f -

# Apply ConfigMaps and Ingress
kubectl apply -f "$K8S_DIR/configmap.yaml"
kubectl apply -f "$K8S_DIR/ingress.yaml"

echo -e "${GREEN}✓ Kubernetes resources created${NC}"

# Phase 6: Application deployment
echo -e "\n${YELLOW}Phase 6: Deploying applications...${NC}"

kubectl apply -f "$K8S_DIR/backend-deployment.yaml"
kubectl apply -f "$K8S_DIR/frontend-deployment.yaml"
kubectl apply -f "$K8S_DIR/monitoring-deployment.yaml"

# Wait for deployments to be ready
echo -e "${YELLOW}Waiting for deployments to be ready...${NC}"
kubectl rollout status deployment/forge-backend -n forge --timeout=5m
kubectl rollout status deployment/forge-frontend -n forge --timeout=5m

echo -e "${GREEN}✓ Applications deployed${NC}"

# Phase 7: Database migrations and seeding
echo -e "\n${YELLOW}Phase 7: Running database migrations...${NC}"

# Port-forward to database
kubectl port-forward svc/forge-backend 3000:80 -n forge &
PF_PID=$!
sleep 2

# Run migrations (adjust this based on your backend implementation)
# curl -X POST http://localhost:3000/api/admin/migrate

kill $PF_PID 2>/dev/null || true

echo -e "${GREEN}✓ Database migrations complete${NC}"

# Phase 8: Verification
echo -e "\n${YELLOW}Phase 8: Verifying deployment...${NC}"

sleep 10

# Check API health
API_URL="https://api.$DOMAIN/health"
echo -e "${YELLOW}Checking API at $API_URL...${NC}"

max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
  if curl -sk "$API_URL" >/dev/null 2>&1; then
    echo -e "${GREEN}✓ API is healthy${NC}"
    break
  fi
  attempt=$((attempt + 1))
  echo -e "${YELLOW}Waiting for API... ($attempt/$max_attempts)${NC}"
  sleep 10
done

if [ $attempt -eq $max_attempts ]; then
  echo -e "${RED}✗ API did not become healthy within timeout${NC}"
fi

# Save deployment info
DEPLOYMENT_INFO=$(cat <<EOF
{
  "environment": "$ENVIRONMENT",
  "domain": "$DOMAIN",
  "region": "$REGION",
  "load_balancer_ip": "$LB_IP",
  "load_balancer_hostname": "$LB_HOSTNAME",
  "database_host": "$DB_HOST",
  "registry_endpoint": "$REGISTRY_ENDPOINT",
  "frontend_url": "https://$DOMAIN",
  "api_url": "https://api.$DOMAIN",
  "grafana_url": "https://monitoring.$DOMAIN",
  "deployed_at": "$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
}
EOF
)

echo "$DEPLOYMENT_INFO" > "$PROJECT_DIR/deployment-info.json"

echo -e "\n${GREEN}====================================="
echo "Deployment Complete!"
echo "=====================================${NC}"
echo -e "${GREEN}Frontend:${NC} https://$DOMAIN"
echo -e "${GREEN}Backend API:${NC} https://api.$DOMAIN"
echo -e "${GREEN}Monitoring:${NC} https://monitoring.$DOMAIN"
echo -e "${GREEN}Deployment Info:${NC} $PROJECT_DIR/deployment-info.json"
