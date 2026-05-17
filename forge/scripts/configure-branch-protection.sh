#!/bin/bash

##############################################################################
# Forge Platform - Branch Protection Configuration Script
#
# This script configures branch protection rules for all Forge repositories
# using the GitHub CLI (gh).
#
# Prerequisites:
#   - GitHub CLI installed (brew install gh)
#   - Authenticated with GitHub (gh auth login)
#   - Admin access to the repositories
#
# Usage:
#   chmod +x configure-branch-protection.sh
#   ./configure-branch-protection.sh --owner "your-org"
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
OWNER=""
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --owner)
      OWNER="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate required parameters
if [ -z "$OWNER" ]; then
  echo -e "${RED}Error: --owner is required${NC}"
  exit 1
fi

REPOS=("forge-platform" "forge-web-studio" "forge-core" "forge-agents")
BRANCHES=("main" "develop" "staging")

# Helper function to configure branch protection
configure_branch_protection() {
  local repo=$1
  local branch=$2

  echo -e "${BLUE}Configuring ${branch} branch for ${repo}...${NC}"

  if [ "$DRY_RUN" = true ]; then
    echo "  [DRY RUN] Would configure $branch with:"
    case $branch in
      main)
        echo "    - Required approvals: 2"
        echo "    - Require code owner review: true"
        echo "    - Require signed commits: true"
        echo "    - Enforce admins: true"
        ;;
      develop)
        echo "    - Required approvals: 1"
        echo "    - Require code owner review: true"
        echo "    - Require signed commits: true"
        echo "    - Enforce admins: true"
        ;;
      staging)
        echo "    - Required approvals: 1"
        echo "    - Require code owner review: false"
        echo "    - Require signed commits: false"
        echo "    - Enforce admins: false"
        ;;
    esac
    return
  fi

  # Get repository node ID
  REPO_ID=$(gh api repos/$OWNER/$repo --jq '.node_id')

  if [ -z "$REPO_ID" ]; then
    echo -e "${RED}  ✗ Failed to get repository ID for $repo${NC}"
    return 1
  fi

  case $branch in
    main)
      # Main branch: Strictest rules
      gh api repos/$OWNER/$repo/branches/$branch/protection \
        -X PUT \
        -f required_status_checks='{
          "strict": true,
          "contexts": ["ci/build", "ci/test", "ci/lint", "ci/type-check", "ci/coverage", "security/codeql"]
        }' \
        -f enforce_admins=true \
        -f required_pull_request_reviews='{
          "dismiss_stale_reviews": true,
          "require_code_owner_reviews": true,
          "required_approving_review_count": 2,
          "require_last_push_approval": true
        }' \
        -f restrictions=null \
        -f require_signed_commits=true \
        -f require_linear_history=true \
        -f allow_force_pushes=false \
        -f allow_deletions=false 2>/dev/null && \
      echo -e "${GREEN}  ✓ Configured main branch${NC}" || \
      echo -e "${RED}  ✗ Failed to configure main branch${NC}"
      ;;

    develop)
      # Develop branch: Moderate rules
      gh api repos/$OWNER/$repo/branches/$branch/protection \
        -X PUT \
        -f required_status_checks='{
          "strict": true,
          "contexts": ["ci/build", "ci/test", "ci/lint", "ci/type-check", "ci/coverage"]
        }' \
        -f enforce_admins=true \
        -f required_pull_request_reviews='{
          "dismiss_stale_reviews": true,
          "require_code_owner_reviews": true,
          "required_approving_review_count": 1,
          "require_last_push_approval": false
        }' \
        -f restrictions=null \
        -f require_signed_commits=true \
        -f require_linear_history=false \
        -f allow_force_pushes=false \
        -f allow_deletions=false 2>/dev/null && \
      echo -e "${GREEN}  ✓ Configured develop branch${NC}" || \
      echo -e "${RED}  ✗ Failed to configure develop branch${NC}"
      ;;

    staging)
      # Staging branch: Basic rules
      gh api repos/$OWNER/$repo/branches/$branch/protection \
        -X PUT \
        -f required_status_checks='{
          "strict": true,
          "contexts": ["ci/build", "ci/test", "ci/lint"]
        }' \
        -f enforce_admins=false \
        -f required_pull_request_reviews='{
          "dismiss_stale_reviews": true,
          "require_code_owner_reviews": false,
          "required_approving_review_count": 1
        }' \
        -f restrictions=null \
        -f require_signed_commits=false \
        -f require_linear_history=false \
        -f allow_force_pushes=false \
        -f allow_deletions=false 2>/dev/null && \
      echo -e "${GREEN}  ✓ Configured staging branch${NC}" || \
      echo -e "${RED}  ✗ Failed to configure staging branch${NC}"
      ;;
  esac
}

# Verify GitHub CLI is installed
if ! command -v gh &> /dev/null; then
  echo -e "${RED}Error: GitHub CLI is not installed${NC}"
  echo "Install with: brew install gh"
  exit 1
fi

# Verify authentication
if ! gh auth status &> /dev/null; then
  echo -e "${RED}Error: Not authenticated with GitHub${NC}"
  echo "Authenticate with: gh auth login"
  exit 1
fi

# Main execution
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Forge Platform - Branch Protection Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Owner: $OWNER"
echo "Repositories: ${REPOS[@]}"
echo "Branches: ${BRANCHES[@]}"
echo ""

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}DRY RUN MODE - No changes will be made${NC}"
  echo ""
fi

# Configure each repository and branch
for repo in "${REPOS[@]}"; do
  echo ""
  echo -e "${BLUE}Repository: $repo${NC}"

  # Check if repository exists
  if ! gh repo view $OWNER/$repo &> /dev/null; then
    echo -e "${YELLOW}⚠ Repository $repo not found - skipping${NC}"
    continue
  fi

  for branch in "${BRANCHES[@]}"; do
    configure_branch_protection "$repo" "$branch"
  done
done

echo ""
echo -e "${BLUE}========================================${NC}"
if [ "$DRY_RUN" = true ]; then
  echo -e "${GREEN}Dry run completed successfully${NC}"
else
  echo -e "${GREEN}Branch protection configured successfully!${NC}"
fi
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Verify branch protection rules in GitHub UI"
echo "2. Ensure teams are assigned to repositories"
echo "3. Configure CODEOWNERS file in each repository"
echo "4. Test merge restrictions with a test PR"
