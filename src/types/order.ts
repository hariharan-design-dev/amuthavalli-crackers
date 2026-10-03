/**
 * Order and Guest Checkout Types for Amuthavalli Crackers
 * Phase: Phase 6B — API / Data Layer Implementation
 * Reference: docs/phase-6-api-data-layer-architecture.md
 */

export type OrderStatus =
  | 'New'
  | 'Confirmed'
  | 'Processing'
  | 'Completed'
  | 'Cancelled';

export type SafeOrderCustomer = {
  name: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
};

export type SafeOrderItem = {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type SafeOrder = {
  id: string;
  orderNumber: string;
  invoiceToken?: string;
  createdAt: string;
  status: OrderStatus;
  customer: SafeOrderCustomer;
  items: SafeOrderItem[];
  totalQuantity: number;
  totalAmount: number;
  notes?: string | null;
};

export type SafeBusinessSettings = {
  whatsappNumber: string;
  reachUsNumber?: string;
  gpayUpiNumbers: string[];
  gpayQrCodeUrl: string | null;
  businessName?: string;
  businessMobile?: string;
  businessAddress?: string;
};

export type SafeOrderResult = {
  success: true;
  order: SafeOrder;
  business: SafeBusinessSettings;
};

export type OrderActionErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_ITEMS'
  | 'PRODUCT_NOT_FOUND'
  | 'PRODUCT_UNAVAILABLE'
  | 'MIN_ORDER_NOT_MET'
  | 'ORDER_FAILED';

export type OrderActionError = {
  success: false;
  code: OrderActionErrorCode;
  message: string;
  details?: Record<string, string[]>;
};

export type OrderActionResult = SafeOrderResult | OrderActionError;
