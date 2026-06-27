import { CloudWatchLogs } from "@aws-sdk/client-cloudwatch-logs";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

/**
 * Base Lambda handler class for TypeScript Lambda functions
 * Provides common functionality for error handling, logging, and response formatting
 */
export abstract class BaseHandler {
  protected logger: CloudWatchLogs;
  protected region: string;
  protected environment: {
    AWS_REGION: string;
    DYNAMODB_TABLE_PREFIX: string;
    S3_BUCKET_NAME: string;
    COGNITO_POOL_ID: string;
  };

  constructor() {
    this.region = process.env.AWS_REGION || "ap-southeast-1";
    this.logger = new CloudWatchLogs({ region: this.region });

    // Validate required environment variables
    this.environment = {
      AWS_REGION: this.getEnvVariable("AWS_REGION"),
      DYNAMODB_TABLE_PREFIX: this.getEnvVariable("DYNAMODB_TABLE_PREFIX"),
      S3_BUCKET_NAME: this.getEnvVariable("S3_BUCKET_NAME"),
      COGNITO_POOL_ID: this.getEnvVariable("COGNITO_POOL_ID"),
    };
  }

  /**
   * Get environment variable with validation
   * @param key - Environment variable name
   * @returns Environment variable value
   * @throws Error if variable is not set
   */
  protected getEnvVariable(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Environment variable ${key} is not set`);
    }
    return value;
  }

  /**
   * Get optional environment variable
   * @param key - Environment variable name
   * @param defaultValue - Default value if not set
   * @returns Environment variable value or default
   */
  protected getOptionalEnvVariable(key: string, defaultValue?: string): string | undefined {
    return process.env[key] || defaultValue;
  }

  /**
   * Log to CloudWatch
   * @param level - Log level (INFO, ERROR, WARN, DEBUG)
   * @param message - Log message
   * @param data - Additional data to log
   */
  protected log(
    level: "INFO" | "ERROR" | "WARN" | "DEBUG",
    message: string,
    data?: Record<string, any>
  ): void {
    const timestamp = new Date().toISOString();
    const logMessage = {
      timestamp,
      level,
      message,
      ...(data && { data }),
    };

    // Log to console (CloudWatch will capture this)
    console.log(JSON.stringify(logMessage));
  }

  /**
   * Handle errors and return proper error response
   * @param error - Error object
   * @param statusCode - HTTP status code (defaults to 500)
   * @returns Formatted error response
   */
  protected handleError(error: any, statusCode: number = 500): APIGatewayProxyResult {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    this.log("ERROR", "Request failed", {
      statusCode,
      message: errorMessage,
      stack: errorStack,
    });

    return {
      statusCode,
      body: JSON.stringify({
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      headers: {
        "Content-Type": "application/json",
      },
    };
  }

  /**
   * Return successful response
   * @param data - Response data
   * @param statusCode - HTTP status code (defaults to 200)
   * @returns Formatted success response
   */
  protected handleSuccess(
    data: any,
    statusCode: number = 200
  ): APIGatewayProxyResult {
    return {
      statusCode,
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    };
  }

  /**
   * Validate request body
   * @param body - Request body to validate
   * @param requiredFields - Array of required field names
   * @returns Validation result
   */
  protected validateRequestBody(
    body: any,
    requiredFields: string[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!body) {
      return { valid: false, errors: ["Request body is required"] };
    }

    const bodyObj = typeof body === "string" ? JSON.parse(body) : body;

    for (const field of requiredFields) {
      if (!(field in bodyObj) || bodyObj[field] === undefined || bodyObj[field] === null) {
        errors.push(`Required field missing: ${field}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Extract and parse path parameter
   * @param event - Lambda event
   * @param paramName - Parameter name
   * @returns Parameter value or undefined
   */
  protected getPathParameter(
    event: APIGatewayProxyEvent,
    paramName: string
  ): string | undefined {
    return event.pathParameters?.[paramName];
  }

  /**
   * Extract and parse query parameter
   * @param event - Lambda event
   * @param paramName - Parameter name
   * @returns Parameter value or undefined
   */
  protected getQueryParameter(
    event: APIGatewayProxyEvent,
    paramName: string
  ): string | undefined {
    return event.queryStringParameters?.[paramName];
  }

  /**
   * Abstract method for handling requests - must be implemented by subclasses
   */
  abstract handle(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult>;
}
