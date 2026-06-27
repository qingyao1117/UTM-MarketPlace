import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import {
  ConfirmSignUpCommand,
  AdminConfirmSignUpCommand,
} from "@aws-sdk/client-cognito-identity-service-provider";
import { QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { BaseHandler } from "../base/BaseHandler";
import { getCognitoClient, getDynamoDBClient } from "../../config/aws-clients";
import { getEnvConfig } from "../../config/env";
import { getLogger } from "../../utils/logger";

/**
 * Email Verification Lambda Handler
 *
 * Handles email verification with Cognito confirmation code
 *
 * Requirements: 1.1, 2.4
 * - Accept email and verificationCode
 * - Call Cognito ConfirmSignUp or AdminConfirmSignUp
 * - Update Users table emailVerified=true
 * - Return verified user details
 */
export class EmailVerificationHandler extends BaseHandler {
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
   * Confirm signup in Cognito using ConfirmSignUp
   */
  private async confirmSignupInCognito(
    email: string,
    confirmationCode: string
  ): Promise<void> {
    try {
      const confirmCommand = new ConfirmSignUpCommand({
        ClientId: this.env.COGNITO_CLIENT_ID,
        Username: email.toLowerCase(),
        ConfirmationCode: confirmationCode,
      });

      await this.cognitoClient.send(confirmCommand);

      this.logger.info("Email confirmed in Cognito", {
        email: email,
      });
    } catch (error: any) {
      // Handle specific errors
      if (error.name === "NotAuthorizedException") {
        throw new Error("Invalid or expired confirmation code");
      }

      if (error.name === "UserNotFoundException") {
        throw new Error("User not found");
      }

      if (error.name === "UserAlreadyConfirmedException") {
        this.logger.warn("User already confirmed in Cognito", { email });
        return; // Not an error, user is already verified
      }

      throw error;
    }
  }

  /**
   * Get user by email using GSI query
   */
  private async getUserByEmail(email: string): Promise<any> {
    try {
      const queryCommand = new QueryCommand({
        TableName: this.env.USERS_TABLE,
        IndexName: "email-index", // Assumes email GSI exists
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: {
          ":email": email.toLowerCase(),
        },
      });

      const response = await this.docClient.send(queryCommand);

      if (!response.Items || response.Items.length === 0) {
        return null;
      }

      return response.Items[0];
    } catch (error) {
      this.logger.error("Failed to get user by email", 
        error instanceof Error ? error : new Error(String(error)), {
        email,
      });
      // If GSI doesn't exist, return null and caller should handle
      return null;
    }
  }

  /**
   * Update user verification status in DynamoDB
   */
  private async updateUserVerificationStatus(userId: string): Promise<any> {
    try {
      const now = new Date().toISOString();

      const updateCommand = new UpdateCommand({
        TableName: this.env.USERS_TABLE,
        Key: { userId },
        UpdateExpression:
          "SET emailVerified = :true, verificationStatus = :verified, updatedAt = :now",
        ExpressionAttributeValues: {
          ":true": true,
          ":verified": "verified",
          ":now": now,
        },
        ReturnValues: "ALL_NEW",
      });

      const response = await this.docClient.send(updateCommand);

      this.logger.info("User verification status updated in DynamoDB", {
        userId,
        emailVerified: true,
        verificationStatus: "verified",
      });

      return response.Attributes;
    } catch (error) {
      this.logger.error("Failed to update user verification status", 
        error instanceof Error ? error : new Error(String(error)), {
        userId,
      });
      throw error;
    }
  }

  /**
   * Handle email verification request
   *
   * Request body:
   * {
   *   "email": "user@graduate.utm.my",
   *   "verificationCode": "123456"
   * }
   *
   * Response:
   * {
   *   "userId": "cognito-user-id",
   *   "email": "user@graduate.utm.my",
   *   "fullName": "John Doe",
   *   "emailVerified": true,
   *   "verificationStatus": "verified",
   *   "role": "Buyer",
   *   "message": "Email verified successfully"
   * }
   */
  async handle(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    this.logger.setContext({ requestId: context.requestId });
    this.logger.info("Email verification request received");

    try {
      // Parse request body
      const body =
        typeof event.body === "string" ? JSON.parse(event.body) : event.body;

      // Validate required fields
      const validation = this.validateRequestBody(body, [
        "email",
        "verificationCode",
      ]);
      if (!validation.valid) {
        this.logger.warn("Email verification request missing required fields", {
          errors: validation.errors,
        });

        return this.handleError(
          new Error(validation.errors.join(", ")),
          400
        );
      }

      const { email, verificationCode } = body;
      const emailLower = email.toLowerCase().trim();

      // Confirm signup in Cognito
      await this.confirmSignupInCognito(emailLower, verificationCode);

      // Retrieve user from DynamoDB by email
      const user = await this.getUserByEmail(emailLower);

      if (!user) {
        this.logger.warn("User not found after email verification", { email: emailLower });
        // Still return success since Cognito confirmed, but user not in DynamoDB
        return this.handleSuccess(
          {
            email: emailLower,
            emailVerified: true,
            verificationStatus: "verified",
            message: "Email verified successfully. Please log in to continue.",
          },
          200
        );
      }

      // Update user verification status in DynamoDB
      const updatedUser = await this.updateUserVerificationStatus(user.userId);

      this.logger.info("Email verified successfully", {
        userId: user.userId,
        email: emailLower,
      });

      // Return success response with user details
      return this.handleSuccess(
        {
          userId: user.userId,
          email: updatedUser.email,
          fullName: updatedUser.fullName,
          emailVerified: updatedUser.emailVerified,
          verificationStatus: updatedUser.verificationStatus,
          role: Array.isArray(updatedUser.role) ? updatedUser.role[0] : updatedUser.role,
          message: "Email verified successfully. Please log in to continue.",
        },
        200
      );
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Handle specific verification errors
      if (
        errorMessage.includes("Invalid or expired confirmation code") ||
        errorMessage.includes("User not found")
      ) {
        this.logger.warn("Verification failed", {
          error: errorMessage,
        });

        return this.handleError(error, 400);
      }

      this.logger.error("Email verification handler error", 
        error instanceof Error ? error : new Error(errorMessage)
      );

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
  const emailVerificationHandler = new EmailVerificationHandler();
  return emailVerificationHandler.handle(event, context);
};
