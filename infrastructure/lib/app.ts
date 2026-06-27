import * as cdk from 'aws-cdk-lib';
import { DynamoDBStack } from './dynamodb-stack';
import { S3Stack } from './s3-stack';
import { CognitoStack } from './cognito-stack';
import { APIGatewayStack } from './api-gateway-stack';

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
export class UTMMarketplaceInfrastructureApp extends cdk.App {
  constructor() {
    super();

    const environment = {
      region: process.env.AWS_REGION || 'ap-southeast-1',
    };

    // Create DynamoDB Stack
    const dynamodbStack = new DynamoDBStack(this, 'UTMMarketplaceDynamoDBStack', {
      env: environment,
      description: 'DynamoDB tables for UTM Student Marketplace - Task 1.3',
    });

    // Create S3 Stack
    const s3Stack = new S3Stack(this, 'UTMMarketplaceS3Stack', {
      env: environment,
      description: 'S3 bucket for UTM Student Marketplace - Task 1.4',
    });

    // Create Cognito Stack
    const cognitoStack = new CognitoStack(this, 'UTMMarketplaceCognitoStack', {
      env: environment,
      description: 'Cognito user pool for UTM Student Marketplace - Task 1.5',
    });

    // Create API Gateway Stack (Task 1.6)
    const apiGatewayStack = new APIGatewayStack(this, 'UTMMarketplaceAPIGatewayStack', {
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

const app = new UTMMarketplaceInfrastructureApp();
