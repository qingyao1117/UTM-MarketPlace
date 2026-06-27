# UTM Student Marketplace - Infrastructure

AWS CDK Infrastructure-as-Code for the UTM Student Marketplace platform.

## Overview

This directory contains the complete infrastructure setup for the UTM Student Marketplace using AWS CDK (TypeScript). It provisions:

### Task 1.3: DynamoDB Tables
- **Users**: Main user records with email, role, and status tracking
- **Rides**: Ride-hailing bookings with pickup/dropoff locations
- **Orders**: F&B and Parcel service orders
- **Menu Items**: Food items offered by sellers
- **Messages**: Chat messages between buyers and providers
- **Chat Channels**: Chat channel metadata and participants
- **Applications**: Provider role applications (Driver, Seller, Runner)
- **Payments**: Transaction and escrow management
- **Printing Orders**: Printing service orders

All tables use:
- **On-demand billing** for flexibility
- **Point-in-time recovery** for data protection
- **DynamoDB Streams** for real-time event processing
- **AWS-managed encryption** for security
- **Global Secondary Indexes** for efficient querying

### Task 1.4: S3 Bucket
- **Bucket Name**: `utm-marketplace-bucket-{AWS_ACCOUNT_ID}`
- **Versioning**: Enabled for audit trail
- **Encryption**: AES-256 (SSE-S3)
- **CORS**: Configured for Next.js frontend
- **Folder Structure**:
  - `licenses/` - Driver license documents
  - `profiles/` - User profile pictures
  - `printing/` - Printing service files
  - `documents/` - Application documents
  - `invoices/` - Transaction receipts
- **Pre-signed URLs**: 1-hour expiration for secure downloads
- **Lifecycle Policies**: Auto-transition versions to Glacier after 30 days

### Task 1.5: Cognito Authentication
- **User Pool Name**: `utm-student-marketplace-pool`
- **Email Validation**: Custom Lambda trigger restricts to @graduate.utm.my or @utm.my
- **Password Policy**: 
  - Minimum 12 characters
  - Uppercase letters required
  - Numbers required
  - Symbols required
- **JWT Configuration**:
  - Access token: 15 minutes
  - Refresh token: 7 days
- **Email Verification**: Auto-verified for valid UTM emails
- **OAuth Scopes**: openid, profile, email
- **Development Pool**: Separate pool with test users for local development

## Prerequisites

1. **AWS Account** with appropriate permissions (DynamoDB, S3, Cognito, IAM)
2. **Node.js** 18.x or 20.x
3. **AWS CDK** CLI:
   ```bash
   npm install -g aws-cdk
   ```
4. **AWS Credentials** configured locally:
   ```bash
   aws configure
   ```

## Installation

1. **Navigate to infrastructure directory**:
   ```bash
   cd infrastructure
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Bootstrap CDK** (first time only):
   ```bash
   cdk bootstrap
   ```

## Deployment

### Deploy all stacks:
```bash
npm run deploy
```

### Deploy individual stacks:
```bash
# DynamoDB only
npm run deploy:dynamodb

# S3 only
npm run deploy:s3

# Cognito only
npm run deploy:cognito
```

### Preview changes:
```bash
npm run diff
```

### List stacks:
```bash
npm run ls
```

## Configuration

### AWS Region
By default, the infrastructure deploys to `ap-southeast-1` (Singapore). To change:

```bash
export AWS_REGION=us-east-1
npm run deploy
```

Or modify the region in `lib/app.ts`:
```typescript
const environment = {
  region: 'us-east-1', // Change here
};
```

### CORS Configuration
To update CORS allowed origins for your S3 bucket, modify `lib/s3-stack.ts`:

```typescript
this.marketplaceBucket.addCorsRule({
  allowedOrigins: [
    'http://localhost:3000',
    'https://marketplace.utm.edu.my', // Add your production domain
  ],
  // ... rest of configuration
});
```

### Cognito Callback URLs
Update callback URLs in `lib/cognito-stack.ts`:

```typescript
callbackUrls: [
  'http://localhost:3000/auth/callback',
  'https://marketplace.utm.edu.my/auth/callback', // Production
],
```

## Development & Testing

### Test Users (Development Pool)
The development Cognito pool includes pre-created test users:

| Username | Email | Password | Role |
|----------|-------|----------|------|
| test.buyer | test.buyer@graduate.utm.my | TempPassword123! | Buyer |
| test.driver | test.driver@graduate.utm.my | TempPassword123! | Driver |
| test.seller | test.seller@utm.my | TempPassword123! | Seller |
| test.admin | test.admin@utm.my | TempPassword123! | Admin |

### Access Cognito Hosted UI
After deployment, use the Hosted UI for testing authentication:

```
Development: https://utm-marketplace-dev-{ACCOUNT_ID}.auth.ap-southeast-1.amazoncognito.com/login?response_type=code&client_id={CLIENT_ID}&redirect_uri=http://localhost:3000/auth/callback

Production: https://utm-marketplace-{ACCOUNT_ID}.auth.ap-southeast-1.amazoncognito.com/login?response_type=code&client_id={CLIENT_ID}&redirect_uri=http://localhost:3000/auth/callback
```

### Test DynamoDB Tables
Use AWS CLI to inspect tables:

```bash
# List all tables
aws dynamodb list-tables --region ap-southeast-1

# Describe a table
aws dynamodb describe-table --table-name Users --region ap-southeast-1

