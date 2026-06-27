"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UTMMarketplaceInfrastructureApp = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const dynamodb_stack_1 = require("./dynamodb-stack");
const s3_stack_1 = require("./s3-stack");
const cognito_stack_1 = require("./cognito-stack");
const api_gateway_stack_1 = require("./api-gateway-stack");
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
class UTMMarketplaceInfrastructureApp extends cdk.App {
    constructor() {
        super();
        const environment = {
            region: process.env.AWS_REGION || 'ap-southeast-1',
        };
        // Create DynamoDB Stack
        const dynamodbStack = new dynamodb_stack_1.DynamoDBStack(this, 'UTMMarketplaceDynamoDBStack', {
            env: environment,
            description: 'DynamoDB tables for UTM Student Marketplace - Task 1.3',
        });
        // Create S3 Stack
        const s3Stack = new s3_stack_1.S3Stack(this, 'UTMMarketplaceS3Stack', {
            env: environment,
            description: 'S3 bucket for UTM Student Marketplace - Task 1.4',
        });
        // Create Cognito Stack
        const cognitoStack = new cognito_stack_1.CognitoStack(this, 'UTMMarketplaceCognitoStack', {
            env: environment,
            description: 'Cognito user pool for UTM Student Marketplace - Task 1.5',
        });
        // Create API Gateway Stack (Task 1.6)
        const apiGatewayStack = new api_gateway_stack_1.APIGatewayStack(this, 'UTMMarketplaceAPIGatewayStack', {
            env: environment,
            description: 'API Gateway and WebSocket endpoints for UTM Student Marketplace - Task 1.6',
            userPool: cognitoStack.userPool,
            userPoolClient: cognitoStack.userPoolClient,
        });
        // Add dependencies
        apiGatewayStack.addDependency(cognitoStack);
        // Add tags to all stacks
        const tags = [
            { key: 'Project', value: 'UTMStudentMarketplace' },
            { key: 'Environment', value: 'Development' },
            { key: 'ManagedBy', value: 'CDK' },
        ];
        tags.forEach(tag => {
            cdk.Tags.of(dynamodbStack).add(tag.key, tag.value);
            cdk.Tags.of(s3Stack).add(tag.key, tag.value);
            cdk.Tags.of(cognitoStack).add(tag.key, tag.value);
            cdk.Tags.of(apiGatewayStack).add(tag.key, tag.value);
        });
    }
}
exports.UTMMarketplaceInfrastructureApp = UTMMarketplaceInfrastructureApp;
const app = new UTMMarketplaceInfrastructureApp();
