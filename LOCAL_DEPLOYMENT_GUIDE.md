# Local Deployment Guide - UTM Student Marketplace

## Current Status

✅ **Frontend Infrastructure:**
- Next.js project with TypeScript, Tailwind CSS configured
- All dependencies installed
- Vercel configuration ready

✅ **Backend Code:**
- TypeScript Lambda handlers created
- Base handler classes implemented
- Auth handlers (signup, login, email validation, etc.)
- AWS SDK v2 integrated

❌ **CDK Infrastructure:**
- Has API compatibility issues with newer AWS CDK v2
- 42 TypeScript compilation errors to fix

---

## Quick Local Deployment Options

### Option 1: Deploy Frontend to Vercel (Recommended)

**Steps:**
1. Go to https://vercel.com → Import GitHub repo
2. Select `qingyao1117/UTM-MarketPlace`
3. Set Root Directory: `frontend`
4. Deploy (will show errors until backend is ready)

**After Deployment:**
Add environment variables in Vercel:
```
NEXT_PUBLIC_API_URL=<your-API-Gateway-URL>
NEXT_PUBLIC_WEBSOCKET_URL=<your-WebSocket-URL>
NEXT_PUBLIC_COGNITO_POOL_ID=<your-Cognito-Pool-ID>
NEXT_PUBLIC_COGNITO_CLIENT_ID=<your-Cognito-Client-ID>
NEXT_PUBLIC_S3_BUCKET=<your-S3-Bucket-Name>
```

### Option 2: Manual Lambda Setup (No CDK)

**Create Lambda Functions:**
1. Go to AWS Console → Lambda
2. Create 6 Lambda functions:
   - `auth-signup` - POST /auth/signup
   - `auth-login` - POST /auth/login
   - `auth-email-validation` - Email domain validation
   - `rides-create` - POST /rides
   - `orders-create` - POST /orders
   - `chat-websocket` - WebSocket handler

**Each Lambda needs:**
- Runtime: Node.js 18.x or 20.x
- Handler: `dist/lambdas/auth/SignupHandler.handler` (for example)
- Environment variables:
  ```
  AWS_REGION=ap-southeast-1
  DYNAMODB_TABLE_PREFIX=utm
  S3_BUCKET_NAME=<your-bucket>
  COGNITO_POOL_ID=<your-pool-id>
  ```

**Connect to API Gateway:**
1. Create REST API in API Gateway
2. Add routes: `/auth/signup`, `/auth/login`, etc.
3. Link each route to corresponding Lambda

**Configure Cognito:**
1. Create User Pool
2. Set email validation: `@graduate.utm.my`, `@utm.my`
3. Create User Pool Client
4. Note Pool ID and Client ID for Lambda environment

### Option 3: Fix CDK and Deploy

**Fix these files (TypeScript errors):**

1. **api-gateway-stack.ts:**
   - `apigateway.HttpMethod.X` → Use string values: `"GET"`, `"POST"`, etc.
   - WebSocket integration parameters

2. **cognito-stack.ts:**
   - Remove `autoVerifiedAttributes`
   - Change `adminUserPasswordAuth` → `adminUserPassword`
   - Remove `logs` property
   - Replace `addUser()` with Cognito CLI commands

3. **dynamodb-stack.ts:**
   - Replace `dynamodb.StreamSpecification.NEW_AND_OLD_IMAGES`
   - Use `stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES`

4. **s3-stack.ts:**
   - Remove `accessLogPrefix`
   - Change `maxAge: cdk.Duration.days(1)` → `maxAge: 86400`

**Then deploy:**
```bash
cd infrastructure
cdk bootstrap
cdk deploy --all
```

---

## Local Development Setup

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

### Backend (Lambda)
```bash
cd backend
npm install
npm run dev  # Watch mode
```

### Testing Endpoints Locally

Use a tool like Postman or curl:
```bash
# Test signup
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@graduate.utm.my","password":"Test123!","fullName":"Test User"}'
```

---

## Current Files Summary

| Component | Status | Location |
|-----------|--------|----------|
| Frontend | ✅ Ready | `frontend/` |
| Backend Code | ✅ Ready | `backend/src/lambdas/` |
| Infrastructure Code | ⚠️ Needs Fix | `infrastructure/lib/` |
| Documentation | ✅ Ready | `.md` files |

---

## Environment Variables Needed

### Frontend (Vercel or .env.local)
```env
NEXT_PUBLIC_API_URL=https://xxx.execute-api.ap-southeast-1.amazonaws.com/v1
NEXT_PUBLIC_WEBSOCKET_URL=wss://xxx.execute-api.ap-southeast-1.amazonaws.com/v1
NEXT_PUBLIC_COGNITO_POOL_ID=ap-southeast-1_XXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=XXXXX
NEXT_PUBLIC_S3_BUCKET=utm-marketplace-bucket-XXXXX
```

### Backend (Lambda Environment)
```env
AWS_REGION=ap-southeast-1
AWS_ACCOUNT_ID=123456789012
DYNAMODB_TABLE_PREFIX=utm
S3_BUCKET_NAME=utm-marketplace-bucket-XXXXX
COGNITO_POOL_ID=ap-southeast-1_XXXXX
COGNITO_CLIENT_ID=XXXXX
```

---

## Next Steps

1. **Deploy Frontend to Vercel** (10 min)
2. **Set Up Backend on AWS** (30 min):
   - Manual Lambda setup OR fix CDK and deploy
3. **Configure Environment Variables** (5 min)
4. **Test End-to-End** (30 min)

---

**Repository:** https://github.com/qingyao1117/UTM-MarketPlace  
**Frontend:** Ready for Vercel deployment  
**Backend:** Code ready, needs infrastructure setup  
**Documentation:** Complete with troubleshooting guides
