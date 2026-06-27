# AWS Lambda Environment and Dependencies Setup

## Overview

This document describes the Lambda environment configuration for the UTM Student Marketplace backend. The setup follows AWS best practices for serverless applications using TypeScript and AWS SDK v3.

## Project Architecture

### Base Handler Classes

Two base classes provide the foundation for all Lambda handlers:

#### 1. **BaseHandler** - REST API Handlers
Located in `src/lambdas/base/BaseHandler.ts`

Features:
- Automatic environment variable loading and validation
- Request body validation with required field checking
- Path and query parameter extraction
- Success and error response formatting with proper HTTP status codes
- Structured logging to CloudWatch
- AWS SDK v3 client initialization

Usage:
```typescript
import { BaseHandler } from "@lambdas/base/BaseHandler";

export class MyHandler extends BaseHandler {
  async handle(event: APIGatewayProxyEvent, context: Context) {
    // Validate request
    const validation = this.validateRequestBody(event.body, ["email"]);
    if (!validation.valid) {
      return this.handleError(new Error(validation.errors.join(", ")), 400);
    }

    // Process request
    this.log("INFO", "Processing user signup");

    return this.handleSuccess({ userId: "123" }, 201);
  }
}

// Export handler
export const handler = async (event, context) => {
  return new MyHandler().handle(event, context);
};
```

#### 2. **WebSocketBaseHandler** - WebSocket Handlers
Located in `src/lambdas/base/WebSocketBaseHandler.ts`

Features:
- Connection ID extraction
- Route key identification ($connect, $disconnect, $default)
- Request body parsing with error handling
- WebSocket-specific error and success responses
- Structured logging for real-time messaging

Usage:
```typescript
import { WebSocketBaseHandler } from "@lambdas/base/WebSocketBaseHandler";

export class ChatHandler extends WebSocketBaseHandler {
  async handle(event: APIGatewayEvent) {
    const connectionId = this.getConnectionId(event);
    const routeKey = this.getRouteKey(event);

    if (routeKey === "$connect") {
      this.log("INFO", "New WebSocket connection", { connectionId });
      // Handle connection
    }

    return this.handleSuccess();
  }
}

export const handler = async (event) => {
  return new ChatHandler().handle(event);
};
```

## Environment Configuration

### Configuration Files

1. **`.env.development`** - Development environment
   - Log Level: DEBUG
   - Use test AWS credentials
   - Points to dev DynamoDB tables and S3 buckets

2. **`.env.production`** - Production environment
   - Log Level: INFO
   - Use production AWS credentials
   - Points to production resources

### Required Environment Variables

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `AWS_REGION` | string | AWS region | ap-southeast-1 |
| `AWS_ACCOUNT_ID` | string | AWS account ID | 123456789012 |
| `DYNAMODB_TABLE_PREFIX` | string | Prefix for table names | utm-marketplace-prod |
| `S3_BUCKET_NAME` | string | S3 bucket name | utm-marketplace-prod-bucket |
| `COGNITO_POOL_ID` | string | Cognito User Pool ID | ap-southeast-1_XXXXX |
| `COGNITO_CLIENT_ID` | string | Cognito Client ID | abcdef123456 |
| `CLOUDWATCH_LOG_GROUP` | string | CloudWatch log group | /aws/lambda/utm-marketplace-prod |

### Optional Environment Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `AWS_ACCOUNT_ID` | string | - | AWS account ID |
| `S3_REGION` | string | AWS_REGION | S3 region (can differ from main region) |
| `COGNITO_IDENTITY_POOL_ID` | string | "" | Cognito Identity Pool ID |
| `PAYMENT_GATEWAY_TYPE` | string | stripe | Payment gateway (stripe or paypal) |
| `STRIPE_SECRET_KEY` | string | - | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | string | - | Stripe webhook secret |
| `PAYPAL_CLIENT_ID` | string | - | PayPal client ID |
| `PAYPAL_CLIENT_SECRET` | string | - | PayPal client secret |
| `NODE_ENV` | string | development | Node environment |
| `LOG_LEVEL` | string | INFO | Logging level (DEBUG, INFO, WARN, ERROR) |
| `ESCROW_RELEASE_DELAY_RIDE` | number | 86400000 | Escrow auto-release delay for rides (ms, 24h) |
| `ESCROW_RELEASE_DELAY_ORDER` | number | 604800000 | Escrow auto-release delay for orders (ms, 7d) |
| `MAX_FILE_UPLOAD_SIZE` | number | 52428800 | Maximum file upload size (bytes, 50MB) |
| `SUPPORTED_FILE_FORMATS` | string | pdf,doc,docx,jpg,png | Comma-separated supported file formats |

### DynamoDB Table Names (Auto-Generated)

Based on `DYNAMODB_TABLE_PREFIX`, the following table names are generated:

- `{PREFIX}-users` - User profiles and authentication
- `{PREFIX}-rides` - Ride booking and history
- `{PREFIX}-orders` - Food and parcel orders
- `{PREFIX}-menu-items` - F&B menu items
- `{PREFIX}-messages` - Chat messages
- `{PREFIX}-chat-channels` - Chat channels
- `{PREFIX}-applications` - Provider applications
- `{PREFIX}-payments` - Payment transactions
- `{PREFIX}-printing-orders` - Printing service orders
- `{PREFIX}-notifications` - User notifications
- `{PREFIX}-active-connections` - Active WebSocket connections

## AWS SDK v3 Client Configuration

Located in `src/config/aws-clients.ts`

### Initialized Clients

