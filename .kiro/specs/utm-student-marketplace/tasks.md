# Implementation Plan: UTM Student Marketplace

## Overview

This implementation plan breaks down the UTM Student Marketplace feature into discrete, manageable tasks following the serverless architecture defined in the design document. The plan follows a bottom-up approach: infrastructure setup → core services → service modules → cross-cutting concerns → testing and deployment.

The implementation is organized into six major phases:
1. **Infrastructure & Setup**: DynamoDB tables, S3 buckets, Cognito configuration, API Gateway
2. **Authentication Service**: Email validation, Cognito integration, role assignment
3. **Payment & Escrow System**: Transaction management, escrow state machine, payment gateway integration
4. **Service Modules**: Ride-Hailing, F&B, Parcel, Printing (with dependencies on authentication and payment)
5. **Cross-Cutting Concerns**: Messaging, notifications, provider applications, rating system
6. **Admin Dashboard & Frontend Integration**: Admin moderation interface, frontend components, e2e flows

---

## Tasks

### Phase 1: Infrastructure & Setup

- [x] 1. Set up project structure and AWS infrastructure foundations
  - [x] 1.1 Initialize Next.js project with TypeScript, Tailwind CSS, and ESLint configuration
    - Configure tsconfig.json for strict type checking
    - Set up Next.js routing and API routes structure
    - Install and configure Tailwind CSS with custom UTM theme colors
    - _Requirements: N/A (foundational)_

  - [x] 1.2 Configure AWS Lambda environment and dependencies
    - Create Lambda handler base classes for TypeScript
    - Set up environment variables (AWS region, table names, S3 buckets, Cognito pool)
    - Configure AWS SDK v3 for Lambda handlers
    - Set up logging with CloudWatch integration
    - _Requirements: N/A (foundational)_

  - [x] 1.3 Create DynamoDB tables for all services
    - Create Users table with GSIs (email-index, role-index, status-index)
    - Create Rides table with GSIs (buyerId-index, driverId-index, status-index, driverId-status-index)
    - Create Orders table with GSIs (buyerId-index, providerId-index, status-index, serviceType-index)
    - Create Menu Items table with GSIs (sellerId-index, status-index)
    - Create Messages table with GSI (chatChannelId-createdAt for efficient message retrieval)
    - Create Chat Channels table with GSIs (buyerId-index, providerId-index, transactionId-index)
    - Create Applications table with GSIs (userId-index, status-index, roleType-index)
    - Create Payments & Transactions table with GSIs (buyerId-index, payeeId-index, status-index, escrowReleaseTime-index)
    - Create Printing Orders table with GSIs (buyerId-index, providerId-index, status-index)
    - _Requirements: N/A (foundational)_

  - [x] 1.4 Configure S3 bucket for file storage
    - Create utm-marketplace-bucket with versioning enabled
    - Set up folder structure: licenses/, profiles/, printing/, documents/, invoices/
    - Configure AES-256 encryption (SSE-S3)
    - Configure pre-signed URL generation (1-hour expiration)
    - Set up CORS policy for Next.js frontend
    - _Requirements: 4.2, 15.2, 18.2_

  - [x] 1.5 Set up AWS Cognito user pool and authentication
    - Create Cognito user pool with UTM email domain validation
    - Configure password policy (minimum 12 chars, uppercase, numbers, symbols)
    - Set up JWT token configuration (access: 15min, refresh: 7days)
    - Configure email verification workflow
    - Create test user pool for development/testing
    - _Requirements: 1.3_

  - [x] 1.6 Configure API Gateway and WebSocket endpoints
    - Create REST API Gateway with CORS enabled for Next.js frontend
    - Set up authorization using Cognito authorizers
    - Create WebSocket API Gateway for real-time messaging
    - Configure route mappings ($default, $connect, $disconnect)
    - Set up CloudWatch logging and X-Ray tracing
    - _Requirements: N/A (foundational)_

  - [ ]* 1.7 Write infrastructure setup tests
    - **Property 1**: Tables created with correct schema
    - **Validates: Requirements 1.3**
    - Test DynamoDB table creation with correct attributes
    - Test GSI configuration for each table
    - Test S3 bucket encryption and versioning
    - Test Cognito pool configuration

### Phase 2: Authentication & Authorization Service

