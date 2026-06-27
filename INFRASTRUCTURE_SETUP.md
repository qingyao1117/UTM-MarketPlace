# UTM Student Marketplace - Infrastructure Setup Guide

Complete infrastructure setup for the UTM Student Marketplace platform across all 6 Phase 1 tasks.

## Overview

This document covers the infrastructure setup for the UTM Student Marketplace, implementing:

1. **Task 1.1**: Next.js project with TypeScript, Tailwind CSS, and ESLint
2. **Task 1.2**: AWS Lambda environment and dependencies
3. **Task 1.3**: DynamoDB tables (9 tables with GSIs)
4. **Task 1.4**: S3 bucket with versioning and encryption
5. **Task 1.5**: AWS Cognito user pool and authentication
6. **Task 1.6**: API Gateway REST and WebSocket endpoints

## Project Structure

```
UTM_Micro_Business_UTM/
├── backend/                    # Lambda backend code
│   ├── src/
│   │   ├── config/            # AWS clients and environment
│   │   ├── lambdas/
│   │   │   └── base/          # Base handler classes
│   │   ├── utils/             # Logger and utilities
│   │   └── types/             # TypeScript types
│   ├── package.json
│   └── tsconfig.json
├── infrastructure/             # CDK Infrastructure-as-Code
│   ├── lib/
│   │   ├── app.ts             # Main CDK application
│   │   ├── dynamodb-stack.ts  # DynamoDB tables
│   │   ├── s3-stack.ts        # S3 bucket
│   │   ├── cognito-stack.ts   # Cognito user pool
│   │   └── api-gateway-stack.ts # API Gateway
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # Next.js frontend
│   ├── app/                   # App router pages
│   ├── components/            # React components
│   ├── lib/                   # Utilities and helpers
│   ├── package.json
│   ├── tailwind.config.ts     # Custom UTM theme
│   ├── tsconfig.json
│   ├── .env.development
│   ├── .env.production
│   └── README.md
└── INFRASTRUCTURE_SETUP.md    # This file

```

## Prerequisites

- AWS Account with appropriate permissions
- Node.js 18.x or 20.x
- AWS CLI configured
- AWS CDK CLI installed: `npm install -g aws-cdk`

## Task Completion Status

### ✅ Task 1.1: Next.js Project Setup

**Status**: COMPLETED

**What was created**:
- Next.js 16.2.9 project with TypeScript
- Tailwind CSS v4 with custom UTM theme colors
- ESLint configuration for code quality
- Strict TypeScript configuration (`strict: true`)
- Path aliases for cleaner imports (`@/*`)

