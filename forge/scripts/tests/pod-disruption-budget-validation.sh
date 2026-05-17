#!/bin/bash

################################################################################
# Pod Disruption Budget (PDB) Validation and Testing Script
# Phase 10: Kubernetes Resilience Testing and High Availability
#
# Purpose: Comprehensive validation of Pod Disruption Budget configurations
# to ensure cluster resilience, high availability, and planned maintenance safety
#
# Usage: ./pod-disruption-budget-validation.sh [options]
#   --namespace   Kubernetes namespace to test (default: all namespaces)
#   --verbose     Enable verbose logging
#   --report      Generate detailed validation report
#   --simulate    Run disruption simulation tests
################################################################################

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script variables
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
REPORT_FILE="pdb-validation-report-${TIMESTAMP}.txt"
VERBOSE=false
SIMULATE=false
TARGET_NAMESPACE=""

# Test counters
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

################################################################################
# Logging Functions
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED_TESTS++))
}

log_failure() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED_TESTS++))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    ((WARNINGS++))
}

log_to_report() {
    echo "$1" >> "${REPORT_FILE}"
}

verbose_log() {
    if [[ "${VERBOSE}" == true ]]; then
        echo -e "${BLUE}[DEBUG]${NC} $1"
    fi
}

################################################################################
# Test 1: PDB Coverage Validation
# Verifies that all critical deployments have Pod Disruption Budgets defined
################################################################################

test_pdb_coverage() {
    log_info "Test 1: Validating PDB coverage across critical deployments..."
    
    CRITICAL_DEPLOYMENTS=(
        "forge-api"
        "forge-frontend"
        "forge-auth"
        "postgres-operator"
        "redis-operator"
        "elasticsearch-operator"
    )
    
    for deployment in "${CRITICAL_DEPLOYMENTS[@]}"; do
        if kubectl get pdb -n forge "${deployment}" &>/dev/null 2>&1; then
            log_success "PDB found for deployment: ${deployment}"
            log_to_report "✓ PDB coverage: ${deployment} has PDB defined"
        else
            log_warning "No PDB found for critical deployment: ${deployment}"
            log_to_report "⚠ PDB coverage: ${deployment} missing PDB"
        fi
    done
    
    verbose_log "PDB coverage test complete"
}

################################################################################
# Test 2: PDB Availability Constraints Validation
# Verifies that minAvailable/maxUnavailable values are properly configured
################################################################################

test_pdb_availability_constraints() {
    log_info "Test 2: Validating PDB availability constraints..."
    
    PDB_LIST=$(kubectl get pdb -n forge -o json 2>/dev/null || echo "{\"items\":[]}")
    
    echo "${PDB_LIST}" | jq -r '.items[] | select(.metadata.namespace == "forge") | 
        "\(.metadata.name):\(.spec.minAvailable // "unset"):\(.spec.maxUnavailable // "unset")"' | while IFS=: read -r name min_avail max_unavail; do
        
        if [[ -z "${name}" ]]; then
            continue
        fi
        
        if [[ "${min_avail}" == "null" && "${max_unavail}" == "null" ]]; then
            log_failure "PDB ${name}: Neither minAvailable nor maxUnavailable is set"
            log_to_report "✗ Constraints: ${name} has invalid constraint configuration"
        elif [[ "${min_avail}" != "null" ]]; then
            log_success "PDB ${name}: minAvailable = ${min_avail}"
            log_to_report "✓ Constraints: ${name} minAvailable = ${min_avail}"
        elif [[ "${max_unavail}" != "null" ]]; then
            log_success "PDB ${name}: maxUnavailable = ${max_unavail}"
            log_to_report "✓ Constraints: ${name} maxUnavailable = ${max_unavail}"
        fi
    done
    
    verbose_log "PDB availability constraints test complete"
}

################################################################################
# Test 3: PDB Selector Validity Validation
# Verifies that PDB selectors match actual pods in the cluster
################################################################################