- [ ] 2. Implement email validation and user signup
  - [-] 2.1 Create email validation Lambda handler
    - Validate email domain (@graduate.utm.my or @utm.my)
    - Reject invalid domains with clear error message
    - Return validation result to signup flow
    - _Requirements: 1.1_

  - [-] 2.2 Implement Cognito signup Lambda handler
    - Accept email, password, fullName in request body
    - Call Cognito AdminCreateUser or SignUp API
    - Trigger email verification workflow
    - Return userId, email, role="Buyer", verificationStatus="pending_email"
    - Handle duplicate email errors gracefully
    - _Requirements: 1.3, 1.4_

  - [-] 2.3 Implement default Buyer role assignment
    - On successful signup, automatically assign role="Buyer" in Users table
    - Verify Buyer users cannot perform provider actions
    - Store role assignment with creation timestamp
    - _Requirements: 2.1, 2.2_

  - [-] 2.4 Implement email verification Lambda handler
    - Accept email and verificationCode
    - Call Cognito ConfirmSignUp or AdminConfirmSignUp
    - Update Users table emailVerified=true
    - Return verified user details
    - _Requirements: 1.1_

  - [-] 2.5 Implement login Lambda handler
    - Accept email and password
    - Call Cognito InitiateAuth (USER_PASSWORD_AUTH)
    - Return accessToken, idToken, refreshToken, userId
    - Handle invalid credentials with secure error message
    - _Requirements: 1.4_

  - [ ]* 2.6 Write property tests for authentication
    - **Property 1**: Email domain validation
    - **Property 2**: Default buyer role assignment
    - **Validates: Requirements 1.1, 2.1_
    - Test signup with valid UTM email
    - Test signup rejection with non-UTM email
    - Test default role assignment
    - Test token expiration and refresh

- [ ] 3. Checkpoint - Ensure all tests pass
  - Ensure all authentication tests pass, ask the user if questions arise.

### Phase 3: Payment & Escrow System

- [ ] 4. Implement escrow payment initialization
  - [ ] 4.1 Create payment gateway integration layer
    - Set up Stripe or PayPal payment gateway client
    - Implement payment intent creation and capture
    - Implement refund and hold release operations
    - Handle payment gateway webhook signatures and validation
    - Store payment gateway API keys securely in environment
    - _Requirements: 5.1, 5.2_

  - [ ] 4.2 Implement escrow initialization Lambda handler
    - Accept orderId/rideId, buyerId, amount, serviceType
    - Validate buyer payment method exists
    - Call payment gateway to initiate escrow hold
    - Create Transactions table record with status="Pending"
    - Update transaction to status="InEscrow" on payment confirmation
    - Handle payment failure (return 400, no transaction created)
    - Implement idempotency key to prevent double-charging
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 4.3 Implement escrow release for manual confirmation
    - Accept orderId/rideId and buyerId in request
    - Verify buyer clicked confirmation button
    - Call payment gateway to release funds to provider
    - Update Transactions table: status="Released", releasedAt=now
    - Update Order/Ride status to "Completed"
    - Send notification to provider (funds available)
    - _Requirements: 6.2, 7.2_

  - [ ] 4.4 Implement automatic escrow release scheduler
    - Create CloudWatch scheduled Lambda to check pending escrow releases
    - Query Payments table for status="AwaitingConfirmation" AND current time >= escrowReleaseTime
    - For each expired escrow, call payment gateway release
    - Update transaction status and order/ride status
    - Send notification to provider
    - Implement exponential backoff on payment gateway errors
    - _Requirements: 6.4, 7.4_

  - [ ] 4.5 Implement payment failure and refund handler
    - Accept failed transaction reference from payment gateway webhook
    - Verify transaction and check if order/ride exists
    - If order/ride exists, update status to "Cancelled"
    - Call payment gateway to refund any held funds
    - Update transaction status to "Refunded"
    - Send notification to buyer
    - Log transaction with reason
    - _Requirements: 5.4, 20.1_

  - [ ] 4.6 Implement provider cancellation refund workflow
    - Accept orderId/rideId and providerId cancelling the transaction
    - Verify provider has accepted the order/ride
    - Update order/ride status to "Cancelled"
    - Call payment gateway to release escrow to buyer
    - Update transaction status to "Refunded"
    - Send notification to buyer
    - Track provider cancellation for quality metrics
    - _Requirements: 20.2_

  - [ ]* 4.7 Write property tests for escrow system
    - **Property 5**: Escrow initialization creates InEscrow transaction
    - **Property 6**: Payment failure atomicity (no order created on failure)
    - **Property 7**: Escrow release idempotency (release exactly once)
    - **Property 8**: Automatic escrow release after timeout
    - **Validates: Requirements 5.1, 5.4, 6.2, 7.2, 6.4, 7.4_
    - Test escrow initialization with valid payment
    - Test escrow release single-release guarantee
    - Test automatic release after time threshold
    - Test payment failure prevents order creation

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all payment tests pass, ask the user if questions arise.

### Phase 4: Service Modules Implementation

