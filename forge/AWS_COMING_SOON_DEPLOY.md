# Coming Soon Page - AWS S3 + CloudFront Deployment

## Overview
Deploy `coming-soon.html` to AWS S3 with CloudFront CDN for global distribution. This is your landing page while you register the domain.

## Prerequisites
- AWS Account with credentials configured
- AWS CLI installed
- Access to AWS Console
- Domain registration in progress

## Step 1: Create S3 Bucket

```bash
# Create S3 bucket (choose unique name with your domain)
aws s3 mb s3://forge-coming-soon-2026 --region us-east-1

# Enable static website hosting
aws s3 website s3://forge-coming-soon-2026 \
    --index-document coming-soon.html \
    --error-document coming-soon.html

# Upload the HTML file
aws s3 cp coming-soon.html s3://forge-coming-soon-2026/index.html

# Make it publicly readable
aws s3api put-bucket-acl --bucket forge-coming-soon-2026 --acl public-read
```

## Step 2: Upload to S3 (Manual via Console)

If you prefer the AWS Console:

1. Go to **S3** → **Create Bucket**
   - Name: `forge-coming-soon-2026`
   - Region: `us-east-1`
   - Block Public Access: **Uncheck all** (for public website)

2. Upload `coming-soon.html` → Rename to `index.html`

3. Set Properties → Make public
   - Select file → Permissions → Make Public

4. Enable Static Website Hosting
   - Bucket → Properties → Static website hosting
   - Index document: `index.html`
   - Error document: `index.html`

5. Copy S3 website URL (temporary, ~30 characters)

## Step 3: Create CloudFront Distribution

This gives you a fast, global CDN and a clean URL.

**Via Console:**

1. CloudFront → Create distribution
2. Origin domain: Select your S3 bucket (`forge-coming-soon-2026.s3.amazonaws.com`)
3. Origin path: `/` (leave blank)
4. Viewer protocol policy: **Redirect HTTP to HTTPS**
5. Allowed HTTP methods: **GET, HEAD**
6. Cache TTL: 300 seconds (5 min) for updates, 86400 (1 day) for production
7. Create distribution

**Get CloudFront URL:**
- Copy the Domain Name (looks like: `d123abc456.cloudfront.net`)
- This is your temporary URL

## Step 4: Point Domain (After Registration)

Once you register your domain:

1. Go to your domain registrar (GoDaddy, Namecheap, Route53, etc.)
2. Create DNS record:
   ```
   Type: CNAME (or ALIAS for root domain)
   Name: @ or www
   Value: d123abc456.cloudfront.net
   TTL: 3600
   ```

3. If using Route53 in AWS:
   ```
   Name: yourforgedomain.com
   Type: A (Alias)
   Alias Target: Your CloudFront distribution
   ```

4. CloudFront will automatically issue an SSL certificate via ACM

## Step 5: (Optional) Custom Domain with SSL

If you want HTTPS with custom domain immediately:

1. **ACM Certificate:**
   - Request certificate in AWS Certificate Manager
   - Domain: `yourforgedomain.com` and `*.yourforgedomain.com`
   - Verify via DNS

2. **CloudFront Settings:**
   - Edit distribution
   - Alternate domain names: `yourforgedomain.com`, `www.yourforgedomain.com`
   - Custom SSL certificate: Select your ACM cert

3. **DNS:** Point domain to CloudFront (see Step 4)

## Step 6: Testing & Monitoring

```bash
# Test the coming soon page
curl -I https://d123abc456.cloudfront.net

# Monitor in CloudFront dashboard
# Metrics: Requests, Data Transfer, Cache Hit Ratio

# Check error logs if needed
# S3 → Bucket → Server Access Logging (optional)
```

## Cost Estimate (Monthly)

- **S3 Storage**: ~$1 (minimal)
- **CloudFront**: ~$0.085 per GB (usually <$20 for coming soon page)
- **Total**: ~$20-30/month

## Email Capture Integration

The coming soon page has a form that logs emails to browser console. For production:

### Option 1: AWS Lambda + DynamoDB
```python
# Lambda function receives email
import json
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('ForgeEmails')

def lambda_handler(event, context):
    email = json.loads(event['body'])['email']
    table.put_item(Item={'email': email, 'timestamp': int(time.time())})
    return {'statusCode': 200, 'body': json.dumps({'success': True})}
```

### Option 2: Mailchimp/ConvertKit
- Replace form submission with API call to Mailchimp
- Captures emails automatically
- No backend needed

### Option 3: SendGrid
- POST email to SendGrid contacts on form submit
- Integrates with Forge email system later

**Current implementation:** Logs to console (dev). Update JavaScript:
```javascript
// Replace console.log with actual API call
fetch('https://your-api.forge.app/api/waitlist', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: email})
});
```

## Deployment Timeline

1. **Day 1**: Create S3 bucket + CloudFront
2. **Day 1**: Test on CloudFront URL
3. **Day 2+**: Register domain + update DNS
4. **Day 2+**: CloudFront issues SSL cert automatically

## Estimated Time
- AWS Setup: 15 minutes
- Domain registration: 24-48 hours
- SSL: Automatic (CloudFront handles)
- Total: ~2 days

## Next Steps

1. ✅ Create S3 + CloudFront
2. ⏳ Register domain
3. ⏳ Point DNS to CloudFront
4. ⏳ Integrate email capture with backend
5. ⏳ Set up monitoring/alerts

## File Locations

- **HTML**: `coming-soon.html` (in this repo)
- **Deploy script**: This document
- **Temporary URL**: CloudFront domain (after creation)
- **Final URL**: yourforgedomain.com (after DNS setup)

---

**Note:** Keep the coming soon page minimal. Launch the MVP in ~1 month. The countdown timer is set to June 15, 2026—adjust as needed.
