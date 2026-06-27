import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
/**
 * Cognito Stack for UTM Student Marketplace
 *
 * Creates Cognito User Pool with:
 * - Email domain validation (only @graduate.utm.my or @utm.my)
 * - Strong password policy (12+ chars, uppercase, numbers, symbols)
 * - JWT token configuration (access: 15min, refresh: 7days)
 * - Email verification workflow
 * - User Pool Client with OAuth configuration
 * - Custom Lambda trigger for email domain validation
 * - Development/testing user pool option
 */
export declare class CognitoStack extends cdk.Stack {
    readonly userPool: cognito.UserPool;
    readonly userPoolClient: cognito.UserPoolClient;
    readonly userPoolId: string;
    readonly clientId: string;
    constructor(scope: Construct, id: string, props?: cdk.StackProps);
}