- [ ] 6. Implement Ride-Hailing Service
  - [ ] 6.1 Implement ride booking Lambda handler
    - Accept pickupLocation, dropoffLocation, passengerCount, scheduledTime (optional)
    - Validate locations and passenger count (1-6)
    - Create Rides table record with status="Pending"
    - Calculate estimated fare based on distance
    - Initiate escrow payment via payment handler
    - Return rideId, status, estimatedFare
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ] 6.2 Implement driver availability search
    - Accept pickupLocation and current time
    - Query Users table: role=Driver AND driverStatus="Online"
    - Return list of available drivers with ratings
    - Cache results for 30 seconds to reduce queries
    - _Requirements: 9.2_

  - [ ] 6.3 Implement driver assignment logic
    - Accept rideId and driverId from matching logic
    - Update Rides table: driverId=assigned driver, status="Accepted"
    - Create Chat_Channel between buyer and driver
    - Send notification to driver (new ride request)
    - Send notification to buyer (driver assigned)
    - _Requirements: 9.4_

  - [ ] 6.4 Implement driver online/offline toggle
    - Accept driverId and targetStatus (Online/Offline)
    - Update Users table: driverStatus=targetStatus, updatedAt=now
    - On logout, automatically set driverStatus="Offline"
    - Return updated status and confirmation
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ] 6.5 Implement ride completion handler
    - Accept rideId and buyerId confirmation
    - Verify buyer is the ride creator
    - Update Rides table: status="AwaitingConfirmation"
    - Trigger escrow release process (immediate or auto-release after 24h)
    - _Requirements: 7.1, 7.2_

  - [ ]* 6.6 Write property tests for ride-hailing
    - **Property 19**: Driver availability state persistence
    - **Validates: Requirements 10.1, 9.2_
    - Test ride booking creates correct record
    - Test driver assignment when online
    - Test driver offline prevents new assignments

- [ ] 7. Implement Food & Beverage Service
  - [ ] 7.1 Implement seller menu management handler
    - Accept sellerId, itemName, description, price, maxStock, preorderCutoffTime
    - Validate all required fields and price > 0
    - Create Menu Items table record with status="Available"
    - Return menuItemId and confirmation
    - _Requirements: 11.1, 11.2_

  - [ ] 7.2 Implement menu browsing handler
    - Query Menu Items table for all active sellers with status="Available"
    - Return seller info (businessName, rating) and their available items
    - Include stock status and cut-off times
    - Cache results for 5 minutes (high traffic endpoint)
    - _Requirements: 12.1, 12.2_

  - [ ] 7.3 Implement pre-order cut-off time validation
    - Accept orderId, itemId, and current time
    - Query Menu Items table to get preorderCutoffTime
    - Compare current time to cut-off time
    - Reject orders after cut-off with clear message
    - _Requirements: 11.4_

  - [ ] 7.4 Implement stock decrement on order
    - Accept itemId and quantity ordered
    - Read current stock from Menu Items table
    - Update currentStock = currentStock - quantity (atomic operation)
    - Update stockStatus based on new level (Available/LowStock/OutOfStock)
    - Prevent decrement if quantity > stock (fail-fast)
    - _Requirements: 11.3, 11.5_

  - [ ] 7.5 Implement F&B order creation handler
    - Accept buyerId, sellerId, items array
    - Validate all items exist and are available
    - For each item, call cut-off validation and stock decrement
    - Calculate total price: subtotal + deliveryFee + tax
    - Create Orders table record with serviceType="FoodDelivery"
    - Initiate escrow payment
    - Create Chat_Channel with seller
    - _Requirements: 12.3, 12.4_

  - [ ] 7.6 Implement F&B order acceptance handler
    - Accept orderId and sellerId
    - Verify seller owns the order
    - Update Orders table: status="Accepted", acceptedAt=now
    - Send notification to buyer
    - Start accepting delivery requests
    - _Requirements: 12.5_

  - [ ]* 7.7 Write property tests for F&B service
    - **Property 11**: Stock decrement consistency
    - **Property 12**: Pre-order cut-off validation
    - **Validates: Requirements 11.3, 11.4_
    - Test stock decrement by exact quantity
    - Test stock never goes negative
    - Test orders after cut-off rejected
    - Test correct total price calculation

- [ ] 8. Implement Parcel Service
  - [ ] 8.1 Implement parcel order creation handler
    - Accept buyerId, collectionPoint, residentialCollege, parcelDescription
    - Validate collection point from predefined UTM locations
    - Validate residential college from predefined list
    - Create Orders table record with serviceType="ParcelDelivery"
    - Calculate estimated delivery time (120 minutes default)
    - Initiate escrow payment
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [ ] 8.2 Implement runner availability dashboard
    - Accept runnerId query parameter
    - Query Orders table: serviceType="ParcelDelivery" AND status="Pending"
    - Sort by collectionPoint and createdAt
    - Return available orders with buyer details (name only, no phone)
    - _Requirements: 14.1_

  - [ ] 8.3 Implement parcel order acceptance handler
    - Accept orderId and runnerId
    - Update Orders table: status="Accepted", providerId=runnerId
    - Create Chat_Channel between buyer and runner
    - Send notification to buyer (runner assigned)
    - _Requirements: 14.2_

  - [ ] 8.4 Implement runner online/offline toggle
    - Accept runnerId and targetStatus
    - Update Users table: runnerStatus=targetStatus, updatedAt=now
    - Prevent assignment of new orders when offline
    - _Requirements: 14.3, 14.4_

  - [ ]* 8.5 Write property tests for parcel service
    - **Validates: Requirements 13.1, 14.1_
    - Test parcel order creation with valid locations
    - Test runner availability queries
    - Test order acceptance creates chat

