import { VendorCartGroup } from './cart';

export type OrderStatus = 'PLACED' | 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type FulfillmentStatus = 'PENDING' | 'UNFULFILLED' | 'PROCESSING' | 'SHIPPED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
export type AddressType = 'SHIPPING' | 'BILLING';
export type QuoteStatus = 'PENDING' | 'OFFERED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface CheckoutAddress {
  id?: string;
  addressType: AddressType;
  fullName: string;
  companyName?: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  gstNumber?: string;
}

export interface InitiateCheckoutPayload {
  guestSessionId?: string;
  shippingAddress: CheckoutAddress;
  billingAddress?: CheckoutAddress;
  paymentMethod: string;
  customerGstNumber?: string;
  couponCode?: string;
  notes?: string;
}

export interface CheckoutSummary {
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  totalItems: number;
  reservationToken?: string;
  reservationExpiresAt?: string;
  vendorGroups: VendorCartGroup[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  vendorOrderId?: string;
  vendorId?: string;
  productId: string;
  variantId: string;
  productTitle: string;
  variantSku: string;
  variantName: string;
  primaryImageUrl?: string;
  hsnCode?: string;
  quantity: number;
  unitPrice: number;
  regularPrice: number;
  discountAmount: number;
  subtotalAmount: number;
  taxRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
  totalAmount: number;
}

export interface VendorOrder {
  id: string;
  orderId: string;
  orderNumber: string;
  vendorId: string;
  vendorStoreName: string;
  vendorGstNumber?: string;
  vendorState?: string;
  subOrderNumber: string;
  fulfillmentStatus: FulfillmentStatus;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  commissionRate: number;
  commissionAmount: number;
  vendorPayoutAmount: number;
  courierPartner?: string;
  trackingNumber?: string;
  shippedAt?: string;
  deliveredAt?: string;
  notes?: string;
  grandTotal?: number;
  customerName?: string;
  customerPhone?: string;
  masterOrder?: Order;
  createdAt: string;
  items: OrderItem[];
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  customerEmail: string;
  customerPhone: string;
  customerName: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  paymentTransactionId?: string;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  currency: string;
  customerGstNumber?: string;
  stockReservationId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  shippingAddress?: CheckoutAddress;
  billingAddress?: CheckoutAddress;
  vendorOrders: VendorOrder[];
  items: OrderItem[];
}

export interface UpdateFulfillmentPayload {
  fulfillmentStatus: FulfillmentStatus;
  courierPartner?: string;
  trackingNumber?: string;
  notes?: string;
}

export interface QuoteItem {
  id: string;
  quoteRequestId: string;
  variantId: string;
  productId: string;
  productTitle: string;
  variantSku: string;
  variantName: string;
  primaryImageUrl?: string;
  requestedQuantity: number;
  targetUnitPrice?: number;
  offeredUnitPrice?: number;
  regularPrice?: number;
  totalOfferedAmount?: number;
  buyerNotes?: string;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  vendorId: string;
  vendorStoreName: string;
  status: QuoteStatus;
  totalTargetAmount: number;
  totalOfferedAmount?: number;
  offeredShippingAmount?: number;
  grandOfferedTotal?: number;
  buyerNotes?: string;
  sellerNotes?: string;
  requestedDeliveryDate?: string;
  validUntil?: string;
  convertedOrderId?: string;
  createdAt: string;
  updatedAt: string;
  items: QuoteItem[];
}

export interface CreateQuotePayload {
  vendorId: string;
  notes?: string;
  requestedDeliveryDate?: string;
  items: {
    variantId: string;
    requestedQuantity: number;
    targetUnitPrice?: number;
    buyerNotes?: string;
  }[];
}

export interface QuoteOfferPayload {
  items: {
    quoteItemId: string;
    offeredUnitPrice: number;
  }[];
  offeredShippingAmount?: number;
  sellerNotes?: string;
  validUntil: string;
}
