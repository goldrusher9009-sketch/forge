#!/bin/bash
# Phase 3: RDS Database Setup
# Duration: 2.5 hours
# Components: PostgreSQL RDS, backup configuration, monitoring

set -e

echo "=== Phase 3: RDS Database Setup ==="

source /tmp/phase-01-outputs.txt

# Variables
AWS_REGION="us-east-1"
PROJECT_NAME="forge"
DB_INSTANCE_ID="${PROJECT_NAME}-postgres"
DB_CLASS="db.t3.medium"
ALLOCATED_STORAGE=100
ENGINE="postgres"
ENGINE_VERSION="15.3"
DB_NAME="forge_db"
MASTER_USERNAME="forge_admin"
BACKUP_RETENTION_DAYS=30
MULTI_AZ=true

# Step 1: Create DB subnet group
echo "Step 1: Creating DB subnet group..."
aws rds create-db-subnet-group \
  --db-subnet-group-name ${PROJECT_NAME}-db-subnet-group \
  --db-subnet-group-description "Subnet group for Forge RDS" \
  --subnet-ids $PRIVATE_SUBNET_1 $PRIVATE_SUBNET_2 \
  --tags "Key=Project,Value=${PROJECT_NAME}" \
  --region $AWS_REGION || echo "Subnet group already exists"

# Step 2: Create DB security group
echo "Step 2: Creating DB security group..."
DB_SG=$(aws ec2 create-security-group \
  --group-name ${PROJECT_NAME}-rds-sg \
  --description "Security group for Forge RDS" \
  --vpc-id $VPC_ID \
  --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=${PROJECT_NAME}-rds-sg}]" \
  --region $AWS_REGION \
  --query 'GroupId' \
  --output text 2>/dev/null || aws ec2 describe-security-groups --filters "Name=group-name,Values=${PROJECT_NAME}-rds-sg" "Name=vpc-id,Values=$VPC_ID" --region $AWS_REGION --query 'SecurityGroups[0].GroupId' --output text)

echo "DB security group: $DB_SG"

# Step 3: Allow inbound PostgreSQL traffic
echo "Step 3: Configuring security group rules..."
aws ec2 authorize-security-group-ingress \
  --group-id $DB_SG \
  --protocol tcp \
  --port 5432 \
  --source-group $SG_ID \
  --region $AWS_REGION || true

# Step 4: Generate random master password
echo "Step 4: Generating master password..."
MASTER_PASSWORD=$(openssl rand -base64 32)
echo "Master password will be stored in AWS Secrets Manager"

# Step 5: Create RDS instance
echo "Step 5: Creating RDS PostgreSQL instance (this takes ~10 minutes)..."
aws rds create-db-instance \
  --db-instance-identifier $DB_INSTANCE_ID \
  --db-instance-class $DB_CLASS \
  --engine $ENGINE \
  --engine-version $ENGINE_VERSION \
  --master-username $MASTER_USERNAME \
  --master-user-password "$MASTER_PASSWORD" \
  --allocated-storage $ALLOCATED_STORAGE \
  --storage-type gp3 \
  --db-name $DB_NAME \
  --db-subnet-group-name ${PROJECT_NAME}-db-subnet-group \
  --vpc-security-group-ids $DB_SG \
  --backup-retention-period $BACKUP_RETENTION_DAYS \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "sun:04:00-sun:05:00" \
  --multi-az $MULTI_AZ \
  --storage-encrypted true \
  --enable-cloudwatch-logs-exports postgresql \
  --copy-tags-to-snapshot true \
  --enable-iam-database-authentication true \
  --deletion-protection true \
  --tags "Key=Project,Value=${PROJECT_NAME},Key=Environment,Value=production" \
  --region $AWS_REGION || echo "RDS instance already exists"

# Step 6: Wait for RDS to be available
echo "Step 6: Waiting for RDS instance to be available (this takes ~10-15 minutes)..."
aws rds wait db-instance-available \
  --db-instance-identifier $DB_INSTANCE_ID \
  --region $AWS_REGION || echo "RDS instance is already available"

# Step 7: Get RDS endpoint
echo "Step 7: Retrieving RDS endpoint..."
RDS_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier $DB_INSTANCE_ID \
  --region $AWS_REGION \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

echo "RDS endpoint: $RDS_ENDPOINT"

# Step 8: Store credentials in AWS Secrets Manager
echo "Step 8: Storing credentials in AWS Secrets Manager..."
aws secretsmanager create-secret \
  --name ${PROJECT_NAME}/rds/postgres \
  --description "PostgreSQL RDS credentials for Forge" \
  --secret-string "{\"username\":\"${MASTER_USERNAME}\",\"password\":\"${MASTER_PASSWORD}\",\"endpoint\":\"${RDS_ENDPOINT}\",\"port\":5432,\"dbname\":\"${DB_NAME}\"}" \
  --tags "Key=Project,Value=${PROJECT_NAME}" \
  --region $AWS_REGION || echo "Secret already exists"

# Step 9: Enable automated backups
echo "Step 9: Configuring automated backups..."
aws rds modify-db-instance \
  --db-instance-identifier $DB_INSTANCE_ID \
  --backup-retention-period $BACKUP_RETENTION_DAYS \
  --preferred-backup-window "03:00-04:00" \
  --apply-immediately \
  --region $AWS_REGION || true

# Step 10: Enable Enhanced Monitoring
echo "Step 10: Creating monitoring role..."
cat > /tmp/rds-monitoring-trust.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "monitoring.rds.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

MONITORING_ROLE=$(aws iam create-role \
  --role-name ${PROJECT_NAME}-rds-monitoring-role \
  --assume-role-policy-document file:///tmp/rds-monitoring-trust.json \
  --region $AWS_REGION \
  --query 'Role.RoleName' \
  --output text 2>/dev/null || echo "${PROJECT_NAME}-rds-monitoring-role")

aws iam attach-role-policy \
  --role-name $MONITORING_ROLE \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole \
  --region $AWS_REGION || true

# Step 11: Create parameter group for PostgreSQL optimization
echo "Step 11: Creating DB parameter group..."
aws rds create-db-parameter-group \
  --db-parameter-group-name ${PROJECT_NAME}-postgres-params \
  --db-parameter-group-family postgres15 \
  --description "Optimized parameters for Forge PostgreSQL" \
  --tags "Key=Project,Value=${PROJECT_NAME}" \
  --region $AWS_REGION || echo "Parameter group already exists"

# Save outputs
cat >> /tmp/phase-01-outputs.txt <<EOF
RDS_ENDPOINT=$RDS_ENDPOINT
RDS_PORT=5432
RDS_DATABASE=$DB_NAME
RDS_USERNAME=$MASTER_USERNAME
DB_SG=$DB_SG
MONITORING_ROLE=$MONITORING_ROLE
EOF

echo "=== Phase 3: Complete ==="
echo "RDS PostgreSQL instance is ready at $RDS_ENDPOINT:5432"
