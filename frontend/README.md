# UTM Student Marketplace - Frontend

A modern Next.js frontend for the UTM Student Marketplace platform, featuring ride-hailing, food delivery, parcel services, and printing capabilities.

## Overview

This is a TypeScript-based Next.js application with:
- **Strict TypeScript** type checking
- **Tailwind CSS** with custom UTM theme colors
- **ESLint** configuration for code quality
- **AWS Amplify** integration for Cognito authentication
- **Real-time messaging** via WebSocket connections
- **Responsive design** for all devices

## Project Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   ├── auth/                    # Authentication pages
│   │   ├── login/
│   │   ├── signup/
│   │   └── callback/
│   ├── dashboard/               # User dashboard
│   │   ├── buyer/               # Buyer views
│   │   ├── driver/              # Driver views
│   │   ├── seller/              # Seller views
│   │   └── admin/               # Admin views
│   ├── services/                # Service modules
│   │   ├── rides/               # Ride-hailing
│   │   ├── food/                # Food & Beverage
│   │   ├── parcel/              # Parcel Delivery
│   │   └── printing/            # Printing Service
│   ├── profile/                 # User profile
│   └── api/                     # Next.js API routes
├── components/                  # Reusable React components
│   ├── auth/                    # Authentication components
│   ├── common/                  # Shared components
│   ├── layout/                  # Layout components
│   └── services/                # Service-specific components
├── hooks/                       # Custom React hooks
│   ├── useAuth.ts
│   ├── useWebSocket.ts
│   └── ...
├── lib/                         # Utilities and helpers
│   ├── api.ts                   # API client
│   ├── cognito.ts               # Cognito helpers
│   ├── s3.ts                    # S3 presigned URLs
│   └── ...
├── store/                       # Zustand state management
├── styles/                      # Global styles
├── types/                       # TypeScript type definitions
└── public/                      # Static assets

```

## Getting Started

### Prerequisites

- Node.js 18.x or 20.x
- npm or yarn package manager

### Installation

1. Install dependencies:

```bash
npm install
# or
yarn install
```

2. Configure environment variables:

```bash
cp .env.example .env.local
```

Update `.env.local` with your AWS credentials and configuration:
- Cognito Pool ID and Client ID
- S3 bucket name
- API endpoints
- WebSocket URL

### Development

Start the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build

Create an optimized production build:

```bash
npm run build
npm run start
```

## Tailwind CSS Configuration

### Custom UTM Theme Colors

The Tailwind CSS configuration includes custom UTM brand colors:

```css
/* Primary: UTM Blue */
--color-primary: #003366

/* Secondary: Gold/Yellow */
--color-secondary: #FFB81C

/* Accent: Green */
--color-accent: #28A745

/* Neutral: Gray scale */
--color-neutral: #6B7280
```

These are configured in `tailwind.config.ts` and can be used throughout the application:

```jsx
<button className="bg-primary text-white">Submit</button>
<div className="border-2 border-secondary">Gold border</div>
```

## Authentication

### Cognito Integration

The application uses AWS Cognito for user authentication with:

1. **Email Validation**: Only @graduate.utm.my or @utm.my emails are allowed
2. **Strong Passwords**: Minimum 12 characters with uppercase, numbers, and symbols
3. **JWT Tokens**: 15-minute access tokens, 7-day refresh tokens
4. **Email Verification**: Automatic email verification workflow

### Auth Flow

1. User signs up with UTM email
2. Cognito sends verification code
3. User verifies email
4. Default role "Buyer" is assigned
5. User can log in and access dashboard

## Real-Time Messaging

### WebSocket Integration

- Persistent WebSocket connections for chat messages
- Fallback to DynamoDB Streams if connection drops
- Message encryption in transit and at rest
- Phone number masking for privacy

## API Integration

### Backend API

The frontend communicates with AWS Lambda-based REST API:

```bash
# Development
http://localhost:8000

# Production
https://api.marketplace.utm.edu.my
```

### Pre-signed S3 URLs

For file uploads and downloads:
- License documents
- Profile pictures
- Printing files
- Application documents

## TypeScript Configuration

Strict type checking is enabled:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

## ESLint Configuration

Code quality and consistency checks:

```bash
npm run lint           # Check for issues
npm run lint:fix       # Auto-fix issues
```

## Testing

Unit tests and component tests:

```bash
npm run test           # Run tests
npm run test:watch     # Watch mode
```

## Environment Variables

### Public Variables (visible in browser)

```
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_AWS_REGION
NEXT_PUBLIC_COGNITO_POOL_ID
NEXT_PUBLIC_COGNITO_CLIENT_ID
NEXT_PUBLIC_S3_BUCKET
NEXT_PUBLIC_WEBSOCKET_URL
```

### Private Variables (server-only)

```
SECRET_KEY
DATABASE_URL
STRIPE_SECRET_KEY
```

## Performance Optimization

- **Image Optimization**: Next.js Image component for automatic optimization
- **Code Splitting**: Automatic route-based code splitting
- **CSS Optimization**: Tailwind purging unused styles
- **Caching**: SWR for efficient data fetching and caching

## Security

- **CORS**: Configured for API Gateway integration
- **HTTPS**: Enforced in production
- **CSP**: Content Security Policy headers
- **CSRF**: Protection against cross-site requests
- **Input Validation**: Client-side and server-side validation
- **Secrets**: Environment variables for sensitive data

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Deployment to AWS

Option 1: AWS Amplify Hosting
```bash
amplify init
amplify publish
```

Option 2: AWS S3 + CloudFront
```bash
npm run build
# Upload 'out' directory to S3
```

Option 3: Docker Container
```bash
docker build -t utm-marketplace-frontend .
docker run -p 3000:3000 utm-marketplace-frontend
```

## Troubleshooting

### Common Issues

**Cognito login fails**
- Verify Cognito Pool ID and Client ID
- Check email domain validation
- Ensure callback URL matches

**WebSocket connection fails**
- Check WebSocket URL configuration
- Verify API Gateway WebSocket endpoint
- Check browser console for errors

**S3 file uploads fail**
- Verify S3 bucket name and region
- Check CORS policy configuration
- Ensure IAM permissions are correct

## Contributing

1. Create a feature branch
2. Make your changes
3. Run linter and tests
4. Submit a pull request

## License

MIT

## Support

For issues or questions, contact the development team or open an issue in the repository.
