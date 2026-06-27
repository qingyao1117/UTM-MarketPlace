# UTM Student Marketplace - Lambda Backend

AWS Lambda-based serverless backend for the UTM Student Marketplace platform, built with TypeScript and AWS SDK v3.

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── env.ts              # Environment configuration management
│   │   └── aws-clients.ts      # AWS SDK v3 client initialization
│   ├── lambdas/
│   │   └── base/
│   │       ├── BaseHandler.ts          # Base class for REST Lambda handlers
│   │       └── WebSocketBaseHandler.ts # Base class for WebSocket handlers
│   ├── utils/
│   │   └── logger.ts           # CloudWatch logging utility
│   └── types/
│       └── (type definitions)
├── package.json
├── tsconfig.json
├── jest.config.js
├── .eslintrc.json
├── .env.development
└── .env.production
```

## Setup

### Prerequisites

- Node.js 18.x or 20.x
- AWS credentials configured (AWS CLI)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
# For development
cp .env.development .env

# Update .env with your actual AWS credentials and configuration
```

3. Build the project:
```bash
npm run build
```

## Environment Configuration

### Required Environment Variables

- `AWS_REGION` - AWS region (e.g., ap-southeast-1)
- `AWS_ACCOUNT_ID` - AWS account ID
- `DYNAMODB_TABLE_PREFIX` - Prefix for DynamoDB table names
- `S3_BUCKET_NAME` - S3 bucket for file storage
- `COGNITO_POOL_ID` - Cognito User Pool ID
- `COGNITO_CLIENT_ID` - Cognito Client ID
- `CLOUDWATCH_LOG_GROUP` - CloudWatch log group name

### Optional Environment Variables

- `COGNITO_IDENTITY_POOL_ID` - Cognito Identity Pool ID
- `PAYMENT_GATEWAY_TYPE` - Payment gateway (stripe or paypal)
- `STRIPE_SECRET_KEY` - Stripe secret key
- `PAYPAL_CLIENT_ID` - PayPal client ID
- `NODE_ENV` - Environment (development, staging, production)
- `LOG_LEVEL` - Logging level (DEBUG, INFO, WARN, ERROR)

## Lambda Handler Base Classes

### BaseHandler

Used for REST API endpoints via API Gateway.

```typescript
import { BaseHandler } from "@lambdas/base/BaseHandler";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

export class MyHandler extends BaseHandler {
  async handle(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    this.log("INFO", "Processing request", { path: event.path });
    
    const body = this.validateRequestBody(event.body, ["email", "password"]);
    if (!body.valid) {
      return this.handleError(new Error(body.errors.join(", ")), 400);
    }
    
    // Process request...
    return this.handleSuccess({ success: true });
  }
}
```

### WebSocketBaseHandler

Used for WebSocket handlers.

```typescript
import { WebSocketBaseHandler } from "@lambdas/base/WebSocketBaseHandler";
import { APIGatewayEvent } from "aws-lambda";

export class MyWebSocketHandler extends WebSocketBaseHandler {
  async handle(event: APIGatewayEvent): Promise<{ statusCode: number }> {
    const connectionId = this.getConnectionId(event);
    this.log("INFO", "WebSocket connection", { connectionId });
    
    // Process WebSocket event...
    return this.handleSuccess();
  }
}
```

## AWS SDK v3 Clients

AWS SDK v3 clients are initialized lazily and reused across invocations:

```typescript
import { getDynamoDBClient, getS3Client } from "@config/aws-clients";
import { getLogger } from "@utils/logger";

const dynamoDB = getDynamoDBClient();
const s3 = getS3Client();
const logger = getLogger();
```

Available clients:
- `getDynamoDBClient()` - DynamoDB client
- `getS3Client()` - S3 client
- `getCognitoClient()` - Cognito Identity Service Provider
- `getApiGatewayManagementClient()` - API Gateway Management (WebSocket)
- `getCloudWatchClient()` - CloudWatch Logs

## Logging

The logger utility provides structured logging with CloudWatch integration:

```typescript
import { getLogger } from "@utils/logger";

const logger = getLogger();

// Set context that will be included in all logs
logger.setContext({ userId: "user123", requestId: "req456" });

// Log messages
logger.debug("Debug message", { data: "value" });
logger.info("Info message");
logger.warn("Warning message");
logger.error("Error occurred", error, { additionalData: "value" });

// Clear context when done
logger.clearContext();
```

## Testing

### Run all tests:
```bash
npm test
```

### Run tests in watch mode:
```bash
npm run test:watch
```

### Run property-based tests:
```bash
npm run test:pbt
```

### Run with coverage:
```bash
npm test -- --coverage
```

## Building

### Development build with type checking:
```bash
npm run typecheck
```

### Production build:
```bash
npm run build
```

### Clean previous builds:
```bash
npm run clean
```

## Linting

```bash
npm run lint
```

## Deployment

The Lambda functions are deployed through AWS CloudFormation or CDK. Each Lambda function should:

1. Extend `BaseHandler` or `WebSocketBaseHandler`
2. Implement the `handle` method
3. Export the handler as the entry point:

```typescript
import { MyHandler } from "./MyHandler";

const handler = new MyHandler();

export const lambdaHandler = async (event, context) => {
  return handler.handle(event, context);
};
```

## Architecture Overview

### Handler Hierarchy
```
BaseHandler/WebSocketBaseHandler
├── Environment Configuration
├── AWS SDK v3 Clients
├── CloudWatch Logging
├── Error Handling
└── Response Formatting
```

### Service Dependencies
```
Lambda Functions
    ↓
AWS Clients (DynamoDB, S3, Cognito)
    ↓
AWS Services (DynamoDB, S3, API Gateway, Cognito)
    ↓
CloudWatch Logs
```

## Best Practices

1. **Always extend base handlers** for consistent error handling and logging
2. **Use environment configuration** instead of hardcoding values
3. **Validate input** using `validateRequestBody` method
4. **Log contextually** with userId, requestId, and other relevant data
5. **Handle errors gracefully** with appropriate HTTP status codes
6. **Use AWS SDK v3** for better performance and tree-shaking
7. **Set request context** for better debugging and tracing

## Troubleshooting

### "Environment variable X is not set"
Ensure all required environment variables are configured in `.env` or Lambda environment settings.

### CloudWatch logs not appearing
- Check that `CLOUDWATCH_LOG_GROUP` is correct
- Verify Lambda execution role has CloudWatch Logs permissions
- Ensure log group exists in CloudWatch

### AWS SDK client initialization errors
- Verify AWS credentials are configured
- Check AWS region is correct
- Ensure IAM role has necessary permissions for each service

## References

- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/)
- [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/latest/dg/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
