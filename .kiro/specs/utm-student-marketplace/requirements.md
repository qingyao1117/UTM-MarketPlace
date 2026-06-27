# UTM Student Marketplace - Requirements Document

## Introduction

The UTM Student Marketplace is a multi-service platform designed for University Teknologi Malaysia (UTM) students, providing integrated access to ride-hailing, food delivery, parcel/document services, and printing services. The platform prioritizes security, escrow-based payments, and built-in communication to protect user privacy and ensure secure transactions. All services are accessible through a unified interface built with Next.js frontend and AWS Serverless backend infrastructure.

## Glossary

- **Buyer**: A user who requests services (rides, food delivery, parcel delivery, or printing)
- **Provider**: A general term for Seller, Runner, or Driver who offers services
- **Seller**: A user who offers food items on the F&B service
- **Runner**: A user who offers parcel and document delivery services
- **Driver**: A user who offers ride-hailing services
- **Admin**: A user with approval authority for Provider role applications
- **Escrow**: Fund holding mechanism where payment is retained until service completion
- **Provider Application**: A formal submission to become a Seller, Runner, or Driver
- **Order**: A F&B or Parcel service request
- **Ride**: A ride-hailing service booking
- **Chat Channel**: A real-time messaging interface between Buyer and Provider
- **Service Module**: A distinct service category (Ride-Hailing, F&B, Parcel, Printing)
- **Pre-order Cut-off**: A time deadline after which no new food orders are accepted for a specific time period
- **Availability Status**: Online/Offline state of a Driver or Seller
- **Payment Gateway**: Third-party service handling payment processing and escrow management

## Requirements

### Requirement 1: User Authentication with Email Verification

**User Story:** As a student, I want to create an account using my UTM email, so that I can access the marketplace with my university credentials.

#### Acceptance Criteria

1. WHEN a user attempts to sign up, THE Authentication_System SHALL validate that the email ends with @graduate.utm.my or @utm.my
2. IF the user provides an email not ending with @graduate.utm.my or @utm.my, THEN THE Authentication_System SHALL reject the signup with a clear error message
3. WHEN a user completes signup successfully, THE Authentication_System SHALL use Amazon Cognito to manage the authentication
4. WHEN a user logs in, THE Authentication_System SHALL verify credentials against Amazon Cognito and grant access upon successful verification

---

### Requirement 2: Default Role Assignment

**User Story:** As a new user, I want to automatically have buyer access when I create my account, so that I can immediately browse and order services.

#### Acceptance Criteria

1. WHEN a user completes the signup process, THE Authorization_System SHALL assign the "Buyer" role by default
2. THE Authorization_System SHALL allow Buyers to browse, search, and place orders or book rides immediately after signup
3. THE Authorization_System SHALL prevent Buyers from listing items, accepting orders, or offering rides unless they switch to a Provider role

---

### Requirement 3: Provider Role Application and Approval

**User Story:** As a student, I want to apply to become a Seller, Runner, or Driver, so that I can offer services on the marketplace.

#### Acceptance Criteria

1. WHEN a Buyer requests to become a Provider (Seller, Runner, or Driver), THE Application_System SHALL present a role-specific application form
2. THE Application_System SHALL store the submitted application with a "Pending" status
3. WHEN an application is submitted, THE Application_System SHALL notify Admin users of the pending application
4. WHEN an Admin approves an application, THE Authorization_System SHALL update the user's role to the requested Provider type
5. WHEN an Admin rejects an application, THE Application_System SHALL notify the user with a rejection reason
6. WHILE an application is in "Pending" status, THE Authorization_System SHALL not grant the requested Provider role to the user

---

### Requirement 4: Driver Application with License Verification

**User Story:** As a student driver, I want to submit my vehicle and license information to become a driver, so that I can offer rides on the platform.

#### Acceptance Criteria

1. WHEN a user applies to become a Driver, THE Driver_Application_Form SHALL require submission of: Vehicle Model, License Plate Number, and Driver's License document upload
2. WHEN the user uploads a Driver's License document, THE File_Storage_System SHALL store it in Amazon S3 with a unique identifier
3. WHEN a Driver's License document is uploaded to S3, THE File_Storage_System SHALL return a secure reference URL to the application
4. WHEN an Admin reviews a Driver application, THE Application_System SHALL display the Vehicle Model, License Plate Number, and a retrievable link to the Driver's License document
5. IF the Admin identifies missing or invalid information, THEN THE Application_System SHALL mark the application as "Needs Revision" and request resubmission

