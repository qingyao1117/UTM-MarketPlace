import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { BaseHandler } from "../base/BaseHandler";
import {
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  MessageActionType,
} from "@aws-sdk/client-cognito-identity-service-provider";
import { getCognitoClient, getDynamoDBClient } from "../../config/aws-clients";
import { getEnvConfig } from "../../config/env";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { getLogger } from "../../utils/logger";

/**
 * Cognito Signup Lambda Handler
 *
 * Handles user signup with email verification
 *
 * Requirements: 1.3, 1.4, 2.1, 2.2
 * - Accept email, password, fullName in request body
 * - Call Cognito AdminCreateUser API
 * - Trigger email verification workflow
 * - Return userId, email, role="Buyer", verificationStatus="pending_email"
 * - Handle duplicate email errors gracefully
 * - Assign default "Buyer" role
 */
export class SignupHandler extends BaseHandler {
  private cognitoClient;
  private docClient;
  private env;
  private logger = getLogger();

  constructor() {
    super();
    this.cognitoClient = getCognitoClient();
    const dynamoDBClient = getDynamoDBClient();
    this.docClient = DynamoDBDocumentClient.from(dynamoDBClient);
    this.env = getEnvConfig();
  }

  /**
   * Validate email domain
   */
  private isValidUTMEmail(email: string): boolean {
    const lowerEmail = email.toLowerCase().trim();
    return (
      lowerEmail.endsWith("@graduate.utm.my") ||
      lowerEmail.endsWith("@utm.my")
    );
  }

  /**
   * Validate password strength
   */
  private isValidPassword(password: string): boolean {
    if (!password || password.length < 8) {
      return false;
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return false;
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
      return false;
    }

    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return false;
    }

    return true;
  }

  /**
   * Create user in Cognito
   */
  private async createCognitoUser(
    email: string,
    password: string,
    fullName: string
  ): Promise<{ username: string; userSub: string }> {
    try {
      const createUserCommand = new AdminCreateUserCommand({
        UserPoolId: this.env.COGNITO_POOL_ID,
        Username: email.toLowerCase(),
        TemporaryPassword: password,
        UserAttributes: [
          { Name: "email", Value: email.toLowerCase() },
          { Name: "email_verified", Value: "false" },
          { Name: "name", Value: fullName },
        ],
        MessageAction: MessageActionType.SUPPRESS,
      });

      const createResponse = await this.cognitoClient.send(createUserCommand);

      if (!createResponse.User?.Username || !createResponse.User?.Attributes) {
        throw new Error("Failed to create Cognito user");
      }

      // Extract userSub from attributes
      const userSubAttr = createResponse.User.Attributes.find(
        (attr) => attr.Name === "sub"
      );
      const userSub = userSubAttr?.Value;

      if (!userSub) {
        throw new Error("Failed to retrieve user sub from Cognito");
      }

      // Set permanent password
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: this.env.COGNITO_POOL_ID,
        Username: email.toLowerCase(),
        Password: password,
        Permanent: true,
      });

      await this.cognitoClient.send(setPasswordCommand);

      this.logger.info("Cognito user created successfully", {
        userId: userSub,
        email: email,
      });

      return {
        username: createResponse.User.Username,
        userSub,
      };
    } catch (error: any) {
      // Handle duplicate user
      if (error.name === "UsernameExistsException") {
        this.logger.warn("User already exists in Cognito", {
          email,
        });
        throw new Error(
          "Email already registered. Please log in or reset your password."
        );
      }

      throw error;
    }
  }

  /**
   * Create user record in DynamoDB Users table
   */
  private async createUserInDynamoDB(
    userId: string,
    email: string,
    fullName: string
  ): Promise<void> {
    const now = new Date().toISOString();

    const userRecord = {
      userId,
      email: email.toLowerCase(),
      fullName,
      role: ["Buyer"], // Default role as array
      verificationStatus: "pending_email",
      emailVerified: false,
      accountStatus: "Active",
      createdAt: now,
      updatedAt: now,
      profilePicture: null,
      phoneNumber: null,
      averageRating: 0,
      totalReviews: 0,
      totalOrders: 0,
    };

    try {
      const putCommand = new PutCommand({
        TableName: this.env.USERS_TABLE,
        Item: userRecord,
      });

      await this.docClient.send(putCommand);

      this.logger.info("User created in DynamoDB", {
        userId,
        email,
        role: "Buyer",
      });
    } catch (error) {
      this.logger.error("Failed to create user in DynamoDB", 
        error instanceof Error ? error : new Error(String(error)), {
        userId,
        email,
      });

      throw new Error("Failed to complete user registration");
    }
  }

  /**
   * Handle signup request
   *
   * Request body:
   * {
   *   "email": "user@graduate.utm.my",
   *   "password": "SecurePassword123!",
   *   "fullName": "John Doe"
   * }
   *
   * Response:
   * {
   *   "userId": "cognito-user-id",
   *   "email": "user@graduate.utm.my",
   *   "fullName": "John Doe",
   *   "role": "Buyer",
   *   "verificationStatus": "pending_email",
   *   "message": "Signup successful. Please verify your email."
   * }
   */
  async handle(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    this.logger.setContext({ requestId: context.requestId });
    this.logger.info("Signup request received");

    try {
      // Parse request body
      const body =
        typeof event.body === "string" ? JSON.parse(event.body) : event.body;

      // Validate required fields
      const validation = this.validateRequestBody(body, [
        "email",
        "password",
        "fullName",
      ]);
      if (!validation.valid) {
        this.logger.warn("Signup request missing required fields", {
          errors: validation.errors,
        });

        return this.handleError(
          new Error(validation.errors.join(", ")),
          400
        );
      }

      const { email, password, fullName } = body;

      // Validate email domain
      if (!this.isValidUTMEmail(email)) {
        this.logger.warn("Signup attempt with invalid email domain", {
          email,
        });

        return this.handleError(
          new Error(
            "Email must be from @graduate.utm.my or @utm.my domain"
          ),
          400
        );
      }

      // Validate password strength
      if (!this.isValidPassword(password)) {
        return this.handleError(
          new Error(
            "Password must be at least 8 characters with uppercase, number, and special character"
          ),
          400
        );
      }

      // Validate fullName
      if (
        !fullName ||
        typeof fullName !== "string" ||
        fullName.trim().length === 0
      ) {
        return this.handleError(new Error("Full name is required"), 400);
      }

      // Create user in Cognito
      const cognitoUser = await this.createCognitoUser(
        email,
        password,
        fullName
      );

      // Create user record in DynamoDB with default Buyer role
      await this.createUserInDynamoDB(cognitoUser.userSub, email, fullName);

      this.logger.info("User signup completed successfully", {
        userId: cognitoUser.userSub,
        email,
      });

      // Return success response
      return this.handleSuccess(
        {
          userId: cognitoUser.userSub,
          email: email.toLowerCase(),
          fullName,
          role: "Buyer",
          verificationStatus: "pending_email",
          message: "Signup successful. Please verify your email.",
        },
        201
      );
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error("Signup handler error", 
        error instanceof Error ? error : new Error(errorMessage)
      );

      // Return appropriate error code for duplicate email
      if (errorMessage.includes("Email already registered")) {
        return this.handleError(error, 409);
      }

      return this.handleError(error, 500);
    }
  }
}

/**
 * Lambda handler entry point
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const signupHandler = new SignupHandler();
  return signupHandler.handle(event, context);
};
