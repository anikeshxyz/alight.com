export type RmaStatus =
  | "REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "PICKUP_SCHEDULED"
  | "IN_REVERSE_TRANSIT"
  | "RECEIVED_AT_WAREHOUSE"
  | "INSPECTED_PASS"
  | "INSPECTED_FAIL"
  | "REFUND_PROCESSED"
  | "REPLACEMENT_DISPATCHED"
  | "CANCELLED"
  | "CLOSED";

export type ReturnType = "REFUND" | "REPLACEMENT" | "STORE_CREDIT";

export type ReturnReason =
  | "DEFECTIVE"
  | "DAMAGED_IN_TRANSIT"
  | "WRONG_ITEM_SENT"
  | "SIZE_FIT_ISSUE"
  | "NOT_AS_DESCRIBED"
  | "CHANGED_MIND"
  | "OTHER";

export type ItemCondition =
  | "UNOPENED"
  | "OPENED_UNUSED"
  | "DAMAGED_USER"
  | "DEFECTIVE_FACTORY"
  | "SCRAP";

export type RestockAction =
  | "RESTOCK_AVAILABLE"
  | "RESTOCK_DAMAGED"
  | "DISCARD_SCRAP"
  | "NONE";

export type ActorType = "CUSTOMER" | "VENDOR" | "ADMIN" | "SYSTEM";

export interface RmaItem {
  id: string;
  orderItemId: string;
  productId: string;
  productTitle: string;
  sku: string;
  imageUrl?: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  refundAmount: number;
  conditionOnReturn?: ItemCondition;
  restockAction?: RestockAction;
  warehouseId?: string;
  warehouseName?: string;
  inspectedBy?: string;
  inspectionNotes?: string;
  inspectedAt?: string;
}

export interface RmaEvent {
  id: string;
  status: RmaStatus;
  actorType: ActorType;
  actorId?: string;
  title: string;
  description?: string;
  createdAt: string;
}

export interface RmaRequest {
  id: string;
  rmaNumber: string;
  orderId: string;
  orderNumber: string;
  vendorOrderId: string;
  subOrderNumber: string;
  userId: string;
  customerEmail: string;
  customerName: string;
  vendorId: string;
  vendorStoreName: string;
  status: RmaStatus;
  returnType: ReturnType;
  reason: ReturnReason;
  customerComments?: string;
  proofImages?: string;
  vendorNotes?: string;
  adminNotes?: string;
  refundAmount: number;
  restockFee: number;
  netRefundAmount: number;
  reverseAwbNumber?: string;
  reverseCarrierCode?: string;
  pickupScheduledDate?: string;
  receivedAt?: string;
  completedAt?: string;
  items: RmaItem[];
  events: RmaEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRmaItemInput {
  orderItemId: string;
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface CreateRmaRequest {
  orderId: string;
  vendorOrderId: string;
  returnType: ReturnType;
  reason: ReturnReason;
  customerComments?: string;
  proofImages?: string;
  items: CreateRmaItemInput[];
}

export interface RmaReviewRequest {
  approved: boolean;
  reviewNotes?: string;
}

export interface RmaSchedulePickupRequest {
  carrierCode: string;
  pickupAddress?: string;
  scheduledDate?: string;
  notes?: string;
}

export interface RmaInspectionItemInput {
  rmaItemId: string;
  condition: ItemCondition;
  restockAction: RestockAction;
  warehouseId?: string;
  notes?: string;
}

export interface RmaInspectionRequest {
  inspectionPassed: boolean;
  inspectionNotes?: string;
  customRefundAmount?: number;
  restockFee?: number;
  items: RmaInspectionItemInput[];
}

export interface RmaPolicy {
  id: string;
  categoryId?: string;
  categoryName?: string;
  vendorId?: string;
  vendorName?: string;
  policyName: string;
  returnWindowDays: number;
  isReturnable: boolean;
  restockingFeePercentage: number;
  requiresApproval: boolean;
  allowRefund: boolean;
  allowReplacement: boolean;
  allowStoreCredit: boolean;
  termsConditions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RmaStatsSummary {
  totalRequests: number;
  pendingReview: number;
  inTransit: number;
  awaitingInspection: number;
  completedRefunded: number;
  rejected: number;
}