**Key files**:
- `frontend/package.json` - Dependencies and scripts
- `frontend/tsconfig.json` - TypeScript strict mode enabled
- `frontend/tailwind.config.ts` - UTM brand colors (blue #003366, gold #FFB81C, green #28A745)
- `frontend/eslint.config.mjs` - ESLint configuration
- `frontend/.env.development` - Development environment variables
- `frontend/.env.production` - Production environment variables

**Tailwind Colors**:
```
Primary (UTM Blue): #003366
Secondary (Gold): #FFB81C
Accent (Green): #28A745
Neutral (Gray): #6B7280
```

**Frontend Scripts**:
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Check code quality
npm run lint:fix     # Auto-fix linting issues
npm run typecheck    # Type checking only
npm run test         # Run tests
npm run test:watch   # Watch mode tests
```

### ✅ Task 1.2: AWS Lambda Environment Setup

**Status**: COMPLETED

**What was configured**:
- AWS SDK v3 clients (DynamoDB, S3, Cognito, API Gateway, CloudWatch)
- Environment variable management system
- Lambda handler base classes with error handling
- CloudWatch logging integration
- Structured logging utility

**Key files**:
- `backend/src/config/env.ts` - Environment variable loader
- `backend/src/config/aws-clients.ts` - AWS SDK client initialization
- `backend/src/lambdas/base/BaseHandler.ts` - Base handler class
- `backend/src/utils/logger.ts` - CloudWatch logger utility

**Environment Variables**:
```
AWS_REGION
AWS_ACCOUNT_ID
DYNAMODB_TABLE_PREFIX
S3_BUCKET_NAME
COGNITO_POOL_ID
COGNITO_CLIENT_ID
CLOUDWATCH_LOG_GROUP
```

**Backend Scripts**:
```bash
npm run build        # Compile TypeScript
npm run dev          # Watch mode compilation
npm run test         # Run tests
npm run lint         # Check code quality
npm run typecheck    # Type checking only
```

### ✅ Task 1.3: DynamoDB Tables

**Status**: COMPLETED

**Tables created** (9 tables):

1. **Users Table**
   - PK: userId
   - GSI: email-index, role-index, status-index
   - Purpose: Store user accounts, roles, profiles

2. **Rides Table**
   - PK: rideId + createdAt
   - GSI: buyerId-index, driverId-index, status-index, driverId-status-index
   - Purpose: Ride-hailing bookings

3. **Orders Table** (F&B & Parcel)
   - PK: orderId + createdAt
   - GSI: buyerId-index, providerId-index, status-index, serviceType-index
   - Purpose: Food delivery and parcel orders

4. **Menu Items Table**
   - PK: menuItemId
   - GSI: sellerId-index, status-index
   - Purpose: F&B seller menu management

5. **Messages Table**
   - PK: chatChannelId + messageId
   - GSI: chatChannelId-createdAt
   - Purpose: Real-time messaging storage

6. **Chat Channels Table**
   - PK: chatChannelId
   - GSI: buyerId-index, providerId-index, transactionId-index
   - Purpose: Buyer-provider communication channels

7. **Applications Table**
   - PK: applicationId
   - GSI: userId-index, status-index, roleType-index
   - Purpose: Provider role applications (Driver, Seller, Runner)

8. **Payments & Transactions Table**
   - PK: transactionId + createdAt
   - GSI: buyerId-index, payeeId-index, status-index, escrowReleaseTime-index
   - Purpose: Payment and escrow management

9. **Printing Orders Table**
   - PK: printingOrderId + createdAt
   - GSI: buyerId-index, providerId-index, status-index
   - Purpose: Printing service orders

**All tables configured with**:
- On-demand billing (PAY_PER_REQUEST)
- DynamoDB Streams (NEW_AND_OLD_IMAGES)
- Point-in-time recovery enabled
- AWS-managed encryption
- Removal policy: DESTROY (development)

### ✅ Task 1.4: S3 Bucket Configuration

**Status**: COMPLETED

**Bucket name**: `utm-marketplace-bucket-{ACCOUNT_ID}`

**Configuration**:
- Versioning: Enabled
- Encryption: AES-256 (SSE-S3)
- CORS: Enabled for Next.js frontend (localhost:3000, localhost:3001)
- Access: Public access blocked
- Lifecycle: Transition old versions to Glacier after 30 days, expire after 90 days

**Folder structure**:
```
utm-marketplace-bucket/
├── licenses/          # Driver license documents
├── profiles/          # User profile pictures
├── printing/          # Printing service files
├── documents/         # Application documents
├── invoices/          # Transaction receipts
└── logs/              # S3 access logs
```

**CORS Policy**:
- Allowed origins: `http://localhost:3000`, `http://localhost:3001`
- Allowed methods: GET, POST, PUT, DELETE, HEAD
- Allowed headers: Content-Type, Authorization, etc.
- Max age: 1 day

**Pre-signed URLs**:
- Expiration: 1 hour (configurable per Lambda handler)
- Use case: File download and upload without exposing bucket credentials

### ✅ Task 1.5: AWS Cognito Configuration

**Status**: COMPLETED

**User Pools created**: 2 (Production & Development)

**Production Pool**: `utm-student-marketplace-pool`
- Email validation: Only @graduate.utm.my or @utm.my allowed
- Password policy: Min 12 chars, uppercase, numbers, symbols
- Self-signup: Enabled
- Email verification: Required
- Account recovery: Email-based

**Development Pool**: `utm-student-marketplace-dev-pool`
- Same configuration as production
- Pre-created test users:
  - test.buyer@graduate.utm.my (Buyer)
  - test.driver@graduate.utm.my (Driver)
  - test.seller@utm.my (Seller)
  - test.admin@utm.my (Admin)

**JWT Token Configuration**:
- Access token: 15 minutes
- ID token: 15 minutes
- Refresh token: 7 days

**Custom Lambda Trigger**:
- Pre sign-up validation for email domain
- Validates against: @graduate.utm.my, @utm.my
- Rejects non-UTM emails automatically

**OAuth Configuration**:
- Authorization code grant enabled
- PKCE support for SPAs
- Callback URIs: http://localhost:3000/auth/callback, http://localhost:3001/auth/callback
- Logout URI: http://localhost:3000

### ✅ Task 1.6: API Gateway Configuration

**Status**: COMPLETED

**REST API Gateway**:
- Name: `utm-marketplace-rest-api`
- Stage: `v1`
- Authorization: Cognito
- CORS: Enabled for all origins
- Throttling: 2000 RPS, 5000 burst

**Resources**:
- `/auth` - Authentication endpoints
- `/users` - User management
- `/rides` - Ride-hailing service
- `/orders` - Order management
- `/menu` - Menu browsing
- `/applications` - Provider applications
- `/admin` - Admin dashboard

**Logging & Monitoring**:
- CloudWatch logs: INFO level
- Data trace: Enabled
- X-Ray tracing: Enabled
- Request/response logging

**WebSocket API Gateway**:
- Name: `utm-marketplace-websocket-api`
- Stage: `v1`
- Auto-deploy: Enabled
- Routing: `$request.body.action`

**WebSocket Routes**:
- `$default` - Default message handling
- `$connect` - Connection establishment
- `$disconnect` - Connection teardown
- `sendMessage` - Send chat message
- `joinChannel` - Join chat channel

**Additional Features**:
- API Key generation for tracking
- Usage plans with quotas (1M requests/day)
- Request/response validators
- Custom domain ready (configure in production)

## Deployment Instructions

### Prerequisites

```bash
# Install AWS CDK globally
npm install -g aws-cdk

# Configure AWS credentials
aws configure

# Verify setup
cdk --version
aws sts get-caller-identity
```

### Step 1: Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests (optional)
npm run test
```

### Step 2: Infrastructure Deployment

```bash
cd ../infrastructure

# Install dependencies
npm install

# Build CDK
npm run build

# Synthesize CloudFormation
cdk synth

# Validate and diff
cdk diff

# Deploy all stacks
cdk deploy --all

# Or deploy individually
cdk deploy UTMMarketplaceDynamoDBStack
cdk deploy UTMMarketplaceS3Stack
cdk deploy UTMMarketplaceCognitoStack
cdk deploy UTMMarketplaceAPIGatewayStack
```

### Step 3: Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Update .env.local with deployed values

# Build and test
npm run build
npm run lint

# Start development server
npm run dev
```

### Step 4: Configuration Update

After CDK deployment, update frontend `.env.local` with outputs:

```
NEXT_PUBLIC_API_URL=<REST API URL from CDK output>
NEXT_PUBLIC_WEBSOCKET_URL=<WebSocket URL from CDK output>
NEXT_PUBLIC_COGNITO_POOL_ID=<Cognito Pool ID>
NEXT_PUBLIC_COGNITO_CLIENT_ID=<Cognito Client ID>
NEXT_PUBLIC_S3_BUCKET=<S3 Bucket Name>
```

## Environment Variables

### Backend (.env files)

```
AWS_REGION=ap-southeast-1
AWS_ACCOUNT_ID=123456789012
DYNAMODB_TABLE_PREFIX=utm
S3_BUCKET_NAME=utm-marketplace-bucket-123456789012
COGNITO_POOL_ID=ap-southeast-1_XXXXXXXXX
COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
CLOUDWATCH_LOG_GROUP=/aws/lambda/utm-marketplace
NODE_ENV=development
LOG_LEVEL=INFO
```

### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8001
NEXT_PUBLIC_AWS_REGION=ap-southeast-1
NEXT_PUBLIC_COGNITO_POOL_ID=ap-southeast-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_COGNITO_DOMAIN=utm-marketplace-dev-123456789012
NEXT_PUBLIC_COGNITO_REDIRECT_URI=http://localhost:3000/auth/callback
NEXT_PUBLIC_S3_BUCKET=utm-marketplace-bucket-123456789012
NEXT_PUBLIC_S3_REGION=ap-southeast-1
```

## Testing Deployment

### Test Cognito Email Validation

```bash
# Should succeed
curl -X POST https://cognito-idp.ap-southeast-1.amazonaws.com/ \
  -H "X-Amz-Target: AWSCognitoIdentityProviderService.SignUp" \
  -d '{
    "ClientId": "YOUR_CLIENT_ID",
    "Username": "test@graduate.utm.my",
    "Password": "TestPassword123!"
  }'