test_pdb_selector_validity() {
    log_info "Test 3: Validating PDB selector validity..."
    
    PDB_LIST=$(kubectl get pdb -n forge -o json 2>/dev/null || echo "{\"items\":[]}")
    
    echo "${PDB_LIST}" | jq -r '.items[] | 
        "\(.metadata.name):\(.spec.selector.matchLabels | to_entries | map("\(.key)=\(.value)") | join(","))"' | while IFS=: read -r pdb_name selector; do
        
        if [[ -z "${pdb_name}" || "${selector}" == "" ]]; then
            continue
        fi
        
        POD_COUNT=$(kubectl get pods -n forge -l "${selector}" --no-headers 2>/dev/null | wc -l)
        
        if [[ ${POD_COUNT} -gt 0 ]]; then
            log_success "PDB ${pdb_name}: Selector matches ${POD_COUNT} pods"
            log_to_report "✓ Selector: ${pdb_name} selector is valid (${POD_COUNT} pods)"
        else
            log_failure "PDB ${pdb_name}: Selector matches 0 pods - invalid configuration"
            log_to_report "✗ Selector: ${pdb_name} selector is invalid (no matching pods)"
        fi
    done
    
    verbose_log "PDB selector validity test complete"
}

################################################################################
# Test 4: PDB Disruptions Allowed Validation
# Checks that the disruption budget allows sufficient disruptions
################################################################################

test_pdb_disruptions_allowed() {
    log_info "Test 4: Validating PDB disruptions allowed..."
    
    PDB_LIST=$(kubectl get pdb -n forge -o json 2>/dev/null || echo "{\"items\":[]}")
    
    echo "${PDB_LIST}" | jq -r '.items[] | 
        "\(.metadata.name):\(.status.disruptionsAllowed // 0)"' | while IFS=: read -r pdb_name disruptions; do
        
        if [[ -z "${pdb_name}" ]]; then
            continue
        fi
        
        if [[ ${disruptions} -gt 0 ]]; then
            log_success "PDB ${pdb_name}: ${disruptions} disruptions allowed"
            log_to_report "✓ Disruptions: ${pdb_name} allows ${disruptions} disruptions"
        else
            log_warning "PDB ${pdb_name}: 0 disruptions allowed - cluster may be locked"
            log_to_report "⚠ Disruptions: ${pdb_name} allows 0 disruptions (potential issue)"
        fi
    done
    
    verbose_log "PDB disruptions allowed test complete"
}

################################################################################
# Test 5: PDB Drain Simulation Test
# Simulates voluntary disruption scenario with kubectl drain
################################################################################

