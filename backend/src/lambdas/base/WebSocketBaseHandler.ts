import { CloudWatchLogs } from "@aws-sdk/client-cloudwatch-logs";
import { APIGatewayEvent } from "aws-lambda";

/**
 * Base WebSocket handler class for TypeScript Lambda functions handling WebSocket events
 * Provides common functionality for WebSocket connections
 */
export abstract class WebSocketBaseHandler {
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
   * Handle errors in WebSocket context
   * @param error - Error object
   * @param connectionId - WebSocket connection ID
   * @returns Formatted error response
   */
  protected handleError(error: any, connectionId?: string): { statusCode: number } {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    this.log("ERROR", "WebSocket request failed", {
      connectionId,
      message: errorMessage,
      stack: errorStack,
    });

    return { statusCode: 500 };
  }

  /**
   * Return successful response for WebSocket
   * @param statusCode - HTTP status code (defaults to 200)
   * @returns Formatted success response
   */
  protected handleSuccess(statusCode: number = 200): { statusCode: number } {
    return { statusCode };
  }

  /**
   * Extract connection ID from event
   * @param event - WebSocket event
   * @returns Connection ID
   */
  protected getConnectionId(event: APIGatewayEvent): string {
    return event.requestContext.connectionId || "";
  }

  /**
   * Extract route key from event
   * @param event - WebSocket event
   * @returns Route key ($connect, $disconnect, $default, etc.)
   */
  protected getRouteKey(event: APIGatewayEvent): string | undefined {
    return event.requestContext.routeKey;
  }

  /**
   * Parse request body for WebSocket message
   * @param body - Request body
   * @returns Parsed body or null
   */
  protected parseBody(body: string | null): any {
    if (!body) {
      return null;
    }

    try {
      return JSON.parse(body);
    } catch (error) {
      this.log("WARN", "Failed to parse WebSocket message body", {
        body,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Abstract method for handling WebSocket events - must be implemented by subclasses
   */
  abstract handle(event: APIGatewayEvent): Promise<{ statusCode: number }>;
}
