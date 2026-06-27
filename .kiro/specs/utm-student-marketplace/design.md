# UTM Student Marketplace - Design Document

## Overview

The UTM Student Marketplace is a multi-service platform providing ride-hailing, food delivery, parcel/document services, and printing services to UTM students. The platform prioritizes security through escrow-based payments, privacy through masked communication, and reliability through AWS serverless infrastructure.

### Key Design Principles

1. **Security First**: Escrow holds funds safely until service completion; sensitive data encrypted at rest and in transit
2. **Privacy Protection**: Phone numbers never displayed in chat; role-based access controls
3. **Real-Time Experience**: WebSocket-based messaging with DynamoDB Streams fallback
4. **Scalability**: Serverless architecture using AWS Lambda, DynamoDB, and API Gateway
5. **User Trust**: Verification system for providers; rating and review system for accountability

### Target Users

- **Buyers**: Students accessing services (rides, food, parcels, printing)
- **Providers**: Sellers, Drivers, Runners offering services and earning income
- **Admins**: University staff managing applications, resolving disputes, maintaining platform integrity

---

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Next.js Frontend                             │
│               (SPA with real-time UI updates via WebSocket)          │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                   ┌──────▼──────┐
                   │ API Gateway │
                   │ (REST/WS)   │
                   └──────┬──────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
    ┌───▼───┐         ┌───▼───┐        ┌───▼────┐
    │ Cognito│        │Lambda │        │ Lambda │
    │ Auth   │        │  Auth │        │ WebSocket
    │        │        │       │        │ Handler
    └────────┘        └───────┘        └────────┘
        │                 │                 │
        │      ┌──────────┼──────────┐     │
        │      │          │          │     │
    ┌───▼──────▼──────────▼──────────▼─────▼──────┐
    │        AWS Lambda Service Layer              │
    │  ┌──────────────────────────────────────┐   │
    │  │ Order Management      Payment System │   │
    │  │ Ride Booking          Chat Handler   │   │
    │  │ Menu Management       File Upload    │   │
    │  │ Provider Apps         Notifications  │   │
    │  └──────────────────────────────────────┘   │
    └────────┬──────────────────────────┬─────────┘
             │                          │
      ┌──────▼──────┐          ┌────────▼────────┐
      │  DynamoDB   │          │ S3 Buckets      │
      │  (All Data) │          │ (Files/Docs)    │
      │             │          │                 │
      │ Tables:     │          │ Prefixes:       │
      │ • Users     │          │ • licenses/     │
      │ • Rides     │          │ • profiles/     │
      │ • Orders    │          │ • documents/    │
      │ • Messages  │          │ • printing/     │
      │ • Apps      │          └─────────────────┘
      │ • Payments  │
      └─────────────┘
```

### Service Modules Architecture

```
┌──────────────────────────────────────────────────────────┐
│            UTM Student Marketplace Core                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Ride-Hailing│  │     F&B      │  │    Parcel    │ │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤ │
│  │• Book Ride   │  │• Add Items   │  │• Pickup Loc  │ │
│  │• Find Driver │  │• Manage Stock│  │• Drop-off    │ │
│  │• Track Ride  │  │• View Orders │  │• Accept Order│ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌──────────────┐                                       │
│  │   Printing   │                                       │
│  ├──────────────┤                                       │
│  │• Upload File │                                       │
│  │• Select Mode │                                       │
│  │• View Status │                                       │
│  └──────────────┘                                       │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │    Cross-Module Services                        │  │
│  │ • Authentication & Authorization                │  │
│  │ • Escrow Payment & Transaction Management       │  │
│  │ • Real-time Messaging & Notifications           │  │
│  │ • Provider Application Management               │  │
│  │ • Rating & Review System                        │  │
│  │ • Admin Dashboard & Moderation                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Real-Time Messaging Architecture