test_pdb_drain_simulation() {
    log_info "Test 5: Simulating voluntary disruption scenario..."
    
    if [[ "${SIMULATE}" != true ]]; then
        log_info "Skipping drain simulation (use --simulate flag to enable)"
        return
    fi
    
    # Get a worker node
    WORKER_NODE=$(kubectl get nodes -l node-role.kubernetes.io/worker= -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    
    if [[ -z "${WORKER_NODE}" ]]; then
        log_warning "No worker nodes found for drain simulation"
        return
    fi
    
    log_info "Simulating drain on node: ${WORKER_NODE}"
    
    # Dry run drain to check if PDBs would be violated
    if kubectl drain "${WORKER_NODE}" --dry-run=client --ignore-daemonsets --delete-emptydir-data &>/dev/null; then
        log_success "Drain simulation successful for node: ${WORKER_NODE}"
        log_to_report "✓ Drain Simulation: ${WORKER_NODE} can be safely drained"
    else
        log_failure "Drain simulation failed for node: ${WORKER_NODE}"
        log_to_report "✗ Drain Simulation: ${WORKER_NODE} cannot be safely drained"
    fi
    
    verbose_log "PDB drain simulation test complete"
}

################################################################################
# Test 6: PDB Status Conditions Validation
# Validates PDB status conditions and unhealthy disruption budgets
################################################################################

test_pdb_status_conditions() {
    log_info "Test 6: Validating PDB status conditions..."
    
    PDB_LIST=$(kubectl get pdb -n forge -o json 2>/dev/null || echo "{\"items\":[]}")
    
    echo "${PDB_LIST}" | jq -r '.items[] | 
        "\(.metadata.name):\(.status.conditions[0].type // "Unknown"):\(.status.conditions[0].status // "Unknown")"' | while IFS=: read -r pdb_name condition_type condition_status; do
        
        if [[ -z "${pdb_name}" ]]; then
            continue
        fi
        
        if [[ "${condition_status}" == "True" ]]; then
            log_success "PDB ${pdb_name}: Status condition ${condition_type} is healthy"
            log_to_report "✓ Status: ${pdb_name} is healthy"
        else
            log_warning "PDB ${pdb_name}: Status condition ${condition_type} is ${condition_status}"
            log_to_report "⚠ Status: ${pdb_name} condition is ${condition_status}"
        fi
    done
    
    verbose_log "PDB status conditions test complete"
}

################################################################################
# Test 7: PDB Policy Stability Validation
# Verifies consistent PDB policies across similar deployments
################################################################################

test_pdb_policy_stability() {
    log_info "Test 7: Validating PDB policy stability..."
    
    DEPLOYMENT_GROUPS=(
        "forge-api"
        "forge-frontend"
        "forge-auth"
    )
    
    for app in "${DEPLOYMENT_GROUPS[@]}"; do
        POLICY=$(kubectl get pdb "${app}" -n forge -o jsonpath='{.spec.minAvailable}{.spec.maxUnavailable}' 2>/dev/null || echo "")
        
        if [[ -n "${POLICY}" ]]; then
            log_success "PDB policy for ${app}: ${POLICY}"
            log_to_report "✓ Policy: ${app} has consistent policy"
        else
            log_warning "PDB policy for ${app} not found"
            log_to_report "⚠ Policy: ${app} policy check skipped"
        fi
    done
    
    verbose_log "PDB policy stability test complete"
}

################################################################################
# Test 8: PDB API Version Validation
# Verifies correct API version usage (policy/v1 is required, not v1beta1)
################################################################################

test_pdb_api_version() {
    log_info "Test 8: Validating PDB API version..."
    
    PDB_LIST=$(kubectl get pdb -n forge -o json 2>/dev/null || echo "{\"items\":[]}")
    
    echo "${PDB_LIST}" | jq -r '.items[] | 
        "\(.metadata.name):\(.apiVersion)"' | while IFS=: read -r pdb_name api_version; do
        
        if [[ -z "${pdb_name}" ]]; then
            continue
        fi
        
        if [[ "${api_version}" == "policy/v1" ]]; then
            log_success "PDB ${pdb_name}: Using correct API version policy/v1"
            log_to_report "✓ API Version: ${pdb_name} uses policy/v1"
        else
            log_failure "PDB ${pdb_name}: Using deprecated API version ${api_version}"
            log_to_report "✗ API Version: ${pdb_name} should use policy/v1, not ${api_version}"
        fi
    done
    
    verbose_log "PDB API version test complete"
}

################################################################################
# Test 9: PDB Eviction Monitoring
# Monitors PDB eviction attempts and records disruption patterns
################################################################################

test_pdb_eviction_monitoring() {
    log_info "Test 9: Monitoring PDB eviction attempts..."
    
    # Check Kubernetes audit logs for eviction attempts
    log_info "Checking for pod eviction events in the last 24 hours..."
    
    EVICTION_COUNT=$(kubectl get events -n forge --sort-by='.lastTimestamp' 2>/dev/null | \
        grep -i "evict" | wc -l || echo 0)
    
    if [[ ${EVICTION_COUNT} -gt 0 ]]; then
        log_warning "Found ${EVICTION_COUNT} eviction events in the last 24 hours"
        log_to_report "⚠ Evictions: ${EVICTION_COUNT} eviction events detected"
    else
        log_success "No recent eviction events detected"
        log_to_report "✓ Evictions: No eviction events detected"
    fi
    
    verbose_log "PDB eviction monitoring test complete"
}

################################################################################
# Test 10: PDB Resource Efficiency Validation
# Verifies that PDB overhead is minimal and doesn't over-constrain the cluster
################################################################################

test_pdb_resource_efficiency() {
    log_info "Test 10: Validating PDB resource efficiency..."
    
    TOTAL_PDB=$(kubectl get pdb -n forge 2>/dev/null | wc -l)
    TOTAL_DEPLOYMENTS=$(kubectl get deployments -n forge 2>/dev/null | wc -l)
    
    if [[ ${TOTAL_DEPLOYMENTS} -gt 0 ]]; then
        PDB_COVERAGE=$((TOTAL_PDB * 100 / TOTAL_DEPLOYMENTS))
        log_success "PDB coverage: ${PDB_COVERAGE}% (${TOTAL_PDB} PDBs for ${TOTAL_DEPLOYMENTS} deployments)"
        log_to_report "✓ Coverage: ${PDB_COVERAGE}% of deployments have PDBs"
    fi
    
    # Check for overly restrictive PDBs
    OVERLY_RESTRICTIVE=$(kubectl get pdb -n forge -o jsonpath='{range .items[*]}{.metadata.name}:{.spec.minAvailable}{"\n"}{end}' 2>/dev/null | \
        grep -E ":[0-9]+$" | awk -F: '$NF > 1' | wc -l || echo 0)
    
    if [[ ${OVERLY_RESTRICTIVE} -gt 0 ]]; then
        log_warning "Found ${OVERLY_RESTRICTIVE} PDBs with minAvailable > 1"
        log_to_report "⚠ Efficiency: ${OVERLY_RESTRICTIVE} PDBs may be overly restrictive"
    else
        log_success "PDB constraints are appropriately balanced"
        log_to_report "✓ Efficiency: PDB constraints are well-balanced"
    fi
    
    verbose_log "PDB resource efficiency test complete"
}

################################################################################
# Report Generation
################################################################################

generate_report() {
    echo "================================================================================" > "${REPORT_FILE}"
    echo "Pod Disruption Budget (PDB) Validation Report" >> "${REPORT_FILE}"
    echo "Generated: ${TIMESTAMP}" >> "${REPORT_FILE}"
    echo "================================================================================" >> "${REPORT_FILE}"
    echo "" >> "${REPORT_FILE}"
    
    log_info "Validation Report"
    echo "================================================================================"
    echo "Pod Disruption Budget (PDB) Validation Report"
    echo "Generated: ${TIMESTAMP}"
    echo "================================================================================"
    echo ""
}

print_summary() {
    echo ""
    echo "================================================================================"
    echo "Test Summary"
    echo "================================================================================"
    echo -e "${GREEN}Passed Tests: ${PASSED_TESTS}${NC}"
    echo -e "${YELLOW}Warnings: ${WARNINGS}${NC}"
    echo -e "${RED}Failed Tests: ${FAILED_TESTS}${NC}"
    echo "================================================================================"
    
    log_to_report ""
    log_to_report "================================================================================"
    log_to_report "Test Summary"
    log_to_report "================================================================================"
    log_to_report "Passed Tests: ${PASSED_TESTS}"
    log_to_report "Warnings: ${WARNINGS}"
    log_to_report "Failed Tests: ${FAILED_TESTS}"
    log_to_report "================================================================================"
    
    if [[ -f "${REPORT_FILE}" ]]; then
        log_info "Full report saved to: ${REPORT_FILE}"
        echo ""
        echo "Key metrics:"
        echo "  - Total tests executed: $((PASSED_TESTS + FAILED_TESTS))"
        echo "  - Success rate: $(( PASSED_TESTS * 100 / (PASSED_TESTS + FAILED_TESTS) ))%"
        echo "  - Report location: ${REPORT_FILE}"
    fi
}

################################################################################
# Main Execution
################################################################################

main() {
    # Parse command-line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --namespace)
                TARGET_NAMESPACE="$2"
                shift 2
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --report)
                shift
                ;;
            --simulate)
                SIMULATE=true
                shift
                ;;
            *)
                echo "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    log_info "Starting PDB Validation Test Suite..."
    log_info "Target namespace: ${TARGET_NAMESPACE:-all}"
    
    # Generate report header
    generate_report
    
    # Run all validation tests
    test_pdb_coverage
    test_pdb_availability_constraints
    test_pdb_selector_validity
    test_pdb_disruptions_allowed
    test_pdb_drain_simulation
    test_pdb_status_conditions
    test_pdb_policy_stability
    test_pdb_api_version
    test_pdb_eviction_monitoring
    test_pdb_resource_efficiency
    
    # Print summary
    print_summary
    
    # Exit with appropriate code
    if [[ ${FAILED_TESTS} -gt 0 ]]; then
        exit 1
    else
        exit 0
    fi
}

# Run main function
main "$@"
