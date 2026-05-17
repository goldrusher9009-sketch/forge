terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.28"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

# VPC for isolated networking
resource "digitalocean_vpc" "forge" {
  name   = "forge-vpc"
  region = var.region
}

# Kubernetes Cluster
resource "digitalocean_kubernetes_cluster" "forge" {
  name    = "forge-k8s-cluster"
  region  = var.region
  version = "latest"
  vpc_uuid = digitalocean_vpc.forge.id

  node_pool {
    name       = "forge-nodes"
    size       = var.node_size
    node_count = var.node_count
    auto_scale = true
    min_nodes  = 3
    max_nodes  = 10
  }

  tags = ["forge", "production"]
}

# Container Registry
resource "digitalocean_container_registry" "forge" {
  name                   = "forge-registry"
  subscription_tier_slug = "starter"
  region                 = var.region
}

# PostgreSQL Database Cluster
resource "digitalocean_database_cluster" "forge_db" {
  name              = "forge-postgres-db"
  engine            = "pg"
  version           = "15"
  region            = var.region
  node_count        = 3
  size              = "db-s-2vcpu-4gb"
  storage_size_gb   = 100
  private_network_uuid = digitalocean_vpc.forge.id

  backup_restore_enabled = true
  backup_restore_days    = 7

  firewall {
    type  = "k8s"
    value = digitalocean_kubernetes_cluster.forge.id
  }

  tags = ["forge", "production"]
}

resource "digitalocean_database_firewall" "forge_db_firewall" {
  cluster_id = digitalocean_database_cluster.forge_db.id

  rule {
    type  = "k8s"
    value = digitalocean_kubernetes_cluster.forge.id
  }
}

# Redis Cache Cluster
resource "digitalocean_database_cluster" "forge_redis" {
  name              = "forge-redis-cache"
  engine            = "redis"
  version           = "7"
  region            = var.region
  node_count        = 3
  size              = "db-s-1vcpu-1gb"
  private_network_uuid = digitalocean_vpc.forge.id

  tags = ["forge", "production"]
}

resource "digitalocean_database_firewall" "forge_redis_firewall" {
  cluster_id = digitalocean_database_cluster.forge_redis.id

  rule {
    type  = "k8s"
    value = digitalocean_kubernetes_cluster.forge.id
  }
}

# Spaces Bucket for Backups
resource "digitalocean_spaces_bucket" "forge_backups" {
  name   = "forge-backups-${var.environment}"
  region = var.region
  acl    = "private"

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE"]
    allowed_origins = ["https://${var.domain}"]
    expose_headers  = ["Content-Length"]
    max_age_seconds = 3000
  }

  tags = ["forge", "backups"]
}

# Domain Registration
resource "digitalocean_domain" "forge" {
  name = var.domain
}

# DNS Records
resource "digitalocean_record" "forge_api" {
  domain = digitalocean_domain.forge.name
  type   = "CNAME"
  name   = "api"
  value  = "${digitalocean_kubernetes_cluster.forge.load_balancer_hostname}."
  ttl    = 3600
}

resource "digitalocean_record" "forge_www" {
  domain = digitalocean_domain.forge.name
  type   = "A"
  name   = "www"
  value  = digitalocean_kubernetes_cluster.forge.load_balancer_ip
  ttl    = 3600
}

resource "digitalocean_record" "forge_root" {
  domain = digitalocean_domain.forge.name
  type   = "A"
  name   = "@"
  value  = digitalocean_kubernetes_cluster.forge.load_balancer_ip
  ttl    = 3600
}

# Outputs
output "kubernetes_cluster_name" {
  value       = digitalocean_kubernetes_cluster.forge.name
  description = "Kubernetes cluster name"
}

output "kubernetes_cluster_id" {
  value       = digitalocean_kubernetes_cluster.forge.id
  description = "Kubernetes cluster ID"
}

output "load_balancer_ip" {
  value       = digitalocean_kubernetes_cluster.forge.load_balancer_ip
  description = "Load balancer IP address"
}

output "load_balancer_hostname" {
  value       = digitalocean_kubernetes_cluster.forge.load_balancer_hostname
  description = "Load balancer hostname"
}

output "database_host" {
  value       = digitalocean_database_cluster.forge_db.host
  description = "Database host"
  sensitive   = true
}

output "database_port" {
  value       = digitalocean_database_cluster.forge_db.port
  description = "Database port"
}

output "database_user" {
  value       = digitalocean_database_cluster.forge_db.user
  description = "Database user"
}

output "database_password" {
  value       = digitalocean_database_cluster.forge_db.password
  description = "Database password"
  sensitive   = true
}

output "database_name" {
  value       = digitalocean_database_cluster.forge_db.database
  description = "Database name"
}

output "redis_host" {
  value       = digitalocean_database_cluster.forge_redis.host
  description = "Redis host"
  sensitive   = true
}

output "redis_port" {
  value       = digitalocean_database_cluster.forge_redis.port
  description = "Redis port"
}

output "redis_password" {
  value       = digitalocean_database_cluster.forge_redis.password
  description = "Redis password"
  sensitive   = true
}

output "container_registry_endpoint" {
  value       = digitalocean_container_registry.forge.endpoint
  description = "Container registry endpoint"
}

output "domain" {
  value       = digitalocean_domain.forge.name
  description = "Domain name"
}
