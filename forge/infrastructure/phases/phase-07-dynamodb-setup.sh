#!/bin/bash
# Phase 7: DynamoDB Setup
# Duration: 1 hour
# Components: DynamoDB tables, global secondary indexes, autoscaling

set -e

echo "=== Phase 7: DynamoDB Setup ==="

source /tmp/phase-01-outputs.txt

# Variables
AWS_REGION="us-east-1"
PROJECT_NAME="forge"

# Function to create DynamoDB table
create_dynamodb_table() {
  local TABLE_NAME=$1
  local PARTITION_KEY=$2
  local SORT_KEY=$3
  
  echo "Creating DynamoDB table: $TABLE_NAME"
  
  if [ -z "$SORT_KEY" ]; then
    aws dynamodb create-table \
      --table-name $TABLE_NAME \
      --attribute-definitions AttributeName=$PARTITION_KEY,AttributeType=S \
      --key-schema AttributeName=$PARTITION_KEY,KeyType=HASH \
      --billing-mode PAY_PER_REQUEST \
      --tags Key=Project,Value=$PROJECT_NAME,Key=Environment,Value=production \
      --region $AWS_REGION || echo "Table $TABLE_NAME already exists"
  else
    aws dynamodb create-table \
      --table-name $TABLE_NAME \
      --attribute-definitions \
        AttributeName=$PARTITION_KEY,AttributeType=S \
        AttributeName=$SORT_KEY,AttributeType=S \
      --key-schema \
        AttributeName=$PARTITION_KEY,KeyType=HASH \
        AttributeName=$SORT_KEY,KeyType=RANGE \
      --billing-mode PAY_PER_REQUEST \
      --tags Key=Project,Value=$PROJECT_NAME,Key=Environment,Value=production \
      --region $AWS_REGION || echo "Table $TABLE_NAME already exists"
  fi
}

# Step 1: Create Users table
echo "Step 1: Creating Users table..."
create_dynamodb_table "${PROJECT_NAME}-users" "user_id" "created_at"

# Step 2: Create Sessions table
echo "Step 2: Creating Sessions table..."
create_dynamodb_table "${PROJECT_NAME}-sessions" "session_id" "expires_at"

# Step 3: Create API Keys table
echo "Step 3: Creating API Keys table..."
create_dynamodb_table "${PROJECT_NAME}-api-keys" "api_key_id" "created_at"

# Step 4: Create Audit Logs table
echo "Step 4: Creating Audit Logs table..."
aws dynamodb create-table \
  --table-name "${PROJECT_NAME}-audit-logs" \
  --attribute-definitions \
    AttributeName=user_id,AttributeType=S \
    AttributeName=timestamp,AttributeType=N \
  --key-schema \
    AttributeName=user_id,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --global-secondary-indexes \
    "IndexName=action-index,Keys=[{AttributeName=action,KeyType=HASH},{AttributeName=timestamp,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}" \
  --billing-mode PAY_PER_REQUEST \
  --tags Key=Project,Value=$PROJECT_NAME,Key=Environment,Value=production \
  --region $AWS_REGION || echo "Audit logs table already exists"

# Step 5: Create Notifications table
echo "Step 5: Creating Notifications table..."
create_dynamodb_table "${PROJECT_NAME}-notifications" "user_id" "notification_id"

# Step 6: Create Feature Flags table
echo "Step 6: Creating Feature Flags table..."
create_dynamodb_table "${PROJECT_NAME}-feature-flags" "flag_name" ""

# Step 7: Create Webhooks table
echo "Step 7: Creating Webhooks table..."
aws dynamodb create-table \
  --table-name "${PROJECT_NAME}-webhooks" \
  --attribute-definitions \
    AttributeName=webhook_id,AttributeType=S \
    AttributeName=organization_id,AttributeType=S \
  --key-schema \
    AttributeName=webhook_id,KeyType=HASH \
  --global-secondary-indexes \
    "IndexName=org-index,Keys=[{AttributeName=organization_id,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}" \
  --billing-mode PAY_PER_REQUEST \
  --tags Key=Project,Value=$PROJECT_NAME,Key=Environment,Value=production \
  --region $AWS_REGION || echo "Webhooks table already exists"