---

### Requirement 5: Escrow Payment Initialization

**User Story:** As a buyer, I want my payment to be held securely when I place an order, so that funds are protected until the service is completed.

#### Acceptance Criteria

1. WHEN a Buyer places an Order or books a Ride, THE Payment_System SHALL initiate an escrow transaction via the payment gateway
2. WHEN the escrow is initiated, THE Payment_System SHALL charge the Buyer's payment method with the full service amount
3. WHEN the payment is processed successfully, THE Payment_System SHALL store the transaction with status "In_Escrow"
4. IF the payment fails, THEN THE Payment_System SHALL prevent Order or Ride creation and display a payment error to the Buyer
5. WHILE funds are in escrow, THE Payment_System SHALL prevent the Buyer from double-charging for the same service

---

### Requirement 6: Escrow Release for Food and Parcel Services

**User Story:** As a buyer, I want to confirm receipt of my food or parcel, triggering payment to the seller or runner, so that providers are paid fairly upon delivery.

#### Acceptance Criteria

1. WHEN a Buyer receives their F&B or Parcel Order, THE Payment_System SHALL display an "Order Received" button in the Order details interface
2. WHEN a Buyer clicks "Order Received", THE Payment_System SHALL release the escrowed funds to the Provider's account
3. WHEN funds are released, THE Payment_System SHALL update the Order status to "Completed" and the transaction status to "Released"
4. IF the Buyer does not click "Order Received" within 7 days, THE Payment_System SHALL automatically release funds to the Provider
5. WHILE an Order is awaiting "Order Received" confirmation, THE Payment_System SHALL display the status as "Awaiting Confirmation" to both Buyer and Provider

---

### Requirement 7: Escrow Release for Ride-Hailing Services

**User Story:** As a passenger, I want to confirm that my ride is complete before payment is released, so that drivers are paid only after service delivery.

#### Acceptance Criteria

1. WHEN a Ride is completed at the drop-off location, THE Payment_System SHALL display a "Ride Completed" button in the Ride details interface
2. WHEN a Buyer clicks "Ride Completed", THE Payment_System SHALL release the escrowed ride fare to the Driver's account
3. WHEN funds are released, THE Payment_System SHALL update the Ride status to "Completed" and the transaction status to "Released"
4. IF the Buyer does not click "Ride Completed" within 24 hours after the Ride's estimated completion time, THE Payment_System SHALL automatically release funds to the Driver
5. WHILE a Ride is awaiting "Ride Completed" confirmation, THE Payment_System SHALL display the status as "Awaiting Confirmation" to both Buyer and Driver

---

### Requirement 8: Real-Time Messaging Between Buyer and Provider

**User Story:** As a buyer, I want to communicate directly with the provider through the app, so that I don't need to share personal phone numbers.

#### Acceptance Criteria

1. WHEN an Order or Ride is accepted by a Provider, THE Messaging_System SHALL automatically create a Chat_Channel between the Buyer and Provider
2. WHEN a Chat_Channel is created, THE Messaging_System SHALL store it with references to both the Buyer and Provider user IDs
3. WHEN a Buyer or Provider sends a message, THE Messaging_System SHALL deliver the message to the other party in real-time using WebSockets
4. IF WebSocket connection is unavailable, THE Messaging_System SHALL use DynamoDB Streams as a fallback delivery mechanism
5. WHILE a Chat_Channel exists, THE Messaging_System SHALL prevent either party from seeing the other's personal phone number
6. WHEN a Chat_Channel is active, THE Messaging_System SHALL display the Chat_Channel interface within the Order or Ride details view

---

### Requirement 9: Ride-Hailing Service - Buyer Ride Booking

**User Story:** As a student, I want to book a ride by specifying pickup and drop-off locations and passenger count, so that I can request transportation around campus and the city.

#### Acceptance Criteria

1. WHEN a Buyer accesses the Ride-Hailing module, THE Ride_System SHALL display a form with fields for: Pickup Location, Drop-off Location, and Passenger Count
2. WHEN a Buyer selects "Book Now", THE Ride_System SHALL search for available Drivers with "Online" status
3. WHEN a Buyer selects "Schedule for Later", THE Ride_System SHALL allow the Buyer to specify a future date and time for the ride
4. WHEN a Ride is successfully booked, THE Ride_System SHALL assign an available Driver and create an active Chat_Channel between them
5. IF no Drivers are available, THEN THE Ride_System SHALL inform the Buyer and allow them to retry or schedule for a later time

