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
export declare class S3Stack extends cdk.Stack {
    readonly marketplaceBucket: s3.Bucket;
    constructor(scope: Construct, id: string, props?: cdk.StackProps);
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
export declare function generatePresignedUrl(bucketName: string, objectKey: string, expirationSeconds?: number): Promise<string>;
