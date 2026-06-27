import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import { CognitoIdentityServiceProvider } from "@aws-sdk/client-cognito-identity-service-provider";
import { ApiGatewayManagementApi } from "@aws-sdk/client-apigatewaymanagementapi";
import { CloudWatchLogs } from "@aws-sdk/client-cloudwatch-logs";
import { getEnvConfig } from "./env";

/**
 * AWS SDK v3 clients configuration
 * Provides singleton instances of AWS service clients
 */

interface AWSClients {
  dynamoDB: DynamoDBClient;
  s3: S3Client;
  cognito: CognitoIdentityServiceProvider;
  apiGatewayManagement: ApiGatewayManagementApi;
  cloudWatch: CloudWatchLogs;
}

let clients: AWSClients | null = null;

/**
 * Initialize AWS SDK v3 clients
 * @returns Initialized AWS clients object
 */
export function initializeClients(): AWSClients {
  const config = getEnvConfig();

  return {
    // DynamoDB Client
    dynamoDB: new DynamoDBClient({
      region: config.AWS_REGION,
      requestHandler: {
        metadata: {
          handlerCount: 0,
        },
      },
    }),

    // S3 Client
    s3: new S3Client({
      region: config.S3_REGION,
      requestHandler: {
        metadata: {
          handlerCount: 0,
        },
      },
    }),

    // Cognito Client
    cognito: new CognitoIdentityServiceProvider({
      region: config.AWS_REGION,
      requestHandler: {
        metadata: {
          handlerCount: 0,
        },
      },
    }),

    // API Gateway Management Client (for WebSocket)
    apiGatewayManagement: new ApiGatewayManagementApi({
      region: config.AWS_REGION,
    }),

    // CloudWatch Logs Client
    cloudWatch: new CloudWatchLogs({
      region: config.AWS_REGION,
      requestHandler: {
        metadata: {
          handlerCount: 0,
        },
      },
    }),
  };
}

/**
 * Get singleton AWS clients instance
 * @returns AWS clients object
 */
export function getAWSClients(): AWSClients {
  if (!clients) {
    clients = initializeClients();
  }
  return clients;
}

/**
 * Reset clients (useful for testing)
 */
export function resetClients(): void {
  clients = null;
}

// Export individual client getters for convenience
export function getDynamoDBClient(): DynamoDBClient {
  return getAWSClients().dynamoDB;
}

export function getS3Client(): S3Client {
  return getAWSClients().s3;
}

export function getCognitoClient(): CognitoIdentityServiceProvider {
  return getAWSClients().cognito;
}

export function getApiGatewayManagementClient(): ApiGatewayManagementApi {
  return getAWSClients().apiGatewayManagement;
}

export function getCloudWatchClient(): CloudWatchLogs {
  return getAWSClients().cloudWatch;
}
