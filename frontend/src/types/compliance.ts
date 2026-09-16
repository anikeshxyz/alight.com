export interface CommissionInvoice {
  id: string;
  invoiceNumber: string;
  vendorId: string;
  vendorStoreName: string;
  periodMonth: number;
  periodYear: number;
  grossSales: number;
  commissionRate: number;
  commissionAmount: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalInvoiceAmount: number;
  sacCode: string;
  status: 'ISSUED' | 'PAID' | 'CANCELLED';
  invoiceUrl?: string;
  createdAt: string;
}

export interface TaxComplianceLedger {
  id: string;
  vendorId: string;
  vendorStoreName: string;
  financialYear: string;
  quarter: string;
  month: number;
  grossSalesAmount: number;
  returnsAmount: number;
  netTaxableSupplies: number;
  tcsRate: number;
  tcsAmount: number;
  tdsRate: number;
  tdsAmount: number;
  commissionAmount: number;
  commissionGst: number;
  netPayoutDisbursed: number;
  status: 'ESTIMATED' | 'RECONCILED' | 'FILED';
  vendorGstin?: string;
  vendorPan?: string;
  filedAt?: string;
  createdAt: string;
}

export interface Gstr8Summary {
  financialYear: string;
  quarter: string;
  vendorCount: number;
  totalGrossSupplies: number;
  totalReturnedSupplies: number;
  totalNetTaxableSupplies: number;
  totalTcsCollected: number;
  totalTdsDeducted: number;
  vendorLedgers: TaxComplianceLedger[];
}

export interface PayoutBatch {
  id: string;
  batchReference: string;
  totalAmount: number;
  currencyCode: string;
  payoutCount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'PARTIALLY_FAILED';
  bankBatchId?: string;
  processedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface AutoSettlementResult {
  ordersProcessed: number;
  ordersSettled: number;
  totalAmountReleased: number;
  totalCommissionDeducted: number;
  totalTcsDeducted: number;
  settledOrderNumbers: string[];
  message: string;
}

export interface CreatePayoutBatchPayload {
  payoutIds: string[];
  notes?: string;
}
