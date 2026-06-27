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
exports.APIGatewayStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const apigatewayv2 = __importStar(require("aws-cdk-lib/aws-apigatewayv2"));
const apigatewayv2Integrations = __importStar(require("aws-cdk-lib/aws-apigatewayv2-integrations"));
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
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
class APIGatewayStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // ============================================================================
        // REST API GATEWAY CREATION
        // ============================================================================
        const restApiLogGroup = new logs.LogGroup(this, 'RestApiLogGroup', {
            logGroupName: '/aws/apigateway/utm-marketplace-rest',
            retention: logs.RetentionDays.ONE_MONTH,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        this.restApi = new apigateway.RestApi(this, 'UTMMarketplaceRestApi', {
            restApiName: 'utm-marketplace-rest-api',
            description: 'REST API for UTM Student Marketplace',
            deployOptions: {
                stageName: 'v1',
                loggingLevel: apigateway.MethodLoggingLevel.INFO,
                dataTraceEnabled: true,
                accessLogDestination: new apigateway.LogGroupLogDestination(restApiLogGroup),
                accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
                tracingEnabled: true,
                metricsEnabled: true,
                throttlingBurstLimit: 5000,
                throttlingRateLimit: 2000,
                variables: {
                    environment: 'development',
                    apiVersion: 'v1',
                },
            },
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: [
                    apigateway.HttpMethod.GET,
                    apigateway.HttpMethod.POST,
                    apigateway.HttpMethod.PUT,
                    apigateway.HttpMethod.DELETE,
                    apigateway.HttpMethod.PATCH,
                    apigateway.HttpMethod.OPTIONS,
                ],
                allowHeaders: [
                    'Content-Type',
                    'Authorization',
                    'X-Amz-Date',
                    'X-Api-Key',
                    'X-Amz-Security-Token',
                    'X-Amz-User-Agent',
                ],
                exposeHeaders: ['x-amz-request-id', 'Content-Length', 'ETag'],
                maxAge: cdk.Duration.days(1),
                disableCache: false,
            },
            endpointConfiguration: {
                types: [apigateway.EndpointType.REGIONAL],
            },
        });
        // ============================================================================
        // COGNITO AUTHORIZER FOR REST API
        // ============================================================================
        const cognitoAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
            cognitoUserPools: [props.userPool],
            authorizerName: 'utm-marketplace-cognito-authorizer',
            identitySource: 'method.request.header.Authorization',
            resultsCacheTtl: cdk.Duration.minutes(5),
        });
        // ============================================================================
        // API RESOURCES STRUCTURE
        // ============================================================================
        // /auth
        const authResource = this.restApi.root.addResource('auth');
        authResource.addMethod('OPTIONS', new apigateway.MockIntegration({
            integrationResponses: [{ statusCode: '200' }],
        }), {
            methodResponses: [{ statusCode: '200' }],
        });
        // /users
        const usersResource = this.restApi.root.addResource('users');
        usersResource.addMethod('GET', new apigateway.MockIntegration({
            integrationResponses: [{ statusCode: '200' }],
        }), {
            authorizer: cognitoAuthorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            methodResponses: [{ statusCode: '200' }],
        });
        // /rides
        const ridesResource = this.restApi.root.addResource('rides');
        ridesResource.addMethod('GET', new apigateway.MockIntegration({
            integrationResponses: [{ statusCode: '200' }],
        }), {
            authorizer: cognitoAuthorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        ridesResource.addMethod('POST', new apigateway.MockIntegration({
            integrationResponses: [{ statusCode: '201' }],
        }), {
            authorizer: cognitoAuthorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // /orders
        const ordersResource = this.restApi.root.addResource('orders');
        ordersResource.addMethod('GET', new apigateway.MockIntegration({
            integrationResponses: [{ statusCode: '200' }],
        }), {
            authorizer: cognitoAuthorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        ordersResource.addMethod('POST', new apigateway.MockIntegration({
            integrationResponses: [{ statusCode: '201' }],
        }), {
            authorizer: cognitoAuthorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // /menu
        const menuResource = this.restApi.root.addResource('menu');
        menuResource.addMethod('GET', new apigateway.MockIntegration({
            integrationResponses: [{ statusCode: '200' }],
        }));
        // /applications
        const applicationsResource = this.restApi.root.addResource('applications');
        applicationsResource.addMethod('POST', new apigateway.MockIntegration({
            integrationResponses: [{ statusCode: '201' }],
        }), {
            authorizer: cognitoAuthorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // /admin
        const adminResource = this.restApi.root.addResource('admin');
        adminResource.addMethod('GET', new apigateway.MockIntegration({
            integrationResponses: [{ statusCode: '200' }],
        }), {
            authorizer: cognitoAuthorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // ============================================================================
        // WEBSOCKET API GATEWAY CREATION
        // ============================================================================
        const wsApiLogGroup = new logs.LogGroup(this, 'WebSocketApiLogGroup', {
            logGroupName: '/aws/apigateway/utm-marketplace-websocket',
            retention: logs.RetentionDays.ONE_MONTH,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        this.websocketApi = new apigatewayv2.WebSocketApi(this, 'UTMMarketplaceWebSocketApi', {
            apiName: 'utm-marketplace-websocket-api',
            description: 'WebSocket API for real-time messaging',
            routeSelectionExpression: '$request.body.action',
            connectRouteOptions: {
                integration: new apigatewayv2Integrations.WebSocketAwsIntegration({
                    type: apigatewayv2Integrations.WebSocketIntegrationType.MOCK,
                }),
            },
            disconnectRouteOptions: {
                integration: new apigatewayv2Integrations.WebSocketAwsIntegration({
                    type: apigatewayv2Integrations.WebSocketIntegrationType.MOCK,
                }),
            },
        });
        // WebSocket Stage
        const wsStage = new apigatewayv2.WebSocketStage(this, 'WebSocketStage', {
            webSocketApi: this.websocketApi,
            stageName: 'v1',
            autoDeploy: true,
            loggingLevel: apigatewayv2.WebSocketLoggingLevel.INFO,
            dataTraceEnabled: true,
            accessLogDestination: new apigatewayv2.LogGroupLogDestination(wsApiLogGroup),
            accessLogFormat: apigatewayv2.AccessLogFormat.jsonWithStandardFields(),
            tracingEnabled: true,
        });
        // ============================================================================
        // WEBSOCKET ROUTES
        // ============================================================================
        // Default route for messages
        this.websocketApi.addRoute('$default', {
            integration: new apigatewayv2Integrations.WebSocketAwsIntegration({
                type: apigatewayv2Integrations.WebSocketIntegrationType.MOCK,
            }),
        });
        // Send message route
        this.websocketApi.addRoute('sendMessage', {
            integration: new apigatewayv2Integrations.WebSocketAwsIntegration({
                type: apigatewayv2Integrations.WebSocketIntegrationType.MOCK,
            }),
        });
        // Chat channel route
        this.websocketApi.addRoute('joinChannel', {
            integration: new apigatewayv2Integrations.WebSocketAwsIntegration({
                type: apigatewayv2Integrations.WebSocketIntegrationType.MOCK,
            }),
        });
        // ============================================================================
        // REQUEST VALIDATORS
        // ============================================================================
        const requestValidator = this.restApi.addRequestValidator('RequestValidator', {
            validateRequestBody: true,
            validateRequestParameters: true,
        });
        // ============================================================================
        // API KEYS AND USAGE PLANS (Optional - for rate limiting)
        // ============================================================================
        const apiKey = this.restApi.addApiKey('MarketplaceApiKey', {
            apiKeyName: 'utm-marketplace-api-key',
            description: 'API Key for UTM Marketplace',
        });
        const usagePlan = this.restApi.addUsagePlan('MarketplaceUsagePlan', {
            name: 'utm-marketplace-usage-plan',
            description: 'Usage plan for UTM Marketplace API',
            throttle: {
                rateLimit: 2000,
                burstLimit: 5000,
            },
            quota: {
                limit: 1000000,
                period: apigateway.Period.DAY,
            },
            apiStages: [
                {
                    api: this.restApi,
                    stage: this.restApi.deploymentStage,
                },
            ],
        });
        usagePlan.addApiKey(apiKey);
        // ============================================================================
        // CUSTOM DOMAIN (Optional - for production)
        // ============================================================================
        // TODO: Add custom domain configuration when domain is available
        // Example:
        // const domainName = new apigateway.DomainName(this, 'ApiDomain', {
        //   domainName: 'api.marketplace.utm.edu.my',
        //   certificate: acm.Certificate.fromCertificateArn(...),
        //   basePath: 'v1',
        // });
        // domainName.addBasePathMapping(this.restApi, { basePath: 'api' });
        // ============================================================================
        // OUTPUTS
        // ============================================================================
        this.restApiUrl = this.restApi.url;
        this.websocketApiUrl = `${this.websocketApi.apiEndpoint}/${wsStage.stageName}`;
        new cdk.CfnOutput(this, 'RestApiUrl', {
            value: this.restApiUrl,
            description: 'REST API endpoint URL',
            exportName: 'UTMMarketplaceRestApiUrl',
        });
        new cdk.CfnOutput(this, 'RestApiId', {
            value: this.restApi.restApiId,
            description: 'REST API ID',
            exportName: 'UTMMarketplaceRestApiId',
        });
        new cdk.CfnOutput(this, 'WebSocketApiUrl', {
            value: this.websocketApiUrl,
            description: 'WebSocket API endpoint URL',
            exportName: 'UTMMarketplaceWebSocketUrl',
        });
        new cdk.CfnOutput(this, 'WebSocketApiId', {
            value: this.websocketApi.apiId,
            description: 'WebSocket API ID',
            exportName: 'UTMMarketplaceWebSocketApiId',
        });
        new cdk.CfnOutput(this, 'ApiKeyId', {
            value: apiKey.keyId,
            description: 'API Key ID',
            exportName: 'UTMMarketplaceApiKeyId',
        });
        new cdk.CfnOutput(this, 'CurlExamples', {
            value: JSON.stringify({
                rest_api: this.restApiUrl,
                websocket_api: this.websocketApiUrl,
                examples: {
                    get_rides: `curl -X GET ${this.restApiUrl}rides -H "Authorization: Bearer YOUR_TOKEN"`,
                    create_ride: `curl -X POST ${this.restApiUrl}rides -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d '{"pickupLocation":"Library","dropoffLocation":"Dorm A"}'`,
                },
            }, null, 2),
            description: 'API endpoint examples for testing',
        });
    }
}
exports.APIGatewayStack = APIGatewayStack;
