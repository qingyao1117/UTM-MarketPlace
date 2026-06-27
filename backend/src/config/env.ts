/**
 * Environment configuration for Lambda functions
 * Centralizes all environment variable management
 */

export interface EnvironmentConfig {
  // AWS Configuration
  AWS_REGION: string;
  AWS_ACCOUNT_ID: string;

  // DynamoDB Configuration
  DYNAMODB_TABLE_PREFIX: string;
  USERS_TABLE: string;
  RIDES_TABLE: string;
  ORDERS_TABLE: string;
  MENU_ITEMS_TABLE: string;
  MESSAGES_TABLE: string;
  CHAT_CHANNELS_TABLE: string;
  APPLICATIONS_TABLE: string;
  PAYMENTS_TABLE: string;
  PRINTING_ORDERS_TABLE: string;
  NOTIFICATIONS_TABLE: string;
  ACTIVE_CONNECTIONS_TABLE: string;

  // S3 Configuration
  S3_BUCKET_NAME: string;
  S3_REGION: string;

  // Cognito Configuration
  COGNITO_POOL_ID: string;
  COGNITO_CLIENT_ID: string;
  COGNITO_IDENTITY_POOL_ID: string;

  // CloudWatch Configuration
  CLOUDWATCH_LOG_GROUP: string;

  // Payment Gateway Configuration
  PAYMENT_GATEWAY_TYPE: "stripe" | "paypal";
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  PAYPAL_CLIENT_ID?: string;
  PAYPAL_CLIENT_SECRET?: string;

  // Application Configuration
  NODE_ENV: "development" | "staging" | "production";
  LOG_LEVEL: "DEBUG" | "INFO" | "WARN" | "ERROR";

  // Service Configuration
  ESCROW_RELEASE_DELAY_RIDE: number; // in milliseconds (24 hours)
  ESCROW_RELEASE_DELAY_ORDER: number; // in milliseconds (7 days)
  MAX_FILE_UPLOAD_SIZE: number; // in bytes
  SUPPORTED_FILE_FORMATS: string[];
}

/**
 * Load and validate environment configuration
 * @returns Environment configuration object
 * @throws Error if required environment variables are missing
 */
export function loadEnvConfig(): EnvironmentConfig {
  const requiredEnvVars = [
    "AWS_REGION",
    "AWS_ACCOUNT_ID",
    "DYNAMODB_TABLE_PREFIX",
    "S3_BUCKET_NAME",
    "COGNITO_POOL_ID",
    "COGNITO_CLIENT_ID",
    "CLOUDWATCH_LOG_GROUP",
  ];

  // Validate all required environment variables are set
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Required environment variable ${envVar} is not set`);
    }
  }

  const tablePrefix = process.env.DYNAMODB_TABLE_PREFIX!;

  return {
    // AWS Configuration
    AWS_REGION: process.env.AWS_REGION!,
    AWS_ACCOUNT_ID: process.env.AWS_ACCOUNT_ID!,

    // DynamoDB Configuration
    DYNAMODB_TABLE_PREFIX: tablePrefix,
    USERS_TABLE: `${tablePrefix}-users`,
    RIDES_TABLE: `${tablePrefix}-rides`,
    ORDERS_TABLE: `${tablePrefix}-orders`,
    MENU_ITEMS_TABLE: `${tablePrefix}-menu-items`,
    MESSAGES_TABLE: `${tablePrefix}-messages`,
    CHAT_CHANNELS_TABLE: `${tablePrefix}-chat-channels`,
    APPLICATIONS_TABLE: `${tablePrefix}-applications`,
    PAYMENTS_TABLE: `${tablePrefix}-payments`,
    PRINTING_ORDERS_TABLE: `${tablePrefix}-printing-orders`,
    NOTIFICATIONS_TABLE: `${tablePrefix}-notifications`,
    ACTIVE_CONNECTIONS_TABLE: `${tablePrefix}-active-connections`,

    // S3 Configuration
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME!,
    S3_REGION: process.env.S3_REGION || process.env.AWS_REGION!,

    // Cognito Configuration
    COGNITO_POOL_ID: process.env.COGNITO_POOL_ID!,
    COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID!,
    COGNITO_IDENTITY_POOL_ID: process.env.COGNITO_IDENTITY_POOL_ID || "",

    // CloudWatch Configuration
    CLOUDWATCH_LOG_GROUP: process.env.CLOUDWATCH_LOG_GROUP!,

    // Payment Gateway Configuration
    PAYMENT_GATEWAY_TYPE: (process.env.PAYMENT_GATEWAY_TYPE as "stripe" | "paypal") || "stripe",
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
    PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,

    // Application Configuration
    NODE_ENV: (process.env.NODE_ENV as "development" | "staging" | "production") || "development",
    LOG_LEVEL: (process.env.LOG_LEVEL as "DEBUG" | "INFO" | "WARN" | "ERROR") || "INFO",

    // Service Configuration
    ESCROW_RELEASE_DELAY_RIDE: parseInt(process.env.ESCROW_RELEASE_DELAY_RIDE || "86400000", 10), // 24 hours
    ESCROW_RELEASE_DELAY_ORDER: parseInt(process.env.ESCROW_RELEASE_DELAY_ORDER || "604800000", 10), // 7 days
    MAX_FILE_UPLOAD_SIZE: parseInt(process.env.MAX_FILE_UPLOAD_SIZE || "52428800", 10), // 50MB
    SUPPORTED_FILE_FORMATS: (process.env.SUPPORTED_FILE_FORMATS || "pdf,doc,docx,jpg,png").split(","),
  };
}

// Singleton instance
let envConfig: EnvironmentConfig | null = null;

/**
 * Get singleton environment configuration instance
 * @returns Environment configuration object
 */
export function getEnvConfig(): EnvironmentConfig {
  if (!envConfig) {
    envConfig = loadEnvConfig();
  }
  return envConfig;
}
