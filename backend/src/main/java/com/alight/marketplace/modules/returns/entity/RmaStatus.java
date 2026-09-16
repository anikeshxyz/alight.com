package com.alight.marketplace.modules.returns.entity;

public enum RmaStatus {
    REQUESTED,
    APPROVED,
    REJECTED,
    PICKUP_SCHEDULED,
    IN_REVERSE_TRANSIT,
    RECEIVED_AT_WAREHOUSE,
    INSPECTED_PASS,
    INSPECTED_FAIL,
    REFUND_PROCESSED,
    REPLACEMENT_DISPATCHED,
    CANCELLED,
    CLOSED
}
