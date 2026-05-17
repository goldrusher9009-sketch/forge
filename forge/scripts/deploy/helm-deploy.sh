#!/bin/bash

################################################################################
# Helm Deployment Orchestration Script for Forge Platform
# 
# Purpose: Automate Kubernetes deployments using Helm with comprehensive
#          validation, rollback capability, and health verification
#
# Usage: ./helm-deploy.sh --environment [staging|production] --version <image-tag> [--dry-run]
#
# Environment Variables:
#   HELM_CHART_PATH: Path to Helm chart (default: ./helm)
#   KUBE_CONTEXT: Kubernetes context to use
#   HELM_RELEASE_NAME: Release name (default: forge-platform)
#   NAMESPACE: Kubernetes namespace (default: forge-{environment})
#   TIMEOUT: Deployment timeout in seconds (default: 600)
#   ROLLBACK_ON_FAILURE: Auto-rollback on deployment failure (default: true)
#
################################################################################

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
HELM_CHART_PATH="${HELM_CHART_PATH:-.\/helm}"
HELM_RELEASE_NAME="${HELM_RELEASE_NAME:-forge-platform}"
TIMEOUT="${TIMEOUT:-600}"
ROLLBACK_ON_FAILURE="${ROLLBACK_ON_FAILURE:-true}"
DRY_RUN=${DRY_RUN:-false}

# Logging
LOG_DIR="logs"
LOG_FILE="${LOG_DIR}/deploy-$(date +%Y%m%d-%H%M%S).log"

# Create logs directory
mkdir -p "${LOG_DIR}"

################################################################################
# Logging Functions
################################################################################

log_info() {
  local msg="$1"
  echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} ${msg}" | tee -a "${LOG_FILE}"
}

log_success() {
  local msg="$1"
  echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✓ ${msg}${NC}" | tee -a "${LOG_FILE}"
}

log_error() {
  local msg="$1"
  echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ✗ ${msg}${NC}" | tee -a "${LOG_FILE}"
}

log_warning() {
  local msg="$1"
  echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠ ${msg}${NC}" | tee -a "${LOG_FILE}"
}

################################################################################
# Utility Functions
################################################################################

print_usage() {
  cat << EOF
Usage: $0 --environment [staging|production] --version <image-tag> [OPTIONS]

Required Arguments:
  --environment ENV        Target environment: staging or production
  --version TAG           Docker image tag to deploy

Optional Arguments:
  --dry-run               Show what would be deployed without applying
  --timeout SECONDS       Deployment timeout in seconds (default: 600)
  --no-rollback          Disable automatic rollback on failure
  --context CONTEXT      Kubernetes context to use
  --values FILE          Additional values file to override

Examples:
  $0 --environment staging --version v1.2.3
  $0 --environment production --version v1.2.3 --dry-run
  $0 --environment production --version v1.2.3 --timeout 900
EOF
}

check_prerequisites() {
  log_info "Checking prerequisites..."
  
  local missing_tools=()
  
  for tool in kubectl helm; do
    if ! command -v "$tool" &> /dev/null; then
      missing_tools+=("$tool")
    fi
  done
  
  if [ ${#missing_tools[@]} -gt 0 ]; then
    log_error "Missing required tools: ${missing_tools[*]}"
    log_error "Please install: helm, kubectl"
    exit 1
  fi
  
  if [ ! -d "${HELM_CHART_PATH}" ]; then
    log_error "Helm chart not found at: ${HELM_CHART_PATH}"
    exit 1
  fi
  
  log_success "All prerequisites met"
}

validate_environment() {
  case "${ENVIRONMENT}" in
    staging|production)
      NAMESPACE="${NAMESPACE:-forge-${ENVIRONMENT}}"
      VALUES_FILE="${HELM_CHART_PATH}/values/${ENVIRONMENT}.yaml"
      ;;
    *)
      log_error "Invalid environment: ${ENVIRONMENT}"
      log_error "Must be one of: staging, production"
      exit 1
      ;;
  esac
  
  if [ ! -f "${VALUES_FILE}" ]; then
    log_error "Values file not found: ${VALUES_FILE}"
    exit 1
  fi
  
  log_success "Environment validated: ${ENVIRONMENT}"
}

