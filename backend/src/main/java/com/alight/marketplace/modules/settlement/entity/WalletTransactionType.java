package com.alight.marketplace.modules.settlement.entity;

public enum WalletTransactionType {
    // Escrow Lifecycle
    ESCROW_HOLD,
    ESCROW_RELEASE,
    ESCROW_REVERSAL,

    // Core Sales & Fee Deductions
    SALE_CREDIT,
    COMMISSION_DEDUCTION,
    LOGISTICS_DEDUCTION,
    PAYMENT_PROCESSING_FEE,
    MARKETPLACE_FEE,

    // Statutory Withholding
    TCS_DEDUCTION,
    TAX_WITHHOLDING,

    // Returns, Refunds & Adjustments
    REFUND,
    REFUND_REVERSAL,
    RETURN_ADJUSTMENT,
    PENALTY,
    SELLER_CREDIT,
    SELLER_DEBIT,
    MANUAL_ADJUSTMENT,
    ADJUSTMENT,

    // Payouts
    PAYOUT_DEBIT,
    PAYOUT,
    PAYOUT_REVERSAL,

    // Disputes & Debt Recovery
    CHARGEBACK,
    CHARGEBACK_REVERSAL,
    RECONCILIATION_ADJUSTMENT,
    DEBT_RECOVERY
}
