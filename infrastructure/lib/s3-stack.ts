import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

/**
 * S3 Stack for UTM Student Marketplace
 * 
 * Creates S3 bucket with:
 * - Versioning enabled for audit trail
 * - AES-256 encryption (SSE-S3)
 * - CORS policy for Next.js frontend
 * - Organized folder structure
 * - Pre-signed URL generation configuration
 * - Lifecycle policies for version management
 * - Public access blocked
 */
export class S3Stack extends cdk.Stack {
  public readonly marketplaceBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get AWS account ID for unique bucket naming
    const accountId = cdk.Stack.of(this).account;

    // ============================================================================
    // S3 BUCKET CREATION
    // ============================================================================
    this.marketplaceBucket = new s3.Bucket(this, 'MarketplaceBucket', {
      bucketName: `utm-marketplace-bucket-${accountId}`,
      
      // Versioning: Enable for audit trail and recovery
      versioned: true,

      // Encryption: AES-256 (SSE-S3)
      encryption: s3.BucketEncryption.S3_MANAGED,

      // Block public access: Enforce security
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,

      // Enable access logging (optional but recommended)
      accessLogPrefix: 'logs/',

      // Removal policy for CDK
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // ============================================================================
    // BUCKET POLICY: CORS Configuration
    // Allows Next.js frontend to access pre-signed URLs
    // ============================================================================
    this.marketplaceBucket.addCorsRule({
      allowedHeaders: ['*'],
      allowedMethods: [
        s3.HttpMethods.GET,
        s3.HttpMethods.POST,
        s3.HttpMethods.PUT,
        s3.HttpMethods.DELETE,
        s3.HttpMethods.HEAD,
      ],
      allowedOrigins: [
        'http://localhost:3000', // Development
        'http://localhost:3001',
        // Production origin should be added via environment variable
        // e.g., 'https://marketplace.utm.edu.my'
      ],
      exposedHeaders: [
        'ETag',
        'x-amz-version-id',
        'x-amz-meta-custom-header',
      ],
      maxAge: cdk.Duration.days(1),
    });

    // ============================================================================
    // LIFECYCLE POLICY
    // Transition old versions to Glacier for cost optimization (optional)
    // ============================================================================
    this.marketplaceBucket.addLifecycleRule({
      // Delete non-current versions after 90 days
      noncurrentVersionExpiration: cdk.Duration.days(90),
      
      // Transition non-current versions to Glacier after 30 days
      noncurrentVersionTransitions: [
        {
          storageClass: s3.StorageClass.GLACIER,
          transitionAfter: cdk.Duration.days(30),
        },
      ],
    });

    // ============================================================================
    // BUCKET STRUCTURE DOCUMENTATION
    // Note: Folders are logical in S3, created by upload paths
    // ============================================================================
    // licenses/
    //   - Driver license documents: licenses/{driverId}/{filename}.pdf
    //   - Format: licenses/uuid_1/license.pdf
    //
    // profiles/
    //   - User profile pictures: profiles/{userId}.jpg
    //   - Format: profiles/uuid_1.jpg
    //
    // printing/
    //   - Printing service files: printing/{buyerId}/{fileId}.ext
    //   - Format: printing/uuid_1/file_uuid_1.pdf
    //
    // documents/
    //   - Application documents (seller registration, runner insurance)
    //   - Format: documents/{applicationId}/{documentType}.pdf
    //
    // invoices/
    //   - Transaction receipts and invoices
    //   - Format: invoices/{transactionId}.pdf
    //
    // logs/
    //   - S3 access logs (automatically managed)

    // ============================================================================
    // OUTPUTS
    // ============================================================================
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.marketplaceBucket.bucketName,
      description: 'S3 bucket name for file storage',
    });

    new cdk.CfnOutput(this, 'BucketArn', {
      value: this.marketplaceBucket.bucketArn,
      description: 'S3 bucket ARN',
    });

    new cdk.CfnOutput(this, 'BucketDomain', {
      value: this.marketplaceBucket.bucketDomainName,
      description: 'S3 bucket domain name for CORS configuration',
    });
  }
}

/**
 * Utility function to generate pre-signed URLs for S3 objects
 * This function should be used in Lambda handlers
 * 
 * Example usage:
 * ```
 * const s3Client = new S3Client({ region: 'ap-southeast-1' });
 * const url = await generatePresignedUrl(
 *   s3Client,
 *   'utm-marketplace-bucket-123456789',
 *   'profiles/user_uuid.jpg',
 *   3600 // 1 hour
 * );
 * ```
 */
export async function generatePresignedUrl(
  bucketName: string,
  objectKey: string,
  expirationSeconds: number = 3600
): Promise<string> {
  // This will be implemented in the Lambda handler utility layer
  // Import from @aws-sdk/s3-request-presigner
  throw new Error('Implementation required in Lambda utilities');
}