- [ ] 9. Implement Printing Service
  - [ ] 9.1 Implement file upload handler
    - Accept file, buyerId (multipart form data)
    - Validate file size (<50MB)
    - Validate file format (PDF, DOC, DOCX, JPG, PNG)
    - Generate unique S3 key: printing/{buyerId}/{fileId}.ext
    - Upload to S3 with AES-256 encryption
    - Return fileDocumentId, fileName, fileSize, uploadedAt
    - _Requirements: 15.2, 15.7, 15.8_

  - [ ] 9.2 Implement printing order creation handler
    - Accept buyerId, fileDocumentId, colorMode, doubleSided, pageCount
    - Validate file exists in S3
    - Validate colorMode (Color/BlackAndWhite)
    - Validate doubleSided (true/false)
    - Calculate cost based on pageCount and options
    - Create Printing Orders table record with status="Pending"
    - Initiate escrow payment
    - _Requirements: 16.1, 16.2, 15.3, 15.4, 15.5, 15.6_

  - [ ] 9.3 Implement printing order acceptance handler
    - Accept printingOrderId and providerId
    - Update Printing Orders table: status="Accepted", providerId=providerId
    - Create Chat_Channel with buyer
    - Send notification to buyer
    - _Requirements: 16.3_

  - [ ] 9.4 Implement printing ready-for-pickup handler
    - Accept printingOrderId and providerId
    - Verify provider owns the order
    - Update Printing Orders table: status="ReadyForPickup", pickupDeadline=now+72h
    - Send notification to buyer (pickup available)
    - _Requirements: 16.4_

  - [ ]* 9.5 Write property tests for printing service
    - **Property 20**: File upload validation rules
    - **Validates: Requirements 15.7, 15.8_
    - Test file upload within size limit
    - Test file format validation
    - Test upload rejection for invalid files

- [ ] 10. Checkpoint - Ensure all service module tests pass
  - Ensure all service tests pass, ask the user if questions arise.

### Phase 5: Cross-Cutting Concerns

- [ ] 11. Implement Real-Time Messaging System
  - [ ] 11.1 Implement chat channel creation handler
    - Called automatically after order/ride acceptance
    - Accept buyerId, providerId, transactionId, transactionType
    - Create Chat Channels table record with status="Active"
    - Initialize buyerUnread=0, providerUnread=0
    - Return chatChannelId
    - _Requirements: 8.1, 8.2_

  - [ ] 11.2 Implement WebSocket message handler ($default route)
    - Accept connectionId, chatChannelId, messageText, senderId
    - Validate sender is participant in chat channel
    - Validate message not empty and under length limit (5000 chars)
    - Encrypt message using AES-256
    - Create Messages table record
    - Query Chat Channels for recipient's connectionId
    - Send message to recipient via WebSocket
    - Update lastMessageAt in Chat Channels
    - Return delivery confirmation
    - _Requirements: 8.3_

  - [ ] 11.3 Implement WebSocket connect handler ($connect route)
    - Accept connectionId from API Gateway
    - Store mapping: userId → connectionId in temporary DynamoDB table
    - Clean up stale connections older than 24 hours
    - _Requirements: 8.3_

  - [ ] 11.4 Implement WebSocket disconnect handler ($disconnect route)
    - Accept connectionId
    - Remove connectionId from active connections
    - If user has missed messages, mark them for sync on reconnect
    - _Requirements: 8.3_

  - [ ] 11.5 Implement DynamoDB Streams fallback for messages
    - Create Lambda to process DynamoDB Streams from Messages table
    - For each new message, attempt WebSocket delivery first
    - If WebSocket fails (connection offline), store in DynamoDB Streams
    - On client reconnect, query for missed messages and sync
    - _Requirements: 8.4_

  - [ ]* 11.6 Write property tests for messaging
    - **Property 9**: Chat channel auto-creation on order acceptance
    - **Property 10**: Phone number masking in chat
    - **Validates: Requirements 8.1, 8.5_
    - Test chat channel creation
    - Test message delivery via WebSocket
    - Test phone number never exposed
    - Test message fallback to Streams

