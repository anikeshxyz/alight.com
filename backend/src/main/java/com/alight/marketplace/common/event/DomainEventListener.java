package com.alight.marketplace.common.event;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class DomainEventListener {

    @Async("alightTaskExecutor")
    @EventListener
    public void handleOrderCreated(OrderCreatedEvent event) {
        log.info("[DomainEvent] OrderCreatedEvent received: Order #{}, customer={}, grandTotal={}",
                event.getOrderNumber(), event.getCustomerEmail(), event.getGrandTotal());
    }

    @Async("alightTaskExecutor")
    @EventListener
    public void handlePaymentSucceeded(PaymentSucceededEvent event) {
        log.info("[DomainEvent] PaymentSucceededEvent received: OrderId={}, txId={}, amount={}",
                event.getOrderId(), event.getTransactionId(), event.getAmount());
    }

    @Async("alightTaskExecutor")
    @EventListener
    public void handleOrderStatusUpdated(OrderStatusUpdatedEvent event) {
        log.info("[DomainEvent] OrderStatusUpdatedEvent received: Order #{}, status change: {} -> {}",
                event.getOrderNumber(), event.getOldStatus(), event.getNewStatus());
    }

    @Async("alightTaskExecutor")
    @EventListener
    public void handleVendorStatusChanged(VendorStatusChangedEvent event) {
        log.info("[DomainEvent] VendorStatusChangedEvent received: Vendor '{}' ({}), status change: {} -> {}",
                event.getStoreName(), event.getVendorId(), event.getOldStatus(), event.getNewStatus());
    }

    @Async("alightTaskExecutor")
    @EventListener
    public void handleStockReserved(StockReservedEvent event) {
        log.info("[DomainEvent] StockReservedEvent received: ReservationId={}, productId={}, qty={}, expiresAt={}",
                event.getReservationId(), event.getProductId(), event.getQuantity(), event.getExpiresAt());
    }
}
