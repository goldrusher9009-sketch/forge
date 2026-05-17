# Forge Platform - Branch Protection Rules Configuration

## Overview

This document outlines the branch protection rules for all Forge repositories to ensure code quality, security, and maintainability.

## Repositories Covered

1. **forge-platform** - Node.js Express backend API
2. **forge-web-studio** - Next.js frontend application
3. **forge-core** - Rust execution engine
4. **forge-agents** - Agent implementations and integrations

## Branch Protection Rules

### Protected Branches

- `main` - Production release branch
- `develop` - Integration and staging branch
- `staging` - Pre-production environment

### Enforce Rules on All Protected Branches

#### 1. Require Pull Request Reviews Before Merging
- **Require a pull request before merging**: ✅ Enabled
- **Dismiss stale pull request approvals when new commits are pushed**: ✅ Enabled
- **Require review from Code Owners**: ✅ Enabled
- **Require approval of the most recent reviewable push**: ✅ Enabled
- **Number of approvals required**: 2 (for `main`), 1 (for `develop` and `staging`)

#### 2. Require Status Checks to Pass Before Merging
- **Require branches to be up to date before merging**: ✅ Enabled
- **Require status checks to pass**:
  - `ci/build` (TypeScript/Rust compilation)
  - `ci/test` (Unit and integration tests)
  - `ci/lint` (Code quality checks)
  - `ci/type-check` (TypeScript strict mode)
  - `ci/coverage` (Minimum 80% code coverage)
  - `security/codeql` (CodeQL analysis)

#### 3. Require Code Owner Reviews
- **CODEOWNERS** file required in all repositories
- CODEOWNERS locations:
  - Root `CODEOWNERS` for general governance
  - `src/CODEOWNERS` for source code
  - `.github/CODEOWNERS` for CI/CD configurations

#### 4. Require Conversation Resolution
- **Require all conversations on code to be resolved before merging**: ✅ Enabled

#### 5. Commit Signing
- **Require commits to be signed**: ✅ Enabled
- Team members must use GPG or SSH signing for commits

#### 6. Require CODEOWNERS Review
- **Require review from Code Owners**: ✅ Enabled

#### 7. Restrict Who Can Push to Matching Branches
- **Restrict who can push to matching branches**: ✅ Enabled (Admins only for main)
- **Allow specified actors to bypass required pull requests**:
  - GitHub Actions bot (for automated releases)
  - Dependabot (for automated dependency updates with approval)

#### 8. Require a Conversation Resolution Before Merging
- **Dismiss pull requests when a new commit is pushed**: ✅ Enabled

### Branch-Specific Rules

#### `main` Branch (Production)
```yaml
required_approvals: 2
require_code_owner_review: true
require_up_to_date: true
require_status_checks: true
status_checks:
  - ci/build
  - ci/test
  - ci/lint
  - ci/type-check
  - ci/coverage (>80%)
  - security/codeql
require_commit_signing: true
dismiss_stale_reviews: true
require_conversation_resolution: true
restrict_pushes: true
```

#### `develop` Branch (Integration)
```yaml
required_approvals: 1
require_code_owner_review: true
require_up_to_date: true
require_status_checks: true
status_checks:
  - ci/build
  - ci/test
  - ci/lint
  - ci/coverage (>70%)
require_commit_signing: true
dismiss_stale_reviews: true
require_conversation_resolution: true
```

#### `staging` Branch (Pre-production)
```yaml
required_approvals: 1
require_code_owner_review: false
require_up_to_date: true
require_status_checks: true
status_checks:
  - ci/build
  - ci/test
  - ci/lint
require_commit_signing: false
dismiss_stale_reviews: true
```

## CODEOWNERS Template

Each repository should have a `.github/CODEOWNERS` file:

```
# Frontend
/app @frontend-team
/components @frontend-team
/lib @frontend-team
/public @frontend-team

# Backend
/src/api @backend-team
/src/core @backend-team
/src/services @backend-team

# Infrastructure & CI/CD
/.github @devops-team
/docker @devops-team
/k8s @devops-team

# Configuration
/tsconfig.json @architects
/package.json @architects
/jest.config.js @architects
/.eslintrc.json @architects

# Documentation
*.md @documentation-team
```

## Implementation

### Option 1: Using GitHub CLI (Recommended for Manual Setup)

```bash
#!/bin/bash

# Configuration
OWNER="your-org"
REPOS=("forge-platform" "forge-web-studio" "forge-core" "forge-agents")
BRANCHES=("main" "develop" "staging")

for repo in "${REPOS[@]}"; do
  for branch in "${BRANCHES[@]}"; do
    # Branch protection for main (stricter rules)
    if [ "$branch" == "main" ]; then
      gh api repos/$OWNER/$repo/branches/$branch/protection \
        --input - << 'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["ci/build", "ci/test", "ci/lint", "ci/type-check", "ci/coverage", "security/codeql"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "required_approving_review_count": 2,
    "require_last_push_approval": true
  },
  "restrictions": {
    "users": [],
    "teams": ["devops-team"],
    "apps": ["github-actions"]
  },
  "require_signed_commits": true,
  "require_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
    # Similar for develop and staging with adjusted settings
    fi
  done
done
```

### Option 2: Using Terraform (Infrastructure as Code)

See `terraform/branch-protection.tf` for complete IaC configuration.

### Option 3: Using GitHub Web UI

1. Go to repository Settings → Branches
2. Click "Add rule" under Branch protection rules
3. Configure according to the specifications above
4. Apply to all repositories

## Enforcement Strategy

### Automated Checks
1. **CI/CD Pipeline** - All commits trigger checks automatically
2. **CodeQL** - Security scanning on every push
3. **Coverage Reports** - Minimum thresholds enforced
4. **Type Checking** - TypeScript/Rust strict mode

### Manual Review
1. **Code Owners Review** - Domain experts approve changes
2. **Peer Review** - Team members verify quality
3. **Architecture Review** - Lead engineers validate design

### Monitoring & Compliance
1. **Branch Protection Audit** - Review rule compliance quarterly
2. **Bypass Tracking** - Monitor and log all rule bypasses
3. **Metrics Dashboard** - Track merge metrics and review times

## Exception Handling

### Valid Bypass Scenarios
1. **Critical Security Patches** - Requires 2 security leads
2. **Production Hotfixes** - Requires 1 architect + 1 team lead
3. **Automated Releases** - GitHub Actions bot with approval

### Exception Request Process
1. Create GitHub issue with `[EXCEPTION]` prefix
2. Provide business justification
3. Require approval from 2+ architects
4. Document in EXCEPTIONS.log with reason and date

## Rollout Timeline

- **Phase 1 (Week 1)** - Apply rules to `main` branch only
- **Phase 2 (Week 2)** - Apply rules to `develop` branch
- **Phase 3 (Week 3)** - Apply rules to `staging` branch
- **Phase 4 (Ongoing)** - Monitor compliance and refine rules

## Maintenance & Updates

- Review branch protection rules quarterly
- Update status checks as CI/CD evolves
- Adjust approval requirements based on team size
- Document all changes in CHANGELOG

