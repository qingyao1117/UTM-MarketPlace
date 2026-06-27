import { BuyerRoleAssignmentHandler } from "./BuyerRoleAssignmentHandler";
import { APIGatewayProxyEvent, Context } from "aws-lambda";
import * as dynamoDBSDK from "@aws-sdk/lib-dynamodb";

/**
 * Unit tests for Buyer Role Assignment Lambda Handler
 * Tests: 2.3 Implement default Buyer role assignment
 * Requirements: 2.1, 2.2
 */
describe("BuyerRoleAssignmentHandler", () => {
  let handler: BuyerRoleAssignmentHandler;
  let mockContext: Partial<Context>;
  let mockDynamoDBSend: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    jest.spyOn(console, "log").mockImplementation(() => {});

    // Mock DynamoDB client
    mockDynamoDBSend = jest.fn();
    jest.spyOn(dynamoDBSDK, "UpdateCommand").mockImplementation((params: any) => {
      return {
        send: mockDynamoDBSend,
      } as any;
    });

    handler = new BuyerRoleAssignmentHandler();
    mockContext = {
      functionName: "BuyerRoleAssignmentHandler",
      memoryLimitInMB: 128,
      awsRequestId: "test-request-id",
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Successful role assignment", () => {
    beforeEach(() => {
      mockDynamoDBSend.mockResolvedValue({
        Attributes: {
          userId: "test-user-id",
          role: ["Buyer"],
          roleAssignedAt: new Date().toISOString(),
        },
      });
    });

    it("should successfully assign Buyer role to new user", async () => {
      const event = {
        body: JSON.stringify({
          userId: "user-123",
        }),
      } as any;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.role).toBe("Buyer");
      expect(body.userId).toBe("user-123");
    });

    it("should return proper buyer permissions", async () => {
      const event = {
        body: JSON.stringify({
          userId: "user-123",
        }),
      } as any;

      const result = await handler.handle(event, mockContext as Context);

      const body = JSON.parse(result.body);
      expect(body.permissions).toBeDefined();
      expect(body.permissions.canBrowse).toBe(true);
      expect(body.permissions.canPlaceOrders).toBe(true);
      expect(body.permissions.canBookRides).toBe(true);
      expect(body.permissions.canListItems).toBe(false);
      expect(body.permissions.canAcceptOrders).toBe(false);
      expect(body.permissions.canOfferRides).toBe(false);
    });

    it("should include roleAssignedAt timestamp", async () => {
      const event = {
        body: JSON.stringify({
          userId: "user-123",
        }),
      } as any;

      const result = await handler.handle(event, mockContext as Context);

      const body = JSON.parse(result.body);
      expect(body.roleAssignedAt).toBeDefined();
      expect(new Date(body.roleAssignedAt).getTime()).toBeGreaterThan(0);
    });

    it("should call DynamoDB update command", async () => {
      const event = {
        body: JSON.stringify({
          userId: "user-123",
        }),
      } as any;

      await handler.handle(event, mockContext as Context);

      expect(mockDynamoDBSend).toHaveBeenCalled();
    });
  });

  describe("Buyer role permissions", () => {
    beforeEach(() => {
      mockDynamoDBSend.mockResolvedValue({
        Attributes: {
          userId: "user-123",
          role: ["Buyer"],
        },
      });
    });

    it("should allow browse actions", async () => {
      const event = {
        body: JSON.stringify({
          userId: "user-123",
        }),
      } as any;

      const result = await handler.handle(event, mockContext as Context);

      const body = JSON.parse(result.body);
      expect(body.permissions.canBrowse).toBe(true);
    });

    it("should allow order placement", async () => {
      const event = {
        body: JSON.stringify({
          userId: "user-123",
        }),
      } as any;

      const result = await handler.handle(event, mockContext as Context);

      const body = JSON.parse(result.body);
      expect(body.permissions.canPlaceOrders).toBe(true);
    });

    it("should allow ride booking", async () => {
      const event = {
        body: JSON.stringify({
          userId: "user-123",
        }),
      } as any;

      const result = await handler.handle(event, mockContext as Context);

      const body = JSON.parse(result.body);
      expect(body.permissions.canBookRides).toBe(true);
    });

    it("should prevent item listing (seller action)", async () => {
      const event = {
        body: JSON.stringify({
          userId: "user-123",
        }),
      } as any;

      const result = await handler.handle(event, mockContext as Context);

      const body = JSON.parse(result.body);
      expect(body.permissions.canListItems).toBe(false);
    });

    it("should prevent accepting orders (seller action)", async () => {
      const event = {
        body: JSON.stringify({
          userId: "user-123",
        }),
      } as any;

      const result = await handler.handle(event, mockContext as Context);

      const body = JSON.parse(result.body);
      expect(body.permissions.canAcceptOrders).toBe(false);
    });

    it("should prevent offering rides (driver action)", async () => {
      const event = {
        body: JSON.stringify({
          userId: "user-123",
        }),
      } as any;

      const result = await handler.handle(event, mockContext as Context);

      const body = JSON.parse(result.body);
      expect(body.permissions.canOfferRides).toBe(false);
    });
  });

  describe("Missing required fields", () => {
    it("should reject request missing userId", async () => {
      const event = {
        body: JSON.stringify({}),
      } as any;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toContain("userId");
    });

    it("should reject request with null userId", async () => {
      const event = {
        body: JSON.stringify({
          userId: null,
        }),
      } as any;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toContain("userId");
    });

    it("should reject empty body", async () => {
      const event = {
        body: JSON.stringify({}),
      } as any;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(400);
    });
  });

  describe("Response format", () => {
    beforeEach(() => {
      mockDynamoDBSend.mockResolvedValue({
        Attributes: {
          userId: "user-123",
          role: ["Buyer"],
          roleAssignedAt: new Date().toISOString(),
        },
      });
    });

    it("should include userId in response", async () => {
      const event = {
        body: JSON.stringify({
          userId: "user-123",
        }),
      } as any;

      const result = await handler.handle(event, mockContext as Context);

      const body = JSON.parse(result.body);
      expect(body.userId).toBe("user-123");
    });

    it("should include role in response", async () => {
      const event = {
        body: JSON.stringify({
          userId: "user-123",
        }),
      } as any;

      const result = await handler.handle(event, mockContext as Context);

      const body = JSON.parse(result.body);
      expect(body.role).toBe("Buyer");
    });

    it("should include timestamp in response", async () => {
      const event = {
        body: JSON.stringify({
          userId: "user-123",
        }),
      } as any;

      const result = await handler.handle(event, mockContext as Context);

      const body = JSON.parse(result.body);
      expect(body.timestamp).toBeDefined();
    });

    it("should set correct content-type header", async () => {
      const event = {
        body: JSON.stringify({
          userId: "user-123",
        }),
      } as any;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.headers["Content-Type"]).toBe("application/json");
    });

    it("should return 201 status code", async () => {
      const event = {
        body: JSON.stringify({
          userId: "user-123",
        }),
      } as any;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(200);
    });
  });

  describe("Error handling", () => {
    it("should handle DynamoDB errors gracefully", async () => {
      mockDynamoDBSend.mockRejectedValue(
        new Error("DynamoDB connection failed")
      );

      const event = {
        body: JSON.stringify({
          userId: "user-123",
        }),
      } as any;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(500);
    });

    it("should handle invalid JSON in request body", async () => {
      const event = {
        body: "invalid json",
      } as any;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBeGreaterThanOrEqual(400);
    });
  });
});
