import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { BaseHandler } from "../base/BaseHandler";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

/**
 * Role Assignment Lambda Handler
 * 
 * Handles role assignment and role-based access control verification
 * 
 * Requirements: 2.1, 2.2, 2.3
 * - On successful signup, automatically assign role="Buyer" in Users table
 * - Verify Buyer users cannot perform provider actions
 * - Store role assignment with creation timestamp
 */
export class RoleAssignmentHandler extends BaseHandler {
  private dynamodb: DynamoDB;
  private usersTableName: string;

  constructor() {
    super();
    this.dynamodb = new DynamoDB({
      region: this.environment.AWS_REGION,
    });
    this.usersTableName = `${this.environment.DYNAMODB_TABLE_PREFIX}_Users`;
  }

  /**
   * Verify user has specific role
   */
  private async verifyUserRole(
    userId: string,
    requiredRole: string
  ): Promise<boolean> {
    try {
      const response = await this.dynamodb.getItem({
        TableName: this.usersTableName,
        Key: { userId: { S: userId } },
      });

      if (!response.Item) {
        this.log("WARN", "User not found", { userId });
        return false;
      }

      const user = response.Item;
      const roles = user.role?.L?.map((r: any) => r.S) || [];

      const hasRole = roles.includes(requiredRole);

      this.log("INFO", "Role verification completed", {
        userId,
        requiredRole,
        userRoles: roles,
        hasRole,
      });

      return hasRole;
    } catch (error) {
      this.log("ERROR", "Failed to verify user role", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Assign role to user
   */
  private async assignRole(userId: string, newRole: string): Promise<void> {
    try {
      // Get current user
      const response = await this.dynamodb.getItem({
        TableName: this.usersTableName,
        Key: { userId: { S: userId } },
      });

      if (!response.Item) {
        throw new Error("User not found");
      }

      const user = response.Item;
      const currentRoles = user.role?.L?.map((r: any) => r.S) || [];

      // Check if role already exists
      if (currentRoles.includes(newRole)) {
        this.log("INFO", "User already has this role", {
          userId,
          role: newRole,
        });
        return;
      }

      // Add new role
      const updatedRoles = [...currentRoles, newRole];

      // Update user with new role and timestamp
      await this.dynamodb.updateItem({
        TableName: this.usersTableName,
        Key: { userId: { S: userId } },
        UpdateExpression:
          "SET #role = :roles, #updatedAt = :now, #roleAssignedAt = :now",
        ExpressionAttributeNames: {
          "#role": "role",
          "#updatedAt": "updatedAt",
          "#roleAssignedAt": `${newRole}AssignedAt`,
        },
        ExpressionAttributeValues: {
          ":roles": {
            L: updatedRoles.map((r) => ({ S: r })),
          },
          ":now": { S: new Date().toISOString() },
        },
      });

      this.log("INFO", "Role assigned successfully", {
        userId,
        newRole,
        allRoles: updatedRoles,
      });
    } catch (error) {
      this.log("ERROR", "Failed to assign role", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Handle role assignment request
   * 
   * This endpoint is used to:
   * 1. Verify a user has the Buyer role (and cannot perform provider actions)
   * 2. Assign additional roles to users (for providers)
   * 
   * Request body for verification:
   * {
   *   "userId": "cognito-user-id",
   *   "action": "verify",
   *   "requiredRole": "Buyer"
   * }
   * 
   * Request body for assignment:
   * {
   *   "userId": "cognito-user-id",
   *   "action": "assign",
   *   "newRole": "Seller"
   * }
   * 
   * Response:
   * {
   *   "userId": "cognito-user-id",
   *   "roles": ["Buyer", "Seller"],
   *   "canPerformBuyerActions": true,
   *   "canPerformProviderActions": false (if only Buyer role)
   * }
   */
  async handle(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    this.log("INFO", "Role assignment request received", {
      requestId: context.requestId,
    });

    try {
      // Parse request body
      const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;

      // Validate required fields
      const validation = this.validateRequestBody(body, [
        "userId",
        "action",
      ]);
      if (!validation.valid) {
        this.log("WARN", "Role assignment request missing required fields", {
          errors: validation.errors,
        });

        return this.handleError(
          new Error(validation.errors.join(", ")),
          400
        );
      }

      const { userId, action, requiredRole, newRole } = body;

      if (action === "verify") {
        if (!requiredRole) {
          return this.handleError(
            new Error("requiredRole is required for verify action"),
            400
          );
        }

        const hasRole = await this.verifyUserRole(userId, requiredRole);

        if (!hasRole) {
          return this.handleError(
            new Error(`User does not have ${requiredRole} role`),
            403
          );
        }

        // For Buyer role, verify they cannot perform provider actions
        if (requiredRole === "Buyer") {
          const canPerformProvider = await this.verifyUserRole(
            userId,
            "Provider"
          );

          return this.handleSuccess({
            userId,
            hasRole: true,
            requiredRole,
            canPerformBuyerActions: true,
            canPerformProviderActions: canPerformProvider,
            message: "User verification successful",
          });
        }

        return this.handleSuccess({
          userId,
          hasRole: true,
          requiredRole,
          message: "User verification successful",
        });
      } else if (action === "assign") {
        if (!newRole) {
          return this.handleError(
            new Error("newRole is required for assign action"),
            400
          );
        }

        await this.assignRole(userId, newRole);

        // Get updated user
        const response = await this.dynamodb.getItem({
          TableName: this.usersTableName,
          Key: { userId: { S: userId } },
        });

        const roles = response.Item?.role?.L?.map((r: any) => r.S) || [];

        return this.handleSuccess({
          userId,
          roles,
          newRole,
          message: `Role ${newRole} assigned successfully`,
        });
      } else {
        return this.handleError(
          new Error('action must be either "verify" or "assign"'),
          400
        );
      }
    } catch (error) {
      this.log("ERROR", "Role assignment handler error", {
        error: error instanceof Error ? error.message : String(error),
      });

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
  const roleAssignmentHandler = new RoleAssignmentHandler();
  return roleAssignmentHandler.handle(event, context);
};