# Query a table
aws dynamodb query \
  --table-name Users \
  --index-name email-index \
  --key-condition-expression "email = :email" \
  --expression-attribute-values '{":email":{"S":"test.user@graduate.utm.my"}}' \
  --region ap-southeast-1
```

### Test S3 Bucket
```bash
# List bucket contents
aws s3 ls s3://utm-marketplace-bucket-{ACCOUNT_ID}/ --recursive

# Upload test file
aws s3 cp test.pdf s3://utm-marketplace-bucket-{ACCOUNT_ID}/licenses/test.pdf

# Generate pre-signed URL
aws s3 presign s3://utm-marketplace-bucket-{ACCOUNT_ID}/licenses/test.pdf --expires-in 3600
```

## Outputs

After deployment, CDK outputs useful information:

```
UTMMarketplaceDynamoDBStack:
  UsersTableName: Users
  RidesTableName: Rides
  OrdersTableName: Orders
  PaymentsTableName: Payments

UTMMarketplaceS3Stack:
  BucketName: utm-marketplace-bucket-123456789
  BucketArn: arn:aws:s3:::utm-marketplace-bucket-123456789

UTMMarketplaceCognitoStack:
  UserPoolId: ap-southeast-1_xxxxxxxxx
  ClientId: yyyyyyyyyyyyyyyyyyyyyyyy
  UserPoolDomain: utm-marketplace-123456789.auth.ap-southeast-1.amazoncognito.com
  HostedUIUrl: https://...
  TestUsersInfo: {...}
```

## Cleanup

### Destroy all stacks:
```bash
npm run destroy
```

### Destroy individual stacks:
```bash
npm run destroy:dynamodb
npm run destroy:s3
npm run destroy:cognito
```

⚠️ **Warning**: This will permanently delete all resources including DynamoDB tables, S3 data, and Cognito pools.

## Architecture Details

### DynamoDB Design

All tables follow best practices:

1. **Partition Key Strategy**: UUID-based partitioning for even data distribution
2. **Sort Keys**: Temporal (createdAt) for efficient range queries
3. **GSI Design**: Supports all required query patterns without table scans
4. **On-Demand Billing**: No need to provision capacity
5. **Streams**: Enabled for Lambda event sourcing

Example query patterns supported:

```
// Get user by ID (direct)
Users.get({ userId: 'uuid' })

// Get user by email (GSI)
Users.query({ email: 'user@graduate.utm.my' }, 'email-index')

// Get all drivers (GSI)
Users.query({ role: 'Driver' }, 'role-index')

// Get buyer's orders (GSI)
Orders.query({ buyerId: 'uuid' }, 'buyerId-index')

// Get pending orders by status (GSI)
Orders.query({ status: 'Pending' }, 'status-index')

// Get auto-release transactions (GSI)
Payments.query({ escrowReleaseTime: '2024-01-15' }, 'escrowReleaseTime-index')
```

### S3 Folder Structure

```
utm-marketplace-bucket-{ACCOUNT_ID}/
├── licenses/
│   └── {driverId}/license.pdf
├── profiles/
│   └── {userId}.jpg
├── printing/
│   └── {buyerId}/{fileId}.pdf
├── documents/
│   └── {applicationId}/{documentType}.pdf
├── invoices/
│   └── {transactionId}.pdf
└── logs/
    └── (automatically managed)
```

### Cognito Security

1. **Email Validation**: Lambda trigger enforces @graduate.utm.my or @utm.my
2. **Password Policy**: Strong passwords required
3. **Advanced Security**: Anomalous login detection enabled
4. **Email Verification**: Required before account activation
5. **Token Expiration**: Short-lived access tokens for security

## Troubleshooting

### Issue: "User is not authorized to perform: dynamodb:CreateTable"
**Solution**: Ensure your AWS credentials have DynamoDB permissions. Check IAM policy.

### Issue: "Bucket already exists"
**Solution**: S3 bucket names are globally unique. Use a different account ID or modify the bucket name in `lib/s3-stack.ts`.

### Issue: "Email domain validation not working"
**Solution**: Check the Lambda function logs in CloudWatch:
```bash
aws logs tail /aws/lambda/UTMMarketplaceInfrastructureApp-EmailDomainValidationLambda --follow
```

### Issue: "CORS errors when uploading files"
**Solution**: Verify CORS is correctly configured:
```bash
aws s3api get-bucket-cors --bucket utm-marketplace-bucket-{ACCOUNT_ID}
```

## Requirements Mapping

### Requirement 1.1 - Email Domain Validation
- ✅ Cognito Pre-Sign-Up Lambda trigger
- ✅ Validates @graduate.utm.my or @utm.my
- ✅ Rejects invalid domains with error message

### Requirement 1.3 - Cognito Configuration
- ✅ User pool with email verification
- ✅ Strong password policy
- ✅ JWT token configuration
- ✅ Test users for development

### Requirement 4.2 - File Storage
- ✅ S3 bucket with versioning
- ✅ AES-256 encryption
- ✅ CORS for Next.js
- ✅ Pre-signed URL configuration
- ✅ Folder structure

## Related Documentation

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [DynamoDB Design Patterns](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [S3 Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/BestPractices.html)
- [Cognito User Pool Configuration](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-pre-sign-up.html)

## Support

For issues or questions:
1. Check AWS CloudFormation events for deployment errors
2. Review CloudWatch logs for Lambda issues
3. Verify IAM permissions
4. Check AWS CDK troubleshooting guide

## License

MIT
