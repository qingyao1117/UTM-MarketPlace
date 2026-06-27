import { WebSocketBaseHandler } from "./WebSocketBaseHandler";
import { APIGatewayEvent } from "aws-lambda";

/**
 * Concrete implementation of WebSocketBaseHandler for testing
 */
class TestWebSocketHandler extends WebSocketBaseHandler {
  async handle(event: APIGatewayEvent) {
    this.log("INFO", "WebSocket event processed");
    return this.handleSuccess();
  }
}

describe("WebSocketBaseHandler", () => {
  let handler: TestWebSocketHandler;

  const mockWebSocketEvent: Partial<APIGatewayEvent> = {
    requestContext: {
      routeKey: "$default",
      eventType: "MESSAGE",
      extendedRequestId: "test-id",
      requestTime: "15/Jan/2024:10:30:45 +0000",
      messageDirection: "IN",
      stage: "prod",
      connectedAt: 1705320645000,
      requestTimeEpoch: 1705320645123,
      identity: {
        sourceIp: "192.168.1.1",
      },
      requestId: "test-request-id",
      connectionId: "test-connection-id",
      messageId: "test-message-id",
      disconnectType: undefined,
      disconnectReason: undefined,
      authorizer: {},
      apiId: "test-api-id",
    },
    body: JSON.stringify({ message: "Hello" }),
    isBase64Encoded: false,
  };

  beforeEach(() => {
    // Set required environment variables
    process.env.AWS_REGION = "ap-southeast-1";
    process.env.DYNAMODB_TABLE_PREFIX = "utm-marketplace";
    process.env.S3_BUCKET_NAME = "test-bucket";
    process.env.COGNITO_POOL_ID = "test-pool-id";

    handler = new TestWebSocketHandler();
  });

  describe("Environment variable handling", () => {
    it("should load required environment variables on initialization", () => {
      expect(handler.environment.AWS_REGION).toBe("ap-southeast-1");
      expect(handler.environment.DYNAMODB_TABLE_PREFIX).toBe("utm-marketplace");
      expect(handler.environment.S3_BUCKET_NAME).toBe("test-bucket");
      expect(handler.environment.COGNITO_POOL_ID).toBe("test-pool-id");
    });

    it("should throw error if required environment variable is missing", () => {
      delete process.env.COGNITO_POOL_ID;

      expect(() => {
        new TestWebSocketHandler();
      }).toThrow("Environment variable COGNITO_POOL_ID is not set");
    });
  });

  describe("Connection ID extraction", () => {
    it("should extract connection ID from event", () => {
      const connectionId = handler.getConnectionId(mockWebSocketEvent as APIGatewayEvent);

      expect(connectionId).toBe("test-connection-id");
    });

    it("should return empty string if connection ID not available", () => {
      const event = {
        requestContext: {
          ...mockWebSocketEvent.requestContext,
          connectionId: undefined,
        },
      } as Partial<APIGatewayEvent>;

      const connectionId = handler.getConnectionId(event as APIGatewayEvent);

      expect(connectionId).toBe("");
    });
  });

  describe("Route key extraction", () => {
    it("should extract route key $default", () => {
      const routeKey = handler.getRouteKey(mockWebSocketEvent as APIGatewayEvent);

      expect(routeKey).toBe("$default");
    });

    it("should extract route key $connect", () => {
      const event = {
        requestContext: {
          ...mockWebSocketEvent.requestContext,
          routeKey: "$connect",
        },
      } as Partial<APIGatewayEvent>;

      const routeKey = handler.getRouteKey(event as APIGatewayEvent);

      expect(routeKey).toBe("$connect");
    });

    it("should extract route key $disconnect", () => {
      const event = {
        requestContext: {
          ...mockWebSocketEvent.requestContext,
          routeKey: "$disconnect",
        },
      } as Partial<APIGatewayEvent>;

      const routeKey = handler.getRouteKey(event as APIGatewayEvent);

      expect(routeKey).toBe("$disconnect");
    });

    it("should return undefined if route key not available", () => {
      const event = {
        requestContext: {
          ...mockWebSocketEvent.requestContext,
          routeKey: undefined,
        },
      } as Partial<APIGatewayEvent>;

      const routeKey = handler.getRouteKey(event as APIGatewayEvent);

      expect(routeKey).toBeUndefined();
    });
  });

  describe("Request body parsing", () => {
    it("should parse JSON body", () => {
      const body = JSON.stringify({ message: "Hello", userId: "user123" });
      const parsed = handler.parseBody(body);

      expect(parsed.message).toBe("Hello");
      expect(parsed.userId).toBe("user123");
    });

    it("should return null for null body", () => {
      const parsed = handler.parseBody(null);

      expect(parsed).toBeNull();
    });

    it("should return null for empty string body", () => {
      const parsed = handler.parseBody("");

      expect(parsed).toBeNull();
    });

    it("should handle invalid JSON gracefully", () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      const body = "not valid json";
      const parsed = handler.parseBody(body);

      expect(parsed).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should handle complex JSON structures", () => {
      const body = JSON.stringify({
        chatChannelId: "channel123",
        messageId: "msg456",
        text: "Hello",
        metadata: {
          timestamp: 1705320645123,
          sender: "user123",
        },
      });

      const parsed = handler.parseBody(body);

      expect(parsed.chatChannelId).toBe("channel123");
      expect(parsed.messageId).toBe("msg456");
      expect(parsed.metadata.sender).toBe("user123");
    });
  });

  describe("Response handling", () => {
    it("should return successful response", () => {
      const response = handler.handleSuccess();

      expect(response.statusCode).toBe(200);
    });

    it("should return successful response with custom status code", () => {
      const response = handler.handleSuccess(201);

      expect(response.statusCode).toBe(201);
    });

    it("should return error response", () => {
      const error = new Error("Connection failed");
      const response = handler.handleError(error);

      expect(response.statusCode).toBe(500);
    });

    it("should return error response with connection ID", () => {
      const error = new Error("Message delivery failed");
      const response = handler.handleError(error, "conn123");

      expect(response.statusCode).toBe(500);
    });

    it("should handle non-Error objects", () => {
      const response = handler.handleError("String error");

      expect(response.statusCode).toBe(500);
    });
  });

  describe("Logging", () => {
    it("should log info messages", () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      handler.log("INFO", "WebSocket connected", { connectionId: "conn123" });

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0][0];
      const logData = JSON.parse(logCall);

      expect(logData.level).toBe("INFO");
      expect(logData.message).toBe("WebSocket connected");
      expect(logData.data.connectionId).toBe("conn123");

      consoleSpy.mockRestore();
    });

    it("should log error messages", () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      handler.log("ERROR", "WebSocket error", { error: "Connection timeout" });

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0][0];
      const logData = JSON.parse(logCall);

      expect(logData.level).toBe("ERROR");
      expect(logData.data.error).toBe("Connection timeout");

      consoleSpy.mockRestore();
    });
  });

  describe("WebSocket lifecycle", () => {
    it("should handle $connect route", () => {
      const event = {
        ...mockWebSocketEvent,
        requestContext: {
          ...mockWebSocketEvent.requestContext,
          routeKey: "$connect",
        },
      } as Partial<APIGatewayEvent>;

      const routeKey = handler.getRouteKey(event as APIGatewayEvent);

      expect(routeKey).toBe("$connect");
    });

    it("should handle $disconnect route", () => {
      const event = {
        ...mockWebSocketEvent,
        requestContext: {
          ...mockWebSocketEvent.requestContext,
          routeKey: "$disconnect",
        },
      } as Partial<APIGatewayEvent>;

      const routeKey = handler.getRouteKey(event as APIGatewayEvent);

      expect(routeKey).toBe("$disconnect");
    });

    it("should handle $default route with message body", () => {
      const event = {
        ...mockWebSocketEvent,
        requestContext: {
          ...mockWebSocketEvent.requestContext,
          routeKey: "$default",
        },
        body: JSON.stringify({ action: "sendMessage", text: "Hello" }),
      } as Partial<APIGatewayEvent>;

      const routeKey = handler.getRouteKey(event as APIGatewayEvent);
      const body = handler.parseBody(event.body);

      expect(routeKey).toBe("$default");
      expect(body.action).toBe("sendMessage");
    });
  });

  describe("Integration scenarios", () => {
    it("should handle complete WebSocket message flow", () => {
      const event = {
        ...mockWebSocketEvent,
        requestContext: {
          ...mockWebSocketEvent.requestContext,
          routeKey: "$default",
          connectionId: "conn123",
        },
        body: JSON.stringify({
          chatChannelId: "channel456",
          messageText: "Hello from user",
          senderId: "user789",
        }),
      } as Partial<APIGatewayEvent>;

      const connectionId = handler.getConnectionId(event as APIGatewayEvent);
      const routeKey = handler.getRouteKey(event as APIGatewayEvent);
      const body = handler.parseBody(event.body);

      expect(connectionId).toBe("conn123");
      expect(routeKey).toBe("$default");
      expect(body.chatChannelId).toBe("channel456");
      expect(body.messageText).toBe("Hello from user");
    });
  });
});
