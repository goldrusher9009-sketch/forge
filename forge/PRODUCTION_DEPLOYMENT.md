# Forge MVP - Production Deployment Guide

## Overview
Complete guide to deploy Forge MVP to AWS production environment with auto-scaling, monitoring, and security.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        USERS                                │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              CloudFront CDN (Global)                         │
│            - Caching & DDoS Protection                       │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
   ┌────▼──┐  ┌──────▼──┐  ┌─────▼──┐
   │  S3   │  │   API   │  │WebSocket│
   │(FE)   │  │  ECS    │  │ (ECS)   │
   └───────┘  └─────────┘  └─────────┘
                  │
        ┌─────────┼─────────┐
        │         │         │
   ┌────▼───┐┌───▼──┐┌─────▼────┐
   │  RDS   ││Redis ││  S3       │
   │(MySQL) ││Cache │ │(Storage) │
   └────────┘└──────┘└──────────┘
```

## Phase 1: AWS Account Setup

### 1.1 Create AWS Account
- Go to [aws.amazon.com](https://aws.amazon.com)
- Create account with business email
- Add payment method
- Set up billing alerts

### 1.2 Set Up AWS CLI

```bash
# Install AWS CLI
brew install awscli  # macOS
# or download from aws.amazon.com

# Configure credentials
aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: us-east-1
# - Default output: json

# Verify
aws sts get-caller-identity
```

### 1.3 Create IAM User for Deployment

1. **AWS Console → IAM → Users → Create User**
2. **Username**: `forge-deploy`
3. **Permissions**: Attach these policies:
   - `AmazonECS_FullAccess`
   - `AmazonRDS_FullAccess`
   - `AmazonS3FullAccess`
   - `CloudFrontFullAccess`
   - `ElastiCacheFullAccess`
   - `CloudWatchFullAccess`
   - `AWSCertificateManagerFullAccess`

4. **Generate Access Keys** → Save securely

### 1.4 Create VPC & Networking

```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16

# Create Public Subnets (2 across AZs for HA)
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.1.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.2.0/24 --availability-zone us-east-1b

# Create Internet Gateway
aws ec2 create-internet-gateway
aws ec2 attach-internet-gateway --internet-gateway-id igw-xxx --vpc-id vpc-xxx

# Create Route Table
aws ec2 create-route-table --vpc-id vpc-xxx
aws ec2 create-route --route-table-id rtb-xxx --destination-cidr-block 0.0.0.0/0 --gateway-id igw-xxx
```

### 1.5 Create Security Groups

```bash
# ALB Security Group
aws ec2 create-security-group \
  --group-name forge-alb-sg \
  --description "ALB security group" \
  --vpc-id vpc-xxx

# Allow HTTP/HTTPS
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxx \
  --protocol tcp --port 80 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-xxx \
  --protocol tcp --port 443 --cidr 0.0.0.0/0

# ECS Security Group
aws ec2 create-security-group \
  --group-name forge-ecs-sg \
  --description "ECS security group" \
  --vpc-id vpc-xxx

# Allow from ALB
aws ec2 authorize-security-group-ingress \
  --group-id sg-ecs-xxx \
  --protocol tcp --port 3000-8000 \
  --source-group sg-alb-xxx
```

## Phase 2: Database Setup (RDS)

### 2.1 Create RDS Instance

```bash
# Create MySQL instance
aws rds create-db-instance \
  --db-instance-identifier forge-prod-db \
  --db-instance-class db.t3.small \
  --engine mysql \
  --engine-version 8.0.33 \
  --master-username admin \
  --master-user-password 'ChangeMe123!' \
  --allocated-storage 100 \
  --db-subnet-group-name default \
  --publicly-accessible false \
  --multi-az \
  --storage-encrypted \
  --backup-retention-period 30
