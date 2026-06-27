import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

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
export class CognitoStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly userPoolId: string;
  public readonly clientId: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ============================================================================
    // COGNITO USER POOL CREATION
    // ============================================================================
    this.userPool = new cognito.UserPool(this, 'UTMMarketplaceUserPool', {
      userPoolName: 'utm-student-marketplace-pool',
      
      // Self sign-up configuration
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: false,
      },

      // Password policy: Minimum 12 characters, uppercase, numbers, symbols
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },

      // Email verification workflow
      userVerification: {
        emailStyle: cognito.VerificationEmailStyle.CODE,
        emailSubject: 'Verify your UTM Marketplace email',
      },

      // Account recovery configuration
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,

      // Auto-verified attributes
      autoVerifiedAttributes: [],

      // Removal policy
      removalPolicy: cdk.RemovalPolicy.DESTROY,

      // Enable advanced security (optional but recommended)
      advancedSecurityMode: cognito.AdvancedSecurityMode.ENFORCED,

      // CloudWatch logging
      logs: {
        cloudWatch: {
          logRetention: logs.RetentionDays.ONE_MONTH,
        },
      },
    });

    // ============================================================================
    // CUSTOM LAMBDA TRIGGER FOR EMAIL DOMAIN VALIDATION
    // Validates that emails end with @graduate.utm.my or @utm.my
    // ============================================================================
    const emailValidationLambda = new lambda.Function(
      this,
      'EmailDomainValidationLambda',
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset(
          path.join(__dirname, '../lambdas/email-validation')
        ),
        timeout: cdk.Duration.seconds(30),
        logRetention: logs.RetentionDays.ONE_WEEK,
        environment: {
          ALLOWED_DOMAINS: JSON.stringify([
            '@graduate.utm.my',
            '@utm.my',
          ]),
        },
      }
    );

    // Add Lambda permission for Cognito to invoke it
    this.userPool.addTrigger(
      cognito.UserPoolOperation.PRE_SIGN_UP,
      emailValidationLambda
    );

    // ============================================================================
    // JWT TOKEN CONFIGURATION
    // Access token: 15 minutes, Refresh token: 7 days
    // ============================================================================
    this.userPoolClient = this.userPool.addClient('MarketplaceClient', {
      clientName: 'utm-marketplace-web',
      
      // Explicit auth flows
      authFlows: {
        adminUserPasswordAuth: true,
        userPassword: true,
        custom: true,
        userSrp: true,
      },

      // Token expiration
      accessTokenValidity: cdk.Duration.minutes(15),
      idTokenValidity: cdk.Duration.minutes(15),
      refreshTokenValidity: cdk.Duration.days(7),

      // OAuth configuration
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
          cognito.OAuthScope.EMAIL,
        ],
        callbackUrls: [
          'http://localhost:3000/auth/callback', // Development
          'http://localhost:3001/auth/callback',
          // Production callback URL should be added via environment variable
          // 'https://marketplace.utm.edu.my/auth/callback',
        ],
      },

      // Prevent token reuse
      preventUserExistenceErrors: true,

      // Enable PKCE for SPA
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ],

      // Generate client secret (optional - usually not needed for SPAs)
      generateSecret: false,
    });

    // ============================================================================
    // USER POOL DOMAIN
    // For hosted UI and OAuth endpoints
    // ============================================================================
    const userPoolDomain = this.userPool.addDomain('MarketplaceDomain', {
      cognitoDomain: {
        domainPrefix: `utm-marketplace-${cdk.Stack.of(this).account}`,
      },
    });

    // ============================================================================
    // OPTIONAL: DEVELOPMENT USER POOL
    // Separate pool for testing with pre-created test users
    // ============================================================================
    const devUserPool = new cognito.UserPool(
      this,
      'UTMMarketplaceDevUserPool',
      {
        userPoolName: 'utm-student-marketplace-dev-pool',
        selfSignUpEnabled: true,
        signInAliases: {
          email: true,
          username: false,
        },
        passwordPolicy: {
          minLength: 12,
          requireLowercase: true,
          requireUppercase: true,
          requireDigits: true,
          requireSymbols: true,
        },
        userVerification: {
          emailStyle: cognito.VerificationEmailStyle.CODE,
          emailSubject: 'Verify your UTM Marketplace Dev email',
        },
        accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        advancedSecurityMode: cognito.AdvancedSecurityMode.ENFORCED,
        logs: {
          cloudWatch: {
            logRetention: logs.RetentionDays.ONE_WEEK,
          },
        },
      }
    );

    // Add email validation Lambda to dev pool
    devUserPool.addTrigger(
      cognito.UserPoolOperation.PRE_SIGN_UP,
      emailValidationLambda
    );

    const devUserPoolClient = devUserPool.addClient('DevMarketplaceClient', {
      clientName: 'utm-marketplace-dev-web',
      authFlows: {
        adminUserPasswordAuth: true,
        userPassword: true,
        custom: true,
        userSrp: true,
      },
      accessTokenValidity: cdk.Duration.minutes(15),
      idTokenValidity: cdk.Duration.minutes(15),
      refreshTokenValidity: cdk.Duration.days(7),
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
          cognito.OAuthScope.EMAIL,
        ],
        callbackUrls: [
          'http://localhost:3000/auth/callback',
          'http://localhost:3001/auth/callback',
        ],
      },
      preventUserExistenceErrors: true,
      generateSecret: false,
    });

    const devUserPoolDomain = devUserPool.addDomain('DevMarketplaceDomain', {
      cognitoDomain: {
        domainPrefix: `utm-marketplace-dev-${cdk.Stack.of(this).account}`,
      },
    });

    // ============================================================================
    // CREATE TEST USERS IN DEV POOL (Optional)
    // Uncomment and use these for testing
    // ============================================================================
    // Test Buyer User
    devUserPool.addUser('TestBuyer', {
      username: 'test.buyer',
      email: 'test.buyer@graduate.utm.my',
      password: cdk.SecretValue.unsafePlainText('TempPassword123!'),
      messageAction: cognito.MessageAction.SUPPRESS,
    });

    // Test Driver User
    devUserPool.addUser('TestDriver', {
      username: 'test.driver',
      email: 'test.driver@graduate.utm.my',
      password: cdk.SecretValue.unsafePlainText('TempPassword123!'),
      messageAction: cognito.MessageAction.SUPPRESS,
    });

    // Test Seller User
    devUserPool.addUser('TestSeller', {
      username: 'test.seller',
      email: 'test.seller@utm.my',
      password: cdk.SecretValue.unsafePlainText('TempPassword123!'),
      messageAction: cognito.MessageAction.SUPPRESS,
    });

    // Test Admin User
    devUserPool.addUser('TestAdmin', {
      username: 'test.admin',
      email: 'test.admin@utm.my',
      password: cdk.SecretValue.unsafePlainText('TempPassword123!'),
      messageAction: cognito.MessageAction.SUPPRESS,
    });

    // ============================================================================
    // OUTPUTS
    // ============================================================================
    this.userPoolId = this.userPool.userPoolId;
    this.clientId = this.userPoolClient.userPoolClientId;

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID (production)',
    });

    new cdk.CfnOutput(this, 'UserPoolArn', {
      value: this.userPool.userPoolArn,
      description: 'Cognito User Pool ARN',
    });

    new cdk.CfnOutput(this, 'ClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID (production)',
    });

    new cdk.CfnOutput(this, 'UserPoolDomain', {
      value: userPoolDomain.domainName,
      description: 'Cognito User Pool Domain',
    });

    new cdk.CfnOutput(this, 'HostedUIUrl', {
      value: `https://${userPoolDomain.domainName}.auth.ap-southeast-1.amazoncognito.com/login?response_type=code&client_id=${this.userPoolClient.userPoolClientId}&redirect_uri=http://localhost:3000/auth/callback`,
      description: 'Cognito Hosted UI Login URL (development)',
    });

    // Dev pool outputs
    new cdk.CfnOutput(this, 'DevUserPoolId', {
      value: devUserPool.userPoolId,
      description: 'Cognito User Pool ID (development)',
    });

    new cdk.CfnOutput(this, 'DevClientId', {
      value: devUserPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID (development)',
    });

    new cdk.CfnOutput(this, 'DevUserPoolDomain', {
      value: devUserPoolDomain.domainName,
      description: 'Cognito User Pool Domain (development)',
    });

    new cdk.CfnOutput(this, 'DevHostedUIUrl', {
      value: `https://${devUserPoolDomain.domainName}.auth.ap-southeast-1.amazoncognito.com/login?response_type=code&client_id=${devUserPoolClient.userPoolClientId}&redirect_uri=http://localhost:3000/auth/callback`,
      description: 'Cognito Hosted UI Login URL (development)',
    });

    new cdk.CfnOutput(this, 'TestUsersInfo', {
      value: JSON.stringify({
        development_test_users: [
          {
            username: 'test.buyer',
            email: 'test.buyer@graduate.utm.my',
            password: 'TempPassword123!',
            role: 'Buyer',
          },
          {
            username: 'test.driver',
            email: 'test.driver@graduate.utm.my',
            password: 'TempPassword123!',
            role: 'Driver',
          },
          {
            username: 'test.seller',
            email: 'test.seller@utm.my',
            password: 'TempPassword123!',
            role: 'Seller',
          },
          {
            username: 'test.admin',
            email: 'test.admin@utm.my',
            password: 'TempPassword123!',
            role: 'Admin',
          },
        ],
      }),
      description: 'Test users created in development Cognito pool',
    });
  }
}
