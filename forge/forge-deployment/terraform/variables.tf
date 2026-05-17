variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
  default     = "nyc3"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "domain" {
  description = "Domain name"
  type        = string
}

variable "node_size" {
  description = "Node size for Kubernetes cluster"
  type        = string
  default     = "s-2vcpu-4gb"
}

variable "node_count" {
  description = "Initial node count for Kubernetes cluster"
  type        = number
  default     = 3
}
