export type PaymentGatewayType = 'RAZORPAY' | 'STRIPE' | 'BANK_TRANSFER' | 'MOCK';
export type PaymentTransactionStatus = 'INITIATED' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED';
export type WalletTransactionType = 'ESCROW_HOLD' | 'ESCROW_RELEASE' | 'COMMISSION_DEDUCTION' | 'TCS_DEDUCTION' | 'PAYOUT_DEBIT' | 'REFUND_REVERSAL' | 'ADJUSTMENT';
export type PayoutStatus = 'PENDING' | 'APPROVED' | 'PROCESSING' | 'PAID' | 'REJECTED';

export interface PaymentTransaction {
  id: string;
  transactionReference: string;
  orderId: string;
  orderNumber: string;
  userId?: string;
  customerEmail: string;
  gatewayType: PaymentGatewayType;
  transactionStatus: PaymentTransactionStatus;
  amount: number;
  currencyCode: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  paymentMethod?: string;
  bankReferenceNumber?: string;
  receiptUrl?: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InitiatePaymentRequest {
  orderId: string;
  gatewayType: PaymentGatewayType;
  paymentMethod?: string;
}

export interface InitiatePaymentResponse {
  transactionId: string;
  transactionReference: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  currencyCode: string;
  gatewayType: PaymentGatewayType;
  gatewayOrderId?: string;
  clientSecret?: string;
  keyId?: string;
  virtualAccountNumber?: string;
  bankIfsc?: string;
  beneficiaryName?: string;
  bankName?: string;
  bankBranch?: string;
  additionalData?: Record<string, any>;
}

export interface VerifyPaymentRequest {
  transactionId: string;
  gatewayType: PaymentGatewayType;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  stripePaymentIntentId?: string;
  bankReferenceNumber?: string;
  receiptUrl?: string;
  notes?: string;
}

export interface VendorWallet {
  id: string;
  vendorId: string;
  vendorStoreName: string;
  pendingBalance: number;
  availableBalance: number;
  reservedBalance?: number;
  onHoldBalance?: number;
  recoveryDueBalance?: number;
  totalEarnings: number;
  totalWithdrawn: number;
  totalCommissionPaid: number;
  totalTcsPaid: number;
  currencyCode: string;
  bankAccountNumber?: string;
  bankAccountHolderName?: string;
  bankIfscCode?: string;
  bankName?: string;
  bankBranch?: string;
  isPayoutEnabled: boolean;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  vendorId: string;
  vendorOrderId?: string;
  subOrderNumber?: string;
  payoutId?: string;
  transactionType: WalletTransactionType;
  amount: number;
  debitAmount?: number;
  creditAmount?: number;
  currencyCode?: string;
  idempotencyKey?: string;
  balanceType: string;
  balanceAfter: number;
  description: string;
  referenceId?: string;
  createdAt: string;
}

export interface VendorPayout {
  id: string;
  payoutReference: string;
  vendorId: string;
  vendorStoreName: string;
  amount: number;
  currencyCode: string;
  status: PayoutStatus;
  providerType?: string;
  providerTransactionId?: string;
  bankAccountNumber: string;
  bankAccountHolderName: string;
  bankIfscCode: string;
  bankName: string;
  utrNumber?: string;
  adminNotes?: string;
  rejectionReason?: string;
  requestedAt: string;
  approvedAt?: string;
  processedAt?: string;
}

export interface BankDetailsPayload {
  bankAccountNumber: string;
  bankAccountHolderName: string;
  bankIfscCode: string;
  bankName: string;
  bankBranch?: string;
}

export interface PayoutRequestPayload {
  amount: number;
  notes?: string;
}

export interface SettlementOverview {
  totalPlatformEscrowHold: number;
  totalAvailableForPayout: number;
  totalReservedInPayouts?: number;
  totalRecoveryDue?: number;
  totalCommissionsCollected: number;
  totalTcsDeducted: number;
  totalPayoutsDisbursed: number;
  pendingPayoutRequestsCount: number;
  pendingEligibilityCount?: number;
  totalVendorsCount: number;
}

export interface DeliveredSettlement {
  vendorOrderId: string;
  subOrderNumber: string;
  masterOrderNumber: string;
  vendorId: string;
  vendorStoreName: string;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  tcsAmount: number;
  netSettlementAmount: number;
  isSettled?: boolean;
  settled?: boolean;
  deliveredAt: string;
  createdAt: string;
}

export type SettlementDomainStatus =
  | 'CREATED'
  | 'CALCULATED'
  | 'ELIGIBILITY_EVALUATION'
  | 'ELIGIBLE'
  | 'ON_HOLD'
  | 'APPROVED'
  | 'SETTLED'
  | 'REVERSED'
  | 'ADJUSTED'
  | 'DISPUTED';

export interface SettlementItem {
  id: string;
  orderItemId: string;
  productTitle: string;
  sku: string;
  quantity: number;
  grossAmount: number;
  commissionAmount: number;
  taxAmount: number;
  netAmount: number;
  status: string;
}

export interface SettlementRecord {
  id: string;
  settlementNumber: string;
  vendorId: string;
  vendorStoreName: string;
  masterOrderId?: string;
  masterOrderNumber: string;
  vendorOrderId: string;
  subOrderNumber: string;
  status: SettlementDomainStatus;
  holdReason?: string;
  grossAmount: number;
  shippingCredit: number;
  sellerCredits: number;
  platformCommission: number;
  logisticsDeduction: number;
  paymentFeeDeduction: number;
  marketplaceFee: number;
  taxWithholdingAmount: number;
  refundDeduction: number;
  adjustmentAmount: number;
  netPayableAmount: number;
  currencyCode: string;
  rateCardVersion?: string;
  taxRuleVersion?: string;
  eligibleAt?: string;
  approvedAt?: string;
  settledAt?: string;
  calculationSnapshot?: string;
  items: SettlementItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SettlementPolicy {
  id: string;
  policyName: string;
  scope: string;
  scopeId?: string;
  returnWindowDays: number;
  autoApprovalEnabled: boolean;
  holdDisputedOrders: boolean;
  coolingPeriodHours: number;
  isActive: boolean;
}

export interface SettlementRateCard {
  id: string;
  rateCardCode: string;
  name: string;
  categoryId?: string;
  categoryName?: string;
  vendorId?: string;
  vendorStoreName?: string;
  commissionRate: number;
  logisticsFeeFixed: number;
  paymentGatewayFeePercent: number;
  marketplaceFixedFee: number;
  version: string;
  isActive: boolean;
}

export interface VendorDebtRecovery {
  id: string;
  recoveryReference: string;
  vendorId: string;
  vendorStoreName: string;
  originalAmount: number;
  recoveredAmount: number;
  remainingAmount: number;
  status: string;
  notes?: string;
  createdAt: string;
}

export interface ReconciliationRecord {
  id: string;
  recordReference: string;
  reconciliationType: string;
  externalReference?: string;
  ledgerReference?: string;
  expectedAmount: number;
  actualAmount: number;
  differenceAmount: number;
  status: string;
  discrepancyReason?: string;
  reconciledAt: string;
  reconciledBy?: string;
}
