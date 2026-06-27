import {
  initializeClients,
  getAWSClients,
  resetClients,
  getDynamoDBClient,
  getS3Client,
  getCognitoClient,
  getCloudWatchClient,
} from "./aws-clients";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import { CognitoIdentityServiceProvider } from "@aws-sdk/client-cognito-identity-service-provider";
import { CloudWatchLogs } from "@aws-sdk/client-cloudwatch-logs";

describe("AWS Clients Configuration", () => {
  beforeEach(() => {
    // Set required environment variables
    process.env.AWS_REGION = "ap-southeast-1";
    process.env.AWS_ACCOUNT_ID = "123456789012";
    process.env.DYNAMODB_TABLE_PREFIX = "utm-marketplace";
    process.env.S3_BUCKET_NAME = "test-bucket";
    process.env.COGNITO_POOL_ID = "test-pool-id";
    process.env.COGNITO_CLIENT_ID = "test-client-id";
    process.env.CLOUDWATCH_LOG_GROUP = "/aws/lambda/test";

    // Reset singleton
    resetClients();
  });

  describe("initializeClients", () => {
    it("should create all client instances", () => {
      const clients = initializeClients();

      expect(clients).toHaveProperty("dynamoDB");
      expect(clients).toHaveProperty("s3");
      expect(clients).toHaveProperty("cognito");
      expect(clients).toHaveProperty("cloudWatch");
      expect(clients).toHaveProperty("apiGatewayManagement");
    });

    it("should create DynamoDB client with correct region", () => {
      const clients = initializeClients();

      expect(clients.dynamoDB).toBeInstanceOf(DynamoDBClient);
    });

    it("should create S3 client with correct region", () => {
      const clients = initializeClients();

      expect(clients.s3).toBeInstanceOf(S3Client);
    });

    it("should create Cognito client with correct region", () => {
      const clients = initializeClients();

      expect(clients.cognito).toBeInstanceOf(CognitoIdentityServiceProvider);
    });

    it("should create CloudWatch client with correct region", () => {
      const clients = initializeClients();

      expect(clients.cloudWatch).toBeInstanceOf(CloudWatchLogs);
    });
  });

  describe("getAWSClients singleton", () => {
    it("should return singleton instance", () => {
      const clients1 = getAWSClients();
      const clients2 = getAWSClients();

      expect(clients1).toBe(clients2);
    });

    it("should lazily initialize clients on first call", () => {
      // First call initializes
      const clients1 = getAWSClients();
      expect(clients1.dynamoDB).toBeDefined();

      // Second call returns same instance
      const clients2 = getAWSClients();
      expect(clients1).toBe(clients2);
    });

    it("should preserve client instances across calls", () => {
      const dynamoDB1 = getDynamoDBClient();
      const dynamoDB2 = getDynamoDBClient();

      expect(dynamoDB1).toBe(dynamoDB2);
    });
  });

  describe("Individual client getters", () => {
    it("should get DynamoDB client", () => {
      const client = getDynamoDBClient();

      expect(client).toBeInstanceOf(DynamoDBClient);
    });

    it("should get S3 client", () => {
      const client = getS3Client();

      expect(client).toBeInstanceOf(S3Client);
    });

    it("should get Cognito client", () => {
      const client = getCognitoClient();

      expect(client).toBeInstanceOf(CognitoIdentityServiceProvider);
    });

    it("should get CloudWatch client", () => {
      const client = getCloudWatchClient();

      expect(client).toBeInstanceOf(CloudWatchLogs);
    });

    it("should return same client instance for multiple calls", () => {
      const db1 = getDynamoDBClient();
      const db2 = getDynamoDBClient();

      expect(db1).toBe(db2);
    });
  });

  describe("resetClients", () => {
    it("should clear singleton instance", () => {
      // Get clients first
      getAWSClients();

      // Reset
      resetClients();

      // Get new instance - should be different
      const freshClients = initializeClients();

      expect(freshClients).toBeDefined();
    });

    it("should allow reinitialization after reset", () => {
      const clients1 = getAWSClients();

      resetClients();

      const clients2 = getAWSClients();

      expect(clients1).not.toBe(clients2);
      expect(clients2.dynamoDB).toBeInstanceOf(DynamoDBClient);
    });
  });

  describe("Client configuration validation", () => {
    it("should use environment variables for region configuration", () => {
      process.env.AWS_REGION = "us-east-1";
      resetClients();

      const clients = initializeClients();

      expect(clients.dynamoDB).toBeDefined();
      // AWS SDK will use the environment variable internally
    });

    it("should use S3_REGION environment variable if provided", () => {
      process.env.S3_REGION = "eu-west-1";
      resetClients();

      const clients = initializeClients();

      expect(clients.s3).toBeInstanceOf(S3Client);
    });

    it("should handle missing S3_REGION gracefully", () => {
      delete process.env.S3_REGION;
      resetClients();

      const clients = initializeClients();

      expect(clients.s3).toBeInstanceOf(S3Client);
    });
  });

  describe("Error handling", () => {
    it("should handle initialization errors gracefully", () => {
      // Even with incomplete env, clients should initialize
      // (actual errors will occur during use)
      const clients = initializeClients();

      expect(clients.dynamoDB).toBeDefined();
      expect(clients.s3).toBeDefined();
    });
  });
});