# Should fail
curl -X POST https://cognito-idp.ap-southeast-1.amazonaws.com/ \
  -H "X-Amz-Target: AWSCognitoIdentityProviderService.SignUp" \
  -d '{
    "ClientId": "YOUR_CLIENT_ID",
    "Username": "test@example.com",
    "Password": "TestPassword123!"
  }'
```

### Test REST API

```bash
# List rides (requires Cognito token)
curl -X GET https://your-api-id.execute-api.ap-southeast-1.amazonaws.com/v1/rides \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"

# Create a ride
curl -X POST https://your-api-id.execute-api.ap-southeast-1.amazonaws.com/v1/rides \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pickupLocation": "Library UTM",
    "dropoffLocation": "Dorm Block A",
    "passengerCount": 2
  }'
```

### Test WebSocket

```bash
# Connect to WebSocket
wscat -c wss://your-api-id.execute-api.ap-southeast-1.amazonaws.com/v1/

# Send message
{"action": "sendMessage", "chatChannelId": "xxx", "message": "Hello"}
```

### Test S3 Pre-signed URLs

```bash
# Generate pre-signed URL (from backend)
aws s3 presign s3://utm-marketplace-bucket-123456789012/profiles/userid.jpg \
  --expires-in 3600

# Upload file using pre-signed URL
curl -X PUT -F "file=@image.jpg" https://s3.amazonaws.com/...
```

## Cleanup

### Remove all infrastructure

```bash
cd infrastructure
cdk destroy --all

