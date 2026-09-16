package com.alight.marketplace.modules.payment.service.impl;

import com.alight.marketplace.common.exception.BadRequestException;
import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.order.entity.Order;
import com.alight.marketplace.modules.order.entity.OrderStatus;
import com.alight.marketplace.modules.order.entity.PaymentStatus;
import com.alight.marketplace.modules.order.entity.VendorOrder;
import com.alight.marketplace.modules.order.repository.OrderRepository;
import com.alight.marketplace.modules.payment.dto.*;
import com.alight.marketplace.modules.payment.entity.PaymentGatewayType;
import com.alight.marketplace.modules.payment.entity.PaymentTransaction;
import com.alight.marketplace.modules.payment.entity.PaymentTransactionStatus;
import com.alight.marketplace.modules.payment.gateway.PaymentGatewayAdapter;
import com.alight.marketplace.modules.payment.gateway.PaymentGatewayFactory;
import com.alight.marketplace.modules.payment.repository.PaymentTransactionRepository;
import com.alight.marketplace.modules.payment.service.PaymentService;
import com.alight.marketplace.modules.settlement.service.SettlementService;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements PaymentService {

    private final PaymentTransactionRepository transactionRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final PaymentGatewayFactory gatewayFactory;
    private final SettlementService settlementService;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public InitiatePaymentResponse initiatePayment(InitiatePaymentRequest request, String currentUserEmail) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + request.getOrderId()));

        User user = null;
        if (currentUserEmail != null) {
            user = userRepository.findByEmail(currentUserEmail).orElse(null);
        }

        String txnRef = "TXN-" + Year.now().getValue() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        PaymentTransaction tx = PaymentTransaction.builder()
                .transactionReference(txnRef)
                .order(order)
                .user(user != null ? user : order.getUser())
                .gatewayType(request.getGatewayType())
                .transactionStatus(PaymentTransactionStatus.INITIATED)
                .amount(order.getGrandTotal())
                .currencyCode(order.getCurrencyCode() != null ? order.getCurrencyCode() : "INR")
                .paymentMethod(request.getPaymentMethod())
                .build();

        PaymentTransaction savedTx = transactionRepository.save(tx);

        PaymentGatewayAdapter adapter = gatewayFactory.getAdapter(request.getGatewayType());
        InitiatePaymentResponse response = adapter.createOrder(savedTx, order);

        // Update with gateway order ID
        savedTx.setGatewayOrderId(response.getGatewayOrderId());
        transactionRepository.save(savedTx);

        // Update payment method on order
        order.setPaymentMethod(request.getGatewayType().name());
        orderRepository.save(order);

        log.info("Initiated payment {} with gateway {} for order {}", txnRef, request.getGatewayType(), order.getOrderNumber());
        return response;
    }

    @Override
    @Transactional
    public PaymentTransactionDto verifyPayment(VerifyPaymentRequest request, String currentUserEmail) {
        PaymentTransaction tx = transactionRepository.findById(request.getTransactionId())
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + request.getTransactionId()));

        PaymentGatewayAdapter adapter = gatewayFactory.getAdapter(request.getGatewayType());
        boolean isValid = adapter.verifyPayment(tx, request);

        Order order = tx.getOrder();

        if (!isValid) {
            tx.setTransactionStatus(PaymentTransactionStatus.FAILED);
            tx.setErrorMessage("Payment verification failed at gateway signature check");
            transactionRepository.save(tx);
            throw new BadRequestException("Payment signature verification failed");
        }

        if (request.getGatewayType() == PaymentGatewayType.BANK_TRANSFER) {
            tx.setTransactionStatus(PaymentTransactionStatus.AUTHORIZED);
            tx.setBankReferenceNumber(request.getBankReferenceNumber());
            tx.setReceiptUrl(request.getReceiptUrl());
            tx.setErrorMessage(request.getNotes());
            transactionRepository.save(tx);

            order.setPaymentStatus(PaymentStatus.PENDING);
            orderRepository.save(order);

            log.info("Bank transfer payment reference {} submitted for order {}", request.getBankReferenceNumber(), order.getOrderNumber());
        } else {
            // Online gateways: Razorpay, Stripe, Mock
            tx.setTransactionStatus(PaymentTransactionStatus.CAPTURED);
            transactionRepository.save(tx);

            order.setPaymentStatus(PaymentStatus.PAID);
            order.setOrderStatus(OrderStatus.CONFIRMED);
            orderRepository.save(order);

            // Hold funds in escrow for each vendor sub-order
            if (order.getVendorOrders() != null) {
                for (VendorOrder vendorOrder : order.getVendorOrders()) {
                    settlementService.holdInEscrow(vendorOrder);
                }
            }

            try {
                eventPublisher.publishEvent(com.alight.marketplace.common.event.PaymentSucceededEvent.builder()
                        .orderId(order.getId())
                        .transactionId(tx.getTransactionReference())
                        .amount(tx.getAmount())
                        .paymentMethod(tx.getPaymentMethod() != null ? tx.getPaymentMethod() : tx.getGatewayType().name())
                        .timestamp(java.time.Instant.now())
                        .build());
            } catch (Exception e) {
                log.warn("Error publishing PaymentSucceededEvent for transaction {}: {}", tx.getTransactionReference(), e.getMessage());
            }

            log.info("Captured payment {} for order {}. Funds placed in vendor escrow.", tx.getTransactionReference(), order.getOrderNumber());
        }

        return mapToDto(tx);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentTransactionDto> getTransactionsForOrder(UUID orderId) {
        return transactionRepository.findByOrderIdOrderByCreatedAtDesc(orderId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PaymentTransactionDto> getAdminTransactions(Pageable pageable) {
        return transactionRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PaymentTransactionDto> getCustomerPayments(String currentUserEmail, Pageable pageable) {
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUserEmail));
        return transactionRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(this::mapToDto);
    }

    @Override
    @Transactional
    public PaymentTransactionDto approveBankTransferPayment(UUID transactionId, String adminNotes) {
        PaymentTransaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + transactionId));

        if (tx.getGatewayType() != PaymentGatewayType.BANK_TRANSFER) {
            throw new BadRequestException("Only offline bank transfers require manual clearance approval");
        }

        tx.setTransactionStatus(PaymentTransactionStatus.CAPTURED);
        transactionRepository.save(tx);

        Order order = tx.getOrder();
        order.setPaymentStatus(PaymentStatus.PAID);
        order.setOrderStatus(OrderStatus.CONFIRMED);
        if (adminNotes != null) {
            order.setNotes((order.getNotes() != null ? order.getNotes() + " | " : "") + "Bank Approval: " + adminNotes);
        }
        orderRepository.save(order);

        // Hold funds in escrow
        if (order.getVendorOrders() != null) {
            for (VendorOrder vendorOrder : order.getVendorOrders()) {
                settlementService.holdInEscrow(vendorOrder);
            }
        }

        try {
            eventPublisher.publishEvent(com.alight.marketplace.common.event.PaymentSucceededEvent.builder()
                    .orderId(order.getId())
                    .transactionId(tx.getTransactionReference())
                    .amount(tx.getAmount())
                    .paymentMethod("BANK_TRANSFER")
                    .timestamp(java.time.Instant.now())
                    .build());
        } catch (Exception e) {
            log.warn("Error publishing PaymentSucceededEvent for bank approval {}: {}", tx.getTransactionReference(), e.getMessage());
        }

        log.info("Admin approved bank transfer for transaction {} and order {}", tx.getTransactionReference(), order.getOrderNumber());
        return mapToDto(tx);
    }

    @Override
    @Transactional
    public PaymentTransactionDto processRefund(RefundRequestDto request) {
        PaymentTransaction tx = transactionRepository.findById(request.getTransactionId())
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + request.getTransactionId()));

        if (tx.getTransactionStatus() != PaymentTransactionStatus.CAPTURED) {
            throw new BadRequestException("Only captured transactions can be refunded");
        }

        PaymentGatewayAdapter adapter = gatewayFactory.getAdapter(tx.getGatewayType());
        boolean success = adapter.processRefund(tx, request.getAmount(), request.getReason());

        if (!success) {
            throw new BadRequestException("Gateway refund request failed");
        }

        tx.setTransactionStatus(PaymentTransactionStatus.REFUNDED);
        tx.setErrorMessage("Refunded: " + request.getReason());
        PaymentTransaction saved = transactionRepository.save(tx);

        Order order = tx.getOrder();
        order.setPaymentStatus(PaymentStatus.REFUNDED);
        order.setOrderStatus(OrderStatus.REFUNDED);
        orderRepository.save(order);

        // Reverse escrow for all vendor sub-orders
        if (order.getVendorOrders() != null) {
            for (VendorOrder vendorOrder : order.getVendorOrders()) {
                settlementService.refundEscrow(vendorOrder, vendorOrder.getGrandTotal());
            }
        }

        log.info("Processed refund for transaction {} and order {}", tx.getTransactionReference(), order.getOrderNumber());
        return mapToDto(saved);
    }

    private PaymentTransactionDto mapToDto(PaymentTransaction tx) {
        return PaymentTransactionDto.builder()
                .id(tx.getId())
                .transactionReference(tx.getTransactionReference())
                .orderId(tx.getOrder().getId())
                .orderNumber(tx.getOrder().getOrderNumber())
                .userId(tx.getUser() != null ? tx.getUser().getId() : null)
                .customerEmail(tx.getUser() != null ? tx.getUser().getEmail() : tx.getOrder().getCustomerEmail())
                .gatewayType(tx.getGatewayType())
                .transactionStatus(tx.getTransactionStatus())
                .amount(tx.getAmount())
                .currencyCode(tx.getCurrencyCode())
                .gatewayOrderId(tx.getGatewayOrderId())
                .gatewayPaymentId(tx.getGatewayPaymentId())
                .paymentMethod(tx.getPaymentMethod())
                .bankReferenceNumber(tx.getBankReferenceNumber())
                .receiptUrl(tx.getReceiptUrl())
                .errorCode(tx.getErrorCode())
                .errorMessage(tx.getErrorMessage())
                .createdAt(tx.getCreatedAt())
                .updatedAt(tx.getUpdatedAt())
                .build();
    }
}
