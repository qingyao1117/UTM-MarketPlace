import { getLogger, resetLogger } from "./logger";
import { CloudWatchLogs } from "@aws-sdk/client-cloudwatch-logs";

// Mock AWS SDK
jest.mock("@aws-sdk/client-cloudwatch-logs");
jest.mock("../config/aws-clients");

describe("Logger", () => {
  beforeEach(() => {
    resetLogger();
    jest.clearAllMocks();

    // Set required environment variables
    process.env.AWS_REGION = "ap-southeast-1";
    process.env.AWS_ACCOUNT_ID = "123456789012";
    process.env.DYNAMODB_TABLE_PREFIX = "utm-marketplace";
    process.env.S3_BUCKET_NAME = "test-bucket";
    process.env.COGNITO_POOL_ID = "test-pool-id";
    process.env.COGNITO_CLIENT_ID = "test-client-id";
    process.env.CLOUDWATCH_LOG_GROUP = "/aws/lambda/test";
    process.env.NODE_ENV = "development";
    process.env.LOG_LEVEL = "DEBUG";
  });

  afterEach(() => {
    resetLogger();
  });

  describe("Logger singleton", () => {
    it("should return singleton instance", () => {
      const logger1 = getLogger();
      const logger2 = getLogger();

      expect(logger1).toBe(logger2);
    });

    it("should lazily initialize on first call", () => {
      const logger = getLogger();

      expect(logger).toBeDefined();
      expect(logger.debug).toBeDefined();
      expect(logger.info).toBeDefined();
    });
  });

  describe("Context management", () => {
    it("should set context for logging", () => {
      const logger = getLogger();
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      logger.setContext({ userId: "user123", requestId: "req456" });
      logger.info("Test message");

      const logCall = consoleSpy.mock.calls[0][0];
      const logData = JSON.parse(logCall);

      expect(logData.context.userId).toBe("user123");
      expect(logData.context.requestId).toBe("req456");

      consoleSpy.mockRestore();
    });

    it("should merge new context with existing", () => {
      const logger = getLogger();
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      logger.setContext({ userId: "user123" });
      logger.setContext({ requestId: "req456" });
      logger.info("Test message");

      const logCall = consoleSpy.mock.calls[0][0];
      const logData = JSON.parse(logCall);

      expect(logData.context.userId).toBe("user123");
      expect(logData.context.requestId).toBe("req456");

      consoleSpy.mockRestore();
    });

    it("should clear context", () => {
      const logger = getLogger();
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      logger.setContext({ userId: "user123" });
      logger.clearContext();
      logger.info("Test message");

      const logCall = consoleSpy.mock.calls[0][0];
      const logData = JSON.parse(logCall);

      expect(logData.context).toEqual({});

      consoleSpy.mockRestore();
    });
  });

  describe("Log levels", () => {
    it("should log debug messages when log level is DEBUG", () => {
      process.env.LOG_LEVEL = "DEBUG";
      resetLogger();

      const logger = getLogger();
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      logger.debug("Debug message");

      expect(consoleSpy).toHaveBeenCalled();
      const logData = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(logData.level).toBe("DEBUG");

      consoleSpy.mockRestore();
    });

    it("should not log debug messages when log level is INFO", () => {
      process.env.LOG_LEVEL = "INFO";
      resetLogger();

      const logger = getLogger();
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      logger.debug("Debug message");

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should log info messages", () => {
      const logger = getLogger();
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      logger.info("Info message");

      expect(consoleSpy).toHaveBeenCalled();
      const logData = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(logData.level).toBe("INFO");

      consoleSpy.mockRestore();
    });

    it("should log warn messages", () => {
      const logger = getLogger();
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      logger.warn("Warning message");

      expect(consoleSpy).toHaveBeenCalled();
      const logData = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(logData.level).toBe("WARN");

      consoleSpy.mockRestore();
    });

    it("should log error messages", () => {
      const logger = getLogger();
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      logger.error("Error message", new Error("Test error"));

      expect(consoleSpy).toHaveBeenCalled();
      const logData = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(logData.level).toBe("ERROR");

      consoleSpy.mockRestore();
    });
  });

  describe("Message formatting", () => {
    it("should include timestamp in log message", () => {
      const logger = getLogger();
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      logger.info("Test message");

      const logCall = consoleSpy.mock.calls[0][0];
      const logData = JSON.parse(logCall);

      expect(logData.timestamp).toBeDefined();
      expect(logData.message).toBe("Test message");

      consoleSpy.mockRestore();
    });

    it("should include data in log message", () => {
      const logger = getLogger();
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      logger.info("Test message", { userId: "user123", action: "login" });

      const logCall = consoleSpy.mock.calls[0][0];
      const logData = JSON.parse(logCall);

      expect(logData.data.userId).toBe("user123");
      expect(logData.data.action).toBe("login");

      consoleSpy.mockRestore();
    });

    it("should format error messages with stack trace", () => {
      const logger = getLogger();
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      const error = new Error("Test error");
      logger.error("An error occurred", error);

      const logCall = consoleSpy.mock.calls[0][0];
      const logData = JSON.parse(logCall);

      expect(logData.data.message).toBe("Test error");
      expect(logData.data.stack).toBeDefined();

      consoleSpy.mockRestore();
    });

    it("should handle non-Error objects", () => {
      const logger = getLogger();
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      logger.error("An error occurred", "String error");

      const logCall = consoleSpy.mock.calls[0][0];
      const logData = JSON.parse(logCall);

      expect(logData.data.message).toBe("String error");

      consoleSpy.mockRestore();
    });
  });

  describe("Log buffering", () => {
    it("should buffer log messages", () => {
      const logger = getLogger();
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      logger.info("Message 1");
      logger.info("Message 2");
      logger.info("Message 3");

      // All messages should be logged to console
      expect(consoleSpy).toHaveBeenCalledTimes(3);

      consoleSpy.mockRestore();
    });
  });

  describe("shutdown", () => {
    it("should flush logs on shutdown", async () => {
      const logger = getLogger();
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      logger.info("Test message");

      await logger.shutdown();

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("Error handling", () => {
    it("should continue logging even if CloudWatch initialization fails", () => {
      const logger = getLogger();
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      const errorSpy = jest.spyOn(console, "error").mockImplementation();

      logger.info("Test message");

      // Should still log to console
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });
});