# Or remove individual stacks
cdk destroy UTMMarketplaceAPIGatewayStack
cdk destroy UTMMarketplaceCognitoStack
cdk destroy UTMMarketplaceS3Stack
cdk destroy UTMMarketplaceDynamoDBStack
```

## Monitoring & Logs

### CloudWatch Logs

```bash
# View REST API logs
aws logs tail /aws/apigateway/utm-marketplace-rest --follow

# View WebSocket logs
aws logs tail /aws/apigateway/utm-marketplace-websocket --follow

# View Lambda logs
aws logs tail /aws/lambda/utm-marketplace --follow
```

### CloudWatch Metrics

Monitored metrics:
- API request count
- API latency (avg, p95, p99)
- DynamoDB read/write units
- S3 request count
- Cognito user sign-ups
- Error rates

## Next Steps

1. Implement Lambda handlers for each service module (Phase 2-4)
2. Create Next.js frontend components and pages (ongoing)
3. Set up CI/CD pipeline for automatic deployment
4. Configure custom domain (production)
5. Set up monitoring and alerting
6. Create deployment documentation

## Support & Troubleshooting

### Common Issues

**CDK Deployment Fails**
```bash
# Check AWS credentials
aws sts get-caller-identity

# Check CloudFormation events
aws cloudformation describe-stack-events --stack-name UTMMarketplaceDynamoDBStack

# Check for conflicts
aws dynamodb list-tables --region ap-southeast-1
```

**Lambda Cold Starts**
- Consider using Lambda provisioned concurrency
- Optimize function size and dependencies

**DynamoDB Hot Partitions**
- Use better partition keys
- Consider DynamoDB Accelerator (DAX) for caching

**S3 Bucket Already Exists**
- Bucket names must be globally unique
- Update account ID or suffix in CDK code

**Cognito Email Not Received**
- Check SES sending quota (starts at 1 email/second)
- Verify email domain not in sandbox mode

## References

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Next.js Documentation](https://nextjs.org/docs)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/)
- [Cognito Documentation](https://docs.aws.amazon.com/cognito/)

---

**Last Updated**: 2024
**Infrastructure Version**: 1.0
**Phase**: Phase 1 - Infrastructure Setup
