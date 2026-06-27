import { BaseHandler } from "./BaseHandler";
import { APIGatewayProxyEvent, Context } from "aws-lambda";

/**
 * Concrete implementation of BaseHandler for testing
 */
class TestHandler extends BaseHandler {
  async handle(event: APIGatewayProxyEvent, context: Context) {
    this.log("INFO", "Test handler called");
    return this.handleSuccess({ message: "Test successful" });
  }
}

describe("BaseHandler", () => {
  let handler: TestHandler;
  const mockEvent: Partial<APIGatewayProxyEvent> = {
    body: JSON.stringify({ email: "test@graduate.utm.my", password: "password123" }),
    pathParameters: { id: "test-id" },
    queryStringParameters: { page: "1" },
    httpMethod: "POST",
    path: "/test",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const mockContext: Partial<Context> = {
    functionName: "test-function",
    functionVersion: "$LATEST",
    invokeid: "test-invocation-id",
    memoryLimitInMB: "128",
    awsRequestId: "test-request-id",
    logGroupName: "/aws/lambda/test",
    logStreamName: "2024/01/15/[$LATEST]test",
    identity: {},
    clientContext: {},
  };

  beforeEach(() => {
    // Set required environment variables
    process.env.AWS_REGION = "ap-southeast-1";
    process.env.DYNAMODB_TABLE_PREFIX = "utm-marketplace";
    process.env.S3_BUCKET_NAME = "test-bucket";
    process.env.COGNITO_POOL_ID = "test-pool-id";

    handler = new TestHandler();
  });

  describe("Environment variable handling", () => {
    it("should throw error if required environment variable is missing", () => {
      delete process.env.COGNITO_POOL_ID;

      expect(() => {
        new TestHandler();
      }).toThrow("Environment variable COGNITO_POOL_ID is not set");
    });

    it("should load all required environment variables on initialization", () => {
      expect(handler.environment.AWS_REGION).toBe("ap-southeast-1");
      expect(handler.environment.DYNAMODB_TABLE_PREFIX).toBe("utm-marketplace");
      expect(handler.environment.S3_BUCKET_NAME).toBe("test-bucket");
      expect(handler.environment.COGNITO_POOL_ID).toBe("test-pool-id");
    });
  });

  describe("Request body validation", () => {
    it("should validate required fields present", () => {
      const body = JSON.stringify({ email: "test@graduate.utm.my", password: "password123" });

      const result = handler.validateRequestBody(body, ["email", "password"]);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should return error for missing required fields", () => {
      const body = JSON.stringify({ email: "test@graduate.utm.my" });

      const result = handler.validateRequestBody(body, ["email", "password"]);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Required field missing: password");
    });

    it("should return error if body is null", () => {
      const result = handler.validateRequestBody(null, ["email"]);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Request body is required");
    });

    it("should handle already parsed objects", () => {
      const body = { email: "test@graduate.utm.my", password: "password123" };

      const result = handler.validateRequestBody(body, ["email", "password"]);

      expect(result.valid).toBe(true);
    });
  });

  describe("Response handling", () => {
    it("should return successful response", () => {
      const response = handler.handleSuccess({ data: "test" });

      expect(response.statusCode).toBe(200);
      expect(response.headers).toEqual({ "Content-Type": "application/json" });
      expect(JSON.parse(response.body)).toEqual({ data: "test" });
    });

    it("should return successful response with custom status code", () => {
      const response = handler.handleSuccess({ id: "123" }, 201);

      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual({ id: "123" });
    });

    it("should return error response", () => {
      const error = new Error("Test error");
      const response = handler.handleError(error);

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body).error).toBe("Test error");
    });

    it("should return error response with custom status code", () => {
      const error = new Error("Invalid input");
      const response = handler.handleError(error, 400);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error).toBe("Invalid input");
    });

    it("should handle non-Error objects as errors", () => {
      const response = handler.handleError("String error");

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body).error).toBe("String error");
    });
  });

  describe("Parameter extraction", () => {
    it("should extract path parameter", () => {
      const param = handler.getPathParameter(mockEvent as APIGatewayProxyEvent, "id");

      expect(param).toBe("test-id");
    });

    it("should return undefined for missing path parameter", () => {
      const param = handler.getPathParameter(mockEvent as APIGatewayProxyEvent, "missing");

      expect(param).toBeUndefined();
    });

    it("should extract query parameter", () => {
      const param = handler.getQueryParameter(mockEvent as APIGatewayProxyEvent, "page");

      expect(param).toBe("1");
    });

    it("should return undefined for missing query parameter", () => {
      const param = handler.getQueryParameter(mockEvent as APIGatewayProxyEvent, "missing");

      expect(param).toBeUndefined();
    });
  });

  describe("Logging", () => {
    it("should log info messages", () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      handler.log("INFO", "Test message", { data: "test" });

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0][0];
      const logData = JSON.parse(logCall);

      expect(logData.level).toBe("INFO");
      expect(logData.message).toBe("Test message");
      expect(logData.data.data).toBe("test");

      consoleSpy.mockRestore();
    });

    it("should log error messages", () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      handler.log("ERROR", "Error occurred", { code: "ERR_001" });

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0][0];
      const logData = JSON.parse(logCall);

      expect(logData.level).toBe("ERROR");
      expect(logData.message).toBe("Error occurred");

      consoleSpy.mockRestore();
    });
  });
});
