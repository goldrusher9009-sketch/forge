#!/bin/bash
# Phase 1: Foundation & Project Initialization
# Duration: 2 hours
# Components: AWS account setup, VPC, networking, IAM roles

set -e

echo "=== Phase 1: Foundation & Project Initialization ==="

# Variables
AWS_REGION="us-east-1"
PROJECT_NAME="forge"
ENVIRONMENT="production"
VPC_CIDR="10.0.0.0/16"
PUBLIC_SUBNET_1_CIDR="10.0.1.0/24"
PUBLIC_SUBNET_2_CIDR="10.0.2.0/24"
PRIVATE_SUBNET_1_CIDR="10.0.10.0/24"
PRIVATE_SUBNET_2_CIDR="10.0.11.0/24"

# Step 1: Create VPC
echo "Step 1: Creating VPC..."
VPC_ID=$(aws ec2 create-vpc \
  --cidr-block $VPC_CIDR \
  --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=${PROJECT_NAME}-vpc},{Key=Environment,Value=${ENVIRONMENT}}]" \
  --region $AWS_REGION \
  --query 'Vpc.VpcId' \
  --output text)
echo "VPC created: $VPC_ID"

# Step 2: Enable DNS support
echo "Step 2: Enabling DNS support..."
aws ec2 modify-vpc-attribute \
  --vpc-id $VPC_ID \
  --enable-dns-hostnames \
  --region $AWS_REGION

aws ec2 modify-vpc-attribute \
  --vpc-id $VPC_ID \
  --enable-dns-support \
  --region $AWS_REGION

# Step 3: Create Internet Gateway
echo "Step 3: Creating Internet Gateway..."
IGW_ID=$(aws ec2 create-internet-gateway \
  --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=${PROJECT_NAME}-igw}]" \
  --region $AWS_REGION \
  --query 'InternetGateway.InternetGatewayId' \
  --output text)
echo "Internet Gateway created: $IGW_ID"

# Step 4: Attach IGW to VPC
echo "Step 4: Attaching Internet Gateway to VPC..."
aws ec2 attach-internet-gateway \
  --internet-gateway-id $IGW_ID \
  --vpc-id $VPC_ID \
  --region $AWS_REGION

# Step 5: Create public subnets
echo "Step 5: Creating public subnets..."
PUBLIC_SUBNET_1=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block $PUBLIC_SUBNET_1_CIDR \
  --availability-zone "${AWS_REGION}a" \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-public-subnet-1a}]" \
  --region $AWS_REGION \
  --query 'Subnet.SubnetId' \
  --output text)

PUBLIC_SUBNET_2=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block $PUBLIC_SUBNET_2_CIDR \
  --availability-zone "${AWS_REGION}b" \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-public-subnet-1b}]" \
  --region $AWS_REGION \
  --query 'Subnet.SubnetId' \
  --output text)

echo "Public subnets created: $PUBLIC_SUBNET_1, $PUBLIC_SUBNET_2"

# Step 6: Create private subnets
echo "Step 6: Creating private subnets..."
PRIVATE_SUBNET_1=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block $PRIVATE_SUBNET_1_CIDR \
  --availability-zone "${AWS_REGION}a" \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-private-subnet-1a}]" \
  --region $AWS_REGION \
  --query 'Subnet.SubnetId' \
  --output text)

PRIVATE_SUBNET_2=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block $PRIVATE_SUBNET_2_CIDR \
  --availability-zone "${AWS_REGION}b" \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-private-subnet-1b}]" \
  --region $AWS_REGION \
  --query 'Subnet.SubnetId' \
  --output text)

echo "Private subnets created: $PRIVATE_SUBNET_1, $PRIVATE_SUBNET_2"

# Step 7: Create route table for public subnets
echo "Step 7: Creating route table for public subnets..."
PUBLIC_ROUTE_TABLE=$(aws ec2 create-route-table \
  --vpc-id $VPC_ID \
  --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=${PROJECT_NAME}-public-rt}]" \
  --region $AWS_REGION \
  --query 'RouteTable.RouteTableId' \
  --output text)

# Step 8: Add route for Internet Gateway
echo "Step 8: Adding Internet Gateway route..."
aws ec2 create-route \
  --route-table-id $PUBLIC_ROUTE_TABLE \
  --destination-cidr-block 0.0.0.0/0 \
  --gateway-id $IGW_ID \
  --region $AWS_REGION

# Step 9: Associate subnets with route table
echo "Step 9: Associating public subnets with route table..."
aws ec2 associate-route-table \
  --subnet-id $PUBLIC_SUBNET_1 \
  --route-table-id $PUBLIC_ROUTE_TABLE \
  --region $AWS_REGION

aws ec2 associate-route-table \
  --subnet-id $PUBLIC_SUBNET_2 \
  --route-table-id $PUBLIC_ROUTE_TABLE \
  --region $AWS_REGION

# Step 10: Create IAM roles for EKS
echo "Step 10: Creating IAM roles for EKS..."
cat > /tmp/eks-trust-policy.json <<EOF
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

EKS_ROLE=$(aws iam create-role \
  --role-name ${PROJECT_NAME}-eks-cluster-role \
  --assume-role-policy-document file:///tmp/eks-trust-policy.json \
  --region $AWS_REGION \
  --query 'Role.RoleId' \
  --output text 2>/dev/null || echo "role-exists")

if [ "$EKS_ROLE" != "role-exists" ]; then
  aws iam attach-role-policy \
    --role-name ${PROJECT_NAME}-eks-cluster-role \
    --policy-arn arn:aws:iam::aws:policy/AmazonEKSClusterPolicy \
    --region $AWS_REGION
fi

echo "EKS cluster role created/verified"

# Step 11: Create security group for EKS cluster
echo "Step 11: Creating security group for EKS cluster..."
SG_ID=$(aws ec2 create-security-group \
  --group-name ${PROJECT_NAME}-eks-cluster-sg \
  --description "Security group for Forge EKS cluster" \
  --vpc-id $VPC_ID \
  --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=${PROJECT_NAME}-eks-cluster-sg}]" \
  --region $AWS_REGION \
  --query 'GroupId' \
  --output text)

echo "Security group created: $SG_ID"

# Save outputs
cat > /tmp/phase-01-outputs.txt <<EOF
VPC_ID=$VPC_ID
IGW_ID=$IGW_ID
PUBLIC_SUBNET_1=$PUBLIC_SUBNET_1
PUBLIC_SUBNET_2=$PUBLIC_SUBNET_2
PRIVATE_SUBNET_1=$PRIVATE_SUBNET_1
PRIVATE_SUBNET_2=$PRIVATE_SUBNET_2
PUBLIC_ROUTE_TABLE=$PUBLIC_ROUTE_TABLE
SG_ID=$SG_ID
EKS_ROLE=${PROJECT_NAME}-eks-cluster-role
EOF

echo "=== Phase 1: Complete ==="
echo "Outputs saved to /tmp/phase-01-outputs.txt"
cat /tmp/phase-01-outputs.txt
