#!/bin/bash

set -e

echo "====================================="
echo "Forge Platform Deployment Verification"
echo "====================================="

DOMAIN=${DOMAIN:-forge.yourdomain.com}

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

CHECKS_PASSED=0
CHECKS_FAILED=0

check_endpoint() {
  local name=$1
  local url=$2
  echo -n "Checking $name... "
  if curl -sk "$url" >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
    ((CHECKS_PASSED++))
  else
    echo -e "${RED}✗${NC}"
    ((CHECKS_FAILED++))
  fi
}

check_k8s_resource() {
  local name=$1
  local namespace=$2
  local resource=$3
  echo -n "Checking Kubernetes $name... "
  if kubectl get $resource -n $namespace >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
    ((CHECKS_PASSED++))
  else
    echo -e "${RED}✗${NC}"
    ((CHECKS_FAILED++))
  fi
}

echo -e "\n${YELLOW}API Health Checks:${NC}"
check_endpoint "API health" "https://api.$DOMAIN/health"
check_endpoint "API ready" "https://api.$DOMAIN/ready"

echo -e "\n${YELLOW}Frontend Checks:${NC}"
check_endpoint "Frontend" "https://$DOMAIN"
check_endpoint "Frontend (www)" "https://www.$DOMAIN"

echo -e "\n${YELLOW}Kubernetes Resource Checks:${NC}"
check_k8s_resource "Backend Deployment" "forge" "deployment/forge-backend"
check_k8s_resource "Frontend Deployment" "forge" "deployment/forge-frontend"
check_k8s_resource "Prometheus" "forge-monitoring" "deployment/prometheus"
check_k8s_resource "Grafana" "forge-monitoring" "deployment/grafana"

echo -e "\n${YELLOW}Pod Status:${NC}"
echo "Backend Pods:"
kubectl get pods -n forge -l app=forge-backend -o wide

echo -e "\nFrontend Pods:"
kubectl get pods -n forge -l app=forge-frontend -o wide

echo -e "\n${YELLOW}Service Status:${NC}"
echo "Services in forge namespace:"
kubectl get svc -n forge

echo -e "\n${YELLOW}Ingress Status:${NC}"
kubectl get ingress -n forge

echo -e "\n====================================="
echo -e "Verification Summary"
echo -e "Passed: ${GREEN}$CHECKS_PASSED${NC}"
echo -e "Failed: ${RED}$CHECKS_FAILED${NC}"
echo -e "=====================================${NC}"

if [ $CHECKS_FAILED -eq 0 ]; then
  echo -e "\n${GREEN}All checks passed! Deployment is healthy.${NC}"
  exit 0
else
  echo -e "\n${RED}Some checks failed. Please review the logs above.${NC}"
  exit 1
fi
