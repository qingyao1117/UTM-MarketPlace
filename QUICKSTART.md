# UTM Student Marketplace - Quick Start Guide

Fast track to get the UTM Student Marketplace running locally.

## Prerequisites

- Node.js 18.x or 20.x
- AWS Account with CLI configured
- AWS CDK CLI: `npm install -g aws-cdk`

## Quick Setup (5 minutes)

### 1. Backend Setup

```bash
cd backend
npm install
npm run build
npm run test
```

### 2. Infrastructure Deployment

```bash
cd ../infrastructure
npm install
npm run build

# Review changes
cdk diff

# Deploy to AWS
cdk deploy --all
```

**Save the CDK outputs** - you'll need them for frontend configuration.

### 3. Frontend Setup

```bash
cd ../frontend
npm install

# Copy environment template
cp .env.example .env.local

# Update .env.local with CDK outputs:
# - NEXT_PUBLIC_API_URL from REST API output
# - NEXT_PUBLIC_WEBSOCKET_URL from WebSocket output
# - NEXT_PUBLIC_COGNITO_POOL_ID and COGNITO_CLIENT_ID
# - NEXT_PUBLIC_S3_BUCKET

# Build and verify
npm run build
npm run lint
```

### 4. Start Development

```bash
# Terminal 1: Frontend
cd frontend
npm run dev
# Opens http://localhost:3000

# Terminal 2: Backend (when ready)
cd backend
npm run dev
```

## Test Accounts

Use these credentials to test in development:

```
Email:    test.buyer@graduate.utm.my
Password: TempPassword123!
Role:     Buyer

Email:    test.driver@graduate.utm.my
Password: TempPassword123!
Role:     Driver

Email:    test.seller@utm.my
Password: TempPassword123!
Role:     Seller
```

## Important Locations

| Component | Location | Command |
|-----------|----------|---------|
| Frontend | `frontend/` | `npm run dev` |
| Backend | `backend/` | `npm run build` |
| Infrastructure | `infrastructure/` | `cdk deploy --all` |
| Documentation | `INFRASTRUCTURE_SETUP.md` | Full details |
| Status | `IMPLEMENTATION_STATUS.md` | Task completion |

## Environment Files

### Frontend `.env.local`

Required after CDK deployment:
```
NEXT_PUBLIC_API_URL=https://your-api-id.execute-api.ap-southeast-1.amazonaws.com/v1
NEXT_PUBLIC_WEBSOCKET_URL=wss://your-ws-id.execute-api.ap-southeast-1.amazonaws.com/v1
NEXT_PUBLIC_COGNITO_POOL_ID=ap-southeast-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=your-client-id
NEXT_PUBLIC_S3_BUCKET=utm-marketplace-bucket-123456789012
```

### Backend `.env` (for local testing)

```
AWS_REGION=ap-southeast-1
AWS_ACCOUNT_ID=123456789012
DYNAMODB_TABLE_PREFIX=utm
S3_BUCKET_NAME=utm-marketplace-bucket-123456789012
COGNITO_POOL_ID=ap-southeast-1_XXXXXXXXX
COGNITO_CLIENT_ID=your-client-id
CLOUDWATCH_LOG_GROUP=/aws/lambda/utm-marketplace
```

## Key Scripts

### Frontend
```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # Check code quality
npm run test         # Run tests
```

### Backend
```bash
npm run build        # Compile TypeScript
npm run dev          # Watch mode
npm run test         # Run tests
npm run lint         # Check code quality
```

### Infrastructure
```bash
cdk deploy --all              # Deploy all stacks
cdk deploy:core              # Deploy DB, S3, Cognito
cdk deploy:api-gateway       # Deploy API Gateway
cdk destroy --all             # Remove all stacks
cdk diff                      # Show changes
```

## Testing the Setup

### 1. Test Frontend Loads
```
http://localhost:3000
```

### 2. Test Cognito Login
- Click "Sign Up"
- Enter: test.buyer@graduate.utm.my
- Enter password: TempPassword123!
- Check email for verification code
- Log in

### 3. Test REST API
```bash
# Get rides (requires login token)
curl -X GET https://your-api.execute-api.ap-southeast-1.amazonaws.com/v1/rides \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Test WebSocket
```bash
# Using wscat (npm install -g wscat)
wscat -c wss://your-ws.execute-api.ap-southeast-1.amazonaws.com/v1/
```

## Troubleshooting

### Issue: Cognito email validation fails

**Solution**: Email must end with @graduate.utm.my or @utm.my

### Issue: API 403 Unauthorized

**Solution**: 
- Check Cognito token is valid
- Verify token is in Authorization header
- Confirm pool ID matches

### Issue: S3 bucket already exists

**Solution**: Update account ID in CDK code or change bucket name suffix

### Issue: TypeScript errors

**Solution**: 
```bash
npm run typecheck
npm install  # Reinstall dependencies
```

### Issue: Port 3000 already in use

**Solution**: 
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
# Then restart
npm run dev
```

## Database Setup

Tables are created automatically by CDK:
- Users
- Rides
- Orders
- Menu Items
- Messages
- Chat Channels
- Applications
- Payments
- Printing Orders

View tables:
```bash
aws dynamodb list-tables --region ap-southeast-1
```

## File Storage

S3 bucket created with folders:
- `licenses/` - Driver documents
- `profiles/` - User pictures
- `printing/` - Print files
- `documents/` - Application docs
- `invoices/` - Receipts

## Logging

### Frontend Logs
```
Console in browser dev tools
```

### Backend Logs
```bash
aws logs tail /aws/lambda/utm-marketplace --follow
```

### API Gateway Logs
```bash
aws logs tail /aws/apigateway/utm-marketplace-rest --follow
aws logs tail /aws/apigateway/utm-marketplace-websocket --follow
```

## Performance Tips

1. Use `npm run dev` for frontend development (hot reload)
2. Use `npm run dev` for backend watching (auto-compile)
3. Enable browser dev tools for frontend debugging
4. Use AWS Console for real-time monitoring

## Next Steps

1. ✅ Deploy Phase 1 infrastructure (complete)
2. 🔄 Implement Phase 2 - Authentication Service
3. 🔄 Implement Phase 3 - Payment & Escrow System
4. 🔄 Implement Phase 4 - Service Modules
5. 🔄 Implement Phase 5 - Cross-Cutting Concerns
6. 🔄 Implement Phase 6 - Admin Dashboard

## Support

For detailed information:
- See `INFRASTRUCTURE_SETUP.md` for deployment details
- See `IMPLEMENTATION_STATUS.md` for task completion status
- See `frontend/README.md` for frontend details
- See `backend/README.md` for backend details

## Common Commands Reference

```bash
# Start everything
cd backend && npm run build && cd ../frontend && npm run dev

# Deploy updates
cd infrastructure && cdk deploy --all

# View logs
aws logs tail /aws/lambda/utm-marketplace --follow

# Clean up
cd infrastructure && cdk destroy --all

# Type check all projects
cd backend && npm run typecheck
cd ../frontend && npm run typecheck
```

---

**Phase 1 Status**: ✅ COMPLETE
**Ready for**: Lambda handler implementation
**Last Updated**: 2024
