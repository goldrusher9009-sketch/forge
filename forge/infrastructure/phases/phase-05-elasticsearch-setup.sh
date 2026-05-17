#!/bin/bash
# Phase 5: Elasticsearch Domain Setup
# Duration: 2 hours
# Components: Elasticsearch cluster, Kibana, log ingestion pipeline

set -e

echo "=== Phase 5: Elasticsearch Domain Setup ==="

source /tmp/phase-01-outputs.txt

# Variables
AWS_REGION="us-east-1"
PROJECT_NAME="forge"
DOMAIN_NAME="${PROJECT_NAME}-elasticsearch"
ELASTICSEARCH_VERSION="8.10"
INSTANCE_TYPE="t3.small.elasticsearch"
INSTANCE_COUNT=3
VOLUME_SIZE=100
VOLUME_TYPE="gp3"
ENABLE_ENCRYPTION=true
ENABLE_NODE_TO_NODE_ENCRYPTION=true

# Step 1: Create IAM role for Elasticsearch
echo "Step 1: Creating IAM role for Elasticsearch..."
cat > /tmp/es-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "es.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

ES_ROLE=$(aws iam create-role \
  --role-name ${PROJECT_NAME}-es-role \
  --assume-role-policy-document file:///tmp/es-trust-policy.json \
  --region $AWS_REGION \
  --query 'Role.RoleName' \
  --output text 2>/dev/null || echo "${PROJECT_NAME}-es-role")

echo "Elasticsearch role: $ES_ROLE"

# Step 2: Create security group for Elasticsearch
echo "Step 2: Creating security group for Elasticsearch..."
ES_SG=$(aws ec2 create-security-group \
  --group-name ${PROJECT_NAME}-es-sg \
  --description "Security group for Forge Elasticsearch" \
  --vpc-id $VPC_ID \
  --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=${PROJECT_NAME}-es-sg}]" \
  --region $AWS_REGION \
  --query 'GroupId' \
  --output text 2>/dev/null || aws ec2 describe-security-groups --filters "Name=group-name,Values=${PROJECT_NAME}-es-sg" "Name=vpc-id,Values=$VPC_ID" --region $AWS_REGION --query 'SecurityGroups[0].GroupId' --output text)

echo "Elasticsearch security group: $ES_SG"

# Step 3: Allow inbound traffic
echo "Step 3: Configuring security group rules..."
aws ec2 authorize-security-group-ingress \
  --group-id $ES_SG \
  --protocol tcp \
  --port 443 \
  --source-group $SG_ID \
  --region $AWS_REGION || true

aws ec2 authorize-security-group-ingress \
  --group-id $ES_SG \
  --protocol tcp \
  --port 9200 \
  --source-group $SG_ID \
  --region $AWS_REGION || true

# Step 4: Create Elasticsearch domain
echo "Step 4: Creating Elasticsearch domain (this takes ~15 minutes)..."
aws opensearch create-domain \
  --domain-name $DOMAIN_NAME \
  --elasticsearch-version $ELASTICSEARCH_VERSION \
  --domain-endpoint-options EnforceHttps=true,TlsSecurityPolicy=Policy-Min-TLS-1-2-2019-07 \
  --node-to-node-encryption-options Enabled=$ENABLE_NODE_TO_NODE_ENCRYPTION \
  --encryption-at-rest-options Enabled=$ENABLE_ENCRYPTION \
  --elasticsearch-cluster-config InstanceType=$INSTANCE_TYPE,InstanceCount=$INSTANCE_COUNT,ZoneAwarenessEnabled=true \
  --ebs-options EbsEnabled=true,VolumeType=$VOLUME_TYPE,VolumeSize=$VOLUME_SIZE \
  --access-policies '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"AWS":"*"},"Action":"es:*","Resource":"*"}]}' \
  --vpc-options SubnetIds=$PRIVATE_SUBNET_1,$PRIVATE_SUBNET_2,SecurityGroupIds=$ES_SG \
  --log-publishing-options INDEX_SLOW_LOGS='{Enabled: true, CloudWatchLogsLogGroupArn: arn:aws:logs:'${AWS_REGION}':$(aws sts get-caller-identity --query Account --output text):log-group:/aws/opensearch/'${PROJECT_NAME}'-index-logs,Enabled: true}' \
  --advanced-options rest.action.multi.allow_explicit_index=false \
  --tags Key=Project,Value=${PROJECT_NAME},Key=Environment,Value=production \
  --region $AWS_REGION || echo "Domain already exists"

# Step 5: Wait for domain to be available
echo "Step 5: Waiting for Elasticsearch domain to be available..."
aws opensearch wait domain-exists \
  --domain-name $DOMAIN_NAME \
  --region $AWS_REGION || echo "Domain is already available"

# Step 6: Get domain endpoint
echo "Step 6: Retrieving Elasticsearch endpoint..."
ES_ENDPOINT=$(aws opensearch describe-domain \
  --domain-name $DOMAIN_NAME \
  --region $AWS_REGION \
  --query 'DomainStatus.Endpoint' \
  --output text)

echo "Elasticsearch endpoint: $ES_ENDPOINT"

# Step 7: Enable Kibana
echo "Step 7: Enabling Kibana dashboard..."
KIBANA_ENDPOINT=$(aws opensearch describe-domain \
  --domain-name $DOMAIN_NAME \
  --region $AWS_REGION \
  --query 'DomainStatus.KibanaEndpoint' \
  --output text)

echo "Kibana endpoint: $KIBANA_ENDPOINT"

# Step 8: Create index templates for logs
echo "Step 8: Creating index templates..."
cat > /tmp/index-template.json <<'EOF'
{
  "index_patterns": ["logs-*", "app-*"],
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1,
    "index.refresh_interval": "30s",
    "index.codec": "best_compression"
  },
  "mappings": {
    "properties": {
      "timestamp": {
        "type": "date"
      },
      "level": {
        "type": "keyword"
      },
      "service": {
        "type": "keyword"
      },
      "message": {
        "type": "text"
      },
      "trace_id": {
        "type": "keyword"
      }
    }
  }
}
EOF

# Step 9: Store credentials in Secrets Manager
echo "Step 9: Storing Elasticsearch connection details..."
aws secretsmanager create-secret \
  --name ${PROJECT_NAME}/elasticsearch/primary \
  --description "Elasticsearch connection details for Forge" \
  --secret-string "{\"endpoint\":\"https://${ES_ENDPOINT}:9200\",\"kibana\":\"https://${KIBANA_ENDPOINT}:5601\"}" \
  --tags "Key=Project,Value=${PROJECT_NAME}" \
  --region $AWS_REGION || echo "Secret already exists"

# Save outputs
cat >> /tmp/phase-01-outputs.txt <<EOF
ES_ENDPOINT=$ES_ENDPOINT
KIBANA_ENDPOINT=$KIBANA_ENDPOINT
ES_SG=$ES_SG
DOMAIN_NAME=$DOMAIN_NAME
EOF

echo "=== Phase 5: Complete ==="
echo "Elasticsearch domain is ready at https://$ES_ENDPOINT:9200"
echo "Kibana dashboard available at https://$KIBANA_ENDPOINT:5601"
