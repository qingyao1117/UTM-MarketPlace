import { getEnvConfig } from "../config/env";
import { getCloudWatchClient } from "../config/aws-clients";
import {
  PutLogEventsCommand,
  CreateLogStreamCommand,
  DescribeLogStreamsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

/**
 * Logger utility for Lambda functions with CloudWatch integration
 * Provides structured logging with different log levels
 */

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface LogContext {
  requestId?: string;
  userId?: string;
  functionName?: string;
  correlationId?: string;
  [key: string]: any;
}

class Logger {
  private logGroupName: string;
  private logStreamName: string;
  private logLevel: LogLevel;
  private context: LogContext = {};
  private logBuffer: Array<{ timestamp: number; message: string }> = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private initialized = false;

  constructor() {
    const config = getEnvConfig();
    this.logGroupName = config.CLOUDWATCH_LOG_GROUP;
    this.logStreamName = `${config.NODE_ENV}/${new Date().toISOString().split("T")[0]}/${Math.random()
      .toString(36)
      .substring(7)}`;
    this.logLevel = config.LOG_LEVEL;

    // Auto-flush logs every 5 seconds or when buffer reaches 50 messages
    this.flushInterval = setInterval(() => this.flush(), 5000);
  }

  /**
   * Set logging context
   * @param context - Context object to include in all logs
   */
  public setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear logging context
   */
  public clearContext(): void {
    this.context = {};
  }

  /**
   * Initialize log stream in CloudWatch
   */
  private async initializeLogStream(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const cloudWatch = getCloudWatchClient();

      // Check if log stream exists
      const describeResponse = await cloudWatch.send(
        new DescribeLogStreamsCommand({
          logGroupName: this.logGroupName,
          logStreamNamePrefix: this.logStreamName,
        })
      );

      if (!describeResponse.logStreams || describeResponse.logStreams.length === 0) {
        // Create log stream
        await cloudWatch.send(
          new CreateLogStreamCommand({
            logGroupName: this.logGroupName,
            logStreamName: this.logStreamName,
          })
        );
      }

      this.initialized = true;
    } catch (error) {
      // Log to console if CloudWatch initialization fails
      console.error("Failed to initialize CloudWatch log stream", error);
    }
  }

  /**
   * Format log message with context
   */
  private formatMessage(level: LogLevel, message: string, data?: any): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
      ...(data && { data }),
    });
  }

  /**
   * Log debug message
   */
  public debug(message: string, data?: any): void {
    if (
      this.logLevel === "DEBUG" ||
      this.logLevel === "INFO" ||
      this.logLevel === "WARN" ||
      this.logLevel === "ERROR"
    ) {
      this.logInternal("DEBUG", message, data);
    }
  }

  /**
   * Log info message
   */
  public info(message: string, data?: any): void {
    if (this.logLevel === "INFO" || this.logLevel === "WARN" || this.logLevel === "ERROR") {
      this.logInternal("INFO", message, data);
    }
  }

  /**
   * Log warning message
   */
  public warn(message: string, data?: any): void {
    if (this.logLevel === "WARN" || this.logLevel === "ERROR") {
      this.logInternal("WARN", message, data);
    }
  }

  /**
   * Log error message
   */
  public error(message: string, error?: Error | any, data?: any): void {
    const errorData = {
      message: error?.message || String(error),
      stack: error?.stack,
      ...data,
    };
    this.logInternal("ERROR", message, errorData);
  }

  /**
   * Internal logging method
   */
  private logInternal(level: LogLevel, message: string, data?: any): void {
    const formattedMessage = this.formatMessage(level, message, data);

    // Always log to console (CloudWatch will capture this)
    console.log(formattedMessage);

    // Also add to buffer for batch sending to CloudWatch
    this.logBuffer.push({
      timestamp: Date.now(),
      message: formattedMessage,
    });

    // Flush if buffer is large enough
    if (this.logBuffer.length >= 50) {
      this.flush();
    }
  }

  /**
   * Flush buffered logs to CloudWatch
   */
  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) {
      return;
    }

    try {
      await this.initializeLogStream();

      const cloudWatch = getCloudWatchClient();

      const logEvents = this.logBuffer.map((log) => ({
        timestamp: log.timestamp,
        message: log.message,
      }));

      await cloudWatch.send(
        new PutLogEventsCommand({
          logGroupName: this.logGroupName,
          logStreamName: this.logStreamName,
          logEvents,
        })
      );

      // Clear buffer after successful flush
      this.logBuffer = [];
    } catch (error) {
      // If flush fails, keep the logs in buffer for next attempt
      console.error("Failed to flush logs to CloudWatch", error);
    }
  }

  /**
   * Ensure logs are flushed before process exit
   */
  public async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    await this.flush();
  }
}

// Singleton instance
let logger: Logger | null = null;

/**
 * Get singleton logger instance
 */
export function getLogger(): Logger {
  if (!logger) {
    logger = new Logger();

    // Ensure logs are flushed on process exit
    process.on("exit", async () => {
      if (logger) {
        await logger.shutdown();
      }
    });
  }
  return logger;
}

/**
 * Reset logger (useful for testing)
 */
export function resetLogger(): void {
  logger = null;
}
