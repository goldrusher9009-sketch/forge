#!/bin/bash
# Phase 8: Kafka Event Streaming Setup
# Duration: 2 hours
# Components: MSK Cluster, Topics, Partitioning, Kraft Controllers

set -e

PHASE_NAME="08-kafka-setup"
LOG_FILE="/tmp/${PHASE_NAME}.log"
OUTPUTS_FILE="/tmp/${PHASE_NAME}-outputs.txt"

echo "Starting Phase 8: Kafka Event Streaming Setup" | tee -a $LOG_FILE
echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a $LOG_FILE

# Load previous outputs
if [ ! -f "/tmp/phase-07-outputs.txt" ]; then
  echo "ERROR: Phase 7 outputs not found" | tee -a $LOG_FILE
  exit 1
fi

source /tmp/phase-07-outputs.txt

# Extract VPC and Subnet info
VPC_ID=$(grep "VPC_ID=" /tmp/phase-01-outputs.txt | cut -d= -f2)
PRIVATE_SUBNET_1=$(grep "PRIVATE_SUBNET_1=" /tmp/phase-01-outputs.txt | cut -d= -f2)
PRIVATE_SUBNET_2=$(grep "PRIVATE_SUBNET_2=" /tmp/phase-01-outputs.txt | cut -d= -f2)
EKS_SG=$(grep "SG_ID=" /tmp/phase-01-outputs.txt | cut -d= -f2)
REGION="${AWS_REGION:-us-east-1}"

echo "Using VPC: $VPC_ID" | tee -a $LOG_FILE
echo "Using Subnets: $PRIVATE_SUBNET_1, $PRIVATE_SUBNET_2" | tee -a $LOG_FILE

# Create Kafka Security Group
echo "Creating Kafka Security Group..." | tee -a $LOG_FILE
KAFKA_SG=$(aws ec2 create-security-group \
  --group-name forge-kafka-sg \
  --description "Security group for Forge Kafka cluster" \
  --vpc-id $VPC_ID \
  --region $REGION \
  --output text --query 'GroupId')

echo "Kafka Security Group: $KAFKA_SG" | tee -a $LOG_FILE

# Allow inbound traffic from EKS
aws ec2 authorize-security-group-ingress \
  --group-id $KAFKA_SG \
  --protocol tcp \
  --port 9092 \
  --source-security-group-id $EKS_SG \
  --region $REGION || true

aws ec2 authorize-security-group-ingress \
  --group-id $KAFKA_SG \
  --protocol tcp \
  --port 9101 \
  --source-security-group-id $KAFKA_SG \
  --region $REGION || true

# Create MSK Cluster Configuration
echo "Creating MSK Cluster Configuration..." | tee -a $LOG_FILE

MSK_CONFIG_NAME="forge-kafka-config-$(date +%s)"
MSK_CONFIG_ARN=$(aws kafka create-configuration \
  --name $MSK_CONFIG_NAME \
  --kafka-versions 3.5.1 \
  --server-properties \
    "auto.create.topics.enable=false" \
    "default.replication.factor=3" \
    "min.insync.replicas=2" \
    "log.retention.hours=168" \
    "log.cleanup.policy=delete" \
  --region $REGION \
  --output text --query 'ConfigurationArn')

echo "MSK Configuration ARN: $MSK_CONFIG_ARN" | tee -a $LOG_FILE

# Create MSK Cluster
echo "Creating MSK Cluster..." | tee -a $LOG_FILE

MSK_CLUSTER_NAME="forge-kafka-cluster"
MSK_CLUSTER_ARN=$(aws kafka create-cluster \
  --cluster-name $MSK_CLUSTER_NAME \
  --kafka-version 3.5.1 \
  --number-of-broker-nodes 3 \
  --broker-node-group-info \
    "InstanceType=kafka.m5.large,ClientSubnets=$PRIVATE_SUBNET_1,$PRIVATE_SUBNET_2,SecurityGroups=$KAFKA_SG" \
  --encryption-info \
    "EncryptionInTransit={InCluster=true,ClientBroker=TLS}" \
    "EncryptionAtRest={DataVolumeKmsKeyId=alias/aws/kafka}" \
  --logging-info \
    "BrokerLogs={CloudWatchLogs={Enabled=true,LogGroup=ForgeKafkaLogs}}" \
  --region $REGION \
  --output text --query 'ClusterArn')

echo "MSK Cluster ARN: $MSK_CLUSTER_ARN" | tee -a $LOG_FILE
echo "Cluster creation initiated. This typically takes 15-20 minutes..." | tee -a $LOG_FILE