---

### Requirement 10: Ride-Hailing Service - Driver Availability Management

**User Story:** As a driver, I want to toggle my online/offline status, so that I control when I receive ride requests.

#### Acceptance Criteria

1. WHEN a Driver accesses the Driver Dashboard, THE Driver_Status_System SHALL display an Online/Offline toggle switch
2. WHEN a Driver toggles to "Online", THE Driver_Status_System SHALL update their status to "Online" and make them available to receive Ride requests
3. WHEN a Driver toggles to "Offline", THE Driver_Status_System SHALL update their status to "Offline" and prevent new Ride requests from being assigned to them
4. WHILE a Driver is "Online", THE Driver_Status_System SHALL ensure they appear in the available Drivers list when a Buyer books a ride
5. WHEN a Driver logs out, THE Driver_Status_System SHALL automatically set their status to "Offline"

---

### Requirement 11: Food & Beverage Service - Seller Menu Management

**User Story:** As a food seller, I want to list my menu items with stock limits and pre-order cut-off times, so that I can manage inventory and order timing efficiently.

#### Acceptance Criteria

1. WHEN a Seller accesses the F&B Menu Management interface, THE Menu_System SHALL allow creation of menu items with: Item Name, Description, Price, and Stock Quantity
2. WHEN a Seller creates a menu item, THE Menu_System SHALL require specification of: Stock Quantity (maximum number available) and Pre-order Cut-off Time (time before which orders must be placed)
3. WHEN a Buyer places an Order for a F&B item, THE Menu_System SHALL decrement the Stock Quantity by the ordered amount
4. IF an Order is placed after the Pre-order Cut-off Time, THEN THE Menu_System SHALL reject the order with a clear message indicating the cut-off time
5. WHEN Stock Quantity reaches zero, THE Menu_System SHALL mark the item as "Out of Stock" and prevent further orders for that item
6. WHEN a Seller updates Stock Quantity or Pre-order Cut-off Time, THE Menu_System SHALL reflect changes immediately for new incoming orders

---

### Requirement 12: Food & Beverage Service - Menu Browsing and Ordering

**User Story:** As a buyer, I want to browse available food items from sellers, so that I can place food delivery orders.

#### Acceptance Criteria

1. WHEN a Buyer accesses the F&B module, THE Browse_System SHALL display all active Sellers and their available menu items
2. WHEN a Buyer views a menu item, THE Browse_System SHALL display: Item Name, Description, Price, Stock Availability, and Pre-order Cut-off Time
3. WHEN a Buyer places an Order, THE Order_System SHALL create an Order record with: Buyer ID, Seller ID, Items, Total Price, and Order Status "Pending"
4. WHEN an Order is created, THE Order_System SHALL automatically initiate escrow payment and create a Chat_Channel with the Seller
5. WHEN a Seller accepts an Order, THE Order_System SHALL update the Order status to "Accepted"

---

### Requirement 13: Parcel and Document Service - Buyer Collection and Drop-off Specification

**User Story:** As a student, I want to specify pickup and drop-off locations for parcel delivery, so that runners can collect from my specified point and deliver to my residential college.

#### Acceptance Criteria

1. WHEN a Buyer accesses the Parcel Service module, THE Parcel_System SHALL display a form with fields for: Collection Point (pickup location) and Residential College (drop-off location)
2. WHEN specifying a Collection Point, THE Parcel_System SHALL allow selection from predefined UTM locations (e.g., library, academic buildings, student halls)
3. WHEN specifying a Residential College, THE Parcel_System SHALL provide a dropdown with all UTM residential colleges
4. WHEN a Buyer submits the Parcel request with Collection Point and Residential College, THE Parcel_System SHALL create a Parcel Order with these details
5. WHEN a Parcel Order is created, THE Parcel_System SHALL automatically initiate escrow payment and create a Chat_Channel with an available Runner

---

### Requirement 14: Parcel and Document Service - Runner Availability

**User Story:** As a runner, I want to view available parcel orders and accept them, so that I can deliver parcels and earn income.

