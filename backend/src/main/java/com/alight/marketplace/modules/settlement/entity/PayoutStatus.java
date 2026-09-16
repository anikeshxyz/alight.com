package com.alight.marketplace.modules.settlement.entity;

public enum PayoutStatus {
    // Legacy mapping compatibility
    PENDING,
    APPROVED,
    PROCESSING,
    PAID,
    REJECTED,

    // Enterprise Payout Lifecycle Stages
    PAYOUT_REQUESTED,
    PAYOUT_VALIDATING,
    PAYOUT_PENDING_APPROVAL,
    PAYOUT_APPROVED,
    PAYOUT_PROCESSING,
    PAYOUT_BANK_SUBMITTED,
    PAYOUT_COMPLETED,
    PAYOUT_FAILED,
    PAYOUT_REJECTED,
    PAYOUT_CANCELLED,
    PAYOUT_REVERSED
}