- [ ] 12. Implement Notification System
  - [ ] 12.1 Implement in-app notification handler
    - Accept userId, notificationType, data (orderId/rideId, etc.)
    - Create Notifications table record with status="Unread"
    - If user has active WebSocket connection, send real-time notification
    - Notification types: OrderStatusChanged, RideStatusChanged, ApplicationReviewed, PaymentReleased, MessageReceived
    - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5_

  - [ ] 12.2 Implement notification badge system
    - Accept userId query
    - Count unread notifications from Notifications table
    - Return badge count for Chat icon and other UI elements
    - _Requirements: 23.3_

  - [ ] 12.3 Integrate notifications with order/ride status changes
    - Modify order/ride status update handlers to trigger notifications
    - Notify buyer when: status changes, provider assigned, ready for pickup
    - Notify provider when: new order/ride request, buyer confirmed completion
    - _Requirements: 23.1_

  - [ ]* 12.4 Write tests for notification system
    - Test notification creation and storage
    - Test badge count accuracy
    - Test notification triggers on status changes

- [ ] 13. Implement Provider Application System
  - [ ] 13.1 Create application form builder
    - Accept roleType (Driver, Seller, Runner)
    - Return role-specific form fields
    - For Driver: vehicleModel, licensePlate, licenseDocument (file upload)
    - For Seller: businessName, businessCategory, businessDescription
    - For Runner: transportMode, insuranceDocument (file upload)
    - _Requirements: 3.1_

  - [ ] 13.2 Implement application submission handler
    - Accept userId, roleType, roleSpecificData
    - Validate all required fields present
    - For documents, upload to S3 and store reference
    - Create Applications table record with status="Pending"
    - Send notification to all Admin users
    - Return applicationId and estimatedReviewTime
    - _Requirements: 3.2, 3.3_

  - [ ] 13.3 Implement admin application review handler
    - Accept applicationId, adminId, action (Approve/Reject/NeedsRevision)
    - Verify admin user has approval permission
    - Update Applications table with decision and notes
    - If approved: Update Users table with new role and verificationStatus="Verified"
    - If rejected: Set verificationStatus="Rejected"
    - If needs revision: Set status="NeedsRevision" with reason
    - Send notification to applicant user
    - _Requirements: 3.4, 3.5, 21.2_

  - [ ] 13.4 Implement application history retrieval
    - Accept userId
    - Query Applications table by userId
    - Return all applications with status and review timestamps
    - Allow user to resubmit after "NeedsRevision"
    - _Requirements: 3.5_

  - [ ]* 13.5 Write tests for application system
    - Test application submission with valid data
    - Test document upload to S3
    - Test admin approval updates user role
    - Test resubmission after needs revision

- [ ] 14. Implement Rating and Review System
  - [ ] 14.1 Implement rating submission handler
    - Called after order/ride marked as "Completed"
    - Accept orderId/rideId, buyerId, rating (1-5), review text (optional)
    - Validate rating in range 1-5
    - Verify buyer is transaction participant
    - Create rating record with timestamp
    - Prevent duplicate ratings for same transaction
    - _Requirements: 19.1, 19.2, 19.5_

  - [ ] 14.2 Implement average rating calculation
    - Accept providerId (driverId/sellerId/runnerId)
    - Query all ratings for this provider
    - Calculate mean: sum(ratings) / count(ratings)
    - Store in Users table: averageRating, totalReviews
    - Return rating display info
    - _Requirements: 19.3, 19.4_

  - [ ] 14.3 Implement rating display in browse endpoints
    - Modify all browse handlers (sellers, drivers, runners)
    - Include averageRating and totalReviews in response
    - Sort providers by rating (optional sorting parameter)
    - _Requirements: 19.4_

  - [ ]* 14.4 Write property tests for rating system
    - **Property 15**: Rating round-trip consistency
    - **Property 16**: Average rating calculation
    - **Validates: Requirements 19.2, 19.3_
    - Test rating storage and retrieval
    - Test average calculation accuracy
    - Test duplicate rating prevention

- [ ] 15. Implement Order Status Tracking
  - [ ] 15.1 Implement status history tracking
    - Modify all order/ride status update handlers
    - Maintain statusHistory array in Order/Ride records
    - Each history entry: {status, timestamp, reason}
    - Return complete status history on query
    - _Requirements: 17.1, 17.2_

  - [ ] 15.2 Implement real-time status update endpoint
    - Accept orderId/rideId and retrieve current status
    - Return status and all available actions for current user
    - For buyer: view status, confirm completion, rate, request help
    - For provider: view status, confirm completion, contact support
    - _Requirements: 17.1_

  - [ ] 15.3 Implement order history retrieval
    - Accept userId and userRole
    - Query Rides/Orders table with appropriate role filter
    - Return all past and current transactions with status
    - Include completed, cancelled, and in-progress items
    - _Requirements: 17.4_

  - [ ]* 15.4 Write tests for status tracking
    - Test status history recording
    - Test complete status history retrieval
    - Test real-time updates

