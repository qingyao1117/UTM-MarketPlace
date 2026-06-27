import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { BaseHandler } from "../base/BaseHandler";
import { getDynamoDBClient } from "../../config/aws-clients";
import { getEnvConfig } from "../../config/env";
import { getLogger } from "../../utils/logger";

/**
 * Default Buyer Role Assignment Handler
 *
 * On successful signup, users are automatically assigned role="Buyer" in Users table
 * This handler verifies the role assignment and ensures Buyer users cannot perform provider actions
 * Store role assignment with creation timestamp
 *
 * Requirements: 2.1, 2.2, 2.3
 */
export class BuyerRoleAssignmentHandler extends BaseHandler {
  private docClient;
  private env;
  private logger = getLogger();

  constructor() {
    super();
    const dynamoDBClient = getDynamoDBClient();
    this.docClient = DynamoDBDocumentClient.from(dynamoDBClient);
    this.env = getEnvConfig();
  }

  /**
   * Verify user has Buyer role assigned
   */
  private async verifyBuyerRole(userId: string): Promise<{
    hasRole: boolean;
    role: string;
    canPerformBuyerActions: boolean;
    canPerformProviderActions: boolean;
  }> {
    try {
      const getCommand = new GetCommand({
        TableName: this.env.USERS_TABLE,
        Key: { userId },
      });

      const response = await this.docClient.send(getCommand);
      const user = response.Item;

      if (!user) {
        throw new Error("User not found");
      }

      // Handle role as array (new format) or string (old format)
      let roleArray = user.role;
      if (typeof user.role === "string") {
        roleArray = [user.role];
      }

      const hasRole = Array.isArray(roleArray) && roleArray.includes("Buyer");

      // Buyer can perform buyer actions (browse, search, place orders, book rides)
      const canPerformBuyerActions = hasRole;

      // Buyer cannot perform provider actions unless they also have a provider role
      const providerRoles = ["Driver", "Seller", "Runner"];
      const canPerformProviderActions = Array.isArray(roleArray) && 
        roleArray.some((r: string) => providerRoles.includes(r));

      this.logger.info("Buyer role verified", {
        userId,
        role: roleArray,
        hasRole,
        canPerformBuyerActions,
        canPerformProviderActions,
      });

      return {
        hasRole,
        role: Array.isArray(roleArray) ? roleArray.join(",") : "Unknown",
        canPerformBuyerActions,
        canPerformProviderActions,
      };
    } catch (error) {
      this.logger.error("Failed to verify buyer role", 
        error instanceof Error ? error : new Error(String(error)), {
        userId,
      });
      throw error;
    }
  }

  /**
   * Handle role verification request
   *
   * Request body:
   * {
   *   "userId": "cognito-user-id"
   * }
   *
   * Response:
   * {
   *   "userId": "cognito-user-id",
   *   "role": "Buyer",
   *   "hasRole": true,
   *   "permissions": {
   *     "canBrowse": true,
   *     "canPlaceOrders": true,
   *     "canBookRides": true,
   *     "canListItems": false,
   *     "canAcceptOrders": false,
   *     "canOfferRides": false
   *   }
   * }
   */
  async handle(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    this.logger.setContext({ requestId: context.requestId });
    this.logger.info("Buyer role verification request received");

    try {
      // Parse request body
      const body =
        typeof event.body === "string" ? JSON.parse(event.body) : event.body;

      // Validate required fields
      const validation = this.validateRequestBody(body, ["userId"]);
      if (!validation.valid) {
        this.logger.warn("Buyer role verification request missing required fields", {
          errors: validation.errors,
        });

        return this.handleError(
          new Error(validation.errors.join(", ")),
          400
        );
      }

      const { userId } = body;

      // Verify buyer role
      const roleVerification = await this.verifyBuyerRole(userId);

      if (!roleVerification.hasRole) {
        this.logger.warn("User does not have Buyer role", {
          userId,
          role: roleVerification.role,
        });

        return this.handleError(
          new Error(
            `User does not have Buyer role. Current role: ${roleVerification.role}`
          ),
          403
        );
      }

      // Return role verification response
      return this.handleSuccess(
        {
          userId,
          role: roleVerification.role,
          hasRole: roleVerification.hasRole,
          permissions: {
            canBrowse: roleVerification.canPerformBuyerActions,
            canPlaceOrders: roleVerification.canPerformBuyerActions,
            canBookRides: roleVerification.canPerformBuyerActions,
            canListItems: roleVerification.canPerformProviderActions,
            canAcceptOrders: roleVerification.canPerformProviderActions,
            canOfferRides: roleVerification.canPerformProviderActions,
          },
          message: "Buyer role verified successfully",
          timestamp: new Date().toISOString(),
        },
        200
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error("Buyer role assignment handler error", 
        error instanceof Error ? error : new Error(errorMessage)
      );

      // Return appropriate error code
      if (errorMessage.includes("User not found")) {
        return this.handleError(error, 404);
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
  const buyerRoleHandler = new BuyerRoleAssignmentHandler();
  return buyerRoleHandler.handle(event, context);
};
