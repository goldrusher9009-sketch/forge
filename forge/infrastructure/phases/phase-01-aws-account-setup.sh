#!/bin/bash
set -e

# Phase 1: AWS Account Setup and IAM Configuration
# Duration: 1 hour
# Configures AWS account, IAM roles, policies, and service accounts

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
STATE_FILE="/tmp/forge_deployment_state_phase1_${TIMESTAMP}.txt"

echo "=== Phase 1: AWS Account Setup and IAM Configuration ===" | tee -a $STATE_FILE

# AWS Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
SECONDARY_REGION="us-west-2"

echo "Primary AWS Region: $AWS_REGION" | tee -a $STATE_FILE
echo "Secondary AWS Region: $SECONDARY_REGION" | tee -a $STATE_FILE
echo "AWS Account ID: $AWS_ACCOUNT_ID" | tee -a $STATE_FILE

# Create IAM roles for EKS
echo "Creating EKS cluster IAM role..." | tee -a $STATE_FILE

EKS_CLUSTER_ROLE_NAME="forge-eks-cluster-role"
EKS_NODE_ROLE_NAME="forge-eks-node-role"

# Trust policy for EKS cluster role
cat > /tmp/eks-cluster-trust.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "eks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create EKS cluster role
aws iam create-role \
  --role-name $EKS_CLUSTER_ROLE_NAME \
  --assume-role-policy-document file:///tmp/eks-cluster-trust.json 2>/dev/null || echo "Role may already exist"

# Attach policies to EKS cluster role
aws iam attach-role-policy \
  --role-name $EKS_CLUSTER_ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/AmazonEKSClusterPolicy 2>/dev/null || true

# Trust policy for EKS node role
cat > /tmp/eks-node-trust.json << 'EOF'
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

# Create EKS node role
aws iam create-role \
  --role-name $EKS_NODE_ROLE_NAME \
  --assume-role-policy-document file:///tmp/eks-node-trust.json 2>/dev/null || echo "Node role may already exist"

# Attach policies to EKS node role
aws iam attach-role-policy \
  --role-name $EKS_NODE_ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy 2>/dev/null || true

aws iam attach-role-policy \
  --role-name $EKS_NODE_ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy 2>/dev/null || true

aws iam attach-role-policy \
  --role-name $EKS_NODE_ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly 2>/dev/null || true

echo "IAM roles created/verified" | tee -a $STATE_FILE

# Create service accounts for applications
echo "Creating Kubernetes service accounts..." | tee -a $STATE_FILE

cat > /tmp/service-accounts.yaml << 'SERVICEACCOUNTS'
apiVersion: v1
kind: ServiceAccount
metadata:
  name: forge-app-sa
  namespace: forge-prod
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: prometheus-sa
  namespace: monitoring
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: jaeger-sa
  namespace: monitoring
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: cert-manager-sa
  namespace: cert-manager
SERVICEACCOUNTS

echo "Service accounts configuration created" | tee -a $STATE_FILE

# Export final outputs
echo "" | tee -a $STATE_FILE
echo "=== Phase 1 Outputs ===" | tee -a $STATE_FILE
echo "export AWS_REGION=$AWS_REGION" >> $STATE_FILE
echo "export AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID" >> $STATE_FILE
echo "export SECONDARY_REGION=$SECONDARY_REGION" >> $STATE_FILE
echo "export EKS_CLUSTER_ROLE_NAME=$EKS_CLUSTER_ROLE_NAME" >> $STATE_FILE
echo "export EKS_NODE_ROLE_NAME=$EKS_NODE_ROLE_NAME" >> $STATE_FILE
echo "export EKS_CLUSTER_ROLE_ARN=arn:aws:iam::${AWS_ACCOUNT_ID}:role/${EKS_CLUSTER_ROLE_NAME}" >> $STATE_FILE
echo "export EKS_NODE_ROLE_ARN=arn:aws:iam::${AWS_ACCOUNT_ID}:role/${EKS_NODE_ROLE_NAME}" >> $STATE_FILE
echo "Phase 1 completed successfully!" | tee -a $STATE_FILE
