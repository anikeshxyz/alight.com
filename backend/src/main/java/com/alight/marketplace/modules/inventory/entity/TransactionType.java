package com.alight.marketplace.modules.inventory.entity;

public enum TransactionType {
    INBOUND_RECEIPT,
    OUTBOUND_SALE,
    ADJUSTMENT_ADD,
    ADJUSTMENT_SUBTRACT,
    DAMAGE_WRITE_OFF,
    TRANSFER_IN,
    TRANSFER_OUT,
    RESERVATION_HOLD,
    RESERVATION_RELEASE
}