- [ ] 16. Implement User Profile System
  - [ ] 16.1 Implement profile retrieval handler
    - Accept userId and requesting user context
    - Return profile info based on relationship:
      - Own profile: All information (full phone, ID number, email)
      - Provider relationship: Limited info (name, rating, verification badge)
      - Admin: Full information
    - For drivers: Show vehicle info and license verification badge
    - For sellers: Show business info and verification badge
    - _Requirements: 18.1, 18.3, 18.4, 18.5_

  - [ ] 16.2 Implement profile picture upload handler
    - Accept userId and image file
    - Validate image format (JPG, PNG)
    - Validate size (<5MB)
    - Upload to S3: profiles/{userId}.jpg
    - Update Users table: profilePicture=s3_url
    - _Requirements: 18.2_

  - [ ] 16.3 Implement profile update handler
    - Accept userId and updateable fields (fullName, businessName, etc.)
    - Validate all fields
    - Update Users table
    - Return updated profile
    - Prevent updates to verification status (admin only)
    - _Requirements: 18.1_

  - [ ]* 16.4 Write tests for profile system
    - Test profile retrieval with different access levels
    - Test profile picture upload
    - Test profile update

- [ ] 17. Checkpoint - Ensure all cross-cutting concern tests pass
  - Ensure all messaging, notification, application, rating tests pass.

### Phase 6: Admin Dashboard and Frontend Integration

- [ ] 18. Implement Admin Dashboard Backend
  - [ ] 18.1 Implement pending applications retrieval
    - Accept adminId
    - Query Applications table: status="Pending" sorted by submittedAt ascending
    - Return application list with user info and submitted data
    - Include document references (S3 URLs)
    - _Requirements: 21.1, 21.2_

  - [ ] 18.2 Implement flagged orders retrieval
    - Query Orders/Rides table for: status in manual review queue
    - Also query for orders with disputes
    - Return with associated chat history preview
    - _Requirements: 21.1_

  - [ ] 18.3 Implement user reports and disputes handler
    - Accept userId and receive report/dispute with description
    - Create Report record with status="Submitted"
    - Query associated transaction and chat messages
    - Mark transaction as "Under Review"
    - Send notification to admins
    - _Requirements: 21.1, 21.3_

  - [ ] 18.4 Implement account suspension handler
    - Accept userId and suspension reason
    - Verify admin has permission
    - Update Users table: accountStatus="Suspended"
    - Log action with adminId for audit
    - Send notification to user with reason
    - Prevent account login and new transactions
    - _Requirements: 21.4_

  - [ ] 18.5 Implement admin dashboard summary statistics
    - Return: Total transactions today, pending applications count, flagged orders count, platform health metrics
    - Query and aggregate efficiently
    - Cache results for 5 minutes
    - _Requirements: 21.1_

  - [ ]* 18.6 Write tests for admin dashboard
    - Test application retrieval and sorting
    - Test statistics accuracy
    - Test suspension workflow

- [ ] 19. Implement Error Handling and Logging
  - [ ] 19.1 Create error handling middleware for Lambda
    - Wrap all Lambda handlers with try-catch
    - For expected errors: Return appropriate HTTP status with message
    - For unexpected errors: Log full error, return 500, create incident ticket
    - Log request/response for debugging
    - _Requirements: 20.1, 20.2, 20.4_

  - [ ] 19.2 Implement transaction error recovery
    - For payment failures: Implement retry logic with exponential backoff
    - For chat creation failures: Set order status to "Error" for manual review
    - For S3 upload failures: Retry up to 3 times, then fail gracefully
    - _Requirements: 20.2, 20.3, 20.4, 20.5_

  - [ ] 19.3 Implement data encryption for sensitive fields
    - Encrypt at rest for: passwords, phone numbers, payment info
    - Use AES-256-GCM with separate keys per field type
    - Decrypt only when necessary for display
    - _Requirements: 22.1_

  - [ ] 19.4 Implement data deletion on account closure
    - Accept userId for account deletion request
    - Archive personal data (encrypted) for legal hold if needed
    - Delete: chat messages, order history, payment info, profile picture
    - Retain: transaction records for audit (anonymized)
    - Complete deletion within 30 days
    - _Requirements: 22.6_

  - [ ]* 19.5 Write tests for error handling
    - Test payment failure rollback
    - Test chat creation error handling
    - Test data encryption/decryption

