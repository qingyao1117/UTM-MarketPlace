import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { InitiateAuthCommand, AuthFlowType } from "@aws-sdk/client-cognito-identity-service-provider";
import { BaseHandler } from "../base/BaseHandler";
import { getCognitoClient } from "../../config/aws-clients";
import { getEnvConfig } from "../../config/env";
import { getLogger } from "../../utils/logger";

/**
 * Login Lambda Handler
 *
 * Handles user login with Cognito authentication
 *
 * Requirements: 1.4, 2.5
 * - Accept email and password
 * - Call Cognito InitiateAuth (USER_PASSWORD_AUTH)
 * - Return accessToken, idToken, refreshToken, userId
 * - Handle invalid credentials with secure error message
 */
export class LoginHandler extends BaseHandler {
  private cognitoClient;
  private env;
  private logger = getLogger();

  constructor() {
    super();
    this.cognitoClient = getCognitoClient();
    this.env = getEnvConfig();
  }

  /**
   * Authenticate user with Cognito
   */
  private async authenticateWithCognito(
    email: string,
    password: string
  ): Promise<any> {
    try {
      const initiateAuthCommand = new InitiateAuthCommand({
        ClientId: this.env.COGNITO_CLIENT_ID,
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        AuthParameters: {
          USERNAME: email.toLowerCase(),
          PASSWORD: password,
        },
      });

      const response = await this.cognitoClient.send(initiateAuthCommand);

      this.logger.info("User authenticated successfully with Cognito", {
        email: email,
      });

      return response;
    } catch (error: any) {
      // Handle specific errors with generic messages for security
      if (
        error.name === "NotAuthorizedException" ||
        error.name === "UserNotConfirmedException"
      ) {
        this.logger.warn("Authentication failed", {
          email: email,
          reason: error.name,
        });

        throw new Error("Invalid credentials or account not confirmed");
      }

      if (error.name === "UserNotFoundException") {
        this.logger.warn("User not found", {
          email: email,
        });

        throw new Error("Invalid credentials or account not confirmed");
      }

      if (error.name === "TooManyRequestsException") {
        this.logger.warn("Too many login attempts", {
          email: email,
        });

        throw new Error("Too many login attempts. Please try again later.");
      }

      throw error;
    }
  }

  /**
   * Extract token information from JWT
   */
  private getTokenInfo(token: string): { expiration: number | null } {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        return { expiration: null };
      }

      const decoded = JSON.parse(
        Buffer.from(parts[1], "base64").toString("utf-8")
      );

      return {
        expiration: decoded.exp || null,
      };
    } catch (error) {
      this.logger.warn("Failed to extract token information", 
        error instanceof Error ? error : new Error(String(error))
      );

      return { expiration: null };
    }
  }

  /**
   * Extract userId from ID token
   */
  private extractUserIdFromToken(idToken: string): string | null {
    try {
      const parts = idToken.split(".");
      if (parts.length !== 3) {
        return null;
      }

      const decoded = JSON.parse(
        Buffer.from(parts[1], "base64").toString("utf-8")
      );

      // Cognito ID token usually has 'sub' field for user ID
      return decoded.sub || null;
    } catch (error) {
      this.logger.warn("Failed to extract user ID from token");
      return null;
    }
  }

  /**
   * Handle login request
   *
   * Request body:
   * {
   *   "email": "user@graduate.utm.my",
   *   "password": "SecurePassword123!"
   * }
   *
   * Response:
   * {
   *   "email": "user@graduate.utm.my",
   *   "userId": "cognito-user-id",
   *   "accessToken": "jwt-access-token",
   *   "idToken": "jwt-id-token",
   *   "refreshToken": "refresh-token",
   *   "expiresIn": 900,
   *   "tokenType": "Bearer",
   *   "message": "Login successful"
   * }
   */
  async handle(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    this.logger.setContext({ requestId: context.requestId });
    this.logger.info("Login request received");

    try {
      // Parse request body
      const body =
        typeof event.body === "string" ? JSON.parse(event.body) : event.body;

      // Validate required fields
      const validation = this.validateRequestBody(body, ["email", "password"]);
      if (!validation.valid) {
        this.logger.warn("Login request missing required fields", {
          errors: validation.errors,
        });

        return this.handleError(
          new Error(validation.errors.join(", ")),
          400
        );
      }

      const { email, password } = body;
      const emailLower = email.toLowerCase().trim();

      // Authenticate with Cognito
      const cognitoResponse = await this.authenticateWithCognito(
        emailLower,
        password
      );

      // Extract tokens
      const accessToken = cognitoResponse.AuthenticationResult?.AccessToken;
      const idToken = cognitoResponse.AuthenticationResult?.IdToken;
      const refreshToken = cognitoResponse.AuthenticationResult?.RefreshToken;
      const expiresIn = cognitoResponse.AuthenticationResult?.ExpiresIn;

      if (!accessToken || !idToken) {
        throw new Error("Failed to retrieve authentication tokens");
      }

      // Extract user ID from ID token
      const userId = this.extractUserIdFromToken(idToken);

      // Extract token information
      const tokenInfo = this.getTokenInfo(accessToken);

      this.logger.info("User login successful", {
        email: emailLower,
        userId: userId,
      });

      // Return success response
      return this.handleSuccess(
        {
          email: emailLower,
          userId: userId,
          accessToken,
          idToken,
          refreshToken,
          expiresIn: expiresIn || 900, // Default 15 minutes
          tokenType: "Bearer",
          message: "Login successful",
        },
        200
      );
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Handle specific login errors
      if (
        errorMessage === "Invalid credentials or account not confirmed" ||
        errorMessage === "Too many login attempts. Please try again later."
      ) {
        this.logger.warn("Login failed", {
          error: errorMessage,
        });

        const statusCode =
          errorMessage === "Too many login attempts. Please try again later."
            ? 429
            : 401;

        return this.handleError(error, statusCode);
      }

      this.logger.error("Login handler error", 
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
  const loginHandler = new LoginHandler();
  return loginHandler.handle(event, context);
};