#### Acceptance Criteria

1. WHEN a Runner accesses the Runner Dashboard, THE Runner_Status_System SHALL display a list of available Parcel Orders sorted by Collection Point and creation time
2. WHEN a Runner accepts a Parcel Order, THE Parcel_System SHALL assign the Runner to that Order and create a Chat_Channel with the Buyer
3. WHEN a Runner's status is "Online", THE Runner_Status_System SHALL display them as available to receive new Parcel Orders
4. WHEN a Runner's status is "Offline", THE Runner_Status_System SHALL prevent assignment of new Parcel Orders to them
5. WHILE a Runner has accepted Orders, THE Runner_Dashboard SHALL display their current status, assigned Orders, and estimated completion time

---

### Requirement 15: Printing Service - File Upload and Format Specification

**User Story:** As a student, I want to upload documents for printing with color/B&W and double-sided options, so that I can get prints without leaving the app.

#### Acceptance Criteria

1. WHEN a Buyer accesses the Printing Service module, THE Printing_System SHALL display a file upload interface with fields for: File Upload, Color Mode, and Double-sided Option
2. WHEN a Buyer uploads a file, THE File_Storage_System SHALL store the file in Amazon S3 with encryption and a unique identifier
3. WHEN a file is successfully uploaded to S3, THE Printing_System SHALL display the filename and file status as "Uploaded"
4. WHEN a Buyer selects Color Mode, THE Printing_System SHALL provide options: "Color" or "Black & White"
5. WHEN a Buyer selects Double-sided Option, THE Printing_System SHALL provide options: "Double-sided" or "Single-sided"
6. WHEN a Buyer submits the Printing order with file, color mode, and double-sided option, THE Printing_System SHALL create a Printing Order with these specifications
7. IF the file size exceeds 50MB, THEN THE Printing_System SHALL reject the upload and request a smaller file
8. IF the file format is not supported (supported: PDF, DOC, DOCX, JPG, PNG), THEN THE Printing_System SHALL reject the upload and display supported formats

---

### Requirement 16: Printing Service - Order Processing

**User Story:** As a printing service provider, I want to receive and process printing orders, so that I can fulfill student printing requests.

#### Acceptance Criteria

1. WHEN a Printing Order is submitted by a Buyer, THE Printing_System SHALL create a Printing Order record with: File Reference, Color Mode, Double-sided Option, and Order Status "Pending"
2. WHEN a Printing Order is created, THE Printing_System SHALL automatically initiate escrow payment
3. WHEN a Printing Provider accepts a Printing Order, THE Printing_System SHALL update Order Status to "Accepted" and create a Chat_Channel with the Buyer
4. WHEN a Printing Provider completes the printing, THE Printing_System SHALL update Order Status to "Ready for Pickup"
5. WHEN a Buyer picks up their printed documents, THE Buyer SHALL click "Order Received" to trigger escrow release

---

### Requirement 17: Order Status Tracking for All Services

**User Story:** As a user, I want to track the status of my orders or rides in real-time, so that I know where my request stands.

#### Acceptance Criteria

1. WHEN a Buyer or Provider views an Order or Ride, THE Tracking_System SHALL display the current status: "Pending", "Accepted", "In Progress", "Awaiting Confirmation", "Completed", or "Cancelled"
2. WHEN an Order or Ride status changes, THE Tracking_System SHALL update the status display in real-time for both Buyer and Provider
3. WHEN a status update occurs, THE Notification_System SHALL notify the relevant user(s) via in-app notification
4. WHEN a Buyer accesses their Order or Ride history, THE Tracking_System SHALL display all past and current Orders or Rides with their final status

---

### Requirement 18: User Profile and Verification

**User Story:** As a user, I want to maintain a profile with my information and see my verification status, so that other users can trust my identity.

#### Acceptance Criteria

1. WHEN a user accesses their Profile, THE Profile_System SHALL display: Email, Full Name, Profile Picture (optional), User Type (Buyer/Seller/Runner/Driver), and Verification Status
2. WHEN a user uploads a Profile Picture, THE File_Storage_System SHALL store it in Amazon S3
3. FOR Drivers, THE Profile_System SHALL display: Vehicle Model, License Plate Number, and verification status of submitted documents
4. FOR Sellers, THE Profile_System SHALL display: Business Name, Business Category, and Verification Status
5. WHEN an Admin approves a Provider application, THE Profile_System SHALL update the verification status to "Verified" and display a verification badge

