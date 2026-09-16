package com.alight.marketplace.modules.payment.service.impl;

import com.alight.marketplace.common.event.PaymentSucceededEvent;
import com.alight.marketplace.common.exception.BadRequestException;
import com.alight.marketplace.modules.order.entity.Order;
import com.alight.marketplace.modules.order.entity.OrderStatus;
import com.alight.marketplace.modules.order.entity.PaymentStatus;
import com.alight.marketplace.modules.order.entity.VendorOrder;
import com.alight.marketplace.modules.order.repository.OrderRepository;
import com.alight.marketplace.modules.payment.dto.WebhookProcessResult;
import com.alight.marketplace.modules.payment.entity.PaymentGatewayType;
import com.alight.marketplace.modules.payment.entity.PaymentTransaction;
import com.alight.marketplace.modules.payment.entity.PaymentTransactionStatus;
import com.alight.marketplace.modules.payment.entity.PaymentWebhookLog;
import com.alight.marketplace.modules.payment.repository.PaymentTransactionRepository;
import com.alight.marketplace.modules.payment.repository.PaymentWebhookLogRepository;
import com.alight.marketplace.modules.payment.service.PaymentWebhookService;
import com.alight.marketplace.modules.settlement.service.SettlementService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentWebhookServiceImpl implements PaymentWebhookService {

    private final PaymentWebhookLogRepository webhookLogRepository;
    private final PaymentTransactionRepository transactionRepository;
    private final OrderRepository orderRepository;
    private final SettlementService settlementService;
    private final ApplicationEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public WebhookProcessResult processRazorpayWebhook(String payload, String signature, String ipAddress) {
        try {
            JsonNode root = objectMapper.readTree(payload);
            String eventType = root.path("event").asText("payment.captured");
            String eventId = root.path("id").asText(root.path("event_id").asText("RZP-EVT-" + UUID.randomUUID()));

            // Extract payment/order entity details
            JsonNode paymentEntity = root.path("payload").path("payment").path("entity");
            String gatewayOrderId = paymentEntity.path("order_id").asText(null);
            String gatewayPaymentId = paymentEntity.path("id").asText(null);

            return processParsedWebhook(PaymentGatewayType.RAZORPAY, eventId, eventType, payload, signature, ipAddress, gatewayOrderId, gatewayPaymentId);
        } catch (Exception e) {
            log.error("Failed to parse Razorpay webhook payload: {}", e.getMessage(), e);
            throw new BadRequestException("Invalid webhook payload format: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public WebhookProcessResult processStripeWebhook(String payload, String signature, String ipAddress) {
        try {
            JsonNode root = objectMapper.readTree(payload);
            String eventType = root.path("type").asText("payment_intent.succeeded");
            String eventId = root.path("id").asText("STRIPE-EVT-" + UUID.randomUUID());

            JsonNode dataObject = root.path("data").path("object");
            String gatewayOrderId = dataObject.path("id").asText(null);
            String gatewayPaymentId = dataObject.path("payment_intent").asText(dataObject.path("id").asText(null));

            return processParsedWebhook(PaymentGatewayType.STRIPE, eventId, eventType, payload, signature, ipAddress, gatewayOrderId, gatewayPaymentId);
        } catch (Exception e) {
            log.error("Failed to parse Stripe webhook payload: {}", e.getMessage(), e);
            throw new BadRequestException("Invalid Stripe webhook payload: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public WebhookProcessResult processGenericWebhook(PaymentGatewayType gatewayType, String eventId, String eventType, String payload, String signature, String ipAddress) {
        try {
            JsonNode root = objectMapper.readTree(payload);
            String gatewayOrderId = root.path("gatewayOrderId").asText(root.path("orderId").asText(null));
            String gatewayPaymentId = root.path("gatewayPaymentId").asText(root.path("paymentId").asText(null));

            return processParsedWebhook(gatewayType, eventId, eventType, payload, signature, ipAddress, gatewayOrderId, gatewayPaymentId);
        } catch (Exception e) {
            log.error("Failed to parse generic webhook payload: {}", e.getMessage(), e);
            throw new BadRequestException("Invalid generic webhook payload: " + e.getMessage());
        }
    }

    private WebhookProcessResult processParsedWebhook(PaymentGatewayType gatewayType, String eventId, String eventType,
                                                      String payload, String signature, String ipAddress,
                                                      String gatewayOrderId, String gatewayPaymentId) {
        // 1. Check idempotency
        if (webhookLogRepository.existsByEventId(eventId)) {
            log.info("Webhook event {} already processed (idempotency key matched). Skipping.", eventId);
            return WebhookProcessResult.builder()
                    .processed(true)
                    .duplicate(true)
                    .eventId(eventId)
                    .eventType(eventType)
                    .message("Event already processed")
                    .build();
        }

        // 2. Find matching transaction
        PaymentTransaction tx = null;
        if (gatewayOrderId != null && !gatewayOrderId.isBlank()) {
            tx = transactionRepository.findByGatewayOrderId(gatewayOrderId).orElse(null);
        }
        if (tx == null && gatewayPaymentId != null && !gatewayPaymentId.isBlank()) {
            tx = transactionRepository.findByGatewayPaymentId(gatewayPaymentId).orElse(null);
        }

        // 3. Log webhook in database
        PaymentWebhookLog webhookLog = PaymentWebhookLog.builder()
                .eventId(eventId)
                .gatewayType(gatewayType)
                .eventType(eventType)
                .payload(payload)
                .signature(signature)
                .ipAddress(ipAddress)
                .processedStatus("PROCESSED")
                .retryCount(0)
                .build();

        UUID txId = null;
        UUID ordId = null;

        if (tx != null) {
            txId = tx.getId();
            Order order = tx.getOrder();
            if (order != null) {
                ordId = order.getId();
            }

            if (isSuccessEvent(eventType)) {
                if (tx.getTransactionStatus() != PaymentTransactionStatus.CAPTURED) {
                    tx.setTransactionStatus(PaymentTransactionStatus.CAPTURED);
                    if (gatewayPaymentId != null && !gatewayPaymentId.isBlank()) {
                        tx.setGatewayPaymentId(gatewayPaymentId);
                    }
                    transactionRepository.save(tx);

                    if (order != null) {
                        order.setPaymentStatus(PaymentStatus.PAID);
                        order.setOrderStatus(OrderStatus.CONFIRMED);
                        orderRepository.save(order);

                        // Place in escrow
                        if (order.getVendorOrders() != null) {
                            for (VendorOrder vo : order.getVendorOrders()) {
                                settlementService.holdInEscrow(vo);
                            }
                        }

                        // Publish PaymentSucceededEvent
                        try {
                            eventPublisher.publishEvent(PaymentSucceededEvent.builder()
                                    .orderId(order.getId())
                                    .transactionId(tx.getTransactionReference())
                                    .amount(tx.getAmount())
                                    .paymentMethod(tx.getPaymentMethod() != null ? tx.getPaymentMethod() : gatewayType.name())
                                    .timestamp(Instant.now())
                                    .build());
                        } catch (Exception e) {
                            log.warn("Error publishing PaymentSucceededEvent: {}", e.getMessage());
                        }
                    }
                }
            } else if (isFailureEvent(eventType)) {
                tx.setTransactionStatus(PaymentTransactionStatus.FAILED);
                tx.setErrorMessage("Webhook reported failure: " + eventType);
                transactionRepository.save(tx);
            }
        }

        webhookLogRepository.save(webhookLog);

        return WebhookProcessResult.builder()
                .processed(true)
                .duplicate(false)
                .eventId(eventId)
                .eventType(eventType)
                .transactionId(txId)
                .orderId(ordId)
                .message("Webhook processed successfully")
                .build();
    }

    private boolean isSuccessEvent(String eventType) {
        if (eventType == null) return false;
        String lower = eventType.toLowerCase();
        return lower.contains("captured") || lower.contains("succeeded") || lower.contains("paid") || lower.contains("success");
    }

    private boolean isFailureEvent(String eventType) {
        if (eventType == null) return false;
        String lower = eventType.toLowerCase();
        return lower.contains("failed") || lower.contains("cancelled") || lower.contains("declined");
    }
}
