import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { BaseHandler } from "../base/BaseHandler";
import { getLogger } from "../../utils/logger";

/**
 * Email Validation Lambda Handler
 *
 * Validates that email domain is either @graduate.utm.my or @utm.my
 *
 * Requirements: 1.1
 * - Validate email domain (@graduate.utm.my or @utm.my)
 * - Reject invalid domains with clear error message
 * - Return validation result to signup flow
 */
export class EmailValidationHandler extends BaseHandler {
  private readonly ALLOWED_DOMAINS = ["@graduate.utm.my", "@utm.my"];
  private logger = getLogger();

  /**
   * Validate email domain
   *
   * @param email - Email to validate
   * @returns Validation result with message
   */
  private validateEmailDomain(email: string): {
    valid: boolean;
    message: string;
  } {
    if (!email) {
      return {
        valid: false,
        message: "Email is required",
      };
    }

    const emailLowerCase = email.toLowerCase().trim();

    // Check if email format is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLowerCase)) {
      return {
        valid: false,
        message: "Invalid email format",
      };
    }

    // Check if domain is in allowed list
    const isAllowedDomain = this.ALLOWED_DOMAINS.some((domain) =>
      emailLowerCase.endsWith(domain)
    );

    if (!isAllowedDomain) {
      return {
        valid: false,
        message: `Email domain must be @graduate.utm.my or @utm.my`,
      };
    }

    return {
      valid: true,
      message: "Email domain is valid",
    };
  }

  /**
   * Handle email validation request
   *
   * Request body:
   * {
   *   "email": "user@graduate.utm.my"
   * }
   *
   * Response:
   * {
   *   "valid": true,
   *   "message": "Email domain is valid",
   *   "email": "user@graduate.utm.my"
   * }
   */
  async handle(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    this.logger.setContext({ requestId: context.requestId });
    this.logger.info("Email validation request received");

    try {
      // Parse request body
      const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;

      // Validate required fields
      const validation = this.validateRequestBody(body, ["email"]);
      if (!validation.valid) {
        this.logger.warn("Email validation request missing required fields", {
          errors: validation.errors,
        });

        return this.handleError(new Error(validation.errors.join(", ")), 400);
      }

      const { email } = body;

      // Validate email domain
      const emailValidation = this.validateEmailDomain(email);

      this.logger.info("Email validation result", {
        valid: emailValidation.valid,
        message: emailValidation.message,
      });

      // Return validation result
      return this.handleSuccess(
        {
          valid: emailValidation.valid,
          message: emailValidation.message,
          email: email.toLowerCase().trim(),
        },
        emailValidation.valid ? 200 : 400
      );
    } catch (error) {
      this.logger.error("Email validation handler error", error instanceof Error ? error : new Error(String(error)));

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
  const emailValidationHandler = new EmailValidationHandler();
  return emailValidationHandler.handle(event, context);
};