- [ ] 20. Implement Next.js Frontend Components
  - [ ] 20.1 Create authentication pages (TypeScript + React)
    - SignupPage: Email validation, password, name input
    - LoginPage: Email and password
    - EmailVerificationPage: Verification code input
    - Use Cognito UI components where available
    - _Requirements: 1.1, 1.3, 1.4_

  - [ ] 20.2 Create common layout and navigation
    - Navbar with: logo, user profile dropdown, role selector
    - For providers: toggle online/offline status
    - Navigation links: Browse/Order, Rides, F&B, Parcel, Printing, Profile, Admin (if role)
    - Mobile-responsive with Hamburger menu
    - _Requirements: N/A (foundational)_

  - [ ] 20.3 Create ride-hailing UI components
    - BookRideForm: Pickup/dropoff location pickers, passenger count
    - ActiveRideCard: Status, driver info (masked), chat button, completion button
    - DriverDashboard: Online/offline toggle, active rides list, map view (optional)
    - _Requirements: 9.1, 9.2, 10.1, 17.1_

  - [ ] 20.4 Create F&B service UI components
    - BrowseSellersPage: List of sellers with ratings, search/filter
    - SellerMenuView: Menu items with price, stock, cut-off time
    - OrderForm: Item selection, quantity, total calculation
    - FoodOrderCard: Status tracking, chat, confirmation button
    - SellerMenuManagement: Add/edit items, stock management
    - _Requirements: 12.1, 12.2, 11.1, 11.2_

  - [ ] 20.5 Create parcel service UI components
    - CreateParcelOrderForm: Collection point, residential college, description
    - ParcelOrderCard: Status, runner info (masked), chat, confirmation button
    - RunnerDashboard: Available orders list, status toggle
    - _Requirements: 13.1, 13.3, 14.1, 14.4_

  - [ ] 20.6 Create printing service UI components
    - FileUploadForm: File picker, color/double-sided options
    - PrintingOrderForm: Display uploaded file, options, total price
    - PrintingOrderCard: Status, provider info, pickup details
    - PrintingProviderDashboard: Order list, status management
    - _Requirements: 15.1, 15.3, 16.1_

  - [ ] 20.7 Create chat interface component
    - ChatWindow: Message history, real-time new messages, input box
    - NO phone numbers displayed anywhere
    - Timestamp for each message
    - Delivery status indicators (sent/delivered/read)
    - _Requirements: 8.1, 8.3, 8.5_

  - [ ] 20.8 Create payment UI component
    - Display escrow status and timeline
    - "Order Received" button for F&B/Parcel
    - "Ride Completed" button for rides
    - Show auto-release deadline
    - _Requirements: 6.1, 7.1_

  - [ ] 20.9 Create user profile pages
    - View own profile with edit capability
    - View other providers' profiles (with limited info)
    - Edit profile picture, name, business info
    - Provider verification badge display
    - _Requirements: 18.1, 18.2, 18.3_

  - [ ] 20.10 Create rating and review interface
    - Star rating selector (1-5)
    - Text review input (optional, max 500 chars)
    - Display ratings with timestamp
    - Show provider average rating
    - _Requirements: 19.1, 19.2, 19.3_

  - [ ] 20.11 Create admin dashboard pages
    - PendingApplicationsPage: List, approve/reject/request revision
    - FlaggedOrdersPage: Investigate and resolve
    - UserReportsPage: Review and take action
    - DashboardSummaryPage: Key metrics and health status
    - _Requirements: 21.1, 21.2, 21.3, 21.4_

  - [ ] 20.12 Create provider application form
    - Driver form: Vehicle model, license plate, license document upload
    - Seller form: Business name, category, description
    - Runner form: Transport mode, insurance document upload
    - Show application status and admin notes
    - _Requirements: 3.1, 3.2, 4.1, 4.2_

  - [ ]* 20.13 Write component tests (Vitest + React Testing Library)
    - Test form validation and submission
    - Test real-time updates
    - Test error states
    - Test accessibility (ARIA labels, keyboard navigation)

- [ ] 21. Integrate Frontend and Backend
  - [ ] 21.1 Connect authentication flow end-to-end
    - Signup → Email validation → Cognito → Default Buyer role → Login
    - Email verification email workflow
    - Test complete signup and login flow
    - _Requirements: 1.1, 1.3, 1.4, 2.1_

  - [ ] 21.2 Connect order creation end-to-end (F&B)
    - Browse sellers → Select items → Calculate price → Payment → Escrow → Chat creation
    - Test complete order flow from browsing to chat
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 5.1, 5.2, 8.1_

  - [ ] 21.3 Connect ride booking end-to-end
    - Book ride → Find driver → Assign driver → Chat creation → Ride completion → Payment release
    - Test complete ride flow
    - _Requirements: 9.1, 9.2, 9.4, 7.1, 7.2_

  - [ ] 21.4 Connect parcel service end-to-end
    - Create parcel order → Find runner → Accept and chat → Delivery → Confirmation → Payment
    - Test complete parcel flow
    - _Requirements: 13.1, 13.3, 14.1, 14.2_

  - [ ] 21.5 Connect printing service end-to-end
    - Upload file → Create order → Provider accepts → Chat → Ready for pickup → Confirmation
    - Test complete printing flow
    - _Requirements: 15.1, 15.3, 16.1, 16.3, 16.4_

  - [ ] 21.6 Connect messaging and notifications end-to-end
    - Send message → WebSocket delivery → Notification badge → Fallback to Streams
    - Test message delivery
    - _Requirements: 8.3, 8.4, 23.1, 23.3_

  - [ ] 21.7 Connect admin workflow end-to-end
    - Submit provider application → Admin review → Approve/Reject → Notification → Role update
    - Test application approval workflow
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 21.8 Write end-to-end tests (Cypress/Playwright)
    - Test complete user journeys
    - Test error scenarios and recovery
    - Test real-time functionality

