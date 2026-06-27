/**
 * Common type definitions for the UTM Student Marketplace
 */

// User types
export type UserRole = "Buyer" | "Seller" | "Driver" | "Runner" | "Admin";

export interface User {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole[];
  createdAt: string;
  updatedAt: string;
  profilePicture?: string;
  phoneNumber?: string; // ENCRYPTED
  accountStatus: "Active" | "Suspended" | "Closed";
  verificationStatus: "Unverified" | "Verified" | "Rejected";
  emailVerified: boolean;
  averageRating?: number;
  totalReviews?: number;
  totalOrders?: number;
}

// Ride types
export type RideStatus =
  | "Pending"
  | "Accepted"
  | "InProgress"
  | "CompletionConfirmed"
  | "Completed"
  | "Cancelled";

export interface Location {
  name: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  address: string;
}

export interface Ride {
  rideId: string;
  buyerId: string;
  driverId?: string;
  pickupLocation: Location;
  dropoffLocation: Location;
  passengerCount: number;
  status: RideStatus;
  estimatedFare: number;
  finalFare?: number;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  chatChannelId?: string;
  createdAt: string;
  bookingTime: string;
  scheduledTime?: string;
  rating?: number;
  review?: string;
}

// Order types
export type ServiceType = "FoodDelivery" | "ParcelDelivery" | "PrintingOrder";
export type OrderStatus =
  | "Pending"
  | "Accepted"
  | "InProgress"
  | "ReadyForPickup"
  | "AwaitingConfirmation"
  | "Completed"
  | "Cancelled";

export interface MenuItem {
  itemId: string;
  sellerId: string;
  itemName: string;
  description: string;
  price: number;
  maxStock: number;
  currentStock: number;
  stockStatus: "Available" | "LowStock" | "OutOfStock";
  preorderCutoffTime: string;
  category: string;
  tags: string[];
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  orderId: string;
  serviceType: ServiceType;
  buyerId: string;
  providerId?: string;
  items?: OrderItem[]; // For F&B
  collectionPoint?: string; // For Parcel
  residentialCollege?: string; // For Parcel
  status: OrderStatus;
  subtotal: number;
  deliveryFee?: number;
  tax?: number;
  totalPrice: number;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  chatChannelId?: string;
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
  rating?: number;
  review?: string;
}

// Payment types
export type PaymentStatus =
  | "Pending"
  | "InEscrow"
  | "AwaitingConfirmation"
  | "Released"
  | "Refunded"
  | "Failed"
  | "Disputed";

export type PaymentMethod = "CreditCard" | "DebitCard" | "DigitalWallet";
export type PaymentGateway = "Stripe" | "PayPal" | "2Checkout";

export interface Transaction {
  transactionId: string;
  buyerId: string;
  payeeId: string;
  transactionType: ServiceType;
  associatedId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentGateway: PaymentGateway;
  paymentGatewayRef?: string;
  status: PaymentStatus;
  chargedAt?: string;
  escrowStartTime?: string;
  escrowReleaseTime?: string;
  releasedAt?: string;
  refundAmount?: number;
  refundReason?: string;
  autoReleaseEnabled: boolean;
  autoReleaseDelay?: "24hours" | "7days";
  isDisputed: boolean;
  createdAt: string;
  updatedAt: string;
}

// Message types
export interface Message {
  chatChannelId: string;
  messageId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  messageText: string;
  messageType: "text" | "system";
  deliveryStatus: "Sent" | "Delivered" | "Read";
  deliveredAt?: string;
  readAt?: string;
  createdAt: string;
  isEncrypted: boolean;
}

export interface ChatChannel {
  chatChannelId: string;
  buyerId: string;
  providerId: string;
  providerRole: UserRole;
  transactionType: ServiceType;
  transactionId: string;
  status: "Active" | "Archived" | "Closed";
  messageCount: number;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  buyerUnread: number;
  providerUnread: number;
  createdAt: string;
  closedAt?: string;
}

// Application types
export type RoleType = "Driver" | "Seller" | "Runner";
export type ApplicationStatus = "Pending" | "Approved" | "Rejected" | "NeedsRevision";

export interface DriverApplication {
  vehicleModel: string;
  licensePlate: string;
  licenseDocumentId: string;
  licenseExpiryDate?: string;
}

export interface SellerApplication {
  businessName: string;
  businessCategory: string;
  businessDescription: string;
  businessRegistration?: string;
}

export interface RunnerApplication {
  transportMode: "Bicycle" | "Motorcycle" | "Car";
  insuranceDocument?: string;
  insuranceExpiryDate?: string;
}

export type RoleSpecificData = DriverApplication | SellerApplication | RunnerApplication;

export interface Application {
  applicationId: string;
  userId: string;
  roleType: RoleType;
  status: ApplicationStatus;
  submittedData: RoleSpecificData;
  adminNotes?: string;
  revisionRequestReason?: string;
  documentVerificationStatus?: "Pending" | "Verified" | "Rejected";
  backgroundCheckStatus?: "NotStarted" | "Passed" | "Failed";
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Notification types
export type NotificationType =
  | "OrderStatusChanged"
  | "RideStatusChanged"
  | "ApplicationReviewed"
  | "PaymentReleased"
  | "MessageReceived";

export interface Notification {
  notificationId: string;
  userId: string;
  notificationType: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  status: "Unread" | "Read";
  createdAt: string;
  readAt?: string;
}

// Printing order types
export type PrintingOrderStatus =
  | "Pending"
  | "Accepted"
  | "Printing"
  | "ReadyForPickup"
  | "Completed"
  | "Cancelled";

export interface PrintingOrder {
  printingOrderId: string;
  buyerId: string;
  providerId?: string;
  fileDocumentId: string;
  fileName: string;
  fileSize: number;
  fileFormat: string;
  colorMode: "BlackAndWhite" | "Color";
  doubleSided: boolean;
  pageCount: number;
  status: PrintingOrderStatus;
  totalPrice: number;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  chatChannelId?: string;
  pickupLocation?: string;
  pickupDeadline?: string;
  pickedUpAt?: string;
  createdAt: string;
  uploadedAt: string;
  rating?: number;
  review?: string;
}

// API Response types
export interface APIResponse<T> {
  statusCode: number;
  body: T;
  headers?: Record<string, string>;
}

export interface ErrorResponse {
  error: string;
  message: string;
  timestamp: string;
  correlationId?: string;
}

// Pagination types
export interface PaginationParams {
  limit?: number;
  offset?: number;
  nextToken?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  count: number;
  total?: number;
  nextToken?: string;
}
