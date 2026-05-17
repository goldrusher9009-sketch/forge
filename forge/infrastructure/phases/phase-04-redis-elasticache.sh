#!/bin/bash
# Phase 4: ElastiCache (Redis) Setup
# Duration: 1.5 hours
# Components: Redis cluster, failover, parameter optimization

set -e

echo "=== Phase 4: ElastiCache (Redis) Setup ==="

source /tmp/phase-01-outputs.txt

# Variables
AWS_REGION="us-east-1"
PROJECT_NAME="forge"
CACHE_CLUSTER_ID="${PROJECT_NAME}-redis"
CACHE_NODE_TYPE="cache.t3.medium"
ENGINE="redis"
ENGINE_VERSION="7.0"
NUM_CACHE_NODES=3
AUTOMATIC_FAILOVER="true"
MULTI_AZ="true"

# Step 1: Create cache subnet group
echo "Step 1: Creating ElastiCache subnet group..."
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name ${PROJECT_NAME}-redis-subnet-group \
  --cache-subnet-group-description "Subnet group for Forge Redis" \
  --subnet-ids $PRIVATE_SUBNET_1 $PRIVATE_SUBNET_2 \
  --tags "Key=Project,Value=${PROJECT_NAME}" \
  --region $AWS_REGION || echo "Subnet group already exists"

# Step 2: Create security group for Redis
echo "Step 2: Creating security group for Redis..."
REDIS_SG=$(aws ec2 create-security-group \
  --group-name ${PROJECT_NAME}-redis-sg \
  --description "Security group for Forge Redis" \
  --vpc-id $VPC_ID \
  --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=${PROJECT_NAME}-redis-sg}]" \
  --region $AWS_REGION \
  --query 'GroupId' \
  --output text 2>/dev/null || aws ec2 describe-security-groups --filters "Name=group-name,Values=${PROJECT_NAME}-redis-sg" "Name=vpc-id,Values=$VPC_ID" --region $AWS_REGION --query 'SecurityGroups[0].GroupId' --output text)

echo "Redis security group: $REDIS_SG"

# Step 3: Allow inbound Redis traffic
echo "Step 3: Configuring security group rules..."
aws ec2 authorize-security-group-ingress \
  --group-id $REDIS_SG \
  --protocol tcp \
  --port 6379 \
  --source-group $SG_ID \
  --region $AWS_REGION || true

# Step 4: Create parameter group for Redis
echo "Step 4: Creating Redis parameter group..."
aws elasticache create-parameter-group \
  --parameter-group-family redis7 \
  --parameter-group-name ${PROJECT_NAME}-redis-params \
  --description "Optimized Redis parameters for Forge" \
  --tags "Key=Project,Value=${PROJECT_NAME}" \
  --region $AWS_REGION || echo "Parameter group already exists"

# Step 5: Modify parameter group settings
echo "Step 5: Configuring Redis parameters..."
aws elasticache modify-parameter-group \
  --parameter-group-name ${PROJECT_NAME}-redis-params \
  --parameter-name-values \
    ParameterName=maxmemory-policy,ParameterValue=allkeys-lru \
    ParameterName=notify-keyspace-events,ParameterValue=KEA \
  --region $AWS_REGION || true

# Step 6: Create Redis cluster with replication
echo "Step 6: Creating Redis replication group (this takes ~10 minutes)..."
aws elasticache create-replication-group \
  --replication-group-description "Forge Redis cluster with failover" \
  --replication-group-id $CACHE_CLUSTER_ID \
  --engine $ENGINE \
  --engine-version $ENGINE_VERSION \
  --cache-node-type $CACHE_NODE_TYPE \
  --num-cache-clusters $NUM_CACHE_NODES \
  --automatic-failover-enabled $AUTOMATIC_FAILOVER \
  --cache-subnet-group-name ${PROJECT_NAME}-redis-subnet-group \
  --security-group-ids $REDIS_SG \
  --parameter-group-name ${PROJECT_NAME}-redis-params \
  --preferred-maintenance-window "sun:05:00-sun:06:00" \
  --snapshot-retention-limit 7 \
  --snapshot-window "03:00-04:00" \
  --tags "Key=Project,Value=${PROJECT_NAME},Key=Environment,Value=production" \
  --region $AWS_REGION || echo "Replication group already exists"

# Step 7: Wait for replication group to be available
echo "Step 7: Waiting for Redis replication group to be available..."
aws elasticache wait replication-group-available \
  --replication-group-id $CACHE_CLUSTER_ID \
  --region $AWS_REGION || echo "Replication group is already available"

# Step 8: Get Redis endpoint
echo "Step 8: Retrieving Redis endpoint..."
REDIS_ENDPOINT=$(aws elasticache describe-replication-groups \
  --replication-group-id $CACHE_CLUSTER_ID \
  --region $AWS_REGION \
  --query 'ReplicationGroups[0].PrimaryEndpoint.Address' \
  --output text)

REDIS_PORT=$(aws elasticache describe-replication-groups \
  --replication-group-id $CACHE_CLUSTER_ID \
  --region $AWS_REGION \
  --query 'ReplicationGroups[0].PrimaryEndpoint.Port' \
  --output text)

echo "Redis endpoint: $REDIS_ENDPOINT:$REDIS_PORT"

# Step 9: Enable automatic backups
echo "Step 9: Configuring backups..."
aws elasticache modify-replication-group \
  --replication-group-id $CACHE_CLUSTER_ID \
  --snapshot-retention-limit 7 \
  --snapshot-window "03:00-04:00" \
  --apply-immediately \
  --region $AWS_REGION || true

# Step 10: Store credentials in Secrets Manager
echo "Step 10: Storing Redis connection details..."
aws secretsmanager create-secret \
  --name ${PROJECT_NAME}/redis/primary \
  --description "Redis connection details for Forge" \
  --secret-string "{\"endpoint\":\"${REDIS_ENDPOINT}\",\"port\":${REDIS_PORT}}" \
  --tags "Key=Project,Value=${PROJECT_NAME}" \
  --region $AWS_REGION || echo "Secret already exists"

# Save outputs
cat >> /tmp/phase-01-outputs.txt <<EOF
REDIS_ENDPOINT=$REDIS_ENDPOINT
REDIS_PORT=$REDIS_PORT
REDIS_SG=$REDIS_SG
REDIS_CLUSTER_ID=$CACHE_CLUSTER_ID
EOF

echo "=== Phase 4: Complete ==="
echo "Redis cluster is ready at $REDIS_ENDPOINT:$REDIS_PORT"
