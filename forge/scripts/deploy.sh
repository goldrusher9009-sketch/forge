#!/bin/bash
# Forge Platform - Production Deployment Script
# Usage: ./scripts/deploy.sh [environment] [version]

set -e

ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}
REGISTRY=ghcr.io
IMAGE_NAME=forge-platform

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment for ${ENVIRONMENT} environment...${NC}"

# ============================================================================
# Pre-deployment checks
# ============================================================================

echo -e "\n${YELLOW}Running pre-deployment checks...${NC}"

# Check if required commands are available
for cmd in docker git npm; do
    if ! command -v $cmd &> /dev/null; then
        echo -e "${RED}Error: $cmd is not installed${NC}"
        exit 1
    fi
done

# Verify git status is clean
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}Error: Working directory has uncommitted changes${NC}"
    exit 1
fi

# Check if version tag exists
if [ "$VERSION" != "latest" ]; then
    if ! git rev-parse "v$VERSION" >/dev/null 2>&1; then
        echo -e "${RED}Error: Version tag v$VERSION not found${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ Pre-deployment checks passed${NC}"

# ============================================================================
# Build Docker image
# ============================================================================

echo -e "\n${YELLOW}Building Docker image...${NC}"

DOCKER_TAG="$REGISTRY/$IMAGE_NAME:$VERSION"
DOCKER_TAG_ENV="$REGISTRY/$IMAGE_NAME:$ENVIRONMENT-latest"

docker build \
    -t "$DOCKER_TAG" \
    -t "$DOCKER_TAG_ENV" \
    -f Dockerfile \
    --build-arg NODE_ENV=production \
    --build-arg REACT_APP_ENV=$ENVIRONMENT \
    .

echo -e "${GREEN}✓ Docker image built: $DOCKER_TAG${NC}"

# ============================================================================
# Security scanning
# ============================================================================

echo -e "\n${YELLOW}Running security scan...${NC}"

# Using Trivy for vulnerability scanning
if command -v trivy &> /dev/null; then
    trivy image --severity HIGH,CRITICAL "$DOCKER_TAG" || true
    echo -e "${GREEN}✓ Security scan completed${NC}"
else
    echo -e "${YELLOW}⚠ Trivy not found, skipping vulnerability scan${NC}"
fi

# ============================================================================
# Push to registry
# ============================================================================

echo -e "\n${YELLOW}Pushing image to registry...${NC}"

docker push "$DOCKER_TAG"
docker push "$DOCKER_TAG_ENV"

echo -e "${GREEN}✓ Image pushed successfully${NC}"

# ============================================================================
# Deploy to environment
# ============================================================================

echo -e "\n${YELLOW}Deploying to $ENVIRONMENT environment...${NC}"

case $ENVIRONMENT in
    staging)
        echo "Deploying to staging Kubernetes cluster..."
        kubectl --context=forge-staging apply -f k8s/staging/deployment.yaml
        kubectl --context=forge-staging rollout status deployment/forge-frontend -n default
        ;;
    production)
        echo "Deploying to production Kubernetes cluster..."
        # Require confirmation for production
        read -p "Are you sure you want to deploy to PRODUCTION? (yes/no) " -n 3 -r
        echo
        if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            kubectl --context=forge-prod apply -f k8s/production/deployment.yaml
            kubectl --context=forge-prod rollout status deployment/forge-frontend -n default
        else
            echo -e "${RED}Deployment cancelled${NC}"
            exit 1
        fi
        ;;
    *)
        echo -e "${RED}Unknown environment: $ENVIRONMENT${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}✓ Deployment completed${NC}"

# ============================================================================
# Post-deployment verification
# ============================================================================

echo -e "\n${YELLOW}Running post-deployment verification...${NC}"

# Get the service endpoint
SERVICE_URL=$(kubectl --context=forge-$ENVIRONMENT get svc forge-frontend -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# Wait for service to be ready
echo "Waiting for service to be ready..."
for i in {1..30}; do
    if curl -sf "http://$SERVICE_URL/health" > /dev/null; then
        echo -e "${GREEN}✓ Service health check passed${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}Service health check failed${NC}"
        exit 1
    fi
    echo "Attempt $i/30..."
    sleep 2
done

# ============================================================================
# Smoke tests
# ============================================================================

echo -e "\n${YELLOW}Running smoke tests...${NC}"

API_URL="http://$SERVICE_URL" npm run test:smoke

echo -e "${GREEN}✓ Smoke tests passed${NC}"

# ============================================================================
# Notify deployment
# ============================================================================

echo -e "\n${YELLOW}Notifying deployment channels...${NC}"

# Send Slack notification if webhook is configured
if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST "$SLACK_WEBHOOK_URL" \
        -H 'Content-Type: application/json' \
        -d "{
            \"text\": \"🚀 Deployment Complete\",
            \"blocks\": [
                {
                    \"type\": \"section\",
                    \"text\": {
                        \"type\": \"mrkdwn\",
                        \"text\": \"*Forge Platform Deployment*\n*Environment:* $ENVIRONMENT\n*Version:* $VERSION\n*Status:* ✅ Success\"
                    }
                }
            ]
        }"
fi

# Update deployment record
echo "$(date '+%Y-%m-%d %H:%M:%S') - $ENVIRONMENT - v$VERSION - SUCCESS" >> deployments.log

echo -e "\n${GREEN}✓ Deployment completed successfully!${NC}"
echo -e "${GREEN}Service URL: http://$SERVICE_URL${NC}"
