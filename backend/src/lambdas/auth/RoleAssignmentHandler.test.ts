import { RoleAssignmentHandler } from "./RoleAssignmentHandler";
import { APIGatewayProxyEvent, Context } from "aws-lambda";

describe("RoleAssignmentHandler", () => {
  let handler: RoleAssignmentHandler;
  let mockContext: Partial<Context>;

  beforeEach(() => {
    process.env.AWS_REGION = "ap-southeast-1";
    process.env.DYNAMODB_TABLE_PREFIX = "utm";
    process.env.S3_BUCKET_NAME = "utm-bucket";
    process.env.COGNITO_POOL_ID = "ap-southeast-1_test123";

    handler = new RoleAssignmentHandler();
    mockContext = {
      requestId: "test-request-id",
      awsRequestId: "aws-request-id",
      invokedFunctionArn:
        "arn:aws:lambda:ap-southeast-1:123456789012:function:test",
      memoryLimitInMB: "128",
      functionVersion: "$LATEST",
      functionName: "test-function",
      logGroupName: "/aws/lambda/test",
      logStreamName: "2024/01/01/[$LATEST]test",
      getRemainingTimeInMillis: () => 30000,
      succeed: () => {},
      fail: () => {},
      done: () => {},
    };
  });

  describe("Role verification", () => {
    it("should verify user has Buyer role", async () => {
      const mockGetItem = jest.fn().mockResolvedValue({
        Item: {
          userId: { S: "user123" },
          role: { L: [{ S: "Buyer" }] },
        },
      });

      (handler as any).dynamodb = {
        getItem: mockGetItem,
      };

      const event = {
        body: JSON.stringify({
          userId: "user123",
          action: "verify",
          requiredRole: "Buyer",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.hasRole).toBe(true);
      expect(body.canPerformBuyerActions).toBe(true);
    });

    it("should return 403 if user does not have required role", async () => {
      const mockGetItem = jest.fn().mockResolvedValue({
        Item: {
          userId: { S: "user123" },
          role: { L: [{ S: "Buyer" }] },
        },
      });

      (handler as any).dynamodb = {
        getItem: mockGetItem,
      };

      const event = {
        body: JSON.stringify({
          userId: "user123",
          action: "verify",
          requiredRole: "Seller",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(403);
    });

    it("should verify Buyer cannot perform provider actions", async () => {
      const mockGetItemCalls = [
        // First call for Buyer role check
        {
          Item: {
            userId: { S: "user123" },
            role: { L: [{ S: "Buyer" }] },
          },
        },
        // Second call for Provider role check
        {
          Item: {
            userId: { S: "user123" },
            role: { L: [{ S: "Buyer" }] },
          },
        },
      ];

      let callIndex = 0;
      const mockGetItem = jest.fn().mockImplementation(() => {
        return Promise.resolve(mockGetItemCalls[callIndex++]);
      });

      (handler as any).dynamodb = {
        getItem: mockGetItem,
      };

      const event = {
        body: JSON.stringify({
          userId: "user123",
          action: "verify",
          requiredRole: "Buyer",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.canPerformBuyerActions).toBe(true);
      expect(body.canPerformProviderActions).toBe(false);
    });
  });

  describe("Role assignment", () => {
    it("should assign new role to user", async () => {
      const mockGetItem = jest.fn().mockResolvedValue({
        Item: {
          userId: { S: "user123" },
          role: { L: [{ S: "Buyer" }] },
        },
      });

      const mockUpdateItem = jest.fn().mockResolvedValue({
        Attributes: {
          userId: { S: "user123" },
          role: { L: [{ S: "Buyer" }, { S: "Seller" }] },
        },
      });

      (handler as any).dynamodb = {
        getItem: mockGetItem,
        updateItem: mockUpdateItem,
      };

      const event = {
        body: JSON.stringify({
          userId: "user123",
          action: "assign",
          newRole: "Seller",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.roles).toContain("Seller");
      expect(body.newRole).toBe("Seller");
    });

    it("should not duplicate role if user already has it", async () => {
      const mockGetItem = jest.fn().mockResolvedValue({
        Item: {
          userId: { S: "user123" },
          role: { L: [{ S: "Buyer" }, { S: "Seller" }] },
        },
      });

      (handler as any).dynamodb = {
        getItem: mockGetItem,
      };

      const event = {
        body: JSON.stringify({
          userId: "user123",
          action: "assign",
          newRole: "Seller",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(200);
    });

    it("should support assigning multiple provider roles", async () => {
      const mockGetItem = jest.fn().mockResolvedValue({
        Item: {
          userId: { S: "user123" },
          role: { L: [{ S: "Buyer" }, { S: "Seller" }] },
        },
      });

      const mockUpdateItem = jest.fn().mockResolvedValue({
        Attributes: {
          userId: { S: "user123" },
          role: { L: [{ S: "Buyer" }, { S: "Seller" }, { S: "Driver" }] },
        },
      });

      (handler as any).dynamodb = {
        getItem: mockGetItem,
        updateItem: mockUpdateItem,
      };

      const event = {
        body: JSON.stringify({
          userId: "user123",
          action: "assign",
          newRole: "Driver",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.roles).toContain("Driver");
    });
  });

  describe("Request validation", () => {
    it("should reject request with missing userId", async () => {
      const event = {
        body: JSON.stringify({
          action: "verify",
          requiredRole: "Buyer",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(400);
    });

    it("should reject request with missing action", async () => {
      const event = {
        body: JSON.stringify({
          userId: "user123",
          requiredRole: "Buyer",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(400);
    });

    it("should reject request with invalid action", async () => {
      const event = {
        body: JSON.stringify({
          userId: "user123",
          action: "invalid",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(400);
    });

    it("should reject verify action without requiredRole", async () => {
      const event = {
        body: JSON.stringify({
          userId: "user123",
          action: "verify",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(400);
    });

    it("should reject assign action without newRole", async () => {
      const event = {
        body: JSON.stringify({
          userId: "user123",
          action: "assign",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(400);
    });
  });

  describe("Error handling", () => {
    it("should handle user not found", async () => {
      const mockGetItem = jest.fn().mockResolvedValue({
        Item: null,
      });

      (handler as any).dynamodb = {
        getItem: mockGetItem,
      };

      const event = {
        body: JSON.stringify({
          userId: "nonexistent",
          action: "verify",
          requiredRole: "Buyer",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(403);
    });
  });
});
