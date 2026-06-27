import { EmailValidationHandler } from "./EmailValidationHandler";
import { APIGatewayProxyEvent, Context } from "aws-lambda";

describe("EmailValidationHandler", () => {
  let handler: EmailValidationHandler;
  let mockContext: Partial<Context>;

  beforeEach(() => {
    handler = new EmailValidationHandler();
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
  });

  describe("Valid email domains", () => {
    it("should accept email with @graduate.utm.my domain", async () => {
      const event = {
        body: JSON.stringify({
          email: "student@graduate.utm.my",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.valid).toBe(true);
      expect(body.email).toBe("student@graduate.utm.my");
    });

    it("should accept email with @utm.my domain", async () => {
      const event = {
        body: JSON.stringify({
          email: "faculty@utm.my",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.valid).toBe(true);
      expect(body.email).toBe("faculty@utm.my");
    });

    it("should normalize email to lowercase", async () => {
      const event = {
        body: JSON.stringify({
          email: "STUDENT@GRADUATE.UTM.MY",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.email).toBe("student@graduate.utm.my");
    });

    it("should trim whitespace from email", async () => {
      const event = {
        body: JSON.stringify({
          email: "  student@graduate.utm.my  ",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.email).toBe("student@graduate.utm.my");
    });
  });

  describe("Invalid email domains", () => {
    it("should reject email with @gmail.com domain", async () => {
      const event = {
        body: JSON.stringify({
          email: "student@gmail.com",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.valid).toBe(false);
    });

    it("should reject email with @hotmail.com domain", async () => {
      const event = {
        body: JSON.stringify({
          email: "student@hotmail.com",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.valid).toBe(false);
    });

    it("should reject email with partial domain match", async () => {
      const event = {
        body: JSON.stringify({
          email: "student@nonutm.my",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.valid).toBe(false);
    });
  });

  describe("Invalid email formats", () => {
    it("should reject email without @ symbol", async () => {
      const event = {
        body: JSON.stringify({
          email: "studentgraduate.utm.my",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.valid).toBe(false);
    });

    it("should reject email without domain", async () => {
      const event = {
        body: JSON.stringify({
          email: "student@",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(400);
    });

    it("should reject empty email", async () => {
      const event = {
        body: JSON.stringify({
          email: "",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(400);
    });
  });

  describe("Request validation", () => {
    it("should reject request with missing email field", async () => {
      const event = {
        body: JSON.stringify({}),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(400);
    });

    it("should handle JSON parse errors gracefully", async () => {
      const event = {
        body: "invalid json",
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(500);
    });
  });

  describe("Edge cases", () => {
    it("should handle email with multiple subdomains correctly", async () => {
      const event = {
        body: JSON.stringify({
          email: "student@mail.graduate.utm.my",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.valid).toBe(true);
    });

    it("should handle email with special characters in local part", async () => {
      const event = {
        body: JSON.stringify({
          email: "student.name+tag@graduate.utm.my",
        }),
      } as unknown as APIGatewayProxyEvent;

      const result = await handler.handle(event, mockContext as Context);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.valid).toBe(true);
    });
  });
});
