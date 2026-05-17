#!/bin/bash
# Phase 6: S3 & CloudFront CDN Setup
# Duration: 1 hour
# Components: S3 buckets, CloudFront distribution, SSL/TLS certificates

set -e

echo "=== Phase 6: S3 & CloudFront CDN Setup ==="

source /tmp/phase-01-outputs.txt

# Variables
AWS_REGION="us-east-1"
PROJECT_NAME="forge"
APP_BUCKET="${PROJECT_NAME}-app-bucket"
ASSETS_BUCKET="${PROJECT_NAME}-assets-bucket"
LOGS_BUCKET="${PROJECT_NAME}-logs-bucket"
BACKUP_BUCKET="${PROJECT_NAME}-backups-bucket"

# Step 1: Create application bucket
echo "Step 1: Creating application S3 bucket..."
aws s3api create-bucket \
  --bucket $APP_BUCKET \
  --region $AWS_REGION \
  --create-bucket-configuration LocationConstraint=$AWS_REGION || echo "Bucket already exists"

# Step 2: Configure application bucket
echo "Step 2: Configuring application bucket..."
aws s3api put-bucket-versioning \
  --bucket $APP_BUCKET \
  --versioning-configuration Status=Enabled \
  --region $AWS_REGION

aws s3api put-bucket-encryption \
  --bucket $APP_BUCKET \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }' \
  --region $AWS_REGION

# Step 3: Create assets bucket for CDN
echo "Step 3: Creating assets S3 bucket..."
aws s3api create-bucket \
  --bucket $ASSETS_BUCKET \
  --region $AWS_REGION \
  --create-bucket-configuration LocationConstraint=$AWS_REGION || echo "Bucket already exists"

# Step 4: Configure assets bucket
echo "Step 4: Configuring assets bucket..."
aws s3api put-bucket-versioning \
  --bucket $ASSETS_BUCKET \
  --versioning-configuration Status=Enabled \
  --region $AWS_REGION

aws s3api put-bucket-encryption \
  --bucket $ASSETS_BUCKET \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }' \
  --region $AWS_REGION

# Step 5: Create logs bucket
echo "Step 5: Creating logs S3 bucket..."
aws s3api create-bucket \
  --bucket $LOGS_BUCKET \
  --region $AWS_REGION \
  --create-bucket-configuration LocationConstraint=$AWS_REGION || echo "Bucket already exists"

# Step 6: Configure logs bucket
echo "Step 6: Configuring logs bucket..."
aws s3api put-bucket-acl \
  --bucket $LOGS_BUCKET \
  --acl log-delivery-write \
  --region $AWS_REGION || true

aws s3api put-bucket-lifecycle-configuration \
  --bucket $LOGS_BUCKET \
  --lifecycle-configuration '{
    "Rules": [{
      "ID": "DeleteOldLogs",
      "Status": "Enabled",
      "Expiration": {
        "Days": 90
      },
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 30
      }
    }]
  }' \
  --region $AWS_REGION || true

# Step 7: Create backup bucket
echo "Step 7: Creating backup S3 bucket..."
aws s3api create-bucket \
  --bucket $BACKUP_BUCKET \
  --region $AWS_REGION \
  --create-bucket-configuration LocationConstraint=$AWS_REGION || echo "Bucket already exists"

# Step 8: Configure backup bucket
echo "Step 8: Configuring backup bucket..."
aws s3api put-bucket-versioning \
  --bucket $BACKUP_BUCKET \
  --versioning-configuration Status=Enabled \
  --region $AWS_REGION

aws s3api put-bucket-encryption \
  --bucket $BACKUP_BUCKET \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "aws:kms"
      }
    }]
  }' \
  --region $AWS_REGION || true

# Step 9: Block public access on all buckets
echo "Step 9: Blocking public access on all buckets..."
for BUCKET in $APP_BUCKET $ASSETS_BUCKET $LOGS_BUCKET $BACKUP_BUCKET; do
  aws s3api put-public-access-block \
    --bucket $BUCKET \
    --public-access-block-configuration \
      "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" \
    --region $AWS_REGION || true
done

# Step 10: Create CloudFront distribution for assets
echo "Step 10: Creating CloudFront distribution..."

cat > /tmp/cloudfront-config.json <<EOF
{
  "CallerReference": "$(date +%s)",
  "Comment": "Forge CDN Distribution",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3Origin",
        "DomainName": "${ASSETS_BUCKET}.s3.${AWS_REGION}.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3Origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 3600,
    "MaxTTL": 86400
  }
}
EOF

DISTRIBUTION_ID=$(aws cloudfront create-distribution \
  --distribution-config file:///tmp/cloudfront-config.json \
  --region $AWS_REGION \
  --query 'Distribution.Id' \
  --output text 2>/dev/null || aws cloudfront list-distributions --region $AWS_REGION --query "DistributionList.Items[?Comment=='Forge CDN Distribution'].Id" --output text | head -1)

echo "CloudFront distribution created: $DISTRIBUTION_ID"

# Step 11: Get CloudFront domain name
echo "Step 11: Retrieving CloudFront domain name..."
CDN_DOMAIN=$(aws cloudfront get-distribution \
  --id $DISTRIBUTION_ID \
  --region $AWS_REGION \
  --query 'Distribution.DomainName' \
  --output text 2>/dev/null || echo "pending")

echo "CloudFront domain: $CDN_DOMAIN"

# Step 12: Configure bucket logging
echo "Step 12: Enabling S3 access logging..."
aws s3api put-bucket-logging \
  --bucket $APP_BUCKET \
  --bucket-logging-status '{
    "LoggingEnabled": {
      "TargetBucket": "'${LOGS_BUCKET}'",
      "TargetPrefix": "app-logs/"
    }
  }' \
  --region $AWS_REGION || true

# Step 13: Enable CORS for assets bucket
echo "Step 13: Enabling CORS on assets bucket..."
aws s3api put-bucket-cors \
  --bucket $ASSETS_BUCKET \
  --cors-configuration '{
    "CORSRules": [{
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }]
  }' \
  --region $AWS_REGION || true

# Save outputs
cat >> /tmp/phase-01-outputs.txt <<EOF
APP_BUCKET=$APP_BUCKET
ASSETS_BUCKET=$ASSETS_BUCKET
LOGS_BUCKET=$LOGS_BUCKET
BACKUP_BUCKET=$BACKUP_BUCKET
CDN_DOMAIN=$CDN_DOMAIN
DISTRIBUTION_ID=$DISTRIBUTION_ID
EOF

echo "=== Phase 6: Complete ==="
echo "S3 buckets created successfully"
echo "CloudFront CDN distribution ID: $DISTRIBUTION_ID"
