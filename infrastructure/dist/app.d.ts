import * as cdk from 'aws-cdk-lib';
/**
 * Main CDK Application Stack
 *
 * Orchestrates the creation of all infrastructure stacks:
 * - DynamoDB tables (Task 1.3)
 * - S3 bucket (Task 1.4)
 * - Cognito user pool (Task 1.5)
 * - API Gateway & WebSocket (Task 1.6)
 *
 * Usage:
 * cdk deploy --all
 *
 * Clean up:
 * cdk destroy --all
 */
export declare class UTMMarketplaceInfrastructureApp extends cdk.App {
    constructor();
}
