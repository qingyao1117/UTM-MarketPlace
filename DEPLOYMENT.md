# UTM Student Marketplace - Deployment Guide

## Quick Deploy to Vercel (Recommended)

### Step 1: Push to GitHub
The repository is already set up at:
```
https://github.com/qingyao1117/UTM-MarketPlace
```

### Step 2: Import to Vercel
1. Go to [https://vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Click **"Import Git Repository"**
4. Select **"Import GitHub Repository"**
5. Choose **"qingyao1117/UTM-MarketPlace"**
6. Click **"Import"**

### Step 3: Configure Environment Variables
In Vercel, add these environment variables:

| Variable | Value | Type |
|----------|-------|------|
| `NEXT_PUBLIC_API_URL` | Your REST API Gateway URL | Production |
| `NEXT_PUBLIC_WEBSOCKET_URL` | Your WebSocket API URL | Production |
| `NEXT_PUBLIC_COGNITO_POOL_ID` | Your Cognito User Pool ID | Production |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | Your Cognito Client ID | Production |
| `NEXT_PUBLIC_S3_BUCKET` | Your S3 Bucket Name | Production |

### Step 4: Deploy
Click **"Deploy"** and wait for the build to complete.

---

## Expected Vercel Output

After successful deployment, you'll receive a URL like:
```
https://utm-marketplace.vercel.app
```

---

## Backend Deployment (AWS)

The backend requires AWS deployment. You have two options:

### Option 1: AWS CDK (Infrastructure-as-Code)
```bash
cd infrastructure
npm install
cdk deploy --all
```

### Option 2: Manual Lambda Setup
1. Create Lambda functions in AWS Console
2. Upload the compiled backend code
3. Configure triggers for API Gateway
4. Set up DynamoDB, S3, Cognito manually

---

## Environment Variables Setup

### For Vercel (Frontend)
Add these variables in Vercel dashboard:
```
NEXT_PUBLIC_API_URL=https://xxx.execute-api.ap-southeast-1.amazonaws.com/v1
NEXT_PUBLIC_WEBSOCKET_URL=wss://xxx.execute-api.ap-southeast-1.amazonaws.com/v1
NEXT_PUBLIC_COGNITO_POOL_ID=ap-southeast-1_XXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=XXXXX
NEXT_PUBLIC_S3_BUCKET=utm-marketplace-bucket-XXXXX
```

### For Local Development (Frontend)
Create `.env.local` in frontend folder:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8001
NEXT_PUBLIC_COGNITO_POOL_ID=ap-southeast-1_XXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=XXXXX
NEXT_PUBLIC_S3_BUCKET=utm-marketplace-bucket-XXXXX
```

---

## Post-Deployment Checklist

After deploying to Vercel, verify:

- [ ] Frontend loads without errors
- [ ] Cognito authentication works
- [ ] API Gateway endpoints are accessible
- [ ] WebSocket connections work for chat
- [ ] S3 file uploads work
- [ ] DynamoDB tables are accessible

---

## Troubleshooting

### Vercel Build Fails
- Check Node.js version (should be 18.x or 20.x)
- Verify all dependencies in package.json
- Check build logs for specific errors

### Cognito Auth Fails
- Verify Cognito pool ID and client ID are correct
- Check redirect URIs are configured
- Ensure email domain validation is set up

### API Calls Fail
- Verify API Gateway URL is correct
- Check CORS settings in API Gateway
- Ensure Lambda functions are deployed

---

## Deployment Commands Reference

```bash
# Local development
cd frontend && npm run dev

# Build frontend
cd frontend && npm run build

# Deploy backend with CDK
cd infrastructure && cdk deploy --all

# Push to GitHub
git add .
git commit -m "Update deployment config"
git push
```

---

**Last Updated:** 2024  
**Deployment Status:** Ready for Vercel import  
**Repository:** https://github.com/qingyao1117/UTM-MarketPlace
