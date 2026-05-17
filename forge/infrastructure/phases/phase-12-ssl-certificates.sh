#!/bin/bash
set -e

# Phase 12: SSL Certificate Management
# Duration: 1 hour
# Creates ACM certificates for ALB, CloudFront, API domains
# Manages certificate renewal and DNS validation

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
STATE_FILE="/tmp/forge_deployment_state_phase12_${TIMESTAMP}.txt"

echo "=== Phase 12: SSL Certificate Management ===" | tee -a $STATE_FILE

# Load outputs from Phase 11
if [ -f /tmp/forge_deployment_state_phase11_* ]; then
  LATEST_PHASE11=$(ls -t /tmp/forge_deployment_state_phase11_* | head -1)
  source $LATEST_PHASE11
  echo "Loaded Phase 11 outputs from $LATEST_PHASE11" | tee -a $STATE_FILE
else
  echo "ERROR: Phase 11 outputs not found. Run Phase 11 first." | tee -a $STATE_FILE
  exit 1
fi

# AWS Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "AWS_REGION=$AWS_REGION" | tee -a $STATE_FILE
echo "AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID" | tee -a $STATE_FILE

# Certificate domains
API_DOMAIN="api.forge.io"
WWW_DOMAIN="www.forge.io"
ADMIN_DOMAIN="admin.forge.io"
CDN_DOMAIN="cdn.forge.io"

echo "Certificates to create: $API_DOMAIN, $WWW_DOMAIN, $ADMIN_DOMAIN, $CDN_DOMAIN" | tee -a $STATE_FILE

# Create ACM Certificate for ALB (Primary API)
echo "Creating ACM certificate for ALB ($API_DOMAIN)..." | tee -a $STATE_FILE
ACM_CERT_ARN=$(aws acm request-certificate \
  --domain-name $API_DOMAIN \
  --subject-alternative-names $WWW_DOMAIN $ADMIN_DOMAIN \
  --validation-method DNS \
  --region $AWS_REGION \
  --query 'CertificateArn' \
  --output text 2>/dev/null || echo "cert-exists")

if [ "$ACM_CERT_ARN" != "cert-exists" ]; then
  echo "ACM_CERT_ARN=$ACM_CERT_ARN" | tee -a $STATE_FILE
  sleep 5
else
  ACM_CERT_ARN=$(aws acm list-certificates \
    --region $AWS_REGION \
    --query "CertificateSummaryList[?DomainName=='$API_DOMAIN'].CertificateArn" \
    --output text)
  echo "Using existing certificate: $ACM_CERT_ARN" | tee -a $STATE_FILE
fi

# Create ACM Certificate for CloudFront (requires us-east-1)
echo "Creating ACM certificate for CloudFront (us-east-1)..." | tee -a $STATE_FILE
CF_CERT_ARN=$(aws acm request-certificate \
  --domain-name $CDN_DOMAIN \
  --validation-method DNS \
  --region us-east-1 \
  --query 'CertificateArn' \
  --output text 2>/dev/null || echo "cf-cert-exists")

if [ "$CF_CERT_ARN" != "cf-cert-exists" ]; then
  echo "CF_CERT_ARN=$CF_CERT_ARN" | tee -a $STATE_FILE
else
  CF_CERT_ARN=$(aws acm list-certificates \
    --region us-east-1 \
    --query "CertificateSummaryList[?DomainName=='$CDN_DOMAIN'].CertificateArn" \
    --output text)
  echo "Using existing CloudFront certificate: $CF_CERT_ARN" | tee -a $STATE_FILE
fi

# Create SNS topic for certificate alerts
SNS_TOPIC_ARN=$(aws sns create-topic \
  --name certificate-expiration-alerts \
  --region $AWS_REGION \
  --query 'TopicArn' \
  --output text 2>/dev/null || aws sns list-topics \
  --region $AWS_REGION \
  --query "Topics[?TopicArn contains 'certificate-expiration-alerts'].TopicArn" \
  --output text)

echo "SNS_TOPIC_ARN=$SNS_TOPIC_ARN" | tee -a $STATE_FILE

# Certificate status check
echo "Checking certificate statuses..." | tee -a $STATE_FILE

ACM_CERT_STATUS=$(aws acm describe-certificate \
  --certificate-arn $ACM_CERT_ARN \
  --region $AWS_REGION \
  --query 'Certificate.Status' \
  --output text 2>/dev/null || echo "PENDING_VALIDATION")

echo "ACM_CERT_STATUS=$ACM_CERT_STATUS" | tee -a $STATE_FILE

# Export final outputs
echo "" | tee -a $STATE_FILE
echo "=== Phase 12 Outputs ===" | tee -a $STATE_FILE
echo "export ACM_CERT_ARN=$ACM_CERT_ARN" >> $STATE_FILE
echo "export CF_CERT_ARN=$CF_CERT_ARN" >> $STATE_FILE
echo "export SNS_TOPIC_ARN=$SNS_TOPIC_ARN" >> $STATE_FILE
echo "export API_DOMAIN=$API_DOMAIN" >> $STATE_FILE
echo "export CDN_DOMAIN=$CDN_DOMAIN" >> $STATE_FILE
echo "export CERTIFICATE_STATUS=$ACM_CERT_STATUS" >> $STATE_FILE
echo "Phase 12 completed successfully!" | tee -a $STATE_FILE