```

### 2.2 RDS Configuration

1. **AWS Console → RDS → Databases → forge-prod-db**
2. **Backup**:
   - Backup retention: 30 days
   - Backup window: 2:00 AM UTC
   - Enable automated backups

3. **High Availability**:
   - Enable Multi-AZ for automatic failover
   - Standby region: us-east-1b

4. **Security**:
   - Security group: `forge-ecs-sg`
   - Encryption: Enabled
   - IAM auth: Enabled

5. **Parameter Groups**:
   - Set `max_connections` to 1000
   - Set `query_cache_type` to 1 (enabled)

### 2.3 Initialize Database

```bash
# Get RDS endpoint
MYSQL_HOST=$(aws rds describe-db-instances \
  --db-instance-identifier forge-prod-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

# Connect
mysql -h $MYSQL_HOST -u admin -p

# Run schema
SOURCE schema.sql
```

**Schema location**: `database/schema.sql` (generated in initial MVP build)

## Phase 3: Caching (ElastiCache)

### 3.1 Create Redis Cluster

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id forge-redis \
  --cache-node-type cache.t3.small \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --security-group-ids sg-xxx \
  --subnet-group-name default \
  --automatic-failover-enabled \
  --multi-az-enabled
```

### 3.2 Get Redis Endpoint

```bash
aws elasticache describe-cache-clusters \
  --cache-cluster-id forge-redis \
  --show-cache-node-info \
  --query 'CacheClusters[0].CacheNodes[0].Endpoint'
```

Store as environment variable: `REDIS_URL=redis://endpoint:6379`

## Phase 4: Container Registry (ECR)

### 4.1 Create ECR Repository

```bash
# Create repo
aws ecr create-repository --repository-name forge-api

# Get login token
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

# Build and push
docker build -t forge-api:latest .
docker tag forge-api:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/forge-api:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/forge-api:latest
```

## Phase 5: Container Orchestration (ECS)

### 5.1 Create ECS Cluster

```bash
# Create cluster
aws ecs create-cluster --cluster-name forge-prod

# Create CloudWatch log group
aws logs create-log-group --log-group-name /ecs/forge-api
```

### 5.2 Create Task Definition

Create `ecs-task-definition.json`:

```json
{
  "family": "forge-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "forge-api",
      "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/forge-api:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "MYSQL_HOST", "value": "forge-prod-db.xxxx.us-east-1.rds.amazonaws.com"},
        {"name": "REDIS_URL", "value": "redis://forge-redis.xxxx.ng.0001.use1.cache.amazonaws.com:6379"}
      ],
      "secrets": [
        {"name": "STRIPE_SECRET_KEY", "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:stripe-key"},
        {"name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:jwt-secret"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/forge-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

Register:

```bash
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json
```

### 5.3 Create Service

```bash
aws ecs create-service \
  --cluster forge-prod \
  --service-name forge-api \
  --task-definition forge-api:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-ecs-xxx],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=forge-api,containerPort=3000
```

## Phase 6: Load Balancing

### 6.1 Create Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name forge-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-alb-xxx \
  --scheme internet-facing \
  --type application

# Create target group
aws elbv2 create-target-group \
  --name forge-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxx \
  --target-type ip

# Create listener (HTTP)
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

### 6.2 Create HTTPS Listener

```bash
# Request SSL certificate
aws acm request-certificate \
  --domain-name forge.app \
  --validation-method DNS

# After validation, create HTTPS listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

## Phase 7: Auto Scaling

### 7.1 Create Auto Scaling Group

```bash
# Create launch template
aws ec2 create-launch-template \
  --launch-template-name forge-lt \
  --version-description "Forge ECS launch template" \
  --launch-template-data '{...}'

# Create ASG
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name forge-asg \
  --launch-template LaunchTemplateId=lt-xxx,Version=\$Latest \
  --min-size 2 \
  --max-size 10 \
  --desired-capacity 2 \
  --health-check-type ELB \
  --health-check-grace-period 300 \
  --vpc-zone-identifier subnet-xxx,subnet-yyy \
  --target-group-arns arn:aws:elasticloadbalancing:...
```

### 7.2 Create Scaling Policies

```bash
# Create target tracking policy (CPU)
aws autoscaling put-scaling-policy \
  --auto-scaling-group-name forge-asg \
  --policy-name forge-cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ASGAverageCPUUtilization"
    },
    "ScaleOutCooldown": 300,
    "ScaleInCooldown": 300
  }'
```

## Phase 8: Monitoring & Logging

### 8.1 CloudWatch Dashboards

```bash
# Create dashboard
aws cloudwatch put-dashboard \
  --dashboard-name ForgeProduction \
  --dashboard-body '{
    "widgets": [
      {
        "type": "metric",
        "properties": {
          "metrics": [
            ["AWS/ECS", "CPUUtilization", {"stat": "Average"}],
            ["AWS/ECS", "MemoryUtilization", {"stat": "Average"}],
            ["AWS/RDS", "DatabaseConnections"],
            ["AWS/ApplicationELB", "TargetResponseTime"]
          ],
          "period": 300,
          "stat": "Average",
          "region": "us-east-1",
          "title": "Forge Performance"
        }
      }
    ]
  }'
```

### 8.2 CloudWatch Alarms

```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name forge-high-cpu \
  --alarm-description "Alert when CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:123456789:AlertTopic

# RDS connection alarm
aws cloudwatch put-metric-alarm \
  --alarm-name forge-db-connections \
  --alarm-description "Alert when connections > 900" \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 900 \
  --comparison-operator GreaterThanThreshold
```

## Phase 9: Domain & DNS

### 9.1 Route 53 Configuration