```typescript
import {
  getDynamoDBClient,
  getS3Client,
  getCognitoClient,
  getCloudWatchClient,
  getApiGatewayManagementClient,
} from "@config/aws-clients";

// Use clients in handlers
const dynamoDB = getDynamoDBClient(); // DynamoDB operations
const s3 = getS3Client(); // S3 file operations
const cognito = getCognitoClient(); // User authentication
const cloudWatch = getCloudWatchClient(); // CloudWatch operations
const apiGatewayMgmt = getApiGatewayManagementClient(); // WebSocket connections
```

### Client Features

1. **Singleton Pattern** - Clients are reused across Lambda invocations for better performance
2. **Lazy Initialization** - Clients are created on first use
3. **Region Configuration** - All clients respect `AWS_REGION` setting
4. **Error Handling** - Clients handle connection errors gracefully

## Logging Configuration

Located in `src/utils/logger.ts`

### Usage

```typescript
import { getLogger } from "@utils/logger";

const logger = getLogger();

// Set context for all logs
logger.setContext({ userId: "user123", requestId: "req456" });

// Log messages with different levels
logger.debug("Debug information", { variable: "value" });
logger.info("Important information");
logger.warn("Warning message");
logger.error("Error occurred", error, { additionalData: "value" });

// Clear context when done
logger.clearContext();
```

### Log Levels

| Level | When to Use |
|-------|------------|
| DEBUG | Development debugging information |
| INFO | Important informational messages |
| WARN | Warning messages that don't prevent execution |
| ERROR | Error messages for failures |

### Log Output Format

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "message": "User signup completed",
  "context": {
    "userId": "user123",
    "requestId": "req456"
  },
  "data": {
    "email": "user@graduate.utm.my"
  }
}
```

## Type Definitions

Located in `src/types/index.ts`

Comprehensive TypeScript interfaces for all domain entities:

- **User Types**: User roles, profile information
- **Ride Types**: Ride status, location, pricing
- **Order Types**: Order status, items, payments
- **Message Types**: Chat channels, messages, delivery status
- **Application Types**: Provider applications with role-specific data
- **Payment Types**: Transactions, escrow management
- **Notification Types**: User notifications

## Building and Testing

### Build
```bash
npm run build
```

Generates TypeScript to JavaScript in `dist/` directory.

### Testing
```bash
npm test                 # Run all tests
npm run test:watch     # Watch mode
npm run test:pbt       # Property-based tests only
```

### Linting
```bash
npm run lint           # Run ESLint
npm run typecheck      # TypeScript type checking
```

## Lambda Deployment

### Package Structure for Lambda

Each Lambda function should:

1. **Import and extend base handler**
```typescript
import { BaseHandler } from "@lambdas/base/BaseHandler";
```

2. **Implement the handle method**
```typescript
async handle(event: APIGatewayProxyEvent, context: Context) {
  // Implementation
}
```

3. **Export the handler wrapper**
```typescript
const handler = new MyHandler();
export const lambdaHandler = (event, context) => handler.handle(event, context);
```

### CloudFormation/SAM Template Example

```yaml
Resources:
  SignupFunction:
    Type: AWS::Lambda::Function
    Properties:
      Runtime: nodejs20.x
      Handler: dist/lambdas/auth/SignupHandler.lambdaHandler
      CodeUri: backend/
      Environment:
        Variables:
          AWS_REGION: ap-southeast-1
          DYNAMODB_TABLE_PREFIX: utm-marketplace-prod
          S3_BUCKET_NAME: utm-marketplace-prod-bucket
          COGNITO_POOL_ID: ap-southeast-1_XXXXX
          COGNITO_CLIENT_ID: abcdef123456
          CLOUDWATCH_LOG_GROUP: /aws/lambda/utm-marketplace-prod
      Layers:
        - !Ref UtmMarketplaceLayer
```

## Lambda Execution Role Requirements

The Lambda execution role needs the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": "arn:aws:dynamodb:ap-southeast-1:123456789012:table/utm-marketplace-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::utm-marketplace-prod-bucket/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:*"
      ],
      "Resource": "arn:aws:cognito-idp:ap-southeast-1:123456789012:userpool/ap-southeast-1_XXXXX"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:ap-southeast-1:123456789012:log-group:/aws/lambda/utm-marketplace-prod:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:ap-southeast-1:123456789012:secret:utm-marketplace/*"
    }
  ]
}
```

## Best Practices

1. **Always validate input** using `validateRequestBody` method
2. **Use environment configuration** instead of hardcoding values
3. **Log contextually** with userId, requestId, and correlation IDs
4. **Handle errors gracefully** with appropriate HTTP status codes
5. **Use AWS SDK v3** for better performance and smaller bundle sizes
6. **Set context early** in request processing
7. **Extend base handlers** for consistent error handling
8. **Test thoroughly** with both unit and property-based tests
9. **Monitor CloudWatch logs** for debugging and troubleshooting
10. **Use secrets manager** for sensitive values like API keys

## Troubleshooting

### "Environment variable X is not set"
- Verify the variable is set in Lambda environment configuration
- Check environment file is loaded correctly
- Ensure IAM role can access Secrets Manager if using secret references

### CloudWatch logs not appearing
- Verify `CLOUDWATCH_LOG_GROUP` name is correct
- Ensure Lambda execution role has logs:PutLogEvents permission
- Check log group exists and retention is set appropriately

### AWS SDK client errors
- Verify AWS credentials are configured
- Check Lambda execution role has required permissions
- Ensure resource names match (table names, bucket names)
- Verify AWS region is correct

### Performance issues
- Check Lambda memory allocation (128MB minimum recommended)
- Verify timeout settings are appropriate
- Monitor CloudWatch metrics for bottlenecks
- Consider increasing Lambda concurrency limits

## References

- [AWS SDK for JavaScript v3 Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/)
- [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/latest/dg/)
- [DynamoDB Developer Guide](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [AWS Security Best Practices](https://docs.aws.amazon.com/security/)
