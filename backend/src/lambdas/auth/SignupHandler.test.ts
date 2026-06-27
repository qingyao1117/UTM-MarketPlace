import { SignupHandler } from "./SignupHandler";
import { APIGatewayProxyEvent, Context } from "aws-lambda";
import {
  CognitoIdentityServiceProvider,
} from "@aws-sdk/client-cognito-identity-service-provider";
import { DynamoDB } from "@aws-sdk/client-dynamodb";

// Mock AWS SDK clients
jest.mock("@aws-sdk/client-cognito-identity-service-provider");
jest.mock("@aws-sdk/client-dynamodb");

describe("SignupHandler", () => {
  let handler: SignupHandler;
  let mockContext: Partial<Context>;
  let mockCognito: jest.Mocked<CognitoIdentityServiceProvider>;
  let mockDynamoDB: jest.Mocked<DynamoDB>;

  beforeEach(() => {
    // Set up environment variables
    process.env.AWS_REGION = "ap-southeast-1";
    process.env.DYNAMODB_TABLE_PREFIX = "utm";
    process.env.S3_BUCKET_NAME = "utm-bucket";
    process.env.COGNITO_POOL_ID = "ap-southeast-1_test123";
    process.env.COGNITO_USER_POOL_ID = "ap-southeast-1_test123";

    handler = new SignupHandler();
    mockContext = {
      requestId: "test-request-id",
      awsRequestId: "aws-request-id",
      invokedFunctionArn: "arn:aws:lambda:ap-southeast-1:123456789012:function:test",
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

    mockCognito = CognitoIdentityServiceProvider as jest.Mocked<typeof CognitoIdentityServiceProvider>;
    mockDynamoDB = DynamoDB as jest.Mocked<typeof DynamoDB>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Valid signup", () => {
    it("should create user with valid UTM email", async () => {
      const mockAdminCreateUser = jest.fn().mockResolvedValue({
        User: {
          Username: "user123",
          Attributes: [{ Name: "email", Value: "student@graduate.utm.my" }],
        },
      });

      const mockAdminSetUserPassword = jest.fn().mockResolvedValue({});
      const mockPutItem = jest.fn().mockResolvedValue({});

      // Mock instance methods
      (handler as any).cognito = {
        adminCreateUser: mockAdminCreateUser,
        adminSetUserPassword: mockAdminSetUserPassword,
      };

      (handler as any).dynamodb = {
        putItem: mockPutItem,
      };

      const event = {
        body: JSON.stringify({
          email: "student@graduate.utm.my",
          password: "SecurePass123!",
          fullName: "John Doe",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body);
      expect(body.userId).toBe("user123");
      expect(body.email).toBe("student@graduate.utm.my");
      expect(body.role).toBe("Buyer");
      expect(body.verificationStatus).toBe("pending_email");
    });

    it("should normalize email to lowercase", async () => {
      const mockAdminCreateUser = jest.fn().mockResolvedValue({
        User: { Username: "user123" },
      });

      const mockAdminSetUserPassword = jest.fn().mockResolvedValue({});
      const mockPutItem = jest.fn().mockResolvedValue({});

      (handler as any).cognito = {
        adminCreateUser: mockAdminCreateUser,
        adminSetUserPassword: mockAdminSetUserPassword,
      };

      (handler as any).dynamodb = {
        putItem: mockPutItem,
      };

      const event = {
        body: JSON.stringify({
          email: "STUDENT@GRADUATE.UTM.MY",
          password: "SecurePass123!",
          fullName: "John Doe",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body);
      expect(body.email).toBe("student@graduate.utm.my");
    });

    it("should accept @utm.my domain", async () => {
      const mockAdminCreateUser = jest.fn().mockResolvedValue({
        User: { Username: "user123" },
      });

      const mockAdminSetUserPassword = jest.fn().mockResolvedValue({});
      const mockPutItem = jest.fn().mockResolvedValue({});

      (handler as any).cognito = {
        adminCreateUser: mockAdminCreateUser,
        adminSetUserPassword: mockAdminSetUserPassword,
      };

      (handler as any).dynamodb = {
        putItem: mockPutItem,
      };

      const event = {
        body: JSON.stringify({
          email: "faculty@utm.my",
          password: "SecurePass123!",
          fullName: "Dr. Jane Doe",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(201);
    });
  });

  describe("Email validation", () => {
    it("should reject non-UTM email", async () => {
      const event = {
        body: JSON.stringify({
          email: "student@gmail.com",
          password: "SecurePass123!",
          fullName: "John Doe",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toContain("Email domain must be");
    });

    it("should reject hotmail email", async () => {
      const event = {
        body: JSON.stringify({
          email: "student@hotmail.com",
          password: "SecurePass123!",
          fullName: "John Doe",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(400);
    });
  });

  describe("Duplicate email handling", () => {
    it("should handle duplicate email gracefully", async () => {
      const mockAdminCreateUser = jest.fn().mockRejectedValue({
        name: "UsernameExistsException",
        message: "User already exists",
      });

      (handler as any).cognito = {
        adminCreateUser: mockAdminCreateUser,
      };

      const event = {
        body: JSON.stringify({
          email: "student@graduate.utm.my",
          password: "SecurePass123!",
          fullName: "John Doe",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(409);
    });
  });

  describe("Request validation", () => {
    it("should reject request with missing email", async () => {
      const event = {
        body: JSON.stringify({
          password: "SecurePass123!",
          fullName: "John Doe",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toContain("Required field missing");
    });

    it("should reject request with missing password", async () => {
      const event = {
        body: JSON.stringify({
          email: "student@graduate.utm.my",
          fullName: "John Doe",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(400);
    });

    it("should reject request with missing fullName", async () => {
      const event = {
        body: JSON.stringify({
          email: "student@graduate.utm.my",
          password: "SecurePass123!",
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

  describe("Role assignment", () => {
    it("should assign Buyer role to new user", async () => {
      const mockAdminCreateUser = jest.fn().mockResolvedValue({
        User: { Username: "user123" },
      });

      const mockAdminSetUserPassword = jest.fn().mockResolvedValue({});

      const mockPutItem = jest.fn().mockImplementation((params) => {
        const item = params.Item;
        if (item.role && item.role.L) {
          expect(item.role.L.some((r: any) => r.S === "Buyer")).toBe(true);
        }
        return Promise.resolve({});
      });

      (handler as any).cognito = {
        adminCreateUser: mockAdminCreateUser,
        adminSetUserPassword: mockAdminSetUserPassword,
      };

      (handler as any).dynamodb = {
        putItem: mockPutItem,
      };

      const event = {
        body: JSON.stringify({
          email: "student@graduate.utm.my",
          password: "SecurePass123!",
          fullName: "John Doe",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(201);
      expect(mockPutItem).toHaveBeenCalled();
    });
  });

  describe("Response format", () => {
    it("should return correct response structure", async () => {
      const mockAdminCreateUser = jest.fn().mockResolvedValue({
        User: { Username: "user123" },
      });

      const mockAdminSetUserPassword = jest.fn().mockResolvedValue({});
      const mockPutItem = jest.fn().mockResolvedValue({});

      (handler as any).cognito = {
        adminCreateUser: mockAdminCreateUser,
        adminSetUserPassword: mockAdminSetUserPassword,
      };

      (handler as any).dynamodb = {
        putItem: mockPutItem,
      };

      const event = {
        body: JSON.stringify({
          email: "student@graduate.utm.my",
          password: "SecurePass123!",
          fullName: "John Doe",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body);

      expect(body).toHaveProperty("userId");
      expect(body).toHaveProperty("email");
      expect(body).toHaveProperty("fullName");
      expect(body).toHaveProperty("role");
      expect(body).toHaveProperty("verificationStatus");
      expect(body).toHaveProperty("message");
    });
  });
});