verify_kubernetes_connection() {
  log_info "Verifying Kubernetes connection..."
  
  if ! kubectl cluster-info &> /dev/null; then
    log_error "Cannot connect to Kubernetes cluster"
    exit 1
  fi
  
  local current_context=$(kubectl config current-context)
  log_success "Connected to Kubernetes cluster: ${current_context}"
  
  # Verify namespace exists or create it
  if ! kubectl get namespace "${NAMESPACE}" &> /dev/null; then
    log_warning "Namespace ${NAMESPACE} does not exist. Creating..."
    kubectl create namespace "${NAMESPACE}"
    log_success "Namespace ${NAMESPACE} created"
  fi
}

validate_helm_chart() {
  log_info "Validating Helm chart..."
  
  if ! helm lint "${HELM_CHART_PATH}" \
    --values "${VALUES_FILE}" \
    --set image.tag="${VERSION}" \
    &>> "${LOG_FILE}"; then
    log_error "Helm chart validation failed"
    exit 1
  fi
  
  log_success "Helm chart validation passed"
}

template_helm_release() {
  log_info "Generating Kubernetes manifests..."
  
  helm template "${HELM_RELEASE_NAME}" "${HELM_CHART_PATH}" \
    --namespace "${NAMESPACE}" \
    --values "${VALUES_FILE}" \
    --set image.tag="${VERSION}" \
    > "${LOG_DIR}/manifests-${ENVIRONMENT}-${VERSION}.yaml"
  
  log_success "Manifests generated: ${LOG_DIR}/manifests-${ENVIRONMENT}-${VERSION}.yaml"
}

perform_dry_run() {
  log_info "Performing dry-run deployment..."
  
  if ! helm upgrade --install "${HELM_RELEASE_NAME}" "${HELM_CHART_PATH}" \
    --namespace "${NAMESPACE}" \
    --values "${VALUES_FILE}" \
    --set image.tag="${VERSION}" \
    --dry-run \
    --debug \
    &>> "${LOG_FILE}"; then
    log_error "Dry-run validation failed"
    exit 1
  fi
  
  log_success "Dry-run validation passed"
}

get_current_revision() {
  helm list --namespace "${NAMESPACE}" --output json | \
    jq -r ".[] | select(.name==\"${HELM_RELEASE_NAME}\") | .revision" 2>/dev/null || echo ""
}

deploy_release() {
  log_info "Deploying Helm release to ${ENVIRONMENT} environment..."
  log_info "Release: ${HELM_RELEASE_NAME}, Namespace: ${NAMESPACE}, Version: ${VERSION}"
  
  local current_revision=$(get_current_revision)
  if [ -n "${current_revision}" ]; then
    log_info "Current revision: ${current_revision}"
  else
    log_info "This is the first deployment of this release"
  fi
  
  if helm upgrade --install "${HELM_RELEASE_NAME}" "${HELM_CHART_PATH}" \
    --namespace "${NAMESPACE}" \
    --values "${VALUES_FILE}" \
    --set image.tag="${VERSION}" \
    --timeout "${TIMEOUT}s" \
    --wait \
    --atomic \
    &>> "${LOG_FILE}"; then
    log_success "Helm deployment successful"
    
    # Get new revision
    local new_revision=$(get_current_revision)
    log_info "New revision: ${new_revision}"
  else
    log_error "Helm deployment failed"
    
    if [ "${ROLLBACK_ON_FAILURE}" = "true" ]; then
      log_warning "Attempting automatic rollback..."
      if helm rollback "${HELM_RELEASE_NAME}" --namespace "${NAMESPACE}" &>> "${LOG_FILE}"; then
        log_success "Rollback successful"
      else
        log_error "Rollback failed - manual intervention required"
      fi
    fi
    
    exit 1
  fi
}

