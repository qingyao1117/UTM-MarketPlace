import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
/**
 * DynamoDB Stack for UTM Student Marketplace
 *
 * Creates all tables required by the platform with:
 * - On-demand billing for flexibility
 * - Proper attribute definitions and key schemas
 * - Global Secondary Indexes (GSIs) for efficient querying
 * - DynamoDB Streams for messaging fallback
 */
export declare class DynamoDBStack extends cdk.Stack {
    readonly usersTable: dynamodb.Table;
    readonly ridesTable: dynamodb.Table;
    readonly ordersTable: dynamodb.Table;
    readonly menuItemsTable: dynamodb.Table;
    readonly messagesTable: dynamodb.Table;
    readonly chatChannelsTable: dynamodb.Table;
    readonly applicationsTable: dynamodb.Table;
    readonly paymentsTable: dynamodb.Table;
    readonly printingOrdersTable: dynamodb.Table;
    constructor(scope: Construct, id: string, props?: cdk.StackProps);
}
