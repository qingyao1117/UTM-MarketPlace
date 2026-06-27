import { loadEnvConfig, getEnvConfig, EnvironmentConfig } from "./env";

describe("Environment Configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Clear environment
    jest.resetModules();
    process.env = { ...originalEnv };

    // Set required environment variables
    process.env.AWS_REGION = "ap-southeast-1";
    process.env.AWS_ACCOUNT_ID = "123456789012";
    process.env.DYNAMODB_TABLE_PREFIX = "utm-marketplace";
    process.env.S3_BUCKET_NAME = "test-bucket";
    process.env.COGNITO_POOL_ID = "ap-southeast-1_test123";
    process.env.COGNITO_CLIENT_ID = "test-client-id";
    process.env.CLOUDWATCH_LOG_GROUP = "/aws/lambda/test";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("loadEnvConfig", () => {
    it("should load all required environment variables", () => {
      const config = loadEnvConfig();

      expect(config.AWS_REGION).toBe("ap-southeast-1");
      expect(config.AWS_ACCOUNT_ID).toBe("123456789012");
      expect(config.DYNAMODB_TABLE_PREFIX).toBe("utm-marketplace");
      expect(config.S3_BUCKET_NAME).toBe("test-bucket");
      expect(config.COGNITO_POOL_ID).toBe("ap-southeast-1_test123");
      expect(config.COGNITO_CLIENT_ID).toBe("test-client-id");
      expect(config.CLOUDWATCH_LOG_GROUP).toBe("/aws/lambda/test");
    });

    it("should construct DynamoDB table names with prefix", () => {
      const config = loadEnvConfig();

      expect(config.USERS_TABLE).toBe("utm-marketplace-users");
      expect(config.RIDES_TABLE).toBe("utm-marketplace-rides");
      expect(config.ORDERS_TABLE).toBe("utm-marketplace-orders");
      expect(config.PAYMENTS_TABLE).toBe("utm-marketplace-payments");
    });

    it("should use default values for optional environment variables", () => {
      const config = loadEnvConfig();

      expect(config.S3_REGION).toBe("ap-southeast-1");
      expect(config.NODE_ENV).toBe("development");
      expect(config.LOG_LEVEL).toBe("INFO");
    });

    it("should parse numeric environment variables correctly", () => {
      process.env.ESCROW_RELEASE_DELAY_RIDE = "3600000";
      process.env.ESCROW_RELEASE_DELAY_ORDER = "7200000";
      process.env.MAX_FILE_UPLOAD_SIZE = "1048576";

      const config = loadEnvConfig();

      expect(config.ESCROW_RELEASE_DELAY_RIDE).toBe(3600000);
      expect(config.ESCROW_RELEASE_DELAY_ORDER).toBe(7200000);
      expect(config.MAX_FILE_UPLOAD_SIZE).toBe(1048576);
    });

    it("should parse comma-separated file formats", () => {
      process.env.SUPPORTED_FILE_FORMATS = "pdf,docx,jpg";

      const config = loadEnvConfig();

      expect(config.SUPPORTED_FILE_FORMATS).toEqual(["pdf", "docx", "jpg"]);
    });

    it("should throw error if required environment variable is missing", () => {
      delete process.env.AWS_REGION;

      expect(() => loadEnvConfig()).toThrow("Required environment variable AWS_REGION is not set");
    });

    it("should throw error if DYNAMODB_TABLE_PREFIX is missing", () => {
      delete process.env.DYNAMODB_TABLE_PREFIX;

      expect(() => loadEnvConfig()).toThrow(
        "Required environment variable DYNAMODB_TABLE_PREFIX is not set"
      );
    });
  });

  describe("getEnvConfig", () => {
    it("should return singleton instance", () => {
      const config1 = getEnvConfig();
      const config2 = getEnvConfig();

      expect(config1).toBe(config2);
    });

    it("should lazily initialize config on first call", () => {
      const config = getEnvConfig();

      expect(config.AWS_REGION).toBe("ap-southeast-1");
      expect(config.COGNITO_POOL_ID).toBe("ap-southeast-1_test123");
    });
  });

  describe("Configuration schema validation", () => {
    it("should have all required properties", () => {
      const config = loadEnvConfig();

      const requiredProperties: (keyof EnvironmentConfig)[] = [
        "AWS_REGION",
        "AWS_ACCOUNT_ID",
        "DYNAMODB_TABLE_PREFIX",
        "USERS_TABLE",
        "RIDES_TABLE",
        "ORDERS_TABLE",
        "S3_BUCKET_NAME",
        "COGNITO_POOL_ID",
        "CLOUDWATCH_LOG_GROUP",
      ];

      for (const prop of requiredProperties) {
        expect(config).toHaveProperty(prop);
        expect(config[prop]).toBeDefined();
      }
    });

    it("should handle payment gateway configuration", () => {
      process.env.PAYMENT_GATEWAY_TYPE = "stripe";
      process.env.STRIPE_SECRET_KEY = "sk_test_123";

      const config = loadEnvConfig();

      expect(config.PAYMENT_GATEWAY_TYPE).toBe("stripe");
      expect(config.STRIPE_SECRET_KEY).toBe("sk_test_123");
    });
  });
});
