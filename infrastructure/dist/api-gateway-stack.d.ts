import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
/**
 * API Gateway Stack for UTM Student Marketplace
 *
 * Creates:
 * 1. REST API Gateway with Cognito authorization
 * 2. WebSocket API Gateway for real-time messaging
 * 3. CORS configuration for Next.js frontend
 * 4. CloudWatch logging and X-Ray tracing
 *
 * Task 1.6 Implementation
 */
export declare class APIGatewayStack extends cdk.Stack {
    readonly restApi: apigateway.RestApi;
    readonly websocketApi: apigatewayv2.WebSocketApi;
    readonly restApiUrl: string;
    readonly websocketApiUrl: string;
    constructor(scope: Construct, id: string, props: cdk.StackProps & {
        userPool: cognito.IUserPool;
        userPoolClient: cognito.IUserPoolClient;
    });
}