```bash
# Create hosted zone
aws route53 create-hosted-zone \
  --name forge.app \
  --caller-reference $(date +%s)

# Get nameservers from output
# Update at domain registrar

# Create A record pointing to ALB
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "forge.app",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z123",
          "DNSName": "forge-alb-123456.us-east-1.elb.amazonaws.com",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'

# Create CNAME for www
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "www.forge.app",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "forge.app"}]
      }
    }]
  }'
```

## Phase 10: Security Hardening

### 10.1 AWS Security Best Practices

1. **Enable MFA** on root account
2. **Enable CloudTrail** for audit logging
3. **Enable Config** for compliance monitoring
4. **Set up GuardDuty** for threat detection
5. **Enable WAF** on ALB for DDoS protection

### 10.2 WAF Rules

```bash
# Create Web ACL
aws wafv2 create-web-acl \
  --region us-east-1 \
  --name forge-waf \
  --default-action Block \
  --scope REGIONAL \
  --rules ManagedRuleGroupStatement={...} \
  --visibility-config SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=forge-waf

# Attach to ALB
aws wafv2 associate-web-acl \
  --web-acl-arn arn:aws:wafv2:... \
  --resource-arn arn:aws:elasticloadbalancing:...
```

## Phase 11: CI/CD Pipeline

### 11.1 CodePipeline Setup

```bash
# Create S3 bucket for artifacts
aws s3 mb s3://forge-pipeline-artifacts-prod

# Create CodePipeline
aws codepipeline create-pipeline --cli-input-json file://pipeline.json
```

**pipeline.json**:
```json
{
  "pipeline": {
    "name": "forge-pipeline",
    "roleArn": "arn:aws:iam::123456789:role/CodePipelineRole",
    "stages": [
      {
        "name": "Source",
        "actions": [{
          "name": "GitHub",
          "actionTypeId": {"category": "Source", "owner": "ThirdParty", "provider": "GitHub"},
          "configuration": {"Owner": "...", "Repo": "forge", "Branch": "main"}
        }]
      },
      {
        "name": "Build",
        "actions": [{
          "name": "CodeBuild",
          "actionTypeId": {"category": "Build", "owner": "AWS", "provider": "CodeBuild"},
          "configuration": {"ProjectName": "forge-build"}
        }]
      },
      {
        "name": "Deploy",
        "actions": [{
          "name": "ECS",
          "actionTypeId": {"category": "Deploy", "owner": "AWS", "provider": "AppConfig"},
          "configuration": {"ServiceName": "forge-api", "ClusterName": "forge-prod"}
        }]
      }
    ]
  }
}
```

## Phase 12: Backup & Disaster Recovery

### 12.1 Automated Backups

- **RDS**: 30-day automated backups enabled
- **S3**: Versioning enabled
- **ElastiCache**: Automatic snapshots every hour

### 12.2 Disaster Recovery Plan

1. **RDS Failover**: Automatic (Multi-AZ)
2. **Application**: Auto-scaling handles instance failures
3. **Data**: Regular snapshots to S3
4. **Disaster recovery region**: Set up secondary in us-west-2

## Phase 13: Testing & Validation

### 13.1 Load Testing

```bash
# Using Apache Bench
ab -n 10000 -c 100 https://forge.app/api/health

# Using wrk
wrk -t4 -c100 -d30s https://forge.app/api/health
```

### 13.2 Health Checks

Ensure ALB health checks pass:
- Endpoint: `/api/health`
- Protocol: HTTPS
- Port: 3000
- Interval: 30 seconds
- Timeout: 5 seconds
- Healthy threshold: 2
- Unhealthy threshold: 3

## Phase 14: Go-Live Checklist

- [ ] VPC & networking configured
- [ ] RDS database created & initialized
- [ ] Redis cache deployed
- [ ] ECR image built & pushed
- [ ] ECS cluster & service created
- [ ] ALB with HTTPS configured
- [ ] Auto scaling policies active
- [ ] CloudWatch monitoring enabled
- [ ] CloudTrail logging enabled
- [ ] WAF rules active
- [ ] Domain DNS configured
- [ ] SSL certificate valid
- [ ] Backup strategy verified
- [ ] Load testing passed
- [ ] Security hardening complete
- [ ] On-call rotation set up
- [ ] Runbooks documented
- [ ] Team trained on deployment

## Cost Estimate (Monthly)

| Service | Cost |
|---------|------|
| ECS (2 Fargate tasks) | $30 |
| RDS (db.t3.small) | $40 |
| ElastiCache (cache.t3.small) | $20 |
| ALB | $16 |
| Data transfer | $10 |
| Route 53 | $1 |
| Monitoring/Logs | $5 |
| **Total** | **~$122** |

## Scaling Beyond Launch

- **10K users**: Add read replicas to RDS
- **100K users**: Implement database sharding
- **1M users**: Multi-region deployment

---

**Estimated Setup Time**: 4-6 hours
**Status**: Ready for production launch
