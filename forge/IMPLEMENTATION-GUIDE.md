# Branch Protection Rules - Implementation Guide

## Quick Start

### Using the Script (Recommended)

1. **Prerequisites**
```bash
# Install GitHub CLI
brew install gh

# Authenticate with GitHub
gh auth login
```

2. **Execute Configuration**
```bash
cd forge
chmod +x scripts/configure-branch-protection.sh

# Dry run first to verify
./scripts/configure-branch-protection.sh --owner "your-org" --dry-run

# Apply configuration
./scripts/configure-branch-protection.sh --owner "your-org"
```

### Using Terraform

1. **Prerequisites**
```bash
terraform init
```

2. **Set Variables**
```bash
export TF_VAR_github_owner="your-org"
export TF_VAR_github_token="your-github-token"
```

3. **Plan & Apply**
```bash
terraform plan  # Review changes
terraform apply # Apply configuration
```

### Using GitHub Web UI

1. Go to each repository → Settings → Branches
2. Click "Add rule"
3. Configure according to BRANCH-PROTECTION-RULES.md
4. Repeat for all 4 repositories

## Step-by-Step Manual Configuration

### For the `main` Branch

1. **Navigate to Branch Protection**
   - Repository → Settings → Branches → Add rule
   - Pattern: `main`

2. **Status Checks**
   - Require status checks to pass: ✅
   - Require branches to be up to date: ✅
   - Contexts:
     - `ci/build`
     - `ci/test`
     - `ci/lint`
     - `ci/type-check`
     - `ci/coverage`
     - `security/codeql`

3. **Pull Request Reviews**
   - Require pull request reviews: ✅
   - Required approving reviews: 2
   - Require code owner review: ✅
   - Dismiss stale reviews: ✅
   - Require last push approval: ✅

4. **Restrictions**
   - Require signed commits: ✅
   - Require linear history: ✅
   - Enforce admins: ✅
   - Allow force pushes: ❌
   - Allow deletions: ❌

### For the `develop` Branch

Same as `main` except:
- Required approving reviews: 1
- Require last push approval: ❌
- Require linear history: ❌
- Enforce admins: ✅ (recommended)

### For the `staging` Branch

Same as `develop` except:
- Require code owner review: ❌
- Require signed commits: ❌
- Enforce admins: ❌

## Setting Up CODEOWNERS

### Create `.github/CODEOWNERS` in Each Repository

Template provided in:
- `forge-platform/.github/CODEOWNERS`
- `forge-web-studio/.github/CODEOWNERS`

### Structure

```
# Comments start with #
# Pattern     Owners

/src/api      @backend-team
/app          @frontend-team
/.github      @devops-team
*.md          @documentation-team

# Default
*             @backend-team
```

### Organization Setup

1. **Create Teams** (if not already done)
   ```bash
   gh api orgs/{org}/teams --input - << 'EOF'
   {
     "name": "backend-team",
     "description": "Backend development team"
   }
   EOF
   ```

2. **Add Members to Teams**
   ```bash
   gh api orgs/{org}/teams/backend-team/memberships/{username} \
     -f role=member
   ```

3. **Assign Teams to Repositories**
   ```bash
   gh api repos/{org}/forge-platform/teams/backend-team \
     -f permission=push
   ```

## Verification Steps

### 1. Verify Rules Applied

```bash
# Check branch protection status
for repo in forge-platform forge-web-studio forge-core forge-agents; do
  gh api repos/$ORG/$repo/branches/main/protection --jq '.required_pull_request_reviews.required_approving_review_count'
done
```

### 2. Test with a PR

1. Create a test branch
2. Make a trivial change (add comment)
3. Push and create PR
4. Verify:
   - ✅ Status checks required
   - ✅ Cannot merge without reviews
   - ✅ Cannot merge if checks fail
   - ✅ Cannot bypass with admin access (if enforced)

### 3. Review Configuration

1. Go to Settings → Branches for each repo
2. Verify all rules are visible and enabled
3. Check CODEOWNERS file is recognized

## Troubleshooting

### Issue: "Status check context not found"

**Problem**: GitHub can't find the status check context in CI/CD
**Solution**:
1. Ensure workflow has completed at least once
2. Verify workflow name matches exactly
3. Run workflow manually to generate the context
4. Wait 5-10 minutes for GitHub to recognize

### Issue: "Cannot dismiss CODEOWNERS review"

**Problem**: CODEOWNERS review can't be dismissed
**Solution**:
1. Verify team exists and has members
2. Check team has push/write access to repo
3. Ensure team is added to CODEOWNERS file
4. Verify PR author is not the only reviewer

### Issue: "Enforce admins toggle not working"

**Problem**: Can't toggle enforce admins
**Solution**:
1. Ensure you have admin access
2. Try disabling other rules temporarily
3. Verify branch exists and is not default
4. Wait for API to sync (few seconds)

### Issue: Script Authentication Fails

**Problem**: `gh` command returns authentication error
**Solution**:
```bash
# Re-authenticate
gh auth logout
gh auth login

# Verify authentication
gh auth status

# Check token permissions
gh api user
```

## CI/CD Integration

### GitHub Actions Workflow

The CI/CD pipeline must include all required status checks:

```yaml
name: CI

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      # Build, test, lint, type-check, coverage
      # Must pass for main branch merges

  security:
    runs-on: ubuntu-latest
    steps:
      # CodeQL and security scanning
      # Must pass for main branch merges
```

See `.github/workflows/ci.yml` for complete example.

## Rollout Plan

### Week 1: Main Branch
- [ ] Configure `main` branch protection
- [ ] Test with real PR
- [ ] Document any issues
- [ ] Get team feedback

### Week 2: Develop Branch
- [ ] Configure `develop` branch protection
- [ ] Train team on new workflow
- [ ] Monitor merge times
- [ ] Adjust rules if needed

### Week 3: Staging Branch
- [ ] Configure `staging` branch protection
- [ ] Final verification
- [ ] Update documentation

### Week 4: Monitoring
- [ ] Review merge metrics
- [ ] Track rule bypasses
- [ ] Gather team feedback
- [ ] Make adjustments

## Monitoring & Maintenance

### Monthly Checklist

- [ ] Review branch protection rules
- [ ] Check for bypass requests/logs
- [ ] Update status checks if CI changed
- [ ] Verify CODEOWNERS is current
- [ ] Review team memberships
- [ ] Check code review times

### Quarterly Review

- [ ] Audit all branch protection rules
- [ ] Update approval requirements if team size changed
- [ ] Review and update CODEOWNERS
- [ ] Generate compliance report

### Annual Review

- [ ] Full security assessment
- [ ] Update strategy based on incidents
- [ ] Revise enforcement policies
- [ ] Plan improvements

## Emergency Procedures

### Temporary Rule Disabling

**Only in critical situations:**

1. Create GitHub issue: `[CRITICAL]` prefix
2. Get approval from 2+ architects
3. Document reason and expected duration
4. Disable specific rule (e.g., "allow force pushes")
5. Re-enable immediately after incident
6. Post-mortem and process improvement

### Emergency Release

1. Use emergency bypass (if configured)
2. Requires 2 approvals from leads
3. Document: issue link, approvers, timestamp
4. Enhanced monitoring for 24 hours post-release

## Documentation Links

- [GitHub Branch Protection Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [CODEOWNERS Documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [Terraform GitHub Provider](https://registry.terraform.io/providers/integrations/github/latest/docs)

