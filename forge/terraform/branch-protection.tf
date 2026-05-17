terraform {
  required_providers {
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }
}

provider "github" {
  owner = var.github_owner
  token = var.github_token
}

# Variables
variable "github_owner" {
  description = "GitHub organization or user name"
  type        = string
}

variable "github_token" {
  description = "GitHub API token"
  type        = string
  sensitive   = true
}

variable "repositories" {
  description = "List of repositories to configure"
  type = list(object({
    name  = string
    teams = list(string)
  }))
  default = [
    {
      name  = "forge-platform"
      teams = ["backend-team", "devops-team"]
    },
    {
      name  = "forge-web-studio"
      teams = ["frontend-team", "devops-team"]
    },
    {
      name  = "forge-core"
      teams = ["backend-team", "devops-team"]
    },
    {
      name  = "forge-agents"
      teams = ["backend-team", "devops-team"]
    }
  ]
}

# Data source for repositories
data "github_repository" "repos" {
  for_each = { for repo in var.repositories : repo.name => repo }
  name     = each.value.name
}

# Main branch protection
resource "github_branch_protection" "main" {
  for_each = data.github_repository.repos

  repository_id          = each.value.id
  pattern                = "main"
  enforce_admins         = true
  require_signed_commits = true
  require_linear_history = true
  allow_force_pushes     = false
  allow_deletions        = false

  # Status checks
  required_status_checks {
    strict   = true
    contexts = [
      "ci/build",
      "ci/test",
      "ci/lint",
      "ci/type-check",
      "ci/coverage",
      "security/codeql"
    ]
  }

  # Pull request review requirements
  required_pull_request_reviews {
    dismiss_stale_reviews           = true
    require_code_owner_reviews      = true
    required_approving_review_count = 2
    require_last_push_approval      = true
  }

  # Restrict who can push
  restrictions {
    teams = var.repositories[index(
      [for r in var.repositories : r.name],
      each.key
    )].teams
    apps = ["github-actions"]
  }

  depends_on = [data.github_repository.repos]
}

# Develop branch protection
resource "github_branch_protection" "develop" {
  for_each = data.github_repository.repos

  repository_id          = each.value.id
  pattern                = "develop"
  enforce_admins         = true
  require_signed_commits = true
  require_linear_history = false
  allow_force_pushes     = false
  allow_deletions        = false

  # Status checks
  required_status_checks {
    strict   = true
    contexts = [
      "ci/build",
      "ci/test",
      "ci/lint",
      "ci/type-check",
      "ci/coverage"
    ]
  }

  # Pull request review requirements
  required_pull_request_reviews {
    dismiss_stale_reviews           = true
    require_code_owner_reviews      = true
    required_approving_review_count = 1
    require_last_push_approval      = false
  }

  depends_on = [data.github_repository.repos]
}

# Staging branch protection
resource "github_branch_protection" "staging" {
  for_each = data.github_repository.repos

  repository_id          = each.value.id
  pattern                = "staging"
  enforce_admins         = false
  require_signed_commits = false
  require_linear_history = false
  allow_force_pushes     = false
  allow_deletions        = false

  # Status checks
  required_status_checks {
    strict   = true
    contexts = [
      "ci/build",
      "ci/test",
      "ci/lint"
    ]
  }

  # Pull request review requirements
  required_pull_request_reviews {
    dismiss_stale_reviews           = true
    require_code_owner_reviews      = false
    required_approving_review_count = 1
    require_last_push_approval      = false
  }

  depends_on = [data.github_repository.repos]
}

# Outputs
output "protected_branches" {
  description = "Summary of protected branches"
  value = {
    main    = [for repo in data.github_repository.repos : "${repo.name}/main"]
    develop = [for repo in data.github_repository.repos : "${repo.name}/develop"]
    staging = [for repo in data.github_repository.repos : "${repo.name}/staging"]
  }
}
