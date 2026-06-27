import { LoginHandler } from "./LoginHandler";
import { APIGatewayProxyEvent, Context } from "aws-lambda";

describe("LoginHandler", () => {
  let handler: LoginHandler;
  let mockContext: Partial<Context>;

  beforeEach(() => {
    process.env.AWS_REGION = "ap-southeast-1";
    process.env.DYNAMODB_TABLE_PREFIX = "utm";
    process.env.S3_BUCKET_NAME = "utm-bucket";
    process.env.COGNITO_POOL_ID = "ap-southeast-1_test123";
    process.env.COGNITO_CLIENT_ID = "test-client-id";

    handler = new LoginHandler();
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

  describe("Valid login", () => {
    it("should login user with correct credentials", async () => {
      const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE3MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

      const mockInitiateAuth = jest.fn().mockResolvedValue({
        AuthenticationResult: {
          AccessToken: mockToken,
          IdToken: mockToken,
          RefreshToken: "refresh-token",
          ExpiresIn: 900,
          TokenType: "Bearer",
        },
      });

      const mockQuery = jest.fn().mockResolvedValue({
        Items: [
          {
            userId: { S: "user123" },
            email: { S: "student@graduate.utm.my" },
            fullName: { S: "John Doe" },
            role: { L: [{ S: "Buyer" }] },
            emailVerified: { BOOL: true },
            accountStatus: { S: "Active" },
          },
        ],
      });

      (handler as any).cognito = {
        initiateAuth: mockInitiateAuth,
      };

      (handler as any).dynamodb = {
        query: mockQuery,
      };

      const event = {
        body: JSON.stringify({
          email: "student@graduate.utm.my",
          password: "SecurePass123!",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.userId).toBe("user123");
      expect(body.email).toBe("student@graduate.utm.my");
      expect(body.accessToken).toBeDefined();
      expect(body.idToken).toBeDefined();
      expect(body.refreshToken).toBeDefined();
      expect(body.tokenType).toBe("Bearer");
    });

    it("should normalize email to lowercase", async () => {
      const mockToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE3MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

      const mockInitiateAuth = jest.fn().mockResolvedValue({
        AuthenticationResult: {
          AccessToken: mockToken,
          IdToken: mockToken,
          RefreshToken: "refresh-token",
          ExpiresIn: 900,
        },
      });

      const mockQuery = jest.fn().mockResolvedValue({
        Items: [
          {
            userId: { S: "user123" },
            email: { S: "student@graduate.utm.my" },
            fullName: { S: "John Doe" },
            role: { L: [{ S: "Buyer" }] },
            emailVerified: { BOOL: true },
            accountStatus: { S: "Active" },
          },
        ],
      });

      (handler as any).cognito = {
        initiateAuth: mockInitiateAuth,
      };

      (handler as any).dynamodb = {
        query: mockQuery,
      };

      const event = {
        body: JSON.stringify({
          email: "STUDENT@GRADUATE.UTM.MY",
          password: "SecurePass123!",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(200);
    });
  });

  describe("Invalid credentials", () => {
    it("should reject login with incorrect password", async () => {
      const mockInitiateAuth = jest.fn().mockRejectedValue({
        name: "NotAuthorizedException",
        message: "Incorrect username or password.",
      });

      (handler as any).cognito = {
        initiateAuth: mockInitiateAuth,
      };

      const event = {
        body: JSON.stringify({
          email: "student@graduate.utm.my",
          password: "WrongPassword123!",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.error).toContain("Invalid credentials");
    });

    it("should reject login with nonexistent user", async () => {
      const mockInitiateAuth = jest.fn().mockRejectedValue({
        name: "UserNotFoundException",
        message: "User does not exist.",
      });

      (handler as any).cognito = {
        initiateAuth: mockInitiateAuth,
      };

      const event = {
        body: JSON.stringify({
          email: "nonexistent@graduate.utm.my",
          password: "SecurePass123!",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(401);
    });

    it("should reject login for unconfirmed user", async () => {
      const mockInitiateAuth = jest.fn().mockRejectedValue({
        name: "UserNotConfirmedException",
        message: "User is not confirmed.",
      });

      (handler as any).cognito = {
        initiateAuth: mockInitiateAuth,
      };

      const event = {
        body: JSON.stringify({
          email: "student@graduate.utm.my",
          password: "SecurePass123!",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(401);
    });
  });

  describe("Rate limiting", () => {
    it("should return 429 for too many login attempts", async () => {
      const mockInitiateAuth = jest.fn().mockRejectedValue({
        name: "TooManyRequestsException",
        message: "Attempt limit exceeded, please try after some time.",
      });

      (handler as any).cognito = {
        initiateAuth: mockInitiateAuth,
      };

      const event = {
        body: JSON.stringify({
          email: "student@graduate.utm.my",
          password: "SecurePass123!",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(429);
    });
  });

  describe("Request validation", () => {
    it("should reject request with missing email", async () => {
      const event = {
        body: JSON.stringify({
          password: "SecurePass123!",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(400);
    });

    it("should reject request with missing password", async () => {
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

  describe("Response format", () => {
    it("should return correct response structure", async () => {
      const mockToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE3MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

      const mockInitiateAuth = jest.fn().mockResolvedValue({
        AuthenticationResult: {
          AccessToken: mockToken,
          IdToken: mockToken,
          RefreshToken: "refresh-token",
          ExpiresIn: 900,
        },
      });

      const mockQuery = jest.fn().mockResolvedValue({
        Items: [
          {
            userId: { S: "user123" },
            email: { S: "student@graduate.utm.my" },
            fullName: { S: "John Doe" },
            role: { L: [{ S: "Buyer" }] },
            emailVerified: { BOOL: true },
            accountStatus: { S: "Active" },
          },
        ],
      });

      (handler as any).cognito = {
        initiateAuth: mockInitiateAuth,
      };

      (handler as any).dynamodb = {
        query: mockQuery,
      };

      const event = {
        body: JSON.stringify({
          email: "student@graduate.utm.my",
          password: "SecurePass123!",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);

      expect(body).toHaveProperty("userId");
      expect(body).toHaveProperty("email");
      expect(body).toHaveProperty("fullName");
      expect(body).toHaveProperty("role");
      expect(body).toHaveProperty("accessToken");
      expect(body).toHaveProperty("idToken");
      expect(body).toHaveProperty("refreshToken");
      expect(body).toHaveProperty("expiresIn");
      expect(body).toHaveProperty("tokenType");
      expect(body).toHaveProperty("message");
    });

    it("should include user details in response", async () => {
      const mockToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE3MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

      const mockInitiateAuth = jest.fn().mockResolvedValue({
        AuthenticationResult: {
          AccessToken: mockToken,
          IdToken: mockToken,
          RefreshToken: "refresh-token",
          ExpiresIn: 900,
        },
      });

      const mockQuery = jest.fn().mockResolvedValue({
        Items: [
          {
            userId: { S: "user123" },
            email: { S: "student@graduate.utm.my" },
            fullName: { S: "John Doe" },
            role: { L: [{ S: "Buyer" }] },
            emailVerified: { BOOL: true },
            accountStatus: { S: "Active" },
          },
        ],
      });

      (handler as any).cognito = {
        initiateAuth: mockInitiateAuth,
      };

      (handler as any).dynamodb = {
        query: mockQuery,
      };

      const event = {
        body: JSON.stringify({
          email: "student@graduate.utm.my",
          password: "SecurePass123!",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      const body = JSON.parse(result.body);
      expect(body.userId).toBe("user123");
      expect(body.email).toBe("student@graduate.utm.my");
      expect(body.fullName).toBe("John Doe");
      expect(body.emailVerified).toBe(true);
      expect(body.accountStatus).toBe("Active");
    });
  });
});