verify_deployment_health() {
  log_info "Verifying deployment health..."
  
  # Wait for rollout to complete
  if ! kubectl rollout status deployment/"${HELM_RELEASE_NAME}" \
    --namespace "${NAMESPACE}" \
    --timeout="${TIMEOUT}s" \
    &>> "${LOG_FILE}"; then
    log_error "Deployment rollout verification failed"
    return 1
  fi
  
  log_success "Deployment rollout successful"
  
  # Check pod health
  log_info "Verifying pod status..."
  local ready_pods=$(kubectl get pods --namespace "${NAMESPACE}" \
    -l "app.kubernetes.io/name=${HELM_RELEASE_NAME}" \
    -o jsonpath='{.items[?(@.status.conditions[?(@.type=="Ready")].status=="True")].metadata.name}' | wc -w)
  
  local total_pods=$(kubectl get pods --namespace "${NAMESPACE}" \
    -l "app.kubernetes.io/name=${HELM_RELEASE_NAME}" \
    -o jsonpath='{.items[*].metadata.name}' | wc -w)
  
  if [ "$ready_pods" -eq "$total_pods" ] && [ "$total_pods" -gt 0 ]; then
    log_success "All pods healthy: ${ready_pods}/${total_pods} ready"
  else
    log_warning "Pod health check: ${ready_pods}/${total_pods} ready (expected all to be ready)"
    if [ "$total_pods" -eq 0 ]; then
      log_error "No pods found for deployment"
      return 1
    fi
  fi
  
  return 0
}

get_deployment_info() {
  log_info "Deployment Information:"
  echo ""
  echo "Environment:    ${ENVIRONMENT}"
  echo "Namespace:      ${NAMESPACE}"
  echo "Release:        ${HELM_RELEASE_NAME}"
  echo "Image Tag:      ${VERSION}"
  echo "Chart Path:     ${HELM_CHART_PATH}"
  echo "Values File:    ${VALUES_FILE}"
  echo ""
  
  # Get service endpoint
  log_info "Service Information:"
  kubectl get svc --namespace "${NAMESPACE}" \
    -l "app.kubernetes.io/name=${HELM_RELEASE_NAME}" \
    -o wide &>> "${LOG_FILE}" || true
  
  # Get pod information
  log_info "Pod Information:"
  kubectl get pods --namespace "${NAMESPACE}" \
    -l "app.kubernetes.io/name=${HELM_RELEASE_NAME}" \
    -o wide &>> "${LOG_FILE}" || true
}

################################################################################
# Main Execution
################################################################################

main() {
  local ENVIRONMENT=""
  local VERSION=""
  local VALUES_FILE=""
  
  # Parse arguments
  while [[ $# -gt 0 ]]; do
    case $1 in
      --environment)
        ENVIRONMENT="$2"
        shift 2
        ;;
      --version)
        VERSION="$2"
        shift 2
        ;;
      --dry-run)
        DRY_RUN=true
        shift
        ;;
      --timeout)
        TIMEOUT="$2"
        shift 2
        ;;
      --no-rollback)
        ROLLBACK_ON_FAILURE=false
        shift
        ;;
      --context)
        kubectl config use-context "$2" || exit 1
        shift 2
        ;;
      --values)
        VALUES_FILE="$2"
        shift 2
        ;;
      --help|-h)
        print_usage
        exit 0
        ;;
      *)
        log_error "Unknown option: $1"
        print_usage
        exit 1
        ;;
    esac
  done
  
  # Validate required arguments
  if [ -z "${ENVIRONMENT}" ] || [ -z "${VERSION}" ]; then
    log_error "Missing required arguments"
    print_usage
    exit 1
  fi
  
  # Execute deployment workflow
  log_info "Starting Forge Platform deployment workflow"
  log_info "Log file: ${LOG_FILE}"
  echo ""
  
  check_prerequisites
  validate_environment
  verify_kubernetes_connection
  validate_helm_chart
  template_helm_release
  
  if [ "${DRY_RUN}" = "true" ]; then
    log_info "Running in DRY-RUN mode - no changes will be applied"
    perform_dry_run
    log_success "Dry-run completed successfully"
  else
    deploy_release
    
    if verify_deployment_health; then
      get_deployment_info
      log_success "Deployment completed successfully"
      log_info "Deploy log saved to: ${LOG_FILE}"
      exit 0
    else
      log_error "Deployment health verification failed"
      exit 1
    fi
  fi
}

main "$@"