```
┌─────────────────────────────────────────────────────┐
│         Real-Time Messaging Infrastructure          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  WebSocket Connection (Primary)                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ API Gateway WebSocket (bidirectional)       │   │
│  │ • Maintains persistent connection            │   │
│  │ • Delivers messages in <100ms               │   │
│  │ • Supports multiple concurrent channels     │   │
│  └────────────┬────────────────────────────────┘   │
│               │                                     │
│               │ On disconnect                       │
│               ▼                                     │
│  DynamoDB Streams (Fallback)                        │
│  ┌─────────────────────────────────────────────┐   │
│  │ • Captures all Messages table writes        │   │
│  │ • Lambda processes stream records           │   │
│  │ • Client polls for missed messages          │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Chat Channel Flow:                                 │
│  1. Order/Ride accepted → create Chat_Channel      │
│  2. Buyer sends message → WebSocket delivery       │
│  3. Provider receives → in-app notification        │
│  4. If WebSocket down → DynamoDB fallback          │
│  5. Client syncs on reconnection                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Components and Interfaces

### Authentication Service

**Endpoint**: `/auth/*`

**Key Components**:
- Email validation (UTM domain check)
- Cognito user pool integration
- Role assignment (default: Buyer)
- Session management

**Operations**:

```
POST /auth/signup
Body: {
  "email": "user@graduate.utm.my",
  "password": "secure_password",
  "fullName": "John Doe"
}
Response: {
  "userId": "uuid",
  "email": "user@graduate.utm.my",
  "role": "Buyer",
  "verificationStatus": "pending_email"
}

POST /auth/login
Body: {
  "email": "user@graduate.utm.my",
  "password": "secure_password"
}
Response: {
  "accessToken": "jwt_token",
  "idToken": "cognito_id",
  "refreshToken": "refresh_token",
  "userId": "uuid"
}

POST /auth/verify-email
Body: {
  "email": "user@graduate.utm.my",
  "verificationCode": "123456"
}
Response: {
  "verified": true,
  "userDetails": { ... }
}
```

### Provider Application Service

**Endpoint**: `/applications/*`

**Key Components**:
- Application form generation per role type
- Document upload to S3
- Application status tracking
- Admin approval workflow

**Operations**:

```
POST /applications/submit
Body: {
  "userId": "uuid",
  "roleType": "Driver|Seller|Runner",
  "roleSpecificData": {
    // For Driver:
    "vehicleModel": "Toyota Vios 2020",
    "licensePlate": "WXY1234",
    "licenseDocumentId": "s3_key"
    
    // For Seller:
    "businessName": "Ahmed's Nasi Lemak",
    "businessCategory": "F&B",
    "businessDescription": "Authentic Malay cuisine"
    
    // For Runner:
    "transportMode": "Bicycle|Motorcycle|Car",
    "insuranceDocId": "s3_key"
  }
}
Response: {
  "applicationId": "app_uuid",
  "status": "Pending",
  "submittedAt": "2024-01-15T10:30:00Z",
  "estimatedReviewTime": "3-5 days"
}

GET /applications/:applicationId
Response: {
  "applicationId": "app_uuid",
  "userId": "uuid",
  "roleType": "Driver",
  "status": "Pending|Approved|Rejected|NeedsRevision",
  "submittedData": { ... },
  "adminNotes": "...",
  "reviewedBy": "admin_uuid",
  "reviewedAt": "2024-01-18T14:00:00Z"
}

POST /applications/:applicationId/approve
Body: {
  "adminId": "admin_uuid",
  "approvalNotes": "License and vehicle info verified"
}
Response: {
  "status": "Approved",
  "userRoleUpdated": "Driver",
  "notificationSent": true
}
```

---

## Data Models

### 1. Users Table

```
PrimaryKey: userId (UUID)
SortKey: None

Attributes:
{
  "userId": "uuid",
  "email": "user@graduate.utm.my",
  "fullName": "John Doe",
  "role": "Buyer|Seller|Runner|Driver|Admin",  // Can have multiple
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-20T14:20:00Z",
  
  // Profile Information
  "profilePicture": "s3://marketplace/profiles/userid.jpg",
  "phoneNumber": "+60123456789",  // ENCRYPTED
  "idNumber": "xxxxxx-xx-xxxx",    // Last 4 digits only
  "accountStatus": "Active|Suspended|Closed",
  
  // Provider-specific fields
  "verificationStatus": "Unverified|Verified|Rejected",
  
  // For Drivers
  "vehicleModel": "Toyota Vios 2020",
  "licensePlate": "WXY1234",
  "licenseDocumentId": "s3://licenses/driver_uuid.pdf",
  "driverStatus": "Online|Offline",  // Only for drivers
  
  // For Sellers
  "businessName": "Ahmed's Nasi Lemak",
  "businessCategory": "F&B",
  "businessDescription": "Authentic Malay cuisine",
  "sellerStatus": "Online|Offline",  // Only for sellers
  
  // For Runners
  "runnerTransportMode": "Bicycle|Motorcycle|Car",
  "runnerStatus": "Online|Offline",  // Only for runners
  
  // Stats
  "averageRating": 4.7,
  "totalReviews": 24,
  "totalOrders": 45,
  
  // Security
  "lastLogin": "2024-01-20T10:15:00Z",
  "passwordChangedAt": "2024-01-05T09:00:00Z",
  "emailVerified": true,
  "twoFactorEnabled": false
}

GSI1: email-index
  PK: email
  SK: userId
  Purpose: Quick lookup by email

GSI2: role-index
  PK: role
  SK: createdAt
  Purpose: Find all users by role
  
GSI3: status-index
  PK: accountStatus
  SK: updatedAt
  Purpose: Track active/suspended users
```

### 2. Rides Table

```
PrimaryKey: rideId (UUID)
SortKey: createdAt (ISO timestamp)

Attributes:
{
  "rideId": "uuid",
  "buyerId": "buyer_uuid",
  "driverId": "driver_uuid",
  "createdAt": "2024-01-15T10:30:00Z",
  "bookingTime": "2024-01-15T10:30:00Z",
  "scheduledTime": "2024-01-15T14:00:00Z",  // If scheduled
  
  // Location Details
  "pickupLocation": {
    "name": "Library UTM",
    "coordinates": {"latitude": 1.5543, "longitude": 103.7381},
    "address": "Jalan Ilmu, 81310 UTM Johor Bahru"
  },
  "dropoffLocation": {
    "name": "Dorm Block A",
    "coordinates": {"latitude": 1.5512, "longitude": 103.7420},
    "address": "Jalan Perumahan, 81310 UTM"
  },
  "passengerCount": 2,
  
  // Status Tracking
  "status": "Pending|Accepted|InProgress|CompletionConfirmed|Completed|Cancelled",
  "statusHistory": [
    {"status": "Pending", "timestamp": "2024-01-15T10:30:00Z"},
    {"status": "Accepted", "timestamp": "2024-01-15T10:35:00Z"}
  ],
  
  // Payment & Escrow
  "estimatedFare": 8.50,
  "finalFare": 8.50,
  "paymentStatus": "Pending|InEscrow|AwaitingConfirmation|Released|Refunded",
  "transactionId": "txn_uuid",
  "escrowReleaseTime": "2024-01-15T11:00:00Z",  // Auto-release after 24hrs
  
  // Communication
  "chatChannelId": "chat_uuid",
  "lastMessageAt": "2024-01-15T10:55:00Z",
  
  // Rating
  "buyerRating": 4,
  "buyerReview": "Courteous driver, clean car",
  "driverRating": 5,
  "driverReview": "Polite passenger",
  "ratedAt": "2024-01-15T12:00:00Z"
}

GSI1: buyerId-index
  PK: buyerId
  SK: createdAt
  Purpose: Buyer's ride history

GSI2: driverId-index
  PK: driverId
  SK: createdAt
  Purpose: Driver's ride history

GSI3: status-index
  PK: status
  SK: createdAt
  Purpose: Find rides by status
  
GSI4: driverId-status-index
  PK: driverId
  SK: status
  Purpose: Find active rides for driver
```

---

### 3. Orders Table (F&B & Parcel)

```
PrimaryKey: orderId (UUID)
SortKey: createdAt (ISO timestamp)

Attributes:
{
  "orderId": "uuid",
  "serviceType": "FoodDelivery|ParcelDelivery",
  "buyerId": "buyer_uuid",
  "providerId": "seller_uuid|runner_uuid",
  "createdAt": "2024-01-15T10:30:00Z",
  
  // Service-Specific Details
  // For F&B:
  "items": [
    {
      "itemId": "menu_item_uuid",
      "itemName": "Nasi Lemak",
      "quantity": 2,
      "unitPrice": 6.50,
      "subtotal": 13.00
    }
  ],
  "estimatedPrepTime": 30,  // minutes
  
  // For Parcel:
  "collectionPoint": "Library UTM",
  "residentialCollege": "Dorm Block A",
  "parcelDescription": "Books and documents",
  "estimatedDeliveryTime": 120,  // minutes
  
  // Status Tracking
  "status": "Pending|Accepted|InProgress|ReadyForPickup|AwaitingConfirmation|Completed|Cancelled",
  "statusHistory": [
    {"status": "Pending", "timestamp": "2024-01-15T10:30:00Z"}
  ],
  
  // Pricing
  "subtotal": 13.00,
  "deliveryFee": 2.50,
  "tax": 1.35,
  "totalPrice": 16.85,
  "currency": "MYR",
  
  // Payment & Escrow
  "paymentStatus": "Pending|InEscrow|AwaitingConfirmation|Released|Refunded",
  "transactionId": "txn_uuid",
  "escrowReleaseTime": "2024-01-22T10:30:00Z",  // Auto-release after 7 days
  
  // Communication
  "chatChannelId": "chat_uuid",
  
  // Timestamps
  "acceptedAt": "2024-01-15T10:32:00Z",
  "completedAt": null,
  "estimatedDeliveryTime": "2024-01-15T11:00:00Z",
  
  // Ratings
  "buyerRating": null,
  "buyerReview": null,
  "providerRating": null,
  "providerReview": null
}

GSI1: buyerId-index
  PK: buyerId
  SK: createdAt

GSI2: providerId-index
  PK: providerId
  SK: createdAt

GSI3: status-index
  PK: status
  SK: createdAt

GSI4: serviceType-index
  PK: serviceType
  SK: createdAt
```

### 4. Menu Items Table

```
PrimaryKey: menuItemId (UUID)
SortKey: None

Attributes:
{
  "menuItemId": "uuid",
  "sellerId": "seller_uuid",
  "itemName": "Nasi Lemak",
  "description": "Fragrant rice cooked in coconut milk with sambal",
  "price": 6.50,
  "imageUrl": "s3://marketplace/menu/item_uuid.jpg",
  
  // Stock Management
  "maxStock": 50,
  "currentStock": 32,
  "stockStatus": "Available|LowStock|OutOfStock",
  
  // Pre-order Cut-off
  "preorderCutoffTime": "11:00",  // 24-hour format, relative to current day
  "lastOrderTime": "2024-01-15T10:45:00Z",
  
  // Category & Tags
  "category": "Rice",
  "tags": ["Malaysian", "Breakfast", "Vegetarian"],
  
  // Status
  "isActive": true,
  "createdAt": "2024-01-10T15:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}

GSI1: sellerId-index
  PK: sellerId
  SK: itemName
  Purpose: Browse seller's menu

GSI2: status-index
  PK: sellerId
  SK: stockStatus
  Purpose: Find available items for seller
```

### 5. Messages Table

```
PrimaryKey: chatChannelId (String)
SortKey: messageId (UUID) / createdAt (ISO timestamp)

Attributes:
{
  "chatChannelId": "chat_uuid",
  "messageId": "msg_uuid",
  "senderId": "user_uuid",
  "senderName": "John Doe",
  "senderRole": "Buyer|Driver|Seller|Runner",
  "createdAt": "2024-01-15T10:45:30Z",
  
  // Message Content
  "messageText": "Hi, I'll be at the pickup in 5 minutes",
  "messageType": "text|system",
  
  // Delivery Status
  "deliveryStatus": "Sent|Delivered|Read",
  "deliveredAt": "2024-01-15T10:45:35Z",
  "readAt": "2024-01-15T10:46:00Z",
  
  // Encryption
  "isEncrypted": true,
  "encryptionVersion": "AES256GCM"
}

GSI1: senderId-index
  PK: senderId
  SK: createdAt
  Purpose: User's message history

GSI2: chatChannelId-createdAt
  PK: chatChannelId
  SK: createdAt
  Purpose: Message timeline within channel (Primary for chat)
```

### 6. Chat Channels Table

```
PrimaryKey: chatChannelId (UUID)
SortKey: None

Attributes:
{
  "chatChannelId": "uuid",
  "buyerId": "buyer_uuid",
  "providerId": "provider_uuid",
  "providerRole": "Driver|Seller|Runner",
  
  // Associated Transaction
  "transactionType": "Ride|FoodOrder|ParcelOrder|PrintingOrder",
  "transactionId": "ride_uuid|order_uuid",
  
  // Channel Status
  "status": "Active|Archived|Closed",
  "createdAt": "2024-01-15T10:30:00Z",
  "closedAt": null,
  
  // Message Tracking
  "messageCount": 12,
  "lastMessageAt": "2024-01-15T10:55:00Z",
  "lastMessagePreview": "Thanks for the food!",
  
  // Unread Messages
  "buyerUnread": 0,
  "providerUnread": 2,
  
  // Privacy Enforcement
  "buyerPhoneNumberMasked": true,
  "providerPhoneNumberMasked": true
}

GSI1: buyerId-index
  PK: buyerId
  SK: createdAt

GSI2: providerId-index
  PK: providerId
  SK: createdAt

GSI3: transactionId-index
  PK: transactionId
  SK: transactionType
  Purpose: Find chat for specific transaction
```

### 7. Applications Table

```
PrimaryKey: applicationId (UUID)
SortKey: None

Attributes:
{
  "applicationId": "uuid",
  "userId": "user_uuid",
  "roleType": "Driver|Seller|Runner",
  "status": "Pending|Approved|Rejected|NeedsRevision",
  "submittedAt": "2024-01-15T10:30:00Z",
  "reviewedAt": null,
  "reviewedBy": null,
  
  // Role-Specific Data
  // For Driver:
  "vehicleModel": "Toyota Vios 2020",
  "licensePlate": "WXY1234",
  "licenseDocumentId": "s3://licenses/driver_uuid.pdf",
  "licenseExpiryDate": "2025-12-31",
  
  // For Seller:
  "businessName": "Ahmed's Nasi Lemak",
  "businessCategory": "F&B",
  "businessDescription": "Authentic Malay cuisine",
  "businessRegistration": "s3://docs/seller_uuid_reg.pdf",
  
  // For Runner:
  "transportMode": "Motorcycle",
  "insuranceDocument": "s3://docs/runner_uuid_insurance.pdf",
  "insuranceExpiryDate": "2024-06-30",
  
  // Admin Review
  "adminNotes": "License verified, vehicle information correct",
  "revisionRequestReason": null,
  
  // Tracking
  "documentVerificationStatus": "Pending|Verified|Rejected",
  "backgroundCheckStatus": "NotStarted|Passed|Failed",
  
  // Timestamps
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}

GSI1: userId-index
  PK: userId
  SK: submittedAt

GSI2: status-index
  PK: status
  SK: submittedAt
  Purpose: Admin dashboard - pending applications

GSI3: roleType-index
  PK: roleType
  SK: status
  Purpose: Analytics on applications per role
```

### 8. Payments & Transactions Table

```
PrimaryKey: transactionId (UUID)
SortKey: createdAt (ISO timestamp)

Attributes:
{
  "transactionId": "uuid",
  "buyerId": "buyer_uuid",
  "payeeId": "provider_uuid",
  "transactionType": "Ride|FoodOrder|ParcelOrder|PrintingOrder",
  "associatedId": "ride_uuid|order_uuid",
  
  // Payment Details
  "amount": 8.50,
  "currency": "MYR",
  "paymentMethod": "CreditCard|DebitCard|DigitalWallet",
  "paymentGateway": "Stripe|PayPal|2Checkout",
  "paymentGatewayRef": "ch_1234567890",
  
  // Escrow Status
  "status": "Pending|Processing|InEscrow|AwaitingConfirmation|Released|Refunded|Failed|Disputed",
  "statusHistory": [
    {"status": "Pending", "timestamp": "2024-01-15T10:30:00Z", "reason": "Order created"},
    {"status": "InEscrow", "timestamp": "2024-01-15T10:32:00Z", "reason": "Payment captured"}
  ],
  
  // Escrow Timeline
  "chargedAt": "2024-01-15T10:32:00Z",
  "escrowStartTime": "2024-01-15T10:32:00Z",
  "escrowReleaseTime": "2024-01-15T11:30:00Z",  // Manual or auto-release time
  "releasedAt": null,
  "autoReleaseEnabled": true,
  "autoReleaseDelay": "24hours|7days",  // Depends on service type
  
  // Refund Details
  "refundAmount": null,
  "refundReason": null,
  "refundedAt": null,
  
  // Dispute Handling
  "isDisputed": false,
  "disputeReason": null,
  "disputeStartTime": null,
  "disputeResolution": null,
  
  // Tracking
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:32:00Z"
}

GSI1: buyerId-index
  PK: buyerId
  SK: createdAt

GSI2: payeeId-index
  PK: payeeId
  SK: createdAt

GSI3: status-index
  PK: status
  SK: createdAt

GSI4: escrowReleaseTime-index
  PK: escrowReleaseTime
  SK: status
  Purpose: Find transactions pending auto-release
```

### 9. Printing Orders Table

```
PrimaryKey: printingOrderId (UUID)
SortKey: createdAt (ISO timestamp)

Attributes:
{
  "printingOrderId": "uuid",
  "buyerId": "buyer_uuid",
  "providerId": "printing_provider_uuid",
  "createdAt": "2024-01-15T10:30:00Z",
  
  // File Details
  "fileDocumentId": "s3://printing/file_uuid.pdf",
  "fileName": "Assignment_Final.pdf",
  "fileSize": 2400000,  // bytes
  "fileFormat": "PDF",
  "uploadedAt": "2024-01-15T10:25:00Z",
  
  // Printing Specifications
  "colorMode": "BlackAndWhite|Color",
  "doubleSided": true,
  "pageCount": 15,
  "estimatedCost": 3.00,
  
  // Status
  "status": "Pending|Accepted|Printing|ReadyForPickup|Completed|Cancelled",
  "statusHistory": [],
  
  // Payment & Escrow
  "totalPrice": 3.00,
  "paymentStatus": "Pending|InEscrow|Released|Refunded",
  "transactionId": "txn_uuid",
  
  // Communication
  "chatChannelId": "chat_uuid",
  
  // Pickup Details
  "pickupLocation": "Printing Center Counter A",
  "pickupDeadline": "2024-01-20T18:00:00Z",
  "pickedUpAt": null,
  
  // Ratings
  "buyerRating": null,
  "buyerReview": null
}

GSI1: buyerId-index
  PK: buyerId
  SK: createdAt

GSI2: providerId-index
  PK: providerId
  SK: createdAt

GSI3: status-index
  PK: status
  SK: createdAt
```

---

## Lambda Function Handlers

### 1. Order Creation Handler



**Trigger**: POST /orders

**Responsibilities**:
- Validate buyer and provider exist and have correct roles
- Verify items/services are available
- Calculate total price
- Initiate escrow payment via payment gateway
- Create chat channel
- Update order status to "Pending"
- Return order details

**Error Handling**:
- Payment failed → Return 400 with error, no order created
- Invalid items → Return 400 validation error
- Provider offline → Queue order or notify buyer

### 2. Payment Processing Handler

**Trigger**: Payment gateway webhook (payment success)

**Responsibilities**:
- Verify webhook signature
- Update transaction status to "InEscrow"
- Update associated order/ride status
- Store escrow release time (based on service type)
- Trigger chat channel creation if not already done
- Send notifications to buyer and provider

**Error Handling**:
- Duplicate webhook → Idempotent (check if already processed)
- Invalid signature → Reject (401)

### 3. Escrow Release Handler

**Trigger**: Manual release (button click) OR scheduled (Lambda scheduled rule)

**Responsibilities**:
- Verify order/ride status is "AwaitingConfirmation"
- Check if 24 hours (ride) or 7 days (order) elapsed
- Call payment gateway to release funds to provider
- Update transaction status to "Released"
- Update order/ride status to "Completed"
- Send notification to provider (funds available)
- Log transaction

**Error Handling**:
- Release already processed → Idempotent
- Payment gateway error → Retry with exponential backoff

### 4. Chat Message Handler

**Trigger**: WebSocket message received OR DynamoDB Streams record

**Responsibilities**:
- Validate message sender is part of chat channel
- Validate message content (non-empty, under length limit)
- Encrypt message if necessary
- Store message in Messages table
- Deliver via WebSocket to recipient (if connected)
- Update ChatChannel last message time
- Send notification if recipient not connected

**Error Handling**:
- Sender not in channel → 403 Forbidden
- WebSocket delivery fails → Store and attempt retry via Streams
- Message too long → 400 Validation error

### 5. Application Approval Handler

**Trigger**: Admin clicks "Approve" button

**Responsibilities**:
- Verify admin has approval permission
- Update application status to "Approved"
- Update user role in Users table
- Send notification to user
- Log admin action for audit

### 6. File Upload Handler

**Trigger**: Multipart form upload via API Gateway

**Responsibilities**:
- Validate file size (max 50MB for printing)
- Validate file format (PDF, DOC, DOCX, JPG, PNG for printing)
- Scan for malware (optional integration)
- Generate unique S3 key with user-id prefix
- Upload to S3 with encryption
- Return secure reference URL
- Store file metadata in DynamoDB

**Error Handling**:
- File too large → 413 Payload Too Large
- Invalid format → 400 Unsupported Media Type
- Upload fails → 500 with retry indication

---

## API Endpoint Schemas

### Ride-Hailing Service

```
POST /rides/book
Request: {
  "buyerId": "uuid",
  "pickupLocation": { "name": "Library", "lat": 1.5543, "lng": 103.7381 },
  "dropoffLocation": { "name": "Dorm A", "lat": 1.5512, "lng": 103.7420 },
  "passengerCount": 2,
  "scheduledTime": null  // or ISO timestamp for scheduled
}
Response: {
  "rideId": "uuid",
  "status": "Pending",
  "estimatedFare": 8.50,
  "driverId": null  // Will be assigned
}

POST /rides/:rideId/complete
Request: {
  "buyerId": "uuid"
}
Response: {
  "status": "AwaitingConfirmation",
  "escrowReleaseTime": "2024-01-15T11:30:00Z"
}

POST /rides/:rideId/confirm-completion
Request: {
  "buyerId": "uuid",
  "rating": 5,
  "review": "Great driver!"
}
Response: {
  "status": "Completed",
  "paymentReleased": true
}
```

### Food & Beverage Service

```
POST /menu/items
Request: {
  "sellerId": "uuid",
  "itemName": "Nasi Lemak",
  "description": "...",
  "price": 6.50,
  "maxStock": 50,
  "preorderCutoffTime": "11:00"
}
Response: {
  "menuItemId": "uuid",
  "createdAt": "2024-01-15T10:30:00Z"
}

GET /food/browse
Response: {
  "sellers": [
    {
      "sellerId": "uuid",
      "businessName": "Ahmed's Nasi Lemak",
      "rating": 4.7,
      "items": [
        {
          "itemId": "uuid",
          "itemName": "Nasi Lemak",
          "price": 6.50,
          "stock": 32,
          "cutoffTime": "11:00"
        }
      ]
    }
  ]
}

POST /orders/food
Request: {
  "buyerId": "uuid",
  "sellerId": "uuid",
  "items": [
    {"itemId": "uuid", "quantity": 2}
  ]
}
Response: {
  "orderId": "uuid",
  "status": "Pending",
  "totalPrice": 16.85,
  "escrowStatus": "InEscrow"
}
```

### Parcel Service

```
POST /orders/parcel
Request: {
  "buyerId": "uuid",
  "collectionPoint": "Library UTM",
  "residentialCollege": "Dorm Block A",
  "parcelDescription": "Books"
}
Response: {
  "orderId": "uuid",
  "status": "Pending",
  "assignedRunnerId": null,
  "estimatedDeliveryTime": 120
}

GET /runner/dashboard
Response: {
  "availableOrders": [
    {
      "orderId": "uuid",
      "collectionPoint": "Library",
      "residentialCollege": "Dorm A",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}

POST /orders/parcel/:orderId/accept
Request: {
  "runnerId": "uuid"
}
Response: {
  "orderId": "uuid",
  "status": "Accepted",
  "chatChannelId": "uuid"
}
```

### Printing Service

```
POST /printing/upload
Request: multipart/form-data {
  "file": "<binary>",
  "buyerId": "uuid"
}
Response: {
  "fileDocumentId": "s3://printing/file_uuid.pdf",
  "fileName": "Assignment.pdf",
  "fileSize": 2400000,
  "uploadedAt": "2024-01-15T10:25:00Z"
}

POST /printing/orders
Request: {
  "buyerId": "uuid",
  "fileDocumentId": "s3://printing/file_uuid.pdf",
  "colorMode": "BlackAndWhite",
  "doubleSided": true,
  "pageCount": 15
}
Response: {
  "printingOrderId": "uuid",
  "status": "Pending",
  "totalPrice": 3.00,
  "escrowStatus": "InEscrow"
}

POST /printing/orders/:orderId/ready-for-pickup
Request: {
  "providerId": "uuid"
}
Response: {
  "status": "ReadyForPickup",
  "pickupDeadline": "2024-01-20T18:00:00Z"
}
```

---

## S3 Bucket Structure

```
s3://utm-marketplace-bucket/
├── licenses/
│   ├── driver_uuid_1.pdf
│   ├── driver_uuid_2.pdf
│   └── ...
├── profiles/
│   ├── user_uuid_1.jpg
│   ├── user_uuid_2.jpg
│   └── ...
├── printing/
│   ├── file_uuid_1.pdf
│   ├── file_uuid_2.docx
│   └── ...
├── documents/
│   ├── seller_uuid_1_registration.pdf
│   ├── runner_uuid_1_insurance.pdf
│   └── ...
└── invoices/
    ├── txn_uuid_1.pdf
    ├── txn_uuid_2.pdf
    └── ...

Encryption: AES-256 (SSE-S3)
Versioning: Enabled for audit trail
CORS: Configured for Next.js frontend origin
Access: Pre-signed URLs with 1-hour expiration for downloads
```

---

## Security Implementation

### Encryption at Rest

- **DynamoDB**: KMS encryption for sensitive fields (passwords, phone numbers, payment info)
- **S3**: SSE-S3 (AES-256) encryption for all uploaded files
- **Database Fields**: Sensitive data encrypted using AES-256-GCM

### Encryption in Transit

- **API Communication**: HTTPS/TLS 1.2+ for all endpoints
- **WebSocket**: WSS (WebSocket Secure) for chat
- **Message Content**: Optional application-level encryption for messages

### Authentication & Authorization

- **Identity**: AWS Cognito user pools with UTM email domain validation
- **Tokens**: JWT-based access tokens (15min expiry) and refresh tokens (7-day expiry)
- **Permissions**:
  - Buyers can only view their own orders/rides and chat with assigned providers
  - Providers can only manage their own listings/applications
  - Admins have approval access only (applications and disputes)
  - Role-based access control enforced at Lambda layer

### Privacy Protections

- **Phone Number Masking**: Never exposed in chat; system manages all communication
- **Profile Data**: Restricted based on relationship (buyer-provider pair only)
- **Payment Information**: Never stored locally; handled by payment gateway
- **Data Deletion**: Account closure triggers secure deletion of personal data (30-day policy)

### Data Validation

- **Input Sanitization**: All user inputs validated against schema before processing
- **File Upload Validation**: Whitelist file types, scan for malware
- **Rate Limiting**: API Gateway throttling (100 requests/sec per user)
- **CORS**: Restricted to UTM marketplace frontend domain only

---

## Error Handling Strategy

### Transaction Rollback

**Scenario**: Payment captured but order creation fails

**Response**:
1. Payment gateway called to reverse transaction
2. Funds returned to buyer (immediate or next business day)
3. Error logged with transaction ID for manual review
4. User notified of issue and asked to retry

### Payment Failure Handling

**Scenario**: Escrow payment fails during order creation

**Response**:
1. Order creation aborted
2. No order record created
3. User shown specific error (insufficient funds, expired card, etc.)
4. User can retry with different payment method

### Provider Cancellation Handling

**Scenario**: Provider accepts then cancels ride/order

**Response**:
1. Order status updated to "Cancelled"
2. Escrow hold released back to buyer (within 24 hours)
3. Notification sent to buyer
4. Provider rating impact noted for quality metrics
5. Automatic reassignment attempt (if possible) or buyer notified

### Chat Failure Handling

**Scenario**: WebSocket connection drops

**Response**:
1. Client automatically attempts reconnection (exponential backoff)
2. Missed messages stored in DynamoDB Streams
3. On reconnection, client syncs missed messages from streams
4. Notification badge updated on reconnect
5. After 30 minutes offline, delivery falls back to in-app notification only

### Escrow Dispute Resolution

**Scenario**: Buyer claims service not received

**Response**:
1. Buyer files dispute with evidence
2. Admin reviews transaction and chat history
3. Manual decision: release to provider or refund to buyer
4. Funds transferred accordingly
5. Dispute logged for provider quality metrics

---

## Testing Strategy

### Unit Testing Approach

**Core Business Logic**:
- Escrow state transitions (Pending → InEscrow → AwaitingConfirmation → Released)
- Order status workflows per service type
- Price calculation and tax computation
- Stock decrement logic for menu items
- Pre-order cut-off time validation
- File upload validation (size, format)

**Examples**:
1. Adding item to cart and calculating total with tax
2. Declining order and verifying escrow reversal
3. Accepting ride within time window
4. Uploading file with valid format
5. Creating application with missing fields

**Test Categories**:
- Valid path: Happy path scenarios with correct inputs
- Edge cases: Boundary values (max/min quantities, timeout edges)
- Error cases: Invalid inputs, missing data, service failures

### Integration Testing

**Cross-Module Interactions**:
- Order creation → Payment processing → Chat channel creation
- Ride booking → Driver assignment → Escrow hold
- Application submission → Admin approval → Role update
- Message delivery via WebSocket → Fallback to Streams
- File upload → S3 storage → Reference URL generation

**External Dependencies**:
- Payment gateway integration (Stripe/PayPal)
- Cognito authentication (with test user pool)
- S3 file upload and retrieval
- DynamoDB read/write operations
- WebSocket connection management

### Property-Based Testing Applicability

**Assessment**: Given the requirements for this feature, property-based testing applies to specific domain logic but not universally.

**PBT Applicable For**:
- Escrow state machine: For any valid transaction, state transitions follow valid paths
- Price calculations: For any valid items/quantities, total price = sum of items + fees + tax
- Stock management: For any menu item, current stock never exceeds max stock
- Message delivery: For any message in any chat channel, it eventually reaches recipient

**PBT NOT Applicable For**:
- Infrastructure configuration: AWS setup, S3 bucket policies, Cognito pools (use snapshot tests)
- UI rendering: Chat interface, order status display (use snapshot/visual tests)
- External service behavior: Payment gateway API calls, delivery to 3rd parties (use mocks + example-based tests)
- Side effects: Notifications, logging, audit trails (use mock verification)

Based on this assessment, I will focus on comprehensive unit and integration tests with selective property-based testing for algorithmic correctness.

---

## Error Handling and Transaction Rollback

### Payment System Error Handling

```
Error Scenario: Payment processing fails
Rollback Process:
1. Lambda catches payment gateway error
2. Verify transaction wasn't partially processed
3. Call payment gateway refund if funds held
4. Update transaction status to "Failed"
5. Update order status to "Pending" (not created if new order)
6. Log error with reference ID
7. Notify user of failure with retry option

Retry Logic:
- Immediate retry: 1 attempt
- Exponential backoff: 2-3 additional attempts after 5min, 15min delays
- After 3 failures: Manual admin review required
```

### Order Cancellation Rollback

```
Error Scenario: Order cancelled after payment captured
Rollback Process:
1. Update order status to "Cancelled"
2. Call payment gateway to release escrow hold
3. Verify escrow release confirmed
4. Update transaction status to "Refunded"
5. Send notification to buyer
6. Track provider cancellation rate for quality metrics
7. Attempt automatic reassignment (if applicable)
```

### Idempotency Handling

All critical Lambda handlers implement idempotency:

```
POST /orders/:orderId/confirm-completion
Idempotency Key: "order:{orderId}:completion"
If duplicate request received within 24 hours:
  - Return same response as original request
  - Don't double-release escrow
  - Don't duplicate notification
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Email Domain Validation

*For any email address submitted during signup, the system SHALL only accept emails ending with @graduate.utm.my or @utm.my*

**Validates: Requirement 1.1**

### Property 2: Default Buyer Role Assignment

*For any user completing the signup process, the system SHALL assign the "Buyer" role by default*

**Validates: Requirement 2.1**

### Property 3: Buyer Access Restrictions

*For any user with only the "Buyer" role, attempting to perform provider-specific actions (listing items, accepting orders) SHALL be rejected with authorization error*

**Validates: Requirement 2.2**

### Property 4: Valid Application Status Transitions

*For any provider application, status transitions SHALL follow valid paths: Pending → (Approved|Rejected|NeedsRevision), and invalid transitions SHALL be rejected*

**Validates: Requirement 3.2**

### Property 5: Escrow Initialization on Order Creation

*For any valid order or ride created, the system SHALL initiate an escrow transaction with status "InEscrow" and charge the buyer's payment method*

**Validates: Requirement 5.1**

### Property 6: Payment Failure Atomicity

*For any failed payment during order or ride creation, the system SHALL NOT create the order/ride record and SHALL NOT hold any funds in escrow*

**Validates: Requirement 5.4**

### Property 7: Escrow Release Idempotency

*For any order with escrow in "InEscrow" status and the buyer confirms receipt, the system SHALL release funds exactly once, preventing double-releases even if confirmation is resubmitted*

**Validates: Requirements 6.2, 7.2**

### Property 8: Automatic Escrow Release

*For any order or ride where the buyer fails to manually confirm within the required timeframe (7 days for orders, 24 hours for rides), the system SHALL automatically release escrowed funds to the provider*

**Validates: Requirements 6.4, 7.4**

### Property 9: Chat Channel Automatic Creation

*For any order or ride accepted by a provider, the system SHALL automatically create a Chat_Channel linking the buyer and provider*

**Validates: Requirement 8.1**

### Property 10: Phone Number Masking in Chat

*For any chat channel, neither the buyer nor provider SHALL have access to the other party's personal phone number through any channel interface or API response*

**Validates: Requirement 8.5**

### Property 11: Stock Decrement Consistency

*For any menu item, when an order is placed for N units, the current stock SHALL decrement by exactly N, and stock SHALL never go below 0 or exceed the maximum stock limit*

**Validates: Requirement 11.3**

### Property 12: Pre-order Cut-off Validation

*For any order placed after the pre-order cut-off time for a menu item, the system SHALL reject the order and prevent the transaction*

**Validates: Requirement 11.4**

### Property 13: Order Status History Completeness

*For any order, the system SHALL record all status transitions with timestamps, and querying the status history SHALL return all previous statuses in chronological order*

**Validates: Requirement 17.1**

### Property 14: User Authorization for Profile Access

*For any user viewing another user's profile, the system SHALL restrict display of sensitive information based on relationship (buyer-provider pair only) and role (admins can always view)*

**Validates: Requirement 18.3**

### Property 15: Rating Round-Trip Consistency

*For any rating submitted by a buyer after service completion, querying the rating SHALL return the same value (stars and text review)*

**Validates: Requirement 19.2**

### Property 16: Average Rating Calculation

*For any set of ratings submitted for a provider, the average rating displayed SHALL equal the arithmetic mean of all ratings, calculated as (sum of all ratings) / (count of ratings)*

**Validates: Requirement 19.3**

### Property 17: Cancellation Refund Atomicity

*For any order or ride cancelled by a buyer before provider acceptance, the system SHALL immediately release escrowed funds back to the buyer and update transaction status to "Refunded"*

**Validates: Requirement 20.3**

### Property 18: Duplicate Review Prevention

*For any order or ride, the system SHALL prevent submission of multiple ratings/reviews and reject subsequent rating attempts for the same transaction*

**Validates: Requirement 19.5**

### Property 19: Driver Availability State Persistence

*For any driver toggling between online/offline status, the system SHALL update their availability state in the database and make them available/unavailable for ride requests accordingly*

**Validates: Requirement 10.1**

### Property 20: File Upload Validation Rules

*For any file upload attempt with size exceeding 50MB or format not in [PDF, DOC, DOCX, JPG, PNG] for printing, the system SHALL reject the upload and display supported constraints*

**Validates: Requirement 15.7, 15.8**

---

## Property Reflection

Upon review of the 20 identified properties, the following redundancies and consolidations have been noted:

**Consolidations Made**:
- Properties 7 and 8 were separated for clarity (manual release vs. auto-release), but both test escrow release correctness. They remain separate as they test distinct mechanisms.
- Properties 11 and 12 both concern inventory but test different aspects (decrement vs. cut-off validation) and remain separate.
- Properties 14 validates authorization, which is a cross-cutting concern for all profile/data access. This property is sufficient without duplication.

**No redundancies requiring removal** - each property tests a distinct business rule or constraint.

---

## Complete Testing Strategy

### Comprehensive Testing Framework

The UTM Student Marketplace employs a three-tier testing approach to ensure correctness, reliability, and maintainability:

#### 1. Unit Tests (Jest/Vitest)

**Purpose**: Test individual business logic functions in isolation

**Target Areas**:
- Price calculations (subtotal, tax, fees)
- Stock decrement logic
- Status transition validation
- Email domain validation
- Authorization checks
- Rating average calculation
- Pre-order cut-off validation
- Escrow state machine logic

**Example Test Structure**:
```javascript
describe('Stock Management', () => {
  test('stock decrements correctly when order placed', () => {
    const item = { maxStock: 50, currentStock: 30 };
    const newStock = decrementStock(item, 5);
    expect(newStock).toBe(25);
  });

  test('stock never goes below 0', () => {
    const item = { maxStock: 50, currentStock: 5 };
    const newStock = decrementStock(item, 10);
    expect(newStock).toBe(0);  // Capped at 0, not -5
  });
});
```

#### 2. Property-Based Tests (fast-check)

**Purpose**: Test properties that should hold across generated inputs

**Configuration**: Minimum 100 iterations per test

**Target Properties** (per Correctness Properties section above):

- **Property 5**: Escrow Initialization
  ```javascript
  fc.assert(
    fc.property(fc.record({
      orderId: fc.uuid(),
      amount: fc.integer({ min: 1, max: 1000 }),
      buyerId: fc.uuid()
    }), (order) => {
      const result = initiateEscrow(order);
      return result.status === 'InEscrow' && result.amount === order.amount;
    }),
    { numRuns: 100 }
  );
  ```

- **Property 11**: Stock Decrement
  ```javascript
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 100 }),  // max stock
      fc.integer({ min: 1, max: 50 }),   // current stock
      fc.integer({ min: 1, max: 50 }),   // order quantity
      (maxStock, currentStock, quantity) => {
        if (quantity > currentStock) return true;  // Skip invalid cases
        const final = decrementStock({ maxStock, currentStock }, quantity);
        return final >= 0 && final <= maxStock;
      }
    ),
    { numRuns: 100 }
  );
  ```

- **Property 16**: Average Rating Calculation
  ```javascript
  fc.assert(
    fc.property(
      fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 1 }),
      (ratings) => {
        const avg = calculateAverageRating(ratings);
        const expected = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        return avg === expected;
      }
    ),
    { numRuns: 100 }
  );
  ```

#### 3. Integration Tests

**Purpose**: Test interaction between components and with external services

**Test Categories**:

a) **Order-to-Payment Flow**:
- Create order → Initiate escrow → Confirm receipt → Release funds
- Verify each step updates state correctly
- Test with real DynamoDB or mock

b) **Chat Channel Creation**:
- Accept order/ride → Chat channel auto-created
- Send message → Delivered to recipient
- WebSocket fallback to Streams on disconnect

c) **Provider Application Workflow**:
- Submit application → Admin reviews → Approval → Role updated
- Document upload → S3 storage → URL retrieval

d) **Multi-Service Interactions**:
- Ride booking → Escrow hold → Chat → Completion → Rating
- Food order → Stock decrement → Escrow → Chat → Confirmation

**Example Integration Test**:
```javascript
describe('Complete Order Workflow', () => {
  test('order creation triggers payment and chat channel', async () => {
    // Create order
    const order = await createOrder({
      buyerId: testBuyer.id,
      sellerId: testSeller.id,
      items: [{ itemId: 'menu_1', quantity: 2 }]
    });

    // Verify escrow initiated
    const transaction = await getTransaction(order.transactionId);
    expect(transaction.status).toBe('InEscrow');

    // Verify chat channel created
    const chatChannel = await getChatChannel(order.orderId);
    expect(chatChannel.buyerId).toBe(testBuyer.id);
    expect(chatChannel.providerId).toBe(testSeller.id);
  });
});
```

### Testing by Service Module

#### Ride-Hailing Tests

**Unit Level**:
- Distance-based fare calculation
- Passenger count validation
- Scheduled ride time validation

**Integration Level**:
- Driver availability lookup
- Ride assignment to driver
- Status transitions: Pending → Accepted → InProgress → Completed
- Escrow release after 24-hour timeout

**Property Tests**:
- For any ride booking, exactly one driver is assigned
- For any online driver, they appear in availability search
- For any ride, auto-release happens after 24 hours

#### F&B Service Tests

**Unit Level**:
- Stock decrement by order quantity
- Pre-order cut-off time validation
- Tax and delivery fee calculation

**Integration Level**:
- Menu item creation and retrieval
- Browse sellers and items
- Order acceptance updates stock
- Automatic stock "Out of Stock" status

**Property Tests**:
- For any stock level, decrement never goes negative
- For any cut-off time, orders after it are rejected
- For any average rating set, calculation is correct

#### Parcel Service Tests

**Unit Level**:
- Collection point validation
- Residential college selection
- Delivery time estimation

**Integration Level**:
- Order creation with collection point and college
- Runner availability and order assignment
- Order acceptance and chat channel creation

**Property Tests**:
- For any parcel order, auto-release happens after 7 days
- For any runner with online status, they can accept orders

#### Printing Service Tests

**Unit Level**:
- File size validation (<50MB)
- File format validation (PDF, DOC, etc.)
- Color mode and double-sided option validation

**Integration Level**:
- File upload to S3
- Pre-signed URL generation
- Printing order creation
- Provider acceptance and chat channel

**Property Tests**:
- For any file within limits, upload succeeds
- For any file outside limits, upload fails
- For any printing order, auto-release happens after 7 days

### Cross-Cutting Concerns

**Authentication & Authorization**:
- UTM email domain validation (unit + property tests)
- Cognito integration (integration tests with test pool)
- Role-based access control (integration + property tests)

**Payment & Escrow**:
- Escrow initialization (property tests)
- Release conditions (property tests + integration)
- Failure handling and rollback (integration tests)

**Chat & Messaging**:
- Channel creation (integration tests)
- Message encryption (unit + integration)
- Phone number masking (unit tests)
- WebSocket delivery (integration)
- DynamoDB Streams fallback (integration)

**Security**:
- Encryption at rest (smoke tests - verify configuration)
- HTTPS enforcement (smoke tests)
- Data deletion on account closure (integration tests)

---

## Deployment and Rollout Strategy

### Staging Environment

- Clone of production infrastructure in separate AWS account
- Test data with realistic volumes
- Full end-to-end testing before production release

### Canary Deployment

- Deploy Lambda functions with 5% traffic initially
- Monitor error rates and latencies
- Gradually increase to 25%, 50%, 100%
- Rollback if error rate exceeds threshold (>1%)

### Database Migration

- DynamoDB tables provisioned with on-demand billing initially
- Monitor peak usage patterns
- Switch to provisioned capacity once patterns stabilized
- Backup before any schema changes

### Monitoring and Alerts

- CloudWatch metrics for key transactions:
  - Escrow initialization success rate
  - Order-to-completion time
  - Chat message delivery latency
  - File upload success rate
  
- Alarms:
  - Payment gateway errors >1% (critical)
  - Chat delivery latency >5 seconds (warning)
  - DynamoDB throttling (critical)
  - S3 upload failures >0.5% (warning)

---

## Future Enhancements

### Phase 2 Considerations

- **Multiple Ratings**: Allow buyers and providers to rate each other
- **Driver Ratings for Passengers**: Track passenger behavior
- **Scheduled Deliveries**: Set specific pickup times
- **Promotional Codes**: Support discount codes for orders
- **Provider Earnings Dashboard**: Detailed income tracking
- **Advanced Analytics**: Peak hours, popular items, demand forecasting
- **Wallet System**: In-app credit balance for frequent users
- **Multi-language Support**: Malay, English, Chinese interfaces
- **Push Notifications**: Mobile app push instead of just in-app
- **Transaction Export**: CSV export of order history

### Technical Debt Mitigation

- Migrate from DynamoDB Streams to SQS/SNS for messaging fallback
- Implement GraphQL layer for flexible frontend queries
- Add caching layer (ElastiCache) for hot data (menu items, driver availability)
- Migrate to microservices architecture as complexity grows
- Implement distributed tracing (X-Ray) for debugging
- Add comprehensive audit logging for compliance

---

## Conclusion

The UTM Student Marketplace design prioritizes security, privacy, and reliability through:

1. **Escrow-based payments** protecting both buyers and providers
2. **Privacy-first messaging** preventing phone number exposure
3. **Real-time infrastructure** with reliable fallbacks
4. **Comprehensive testing** covering unit, integration, and property-based approaches
5. **Clear error handling** with transaction rollback guarantees
6. **Role-based access control** limiting user capabilities
7. **Encrypted data storage** protecting sensitive information

This design provides a solid foundation for a trustworthy, scalable marketplace serving the UTM student community.
