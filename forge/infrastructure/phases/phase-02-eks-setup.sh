#!/bin/bash
# Phase 2: EKS Cluster Setup
# Duration: 3 hours
# Components: EKS cluster creation, worker nodes, autoscaling

set -e

echo "=== Phase 2: EKS Cluster Setup ==="

# Load phase 1 outputs
source /tmp/phase-01-outputs.txt

# Variables
AWS_REGION="us-east-1"
PROJECT_NAME="forge"
CLUSTER_NAME="${PROJECT_NAME}-eks-cluster"
KUBERNETES_VERSION="1.28"
NODE_DESIRED_SIZE=3
NODE_MIN_SIZE=2
NODE_MAX_SIZE=10
NODE_INSTANCE_TYPE="t3.medium"

# Step 1: Create EKS cluster
echo "Step 1: Creating EKS cluster..."
aws eks create-cluster \
  --name $CLUSTER_NAME \
  --version $KUBERNETES_VERSION \
  --role-arn arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/${EKS_ROLE} \
  --resources-vpc-config subnetIds=$PUBLIC_SUBNET_1,$PUBLIC_SUBNET_2,$PRIVATE_SUBNET_1,$PRIVATE_SUBNET_2,securityGroupIds=$SG_ID \
  --logging '{"clusterLogging":[{"enabled":true,"types":["api","audit","authenticator","controllerManager","scheduler"]}]}' \
  --region $AWS_REGION || echo "Cluster already exists"

# Wait for cluster to be active
echo "Step 2: Waiting for cluster to reach ACTIVE state (this takes ~15 minutes)..."
aws eks wait cluster-active \
  --name $CLUSTER_NAME \
  --region $AWS_REGION || echo "Cluster is already active"

echo "EKS cluster is ready: $CLUSTER_NAME"

# Step 3: Create IAM role for node group
echo "Step 3: Creating IAM role for worker nodes..."
cat > /tmp/node-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

NODE_ROLE=$(aws iam create-role \
  --role-name ${PROJECT_NAME}-eks-node-role \
  --assume-role-policy-document file:///tmp/node-trust-policy.json \
  --region $AWS_REGION \
  --query 'Role.RoleName' \
  --output text 2>/dev/null || echo "${PROJECT_NAME}-eks-node-role")

# Attach required policies
if [ "$NODE_ROLE" == "${PROJECT_NAME}-eks-node-role" ]; then
  aws iam attach-role-policy \
    --role-name $NODE_ROLE \
    --policy-arn arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy \
    --region $AWS_REGION || true
  
  aws iam attach-role-policy \
    --role-name $NODE_ROLE \
    --policy-arn arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy \
    --region $AWS_REGION || true
  
  aws iam attach-role-policy \
    --role-name $NODE_ROLE \
    --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly \
    --region $AWS_REGION || true
fi

echo "Node role created: $NODE_ROLE"

# Step 4: Create security group for node group
echo "Step 4: Creating security group for worker nodes..."
NODE_SG=$(aws ec2 create-security-group \
  --group-name ${PROJECT_NAME}-eks-node-sg \
  --description "Security group for Forge EKS worker nodes" \
  --vpc-id $VPC_ID \
  --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=${PROJECT_NAME}-eks-node-sg}]" \
  --region $AWS_REGION \
  --query 'GroupId' \
  --output text 2>/dev/null || aws ec2 describe-security-groups --filters "Name=group-name,Values=${PROJECT_NAME}-eks-node-sg" "Name=vpc-id,Values=$VPC_ID" --region $AWS_REGION --query 'SecurityGroups[0].GroupId' --output text)

echo "Node security group: $NODE_SG"

# Step 5: Allow worker nodes to communicate
echo "Step 5: Configuring security group rules..."
aws ec2 authorize-security-group-ingress \
  --group-id $NODE_SG \
  --protocol tcp \
  --port 1025-65535 \
  --source-group $NODE_SG \
  --region $AWS_REGION || true

aws ec2 authorize-security-group-ingress \
  --group-id $NODE_SG \
  --protocol tcp \
  --port 443 \
  --source-group $SG_ID \
  --region $AWS_REGION || true

# Step 6: Create node group
echo "Step 6: Creating EKS node group (this takes ~10 minutes)..."
aws eks create-nodegroup \
  --cluster-name $CLUSTER_NAME \
  --nodegroup-name ${PROJECT_NAME}-nodegroup \
  --subnets $PRIVATE_SUBNET_1 $PRIVATE_SUBNET_2 \
  --node-role arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/$NODE_ROLE \
  --instance-types $NODE_INSTANCE_TYPE \
  --scaling-config minSize=$NODE_MIN_SIZE,maxSize=$NODE_MAX_SIZE,desiredSize=$NODE_DESIRED_SIZE \
  --disk-size 50 \
  --tags "Environment=production,Project=${PROJECT_NAME}" \
  --region $AWS_REGION || echo "Node group already exists"

# Wait for node group to be active
echo "Step 7: Waiting for node group to reach ACTIVE state..."
aws eks wait nodegroup-active \
  --cluster-name $CLUSTER_NAME \
  --nodegroup-name ${PROJECT_NAME}-nodegroup \
  --region $AWS_REGION || echo "Node group is already active"

echo "Node group is ready"

# Step 8: Configure kubectl
echo "Step 8: Configuring kubectl..."
aws eks update-kubeconfig \
  --name $CLUSTER_NAME \
  --region $AWS_REGION

# Verify cluster connection
echo "Step 9: Verifying cluster connection..."
kubectl cluster-info
kubectl get nodes

# Save outputs
cat >> /tmp/phase-01-outputs.txt <<EOF
CLUSTER_NAME=$CLUSTER_NAME
NODE_ROLE=$NODE_ROLE
NODE_SG=$NODE_SG
EOF

echo "=== Phase 2: Complete ==="
echo "EKS cluster '$CLUSTER_NAME' is ready for deployment"