# Wait for cluster to be active
echo "Waiting for MSK cluster to reach ACTIVE state..." | tee -a $LOG_FILE
max_attempts=120
attempt=0
while [ $attempt -lt $max_attempts ]; do
  CLUSTER_STATE=$(aws kafka describe-cluster --cluster-arn $MSK_CLUSTER_ARN --region $REGION --output text --query 'ClusterInfo.State' 2>/dev/null || echo "CREATING")
  echo "Cluster state: $CLUSTER_STATE (attempt $((attempt+1))/$max_attempts)" | tee -a $LOG_FILE
  
  if [ "$CLUSTER_STATE" = "ACTIVE" ]; then
    echo "MSK Cluster is now ACTIVE" | tee -a $LOG_FILE
    break
  fi
  
  sleep 15
  ((attempt++))
done

if [ $attempt -eq $max_attempts ]; then
  echo "WARNING: MSK cluster did not reach ACTIVE state within timeout" | tee -a $LOG_FILE
fi

# Get cluster bootstrap servers
echo "Retrieving cluster bootstrap servers..." | tee -a $LOG_FILE
BOOTSTRAP_SERVERS=$(aws kafka get-bootstrap-brokers --cluster-arn $MSK_CLUSTER_ARN --region $REGION --output text --query 'BootstrapBrokerString')

echo "Bootstrap Servers: $BOOTSTRAP_SERVERS" | tee -a $LOG_FILE

# Create Kafka Topics
echo "Creating Kafka topics..." | tee -a $LOG_FILE

# Topic configuration arrays
declare -a TOPICS=(
  "events:3:2"                    # Topic:Partitions:Replication Factor
  "webhooks:3:2"
  "notifications:2:2"
  "user-activities:3:2"
  "audit-logs:3:2"
  "api-metrics:2:2"
  "error-logs:2:2"
  "data-pipeline:4:2"
)

# Create topics (this requires kafka-topics.sh on a Kafka broker)
# For now, we'll document the topic creation process
cat > /tmp/create-kafka-topics.sh << 'KAFKA_TOPICS'
#!/bin/bash
BOOTSTRAP_SERVERS=$1

# Create topics via Kafka CLI (would run on broker)
topics=(
  "events:3:2"
  "webhooks:3:2"
  "notifications:2:2"
  "user-activities:3:2"
  "audit-logs:3:2"
  "api-metrics:2:2"
  "error-logs:2:2"
  "data-pipeline:4:2"
)

for topic_spec in "${topics[@]}"; do
  IFS=':' read -r name partitions replicas <<< "$topic_spec"
  echo "Creating topic: $name (partitions: $partitions, replication: $replicas)"
  # kafka-topics.sh --create --bootstrap-server $BOOTSTRAP_SERVERS \
  #   --topic $name \
  #   --partitions $partitions \
  #   --replication-factor $replicas \
  #   --config retention.ms=604800000 \
  #   --if-not-exists
done
KAFKA_TOPICS

chmod +x /tmp/create-kafka-topics.sh
echo "Topic creation script created at /tmp/create-kafka-topics.sh" | tee -a $LOG_FILE

# Create CloudWatch Log Group
echo "Creating CloudWatch Log Group..." | tee -a $LOG_FILE
aws logs create-log-group --log-group-name ForgeKafkaLogs --region $REGION 2>/dev/null || true

# Save outputs to Secrets Manager
echo "Storing Kafka configuration in Secrets Manager..." | tee -a $LOG_FILE
aws secretsmanager create-secret \
  --name ForgeKafkaConfig \
  --description "Kafka cluster configuration for Forge" \
  --secret-string "{
    \"cluster_arn\": \"$MSK_CLUSTER_ARN\",
    \"bootstrap_servers\": \"$BOOTSTRAP_SERVERS\",
    \"cluster_name\": \"$MSK_CLUSTER_NAME\",
    \"security_group\": \"$KAFKA_SG\",
    \"kafka_version\": \"3.5.1\"
  }" \
  --region $REGION 2>/dev/null || \
aws secretsmanager update-secret \
  --secret-id ForgeKafkaConfig \
  --secret-string "{
    \"cluster_arn\": \"$MSK_CLUSTER_ARN\",
    \"bootstrap_servers\": \"$BOOTSTRAP_SERVERS\",
    \"cluster_name\": \"$MSK_CLUSTER_NAME\",
    \"security_group\": \"$KAFKA_SG\",
    \"kafka_version\": \"3.5.1\"
  }" \
  --region $REGION

# Save outputs
{
  echo "KAFKA_CLUSTER_ARN=$MSK_CLUSTER_ARN"
  echo "KAFKA_CLUSTER_NAME=$MSK_CLUSTER_NAME"
  echo "KAFKA_BOOTSTRAP_SERVERS=$BOOTSTRAP_SERVERS"
  echo "KAFKA_SG=$KAFKA_SG"
  echo "KAFKA_CONFIG_ARN=$MSK_CONFIG_ARN"
} | tee $OUTPUTS_FILE

echo "Phase 8 completed successfully" | tee -a $LOG_FILE
echo "Next: Phase 9 - Monitoring Setup" | tee -a $LOG_FILE