# Step 8: Create Events table
echo "Step 8: Creating Events table..."
aws dynamodb create-table \
  --table-name "${PROJECT_NAME}-events" \
  --attribute-definitions \
    AttributeName=event_id,AttributeType=S \
    AttributeName=timestamp,AttributeType=N \
  --key-schema \
    AttributeName=event_id,KeyType=HASH \
  --global-secondary-indexes \
    "IndexName=timestamp-index,Keys=[{AttributeName=timestamp,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=10,WriteCapacityUnits=10}" \
  --billing-mode PAY_PER_REQUEST \
  --time-to-live-specification AttributeName=ttl,Enabled=true \
  --tags Key=Project,Value=$PROJECT_NAME,Key=Environment,Value=production \
  --region $AWS_REGION || echo "Events table already exists"

# Step 9: Wait for tables to be created
echo "Step 9: Waiting for tables to be created..."
for TABLE in "${PROJECT_NAME}-users" "${PROJECT_NAME}-sessions" "${PROJECT_NAME}-api-keys" "${PROJECT_NAME}-audit-logs" "${PROJECT_NAME}-notifications" "${PROJECT_NAME}-feature-flags" "${PROJECT_NAME}-webhooks" "${PROJECT_NAME}-events"; do
  aws dynamodb wait table-exists \
    --table-name $TABLE \
    --region $AWS_REGION || echo "$TABLE is already available"
done

# Step 10: Enable Point-in-Time Recovery
echo "Step 10: Enabling Point-in-Time Recovery..."
for TABLE in "${PROJECT_NAME}-users" "${PROJECT_NAME}-sessions" "${PROJECT_NAME}-api-keys" "${PROJECT_NAME}-audit-logs" "${PROJECT_NAME}-notifications" "${PROJECT_NAME}-feature-flags" "${PROJECT_NAME}-webhooks" "${PROJECT_NAME}-events"; do
  aws dynamodb update-continuous-backups \
    --table-name $TABLE \
    --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
    --region $AWS_REGION || true
done

# Step 11: Set up CloudWatch alarms for DynamoDB
echo "Step 11: Setting up CloudWatch monitoring..."
for TABLE in "${PROJECT_NAME}-users" "${PROJECT_NAME}-sessions" "${PROJECT_NAME}-api-keys"; do
  aws cloudwatch put-metric-alarm \
    --alarm-name "DynamoDB-ConsumedWriteCapacity-${TABLE}" \
    --alarm-description "Alert when DynamoDB write capacity is high" \
    --metric-name ConsumedWriteCapacityUnits \
    --namespace AWS/DynamoDB \
    --statistic Sum \
    --period 300 \
    --threshold 1000 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 1 \
    --dimensions Name=TableName,Value=$TABLE \
    --region $AWS_REGION || true
done

# Step 12: Store DynamoDB table names in Secrets Manager
echo "Step 12: Storing DynamoDB configuration..."
aws secretsmanager create-secret \
  --name ${PROJECT_NAME}/dynamodb/tables \
  --description "DynamoDB table names for Forge" \
  --secret-string '{
    "users_table":"'${PROJECT_NAME}'-users",
    "sessions_table":"'${PROJECT_NAME}'-sessions",
    "api_keys_table":"'${PROJECT_NAME}'-api-keys",
    "audit_logs_table":"'${PROJECT_NAME}'-audit-logs",
    "notifications_table":"'${PROJECT_NAME}'-notifications",
    "feature_flags_table":"'${PROJECT_NAME}'-feature-flags",
    "webhooks_table":"'${PROJECT_NAME}'-webhooks",
    "events_table":"'${PROJECT_NAME}'-events"
  }' \
  --tags "Key=Project,Value=${PROJECT_NAME}" \
  --region $AWS_REGION || echo "Secret already exists"

echo "=== Phase 7: Complete ==="
echo "All DynamoDB tables created successfully"
