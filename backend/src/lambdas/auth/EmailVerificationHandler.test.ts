import { EmailVerificationHandler } from "./EmailVerificationHandler";
import { APIGatewayProxyEvent, Context } from "aws-lambda";

describe("EmailVerificationHandler", () => {
  let handler: EmailVerificationHandler;
  let mockContext: Partial<Context>;

  beforeEach(() => {
    process.env.AWS_REGION = "ap-southeast-1";
    process.env.DYNAMODB_TABLE_PREFIX = "utm";
    process.env.S3_BUCKET_NAME = "utm-bucket";
    process.env.COGNITO_POOL_ID = "ap-southeast-1_test123";
    process.env.COGNITO_USER_POOL_ID = "ap-southeast-1_test123";
    process.env.COGNITO_CLIENT_ID = "test-client-id";

    handler = new EmailVerificationHandler();
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

  describe("Request validation", () => {
    it("should reject request with missing email", async () => {
      const event = {
        body: JSON.stringify({
          verificationCode: "123456",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(400);
    });

    it("should reject request with missing verificationCode", async () => {
      const event = {
        body: JSON.stringify({
          email: "student@graduate.utm.my",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(400);
    });

    it("should handle invalid JSON", async () => {
      const event = {
        body: "invalid json",
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(500);
    });
  });

  describe("Email normalization", () => {
    it("should normalize email to lowercase", async () => {
      // Mock the Cognito and DynamoDB calls
      const mockConfirmSignUp = jest.fn().mockResolvedValue({});
      const mockQuery = jest.fn().mockResolvedValue({
        Items: [
          {
            userId: { S: "user123" },
            email: { S: "student@graduate.utm.my" },
            emailVerified: { BOOL: false },
            verificationStatus: { S: "Unverified" },
            fullName: { S: "John Doe" },
            role: { L: [{ S: "Buyer" }] },
          },
        ],
      });

      const mockUpdateItem = jest.fn().mockResolvedValue({
        Attributes: {
          userId: { S: "user123" },
          email: { S: "student@graduate.utm.my" },
          emailVerified: { BOOL: true },
          verificationStatus: { S: "Verified" },
          fullName: { S: "John Doe" },
          role: { L: [{ S: "Buyer" }] },
        },
      });

      (handler as any).cognito = {
        confirmSignUp: mockConfirmSignUp,
      };

      (handler as any).dynamodb = {
        query: mockQuery,
        updateItem: mockUpdateItem,
      };

      const event = {
        body: JSON.stringify({
          email: "STUDENT@GRADUATE.UTM.MY",
          verificationCode: "123456",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(200);
    });
  });

  describe("Response format", () => {
    it("should return correct response structure on success", async () => {
      const mockConfirmSignUp = jest.fn().mockResolvedValue({});
      const mockQuery = jest.fn().mockResolvedValue({
        Items: [
          {
            userId: { S: "user123" },
            email: { S: "student@graduate.utm.my" },
            emailVerified: { BOOL: false },
            verificationStatus: { S: "Unverified" },
            fullName: { S: "John Doe" },
            role: { L: [{ S: "Buyer" }] },
          },
        ],
      });

      const mockUpdateItem = jest.fn().mockResolvedValue({
        Attributes: {
          userId: { S: "user123" },
          email: { S: "student@graduate.utm.my" },
          emailVerified: { BOOL: true },
          verificationStatus: { S: "Verified" },
          fullName: { S: "John Doe" },
          role: { L: [{ S: "Buyer" }] },
        },
      });

      (handler as any).cognito = {
        confirmSignUp: mockConfirmSignUp,
      };

      (handler as any).dynamodb = {
        query: mockQuery,
        updateItem: mockUpdateItem,
      };

      const event = {
        body: JSON.stringify({
          email: "student@graduate.utm.my",
          verificationCode: "123456",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);

      expect(body).toHaveProperty("userId");
      expect(body).toHaveProperty("email");
      expect(body).toHaveProperty("fullName");
      expect(body).toHaveProperty("emailVerified");
      expect(body).toHaveProperty("verificationStatus");
      expect(body).toHaveProperty("role");
      expect(body.emailVerified).toBe(true);
    });
  });
});
