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
export class DynamoDBStack extends cdk.Stack {
  public readonly usersTable: dynamodb.Table;
  public readonly ridesTable: dynamodb.Table;
  public readonly ordersTable: dynamodb.Table;
  public readonly menuItemsTable: dynamodb.Table;
  public readonly messagesTable: dynamodb.Table;
  public readonly chatChannelsTable: dynamodb.Table;
  public readonly applicationsTable: dynamodb.Table;
  public readonly paymentsTable: dynamodb.Table;
  public readonly printingOrdersTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ============================================================================
    // 1. USERS TABLE
    // Primary: userId | GSI: email, role, accountStatus
    // ============================================================================
    this.usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'Users',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamSpecification.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // GSI1: email-index (lookup user by email)
    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'email-index',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI2: role-index (find users by role)
    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'role-index',
      partitionKey: { name: 'role', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI3: status-index (find active/suspended users)
    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'status-index',
      partitionKey: { name: 'accountStatus', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'updatedAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ============================================================================
    // 2. RIDES TABLE
    // Primary: rideId + createdAt | GSI: buyerId, driverId, status, driverId-status
    // ============================================================================
    this.ridesTable = new dynamodb.Table(this, 'RidesTable', {
      tableName: 'Rides',
      partitionKey: { name: 'rideId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamSpecification.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // GSI1: buyerId-index (buyer's ride history)
    this.ridesTable.addGlobalSecondaryIndex({
      indexName: 'buyerId-index',
      partitionKey: { name: 'buyerId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI2: driverId-index (driver's ride history)
    this.ridesTable.addGlobalSecondaryIndex({
      indexName: 'driverId-index',
      partitionKey: { name: 'driverId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI3: status-index (find rides by status)
    this.ridesTable.addGlobalSecondaryIndex({
      indexName: 'status-index',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI4: driverId-status-index (active rides for driver)
    this.ridesTable.addGlobalSecondaryIndex({
      indexName: 'driverId-status-index',
      partitionKey: { name: 'driverId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ============================================================================
    // 3. ORDERS TABLE (F&B + Parcel)
    // Primary: orderId + createdAt | GSI: buyerId, providerId, status, serviceType
    // ============================================================================
    this.ordersTable = new dynamodb.Table(this, 'OrdersTable', {
      tableName: 'Orders',
      partitionKey: { name: 'orderId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamSpecification.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // GSI1: buyerId-index (buyer's order history)
    this.ordersTable.addGlobalSecondaryIndex({
      indexName: 'buyerId-index',
      partitionKey: { name: 'buyerId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI2: providerId-index (seller/runner's order history)
    this.ordersTable.addGlobalSecondaryIndex({
      indexName: 'providerId-index',
      partitionKey: { name: 'providerId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI3: status-index (find orders by status)
    this.ordersTable.addGlobalSecondaryIndex({
      indexName: 'status-index',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI4: serviceType-index (find orders by service type)
    this.ordersTable.addGlobalSecondaryIndex({
      indexName: 'serviceType-index',
      partitionKey: { name: 'serviceType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ============================================================================
    // 4. MENU ITEMS TABLE
    // Primary: menuItemId | GSI: sellerId, status
    // ============================================================================
    this.menuItemsTable = new dynamodb.Table(this, 'MenuItemsTable', {
      tableName: 'MenuItems',
      partitionKey: { name: 'menuItemId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamSpecification.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // GSI1: sellerId-index (browse seller's menu)
    this.menuItemsTable.addGlobalSecondaryIndex({
      indexName: 'sellerId-index',
      partitionKey: { name: 'sellerId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'itemName', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI2: status-index (find available items)
    this.menuItemsTable.addGlobalSecondaryIndex({
      indexName: 'status-index',
      partitionKey: { name: 'sellerId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'stockStatus', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ============================================================================
    // 5. MESSAGES TABLE
    // Primary: chatChannelId + messageId | GSI: chatChannelId-createdAt
    // ============================================================================
    this.messagesTable = new dynamodb.Table(this, 'MessagesTable', {
      tableName: 'Messages',
      partitionKey: { name: 'chatChannelId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'messageId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamSpecification.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      // TTL for automatic cleanup of old messages (optional - 90 days)
      timeToLiveAttribute: 'expirationTime',
    });

    // GSI1: chatChannelId-createdAt (message timeline)
    this.messagesTable.addGlobalSecondaryIndex({
      indexName: 'chatChannelId-createdAt',
      partitionKey: { name: 'chatChannelId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ============================================================================
    // 6. CHAT CHANNELS TABLE
    // Primary: chatChannelId | GSI: buyerId, providerId, transactionId
    // ============================================================================
    this.chatChannelsTable = new dynamodb.Table(this, 'ChatChannelsTable', {
      tableName: 'ChatChannels',
      partitionKey: { name: 'chatChannelId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamSpecification.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // GSI1: buyerId-index (buyer's chat channels)
    this.chatChannelsTable.addGlobalSecondaryIndex({
      indexName: 'buyerId-index',
      partitionKey: { name: 'buyerId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI2: providerId-index (provider's chat channels)
    this.chatChannelsTable.addGlobalSecondaryIndex({
      indexName: 'providerId-index',
      partitionKey: { name: 'providerId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI3: transactionId-index (find chat for transaction)
    this.chatChannelsTable.addGlobalSecondaryIndex({
      indexName: 'transactionId-index',
      partitionKey: { name: 'transactionId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'transactionType', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ============================================================================
    // 7. APPLICATIONS TABLE
    // Primary: applicationId | GSI: userId, status, roleType
    // ============================================================================
    this.applicationsTable = new dynamodb.Table(this, 'ApplicationsTable', {
      tableName: 'Applications',
      partitionKey: { name: 'applicationId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamSpecification.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // GSI1: userId-index (user's applications)
    this.applicationsTable.addGlobalSecondaryIndex({
      indexName: 'userId-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'submittedAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI2: status-index (admin dashboard - pending applications)
    this.applicationsTable.addGlobalSecondaryIndex({
      indexName: 'status-index',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'submittedAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI3: roleType-index (analytics on applications per role)
    this.applicationsTable.addGlobalSecondaryIndex({
      indexName: 'roleType-index',
      partitionKey: { name: 'roleType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ============================================================================
    // 8. PAYMENTS & TRANSACTIONS TABLE
    // Primary: transactionId + createdAt | GSI: buyerId, payeeId, status, escrowReleaseTime
    // ============================================================================
    this.paymentsTable = new dynamodb.Table(this, 'PaymentsTable', {
      tableName: 'Payments',
      partitionKey: { name: 'transactionId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamSpecification.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // GSI1: buyerId-index (buyer's transaction history)
    this.paymentsTable.addGlobalSecondaryIndex({
      indexName: 'buyerId-index',
      partitionKey: { name: 'buyerId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI2: payeeId-index (provider's earnings)
    this.paymentsTable.addGlobalSecondaryIndex({
      indexName: 'payeeId-index',
      partitionKey: { name: 'payeeId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI3: status-index (find transactions by status)
    this.paymentsTable.addGlobalSecondaryIndex({
      indexName: 'status-index',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI4: escrowReleaseTime-index (auto-release scheduler)
    this.paymentsTable.addGlobalSecondaryIndex({
      indexName: 'escrowReleaseTime-index',
      partitionKey: { name: 'escrowReleaseTime', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ============================================================================
    // 9. PRINTING ORDERS TABLE
    // Primary: printingOrderId + createdAt | GSI: buyerId, providerId, status
    // ============================================================================
    this.printingOrdersTable = new dynamodb.Table(this, 'PrintingOrdersTable', {
      tableName: 'PrintingOrders',
      partitionKey: { name: 'printingOrderId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamSpecification.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // GSI1: buyerId-index (buyer's printing orders)
    this.printingOrdersTable.addGlobalSecondaryIndex({
      indexName: 'buyerId-index',
      partitionKey: { name: 'buyerId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI2: providerId-index (provider's printing orders)
    this.printingOrdersTable.addGlobalSecondaryIndex({
      indexName: 'providerId-index',
      partitionKey: { name: 'providerId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI3: status-index (find orders by status)
    this.printingOrdersTable.addGlobalSecondaryIndex({
      indexName: 'status-index',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Output table names for reference
    new cdk.CfnOutput(this, 'UsersTableName', {
      value: this.usersTable.tableName,
      description: 'Users table name',
    });

    new cdk.CfnOutput(this, 'RidesTableName', {
      value: this.ridesTable.tableName,
      description: 'Rides table name',
    });

    new cdk.CfnOutput(this, 'OrdersTableName', {
      value: this.ordersTable.tableName,
      description: 'Orders table name',
    });

    new cdk.CfnOutput(this, 'PaymentsTableName', {
      value: this.paymentsTable.tableName,
      description: 'Payments table name',
    });
  }
}