---

### Requirement 19: Rating and Review System

**User Story:** As a buyer, I want to rate and review providers after service completion, so that other users can make informed decisions.

#### Acceptance Criteria

1. WHEN a service is marked as "Completed" by the Buyer, THE Review_System SHALL prompt the Buyer to leave a rating (1-5 stars) and optional text review
2. WHEN a Buyer submits a rating, THE Review_System SHALL store the rating with the associated Order or Ride
3. WHEN a Provider's profile is viewed, THE Review_System SHALL display the average rating and count of reviews
4. WHEN a Buyer searches or browses providers, THE Browse_System SHALL display the Provider's average rating to help with selection
5. WHILE a review is submitted, THE Review_System SHALL prevent duplicate reviews for the same Order or Ride

---

### Requirement 20: Error Handling and Transaction Rollback

**User Story:** As a platform operator, I want failed transactions to be rolled back safely, so that no funds are lost or stuck in escrow.

#### Acceptance Criteria

1. IF an escrow payment fails during Order or Ride creation, THEN THE Payment_System SHALL cancel the transaction and return any temporarily charged amount to the Buyer
2. IF a Provider declines or cancels an accepted Order or Ride, THEN THE Payment_System SHALL release escrowed funds back to the Buyer within 24 hours
3. IF a Buyer cancels an Order or Ride before the Provider accepts, THEN THE Payment_System SHALL immediately release escrowed funds back to the Buyer
4. WHEN a transaction error occurs, THE Error_Handling_System SHALL log the error with transaction details and notify Admin users
5. IF the Chat_Channel fails to create after an Order or Ride is accepted, THEN THE Order_System SHALL mark the transaction as "Error" and trigger manual Admin review

---

### Requirement 21: Admin Dashboard and Moderation

**User Story:** As an admin, I want to view and manage user applications, transactions, and reports, so that I can ensure platform safety and integrity.

#### Acceptance Criteria

1. WHEN an Admin accesses the Admin Dashboard, THE Admin_System SHALL display: Pending Applications, Flagged Orders, User Reports, and Transaction Overview
2. WHEN an Admin reviews a Provider application, THE Admin_System SHALL display all submitted information and allow Approval, Rejection, or Request for Revision
3. WHEN an Admin receives a user report or complaint, THE Admin_System SHALL mark it as "Under Review" and allow the Admin to investigate associated transactions
4. WHEN an Admin identifies fraudulent activity, THE Admin_System SHALL allow account suspension or deletion with appropriate audit logging
5. WHEN an Admin approves or rejects an application, THE Notification_System SHALL automatically notify the user of the decision

---

### Requirement 22: Data Security and Privacy

**User Story:** As a user, I want my personal data and transactions to be secure and private, so that I can use the platform with confidence.

#### Acceptance Criteria

1. WHEN user data is stored, THE Security_System SHALL encrypt sensitive data (passwords, payment info) at rest in DynamoDB
2. WHEN data is transmitted between client and server, THE Security_System SHALL use HTTPS with TLS 1.2 or higher
3. WHEN a user accesses their profile, THE Authorization_System SHALL ensure only that user or Admins can view their complete information
4. WHEN chat messages are stored, THE Security_System SHALL encrypt messages in transit and at rest
5. WHEN a Provider's phone number is accessed during chat, THE Security_System SHALL never display it to the other party
6. WHEN user data is deleted (account closure), THE Data_Management_System SHALL securely delete or archive all personal data within 30 days

---

### Requirement 23: Notification System

**User Story:** As a user, I want to receive timely notifications about my orders and rides, so that I don't miss important updates.

#### Acceptance Criteria

1. WHEN an Order or Ride status changes, THE Notification_System SHALL send in-app notification to the affected Buyer or Provider
2. WHEN an escrow release occurs, THE Notification_System SHALL notify the Provider that funds have been credited to their account
3. WHEN a Chat_Channel receives a new message, THE Notification_System SHALL notify the recipient with a badge on the Chat icon
4. WHEN a Provider application is reviewed, THE Notification_System SHALL send in-app notification with the approval or rejection decision
5. WHILE a user is actively viewing a notification, THE Notification_System SHALL prevent duplicate notifications for the same event

