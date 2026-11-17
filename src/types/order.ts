export type OrderStatus =
  | 'Verification Pending'
  | 'Awaiting Customer Response'
  | 'Address Correction Required'
  | 'Ready to Dispatch'
  | 'Dispatched'
  | 'Delivered'
  | 'RTO'
  | 'Cancelled';

export type PaymentType = 'COD' | 'Prepaid';

export type AttentionLevel = 'Low' | 'Medium' | 'High';

export type FieldCheckStatus = 'Complete' | 'Missing' | 'Needs Attention';

export type RecommendedAction =
  | 'Ready to Ship'
  | 'Confirm Order Through WhatsApp'
  | 'Request Address Correction'
  | 'Hold Until Details Are Updated';

export type AppPage =
  | 'dashboard'
  | 'orders'
  | 'add-order'
  | 'order-details'
  | 'verification-queue'
  | 'reports'
  | 'settings';

export interface VerificationLogEntry {
  id: string;
  timestamp: string;
  action: string;
  note?: string;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  houseFlat: string;
  streetArea: string;
  locality: string;
  landmark?: string;
  city: string;
  state: string;
  pinCode: string;
  productName: string;
  orderValue: number;
  paymentType: PaymentType;
  orderDate: string; // YYYY-MM-DD
  status: OrderStatus;
  isFirstTimeCustomer: boolean;
  customerConfirmed: boolean;
  recordedShippingLoss?: number; // Recorded actual shipping cost on RTO orders
  salesChannel?: 'Instagram' | 'WhatsApp' | 'Website' | 'Direct';
  logs: VerificationLogEntry[];
}

export interface AddressFieldAssessment {
  key: 'houseFlat' | 'streetArea' | 'locality' | 'city' | 'state' | 'pinCode';
  label: string;
  value: string;
  status: FieldCheckStatus;
  note: string;
}

export interface ScoreFactor {
  id: string;
  label: string;
  points: number;
  explanation: string;
}

export interface AttentionAssessment {
  score: number;
  level: AttentionLevel;
  factors: ScoreFactor[];
  summary: string;
}

export interface PhoneValidationResult {
  isValid: boolean;
  normalizedDigits: string;
  message: string;
}

export interface PinValidationResult {
  isValid: boolean;
  message: string;
}

export interface SellerProfile {
  sellerName: string;
  role: string;
  businessName: string;
  businessCategory: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  gstin?: string;
  defaultWhatsAppTemplate: string;
  highValueThreshold: number;
  defaultRtoShippingLoss: number;
}

export interface AppNotification {
  id: string;
  orderId: string;
  title: string;
  description: string;
  read: boolean;
}