- [ ] 22. Final Testing and Deployment
  - [ ] 22.1 Perform security testing
    - Test HTTPS enforcement on all endpoints
    - Test Cognito authorization
    - Test role-based access control
    - Test data encryption at rest and in transit
    - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5_

  - [ ] 22.2 Perform load testing
    - Simulate peak load (100 concurrent users)
    - Monitor Lambda cold start times
    - Monitor DynamoDB throttling
    - Adjust capacity as needed
    - _Requirements: N/A (quality)_

  - [ ] 22.3 Perform end-to-end smoke testing
    - Test all main user flows in staging
    - Verify all integrations working
    - Check error handling and recovery
    - _Requirements: N/A (quality)_

  - [ ] 22.4 Set up monitoring and alerting
    - CloudWatch dashboards for key metrics
    - Alarms for error rates, latency, throttling
    - Log aggregation for debugging
    - _Requirements: N/A (foundational)_

  - [ ] 22.5 Prepare deployment documentation
    - Deployment runbook
    - Rollback procedures
    - Troubleshooting guide
    - Stakeholder communication plan
    - _Requirements: N/A (operational)_

  - [ ] 22.6 Deploy to production
    - Tag release version
    - Deploy to staging first
    - Monitor for 1 hour
    - Deploy to production with canary (5% → 25% → 100%)
    - Post-deployment validation
    - _Requirements: N/A (operational)_

- [ ] 23. Final Checkpoint - Platform Ready for Launch
  - Ensure all tests pass, all security checks complete, platform stable in staging, stakeholders notified of go-live.

---

## Notes

- All tasks are dependent on their prerequisites (e.g., Phase 2 requires Phase 1)
- Tasks marked with `*` are optional sub-tasks and can be skipped for MVP, but recommended for quality
- Each service module (Ride, F&B, Parcel, Printing) can be developed in parallel after Phase 3 (Payment) completes
- Cross-cutting concerns (Phase 5) depend on Phase 3 (Payment) and can start after Phase 2 (Auth)
- Frontend components (Phase 6) can start once backend APIs are available in dev environment
- Testing should be incremental - each task should include unit tests; integration tests connect tasks
- Checkpoints ensure quality gates are met before advancing to next phase

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6"] },
    { "id": 1, "tasks": ["1.7", "2.1", "2.2", "2.3", "2.4", "2.5"] },
    { "id": 2, "tasks": ["2.6", "4.1", "4.2", "4.3"] },
    { "id": 3, "tasks": ["4.4", "4.5", "4.6", "4.7"] },
    { "id": 4, "tasks": ["6.1", "6.2", "6.3", "6.4", "6.5", "7.1", "7.2", "7.3", "7.4", "8.1", "8.2", "8.3", "9.1", "9.2"] },
    { "id": 5, "tasks": ["6.6", "7.5", "7.6", "7.7", "8.4", "8.5", "9.3", "9.4", "9.5"] },
    { "id": 6, "tasks": ["11.1", "11.2", "11.3", "11.4", "11.5", "12.1", "12.2", "12.3", "13.1", "13.2", "13.3", "14.1", "14.2", "15.1", "15.2", "16.1"] },
    { "id": 7, "tasks": ["11.6", "12.4", "13.4", "13.5", "14.3", "14.4", "15.3", "15.4", "16.2", "16.3", "16.4"] },
    { "id": 8, "tasks": ["18.1", "18.2", "18.3", "18.4", "18.5", "19.1", "19.2", "19.3", "19.4"] },
    { "id": 9, "tasks": ["18.6", "19.5", "20.1", "20.2", "20.3", "20.4", "20.5", "20.6", "20.7", "20.8", "20.9", "20.10", "20.11", "20.12"] },
    { "id": 10, "tasks": ["20.13", "21.1", "21.2", "21.3", "21.4", "21.5", "21.6", "21.7"] },
    { "id": 11, "tasks": ["21.8", "22.1", "22.2", "22.3", "22.4", "22.5", "22.6"] }
  ]
}
```
